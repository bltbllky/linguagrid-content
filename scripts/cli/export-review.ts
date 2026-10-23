import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { exportReview } from '../export-review.ts';
import { STAGES, mergeStage, takeStage } from '../stage.ts';
import { loadContent } from '../validate.ts';

// Usage: npm run export-review -- [--lang en] [--stage b1|a1a2|b2] a1
const args = process.argv.slice(2);
const langAt = args.indexOf('--lang');
const lang = langAt >= 0 ? args.splice(langAt, 2)[1] : 'tr';
if (!lang) throw new Error('Usage: npm run export-review -- [--lang en] [--stage b1|a1a2|b2] a1');
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
