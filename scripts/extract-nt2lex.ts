import { MAX_WORD_LENGTH, wordId, type Pos, type Word } from './validate.ts';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
type Level = (typeof LEVELS)[number];
const POS_BY_TAG: Record<string, Pos> = { 'N(soort)': 'noun', 'WW()': 'verb', 'ADJ()': 'adj' };
const MIN_FREQUENCY = 2;

export interface Candidate extends Word {
  frequency: number;
}

/**
 * Turns the NT2Lex TSV into candidate words: single-word common nouns, verbs and adjectives,
 * levelled at the first CEFR level where they occur at least twice (ADR-007).
 */
export function extractCandidates(tsv: string): Candidate[] {
  const [header, ...rows] = tsv.trim().split('\n');
  const columns = header.split('\t');
  const col = (name: string) => columns.indexOf(name);
  const best = new Map<string, Candidate>();

  for (const row of rows) {
    const cells = row.split('\t');
    const lemma = cells[col('word')].normalize('NFC').toLowerCase();
    const pos = POS_BY_TAG[cells[col('tag')]];
    if (!pos || !/^\p{L}+$/u.test(lemma) || Array.from(lemma).length > MAX_WORD_LENGTH) continue;

    const level = LEVELS.find((l) => Number(cells[col(`F@${l}`)]) >= MIN_FREQUENCY);
    if (!level) continue;
    const candidate: Candidate = {
      id: wordId(pos, lemma),
      lemma_nl: lemma,
      pos,
      cefr: level,
      source: 'nt2lex',
      frequency: Number(cells[col(`U@${level}`)]),
    };
    const existing = best.get(candidate.id);
    if (!existing || LEVELS.indexOf(level) < LEVELS.indexOf(existing.cefr as Level)) {
      best.set(candidate.id, candidate);
    }
  }
  return [...best.values()];
}

/**
 * Picks the most frequent candidates per level, skipping excluded ids (names, textbook-specific words
 * found in review); ties are broken by lemma for stable output.
 */
export function selectWords(
  candidates: Candidate[],
  counts: Partial<Record<Level, number>>,
  excluded: ReadonlySet<string> = new Set(),
  curated: Partial<Record<Level, string[]>> = {},
): Word[] {
  return LEVELS.flatMap((level) => {
    const pool = candidates.filter((c) => c.cefr === level && !excluded.has(c.id));
    const chosen = curated[level] ? pickCurated(pool, curated[level], level) : byFrequency(pool);
    return chosen
      .slice(0, counts[level] ?? 0)
      .map(({ id, lemma_nl, pos, cefr, source }) => ({ id, lemma_nl, pos, cefr, source }));
  });
}

function byFrequency(pool: Candidate[]): Candidate[] {
  return [...pool].sort((a, b) => b.frequency - a.frequency || a.lemma_nl.localeCompare(b.lemma_nl));
}

/**
 * Uses a hand-curated id list (chosen for everyday relevance) in its own order. Every id must be a
 * candidate of that level, so the level itself still comes from NT2Lex (ADR-007).
 */
function pickCurated(pool: Candidate[], ids: string[], level: Level): Candidate[] {
  const byId = new Map(pool.map((c) => [c.id, c]));
  const unknown = ids.filter((id) => !byId.has(id));
  if (unknown.length) throw new Error(`Not ${level} candidates: ${unknown.join(', ')}`);
  return ids.map((id) => byId.get(id)!);
}
