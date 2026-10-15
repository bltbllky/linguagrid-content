import { createHash } from 'node:crypto';

import type { Content, Manifest } from './validate.ts';

export interface ReleaseOptions {
  minimums: Partial<Record<string, number>>;
  allowPartial: boolean;
}

export interface Release {
  manifest: Manifest;
  files: Record<string, string>;
}

/**
 * Builds the next content release: only reviewed words, versioned file paths and checksums.
 * The app downloads these files when the manifest's content_version is newer than its own.
 */
export function buildRelease(content: Content, { minimums, allowPartial }: ReleaseOptions): Release {
  const reviewed = new Set(content.annotations.filter((a) => a.reviewed).map((a) => a.word_id));
  const words = content.words.filter((w) => reviewed.has(w.id));

  const shortfalls = Object.entries(minimums)
    .map(([level, min]) => [level, words.filter((w) => w.cefr === level).length, min] as const)
    .filter(([, count, min]) => count < (min ?? 0));
  if (shortfalls.length && !allowPartial) {
    const detail = shortfalls.map(([l, c, m]) => `${l}: ${c} reviewed words (minimum ${m})`);
    throw new Error(`Release blocked — ${detail.join(', ')}. Use --allow-partial for test builds.`);
  }

  const version = content.manifest.content_version + 1;
  const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
  const files: Record<string, string> = {
    'words.json': json(words),
    'annotations.json': json(content.annotations.filter((a) => reviewed.has(a.word_id))),
    'categories.json': json(content.categories),
  };
  const manifest: Manifest = {
    ...content.manifest,
    content_version: version,
    files: Object.entries(files).map(([name, body]) => ({
      path: `release/${version}/${name}`,
      sha256: createHash('sha256').update(body).digest('hex'),
    })),
  };
  return { manifest, files };
}
