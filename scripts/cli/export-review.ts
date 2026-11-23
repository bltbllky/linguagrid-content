import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { exportReview, sentenceBlindSheets, sentenceOwnerSheet } from '../export-review.ts';
import { parseCsv } from '../import-review.ts';
import { loadSentenceStage } from '../sentence-stage.ts';
import { STAGES, mergeStage, takeStage } from '../stage.ts';
import { loadContent } from '../validate.ts';

// Usage: npm run export-review -- [--lang en] [--stage b1|a1a2|b2|core] a1
const args = process.argv.slice(2);
const langAt = args.indexOf('--lang');
const lang = langAt >= 0 ? args.splice(langAt, 2)[1] : 'tr';
if (!lang) throw new Error('Usage: npm run export-review -- [--lang en] [--stage b1|a1a2|b2|core] a1');
if (args[args.indexOf('--stage') + 1] === 'sentences') {
  args.splice(args.indexOf('--stage'), 2);
  const results: Record<string, string> = {};
  for (let at = args.indexOf('--result'); at >= 0; at = args.indexOf('--result')) {
    const [code, file] = (args.splice(at, 2)[1] ?? '').split('=');
    if (!code || !file) throw new Error('Usage: --result <lang>=<result.csv>');
    results[code] = file;
  }
  const level = (args[0] ?? 'A1').toUpperCase();
  const sentences = loadSentenceStage();
  const levels = new Map(loadContent().words.map((w) => [w.id, w.cefr]));
  const levelOf = (id: string) => levels.get(id);
  const out = (name: string, text: string) => {
    writeFileSync(join(import.meta.dirname, '..', '..', 'review', `sentences-${level.toLowerCase()}-${name}.csv`), text);
    console.log(`Wrote review/sentences-${level.toLowerCase()}-${name}.csv`);
  };
  for (const code of ['tr', 'en']) {
    const sheets = sentenceBlindSheets(sentences, level, code, levelOf);
    out(`${code}-blind-nl`, sheets.dutch);
    out(`${code}-blind-pivot`, sheets.pivot);
  }
  const flagged = Object.fromEntries(
    Object.entries(results).map(([code, file]) => {
      const [head, ...rows] = parseCsv(readFileSync(file, 'utf8'));
      return [code, new Set(rows.filter((r) => (r[head.indexOf('verdict')] ?? '').trim() !== 'OK').map((r) => r[head.indexOf('id')]))];
    }),
  );
  if (Object.keys(flagged).length) out('owner', sentenceOwnerSheet(sentences, level, levelOf, flagged));
  process.exit(0);
}
const stage = takeStage(args);
const level = args[0] ?? (stage ? STAGES[stage.name].levels[0] : 'A1');
if (stage && !STAGES[stage.name].levels.some((l) => l === level.toUpperCase())) throw new Error(`Level ${level} is not in the ${stage.name} stage`);
const base = stage && level.toLowerCase() !== stage.name ? `${stage.name}-${level.toLowerCase()}` : level.toLowerCase();
// Turkish keeps its original path (review/a1.csv); other languages get review/<lang>/<level>.csv.
const path = join('review', ...(lang === 'tr' ? [] : [lang]), `${base}.csv`);
const merged = stage ? mergeStage(loadContent(), stage) : loadContent();
const stagedIds = new Set(stage?.words.map((w) => w.id));
const content = stage ? { ...merged, words: merged.words.filter((w) => stagedIds.has(w.id)) } : merged;
mkdirSync(join(import.meta.dirname, '..', '..', path, '..'), { recursive: true });
writeFileSync(join(import.meta.dirname, '..', '..', path), exportReview(content, level, lang));
console.log(`Wrote ${path}`);
