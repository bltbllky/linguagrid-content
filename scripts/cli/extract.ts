import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { extractCandidates, selectWords } from '../extract-nt2lex.ts';

const SOURCE_URL = 'https://cental.uclouvain.be/cefrlex/static/resources/nl/NT2Lex-CGN-v01.tsv';
const SOURCE_SHA256 = '0acae87e65a6ceb4237dcf23c5576488338570f3431ac52e159b6fce9e1a0515';

async function main() {
  const root = join(import.meta.dirname, '..', '..');
  const cache = join(root, '.cache', 'NT2Lex-CGN-v01.tsv');
  if (!existsSync(cache)) {
    mkdirSync(join(root, '.cache'), { recursive: true });
    writeFileSync(cache, Buffer.from(await (await fetch(SOURCE_URL)).arrayBuffer()));
  }
  const tsv = readFileSync(cache);
  const sha = createHash('sha256').update(tsv).digest('hex');
  if (sha !== SOURCE_SHA256) throw new Error(`NT2Lex checksum mismatch: ${sha}`);

  const levels = process.argv.includes('--a1-only') ? { A1: 400 } : { A1: 400, A2: 600 };
  const excludedFile = join(root, 'data', 'excluded.json');
  const excluded: { id: string; reason: string }[] = existsSync(excludedFile)
    ? JSON.parse(readFileSync(excludedFile, 'utf8'))
    : [];
  // A2 words in NT2Lex are dominated by graded readers (kings, whales, swords), so the A2 set is
  // curated for everyday life in the Netherlands instead of taken by frequency.
  const a2File = join(root, 'data', 'a2-selection.json');
  const curated = existsSync(a2File) ? { A2: JSON.parse(readFileSync(a2File, 'utf8')) as string[] } : {};
  const words = selectWords(
    extractCandidates(tsv.toString('utf8')),
    levels,
    new Set(excluded.map((e) => e.id)),
    curated,
  );
  writeFileSync(join(root, 'data', 'words.json'), JSON.stringify(words, null, 2) + '\n');
  console.log(`Wrote ${words.length} words to data/words.json`);
}

await main();
