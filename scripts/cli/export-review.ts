import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { exportReview } from '../export-review.ts';
import { loadContent } from '../validate.ts';

// Usage: npm run export-review -- [--lang en] a1
const args = process.argv.slice(2);
const langAt = args.indexOf('--lang');
const lang = langAt >= 0 ? args.splice(langAt, 2)[1] : 'tr';
if (!lang) throw new Error('Usage: npm run export-review -- [--lang en] a1');
const level = args[0] ?? 'A1';
// Turkish keeps its original path (review/a1.csv); other languages get review/<lang>/<level>.csv.
const path = join('review', ...(lang === 'tr' ? [] : [lang]), `${level.toLowerCase()}.csv`);
mkdirSync(join(import.meta.dirname, '..', '..', path, '..'), { recursive: true });
writeFileSync(join(import.meta.dirname, '..', '..', path), exportReview(loadContent(), level, lang));
console.log(`Wrote ${path}`);
