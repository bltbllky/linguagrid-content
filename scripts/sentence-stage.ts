import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Ajv } from 'ajv';

import { checkSentence, lemmaPos, makeLevelOf } from './sentence-check.ts';
import type { CheckEnv, SentenceRow } from './sentence-check.ts';
import { normalisationIssue, sourceIssue } from './validate.ts';
import type { Pos, ReviewSource } from './validate.ts';

const ROOT = join(import.meta.dirname, '..');

/** The first sentence release holds A1 and A2 words only (ADR-026 rule 1). */
export const SENTENCE_LEVELS: readonly string[] = ['A1', 'A2'];
export const DISTRACTORS = 3;
/** The languages every sentence ships in (ADR-026): a Dutch row counts as reviewed only when all of them are. */
export const SENTENCE_LANGS: readonly string[] = ['tr', 'en'];

export interface SentenceFileRow extends SentenceRow {
  reviewed: boolean;
  review_source?: ReviewSource;
}
export interface SentenceTranslation {
  word_id: string;
  text: string;
  reviewed: boolean;
  review_source?: ReviewSource;
}
/** `data/sentences/sentences.json` and `data/sentences/translations/<lang>.json`, both bare arrays; absent files are an empty stage. */
export interface SentenceStage {
  rows: SentenceFileRow[];
  translations: Partial<Record<string, SentenceTranslation[]>>;
}

export function loadSentenceStage(root = ROOT): SentenceStage {
  const dir = join(root, 'data', 'sentences');
  const read = (file: string) => JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const folder = join(dir, 'translations');
  const langs = existsSync(folder) ? readdirSync(folder).filter((f) => f.endsWith('.json')).sort() : [];
  return {
    rows: existsSync(join(dir, 'sentences.json')) ? read('sentences.json') : [],
    translations: Object.fromEntries(langs.map((f) => [f.replace(/\.json$/, ''), read(`translations/${f}`)])),
  };
}

/** Writes the Dutch rows and the translations of `lang`; an import changes both (a row's reviewed flag follows its translations). */
export function saveSentenceStage(stage: SentenceStage, lang: string, root = ROOT): void {
  const dir = join(root, 'data', 'sentences');
  const write = (file: string, value: unknown) => writeFileSync(join(dir, file), JSON.stringify(value, null, 2) + '\n');
  write('sentences.json', stage.rows);
  write(join('translations', `${lang}.json`), stage.translations[lang]);
}

/** Every problem of the staged sentence files; empty means valid. `env` is the live and staged words (CheckEnv of T-375). */
export function validateSentenceStage(stage: SentenceStage, env: CheckEnv): string[] {
  const ajv = new Ajv({ allErrors: true });
  const schemaOf = (name: string) => JSON.parse(readFileSync(join(ROOT, 'schema', `${name}.schema.json`), 'utf8'));
  const errors: string[] = [];
  // Compile each schema once: their $id would make a second `ajv.validate(schema)` throw "already exists".
  const validateRows = ajv.compile(schemaOf('sentences'));
  const validateTranslations = ajv.compile(schemaOf('sentence-translations'));
  if (!validateRows(stage.rows)) {
    for (const e of validateRows.errors ?? []) errors.push(`sentences: ${e.instancePath} ${e.message}`);
  }
  for (const [lang, rows] of Object.entries(stage.translations)) {
    if (!validateTranslations(rows)) {
      for (const e of validateTranslations.errors ?? []) errors.push(`sentences/translations/${lang}: ${e.instancePath} ${e.message}`);
    }
  }
  if (errors.length) return errors;

  const levelOf = makeLevelOf(env.words);
  const pos = lemmaPos(env.words);
  const posOf = (surface: string): Set<Pos> => pos.get(surface) ?? pos.get(env.inflected(surface) ?? '') ?? new Set();
  const seen = new Set<string>();
  for (const row of stage.rows) {
    const fail = (code: string) => errors.push(`sentences: ${row.word_id}: ${code}`);
    const word = env.words.find((x) => x.id === row.word_id);
    if (seen.has(row.word_id)) fail('duplicate_row');
    seen.add(row.word_id);
    const issue = sourceIssue(row);
    if (issue) fail(issue);
    if (!word || !SENTENCE_LEVELS.includes(word.cefr)) {
      fail('word_id_not_a1a2');
      continue;
    }
    const annotation = env.annotations.find((a) => a.word_id === row.word_id);
    for (const f of checkSentence(row, { word, annotation, levelOf, inflected: env.inflected, functionWords: env.functionWords })) fail(f);

    const form = row.form.normalize('NFC').toLowerCase();
    const distractors = row.distractors.map((d) => d.normalize('NFC').toLowerCase());
    if (distractors.length !== DISTRACTORS) fail('distractor_count');
    distractors.forEach((d, i) => {
      if (distractors.indexOf(d) !== i) fail(`distractor_duplicate ${d}`);
      else if (d === form) fail(`distractor_is_form ${d}`);
      else if (posOf(d).size === 0) fail(`distractor_unknown ${d}`);
      else if (!posOf(d).has(word.pos)) fail(`distractor_pos ${d}`);
    });
  }

  for (const [lang, rows] of Object.entries(stage.translations)) {
    const done = new Set<string>();
    for (const t of rows ?? []) {
      const fail = (code: string) => errors.push(`sentences/translations/${lang}: ${t.word_id}: ${code}`);
      if (!seen.has(t.word_id)) fail('translation_without_sentence');
      else if (done.has(t.word_id)) fail('duplicate_translation');
      done.add(t.word_id);
      if (!t.text.trim()) fail('empty_text');
      else if (normalisationIssue(t.text)) fail(`text_not_normalised (${normalisationIssue(t.text)})`);
      const issue = sourceIssue(t);
      if (issue) fail(issue);
    }
  }
  return errors;
}

/** `Sentences stage: N sentences`, then one coverage line per language. */
export function sentenceStageReport(stage: SentenceStage): string[] {
  const n = stage.rows.length;
  const ids = new Set(stage.rows.map((r) => r.word_id));
  return [
    `Sentences stage: ${n} sentences`,
    ...Object.entries(stage.translations).map(([lang, rows]) => {
      const own = (rows ?? []).filter((t) => ids.has(t.word_id));
      return `${lang}: ${own.length} translated, ${own.filter((t) => t.reviewed).length} reviewed / ${n} sentences`;
    }),
  ];
}
