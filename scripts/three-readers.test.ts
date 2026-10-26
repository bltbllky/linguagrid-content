import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validContent } from './fixtures/valid.ts';
import { applyRoundtrip } from './import-roundtrip.ts';
import { parseCsv } from './import-review.ts';
import { releaseRows } from './three-readers.ts';

const SENTENCE = 'Released: three readers agree (ADR-019).';
const TR_HEAD = 'id,dutch,en,tr_existing,tr_blind,class,reason,tr_blind_nl,class_nl,article_check,verdict';
const EN_HEAD = 'id,dutch,tr,en_existing,en_blind_tr,class,reason,en_blind_nl,class_nl,precheck,verdict';
const F_HEAD = 'id,dutch,field,current,suggestion,reason,severity';

const q = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
const csv = (...lines: string[]) => lines.join('\n') + '\n';

interface Row {
  id: string;
  cur: string;
  pivot?: string;
  nl?: string;
  cls?: string;
  clsNl?: string;
  article?: string;
  verdict?: string;
}
function trRow(r: Row): string {
  return [r.id, 'nl', 'en', r.cur, r.pivot ?? r.cur, r.cls ?? 'match', 'why', r.nl ?? r.cur, r.clsNl ?? 'match', r.article ?? 'match', r.verdict ?? 'owner'].map(q).join(',');
}
function enRow(r: Row): string {
  return [r.id, 'nl', 'tr', r.cur, r.pivot ?? r.cur, r.cls ?? 'match', 'why', r.nl ?? r.cur, r.clsNl ?? 'match', '', r.verdict ?? 'owner'].map(q).join(',');
}
const finding = (id: string, field = 'text', suggestion = 'x', severity = 'unsure', reason = 'poor wording') =>
  [id, 'nl', field, 'cur', suggestion, reason, severity].map(q).join(',');
const deepl = (...rows: [string, string, string][]) => csv('id,lang,dutch,mt', ...rows.map((r) => [r[0], r[1], 'nl', r[2]].map(q).join(',')));

function tr(rows: Row[], findings: string[], d: [string, string, string][], extra: Partial<Parameters<typeof releaseRows>[0]> = {}) {
  return releaseRows({
    lang: 'tr',
    result: csv(TR_HEAD, ...rows.map(trRow)),
    findings: csv(F_HEAD, ...findings),
    deepl: deepl(...d),
    ...extra,
  });
}
const out = (o: ReturnType<typeof releaseRows>) => parseCsv(o.result);
const cols = (o: ReturnType<typeof releaseRows>, id: string) => {
  const [h, ...rows] = out(o);
  const row = rows.find((r) => r[0] === id) ?? [];
  return Object.fromEntries(h.map((c, i) => [c, row[i]]));
};

describe('releaseRows', () => {
  it('releases a Turkish noun whose four texts agree', () => {
    const o = tr([{ id: 'noun-vergoeding', cur: 'tazminat' }], [finding('noun-vergoeding', 'text', 'ödenek, tazminat')], [['noun-vergoeding', 'tr', 'tazminat']]);
    const c = cols(o, 'noun-vergoeding');
    assert.deepEqual([c.verdict, c.deepl_same, c.deepl], ['OK', 'yes', 'tazminat']);
    assert.ok(parseCsv(o.findings)[1][5].endsWith(SENTENCE));
    assert.deepEqual(o.released, ['noun-vergoeding']);
    assert.deepEqual(o.counts, { read: 1, eligible: 1, released: 1 });
    assert.equal(out(o)[0].join(), `${TR_HEAD},deepl,deepl_same`);
  });

  it('releases English rows, including a bracketed part', () => {
    const o = releaseRows({
      lang: 'en',
      result: csv(EN_HEAD, enRow({ id: 'adj-matig', cur: 'moderate' }), enRow({ id: 'noun-hals', cur: 'neck (throat)', pivot: 'neck', nl: 'neck' })),
      findings: csv(F_HEAD, finding('adj-matig', 'english'), finding('noun-hals', 'english')),
      deepl: deepl(['adj-matig', 'en', 'moderate'], ['noun-hals', 'en', 'neck']),
    });
    assert.deepEqual(o.released, ['adj-matig', 'noun-hals']);
  });

  it('ignores DeepL rows of the other language and lets the last row win', () => {
    const o = tr([{ id: 'verb-a', cur: 'koşmak' }], [finding('verb-a')], [['verb-a', 'en', 'run'], ['verb-a', 'tr', 'yürümek'], ['verb-a', 'tr', 'koşmak']]);
    assert.deepEqual(o.released, ['verb-a']);
  });

  it('keeps differing readings with the owner and leaves the findings alone', () => {
    const o = tr([{ id: 'adv-a', cur: 'kısa süre', pivot: 'bir süre', nl: 'bir süre' }], [finding('adv-a')], [['adv-a', 'tr', 'bir süre']]);
    assert.equal(tr([{ id: 'v', cur: 'koşmak' }], [finding('v')], [['v', 'tr', 'koşmak.']]).released.length, 0); // a full stop differs
    const c = cols(o, 'adv-a');
    assert.deepEqual([c.verdict, c.deepl_same, c.deepl], ['owner', 'no', 'bir süre']);
    assert.deepEqual(o.held, [{ id: 'adv-a', why: 'differ' }]);
    assert.equal(parseCsv(o.findings)[1][5], 'poor wording');
    assert.deepEqual(o.counts, { read: 1, eligible: 1, released: 0 });
  });

  const held: [string, Row, string[], string][] = [
    ['severity wrong', { id: 'noun-a', cur: 'x' }, [finding('noun-a', 'text', 'y', 'wrong')], 'severity'],
    ['field level', { id: 'noun-a', cur: 'x' }, [finding('noun-a', 'level')], 'not-text'],
    ['field article', { id: 'noun-a', cur: 'x' }, [finding('noun-a', 'article')], 'not-text'],
    ['removal', { id: 'noun-a', cur: 'x' }, [finding('noun-a', 'text', 'remove from B1')], 'removal'],
    ['two findings', { id: 'noun-a', cur: 'x' }, [finding('noun-a'), finding('noun-a')], 'not-text'],
    ['no finding', { id: 'noun-a', cur: 'x' }, [], 'not-text'],
    ['class close', { id: 'noun-a', cur: 'x', cls: 'close' }, [finding('noun-a')], 'class'],
    ['class_nl mismatch', { id: 'noun-a', cur: 'x', clsNl: 'mismatch' }, [finding('noun-a')], 'class'],
    ['article differs', { id: 'noun-a', cur: 'x', article: 'differ' }, [finding('noun-a')], 'article'],
    ['hold', { id: 'noun-a', cur: 'x' }, [finding('noun-a')], 'hold'],
    ['shared', { id: 'noun-a', cur: 'x' }, [finding('noun-a')], 'shared'],
    ['no reading', { id: 'noun-a', cur: 'x' }, [finding('noun-a')], 'no-reading'],
  ];
  for (const [name, row, findings, why] of held) {
    it(`holds: ${name}`, () => {
      const d: [string, string, string][] = why === 'no-reading' ? [] : [['noun-a', 'tr', 'x']];
      const o = tr([row], findings, d, {
        hold: why === 'hold' ? ['noun-a'] : undefined,
        otherFindings: why === 'shared' ? csv(F_HEAD, finding('noun-a', 'english')) : undefined,
      });
      assert.deepEqual(o.held, [{ id: 'noun-a', why }]);
      const c = cols(o, 'noun-a');
      assert.equal(c.verdict, 'owner');
      assert.notEqual(c.deepl_same, 'yes');
      assert.deepEqual(o.released, []);
      if (why === 'no-reading') assert.equal(c.deepl_same, '');
    });
  }

  it('gives a non-eligible row its reading but an empty deepl_same', () => {
    const o = tr([{ id: 'noun-a', cur: 'x', cls: 'close' }], [finding('noun-a')], [['noun-a', 'tr', 'x']]);
    const c = cols(o, 'noun-a');
    assert.deepEqual([c.deepl, c.deepl_same], ['x', '']);
  });

  it('treats a Turkish verb with an empty article_check as eligible', () => {
    const o = tr([{ id: 'verb-checken', cur: 'kontrol etmek', article: '' }], [finding('verb-checken')], [['verb-checken', 'tr', 'kontrol etmek']]);
    assert.deepEqual(o.released, ['verb-checken']);
  });

  it('does not touch rows with another verdict', () => {
    const o = tr([{ id: 'verb-a', cur: 'x', verdict: 'OK' }, { id: 'verb-b', cur: 'x', verdict: 'close' }], [finding('verb-a'), finding('verb-b')], [['verb-a', 'tr', 'x'], ['verb-b', 'tr', 'x']]);
    for (const id of ['verb-a', 'verb-b']) assert.equal(cols(o, id).deepl_same, '');
    assert.deepEqual(o.released, []);
    assert.deepEqual(o.held, []);
  });

  it('is idempotent', () => {
    const input = {
      lang: 'tr' as const,
      result: csv(TR_HEAD, trRow({ id: 'noun-a', cur: 'x' }), trRow({ id: 'noun-b', cur: 'y', cls: 'close' })),
      findings: csv(F_HEAD, finding('noun-a'), finding('noun-b')),
      deepl: deepl(['noun-a', 'tr', 'x'], ['noun-b', 'tr', 'y']),
    };
    const once = releaseRows(input);
    const twice = releaseRows({ ...input, result: once.result, findings: once.findings });
    assert.equal(twice.result, once.result);
    assert.equal(twice.findings, once.findings);
    assert.deepEqual(twice.released, ['noun-a']);
    assert.equal(once.findings.split(SENTENCE).length, 2);
  });

  it('puts a released row back to the owner when the readings no longer agree', () => {
    const input = {
      lang: 'tr' as const,
      result: csv(TR_HEAD, trRow({ id: 'noun-a', cur: 'x' })),
      findings: csv(F_HEAD, finding('noun-a')),
      deepl: deepl(['noun-a', 'tr', 'x']),
    };
    const once = releaseRows(input);
    const again = releaseRows({ ...input, result: once.result, findings: once.findings, deepl: deepl(['noun-a', 'tr', 'z']) });
    assert.deepEqual([cols(again, 'noun-a').verdict, cols(again, 'noun-a').deepl_same], ['owner', 'no']);
    assert.equal(parseCsv(once.findings)[1][5], `poor wording ${SENTENCE}`);
    assert.equal(parseCsv(again.findings)[1][5], 'poor wording');
  });

  it('reads a BOM and CRLF files and quotes cells', () => {
    const o = releaseRows({
      lang: 'tr',
      result: '﻿' + csv(TR_HEAD, trRow({ id: 'noun-a', cur: 'a, b' })).replaceAll('\n', '\r\n'),
      findings: csv(F_HEAD, finding('noun-a')).replaceAll('\n', '\r\n'),
      deepl: deepl(['noun-a', 'tr', 'a']),
    });
    assert.deepEqual(o.released, ['noun-a']);
    assert.ok(o.result.includes('"a, b"'));
    assert.ok(!o.result.includes('\r') && o.result.endsWith('\n'));
  });

  it('throws on a sheet without the required columns and does not ask English for article_check', () => {
    assert.throws(() => releaseRows({ lang: 'tr', result: 'id,dutch\nx,y\n', findings: csv(F_HEAD), deepl: deepl() }), /Not a round-trip sheet; expected columns/);
    assert.throws(() => releaseRows({ lang: 'tr', result: csv('id,tr_existing', 'a,b'), findings: csv(F_HEAD), deepl: deepl() }), /Not a round-trip sheet/);
    assert.doesNotThrow(() => releaseRows({ lang: 'en', result: csv(EN_HEAD, enRow({ id: 'adj-a', cur: 'x' })), findings: csv(F_HEAD), deepl: deepl() }));
  });

  it('feeds import-roundtrip: the released row is accepted, the owner row is left', () => {
    const o = tr(
      [{ id: 'noun-tandarts', cur: 'diş hekimi' }, { id: 'verb-lopen', cur: 'yürümek', cls: 'close' }],
      [finding('noun-tandarts'), finding('verb-lopen')],
      [['noun-tandarts', 'tr', 'diş hekimi'], ['verb-lopen', 'tr', 'yürümek']],
    );
    const content = validContent();
    for (const n of content.annotations) (n.reviewed = false), delete n.review_source;
    for (const t of content.translations.tr.words) (t.reviewed = false), delete t.review_source;
    const { content: after } = applyRoundtrip(content, o.result);
    assert.equal(after.translations.tr.words[0].reviewed, true);
    assert.equal(after.translations.tr.words[0].review_source, 'roundtrip');
    assert.equal(after.translations.tr.words[1].reviewed, false);
  });
});
