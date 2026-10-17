// One-off converter: the owner's filled sheet (review/owner-2026-10-17.md, decisions) + the id sheet (.csv)
// -> review/owner-2026-10-17-tr.csv and review/en/owner-2026-10-17.csv for `npm run import-review`.
// Free-text decisions are normalised below (spelling fixes, "N ..." / "TR ..." notes) and listed explicitly.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseCsv } from '../import-review.ts';

const root = join(import.meta.dirname, '..', '..');
const base = join(root, 'review', 'owner-2026-10-17');
const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);

/** Owner text decisions as normalised: [part+no]: { tr?, en? }. A missing language means keep (OK) or untouched. */
const own: Record<string, { tr?: string; en?: string }> = {
  A4: { tr: 'özel', en: 'special' },
  A5: { en: 'to brush' },
  A7: { tr: 'Hollandaca' },
  A12: { tr: 'içecek' },
  A13: { tr: 'ense' },
  A14: { tr: 'eğitim' },
  A15: { tr: 'bisikletli' },
  A16: { tr: 'peron' },
  A18: { tr: 'gergin' },
  A21: { tr: 'eyalet' },
  B17: { tr: 'mesaj' },
  C10: { en: 'to wash up' },
  C42: { en: 'nowadays' },
};

const md = readFileSync(`${base}.md`, 'utf8');
const decisions = new Map<string, string>();
for (const line of md.split('\n')) {
  const m = /^\| ([ABC]\d+) \|.*\|\s*([^|]*?)\s*\|\s*$/.exec(line);
  if (m) decisions.set(m[1], m[2]);
}
const [, ...ids] = parseCsv(readFileSync(`${base}.csv`, 'utf8'));
const tr: string[][] = [['id', 'dutch', 'article', 'turkish', 'category', 'decision']];
const en: string[][] = [['id', 'dutch', 'article', 'turkish', 'english', 'category', 'decision']];
for (const [part, no, id, , dutch, english, turkish, suggested] of ids) {
  const key = part + no;
  const d = decisions.get(key);
  if (!d) throw new Error(`No decision for ${key}`);
  const yes = /^y\b/i.test(d);
  const o = own[key];
  if (!yes && !o) throw new Error(`Unmapped decision for ${key}: ${d}`);
  if (part === 'C') {
    en.push([id, dutch, '', turkish, english, '', o?.en ?? 'OK']);
    continue;
  }
  let text = 'OK';
  if (o?.tr) text = o.tr;
  else if (yes && part === 'A' && !/^\(keep/.test(suggested)) text = suggested;
  tr.push([id, dutch, '', turkish, '', text]);
  if (o?.en) en.push([id, dutch, '', turkish, english, '', o.en]);
}
const out = (rows: string[][]) => rows.map((r) => r.map(quote).join(',')).join('\n') + '\n';
writeFileSync(`${base}-tr.csv`, out(tr));
writeFileSync(join(root, 'review', 'en', 'owner-2026-10-17.csv'), out(en));
console.log(`tr rows ${tr.length - 1}, en rows ${en.length - 1}`);
