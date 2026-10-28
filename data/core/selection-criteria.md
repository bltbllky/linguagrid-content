# A1/A2 core selection criteria (LinguaGrid)

Written: 2026-10-28. Applies to data/core/. Amendments are dated entries at the end; a change after the pool exists
needs the owner's approval. Decision: ADR-022 (owner decision 2026-10-28).

The A1 and A2 words that replace the launch words of content releases 1 and 2. Facts come from open sources only, as
in data/b1/selection-criteria.md: Leipzig Corpora Collection word counts (CC BY), Wiktionary through kaikki.org (lemma,
part of speech, tags; CC BY-SA; read at build time, nothing copied), OpenTaal wordlist. The level is our own judgement.

Blind rule. The curator reads only this file, .cache/b1/pool-core.json, data/categories.json, data/excluded.json and
the criteria files of data/b1 and data/a1a2. The curator does not open data/words.json, data/a2-selection.json,
data/annotations.json, data/translations/, review/, scripts/extract-nt2lex.ts or any NT2Lex file or page, and uses no
outside word list, textbook or course. The pool holds no source, launch or level field. The comparison with the
launch words is made only after the selection is merged.

K1 Lemma. As E1 of data/a1a2/selection-criteria.md.
K2 Frequency band. A1 lemma rank 1-3,000, A2 lemma rank 1-5,000, on the scale of B1 C2. Rank is a filter, not a
   level. The bands were set on 2026-10-22/23 from a few aggregate rank figures of the launch words (medians and
   percentiles); no launch word is read for this selection.
K3 Part of speech. Noun, verb or adjective, from Wiktionary. A lemma that is a B1 word (data/words-own.json), an A1/A2
   extra (data/a1a2/) or a B2 word (data/b2/), or an id in data/excluded.json, is not eligible; the pool leaves them out.
K4 Playable. As E4. K5 Register. As B1 C5. K6 Everyday beginner use. As E6.
K7 Level. As E7: A1 is the closed sets and the most basic actions and qualities, usually rank below 2,000; A2 is every
   other word that passes K6; when in doubt, A2. The cardinal numbers are A1 extras and are not in the pool.
K8 Categories. One existing category of the word's level from data/categories.json (a1-* or a2-*). No new category.
   No category ends above 100 words, counted with the A1/A2 extras.
K9 Size and mix. A1: every word that passes K1-K8 and K10, no target. A2: 630 words (600 plus 5%), counted after K11,
   with a part-of-speech mix within 8 points of the pool's A2-band rows.
K10 One of a pair. As B1 C9, against the core words, the A1/A2 extras and the B1 words.
K11 A1 floor. When the A1 core words plus the 84 A1 extras are fewer than 410, the A2 picks with the lowest lemma rank
   in a2-people, a2-home, a2-food, a2-time, a2-health or a2-clothes move to A1, in rank order, into a1-people, a1-home,
   a1-food, a1-time, a1-body-health or a1-clothes, until A1 holds 410; A2 is then filled to 630 from the next rows.
Each selected word is logged with a reason of at most 8 words that cites only facts: rank band, part of speech,
category, "closed set" or "A1 floor (K11)".

Amended 2026-10-28 (owner, option a): for the core profile the pool band is lemma rank 1-10,000 and A1 words stop at
rank 5,000; B1 lemmas stay excluded by K3. Reason: the first blind run gave A1 300 and A2 480 under the 3,000/5,000
bands (pool counts only; no launch word read).
Amended 2026-10-28 (owner, option a): K9's A2 target of 630 is not reached under K1–K11 with the amended bands; A2 takes
every word that passes (542). Pool counts only; no launch word read.
