import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { STAGES, loadStage, mergeStage, promoteStage, validateStage } from '../stage.ts';
import type { StageName } from '../stage.ts';
import { loadContent, validateContent } from '../validate.ts';
import type { Word } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const name = process.argv[2];
const fail = (message: string): never => {
  console.error(`✖ ${message}`);
  return process.exit(1);
};

if (!name) fail('Usage: npm run promote-stage -- a1a2');
if (name !== 'a1a2') fail('Only a1a2 is promoted here; B1 and B2 are released by their US-022 tasks');
const stage = loadStage(name);
const live = loadContent();
const others = (Object.keys(STAGES) as StageName[]).filter((n) => n !== stage.name).map((n) => loadStage(n));
const { errors, incomplete } = validateStage(live, stage, others);
if (errors.length || incomplete.length) {
  for (const m of [...errors, ...incomplete]) console.error(`✖ ${m}`);
  fail(`Stage ${name} is not complete: ${errors.length + incomplete.length} problem(s)`);
}

const ownPath = join(root, 'data', 'words-own.json');
const liveOwn: Word[] = existsSync(ownPath) ? JSON.parse(readFileSync(ownPath, 'utf8')) : [];
const { files, remove } = promoteStage(live, liveOwn, stage);

// Check the merged result before anything is written.
const merged = mergeStage(live, { ...stage, categories: [], annotations: [], translations: {} });
merged.annotations = files['data/annotations.json'] as typeof merged.annotations;
for (const [path, value] of Object.entries(files)) {
  const lang = /^data\/translations\/(.+)\.json$/.exec(path)?.[1];
  if (lang) merged.translations[lang] = value as (typeof merged.translations)[string];
}
const problems = validateContent(merged);
if (problems.length) {
  for (const m of problems) console.error(`✖ ${m}`);
  fail(`The merged result is not valid: ${problems.length} problem(s); nothing was written`);
}

for (const [path, value] of Object.entries(files)) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), JSON.stringify(value, null, 2) + '\n');
}
for (const path of remove) rmSync(join(root, path), { recursive: true, force: true });
console.log(`Promoted ${stage.words.length} words to data/words-own.json`);
