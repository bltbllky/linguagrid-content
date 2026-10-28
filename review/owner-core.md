# Owner review — core (A1/A2), decisions and spot check, 2026-10-28

Önce bunu oku (kısa):
- **Zorunlu:** A, B (işaretli satırlar), C, D (rastgele kelimeler) ve G (sayılar, tek evet/hayır). Tahmini süre 35–50 dakika.
- **İsteğe bağlı:** E (255 seviye değişikliği) ve F (252 çıkarılan kelime) sadece göz atmak için; **boş bırakırsan kabul edilmiş sayılır**. İtiraz ettiğin kelimeyi yaz, yeter.
- **A ve B kararları:** "onay" = "Suggested" sütunundaki öneriyi al; "kalsın" = mevcut metin kalsın; ya da kendi metnini yaz. Önerilerin çoğu "kalsın" ile aynıdır.
- **A1–A7 aynı kelimenin hem Türkçe hem İngilizce satırıdır;** tek karar iki dili birlikte belirler. mondmasker/mondkap ve kostuum/pak çiftlerinde "hangisi kalsın" diye yaz. A26 (mama/papa) iki kelime için tek karardır.
- **C ve D:** metin (ve C'de artikel) doğruysa "✓", yanlışsa doğrusunu yaz. G0: "evet" ya da "hayır, hariç: ...".
- **Boş bırakılan A–D satırı karar verilmemiş sayılır.** Aynı satırlar `review/owner-core.csv` dosyasında da var (T-225 oradan içe aktarır).

Source: T-222 (content PR #90: `review/core.findings.csv`, `review/roundtrip-core/result.csv`), T-223 (content PR #89: `review/en/core.findings.csv`, `review/roundtrip-core-en/result.csv`) and `review/core/overlap.csv`. Nothing in `data/` was changed. Only flagged rows are decided here.

**Machine translated by DeepL, advisory only:** the readings in the "Why" column come from the `deepl` column of the two result sheets (ADR-015; no new run). They change no suggestion and no verdict.
**Three-reader release (ADR-019):** Turkish released **noun-kopje** (fincan); English released none. The owner can pull noun-kopje back in the merge report.

## Counts
| Part | What | Decisions | Rows |
|---|---|---|---|
| A | Turkish flagged rows (A1–A7 also cover the English row of the same word) | 26 | 27 Turkish (+7 English) |
| B | English flagged rows not in A | 4 | 4 English |
| C | Turkish spot check | 20 words | 20 |
| D | English spot check | 20 words | 20 |
| G | Cardinal numbers | 1 (29 rows) | 29 |
| E | Level moves (optional) | 2 blocks | 255 |
| F | Retired ids (optional) | 2 blocks | 252 |

All 27 Turkish and 11 English `owner` rows are covered (7 words are in both languages; 38 word-language rows, 30 decisions in A and B). Estimate: A and B about 30 decisions at 0.5 min = 15 min; C and D 40 words at 0.4 min = 16 min; G 2 min; reading E and F 10–20 min if skimmed.

## Part A — Turkish flagged rows (26 decisions)
A1–A7: the same word is flagged in Turkish and English; decide once. The English column shows the current English text.

| # | Dutch | Current TR | Current EN | Suggested | Why | Decision |
|---|---|---|---|---|---|---|
| A1 | de bank | koltuk | couch | Move the category to "Ev" (a2-home); keep koltuk / couch | The texts are the sofa sense, the category (a2-services) implies the money sense. Blind readers split (sofa vs bank); DeepL read the bank. Moving the category needs no text change. Alternative: change both texts to banka / bank (money). Row in both languages: one decision. DeepL (advisory only, machine translated): TR "banka", EN "the bank". | |
| A2 | het recept | reçete | prescription | Change the text: TR "yemek tarifi", EN "recipe" (category a1-food stays) | The category is food, so the recipe sense fits; the NL->TR and NL->EN blind readers and DeepL all read tarif / recipe. Alternative: keep reçete / prescription and move to a1-body-health. Row in both languages: one decision. DeepL (advisory only, machine translated): TR "tarif", EN "the recipe". | |
| A3 | de boodschap | mesaj | groceries | TR "alışveriş (günlük ihtiyaç)", EN "errand (shopping)" | The two languages disagree (TR mesaj = message, EN groceries = plural). mesaj is also the exact text of noun-bericht (A2). Shopping category fits the errand sense; both Turkish blind readers chose shopping (the English ones read message / errand). Row in both languages: one decision. DeepL (advisory only, machine translated): TR "mesaj", EN "the message". | |
| A4 | herstellen | onarmak, düzeltmek | to recover | Keep TR "onarmak, düzeltmek"; change EN to "to repair" | Languages disagree on the sense (TR repair, EN recover). iyileşmek is taken by verb-genezen (A1). Readers split (repair vs recover); DeepL reads repair. Row in both languages: one decision. DeepL (advisory only, machine translated): TR "onarmak", EN "repair". | |
| A5 | het mondmasker | maske (ağız-burun) | face mask (for the mouth) | Keep mondkap (A2, owner-reviewed); retire mondmasker from the core set | Same sense as the A2 word mondkap (maske (ağız) / face mask): the hint does not separate them. A1 is also high for this word. Other options: keep both, or keep mondmasker and retire mondkap. Row in both languages: one decision. DeepL (advisory only, machine translated): TR "ağız maskesi", EN "the face mask". | |
| A6 | het kostuum | kostüm, takım elbise | suit (formal) | Keep pak; retire kostuum from the core set | Same head word and sense as A2 pak (suit): both can meet in one A2 grid. TR "kostüm" is the costume sense. Other options: keep both, or reword kostuum as costume (TR kostüm, EN costume). Row in both languages: one decision. DeepL (advisory only, machine translated): TR "kostüm", EN "the costume". | |
| A7 | de poes | kedi | cat | Keep as it is (kedi / cat) | Sensitive: poes is vulgar slang too, but it is the everyday word for cat and kat is retired, so no clash in the prompt. Alternative: retire the word. Row in both languages: one decision. DeepL (advisory only, machine translated): TR "kedi", EN "the cat". | |
| A8 | alleen | tek başına, yalnız | alone | Change TR to "tek başına" | The current "tek başına, yalnız" shares the head word yalnız with adj-eenzaam (both A2); blind readers chose yalnız. DeepL (advisory only, machine translated): TR "sadece". | |
| A9 | juist | doğru, tam | correct | Change TR to "tam doğru" | The current "doğru, tam" shares the head word doğru with adj-waar (both A2, same grid). DeepL (advisory only, machine translated): TR "doğru". | |
| A10 | natuurlijk | doğal | natural | Keep "doğal" | NL->TR blind reader read the adverb sense "tabii" (of course); the stored sense is the adjective "natural" (the EN->TR reader read doğal). DeepL also gave the adverb sense. No change needed. DeepL (advisory only, machine translated): TR "tabii ki". | |
| A11 | persoonlijk | kişisel | personal | Keep "kişisel" | All readers and DeepL agree; this row is here only because the EN->TR pass was not independent (T-220 author saw the English prompt). DeepL (advisory only, machine translated): TR "kişisel". | |
| A12 | de behandeling | tedavi | treatment | Move the level A1 -> A2 | Abstract derived noun (behandelen + -ing), not a most-basic word. Text tedavi is confirmed by all readers. DeepL (advisory only, machine translated): TR "tedavi". | |
| A13 | bereiden | hazırlamak (yemek) | to prepare (food) | Keep "hazırlamak (yemek)" | Same head word in all readers and DeepL; here only because the EN->TR pass was not independent. DeepL (advisory only, machine translated): TR "hazırlamak". | |
| A14 | bereiken | ulaşmak, varmak | to reach | Change TR to "ulaşmak" | The current "ulaşmak, varmak" shares varmak with verb-aankomen (A2), both a2-city-transport. DeepL (advisory only, machine translated): TR "ulaşmak". | |
| A15 | de buur | komşu | neighbour | Keep "komşu" | All readers and DeepL agree; here only because the EN->TR pass was not independent. DeepL (advisory only, machine translated): TR "komşu". | |
| A16 | de dame | hanım, bayan | lady | Keep "hanım, bayan" | Readers gave hanımefendi / bayan, DeepL hanımefendi: all the same sense; here only because the EN->TR pass was not independent. DeepL (advisory only, machine translated): TR "hanımefendi". | |
| A17 | de inwoner | sakin (bir yerde oturan) | inhabitant | Keep "sakin (bir yerde oturan)" | Readers read sakin; DeepL says "yerli" (native), which is a different word. Here also because the EN->TR pass was not independent. DeepL (advisory only, machine translated): TR "yerli". | |
| A18 | de jeugd | gençlik | youth | Keep "gençlik" | All readers and DeepL agree; here only because the EN->TR pass was not independent. DeepL (advisory only, machine translated): TR "gençlik". | |
| A19 | het onderwijs | eğitim, öğretim | education | Change TR to "öğretim" | The current "eğitim, öğretim" shares eğitim with noun-opleiding (A2, a2-work-study). All blind readers read eğitim, so this is a distinctness change, not a correction. DeepL (advisory only, machine translated): TR "eğitim". | |
| A20 | de periode | dönem, süre | period | Keep "dönem, süre" | All readers and DeepL agree on dönem; here only because the EN->TR pass was not independent. DeepL (advisory only, machine translated): TR "dönem". | |
| A21 | het punt | puan, nokta | point | Change TR to "puan" | het punt = score/point; "nokta" is the full stop or tip (de punt). Blind readers chose nokta, DeepL konu, so this is the weakest suggestion: "kalsın" is also fine. DeepL (advisory only, machine translated): TR "konu". | |
| A22 | het schort | önlük | apron | Keep article "het" and "önlük" | nl.wiktionary lists both de (m/v) and het (o) for schort; the stored het is valid. DeepL (advisory only, machine translated): TR "önlük". | |
| A23 | de sok | kısa çorap | sock | Keep "kısa çorap" | noun-kous (A2, a2-clothes) holds plain "çorap", so "kısa çorap" keeps the two apart. Readers read çorap. DeepL (advisory only, machine translated): TR "çorap". | |
| A24 | het voorjaar | bahar, ilkbahar | spring | Keep "bahar, ilkbahar" | Readers read ilkbahar, DeepL bahar: both are inside the current text; here only because the EN->TR pass was not independent. DeepL (advisory only, machine translated): TR "bahar". | |
| A25 | het witlof | hindiba | chicory | Keep "hindiba" and article "het" | nl.wiktionary gives het; the NL->TR blind reader guessed de. DeepL "endivya" is the same vegetable. DeepL (advisory only, machine translated): TR "endivya". | |
| A26 | de mama; de papa | anne (samimi); baba (samimi) | mum; dad | Move papa from A2 to A1 (mama stays A1) | The two parallel words should share a level. Text is confirmed by all readers. Alternative: move mama to A2. DeepL (advisory only, machine translated): TR "anne". (papa) TR "baba". | |

## Part B — English flagged rows not in A (4 decisions)

| # | Dutch | Turkish | Current EN | Suggested EN | Why | Decision |
|---|---|---|---|---|---|---|
| B1 | de geliefde | sevgili | loved one (partner) | Change EN to "beloved (partner)" | "loved one" usually means a relative; geliefde (TR sevgili) is a romantic partner. DeepL (advisory only, machine translated): EN "the beloved". | |
| B2 | het hemd | atlet, iç gömleği | vest | Change EN to "vest (undershirt)" | Plain "vest" can mislead (Dutch vest = cardigan/waistcoat). TR atlet / iç gömleği is the undershirt. DeepL (advisory only, machine translated): EN "the shirt". | |
| B3 | de kachel | soba | stove | Change EN to "heater (stove)" | British "stove" often means a cooker; kachel (TR soba) is a room heater. Both blind readers chose heater. DeepL (advisory only, machine translated): EN "the stove". | |
| B4 | de kaart | harita | map | Keep "map" | The category (City and transport) takes the map sense; the blind NL reader read "card (postcard)", the other sense of kaart. No finding; the row is owner-bound only because of this mismatch. DeepL (advisory only, machine translated): EN "the map". | |

## Part C — 20 random Turkish words
Check the Turkish and the article. Pool: 348 words with verdict `OK` in `review/roundtrip-core/result.csv`; released rows 1 (under 10, so no 5 from released rows). Drawn with `npm run spot-check -- draw --lang tr --seed 20261028 --result review/roundtrip-core/result.csv` (seed = the draw date). Tally: Turkish 150 words, 2 errors, under the 2% limit, so 20 words.

| # | Dutch | Turkish | Decision |
|---|---|---|---|
| C1 | de baard | sakal | |
| C2 | de chauffeur | şoför | |
| C3 | oranje | turuncu | |
| C4 | laag | alçak | |
| C5 | de tekenfilm | çizgi film | |
| C6 | de reactie | tepki, yanıt | |
| C7 | open | açık | |
| C8 | wrijven | ovmak, sürtmek | |
| C9 | planten | dikmek (bitki) | |
| C10 | stoppen | durmak | |
| C11 | aardig | nazik | |
| C12 | de tante | teyze, hala | |
| C13 | de kraag | yaka | |
| C14 | warm | sıcak | |
| C15 | het hoofdstuk | bölüm (kitap) | |
| C16 | de vloer | zemin | |
| C17 | de pan | tencere | |
| C18 | rustig | sakin | |
| C19 | de ziekte | hastalık | |
| C20 | de drank | içecek | |

Extension, only if Part C has exactly 1 error (30 ids, same draw, seed 20261028):
verb-koken, verb-rennen, adj-welkom, adj-zacht, noun-bak, noun-zwaan, noun-agenda, noun-bloed, adj-vers, noun-afspraak, noun-hiel, adj-druk, verb-verdwijnen, adj-langzaam, verb-feliciteren, noun-kin, noun-rust, noun-papier, noun-jas, noun-jongen, noun-dak, noun-dolfijn, noun-hulp, verb-huilen, noun-natuurkunde, verb-bloeden, noun-wiskunde, adj-waar, noun-schoolplein, adj-klaar

## Part D — 20 random English words
Check the English. Pool: 364 words with verdict `OK` in `review/roundtrip-core-en/result.csv`; released rows 0. Drawn with `npm run spot-check -- draw --lang en --seed 20261029 --result review/roundtrip-core-en/result.csv` (seed = the next number). Tally: English 150 words, 2 errors, under 2%, so 20 words.

| # | Dutch | English | Decision |
|---|---|---|---|
| D1 | noorden | north | |
| D2 | ongelukkig | unhappy | |
| D3 | product | product | |
| D4 | warenhuis | department store | |
| D5 | roken | to smoke | |
| D6 | plan | plan | |
| D7 | mossel | mussel | |
| D8 | herfst | autumn | |
| D9 | natuurlijk | natural | |
| D10 | gast | guest | |
| D11 | afvallen | to lose weight | |
| D12 | maat | size | |
| D13 | echt | real | |
| D14 | oranje | orange (colour) | |
| D15 | opa | grandpa | |
| D16 | film | film | |
| D17 | reis | journey | |
| D18 | zwaan | swan | |
| D19 | sportschool | gym | |
| D20 | stoppen | to stop | |

Extension, only if Part D has exactly 1 error (30 ids, same draw, seed 20261029):
verb-knijpen, noun-feest, noun-webwinkel, noun-dorp, noun-discussie, noun-lid, noun-buurt, noun-trap, noun-patiënt, adj-vies, noun-toekomst, noun-afspraak, noun-walvis, verb-koken, noun-dier, noun-voorhoofd, noun-teen, noun-kerst, noun-bloed, noun-armband, adj-goedkoop, noun-baby, noun-kussen, verb-spugen, noun-reclame, noun-bak, verb-trekken, adj-zwanger, noun-idee, noun-tekenfilm

Rule (ADR-019): 0 errors in 20 pass; 1 error adds the 30 and at most 1 error in 50 passes; 2 or more errors in 20 fail (ADR-012 rule 7).

## Part G — 29 cardinal numbers (one yes/no)
The cardinal numbers among the A1 extras have unreviewed annotations in `data/a1a2/annotations.json`: category **a1-time (Zaman)**, no article. A1 needs them to stay above 400. **Editor recommends: evet.** Write "evet" in G0 for all 29, or "hayır, hariç: ..." (the rows below are for exceptions only).

| # | Dutch | Turkish | English | Suggested | Decision |
|---|---|---|---|---|---|
| G0 | 29 cardinal numbers |  |  | yes: category a1-time (Zaman), no article (all 29) | |

The 29 numbers:

twee (iki, two); drie (üç, three); miljoen (milyon, million); vijf (beş, five); zes (altı, six); tien (on, ten); miljard (milyar, billion); vier (dört, four); honderd (yüz (sayı), hundred); duizend (bin, thousand); twintig (yirmi, twenty); zeven (yedi, seven); acht (sekiz, eight); twaalf (on iki, twelve); dertig (otuz, thirty); elf (on bir, eleven); vijftien (on beş, fifteen); vijftig (elli, fifty); negen (dokuz, nine); zestig (altmış, sixty); veertien (on dört, fourteen); zestien (on altı, sixteen); tachtig (seksen, eighty); dertien (on üç, thirteen); zeventig (yetmiş, seventy); veertig (kırk, forty); nul (sıfır, zero); negentig (doksan, ninety); achttien (on sekiz, eighteen)

## Part E — OPTIONAL skim list: 255 level moves
Words whose level in the core set differs from the launch level, with the new category. **Empty decision = accept.** Pull one back by writing its Dutch word under "Decision".

### E1: A1 -> A2 (136 words)
- **Tanımlama:** aardig (nazik); belangrijk (önemli); bijzonder (özel); dicht (kapalı); druk (yoğun); echt (gerçek); eigen (kendi); erg (çok kötü, berbat); fijn (hoş); hard (sert); interessant (ilginç); klaar (hazır); leeg (boş); nodig (gerekli); open (açık); stil (sessiz); vies (kirli); vreemd (tuhaf); waar (doğru); zacht (yumuşak)
- **Duygular ve karakter:** eenzaam (yalnız); lief (sevimli); nerveus (gergin); ongelukkig (mutsuz); verbaasd (şaşkın); verdrietig (üzgün); de kus (öpücük); het plezier (keyif); huilen (ağlamak); lachen (gülmek)
- **İletişim:** welkom (hoş geldin); het afscheid (veda); de afspraak (randevu); de brief (mektup); het idee (fikir); de informatie (bilgi); het internet (internet); het probleem (sorun); de stem (ses (insan sesi)); de website (web sitesi); bedanken (teşekkür etmek); feliciteren (tebrik etmek); schreeuwen (bağırmak); sturen (göndermek); vertellen (anlatmak)
- **Yemek ve mutfak:** de aardappel (patates); de boterham (ekmek dilimi); het fruit (meyve); de hamburger (hamburger); de koek (kurabiye); de melk (süt); de pizza (pizza); de taart (pasta); de thee (çay)
- **İş ve eğitim:** de baas (patron); de chauffeur (şoför); de collega (meslektaş); de fabriek (fabrika); de geschiedenis (tarih (ders)); het hoofdstuk (bölüm (kitap)); het kantoor (ofis); de leerling (öğrenci); de natuurkunde (fizik); het papier (kâğıt); het plan (plan); het project (proje); het vak (okul dersi (branş)); de wiskunde (matematik); studeren (öğrenim görmek)
- **Ev ve yaşam:** de badkamer (banyo); de kam (tarak); de makelaar (emlakçı); de slaapkamer (yatak odası); de vloer (zemin); de woonkamer (oturma odası); poetsen (fırçalamak); schoonmaken (temizlemek)
- **Resmî işler ve hizmetler:** de bank (koltuk); de hulp (yardım)
- **Şehir ve ulaşım:** de benzine (benzin); de boot (tekne); het centrum (merkez); het dorp (köy); de file (trafik sıkışıklığı); de garage (garaj); de haven (liman); de kaart (harita); de kerk (kilise); de kilometer (kilometre); de metro (metro); de reis (yolculuk); de route (güzergâh); de taxi (taksi); de tram (tramvay); het vliegtuig (uçak); fietsen (bisiklete binmek); overstappen (aktarma yapmak)
- **Alışveriş ve para:** de boodschap (mesaj); het cadeau (hediye); de klant (müşteri); het product (ürün); de webwinkel (internet mağazası); kosten ((fiyatı) tutmak); verkopen (satmak)
- **Boş zaman ve kültür:** het café (kafe); het feest (parti); de hobby (hobi); de radio (radyo); de sportschool (spor salonu); het strand (plaj); het tennis (tenis); het zwembad (yüzme havuzu); dansen (dans etmek)
- **Doğa ve hava:** het eiland (ada); het noorden (kuzey)
- **Sağlık ve vücut:** de honger (açlık); afvallen (kilo vermek)
- **Giyim ve aksesuar:** het horloge (kol saati); de jas (mont); de riem (kemer); het uniform (üniforma)
- **Günlük fiiller:** blijven (kalmak); controleren (kontrol etmek); gebruiken (kullanmak); gooien (atmak); houden (tutmak); laten (bırakmak); lijken (benzemek); pakken (eline almak); rennen (koşmak); stoppen (durmak); trekken (çekmek); vallen (düşmek); volgen (takip etmek); worden (haline gelmek); zetten (koymak (dik))

Decision E1: ____ 

### E2: A2 -> A1 (119 words)
- **Zaman:** dagelijks (günlük); vorig (geçen); de agenda (ajanda); de datum (tarih (gün)); de feestdag (resmî tatil günü); de herfst (sonbahar); de kerst (Noel); de middag (öğleden sonra); het moment (an); de nacht (gece); het seizoen (mevsim); de tijd (zaman); de toekomst (gelecek)
- **Alışveriş ve para:** goedkoop (ucuz); de markt (pazar)
- **Tanımlama:** groen (yeşil); heet (çok sıcak); hoog (yüksek); laag (alçak); langzaam (yavaş); oranje (turuncu); slecht (kötü); warm (sıcak); zwart (siyah)
- **Yiyecek ve içecek:** vers (taze); zuur (ekşi); het brood (ekmek); de drank (içecek); het gerecht (yemek çeşidi); het glas (bardak); de kaas (peynir); de kip (tavuk); de olie (yağ); het recept (reçete); de smaak (tat); de vis (balık); de wijn (şarap); de wortel (havuç); bakken (fırında pişirmek); koken (yemek pişirmek); snijden (kesmek)
- **Vücut ve sağlık:** zwanger (hamile); de arm (kol); de arts (hekim); het been (bacak); het bloed (kan); de buik (karın); het gezicht (yüz); de gezondheid (sağlık); de griep (grip); de hand (el); het hoofd (kafa); de huid (cilt); de keel (boğaz); de klacht (şikâyet); het lichaam (vücut); het medicijn (ilaç); de mond (ağız); de nek (ense); de neus (burun); het ongeluk (kaza); het oor (kulak); de patiënt (hasta (kişi)); de pijn (ağrı); de schouder (omuz); de tand (diş); de teen (ayak parmağı); de tong (dil (organ)); de vinger (parmak); de ziekte (hastalık); bewegen (hareket etmek); bloeden (kanamak); genezen (iyileşmek); overlijden (vefat etmek); roken (sigara içmek)
- **Ev:** het afval (çöp); het apparaat (cihaz); de buurt (mahalle); het dak (çatı); de doos (kutu); het kussen (yastık); het laken (çarşaf); de lamp (lamba); het mes (bıçak); de muur (duvar); de pan (tencere); de sleutel (anahtar); de spiegel (ayna); de stoel (sandalye); de trap (merdiven); huren (kiralamak)
- **İnsanlar ve aile:** de baby (bebek); de gast (misafir); de geboorte (doğum); het huwelijk (evlilik); de jongen (erkek çocuk); de leeftijd (yaş); het lid (üye); de neef (kuzen, yeğen (erkek)); de ontmoeting (buluşma); de oom (amca, dayı); de opa (dede); de persoon (kişi); de tante (teyze, hala); de volwassene (yetişkin); scheiden (boşanmak)
- **Doğa ve hava:** de boom (ağaç); het dier (hayvan); het weer (hava durumu)
- **Giyim:** de bril (gözlük); de broek (pantolon); de kleding (giysi); de maat (beden); de ring (yüzük)
- **Boş zaman:** de film (film)
- **İletişim:** het nummer (numara); het woord (kelime)
- **Günlük fiiller:** openen (açmak); sluiten (kapatmak)

Decision E2: ____ 

## Part F — OPTIONAL skim list: 252 retired ids
Launch words that the core set does not keep. **Empty decision = accept.** Pull one back by writing its Dutch word under "Decision".

### F1: launch A1 (70 words)
- **adj:** arm (fakir); blij (sevinçli); blond (sarışın); engels (İngilizce); extra (ekstra); favoriet (favori); gewoon (sıradan); heel (bütün, tam); jarig (doğum günü olan); mager (zayıf); nederlands (Hollandaca); normaal (normal); perfect (mükemmel); ruim (geniş); slank (ince (vücut)); speciaal (özel); sportief (sportif); vaak (sık)
- **noun:** de activiteit (etkinlik); de berging (depo); de bloes (bluz); het boek (kitap); de buschauffeur (otobüs şoförü); de bushalte (otobüs durağı); de calorie (kalori); de chocola (çikolata); de cola (kola); het dansfeest (dans partisi); het ding (şey); de docent (eğitmen); de dokter (doktor); de dollar (dolar); het ei (yumurta); het eten (yemek); de frisdrank (meşrubat); de groet (selam); de kat (kedi); het kleed (örtü, halı); de kop (fincan); het lawaai (gürültü); de lerares (kadın öğretmen); het lokaal (derslik); de luis (bit); de organisatie (organizasyon); het paar (çift); de patat (patates kızartması); het rijtjeshuis (sıra ev); de ruimte (alan); de sinaasappel (portakal); de soort (tür); de stok (sopa); de stroopwafel (şuruplu waffle); het vliegveld (havalimanı)
- **verb:** autorijden (araba sürmek); besturen (yönetmek); blaffen (havlamak); glimlachen (gülümsemek); inwonen (birinin yanında kalmak); kammen (taramak); kennen (tanımak); leggen (yatırmak, koymak); leven (yaşamak); plannen (planlamak); schijnen (parlamak); stappen (adım atmak); strijken (ütülemek); verbazen (şaşırtmak); verbranden (yakmak); vertrekken (yola çıkmak); weggaan (ayrılmak)

Decision F1: ____ 

### F2: launch A2 (182 words)
- **adj:** buitenlands (yabancı (ülke)); eenvoudig (basit); eerder (daha önce); enthousiast (hevesli); fit (zinde); fulltime (tam zamanlı); gemakkelijk (kolay); geschikt (uygun); gewond (yaralı); heerlijk (nefis); kalm (sakin); medisch (tıbbi); modern (modern); ongerust (tedirgin); online (çevrimiçi); onmogelijk (imkânsız); parttime (yarı zamanlı); populair (popüler); prachtig (muhteşem); precies (tam); prettig (keyifli); slaperig (uykulu); smakelijk (iştah açıcı); tegenwoordig (günümüzdeki); tevreden (memnun); werkloos (işsiz); woedend (öfkeli); zenuwachtig (gergin)
- **noun:** de aardbei (çilek); de achtertuin (arka bahçe); de advertentie (ilan); de afwas (bulaşık); de afzuigkap (davlumbaz); de appelmoes (elma püresi); de appeltaart (elmalı turta); de assistent (asistan); de automobilist (sürücü); het avondeten (akşam yemeği); het badpak (mayo); het begin (başlangıç); de begrafenis (cenaze); de beslissing (karar); de betekenis (anlam); de bewoner (ev sakini); de bijsluiter (prospektüs (ilaç)); de boekwinkel (kitapçı); de boerenkool (kara lahana); het bureau (çalışma masası); de buurman (komşu (erkek)); de buurvrouw (komşu (kadın)); het consult (muayene); de croissant (kruvasan); de dorst (susuzluk); de dosering (dozaj); de duizeligheid (baş dönmesi); de eetkamer (yemek odası); de eetlepel (yemek kaşığı); de eettafel (yemek masası); het einde (son); de erwtensoep (bezelye çorbası); het familielid (akraba); de fietser (bisikletli); de fooi (bahşiş); het fornuis (ocak); het gehakt (kıyma); het gemeentehuis (belediye binası); het gezin (çekirdek aile); de gymschoen (spor ayakkabısı); de hagelslag (çikolata serpintisi); het halfuur (yarım saat); de heer (bey); het heimwee (sıla hasreti); de hotelkamer (otel odası); de inschrijving (kayıt); de jam (reçel); het journaal (haber bülteni); de kennis (bilgi birikimi); de kermis (lunapark); de keukenkast (mutfak dolabı); de keus (seçim); de knoflook (sarımsak); de kom (kâse); het kwartier (on beş dakika); de lente (ilkbahar); het loon (ücret); de lunchpauze (öğle arası); de maagpijn (mide ağrısı); de magnetron (mikrodalga fırın); de mail (e-posta); de mobiel (cep telefonu); de neusspray (burun spreyi); het nieuwjaar (yılbaşı); het niveau (seviye); de ober (garson); het ondergoed (iç çamaşırı); het onderwerp (konu); het ontbijt (kahvaltı); het onweer (gök gürültülü fırtına); de oorpijn (kulak ağrısı); de openingstijd (açılış saati); de oplossing (çözüm); de oppas (bakıcı); het overhemd (gömlek); de pantoffel (terlik); de paracetamol (parasetamol); de plank (raf); de politieagent (polis memuru); de provincie (eyalet); de pudding (puding); het reisbureau (seyahat acentesi); het resultaat (sonuç); de rok (etek); de rommel (dağınıklık); de rookworst (füme sosis); de rug (sırt); de salade (salata); de salontafel (sehpa); de scheiding (boşanma); de slagroom (krem şanti); de specialist (uzman); het spoor (peron); het spreekuur (muayene saati); de stamppot (sebzeli patates ezmesi); het stof (toz); het succes (başarı); de tas (çanta); het terras (teras); de theelepel (çay kaşığı); de toets (sınav); het toneelstuk (tiyatro oyunu); de ui (soğan); de uitleg (açıklama); de vakantiedag (tatil günü); de verhuizing (taşınma); de verkoop (satış); de vertaling (çeviri); het vervoer (ulaşım); het voedsel (gıda); de voetbalclub (futbol kulübü); de voordeur (ön kapı); de voorstelling (gösteri); de waarde (değer); de was (çamaşır); de wasdroger (kurutma makinesi); de waterkoker (su ısıtıcısı); de wc (WC); de werknemer (işçi); de werktijd (çalışma saati); de wet (yasa); de zalf (merhem); de zuster (hemşire)
- **verb:** aandoen (açmak (cihaz)); aankleden (giyinmek); aanmelden (kayıt yaptırmak); afwassen (bulaşık yıkamak); beantwoorden (yanıtlamak); bedoelen (kastetmek); begroeten (selamlamak); beslissen (karar vermek); besparen (tasarruf etmek); bezorgen (teslim etmek); klaarmaken (hazırlamak); lunchen (öğle yemeği yemek); melden (bildirmek); onthouden (aklında tutmak); opendoen (kapıyı açmak); opvoeden ((çocuk) yetiştirmek); overgeven (kusmak); repareren (tamir etmek); schamen (utanmak); serveren (servis yapmak); smaken (tadı … olmak); terugbetalen (geri ödemek); trainen (antrenman yapmak); uitdoen (kapatmak (cihaz)); verstaan (duyup anlamak); verstoppen (saklamak); versturen (postalamak); vertrouwen (güvenmek); wandelen (yürüyüş yapmak); wisselen (bozdurmak, değiştirmek); zoenen (öpmek)

Decision F2: ____ 

## Released without the owner (ADR-019)
Turkish: noun-kopje. English: none. Three readers (the current text, both blind passes and DeepL) share a head word and no other question touches the row. To pull one back, write its id in the merge report.

## Spot-check result (T-225)
- Part C (20 Turkish words, text and article): ____ errors. Extension (30 words) needed: ____
- Part D (20 English words): ____ errors. Extension (30 words) needed: ____
