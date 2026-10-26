import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import {
  A1A2_BAND,
  A1A2_RULES,
  addCardinals,
  B1_BAND,
  B1_RULES,
  B2_BAND,
  B2_RULES,
  addKaikkiLine,
  articleCheck,
  buildB2Pool,
  buildPool,
  calibration,
  emptyKaikkiIndex,
  excludedIdsFor,
  lemmaCounts,
  lemmaRanks,
  longShare,
  parseLeipzigWords,
  poolCounts,
  rankBand,
  rankBandA1A2,
  rankBandB2,
  selectA1A2,
  selectWords,
  sourceDrift,
  type PoolRow,
} from '../b1-pool.ts';
import type { Annotation, Word } from '../validate.ts';

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

function reportDrift(record: Record<string, string>) {
  const lines = sourceDrift(record);
  if (!lines.length) console.log('Sources match the pins of 2026-10-22');
  for (const line of lines) console.warn(line);
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
  reportDrift(record);
}

function findWordsFile(name: string): string {
  const dirs = [join(cache, name), cache];
  for (const dir of dirs) {
    const file = existsSync(dir) ? readdirSync(dir).find((f) => f === `${name}-words.txt`) : undefined;
    if (file) return join(dir, file);
  }
  throw new Error(`Missing ${name}-words.txt in .cache/b1; run --fetch`);
}

type Level = 'b1' | 'a1a2' | 'b2';
let level: Level = 'b1';
const poolFile = () => join(cache, level === 'b1' ? 'pool.json' : `pool-${level}.json`);
const readIfThere = <T>(path: string): T[] => (existsSync(path) ? readJson<T[]>(path) : []);

/** Live words plus every staged stage, so no level repeats a lemma of another (D3, E3). */
function liveWords(): Word[] {
  return [
    ...readJson<Word[]>(join(root, 'data', 'words.json')),
    ...readIfThere<Word>(join(root, 'data', 'words-own.json')),
    ...['b1', 'a1a2', 'b2'].filter((stage) => stage !== level).flatMap((stage) => readIfThere<Word>(join(root, 'data', stage, 'words.json'))),
  ];
}

async function build() {
  const recordFile = join(cache, 'sources.json');
  reportDrift(existsSync(recordFile) ? readJson<Record<string, string>>(recordFile) : {});
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
  const excluded = readJson<{ id: string; reason: string }[]>(join(root, 'data', 'excluded.json'));
  const counts = lemmaCounts(forms, index);
  const ranks = lemmaRanks(counts);
  const a1a2 = level === 'a1a2';
  const added = a1a2 ? addCardinals(index, forms, counts, ranks) : [];
  // The extras and B2 must not repeat a lemma of any other level, live or staged (E3, D3).
  const taken = liveWords();
  const live = { lemmas: new Set(taken.map((w) => w.lemma_nl)), excludedIds: excludedIdsFor(level, excluded) };
  const pool =
    level === 'b2'
      ? buildB2Pool(
          ranks,
          index,
          openTaal,
          live,
          new Set(
            [
              ...readIfThere<Word>(join(root, 'data', 'b1', 'words.json')),
              ...readIfThere<Word>(join(root, 'data', 'words-own.json')).filter((w) => w.cefr === 'B1'),
            ].map((w) => w.lemma_nl),
          ),
        )
      : buildPool(ranks, index, openTaal, live, a1a2 ? A1A2_BAND : B1_BAND, a1a2 ? A1A2_RULES : B1_RULES);
  writeFileSync(poolFile(), JSON.stringify(pool, null, 2) + '\n');

  const stats = poolCounts(pool, a1a2 ? rankBandA1A2 : rankBand);
  if (level === 'b2') {
    const band: Record<string, number> = {};
    for (const r of pool) band[rankBandB2(r)] = (band[rankBandB2(r)] ?? 0) + 1;
    stats.band = band;
  }
  console.log(
    `Pool: ${pool.length} rows, ${stats.lemmas} lemmas (${stats.twoPos} with two parts of speech) (${poolFile().replace(root + '/', '')})`,
  );
  if (a1a2) console.log(`Cardinal numbers added as noun rows (E7): ${added.join(', ') || 'none'}`);
  console.log('Per part of speech:', stats.pos);
  console.log('Per rank band:', stats.band);
  if (level === 'b2') {
    console.log(`Share of 10-12 letter rows: ${longShare(pool)}`);
    const back = excluded.filter((e) => !excludedIdsFor('b2', [e]).has(e.id));
    const found = back.filter((e) => pool.some((r) => r.id === e.id)).map((e) => e.id);
    console.log(`B2 candidates from the exclusion list: ${found.length} (${found.join(', ') || 'none'})`);
  }
  console.log('Calibration of our live words on the lemma rank (C2, information only):');
  console.table(calibration(ranks, words));
}

function write() {
  if (level === 'a1a2') {
    const pool = readJson<PoolRow[]>(poolFile());
    const sel = readJson<{ A1: string[]; A2: string[] }>(join(root, 'data', 'a1a2', 'selection.json'));
    const out = selectA1A2(pool, sel);
    mkdirSync(join(root, 'data', 'a1a2'), { recursive: true });
    writeFileSync(join(root, 'data', 'a1a2', 'words.json'), JSON.stringify(out, null, 2) + '\n');
    console.log(`Wrote ${out.length} words to data/a1a2/words.json`);
    return;
  }
  const pool = readJson<PoolRow[]>(poolFile());
  const ids = readJson<string[]>(join(root, 'data', level, 'selection.json'));
  const name = level.toUpperCase();
  const out = selectWords(pool, ids, name as Word['cefr'], name);
  writeFileSync(join(root, 'data', level, 'words.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote ${out.length} words to data/${level}/words.json`);
}

function checkArticles() {
  const need = (path: string, step: string) => {
    if (!existsSync(path)) {
      console.error(`Missing ${path.replace(root + '/', '')}; ${step}`);
      process.exit(1);
    }
    return path;
  };
  const kaikki = need(join(cache, 'kaikki.org-dictionary-Dutch.jsonl'), 'run --fetch first');
  const words = readJson<Word[]>(need(join(root, 'data', level, 'words.json'), 'run --write first'));
  const notes = readJson<Annotation[]>(need(join(root, 'data', level, 'annotations.json'), `write the ${level} annotations first`));
  const index = emptyKaikkiIndex();
  for (const line of readFileSync(kaikki, 'utf8').split('\n')) addKaikkiLine(index, line);
  const rows = articleCheck(words, notes, index);
  const csv = rows.map((r) => [r.id, r.dutch, r.stored, r.wiktionary, r.result].join(','));
  writeFileSync(join(cache, 'article-check.csv'), ['id,dutch,stored,wiktionary,result', ...csv].join('\n') + '\n');
  const count = (result: string) => rows.filter((r) => r.result === result).length;
  console.log(
    `Articles: ${count('agree')} agree, ${count('differ')} differ, ${count('both')} both, ${count('unchecked')} unchecked (.cache/b1/article-check.csv)`,
  );
}

const modes = { '--fetch': fetchAll, '--build': build, '--write': write, '--check-articles': checkArticles };
const usage = 'Usage: npm run b1-pool -- --fetch | --build | --write | --check-articles [--level b1|a1a2|b2]';
const args = process.argv.slice(2);
const at = args.indexOf('--level');
if (at >= 0) {
  const value = args[at + 1];
  if (value !== 'b1' && value !== 'a1a2' && value !== 'b2') {
    console.error(usage);
    process.exit(1);
  }
  level = value;
  args.splice(at, 2);
}
if (args.length !== 1 || !(args[0] in modes)) {
  console.error(usage);
  process.exit(1);
}
await modes[args[0] as keyof typeof modes]();
