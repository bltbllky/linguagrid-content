import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validContent } from './fixtures/valid.ts';
import { validateContent, wordId } from './validate.ts';

describe('validateContent', () => {
  it('accepts valid content', () => {
    assert.deepEqual(validateContent(validContent()), []);
  });

  it('reports a word without a Turkish translation', () => {
    const content = validContent();
    content.annotations[1].text_tr = ' ';
    assert.ok(validateContent(content).includes('verb-lopen: missing Turkish translation'));

    content.annotations.pop();
    assert.ok(validateContent(content).includes('verb-lopen: missing Turkish translation'));
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
  });
});
