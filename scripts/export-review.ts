import type { Content } from './validate.ts';
import type { SentenceStage } from './sentence-stage.ts';

export const REVIEW_COLUMNS = ['id', 'dutch', 'article', 'turkish', 'category', 'decision'] as const;

const LANGUAGE_NAMES: Record<string, string> = { en: 'english', ar: 'arabic' };

/** Columns of a review sheet; another language adds its own column after the Turkish context. */
export function reviewColumns(lang: string): string[] {
  if (lang === 'tr') return [...REVIEW_COLUMNS];
  return ['id', 'dutch', 'article', 'turkish', LANGUAGE_NAMES[lang] ?? lang, 'category', 'decision'];
}

const quote = (value: string) => (/[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value);

/**
 * Builds the review sheet for one CEFR level. For Turkish the user fills `decision` with OK, a
 * corrected Turkish translation / article (e.g. "het; huis" or "ev"), or REMOVE. For another
 * language (ADR-011) the Turkish text is context only and `decision` is OK or the corrected text;
 * the category title is shown in that language when it has one. `import-review` reads it back.
 */
export function exportReview(content: Content, level: string, lang = 'tr'): string {
  const { tr } = content.translations;
  const target = content.translations[lang];
  const categories = new Map(tr.categories.map((c) => [c.category_id, c.title]));
  for (const c of lang === 'tr' ? [] : (target?.categories ?? [])) categories.set(c.category_id, c.title);
  const notes = new Map(content.annotations.map((a) => [a.word_id, a]));
  const texts = new Map(tr.words.map((t) => [t.word_id, t]));
  const others = new Map((target?.words ?? []).map((t) => [t.word_id, t]));
  const rows = content.words
    .filter((w) => w.cefr === level.toUpperCase())
    .map((w) => {
      const note = notes.get(w.id);
      const text = texts.get(w.id);
      const category = categories.get(note?.category_id ?? '') ?? '';
      const base = [w.id, w.lemma_nl, note?.article ?? '', text?.text ?? ''];
      if (lang === 'tr') return [...base, category, note?.reviewed && text?.reviewed ? 'OK' : ''];
      const other = others.get(w.id);
      return [...base, other?.text ?? '', category, other?.reviewed ? 'OK' : ''];
    });
  return [reviewColumns(lang), ...rows].map((row) => row.map(quote).join(',')).join('\n') + '\n';
}

const PIVOT: Record<string, { lang: string; column: string }> = { tr: { lang: 'en', column: 'english' }, en: { lang: 'tr', column: 'turkish' } };
const csvOf = (rows: string[][]) => rows.map((row) => row.map(quote).join(',')).join('\n') + '\n';

/**
 * The two blind-pass sheets of ADR-012 for the sentences of one level and language: `dutch` (the Dutch sentence only) and `pivot`
 * (the Dutch sentence and the other language's text: English for Turkish, Turkish for English). The text under test is never in them.
 */
export function sentenceBlindSheets(stage: SentenceStage, level: string, lang: string, levelOf: (wordId: string) => string | undefined) {
  const pivot = PIVOT[lang];
  if (!pivot) throw new Error(`No pivot language for ${lang}`);
  const pivotText = new Map((stage.translations[pivot.lang] ?? []).map((t) => [t.word_id, t.text]));
  const rows = stage.rows.filter((r) => levelOf(r.word_id) === level.toUpperCase());
  return {
    dutch: csvOf([['id', 'dutch'], ...rows.map((r) => [r.word_id, r.nl])]),
    pivot: csvOf([['id', 'dutch', pivot.column], ...rows.map((r) => [r.word_id, r.nl, pivotText.get(r.word_id) ?? ''])]),
  };
}

/** The owner's sheet of flagged sentence rows (ADR-019 routing): one row per flagged word id and language, `decision` is OK or the corrected text. */
export function sentenceOwnerSheet(
  stage: SentenceStage,
  level: string,
  levelOf: (wordId: string) => string | undefined,
  flagged: Record<string, ReadonlySet<string>>,
): string {
  const text = (lang: string, id: string) => (stage.translations[lang] ?? []).find((t) => t.word_id === id)?.text ?? '';
  const rows = Object.entries(flagged).flatMap(([lang, ids]) =>
    stage.rows
      .filter((r) => ids.has(r.word_id) && levelOf(r.word_id) === level.toUpperCase())
      .map((r) => [r.word_id, lang, r.nl, text('tr', r.word_id), text('en', r.word_id), '']),
  );
  return csvOf([['id', 'lang', 'dutch', 'turkish', 'english', 'decision'], ...rows]);
}
