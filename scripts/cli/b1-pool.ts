import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import {
  addKaikkiLine,
  buildPool,
  calibration,
  emptyKaikkiIndex,
  lemmaCounts,
  lemmaRanks,
  parseLeipzigWords,
  poolCounts,
  selectB1,
  type PoolRow,
} from '../b1-pool.ts';
import type { Word } from '../validate.ts';

const SOURCES = [
  { name: 'nld_news_2020_1M', file: 'nld_news_2020_1M.tar.gz', url: 'https://downloads.wortschatz-leipzig.de/corpora/nld_news_2020_1M.tar.gz', leipzig: true },
  { name: 'nld_wikipedia_2021_1M', file: 'nld_wikipedia_2021_1M.tar.gz', url: 'https://downloads.wortschatz-leipzig.de/corpora/nld_wikipedia_2021_1M.tar.gz', leipzig: true },
  { name: 'kaikki', file: 'kaikki.org-dictionary-Dutch.jsonl', url: 'https://kaikki.org/dictionary/Dutch/kaikki.org-dictionary-Dutch.jsonl', leipzig: false },
  { name: 'opentaal', file: 'wordlist.txt', url: 'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt', leipzig: false },
] as const;

const root = join(import.meta.dirname, '..', '..');
const cache = join(root, '.cache', 'b1');
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

async function sha256(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function fetchAll() {
  mkdirSync(cache, { recursive: true });
  const recordFile = join(cache, 'sources.json');
  const record: Record<string, string> = existsSync(recordFile) ? readJson(recordFile) : {};
  for (const s of SOURCES) {
    const path = join(cache, s.file);
    if (!existsSync(path) || record[s.file] !== (await sha256(path))) {
      const res = await fetch(s.url);
      if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}): ${s.url}`);
      await pipeline(Readable.fromWeb(res.body as never), createWriteStream(path));
      record[s.file] = await sha256(path);
    }
    // Only the word counts are extracted; the sentence files are never unpacked.
    if (s.leipzig) {
      // GNU tar needs --wildcards for the pattern; bsdtar (macOS) does not know the flag.
      const gnu = !execFileSync('tar', ['--version']).toString().includes('bsdtar');
      execFileSync('tar', ['-xzf', path, '-C', cache, ...(gnu ? ['--wildcards'] : []), '*-words.txt'], { stdio: 'inherit' });
    }
    console.log(`${record[s.file]}  ${s.file}`);
  }
  writeFileSync(recordFile, JSON.stringify(record, null, 2) + '\n');
}

function findWordsFile(name: string): string {
  const dirs = [join(cache, name), cache];
  for (const dir of dirs) {
    const file = existsSync(dir) ? readdirSync(dir).find((f) => f === `${name}-words.txt`) : undefined;
    if (file) return join(dir, file);
  }
  throw new Error(`Missing ${name}-words.txt in .cache/b1; run --fetch`);
}

async function build() {
  const forms = new Map<string, number>();
  for (const s of SOURCES.filter((x) => x.leipzig)) {
    for (const [form, n] of parseLeipzigWords(readFileSync(findWordsFile(s.name), 'utf8'))) {
      forms.set(form, (forms.get(form) ?? 0) + n);
    }
  }
  const index = emptyKaikkiIndex();
  const lines = createInterface({ input: createReadStream(join(cache, 'kaikki.org-dictionary-Dutch.jsonl')) });
  for await (const line of lines) addKaikkiLine(index, line);

  const openTaal = new Set(
    readFileSync(join(cache, 'wordlist.txt'), 'utf8').split('\n').map((l) => l.trim().normalize('NFC').toLowerCase()),
  );
  const words = readJson<Word[]>(join(root, 'data', 'words.json'));
  const excluded = readJson<{ id: string }[]>(join(root, 'data', 'excluded.json'));
  const ranks = lemmaRanks(lemmaCounts(forms, index));
  const pool = buildPool(ranks, index, openTaal, {
    lemmas: new Set(words.map((w) => w.lemma_nl)),
    excludedIds: new Set(excluded.map((e) => e.id)),
  });
  writeFileSync(join(cache, 'pool.json'), JSON.stringify(pool, null, 2) + '\n');

  const counts = poolCounts(pool);
  console.log(`Pool: ${pool.length} rows (.cache/b1/pool.json)`);
  console.log('Per part of speech:', counts.pos);
  console.log('Per rank band:', counts.band);
  console.log('Calibration of our live words on the lemma rank (C2, information only):');
  console.table(calibration(ranks, words));
}

function write() {
  const pool = readJson<PoolRow[]>(join(cache, 'pool.json'));
  const ids = readJson<string[]>(join(root, 'data', 'b1', 'selection.json'));
  const out = selectB1(pool, ids);
  writeFileSync(join(root, 'data', 'b1', 'words.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote ${out.length} words to data/b1/words.json`);
}

const modes = { '--fetch': fetchAll, '--build': build, '--write': write };
const given = process.argv.slice(2);
if (given.length !== 1 || !(given[0] in modes)) {
  console.error('Usage: npm run b1-pool -- --fetch | --build | --write (exactly one)');
  process.exit(1);
}
await modes[given[0] as keyof typeof modes]();
