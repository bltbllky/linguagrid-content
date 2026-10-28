import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';

import {
  BATCH_SIZE,
  RETRY_WAITS_MS,
  buildRows,
  csvPath,
  endpointFor,
  liveKey,
  loadRelease,
  loadStageRelease,
  missingTexts,
  parseArgs,
  planRun,
  renderCsv,
  renderReport,
  reportPath,
  runCheck,
  translateAll,
  type MtLang,
  type MtRow,
  type Release,
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

/** A live content root (one word) plus a B1 stage: `noun-x` has a het article and a Turkish text, `verb-y` has neither. */
function stageFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'lgc-mt-stage-'));
  const put = (file: string, value: unknown) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), JSON.stringify(value));
  };
  put('manifest.json', { content_version: 1, min_app_version: { ios: '1.0.0', android: '1.0.0' }, files: [] });
  put('data/words.json', [{ id: 'noun-tandarts', lemma_nl: 'tandarts', pos: 'noun', cefr: 'A1', source: 'nt2lex' }]);
  put('data/annotations.json', []);
  put('data/categories.json', []);
  put('data/translations/tr.json', { lang: 'tr', words: [], categories: [] });
  put('data/b1/words.json', [
    { id: 'noun-x', lemma_nl: 'x', pos: 'noun', cefr: 'B1', source: 'own' },
    { id: 'verb-y', lemma_nl: 'y', pos: 'verb', cefr: 'B1', source: 'own' },
  ]);
  put('data/b1/annotations.json', [{ word_id: 'noun-x', article: 'het', category_id: 'b1-c', reviewed: true }]);
  put('data/b1/categories.json', [{ id: 'b1-c', cefr: 'B1', order: 1 }]);
  put('data/b1/translations/tr.json', { lang: 'tr', words: [{ word_id: 'noun-x', text: 'iz', reviewed: true }], categories: [] });
  return root;
}

type Call = { url: string; init: RequestInit };
function mockFetch(table: Record<string, string>, calls: Call[] = []): typeof fetch {
  return (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const body = JSON.parse(init.body as string) as { text: string[]; target_lang: string };
    const translations = body.text.map((t) => ({ text: table[`${body.target_lang}:${t}`] ?? 'x' }));
    return new Response(JSON.stringify({ translations }));
  }) as unknown as typeof fetch;
}
const sequence = (...responses: Response[]): { f: typeof fetch; calls: Call[] } => {
  const calls: Call[] = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return responses[Math.min(calls.length, responses.length) - 1].clone();
  }) as unknown as typeof fetch;
  return { f, calls };
};
const ok = () => new Response(JSON.stringify({ translations: [{ text: 'b' }] }));

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

describe('loadStageRelease', () => {
  it('reads only the staged words with their articles and texts, as release 0', () => {
    const r = loadStageRelease(stageFixture());
    assert.equal(r.version, 0);
    assert.deepEqual(
      r.words.map((w) => w.id),
      ['noun-x', 'verb-y'],
    );
    assert.deepEqual(buildRows(r, 'tr'), [{ id: 'noun-x', dutch: 'het x', ours: 'iz' }]);
  });

  it('refuses a live id as unknown and accepts a staged one', () => {
    const r = loadStageRelease(stageFixture());
    assert.throws(() => buildRows(r, 'tr', ['noun-tandarts']), { message: 'Unknown word id: noun-tandarts' });
    assert.deepEqual(buildRows(r, 'tr', ['noun-x']), [{ id: 'noun-x', dutch: 'het x', ours: 'iz' }]);
  });

  it('rejects an unknown stage', () => {
    assert.throws(() => loadStageRelease(stageFixture(), 'c1'), { message: 'Unknown stage "c1"; staged: b1, a1a2, b2, core' });
  });

  it('reads the other stages, an absent folder being empty', () => {
    assert.deepEqual(loadStageRelease(stageFixture(), 'a1a2').words, []);
    assert.deepEqual(loadStageRelease(stageFixture(), 'b2').words, []);
  });
});

describe('missingTexts', () => {
  const r: Release = {
    version: 0,
    words: [
      { id: 'noun-x', lemma_nl: 'x', pos: 'noun' },
      { id: 'noun-y', lemma_nl: 'y', pos: 'noun' },
    ],
    annotations: [],
    translations: { tr: [{ word_id: 'noun-x', text: 'a' }, { word_id: 'noun-z', text: 'b' }] },
  };

  it('lists the known ids without a text, trimmed and in the order given', () => {
    assert.deepEqual(missingTexts(r, 'tr', ['noun-x', ' noun-y']), ['noun-y']);
    assert.deepEqual(missingTexts(r, 'tr', ['noun-y', 'noun-x']), ['noun-y']);
  });

  it('lists every known id when the language has no file, and none when all have text', () => {
    assert.deepEqual(missingTexts(r, 'en', ['noun-x', 'noun-y']), ['noun-x', 'noun-y']);
    assert.deepEqual(missingTexts(r, 'tr', ['noun-x']), []);
  });

  it('counts an empty text as missing, like buildRows, and leaves unknown ids to buildRows', () => {
    const empty: Release = { ...r, translations: { tr: [{ word_id: 'noun-y', text: '' }] } };
    assert.deepEqual(missingTexts(empty, 'tr', ['noun-y']), ['noun-y']);
    assert.deepEqual(missingTexts(r, 'tr', ['noun-q']), []);
  });
});

describe('endpointFor', () => {
  it('uses the Free host for a :fx key and the Pro host otherwise', () => {
    assert.equal(endpointFor('abc:fx'), 'https://api-free.deepl.com/v2/translate');
    assert.equal(endpointFor('abc'), 'https://api.deepl.com/v2/translate');
  });
});

describe('translateAll', () => {
  const texts = Array.from({ length: 130 }, () => 'a');
  const sleep = (waits: number[]) => async (ms: number) => {
    waits.push(ms);
  };

  it('batches by 50, sends the key only in the header', async () => {
    const calls: Call[] = [];
    const budget = { cap: 1000, used: 0 };
    const out = await translateAll(texts, 'tr', {
      key: 'test-key:fx',
      fetch: mockFetch({ 'TR:a': 'b' }, calls),
      budget,
    });
    assert.equal(BATCH_SIZE, 50);
    assert.equal(out.length, 130);
    assert.ok(out.every((t) => t === 'b'));
    assert.deepEqual(
      calls.map((c) => (JSON.parse(c.init.body as string) as { text: string[] }).text.length),
      [50, 50, 30],
    );
    for (const c of calls) {
      assert.equal(c.url, 'https://api-free.deepl.com/v2/translate');
      assert.equal((c.init.headers as Record<string, string>).authorization, 'DeepL-Auth-Key test-key:fx');
      const b = JSON.parse(c.init.body as string) as Record<string, string>;
      assert.equal(b.source_lang, 'NL');
      assert.equal(b.target_lang, 'TR');
    }
    assert.equal(budget.used, 130);
  });

  it('uses the Pro host and EN-GB for a key without :fx', async () => {
    const calls: Call[] = [];
    await translateAll(['a'], 'en', { key: 'test-key', fetch: mockFetch({}, calls), budget: { cap: 10, used: 0 } });
    assert.equal(calls[0].url, 'https://api.deepl.com/v2/translate');
    assert.ok(!calls[0].url.includes('test-key'));
    assert.equal((JSON.parse(calls[0].init.body as string) as { target_lang: string }).target_lang, 'EN-GB');
  });

  it('stops before a batch that would pass the cap', async () => {
    const calls: Call[] = [];
    await assert.rejects(
      translateAll(texts, 'tr', { key: 'test-key', fetch: mockFetch({}, calls), budget: { cap: 51, used: 0 } }),
      { message: 'Character cap of 51 reached after 50 characters; the rest was not sent.' },
    );
    assert.equal(calls.length, 1);
  });

  it('retries a 429 once and counts the batch once', async () => {
    const waits: number[] = [];
    const { f, calls } = sequence(new Response('{}', { status: 429 }), ok());
    const budget = { cap: 10, used: 0 };
    const out = await translateAll(['a'], 'tr', { key: 'k', fetch: f, budget, sleep: sleep(waits) });
    assert.deepEqual(out, ['b']);
    assert.deepEqual(waits, [1000]);
    assert.equal(calls.length, 2);
    assert.equal(budget.used, 1);
  });

  it('gives up after three retries', async () => {
    const waits: number[] = [];
    const { f, calls } = sequence(new Response(JSON.stringify({ message: 'Too many requests' }), { status: 429 }));
    await assert.rejects(
      translateAll(['a'], 'tr', { key: 'k', fetch: f, budget: { cap: 10, used: 0 }, sleep: sleep(waits) }),
      { message: 'DeepL API error 429: Too many requests' },
    );
    assert.deepEqual(waits, RETRY_WAITS_MS);
    assert.deepEqual(waits, [1000, 2000, 4000]);
    assert.equal(calls.length, 4);
  });

  it('retries a 503 the same way', async () => {
    const waits: number[] = [];
    const { f } = sequence(new Response('{}', { status: 503 }), new Response('{}', { status: 503 }), ok());
    const out = await translateAll(['a'], 'tr', { key: 'k', fetch: f, budget: { cap: 10, used: 0 }, sleep: sleep(waits) });
    assert.deepEqual(out, ['b']);
    assert.deepEqual(waits, [1000, 2000]);
  });

  it('stops at once on 456 with the quota message', async () => {
    const waits: number[] = [];
    const { f, calls } = sequence(new Response('{}', { status: 456 }));
    await assert.rejects(
      translateAll(['a'], 'tr', { key: 'k', fetch: f, budget: { cap: 10, used: 0 }, sleep: sleep(waits) }),
      {
        message:
          'DeepL quota exceeded (456): the monthly character limit is used up; nothing more was sent.',
      },
    );
    assert.equal(calls.length, 1);
    assert.deepEqual(waits, []);
  });

  it('reports other API errors without the key and without retrying', async () => {
    const waits: number[] = [];
    const { f, calls } = sequence(new Response(JSON.stringify({ message: 'Authentication failed' }), { status: 403 }));
    await assert.rejects(
      translateAll(['a'], 'tr', { key: 'test-key', fetch: f, budget: { cap: 10, used: 0 }, sleep: sleep(waits) }),
      (e: Error) => {
        assert.equal(e.message, 'DeepL API error 403: Authentication failed');
        assert.ok(!e.message.includes('test-key'));
        return true;
      },
    );
    assert.equal(calls.length, 1);
    assert.deepEqual(waits, []);
  });

  it('falls back to the status text when the error body is not JSON', async () => {
    const { f } = sequence(new Response('nope', { status: 500, statusText: 'Server Error' }));
    await assert.rejects(
      translateAll(['a'], 'tr', { key: 'k', fetch: f, budget: { cap: 10, used: 0 }, sleep: sleep([]) }),
      { message: 'DeepL API error 500: Server Error' },
    );
  });

  it('rejects a response of the wrong length', async () => {
    const f = (async () => new Response(JSON.stringify({ translations: [{ text: 'x' }] }))) as unknown as typeof fetch;
    await assert.rejects(translateAll(['a', 'b'], 'tr', { key: 'k', fetch: f, budget: { cap: 10, used: 0 } }), {
      message: 'DeepL API returned 1 translations for 2 texts',
    });
  });
});

describe('planRun and runCheck', () => {
  const table = { 'TR:het spoor': 'ray', 'TR:de tandarts': 'diş hekimi', 'EN-GB:de tandarts': 'the dentist' };
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

  it('returns readings without a class', async () => {
    const r = loadRelease(fixture());
    const { results, chars } = await runCheck(
      { tr: buildRows(r, 'tr', ['noun-spoor']), en: buildRows(r, 'en', ['noun-spoor']) },
      { key: 'k', fetch: mockFetch(table), cap: 100_000 },
    );
    assert.equal(chars, 9);
    assert.deepEqual(results, [{ id: 'noun-spoor', dutch: 'het spoor', ours: 'iz', lang: 'tr', mt: 'ray' }]);
    assert.ok(!('cls' in results[0]));
  });

  it('renders the report with one row per id', async () => {
    const { results, chars } = await runCheck(rows(), { key: 'k', fetch: mockFetch(table), cap: 100_000 });
    const md = renderReport({ date: '2026-10-21', version: 1, chars, ids: ['noun-tandarts', 'verb-lopen', 'noun-spoor'] }, results);
    assert.ok(md.startsWith('# DeepL second opinion 2026-10-21\n\n'));
    assert.ok(
      md.includes(
        'Machine translated by DeepL: every "DeepL" text below is an automatic translation (DeepL API, source NL). It is advisory context for a question to the owner, never a verdict and never content (ADR-015).',
      ),
    );
    assert.ok(md.includes('Release 1 · 41 characters sent · rows: noun-tandarts, verb-lopen, noun-spoor\n'));
    assert.ok(md.includes('| id | Dutch sent | our TR | DeepL TR | our EN | DeepL EN |\n|---|---|---|---|---|---|\n'));
    assert.ok(md.includes('| noun-spoor | het spoor | iz | ray | - | - |'));
    assert.ok(md.includes('| noun-tandarts | de tandarts | diş hekimi, dişçi | diş hekimi | dentist | the dentist |'));
    assert.equal(md.split('\n| noun-spoor').length, 2);
    assert.ok(!/mismatch|match/i.test(md));
    assert.ok(md.endsWith('|\n') && !md.endsWith('\n\n'));
  });

  it('escapes pipes and omits a language without readings', () => {
    const esc = renderReport({ date: 'd', version: 1, chars: 1 }, [
      { id: 'i', dutch: 'a|b', ours: 'o', mt: 'm', lang: 'tr' },
    ]);
    assert.ok(esc.includes('| i | a\\|b | o | m | - | - |'));
    assert.ok(!esc.includes('rows:'));
  });

  it('labels a stage report and keeps the release label by default', () => {
    const stage = renderReport({ date: '2026-10-23', version: 0, chars: 9, label: 'Stage b1' }, []);
    assert.ok(stage.includes('Stage b1 · 9 characters sent\n'));
    assert.ok(!stage.includes('Release 0'));
    assert.ok(renderReport({ date: '2026-10-23', version: 0, chars: 9, label: 'Stage a1a2' }, []).includes('Stage a1a2 · 9 characters sent\n'));
    assert.ok(renderReport({ date: 'd', version: 3, chars: 1 }, []).includes('Release 3 · 1 characters sent\n'));
  });

  it('names the report file', () => {
    assert.equal(reportPath('2026-10-18', false), 'review/mt-check/2026-10-18.md');
    assert.equal(reportPath('2026-10-18', true), 'review/mt-check/2026-10-18-rows.md');
  });
});

describe('parseArgs and liveKey', () => {
  it('requires --ids', () => {
    assert.throws(() => parseArgs([]), {
      message: '--ids is required: mt-check reads only the rows the content editor marks for the owner',
    });
    assert.throws(() => parseArgs(['--dry-run']), /--ids is required/);
  });

  it('parses flags and the default cap', () => {
    assert.deepEqual(parseArgs(['--dry-run', '--lang', 'tr', '--ids', 'a, b', '--release', '2', '--max-chars', '50']), {
      dryRun: true,
      lang: 'tr',
      release: 2,
      ids: ['a', 'b'],
      cap: 50,
    });
    assert.deepEqual(parseArgs(['--ids', 'noun-spoor', '--dry-run']).ids, ['noun-spoor']);
    assert.equal(parseArgs(['--ids', 'a']).cap, 100_000);
  });

  it('rejects a flag without a value instead of dropping it', () => {
    for (const f of ['--ids', '--max-chars', '--lang', '--release']) {
      assert.throws(() => parseArgs([f]), { message: `${f} needs a value` });
    }
    assert.throws(() => parseArgs(['--ids', '--dry-run']), { message: '--ids needs a value' });
    assert.throws(() => parseArgs(['--ids', ' ']), { message: '--ids needs a value' });
  });

  it('rejects bad values and stray arguments', () => {
    assert.throws(() => parseArgs(['--ids', 'a', '--lang', 'de']), /--lang must be tr or en/);
    assert.throws(() => parseArgs(['--ids', 'a', '--max-chars', '0']), /positive integer/);
    assert.throws(() => parseArgs(['--ids', 'a', '--release', 'x']), /--release must be a positive integer/);
    assert.throws(() => parseArgs(['--ids', 'a', 'oops']), /Usage: npm run mt-check/);
  });

  it('takes --stage b1 and refuses it together with --release', () => {
    assert.equal(parseArgs(['--ids', 'a', '--stage', 'b1']).stage, 'b1');
    assert.equal('stage' in parseArgs(['--ids', 'a']), false);
    assert.throws(() => parseArgs(['--ids', 'a', '--stage', 'b1', '--release', '3']), {
      message: 'use either --stage or --release',
    });
    assert.throws(() => parseArgs(['--ids', 'a', '--stage']), { message: '--stage needs a value' });
    assert.equal(parseArgs(['--ids', 'a', '--stage', 'a1a2']).stage, 'a1a2');
    assert.equal(parseArgs(['--ids', 'a', '--stage', 'b2']).stage, 'b2');
    assert.throws(() => parseArgs(['--ids', 'a', '--stage', 'toString']), { message: '--stage must be b1, a1a2 or b2' });
    assert.throws(() => parseArgs(['--ids', 'a', '--stage', 'c1']), { message: '--stage must be b1, a1a2 or b2' });
  });

  it('refuses a live run in CI and without a key', () => {
    assert.throws(() => liveKey({ CI: '1', DEEPL_API_KEY: 'k' }), {
      message: 'mt-check sends text to DeepL and does not run in CI; use --dry-run',
    });
    assert.throws(() => liveKey({}), { message: 'DEEPL_API_KEY is not set (README, "Machine-translation check")' });
    assert.equal(liveKey({ DEEPL_API_KEY: 'k' }), 'k');
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

describe('rows CSV (T-194)', () => {
  it('names the file beside the Markdown report', () => {
    assert.equal(csvPath('2026-12-02'), 'review/mt-check/2026-12-02-rows.csv');
  });

  it('renders a header and one line per result, quoting where needed', () => {
    const text = renderCsv([
      { id: 'noun-a', dutch: 'de a', ours: 'o', mt: 'x, y', lang: 'tr' },
      { id: 'noun-b', dutch: 'het "b"', ours: 'o', mt: 'm', lang: 'en' },
    ]);
    assert.equal(text, 'id,lang,dutch,mt\nnoun-a,tr,de a,"x, y"\nnoun-b,en,"het ""b""",m\n');
  });
});
