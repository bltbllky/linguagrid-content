import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Annotation, Word } from './validate.ts';

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
  inflected: (token: string, prefer?: string) => string | null;
  functionWords: ReadonlySet<string>;
}

export const MIN_TOKENS = 4;
export const MAX_TOKENS = 9;
export const MAX_CHARS = 70;
const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const rank = (level: string) => LEVELS.indexOf(level);
const DOUBLE_QUOTES = /["“”„‟«»‘’‚]/;
const FUNCTION_WORDS = join(import.meta.dirname, '..', 'data', 'sentences', 'function-words.json');

/** Lowercase, split on spaces, strip a final `.` or `?` (and a comma after a word); hyphens and apostrophes stay inside a token. */
export function tokenize(nl: string): string[] {
  return nl
    .normalize('NFC')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((t, i, all) => (i === all.length - 1 ? t.replace(/[.?]$/, '') : t).replace(/,$/, ''));
}

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

const isVowel = (c: string | undefined) => c !== undefined && 'aeiou'.includes(c);
const swapEnd = (s: string, from: string, to: string) => (s.endsWith(from) ? s.slice(0, -1) + to : null);

/** From the stem of an inflected noun or adjective back to the base: undouble, lengthen, z->s, v->f. */
function baseVariants(stem: string): string[] {
  const out = new Set([stem]);
  if (/([bcdfgklmnprstz])\1$/.test(stem)) out.add(stem.slice(0, -1));
  if (stem.length >= 3 && !isVowel(stem.at(-1)) && isVowel(stem.at(-2)) && !isVowel(stem.at(-3))) {
    out.add(stem.slice(0, -2) + stem.at(-2) + stem.slice(-2));
  }
  for (const v of [...out]) {
    const s = swapEnd(v, 'z', 's');
    const f = swapEnd(v, 'v', 'f');
    if (s) out.add(s);
    if (f) out.add(f);
  }
  return [...out];
}

/** From a verb stem to the infinitive: stem+en, stem+n (doen), shortened vowel (wonen), doubled consonant (stoppen), s->z, f->v. */
function infinitives(stem: string): string[] {
  const roots = new Set([stem]);
  const short = stem.replace(/([aeou])\1([^aeiou])$/, '$1$2');
  if (short !== stem) roots.add(short);
  for (const r of [...roots]) {
    const z = swapEnd(r, 's', 'z');
    const v = swapEnd(r, 'f', 'v');
    if (z) roots.add(z);
    if (v) roots.add(v);
  }
  const out = [...roots].map((r) => r + 'en');
  out.push(stem + 'n');
  if (isVowel(stem.at(-1))) out.push(stem + stem.at(-1) + 'n'); // ga -> gaan
  if (stem.length >= 3 && !isVowel(stem.at(-1)) && isVowel(stem.at(-2)) && !isVowel(stem.at(-3))) out.push(stem + stem.at(-1) + 'en');
  return out;
}

/** Every lemma a surface form could have by the spelling rules; the caller keeps those that are words. */
export function lemmaCandidates(token: string): string[] {
  const out = new Set<string>();
  const nouns = (stem: string) => baseVariants(stem).forEach((b) => out.add(b));
  const verbs = (stem: string) => infinitives(stem).forEach((b) => out.add(b));
  const strip = (suffix: string) => (token.length > suffix.length + 1 && token.endsWith(suffix) ? token.slice(0, -suffix.length) : null);

  for (const [suffix, extra] of [['en', ''], ['eren', ''], ['s', ''], ["'s", ''], ['’s', ''], ['je', ''], ['tje', ''], ['etje', ''], ['pje', ''], ['kje', 'ing'],
    ['e', ''], ['er', ''], ['ere', ''], ['st', ''], ['ste', '']] as const) {
    const s = strip(suffix);
    if (s !== null) nouns(s + extra);
  }
  const heden = strip('heden');
  if (heden !== null) out.add(heden + 'heid');

  // verb: stem, stem+t, stem+te(n), stem+de(n), present participle, participle with or without ge-
  const stems = new Set<string>([token]);
  for (const suffix of ['t', 'te', 'ten', 'de', 'den', 'end', 'ende']) {
    const s = strip(suffix);
    if (s !== null) stems.add(s);
  }
  for (const s of [...stems, token]) {
    for (let at = s.indexOf('ge'); at >= 0; at = s.indexOf('ge', at + 1)) stems.add(s.slice(0, at) + s.slice(at + 2));
  }
  for (const s of [...stems]) {
    if (/[td]$/.test(s) && s.length > 2) stems.add(s.slice(0, -1));
  }
  stems.forEach(verbs);
  for (const s of stems) if (s.endsWith('en')) out.add(s); // strong participle: gelezen -> lezen
  out.delete(token);
  return [...out];
}

/**
 * The inflection check of ADR-026 rule 2(b): `token` must be in the OpenTaal wordlist and the spelling rules
 * (plural -en/-s/-'s/-eren, diminutive -je/-tje/-etje/-pje/-kje, verb stem/-t/-te/-de/ge-...-t/-d/-end, adjective -e/-er/-st,
 * with undoubling, vowel lengthening, z/s and f/v) must lead to a lemma in `lemmas`. Irregular forms (ging, zag, kwam ...) are not matched.
 */
export function makeInflected(openTaal: ReadonlySet<string>, lemmas: ReadonlySet<string>): SentenceContext['inflected'] {
  return (token, prefer) => {
    if (!openTaal.has(token)) return null;
    const found = lemmaCandidates(token).filter((c) => lemmas.has(c));
    if (prefer !== undefined && found.includes(prefer)) return prefer;
    return found[0] ?? null;
  };
}

/** Empty means valid; every entry is `<code>` or `<code> <token>`. */
export function checkSentence(row: SentenceRow, ctx: SentenceContext): string[] {
  const failures: string[] = [];
  const nl = row.nl.normalize('NFC');
  const form = row.form.normalize('NFC').toLowerCase();
  const tokens = tokenize(nl);
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
  const before = at > 0 ? tokens[at - 1] : undefined;
  if (ctx.word.pos === 'noun' && article && form === lemma && (before === 'de' || before === 'het') && before !== article) {
    failures.push(`article_mismatch ${before}`);
  }
  return failures;
}

export interface CheckEnv {
  words: readonly Word[];
  annotations: readonly Annotation[];
  inflected: SentenceContext['inflected'];
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
