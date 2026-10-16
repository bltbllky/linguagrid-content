# LinguaGrid content

Word data for [LinguaGrid](https://github.com/bltbllky/LinguaGrid), a calm word-search game for Turkish speakers learning Dutch.

- `data/` — CEFR-graded Dutch words (`words.json`), de/het articles and categories (`annotations.json`, `categories.json`)
  and one file of prompt texts and category titles per learner language (`data/translations/<lang>.json`, ADR-011)
- `manifest.json` — content version, minimum app versions, prompt languages and release files, served on GitHub Pages
- `release/<version>/` — the reviewed release the app downloads
- `privacy/` — the app's privacy policy

See `LICENSE-DATA.md` for licences and attribution.

## Review flow per language

Every learner language is reviewed as a list, one CSV per level:

1. `npm run export-review a1` writes `review/a1.csv` for Turkish; `npm run export-review -- --lang en a1` writes
   `review/en/a1.csv` with the Turkish text as context (T-030).
2. The owner marks each row as OK or writes a correction in the last column.
3. `npm run import-review review/a1.csv` applies the Turkish texts and the article and sets `reviewed: true`; importing
   `review/en/a1.csv` only changes `data/translations/en.json`.
4. `npm run validate` checks the files and prints the coverage per language and level (reviewed / total).

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
