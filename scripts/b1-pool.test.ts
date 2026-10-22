import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { lemmaCounts, lemmaRanks, parseLeipzigWords, readKaikki } from './b1-pool.ts';

const entry = (word: string, pos: string, senses: object[], gender?: string) =>
  JSON.stringify({
    word,
    pos,
    senses,
    ...(gender ? { head_templates: [{ name: 'nl-noun', args: { '1': gender } }] } : {}),
  });

describe('parseLeipzigWords', () => {
  it('adds equal forms after NFC and lower-casing and skips bad lines', () => {
    const map = parseLeipzigWords('1\tHuis\t5\n2\thuis\t3\nbad line\n3\tauto\tx\n');
    assert.deepEqual([...map], [['huis', 8]]);
  });
});

describe('readKaikki', () => {
  const index = readKaikki([
    entry('huis', 'noun', [{ tags: [] }], 'n'),
    entry('huizen', 'noun', [{ form_of: [{ word: 'Huis' }] }]),
    entry('lopen', 'verb', [{}]),
    entry('zich schamen', 'verb', [{ tags: ['reflexive'] }]),
    entry('kleuren', 'noun', [{ tags: ['plural'] }], 'p'),
    entry('huis', 'noun', [{ tags: ['dated'] }], 'm'),
    entry('oud', 'adj', [{ alt_of: [{ word: 'ouwe' }] }]),
    entry('de', 'article', [{}]),
    '',
  ]);
  it('keeps lemmas and form links', () => {
    assert.ok(index.lemmas.has('verb:lopen'));
    assert.deepEqual([...(index.formOf.get('huizen') ?? [])], ['huis']);
    assert.deepEqual([...(index.formOf.get('oud') ?? [])], ['ouwe']);
    assert.ok(!index.lemmas.has('noun:huizen'));
    assert.ok(![...index.lemmas.keys()].some((k) => k.startsWith('article:')));
  });
  it('merges entries of one word and pos: tags intersect, genders union', () => {
    const huis = index.lemmas.get('noun:huis');
    assert.deepEqual([...(huis?.genders ?? [])].sort(), ['m', 'n']);
    assert.equal(huis?.tags.size, 0);
  });
  it('flags reflexive-only verbs and plural-only nouns', () => {
    assert.equal(index.lemmas.get('verb:zich schamen')?.reflexiveOnly, true);
    assert.equal(index.lemmas.get('verb:lopen')?.reflexiveOnly, false);
    assert.equal(index.lemmas.get('noun:kleuren')?.pluralOnly, true);
  });
});

describe('lemmaCounts and lemmaRanks', () => {
  const index = readKaikki([
    entry('huis', 'noun', [{}], 'n'),
    entry('huizen', 'noun', [{ form_of: [{ word: 'huis' }] }]),
    entry('lopen', 'verb', [{}]),
    entry('liep', 'verb', [{ form_of: [{ word: 'lopen' }] }]),
    entry('a', 'noun', [{}], 'm'),
    entry('b', 'noun', [{}], 'm'),
    entry('ab', 'noun', [{ form_of: [{ word: 'a' }, { word: 'b' }, { word: 'gone' }] }]),
  ]);
  it('sums forms into lemmas and splits ambiguous forms', () => {
    const counts = lemmaCounts(new Map([['huizen', 6], ['huis', 4], ['lopen', 3], ['xyz', 9]]), index);
    assert.equal(counts.get('huis'), 10);
    assert.equal(counts.get('lopen'), 3);
    assert.ok(!counts.has('xyz'));
    const split = lemmaCounts(new Map([['ab', 5]]), index);
    assert.equal(split.get('a'), 2.5);
    assert.equal(split.get('b'), 2.5);
  });
  it('ranks by count, ties alphabetical', () => {
    const ranks = lemmaRanks(new Map([['b', 2], ['c', 9], ['a', 2]]));
    assert.deepEqual([...ranks], [['c', 1], ['a', 2], ['b', 3]]);
  });
});
