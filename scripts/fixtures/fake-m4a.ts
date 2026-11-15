export function atom(name: string, body: Buffer = Buffer.alloc(0)): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(8 + body.length, 0);
  head.write(name, 4, 'ascii');
  return Buffer.concat([head, body]);
}

/** ftyp, moov (one stco entry for `chunkAt`), `padding` free atoms, then mdat; offsets computed like afconvert's layout. */
export function fakeM4a(padding: number, wide = false): Buffer {
  const build = (chunkAt: number) => {
    const table = Buffer.alloc(wide ? 16 : 12);
    table.writeUInt32BE(1, 4);
    if (wide) table.writeBigUInt64BE(BigInt(chunkAt), 8);
    else table.writeUInt32BE(chunkAt, 8);
    const stbl = atom('stbl', atom(wide ? 'co64' : 'stco', table));
    return atom('moov', atom('trak', atom('mdia', atom('minf', stbl))));
  };
  const front = Buffer.concat([atom('ftyp', Buffer.from('M4A ')), build(0)]);
  const free = padding ? atom('free', Buffer.alloc(padding - 8)) : Buffer.alloc(0);
  return Buffer.concat([
    atom('ftyp', Buffer.from('M4A ')),
    build(front.length + free.length + 8),
    free,
    atom('mdat', Buffer.from('AUDIO')),
  ]);
}

export function chunkOffset(m4a: Buffer): number {
  const at = Math.max(m4a.indexOf('stco'), m4a.indexOf('co64'));
  return m4a.toString('ascii', at, at + 4) === 'co64' ? Number(m4a.readBigUInt64BE(at + 12)) : m4a.readUInt32BE(at + 12);
}
