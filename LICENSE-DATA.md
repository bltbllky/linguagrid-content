# Data licences and attribution

## NT2Lex-derived data — `data/words.json`

The selection of words, their parts of speech and CEFR levels are derived from **NT2Lex**:

> Tack, A., François, T., Desmet, P., & Fairon, C. (2018). NT2Lex: A CEFR-Graded Lexical Resource for Dutch as a Foreign
> Language Linked to Open Dutch WordNet. *Proceedings of the 13th Workshop on Innovative Use of NLP for Building Educational
> Applications (BEA)*, 137–146. https://cental.uclouvain.be/nt2lex/

NT2Lex is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Our adaptation in
`data/words.json` is shared under the same licence: attribution required, non-commercial use only, share alike.

## LinguaGrid annotations and translations — `data/annotations.json`, `data/categories.json`, `data/translations/*.json`, `data/b1/words.json`, `data/b1/categories.json`, `data/b1/annotations.json`, `data/b1/translations/*.json`, `data/words-own.json`, `data/a1a2/*`, `data/b2/*`

De/het articles and categories (`data/annotations.json`, `data/categories.json`, ADR-009) and the translations of the prompts and
category titles, one file per learner language (`data/translations/<lang>.json`, for example `data/translations/tr.json` for
Turkish, ADR-011), are our own data: written by the LinguaGrid project and reviewed by a human. They are also published under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

This repository is the unrestricted copy of all licensed content distributed in the LinguaGrid app.

`data/words-own.json` holds the A1 and A2 words we selected ourselves from the open sources below, under the criteria in `data/a1a2/selection-criteria.md`; it contains no NT2Lex data. Files under `data/a1a2/` and `data/b2/` are staged content that is not in any app release yet.

Files under `data/b1/` are staged B1 content that is not in any app release yet. The B1 word selection is ours, made from the open sources below under the criteria in `data/b1/selection-criteria.md`; it contains no NT2Lex data.

## Open sources used for B1, B2 and the A1/A2 extras

- Leipzig Corpora Collection word counts. Leipzig Corpora Collection downloads: "The text corpora offered for download are made available under the Creative Commons licence CC BY." (no version stated on the page). Read on 2026-10-21 at https://wortschatz.uni-leipzig.de/en/usage. Cited as: Goldhahn, D., Eckart, T., & Quasthoff, U. (2012). Building Large Monolingual Dictionaries at the Leipzig Corpora Collection: From 100 to 200 Languages. Proceedings of LREC 2012.
- Wiktionary, via kaikki.org (CC BY-SA 4.0), used only to check lemma, part of speech and articles; no Wiktionary text is copied into this repository.
- OpenTaal wordlist (Revised BSD 3-clause or CC BY 3.0; copyright notice of the OpenTaal authors kept), used to check spelling.
