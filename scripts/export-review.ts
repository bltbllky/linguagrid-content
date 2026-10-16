import type { Content } from './validate.ts';

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
