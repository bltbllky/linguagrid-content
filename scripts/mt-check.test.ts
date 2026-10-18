import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  ENDPOINT,
  buildRows,
  compare,
  liveKey,
  loadRelease,
  parseArgs,
  normalise,
  planRun,
  renderReport,
  reportPath,
  runCheck,
  translateAll,
  type MtLang,
  type MtRow,
} from './mt-check.ts';

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'lgc-mt-'));
  const dir = join(root, 'release', '1');
  mkdirSync(dir, { recursive: true });
  const put = (name: string, value: unknown) => writeFileSync(join(name.startsWith('manifest') ? root : dir, name), JSON.stringify(value));
  put('manifest.json', { content_version: 1 });
  put('words.json', [
    { id: 'noun-tandarts', lemma_nl: 'tandarts', pos: 'noun', cefr: 'A1', source: 'x' },
    { id: 'verb-lopen', lemma_nl: 'lopen', pos: 'verb', cefr: 'A1', source: 'x' },
    { id: 'noun-spoor', lemma_nl: 'spoor', pos: 'noun', cefr: 'A1', source: 'x' },
  ]);
  put('annotations.json', [
    { word_id: 'noun-tandarts', text_tr: 'a', article: 'de', category_id: 'c', reviewed: true },
    { word_id: 'verb-lopen', text_tr: 'b', article: null, category_id: 'c', reviewed: true },
    { word_id: 'noun-spoor', text_tr: 'c', article: 'het', category_id: 'c', reviewed: true },
  ]);
  put('translations-tr.json', {
    lang: 'tr',
    words: [
      { word_id: 'noun-tandarts', text: 'diş hekimi, dişçi' },
      { word_id: 'verb-lopen', text: 'yürümek' },
      { word_id: 'noun-spoor', text: 'iz' },
    ],
    categories: [],
  });
  put('translations-en.json', {
    lang: 'en',
    words: [
      { word_id: 'noun-tandarts', text: 'dentist' },
      { word_id: 'verb-lopen', text: 'to walk' },
    ],
    categories: [],
  });
  return root;
}

type Call = { url: string; init: RequestInit };
function mockFetch(table: Record<string, string>, calls: Call[] = []): typeof fetch {
  return (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const body = JSON.parse(init.body as string) as { q: string[]; target: string };
    const translations = body.q.map((q) => ({ translatedText: table[`${body.target}:${q}`] ?? 'x' }));
    return new Response(JSON.stringify({ data: { translations } }));
  }) as unknown as typeof fetch;
}

describe('loadRelease', () => {
  it('reads the manifest version and both languages, and rejects a missing folder', () => {
    const root = fixture();
    const r = loadRelease(root);
    assert.equal(r.version, 1);
    assert.equal(r.words.length, 3);
    assert.deepEqual(Object.keys(r.translations).sort(), ['en', 'tr']);
    assert.throws(() => loadRelease(root, 2), /No release folder release\/2/);
  });

  it('leaves out a language without a file', () => {
    const root = fixture();
    rmSync(join(root, 'release', '1', 'translations-en.json'));
    assert.deepEqual(Object.keys(loadRelease(root).translations), ['tr']);
  });
});

describe('buildRows', () => {
  it('builds rows with articles, skips words without text, filters ids', () => {
    const r = loadRelease(fixture());
    assert.deepEqual(buildRows(r, 'tr'), [
      { id: 'noun-tandarts', dutch: 'de tandarts', ours: 'diş hekimi, dişçi' },
      { id: 'verb-lopen', dutch: 'lopen', ours: 'yürümek' },
      { id: 'noun-spoor', dutch: 'het spoor', ours: 'iz' },
    ]);
    assert.equal(buildRows(r, 'en').length, 2);
    assert.equal(buildRows(r, 'tr', [' noun-spoor']).length, 1);
    assert.throws(() => buildRows(r, 'tr', ['noun-x']), /Unknown word id: noun-x/);
  });
});

describe('compare and normalise', () => {
  const cases: [string, string, MtLang, string][] = [
    ['diş hekimi, dişçi', 'Dişçi', 'tr', 'match'],
    ['saat (süre)', 'saat', 'tr', 'match'],
    ['to walk', 'walk', 'en', 'match'],
    ['dentist', 'the dentist.', 'en', 'match'],
    ['İz', 'iz', 'tr', 'match'],
    ['sahip olmak', 'olmak', 'tr', 'partial'],
    ['kart', 'kartal', 'tr', 'mismatch'],
    ['iz', 'parça', 'tr', 'mismatch'],
  ];
  for (const [a, b, l, want] of cases) {
    it(`${a} vs ${b} (${l}) is ${want}`, () => assert.equal(compare(a, b, l), want));
  }
  it('normalises', () => assert.equal(normalise('  An  Apple (fruit)! ', 'en'), 'apple'));
});

describe('translateAll', () => {
  const texts = Array.from({ length: 130 }, () => 'a');
  it('batches, sends the key only in the header', async () => {
    const calls: Call[] = [];
    const budget = { cap: 1000, used: 0 };
    const out = await translateAll(texts, 'tr', { key: 'test-key', fetch: mockFetch({ 'tr:a': 'b' }, calls), budget });
    assert.equal(out.length, 130);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls.map((c) => (JSON.parse(c.init.body as string) as { q: string[] }).q.length), [128, 2]);
    for (const c of calls) {
      assert.equal(c.url, ENDPOINT);
      assert.equal((c.init.headers as Record<string, string>)['x-goog-api-key'], 'test-key');
      const b = JSON.parse(c.init.body as string) as Record<string, string>;
      assert.equal(b.source, 'nl');
      assert.equal(b.target, 'tr');
      assert.equal(b.format, 'text');
    }
    assert.equal(budget.used, 130);
  });

  it('stops before a batch that would pass the cap', async () => {
    const calls: Call[] = [];
    await assert.rejects(
      translateAll(texts, 'tr', { key: 'test-key', fetch: mockFetch({}, calls), budget: { cap: 129, used: 0 } }),
      { message: 'Character cap of 129 reached after 128 characters; the rest was not sent.' },
    );
    assert.equal(calls.length, 1);
  });

  it('reports API errors without the key', async () => {
    const f = (async () =>
      new Response(JSON.stringify({ error: { message: 'API key not valid. Please pass a valid API key.' } }), {
        status: 403,
      })) as unknown as typeof fetch;
    await assert.rejects(
      translateAll(['a'], 'tr', { key: 'test-key', fetch: f, budget: { cap: 10, used: 0 } }),
      (e: Error) => {
        assert.equal(e.message, 'Cloud Translation API error 403: API key not valid. Please pass a valid API key.');
        assert.ok(!e.message.includes('test-key'));
        return true;
      },
    );
  });

  it('falls back to the status text when the error body is not JSON', async () => {
    const f = (async () => new Response('nope', { status: 500, statusText: 'Server Error' })) as unknown as typeof fetch;
    await assert.rejects(translateAll(['a'], 'tr', { key: 'k', fetch: f, budget: { cap: 10, used: 0 } }), {
      message: 'Cloud Translation API error 500: Server Error',
    });
  });

  it('rejects a response of the wrong length', async () => {
    const f = (async () =>
      new Response(JSON.stringify({ data: { translations: [{ translatedText: 'x' }] } }))) as unknown as typeof fetch;
    await assert.rejects(translateAll(['a', 'b'], 'tr', { key: 'k', fetch: f, budget: { cap: 10, used: 0 } }), {
      message: 'Cloud Translation API returned 1 translations for 2 texts',
    });
  });
});

describe('planRun and runCheck', () => {
  const table = {
    'tr:de tandarts': 'dişçi',
    'tr:lopen': 'koşmak',
    'tr:het spoor': 'ray',
    'en:de tandarts': 'the dentist',
    'en:lopen': 'walk',
  };
  const rows = () => {
    const r = loadRelease(fixture());
    return { tr: buildRows(r, 'tr'), en: buildRows(r, 'en') } as Record<MtLang, MtRow[]>;
  };

  it('plans and enforces the cap', () => {
    assert.deepEqual(planRun(rows(), 100_000), [
      { lang: 'tr', words: 3, requests: 1, chars: 25 },
      { lang: 'en', words: 2, requests: 1, chars: 16 },
    ]);
    assert.throws(() => planRun(rows(), 30), {
      message: 'This run needs 41 characters, more than the cap of 30 (--max-chars). Nothing was sent.',
    });
  });

  it('classifies results and renders the report', async () => {
    const { results, chars } = await runCheck(rows(), { key: 'k', fetch: mockFetch(table), cap: 100_000 });
    assert.equal(chars, 41);
    assert.deepEqual(
      results.filter((r) => r.lang === 'tr').map((r) => r.cls),
      ['match', 'mismatch', 'mismatch'],
    );
    assert.deepEqual(
      results.filter((r) => r.lang === 'en').map((r) => r.cls),
      ['match', 'match'],
    );
    const md = renderReport({ date: '2026-10-18', version: 1, chars }, results);
    assert.ok(md.includes('Machine translated: every text in the "MT" column is an automatic translation from Google Translate (Cloud Translation API, model nmt). It is a review hint for the content editor, never content (ADR-014).'));
    assert.ok(md.includes('- tr: 1 match, 0 partial, 2 mismatch'));
    assert.ok(md.includes('- en: 2 match, 0 partial, 0 mismatch'));
    assert.ok(md.includes('| noun-spoor | het spoor | iz | ray |  |'));
    assert.ok(md.includes('## en mismatches\n\nNone.'));
    assert.ok(md.endsWith('\n') && !md.endsWith('\n\n'));
    const ids = renderReport({ date: '2026-10-18', version: 1, chars, ids: ['noun-spoor'] }, results);
    assert.ok(ids.includes(' · rows: noun-spoor\n'));
    const esc = renderReport({ date: 'd', version: 1, chars: 1 }, [
      { id: 'i', dutch: 'a|b', ours: 'o', mt: 'm', lang: 'tr', cls: 'mismatch' },
    ]);
    assert.ok(esc.includes('a\\|b'));
    assert.ok(!esc.includes('- en:'));
  });

  it('names the report file', () => {
    assert.equal(reportPath('2026-10-18', false), 'review/mt-check/2026-10-18.md');
    assert.equal(reportPath('2026-10-18', true), 'review/mt-check/2026-10-18-rows.md');
  });
});

describe('parseArgs and liveKey', () => {
  it('parses flags and the default cap', () => {
    assert.deepEqual(parseArgs(['--dry-run', '--lang', 'tr', '--ids', 'a, b', '--release', '2', '--max-chars', '50']), {
      dryRun: true,
      lang: 'tr',
      release: 2,
      ids: ['a', 'b'],
      cap: 50,
    });
    assert.equal(parseArgs([]).cap, 100_000);
  });

  it('rejects a flag without a value instead of dropping it', () => {
    for (const f of ['--ids', '--max-chars', '--lang', '--release']) {
      assert.throws(() => parseArgs([f]), { message: `${f} needs a value` });
    }
    assert.throws(() => parseArgs(['--ids', '--dry-run']), { message: '--ids needs a value' });
    assert.throws(() => parseArgs(['--ids', ' ']), { message: '--ids needs a value' });
  });

  it('rejects bad values and stray arguments', () => {
    assert.throws(() => parseArgs(['--lang', 'de']), /--lang must be tr or en/);
    assert.throws(() => parseArgs(['--max-chars', '0']), /positive integer/);
    assert.throws(() => parseArgs(['--release', 'x']), /--release must be a positive integer/);
    assert.throws(() => parseArgs(['oops']), /^Error: Usage|Usage: npm run mt-check/);
  });

  it('refuses a live run in CI and without a key', () => {
    assert.throws(() => liveKey({ CI: 'true', GOOGLE_TRANSLATE_API_KEY: 'k' }), /does not run in CI/);
    assert.throws(() => liveKey({}), /GOOGLE_TRANSLATE_API_KEY is not set/);
    assert.equal(liveKey({ GOOGLE_TRANSLATE_API_KEY: 'k' }), 'k');
  });
});

describe('timeout', () => {
  it('aborts a hanging request with an error and no key in it', async () => {
    const hang = ((_u: string, init: RequestInit) =>
      new Promise((_r, rej) => init.signal?.addEventListener('abort', () => rej(new Error('aborted'))))) as unknown as typeof fetch;
    await assert.rejects(
      translateAll(['a'], 'tr', { key: 'test-key', fetch: hang, budget: { cap: 10, used: 0 }, timeoutMs: 20 }),
      (e: Error) => /timed out/.test(e.message) && !e.message.includes('test-key'),
    );
  });
});
