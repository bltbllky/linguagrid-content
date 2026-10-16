import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import { applyReview, changedFiles } from '../import-review.ts';
import { loadContent } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const langAt = args.indexOf('--lang');
const flag = langAt >= 0 ? args.splice(langAt, 2)[1] : undefined;
const file = args[0];
if (!file) throw new Error('Usage: npm run import-review -- review/a1.csv | review/en/a1.csv');
// review/<lang>/<level>.csv names its language; review/<level>.csv is Turkish.
const folder = basename(dirname(file));
const lang = flag ?? (/^[a-z]{2,3}$/.test(folder) ? folder : 'tr');

const { content, excluded, summary } = applyReview(loadContent(), readFileSync(file, 'utf8'), lang);
const write = (path: string, value: unknown) =>
  writeFileSync(join(root, path), JSON.stringify(value, null, 2) + '\n');
for (const [path, value] of Object.entries(changedFiles(content, lang))) write(path, value);
if (excluded.length) {
  const list = JSON.parse(readFileSync(join(root, 'data/excluded.json'), 'utf8'));
  write('data/excluded.json', [...list, ...excluded]);
  const selectionFile = join(root, 'data/a2-selection.json');
  const removed = new Set(excluded.map((e) => e.id));
  const selection: string[] = JSON.parse(readFileSync(selectionFile, 'utf8'));
  write('data/a2-selection.json', selection.filter((id) => !removed.has(id)));
}
console.log(lang, summary);
