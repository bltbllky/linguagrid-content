import type { Pos } from './validate.ts';

const KAIKKI_POS: Record<string, Pos> = { noun: 'noun', verb: 'verb', adj: 'adj' };
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
  let pluralOnly = false;
  for (const t of entry.head_templates ?? []) {
    const first = t.name === 'nl-noun' ? t.args?.['1']?.[0] : undefined;
    if (first === 'p') pluralOnly = true;
    else if (first && GENDER_LETTERS.includes(first)) genders.add(first);
  }
  const fresh: Lemma = {
    word,
    pos,
    tags: tags ?? new Set(),
    genders,
    reflexiveOnly: pos === 'verb' && senses.length > 0 && senses.every((s) => s.tags?.includes('reflexive')),
    pluralOnly,
  };
  const key = `${pos}:${word}`;
  const old = index.lemmas.get(key);
  if (old) {
    old.tags = new Set([...old.tags].filter((t) => fresh.tags.has(t)));
    for (const g of fresh.genders) old.genders.add(g);
    old.reflexiveOnly ||= fresh.reflexiveOnly;
    old.pluralOnly ||= fresh.pluralOnly;
  } else {
    index.lemmas.set(key, fresh);
  }
}

export function readKaikki(lines: Iterable<string>): KaikkiIndex {
  const index = emptyKaikkiIndex();
  for (const line of lines) addKaikkiLine(index, line);
  return index;
}

/** Sums surface-form counts per lemma word; a form with several targets is split equally. */
export function lemmaCounts(forms: Map<string, number>, index: KaikkiIndex): Map<string, number> {
  const lemmaWords = new Set([...index.lemmas.values()].map((l) => l.word));
  const counts = new Map<string, number>();
  const add = (word: string, n: number) => counts.set(word, (counts.get(word) ?? 0) + n);
  for (const [form, n] of forms) {
    if (lemmaWords.has(form)) {
      add(form, n);
      continue;
    }
    const targets = [...(index.formOf.get(form) ?? [])].filter((t) => lemmaWords.has(t));
    for (const t of targets) add(t, n / targets.length);
  }
  return counts;
}

/** Rank 1 = highest count; ties alphabetical. */
export function lemmaRanks(counts: Map<string, number>): Map<string, number> {
  const sorted = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return new Map(sorted.map(([word], i) => [word, i + 1]));
}
