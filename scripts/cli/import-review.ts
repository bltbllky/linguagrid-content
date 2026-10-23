import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import { applyReview, changedFiles } from '../import-review.ts';
import { mergeStage, stageFiles, takeStage } from '../stage.ts';
import { loadContent } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const langAt = args.indexOf('--lang');
const flag = langAt >= 0 ? args.splice(langAt, 2)[1] : undefined;
const reviewerAt = args.indexOf('--reviewer');
const source = reviewerAt >= 0 ? (args.splice(reviewerAt, 1), 'reviewer' as const) : 'owner';
const stage = takeStage(args);
const file = args[0];
if (!file) throw new Error('Usage: npm run import-review -- [--reviewer] [--stage b1] review/a1.csv | review/en/a1.csv');
// review/<lang>/<level>.csv names its language; review/<level>.csv is Turkish.
const folder = basename(dirname(file));
const lang = flag ?? (/^[a-z]{2,3}$/.test(folder) ? folder : 'tr');
if (stage && !stage.translations[lang]) throw new Error(`No staged ${lang} file: create data/b1/translations/${lang}.json first`);

const { content, excluded, summary } = applyReview(
  stage ? mergeStage(loadContent(), stage) : loadContent(),
  readFileSync(file, 'utf8'),
  lang,
  source,
);
const write = (path: string, value: unknown) =>
  writeFileSync(join(root, path), JSON.stringify(value, null, 2) + '\n');
for (const [path, value] of Object.entries(stage ? stageFiles(content, stage) : changedFiles(content, lang))) write(path, value);
if (excluded.length) {
  const list = JSON.parse(readFileSync(join(root, 'data/excluded.json'), 'utf8'));
  write('data/excluded.json', [...list, ...excluded]);
  const selectionPath = stage ? 'data/b1/selection.json' : 'data/a2-selection.json';
  const removed = new Set(excluded.map((e) => e.id));
  const selection: string[] = JSON.parse(readFileSync(join(root, selectionPath), 'utf8'));
  write(selectionPath, selection.filter((id) => !removed.has(id)));
}
console.log(lang, summary);
