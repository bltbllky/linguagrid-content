import { mulberry32, shuffle } from './spot-check.ts';

export type Article = 'de' | 'het' | null;

export interface SourceWord {
  id: string;
  lemma_nl: string;
  pos: string;
  cefr: string;
  article: Article;
}

export interface IndexEntry {
  id: string;
  /** File name inside the audio folder (the id with diacritics folded to ASCII). */
  file: string;
  text: string;
  bytes: number;
  sha256: string;
}

export interface IndexMeta {
  voice: string;
  modelSha256: string;
  format: string;
  bitrate: number;
}

export interface AudioIndex extends IndexMeta {
  words: IndexEntry[];
}

/** The override wins, else the article plus the lemma (as the app's `wordLabel`), else the bare lemma. */
export function spokenText(id: string, lemma: string, article: Article, overrides: Record<string, string>): string {
  return overrides[id] ?? (article ? `${article} ${lemma}` : lemma);
}

const FILE_ID = /^[a-z0-9-]+$/;

/** Diacritics are folded to ASCII (`café` becomes `cafe`) before the [a-z0-9-] check. */
export function audioFileName(id: string): string {
  const base = id.normalize('NFD').replace(/\p{M}/gu, '');
  if (!FILE_ID.test(base)) throw new Error(`audio id "${id}" has a character outside [a-z0-9-]`);
  return `${base}.m4a`;
}

/** Trims silence (samples under 1% of full scale) down to `maxSilenceMs` at each end, then scales the peak to `peakDb` dBFS. */
export function trimAndNormalise(pcm: Int16Array, rate: number, maxSilenceMs = 60, peakDb = -1): Int16Array {
  const floor = 0.01 * 32767;
  let first = pcm.findIndex((s) => Math.abs(s) >= floor);
  if (first < 0) return pcm;
  let last = pcm.length - 1;
  while (Math.abs(pcm[last]) < floor) last--;
  const keep = Math.round((rate * maxSilenceMs) / 1000);
  first = Math.max(0, first - keep);
  last = Math.min(pcm.length - 1, last + keep);
  const out = pcm.slice(first, last + 1);
  const peak = out.reduce((m, s) => Math.max(m, Math.abs(s)), 0);
  const gain = (10 ** (peakDb / 20) * 32767) / peak;
  return out.map((s) => Math.round(s * gain));
}

export function readWav(buf: Buffer): { pcm: Int16Array; rate: number } {
  if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('not a RIFF/WAVE file');
  }
  let rate = 0;
  for (let at = 12; at + 8 <= buf.length; ) {
    const name = buf.toString('ascii', at, at + 4);
    const size = buf.readUInt32LE(at + 4);
    const body = at + 8;
    if (name === 'fmt ') {
      if (buf.readUInt16LE(body) !== 1 || buf.readUInt16LE(body + 2) !== 1 || buf.readUInt16LE(body + 14) !== 16) {
        throw new Error('only 16-bit mono PCM is supported');
      }
      rate = buf.readUInt32LE(body + 4);
    } else if (name === 'data') {
      const count = Math.min(size, buf.length - body) >> 1;
      return { pcm: Int16Array.from({ length: count }, (_, i) => buf.readInt16LE(body + 2 * i)), rate };
    }
    at = body + size + (size & 1);
  }
  throw new Error('WAVE file has no data chunk');
}

export function writeWav(pcm: Int16Array, rate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length * 2, 4);
  header.write('WAVEfmt ', 8, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length * 2, 40);
  const body = Buffer.alloc(pcm.length * 2);
  pcm.forEach((s, i) => body.writeInt16LE(s, 2 * i));
  return Buffer.concat([header, body]);
}

export function buildIndex(entries: IndexEntry[], meta: IndexMeta): AudioIndex {
  return { ...meta, words: entries.map((e) => ({ ...e })).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) };
}

/** A seeded sample over A1, A2 and B1 that always holds `het`, article-less, verb and 12+ letter words. */
export function pickSample(words: SourceWord[], n: number, seed: number): SourceWord[] {
  const pool = shuffle(
    words.filter((w) => usableId(w.id) && ['A1', 'A2', 'B1'].includes(w.cefr)),
    mulberry32(seed),
  );
  const picked: SourceWord[] = [];
  const take = (want: (w: SourceWord) => boolean, count: number) => {
    for (const w of pool) {
      if (count <= 0 || picked.length >= n) return;
      if (want(w) && !picked.includes(w)) {
        picked.push(w);
        count--;
      }
    }
  };
  take((w) => w.article === 'het', 2);
  take((w) => w.article === null && w.pos !== 'verb', 2);
  take((w) => w.pos === 'verb', 2);
  take((w) => w.lemma_nl.length >= 12, 2);
  for (let level = 0; picked.length < n && picked.length < pool.length; level++) {
    take((w) => w.cefr === ['A1', 'A2', 'B1'][level % 3], 1);
  }
  return picked.sort((a, b) => (a.id < b.id ? -1 : 1));
}

function usableId(id: string): boolean {
  try {
    audioFileName(id);
    return true;
  } catch {
    return false;
  }
}
