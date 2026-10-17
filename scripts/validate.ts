import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Ajv } from 'ajv';

export const MAX_WORD_LENGTH = 12;

type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type Pos = 'noun' | 'verb' | 'adj';
/** Who accepted `reviewed` (ADR-012). */
export type ReviewSource = 'roundtrip' | 'owner' | 'reviewer';

/** A `reviewed` entry needs a `review_source`, and a source needs `reviewed`. */
function sourceIssue(e: { reviewed: boolean; review_source?: ReviewSource }): string | null {
  if (e.reviewed && !e.review_source) return 'reviewed without review_source';
  if (!e.reviewed && e.review_source) return 'review_source without reviewed';
  return null;
}

/**
 * Checks if text is normalised to NFC, has no leading or trailing whitespace,
 * no double spaces, and only U+0020 as whitespace. Returns the first issue found,
 * or null if the text is normalised.
 */
export function normalisationIssue(text: string): string | null {
  if (text !== text.normalize('NFC')) return 'not NFC';
  if (/^\s/.test(text)) return 'leading space';
  if (/\s$/.test(text)) return 'trailing space';
  if (/\s\s/.test(text)) return 'double space';
  if (/[^\S ]/.test(text)) return 'whitespace other than U+0020';
  return null;
}

export interface Word {
  id: string;
  lemma_nl: string;
  pos: Pos;
  cefr: Cefr;
  source: 'nt2lex' | 'own';
}
/** Language-neutral facts about the Dutch word; `reviewed` covers the article and category (ADR-009). */
export interface Annotation {
  word_id: string;
  /** @deprecated copy of `translations.tr`, kept until the app reads the translation files (T-034). */
  text_tr?: string;
  article: 'de' | 'het' | null;
  category_id: string;
  reviewed: boolean;
  /** Who accepted `reviewed` (ADR-012). */
  review_source?: ReviewSource;
}
export interface Category {
  id: string;
  /** @deprecated copy of `translations.tr`, kept until the app reads the translation files (T-034). */
  title_tr?: string;
  cefr: Cefr;
  order: number;
}
/** One learner language: `data/translations/<lang>.json` (ADR-011, shape (a)). */
export interface TranslationFile {
  lang: string;
  words: { word_id: string; text: string; reviewed: boolean; review_source?: ReviewSource }[];
  categories: { category_id: string; title: string }[];
}
export interface Manifest {
  content_version: number;
  min_app_version: { ios: string; android: string };
  /** Prompt languages in this release, Turkish first; absent in manifests from before T-031 (Turkish only). */
  languages?: string[];
  files: { path: string; sha256: string }[];
}
export interface Content {
  words: Word[];
  annotations: Annotation[];
  categories: Category[];
  /** Keyed by the file name's language code; Turkish is required. */
  translations: { tr: TranslationFile } & Partial<Record<string, TranslationFile>>;
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
  const schemaOf = (name: string) => JSON.parse(readFileSync(join(ROOT, 'schema', `${name}.schema.json`), 'utf8'));
  for (const name of SCHEMAS) {
    if (!ajv.validate(schemaOf(name), content[name])) {
      for (const e of ajv.errors ?? []) errors.push(`${name}: ${e.instancePath} ${e.message}`);
    }
  }
  const translationSchema = schemaOf('translations');
  for (const [lang, file] of Object.entries(content.translations)) {
    if (file && !ajv.validate(translationSchema, file)) {
      for (const e of ajv.errors ?? []) errors.push(`translations/${lang}: ${e.instancePath} ${e.message}`);
    }
  }
  if (!content.translations.tr) errors.push('translations: data/translations/tr.json is missing');
  if (errors.length) return errors;

  const categories = new Set(content.categories.map((c) => c.id));
  const annotations = new Map(content.annotations.map((a) => [a.word_id, a]));
  const turkish = new Map(content.translations.tr.words.map((t) => [t.word_id, t]));
  const seen = new Set<string>();
  for (const word of content.words) {
    const expected = wordId(word.pos, word.lemma_nl);
    if (seen.has(word.id)) errors.push(`${word.id}: duplicate word id`);
    seen.add(word.id);
    if (word.id !== expected) {
      errors.push(`${word.id}: id does not match lemma "${word.lemma_nl}" (expected ${expected})`);
    }
    const issue = normalisationIssue(word.lemma_nl);
    if (issue) errors.push(`${word.id}: lemma_nl is not normalised (${issue})`);
    if (Array.from(word.lemma_nl).length > MAX_WORD_LENGTH) {
      errors.push(`${word.id}: longer than ${MAX_WORD_LENGTH} letters`);
    }
    if (!turkish.get(word.id)?.text.trim()) errors.push(`${word.id}: missing Turkish translation`);
    const note = annotations.get(word.id);
    if (!note) {
      errors.push(`${word.id}: missing annotation`);
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
    const issue = sourceIssue(note);
    if (issue) errors.push(`${note.word_id}: ${issue}`);
    if (note.text_tr !== undefined && note.text_tr !== turkish.get(note.word_id)?.text) {
      errors.push(`${note.word_id}: deprecated text_tr differs from data/translations/tr.json`);
    }
  }
  const titles = new Map(content.translations.tr.categories.map((c) => [c.category_id, c.title]));
  for (const category of content.categories) {
    if (!titles.get(category.id)?.trim()) errors.push(`${category.id}: missing Turkish category title`);
    if (category.title_tr !== undefined && category.title_tr !== titles.get(category.id)) {
      errors.push(`${category.id}: deprecated title_tr differs from data/translations/tr.json`);
    }
  }
  for (const [lang, file] of Object.entries(content.translations)) {
    if (file) errors.push(...validateTranslationFile(lang, file, seen, categories));
  }
  return errors;
}

/** Checks one language file against the word list; a language other than Turkish may be incomplete. */
function validateTranslationFile(
  lang: string,
  file: TranslationFile,
  wordIds: Set<string>,
  categoryIds: Set<string>,
): string[] {
  const errors: string[] = [];
  const at = `translations/${lang}`;
  if (file.lang !== lang) errors.push(`${at}: lang "${file.lang}" does not match the file name`);
  const entries = [
    ...file.words.map((t) => ({ id: t.word_id, text: t.text, known: wordIds, kind: 'word id', field: 'text' })),
    ...file.categories.map((c) => ({ id: c.category_id, text: c.title, known: categoryIds, kind: 'category id', field: 'title' })),
  ];
  const seen = new Set<string>();
  for (const { id, text, known, kind, field } of entries) {
    const key = `${kind}:${id}`;
    if (!known.has(id)) errors.push(`${at}: ${id}: unknown ${kind}`);
    else if (seen.has(key)) errors.push(`${at}: ${id}: duplicate ${kind}`);
    if (!text.trim()) {
      errors.push(`${at}: ${id}: empty ${field}`);
    } else {
      const issue = normalisationIssue(text);
      if (issue) errors.push(`${at}: ${id}: ${field} is not normalised (${issue})`);
    }
    seen.add(key);
  }

  for (const t of file.words) {
    const issue = sourceIssue(t);
    if (issue) errors.push(`${at}: ${t.word_id}: ${issue}`);
  }

  // Check for case-only pairs in word texts
  const byLowerCase = new Map<string, { id: string; text: string }[]>();
  for (const word of file.words) {
    if (word.text.trim()) {
      const key = word.text.trim().toLocaleLowerCase(lang);
      if (!byLowerCase.has(key)) byLowerCase.set(key, []);
      byLowerCase.get(key)!.push({ id: word.word_id, text: word.text.trim() });
    }
  }
  for (const group of byLowerCase.values()) {
    const distinctTexts = new Set(group.map((t) => t.text));
    if (distinctTexts.size > 1) {
      const ids = group.map((t) => t.id);
      const texts = group.map((t) => JSON.stringify(t.text));
      errors.push(`${at}: ${ids.join(', ')}: texts differ only in case (${texts.join(', ')})`);
    }
  }

  return errors;
}

/**
 * Coverage per language and level (reviewed / total words) and, as warnings, Dutch words that share
 * one prompt text in a language — the level builder keeps those apart (US-002, US-025).
 */
export function translationReport(content: Content): string[] {
  const lines: string[] = [];
  const levels = [...new Set(content.words.map((w) => w.cefr))].sort();
  for (const [lang, file] of Object.entries(content.translations)) {
    if (!file) continue;
    const byId = new Map(file.words.filter((t) => t.text.trim()).map((t) => [t.word_id, t]));
    for (const level of levels) {
      const words = content.words.filter((w) => w.cefr === level);
      const translated = words.filter((w) => byId.has(w.id));
      const reviewed = translated.filter((w) => byId.get(w.id)?.reviewed).length;
      const roundtrip = translated.filter((w) => byId.get(w.id)?.review_source === 'roundtrip').length;
      lines.push(`${lang} ${level}: ${translated.length} translated, ${reviewed} reviewed (${roundtrip} by round trip) / ${words.length} words`);
    }
    const byText = new Map<string, string[]>();
    for (const t of byId.values()) {
      const key = t.text.trim().toLocaleLowerCase(lang);
      byText.set(key, [...(byText.get(key) ?? []), t.word_id]);
    }
    for (const [text, ids] of byText) if (ids.length > 1) lines.push(`⚠ ${lang}: "${text}" is shared by ${ids.join(', ')}`);
  }
  return lines;
}

/**
 * Copies the Turkish text and title back into `text_tr` / `title_tr` in the pre-T-029 key order, so
 * `data/*.json` and release files stay readable by app builds from before T-034.
 */
export function withLegacyTurkish(content: Content): Content {
  const texts = new Map(content.translations.tr.words.map((t) => [t.word_id, t.text]));
  const titles = new Map(content.translations.tr.categories.map((c) => [c.category_id, c.title]));
  return {
    ...content,
    annotations: content.annotations.map(({ word_id, article, category_id, reviewed, review_source }) =>
      ({ word_id, text_tr: texts.get(word_id) ?? '', article, category_id, reviewed, ...(review_source && { review_source }) })),
    categories: content.categories.map(({ id, cefr, order }) => ({ id, title_tr: titles.get(id) ?? '', cefr, order })),
  };
}

export function loadContent(root = ROOT): Content {
  const read = (file: string) => JSON.parse(readFileSync(join(root, file), 'utf8'));
  const langs = readdirSync(join(root, 'data', 'translations')).filter((f) => f.endsWith('.json'));
  return {
    words: read('data/words.json'),
    annotations: read('data/annotations.json'),
    categories: read('data/categories.json'),
    translations: Object.fromEntries(
      langs.map((file) => [file.replace(/\.json$/, ''), read(`data/translations/${file}`)]),
    ) as Content['translations'],
    manifest: read('manifest.json'),
  };
}
