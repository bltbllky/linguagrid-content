import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { checkRows, checkSentence, loadFunctionWords, makeInflected, makeLevelOf, tokenize } from './sentence-check.ts';
import type { SentenceContext, SentenceRow } from './sentence-check.ts';
import type { Annotation, Pos, Word } from './validate.ts';

type Cefr = Word['cefr'];

const w = (pos: Pos, lemma_nl: string, cefr: Cefr): Word => ({ id: `${pos}-${lemma_nl}`, lemma_nl, pos, cefr, source: 'own' });
const WORDS = [
  w('noun', 'huis', 'A1'), w('verb', 'wonen', 'A1'), w('noun', 'man', 'A1'), w('noun', 'boom', 'A1'),
  w('verb', 'werken', 'A1'), w('adj', 'groot', 'A1'), w('verb', 'stoppen', 'A1'), w('verb', 'gaan', 'A1'),
  w('noun', 'kantoor', 'A2'), w('verb', 'bellen', 'A2'), w('noun', 'vergadering', 'B1'), w('noun', 'doelstelling', 'B2'),
  w('noun', 'presentatie', 'B2'), w('verb', 'opbellen', 'B1'), w('noun', 'foto', 'A1'), w('noun', 'doos', 'A1'),
  w('noun', 'brief', 'A1'), w('noun', 'kind', 'A1'), w('verb', 'lezen', 'A1'),
];
const OPENTAAL = new Set([
  'huis', 'huizen', 'woon', 'woont', 'woonde', 'gewoond', 'mannen', 'bomen', 'boompje', 'huisje', 'werkt', 'gewerkt', 'grote',
  'stop', 'gestopt', 'gaat', 'foto’s', "foto's", 'dozen', 'brieven', 'kinderen', 'lees', 'leest', 'gelezen', 'opgebeld', 'kantoor',
  'werk', 'ik', 'vergadering', 'doelstelling', 'presentatie', 'werkend', 'mannetje', 'zxqv',
]);
const levelOf = makeLevelOf(WORDS);
const inflected = makeInflected(OPENTAAL, new Set(WORDS.map((x) => x.lemma_nl)));
const functionWords = loadFunctionWords();
const ctxFor = (id: string, article: Annotation['article'] = null): SentenceContext => {
  const word = WORDS.find((x) => x.id === id)!;
  return { word, annotation: { word_id: id, article, category_id: 'c', reviewed: true }, levelOf, inflected, functionWords };
};
const row = (word_id: string, nl: string, form: string): SentenceRow => ({ word_id, nl, form, distractors: [] });
const codes = (r: SentenceRow, ctx: SentenceContext) => checkSentence(r, ctx).map((c) => c.split(' ')[0]);

describe('tokenize', () => {
  it('lowercases, splits on spaces, strips the final stop or question mark and keeps hyphens and apostrophes', () => {
    assert.deepEqual(tokenize('Ik woon in een huis.'), ['ik', 'woon', 'in', 'een', 'huis']);
    assert.deepEqual(tokenize('Waar is het e-mailadres van zo’n man?'), ['waar', 'is', 'het', 'e-mailadres', 'van', 'zo’n', 'man']);
    assert.deepEqual(tokenize("Zij maakt foto's, en ik niet."), ['zij', 'maakt', "foto's", 'en', 'ik', 'niet']);
  });
});

describe('checkSentence', () => {
  it('1: a plain sentence is valid', () => {
    assert.deepEqual(checkSentence(row('noun-huis', 'Ik woon in een huis.', 'huis'), ctxFor('noun-huis', 'het')), []);
  });

  it('2: too many tokens and too many characters', () => {
    const ten = 'Ik woon in een huis en ik woon in een huis.';
    assert.ok(codes(row('noun-huis', ten, 'huis'), ctxFor('noun-huis')).includes('too_many_tokens'));
    const long = 'Ik woon in een huis ' + 'en '.repeat(17) + 'ik.';
    assert.ok(long.length > 70);
    assert.ok(codes(row('noun-huis', long, 'huis'), ctxFor('noun-huis')).includes('too_long_chars'));
    assert.ok(codes(row('noun-huis', 'Een huis.', 'huis'), ctxFor('noun-huis')).includes('too_few_tokens'));
  });

  it('3: digits, quotation marks and endings', () => {
    const ctx = ctxFor('noun-huis');
    assert.ok(checkSentence(row('noun-huis', 'Ik woon in een huis 2.', 'huis'), ctx).some((c) => c === 'digit 2'));
    assert.ok(codes(row('noun-huis', 'Ik woon in “een” huis.', 'huis'), ctx).includes('quotation_mark'));
    assert.ok(codes(row('noun-huis', 'Ik woon in een huis', 'huis'), ctx).includes('bad_ending'));
    assert.ok(codes(row('noun-huis', 'Ik woon in een huis!', 'huis'), ctx).includes('bad_ending'));
    assert.ok(codes(row('noun-huis', 'Ik woon in een huis. Ik woon.', 'huis'), ctx).includes('bad_ending'));
  });

  it('4: form absent, twice, or not an inflection of the target', () => {
    const ctx = ctxFor('noun-huis');
    assert.ok(codes(row('noun-huis', 'Ik woon in een huis.', 'huizen'), ctx).includes('form_not_one_token'));
    assert.ok(codes(row('noun-huis', 'Ik woon in een huis of huis.', 'huis'), ctx).includes('form_not_one_token'));
    assert.ok(checkSentence(row('noun-huis', 'Ik woon in een man.', 'man'), ctx).includes('form_not_inflection man'));
    assert.deepEqual(checkSentence(row('noun-huis', 'Ik woon in grote huizen.', 'huizen'), ctx), []);
    // a noun and a verb with the same stem: the target decides
    assert.deepEqual(checkSentence(row('verb-werken', 'Ik werk in een groot huis.', 'werk'), ctxFor('verb-werken')), []);
  });

  it('5: a token above the target level names the token', () => {
    const out = checkSentence(row('noun-kantoor', 'Ik bel over de vergadering op kantoor.', 'kantoor'), ctxFor('noun-kantoor', 'het'));
    assert.ok(out.includes('token_above_level vergadering'));
  });

  it('6: inflected forms of lower words are valid, unknown tokens are not', () => {
    assert.deepEqual(checkSentence(row('noun-huis', 'Hij werkt en woont in een huis.', 'huis'), ctxFor('noun-huis', 'het')), []);
    assert.ok(checkSentence(row('noun-huis', 'Ik woon in een zxqv huis.', 'huis'), ctxFor('noun-huis', 'het')).includes('unknown_token zxqv'));
    assert.ok(checkSentence(row('noun-huis', 'Ik woon in een kantoor huis.', 'huis'), ctxFor('noun-huis', 'het')).includes('token_above_level kantoor'));
    // a token that is not in OpenTaal never counts as an inflection
    assert.ok(checkSentence(row('noun-huis', 'Ik woon in een mannen huis.', 'huis'), ctxFor('noun-huis')).length === 0);
    assert.ok(checkSentence(row('noun-huis', 'Ik woon in een manne huis.', 'huis'), ctxFor('noun-huis')).includes('unknown_token manne'));
  });

  it('7: a B2 target with a second B2 word', () => {
    const ctx = ctxFor('noun-doelstelling', 'de');
    assert.ok(checkSentence(row('noun-doelstelling', 'Ik heb een doelstelling voor de presentatie.', 'doelstelling'), ctx).includes('second_b2_word presentatie'));
    assert.ok(checkSentence(row('noun-doelstelling', 'Ik heb een doelstelling voor de vergadering.', 'doelstelling'), ctx).length === 0);
  });

  it('8: the article before the target matches the annotation', () => {
    assert.ok(checkSentence(row('noun-huis', 'Ik woon in het huis.', 'huis'), ctxFor('noun-huis', 'de')).includes('article_mismatch het'));
    assert.deepEqual(checkSentence(row('noun-huis', 'Ik woon in het huis.', 'huis'), ctxFor('noun-huis', 'het')), []);
    // plural of a het noun takes "de"
    assert.deepEqual(checkSentence(row('noun-huis', 'Ik woon bij de huizen.', 'huizen'), ctxFor('noun-huis', 'het')), []);
  });

  it('a hyphenated token is accepted when every part is', () => {
    assert.deepEqual(checkSentence(row('noun-man', 'Ik woon in een boom-huis met een man.', 'man'), ctxFor('noun-man')), []);
    assert.ok(checkSentence(row('noun-man', 'Ik woon in een boom-kantoor met een man.', 'man'), ctxFor('noun-man')).includes('token_above_level boom-kantoor'));
  });
});

describe('the inflection rules', () => {
  const via = (token: string) => inflected(token);
  it('plurals', () => {
    assert.equal(via('huizen'), 'huis');
    assert.equal(via('mannen'), 'man');
    assert.equal(via('bomen'), 'boom');
    assert.equal(via('dozen'), 'doos');
    assert.equal(via('brieven'), 'brief');
    assert.equal(via('kinderen'), 'kind');
    assert.equal(via("foto's"), 'foto');
  });
  it('diminutives', () => {
    assert.equal(via('huisje'), 'huis');
    assert.equal(via('boompje'), 'boom');
    assert.equal(via('mannetje'), 'man');
  });
  it('verb forms and participles, also of a separable verb', () => {
    assert.equal(via('woon'), 'wonen');
    assert.equal(via('woont'), 'wonen');
    assert.equal(via('woonde'), 'wonen');
    assert.equal(via('gewoond'), 'wonen');
    assert.equal(via('werkt'), 'werken');
    assert.equal(via('gewerkt'), 'werken');
    assert.equal(via('werkend'), 'werken');
    assert.equal(via('stop'), 'stoppen');
    assert.equal(via('gestopt'), 'stoppen');
    assert.equal(via('gaat'), 'gaan');
    assert.equal(via('lees'), 'lezen');
    assert.equal(via('gelezen'), 'lezen');
    assert.equal(via('opgebeld'), 'opbellen');
  });
  it('adjective forms', () => {
    assert.equal(via('grote'), 'groot');
  });
  it('a form of no live word, or not in the wordlist, stays unresolved', () => {
    assert.equal(via('zxqv'), null);
    assert.equal(via('woonster'), null);
  });
  it('the preferred lemma wins on an ambiguous form', () => {
    assert.equal(inflected('werkt', 'werken'), 'werken');
    assert.equal(inflected('werkt', 'huis'), 'werken');
  });
});

describe('makeLevelOf', () => {
  it('returns the lowest level of a lemma and null for an unknown one', () => {
    const lv = makeLevelOf([w('noun', 'x', 'B1'), w('verb', 'x', 'A2'), w('noun', 'y', 'B2')]);
    assert.equal(lv('x'), 'A2');
    assert.equal(lv('y'), 'B2');
    assert.equal(lv('z'), null);
  });
});

describe('the committed function-word list', () => {
  const raw = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'data', 'sentences', 'function-words.json'), 'utf8')) as string[];
  it('9: has no uppercase entry, no duplicate and no blank', () => {
    assert.ok(raw.length > 50);
    for (const t of raw) {
      assert.equal(t, t.toLowerCase().normalize('NFC'), `${t} is not lowercase`);
      assert.equal(t, t.trim());
      assert.ok(t.length > 0);
    }
    assert.equal(new Set(raw).size, raw.length, 'duplicate entry');
  });
  it('covers the families the plan names', () => {
    for (const t of ['de', 'het', 'een', 'ik', 'mijn', 'in', 'en', 'ben', 'heeft', 'wil', 'kan', 'moet', 'twee', 'honderd']) {
      assert.ok(functionWords.has(t), t);
    }
  });
  it('rejects a list with an uppercase entry or a duplicate', () => {
    assert.throws(() => loadFunctionWords(['Ik']), /lowercase/);
    assert.throws(() => loadFunctionWords(['ik', 'ik']), /duplicate/);
  });
});

describe('checkRows', () => {
  const env = { words: WORDS, annotations: [], inflected, functionWords };
  it('prints one line per failure and a summary, and counts failed rows', () => {
    const bad = row('noun-huis', 'Ik woon in een zxqv huis.', 'huis');
    const good = row('noun-huis', 'Ik woon in een huis.', 'huis');
    const out = checkRows([good, bad, row('noun-nope', 'Ik woon in een huis.', 'huis')], env);
    assert.equal(out.failed, 2);
    assert.deepEqual(out.lines, ['noun-huis: unknown_token zxqv', 'noun-nope: unknown_word_id', '2 of 3 sentence(s) failed']);
    assert.deepEqual(checkRows([good], env), { lines: ['✔ 1 sentence(s) pass the token check'], failed: 0 });
  });
});
