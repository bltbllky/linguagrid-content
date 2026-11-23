import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { loadIrregularForms, makeInflected } from '../inflection.ts';
import { lemmaPos, loadFunctionWords } from '../sentence-check.ts';
import { loadSentenceStage, validateSentenceStage } from '../sentence-stage.ts';
import { STAGES, loadLiveSentences, loadStage, mergeStage, promoteSentences, promoteStage, validateStage } from '../stage.ts';
import type { StageName } from '../stage.ts';
import { loadContent, validateContent } from '../validate.ts';
import type { Word } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const name = process.argv[2];
const fail = (message: string): never => {
  console.error(`✖ ${message}`);
  return process.exit(1);
};

if (!name) fail('Usage: npm run promote-stage -- a1a2|b1|b2|core|sentences');
if (name === 'sentences') promoteSentenceFiles();
if (name !== 'a1a2' && name !== 'b1' && name !== 'b2' && name !== 'core') fail('Only a1a2, b1, b2 and core are promoted here');
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
merged.categories = (files['data/categories.json'] as typeof merged.categories | undefined) ?? merged.categories;
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
console.log(
  `Promoted ${stage.words.length} ${stage.name.toUpperCase()} words to data/words-own.json` + (stage.name === 'core' ? '; data/words.json is empty' : ''),
);

/** Validates the staged sentence files, then moves them into the live files (T-377); exits when done. */
function promoteSentenceFiles(): never {
  const staged = loadSentenceStage();
  const content = loadContent();
  const words = [...content.words, ...(Object.keys(STAGES) as StageName[]).flatMap((n) => loadStage(n).words)];
  const annotations = [...content.annotations, ...(Object.keys(STAGES) as StageName[]).flatMap((n) => loadStage(n).annotations ?? [])];
  const wordlist = join(root, '.cache', 'b1', 'wordlist.txt');
  if (staged.rows.length && !existsSync(wordlist)) fail(`Missing ${wordlist}; run "npm run b1-pool -- --fetch" first`);
  const openTaal = new Set(existsSync(wordlist) ? readFileSync(wordlist, 'utf8').split('\n').map((l) => l.trim().normalize('NFC').toLowerCase()) : []);
  const problems = validateSentenceStage(staged, { words, annotations, inflected: makeInflected(openTaal, lemmaPos(words), loadIrregularForms()), functionWords: loadFunctionWords() });
  if (problems.length) {
    for (const m of problems) console.error(`✖ ${m}`);
    fail(`The sentence stage is not valid: ${problems.length} problem(s); nothing was written`);
  }
  let result;
  try {
    result = promoteSentences(loadLiveSentences(root) ?? { rows: [], translations: {} }, staged);
  } catch (e) {
    return fail(`${(e as Error).message}; nothing was written`);
  }
  for (const [path, value] of Object.entries(result.files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), JSON.stringify(value, null, 2) + '\n');
  }
  for (const path of result.remove) rmSync(join(root, path), { recursive: true, force: true });
  console.log(`Promoted ${staged.rows.length} sentences to data/sentences.json`);
  process.exit(0);
}
