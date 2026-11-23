import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { loadIrregularForms, makeInflected } from '../inflection.ts';
import { checkRows, lemmaPos, loadFunctionWords } from '../sentence-check.ts';
import type { SentenceRow } from '../sentence-check.ts';
import { STAGES, loadStage } from '../stage.ts';
import type { StageName } from '../stage.ts';
import { loadContent } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const at = process.argv.indexOf('--file');
const file = at > 0 ? process.argv[at + 1] : undefined;
if (!file) {
  console.error('Usage: npm run sentence-check -- --file data/sentences/sentences.json');
  process.exit(2);
}
// The OpenTaal wordlist is the one `npm run b1-pool -- --fetch` caches; nothing is downloaded here.
const wordlist = join(root, '.cache', 'b1', 'wordlist.txt');
if (!existsSync(wordlist)) {
  console.error(`Missing ${wordlist}; run "npm run b1-pool -- --fetch" first`);
  process.exit(2);
}
const openTaal = new Set(readFileSync(wordlist, 'utf8').split('\n').map((l) => l.trim().normalize('NFC').toLowerCase()));

const live = loadContent();
const staged = (Object.keys(STAGES) as StageName[]).map((n) => loadStage(n));
const words = [...live.words, ...staged.flatMap((s) => s.words)];
const annotations = [...live.annotations, ...staged.flatMap((s) => s.annotations ?? [])];
const fail = (message: string): never => {
  console.error(message);
  return process.exit(2);
};
let rows: SentenceRow[] = [];
try {
  const parsed: unknown = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
  if (!Array.isArray(parsed)) fail(`${file} must hold a JSON array of sentence rows`);
  rows = parsed as SentenceRow[];
} catch (e) {
  fail(`Cannot read ${file}: ${(e as Error).message}`);
}

const { lines, failed } = checkRows(rows, {
  words,
  annotations,
  inflected: makeInflected(openTaal, lemmaPos(words), loadIrregularForms()),
  functionWords: loadFunctionWords(),
});
for (const line of lines) (line.startsWith('✔') ? console.log : console.error)(line);
process.exit(failed ? 1 : 0);
