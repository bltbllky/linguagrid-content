# B1 selection criteria (LinguaGrid)

Written: 2026-10-22. Applies to data/b1/. Amendments are dated entries at the end; a change after the shortlist exists
needs the owner's approval.

Facts come from open sources only: Leipzig Corpora Collection word counts (nld_news_2020_1M, nld_wikipedia_2021_1M; CC BY),
Wiktionary through kaikki.org (lemma, part of speech, tags; CC BY-SA; read at build time, nothing copied), OpenTaal
wordlist (accepted spelling). B1 is our own level: no external list grades it.

C1 Lemma. One dictionary form per word: nouns singular, verbs infinitive, adjectives base form. Not an inflected form,
   not an abbreviation, not a proper noun.
C2 Frequency band. Lemma rank 3,000-10,000 on the summed counts of both Leipzig files, form counts mapped to lemmas
   through Wiktionary form-of links. Reason: on that scale our A2 words have median 2,565, 75th percentile 4,962,
   90th percentile 9,706 (2026-10-21), so B1 starts above the A2 centre and stops at the A2 90th percentile.
   Rank is a filter, not a level.
C3 Part of speech. Noun, verb or adjective, from Wiktionary. One part of speech per lemma across A1, A2 and B1: a lemma
   that is already an A1 or A2 word, or in data/excluded.json, is not eligible.
C4 Playable. 4 to 12 letters, letters only (diacritics allowed, NFC). One word: no space, hyphen or apostrophe. No verb
   that exists only with "zich" (reflexive-only). No plural-only noun. Accepted by OpenTaal.
C5 Register. No lemma whose senses are all tagged vulgar, offensive, derogatory, dialectal, regional, Belgian, Surinamese,
   archaic, obsolete or dated.
C6 Everyday adult use. A word an adult learner of Dutch meets at work, in services, at home, in the news or in a course in
   the Netherlands. Not narrow jargon, species or chemical names, titles of nobility, or words that appear mainly in
   historical or fantasy writing.
C7 Themes. Each selected word gets one category from our taxonomy: b1-work-career, b1-money-banking, b1-housing-contracts,
   b1-health-care, b1-government-law, b1-education-courses, b1-media-news, b1-society-politics, b1-economy-business,
   b1-environment-nature, b1-traffic-travel, b1-technology-internet, b1-consumer-shopping, b1-food-cooking,
   b1-relationships-family, b1-feelings-character, b1-opinion-communication, b1-time-planning, b1-culture-sport,
   b1-describing (adjectives with no clear theme), b1-everyday-verbs (verbs with no clear theme). Each category holds
   30 to 150 words; no theme is dropped to fit a size.
C8 Mix. 1,000 words: about 55-65% nouns, 20-25% verbs, 15-20% adjectives (the proportions of the pool).
   Amended 2026-10-23: 1,200 words (see Amendments).
C9 One of a pair. When two near-synonyms both qualify, take the more frequent one, so that two Dutch words do not share one
   Turkish or English prompt.
Each selected word is logged with a reason of at most 8 words that cites only facts: rank band, part of speech, theme.

Origin of the taxonomy (C7): it extends the app's own A1/A2 categories in data/categories.json (people, home, food, time,
work and study, services, city and transport, health, free time, nature and weather, shopping and money, feelings,
describing, communication, daily verbs) towards adult-life areas; the names are ours, not taken from any course or book.

Amendments
2026-10-23. C8: the set has 1,200 words (was 1,000). The proportions stay: about 55-65% nouns, 20-25% verbs,
   15-20% adjectives. C7: the bounds of 30 to 150 words per category stay; 1,200 words over the 21 categories is about
   57 a category, inside the bounds. No other criterion changes: C1-C6 and C9 select the same words as before.
   Reason: the owner's word targets of 2026-10-23 (A1 600, A2 1,000, B1 1,200; app repository,
   docs/research/2026-10-22-word-counts-and-b2.md, option B; ADR-017, accepted 2026-10-23,
   which supersedes the 1,000 of ADR-016 rule 5 for B1). Made before any shortlist exists
   (data/b1/selection.json does not exist yet). Owner approved 2026-10-23.
2026-10-23. C3, clarification (no word changes): "in data/excluded.json" applies per id, that is per lemma and part of
   speech, as the pool tool has done since T-125 (scripts/b1-pool.ts, buildPool). A lemma that is an A1 or A2 word stays
   ineligible under every part of speech. An excluded row does not block the same lemma under another part of speech:
   4 of the 1,200 selected words depend on this reading (noun-ingreep, noun-opvang, noun-uitstoot, noun-welvaart, whose
   verb rows are excluded as forms tagged as verbs). Made after the shortlist exists (data/b1/selection.json); owner
   approved 2026-10-23.
