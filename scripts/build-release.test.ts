import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';

import { partialEnglish, validContent } from './fixtures/valid.ts';
import { buildRelease } from './build-release.ts';
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
    assert.doesNotThrow(() => buildRelease(validContent(), opts));
  });

  it('blocks a live B2 word, with or without --allow-partial', () => {
    const content = validContent();
    content.words[0].cefr = 'B2';
    for (const allowPartial of [false, true]) {
      assert.throws(() => buildRelease(content, { minimums: {}, allowPartial }), /live word files hold B2 words \(1\)/);
    }
  });

  it('releases a reviewed B1 word (US-022)', () => {
    const release = buildRelease(b1Content(), { minimums: { A1: 0, A2: 0, B1: 1 }, allowPartial: false });
    assert.ok(JSON.parse(release.files['words.json']).some((w: { id: string }) => w.id === 'noun-tandarts'));
  });

  it('stops under the B1 minimum unless --allow-partial', () => {
    assert.throws(() => buildRelease(b1Content(), { minimums: { B1: 2 }, allowPartial: false }), /B1: 1 reviewed words \(minimum 2\)/);
    assert.doesNotThrow(() => buildRelease(b1Content(), { minimums: { B1: 2 }, allowPartial: true }));
  });

  it('leaves out a language whose B1 text is not reviewed', () => {
    const content = b1Content();
    content.translations.en = { ...partialEnglish(), words: [{ word_id: 'noun-tandarts', text: 'dentist', reviewed: false }] };
    const release = buildRelease(content, { minimums: { B1: 1 }, allowPartial: false });
    assert.equal(release.excluded.filter((e) => e.startsWith('en:')).length, 1);
    assert.deepEqual(release.manifest.languages, ['tr']);
  });

  it('includes only reviewed words and bumps the content version', () => {
    const release = buildRelease(validContent(), { minimums: {}, allowPartial: false });
    assert.equal(release.manifest.content_version, 2);
    assert.deepEqual(
      JSON.parse(release.files['words.json']).map((w: { id: string }) => w.id),
      ['noun-tandarts'],
    );
    assert.equal(JSON.parse(release.files['annotations.json']).length, 1);
  });

  it('lists every file with its sha256 under the versioned release path', () => {
    const release = buildRelease(validContent(), { minimums: {}, allowPartial: false });
    assert.deepEqual(
      release.manifest.files.map((f) => f.path),
      ['release/2/words.json', 'release/2/annotations.json', 'release/2/categories.json', 'release/2/translations-tr.json'],
    );
    assert.ok(release.manifest.files.every((f) => /^[0-9a-f]{64}$/.test(f.sha256)));
  });

  it('ships the pre-T-029 shape with Turkish texts and needs a reviewed Turkish translation', () => {
    const content = validContent();
    const release = buildRelease(content, { minimums: {}, allowPartial: false });
    assert.equal(release.files['annotations.json'], JSON.stringify([{ ...withLegacyTurkish(content).annotations[0], review_source: undefined }], null, 2) + '\n');
    assert.deepEqual(JSON.parse(release.files['categories.json']), [{ id: 'health', title_tr: 'Sağlık', cefr: 'A1', order: 1 }]);
    content.translations.tr.words[0].reviewed = false;
    assert.equal(buildRelease(content, { minimums: {}, allowPartial: false }).files['words.json'], '[]\n');
  });

  it('never ships review_source', () => {
    const content = bilingual(both);
    content.annotations[1].reviewed = true;
    content.annotations[1].review_source = 'roundtrip';
    content.translations.tr.words[1].review_source = 'roundtrip';
    const release = buildRelease(content, { minimums: {}, allowPartial: false });
    assert.equal(Object.keys(release.files).length, 5);
    assert.ok(!Object.values(release.files).some((body) => body.includes('review_source')));
  });

  it('keeps min_app_version untouched', () => {
    const content = validContent();
    content.manifest.min_app_version = { ios: '1.2.0', android: '1.3.0' };
    const release = buildRelease(content, { minimums: {}, allowPartial: false });
    assert.deepEqual(release.manifest.min_app_version, { ios: '1.2.0', android: '1.3.0' });
  });

  it('fails below the minimum reviewed words per level unless partial releases are allowed', () => {
    const options = { minimums: { A1: 400 }, allowPartial: false };
    assert.throws(() => buildRelease(validContent(), options), /A1: 1 reviewed words \(minimum 400\)/);
    assert.doesNotThrow(() => buildRelease(validContent(), { ...options, allowPartial: true }));
  });

  it('writes one translation file per language with reviewed texts of released words only', () => {
    const content = bilingual(both);
    content.annotations[1].reviewed = false; // verb-lopen is not released, so no language ships it
    const release = buildRelease(content, { minimums: { A1: 1 }, allowPartial: false });
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
    const release = buildRelease(bilingual(both), { minimums: { A1: 2 }, allowPartial: false });
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
    const strict = buildRelease(bilingual(['noun-tandarts']), { minimums: { A1: 2 }, allowPartial: false });
    assert.deepEqual(strict.manifest.languages, ['tr']);
    assert.equal(strict.files['translations-en.json'], undefined);
    assert.deepEqual(strict.excluded, ['en: A1: 1 reviewed translations (minimum 2)']);
    assert.ok(strict.manifest.files.every((f) => !f.path.includes('translations-en')));

    const partial = buildRelease(bilingual(['noun-tandarts']), { minimums: { A1: 2 }, allowPartial: true });
    assert.deepEqual(partial.manifest.languages, ['tr', 'en']);
    assert.equal(JSON.parse(partial.files['translations-en.json']).words.length, 1);
  });

  it('never ships a language without any reviewed translation, even for partial releases', () => {
    const release = buildRelease(bilingual([]), { minimums: { A1: 2 }, allowPartial: true });
    assert.deepEqual(release.manifest.languages, ['tr']);
    assert.deepEqual(release.excluded, ['en: A1: 0 reviewed translations (minimum 2)']);
  });

  it('ships Turkish only when no other language file exists', () => {
    const release = buildRelease(validContent(), { minimums: { A1: 1 }, allowPartial: false });
    assert.deepEqual(release.manifest.languages, ['tr']);
    assert.deepEqual(release.excluded, []);
  });
});
