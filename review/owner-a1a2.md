# Owner review — A1/A2 extras, 2026-10-25

Her satırın son sütununa kararını yaz:
- **A ve B bölümleri:** "OK" (mevcut kalsın), "Ö" (öneriyi al) ya da kendi metnin. Seviye önerilerinde "Ö" kelimeyi o seviyeye taşır ya da (öneri "leave out" ise) ekler dışında bırakır.
- **A10 ve B8 (stiekem) tek bir karardır:** Türkçe ve İngilizce birlikte karar ver; İngilizce, senin Türkçe anlamını izler.
- **Hedef kelimenle aynı yazılan ipuçları:** A9 (tak "dal") ve A4 (batterij "pil") gibi satırlarda ipucu, ekstralardaki başka bir Felemenkçe kelimeyle (dal, pil) aynı yazılıyor; B4 (merk "brand") aynı kalıp. Bu satırlarda "OK" dersen ipucu olduğu gibi kalır, ama aynı gridde iki kelime karışabilir.
- **Soru:** "stap" (isim, "adım") "Günlük fiiller" kategorisinde duruyor (fiil kategorisinde isim). Kalsın mı (OK), başka kategoriye mi (hangisi), yoksa çıkarılsın mı? Cevabını aşağıdaki **Q1** satırına yaz.
- **C ve D bölümleri:** doğruysa "✓", yanlışsa doğrusunu yaz (C'de artikel de kontrol edilir).
- Boş bırakılan satır karar verilmemiş sayılır.

Aynı satırlar `review/owner-a1a2.csv` dosyasında da var; kararlar oradan içe aktarılacak (T-152).

Source: T-149 (content PR #54: `review/a1a2.findings.csv`, `review/roundtrip-a1a2/result.csv`) and T-150 (content PR #55:
`review/en/a1a2.findings.csv`, `review/roundtrip-a1a2-en/result.csv`). Nothing in `data/` was changed. Only flagged rows are
decided here; there is no full read of the 504 extras.

**Machine translated by DeepL, advisory only:** the readings in the "Why" column were run on 2026-10-25 (ADR-015; Dutch lemma and article only sent). They change no suggestion and no verdict. Raw output: DeepL second opinion, stage a1a2, TR and EN.

## Q1 — Category of "stap"
noun-stap (de stap, "adım" / "step", A2) is in the category a2-daily-verbs ("Günlük fiiller"). It is the only noun there. Decision: ______ (OK / other category / remove)

## Part A — Turkish: words to decide (14 rows)
All 14 Turkish `owner` rows of `review/roundtrip-a1a2/result.csv`; each is also a finding in `review/a1a2.findings.csv` (the two sets are the same ids). "(keep)" means keep the current text. Columns: level is the current level.

| # | Dutch | Level | English | Current TR | Suggested | Why | Decision |
|---|---|---|---|---|---|---|---|
| A1 | getrouwd | A1 | married (everyday word) | evlenmiş | evli | "evlenmiş" is the participle (has got married); the everyday adjective is "evli". B1 gehuwd already has "evli", so gehuwd would need a hint such as "evli (resmî)". Round trip close/close. Machine translated by DeepL, advisory only: TR "evli". |Ö|
| A2 | het bot | A1 | bone | kemik | level: A2 | Bone is an A2 health word; A1 body vocabulary is the visible body parts. Machine translated by DeepL, advisory only: TR "kemik". |Ö|
| A3 | de long | A1 | lung | akciğer | level: A2 | Internal organs are beyond the A1 body words (hoofd, arm, been, buik); long is an A2 health word. Machine translated by DeepL, advisory only: TR "akciğer". |Ö|
| A4 | de batterij | A2 | battery | pil | pil (batarya) | The prompt "pil" is spelled like the Dutch extras word pil (A2, "hap"); a learner who reads "pil" may trace pil instead of batterij. Machine translated by DeepL, advisory only: TR "pil". |Ö|
| A5 | de overlast | A2 | nuisance | rahatsızlık (gürültü) | level: B1: leave out of the extras | Formal word from housing and council letters (geluidsoverlast, overlast melden); B1. Machine translated by DeepL, advisory only: TR "rahatsızlık". |Ö|
| A6 | de drempel | A2 | threshold | eşik | level: B1: leave out of the extras | The door-step sense is rare in A2 texts; the frequent sense is figurative (een drempel verlagen), B1. Machine translated by DeepL, advisory only: TR "eşik". |Ö|
| A7 | de mondkap | A2 | face mask | maske (ağız) | article: de (keep) | Round trip: the blind Dutch pass guessed het. Wiktionary gives mondkap as feminine, so de (https://en.wiktionary.org/wiki/mondkap). Owner confirms. Machine translated by DeepL, advisory only: TR "ağız maskesi". |OK|
| A8 | het symptoom | A2 | symptom | belirti | level: B1: leave out of the extras | Medical register; at A2 patients say klachten. B1. Machine translated by DeepL, advisory only: TR "belirti". |OK|
| A9 | de tak | A2 | branch | dal | dal (ağaç) | The prompt "dal" is spelled like the Dutch extras word dal (A2, "vadi"), in the same category a2-nature-weather, so both can share a grid. Machine translated by DeepL, advisory only: TR "dal". |OK|
| A10 | stiekem | A2 | sneaky | sinsi | gizlice | At A2 stiekem mostly means secretly (iets stiekem doen); "sinsi" is a negative trait (sly). "gizlice" is not used by another word (B1 verborgen has "gizli"). Machine translated by DeepL, advisory only: TR "gizlice". Decide with B-row of the same word (TR and EN together). |Ö|
| A11 | afzetten | A2 | to drop off (someone) | (arabayla) bırakmak | (arabayla) bırakmak (keep) | Round trip mismatch: the blind Dutch pass read the switch-off sense (kapatmak), which is also A2 but is the prompt of A2 uitdoen "kapatmak (cihaz)". The drop-off sense keeps them apart. Machine translated by DeepL, advisory only: TR "bırakmak". |OK|
| A12 | sluipen | A2 | to sneak | sinsice yürümek | level: B1: leave out of the extras | A narrative verb (to creep); A2 learners say stiekem lopen. B1. Machine translated by DeepL, advisory only: TR "sinsice yaklaşmak". |Ö|
| A13 | zeventien | A2 | seventeen | on yedi | level: A1 | Split from the other teens (dertien to achttien are A1) only by the rank rule E7; a learner meets 11-19 as one A1 set. Machine translated by DeepL, advisory only: TR "on yedi". |Ö|
| A14 | negentien | A2 | nineteen | on dokuz | level: A1 | As zeventien: the only other teen at A2. Machine translated by DeepL, advisory only: TR "on dokuz". |Ö|

## Part B — English: words to decide (9 rows)
All 9 English `owner` rows of `review/roundtrip-a1a2-en/result.csv`; each is also a finding in `review/en/a1a2.findings.csv`.

| # | Dutch | Level | Current EN | Turkish | Suggested EN | Why | Decision |
|---|---|---|---|---|---|---|---|
| B1 | testen | A2 | to test (try out) | test etmek | to test (for an illness) | The category is Health and body, where testen is a medical test ("laten testen op corona"); the hint "(try out)" points to the product sense. The hint is needed (B1 toetsen is "to test"). Machine translated by DeepL, advisory only: EN "testing". |OK|
| B2 | het rapport | A2 | report | karne | school report | The A2 sense in Work and education is the school report; the Turkish has "karne". A bare "report" reads as a written report (verslag). Round trip close/match. Machine translated by DeepL, advisory only: EN "the report". |Ö|
| B3 | de vrachtwagen | A2 | lorry (goods vehicle) | yük kamyonu | lorry (everyday word) | B1 truck is already "lorry", and "goods vehicle" describes both words, so the hint does not separate them. vrachtwagen is the everyday word; the register hint follows getrouwd "married (everyday word)" vs B1 gehuwd. Machine translated by DeepL, advisory only: EN "the lorry". |OK|
| B4 | het merk | A2 | brand | marka | brand name | The prompt "brand" is spelled like the Dutch extras word brand (A2, "fire (blaze)"); a learner who reads "brand" may trace brand instead of merk. Same pattern as T-149 batterij/pil. Machine translated by DeepL, advisory only: EN "the brand". |OK|
| B5 | het pond | A2 | pound | yarım kilo | pound (half a kilo) | In Shopping and money a bare "pound" reads as the currency, or as 454 g. Dutch pond is 500 g at the market; the Turkish already says "yarım kilo". Round trip close/match. Machine translated by DeepL, advisory only: EN "the pound". |OK|
| B6 | het tijdschrift | A2 | magazine (periodical) | dergi (yayın) | magazine (everyday word) | B1 magazine is "magazine" and is spelled like this prompt; "periodical" is a rarer English word and fits both Dutch words. tijdschrift is the everyday word. Machine translated by DeepL, advisory only: EN "the magazine". |OK|
| B7 | verrassen | A2 | to surprise (unexpectedly) | sürpriz yapmak | to surprise (with a gift) | "unexpectedly" repeats the verb's meaning and does not separate it from A1 verbazen "to surprise". The A2 use is "iemand verrassen met een cadeau"; the Turkish "sürpriz yapmak" has the same sense. Machine translated by DeepL, advisory only: EN "surprise". |OK|
| B8 | stiekem | A2 | sneaky | sinsi | secretly | At A2 stiekem mostly means secretly ("iets stiekem doen"); "sneaky" is the character trait. It follows the Turkish "sinsi", which T-149 filed with the suggestion "gizlice". Decide both rows together; the English follows the owner's Turkish sense. Machine translated by DeepL, advisory only: EN "on the sly". Decide with A-row of the same word (TR and EN together). |Ö|
| B9 | afzetten | A2 | to drop off (someone) | (arabayla) bırakmak | to drop off (someone) (keep) | Round trip mismatch: the blind Dutch pass read the switch-off sense, which is also A2 but is the prompt of A1 uitdoen "to switch off". The drop-off sense keeps them apart and matches the Turkish (T-149 kept it the same way). Machine translated by DeepL, advisory only: EN "to switch off". |OK|

## Parts C and D — spot check (ADR-012 rule 7)
Pool: the 483 extras with verdict `OK` in both round trips and not in Part A or B, in the order of
`data/a1a2/words.json`. Seed **20261025** (the draw date). Shuffle with mulberry32 and Fisher–Yates; Part C is the first 50,
Part D the next 50 (no overlap):

```js
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=mulberry32(20261025); const s=pool.slice();
for(let i=s.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[s[i],s[j]]=[s[j],s[i]]}
// Part C = s.slice(0,50), Part D = s.slice(50,100)
```

**More than one error in a part stops that language's A1/A2 round-trip acceptances** (ADR-012 rule 7): its `roundtrip`
acceptances stay `reviewed: false`, and the owner chooses between a full human review of the extras in that language and the alternative in the plan.

### Part C — 50 random Turkish words
Check the Turkish and the article.

| # | Dutch | Turkish | Decision |
|---|---|---|---|
| C1 | geboren | doğmuş |✓|
| C2 | de cirkel | çember |✓|
| C3 | de buitenkant | dış taraf |✓|
| C4 | het instrument | enstrüman |✓|
| C5 | bouwen | inşa etmek |✓|
| C6 | de piloot | pilot |✓|
| C7 | de tekening | çizim |✓|
| C8 | het stadion | stadyum |✓|
| C9 | helder | berrak |✓|
| C10 | de oceaan | okyanus |✓|
| C11 | zestig | altmış |✓|
| C12 | wakker | uyanık |✓|
| C13 | zwak | güçsüz |✓|
| C14 | afgeven | elden vermek |✓|
| C15 | herkennen | görünce tanımak |✓|
| C16 | het ijzer | demir |✓|
| C17 | houten | ahşap |✓|
| C18 | wekelijks | haftalık |✓|
| C19 | de tip | ipucu |✓|
| C20 | de finale | final |✓|
| C21 | het kruispunt | dörtyol |kavşak|
| C22 | tachtig | seksen |✓|
| C23 | de belofte | söz (vaat) |✓|
| C24 | het vuurwerk | havai fişek |✓|
| C25 | draaien | dönmek, döndürmek |✓|
| C26 | de kunstenaar | sanatçı |✓|
| C27 | de dinsdag | salı |✓|
| C28 | schilderen | resim yapmak |✓|
| C29 | het hout | tahta (malzeme) |✓|
| C30 | de wens | dilek |✓|
| C31 | dertig | otuz |✓|
| C32 | de juni | haziran |✓|
| C33 | samenwerken | işbirliği yapmak |✓|
| C34 | vals | sahte |✓|
| C35 | het blad | yaprak |✓|
| C36 | voetballen | futbol oynamak |✓|
| C37 | stelen | çalmak (hırsızlık) | ✓
| C38 | schrikken | irkilmek |✓|
| C39 | verlengen | uzatmak |✓|
| C40 | branden | yanmak |✓|
| C41 | de grap | şaka |✓|
| C42 | de oktober | ekim |✓|
| C43 | beschermen | korumak (zarardan) |✓|
| C44 | de trainer | antrenör |✓|
| C45 | vieren | kutlamak |✓|
| C46 | scherp | keskin |✓|
| C47 | de toren | kule |✓|
| C48 | de muzikant | müzisyen |✓|
| C49 | duiken | dalmak |✓|
| C50 | de rem | fren |✓|

### Part D — 50 random English words
Check the English.

| # | Dutch | English | Decision |
|---|---|---|---|
| D1 | zeventig | seventy |✓|
| D2 | de pijl | arrow |✓|
| D3 | nul | zero |✓|
| D4 | scoren | to score |✓|
| D5 | het echtpaar | married couple |✓|
| D6 | miljoen | million |✓|
| D7 | de groep | group |✓|
| D8 | de laan | avenue |✓|
| D9 | het goud | gold |✓|
| D10 | de aarde | earth |✓|
| D11 | de pot | jar |✓|
| D12 | de boerderij | farm |✓|
| D13 | het virus | virus |✓|
| D14 | de luxe | luxury |✓|
| D15 | de vrijdag | Friday |✓|
| D16 | de echtgenote | wife | ✓
| D17 | miljard | billion |✓|
| D18 | de augustus | August |✓|
| D19 | ontsnappen | to escape |relaxed|
| D20 | de motor | engine |✓|
| D21 | de lengte | height (of a person) |✓|
| D22 | toevallig | by chance |✓|
| D23 | de snelheid | speed |✓|
| D24 | de tiener | teenager |✓|
| D25 | de seconde | second (of time) |✓|
| D26 | de temperatuur | temperature |✓|
| D27 | rijk | rich |✓|
| D28 | veertig | forty |✓|
| D29 | het gevoel | feeling |✓|
| D30 | de mening | opinion |✓|
| D31 | de bal | ball |✓|
| D32 | de letter | letter (of the alphabet) |✓|
| D33 | de som | sum |✓|
| D34 | de echtgenoot | husband |✓|
| D35 | de das | tie |✓|
| D36 | het document | document |✓|
| D37 | springen | to jump |✓|
| D38 | de gitaar | guitar |✓|
| D39 | uitstellen | to postpone |✓|
| D40 | de code | code |✓|
| D41 | de gram | gram |✓|
| D42 | de straatnaam | street name |✓|
| D43 | accepteren | to accept |✓|
| D44 | het programma | programme |✓|
| D45 | organiseren | to organise |✓|
| D46 | de sfeer | atmosphere |✓|
| D47 | het kunstwerk | work of art |✓|
| D48 | de operatie | operation (surgery) |✓|
| D49 | gelijk | equal |✓|
| D50 | de clown | clown |✓|

## Spot-check result (T-152, 2026-10-25)
- Part C (50 Turkish words, text and article): 49 marked ✓, **1 error** (C21 het kruispunt: "dörtyol" → "kavşak", imported as the owner's text).
- Part D (50 English words): 49 marked ✓, **1 error** (D19 ontsnappen: "to escape" → "relaxed", imported as the owner's text).
- ADR-012 rule 7 (more than one error stops a language) is therefore not triggered for either language: the round-trip acceptances were imported (`review/roundtrip-a1a2/result.csv`, `review/roundtrip-a1a2-en/result.csv`).
- Open: Q1 (category of "stap") was left blank in the filled sheet; noun-stap is unchanged until the owner answers.

2026-10-25: owner corrected D19 — 'relaxed' was a slip; 'to escape' kept. Part D: 0 errors.
