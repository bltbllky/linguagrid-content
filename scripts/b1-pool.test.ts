import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  B1_BAND,
  articleCheck,
  PINNED_SHA256,
  buildPool,
  calibration,
  lemmaCounts,
  lemmaRanks,
  parseLeipzigWords,
  poolCounts,
  rankBand,
  readKaikki,
  selectB1,
  sourceDrift,
  type PoolRow,
} from './b1-pool.ts';
import type { Annotation, Word } from './validate.ts';

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
  it('drops a lemma by C4 only when every entry is reflexive-only or plural-only', () => {
    const mixedVerb = readKaikki([
      entry('vergissen', 'verb', [{ tags: ['reflexive'] }]),
      entry('vergissen', 'verb', [{}]),
    ]);
    assert.equal(mixedVerb.lemmas.get('verb:vergissen')?.reflexiveOnly, false);
    const bothReflexive = readKaikki([
      entry('vergissen', 'verb', [{ tags: ['reflexive'] }]),
      entry('vergissen', 'verb', [{ tags: ['reflexive'] }]),
    ]);
    assert.equal(bothReflexive.lemmas.get('verb:vergissen')?.reflexiveOnly, true);
    const mixedNoun = readKaikki([entry('kosten', 'noun', [{}], 'p'), entry('kosten', 'noun', [{}], 'm')]);
    assert.equal(mixedNoun.lemmas.get('noun:kosten')?.pluralOnly, false);
    const bothPlural = readKaikki([entry('kosten', 'noun', [{}], 'p'), entry('kosten', 'noun', [{}], 'p')]);
    assert.equal(bothPlural.lemmas.get('noun:kosten')?.pluralOnly, true);
  });
  it('is not plural-only when one entry has a p template and a gender template', () => {
    const line = JSON.stringify({
      word: 'goed',
      pos: 'noun',
      senses: [{}],
      head_templates: [
        { name: 'nl-noun', args: { '1': 'p' } },
        { name: 'nl-noun', args: { '1': 'n' } },
      ],
    });
    const goed = readKaikki([line]).lemmas.get('noun:goed');
    assert.equal(goed?.pluralOnly, false);
    assert.deepEqual([...(goed?.genders ?? [])], ['n']);
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
  it('shares a form that is a lemma and also a form-of another lemma equally (C2)', () => {
    const shared = readKaikki([
      entry('werk', 'noun', [{}], 'n'),
      entry('werken', 'verb', [{}]),
      entry('werken', 'noun', [{ form_of: [{ word: 'werk' }] }]),
    ]);
    const counts = lemmaCounts(new Map([['werken', 6], ['werk', 4]]), shared);
    assert.equal(counts.get('werk'), 7);
    assert.equal(counts.get('werken'), 3);
  });
  it('does not count a form twice when its form-of list contains itself', () => {
    const selfRef = readKaikki([
      entry('werk', 'noun', [{}], 'n'),
      entry('werken', 'verb', [{}]),
      entry('werken', 'noun', [{ form_of: [{ word: 'werken' }, { word: 'werk' }] }]),
    ]);
    const counts = lemmaCounts(new Map([['werken', 6]]), selfRef);
    assert.equal(counts.get('werken'), 3);
    assert.equal(counts.get('werk'), 3);
  });
  it('ranks by count, ties alphabetical', () => {
    const ranks = lemmaRanks(new Map([['b', 2], ['c', 9], ['a', 2]]));
    assert.deepEqual([...ranks], [['c', 1], ['a', 2], ['b', 3]]);
  });
});

describe('buildPool', () => {
  const lemmas = [
    ['noun', 'huis', 'n'],
    ['noun', 'de', 'n'],
    ['noun', 'aaaaaaaaaaaaa', 'n'],
    ['noun', 'kantoor-gebouw', 'n'],
    ['noun', "d'r", 'n'],
    ['noun', 'notinopentaal', 'n'],
    ['noun', 'liveword', 'n'],
    ['noun', 'excluded', 'n'],
    ['noun', 'dialect', 'n'],
    ['noun', 'plural', 'p'],
    ['noun', 'faraway', 'n'],
    ['noun', 'twopos', 'm'],
    ['verb', 'twopos', ''],
    ['verb', 'liveword', ''],
    ['noun', 'ontwikkeling', 'n'],
    ['noun', 'kat', 'n'],
  ].map(([pos, word, g]) => entry(word, pos, [{ tags: word === 'dialect' ? ['dialectal'] : [] }], g || undefined));
  const mixed = entry('mixed', 'noun', [{ tags: ['dialectal'] }, { tags: [] }], 'n');
  const reflexive = entry('reflexive', 'verb', [{ tags: ['reflexive'] }]);
  const index = readKaikki([...lemmas, mixed, reflexive]);
  const words = ['huis', 'de', 'aaaaaaaaaaaaa', 'kantoor-gebouw', "d'r", 'notinopentaal', 'liveword', 'excluded', 'dialect',
    'plural', 'faraway', 'twopos', 'reflexive', 'mixed', 'ontwikkeling', 'kat'];
  const ranks = new Map(words.map((w, i) => [w, i + 1]));
  ranks.set('faraway', 500);
  const openTaal = new Set(words.filter((w) => w !== 'notinopentaal'));
  const live = { lemmas: new Set(['liveword']), excludedIds: new Set(['noun-excluded']) };
  const pool = buildPool(ranks, index, openTaal, live, { min: 1, max: 100 });

  it('keeps only rows passing C1-C5 and sorts by rank then pos', () => {
    assert.deepEqual(
      pool.map((r) => r.id),
      ['noun-huis', 'noun-twopos', 'verb-twopos', 'noun-mixed', 'noun-ontwikkeling'],
    );
    assert.equal(
      pool.find((r) => r.id === 'noun-twopos')!.rank,
      pool.find((r) => r.id === 'verb-twopos')!.rank,
    );
  });
  it('gives rank and gender', () => {
    assert.deepEqual(pool[0], { id: 'noun-huis', lemma_nl: 'huis', pos: 'noun', rank: 1, gender: 'n' });
    assert.equal(pool[2].gender, null);
  });
  it('drops ranks outside the band', () => {
    assert.ok(!buildPool(ranks, index, openTaal, live, { min: 5, max: 100 }).some((r) => r.id === 'noun-huis'));
    assert.deepEqual(buildPool(ranks, index, openTaal, live, { min: 1, max: 1 }).map((r) => r.id), ['noun-huis']);
  });
  it('counts per pos and band', () => {
    const counts = poolCounts([
      { id: 'a', lemma_nl: 'a', pos: 'noun', rank: 3000, gender: null },
      { id: 'b', lemma_nl: 'b', pos: 'verb', rank: 5000, gender: null },
      { id: 'c', lemma_nl: 'c', pos: 'noun', rank: 8000, gender: null },
    ]);
    assert.deepEqual(counts.pos, { noun: 2, verb: 1, adj: 0 });
    assert.deepEqual(counts.band, { '3-5k': 1, '5-8k': 1, '8-10k': 1 });
  });
  it('counts distinct lemmas and lemmas with two parts of speech', () => {
    const counts = poolCounts([
      { id: 'noun-a', lemma_nl: 'a', pos: 'noun', rank: 3000, gender: null },
      { id: 'verb-a', lemma_nl: 'a', pos: 'verb', rank: 3000, gender: null },
      { id: 'noun-b', lemma_nl: 'b', pos: 'noun', rank: 3001, gender: null },
    ]);
    assert.equal(counts.lemmas, 2);
    assert.equal(counts.twoPos, 1);
  });
  it('names rank bands', () => {
    assert.equal(rankBand(4999), '3-5k');
    assert.equal(rankBand(5000), '5-8k');
    assert.equal(rankBand(8000), '8-10k');
  });
});

describe('sourceDrift', () => {
  it('is empty when every hash matches its pin', () => {
    assert.deepEqual(sourceDrift({ ...PINNED_SHA256 }), []);
  });
  it('names a changed source with both short hashes', () => {
    const drift = sourceDrift({ ...PINNED_SHA256, 'wordlist.txt': 'f'.repeat(64) });
    assert.equal(drift.length, 1);
    assert.match(drift[0], /Source changed since 2026-10-22: wordlist\.txt \(pinned 12e5fb5e3c73, now /);
  });
  it('names every source that is not fetched', () => {
    const drift = sourceDrift({});
    assert.equal(drift.length, 4);
    assert.ok(drift.every((l) => l.startsWith('Source not fetched: ')));
  });
});

describe('articleCheck', () => {
  const noun = (word: string): Word => ({ id: `noun-${word}`, lemma_nl: word, pos: 'noun', cefr: 'B1', source: 'own' });
  const note = (word: string, article: 'de' | 'het' | null): Annotation => ({
    word_id: `noun-${word}`,
    article,
    category_id: 'b1-describing',
    reviewed: false,
  });
  const index = readKaikki([
    entry('huis', 'noun', [{}], 'n'),
    entry('duin', 'noun', [{}], 'm'),
    entry('duin', 'noun', [{}], 'n'),
    entry('man', 'noun', [{}], 'c'),
    entry('bal', 'noun', [{}]),
    entry('lopen', 'verb', [{}]),
  ]);
  const run = (words: Word[], notes: Annotation[]) =>
    Object.fromEntries(articleCheck(words, notes, index).map((r) => [r.dutch, r]));

  it('agrees or differs with the Wiktionary gender', () => {
    const rows = run([noun('huis')], [note('huis', 'het')]);
    assert.deepEqual(rows.huis, { id: 'noun-huis', dutch: 'huis', stored: 'het', wiktionary: 'het', result: 'agree' });
    assert.equal(run([noun('huis')], [note('huis', 'de')]).huis.result, 'differ');
  });
  it('accepts a stored article that is one of two Wiktionary genders', () => {
    const rows = run([noun('duin')], [note('duin', 'het')]);
    assert.equal(rows.duin.result, 'both');
    assert.equal(rows.duin.wiktionary, 'de/het');
  });
  it('maps c to de', () => {
    assert.equal(run([noun('man')], [note('man', 'de')]).man.wiktionary, 'de');
  });
  it('is unchecked without a gender or an entry, and skips verbs', () => {
    const rows = run([noun('bal'), noun('zzz'), { ...noun('lopen'), id: 'verb-lopen', pos: 'verb' }], [note('bal', 'de')]);
    assert.equal(rows.bal.result, 'unchecked');
    assert.equal(rows.zzz.result, 'unchecked');
    assert.equal(rows.zzz.stored, '');
    assert.ok(!('lopen' in rows));
  });
  it('says differ when two genders do not include the stored article', () => {
    const only = readKaikki([entry('duin', 'noun', [{}], 'm'), entry('duin', 'noun', [{}], 'f')]);
    const rows = articleCheck([noun('duin')], [note('duin', 'het')], only);
    assert.equal(rows[0].result, 'differ');
  });
});

describe('selectB1', () => {
  const row = (pos: 'noun' | 'adj', lemma: string): PoolRow => ({
    id: `${pos}-${lemma}`,
    lemma_nl: lemma,
    pos,
    rank: 1,
    gender: null,
  });
  const pool = [row('noun', 'x'), row('noun', 'y'), row('adj', 'y')];
  it('returns B1 own words in the order of the ids', () => {
    assert.deepEqual(selectB1(pool, ['noun-y', 'noun-x']), [
      { id: 'noun-y', lemma_nl: 'y', pos: 'noun', cefr: 'B1', source: 'own' },
      { id: 'noun-x', lemma_nl: 'x', pos: 'noun', cefr: 'B1', source: 'own' },
    ]);
  });
  it('rejects ids outside the pool and a lemma twice', () => {
    assert.throws(() => selectB1(pool, ['noun-z']), /Not in the B1 pool: noun-z/);
    assert.throws(() => selectB1(pool, ['noun-y', 'adj-y']), /Lemma twice in the selection: y/);
  });
});

describe('calibration', () => {
  const w = (lemma: string, cefr: 'A1' | 'A2'): Word => ({
    id: `noun-${lemma}`,
    lemma_nl: lemma,
    pos: 'noun',
    cefr,
    source: 'nt2lex',
  });
  it('gives nearest-rank percentiles and counts words without a rank', () => {
    const ranks = new Map(Array.from({ length: 10 }, (_, i) => [`w${i + 1}`, (i + 1) * 100]));
    const words = [...Array.from({ length: 10 }, (_, i) => w(`w${i + 1}`, 'A2')), w('none', 'A2'), w('w1', 'A1')];
    const [a1, a2] = calibration(ranks, words);
    assert.deepEqual(a2, { level: 'A2', n: 10, median: 500, p75: 800, p90: 900, missing: 1 });
    assert.deepEqual(a1, { level: 'A1', n: 1, median: 100, p75: 100, p90: 100, missing: 0 });
  });
});

describe('criteria text', () => {
  it('contains the band numbers the code uses', () => {
    const text = readFileSync(join(import.meta.dirname, '..', 'data', 'b1', 'selection-criteria.md'), 'utf8');
    assert.ok(text.includes(B1_BAND.min.toLocaleString('en-US')));
    assert.ok(text.includes(B1_BAND.max.toLocaleString('en-US')));
  });
});
