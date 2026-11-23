# Example sentences (staged)

Files, all bare JSON arrays, checked by `npm run validate -- --stage sentences` (CI runs it):

- `sentences.json`: rows `word_id`, `nl`, `form`, `distractors` (3), `reviewed`, `review_source`.
- `translations/<lang>.json`: rows `word_id`, `text`, `reviewed`, `review_source`; each needs a sentence.
- `function-words.json`: the lowercase tokens allowed besides the word lists (T-375).
- `irregular-forms.json`: irregular verb pasts, participles and plurals (`form: lemma`) that the spelling rules of
  `scripts/inflection.ts` cannot reach; only forms whose lemma is a live word count.

## Licence (ADR-026 rule 7)

The sentences and their translations are our own data, written by Claude and reviewed by the owner or a reviewer. They have the
same licence as our translations and are kept apart from the word files (ADR-009): no NT2Lex or Tatoeba text is in them.
