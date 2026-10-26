import { readFileSync, writeFileSync } from 'node:fs';

import { releaseRows } from '../three-readers.ts';

const USAGE =
  'Usage: npm run three-readers -- --lang tr|en --result <result.csv> --findings <findings.csv> --deepl <rows.csv> [--other-findings <findings.csv>] [--hold id,id] [--dry-run]';
const args = process.argv.slice(2);
const dryAt = args.indexOf('--dry-run');
if (dryAt >= 0) args.splice(dryAt, 1);
const flag = (name: string): string | undefined => {
  const at = args.indexOf(name);
  if (at < 0) return undefined;
  const value = args[at + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`${name} needs a value\n${USAGE}`);
  args.splice(at, 2);
  return value;
};
const lang = flag('--lang');
const resultFile = flag('--result');
const findingsFile = flag('--findings');
const deeplFile = flag('--deepl');
const otherFile = flag('--other-findings');
const hold = flag('--hold');
if (args.length > 0 || (lang !== 'tr' && lang !== 'en') || !resultFile || !findingsFile || !deeplFile) throw new Error(USAGE);

const read = (f: string) => readFileSync(f, 'utf8');
const out = releaseRows({
  lang,
  result: read(resultFile),
  findings: read(findingsFile),
  deepl: read(deeplFile),
  otherFindings: otherFile ? read(otherFile) : undefined,
  hold: hold?.split(',').map((i) => i.trim()).filter(Boolean),
});

if (dryAt < 0) {
  writeFileSync(resultFile, out.result);
  writeFileSync(findingsFile, out.findings);
}
const { counts, held, released } = out;
console.log(`${lang}: ${counts.read} with a reading, ${counts.eligible} eligible, ${counts.released} released, ${held.length} held`);
for (const why of new Set(held.map((h) => h.why))) {
  console.log(`held (${why}): ${held.filter((h) => h.why === why).map((h) => h.id).join(', ')}`);
}
console.log(`Released without the owner (ADR-019): ${released.join(', ')}`);
if (dryAt >= 0) console.log('Dry run: no file was written.');
