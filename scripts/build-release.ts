import { createHash } from 'node:crypto';

import { withLegacyTurkish } from './validate.ts';
import type { Content, Manifest } from './validate.ts';

export interface ReleaseOptions {
  minimums: Partial<Record<string, number>>;
  allowPartial: boolean;
}

export interface Release {
  manifest: Manifest;
  files: Record<string, string>;
  /** Languages left out of this release, with the reason (for the CLI output). */
  excluded: string[];
}

const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';

/** Words below `minimums` per level, as "A1: 12 reviewed <noun> (minimum 400)". */
function shortfalls(words: Content['words'], minimums: ReleaseOptions['minimums'], noun: string): string[] {
  return Object.entries(minimums)
    .map(([level, min]) => [level, words.filter((w) => w.cefr === level).length, min ?? 0] as const)
    .filter(([, count, min]) => count < min)
    .map(([level, count, min]) => `${level}: ${count} reviewed ${noun} (minimum ${min})`);
}

/**
 * Builds the next content release: only words whose annotation and Turkish translation are both
 * reviewed, versioned file paths and checksums, and one `translations-<lang>.json` per prompt
 * language (ADR-011). Turkish is required; another language ships only when its reviewed
 * translations of released words meet the same minimums. `allowPartial` relaxes the minimums for
 * Turkish and the other languages alike, but a language with no reviewed translation never ships.
 * The app downloads these files when the manifest's content_version is newer than its own.
 */
export function buildRelease(content: Content, { minimums, allowPartial }: ReleaseOptions): Release {
  const turkish = new Set(content.translations.tr.words.filter((t) => t.reviewed).map((t) => t.word_id));
  const reviewed = new Set(content.annotations.filter((a) => a.reviewed && turkish.has(a.word_id)).map((a) => a.word_id));
  const words = content.words.filter((w) => reviewed.has(w.id));

  const missing = shortfalls(words, minimums, 'words');
  if (missing.length && !allowPartial) {
    throw new Error(`Release blocked — ${missing.join(', ')}. Use --allow-partial for test builds.`);
  }

  const version = content.manifest.content_version + 1;
  // Pre-T-029 files with Turkish texts, so app builds from before T-034 keep working.
  const legacy = withLegacyTurkish(content);
  const files: Record<string, string> = {
    'words.json': json(words),
    'annotations.json': json(legacy.annotations.filter((a) => reviewed.has(a.word_id)).map(({ review_source: _, ...a }) => a)),
    'categories.json': json(legacy.categories),
  };
  const languages: string[] = [];
  const excluded: string[] = [];
  const others = Object.keys(content.translations).filter((lang) => lang !== 'tr').sort();
  for (const lang of ['tr', ...others]) {
    const file = content.translations[lang];
    if (!file) continue;
    const texts = new Map(file.words.filter((t) => t.reviewed && t.text.trim()).map((t) => [t.word_id, t.text]));
    const covered = words.filter((w) => texts.has(w.id));
    const short = shortfalls(covered, minimums, 'translations');
    if (lang !== 'tr' && (covered.length === 0 || (short.length && !allowPartial))) {
      excluded.push(`${lang}: ${short.join(', ') || 'no reviewed translations of released words'}`);
      continue;
    }
    languages.push(lang);
    files[`translations-${lang}.json`] = json({
      lang,
      words: covered.map((w) => ({ word_id: w.id, text: texts.get(w.id) })),
      categories: file.categories.map(({ category_id, title }) => ({ category_id, title })),
    });
  }

  const manifest: Manifest = {
    content_version: version,
    min_app_version: content.manifest.min_app_version,
    languages,
    files: Object.entries(files).map(([name, body]) => ({
      path: `release/${version}/${name}`,
      sha256: createHash('sha256').update(body).digest('hex'),
    })),
  };
  return { manifest, files, excluded };
}
