import { wordId, type Pos, type Word } from './validate.ts';

/** Criterion C2 of data/b1/selection-criteria.md: lemma rank 3,000-10,000. */
export const B1_BAND = { min: 3000, max: 10000 } as const;
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
const MIN_LETTERS = 4;
const GENDER_LETTERS = 'mfnc';

export interface Lemma {
  word: string;
  pos: Pos;
  /** Tags present on every sense. */
  tags: Set<string>;
  genders: Set<string>;
  reflexiveOnly: boolean;
  pluralOnly: boolean;
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
}
export type RankBand = '3-5k' | '5-8k' | '8-10k';

interface KaikkiSense {
  tags?: string[];
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
  };
  const key = `${pos}:${word}`;
  const old = index.lemmas.get(key);
  if (old) {
    old.tags = new Set([...old.tags].filter((t) => fresh.tags.has(t)));
    for (const g of fresh.genders) old.genders.add(g);
    // Dropped by C4 only when every entry is reflexive-only or plural-only.
    old.reflexiveOnly &&= fresh.reflexiveOnly;
    old.pluralOnly &&= fresh.pluralOnly;
  } else {
    index.lemmas.set(key, fresh);
  }
}

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
): PoolRow[] {
  const rows: PoolRow[] = [];
  for (const l of index.lemmas.values()) {
    const rank = ranks.get(l.word);
    if (rank === undefined || rank < band.min || rank > band.max) continue;
    const letters = Array.from(l.word).length;
    if (!/^\p{L}+$/u.test(l.word) || letters < MIN_LETTERS || letters > 12) continue;
    const id = wordId(l.pos, l.word);
    if (!openTaal.has(l.word) || live.lemmas.has(l.word) || live.excludedIds.has(id)) continue;
    if (EXCLUDED_TAGS.some((t) => l.tags.has(t)) || l.reflexiveOnly || l.pluralOnly) continue;
    const gender = l.genders.size ? [...l.genders].sort().join('/') : null;
    rows.push({ id, lemma_nl: l.word, pos: l.pos, rank, gender });
  }
  return rows.sort((a, b) => a.rank - b.rank || POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos));
}

export function rankBand(rank: number): RankBand {
  return rank < 5000 ? '3-5k' : rank < 8000 ? '5-8k' : '8-10k';
}

export function poolCounts(pool: PoolRow[]): {
  pos: Record<Pos, number>;
  band: Record<RankBand, number>;
  lemmas: number;
  twoPos: number;
} {
  const pos: Record<Pos, number> = { noun: 0, verb: 0, adj: 0 };
  const band: Record<RankBand, number> = { '3-5k': 0, '5-8k': 0, '8-10k': 0 };
  const perLemma = new Map<string, number>();
  for (const r of pool) {
    pos[r.pos]++;
    band[rankBand(r.rank)]++;
    perLemma.set(r.lemma_nl, (perLemma.get(r.lemma_nl) ?? 0) + 1);
  }
  return { pos, band, lemmas: perLemma.size, twoPos: [...perLemma.values()].filter((n) => n > 1).length };
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

/** The selected ids as B1 words, in the order of `ids`. */
export function selectB1(pool: PoolRow[], ids: string[]): Word[] {
  const byId = new Map(pool.map((r) => [r.id, r]));
  const lemmas = new Set<string>();
  return ids.map((id) => {
    const row = byId.get(id);
    if (!row) throw new Error(`Not in the B1 pool: ${id}`);
    if (lemmas.has(row.lemma_nl)) throw new Error(`Lemma twice in the selection: ${row.lemma_nl}`);
    lemmas.add(row.lemma_nl);
    return { id: row.id, lemma_nl: row.lemma_nl, pos: row.pos, cefr: 'B1', source: 'own' };
  });
}
