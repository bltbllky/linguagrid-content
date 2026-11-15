import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { buildIndexes } from './audio-layout.ts';
import { atom } from './fixtures/fake-m4a.ts';
import { validateAudio } from './validate-audio.ts';

const MB = 1_000_000;
const WORDS = { A1: ['noun-a', 'noun-b'], A2: ['adj-c'] };
const CAPS = { A1: 3 * MB, A2: 6 * MB };
const body = (id: string) => atom('ftyp', Buffer.from(`audio of ${id}`));

/** Writes a valid folder; `tweak` edits the file map (before the indexes are built) or the folder (after). */
function fixture(opts: { before?: (files: Map<string, { level: string; text: string; bytes: Buffer }>) => void; after?: (dir: string) => void } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'lg-validate-audio-'));
  const files = new Map<string, { level: string; text: string; bytes: Buffer }>();
  for (const [level, ids] of Object.entries(WORDS)) {
    mkdirSync(join(dir, level));
    for (const id of ids) {
      files.set(id, { level, text: id, bytes: body(id) });
      writeFileSync(join(dir, level, `${id}.m4a`), body(id));
    }
  }
  opts.before?.(files);
  const { levels, serialized } = buildIndexes(files, null);
  for (const level of Object.keys(levels)) writeFileSync(join(dir, level, 'index.json'), serialized[level]);
  writeFileSync(join(dir, 'index.json'), serialized.root);
  writeFileSync(join(dir, 'AUDIO-LICENCE.md'), '# licence\n');
  opts.after?.(dir);
  return dir;
}

const run = (dir: string, words: Record<string, string[]> = WORDS, caps = CAPS) => {
  try {
    return validateAudio(dir, words, caps);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('a matching folder is valid', () => assert.deepEqual(run(fixture()), []));

test('a word without a file and a file without a word are named', () => {
  const missing = run(fixture({ after: (dir) => rmSync(join(dir, 'A2/adj-c.m4a')) }));
  assert.equal(missing.length, 1);
  assert.match(missing[0], /adj-c/);
  const extra = run(fixture({ after: (dir) => writeFileSync(join(dir, 'A1/noun-extra.m4a'), body('x')) }));
  assert.equal(extra.length, 1);
  assert.match(extra[0], /A1\/noun-extra\.m4a/);
});

test('a file in the wrong level folder is one error', () => {
  const errors = run(fixture({ after: (dir) => writeFileSync(join(dir, 'A2/noun-a.m4a'), body('noun-a')) }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /A2\/noun-a\.m4a.*wrong level/);
});

test('a file that differs from the level index is named by id', () => {
  const sized = run(fixture({ after: (dir) => writeFileSync(join(dir, 'A1/noun-a.m4a'), body('longer noun-a body')) }));
  assert.deepEqual(sized, ['file for noun-a has 35 bytes, index says 23']);
  const hashed = run(fixture({ after: (dir) => writeFileSync(join(dir, 'A1/noun-b.m4a'), body('noun-X')) }));
  assert.deepEqual(hashed, ['file for noun-b has a different sha256 than the index']);
});

test('an empty file is an error', () => {
  const errors = run(fixture({ after: (dir) => writeFileSync(join(dir, 'A2/adj-c.m4a'), '') }));
  assert.ok(errors.some((e) => /empty/.test(e) && /adj-c/.test(e)));
});

test('a level over its cap is one error', () => {
  const errors = run(fixture(), WORDS, { A1: 20, A2: 6 * MB });
  assert.deepEqual(errors, ['audio A1 total 46 bytes is over cap 20']);
});

test('a top-level free box is one error', () => {
  const padded = Buffer.concat([body('noun-a'), atom('free', Buffer.alloc(10))]);
  const errors = run(fixture({ before: (files) => (files.get('noun-a')!.bytes = padded), after: (dir) => writeFileSync(join(dir, 'A1/noun-a.m4a'), padded) }));
  assert.deepEqual(errors, ['file for noun-a has a top-level free box']);
});

test('a root index hash that does not match a level file is one error', () => {
  const errors = run(
    fixture({
      after: (dir) => {
        const root = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
        root.levels.A1.index_sha256 = '0'.repeat(64);
        writeFileSync(join(dir, 'index.json'), JSON.stringify(root));
      },
    }),
  );
  assert.deepEqual(errors, ['audio/A1/index.json does not match index_sha256 in audio/index.json']);
});

test('a missing AUDIO-LICENCE.md, root index or folder is an error', () => {
  assert.deepEqual(run(fixture({ after: (dir) => rmSync(join(dir, 'AUDIO-LICENCE.md')) })), ['audio/AUDIO-LICENCE.md is missing']);
  assert.deepEqual(run(fixture({ after: (dir) => rmSync(join(dir, 'index.json')) })), ['audio/index.json is missing']);
  assert.equal(validateAudio(join(tmpdir(), 'lg-no-such-audio-dir'), WORDS, CAPS).length, 1);
});

test('a word the level index does not list is an error', () => {
  const errors = run(fixture({ before: (files) => files.delete('noun-b') }));
  assert.deepEqual(errors, ['word noun-b is not listed in audio/A1/index.json']);
});
