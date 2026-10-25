import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  MT_LANGS,
  buildRows,
  csvPath,
  liveKey,
  parseArgs,
  loadRelease,
  loadStageRelease,
  missingTexts,
  planRun,
  renderCsv,
  renderReport,
  reportPath,
  runCheck,
  type MtLang,
  type MtRow,
} from '../mt-check.ts';

const root = join(import.meta.dirname, '..', '..');
const { dryRun, lang: langArg, release: releaseArg, stage, ids, cap } = parseArgs(process.argv.slice(2));

const release = stage ? loadStageRelease(root, stage) : loadRelease(root, releaseArg);
const label = stage ? `Stage ${stage}` : `Release ${release.version}`;
const langs: MtLang[] = langArg ? [langArg] : MT_LANGS;
const rows: Partial<Record<MtLang, MtRow[]>> = {};
for (const lang of langs) {
  rows[lang] = buildRows(release, lang, ids);
  const miss = missingTexts(release, lang, ids);
  if (miss.length) console.warn(`No ${lang} text for: ${miss.join(', ')} (skipped)`);
}

for (const p of planRun(rows, cap)) {
  console.log(`${p.lang}: ${p.words} words, ${p.requests} requests, ${p.chars} characters (cap ${cap})`);
}

if (dryRun) {
  console.log('Dry run: nothing was sent and no file was written.');
} else {
  try {
    process.loadEnvFile(join(root, '.env'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
  const key = liveKey(process.env);
  const { results, chars } = await runCheck(rows, { key, fetch, cap });
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const path = reportPath(date, true);
  mkdirSync(join(root, 'review', 'mt-check'), { recursive: true });
  writeFileSync(join(root, path), renderReport({ date, version: release.version, chars, ids, label }, results));
  console.log(`Wrote ${path}: ${new Set(results.map((r) => r.id)).size} rows`);
  writeFileSync(join(root, csvPath(date)), renderCsv(results));
  console.log(`Wrote ${csvPath(date)}: ${results.length} readings`);
}
