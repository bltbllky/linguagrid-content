import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { applyReview } from '../import-review.ts';
import { loadContent } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const file = process.argv[2];
if (!file) throw new Error('Usage: npm run import-review -- review/a1.csv');

const { content, excluded, summary } = applyReview(loadContent(), readFileSync(file, 'utf8'));
const write = (path: string, value: unknown) =>
  writeFileSync(join(root, path), JSON.stringify(value, null, 2) + '\n');
write('data/words.json', content.words);
write('data/annotations.json', content.annotations);
if (excluded.length) {
  const list = JSON.parse(readFileSync(join(root, 'data/excluded.json'), 'utf8'));
  write('data/excluded.json', [...list, ...excluded]);
  const selectionFile = join(root, 'data/a2-selection.json');
  const removed = new Set(excluded.map((e) => e.id));
  const selection: string[] = JSON.parse(readFileSync(selectionFile, 'utf8'));
  write('data/a2-selection.json', selection.filter((id) => !removed.has(id)));
}
console.log(summary);
