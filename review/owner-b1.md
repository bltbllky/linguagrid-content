# Owner review — B1, 2026-10-23

Her satırın son sütununa kararını yaz:
- **A ve B bölümleri:** "OK" (mevcut kalsın), "Ö" (öneriyi al) ya da kendi metnin.
- **A24 tek bir karardır** (B1 için fazla kolay 29 kelime): "Ö" hepsini A1/A2 ek havuzuna taşır, "OK" hepsini B1'de bırakır; istisna varsa "Ö, hariç: kelime, kelime" yaz.
- **C ve D bölümleri:** doğruysa "✓", yanlışsa doğrusunu yaz (C'de artikel de kontrol edilir).
- Boş bırakılan satır karar verilmemiş sayılır.

Aynı satırlar `review/owner-b1.csv` dosyasında da var; kararlar oradan içe aktarılacak (T-085).

Source: T-082 (content PR #45: `review/b1.findings.csv`, `review/roundtrip-b1/result.csv`) and T-083 (content PR #46:
`review/en/b1.findings.csv`, `review/roundtrip-b1-en/result.csv`). Nothing in `data/` was changed. Only flagged rows are
decided here; there is no full read of the 1,200 words.

**DeepL second opinion (ADR-015):** DeepL readings (Dutch lemma and article only sent) were added to the "Why" of Parts A (TR) and B (EN) on 2026-10-23; advisory only, they change no suggestion.

Words in both parts are cross-referenced ("Same question as …"): prikken, geslaagd, chocolade.

## Part A — Turkish: words to decide (60 rows, 32 decisions)
All 60 Turkish `owner` rows of `review/roundtrip-b1/result.csv`. Each is a content-editor finding in `review/b1.findings.csv`
(text, article, level); the round trip found no mismatch and no article disagreement. "(keep)" means keep the current text.

| # | Dutch | English | Current TR | Suggested | Why | Decision |
|---|---|---|---|---|---|---|
| A1 | inhuren | to hire | dışarıdan tutmak (personel) | (geçici) işe almak | "dışarıdan tutmak" is not idiomatic Turkish; inhuren is to hire (staff, a firm) for a job. Machine translated by DeepL, advisory only: TR "işe almak". | Ö|
| A2 | afwezig | absent | orada olmayan | yok, gelmemiş (işte, okulda) | "orada olmayan" is a paraphrase; afwezig is absent from work or class. Machine translated by DeepL, advisory only: TR "yok". |Ö|
| A3 | de koopwoning | owner-occupied home | mülk ev | satılık ev | "mülk ev" is not idiomatic; it pairs with huurwoning "kiralık ev", the owner-occupied/for-sale home. Machine translated by DeepL, advisory only: TR "satılık konut". |Ö|
| A4 | uitbetalen | to pay out | (parayı) ödemek | (maaşı, tazminatı) ödemek | The hint "(parayı)" does not separate it from A2 betalen "ödemek"; uitbetalen is paying out a salary or a claim. Machine translated by DeepL, advisory only: TR "ödeme yapmak". |OK|
| A5 | het gebit | set of teeth | diş yapısı | dişler | "diş yapısı" is not everyday Turkish; the natural word is plural, which needs an exception to the singular-noun rule. Machine translated by DeepL, advisory only: TR "dişler". |Ö|
| A6 | de statushouder | recognised refugee | oturum izinli mülteci | oturum izni almış mülteci | "izinli" reads as "on leave"; "oturum izni almış" is the usual phrase. Machine translated by DeepL, advisory only: TR "statü sahibi". |OK|
| A7 | de vergoeding | compensation | tazminat | ödenek, tazminat | At B1 vergoeding is mostly a reimbursement or allowance (reiskostenvergoeding); "tazminat" alone is damages. Machine translated by DeepL, advisory only: TR "tazminat". |OK|
| A8 | het eiwit | protein | protein | protein, yumurta akı | In the food category the kitchen sense "egg white" is as common as "protein". Machine translated by DeepL, advisory only: TR "protein". |OK|
| A9 | de opvoeding | upbringing | terbiye | (çocuk) yetiştirme | "terbiye" today reads as manners; opvoeding is upbringing. Machine translated by DeepL, advisory only: TR "eğitim". |Ö|
| A10 | de toespraak | speech | söylev | konuşma (topluluğa) | "söylev" is dated; a toespraak is a speech at an event. Machine translated by DeepL, advisory only: TR "konuşma". |OK|
| A11 | het dialect | dialect | şive | lehçe, ağız | "şive" is also used for accent, which is B1 accent "aksan"; dialect is "lehçe/ağız". Machine translated by DeepL, advisory only: TR "lehçe". |Ö|
| A12 | de poos | while (period) | kısa süre | bir süre | "een poos" is a while, not a short time ("een hele poos" = a long while). Machine translated by DeepL, advisory only: TR "bir süre". |Ö|
| A13 | checken | to check (informal) | göz atıp kontrol etmek | kontrol etmek (hızlıca) | "göz atıp kontrol etmek" is a paraphrase; checken is an informal synonym of A2 controleren, so the owner may also drop it (C9). Machine translated by DeepL, advisory only: TR "kontrol etmek". |Ö|
| A14 | uitzetten | to turn off | kapatmak (elektrik) | kapatmak (düğmeden) | "(elektrik)" suggests cutting the power; uitzetten is switching a device off, a synonym of A2 uitdoen "kapatmak (cihaz)" (C9). Machine translated by DeepL, advisory only: TR "kapamak". |OK|
| A15 | de chips | crisps | cips | remove from B1 | "chips" is the plural of chip (B1 noun-chip "çip"); C1 and C4 allow no plural form or plural-only noun. Machine translated by DeepL, advisory only: TR "cipsler". |Ö|
| A16 | de friet | chips (fries) | kızarmış patates | remove from B1, or keep | Regional synonym of A2 patat "patates kızartması"; C9 keeps one of a pair, and the two prompts differ only in word order. Machine translated by DeepL, advisory only: TR "patates kızartması". |Ö|
| A17 | de cookie | cookie (internet) | çerez | article: het (or keep de if the Woordenlijst lists both) | Wiktionary differs: it gives the neuter for this noun (https://en.wiktionary.org/wiki/cookie#Dutch); check https://woordenlijst.org/zoeken/?q=cookie before deciding. Machine translated by DeepL, advisory only: TR "çerez". |OK|
| A18 | de chocolade | chocolate (formal word) | çikolata (tatlı) | level: remove from B1 | Same question as B12. Spelling variant of A2 chocola "çikolata"; the hint "(tatlı)" adds no meaning (C9). Machine translated by DeepL, advisory only: TR "çikolata". |Ö|
| A19 | het proefschrift | doctoral thesis | doktora tezi | level: B2 (remove from B1) | Academic register (doctoral thesis); a B2 word for an adult learner. Machine translated by DeepL, advisory only: TR "doktora tezi". |OK|
| A20 | de vennootschap | company (legal entity) | ortaklık (şirket) | level: B2 (remove from B1) | Legal-business term (company form); B2 rather than B1. Machine translated by DeepL, advisory only: TR "şirket". |Ö|
| A21 | het gerechtshof | court of appeal | mahkeme (istinaf) | level: B2 (remove from B1) | Court of appeal; specialised legal vocabulary, B2. Machine translated by DeepL, advisory only: TR "temyiz mahkemesi". |Ö|
| A22 | witwassen | to launder (money) | kara para aklamak | level: B2 (remove from B1) | Financial-crime term from the news; B2 rather than B1. Machine translated by DeepL, advisory only: TR "aklama". |Ö|
| A23 | de regelgeving | regulations | mevzuat | level: B2 (remove from B1) | Formal collective noun (regulations); B2 rather than B1. Machine translated by DeepL, advisory only: TR "yönetmelikler". |Ö|
| A24 | 29 words (list below) | | | move to A1/A2 extras pool | Too easy for B1: A1/A2 course words (home, forms, food, clothes, animals, family, daily verbs). B1 would keep 1171 words, above the M3 target of 600. Editor recommends "Ö". |Ö|
| A25 | prikken | to prick | iğne yapmak | (iğne) batırmak, iğne yapmak | Same question as B2. Round trip close/close: Both blind passes read "to prick"; the existing text has only the injection sense and EN has only the prick sense. Machine translated by DeepL, advisory only: TR "delmek". |OK|
| A26 | stijf | stiff | kaskatı | sert, tutulmuş (kas) | Round trip close/close: "kaskatı" is an intensifier (rock-hard); both blind passes give sert. Machine translated by DeepL, advisory only: TR "sert". |Ö|
| A27 | de beterschap | get well soon | şifa | geçmiş olsun | Round trip close/close: The word is used as the wish "Beterschap!"; both blind passes give geçmiş olsun, and EN is "get well soon". Machine translated by DeepL, advisory only: TR "geçmiş olsun". |Ö|
| A28 | mishandelen | to mistreat | darp etmek | kötü muamele etmek | Round trip close/close: "darp etmek" is assault only; mishandelen also covers abuse of children or animals; both blinds give a wider reading. Machine translated by DeepL, advisory only: TR "işkence etmek". |Ö|
| A29 | geslaagd | successful | sınavı geçmiş | başarılı, sınavı geçmiş | Same question as B8. Round trip close/close: Both senses are everyday (een geslaagd feest, geslaagd voor het examen); both blinds and EN give başarılı. Machine translated by DeepL, advisory only: TR "başarılı". |OK|
| A30 | plagen | to tease | sataşmak | takılmak (şakayla) | Round trip close/close: "sataşmak" suggests provoking; plagen is playful teasing; both blind passes give takılmak. Machine translated by DeepL, advisory only: TR "rahatsız etmek". |Ö|
| A31 | fris | fresh (air) | ferah | serin, temiz (hava) | Round trip close/close: "ferah" is airy or spacious; frisse lucht is clean air and fris weer is cool weather; both blinds give taze/serin. Machine translated by DeepL, advisory only: TR "taze". |Ö|
| A32 | vastmaken | to fasten | sabitlemek | bağlamak, tutturmak | Round trip close/close: You fasten a belt or laces (bağlamak); "sabitlemek" is to fix in place; both blind passes give bağlamak. Machine translated by DeepL, advisory only: TR "bağlamak". |OK|

**A24 — the 29 words:** de koelkast (buzdolabı / fridge), de douche (duş / shower), de wekker (çalar saat / alarm clock), de tandarts (diş hekimi / dentist), de kapper (kuaför / hairdresser), de postcode (posta kodu / postcode), het huisnummer (kapı numarası / house number), de achternaam (soyadı / surname), de voornaam (ön ad / first name), de banaan (muz / banana), de tomaat (domates / tomato), de peer (armut / pear), het broodje (sandviç / bread roll), het koekje (bisküvi / biscuit (small)), de trui (kazak / jumper), de hoed (şapka / hat), het schaap (koyun / sheep), het varken (domuz / pig), de eend (ördek / duck), de olifant (fil / elephant), het kleinkind (torun / grandchild), binnenkomen (içeri girmek / to come in), thuisblijven (evde kalmak / to stay at home), weggooien (çöpe atmak / to throw away), vriendelijk (güler yüzlü / friendly), vervelend (can sıkıcı / annoying), de laptop (dizüstü bilgisayar / laptop), de dierentuin (hayvanat bahçesi / zoo), de bladzijde (sayfa / page).

**A24 — Machine translated by DeepL, advisory only:** koelkast "buzdolabı", douche "duş", wekker "çalar saat", tandarts "diş hekimi", kapper "kuaför", postcode "posta kodu", huisnummer "ev numarası", achternaam "soyadı", voornaam "ad", banaan "muz", tomaat "domates", peer "armut", broodje "sandviç", koekje "kurabiye", trui "kazak", hoed "şapka", schaap "koyun", varken "domuz", eend "ördek", olifant "fil", kleinkind "torun", binnenkomen "içeri girmek", thuisblijven "evde kalmak", weggooien "atmak", vriendelijk "nazik", vervelend "can sıkıcı", laptop "dizüstü bilgisayar", dierentuin "hayvanat bahçesi", bladzijde "sayfa".

## Part B — English: words to decide (14)
All 14 English `owner` rows of `review/roundtrip-b1-en/result.csv`, each a finding in `review/en/b1.findings.csv`; no
round-trip mismatch.

| # | Dutch | Turkish | Current EN | Suggested EN | Why | Decision |
|---|---|---|---|---|---|---|
| B1 | matig | vasat | moderate | mediocre | Two B1 senses: "moderate" (matige wind) and "mediocre" (een matig resultaat). The Turkish has "vasat" (mediocre); the two languages should prompt the same sense. Owner picks one. Both blind round-trip passes read "moderate", so the Turkish is the outlier (T-082 kept it). Machine translated by DeepL, advisory only: EN "moderate". |OK|
| B2 | prikken | iğne yapmak | to prick | to jab (with a needle) | Same question as A25. Health category: the B1 use is an injection or blood test ("een prik krijgen"). "to prick" gives only the pin sense; the Turkish has only the injection sense (T-082 finding). "to jab" covers both. Both blind round-trip passes read "to prick". Machine translated by DeepL, advisory only: EN "prick". |OK|
| B3 | levenslang | ömür boyu | lifelong | for life (sentence) | The category is Government and law, where levenslang is the life sentence ("levenslang krijgen"). "lifelong" is the learning sense; either change the prompt or move the word to another category. Machine translated by DeepL, advisory only: EN "life-long". |OK|
| B4 | de hulpverlener | yardım görevlisi | aid worker | care worker | "aid worker" is humanitarian aid abroad. hulpverlener is a care or social worker or an emergency responder at home ("hulpverleners waren snel ter plaatse"). Both blind round-trip passes read "care worker". Machine translated by DeepL, advisory only: EN "the care worker". |Ö|
| B5 | inburgeren | uyum sürecinden geçmek | to do civic integration | to integrate (civic course) | "to do civic integration" is not idiomatic English. integreren is bare "to integrate", so a hint keeps them apart. Machine translated by DeepL, advisory only: EN "integration". |OK|
| B6 | de drukte | kalabalık | bustle | crowds (busy time) | "bustle" is literary English above B1. The everyday sense is the crowds or busyness ("wat een drukte"); the Turkish has "kalabalık". Both blind round-trip passes read "crowds". Machine translated by DeepL, advisory only: EN "the hustle and bustle". |Ö|
| B7 | de teek | kene | tick (insect) | tick (parasite) | A tick is an arachnid, not an insect. The hint is factually wrong. Machine translated by DeepL, advisory only: EN "the tick". |OK|
| B8 | geslaagd | sınavı geçmiş | successful | successful (exam) | Same question as A29. Education category: the B1 sense is "ik ben geslaagd" (I passed); the Turkish has "sınavı geçmiş". Bare "successful" also reads as a successful party or event. Both blind round-trip passes added the exam hint ("successful (exam)", "successful (passed)"). Machine translated by DeepL, advisory only: EN "passed". |Ö|
| B9 | volkomen | eksiksiz | utter | complete (total) | "utter" is C1 English and only used before a noun. volkomen means complete, total ("volkomen normaal"); no A1/A2/B1 prompt is "complete". Machine translated by DeepL, advisory only: EN "completely". |Ö|
| B10 | de oplichter | dolandırıcı | swindler | scammer | "swindler" is dated English. oplichter at B1 is the phone or online scammer of the news. Machine translated by DeepL, advisory only: EN "the fraudster". |Ö|
| B11 | de hals | boyun | neck (throat) | neck (front) | The hint repeats A2 keel "throat", so the prompt mixes A2 nek "neck" and keel "throat". hals is the neck, mostly its front. Machine translated by DeepL, advisory only: EN "the neck". |OK|
| B12 | de chocolade | çikolata (tatlı) | chocolate (formal word) | (same decision as T-082: remove from B1) | Same question as A18. chocolade is not formal: it is the standard spelling and A1 chocola the colloquial one. T-082 already asks the owner to remove it (spelling variant). If kept, "chocolate (formal word)" is misleading. Machine translated by DeepL, advisory only: EN "the chocolate". |Ö|
| B13 | het beeldscherm | ekran | monitor | screen | Round trip close/close: both blind passes read "screen". beeldscherm is any screen (TV, computer, phone); "monitor" is only the desktop device. No A1/A2/B1 prompt is "screen". Machine translated by DeepL, advisory only: EN "the screen". |Ö|
| B14 | vertragen | geciktirmek | to slow down | to delay (slow down) | Round trip close/close: both blind passes read "to delay", as the Turkish "geciktirmek"; the everyday B1 use is a delay (de trein is vertraagd). No prompt is "to delay". Machine translated by DeepL, advisory only: EN "slow down". |Ö|

## Parts C and D — spot check (ADR-012 rule 7)
Pool: the 1129 B1 words with verdict `OK` in both round trips and not in Part A or B, in the order of
`data/b1/words.json`. Seed **20261023** (the draw date). Shuffle with mulberry32 and Fisher–Yates; Part C is the first 50,
Part D the next 50 (no overlap):

```js
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=mulberry32(20261023); const s=pool.slice();
for(let i=s.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[s[i],s[j]]=[s[j],s[i]]}
// Part C = s.slice(0,50), Part D = s.slice(50,100)
```

**More than one error in a part stops that language's B1 round-trip acceptances** (ADR-012 rule 7): its `roundtrip`
acceptances stay `reviewed: false`, and the owner chooses between a full human review of B1 in that language and Option 4.

### Part C — 50 random Turkish words
Check the Turkish and the article.

| # | Dutch | Turkish | Decision |
|---|---|---|---|
| C1 | nuchter | ayık, aklı başında |✓|
| C2 | de landing | iniş |✓|
| C3 | de plicht | yükümlülük |✓|
| C4 | spoedeisend | acil (tıbbi) |✓|
| C5 | de verpakking | ambalaj |✓|
| C6 | de hypotheek | ipotek |✓|
| C7 | kletsen | gevezelik etmek |✓|
| C8 | de ladder | seyyar merdiven |✓|
| C9 | de brandweerman | itfaiyeci | ✓
| C10 | zorgvuldig | özenli |✓|
| C11 | de bacterie | bakteri |✓|
| C12 | kalmeren | sakinleşmek |✓|
| C13 | tijdig | zamanında |✓|
| C14 | de gelijkheid | eşitlik |✓|
| C15 | het eindexamen | bitirme sınavı |✓|
| C16 | vasthouden | sıkıca tutmak |✓|
| C17 | ondiep | sığ |✓|
| C18 | remmen | fren yapmak |✓|
| C19 | de aanhouding | gözaltı |✓|
| C20 | de noodzaak | gereklilik |✓|
| C21 | de verzekering | sigorta |✓|
| C22 | de woede | öfke |✓|
| C23 | de frustratie | hüsran |✓|
| C24 | de afrit | çıkış (otoyol) |✓|
| C25 | de voorrang | geçiş önceliği |✓|
| C26 | de bevestiging | teyit |✓|
| C27 | plukken | (meyve) toplamak |✓|
| C28 | acuut | akut, ani |✓|
| C29 | de inbreker | ev hırsızı |✓|
| C30 | de wang | yanak |✓|
| C31 | schillen | kabuğunu soymak |✓|
| C32 | het weiland | otlak |✓|
| C33 | de vragenlijst | soru formu |✓|
| C34 | de expertise | uzmanlık |✓|
| C35 | de hamer | çekiç |✓|
| C36 | wreed | zalim |✓|
| C37 | de diesel | dizel |✓|
| C38 | afkoelen | soğumak |✓|
| C39 | de hartaanval | kalp krizi |✓|
| C40 | de besparing | tasarruf |✓|
| C41 | de minderheid | azınlık |✓|
| C42 | uitvallen | iptal olmak, kesilmek |✓|
| C43 | het stadsdeel | ilçe |✓|
| C44 | recyclen | geri dönüştürmek |✓|
| C45 | uitschrijven | kaydını sildirmek |✓|
| C46 | uitpakken | paketi açmak |✓|
| C47 | de laars | çizme |✓|
| C48 | de danser | dansçı |✓|
| C49 | het misverstand | yanlış anlaşılma |✓|
| C50 | verschuiven | kaydırmak |✓|

### Part D — 50 random English words
Check the English.

| # | Dutch | English | Decision |
|---|---|---|---|
| D1 | de opinie | opinion (formal) |✓|
| D2 | drastisch | drastic |✓|
| D3 | dramatisch | dramatic |✓|
| D4 | de toeslag | allowance |✓|
| D5 | de ontspanning | relaxation |✓|
| D6 | vastlopen | to get stuck (computer) |✓|
| D7 | de migratie | migration |✓|
| D8 | de verbazing | astonishment |✓|
| D9 | het toiletpapier | toilet paper |✓|
| D10 | de erfenis | inheritance |✓|
| D11 | het trauma | trauma |✓|
| D12 | terechtkomen | to end up |✓|
| D13 | klikken | to click |✓|
| D14 | boren | to drill |✓|
| D15 | de inspectie | inspection |✓|
| D16 | de zuurstof | oxygen |✓|
| D17 | de navigatie | navigation |✓|
| D18 | het accent | accent |✓|
| D19 | de beer | bear |✓|
| D20 | de spreker | speaker |✓|
| D21 | flexibel | flexible |✓|
| D22 | aanraken | to touch |✓|
| D23 | schoppen | to kick |✓|
| D24 | de berekening | calculation |✓|
| D25 | bereikbaar | reachable |✓|
| D26 | inloggen | to log in |✓|
| D27 | de samenvatting | summary |✓|
| D28 | de brandwond | burn |✓|
| D29 | de huurder | tenant |✓|
| D30 | het verlof | leave (from work) |✓|
| D31 | het saldo | balance (account) |✓|
| D32 | de vaas | vase |✓|
| D33 | verdwalen | to get lost |✓|
| D34 | de musical | musical |✓|
| D35 | het stadhuis | city hall |✓|
| D36 | de factuur | invoice |✓|
| D37 | stom | stupid |✓|
| D38 | de misdadiger | criminal |✓|
| D39 | de aanmelding | sign-up |✓|
| D40 | nauwkeurig | accurate |✓|
| D41 | virtueel | virtual |✓|
| D42 | de fantasie | imagination |✓|
| D43 | bevallen | to give birth |✓|
| D44 | de warmte | warmth |✓|
| D45 | de buitenwijk | suburb |✓|
| D46 | de verzorging | care |✓|
| D47 | het deksel | lid |✓|
| D48 | bitter | bitter |✓|
| D49 | ongewoon | unusual |✓|
| D50 | het wiel | wheel |✓|

## Spot-check result (T-085, 2026-10-25)
- Part C (50 Turkish words, text and article): 50 marked ✓, **0 errors**.
- Part D (50 English words): 50 marked ✓, **0 errors**.
- ADR-012 rule 7 therefore holds for both languages: the round-trip acceptances were imported (`review/roundtrip-b1/result.csv`, `review/roundtrip-b1-en/result.csv`).
