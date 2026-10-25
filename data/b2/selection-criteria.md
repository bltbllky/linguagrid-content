# B2 selection criteria (LinguaGrid)

Written: 2026-10-25. Applies to data/b2/. Amendments are dated entries at the end; a change after the shortlist
exists needs the owner's approval. Decision: ADR-017 (owner decision 2026-10-23).

Facts come from open sources only, as in data/b1/selection-criteria.md: Leipzig Corpora Collection word counts (CC BY),
Wiktionary through kaikki.org (lemma, part of speech, tags; CC BY-SA; read at build time, nothing copied), OpenTaal
wordlist. B2 is our own level: no external list grades it, frequency barely separates B1 from B2, and no outside
list is used at any step.

D1 Lemma. As B1 C1. A verb is an infinitive: it ends in -en or -n.
D2 Frequency band. Lemma rank 10,000-20,000 on the scale of B1 C2. A row of the B1 band (3,000-10,000) that is not a
   B1 word may enter when its reason names an abstract or formal-register use. Reason: B1 stops at 10,000, and the
   band holds about 8,300 pool rows (2026-10-22). Rank is a filter, not a level.
D3 Part of speech. Noun, verb or adjective, from Wiktionary. One part of speech per lemma across all levels: a lemma
   that is already an A1, A2 or B1 word (live or staged) is not eligible; data/excluded.json applies per id (lemma and
   part of speech), as for B1 C3 and A1/A2 E3 (owner 2026-10-23), except an id whose reason there starts with
   "level B2": the owner judged it too hard for B1 when removing it, so it stays eligible here (PM decision 2026-10-25).
D4 Playable. As B1 C4. Not a demonym and not an adjective made from a place or person name. At most 40% of the set
   has 10 to 12 letters.
D5 Register. As B1 C5.
D6 Everyday adult use, applied strictly. A word an adult meets in a Dutch newspaper, at work, with the authorities or
   in a B2 course. Not the jargon of one profession, species, chemical or medical names a layperson does not use, or
   historical terms.
D7 Themes. Each selected word gets one category: b2-work-organisation, b2-money-economy, b2-law-administration,
   b2-politics-society, b2-science-health, b2-environment-energy, b2-technology-media, b2-education-research,
   b2-culture-arts, b2-housing-city, b2-travel-mobility, b2-relationships-behaviour, b2-feelings-attitudes,
   b2-thinking-arguing, b2-describing (adjectives with no clear theme), b2-abstract-verbs (verbs with no clear
   theme). Each category holds 30 to 150 words; no theme is dropped to fit a size.
D8 Size and mix. 1,575 words (at least 1,500, plus 5% for removals in the review). At most 66% nouns, at least 18%
   verbs, at least 14% adjectives.
D9 One of a pair. As B1 C9, and also against the A1, A2 and B1 words.
Each selected word is logged with a reason of at most 8 words that cites only facts: rank band, part of speech,
theme, "B1 band, formal".

Origin of the taxonomy (D7): it continues the B1 themes of data/b1/selection-criteria.md towards law, science and
abstract areas; the names are ours, not taken from any course or book.

Amendments
(none)
