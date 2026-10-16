import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { partialEnglish, validContent } from './fixtures/valid.ts';
import { applyReview, changedFiles, parseCsv } from './import-review.ts';

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

  it('rejects a sheet of another language', () => {
    assert.throws(() => applyReview(validContent(), `${enHeader}\nnoun-tandarts,,,,,,OK\n`), /tr review sheet/);
  });

  it('writes every data file for a Turkish review', () => {
    const files = Object.keys(changedFiles(applyReview(validContent(), `${header}\n`).content, 'tr'));
    assert.deepEqual(files, ['data/words.json', 'data/annotations.json', 'data/translations/tr.json']);
  });
});

const enHeader = 'id,dutch,article,turkish,english,category,decision';
/** The owner's fixture sheet `review/en/a1.csv`: one OK, one correction, one pending row. */
const enSheet = (rows: string[]) => [enHeader, ...rows].join('\n') + '\n';

describe('applyReview for another language', () => {
  const english = () => {
    const content = validContent();
    content.translations.en = {
      lang: 'en',
      words: [
        { word_id: 'noun-tandarts', text: 'dentist', reviewed: false },
        { word_id: 'verb-lopen', text: 'to run', reviewed: false },
      ],
      categories: [{ category_id: 'health', title: 'Health' }],
    };
    return content;
  };

  it('applies OKs and corrections only to the English file', () => {
    const before = english();
    const csv = enSheet(['noun-tandarts,tandarts,de,diş hekimi,dentist,Health,OK', 'verb-lopen,lopen,,yürümek,to run,Health,to walk']);
    const { content, excluded, summary } = applyReview(english(), csv, 'en');
    assert.deepEqual(content.translations.en?.words, [
      { word_id: 'noun-tandarts', text: 'dentist', reviewed: true },
      { word_id: 'verb-lopen', text: 'to walk', reviewed: true },
    ]);
    const { en: _en, ...others } = content.translations;
    const { en: _before, ...othersBefore } = before.translations;
    assert.deepEqual(others, othersBefore);
    assert.deepEqual([content.words, content.annotations, content.categories], [before.words, before.annotations, before.categories]);
    assert.deepEqual(excluded, []);
    assert.deepEqual(summary, { ok: 1, corrected: 1, removed: 0, pending: 0 });
    assert.deepEqual(Object.keys(changedFiles(content, 'en')), ['data/translations/en.json']);
  });

  it('leaves rows without a decision untouched, also after a byte order mark', () => {
    const { content, summary } = applyReview(english(), `\uFEFF${enSheet(['verb-lopen,,,,,,'])}`, 'en');
    assert.deepEqual(content.translations.en, english().translations.en);
    assert.equal(summary.pending, 1);
  });

  it('keeps semicolons and article-like words as part of the corrected text', () => {
    const csv = enSheet(['noun-tandarts,,,,,,"dentist; dental surgeon"', 'verb-lopen,,,,,,het']);
    const words = applyReview(english(), csv, 'en').content.translations.en?.words;
    assert.deepEqual(words?.map((w) => w.text), ['dentist; dental surgeon', 'het']);
  });

  it('adds a translation that was missing and creates the file if needed', () => {
    const { content } = applyReview(validContent(), enSheet(['verb-lopen,,,,,,to walk']), 'en');
    assert.deepEqual(content.translations.en, {
      lang: 'en',
      words: [{ word_id: 'verb-lopen', text: 'to walk', reviewed: true }],
      categories: [],
    });
  });

  it('rejects OK for a missing translation, REMOVE, unknown ids and a Turkish sheet', () => {
    assert.throws(() => applyReview(validContent(), enSheet(['verb-lopen,,,,,,OK']), 'en'), /verb-lopen: no en text/);
    assert.throws(() => applyReview(english(), enSheet(['verb-lopen,,,,,,REMOVE']), 'en'), /Turkish sheet/);
    assert.throws(() => applyReview(english(), enSheet(['noun-ghost,,,,,,ghost']), 'en'), /noun-ghost/);
    assert.throws(() => applyReview(english(), `${header}\nverb-lopen,,,,,OK\n`, 'en'), /en review sheet/);
  });
});
