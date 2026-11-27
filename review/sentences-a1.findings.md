# T-380 A1 sentences: content-editor pre-check (before the blind passes)

Date 2026-11-24. 407 of 408 A1 words have a sentence (100 from T-379 + 307 new); every row is `reviewed: false`; nothing is set by hand.

| Measure | Value |
|---|---|
| Written | 407 rows: 262 nouns (incl. numbers, months, weekdays), 81 verbs, 64 adjectives |
| Left out | `verb-overlijden`: the natural use is the participle `overleden` (not resolved by the inflection rules) and the topic is a death in the family (rule 5, sensitive personal fact). Owner decides: add `overleden` to `irregular-forms.json` and keep a neutral sentence, or drop the word from the sentence set |
| Token check | 407 of 407 pass; first pass rejected 10 of 308 new rows (unknown or above-level token: `rustig`, `favoriete`, `per`, `bel`, `slaap`, `nat`, `bak`, `buurman`; plural `seconden` not resolved), all fixed in one rewrite |
| Distractor check | about 13 rows first failed `distractor_pos`/`distractor_unknown` (`werk`, `heet`, `heeft`, `bel` read as nouns or adjectives) and were swapped |
| `validate --stage sentences` | clean |

## Patterns for the owner and the round trip

1. **Sensitive or health topics, kept neutral:** `verb-scheiden` ("Mijn buren gaan scheiden"), `adj-zwanger`, `verb-roken`, `verb-bloeden`, `noun-bloed`, `noun-ziekte`, `noun-griep`, `noun-pijn`, `noun-patiënt`, `noun-ongeluk`, `noun-huwelijk`. No advice, no real person. Owner may drop any.
2. **Weak distractors (a verb of the same class can still fit):** `verb-lopen` (`zwem` fits "naar het station"), `verb-trouwen`, `verb-ontmoeten` and `verb-verhuizen` use odd verbs (`breken`, `hangen`, `draaien`) that a learner can learn to exclude; the pilot flagged the same limit. Number rows with a non-fact sentence use non-number nouns as distractors; the fact rows (`twee`, `vier`, `vijf`, `tien`) use other numbers.
3. **Distractor reuse:** noun rows lean on `bril, fles, schoen, week, avond, keer`; adjective rows rotate four emotion sets (`boos, bang, moe`, ...). Fine for A1; vary in A2.
4. **Translation ambiguity, expect "close":** `noun-oom` (amca/dayı), `noun-tante` (teyze/hala), `noun-neef` (kuzen), `noun-echtgenoot`/`noun-echtgenote` (Turkish `eş` is neutral), `adj-gek` ("gek op voetbal"), `noun-vriendin`, `noun-woning` ("house").
5. **Number, month and weekday rows** repeat one frame ("X jaar oud", "In <maand> ..."), by design: one idea per row.
