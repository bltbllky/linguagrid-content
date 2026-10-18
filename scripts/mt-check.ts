import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type MtLang = 'tr' | 'en';
export const MT_LANGS: MtLang[] = ['tr', 'en'];
export const DEFAULT_MAX_CHARS = 100_000;
export const BATCH_SIZE = 128;
export const TIMEOUT_MS = 30_000;
export const USAGE =
  'Usage: npm run mt-check -- [--dry-run] [--lang tr|en] [--release <n>] [--ids id1,id2] [--max-chars 100000]';
export const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

export interface MtRow {
  id: string;
  dutch: string;
  ours: string;
}
export type MtClass = 'match' | 'partial' | 'mismatch';
export interface MtResult extends MtRow {
  lang: MtLang;
  mt: string;
  cls: MtClass;
}

interface Word {
  id: string;
  lemma_nl: string;
  pos: string;
}
interface Annotation {
  word_id: string;
  article: 'de' | 'het' | null;
}
type Texts = { word_id: string; text: string }[];
export interface Release {
  version: number;
  words: Word[];
  annotations: Annotation[];
  translations: Partial<Record<MtLang, Texts>>;
}

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as unknown;

export function loadRelease(root: string, version?: number): Release {
  const v = version ?? (readJson(join(root, 'manifest.json')) as { content_version: number }).content_version;
  const dir = join(root, 'release', String(v));
  if (!existsSync(dir)) throw new Error(`No release folder release/${v}`);
  const translations: Release['translations'] = {};
  for (const lang of MT_LANGS) {
    const file = join(dir, `translations-${lang}.json`);
    if (existsSync(file)) translations[lang] = (readJson(file) as { words: Texts }).words;
  }
  return {
    version: v,
    words: readJson(join(dir, 'words.json')) as Word[],
    annotations: readJson(join(dir, 'annotations.json')) as Annotation[],
    translations,
  };
}

export function buildRows(release: Release, lang: MtLang, ids?: string[]): MtRow[] {
  const wanted = ids?.map((i) => i.trim());
  if (wanted) {
    const known = new Set(release.words.map((w) => w.id));
    for (const id of wanted) if (!known.has(id)) throw new Error(`Unknown word id: ${id}`);
  }
  const texts = new Map((release.translations[lang] ?? []).map((t) => [t.word_id, t.text]));
  const articles = new Map(release.annotations.map((a) => [a.word_id, a.article]));
  const rows: MtRow[] = [];
  for (const w of release.words) {
    const ours = texts.get(w.id);
    if (!ours || (wanted && !wanted.includes(w.id))) continue;
    const article = w.pos === 'noun' ? articles.get(w.id) : null;
    rows.push({ id: w.id, dutch: article ? `${article} ${w.lemma_nl}` : w.lemma_nl, ours });
  }
  return rows;
}

export function normalise(text: string, lang: MtLang): string {
  let t = text.normalize('NFC').toLocaleLowerCase(lang).replace(/\([^)]*\)/g, ' ');
  t = t.trim().replace(/[.!?]+$/, '');
  if (lang === 'en') t = t.replace(/^(to|the|an|a) /, '');
  return t.replace(/\s+/g, ' ').trim();
}

const parts = (text: string, lang: MtLang): string[] =>
  text
    .split(/[,;/]/)
    .map((p) => normalise(p, lang))
    .filter(Boolean);

function containsRun(hay: string[], needle: string[]): boolean {
  for (let i = 0; i + needle.length <= hay.length; i++) {
    if (needle.every((w, j) => hay[i + j] === w)) return true;
  }
  return false;
}

export function compare(ours: string, mt: string, lang: MtLang): MtClass {
  const a = parts(ours, lang);
  const b = parts(mt, lang);
  if (a.some((x) => b.includes(x))) return 'match';
  for (const x of a) {
    for (const y of b) {
      const xw = x.split(' ');
      const yw = y.split(' ');
      if (containsRun(yw, xw) || containsRun(xw, yw)) return 'partial';
    }
  }
  return 'mismatch';
}

export function countChars(texts: string[]): number {
  return texts.reduce((sum, t) => sum + [...t].length, 0);
}

export function planRun(
  rows: Partial<Record<MtLang, MtRow[]>>,
  cap: number,
): { lang: MtLang; words: number; requests: number; chars: number }[] {
  const plan = MT_LANGS.filter((lang) => rows[lang]).map((lang) => {
    const r = rows[lang] ?? [];
    return {
      lang,
      words: r.length,
      requests: Math.ceil(r.length / BATCH_SIZE),
      chars: countChars(r.map((x) => x.dutch)),
    };
  });
  const total = plan.reduce((s, p) => s + p.chars, 0);
  if (total > cap) {
    throw new Error(`This run needs ${total} characters, more than the cap of ${cap} (--max-chars). Nothing was sent.`);
  }
  return plan;
}

export async function translateAll(
  texts: string[],
  target: MtLang,
  opts: { key: string; fetch: typeof fetch; budget: { cap: number; used: number }; timeoutMs?: number },
): Promise<string[]> {
  const out: string[] = [];
  const { budget } = opts;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const n = countChars(batch);
    if (budget.used + n > budget.cap) {
      throw new Error(`Character cap of ${budget.cap} reached after ${budget.used} characters; the rest was not sent.`);
    }
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? TIMEOUT_MS);
    let res: Response;
    try {
      res = await opts.fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': opts.key },
        body: JSON.stringify({ q: batch, source: 'nl', target, format: 'text', model: 'nmt' }),
        signal: ctl.signal,
      });
    } catch {
      throw new Error('Cloud Translation API request failed or timed out; no report was written.');
    } finally {
      clearTimeout(timer);
    }
    budget.used += n;
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      data?: { translations?: { translatedText: string }[] };
    };
    if (!res.ok) {
      throw new Error(`Cloud Translation API error ${res.status}: ${body.error?.message ?? res.statusText}`);
    }
    const got = body.data?.translations ?? [];
    if (got.length !== batch.length) {
      throw new Error(`Cloud Translation API returned ${got.length} translations for ${batch.length} texts`);
    }
    out.push(...got.map((t) => t.translatedText));
  }
  return out;
}

export async function runCheck(
  rows: Partial<Record<MtLang, MtRow[]>>,
  opts: { key: string; fetch: typeof fetch; cap: number },
): Promise<{ results: MtResult[]; chars: number }> {
  const budget = { cap: opts.cap, used: 0 };
  const results: MtResult[] = [];
  for (const lang of MT_LANGS) {
    const r = rows[lang];
    if (!r) continue;
    const mts = await translateAll(
      r.map((x) => x.dutch),
      lang,
      { key: opts.key, fetch: opts.fetch, budget },
    );
    r.forEach((row, i) => results.push({ ...row, lang, mt: mts[i], cls: compare(row.ours, mts[i], lang) }));
  }
  return { results, chars: budget.used };
}

export function reportPath(date: string, rowsOnly: boolean): string {
  return `review/mt-check/${date}${rowsOnly ? '-rows' : ''}.md`;
}

const cell = (s: string) => s.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');

export function renderReport(
  meta: { date: string; version: number; chars: number; ids?: string[] },
  results: MtResult[],
): string {
  const langs = MT_LANGS.filter((l) => results.some((r) => r.lang === l));
  const count = (l: MtLang, c: MtClass) => results.filter((r) => r.lang === l && r.cls === c).length;
  const lines = [
    `# Machine-translation check ${meta.date}`,
    '',
    'Machine translated: every text in the "MT" column is an automatic translation from Google Translate (Cloud Translation API, model nmt). It is a review hint for the content editor, never content (ADR-014).',
    '',
    `Release ${meta.version} · ${meta.chars} characters sent · source nl${meta.ids ? ` · rows: ${meta.ids.join(', ')}` : ''}`,
    '',
    ...langs.map((l) => `- ${l}: ${count(l, 'match')} match, ${count(l, 'partial')} partial, ${count(l, 'mismatch')} mismatch`),
  ];
  for (const l of langs) {
    const bad = results.filter((r) => r.lang === l && r.cls === 'mismatch');
    lines.push('', `## ${l} mismatches`, '');
    if (bad.length === 0) {
      lines.push('None.');
      continue;
    }
    lines.push('| id | Dutch sent | our text | MT | triage |', '|---|---|---|---|---|');
    for (const r of bad) lines.push(`| ${cell(r.id)} | ${cell(r.dutch)} | ${cell(r.ours)} | ${cell(r.mt)} |  |`);
  }
  return lines.join('\n') + '\n';
}

export interface MtArgs {
  dryRun: boolean;
  lang?: MtLang;
  release?: number;
  ids?: string[];
  cap: number;
}

export function parseArgs(argv: string[]): MtArgs {
  const args = [...argv];
  const dryAt = args.indexOf('--dry-run');
  if (dryAt >= 0) args.splice(dryAt, 1);
  const flag = (name: string): string | undefined => {
    const at = args.indexOf(name);
    if (at < 0) return undefined;
    const value = args[at + 1];
    if (value === undefined || value.trim() === '' || value.startsWith('--')) throw new Error(`${name} needs a value`);
    args.splice(at, 2);
    return value;
  };
  const lang = flag('--lang');
  const release = flag('--release');
  const ids = flag('--ids');
  const max = flag('--max-chars');
  if (args.length > 0) throw new Error(USAGE);
  if (lang !== undefined && lang !== 'tr' && lang !== 'en') throw new Error('--lang must be tr or en');
  if (release !== undefined && !/^[1-9]\d*$/.test(release)) throw new Error('--release must be a positive integer');
  if (max !== undefined && !/^[1-9]\d*$/.test(max)) throw new Error('--max-chars must be a positive integer');
  return {
    dryRun: dryAt >= 0,
    lang: lang as MtLang | undefined,
    release: release ? Number(release) : undefined,
    ids: ids?.split(',').map((i) => i.trim()),
    cap: max ? Number(max) : DEFAULT_MAX_CHARS,
  };
}

/** Returns the key for a live run, or throws; never reads anything but the two variables. */
export function liveKey(env: Record<string, string | undefined>): string {
  if (env.CI) throw new Error('mt-check sends text to Google and does not run in CI; use --dry-run');
  const key = env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) throw new Error('GOOGLE_TRANSLATE_API_KEY is not set (README, "Machine-translation check")');
  return key;
}
