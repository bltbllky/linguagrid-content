import { isDeepStrictEqual as same } from 'node:util';

import type { Annotation, Category, TranslationFile } from './validate.ts';

/** `annotations.json` / `categories.json` entries as they were before T-029. */
export type LegacyAnnotation = Annotation & { text_tr: string };
export type LegacyCategory = Category & { title_tr: string };
export interface Migrated {
  annotations: Annotation[];
  categories: Category[];
  tr: TranslationFile;
}

/**
 * One-off move of the Turkish texts and titles into `data/translations/tr.json` (ADR-011, shape (a)).
 * Each Turkish translation's `reviewed` starts as a copy of the annotation's flag, so the review so far is kept.
 */
export function migrateTranslations(annotations: LegacyAnnotation[], categories: LegacyCategory[]): Migrated {
  return {
    annotations: annotations.map(({ text_tr, ...neutral }) => neutral),
    categories: categories.map(({ title_tr, ...neutral }) => neutral),
    tr: {
      lang: 'tr',
      words: annotations.map((a) => ({ word_id: a.word_id, text: a.text_tr, reviewed: a.reviewed })),
      categories: categories.map((c) => ({ category_id: c.id, title: c.title_tr })),
    },
  };
}

/** Rebuilds every old entry from the migrated files and lists the ids whose text, title or flags changed. */
export function checkMigration(before: { annotations: LegacyAnnotation[]; categories: LegacyCategory[] }, after: Migrated): string[] {
  const texts = new Map(after.tr.words.map((t) => [t.word_id, t]));
  const titles = new Map(after.tr.categories.map((c) => [c.category_id, c.title]));
  const notes = new Map(after.annotations.map((a) => [a.word_id, a]));
  const cats = new Map(after.categories.map((c) => [c.id, c]));
  const errors: string[] = [];
  for (const old of before.annotations) {
    const tr = texts.get(old.word_id);
    const rebuilt = { ...notes.get(old.word_id), text_tr: tr?.text, tr_reviewed: tr?.reviewed };
    if (!same(rebuilt, { ...old, tr_reviewed: old.reviewed })) errors.push(`${old.word_id}: changed by the migration`);
  }
  for (const old of before.categories) {
    if (!same({ ...cats.get(old.id), title_tr: titles.get(old.id) }, old)) errors.push(`${old.id}: changed by the migration`);
  }
  const known = new Set([...before.annotations.map((a) => a.word_id), ...before.categories.map((c) => c.id)]);
  const added = new Set([...texts.keys(), ...titles.keys(), ...notes.keys(), ...cats.keys()].filter((id) => !known.has(id)));
  return [...errors, ...[...added].map((id) => `${id}: added by the migration`)];
}
