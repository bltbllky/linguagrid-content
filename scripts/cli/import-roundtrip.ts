import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { changedFiles } from '../import-review.ts';
import { applyRoundtrip } from '../import-roundtrip.ts';
import { mergeStage, stageFiles, takeStage } from '../stage.ts';
import { loadContent } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const langAt = args.indexOf('--lang');
const lang = langAt >= 0 ? args.splice(langAt, 2)[1] : 'tr';
const stage = takeStage(args);
const file = args[0];
if (!file) throw new Error('Usage: npm run import-roundtrip -- [--lang en] [--stage b1] review/roundtrip/result.csv');
if (stage && !stage.translations[lang]) throw new Error(`No staged ${lang} file: create data/b1/translations/${lang}.json first`);

const { content, summary } = applyRoundtrip(
  stage ? mergeStage(loadContent(), stage) : loadContent(),
  readFileSync(file, 'utf8'),
  lang,
);
for (const [path, value] of Object.entries(stage ? stageFiles(content, stage) : changedFiles(content, lang))) {
  writeFileSync(join(root, path), JSON.stringify(value, null, 2) + '\n');
}
console.log(lang, summary);
