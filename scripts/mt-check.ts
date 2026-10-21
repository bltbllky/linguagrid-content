import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type MtLang = 'tr' | 'en';
export const MT_LANGS: MtLang[] = ['tr', 'en'];
export const DEFAULT_MAX_CHARS = 100_000;
export const BATCH_SIZE = 50;
export const RETRY_WAITS_MS = [1000, 2000, 4000];
export const TIMEOUT_MS = 30_000;
export const USAGE =
  'Usage: npm run mt-check -- --ids id1,id2 [--dry-run] [--lang tr|en] [--release <n>] [--max-chars 100000]';
export const TARGETS: Record<MtLang, string> = { tr: 'TR', en: 'EN-GB' };

export function endpointFor(key: string): string {
  return key.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
}

export interface MtRow {
  id: string;
  dutch: string;
  ours: string;
}
export type MtResult = MtRow & { lang: MtLang; mt: string };

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

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function translateAll(
  texts: string[],
  target: MtLang,
  opts: {
    key: string;
    fetch: typeof fetch;
    budget: { cap: number; used: number };
    timeoutMs?: number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<string[]> {
  const out: string[] = [];
  const { budget } = opts;
  const sleep = opts.sleep ?? wait;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const n = countChars(batch);
    if (budget.used + n > budget.cap) {
      throw new Error(`Character cap of ${budget.cap} reached after ${budget.used} characters; the rest was not sent.`);
    }
    for (let attempt = 0; ; attempt++) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? TIMEOUT_MS);
      let res: Response;
      try {
        res = await opts.fetch(endpointFor(opts.key), {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `DeepL-Auth-Key ${opts.key}` },
          body: JSON.stringify({ text: batch, source_lang: 'NL', target_lang: TARGETS[target] }),
          signal: ctl.signal,
        });
      } catch {
        throw new Error('DeepL API request failed or timed out; no report was written.');
      } finally {
        clearTimeout(timer);
      }
      if (res.status === 456) {
        throw new Error(
          'DeepL quota exceeded (456): the monthly character limit is used up; nothing more was sent.',
        );
      }
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        translations?: { text: string }[];
      };
      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && attempt < RETRY_WAITS_MS.length) {
          await sleep(RETRY_WAITS_MS[attempt]);
          continue;
        }
        throw new Error(`DeepL API error ${res.status}: ${body.message ?? res.statusText}`);
      }
      const got = body.translations ?? [];
      if (got.length !== batch.length) {
        throw new Error(`DeepL API returned ${got.length} translations for ${batch.length} texts`);
      }
      budget.used += n;
      out.push(...got.map((t) => t.text));
      break;
    }
  }
  return out;
}

export async function runCheck(
  rows: Partial<Record<MtLang, MtRow[]>>,
  opts: { key: string; fetch: typeof fetch; cap: number; sleep?: (ms: number) => Promise<void> },
): Promise<{ results: MtResult[]; chars: number }> {
  const budget = { cap: opts.cap, used: 0 };
  const results: MtResult[] = [];
  for (const lang of MT_LANGS) {
    const r = rows[lang];
    if (!r) continue;
    const mts = await translateAll(
      r.map((x) => x.dutch),
      lang,
      { key: opts.key, fetch: opts.fetch, budget, sleep: opts.sleep },
    );
    r.forEach((row, i) => results.push({ ...row, lang, mt: mts[i] }));
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
  const ids = [...new Set(results.map((r) => r.id))];
  const find = (id: string, lang: MtLang) => results.find((r) => r.id === id && r.lang === lang);
  const lines = [
    `# DeepL second opinion ${meta.date}`,
    '',
    'Machine translated by DeepL: every "DeepL" text below is an automatic translation (DeepL API, source NL). It is advisory context for a question to the owner, never a verdict and never content (ADR-015).',
    '',
    `Release ${meta.version} · ${meta.chars} characters sent${meta.ids ? ` · rows: ${meta.ids.join(', ')}` : ''}`,
    '',
    '| id | Dutch sent | our TR | DeepL TR | our EN | DeepL EN |',
    '|---|---|---|---|---|---|',
  ];
  for (const id of ids) {
    const tr = find(id, 'tr');
    const en = find(id, 'en');
    const dutch = (tr ?? en)?.dutch ?? '';
    lines.push(
      `| ${[id, dutch, tr?.ours ?? '-', tr?.mt ?? '-', en?.ours ?? '-', en?.mt ?? '-'].map(cell).join(' | ')} |`,
    );
  }
  return lines.join('\n') + '\n';
}

export interface MtArgs {
  dryRun: boolean;
  lang?: MtLang;
  release?: number;
  ids: string[];
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
  if (ids === undefined) {
    throw new Error('--ids is required: mt-check reads only the rows the content editor marks for the owner');
  }
  if (lang !== undefined && lang !== 'tr' && lang !== 'en') throw new Error('--lang must be tr or en');
  if (release !== undefined && !/^[1-9]\d*$/.test(release)) throw new Error('--release must be a positive integer');
  if (max !== undefined && !/^[1-9]\d*$/.test(max)) throw new Error('--max-chars must be a positive integer');
  return {
    dryRun: dryAt >= 0,
    lang: lang as MtLang | undefined,
    release: release ? Number(release) : undefined,
    ids: ids.split(',').map((i) => i.trim()),
    cap: max ? Number(max) : DEFAULT_MAX_CHARS,
  };
}

/** Returns the key for a live run, or throws; never reads anything but the two variables. */
export function liveKey(env: Record<string, string | undefined>): string {
  if (env.CI) throw new Error('mt-check sends text to DeepL and does not run in CI; use --dry-run');
  const key = env.DEEPL_API_KEY;
  if (!key) throw new Error('DEEPL_API_KEY is not set (README, "Machine-translation check")');
  return key;
}
