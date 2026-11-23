import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { audioFileName } from './audio.ts';
import type { LevelIndex, RootIndex } from './audio-layout.ts';

const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');

/** True when the m4a has a top-level `free` box (the padding `afconvert` writes). */
function hasFreeBox(m4a: Buffer): boolean {
  for (let at = 0; at + 8 <= m4a.length; ) {
    if (m4a.toString('ascii', at + 4, at + 8) === 'free') return true;
    const size = m4a.readUInt32BE(at);
    if (size < 8) return false;
    at += size;
  }
  return false;
}

/** Levels whose root entries are permanent (ADR-028): a missing folder is always an error. */
const PERMANENT_LEVELS = ['A1', 'A2', 'B1'];

/** Byte caps per level, decimal bytes (1 MB = 1,000,000). B2 is 10,000,000 (ADR-028). */
export const AUDIO_CAPS_BYTES: Record<string, number> = { A1: 3_000_000, A2: 6_000_000, B1: 7_000_000, B2: 10_000_000 };

/**
 * Checks `audio/<LEVEL>/<id>.m4a`, the level indexes and the root index against the words per level and the byte cap per
 * level; returns the error texts, empty when valid.
 */
export function validateAudio(dir: string, wordsByLevel: Record<string, string[]>, capsBytes: Record<string, number>): string[] {
  if (!existsSync(dir)) return [`${dir} is missing`];
  const errors: string[] = [];
  if (!existsSync(join(dir, 'AUDIO-LICENCE.md'))) errors.push('audio/AUDIO-LICENCE.md is missing');
  const rootPath = join(dir, 'index.json');
  if (!existsSync(rootPath)) return [...errors, 'audio/index.json is missing'];
  const root = JSON.parse(readFileSync(rootPath, 'utf8')) as RootIndex;
  const levelOf = new Map(Object.entries(wordsByLevel).flatMap(([level, ids]) => ids.map((id) => [id, level] as const)));
  for (const [level, ids] of Object.entries(wordsByLevel)) {
    const levelDir = join(dir, level);
    const indexPath = join(levelDir, 'index.json');
    if (!existsSync(indexPath)) {
      if (!ids.length && !PERMANENT_LEVELS.includes(level)) continue; // B2 before its release has no pack yet
      errors.push(`audio/${level}/index.json is missing`);
      continue;
    }
    const text = readFileSync(indexPath, 'utf8');
    if (root.levels[level]?.index_sha256 !== sha256(text)) errors.push(`audio/${level}/index.json does not match index_sha256 in audio/index.json`);
    const index = JSON.parse(text) as LevelIndex;
    const wanted = new Map(ids.map((id) => [audioFileName(id), id]));
    const onDisk = readdirSync(levelDir).filter((f) => f.endsWith('.m4a'));
    for (const [file, id] of wanted) if (!onDisk.includes(file)) errors.push(`word ${id} has no file ${level}/${file}`);
    for (const file of onDisk) {
      if (wanted.has(file)) continue;
      const owner = [...levelOf].find(([id]) => audioFileName(id) === file)?.[1];
      errors.push(owner ? `file ${level}/${file} is in the wrong level folder (word is ${owner})` : `file ${level}/${file} has no word`);
    }
    let total = 0;
    for (const [id, entry] of Object.entries(index.files)) {
      total += entry.bytes;
      if (!wanted.has(audioFileName(id)) || !onDisk.includes(audioFileName(id))) continue;
      const body = readFileSync(join(levelDir, audioFileName(id)));
      if (!body.length) errors.push(`file for ${id} is empty`);
      else if (body.length !== entry.bytes) errors.push(`file for ${id} has ${body.length} bytes, index says ${entry.bytes}`);
      else if (sha256(body) !== entry.sha256) errors.push(`file for ${id} has a different sha256 than the index`);
      else if (hasFreeBox(body)) errors.push(`file for ${id} has a top-level free box`);
    }
    for (const id of ids) if (onDisk.includes(audioFileName(id)) && !index.files[id]) errors.push(`word ${id} is not listed in audio/${level}/index.json`);
    if (total > capsBytes[level]) errors.push(`audio ${level} total ${total} bytes is over cap ${capsBytes[level]}`);
  }
  return errors;
}
