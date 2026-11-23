import { join } from 'node:path';

import { loadContent } from '../validate.ts';
import { AUDIO_LEVELS } from '../audio.ts';
import { AUDIO_CAPS_BYTES, validateAudio } from '../validate-audio.ts';

const wordsByLevel: Record<string, string[]> = Object.fromEntries(AUDIO_LEVELS.map((l) => [l, []]));
for (const w of loadContent().words) wordsByLevel[w.cefr]?.push(w.id);
const errors = validateAudio(join(import.meta.dirname, '..', '..', 'audio'), wordsByLevel, AUDIO_CAPS_BYTES);
for (const e of errors) console.error(`✖ ${e}`);
console.log(errors.length ? `${errors.length} audio problem(s)` : '✔ audio is valid');
process.exit(errors.length ? 1 : 0);
