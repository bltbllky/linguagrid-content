import { parseCsv } from './import-review.ts';

export const SPOT_INITIAL = 20;
export const SPOT_EXTENSION = 30;
export const SPOT_FULL = 50;
export const RELEASED_MIN = 10;
export const RELEASED_SHARE = 5;
/** The tally looks at the newest entries until they hold this many words; more than TALLY_ERRORS errors forces 50 words. */
export const TALLY_WINDOW = 200;
export const TALLY_ERRORS = 4;

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Descending Fisher-Yates on a copy, as in review/owner-b1.md. */
export function shuffle<T>(items: readonly T[], rnd: () => number): T[] {
  const s = items.slice();
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

export function drawSpotCheck(
  pool: readonly string[],
  released: readonly string[],
  seed: number,
  full = false,
): { initial: string[]; extension: string[] } {
  if (pool.length < SPOT_FULL) throw new Error(`pool has ${pool.length} ids, need ${SPOT_FULL}`);
  const inPool = new Set(pool);
  for (const id of released) if (!inPool.has(id)) throw new Error(`released id not in pool: ${id}`);
  const rnd = mulberry32(seed);
  if (full) return { initial: shuffle(pool, rnd).slice(0, SPOT_FULL), extension: [] };
  if (released.length >= RELEASED_MIN) {
    const isReleased = new Set(released);
    const rest = shuffle(
      pool.filter((id) => !isReleased.has(id)),
      rnd,
    );
    const rel = shuffle(released, rnd);
    const fromRest = SPOT_INITIAL - RELEASED_SHARE;
    return {
      initial: [...rel.slice(0, RELEASED_SHARE), ...rest.slice(0, fromRest)],
      extension: rest.slice(fromRest, fromRest + SPOT_EXTENSION),
    };
  }
  const s = shuffle(pool, rnd);
  return { initial: s.slice(0, SPOT_INITIAL), extension: s.slice(SPOT_INITIAL, SPOT_INITIAL + SPOT_EXTENSION) };
}

export function judge(errors: number, words: number): 'pass' | 'extend' | 'fail' {
  if (words >= SPOT_FULL) return errors <= 1 ? 'pass' : 'fail';
  return errors === 0 ? 'pass' : errors === 1 ? 'extend' : 'fail';
}

export type TallyRow = { date: string; sheet: string; lang: string; words: number; errors: number; seed: string; note: string };

export function parseTally(csv: string): TallyRow[] {
  const [header, ...rows] = parseCsv(csv).filter((r) => r.some((f) => f !== ''));
  if (!header) return [];
  const at = (name: string) => header.indexOf(name);
  return rows.map((r) => ({
    date: r[at('date')] ?? '',
    sheet: r[at('sheet')] ?? '',
    lang: r[at('lang')] ?? '',
    words: Number(r[at('words')]),
    errors: Number(r[at('errors')]),
    seed: r[at('seed')] ?? '',
    note: r[at('note')] ?? '',
  }));
}

/** Rows are oldest first; whole entries are summed from the newest until their words reach 200 (or all of them). */
export function tallyStatus(rows: readonly TallyRow[], lang: string): { words: number; errors: number; full: boolean } {
  let words = 0;
  let errors = 0;
  for (const row of rows.filter((r) => r.lang === lang).reverse()) {
    if (words >= TALLY_WINDOW) break;
    words += row.words;
    errors += row.errors;
  }
  return { words, errors, full: errors > TALLY_ERRORS };
}
