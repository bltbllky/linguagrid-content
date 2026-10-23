import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { translationReport, validateContent } from './validate.ts';
import type { Annotation, Category, Content, TranslationFile, Word } from './validate.ts';

const ROOT = join(import.meta.dirname, '..');

/** Data under `data/<stage>/`: same shapes as the live files, never read by `loadContent` or a release. */
export interface Stage {
  level: 'B1';
  words: Word[];
  categories: Category[];
  annotations?: Annotation[];
  translations: Partial<Record<string, TranslationFile>>;
}

export function loadStage(name = 'b1', root = ROOT): Stage {
  if (name !== 'b1') throw new Error(`Unknown stage "${name}"; only b1 is staged`);
  const dir = join(root, 'data', name);
  const read = (file: string) => JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const readIfPresent = <T>(file: string): T | undefined => (existsSync(join(dir, file)) ? read(file) : undefined);
  const folder = join(dir, 'translations');
  const langs = existsSync(folder) ? readdirSync(folder).filter((f) => f.endsWith('.json')).sort() : [];
  return {
    level: 'B1',
    words: readIfPresent<Word[]>('words.json') ?? [],
    categories: readIfPresent<Category[]>('categories.json') ?? [],
    annotations: readIfPresent<Annotation[]>('annotations.json'),
    translations: Object.fromEntries(langs.map((file) => [file.replace(/\.json$/, ''), read(`translations/${file}`)])),
  };
}

/** The live content followed by the staged content, so every live rule can run on both. */
export function mergeStage(live: Content, stage: Stage): Content {
  const langs = new Set([...Object.keys(live.translations), ...Object.keys(stage.translations)]);
  const translations = Object.fromEntries(
    [...langs].map((lang) => {
      const a = live.translations[lang];
      const b = stage.translations[lang];
      return [lang, { lang, words: [...(a?.words ?? []), ...(b?.words ?? [])], categories: [...(a?.categories ?? []), ...(b?.categories ?? [])] }];
    }),
  ) as Content['translations'];
  return {
    words: [...live.words, ...stage.words],
    categories: [...live.categories, ...stage.categories],
    annotations: [...live.annotations, ...(stage.annotations ?? [])],
    translations,
    manifest: live.manifest,
  };
}

export function validateStage(live: Content, stage: Stage): { errors: string[]; incomplete: string[] } {
  const errors: string[] = [];
  const incomplete: string[] = [];
  const liveByLemma = new Map(live.words.map((w) => [w.lemma_nl, w.id]));
  const stagedByLemma = new Map<string, string>();
  for (const w of stage.words) {
    if (w.cefr !== 'B1') errors.push(`${w.id}: level ${w.cefr} in the B1 stage`);
    if (w.source !== 'own') errors.push(`${w.id}: source ${w.source} in the B1 stage (own selection only; B1 is not NT2Lex-derived)`);
    const liveId = liveByLemma.get(w.lemma_nl);
    if (liveId) errors.push(`${w.id}: lemma "${w.lemma_nl}" is already in ${liveId}`);
    const first = stagedByLemma.get(w.lemma_nl);
    if (first) errors.push(`${w.id}: lemma "${w.lemma_nl}" is staged twice (${first})`);
    else stagedByLemma.set(w.lemma_nl, w.id);
  }
  const liveCategories = new Set(live.categories.map((c) => c.id));
  for (const c of stage.categories) {
    if (c.cefr !== 'B1') errors.push(`${c.id}: staged category must be B1`);
    if (liveCategories.has(c.id)) errors.push(`${c.id}: category id is already live`);
  }
  for (const a of stage.annotations ?? []) {
    if (liveCategories.has(a.category_id)) errors.push(`${a.word_id}: B1 word in a non-B1 category "${a.category_id}"`);
  }

  const wordIds = new Set(stage.words.map((w) => w.id));
  const categoryIds = new Set(stage.categories.map((c) => c.id));
  const gaps = new Set<string>();
  if (!stage.annotations) for (const id of wordIds) gaps.add(`${id}: missing annotation`);
  if (!stage.translations.tr) {
    for (const id of wordIds) gaps.add(`${id}: missing Turkish translation`);
    for (const id of categoryIds) gaps.add(`${id}: missing Turkish category title`);
  }
  for (const message of validateContent(mergeStage(live, stage))) (gaps.has(message) ? incomplete : errors).push(message);
  return { errors, incomplete };
}

export function stageReport(live: Content, stage: Stage): string[] {
  const merged = mergeStage(live, stage);
  const count = (pos: Word['pos']) => stage.words.filter((w) => w.pos === pos).length;
  const ids = new Set([...stage.words.map((w) => w.id), ...stage.categories.map((c) => c.id)]);
  const lines = translationReport(merged);
  return [
    `B1 stage: ${stage.words.length} words (${count('noun')} nouns, ${count('verb')} verbs, ${count('adj')} adjectives), ${stage.categories.length} categories`,
    ...lines.filter((l) => /^\S+ B1:/.test(l)),
    ...lines.filter((l) => l.startsWith('⚠') && [...ids].some((id) => l.includes(id))),
  ];
}
