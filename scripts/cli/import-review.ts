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
if (!file) throw new Error('Usage: npm run import-review -- [--reviewer] [--stage b1|a1a2|b2] review/a1.csv | review/en/a1.csv');
// review/<lang>/<level>.csv names its language; review/<level>.csv is Turkish.
const folder = basename(dirname(file));
const lang = flag ?? (/^[a-z]{2,3}$/.test(folder) ? folder : 'tr');
if (stage && !stage.translations[lang]) throw new Error(`No staged ${lang} file: create data/${stage.name}/translations/${lang}.json first`);
const selectionPath = stage ? `data/${stage.name}/selection.json` : 'data/a2-selection.json';

const { content, excluded, summary } = applyReview(
  stage ? mergeStage(loadContent(), stage) : loadContent(),
  readFileSync(file, 'utf8'),
  lang,
  source,
);
// A removal needs both files; read them before any write so a missing file leaves the data untouched.
const removal = excluded.length
  ? {
      excluded: JSON.parse(readFileSync(join(root, 'data/excluded.json'), 'utf8')) as unknown[],
      selection: JSON.parse(readFileSync(join(root, selectionPath), 'utf8')) as string[] | Record<string, string[]>,
    }
  : undefined;
const write = (path: string, value: unknown) =>
  writeFileSync(join(root, path), JSON.stringify(value, null, 2) + '\n');
for (const [path, value] of Object.entries(stage ? stageFiles(content, stage) : changedFiles(content, lang))) write(path, value);
if (removal) {
  write('data/excluded.json', [...removal.excluded, ...excluded]);
  const removed = new Set(excluded.map((e) => e.id));
  const keep = (ids: string[]) => ids.filter((id) => !removed.has(id));
  // B1 and B2 keep one list; a1a2 keeps { "A1": [...], "A2": [...] }.
  const { selection } = removal;
  write(selectionPath, Array.isArray(selection) ? keep(selection) : Object.fromEntries(Object.entries(selection).map(([k, ids]) => [k, keep(ids)])));
}
console.log(lang, summary);