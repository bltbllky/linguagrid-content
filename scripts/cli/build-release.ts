import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { RELEASE_MINIMUMS, buildRelease } from '../build-release.ts';
import { loadLiveSentences } from '../stage.ts';
import { loadContent } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const { manifest, files, excluded, sentenceNotes } = buildRelease(loadContent(), {
  sentences: loadLiveSentences(root),
  minimums: RELEASE_MINIMUMS,
  allowPartial: process.argv.includes('--allow-partial'),
});
const dir = join(root, 'release', String(manifest.content_version));
mkdirSync(dir, { recursive: true });
for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Release ${manifest.content_version}: ${Object.keys(files).join(', ')}`);
console.log(`Languages: ${manifest.languages?.join(', ')}`);
for (const reason of excluded) console.log(`Left out ${reason}`);
for (const note of sentenceNotes) console.log(note);
