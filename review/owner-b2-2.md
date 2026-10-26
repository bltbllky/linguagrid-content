# Owner review — B2, batch 2: spot check, 2026-10-26

Bu dosya kısa: 20 Türkçe ve 20 İngilizce rastgele kelime.
- **C bölümü (Türkçe):** metni ve artikeli kontrol et; doğruysa "✓", yanlışsa doğrusunu yaz.
- **D bölümü (İngilizce):** metni kontrol et; doğruysa "✓", yanlışsa doğrusunu yaz.
- **Kural (ADR-019):** 20 kelimede 0 hata geçer. 1 hata varsa o dilin altındaki 30 kelime de eklenir (toplam 50, en fazla 1 hata geçer). 2 ya da daha fazla hata o dili geçirmez. 1 hata bulursan o dilin 30 ek kelimesi (kelime listesi her bölümün altında) PM tarafından sana sıralı bir sayfa olarak verilir.
- Boş bırakılan satır karar verilmemiş sayılır.

Aynı satırlar `review/owner-b2-2.csv` dosyasında da var (T-164).

## Spot check (ADR-019)
Pools: **Turkish 1519** words and **English 1545** words with verdict `OK` in the result sheet (rows of batch 1 are `owner`, so they are not in the pools).
Drawn with `npm run spot-check -- draw` (mulberry32, Fisher–Yates): Turkish `--lang tr --seed 20261026 --result review/roundtrip-b2/result.csv`, English `--lang en --seed 20261027 --result review/roundtrip-b2-en/result.csv` (seed = the draw date, then the next number).
Released rows: Turkish 0, English 1; both are under 10, so all 20 words of each language come from the whole pool (no 5 from released rows).
Tally (`npm run spot-check -- tally`): Turkish 150 words, 2 errors; English 150 words, 2 errors. Both are under the 2% limit, so each language gets 20 words, not 50.

### Part C — 20 random Turkish words
Check the Turkish and the article.

| # | Dutch | Turkish | Decision |
|---|---|---|---|
| C1 | de afkeuring | onaylamama | |
| C2 | energiek | enerjik | |
| C3 | het doctoraat | doktora | |
| C4 | intrekken | geri çekmek (karar) | |
| C5 | machinaal | makineyle yapılan | |
| C6 | het hersenletsel | beyin hasarı | |
| C7 | het kapitaal | sermaye | |
| C8 | bijeenroepen | toplantıya çağırmak | |
| C9 | ronselen | devşirmek | |
| C10 | afwennen | alışkanlığı bırakmak | |
| C11 | lusteloos | isteksiz | |
| C12 | impulsief | dürtüsel | |
| C13 | de consulent | danışman (kurum) | |
| C14 | de natuurramp | doğal afet | |
| C15 | meedogenloos | acımasız | |
| C16 | de intolerantie | hoşgörüsüzlük | |
| C17 | hekelen | yerden yere vurmak | |
| C18 | motorisch | motor (hareket) | |
| C19 | de forens | işe gidip gelen kişi | |
| C20 | de bewindsvrouw | kadın yönetici (hükümet) | |

Extension, only if Part C has exactly 1 error (30 ids, same draw, seed 20261026):
verb-ontcijferen, noun-bezichtiging, adj-ontoereikend, noun-graadmeter, noun-woningbrand, verb-sjoemelen, adj-ongeduldig, verb-uitloven, adj-inheems, adj-schrikbarend, noun-rolmodel, noun-ijkpunt, noun-leenwoord, adj-theatraal, verb-halveren, adj-onpartijdig, noun-gerechtshof, noun-terugval, noun-middenweg, adj-eetbaar, noun-spelfout, verb-standhouden, noun-zelfbeeld, noun-innerlijk, noun-kassucces, noun-ondergrens, noun-statement, adj-ambachtelijk, verb-afwenden, noun-besteding

### Part D — 20 random English words
Check the English.

| # | Dutch | English | Decision |
|---|---|---|---|
| D1 | de zonnecel | solar cell | |
| D2 | volstaan | to suffice | |
| D3 | de voetnoot | footnote | |
| D4 | de lobby | lobby | |
| D5 | het tijdverdrijf | pastime | |
| D6 | spreiden | to spread (out) | |
| D7 | de exporteur | exporter | |
| D8 | de verspilling | waste (wasting) | |
| D9 | stroomlijnen | to streamline | |
| D10 | volgzaam | docile | |
| D11 | het vakgebied | field (of expertise) | |
| D12 | nutteloos | useless | |
| D13 | de franchise | franchise | |
| D14 | de petitie | petition | |
| D15 | esthetisch | aesthetic | |
| D16 | de onteigening | expropriation | |
| D17 | monotoon | monotonous | |
| D18 | de valsheid | forgery (falsity) | |
| D19 | uitpraten | to talk (it) through | |
| D20 | vergeefs | futile | |

Extension, only if Part D has exactly 1 error (30 ids, same draw, seed 20261027):
adj-machinaal, noun-onderklasse, noun-slagzin, adj-bestendig, adj-grandioos, noun-struikelblok, verb-ruïneren, noun-huismerk, noun-armoedegrens, adj-smakeloos, noun-machtiging, noun-winstoogmerk, adj-doelmatig, verb-afkicken, noun-ongeloof, noun-ziektebeeld, noun-gaswinning, noun-ontlasting, adj-riskant, adj-aangetekend, verb-grootbrengen, adj-onvoorzien, noun-beleving, noun-patstelling, verb-dicteren, noun-medeweten, noun-motie, verb-revalideren, adj-hoopgevend, adj-aanstekelijk

## Released without the owner (ADR-019)
Turkish: none. English: adj-organisch. Three readers (the current text, both blind passes and DeepL) share a head word and no other question touches the row. To pull one back, write its id in the merge report.

## Spot-check result (T-164)
- Part C (20 Turkish words, text and article): ____ errors. Extension (30 words) needed: ____
- Part D (20 English words): ____ errors. Extension (30 words) needed: ____
- Rule: 0 errors in 20 pass; 1 error adds the 30 and at most 1 error in 50 passes; 2 or more errors in 20 fail (ADR-012 rule 7: that language gets no round-trip import). The result is appended to `review/spot-check-tally.csv` by T-164.
