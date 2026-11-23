import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { loadIrregularForms, makeInflected } from '../inflection.ts';
import { lemmaPos, loadFunctionWords } from '../sentence-check.ts';
import { loadSentenceStage, sentenceStageReport, validateSentenceStage } from '../sentence-stage.ts';
import { STAGES, loadStage, stageReport, validateStage } from '../stage.ts';
import type { StageName } from '../stage.ts';
import { fileSourceIssues, loadContent, translationReport, validateContent } from '../validate.ts';

const content = loadContent();
const stageName = process.argv.includes('--stage') ? process.argv[process.argv.indexOf('--stage') + 1] : undefined;
if (stageName === 'sentences') {
  // The sentence files are not a word stage: they are checked against the live and the staged words (ADR-026).
  const stage = loadSentenceStage();
  const words = [...content.words, ...(Object.keys(STAGES) as StageName[]).flatMap((n) => loadStage(n).words)];
  const annotations = [...content.annotations, ...(Object.keys(STAGES) as StageName[]).flatMap((n) => loadStage(n).annotations ?? [])];
  // The OpenTaal wordlist is the one `npm run b1-pool -- --fetch` caches; an empty stage does not need it.
  const wordlist = join(import.meta.dirname, '..', '..', '.cache', 'b1', 'wordlist.txt');
  if (stage.rows.length && !existsSync(wordlist)) {
    console.error(`Missing ${wordlist}; run "npm run b1-pool -- --fetch" first`);
    process.exit(2);
  }
  const openTaal = new Set(existsSync(wordlist) ? readFileSync(wordlist, 'utf8').split('\n').map((l) => l.trim().normalize('NFC').toLowerCase()) : []);
  const errors = validateSentenceStage(stage, {
    words,
    annotations,
    inflected: makeInflected(openTaal, lemmaPos(words), loadIrregularForms()),
    functionWords: loadFunctionWords(),
  });
  for (const e of errors) console.error(`✖ ${e}`);
  for (const line of sentenceStageReport(stage)) console.log(line);
  console.log(errors.length ? `${errors.length} problem(s)` : '✔ Sentences stage is valid');
  process.exit(errors.length ? 1 : 0);
}
if (stageName) {
  const stage = loadStage(stageName);
  const others = (Object.keys(STAGES) as StageName[]).filter((n) => n !== stage.name).map((n) => loadStage(n));
  const { errors, incomplete } = validateStage(content, stage, others);
  for (const e of errors) console.error(`✖ ${e}`);
  if (incomplete.length) {
    const groups = new Map<string, number>();
    for (const m of incomplete) {
      const gap = m.slice(m.indexOf(': ') + 2);
      groups.set(gap, (groups.get(gap) ?? 0) + 1);
    }
    console.log(`… incomplete: ${[...groups].map(([gap, n]) => `${n} ${gap}`).join(', ')}`);
  }
  for (const line of stageReport(content, stage)) console.log(line);
  console.log(errors.length ? `${errors.length} problem(s)` : `✔ ${stage.name.toUpperCase()} stage is valid`);
  process.exit(errors.length ? 1 : 0);
}
const errors = [...fileSourceIssues(), ...validateContent(content)];
for (const e of errors) console.error(`✖ ${e}`);
if (!errors.length) for (const line of translationReport(content)) console.log(line);
console.log(errors.length ? `${errors.length} problem(s)` : '✔ content is valid');
process.exit(errors.length ? 1 : 0);
