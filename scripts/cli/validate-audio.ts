import { join } from 'node:path';

import { loadContent } from '../validate.ts';
import { validateAudio } from '../validate-audio.ts';

/** Per-level caps of T-310: about 1.4 times the expected size of 32 kbps files without padding. */
const CAPS_BYTES = { A1: 3_000_000, A2: 6_000_000, B1: 7_000_000 };

const wordsByLevel: Record<string, string[]> = { A1: [], A2: [], B1: [] };
for (const w of loadContent().words) wordsByLevel[w.cefr]?.push(w.id);
const errors = validateAudio(join(import.meta.dirname, '..', '..', 'audio'), wordsByLevel, CAPS_BYTES);
for (const e of errors) console.error(`✖ ${e}`);
console.log(errors.length ? `${errors.length} audio problem(s)` : '✔ audio is valid');
process.exit(errors.length ? 1 : 0);
