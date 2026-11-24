# T-379 pilot findings: 100 A1 sentences

Date 2026-11-24. No `reviewed` flag is set; every row is `reviewed: false`. Translations (TR, EN) are staged unreviewed as well (the plan makes them optional for the pilot).

## Numbers

| Measure | Value |
|---|---|
| Rows | 100 (A1): 45 de-nouns, 19 het-nouns, 20 verbs, 16 adjectives (A1 list 262 / 82 / 64 of 408, so 64 / 20 / 16 per 100) |
| Categories | all 15 A1 categories (rows per category from 13 in a1-home to 1 in a1-feelings, which holds 4 words) |
| Token check, first pass | 99 of 100 passed (1 rejected: `betalen`, `unknown_token mag`) |
| Token check after rewrite | 100 of 100; no row needed a third attempt, none is left for a human |
| Rows rewritten | 7: 1 token-check reject (`betalen`), 3 distractor part-of-speech rejects (`werken`, `leren`, `wachten`), 3 pre-check naturalness rewrites (`bril`, `hand`, `koken`); `betalen` was rewritten twice |
| Length | 4 to 9 tokens (mean 6.1), at most 45 characters |
| `validate --stage sentences` | clean (with the local Ajv workaround below) |
| Time | about 40 minutes of agent time for writing 300 texts and fixing; not measured with a clock, an estimate |

Caveat for T-381: the 99% first-pass rate is a best case. I wrote with the A1 lemma list in front of me, picked words whose everyday sentence needs only A1 words, and silently dropped about 10 drafts (a sentence that repeated another row's idea, or used `boek`, `vandaag`, `Nederlands`) before the first file was written. Expect a lower rate for A2 targets and for abstract A1 words (`volwassene`, `huishouden`, `apparaat`).

## Seconds per row (owner spot check, T-383 planning; an estimate, not a measurement)

- A reader who knows Dutch A1 and Turkish: Dutch sentence + 3 distractors about 8 s, TR text about 7 s, EN text about 5 s: about 20 s per row for a clean row, about 45 s for a row with a question.
- 20 rows per language, same 20 sentences for both texts: 20 x 20 s = about 7 min per language plus a second look at about 3 rows, so 10 min per language, 20 min for TR and EN. The 30-row extension adds about 10 min per language.
- Sentences the owner cannot judge as a Dutch reader (naturalness) need the native read of ADR-026 rule 6 step 5; this pilot does not replace it.

## Patterns found

1. **Distractor fit.** Distractors of the same part of speech often fit the gap grammatically ("Ik speel van maandag tot vrijdag"). I chose meaning-incompatible forms where the sentence allowed it. Verbs are the weak case: only `werken` is left with an open question. Owner decides whether "same part of speech" is enough or distractors must be wrong by meaning.
2. **Distractor reuse.** `moe`, `ziek`, `bang` are the distractors of 10 adjective rows and `bakken`, `snijden`, `bouwen` of 7 verb rows; a learner can learn to exclude them. Fine for a pilot; vary them in the bulk.
3. **Distractor part-of-speech check and homographs.** `slaap` (also a noun) and `bak` failed `distractor_pos`; first-person verb forms that are also nouns are rejected. Workaround: use another verb.
4. **No cloze can rule out every synonym.** Rows where the target has a close synonym in the A1 list (`huis`/`woning`, `film`) were not given that synonym as a distractor.
5. **Plural targets** (`talen`, `ogen`, `schoenen`) keep the plural in the distractors.

## Function-word list and checker (PM asked me to flag problems)

- No wrong entry found in `function-words.json`; the extra adverbs and question words are fine. `zeer` is formal (B1) and `toen`, `terwijl`, `omdat` are A2 grammar; they are allowed for A1 targets by the list, so a sentence can still be too hard in grammar. I did not use them.
- **Missing:** `mag` (present of `mogen`, an A1 verb) is not resolved by the inflection rules: `unknown_token mag`. Suggest adding `"mag": "mogen"` to `irregular-forms.json` (`mocht` is there). `zal`, `zou` are unknown too (probably wanted for A2).
- **Missing common words** that would make A1 sentences more natural, all `UNKNOWN`: `vandaag`, `morgen`, `altijd`, `vaak`, `samen`, `veel`, `meer`, `elke`, `alle`, `thuis`, `buiten`, `weinig`. Owner decides; I worked around them.
- **Bug (not in my files, not fixed):** `scripts/sentence-stage.ts` line 55 calls `ajv.validate(schemaObject, rows)` once per translation file. The schema has a `$id`, so the second language fails with `schema with key or id "sentence-translations" already exists` and `validate --stage sentences` crashes as soon as `tr.json` and `en.json` both exist. Fix: compile the schema once outside the loop. I ran the validation locally with that one-line change and reverted it; the committed script is untouched. The developer must fix this before this PR's stage check can pass anywhere, CI included.
- **CI:** the stage check needs the OpenTaal wordlist (`.cache/b1/wordlist.txt`), absent in CI, so a non-empty stage exits 2 there. The PM adds the fetch step. I downloaded only the wordlist (not the whole `b1-pool --fetch`) into the ignored `.cache`.

## Rows for a human

None left after rewriting. Open questions for the owner: `noun-meisje` (diminutive as an A1 target), `verb-werken` (distractors can fit), and the missing-words list above.

## Per-row pre-check

Every row below passed the token check and the checks of ADR-026 rule 5: Dutch grammar, naturalness, tone, de/het (against the annotation), one idea, neutral topic, three same-part-of-speech distractors. Notes only where something was changed or is open.

| word_id | tokens | chars | pre-check | note |
|---|---|---|---|---|
| noun-moeder | 6 | 31 | ok |  |
| noun-vriend | 7 | 36 | ok |  |
| noun-kind | 7 | 33 | ok |  |
| noun-man | 6 | 29 | ok |  |
| noun-zus | 9 | 39 | ok |  |
| noun-buur | 6 | 32 | ok |  |
| noun-meisje | 6 | 33 | ok | diminutive (het by rule); owner may drop from A1 list as a diminutive |
| noun-verjaardag | 6 | 31 | ok |  |
| noun-naam | 4 | 17 | ok |  |
| noun-telefoon | 6 | 31 | ok |  |
| noun-taal | 4 | 21 | ok | plural form `talen`, distractors plural too |
| noun-woord | 5 | 26 | ok |  |
| noun-adres | 4 | 18 | ok |  |
| noun-huis | 6 | 30 | ok |  |
| noun-keuken | 6 | 32 | ok |  |
| noun-deur | 7 | 28 | ok |  |
| noun-tuin | 5 | 20 | ok |  |
| noun-bed | 6 | 27 | ok |  |
| noun-tafel | 7 | 31 | ok |  |
| noun-raam | 7 | 29 | ok |  |
| noun-sleutel | 7 | 38 | ok |  |
| noun-stoel | 7 | 32 | ok |  |
| noun-kamer | 6 | 31 | ok |  |
| noun-brood | 5 | 22 | ok |  |
| noun-koffie | 8 | 43 | ok |  |
| noun-kaas | 6 | 27 | ok |  |
| noun-appel | 5 | 22 | ok |  |
| noun-water | 5 | 22 | ok |  |
| noun-fles | 8 | 36 | ok |  |
| noun-week | 5 | 26 | ok |  |
| noun-maandag | 5 | 24 | ok |  |
| noun-zomer | 8 | 30 | ok |  |
| noun-avond | 4 | 16 | ok |  |
| noun-uur | 5 | 21 | ok | het uur confirmed |
| noun-jaar | 6 | 27 | ok |  |
| noun-school | 5 | 27 | ok |  |
| noun-les | 6 | 26 | ok |  |
| noun-werk | 8 | 34 | ok |  |
| noun-computer | 6 | 28 | ok |  |
| noun-auto | 6 | 33 | ok |  |
| noun-trein | 7 | 30 | ok |  |
| noun-fiets | 6 | 33 | ok |  |
| noun-station | 7 | 33 | ok |  |
| noun-straat | 6 | 30 | ok |  |
| noun-hond | 6 | 27 | ok |  |
| noun-zon | 9 | 35 | ok |  |
| noun-boom | 8 | 35 | ok |  |
| noun-dier | 5 | 21 | ok |  |
| noun-weer | 9 | 38 | ok |  |
| noun-hand | 6 | 25 | ok | pre-check rewrite: "ring aan mijn hand" -> "pijn in mijn hand" (a ring sits on a finger) |
| noun-hoofd | 4 | 21 | ok | health topic: a symptom, no advice (rule 5 ok) |
| noun-oog | 5 | 31 | ok | plural form `ogen`, distractors plural too |
| noun-neus | 5 | 22 | ok |  |
| noun-arts | 9 | 37 | ok | health topic, neutral; "dokter" is more usual but is not an A1 word |
| noun-ziekenhuis | 9 | 45 | ok | health topic, neutral (rule 5 ok) |
| noun-film | 7 | 33 | ok |  |
| noun-muziek | 6 | 36 | ok |  |
| noun-vakantie | 7 | 33 | ok |  |
| noun-winkel | 6 | 30 | ok |  |
| noun-geld | 8 | 38 | ok |  |
| noun-prijs | 7 | 33 | ok |  |
| noun-broek | 5 | 26 | ok |  |
| noun-schoen | 4 | 25 | ok | plural form `schoenen`, distractors plural too |
| noun-bril | 7 | 34 | ok | pre-check rewrite: "zonder bril" -> "zonder mijn bril" (natural) |
| verb-wonen | 6 | 28 | ok |  |
| verb-eten | 5 | 20 | ok |  |
| verb-drinken | 6 | 32 | ok |  |
| verb-werken | 6 | 32 | ok, unsure distractor | distractor rewrite (`slaap` failed `distractor_pos`). Open: "Ik loop/speel van maandag tot vrijdag" also parses (unsure) |
| verb-lezen | 7 | 32 | ok |  |
| verb-leren | 5 | 24 | ok | distractor rewrite (`bak` failed `distractor_pos`) |
| verb-rijden | 9 | 44 | ok |  |
| verb-slapen | 6 | 25 | ok |  |
| verb-kopen | 6 | 30 | ok |  |
| verb-spelen | 6 | 30 | ok |  |
| verb-zwemmen | 6 | 27 | ok |  |
| verb-kijken | 5 | 27 | ok |  |
| verb-wachten | 8 | 35 | ok | distractor rewrite (`bak` failed `distractor_pos`) |
| verb-bellen | 5 | 26 | ok |  |
| verb-koken | 6 | 28 | ok | pre-check rewrite: "Ik kan niet goed koken" had distractors that fit (zwemmen, rijden); context now "vis en groente" |
| verb-helpen | 7 | 32 | ok | "Kun je" is the correct inverted form (resolved by the inflection rules) |
| verb-zoeken | 5 | 29 | ok |  |
| verb-betalen | 4 | 20 | ok | REWRITTEN x2: token check `unknown_token mag` ("Mag ik hier met geld betalen?"), then "Kan ik ... met geld" was unnatural; now "Waar kan ik betalen?" |
| verb-luisteren | 5 | 29 | ok |  |
| verb-praten | 8 | 36 | ok |  |
| adj-groot | 7 | 31 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
| adj-klein | 5 | 28 | ok |  |
| adj-nieuw | 5 | 27 | ok | inflected form `nieuwe` (een + het-word is "een nieuw", de-word "een nieuwe"; telefoon is de, ok) |
| adj-oud | 6 | 29 | ok |  |
| adj-lekker | 4 | 20 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
| adj-koud | 4 | 18 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
| adj-warm | 5 | 21 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
| adj-duur | 5 | 21 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
| adj-goedkoop | 5 | 27 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
| adj-moe | 7 | 27 | ok |  |
| adj-ziek | 8 | 33 | ok | health topic, neutral |
| adj-gelukkig | 7 | 35 | ok |  |
| adj-snel | 5 | 27 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
| adj-mooi | 5 | 22 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
| adj-moeilijk | 4 | 23 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
| adj-schoon | 4 | 19 | ok | distractors moe/ziek/bang reused (pattern, see summary) |
