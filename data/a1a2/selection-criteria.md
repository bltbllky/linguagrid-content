# A1/A2 extras selection criteria (LinguaGrid)

Written: 2026-10-23. Applies to data/a1a2/. Amendments are dated entries at the end; a change after the shortlist
exists needs the owner's approval. Decision: ADR-017 (owner decision 2026-10-23).

Facts come from open sources only, as in data/b1/selection-criteria.md: Leipzig Corpora Collection word counts (CC BY),
Wiktionary through kaikki.org (lemma, part of speech, tags; CC BY-SA; read at build time, nothing copied), OpenTaal
wordlist. The level, A1 or A2, is our own judgement: no external list grades these words.

E1 Lemma. As B1 C1. A verb is an infinitive: it ends in -en or -n.
E2 Frequency band. Lemma rank 1-3,000 on the scale of B1 C2. Reason: on that scale our live A1 words have median rank
   831 and our A2 words 2,522 (2026-10-22), and B1 starts at 3,000. Rank is a filter, not a level.
E3 Part of speech. Noun, verb or adjective, from Wiktionary. One part of speech per lemma across all levels: a lemma
   that is already an A1, A2, B1 or B2 word (live or staged), or in data/excluded.json, is not eligible.
E4 Playable. 3 to 12 letters, letters only (diacritics allowed, NFC). One word. No reflexive-only verb, no plural-only
   noun. Accepted by OpenTaal. Not a demonym and not an adjective made from a place name.
E5 Register. As B1 C5.
E6 Everyday beginner use. A word a beginner meets in the first year of living in the Netherlands: people and family,
   home, food, time and calendar, body and health, clothes, shopping, transport, school and work, weather, feelings,
   basic actions and qualities. Not news, politics, administration or abstract words (B1 and above).
E7 Level. A1: a word needed in the first weeks: closed sets (weekdays, months, colours, family members, body parts)
   and the most basic actions and qualities; usually lemma rank below 2,000. A2: every other word that passes E6.
   When in doubt, A2.
E8 Categories. Each word gets one existing category of its own level from data/categories.json (a1-* for A1, a2-* for
   A2). No new category. No category ends above 100 words.
E9 Size and mix. 210 A1 and 420 A2 words (targets 200 and 400, plus 5% for removals in the review). Part-of-speech mix
   within 8 points of the live level: A1 214 nouns, 106 verbs, 80 adjectives of 400; A2 399 nouns, 121 verbs,
   80 adjectives of 600 (data/words.json, 2026-10-23).
E10 One of a pair. As B1 C9, and also against the live words: a new word does not share a Turkish or English prompt
   with a live word unless a hint keeps them apart.
Closed sets. Before balancing, the curator lists the members of the closed sets of E7 that are neither live nor
excluded, and takes each one that passes E1-E6.
Each selected word is logged with a reason of at most 8 words that cites only facts: rank band, part of speech,
category, "closed set".

Amendments
2026-10-23. E3, clarification (no word changes): "in data/excluded.json" applies per id, that is per lemma and part of
   speech, as the pool tool does (scripts/b1-pool.ts, buildPool). A lemma that is a live or staged word stays ineligible
   under every part of speech. No word of the T-146 shortlist (content PR #41) depends on this reading. Owner approved
   2026-10-23.
2026-10-23. E2, E7, E9, after the shortlist. At lemma rank 1-3,000 only 55 A1 and 361 A2 words pass E1-E10 (content
   PR #41, 416 words), not 210 and 420. Changes:
   E2 The band depends on the level: A1 lemma rank 1-3,000 (unchanged), A2 lemma rank 1-5,000. Reason: our live A2
      words have median rank 2,565 and 75th percentile 4,962 on this scale (data/b1/selection-criteria.md C2), so
      1-5,000 holds the bulk of live A2. Staged B1 words stay out under E3.
   E7 The A1 closed sets add the cardinal numbers: nul to twintig, the tens dertig to negentig, honderd, duizend,
      miljoen and miljard (32 words). Each is a noun row and still passes E1-E6 (3 to 12 letters, A1 band, not live,
      not excluded). Compound numbers (eenentwintig) and ordinals (eerste) are not in the set. E8 applies: an existing
      A1 category, no new one.
   E9 A1 has no count target: every A1 word that passes E1-E8 and E10 is taken, with no 5% margin, and the
      part-of-speech window for A1 is measured on the level after the extras (live plus extras), because the closed
      sets are nouns. A2 stays at 420 (target 400 plus 5%), with the window measured on the extras as before.
   Expected outcome after the review: A1 about 470 words (400 live, the 55 of PR #41 and the numbers that pass), below
   the 600 of ADR-017 rule 1; A2 about 1,000 (600 live and about 400 extras). The owner accepted that A1 stays below
   600. Made after the shortlist exists (content PR #41, 416 words); the owner approved it on 2026-10-23
   (app repository, ADR-018, Accepted 2026-10-23, which supersedes ADR-017 rules 1 and 4 in part for the A1/A2 extras).
2026-10-25. Moved words, after the shortlist. 29 B1 words that the owner judged too easy for B1 (B1 import, content PR #57,
   owner decision A24 of 2026-10-25; ids in data/excluded.json with the reason "moved to A1/A2 extras (T-085 A24)") are
   staged here as A2 words (T-190). They were chosen under the B1 criteria (rank band 3,000-10,000), so they are exempt
   from E2 (rank), from the excluded-id rule of E3 and from E9, whose mix is measured without them; E1, E4-E6 and E10
   were checked again. Their ids stay in data/excluded.json so that no pool picks them again. data/a1a2/words.json is
   no longer regenerated by "b1-pool --write --level a1a2": those 29 rows are not in the A1/A2 pool. Level A2 is the
   content editor's answer in review/b1.findings.csv; the owner may change a row in the merge report.
