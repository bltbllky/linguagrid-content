# Data licences and attribution

## Earlier releases (NT2Lex)

Content releases 1 and 2 contained words, parts of speech and CEFR levels derived from NT2Lex (Tack, François, Desmet & Fairon, 2018;
https://cental.uclouvain.be/nt2lex/), shared under CC BY-NC-SA 4.0. From content release 3 (US-023, ADR-022) no file in this repository
and no release holds NT2Lex data; `data/words.json` is empty.

## LinguaGrid annotations and translations — `data/annotations.json`, `data/categories.json`, `data/translations/*.json`, `data/words-own.json`, `data/b2/*`

De/het articles and categories (`data/annotations.json`, `data/categories.json`, ADR-009) and the translations of the prompts and
category titles, one file per learner language (`data/translations/<lang>.json`, for example `data/translations/tr.json` for
Turkish, ADR-011), are our own data: written by the LinguaGrid project and reviewed by a human. They are also published under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

This repository is the unrestricted copy of all licensed content distributed in the LinguaGrid app.

`data/words-own.json` holds all A1, A2 and B1 words; their selection is ours, made from the open sources below under the criteria in `data/core/`, `data/a1a2/` and `data/b1/selection-criteria.md`; it contains no NT2Lex data.

## Open sources used for B1, B2 and the A1/A2 extras

- Leipzig Corpora Collection word counts. Leipzig Corpora Collection downloads: "The text corpora offered for download are made available under the Creative Commons licence CC BY." (no version stated on the page). Read on 2026-10-21 at https://wortschatz.uni-leipzig.de/en/usage. Cited as: Goldhahn, D., Eckart, T., & Quasthoff, U. (2012). Building Large Monolingual Dictionaries at the Leipzig Corpora Collection: From 100 to 200 Languages. Proceedings of LREC 2012.
- Wiktionary, via kaikki.org (CC BY-SA 4.0), used only to check lemma, part of speech and articles; no Wiktionary text is copied into this repository.
- OpenTaal wordlist (Revised BSD 3-clause or CC BY 3.0; copyright notice of the OpenTaal authors kept), used to check spelling.
