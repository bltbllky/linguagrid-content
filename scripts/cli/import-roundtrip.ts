import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { changedFiles } from '../import-review.ts';
import { applyRoundtrip, applySentenceRoundtrip } from '../import-roundtrip.ts';
import { loadSentenceStage, saveSentenceStage } from '../sentence-stage.ts';
import { mergeStage, stageFiles, takeStage } from '../stage.ts';
import { loadContent } from '../validate.ts';

// CONTENT_ROOT lets the CLI tests run against a temporary copy of the data.
const root = process.env.CONTENT_ROOT ?? join(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const langAt = args.indexOf('--lang');
const lang = langAt >= 0 ? args.splice(langAt, 2)[1] : 'tr';
if (args[args.indexOf('--stage') + 1] === 'sentences') {
  args.splice(args.indexOf('--stage'), 2);
  if (!args[0]) throw new Error('Usage: npm run import-roundtrip -- --stage sentences --lang tr review/sentences-a1-tr-result.csv');
  const { stage, summary } = applySentenceRoundtrip(loadSentenceStage(root), readFileSync(args[0], 'utf8'), lang);
  saveSentenceStage(stage, lang, root);
  console.log(lang, summary);
  process.exit(0);
}
const stage = takeStage(args);
const file = args[0];
if (!file) throw new Error('Usage: npm run import-roundtrip -- [--lang en] [--stage b1|a1a2|b2|core] review/roundtrip/result.csv');
if (stage && !stage.translations[lang]) throw new Error(`No staged ${lang} file: create data/${stage.name}/translations/${lang}.json first`);

const { content, summary } = applyRoundtrip(
  stage ? mergeStage(loadContent(), stage) : loadContent(),
  readFileSync(file, 'utf8'),
  lang,
);
for (const [path, value] of Object.entries(stage ? stageFiles(content, stage) : changedFiles(content, lang))) {
  writeFileSync(join(root, path), JSON.stringify(value, null, 2) + '\n');
}
console.log(lang, summary);
