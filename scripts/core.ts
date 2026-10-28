import type { Annotation, Content, TranslationFile, Word } from './validate.ts';

export interface OverlapRow {
  id: string;
  dutch: string;
  pos: Word['pos'];
  launch_level: string;
  core_level: string;
  class: 'kept' | 'level-move' | 'new' | 'retired';
}

const ORDER: OverlapRow['class'][] = ['kept', 'level-move', 'new', 'retired'];

/** One row per id of either list: how the own core selection relates to the NT2Lex launch words (ADR-022). */
export function overlapRows(launch: Word[], core: Word[]): OverlapRow[] {
  const launchById = new Map(launch.map((w) => [w.id, w]));
  const coreById = new Map(core.map((w) => [w.id, w]));
  const rows: OverlapRow[] = [];
  for (const id of new Set([...launchById.keys(), ...coreById.keys()])) {
    const a = launchById.get(id);
    const b = coreById.get(id);
    const word = (b ?? a)!;
    rows.push({
      id,
      dutch: word.lemma_nl,
      pos: word.pos,
      launch_level: a?.cefr ?? '',
      core_level: b?.cefr ?? '',
      class: !a ? 'new' : !b ? 'retired' : a.cefr === b.cefr ? 'kept' : 'level-move',
    });
  }
  return rows.sort((x, y) => ORDER.indexOf(x.class) - ORDER.indexOf(y.class) || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
}

/**
 * The annotations and texts that a core word inherits from the live NT2Lex word with the same id. The deprecated
 * `text_tr` is dropped; a level move keeps article and texts but must be reviewed again.
 */
export function carryOver(live: Content, core: Word[]): { annotations: Annotation[]; translations: Record<string, TranslationFile['words']> } {
  const nt2lex = new Map(live.words.filter((w) => w.source === 'nt2lex').map((w) => [w.id, w]));
  const kept = core.filter((w) => nt2lex.has(w.id));
  const moved = new Set(kept.filter((w) => nt2lex.get(w.id)!.cefr !== w.cefr).map((w) => w.id));
  const ids = new Set(kept.map((w) => w.id));
  const annotations = live.annotations
    .filter((a) => ids.has(a.word_id))
    .map(({ text_tr: _, ...a }): Annotation => {
      if (!moved.has(a.word_id)) return a;
      const { review_source: __, ...rest } = a;
      return { ...rest, reviewed: false };
    });
  const translations = Object.fromEntries(
    Object.entries(live.translations).map(([lang, f]) => [lang, f!.words.filter((t) => ids.has(t.word_id))]),
  );
  return { annotations, translations };
}
