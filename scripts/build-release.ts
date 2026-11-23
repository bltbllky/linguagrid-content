import { createHash } from 'node:crypto';

import { NT2LEX_RETIRED, withLegacyTurkish } from './validate.ts';
import type { Content, Manifest } from './validate.ts';
import { SENTENCE_LEVELS } from './sentence-stage.ts';
import type { SentenceStage } from './sentence-stage.ts';

export interface ReleaseOptions {
  minimums: Partial<Record<string, number>>;
  allowPartial: boolean;
  /** ADR-022: refuse any NT2Lex-derived word; defaults to `NT2LEX_RETIRED`. */
  nt2lexRetired?: boolean;
  /** The live sentence files (ADR-026); absent or empty means no sentences in this release. */
  sentences?: SentenceStage;
}

export interface Release {
  manifest: Manifest;
  files: Record<string, string>;
  /** Languages left out of this release, with the reason (for the CLI output). */
  excluded: string[];
  /** Sentence levels left out, one `Sentences: A2 left out (91%)` line each (for the CLI output). */
  sentenceNotes: string[];
}

/** Levels the app can show (US-022 adds B1, US-033 adds B2). */
export const RELEASED_LEVELS: readonly string[] = ['A1', 'A2', 'B1', 'B2'];

/** Reviewed words per level that `npm run release` requires (B2: 1000 is an owner rule, US-033). */
export const RELEASE_MINIMUMS = { A1: 400, A2: 600, B1: 600, B2: 1000 } as const;

/** A level's sentences ship only when this share of its released words has a reviewed sentence and text in every shipped language. */
export const SENTENCE_COVERAGE = 0.95;
/** ADR-027 rule 5: the sentence files together stay under this many raw bytes. */
export const SENTENCE_MAX_BYTES = 1_500_000;

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
export function buildRelease(content: Content, { minimums, allowPartial, nt2lexRetired = NT2LEX_RETIRED, sentences }: ReleaseOptions): Release {
  const nt2lex = content.words.filter((w) => w.source === 'nt2lex');
  if (nt2lexRetired && nt2lex.length) throw new Error(`Release blocked — ${nt2lex.length} NT2Lex-derived words (US-023)`);
  const unreleased = content.words.filter((w) => !RELEASED_LEVELS.includes(w.cefr));
  if (unreleased.length) {
    const levels = [...new Set(unreleased.map((w) => w.cefr))].join('/');
    throw new Error(`Release blocked — the live word files hold ${levels} words (${unreleased.length}); ${levels} is not a released level`);
  }
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

  const sentenceNotes: string[] = [];
  if (sentences?.rows.length) Object.assign(files, sentenceFiles(sentences, words, languages, sentenceNotes));

  const manifest: Manifest = {
    content_version: version,
    min_app_version: content.manifest.min_app_version,
    languages,
    files: Object.entries(files).map(([name, body]) => ({
      path: `release/${version}/${name}`,
      sha256: createHash('sha256').update(body).digest('hex'),
    })),
  };
  return { manifest, files, excluded, sentenceNotes };
}

/**
 * `sentences.json` and `sentence-translations-<lang>.json` for the levels that meet `SENTENCE_COVERAGE` (ADR-026, ADR-027).
 * Only reviewed rows of released words ship, without review fields: the app's parser reads a bare array of
 * `{word_id, nl, form, distractors}` and `{lang, rows: [{word_id, text}]}` and rejects anything else.
 */
function sentenceFiles(input: SentenceStage, words: Content['words'], languages: string[], notes: string[]): Record<string, string> {
  const level = new Map(words.map((w) => [w.id, w.cefr]));
  const texts = new Map(
    languages.map((lang) => [lang, new Map((input.translations[lang] ?? []).filter((t) => t.reviewed && t.text.trim()).map((t) => [t.word_id, t.text]))]),
  );
  const reviewed = new Map(input.rows.filter((r) => r.reviewed && level.has(r.word_id)).map((r) => [r.word_id, r]));
  const kept = new Set<string>();
  for (const lvl of SENTENCE_LEVELS) {
    const ids = words.filter((w) => w.cefr === lvl).map((w) => w.id);
    if (!ids.length) continue;
    const complete = ids.filter((id) => reviewed.has(id) && languages.every((l) => texts.get(l)?.has(id)));
    if (complete.length / ids.length < SENTENCE_COVERAGE) {
      notes.push(`Sentences: ${lvl} left out (${Math.floor((complete.length / ids.length) * 100)}%)`);
      continue;
    }
    // A sentence with no shipped-language text is dropped; a missing text only drops that language's row.
    for (const id of ids) if (reviewed.has(id) && languages.some((l) => texts.get(l)?.has(id))) kept.add(id);
  }
  const rows = [...reviewed.values()].filter((r) => kept.has(r.word_id));
  if (!rows.length) return {};
  const files: Record<string, string> = {
    'sentences.json': json(rows.map(({ word_id, nl, form, distractors }) => ({ word_id, nl, form, distractors }))),
  };
  for (const lang of languages) {
    const own = rows.filter((r) => texts.get(lang)?.has(r.word_id));
    if (own.length) files[`sentence-translations-${lang}.json`] = json({ lang, rows: own.map((r) => ({ word_id: r.word_id, text: texts.get(lang)!.get(r.word_id) })) });
  }
  const bytes = Object.values(files).reduce((sum, body) => sum + Buffer.byteLength(body), 0);
  if (bytes > SENTENCE_MAX_BYTES) throw new Error(`Release blocked — the sentence files exceed 1.5 MB (${bytes} bytes; ADR-027 rule 5)`);
  return files;
}
