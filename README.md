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
   column: `OK` for match/match or match/close without a finding, and `owner` for a mismatch, an article disagreement or a
   content-editor finding. Close/close rows go to the content editor, who sets `OK` or files a finding.
3. `npm run import-roundtrip -- [--lang en] <sheet>` sets `reviewed: true` with `review_source: "roundtrip"` on the `OK`
   rows (for Turkish also on the annotation when the article check matched). The owner decides the remaining rows in the
   review sheet: `npm run import-review review/a1.csv` applies them with `review_source: "owner"` (`--reviewer` for a
   named reviewer). A round trip never overwrites a human decision. Only the owner merges a PR that marks content reviewed.
4. `npm run validate` checks the files and prints the coverage per language and level (reviewed / total).

Before each release, 50 round-trip-accepted words per language are drawn at random (seed recorded) and checked by a
person who reads the language. More than one error leaves that language out of the release and resets its round-trip
acceptances for the affected level (`docs/release/content-check.md` in the app repository).

## Machine-translation check (ADR-014)

After the round trip, and for single rows where review is stuck, `npm run mt-check` sends each released word's Dutch text
(the lemma, with de/het for nouns) to Google Cloud Translation, NL→TR and NL→EN, and writes only the mismatches with our
text to `review/mt-check/<date>.md` (`--ids id1,id2` for stuck rows; `--lang`, `--release`). Machine translation is a
review hint, never content: nothing it returns is written into `data/` or a release. The content editor triages every
mismatch; a real problem becomes a finding for the owner, as in step 2 above.

The key comes only from `GOOGLE_TRANSLATE_API_KEY` in your shell: never commit it, never put it in a GitHub secret, and
restrict it to the Cloud Translation API. A run stops before it would send more than `--max-chars` characters (default
100,000; the free tier is 500,000 a month). `npm run mt-check -- --dry-run` shows the plan without a key or network.

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
