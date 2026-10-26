# Owner review — B2, batch 1: decisions, 2026-10-26

Her satırın son sütununa kararını yaz:
- **Karar:** "OK" (mevcut kalsın), "Ö" (öneriyi al) ya da kendi metnin. Öneri "keep" olan satırlarda OK ve Ö aynı şeydir. Seviye önerilerinde "Ö" kelimeyi B2'den çıkarır.
- **Blok kararları (A1, L1, L2) tek karardır:** blokta bir istisna varsa "Ö, hariç: kelime, kelime" yaz (A1 için "OK, hariç: ..." ). Bloktaki kelimeler satır başına tek tek açılmaz.
- **J satırları Türkçe ve İngilizceyi birlikte karara bağlar;** İngilizce, seçtiğin Türkçe anlamı izler (ya da tersi, "Ö" öneriyi alır). Aynı şekilde S1 (hassas kelime) iki dil için tek karardır.
- **N satırları yakın anlamlı çiftlerdir:** iki kelime tek kararla gider; kendi metnin varsa iki kelime için de yaz.
- **Boş bırakılan satır karar verilmemiş sayılır.** Spot kontrol (C ve D bölümleri) ayrı dosyada: `review/owner-b2-2.md`.

Aynı satırlar `review/owner-b2-1.csv` dosyasında da var; kararlar oradan içe aktarılacak (T-164).

Source: T-161 (content PR #75: `review/b2.findings.csv`, `review/roundtrip-b2/result.csv`) and T-162 (content PR #74:
`review/en/b2.findings.csv`, `review/roundtrip-b2-en/result.csv`). Nothing in `data/` was changed. Only flagged rows are
decided here; there is no full read of the 1,575 words.

**Machine translated by DeepL, advisory only:** the readings in the "Why" column come from the `deepl` column of the two result
sheets (ADR-015; Dutch lemma and article only sent). They change no suggestion and no verdict.
**Three-reader release (ADR-019):** `npm run three-readers` was re-run on 2026-10-26 with both findings files on `main`. The PM pulled
back noun-vakantiegeld (the Turkish finding says the sense is wrong) and adj-dement (loaded English word); noun-wachtgeld
no longer releases because its Turkish finding is a question too. The only row released without the owner is **adj-organisch** (English); the owner can pull it back in the merge report.

## Counts
51 decisions cover all 56 Turkish and 30 English `owner` rows (86 word-language rows; some words are in both languages).

| Group | Decisions | Turkish rows | English rows |
|---|---|---|---|
| Blocks A1, L1, L2 | 3 | 28 | 0 |
| T: Turkish single rows | 19 | 19 | 0 |
| E: English single rows | 16 | 0 | 16 |
| J: Turkish and English together | 4 | 4 | 4 |
| S: sensitive words | 2 | 1 | 2 |
| N: near-synonym pairs and duplicates of B1 words | 7 | 4 | 8 |
| **Total** | **51** | **56** | **30** |

## Blocks — one decision each
| # | Words (Dutch, TR, EN) | Suggested | Why | Decision |
|---|-----------------------|-----------|-----|----------|
| A1 | het portfolio (portföy, portfolio); het incasso (otomatik tahsilat, direct debit); het rookverbod (sigara yasağı, smoking ban); de strafrechter (ceza hâkimi, criminal judge); de reuma (romatizma, rheumatism); het sjabloon (şablon, template); het hiaat (eksik kalan yer, gap (lacuna)) | article: keep the stored article (7 rows) | b1-pool compared our article with Wiktionary and found a difference; the Woordenlijst (gender only) confirms the stored article for all 7 (portfolio, incasso, hiaat, sjabloon and reuma take both; rookverbod is het, strafrechter is de, and Wiktionary gets those two compounds wrong). Editor recommends OK. One decision for all 7 rows. Machine translated by DeepL, advisory only: TR "portföy, tahsilat, sigara içme yasağı, ceza mahkemesi hakimi, romatizma, şablon, boşluk". | |
| L1 | de schoonmaker (temizlikçi, cleaner (person)); de zakenreis (iş seyahati, business trip); de oogarts (göz doktoru, eye doctor); de kinderarts (çocuk doktoru, paediatrician); de spierpijn (kas ağrısı, muscle ache); de profielfoto (profil fotoğrafı, profile picture); de bijles (özel ders, private lessons); de songtekst (şarkı sözü, lyrics); de loodgieter (tesisatçı, plumber); het nachtleven (gece hayatı, nightlife); de elektricien (elektrikçi, electrician); de rijschool (sürücü kursu, driving school); de stiefvader (üvey baba, stepfather); de stiefmoeder (üvey anne, stepmother); ijskoud (buz gibi, ice-cold); piepklein (minicik, tiny) | level: remove from B2 (below B2) | Too easy for B2: transparent compounds and A2/B1 everyday words (T-159 list). One decision for all 16 rows: "Ö" removes all 16 from B2, "OK" keeps all, or "Ö, hariç: kelime, kelime". Machine translated by DeepL, advisory only: TR "temizlik görevlisi, iş seyahati, göz doktoru, çocuk doktoru, kas ağrısı, profil fotoğrafı, özel ders, şarkı sözleri, tesisatçı, gece hayatı, elektrikçi, sürücü kursu, üvey baba, üvey anne, buz gibi, minicik". | |
| L2 | sommeren (ihtar etmek, to summon (order)); de curatele (vesayet, guardianship (legal)); de boedel (tereke, estate (of the deceased)); aanhangig (görülmekte olan (dava), pending (in court)); het beding (sözleşme şartı, clause (condition)) | level: C1 (remove from B2) | Specialised legal terms that are rare outside legal texts. One decision for all 5 rows: "Ö" removes all 5 from B2 (to C1), "OK" keeps all, or "Ö, hariç: kelime". Machine translated by DeepL, advisory only: TR "çağırmak, vesayet, miras, dava aşamasında, hüküm". | |

## Part T — Turkish: words to decide (19 rows)
| # | Dutch | English | Current TR | Suggested | Why | Decision |
|---|-------|---------|------------|-----------|-----|----------|
| T1 | de roeping | calling (vocation) | içten gelen çağrı | meslek aşkı | "içten gelen çağrı" is a calque; roeping is a vocation (zijn roeping volgen), in Turkish "meslek aşkı". Machine translated by DeepL, advisory only: TR "meslek". | |
| T2 | het dagdeel | part of the day | gün dilimi | günün bir bölümü (sabah, öğleden sonra) | "gün dilimi" is unclear (time zone-like); a dagdeel is a morning, afternoon or evening block (childcare, work). Machine translated by DeepL, advisory only: TR "günün o kısmı". | |
| T3 | het vakantiegeld | holiday pay | tatil parası | tatil ikramiyesi | Vakantiegeld is the holiday allowance an employer pays (about 8% of the salary), not money for a holiday. Machine translated by DeepL, advisory only: TR "tatil parası". | |
| T4 | de afdracht | payment (of dues) | pay ödemesi | (vergi, prim) ödemesi | "pay ödemesi" (share payment) is unclear; afdracht is paying over tax or premiums, as B2 afdragen "(vergi, prim) yatırmak". Machine translated by DeepL, advisory only: TR "ödeme". | |
| T5 | geoorloofd | permitted | yasak olmayan | izin verilen | A paraphrase by negation; geoorloofd is "permitted", and its B2 antonym ongeoorloofd is "izinsiz". Machine translated by DeepL, advisory only: TR "meşru". | |
| T6 | het alibi | alibi | suç anı mazereti | başka yerde bulunma kanıtı | "mazeret" is an excuse; an alibi is proof of being elsewhere at the time of the crime. Machine translated by DeepL, advisory only: TR "mazeret". | |
| T7 | onwettig | unlawful | kanunsuz | kanuna aykırı | "kanunsuz" reads as lawless (a lawless place, an outlaw); onwettig is unlawful. Machine translated by DeepL, advisory only: TR "yasa dışı". | |
| T8 | de mantelzorg | informal care | gayriresmî bakım (aile) | aile içi bakım (gönüllü) | "gayriresmî bakım" is a calque; mantelzorg is unpaid care for an ill or old relative or friend. Machine translated by DeepL, advisory only: TR "gönüllü bakım". | |
| T9 | tendentieus | biased (slanted) | yönlendirici | taraflı (haber) | "yönlendirici" means guiding; tendentieus is biased (reporting). Machine translated by DeepL, advisory only: TR "önyargılı". | |
| T10 | het wederhoor | right of reply | karşı tarafı dinleme | article: de | Woordenlijst: zelfstandig naamwoord (m), so "de wederhoor"; Wiktionary also gives de (b1-pool differ). Machine translated by DeepL, advisory only: TR "karşı tarafın görüşünün dinlenmesi". | |
| T11 | de huisman | house husband | ev işlerine bakan erkek | ev erkeği | A paraphrase; Turkish says "ev erkeği" (after "ev kadını") for a stay-at-home husband. Machine translated by DeepL, advisory only: TR "ev erkeği". | |
| T12 | de halfzus | half-sister | yarı kardeş (kız) | üvey kız kardeş (anne/baba bir) | "yarı kardeş" is not Turkish; a half-sister is "anne bir / baba bir kız kardeş", in everyday speech "üvey kız kardeş". Machine translated by DeepL, advisory only: TR "üvey kız kardeş". | |
| T13 | ongehoord | outrageous (unheard-of) | işitilmemiş | akıl almaz (rezalet) | Literal; ongehoord is outrageous or unheard-of ("dat is ongehoord!"), "işitilmemiş" reads as "not heard". "kabul edilemez" is B1 onacceptabel. Machine translated by DeepL, advisory only: TR "duyulmamış". | |
| T14 | verhullen | to conceal | örtbas etmek | perdelemek | "örtbas etmek" (cover up a scandal) is the sense of B2 verdoezelen "üstünü örtmek"; verhullen is to veil or disguise. Machine translated by DeepL, advisory only: TR "gizlemek". | |
| T15 | voorbarig | premature | aceleci (erken) | vakitsiz (erken) | "aceleci" describes a person in a hurry; voorbarig is a premature conclusion or decision. Machine translated by DeepL, advisory only: TR "aceleci". | |
| T16 | de echtheid | authenticity | orijinallik | sahicilik | "orijinallik" is mostly originality (creativity); echtheid is authenticity (of a painting, a document). Machine translated by DeepL, advisory only: TR "gerçeklik". | |
| T17 | tekenend | characteristic (telling) | belirleyici (tipik) | (bir durumun) tipik göstergesi | "belirleyici" means decisive; tekenend is "telling, typical of" (tekenend voor). Machine translated by DeepL, advisory only: TR "belirleyici". | |
| T18 | doorhakken | to cut (the knot) | kesip atmak | kestirip atmak (karar) | B2 use is the fixed phrase "de knoop doorhakken" (to make the decision); "kesip atmak" reads as cutting something off. Machine translated by DeepL, advisory only: TR "karar vermek". | |
| T19 | aantasten | to affect (damage) | zedelemek | (sağlığa, itibara) zarar vermek | "zedelemek" covers honour and reputation only; aantasten is also said of health, privacy and nature. Machine translated by DeepL, advisory only: TR "zarar vermek". | |

## Part E — English: words to decide (16 rows)
| # | Dutch | Turkish | Current EN | Suggested EN | Why | Decision |
|---|-------|---------|------------|--------------|-----|----------|
| E1 | de uitvoerder | uygulayıcı | executor (of a task) | implementer (of a task) | "executor" first reads as the executor of a will (Dutch executeur). The Turkish "uygulayıcı" is implementer. Machine translated by DeepL, advisory only: EN "the contractor". | |
| E2 | meedenken | fikir katmak | to think along | to contribute ideas (think along) | "to think along" is a calque of the Dutch; it is not idiomatic English. Machine translated by DeepL, advisory only: EN "contribute ideas". | |
| E3 | de vennootschap | ortaklık şirketi | partnership (company) | company (legal entity) | vennootschap is the general word for a company form (bv, nv); "partnership" is only the vof/cv type. The Turkish "ortaklık şirketi" narrows it the same way (T-161). Machine translated by DeepL, advisory only: EN "the company". | |
| E4 | de afzetmarkt | satış pazarı | outlet (market) | sales market | "outlet" reads as a shop, and B2 uitlaatklep is "outlet (for feelings)". afzetmarkt is the market a product is sold in. Machine translated by DeepL, advisory only: EN "the sales market". | |
| E5 | de surveillance | devriye | surveillance | patrol (police) | False friend: Dutch surveillance is mainly police patrolling (surveillancewagen) or invigilation; English "surveillance" is covert monitoring (Dutch observatie). The Turkish has "devriye" (patrol). Machine translated by DeepL, advisory only: EN "surveillance". | |
| E6 | de overspanning | sinir yorgunluğu | overstrain (burnout) | nervous exhaustion (stress) | "overstrain" is not idiomatic English. The hint "burnout" is the Dutch word burn-out, a separate and stronger condition. Machine translated by DeepL, advisory only: EN "the span". | |
| E7 | ziekelijk | hastalıklı | morbid (unhealthy) | sickly (unhealthy) | Everyday English "morbid" means gloomy or fixated on death (Dutch morbide). ziekelijk is sickly, or pathological (ziekelijk jaloers). Machine translated by DeepL, advisory only: EN "sickly". | |
| E8 | afmelden | üyelikten çıkmak | to log out | to unsubscribe (sign off) | The two languages give different senses: EN "to log out" (Dutch uitloggen), TR "üyelikten çıkmak" (unsubscribe). afmelden is signing off or cancelling (voor een nieuwsbrief, voor een les). Owner picks one; the other language follows. Machine translated by DeepL, advisory only: EN "unsubscribe". | |
| E9 | de vorming | kişisel gelişim | formation (education) | personal development (education) | "formation" in the sense of education is rare in English. The Turkish has "kişisel gelişim". Machine translated by DeepL, advisory only: EN "the formation". | |
| E10 | de voertaal | eğitim dili | working language | language of instruction | Round trip close/close: both blind passes read language (medium) of instruction, as the Turkish "eğitim dili". In Education and research that is the B2 sense; "working language" is the sense in an organisation. Machine translated by DeepL, advisory only: EN "the language of instruction". | |
| E11 | afzijdig | uzak duran | aloof (uninvolved) | uninvolved (on the sidelines) | afzijdig is staying out of something (zich afzijdig houden), not a cold manner. "aloof" is the prompt of B2 afstandelijk. Machine translated by DeepL, advisory only: EN "impartial". | |
| E12 | lastigvallen | rahatsız etmek (birini) | to harass | to bother (pester) | Round trip close/close: both blind passes read "to bother", as the Turkish "rahatsız etmek". Everyday lastigvallen is to bother or pester (mag ik u even lastigvallen?); "to harass" is only the stronger sense. Machine translated by DeepL, advisory only: EN "harass". | |
| E13 | schijnheilig | ikiyüzlü | sanctimonious | hypocritical (two-faced) | Round trip close/close: both blind passes read hypocritical or two-faced, as the Turkish "ikiyüzlü". "sanctimonious" is narrower (a show of piety) and above B2 in English. Machine translated by DeepL, advisory only: EN "hypocritical". | |
| E14 | de aansteller | numaracı | show-off (drama queen) | drama queen (poser) | An aansteller exaggerates or puts on an act. "show-off" is opschepper, and B2 pronken is "to show off". Machine translated by DeepL, advisory only: EN "the show-off". | |
| E15 | afwijkend | normalden sapan | deviant (different) | differing (deviating) | "deviant" suggests socially or sexually abnormal behaviour; afwijkend is neutral (een afwijkende mening). Machine translated by DeepL, advisory only: EN "different". | |
| E16 | ondervangen | önceden önlem almak | to overcome (cover for) | to address (a problem in advance) | ondervangen is to forestall or remedy a problem (TR "önceden önlem almak"). "to overcome" is the prompt of B1 overwinnen. Machine translated by DeepL, advisory only: EN "overcome". | |

## Part J — Turkish and English together (4 rows)
Both languages disagreed in the round trip or have a finding each. One decision per word.

| # | Dutch | Current TR | Current EN | Suggested | Why | Decision |
|---|-------|------------|------------|-----------|-----|----------|
| J1 | afschrijven | hesaptan çekmek | to write off | TR: keep "hesaptan çekmek" (debit). EN: "to debit (from an account)" | Round trip: mismatch in both languages. The Turkish has the debit sense (het bedrag wordt afgeschreven); the English "to write off" has the write-off/depreciate sense, which the blind passes also read ("silmek (borç)", "amorti etmek"). Both are B2 senses; one decision for both languages. Editor recommends keeping the Turkish sense and aligning the English. Machine translated by DeepL, advisory only: TR "amortize etmek", EN "write off". | |
| J2 | opwaarderen | (bakiye) yüklemek | to upgrade | TR: keep "(bakiye) yüklemek" (top up). EN: "to top up (credit)" | Round trip: mismatch in both languages. The Turkish has the top-up sense (je ov-chipkaart opwaarderen); the English "to upgrade" has the software sense, which B2 upgrade "yükseltme (sürüm)" already covers. One decision for both languages. Editor recommends keeping the Turkish sense and aligning the English. Machine translated by DeepL, advisory only: TR "kontör yükleme", EN "top up". | |
| J3 | aantekenen | kayda geçirmek | to lodge (an appeal) | TR: "(itiraz) kaydettirmek". EN: keep "to lodge (an appeal)" | Round trip: mismatch in both languages. The B2 use is bezwaar/beroep aantekenen (EN pivot "to lodge (an appeal)", NL reading "itiraz etmek"); the Turkish "kayda geçirmek" (to note down) loses it. B2 aangetekend "taahhütlü" is a separate word. Editor recommends aligning the Turkish to the English. Machine translated by DeepL, advisory only: TR "not etmek", EN "register". | |
| J4 | het wachtgeld | bekleme ödeneği | redundancy pay | TR: "görevden ayrılma ödeneği". EN: "severance benefit (public office)" | Wachtgeld is the running benefit a civil servant or politician gets after leaving office. Turkish "bekleme ödeneği" is a calque (round trip close/close); English "redundancy pay" reads as a lump sum (ontslagvergoeding). One decision for both languages. Machine translated by DeepL, advisory only: TR "bekleme ödeneği", EN "the redundancy pay". | |

## Part S — sensitive words (2 rows)
| # | Dutch | Current TR | Current EN | Suggested | Why | Decision |
|---|-------|------------|------------|-----------|-----|----------|
| S1 | de loverboy | duygusal tuzakçı (fuhuş) | loverboy (pimp) | TR: "aşk tuzağıyla fuhuşa sürükleyen". EN: "pimp (who grooms girls)". Or write "çıkar" to remove the word from B2 | Sensitive word (sexual exploitation; on the T-158 list). Turkish "tuzakçı" is not in use; English "loverboy" means a male lover, so the head word misleads. The word is known from Dutch news and the B2 reading texts; whether it stays is the fit question. Both languages decided together. Machine translated by DeepL, advisory only: TR "aşk avcısı", EN "the loverboy". | |
| S2 | dement | demanslı | demented | EN: "with dementia" | Medical and sensitive. All three readers (both blind passes and DeepL) say "demented", so the Turkish "demanslı" is not in question; the editor flags the English: "demented" is dated as a medical word and used as an insult ("crazy"). Pulled back to the owner by the PM. Machine translated by DeepL, advisory only: EN "demented". | |

## Part N — near-synonym pairs and duplicates of B1 words (7 rows)
N1 to N4 are pairs of B2 words that share a prompt; the hint separates them. N5 to N7 are Turkish level questions about words that repeat a B1 word.

| # | Dutch | Current TR | Current EN | Suggested | Why | Decision |
|---|-------|------------|------------|-----------|-----|----------|
| N1 | werkbaar / uitvoerbaar | işe yarar / icra edilebilir | workable / workable (can be carried out) | uitvoerbaar EN: "practicable (can be carried out)"; werkbaar stays "workable" | Same head word "workable"; only the hint separates them (T-160 close pair). Round trip match for both. Machine translated by DeepL, advisory only: EN "workable / feasible". | |
| N2 | ongegrond / ongefundeerd | asılsız / dayanaksız | unfounded / unfounded (baseless) | ongegrond EN: "groundless"; ongefundeerd stays "unfounded (baseless)" | Synonym pair: both mean baseless and the hint does not separate them. "groundless" mirrors grond (T-160 close pair). Machine translated by DeepL, advisory only: EN "unfounded / unfounded". | |
| N3 | berucht / notoir | kötü şöhretli / herkesçe bilinen | notorious / notorious (well-known) | berucht EN: "infamous". notoir TR: "adı çıkmış" (and EN stays "notorious (well-known)") | Synonym pair: both are "well known for something bad" and the hint "(well-known)" does not separate them. notoir TR "herkesçe bilinen" is neutral, like bekend (round trip close/close; blinds "kötü şöhretli", "bilinen (kötü)"). Machine translated by DeepL, advisory only: TR "malum", EN "notorious / notorious". | |
| N4 | gehecht / hechten | bağlı (duygusal) / (önem) atfetmek | attached (fond) / to be attached (to) | hechten EN: "to attach (importance) to"; gehecht stays "attached (fond)" | Round trip: hechten mismatch in both passes (blinds "attach (importance)", "attach (value)"). The Turkish "(önem) atfetmek" is the attach-importance sense; the English "to be attached (to)" overlaps with gehecht. Machine translated by DeepL, advisory only: EN "attached / attach". | |
| N5 | voltijds | tam mesai | full-time (formal) | level: remove from B2 | Synonym of live fulltime "tam zamanlı"; "tam mesai" is a noun phrase for an adjective. Machine translated by DeepL, advisory only: TR "tam zamanlı". | |
| N6 | de leefstijl | yaşam biçimi | lifestyle (health habits) | level: remove from B2 | Variant of B1 levensstijl "yaşam tarzı"; kept apart only by wording (yaşam biçimi). Machine translated by DeepL, advisory only: TR "yaşam tarzı". | |
| N7 | de huizenmarkt | ev alım satım piyasası | property market | level: remove from B2 | Synonym of B1 woningmarkt "konut piyasası"; kept apart only by wording. Machine translated by DeepL, advisory only: TR "konut piyasası". | |
