# LinguaGrid content

Word data for [LinguaGrid](https://github.com/bltbllky/LinguaGrid), a calm word-search game for Turkish speakers learning Dutch.

- `data/` — CEFR-graded Dutch words (`words.json`), de/het articles and categories (`annotations.json`, `categories.json`)
  and one file of prompt texts and category titles per learner language (`data/translations/<lang>.json`, ADR-011)
- `manifest.json` — content version, minimum app versions, prompt languages and release files, served on GitHub Pages
- `release/<version>/` — the reviewed release the app downloads
- `privacy/` — the app's privacy policy

See `LICENSE-DATA.md` for licences and attribution.

## Review flow per language

Every learner language is accepted by the round-trip check of ADR-012, and a human decides only the rows it flags:

1. `npm run export-review a1` writes `review/a1.csv` for Turkish; `npm run export-review -- --lang en a1` writes
   `review/en/a1.csv` with the Turkish text as context (T-030).
2. The content editor pre-checks every word (`review/<level>.findings.csv`, `review/<lang>/<level>.findings.csv`). Two blind
   agents, which have not seen the existing text, write it again: one from the pivot (English for Turkish, Turkish for
   English; for other languages, an English back-translation) and one from the Dutch lemma alone, with a de/het guess for
   nouns. A comparer marks each as match, close or mismatch in a result sheet under `review/roundtrip/`, with a `verdict`
   column: `OK` for match/match or match/close without a finding (also for rows with `deepl_same` = `yes`, ADR-019), and `owner` for a mismatch, an article disagreement or a
   content-editor finding. Close/close rows go to the content editor, who sets `OK` or files a finding.
3. `npm run import-roundtrip -- [--lang en] <sheet>` sets `reviewed: true` with `review_source: "roundtrip"` on the `OK`
   rows (for Turkish also on the annotation when the article check matched). The owner decides the remaining rows in the
   review sheet: `npm run import-review review/a1.csv` applies them with `review_source: "owner"` (`--reviewer` for a
   named reviewer). A round trip never overwrites a human decision. Only the owner merges a PR that marks content reviewed.
4. `npm run validate` checks the files and prints the coverage per language and level (reviewed / total).

Spot check (ADR-019): per language and sheet, `npm run spot-check -- draw --lang tr --seed <YYYYMMDD> --result <result.csv>
[--exclude <owner-sheet.csv,...>]` draws 20 round-trip-accepted words (seed recorded) plus 30 for an extension, 5 of the 20 from
rows released by `deepl_same` = `yes` when a sheet has at least 10 of them. 0 errors pass; 1 error adds the 30 (at most 1 in 50
passes); 2 or more in the 20 fail. A failure leaves the language out and resets the `roundtrip` acceptances of the level
(`docs/release/content-check.md` in the app repository). Append each result to `review/spot-check-tally.csv`; `npm run
spot-check -- tally` prints the running numbers, and when the newest 200 tallied words hold more than 4 errors the next sheet
uses 50 words again.

## Staged levels (B1)

B1 words are collected before the app can show them (owner decision 2026-10-18; selected from open sources, owner decision 2026-10-21). They live in `data/b1/` with the same files
and shapes as the live data, and no release reads them: `npm run release` uses only `data/words.json` and refuses any level
other than A1 and A2. `npm run validate -- --stage b1` checks the staged files against the live ones: B1 level, own source,
no lemma that is already an A1, A2 or B1 word, B1-only categories, and every live rule. B1 is released by its M3 task, which
moves `data/b1/` into the live files.
Review sheets for B1: `npm run export-review -- [--lang en] --stage b1 b1`; imports take `--stage b1` too and write only
`data/b1/` (a word the owner removes also goes to `data/excluded.json` and leaves `data/b1/selection.json`).

## B1 pool tool

`npm run b1-pool -- --fetch` downloads the open sources into `.cache/b1/` (never committed): the Leipzig Corpora Collection word counts (CC BY), the Wiktionary Dutch extract of kaikki.org (CC BY-SA 4.0) and the OpenTaal wordlist (BSD-3 or CC BY 3.0). `--build` writes the candidate pool, `--write` turns `data/b1/selection.json` into `data/b1/words.json`, and `--check-articles` compares our de/het articles with Wiktionary. Wiktionary is used to check only: none of its text is copied into this repository. The selection criteria are in `data/b1/selection-criteria.md`.

`--level b2` builds the B2 pool (lemma rank 10,000-20,000 plus B1-band rows that are not B1 words; criteria in `data/b2/selection-criteria.md`) into `.cache/b1/pool-b2.json`; `--write --level b2` writes `data/b2/words.json`; `--check-articles --level a1a2|b2` checks the articles of that stage.

`--level a1a2` builds the pool for the A1/A2 extras (lemma rank 1-5,000, A1 words 1-3,000; 3-12 letters; the cardinal numbers of E7 added as noun rows; criteria in `data/a1a2/selection-criteria.md`) into `.cache/b1/pool-a1a2.json`, and `--write --level a1a2` turns `data/a1a2/selection.json` into `data/a1a2/words.json`. Wiktionary does not mark every nationality word as a demonym (europees, frans, duits, nederlander), so the pool keeps them; removing them is a manual E4 check by the curator in T-146.

## Machine-translation check (ADR-014, ADR-015)

`npm run mt-check -- --ids id1,id2` asks DeepL for a second opinion on the rows the content editor hands to the owner. It
sends only the Dutch text of those rows (the lemma, with de/het for nouns), NL→TR and NL→EN, and writes
`review/mt-check/<date>-rows.md` with our text and DeepL's reading side by side, and `review/mt-check/<date>-rows.csv`
(`id,lang,dutch,mt`) for `three-readers`. The reports stay on your machine:
`review/mt-check/` is git-ignored. For staged B1 rows add `--stage b1`. The reading is advisory context for the
question to the owner: it flags nothing, gives no verdict and is never written into `data/` or a release. There is no
full-release run.

Setup, once: copy your DeepL API key into a file named `.env` in the root of this repository, one line,
`DEEPL_API_KEY=your-key` (the file is git-ignored; never commit the key or put it in a GitHub secret). A key ending in `:fx`
is a Free key and uses the Free host; any other key uses the Pro host. Check the plan first with
`npm run mt-check -- --dry-run --ids id1,id2` (no key, no network), then run it without `--dry-run`. A run stops before it
would send more than `--max-chars` characters (default 100,000; the Free plan allows 500,000 a month and then stops with an
error, never a bill). Only public Dutch words are sent; never send anything else.

## Release

`npm run release` writes `release/<version>/` and bumps `content_version` in `manifest.json`:

| File | Content |
|---|---|
| `words.json` | released words: annotation and Turkish translation both reviewed |
| `annotations.json`, `categories.json` | language-neutral facts plus the pre-T-029 `text_tr` / `title_tr` copies for older app builds |
| `translations-<lang>.json` | `{ lang, words: [{ word_id, text }], categories: [{ category_id, title }] }` — reviewed texts of released words only, plus every category title of that language |

Every file is listed in the manifest's `files` with its sha256 checksum, and `languages` lists the prompt languages of the
release, Turkish first (for example `["tr", "en"]`). A manifest without `languages` predates per-language releases and is Turkish only.

- Turkish is required: the release fails below 400 A1 or 600 A2 released words.
- Another language is included only if at least 400 A1 and 600 A2 released words have a reviewed translation in it;
  otherwise it is left out of the files and of `languages`, and the script prints why.
- `npm run release -- --allow-partial` relaxes these minimums for test builds, for Turkish and every other language alike;
  a language with no reviewed translation of a released word is still left out.
