import assert from 'node:assert/strict';
import { test } from 'node:test';

import { drawSentenceSpotCheck, drawSpotCheck, judge, mulberry32, parseTally, sentenceSpotStatus, shuffle, tallyStatus } from './spot-check.ts';
import type { SentenceStage } from './sentence-stage.ts';

const TALLY = `date,sheet,lang,words,errors,seed,note
2026-10-17,launch,tr,50,1,20261017,
2026-10-17,launch,en,50,2,,drawn from all unflagged words before ADR-012; one error is a synonym preference
2026-10-25,a1a2,tr,50,1,20261025,C21 kruispunt
2026-10-25,a1a2,en,50,0,20261025,"D19 ontsnappen was corrected, so 0 errors"
2026-10-25,b1,tr,50,0,20261023,
2026-10-25,b1,en,50,0,20261023,
`;

const pool = Array.from({ length: 100 }, (_, i) => `a${String(i).padStart(3, '0')}`);

test('mulberry32 and shuffle reproduce the B1 draw', () => {
  assert.equal(mulberry32(20261023)(), 0.11996041378006339);
  assert.equal(shuffle('abcdefghij'.split(''), mulberry32(20261023)).join(''), 'ecjgfdaihb');
});

test('shuffle copies its input', () => {
  const input = ['a', 'b', 'c'];
  shuffle(input, mulberry32(1));
  assert.deepEqual(input, ['a', 'b', 'c']);
});

test('drawSpotCheck oversamples released rows from 10 up', () => {
  const released = pool.slice(0, 12);
  const { initial, extension } = drawSpotCheck(pool, released, 7);
  assert.equal(initial.length, 20);
  assert.equal(extension.length, 30);
  assert.equal(initial.filter((id) => released.includes(id)).length, 5);
  assert.equal(new Set([...initial, ...extension]).size, 50);
  assert.ok(extension.every((id) => !released.includes(id)));
});

test('drawSpotCheck does not oversample under 10 released rows', () => {
  const { initial, extension } = drawSpotCheck(pool, pool.slice(0, 9), 7);
  const s = shuffle(pool, mulberry32(7));
  assert.deepEqual(initial, s.slice(0, 20));
  assert.deepEqual(extension, s.slice(20, 50));
});

test('drawSpotCheck full returns the old 50 sample', () => {
  const { initial, extension } = drawSpotCheck(pool, [], 7, true);
  assert.deepEqual(initial, shuffle(pool, mulberry32(7)).slice(0, 50));
  assert.deepEqual(extension, []);
});

test('drawSpotCheck is deterministic', () => {
  assert.deepEqual(drawSpotCheck(pool, pool.slice(0, 12), 3), drawSpotCheck(pool, pool.slice(0, 12), 3));
});

test('drawSpotCheck rejects a small pool and a released stranger', () => {
  assert.throws(() => drawSpotCheck(pool.slice(0, 49), [], 1), /pool has 49 ids, need 50/);
  assert.throws(() => drawSpotCheck(pool, ['zzz'], 1), /released id not in pool: zzz/);
});

test('judge', () => {
  assert.equal(judge(0, 20), 'pass');
  assert.equal(judge(1, 20), 'extend');
  assert.equal(judge(2, 20), 'fail');
  assert.equal(judge(1, 50), 'pass');
  assert.equal(judge(2, 50), 'fail');
});

test('parseTally reads by header and ignores a trailing newline', () => {
  const rows = parseTally(TALLY);
  assert.equal(rows.length, 6);
  assert.deepEqual(rows[0], { date: '2026-10-17', sheet: 'launch', lang: 'tr', words: 50, errors: 1, seed: '20261017', note: '' });
  assert.equal(rows[3].note, 'D19 ontsnappen was corrected, so 0 errors');
});

test('tallyStatus on the committed history', () => {
  const rows = parseTally(TALLY);
  assert.deepEqual(tallyStatus(rows, 'tr'), { words: 150, errors: 2, full: false });
  assert.deepEqual(tallyStatus(rows, 'en'), { words: 150, errors: 2, full: false });
  assert.deepEqual(tallyStatus(rows, 'de'), { words: 0, errors: 0, full: false });
});

test('tallyStatus takes the newest whole entries up to 200 words', () => {
  const row = (errors: number) => ({ date: 'd', sheet: 's', lang: 'tr', words: 50, errors, seed: '', note: '' });
  assert.deepEqual(tallyStatus([row(9), row(0), row(0), row(0), row(5)], 'tr'), { words: 200, errors: 5, full: true });
});

const ids = Array.from({ length: 60 }, (_, i) => `w${String(i).padStart(2, '0')}`);
const spotStage = (): SentenceStage => ({
  rows: [],
  translations: {
    tr: ids.map((word_id, i) => ({ word_id, text: 't', reviewed: i < 55, review_source: i < 52 ? 'roundtrip' : 'owner' })),
  },
});
const lvl = (id: string) => (id < 'w56' ? 'A1' : 'A2');

test('drawSentenceSpotCheck samples 20 then 30 more from the roundtrip-accepted rows of one level, with a fixed seed', () => {
  const { initial, extension } = drawSentenceSpotCheck(spotStage(), 'tr', 'A1', lvl, 20261204);
  assert.equal(initial.length, 20);
  assert.equal(extension.length, 30);
  assert.equal(new Set([...initial, ...extension]).size, 50);
  assert.equal([...initial, ...extension].every((id) => id < 'w52'), true);
  assert.deepEqual(drawSentenceSpotCheck(spotStage(), 'tr', 'A1', lvl, 20261204), { initial, extension });
});

test('drawSentenceSpotCheck refuses a level with fewer than 50 accepted rows', () => {
  assert.throws(() => drawSentenceSpotCheck(spotStage(), 'tr', 'A2', lvl, 1), /pool has 0 ids, need 50/);
});

test('sentenceSpotStatus: pass, extend after one error, stop after a second, per language and level', () => {
  const tally = (...rows: string[]) => parseTally(['date,sheet,lang,words,errors,seed,note', ...rows].join('\n'));
  assert.equal(sentenceSpotStatus(tally(), 'tr', 'A1'), 'draw');
  assert.equal(sentenceSpotStatus(tally('d,sentences-a1,tr,20,0,1,'), 'tr', 'A1'), 'pass');
  assert.equal(sentenceSpotStatus(tally('d,sentences-a1,tr,20,1,1,'), 'tr', 'A1'), 'extend');
  assert.equal(sentenceSpotStatus(tally('d,sentences-a1,tr,20,2,1,'), 'tr', 'A1'), 'fail');
  assert.equal(sentenceSpotStatus(tally('d,sentences-a1,tr,20,1,1,', 'd,sentences-a1,tr,30,1,1,'), 'tr', 'A1'), 'fail');
  assert.equal(sentenceSpotStatus(tally('d,sentences-a1,tr,20,1,1,', 'd,sentences-a1,tr,30,0,1,'), 'tr', 'A1'), 'pass');
  assert.equal(sentenceSpotStatus(tally('d,sentences-a1,tr,20,2,1,'), 'en', 'A1'), 'draw');
  assert.equal(sentenceSpotStatus(tally('d,sentences-a1,tr,20,2,1,'), 'tr', 'A2'), 'draw');
});
