import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Ajv } from 'ajv';

export const MAX_WORD_LENGTH = 12;

type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type Pos = 'noun' | 'verb' | 'adj';

export interface Word {
  id: string;
  lemma_nl: string;
  pos: Pos;
  cefr: Cefr;
  source: 'nt2lex' | 'own';
}
export interface Annotation {
  word_id: string;
  text_tr: string;
  article: 'de' | 'het' | null;
  category_id: string;
  reviewed: boolean;
}
export interface Category {
  id: string;
  title_tr: string;
  cefr: Cefr;
  order: number;
}
export interface Manifest {
  content_version: number;
  min_app_version: { ios: string; android: string };
  files: { path: string; sha256: string }[];
}
export interface Content {
  words: Word[];
  annotations: Annotation[];
  categories: Category[];
  manifest: Manifest;
}

const ROOT = join(import.meta.dirname, '..');
const SCHEMAS = ['words', 'annotations', 'categories', 'manifest'] as const;

/** Stable word id: part of speech + lower-cased lemma. Never change this rule (ADR-002). */
export function wordId(pos: Pos, lemma: string): string {
  return `${pos}-${lemma.normalize('NFC').toLowerCase()}`;
}

export function validateContent(content: Content): string[] {
  const ajv = new Ajv({ allErrors: true });
  const errors: string[] = [];
  for (const name of SCHEMAS) {
    const schema = JSON.parse(readFileSync(join(ROOT, 'schema', `${name}.schema.json`), 'utf8'));
    if (!ajv.validate(schema, content[name])) {
      for (const e of ajv.errors ?? []) errors.push(`${name}: ${e.instancePath} ${e.message}`);
    }
  }
  if (errors.length) return errors;

  const categories = new Set(content.categories.map((c) => c.id));
  const annotations = new Map(content.annotations.map((a) => [a.word_id, a]));
  const seen = new Set<string>();
  for (const word of content.words) {
    const expected = wordId(word.pos, word.lemma_nl);
    if (seen.has(word.id)) errors.push(`${word.id}: duplicate word id`);
    seen.add(word.id);
    if (word.id !== expected) {
      errors.push(`${word.id}: id does not match lemma "${word.lemma_nl}" (expected ${expected})`);
    }
    if (Array.from(word.lemma_nl).length > MAX_WORD_LENGTH) {
      errors.push(`${word.id}: longer than ${MAX_WORD_LENGTH} letters`);
    }
    const note = annotations.get(word.id);
    if (!note || !note.text_tr.trim()) {
      errors.push(`${word.id}: missing Turkish translation`);
      continue;
    }
    if (word.pos === 'noun' && !note.article) errors.push(`${word.id}: noun without de/het article`);
    if (word.pos !== 'noun' && note.article) errors.push(`${word.id}: article on a ${word.pos}`);
    if (!categories.has(note.category_id)) {
      errors.push(`${word.id}: unknown category "${note.category_id}"`);
    }
  }
  for (const note of content.annotations) {
    if (!seen.has(note.word_id)) errors.push(`${note.word_id}: annotation for an unknown word`);
  }
  return errors;
}

export function loadContent(root = ROOT): Content {
  const read = (file: string) => JSON.parse(readFileSync(join(root, file), 'utf8'));
  return {
    words: read('data/words.json'),
    annotations: read('data/annotations.json'),
    categories: read('data/categories.json'),
    manifest: read('manifest.json'),
  };
}
