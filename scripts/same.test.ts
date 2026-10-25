import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { agree, headWords, same, type SameLang } from './same.ts';

describe('headWords', () => {
  const cases: [string, SameLang, string[]][] = [
    ['Neck (throat)', 'en', ['neck']],
    ['to escape', 'en', ['escape']],
    ['  The   house ', 'en', ['house']],
    ['life-long', 'en', ['lifelong']],
    ['yok, gelmemiş (işte, okulda)', 'tr', ['yok', 'gelmemiş']],
    ['IŞIK', 'tr', ['ışık']],
    ['the cat; to run', 'en', ['cat', 'run']],
    ['a', 'en', ['a']],
    ['(only a hint)', 'en', []],
    ['dal (arı', 'tr', ['dal']],
    ['big (b (c) d) cat', 'en', ['big cat']],
    ['x, X / x', 'en', ['x']],
  ];
  for (const [text, lang, want] of cases) {
    it(`${JSON.stringify(text)} (${lang})`, () => assert.deepEqual(headWords(text, lang), want));
  }
});

describe('same', () => {
  const yes: [string, string, SameLang][] = [
    ['tazminat', 'tazminat', 'tr'],
    ['protein', 'protein, yumurta akı', 'tr'],
    ['moderate', 'moderate', 'en'],
    ['lifelong', 'life-long', 'en'],
    ['neck (throat)', 'neck', 'en'],
  ];
  const no: [string, string, SameLang][] = [
    ['kısa süre', 'bir süre', 'tr'],
    ['diş yapısı', 'dişler', 'tr'],
    ['kapamak', 'kapatmak', 'tr'],
    ['testing', 'to test', 'en'],
    ['()', '()', 'en'],
    ['', '', 'tr'],
  ];
  for (const [a, b, l] of yes) it(`same: ${a} | ${b}`, () => assert.equal(same(a, b, l), true));
  for (const [a, b, l] of no) it(`not same: ${a} | ${b}`, () => assert.equal(same(a, b, l), false));
});

describe('agree', () => {
  it('true when every reading is same', () => assert.equal(agree('tazminat', ['tazminat', 'tazminat', 'tazminat'], 'tr'), true));
  it('false when one differs', () => assert.equal(agree('tazminat', ['tazminat', 'ödenek', 'tazminat'], 'tr'), false));
  it('false without readings', () => assert.equal(agree('tazminat', [], 'tr'), false));
  it('false with a blank reading', () => assert.equal(agree('tazminat', ['tazminat', ''], 'tr'), false));
});
