import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { makeInflected, tokenize } from './inflection.ts';
import type { Inflected } from './inflection.ts';
import type { Annotation, Pos, Word } from './validate.ts';

/** One row of `data/sentences/sentences.json` (the file schema is T-376's). */
export interface SentenceRow {
  word_id: string;
  nl: string;
  form: string;
  distractors: string[];
}

export interface SentenceContext {
  word: Word;
  annotation: Annotation | undefined;
  /** Lowest CEFR of a live or staged lemma; null when no word has that lemma. */
  levelOf: (token: string) => string | null;
  /** The lemma of a live or staged word that `token` inflects (plural, conjugation, diminutive ...); `prefer` wins when several match. */
  inflected: Inflected;
  functionWords: ReadonlySet<string>;
}

export const MIN_TOKENS = 4;
export const MAX_TOKENS = 9;
export const MAX_CHARS = 70;
const LEVELS = ['A1', 'A2', 'B1', 'B2'];
export const rank = (level: string) => LEVELS.indexOf(level);
const DOUBLE_QUOTES = /["“”„‟«»‘‚]/; // ’ is the apostrophe of auto’s
const FUNCTION_WORDS = join(import.meta.dirname, '..', 'data', 'sentences', 'function-words.json');


/** The committed list (or `list` in tests): lowercase tokens only, none twice. */
export function loadFunctionWords(list?: string[]): Set<string> {
  const entries = list ?? (JSON.parse(readFileSync(FUNCTION_WORDS, 'utf8')) as string[]);
  const set = new Set<string>();
  for (const t of entries) {
    if (t !== t.normalize('NFC').toLowerCase() || t.trim() !== t || !t) throw new Error(`function word "${t}" must be a lowercase token`);
    if (set.has(t)) throw new Error(`function word "${t}" is a duplicate`);
    set.add(t);
  }
  return set;
}

/** Lemma -> lowest CEFR over the words (a lemma can be both noun and verb). */
export function makeLevelOf(words: readonly Word[]): (token: string) => string | null {
  const levels = new Map<string, string>();
  for (const x of words) {
    const lemma = x.lemma_nl.normalize('NFC').toLowerCase();
    const have = levels.get(lemma);
    if (have === undefined || rank(x.cefr) < rank(have)) levels.set(lemma, x.cefr);
  }
  return (token) => levels.get(token) ?? null;
}


/** Empty means valid; every entry is `<code>` or `<code> <token>`. */
export function checkSentence(row: SentenceRow, ctx: SentenceContext): string[] {
  const failures: string[] = [];
  const nl = row.nl.normalize('NFC');
  const form = row.form.normalize('NFC').toLowerCase().replace(/’/g, "'");
  const tokens = tokenize(nl).map((t) => t.replace(/’/g, "'"));
  const lemma = ctx.word.lemma_nl.normalize('NFC').toLowerCase();

  if (tokens.length < MIN_TOKENS) failures.push('too_few_tokens');
  if (tokens.length > MAX_TOKENS) failures.push('too_many_tokens');
  if (nl.length > MAX_CHARS) failures.push('too_long_chars');
  if (!/^[^.?]*[.?]$/.test(nl.trim())) failures.push('bad_ending');
  for (const d of nl.match(/\d/g) ?? []) failures.push(`digit ${d}`);
  if (DOUBLE_QUOTES.test(nl) || tokens.some((t) => /^'|'$/.test(t) && t !== "'s")) failures.push('quotation_mark');

  const at = tokens.indexOf(form);
  if (tokens.filter((t) => t === form).length !== 1) failures.push('form_not_one_token');
  if (form !== lemma && ctx.inflected(form, lemma) !== lemma) failures.push(`form_not_inflection ${form}`);

  const level = ctx.word.cefr;
  const b2 = level === 'B2';
  tokens.forEach((t, i) => {
    if (i === at || ctx.functionWords.has(t)) return;
    const parts = t.includes('-') ? t.split('-') : [t];
    for (const part of parts) {
      if (ctx.functionWords.has(part)) continue;
      const known = ctx.levelOf(part) ?? ctx.levelOf(ctx.inflected(part) ?? '');
      if (known === null) failures.push(`unknown_token ${t}`);
      else if (b2 && known === 'B2') failures.push(`second_b2_word ${t}`);
      else if (rank(known) > rank(level)) failures.push(`token_above_level ${t}`);
      else continue;
      break;
    }
  });

  const article = ctx.annotation?.article;
  // the article may stand one adjective away: "het grote huis"
  const isArticle = (t: string | undefined) => (t === 'de' || t === 'het' ? t : undefined);
  const prev = tokens[at - 1];
  const articleToken = isArticle(prev) ?? (prev && !ctx.functionWords.has(prev) ? isArticle(tokens[at - 2]) : undefined);
  if (ctx.word.pos === 'noun' && article && form === lemma && at > 0 && articleToken && articleToken !== article) {
    failures.push(`article_mismatch ${articleToken}`);
  }
  return failures;
}

/** Lemma -> its parts of speech over the words, the shape `makeInflected` wants. */
export function lemmaPos(words: readonly Word[]): Map<string, Set<Pos>> {
  const map = new Map<string, Set<Pos>>();
  for (const w of words) {
    const lemma = w.lemma_nl.normalize('NFC').toLowerCase();
    map.set(lemma, (map.get(lemma) ?? new Set()).add(w.pos));
  }
  return map;
}

export interface CheckEnv {
  words: readonly Word[];
  annotations: readonly Annotation[];
  inflected: Inflected;
  functionWords: ReadonlySet<string>;
}

/** One line per failure (`<word_id>: <code> [<token>]`) and a summary line; `failed` counts rows with a failure. */
export function checkRows(rows: readonly SentenceRow[], env: CheckEnv): { lines: string[]; failed: number } {
  const levelOf = makeLevelOf(env.words);
  const lines: string[] = [];
  let failed = 0;
  for (const row of rows) {
    const word = env.words.find((x) => x.id === row.word_id);
    const failures = word
      ? checkSentence(row, {
          word,
          annotation: env.annotations.find((a) => a.word_id === row.word_id),
          levelOf,
          inflected: env.inflected,
          functionWords: env.functionWords,
        })
      : ['unknown_word_id'];
    if (failures.length) failed += 1;
    for (const f of failures) lines.push(`${row.word_id}: ${f}`);
  }
  lines.push(failed ? `${failed} of ${rows.length} sentence(s) failed` : `✔ ${rows.length} sentence(s) pass the token check`);
  return { lines, failed };
}
