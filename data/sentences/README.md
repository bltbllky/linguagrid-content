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

## Distractors (PM decision 2026-11-24)

Distractors are same-part-of-speech surface forms that are also wrong by meaning in the sentence, not only by grammar.

Noun distractors share the answer's article (de/het), so grammar alone cannot exclude them (PM decision 2026-11-24); no distractor word is used more than 7 times across A2 rows (A1 rows keep their old reuse: noun distractors such as `tafel`, `bril` are used more than 7 times).

A row with "cloze": false keeps its sentence and translation but has "distractors": [] and no fill-the-gap question: the app leaves it out of the round. The release writes its distractors as [] and no cloze key. Validation accepts [] only together with "cloze": false, and no distractor may be of a higher level than the target.

## Distractor fit check

Before an owner sheet is exported, an independent editor (not the writer) reads every row and judges each distractor in THIS sentence frame: FIT (the sentence is sensible with it), WEAK (odd but possible), or OK. FIT and WEAK distractors are replaced by hand (same part of speech and article, level at most the target's, at most 7 uses per level, meaning-incompatible; colours after "een ... film" or places after "waar" are the usual traps). A frame that has no clean set goes to a rewrite-proposal list instead of the owner sheet.
