import type { Content } from './validate.ts';

export const REVIEW_COLUMNS = ['id', 'dutch', 'article', 'turkish', 'category', 'decision'] as const;

const quote = (value: string) => (/[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value);

/**
 * Builds the review sheet for one CEFR level. The user fills `decision` with OK, a corrected
 * Turkish translation / article (e.g. "het | huis" or "ev"), or REMOVE; T-006 imports it.
 */
export function exportReview(content: Content, level: string): string {
  const { tr } = content.translations;
  const categories = new Map(tr.categories.map((c) => [c.category_id, c.title]));
  const notes = new Map(content.annotations.map((a) => [a.word_id, a]));
  const texts = new Map(tr.words.map((t) => [t.word_id, t]));
  const rows = content.words
    .filter((w) => w.cefr === level)
    .map((w) => {
      const note = notes.get(w.id);
      const text = texts.get(w.id);
      return [
        w.id,
        w.lemma_nl,
        note?.article ?? '',
        text?.text ?? '',
        categories.get(note?.category_id ?? '') ?? '',
        note?.reviewed && text?.reviewed ? 'OK' : '',
      ];
    });
  return [REVIEW_COLUMNS, ...rows].map((row) => row.map(quote).join(',')).join('\n') + '\n';
}
