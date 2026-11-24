import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const CLI = join(import.meta.dirname);
const row = (id: string) => ({ word_id: id, nl: 'Ik woon in een huis.', form: 'huis', distractors: ['x', 'y', 'z'], reviewed: false });
const text = (id: string) => ({ word_id: id, text: 't', reviewed: false });

describe('sentence import CLIs persist the Dutch rows', () => {
  let root = '';
  const run = (cli: string, ...args: string[]) =>
    execFileSync('node', ['--import', 'tsx', join(CLI, cli), '--stage', 'sentences', ...args], { env: { ...process.env, CONTENT_ROOT: root }, stdio: 'pipe' });
  const rows = () => JSON.parse(readFileSync(join(root, 'data', 'sentences', 'sentences.json'), 'utf8')) as { word_id: string; reviewed: boolean; review_source?: string }[];
  const sheet = (name: string, body: string) => (writeFileSync(join(root, name), body), join(root, name));

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'sentence-import-'));
    mkdirSync(join(root, 'data', 'sentences', 'translations'), { recursive: true });
    const put = (f: string, v: unknown) => writeFileSync(join(root, 'data', 'sentences', f), JSON.stringify(v, null, 2) + '\n');
    put('sentences.json', [row('a'), row('b')]);
    put('translations/tr.json', [text('a'), text('b')]);
    put('translations/en.json', [text('a'), text('b')]);
  });
  after(() => rmSync(root, { recursive: true, force: true }));

  it('roundtrip: a row is reviewed only where tr and en are both accepted', () => {
    run('import-roundtrip.ts', '--lang', 'tr', sheet('tr.csv', 'id,verdict\na,OK\nb,OK\n'));
    assert.deepEqual(rows().map((r) => r.reviewed), [false, false]);
    run('import-roundtrip.ts', '--lang', 'en', sheet('en.csv', 'id,verdict\na,OK\nb,fix\n'));
    assert.deepEqual(rows().map((r) => [r.reviewed, r.review_source]), [[true, 'roundtrip'], [false, undefined]]);
  });

  it('owner import marks the row owner', () => {
    run('import-review.ts', '--lang', 'en', sheet('o.csv', 'id,lang,dutch,turkish,english,decision\nb,en,d,t,e,OK\n'));
    assert.deepEqual(rows().map((r) => [r.reviewed, r.review_source]), [[true, 'roundtrip'], [true, 'owner']]);
  });
});
