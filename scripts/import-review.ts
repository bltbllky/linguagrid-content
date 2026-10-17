import { reviewColumns } from './export-review.ts';
import { type Content, withLegacyTurkish } from './validate.ts';

export interface ReviewResult {
  content: Content;
  excluded: { id: string; reason: string }[];
  summary: { ok: number; corrected: number; removed: number; pending: number };
}

/** Minimal RFC 4180 CSV parser (quoted fields, doubled quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') row.push(field), (field = '');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field), rows.push(row), (row = []), (field = '');
    } else field += ch;
  }
  if (field || row.length) row.push(field), rows.push(row);
  return rows;
}

/**
 * Applies the owner's review sheet. Decision values: `OK`, `REMOVE`, or corrections separated by
 * ";" — `de` / `het` fixes the article, any other text replaces the Turkish translation. OK and
 * corrections mark both the annotation and the Turkish translation as reviewed and record who decided
 * (`review_source`, ADR-012); other languages are only touched to drop removed words. A sheet of another language (`lang`) goes to `applyLanguageReview`.
 */
export function applyReview(
  content: Content,
  csv: string,
  lang = 'tr',
  source: 'owner' | 'reviewer' = 'owner',
): ReviewResult {
  // Spreadsheet apps may save a UTF-8 byte order mark in front of the header.
  const [header, ...rows] = parseCsv(csv.replace(/^\uFEFF/, ''));
  if (header.join() !== reviewColumns(lang).join()) {
    throw new Error(`Not a ${lang} review sheet; expected columns ${reviewColumns(lang).join(',')}`);
  }
  if (lang !== 'tr') return applyLanguageReview(content, rows, lang, source);
  const idCol = header.indexOf('id');
  const decisionCol = header.indexOf('decision');
  const notes = new Map(content.annotations.map((a) => [a.word_id, { ...a }]));
  const texts = new Map(content.translations.tr.words.map((t) => [t.word_id, { ...t }]));
  const removed = new Set<string>();
  const summary = { ok: 0, corrected: 0, removed: 0, pending: 0 };

  for (const row of rows) {
    const id = row[idCol];
    const decision = (row[decisionCol] ?? '').trim();
    const note = notes.get(id);
    const text = texts.get(id);
    if (!note || !text) throw new Error(`Unknown word id in review: ${id}`);
    if (!decision) summary.pending++;
    else if (decision.toUpperCase() === 'OK') (note.reviewed = text.reviewed = true), (note.review_source = text.review_source = source), summary.ok++;
    else if (decision.toUpperCase() === 'REMOVE') removed.add(id), summary.removed++;
    else {
      for (const part of decision.split(';').map((p) => p.trim())) {
        if (part === 'de' || part === 'het') note.article = part;
        else if (part) text.text = part;
      }
      note.reviewed = text.reviewed = true;
      note.review_source = text.review_source = source;
      summary.corrected++;
    }
  }
  const keep = <T extends { word_id: string }>(list: T[]) => list.filter((t) => !removed.has(t.word_id));
  const translations = Object.fromEntries(
    Object.entries({ ...content.translations, tr: { ...content.translations.tr, words: [...texts.values()] } })
      .map(([lang, file]) => [lang, file && { ...file, words: keep(file.words) }]),
  ) as Content['translations'];
  return {
    content: {
      ...content,
      words: content.words.filter((w) => !removed.has(w.id)),
      annotations: keep([...notes.values()]),
      translations,
    },
    excluded: [...removed].map((id) => ({ id, reason: 'removed in review' })),
    summary,
  };
}

/**
 * Applies a review sheet of a language other than Turkish (ADR-011). `OK` marks the existing text as
 * reviewed; any other decision is the corrected text, taken as written. Only
 * `data/translations/<lang>.json` changes: articles, categories and Turkish texts are never touched,
 * and REMOVE belongs in the Turkish sheet.
 */
function applyLanguageReview(
  content: Content,
  rows: string[][],
  lang: string,
  source: 'owner' | 'reviewer',
): ReviewResult {
  const known = new Set(content.words.map((w) => w.id));
  const file = content.translations[lang] ?? { lang, words: [], categories: [] };
  const texts = new Map(file.words.map((t) => [t.word_id, { ...t }]));
  const summary = { ok: 0, corrected: 0, removed: 0, pending: 0 };
  const decisionCol = reviewColumns(lang).indexOf('decision');
  for (const row of rows) {
    const [id, decision = ''] = [row[0], row[decisionCol]?.trim()];
    if (!known.has(id)) throw new Error(`Unknown word id in review: ${id}`);
    const text = texts.get(id);
    if (!decision) summary.pending++;
    else if (decision.toUpperCase() === 'REMOVE') throw new Error(`${id}: REMOVE words in the Turkish sheet`);
    else if (decision.toUpperCase() === 'OK') {
      if (!text) throw new Error(`${id}: no ${lang} text to approve`);
      text.reviewed = true;
      text.review_source = source;
      summary.ok++;
    } else {
      texts.set(id, { word_id: id, text: decision, reviewed: true, review_source: source });
      summary.corrected++;
    }
  }
  const translations = { ...content.translations, [lang]: { ...file, words: [...texts.values()] } };
  return { content: { ...content, translations }, excluded: [], summary };
}

/** The data files to write after a review of `lang`, keyed by path relative to the repository root. */
export function changedFiles(content: Content, lang: string): Record<string, unknown> {
  if (lang !== 'tr') return { [`data/translations/${lang}.json`]: content.translations[lang] };
  const files: Record<string, unknown> = {
    'data/words.json': content.words,
    // The deprecated text_tr / title_tr copies stay until the app reads data/translations (T-034).
    'data/annotations.json': withLegacyTurkish(content).annotations,
  };
  for (const [code, file] of Object.entries(content.translations)) files[`data/translations/${code}.json`] = file;
  return files;
}
