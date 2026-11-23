import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { makeInflected, tokenize } from './inflection.ts';

const LEMMAS = new Set(['huis', 'wonen', 'man', 'boom', 'werken', 'groot', 'stoppen', 'gaan', 'bellen', 'opbellen', 'foto', 'doos', 'brief', 'kind', 'lezen']);
const OPENTAAL = new Set([
  'huis', 'huizen', 'woon', 'woont', 'woonde', 'gewoond', 'mannen', 'bomen', 'boompje', 'huisje', 'werkt', 'gewerkt', 'grote',
  'stop', 'gestopt', 'gaat', 'foto’s', "foto's", 'dozen', 'brieven', 'kinderen', 'lees', 'leest', 'gelezen', 'opgebeld', 'kantoor',
  'werk', 'ik', 'vergadering', 'doelstelling', 'presentatie', 'werkend', 'mannetje', 'zxqv',
]);
const inflected = makeInflected(OPENTAAL, LEMMAS);

describe('tokenize', () => {
  it('lowercases, splits on spaces, strips the final stop or question mark and keeps hyphens and apostrophes', () => {
    assert.deepEqual(tokenize('Ik woon in een huis.'), ['ik', 'woon', 'in', 'een', 'huis']);
    assert.deepEqual(tokenize('Waar is het e-mailadres van zo’n man?'), ['waar', 'is', 'het', 'e-mailadres', 'van', 'zo’n', 'man']);
    assert.deepEqual(tokenize("Zij maakt foto's, en ik niet."), ['zij', 'maakt', "foto's", 'en', 'ik', 'niet']);
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

