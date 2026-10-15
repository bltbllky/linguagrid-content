import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { extractCandidates, selectWords } from './extract-nt2lex.ts';

const TSV = readFileSync(join(import.meta.dirname, 'fixtures', 'nt2lex-sample.tsv'), 'utf8');

describe('extractCandidates', () => {
  const candidates = extractCandidates(TSV);
  const byLemma = (lemma: string) => candidates.filter((c) => c.lemma_nl === lemma);

  it('keeps single-word nouns, verbs and adjectives with their first CEFR level where F ≥ 2', () => {
    assert.deepEqual(
      candidates.map((c) => `${c.id}:${c.cefr}`).sort(),
      [
        'adj-groot:A1',
        'adj-mooi:A1',
        'noun-afspraak:A1',
        'noun-fiets:A1',
        'noun-huis:A1',
        'noun-ziekenhuis:A1',
        'verb-lopen:A1',
      ],
    );
  });

  it('drops multi-word entries, other parts of speech, rare words and words over 12 letters', () => {
    for (const lemma of ["'s avond", 'de', 'tandarts', 'telefoonnummer', 'verschrikkelijk']) {
      assert.deepEqual(byLemma(lemma), [], lemma);
    }
  });

  it('keeps only the part of speech that reaches F ≥ 2 for ambiguous lemmas', () => {
    assert.deepEqual(
      byLemma('fiets').map((c) => c.pos),
      ['noun'],
    );
  });

  it('keeps the earliest level when a lemma appears in several rows', () => {
    const header = TSV.split('\n')[0];
    const columns = header.split('\t');
    const row = (tag: string, level: string) =>
      columns
        .map((c) => (c === 'word' ? 'kat' : c === 'tag' ? tag : c.endsWith(`@${level}`) ? '5' : '-'))
        .join('\t');
    const tsv = [header, row('N(soort)', 'B1'), row('N(soort)', 'A1'), row('N(soort)', 'A2')].join('\n');

    assert.deepEqual(
      extractCandidates(tsv).map((c) => `${c.id}:${c.cefr}`),
      ['noun-kat:A1'],
    );
  });

  it('marks every candidate with source "nt2lex" and a frequency for ranking', () => {
    assert.ok(candidates.every((c) => c.source === 'nt2lex' && c.frequency > 0));
  });
});

describe('selectWords', () => {
  it('takes the most frequent words per level, ranked by frequency then lemma', () => {
    const candidates = extractCandidates(TSV);
    const words = selectWords(candidates, { A1: 3, A2: 5 });

    assert.equal(words.length, 3);
    const expected = [...candidates]
      .sort((a, b) => b.frequency - a.frequency || a.lemma_nl.localeCompare(b.lemma_nl))
      .slice(0, 3)
      .map((c) => c.id);
    assert.deepEqual(
      words.map((w) => w.id),
      expected,
    );
    assert.deepEqual(Object.keys(words[0]).sort(), ['cefr', 'id', 'lemma_nl', 'pos', 'source']);
  });

  it('skips excluded ids and fills the level with the next candidate', () => {
    const candidates = extractCandidates(TSV);
    const top = selectWords(candidates, { A1: 2 });
    const words = selectWords(candidates, { A1: 2 }, new Set([top[0].id]));

    assert.equal(words.length, 2);
    assert.ok(!words.some((w) => w.id === top[0].id));
    assert.equal(words[0].id, top[1].id);
  });

  it('produces the same ids on every run', () => {
    const first = selectWords(extractCandidates(TSV), { A1: 7, A2: 0 });
    const second = selectWords(extractCandidates(TSV), { A1: 7, A2: 0 });
    assert.deepEqual(first, second);
  });
});
