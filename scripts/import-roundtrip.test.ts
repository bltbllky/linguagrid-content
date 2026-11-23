import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { partialEnglish, validContent } from './fixtures/valid.ts';
import { applyRoundtrip, applySentenceRoundtrip } from './import-roundtrip.ts';
import type { SentenceStage } from './sentence-stage.ts';
import type { Content } from './validate.ts';

/** The fixture with nothing reviewed yet. */
function fresh(): Content {
  const content = validContent();
  for (const note of content.annotations) (note.reviewed = false), delete note.review_source;
  for (const text of content.translations.tr.words) (text.reviewed = false), delete text.review_source;
  return content;
}
const sheet = (...rows: string[]) => ['id,verdict,article_check', ...rows].join('\n') + '\n';

describe('applyRoundtrip', () => {
  it('accepts the translation and the annotation of an OK noun whose article matched', () => {
    const { content, summary } = applyRoundtrip(fresh(), sheet('noun-tandarts,OK,match'));
    assert.deepEqual(content.translations.tr.words[0], { word_id: 'noun-tandarts', text: 'diş hekimi', reviewed: true, review_source: 'roundtrip' });
    assert.deepEqual([content.annotations[0].reviewed, content.annotations[0].review_source], [true, 'roundtrip']);
    assert.deepEqual(summary, { accepted: 1, articles: 1, human: 0, left: 0 });
  });

  it('accepts only the translation when the article check disagrees or is empty for a noun', () => {
    for (const check of ['mismatch (blind de, stored het)', '']) {
      const { content, summary } = applyRoundtrip(fresh(), sheet(`noun-tandarts,OK,"${check}"`));
      assert.equal(content.translations.tr.words[0].review_source, 'roundtrip');
      assert.deepEqual(content.annotations, fresh().annotations);
      assert.deepEqual(summary, { accepted: 1, articles: 0, human: 0, left: 0 });
    }
  });

  it('accepts the annotation of a word that is not a noun', () => {
    const { content } = applyRoundtrip(fresh(), sheet('verb-lopen,OK,'));
    assert.equal(content.translations.tr.words[1].review_source, 'roundtrip');
    assert.deepEqual([content.annotations[1].reviewed, content.annotations[1].review_source], [true, 'roundtrip']);
  });

  it('leaves every other verdict untouched', () => {
    const input = fresh();
    const { content, summary } = applyRoundtrip(input, sheet('noun-tandarts,owner,match', 'verb-lopen,,'));
    assert.deepEqual(content, fresh());
    assert.deepEqual(summary, { accepted: 0, articles: 0, human: 0, left: 2 });
  });

  it('never changes a human decision, and tolerates spaces around OK', () => {
    const input = fresh();
    Object.assign(input.translations.tr.words[0], { reviewed: true, review_source: 'owner' });
    Object.assign(input.annotations[0], { reviewed: true, review_source: 'reviewer' });
    const before = structuredClone(input);
    const { content, summary } = applyRoundtrip(input, sheet('noun-tandarts, OK ,match'));
    assert.deepEqual(content, before);
    assert.deepEqual(summary, { accepted: 0, articles: 0, human: 1, left: 0 });
    assert.deepEqual(input, before);
  });

  it('changes only the English file for another language', () => {
    const input = fresh();
    input.translations.en = partialEnglish();
    Object.assign(input.translations.en.words[0], { reviewed: false });
    delete input.translations.en.words[0].review_source;
    const { content } = applyRoundtrip(input, sheet('noun-tandarts,OK,match'), 'en');
    assert.deepEqual(content.translations.en?.words[0], { word_id: 'noun-tandarts', text: 'dentist', reviewed: true, review_source: 'roundtrip' });
    assert.deepEqual(content.annotations, input.annotations);
    assert.deepEqual(content.translations.tr, input.translations.tr);
  });

  it('rejects unknown ids, missing texts and other sheets', () => {
    assert.throws(() => applyRoundtrip(fresh(), sheet('noun-ghost,OK,match')), /Unknown word id in round-trip sheet: noun-ghost/);
    assert.throws(() => applyRoundtrip(fresh(), sheet('verb-lopen,OK,'), 'en'), /verb-lopen: no en text to accept/);
    assert.throws(() => applyRoundtrip(fresh(), 'id,decision\nverb-lopen,OK\n'), /Not a round-trip sheet; expected columns id and verdict/);
  });

  it('reads a pilot-shaped sheet with a byte order mark, quoted fields and extra columns', () => {
    const csv = '﻿id,dutch,en,tr_existing,tr_blind,class,reason,tr_blind_nl,class_nl,article_check,verdict\r\n'
      + 'noun-tandarts,tandarts,dentist,"diş hekimi","diş hekimi, doktor",match,"same, sense",diş hekimi,match,match,OK\r\n'
      + 'verb-lopen,lopen,to walk,yürümek,koşmak,mismatch,"different ""sense""",koşmak,mismatch,,owner\r\n';
    const { content, summary } = applyRoundtrip(fresh(), csv);
    assert.deepEqual(content.translations.tr.words.map((t) => t.review_source), ['roundtrip', undefined]);
    assert.deepEqual(summary, { accepted: 1, articles: 1, human: 0, left: 1 });
  });

  it('gives the same content when the same sheet is applied twice', () => {
    const csv = sheet('noun-tandarts,OK,match', 'verb-lopen,OK,');
    const once = applyRoundtrip(fresh(), csv).content;
    assert.deepEqual(applyRoundtrip(once, csv).content, once);
  });
});

describe('applySentenceRoundtrip', () => {
  const stage = (): SentenceStage => ({
    rows: [],
    translations: { tr: [
      { word_id: 'a', text: 'x', reviewed: false },
      { word_id: 'b', text: 'y', reviewed: true, review_source: 'owner' },
      { word_id: 'c', text: 'z', reviewed: false },
    ] },
  });
  const csv = (...rows: string[]) => ['id,class,class_nl,verdict', ...rows].join('\n') + '\n';

  it('accepts when both passes accept; a one-pass reject leaves the flag false', () => {
    const { stage: out, summary } = applySentenceRoundtrip(stage(), csv('a,match,close,OK', 'c,match,mismatch,OK'), 'tr');
    assert.deepEqual(out.translations.tr?.[0], { word_id: 'a', text: 'x', reviewed: true, review_source: 'roundtrip' });
    assert.equal(out.translations.tr?.[2].reviewed, false);
    assert.deepEqual(summary, { accepted: 1, human: 0, left: 1 });
  });

  it('a row that is not OK stays false, and an owner decision is never overwritten', () => {
    const { stage: out, summary } = applySentenceRoundtrip(stage(), csv('a,match,match,owner', 'b,match,match,OK'), 'tr');
    assert.equal(out.translations.tr?.[0].reviewed, false);
    assert.deepEqual(out.translations.tr?.[1], { word_id: 'b', text: 'y', reviewed: true, review_source: 'owner' });
    assert.deepEqual(summary, { accepted: 0, human: 1, left: 1 });
  });

  it('rejects two close passes, unknown ids and foreign sheets, and does not mutate its input', () => {
    const input = stage();
    assert.equal(applySentenceRoundtrip(input, csv('a,close,close,OK'), 'tr').summary.accepted, 0);
    assert.throws(() => applySentenceRoundtrip(input, csv('zzz,match,match,OK'), 'tr'), /no tr text to accept/);
    assert.throws(() => applySentenceRoundtrip(input, 'id,x\na,1\n', 'tr'), /Not a round-trip sheet/);
    assert.deepEqual(input, stage());
  });
});

describe('applySentenceRoundtrip marks the Dutch row', () => {
  const row = (extra = {}) => ({ word_id: 'a', nl: 'Ik woon in een huis.', form: 'huis', distractors: ['x', 'y', 'z'], reviewed: false, ...extra });
  const tr = (reviewed: boolean) => ({ word_id: 'a', text: 't', reviewed });
  const csv = 'id,verdict\na,OK\n';

  it('is reviewed by roundtrip when both languages are accepted', () => {
    const { stage } = applySentenceRoundtrip({ rows: [row()], translations: { tr: [tr(false)], en: [tr(true)] } }, csv, 'tr');
    assert.deepEqual([stage.rows[0].reviewed, stage.rows[0].review_source], [true, 'roundtrip']);
  });

  it('a tr-only stage cannot mark the Dutch row', () => {
    const { stage } = applySentenceRoundtrip({ rows: [row()], translations: { tr: [tr(false)] } }, csv, 'tr');
    assert.equal(stage.translations.tr?.[0].reviewed, true);
    assert.equal(stage.rows[0].reviewed, false);
  });

  it('stays false while one language is not accepted, and an owner row is kept', () => {
    const one = applySentenceRoundtrip({ rows: [row()], translations: { tr: [tr(false)], en: [tr(false)] } }, csv, 'tr');
    assert.equal(one.stage.rows[0].reviewed, false);
    const owned = row({ reviewed: true, review_source: 'owner' });
    const kept = applySentenceRoundtrip({ rows: [owned], translations: { tr: [tr(false)], en: [tr(true)] } }, csv, 'tr');
    assert.deepEqual(kept.stage.rows[0], owned);
  });
});
