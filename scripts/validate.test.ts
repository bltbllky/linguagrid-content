import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { partialEnglish, validContent } from './fixtures/valid.ts';
import { loadContent, translationReport, validateContent, withLegacyTurkish, wordId } from './validate.ts';

describe('validateContent', () => {
  it('accepts valid content', () => {
    assert.deepEqual(validateContent(validContent()), []);
  });

  it('reports a word without a Turkish translation or without an annotation', () => {
    const content = validContent();
    content.translations.tr.words[1].text = ' ';
    assert.ok(validateContent(content).includes('verb-lopen: missing Turkish translation'));

    content.translations.tr.words.pop();
    assert.ok(validateContent(content).includes('verb-lopen: missing Turkish translation'));

    content.annotations.pop();
    assert.ok(validateContent(content).includes('verb-lopen: missing annotation'));
  });

  it('reports a noun without an article and an article on a non-noun', () => {
    const content = validContent();
    content.annotations[0].article = null;
    content.annotations[1].article = 'de';
    assert.deepEqual(validateContent(content), [
      'noun-tandarts: noun without de/het article',
      'verb-lopen: article on a verb',
    ]);
  });

  it('reports duplicate ids and ids that do not match the lemma', () => {
    const content = validContent();
    content.words.push({ ...content.words[0] });
    content.words[1].id = 'verb-rennen';
    const errors = validateContent(content);
    assert.ok(errors.includes('noun-tandarts: duplicate word id'));
    assert.ok(errors.includes('verb-rennen: id does not match lemma "lopen" (expected verb-lopen)'));
  });

  it('reports words longer than 12 letters', () => {
    const content = validContent();
    content.words[0] = { ...content.words[0], id: 'noun-telefoonnummers', lemma_nl: 'telefoonnummers' };
    content.annotations[0].word_id = 'noun-telefoonnummers';
    content.translations.tr.words[0].word_id = 'noun-telefoonnummers';
    assert.ok(validateContent(content).includes('noun-telefoonnummers: longer than 12 letters'));
  });

  it('reports unknown categories and annotations for unknown words', () => {
    const content = validContent();
    content.annotations[0].category_id = 'kitchen';
    content.annotations.push({ ...content.annotations[1], word_id: 'noun-ghost' });
    const errors = validateContent(content);
    assert.ok(errors.includes('noun-tandarts: unknown category "kitchen"'));
    assert.ok(errors.includes('noun-ghost: annotation for an unknown word'));
  });

  it('reports schema violations', () => {
    const content = validContent();
    (content.manifest as { content_version: unknown }).content_version = 'one';
    assert.match(validateContent(content)[0], /^manifest: \/content_version must be integer/);
  });
});

describe('validateContent — translation files', () => {
  it('accepts an incomplete English file and requires a Turkish one', () => {
    const content = validContent();
    content.translations.en = partialEnglish();
    assert.deepEqual(validateContent(content), []);
    delete (content.translations as Record<string, unknown>).tr;
    assert.deepEqual(validateContent(content), ['translations: data/translations/tr.json is missing']);
  });

  it('reports unknown or duplicate ids, empty texts, a wrong lang and missing Turkish titles', () => {
    const content = validContent();
    const en = { ...partialEnglish(), lang: 'nl' };
    en.words.push({ word_id: 'noun-ghost', text: 'ghost', reviewed: false });
    en.words.push({ word_id: 'noun-tandarts', text: 'dental surgeon', reviewed: false });
    en.words.push({ word_id: 'verb-lopen', text: '  ', reviewed: false });
    en.categories = [{ category_id: 'kitchen', title: 'Kitchen' }, { category_id: 'health', title: ' ' }];
    en.categories.push({ category_id: 'health', title: 'Health' });
    content.translations.en = en;
    content.translations.tr.categories = [];
    assert.deepEqual(validateContent(content), [
      'health: missing Turkish category title',
      'translations/en: lang "nl" does not match the file name',
      'translations/en: noun-ghost: unknown word id',
      'translations/en: noun-tandarts: duplicate word id',
      'translations/en: verb-lopen: empty text',
      'translations/en: kitchen: unknown category id',
      'translations/en: health: empty title',
      'translations/en: health: duplicate category id',
    ]);
  });

  it('reports schema violations in a translation file', () => {
    const content = validContent();
    (content.translations.tr.words[0] as { reviewed: unknown }).reviewed = 'yes';
    assert.match(validateContent(content)[0], /^translations\/tr: \/words\/0\/reviewed must be boolean/);
  });

  it('accepts deprecated text_tr and title_tr only when they equal tr.json', () => {
    const content = withLegacyTurkish(validContent());
    assert.deepEqual(validateContent(content), []);
    assert.deepEqual(Object.keys(content.annotations[0]), ['word_id', 'text_tr', 'article', 'category_id', 'reviewed']);
    assert.deepEqual(content.categories[0], { id: 'health', title_tr: 'Sağlık', cefr: 'A1', order: 1 });
    content.annotations[0].text_tr = 'doktor';
    content.categories[0].title_tr = 'Saglik';
    assert.deepEqual(validateContent(content), [
      'noun-tandarts: deprecated text_tr differs from data/translations/tr.json',
      'health: deprecated title_tr differs from data/translations/tr.json',
    ]);
  });
});

describe('translationReport', () => {
  it('reports coverage per language and level and warns about shared prompt texts', () => {
    const content = validContent();
    content.translations.en = partialEnglish();
    assert.deepEqual(translationReport(content), [
      'tr A1: 2 translated, 1 reviewed / 2 words',
      'en A1: 1 translated, 1 reviewed / 2 words',
    ]);
    content.translations.en.words.push({ word_id: 'verb-lopen', text: 'Dentist ', reviewed: false });
    assert.equal(translationReport(content).at(-1), '⚠ en: "dentist" is shared by noun-tandarts, verb-lopen');
  });
});

describe('wordId', () => {
  it('derives a stable id from part of speech and lemma', () => {
    assert.equal(wordId('noun', 'Tandarts'), 'noun-tandarts');
    assert.equal(wordId('noun', 'cariës'), 'noun-cariës');
  });
});

describe('loadContent', () => {
  it('reads the repository data files', async () => {
    const { loadContent } = await import('./validate.ts');
    const content = loadContent();
    assert.ok(Array.isArray(content.words));
    assert.equal(typeof content.manifest.content_version, 'number');
    assert.equal(content.translations.tr.lang, 'tr');
  });
});

describe('repository data', () => {
  it('keeps the deprecated text_tr and title_tr equal to data/translations/tr.json until the app reads it (T-034)', () => {
    const content = loadContent();
    assert.equal(content.annotations.length, content.translations.tr.words.length);
    assert.deepEqual(content, withLegacyTurkish(content));
  });
});
