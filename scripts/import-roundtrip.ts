import { parseCsv } from './import-review.ts';
import type { Content } from './validate.ts';
import type { SentenceStage } from './sentence-stage.ts';

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

const HUMAN = new Set(['owner', 'reviewer']);

/** A Dutch sentence row is reviewed (`roundtrip`) once its translation is reviewed in every shipped language; a human-reviewed row is kept. */
function withReviewedRows(stage: SentenceStage): SentenceStage {
  const langs = Object.values(stage.translations);
  const done = (id: string) => langs.length > 0 && langs.every((rows) => rows?.some((t) => t.word_id === id && t.reviewed));
  return {
    ...stage,
    rows: stage.rows.map((r) =>
      r.review_source && HUMAN.has(r.review_source) ? r : done(r.word_id) ? { ...r, reviewed: true, review_source: 'roundtrip' } : r,
    ),
  };
}

/**
 * Round-trip result for the sentence translations of `lang` (ADR-026 rule 6). A row is accepted (`reviewed: true`, `roundtrip`) only
 * when its verdict is `OK` and, if the sheet carries the pass classes `class` and `class_nl`, neither is a mismatch and they are not
 * both `close` (ADR-012 rule 5). Text is never changed and an owner or reviewer decision is never overwritten.
 */
export function applySentenceRoundtrip(
  stage: SentenceStage,
  csv: string,
  lang: string,
): { stage: SentenceStage; summary: { accepted: number; human: number; left: number } } {
  const [header, ...rows] = parseCsv(csv.replace(/^﻿/, ''));
  const [idCol, verdictCol, c1, c2] = ['id', 'verdict', 'class', 'class_nl'].map((c) => header.indexOf(c));
  if (idCol < 0 || verdictCol < 0) throw new Error('Not a round-trip sheet; expected columns id and verdict');
  const texts = new Map((stage.translations[lang] ?? []).map((t) => [t.word_id, { ...t }]));
  const summary = { accepted: 0, human: 0, left: 0 };
  for (const row of rows) {
    const passes = [c1, c2].filter((c) => c >= 0).map((c) => (row[c] ?? '').trim());
    const agree = passes.every((p) => p === 'match' || p === 'close') && !(passes.length === 2 && passes[0] === 'close' && passes[1] === 'close');
    if ((row[verdictCol] ?? '').trim() !== 'OK' || !agree) {
      summary.left++;
      continue;
    }
    const text = texts.get(row[idCol]);
    if (!text) throw new Error(`${row[idCol]}: no ${lang} text to accept`);
    if (text.review_source && HUMAN.has(text.review_source)) summary.human++;
    else (text.reviewed = true), (text.review_source = 'roundtrip'), summary.accepted++;
  }
  return { stage: withReviewedRows({ ...stage, translations: { ...stage.translations, [lang]: [...texts.values()] } }), summary };
}
