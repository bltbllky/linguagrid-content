import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  MT_LANGS,
  buildRows,
  liveKey,
  parseArgs,
  loadRelease,
  planRun,
  renderReport,
  reportPath,
  runCheck,
  type MtLang,
  type MtRow,
} from '../mt-check.ts';

const root = join(import.meta.dirname, '..', '..');
const { dryRun, lang: langArg, release: releaseArg, ids, cap } = parseArgs(process.argv.slice(2));

const release = loadRelease(root, releaseArg);
const langs: MtLang[] = langArg ? [langArg] : MT_LANGS;
const rows: Partial<Record<MtLang, MtRow[]>> = {};
for (const lang of langs) rows[lang] = buildRows(release, lang, ids);

for (const p of planRun(rows, cap)) {
  console.log(`${p.lang}: ${p.words} words, ${p.requests} requests, ${p.chars} characters (cap ${cap})`);
}

if (dryRun) {
  console.log('Dry run: nothing was sent and no file was written.');
} else {
  const key = liveKey(process.env);
  const { results, chars } = await runCheck(rows, { key, fetch, cap });
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const path = reportPath(date, ids !== undefined);
  mkdirSync(join(root, 'review', 'mt-check'), { recursive: true });
  writeFileSync(join(root, path), renderReport({ date, version: release.version, chars, ids }, results));
  console.log(`Wrote ${path}: ${results.filter((r) => r.cls === 'mismatch').length} mismatches`);
}
