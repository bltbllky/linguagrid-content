import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { changedFiles } from '../import-review.ts';
import { applyRoundtrip } from '../import-roundtrip.ts';
import { loadContent } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const langAt = args.indexOf('--lang');
const lang = langAt >= 0 ? args.splice(langAt, 2)[1] : 'tr';
const file = args[0];
if (!file) throw new Error('Usage: npm run import-roundtrip -- [--lang en] review/roundtrip/result.csv');

const { content, summary } = applyRoundtrip(loadContent(), readFileSync(file, 'utf8'), lang);
for (const [path, value] of Object.entries(changedFiles(content, lang))) {
  writeFileSync(join(root, path), JSON.stringify(value, null, 2) + '\n');
}
console.log(lang, summary);
