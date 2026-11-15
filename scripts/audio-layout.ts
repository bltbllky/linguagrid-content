import { createHash } from 'node:crypto';

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

/**
 * Removes the top-level `free` padding atoms `afconvert` writes before `mdat` (about 3.15 KB a file) and shifts the
 * `stco`/`co64` chunk offsets that point behind them, so the file stays playable. Lossless: no audio byte changes.
 */
export function stripFree(m4a: Buffer): Buffer {
  const free: { at: number; size: number }[] = [];
  for (let at = 0; at + 8 <= m4a.length; ) {
    const size = m4a.readUInt32BE(at);
    if (size < 8 || at + size > m4a.length) throw new Error(`bad atom size at ${at}`);
    if (m4a.toString('ascii', at + 4, at + 8) === 'free') free.push({ at, size });
    at += size;
  }
  if (!free.length) return m4a;
  const out = Buffer.from(m4a);
  const shift = (offset: number) => offset - free.filter((f) => f.at < offset).reduce((n, f) => n + f.size, 0);
  const patch = (start: number, end: number) => {
    for (let at = start; at + 8 <= end; ) {
      const size = out.readUInt32BE(at);
      const name = out.toString('ascii', at + 4, at + 8);
      if (CONTAINERS.has(name)) patch(at + 8, at + size);
      else if (name === 'stco' || name === 'co64') {
        const wide = name === 'co64';
        const count = out.readUInt32BE(at + 12);
        for (let i = 0; i < count; i++) {
          const pos = at + 16 + i * (wide ? 8 : 4);
          if (wide) out.writeBigUInt64BE(BigInt(shift(Number(out.readBigUInt64BE(pos)))), pos);
          else out.writeUInt32BE(shift(out.readUInt32BE(pos)), pos);
        }
      }
      at += size;
    }
  };
  patch(0, out.length);
  const parts: Buffer[] = [];
  let from = 0;
  for (const f of free) {
    parts.push(out.subarray(from, f.at));
    from = f.at + f.size;
  }
  parts.push(out.subarray(from));
  return Buffer.concat(parts);
}

export interface LevelIndex {
  level: string;
  files: Record<string, { text: string; bytes: number; sha256: string }>;
}

export interface RootIndex {
  version: number;
  levels: Record<string, { files: number; bytes: number; index_sha256: string; version: number }>;
}

const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');

const sorted = <T>(o: Record<string, T>): Record<string, T> => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

/**
 * One index per level plus the root index. `serialized.<level>` is the exact text written to `audio/<level>/index.json`
 * (sorted keys, two-space indent, trailing newline) and `index_sha256` hashes it. A level `version` is the previous one
 * plus 1 only when its index text changed, and 1 without a previous root.
 */
export function buildIndexes(files: Map<string, { level: string; text: string; bytes: Buffer }>, previous: RootIndex | null) {
  const levels: Record<string, LevelIndex> = {};
  const sizes: Record<string, number> = {};
  for (const [id, f] of files) {
    (levels[f.level] ??= { level: f.level, files: {} }).files[id] = { text: f.text, bytes: f.bytes.length, sha256: sha256(f.bytes) };
    sizes[f.level] = (sizes[f.level] ?? 0) + f.bytes.length;
  }
  const serialized: Record<string, string> = {};
  const root: RootIndex = { version: 1, levels: {} };
  for (const name of Object.keys(levels).sort()) {
    levels[name].files = sorted(levels[name].files);
    serialized[name] = JSON.stringify(levels[name], null, 2) + '\n';
    const hash = sha256(serialized[name]);
    const before = previous?.levels[name];
    root.levels[name] = {
      files: Object.keys(levels[name].files).length,
      bytes: sizes[name],
      index_sha256: hash,
      version: !before ? 1 : before.index_sha256 === hash ? before.version : before.version + 1,
    };
  }
  serialized.root = JSON.stringify(root, null, 2) + '\n';
  return { root, levels, serialized };
}
