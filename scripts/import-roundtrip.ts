import { parseCsv } from './import-review.ts';
import type { Content } from './validate.ts';

export interface RoundtripResult {
  content: Content;
  summary: { accepted: number; articles: number; human: number; left: number };
}

/**
 * Applies a round-trip result sheet (ADR-012): every row with verdict `OK` marks the language's
 * translation as reviewed by `roundtrip`, and for Turkish also the annotation when the word is not a
 * noun or `article_check` is `match`. Text is never changed, a human decision (`owner`, `reviewer`)
 * is never overwritten, and rows with any other verdict are left for a human.
 */
export function applyRoundtrip(content: Content, csv: string, lang = 'tr'): RoundtripResult {
  const [header, ...rows] = parseCsv(csv.replace(/^﻿/, ''));
  const idCol = header.indexOf('id');
  const verdictCol = header.indexOf('verdict');
  if (idCol < 0 || verdictCol < 0) throw new Error('Not a round-trip sheet; expected columns id and verdict');
  const articleCol = header.indexOf('article_check');

  const words = new Map(content.words.map((w) => [w.id, w]));
  const notes = new Map(content.annotations.map((a) => [a.word_id, { ...a }]));
  const file = content.translations[lang];
  const texts = new Map((file?.words ?? []).map((t) => [t.word_id, { ...t }]));
  const summary = { accepted: 0, articles: 0, human: 0, left: 0 };

  for (const row of rows) {
    const id = row[idCol];
    const word = words.get(id);
    if (!word) throw new Error(`Unknown word id in round-trip sheet: ${id}`);
    if ((row[verdictCol] ?? '').trim() !== 'OK') {
      summary.left++;
      continue;
    }
    const text = texts.get(id);
    if (!text) throw new Error(`${id}: no ${lang} text to accept`);
    if (text.review_source === 'owner' || text.review_source === 'reviewer') summary.human++;
    else {
      (text.reviewed = true), (text.review_source = 'roundtrip');
      summary.accepted++;
    }
    const note = notes.get(id);
    if (lang === 'tr' && note && (word.pos !== 'noun' || (row[articleCol] ?? '').trim() === 'match')) {
      if (note.review_source !== 'owner' && note.review_source !== 'reviewer') {
        (note.reviewed = true), (note.review_source = 'roundtrip');
        summary.articles++;
      }
    }
  }
  const translations = file ? { ...content.translations, [lang]: { ...file, words: [...texts.values()] } } : content.translations;
  return { content: { ...content, annotations: [...notes.values()], translations }, summary };
}
