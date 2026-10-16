import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { partialEnglish, validContent } from './fixtures/valid.ts';
import { applyReview, parseCsv } from './import-review.ts';

const header = 'id,dutch,article,turkish,category,decision';

describe('parseCsv', () => {
  it('parses quoted fields with commas, quotes and Windows line endings', () => {
    assert.deepEqual(parseCsv('a,b\r\n"x, ""y""",z\r\n'), [
      ['a', 'b'],
      ['x, "y"', 'z'],
    ]);
  });
});

describe('applyReview', () => {
  it('marks OK rows as reviewed and leaves empty decisions untouched', () => {
    const content = validContent();
    content.annotations[0].reviewed = false;
    content.translations.tr.words[0].reviewed = false;
    const result = applyReview(content, `${header}\nnoun-tandarts,,,,,OK\nverb-lopen,,,,,\n`);
    assert.equal(result.content.annotations[0].reviewed, true);
    assert.equal(result.content.annotations[1].reviewed, false);
    assert.deepEqual(result.content.translations.tr.words.map((t) => t.reviewed), [true, false]);
    assert.deepEqual(result.summary, { ok: 1, corrected: 0, removed: 0, pending: 1 });
  });

  it('applies corrected translations and articles, then marks them reviewed', () => {
    const result = applyReview(
      validContent(),
      `${header}\nnoun-tandarts,,,,,het; diş doktoru\nverb-lopen,,,,,yürümek (yaya)\n`,
    );
    const [noun, verb] = result.content.annotations;
    const [nounTr, verbTr] = result.content.translations.tr.words;
    assert.deepEqual([noun.article, nounTr.text, noun.reviewed, nounTr.reviewed], ['het', 'diş doktoru', true, true]);
    assert.deepEqual([verbTr.text, verb.reviewed, verbTr.reviewed], ['yürümek (yaya)', true, true]);
    assert.equal(result.summary.corrected, 2);
  });

  it('removes REMOVE rows from words and annotations and records them as excluded', () => {
    const result = applyReview(validContent(), `${header}\nverb-lopen,,,,,remove\n`);
    assert.deepEqual(
      result.content.words.map((w) => w.id),
      ['noun-tandarts'],
    );
    assert.equal(result.content.annotations.length, 1);
    assert.deepEqual(result.content.translations.tr.words.map((t) => t.word_id), ['noun-tandarts']);
    assert.deepEqual(result.excluded, [{ id: 'verb-lopen', reason: 'removed in review' }]);
  });

  it('leaves other language files untouched apart from removed words', () => {
    const content = validContent();
    content.translations.en = partialEnglish();
    const result = applyReview(content, `${header}\nnoun-tandarts,,,,,ev\n`);
    assert.deepEqual(result.content.translations.en, partialEnglish());
    const removed = applyReview(content, `${header}\nnoun-tandarts,,,,,REMOVE\n`);
    assert.deepEqual(removed.content.translations.en?.words, []);
  });

  it('rejects unknown ids', () => {
    assert.throws(() => applyReview(validContent(), `${header}\nnoun-ghost,,,,,OK\n`), /noun-ghost/);
  });
});
