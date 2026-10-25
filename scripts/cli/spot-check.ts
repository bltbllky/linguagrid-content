import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseCsv } from '../import-review.ts';
import { drawSpotCheck, parseTally, tallyStatus } from '../spot-check.ts';

const root = join(import.meta.dirname, '..', '..');
const USAGE =
  'Usage: npm run spot-check -- draw --lang tr --seed 20261204 --result review/roundtrip-b2/result.csv [--exclude a.csv,b.csv] [--tally review/spot-check-tally.csv]\n' +
  '       npm run spot-check -- tally [--tally review/spot-check-tally.csv]';

const args = process.argv.slice(2);
const command = args.shift();
const flag = (name: string): string | undefined => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args.splice(at, 2)[1] : undefined;
};
const tallyPath = flag('tally') ?? join(root, 'review', 'spot-check-tally.csv');
const tallyRows = existsSync(tallyPath) ? parseTally(readFileSync(tallyPath, 'utf8')) : [];
const list = (ids: string[]) => ids.map((id) => `- ${id}`).join('\n');

function column(file: string, name: string): { rows: string[][]; at: number } {
  const [header, ...rows] = parseCsv(readFileSync(file, 'utf8')).filter((r) => r.some((f) => f !== ''));
  return { rows, at: header ? header.indexOf(name) : -1 };
}

try {
  if (command === 'tally') {
    for (const lang of ['tr', 'en']) {
      const { words, errors, full } = tallyStatus(tallyRows, lang);
      console.log(`${lang}: ${words} words, ${errors} errors, next sheet: ${full ? 50 : 20} words`);
    }
  } else if (command === 'draw') {
    const lang = flag('lang');
    const seed = Number(flag('seed'));
    const result = flag('result');
    const exclude = (flag('exclude') ?? '').split(',').filter(Boolean);
    if (!lang || !Number.isInteger(seed) || !result) throw new Error(USAGE);
    const excluded = new Set(exclude.flatMap((f) => { const c = column(f, 'id'); return c.rows.map((r) => r[c.at]); }));
    const ok = column(result, 'verdict');
    const idAt = column(result, 'id').at;
    const same = ok.rows[0] ? column(result, 'deepl_same').at : -1;
    const accepted = ok.rows.filter((r) => r[ok.at] === 'OK' && !excluded.has(r[idAt]));
    const pool = accepted.map((r) => r[idAt]);
    const released = same >= 0 ? accepted.filter((r) => r[same] === 'yes').map((r) => r[idAt]) : [];
    const full = tallyStatus(tallyRows, lang).full;
    const { initial, extension } = drawSpotCheck(pool, released, seed, full);
    console.log(`Pool: ${pool.length} words\nReleased: ${released.length}\nSeed: ${seed}\nTally forces 50 words: ${full ? 'yes' : 'no'}`);
    console.log(`\nInitial (${initial.length}):\n${list(initial)}`);
    console.log(`\nExtension (${extension.length}):\n${list(extension)}`);
  } else throw new Error(USAGE);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
