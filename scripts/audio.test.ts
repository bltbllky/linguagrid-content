import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AUDIO_LEVELS,
  audioFileName,
  generate,
  pickSample,
  readWav,
  spokenText,
  trimAndNormalise,
  writeWav,
  type Runner,
  type SourceWord,
} from './audio.ts';
import { atom, fakeM4a } from './fixtures/fake-m4a.ts';

const RATE = 22050;

test('spokenText: override, article, bare lemma', () => {
  assert.equal(spokenText('noun-tandarts', 'tandarts', 'de', {}), 'de tandarts');
  assert.equal(spokenText('noun-tandarts', 'tandarts', null, {}), 'tandarts');
  assert.equal(spokenText('noun-tandarts', 'tandarts', 'de', { 'noun-tandarts': 'de tandarts.' }), 'de tandarts.');
});

test('audioFileName accepts [a-z0-9-] only', () => {
  assert.equal(audioFileName('noun-huis'), 'noun-huis.m4a');
  assert.throws(() => audioFileName('Noun/Huis'));
  assert.equal(audioFileName('noun-café'), 'noun-cafe.m4a');
  assert.equal(audioFileName('noun-hygiëne'), 'noun-hygiene.m4a');
  assert.throws(() => audioFileName('noun-€'));
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
  const input = Int16Array.from([...silence(10), ...tone(100, 1000), ...silence(10)]);
  const out = trimAndNormalise(input, RATE);
  assert.equal(out.length, input.length);
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

const lemmas: [string, string, 'de' | 'het' | null, string][] = [];
for (let i = 0; i < 40; i++) {
  const pos = i % 3 === 0 ? 'verb' : 'noun';
  const article = pos === 'verb' ? null : i % 2 ? 'het' : 'de';
  lemmas.push([`${pos}-w${i}`, `w${i}${i % 7 === 0 ? 'xxxxxxxxxxxx' : ''}`, article, [...AUDIO_LEVELS][i % 4]]);
}
const WORDS: SourceWord[] = lemmas.map(([id, lemma_nl, article, cefr]) => ({
  id,
  lemma_nl,
  pos: id.split('-')[0],
  cefr,
  article,
}));
// Adjectives without an article, so the "no article" group is not satisfied by verbs.
for (const id of ['adj-a1', 'adj-a2']) WORDS.push({ id, lemma_nl: id.slice(4), pos: 'adj', cefr: 'A2', article: null });
const CAFE = { id: 'noun-café', lemma_nl: 'café', pos: 'noun', cefr: 'A1', article: 'het' as const };
WORDS.push(CAFE);

test('pickSample is seeded, covers the mix and skips unusable ids', () => {
  const a = pickSample(WORDS, 20, 7);
  assert.deepEqual(pickSample(WORDS, 20, 7), a);
  assert.equal(a.length, 20);
    assert.ok(a.filter((w) => w.article === 'het').length >= 2);
  assert.ok(a.filter((w) => w.article === null && w.pos !== 'verb').length >= 2);
  assert.ok(a.filter((w) => w.pos === 'verb').length >= 2);
  assert.ok(a.filter((w) => w.lemma_nl.length >= 12).length >= 2);
  assert.deepEqual(new Set(a.map((w) => w.cefr)), new Set(AUDIO_LEVELS));
  assert.deepEqual(AUDIO_LEVELS, ['A1', 'A2', 'B1', 'B2']);
});

test('generate drives piper and afconvert through the runner', () => {
  const calls: { cmd: string; args: string[]; input?: string }[] = [];
  const files = new Map<string, Buffer>();
  const run: Runner = (cmd, args, input) => {
    calls.push({ cmd, args, input });
    if (cmd === 'piper') files.set(args[args.indexOf('-f') + 1], writeWav(Int16Array.from([0, 0, 900, -900, 0]), RATE));
    else files.set(args[args.length - 1], atom('ftyp', Buffer.from(args[args.length - 1])));
  };
  const written = new Map<string, Buffer>();
  const result = generate(
    { words: WORDS, ids: ['noun-w1', 'noun-w2'], out: '/out', model: '/m/alex.onnx', bitrate: 32000, overrides: { 'noun-w2': 'twee!' } },
    { run, exists: (p) => written.has(p), readFile: (p) => written.get(p) ?? files.get(p) ?? Buffer.from('model'), writeFile: (p, b) => void written.set(p, Buffer.from(b)), mkdirs: () => {}, tmpDir: '/tmp/x' },
  );
  const piper = calls.filter((c) => c.cmd === 'piper');
  const aff = calls.filter((c) => c.cmd === 'afconvert');
  assert.equal(piper.length, 2);
  assert.deepEqual(piper[0].args, ['-m', '/m/alex.onnx', '-f', '/tmp/x/noun-w1.wav']);
  assert.equal(piper[0].input, 'het w1');
  assert.equal(piper[1].input, 'twee!');
  assert.deepEqual(aff[0].args, ['-f', 'm4af', '-d', 'aac', '-b', '32000', '-c', '1', '/tmp/x/noun-w1.wav', '/out/A2/noun-w1.m4a']);
  assert.deepEqual(result.sizes.files, 2);
  assert.deepEqual(Object.keys(result.levels), ['A2', 'B1']);
  assert.equal(result.levels.A2.files['noun-w1'].text, 'het w1');
  assert.deepEqual(result.sizes.perLevel, { A2: { files: 1, bytes: result.sizes.perFile['noun-w1'] }, B1: { files: 1, bytes: result.sizes.perFile['noun-w2'] } });
  for (const p of ['/out/sizes.json', '/out/index.json', '/out/A2/index.json', '/out/B1/index.json']) assert.ok(written.has(p), p);
  assert.equal(JSON.parse(written.get('/out/index.json')!.toString()).levels.A2.files, 1);
});

function harness() {
  const files = new Map<string, Buffer>();
  const written = new Map<string, Buffer>();
  const run: Runner = (cmd, args) => {
    if (cmd === 'piper') files.set(args[args.indexOf('-f') + 1], writeWav(Int16Array.from([0, 900, -900, 0]), RATE));
    else files.set(args[args.length - 1], atom('ftyp', Buffer.from(args[args.length - 1])));
  };
  const deps = {
    run,
    exists: (p: string) => written.has(p),
    readFile: (p: string) => written.get(p) ?? files.get(p) ?? Buffer.from('model'),
    writeFile: (p: string, b: Buffer | string) => void written.set(p, Buffer.from(b)),
    mkdirs: () => {},
    tmpDir: '/tmp/x',
  };
  return { deps, written };
}
const base = { words: WORDS, out: '/out', model: '/m/alex.onnx', bitrate: 48000, overrides: {} };

test('a partial run merges into the existing index and sizes by id', () => {
  const { deps, written } = harness();
  generate({ ...base, ids: ['noun-w1', 'noun-w2'] }, deps);
  const second = generate({ ...base, ids: ['noun-w2', 'noun-café'], overrides: { 'noun-w2': 'twee!' } }, deps);
  assert.deepEqual(Object.keys(second.sizes.perFile), ['noun-café', 'noun-w1', 'noun-w2']);
  assert.equal(second.levels.B1.files['noun-w2'].text, 'twee!');
  assert.ok(written.has('/out/A1/noun-cafe.m4a'));
  assert.equal(second.root.levels.A2.version, 1);
  assert.equal(second.root.levels.B1.version, 2);
  assert.equal(second.sizes.files, 3);
  assert.equal(JSON.parse(written.get('/out/sizes.json')!.toString()).files, 3);
});

test('generate refuses ids that fold to one file name', () => {
  const { deps } = harness();
  const clash = [...WORDS, { ...CAFE, id: 'noun-cafe' }];
  assert.throws(() => generate({ ...base, words: clash }, deps), /both map to A1\/noun-cafe.m4a/);
  generate({ ...base, ids: ['noun-café'] }, deps);
  assert.throws(() => generate({ ...base, words: clash, ids: ['noun-cafe'] }, deps), /overwrite/);
});

test('generate rejects a blank override and unknown ids', () => {
  const { deps } = harness();
  assert.throws(() => generate({ ...base, overrides: { 'noun-w1': '  ' } }, deps), /blank override/);
  assert.throws(() => generate({ ...base, ids: ['nope'] }, deps), /unknown word id/);
});

test('generate stores the file without its free padding', () => {
  const files = new Map<string, Buffer>();
  const written = new Map<string, Buffer>();
  const run: Runner = (cmd, args) => {
    if (cmd === 'piper') files.set(args[args.indexOf('-f') + 1], writeWav(Int16Array.from([0, 900, -900, 0]), RATE));
    else files.set(args[args.length - 1], fakeM4a(3170));
  };
  const deps = {
    run,
    exists: (p: string) => written.has(p),
    readFile: (p: string) => written.get(p) ?? files.get(p) ?? Buffer.from('model'),
    writeFile: (p: string, b: Buffer | string) => void written.set(p, Buffer.from(b)),
    mkdirs: () => {},
    tmpDir: '/tmp/x',
  };
  const { levels } = generate({ ...base, ids: ['noun-w1'] }, deps);
  assert.equal(levels.A2.files['noun-w1'].bytes, fakeM4a(3170).length - 3170);
  assert.equal(written.get('/out/A2/noun-w1.m4a')!.indexOf('free'), -1);
});
