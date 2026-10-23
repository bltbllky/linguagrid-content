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
(none)
