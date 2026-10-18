import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  DEFAULT_MAX_CHARS,
  MT_LANGS,
  buildRows,
  loadRelease,
  planRun,
  renderReport,
  reportPath,
  runCheck,
  type MtLang,
  type MtRow,
} from '../mt-check.ts';

const root = join(import.meta.dirname, '..', '..');
const usage = 'Usage: npm run mt-check -- [--dry-run] [--lang tr|en] [--release <n>] [--ids id1,id2] [--max-chars 100000]';
const args = process.argv.slice(2);

function flag(name: string): string | undefined {
  const at = args.indexOf(name);
  return at >= 0 ? args.splice(at, 2)[1] : undefined;
}

const dryAt = args.indexOf('--dry-run');
const dryRun = dryAt >= 0;
if (dryRun) args.splice(dryAt, 1);
const langArg = flag('--lang');
const releaseArg = flag('--release');
const idsArg = flag('--ids');
const maxArg = flag('--max-chars');
if (args.length > 0) throw new Error(usage);
if (langArg !== undefined && langArg !== 'tr' && langArg !== 'en') throw new Error('--lang must be tr or en');
if (maxArg !== undefined && !/^[1-9]\d*$/.test(maxArg)) throw new Error('--max-chars must be a positive integer');
const cap = maxArg ? Number(maxArg) : DEFAULT_MAX_CHARS;
const ids = idsArg?.split(',').map((i) => i.trim());

const release = loadRelease(root, releaseArg ? Number(releaseArg) : undefined);
const langs: MtLang[] = langArg ? [langArg] : MT_LANGS;
const rows: Partial<Record<MtLang, MtRow[]>> = {};
for (const lang of langs) rows[lang] = buildRows(release, lang, ids);

for (const p of planRun(rows, cap)) {
  console.log(`${p.lang}: ${p.words} words, ${p.requests} requests, ${p.chars} characters (cap ${cap})`);
}

if (dryRun) {
  console.log('Dry run: nothing was sent and no file was written.');
} else {
  if (process.env.CI) throw new Error('mt-check sends text to Google and does not run in CI; use --dry-run');
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) throw new Error('GOOGLE_TRANSLATE_API_KEY is not set (README, "Machine-translation check")');
  const { results, chars } = await runCheck(rows, { key, fetch, cap });
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const path = reportPath(date, ids !== undefined);
  mkdirSync(join(root, 'review', 'mt-check'), { recursive: true });
  writeFileSync(join(root, path), renderReport({ date, version: release.version, chars, ids }, results));
  console.log(`Wrote ${path}: ${results.filter((r) => r.cls === 'mismatch').length} mismatches`);
}
