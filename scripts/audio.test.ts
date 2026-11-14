import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  audioFileName,
  buildIndex,
  generate,
  pickSample,
  readWav,
  spokenText,
  trimAndNormalise,
  writeWav,
  type Runner,
  type SourceWord,
} from './audio.ts';

const RATE = 22050;

test('spokenText: override, article, bare lemma', () => {
  assert.equal(spokenText('noun-tandarts', 'tandarts', 'de', {}), 'de tandarts');
  assert.equal(spokenText('noun-tandarts', 'tandarts', null, {}), 'tandarts');
  assert.equal(spokenText('noun-tandarts', 'tandarts', 'de', { 'noun-tandarts': 'de tandarts.' }), 'de tandarts.');
});

test('audioFileName accepts [a-z0-9-] only', () => {
  assert.equal(audioFileName('noun-huis'), 'noun-huis.m4a');
  assert.throws(() => audioFileName('Noun/Huis'));
  assert.throws(() => audioFileName('noun-café'));
});

function tone(ms: number, amp: number): number[] {
  return Array.from({ length: Math.round((RATE * ms) / 1000) }, (_, i) => Math.round(amp * Math.sin(i / 3)));
}
const silence = (ms: number) => new Array(Math.round((RATE * ms) / 1000)).fill(0);

test('trimAndNormalise trims silence to 60 ms and peaks at -1 dBFS', () => {
  const input = Int16Array.from([...silence(500), ...tone(300, 8000), ...silence(500)]);
  const out = trimAndNormalise(input, RATE);
  const first = out.findIndex((s) => s !== 0);
  let last = out.length - 1;
  while (out[last] === 0) last--;
  assert.ok(first <= 1323 && out.length - 1 - last <= 1323, `lead ${first}, tail ${out.length - 1 - last}`);
  assert.ok(first > 1000, 'keeps the 60 ms of silence');
  const peak = Math.max(...Array.from(out, Math.abs));
  assert.ok(Math.abs(peak - 0.891 * 32767) < 0.01 * 0.891 * 32767, `peak ${peak}`);
});

test('trimAndNormalise leaves silence alone', () => {
  const zeros = new Int16Array(1000);
  assert.deepEqual(trimAndNormalise(zeros, RATE), zeros);
});

test('trimAndNormalise keeps short silences as they are', () => {
  const input = Int16Array.from([...silence(10), ...tone(100, 100), ...silence(10)]);
  assert.equal(trimAndNormalise(input, RATE).length, input.length);
});

test('writeWav then readWav round-trips', () => {
  const pcm = Int16Array.from([0, 1, -1, 32767, -32768, 1234]);
  const back = readWav(writeWav(pcm, RATE));
  assert.deepEqual(back.pcm, pcm);
  assert.equal(back.rate, RATE);
  assert.throws(() => readWav(Buffer.from('not a wav file at all, really, no')));
});

test('readWav finds data after extra chunks', () => {
  const wav = writeWav(Int16Array.from([5, 6]), RATE);
  const extra = Buffer.concat([wav.subarray(0, 36), Buffer.from('LIST\x03\x00\x00\x00abc\x00'), wav.subarray(36)]);
  assert.deepEqual(readWav(extra).pcm, Int16Array.from([5, 6]));
});

test('buildIndex sorts by id and carries the meta', () => {
  const meta = { voice: 'alex', modelSha256: 'ff', format: 'm4a', bitrate: 48000 };
  const e = (id: string) => ({ id, text: id, bytes: 1, sha256: 'ab' });
  const index = buildIndex([e('c'), e('a'), e('b')], meta);
  assert.deepEqual(index.words.map((w) => w.id), ['a', 'b', 'c']);
  assert.deepEqual(
    { voice: index.voice, modelSha256: index.modelSha256, format: index.format, bitrate: index.bitrate },
    meta,
  );
});

const lemmas: [string, string, 'de' | 'het' | null, string][] = [];
for (let i = 0; i < 40; i++) {
  const pos = i % 3 === 0 ? 'verb' : 'noun';
  const article = pos === 'verb' ? null : i % 2 ? 'het' : 'de';
  lemmas.push([`${pos}-w${i}`, `w${i}${i % 7 === 0 ? 'xxxxxxxxxxxx' : ''}`, article, ['A1', 'A2', 'B1'][i % 3]]);
}
const WORDS: SourceWord[] = lemmas.map(([id, lemma_nl, article, cefr]) => ({
  id,
  lemma_nl,
  pos: id.split('-')[0],
  cefr,
  article,
}));
WORDS.push({ id: 'noun-café', lemma_nl: 'café', pos: 'noun', cefr: 'A1', article: 'het' });

test('pickSample is seeded, covers the mix and skips unusable ids', () => {
  const a = pickSample(WORDS, 20, 7);
  assert.deepEqual(pickSample(WORDS, 20, 7), a);
  assert.equal(a.length, 20);
  assert.ok(!a.some((w) => w.id === 'noun-café'));
  assert.ok(a.filter((w) => w.article === 'het').length >= 2);
  assert.ok(a.filter((w) => w.article === null && w.pos !== 'verb').length + a.filter((w) => w.article === null).length >= 2);
  assert.ok(a.filter((w) => w.pos === 'verb').length >= 2);
  assert.ok(a.filter((w) => w.lemma_nl.length >= 12).length >= 2);
  assert.deepEqual(new Set(a.map((w) => w.cefr)), new Set(['A1', 'A2', 'B1']));
});

test('generate drives piper and afconvert through the runner', () => {
  const calls: { cmd: string; args: string[]; input?: string }[] = [];
  const files = new Map<string, Buffer>();
  const run: Runner = (cmd, args, input) => {
    calls.push({ cmd, args, input });
    if (cmd === 'piper') files.set(args[args.indexOf('-f') + 1], writeWav(Int16Array.from([0, 0, 900, -900, 0]), RATE));
    else files.set(args[args.length - 1], Buffer.from('m4a:' + args[args.length - 1]));
  };
  const written = new Map<string, Buffer>();
  const result = generate(
    { words: WORDS, ids: ['noun-w1', 'noun-w2'], out: '/out', model: '/m/alex.onnx', bitrate: 32000, overrides: { 'noun-w2': 'twee!' } },
    { run, readFile: (p) => files.get(p) ?? Buffer.from('model'), writeFile: (p, b) => void written.set(p, Buffer.from(b)), mkdirs: () => {}, tmpDir: '/tmp/x' },
  );
  const piper = calls.filter((c) => c.cmd === 'piper');
  const aff = calls.filter((c) => c.cmd === 'afconvert');
  assert.equal(piper.length, 2);
  assert.deepEqual(piper[0].args, ['-m', '/m/alex.onnx', '-f', '/tmp/x/noun-w1.wav']);
  assert.equal(piper[0].input, 'het w1');
  assert.equal(piper[1].input, 'twee!');
  assert.deepEqual(aff[0].args, ['-f', 'm4af', '-d', 'aac', '-b', '32000', '-c', '1', '/tmp/x/noun-w1.wav', '/out/noun-w1.m4a']);
  assert.deepEqual(result.sizes.files, 2);
  assert.equal(result.index.words.length, 2);
  assert.ok(written.has('/out/sizes.json') && written.has('/out/index.json'));
});
