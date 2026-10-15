import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { exportReview } from '../export-review.ts';
import { loadContent } from '../validate.ts';

const level = process.argv[2] ?? 'A1';
const dir = join(import.meta.dirname, '..', '..', 'review');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, `${level.toLowerCase()}.csv`), exportReview(loadContent(), level));
console.log(`Wrote review/${level.toLowerCase()}.csv`);
