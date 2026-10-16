import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { partialEnglish, validContent } from './fixtures/valid.ts';
import { exportReview, reviewColumns } from './export-review.ts';

describe('exportReview', () => {
  it('lists the words of one level with article, translation, category and decision', () => {
    const csv = exportReview(validContent(), 'A1');
    assert.equal(
      csv,
      [
        'id,dutch,article,turkish,category,decision',
        'noun-tandarts,tandarts,de,diş hekimi,Sağlık,OK',
        'verb-lopen,lopen,,yürümek,Sağlık,',
        '',
      ].join('\n'),
    );
  });

  it('quotes values containing commas or quotes and skips other levels', () => {
    const content = validContent();
    content.translations.tr.words[0].text = 'kart, "harita"';
    content.words[1].cefr = 'A2';
    const lines = exportReview(content, 'A1').trim().split('\n');
    assert.equal(lines.length, 2);
    assert.equal(lines[1], 'noun-tandarts,tandarts,de,"kart, ""harita""",Sağlık,OK');
  });

  it('leaves fields empty for words without annotations', () => {
    const content = validContent();
    content.annotations = [];
    content.translations.tr.words = [];
    assert.equal(exportReview(content, 'A1').split('\n')[1], 'noun-tandarts,tandarts,,,,');
  });

  it('accepts a lower-case level', () => {
    assert.equal(exportReview(validContent(), 'a1'), exportReview(validContent(), 'A1'));
  });
});

describe('exportReview for another language', () => {
  it('adds the language column after the Turkish context and leaves unreviewed decisions empty', () => {
    const content = validContent();
    content.translations.en = { ...partialEnglish(), categories: [{ category_id: 'health', title: 'Health' }] };
    assert.equal(
      exportReview(content, 'A1', 'en'),
      [
        'id,dutch,article,turkish,english,category,decision',
        'noun-tandarts,tandarts,de,diş hekimi,dentist,Health,OK',
        'verb-lopen,lopen,,yürümek,,Health,',
        '',
      ].join('\n'),
    );
  });

  it('falls back to the Turkish category title and ignores the article review state', () => {
    const content = validContent();
    content.annotations[0].reviewed = false;
    content.translations.en = partialEnglish();
    assert.equal(exportReview(content, 'A1', 'en').split('\n')[1], 'noun-tandarts,tandarts,de,diş hekimi,dentist,Sağlık,OK');
  });

  it('exports empty texts when the language file does not exist yet', () => {
    assert.equal(exportReview(validContent(), 'A1', 'en').split('\n')[2], 'verb-lopen,lopen,,yürümek,,Sağlık,');
  });

  it('names unknown languages by their code', () => {
    assert.deepEqual(reviewColumns('ar'), ['id', 'dutch', 'article', 'turkish', 'arabic', 'category', 'decision']);
    assert.equal(reviewColumns('xx')[4], 'xx');
    assert.deepEqual(reviewColumns('tr'), ['id', 'dutch', 'article', 'turkish', 'category', 'decision']);
  });
});
