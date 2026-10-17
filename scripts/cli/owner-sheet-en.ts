// One-off converter for review/roundtrip-en/owner-en.md: the resolved decisions (PM-confirmed with the owner)
// -> review/owner-en-2026-10-17-tr.csv (Turkish changes) and review/en/owner-en-2026-10-17.csv (English) for `npm run import-review`.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
const out = (rows: string[][]) => rows.map((r) => r.map(quote).join(',')).join('\n') + '\n';

/** id, English decision (OK = keep the current text), Turkish decision when the owner changed it. */
const decisions: [string, string, string?][] = [
  ['adj-heel', 'OK'],
  ['adj-engels', 'OK'],
  ['adj-nederlands', 'OK'],
  ['adj-erg', 'OK'],
  ['noun-bank', 'couch', 'koltuk'],
  ['noun-vriendin', 'friend (female)'],
  ['verb-rijden', 'OK', 'araç sürmek'],
  ['verb-weten', 'OK'],
  ['noun-kaart', 'OK', 'harita'],
  ['noun-woning', 'house'],
  ['noun-leraar', 'teacher (male)'],
  ['verb-leven', 'to live (be alive)'],
  ['adj-nerveus', 'nervous'],
  ['verb-poetsen', 'to brush (teeth)'],
  ['noun-voedsel', 'food (in general)'],
  ['noun-arts', 'doctor (physician)'],
  ['verb-betekenen', 'to mean (signify)'],
  ['noun-ontmoeting', 'meeting (with someone)'],
];
const tr = [['id', 'dutch', 'article', 'turkish', 'category', 'decision']];
const en = [['id', 'dutch', 'article', 'turkish', 'english', 'category', 'decision']];
for (const [id, e, t] of decisions) {
  en.push([id, '', '', '', '', '', e]);
  if (t) tr.push([id, '', '', '', '', t]);
}
writeFileSync(join(root, 'review', 'owner-en-2026-10-17-tr.csv'), out(tr));
writeFileSync(join(root, 'review', 'en', 'owner-en-2026-10-17.csv'), out(en));
console.log(`tr rows ${tr.length - 1}, en rows ${en.length - 1}`);
