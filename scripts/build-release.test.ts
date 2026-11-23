import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';

import { partialEnglish, validContent } from './fixtures/valid.ts';
import { RELEASED_LEVELS, RELEASE_MINIMUMS, buildRelease } from './build-release.ts';
import { validateContent, withLegacyTurkish } from './validate.ts';
import type { Content } from './validate.ts';

/** Fixture with both words released in Turkish; English covers `englishReviewed` of them. */
function bilingual(englishReviewed: string[]): Content {
  const content = validContent();
  content.annotations[1].reviewed = true;
  content.translations.tr.words[1].reviewed = true;
  content.translations.en = {
    lang: 'en',
    words: [
      { word_id: 'noun-tandarts', text: 'dentist', reviewed: englishReviewed.includes('noun-tandarts') },
      { word_id: 'verb-lopen', text: 'to walk', reviewed: englishReviewed.includes('verb-lopen') },
    ],
    categories: [{ category_id: 'health', title: 'Health' }],
  };
  return content;
}
const both = ['noun-tandarts', 'verb-lopen'];

/** The fixtures are NT2Lex rows, so these tests build with the block off; the block itself is tested first. */
const build: typeof buildRelease = (content, options) => buildRelease(content, { nt2lexRetired: false, ...options });

function b1Content() {
  const content = validContent();
  content.words[0].cefr = 'B1';
  return content;
}

describe('buildRelease', () => {
  it('blocks NT2Lex-derived words once NT2Lex is retired, and only then (US-023)', () => {
    const opts = { minimums: {}, allowPartial: true };
    assert.throws(() => buildRelease(validContent(), { ...opts, nt2lexRetired: true }), /Release blocked — 2 NT2Lex-derived words \(US-023\)/);
    assert.doesNotThrow(() => buildRelease(validContent(), { ...opts, nt2lexRetired: false }));
    assert.throws(() => buildRelease(validContent(), opts), /Release blocked — 2 NT2Lex-derived words/); // retired by default since release 3
  });

  it('blocks a live C1 word, with or without --allow-partial', () => {
    const content = validContent();
    content.words[0].cefr = 'C1';
    for (const allowPartial of [false, true]) {
      assert.throws(() => build(content, { minimums: {}, allowPartial }), /live word files hold C1 words \(1\)/);
    }
  });

  describe('B2 (T-359)', () => {
    it('pins the released levels and the real minimums', () => {
      assert.deepEqual(RELEASED_LEVELS, ['A1', 'A2', 'B1', 'B2']);
      assert.deepEqual(RELEASE_MINIMUMS, { A1: 400, A2: 600, B1: 600, B2: 1000 });
    });

    const b2Content = () => {
      const content = validContent();
      content.words[0].cefr = 'B2';
      return content;
    };

    it('releases a reviewed B2 word', () => {
      const release = build(b2Content(), { minimums: { A1: 0, A2: 0, B1: 0, B2: 1 }, allowPartial: false });
      assert.ok(JSON.parse(release.files['words.json']).some((w: { id: string }) => w.id === 'noun-tandarts'));
    });

    it('stops under the B2 minimum unless --allow-partial', () => {
      assert.throws(() => build(b2Content(), { minimums: { B2: 2 }, allowPartial: false }), /B2: 1 reviewed words \(minimum 2\)/);
      assert.doesNotThrow(() => build(b2Content(), { minimums: { B2: 2 }, allowPartial: true }));
    });

    it('leaves out a language whose B2 text is unreviewed', () => {
      const content = b2Content();
      content.translations.en = {
        lang: 'en',
        words: [{ word_id: 'noun-tandarts', text: 'dentist', reviewed: false }],
        categories: [{ category_id: 'health', title: 'Health' }],
      };
      const release = build(content, { minimums: { B2: 1 }, allowPartial: false });
      assert.equal(release.excluded.length, 1);
      assert.ok(release.excluded[0].startsWith('en:'));
      assert.deepEqual(release.manifest.languages, ['tr']);
    });
  });

  it('releases a reviewed B1 word (US-022)', () => {
    const release = build(b1Content(), { minimums: { A1: 0, A2: 0, B1: 1 }, allowPartial: false });
    assert.ok(JSON.parse(release.files['words.json']).some((w: { id: string }) => w.id === 'noun-tandarts'));
  });

  it('stops under the B1 minimum unless --allow-partial', () => {
    assert.throws(() => build(b1Content(), { minimums: { B1: 2 }, allowPartial: false }), /B1: 1 reviewed words \(minimum 2\)/);
    assert.doesNotThrow(() => build(b1Content(), { minimums: { B1: 2 }, allowPartial: true }));
  });

  it('leaves out a language whose B1 text is not reviewed', () => {
    const content = b1Content();
    content.translations.en = { ...partialEnglish(), words: [{ word_id: 'noun-tandarts', text: 'dentist', reviewed: false }] };
    const release = build(content, { minimums: { B1: 1 }, allowPartial: false });
    assert.equal(release.excluded.filter((e) => e.startsWith('en:')).length, 1);
    assert.deepEqual(release.manifest.languages, ['tr']);
  });

  it('includes only reviewed words and bumps the content version', () => {
    const release = build(validContent(), { minimums: {}, allowPartial: false });
    assert.equal(release.manifest.content_version, 2);
    assert.deepEqual(
      JSON.parse(release.files['words.json']).map((w: { id: string }) => w.id),
      ['noun-tandarts'],
    );
    assert.equal(JSON.parse(release.files['annotations.json']).length, 1);
  });

  it('lists every file with its sha256 under the versioned release path', () => {
    const release = build(validContent(), { minimums: {}, allowPartial: false });
    assert.deepEqual(
      release.manifest.files.map((f) => f.path),
      ['release/2/words.json', 'release/2/annotations.json', 'release/2/categories.json', 'release/2/translations-tr.json'],
    );
    assert.ok(release.manifest.files.every((f) => /^[0-9a-f]{64}$/.test(f.sha256)));
  });

  it('ships the pre-T-029 shape with Turkish texts and needs a reviewed Turkish translation', () => {
    const content = validContent();
    const release = build(content, { minimums: {}, allowPartial: false });
    assert.equal(release.files['annotations.json'], JSON.stringify([{ ...withLegacyTurkish(content).annotations[0], review_source: undefined }], null, 2) + '\n');
    assert.deepEqual(JSON.parse(release.files['categories.json']), [{ id: 'health', title_tr: 'Sağlık', cefr: 'A1', order: 1 }]);
    content.translations.tr.words[0].reviewed = false;
    assert.equal(build(content, { minimums: {}, allowPartial: false }).files['words.json'], '[]\n');
  });

  it('never ships review_source', () => {
    const content = bilingual(both);
    content.annotations[1].reviewed = true;
    content.annotations[1].review_source = 'roundtrip';
    content.translations.tr.words[1].review_source = 'roundtrip';
    const release = build(content, { minimums: {}, allowPartial: false });
    assert.equal(Object.keys(release.files).length, 5);
    assert.ok(!Object.values(release.files).some((body) => body.includes('review_source')));
  });

  it('keeps min_app_version untouched', () => {
    const content = validContent();
    content.manifest.min_app_version = { ios: '1.2.0', android: '1.3.0' };
    const release = build(content, { minimums: {}, allowPartial: false });
    assert.deepEqual(release.manifest.min_app_version, { ios: '1.2.0', android: '1.3.0' });
  });

  it('fails below the minimum reviewed words per level unless partial releases are allowed', () => {
    const options = { minimums: { A1: 400 }, allowPartial: false };
    assert.throws(() => build(validContent(), options), /A1: 1 reviewed words \(minimum 400\)/);
    assert.doesNotThrow(() => build(validContent(), { ...options, allowPartial: true }));
  });

  it('writes one translation file per language with reviewed texts of released words only', () => {
    const content = bilingual(both);
    content.annotations[1].reviewed = false; // verb-lopen is not released, so no language ships it
    const release = build(content, { minimums: { A1: 1 }, allowPartial: false });
    assert.deepEqual(JSON.parse(release.files['translations-tr.json']), {
      lang: 'tr',
      words: [{ word_id: 'noun-tandarts', text: 'diş hekimi' }],
      categories: [{ category_id: 'health', title: 'Sağlık' }],
    });
    assert.deepEqual(JSON.parse(release.files['translations-en.json']), {
      lang: 'en',
      words: [{ word_id: 'noun-tandarts', text: 'dentist' }],
      categories: [{ category_id: 'health', title: 'Health' }],
    });
  });

  it('lists a fully reviewed language in the manifest with a checksum for every file', () => {
    const release = build(bilingual(both), { minimums: { A1: 2 }, allowPartial: false });
    assert.deepEqual(release.manifest.languages, ['tr', 'en']);
    assert.deepEqual(release.excluded, []);
    assert.deepEqual(Object.keys(release.files), [
      'words.json', 'annotations.json', 'categories.json', 'translations-tr.json', 'translations-en.json',
    ]);
    for (const { path, sha256 } of release.manifest.files) {
      const body = release.files[path.replace('release/2/', '')];
      assert.equal(sha256, createHash('sha256').update(body).digest('hex'), path);
    }
    assert.deepEqual(validateContent({ ...validContent(), manifest: release.manifest }), []);
  });

  it('leaves out a partly reviewed language unless partial releases are allowed', () => {
    const strict = build(bilingual(['noun-tandarts']), { minimums: { A1: 2 }, allowPartial: false });
    assert.deepEqual(strict.manifest.languages, ['tr']);
    assert.equal(strict.files['translations-en.json'], undefined);
    assert.deepEqual(strict.excluded, ['en: A1: 1 reviewed translations (minimum 2)']);
    assert.ok(strict.manifest.files.every((f) => !f.path.includes('translations-en')));

    const partial = build(bilingual(['noun-tandarts']), { minimums: { A1: 2 }, allowPartial: true });
    assert.deepEqual(partial.manifest.languages, ['tr', 'en']);
    assert.equal(JSON.parse(partial.files['translations-en.json']).words.length, 1);
  });

  it('never ships a language without any reviewed translation, even for partial releases', () => {
    const release = build(bilingual([]), { minimums: { A1: 2 }, allowPartial: true });
    assert.deepEqual(release.manifest.languages, ['tr']);
    assert.deepEqual(release.excluded, ['en: A1: 0 reviewed translations (minimum 2)']);
  });

  it('ships Turkish only when no other language file exists', () => {
    const release = build(validContent(), { minimums: { A1: 1 }, allowPartial: false });
    assert.deepEqual(release.manifest.languages, ['tr']);
    assert.deepEqual(release.excluded, []);
  });
});

describe('sentences (T-377)', () => {
  /** 100 A1 words, all released in Turkish and English. */
  function hundred(): Content {
    const content = validContent();
    const ids = Array.from({ length: 100 }, (_, i) => `noun-w${i}`);
    content.words = ids.map((id) => ({ id, lemma_nl: id.slice(5), pos: 'noun', cefr: 'A1', source: 'own' }));
    content.annotations = ids.map((word_id) => ({ word_id, article: 'de', category_id: 'health', reviewed: true }));
    const tr = (lang: string, text: string) => ({
      lang,
      words: ids.map((word_id) => ({ word_id, text, reviewed: true })),
      categories: [{ category_id: 'health', title: 'x' }],
    });
    content.translations = { tr: tr('tr', 'tr') as never, en: tr('en', 'en') as never };
    return content;
  }
  const sentences = (ids: string[], reviewed = true) => ({
    rows: ids.map((word_id) => ({ word_id, nl: `Zin ${word_id}.`, form: 'x', distractors: ['a', 'b', 'c'], reviewed, review_source: 'owner' as const })),
    translations: Object.fromEntries(
      ['tr', 'en'].map((lang) => [lang, ids.map((word_id) => ({ word_id, text: `${lang} ${word_id}`, reviewed, review_source: 'roundtrip' as const }))]),
    ),
  });
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `noun-w${i}`);
  const opts = { minimums: {}, allowPartial: true, nt2lexRetired: false };
  const parse = (r: { files: Record<string, string> }, name: string) => JSON.parse(r.files[name]);

  it('a release without sentences is byte-identical to before', () => {
    const before = buildRelease(hundred(), opts);
    for (const sentencesInput of [undefined, { rows: [], translations: {} }]) {
      const after = buildRelease(hundred(), { ...opts, sentences: sentencesInput });
      assert.deepEqual(after.files, before.files);
      assert.deepEqual(after.manifest, before.manifest);
      assert.deepEqual(after.sentenceNotes, []);
    }
    assert.deepEqual(Object.keys(before.files), ['words.json', 'annotations.json', 'categories.json', 'translations-tr.json', 'translations-en.json']);
  });

  it('writes the A1 rows at 96 of 100 and lists the files in the manifest with their checksums', () => {
    const r = buildRelease(hundred(), { ...opts, sentences: sentences(ids(96)) });
    assert.equal(parse(r, 'sentences.json').length, 96);
    assert.equal(parse(r, 'sentence-translations-en.json').rows.length, 96);
    for (const name of ['sentences.json', 'sentence-translations-tr.json', 'sentence-translations-en.json']) {
      const entry = r.manifest.files.find((f) => f.path.endsWith(`/${name}`));
      assert.equal(entry?.sha256, createHash('sha256').update(r.files[name]).digest('hex'));
    }
    assert.equal(r.manifest.min_app_version, validContent().manifest.min_app_version);
    assert.deepEqual(r.sentenceNotes, []);
  });

  it('leaves A1 out at 94 of 100 and says so', () => {
    const r = buildRelease(hundred(), { ...opts, sentences: sentences(ids(94)) });
    assert.deepEqual(r.sentenceNotes, ['Sentences: A1 left out (94%)']);
    assert.ok(!Object.keys(r.files).some((n) => n.startsWith('sentence')));
  });

  it('an unreviewed English text drops the row from the English file only; no translation drops the sentence', () => {
    const s = sentences(ids(98));
    s.translations.en[0].reviewed = false;
    s.translations.tr[1].reviewed = false;
    s.translations.en[1].reviewed = false; // noun-w1 has no reviewed text in any language
    const r = buildRelease(hundred(), { ...opts, sentences: s });
    const rows = parse(r, 'sentence-translations-en.json').rows.map((x: { word_id: string }) => x.word_id);
    assert.ok(!rows.includes('noun-w0') && !rows.includes('noun-w1'));
    assert.ok(parse(r, 'sentence-translations-tr.json').rows.some((x: { word_id: string }) => x.word_id === 'noun-w0'));
    assert.ok(!parse(r, 'sentences.json').some((x: { word_id: string }) => x.word_id === 'noun-w1'));
    assert.equal(parse(r, 'sentences.json').length, 97);
  });

  it('an unreviewed sentence is dropped, and so is a sentence of a word outside the release', () => {
    const s = sentences([...ids(97), 'noun-elsewhere']);
    s.rows[0].reviewed = false;
    const r = buildRelease(hundred(), { ...opts, sentences: s });
    const out = parse(r, 'sentences.json').map((x: { word_id: string }) => x.word_id);
    assert.ok(!out.includes('noun-w0') && !out.includes('noun-elsewhere'));
    assert.equal(out.length, 96);
    for (const lang of ['tr', 'en']) {
      assert.ok(!parse(r, `sentence-translations-${lang}.json`).rows.some((x: { word_id: string }) => /w0$|elsewhere/.test(x.word_id)));
    }
  });

  it('fails when the sentence files exceed 1.5 MB', () => {
    const s = sentences(ids(100));
    s.rows.forEach((row) => (row.nl = 'x'.repeat(16_000)));
    assert.throws(() => buildRelease(hundred(), { ...opts, sentences: s }), /sentence files exceed 1\.5 MB/);
  });

  it('file names never start with translations- and match the sentence pattern', () => {
    const r = buildRelease(hundred(), { ...opts, sentences: sentences(ids(100)) });
    const names = Object.keys(r.files).filter((n) => n.startsWith('sentence'));
    assert.deepEqual(names, ['sentences.json', 'sentence-translations-tr.json', 'sentence-translations-en.json']);
    for (const n of names.slice(1)) assert.match(n, /^sentence-translations-[a-z]{2}\.json$/);
  });

  it('writes exactly the file shapes the app parser accepts (PM decision 2026-11-23)', () => {
    const r = buildRelease(hundred(), { ...opts, sentences: sentences(ids(100)) });
    assert.deepEqual(Object.keys(parse(r, 'sentence-translations-en.json')), ['lang', 'rows']);
    assert.equal(parse(r, 'sentence-translations-en.json').lang, 'en');
    assert.deepEqual(parse(r, 'sentence-translations-en.json').rows[0], { word_id: 'noun-w0', text: 'en noun-w0' });
    const rows = parse(r, 'sentences.json');
    assert.ok(Array.isArray(rows));
    for (const row of rows) assert.deepEqual(Object.keys(row), ['word_id', 'nl', 'form', 'distractors']);
  });

  it('judges each level on its own', () => {
    const content = hundred();
    content.words.forEach((w, i) => (w.cefr = i < 50 ? 'A1' : 'A2'));
    const r = buildRelease(content, { ...opts, sentences: sentences([...ids(50), ...ids(100).slice(50, 70)]) });
    assert.deepEqual(r.sentenceNotes, ['Sentences: A2 left out (40%)']);
    assert.equal(parse(r, 'sentences.json').length, 50);
  });
});
