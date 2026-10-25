import { wordId, type Annotation, type Pos, type Word } from './validate.ts';

/** Criterion C2 of data/b1/selection-criteria.md: lemma rank 3,000-10,000. */
export const B1_BAND = { min: 3000, max: 10000 } as const;
/** Criterion D2 of data/b2/selection-criteria.md: lemma rank 10,000-20,000. */
export const B2_BAND = { min: 10000, max: 20000 } as const;
/** Criterion E2 (amended 2026-10-23): the pool band is the A2 band, lemma rank 1-5,000. */
export const A1A2_BAND = { min: 1, max: 5000 } as const;
/** E2: A1 extras stop at lemma rank 3,000. */
export const A1_MAX_RANK = 3000;
/** Criterion E7 (amended 2026-10-23): the A1 closed set of cardinal numbers. */
export const CARDINALS = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig', 'honderd', 'duizend', 'miljoen', 'miljard'] as const;

export interface PoolRules {
  minLetters: number;
  infinitiveOnly: boolean;
  noDemonyms: boolean;
}
export const B1_RULES: PoolRules = { minLetters: 4, infinitiveOnly: false, noDemonyms: false };
export const A1A2_RULES: PoolRules = { minLetters: 3, infinitiveOnly: true, noDemonyms: true };
export const B2_RULES: PoolRules = { minLetters: 4, infinitiveOnly: true, noDemonyms: true };
/** Criterion C5: a lemma is dropped when every sense carries one of these tags. */
export const EXCLUDED_TAGS = [
  'proper-noun',
  'abbreviation',
  'vulgar',
  'offensive',
  'derogatory',
  'dialectal',
  'regional',
  'Belgium',
  'Suriname',
  'archaic',
  'obsolete',
  'dated',
] as const;

const KAIKKI_POS: Record<string, Pos> = { noun: 'noun', verb: 'verb', adj: 'adj' };
const POS_ORDER: Pos[] = ['noun', 'verb', 'adj'];
const GENDER_LETTERS = 'mfnc';

export interface Lemma {
  word: string;
  pos: Pos;
  /** Tags present on every sense. */
  tags: Set<string>;
  genders: Set<string>;
  reflexiveOnly: boolean;
  pluralOnly: boolean;
  /** Every sense is marked as a demonym (tag or category name). */
  demonym: boolean;
}
export interface KaikkiIndex {
  /** Key: `<pos>:<word>`. */
  lemmas: Map<string, Lemma>;
  /** Inflected or alternative form -> the lemma words it points to. */
  formOf: Map<string, Set<string>>;
}
export interface PoolRow {
  id: string;
  lemma_nl: string;
  pos: Pos;
  rank: number;
  gender: string | null;
  /** Set by the B2 profile only. */
  band?: 'b2' | 'b1-band';
}
export type RankBand = '3-5k' | '5-8k' | '8-10k';
export type RankBandA1A2 = '0-1k' | '1-2k' | '2-3k' | '3-5k';

interface KaikkiSense {
  tags?: string[];
  categories?: ({ name?: string } | string)[];
  form_of?: { word: string }[];
  alt_of?: { word: string }[];
}
interface KaikkiEntry {
  word?: string;
  pos?: string;
  senses?: KaikkiSense[];
  head_templates?: { name?: string; args?: Record<string, string> }[];
}

const norm = (text: string) => text.normalize('NFC').toLowerCase();

/** `id<TAB>word<TAB>count` lines of a Leipzig `*-words.txt`; equal forms add up. */
export function parseLeipzigWords(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of text.split('\n')) {
    const cells = line.split('\t');
    if (cells.length !== 3 || !/^\d+$/.test(cells[2].trim())) continue;
    const form = norm(cells[1]);
    counts.set(form, (counts.get(form) ?? 0) + Number(cells[2]));
  }
  return counts;
}

export function emptyKaikkiIndex(): KaikkiIndex {
  return { lemmas: new Map(), formOf: new Map() };
}

/** Adds one JSONL line of the kaikki Dutch extract; usable for streaming. */
export function addKaikkiLine(index: KaikkiIndex, line: string): void {
  if (!line.trim()) return;
  const entry = JSON.parse(line) as KaikkiEntry;
  if (!entry.word || !entry.pos) return;
  const word = norm(entry.word);
  const senses = entry.senses ?? [];

  if (senses.some((s) => s.form_of || s.alt_of)) {
    const targets = index.formOf.get(word) ?? new Set<string>();
    for (const s of senses) for (const t of [...(s.form_of ?? []), ...(s.alt_of ?? [])]) targets.add(norm(t.word));
    index.formOf.set(word, targets);
    return;
  }
  const pos = KAIKKI_POS[entry.pos];
  if (!pos) return;

  let tags = null as Set<string> | null;
  for (const s of senses) {
    const own = new Set(s.tags ?? []);
    tags = tags ? new Set([...tags].filter((t) => own.has(t))) : own;
  }
  const genders = new Set<string>();
  let sawPlural = false;
  for (const t of entry.head_templates ?? []) {
    const first = t.name === 'nl-noun' ? t.args?.['1']?.[0] : undefined;
    if (first === 'p') sawPlural = true;
    else if (first && GENDER_LETTERS.includes(first)) genders.add(first);
  }
  const fresh: Lemma = {
    word,
    pos,
    tags: tags ?? new Set(),
    genders,
    reflexiveOnly: pos === 'verb' && senses.length > 0 && senses.every((s) => s.tags?.includes('reflexive')),
    pluralOnly: sawPlural && genders.size === 0,
    demonym: senses.length > 0 && senses.every(isDemonymSense),
  };
  const key = `${pos}:${word}`;
  const old = index.lemmas.get(key);
  if (old) {
    old.tags = new Set([...old.tags].filter((t) => fresh.tags.has(t)));
    for (const g of fresh.genders) old.genders.add(g);
    // Dropped by C4 only when every entry is reflexive-only or plural-only.
    old.reflexiveOnly &&= fresh.reflexiveOnly;
    old.pluralOnly &&= fresh.pluralOnly;
    old.demonym &&= fresh.demonym;
  } else {
    index.lemmas.set(key, fresh);
  }
}

/** In the kaikki extract the marker is a category name such as "Demonyms"; a sense tag is accepted too. */
const isDemonymSense = (s: KaikkiSense) =>
  (s.tags ?? []).some((t) => /demonym/i.test(t)) ||
  (s.categories ?? []).some((c) => /demonym/i.test(typeof c === 'string' ? c : (c.name ?? '')));

export function readKaikki(lines: Iterable<string>): KaikkiIndex {
  const index = emptyKaikkiIndex();
  for (const line of lines) addKaikkiLine(index, line);
  return index;
}

/** Sums surface-form counts per lemma word; a form with several lemma readings (itself included) is split equally. */
export function lemmaCounts(forms: Map<string, number>, index: KaikkiIndex): Map<string, number> {
  const lemmaWords = new Set([...index.lemmas.values()].map((l) => l.word));
  const counts = new Map<string, number>();
  const add = (word: string, n: number) => counts.set(word, (counts.get(word) ?? 0) + n);
  for (const [form, n] of forms) {
    const targets = [...(index.formOf.get(form) ?? [])].filter((t) => t !== form && lemmaWords.has(t));
    // A form that is a lemma and also an inflection of other lemmas (werken) is shared equally (C2).
    const shares = lemmaWords.has(form) ? [form, ...targets] : targets;
    for (const t of shares) add(t, n / shares.length);
  }
  return counts;
}

/**
 * Adds the cardinal numbers as noun rows (E7) and returns the added words in list order. A word is skipped when it
 * has a noun entry already or no form count. Mutates `index` and `ranks`.
 */
export function addCardinals(
  index: KaikkiIndex,
  forms: Map<string, number>,
  counts: Map<string, number>,
  ranks: Map<string, number>,
  words: readonly string[] = CARDINALS,
): string[] {
  const added: string[] = [];
  for (const w of words) {
    if (index.lemmas.has(`noun:${w}`) || !forms.has(w)) continue;
    // Wiktionary has 13-19 and the tens only as numerals; ranking them against the counted lemmas leaves every other rank as it is.
    index.lemmas.set(`noun:${w}`, {
      word: w,
      pos: 'noun',
      tags: new Set(),
      genders: new Set(),
      reflexiveOnly: false,
      pluralOnly: false,
      demonym: false,
    });
    if (!ranks.has(w)) ranks.set(w, 1 + [...counts.values()].filter((c) => c > forms.get(w)!).length);
    added.push(w);
  }
  return added;
}

/** Rank 1 = highest count; ties alphabetical. */
export function lemmaRanks(counts: Map<string, number>): Map<string, number> {
  const sorted = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return new Map(sorted.map(([word], i) => [word, i + 1]));
}

/** Rows that pass criteria C1-C5, one per lemma and part of speech, sorted by rank. */
export function buildPool(
  ranks: Map<string, number>,
  index: KaikkiIndex,
  openTaal: Set<string>,
  live: { lemmas: Set<string>; excludedIds: Set<string> },
  band: { min: number; max: number } = B1_BAND,
  rules: PoolRules = B1_RULES,
): PoolRow[] {
  const rows: PoolRow[] = [];
  for (const l of index.lemmas.values()) {
    const rank = ranks.get(l.word);
    if (rank === undefined || rank < band.min || rank > band.max) continue;
    const letters = Array.from(l.word).length;
    if (!/^\p{L}+$/u.test(l.word) || letters < rules.minLetters || letters > 12) continue;
    const id = wordId(l.pos, l.word);
    if (!openTaal.has(l.word) || live.lemmas.has(l.word) || live.excludedIds.has(id)) continue;
    if (EXCLUDED_TAGS.some((t) => l.tags.has(t)) || l.reflexiveOnly || l.pluralOnly) continue;
    const gender = l.genders.size ? [...l.genders].sort().join('/') : null;
    // Dutch infinitives end in -en or -n (gaan, zijn).
    if (rules.infinitiveOnly && l.pos === 'verb' && !l.word.endsWith('n')) continue;
    if (rules.noDemonyms && l.demonym) continue;
    rows.push({ id, lemma_nl: l.word, pos: l.pos, rank, gender });
  }
  return rows.sort((a, b) => a.rank - b.rank || POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos));
}

/** B2 pool: the 10,000-20,000 band plus B1-band rows that are not B1 words, sorted by rank. */
export function buildB2Pool(
  ranks: Map<string, number>,
  index: KaikkiIndex,
  openTaal: Set<string>,
  live: { lemmas: Set<string>; excludedIds: Set<string> },
  b1Lemmas: Set<string>,
): PoolRow[] {
  const top = buildPool(ranks, index, openTaal, live, B2_BAND, B2_RULES).map((r) => ({ ...r, band: 'b2' as const }));
  const leftovers = buildPool(ranks, index, openTaal, live, B1_BAND, B2_RULES)
    .filter((r) => !b1Lemmas.has(r.lemma_nl))
    .map((r) => ({ ...r, band: 'b1-band' as const }));
  return [...top, ...leftovers].sort((a, b) => a.rank - b.rank || POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos));
}

export function rankBandB2(row: PoolRow): '10-15k' | '15-20k' | 'b1-band' {
  return row.band === 'b1-band' ? 'b1-band' : row.rank < 15000 ? '10-15k' : '15-20k';
}

/** Share of rows with 10-12 letters, two decimals (D4 cap: 0.40). */
export function longShare(pool: PoolRow[]): number {
  if (!pool.length) return 0;
  const long = pool.filter((r) => Array.from(r.lemma_nl).length >= 10).length;
  return Math.round((long / pool.length) * 100) / 100;
}

/** Ids the pool must skip. For B2 an id whose reason starts with "level B2" stays a candidate (PM decision 2026-10-25). */
export function excludedIdsFor(level: 'b1' | 'a1a2' | 'b2', excluded: { id: string; reason: string }[]): Set<string> {
  return new Set(excluded.filter((e) => !(level === 'b2' && e.reason.startsWith('level B2'))).map((e) => e.id));
}

export function rankBand(rank: number): RankBand {
  return rank < 5000 ? '3-5k' : rank < 8000 ? '5-8k' : '8-10k';
}

export function rankBandA1A2(rank: number): RankBandA1A2 {
  return rank < 1000 ? '0-1k' : rank < 2000 ? '1-2k' : rank < 3000 ? '2-3k' : '3-5k';
}

export function poolCounts<B extends string = RankBand>(
  pool: PoolRow[],
  bandOf: (rank: number) => string = rankBand,
): {
  pos: Record<Pos, number>;
  band: Record<B, number>;
  lemmas: number;
  twoPos: number;
} {
  const pos: Record<Pos, number> = { noun: 0, verb: 0, adj: 0 };
  const band: Record<string, number> = {};
  const perLemma = new Map<string, number>();
  for (const r of pool) {
    pos[r.pos]++;
    const b = bandOf(r.rank);
    band[b] = (band[b] ?? 0) + 1;
    perLemma.set(r.lemma_nl, (perLemma.get(r.lemma_nl) ?? 0) + 1);
  }
  return { pos, band: band as Record<B, number>, lemmas: perLemma.size, twoPos: [...perLemma.values()].filter((n) => n > 1).length };
}

/** sha256 of the sources the pool of 2026-10-22 was built from (T-125 run, .cache/b1/sources.json). */
export const PINNED_SHA256: Record<string, string> = {
  'nld_news_2020_1M.tar.gz': '1494539090cee20e5b7f235a8bcbc77833fbac224c14550e1c810b977bfab8cd',
  'nld_wikipedia_2021_1M.tar.gz': '4205c6638ee85ab29644402d9237cd5d3df1ece4e152d1b453134fec80588aee',
  'kaikki.org-dictionary-Dutch.jsonl': '00c8ee4a95169bb1ec0ac9b495d43dc7746a1e59e9a44914bae8909f9f167121',
  'wordlist.txt': '12e5fb5e3c73840b583b30016926d1f63a75e9bf1652a3a6634b2ba7c49ad7be',
};

/** One warning per source that is missing or differs from its pin; empty when all match. */
export function sourceDrift(record: Record<string, string>, pinned = PINNED_SHA256): string[] {
  return Object.entries(pinned).flatMap(([file, hash]) => {
    const now = record[file];
    if (!now) return [`Source not fetched: ${file}`];
    if (now === hash) return [];
    return [
      `Source changed since 2026-10-22: ${file} (pinned ${hash.slice(0, 12)}, now ${now.slice(0, 12)}); the pool will differ from the reviewed one`,
    ];
  });
}

const nearestRank = (sorted: number[], p: number) => sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];

/** Information check of C2: lemma-rank percentiles of our live A1 and A2 words. */
export function calibration(ranks: Map<string, number>, words: Word[]) {
  return (['A1', 'A2'] as const).map((level) => {
    const own = words.filter((w) => w.cefr === level);
    const found = own.flatMap((w) => ranks.get(w.lemma_nl) ?? []).sort((a, b) => a - b);
    return {
      level,
      n: found.length,
      median: nearestRank(found, 0.5),
      p75: nearestRank(found, 0.75),
      p90: nearestRank(found, 0.9),
      missing: own.length - found.length,
    };
  });
}

export type ArticleResult = 'agree' | 'differ' | 'both' | 'unchecked';
export interface ArticleRow {
  id: string;
  dutch: string;
  stored: string;
  wiktionary: string;
  result: ArticleResult;
}

const ARTICLE_OF: Record<string, 'de' | 'het'> = { m: 'de', f: 'de', c: 'de', n: 'het' };

/**
 * Check only: compares our stored article of each noun with the Wiktionary gender. Nothing is taken from Wiktionary;
 * a noun with both genders matches when the stored article is one of them (ADR-012 rule 6).
 */
export function articleCheck(words: Word[], annotations: Annotation[], index: KaikkiIndex): ArticleRow[] {
  const stored = new Map(annotations.map((a) => [a.word_id, a.article]));
  return words
    .filter((w) => w.pos === 'noun')
    .map((w) => {
      const article = stored.get(w.id) ?? '';
      const found = new Set<string>();
      for (const g of index.lemmas.get(`noun:${norm(w.lemma_nl)}`)?.genders ?? []) found.add(ARTICLE_OF[g]);
      const wiktionary = [...found].sort();
      const result: ArticleResult = !wiktionary.length
        ? 'unchecked'
        : !wiktionary.includes(article)
          ? 'differ'
          : wiktionary.length > 1
            ? 'both'
            : 'agree';
      return { id: w.id, dutch: w.lemma_nl, stored: article, wiktionary: wiktionary.join('/'), result };
    });
}

/** The selected ids as own words of `cefr`, in the order of `ids`; `lemmas` is shared across calls. */
export function selectWords(
  pool: PoolRow[],
  ids: string[],
  cefr: Word['cefr'],
  poolName: string,
  lemmas = new Set<string>(),
): Word[] {
  const byId = new Map(pool.map((r) => [r.id, r]));
  return ids.map((id) => {
    const row = byId.get(id);
    if (!row) throw new Error(`Not in the ${poolName} pool: ${id}`);
    if (lemmas.has(row.lemma_nl)) throw new Error(`Lemma twice in the selection: ${row.lemma_nl}`);
    lemmas.add(row.lemma_nl);
    return { id: row.id, lemma_nl: row.lemma_nl, pos: row.pos, cefr, source: 'own' };
  });
}

/** The selected ids as B1 words, in the order of `ids`. */
export function selectB1(pool: PoolRow[], ids: string[]): Word[] {
  return selectWords(pool, ids, 'B1', 'B1');
}

/** A1 words first, then A2; one lemma may not appear twice across both lists. */
export function selectA1A2(pool: PoolRow[], sel: { A1: string[]; A2: string[] }): Word[] {
  for (const key of ['A1', 'A2'] as const) {
    if (!Array.isArray(sel[key])) throw new Error(`data/a1a2/selection.json needs an "${key}" list of ids`);
  }
  const byId = new Map(pool.map((r) => [r.id, r]));
  for (const id of sel.A1) {
    const row = byId.get(id);
    if (row && row.rank > A1_MAX_RANK) throw new Error(`A1 word outside lemma rank 1-3,000: ${id} (rank ${row.rank})`);
  }
  const lemmas = new Set<string>();
  return [...selectWords(pool, sel.A1, 'A1', 'a1a2', lemmas), ...selectWords(pool, sel.A2, 'A2', 'a1a2', lemmas)];
}
