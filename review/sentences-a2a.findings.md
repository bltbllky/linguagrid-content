# T-381 A2 sentences, first half: content-editor pre-check (before the blind passes)

Date 2026-11-24. 494 A2 words have a sentence; every row is `reviewed: false`; nothing is set by hand.

**Split rule:** the A2 words ordered by word id (string order), first 494: 135 adjectives (`adj-aanwezig` to `adj-zwak`) and 359 nouns (`noun-aankomst` to `noun-operatie`). The second half (T-382, 494 words) is the rest of the nouns (252, `noun-opleiding` on) and all 242 verbs, so its writing differs: verbs need separable-verb and participle forms.

| Measure | Value |
|---|---|
| Written | 494 rows (135 adj, 359 noun), TR and EN each |
| Token check, first pass | 492 of 494 (99.6%; pilot 99%); rejected: `noun-boer` (`koeien` not resolved), `noun-excuus` (`bied` not resolved); both fixed in one rewrite |
| Distractor check | all pass first time (same part of speech, known words) |
| Length | 4 to 9 tokens, at most 70 characters |
| `validate --stage sentences`, `npm run validate`, `npm test` | clean (420 tests) |

Caveat for the second half: the 99.6% rate is again a best case. I wrote with the A1+A2 lists in front of me and silently dropped about 25 drafts that needed a word outside them (`boek`, `bijna`, `kaartje`, `ontbijt`, `wandelen`, `kennen`, `gebroken`, `gouden`, `vanavond`, `laatste`, `hemel`).

## Patterns for the owner and the round trip

1. **Distractors are the weak point.** Adjective rows mostly use a "wrong domain" set (`vierkant, houten, elektrisch` for a person; `dankbaar, nerveus, jaloers` for an object), and noun rows use time (`week, avond, ochtend`), body (`hand, neus, mond`), object (`bril, fles, schoen`) or `weer, geluk, voetbal` sets. They are wrong by meaning but obviously so, and heavily reused; a learner can learn to exclude them (same limit as A1). A few rows still leave a distractor that fits in the sentence, for example `noun-idee` (`goed bed`, `goed huis`), `noun-gevoel`, `noun-inkomen`, `noun-onderwijs`, `noun-apotheek` (`kapper` is not a pharmacy, fine), `adj-erg`. Owner or the blind pass may flag them.
2. **Turkish prompt collisions, expect "close" or "mismatch" in the round trip:** `noun-boodschap` and `noun-bericht` (both `mesaj`, already a warning in `validate`), `noun-koek` / `noun-koekje` (biscuit, `kurabiye` / `bisküvi`), `adj-eenzaam` / `adj-alleen` (`yalnız`), `noun-aarde` (soil, not the planet), `noun-doel` / `noun-doelpunt`, `noun-nicht` (`kız kuzen`), `adj-dubbel` (`iki kat`), `adj-juist` / `adj-waar` (`doğru`), `noun-kanaal` / `noun-gracht`.
3. **Tense and form kept:** Dutch present stays present in TR and EN; `adj-dom` and `adj-geweldig` use the Dutch past (`hataydı`, `vardı`). No word was added that is not in the Dutch (`noun-bagage`, `noun-bak`, `noun-hotel` etc. were checked for added places or objects).
4. **Plural or form targets:** `noun-aardappel` (`aardappels`), `noun-boon` (`bonen`), `noun-handschoen` (`handschoenen`), `noun-letter` (`letters`), `noun-lip` (`lippen`); adjectives with an ending: `aparte`, `beroemde`, `domme`, `elektrische`, `gemiddelde`, `geweldige`, `levende`, `onbekende`, `vierkante`, `volgende`. Distractors of these rows carry the same ending or number.
5. **Sensitive or personal topics, kept neutral:** `adj-blind`, `noun-operatie`, `noun-koorts`, `noun-bijwerking`, `noun-alcohol`, `noun-lening`, `noun-belasting`, `noun-onderbroek`, `adj-ongelukkig`, `noun-hoofdpijn`. No advice, no real person. Owner may drop any.
6. **Two targets in one sentence are avoided;** where a sibling A2 word appears (`kantoor`, `kassa`, `keuken`) it is a context word.
7. **Diminutives and plural-only nouns:** `noun-broodje`, `noun-koekje`, `noun-kopje` are diminutives (het by rule); no plural-only noun in this half.
8. **Gender hint:** a distractor of the other article does not match the sentence article (for example `deze attractie`), so a learner can exclude it by grammar; the token check does not look at distractor articles.

## Not done here

No blind pass, no DeepL reading, no import, no `reviewed` flag: the PM runs those as separate agents. Blind sheets for the round trip are in `review/sentences-a2a-{tr,en}-blind-{nl,pivot}.csv`. No data fix to words, annotations or translations was made.
