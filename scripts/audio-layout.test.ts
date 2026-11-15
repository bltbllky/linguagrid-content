import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import { buildIndexes, stripFree } from './audio-layout.ts';
import { chunkOffset, fakeM4a } from './fixtures/fake-m4a.ts';

for (const wide of [false, true]) {
  test(`stripFree drops the padding and moves the ${wide ? 'co64' : 'stco'} offset`, () => {
    const before = fakeM4a(3170, wide);
    const after = stripFree(before);
    assert.equal(after.length, before.length - 3170);
    assert.equal(after.indexOf('free'), -1);
    assert.equal(after.toString('ascii', chunkOffset(after) - 8, chunkOffset(after) + 5), '\0\0\0\rmdatAUDIO');
  });
}

test('stripFree leaves a file without padding alone and rejects a broken one', () => {
  const clean = fakeM4a(0);
  assert.deepEqual(stripFree(clean), clean);
  assert.throws(() => stripFree(Buffer.from('not an m4a file')), /bad atom size/);
});


const file = (level: string, text: string) => ({ level, text, bytes: Buffer.from('audio ' + text) });
const files = (a1Text = 'de a') =>
  new Map([
    ['noun-b', file('A1', 'de b')],
    ['noun-a', file('A1', a1Text)],
    ['adj-c', file('A2', 'c')],
  ]);

test('buildIndexes starts every level at version 1 and counts files', () => {
  const { root, levels } = buildIndexes(files(), null);
  assert.equal(root.version, 1);
  assert.deepEqual(root.levels.A1, { files: 2, bytes: root.levels.A1.bytes, index_sha256: root.levels.A1.index_sha256, version: 1 });
  assert.equal(root.levels.A2.version, 1);
  assert.deepEqual(Object.keys(levels.A1.files), ['noun-a', 'noun-b']);
  assert.equal(levels.A1.files['noun-a'].sha256, createHash('sha256').update('audio de a').digest('hex'));
});

test('a level version rises only when that level changes', () => {
  const first = buildIndexes(files(), null).root;
  assert.deepEqual(buildIndexes(files(), first).root, first);
  const second = buildIndexes(files('de a2'), first).root;
  assert.equal(second.levels.A1.version, 2);
  assert.equal(second.levels.A2.version, 1);
});

test('index_sha256 hashes the exact serialized level file', () => {
  const { root, serialized } = buildIndexes(files(), null);
  assert.equal(root.levels.A1.index_sha256, createHash('sha256').update(serialized.A1).digest('hex'));
  assert.ok(serialized.A1.endsWith('}\n'));
  assert.ok(serialized.A1.indexOf('noun-a') < serialized.A1.indexOf('noun-b'));
});
