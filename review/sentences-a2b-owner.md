# Owner review — A2 cümleleri, ikinci yarı (T-382), 2026-11-25

Kararlar `review/sentences-a2b-owner.csv` dosyasının `decision` sütununa yazılır (içe aktarma ondan). Bu dosya aynı satırların okunaklı hali.

- **A bölümü (46 satır, işaretli):** "OK" (mevcut metin kalsın) ya da kendi düzeltilmiş metnin. "Öneri" sütunu benim önerim; kabul edersen "OK" yerine "Ö" yazabilirsin.
- **B bölümü (kontrol örneği, dil başına 20 satır):** doğruysa "✓", yanlışsa "✗" ve doğrusunu yaz. Tek hata varsa 30 satır daha eklenir (liste `review/sentences-a2b-spot-<dil>.txt`, tohum 20261125); iki hata varsa o dilin içe aktarması durur.
- **C bölümü:** çok genel cümle çerçeveleri (çeldirici yok denecek kadar zor); metin değişmedi, yeniden yazma önerisi var.
- Boş satır = karar yok.
- Ön durum: iki kör okuma sonrası TR 460 kabul / 34 işaretli, EN 482 / 12. Kör okuyucu metinleri bu worktree'de yok; "Öneri" sütunu işaret nedenine ve kelime listesine dayanır.
- Çeldiriciler: bağımsız kontrolde 100 çeldirici (63 uyar, 37 zayıf) elle değiştirildi; cümleler ve çeviriler dokunulmadı. Kalan zayıf çerçeveler C bölümünde.
- Not (jas): TR "mont", EN "coat" için A bölümündeki 6 satır birlikte değiştirilmeli; EN tarafında bu cümleler şu an "jacket" (işaretli değil, öneri: coat): noun-warenhuis, noun-waslijn, verb-houden (EN "jacket"), verb-kiezen, verb-kosten.

## A — İşaretli satırlar (46)

| # | Id | Dil | Felemenkçe | Mevcut | Öneri | Not | Karar |
|---|---|---|---|---|---|---|---|
| A1 | noun-opleiding | TR | Zij volgt een opleiding bij de politie. | Polis teşkilatında eğitim alıyor. | (OK) | Okuyucular "eğitim görüyor/alıyor" arasında ayrıldı; "close". | |
| A2 | noun-pad | TR | Dit pad gaat naar het strand. | Bu patika plaja gidiyor. | (OK) | pad = patika; okuyucular "yol" yazmış olabilir. | |
| A3 | noun-partner | TR | Mijn partner werkt vandaag thuis. | Partnerim bugün evden çalışıyor. | (OK) | partner = partner; "eş" daha dar (echtgenoot/-ote). | |
| A4 | noun-pech | TR | Ik heb pech met mijn auto. | Arabamda bir aksilik var. | Arabamla ilgili şanssızlık yaşıyorum. | "aksilik" Felemenkçe "pech" için dar; "şanssızlık" daha yakın. | |
| A5 | noun-pen | TR | Mag ik jouw pen lenen? | Tükenmez kalemini ödünç alabilir miyim? | Kalemini ödünç alabilir miyim? | "tükenmez kalem" ek bilgi; liste: pen = tükenmez kalem, bu yüzden (OK) de olur. | |
| A6 | noun-peper | TR | Wil je peper op je soep? | Çorbana karabiber ister misin? | (OK) | karabiber = peper (biber = paprika). | |
| A7 | noun-pet | TR | Hij draagt een rode pet in de zon. | Güneşte kırmızı bir kasket takıyor. | (OK) | kasket = pet; "şapka" = hoed. | |
| A8 | noun-rijst | TR | Wij eten rijst en kip. | Pirinç ve tavuk yiyoruz. | (OK) | pirinç = rijst (pilav pişmiş hali). | |
| A9 | noun-route | TR | De route naar het station is lang. | Istasyona giden güzergâh uzun. | (OK) | güzergâh = route; "yol" = weg. | |
| A10 | noun-slaapkamer | TR | Mijn slaapkamer is klein maar gezellig. | Yatak odam küçük ama samimi. | Yatak odam küçük ama şirin. | gezellig için "samimi" kişiler içindir; oda için "şirin/rahat". | |
| A11 | noun-som | TR | Deze som is te moeilijk voor mij. | Bu hesap problemi benim için çok zor. | (OK) | som = hesap problemi (toplama/çıkarma). | |
| A12 | noun-studie | TR | Mijn studie duurt vier jaar. | Öğrenimim dört yıl sürüyor. | (OK) | studie = öğrenim; opleiding = eğitim. | |
| A13 | noun-tiener | TR | De tiener luistert graag naar muziek. | Yeniyetme müzik dinlemeyi seviyor. | (OK) | tiener = yeniyetme; "genç" daha geniş. | |
| A14 | noun-tocht | TR | Na de tocht door het bos ben ik moe. | Ormandaki geziden sonra yorgunum. | (OK) | tocht = doğada gezi. | |
| A15 | noun-verpleger | TR | De verpleger helpt de patiënt in het ziekenhuis. | Erkek hemşire hastanede hastaya yardım ediyor. | (OK) | verpleger = erkek hemşire; verpleegster ayrı kelime. | |
| A16 | noun-vest | TR | Ik draag een vest over mijn hemd. | Gömleğimin üstüne hırka giyiyorum. | (OK) | vest = hırka (yelek = bodywarmer). | |
| A17 | noun-warenhuis | TR | Wij kopen een jas in het warenhuis. | Büyük mağazadan bir ceket alıyoruz. | Büyük mağazadan bir mont alıyoruz. | jas = "mont" tutarlılığı (aşağıdaki not). | |
| A18 | noun-waslijn | TR | De jas hangt aan de waslijn. | Ceket çamaşır ipinde asılı. | Mont çamaşır ipinde asılı. | jas = "mont" tutarlılığı. | |
| A19 | verb-appen | TR | Ik app mijn moeder elke dag. | Annemi her gün mesaj atıyorum. | Anneme her gün mesaj atıyorum. | "mesaj atmak" ile yönelme hali: Anneme (Annemi değil). | |
| A20 | verb-bekijken | TR | Wij willen het huis nog bekijken. | Evi bir de incelemek istiyoruz. | Evi hâlâ incelemek istiyoruz. | "bir de" Felemenkçede yok; "nog" = hâlâ. | |
| A21 | verb-bespreken | TR | Wij bespreken het nieuws in de klas. | Haberleri sınıfta görüşüyoruz. | Haberleri sınıfta tartışıyoruz. | bespreken = görüşmek/tartışmak; "tartışıyoruz" okuyucularla uyumlu. | |
| A22 | verb-chatten | TR | Ik wil met mijn vriend chatten. | Arkadaşımla mesajlaşmak istiyorum. | (OK) | appen/chatten ikisi de "mesajlaşmak"; appen = "mesaj atmak", chatten = "mesajlaşmak" kalırsa ayrışır. | |
| A23 | verb-feliciteren | TR | Ik wil jou met je verjaardag feliciteren. | Doğum günün için seni tebrik etmek istiyorum. | (OK) | feliciteren = tebrik etmek (kutlamak = vieren). | |
| A24 | verb-houden | TR | Wil je mijn jas houden? | Ceketimi tutar mısın? | Montumu tutar mısın? | jas = "mont" tutarlılığı. | |
| A25 | verb-kiezen | TR | Ik wil een nieuwe jas kiezen. | Yeni bir ceket seçmek istiyorum. | Yeni bir mont seçmek istiyorum. | jas = "mont" tutarlılığı. | |
| A26 | verb-knijpen | TR | Het kind wil mijn arm knijpen. | Çocuk kolumu sıkmak istiyor. | Çocuk kolumu çimdiklemek istiyor. | knijpen iki anlamlı (sıkmak/çimdiklemek); çocuk için "çimdiklemek" daha doğal. EN ile birlikte. | |
| A27 | verb-kosten | TR | Deze jas kost veertig euro. | Bu ceket kırk euro tutuyor. | Bu mont kırk euro tutuyor. | jas = "mont" tutarlılığı. | |
| A28 | verb-meedoen | TR | Wij willen aan de wedstrijd meedoen. | Maça katılmak istiyoruz. | (OK) | meedoen = katılmak. | |
| A29 | verb-ontspannen | TR | Na het werk wil ik ontspannen. | İşten sonra gevşemek istiyorum. | (OK) | ontspannen = gevşemek; çerçeve genel (bkz. C). | |
| A30 | verb-overleggen | TR | Ik moet met mijn baas overleggen. | Patronuma danışmam gerekiyor. | (OK) | overleggen = danışmak (görüşmek = bespreken). | |
| A31 | verb-schrikken | TR | De hond zal van het geluid schrikken. | Köpek sesten irkilecek. | (OK) | schrikken = irkilmek. | |
| A32 | verb-sturen | TR | Ik wil mijn oma een kaart sturen. | Büyükanneme bir kart göndermek istiyorum. | (OK) | sturen = göndermek. | |
| A33 | verb-trappen | TR | Hij wil de bal hard trappen. | Topa sert tekme atmak istiyor. | (OK) | trappen = tekme atmak. | |
| A34 | verb-twijfelen | TR | Ik twijfel tussen de rode en blauwe jas. | Kırmızı ve mavi ceket arasında kararsız kalıyorum. | Kırmızı ve mavi mont arasında kararsız kalıyorum. | jas = "mont" tutarlılığı. | |
| A35 | noun-plaats | EN | Deze plaats is nog vrij. | This place is still free. | (OK) ya da "This seat is still free." | plaats = place/seat; TR "yer" ile "place" uyumlu. | |
| A36 | noun-reactie | EN | Ik wacht op haar reactie op mijn brief. | I am waiting for her reaction to my letter. | I am waiting for her response to my letter. | "reaction" mektup için garip; "response/reply". | |
| A37 | noun-tocht | EN | Na de tocht door het bos ben ik moe. | After the trip through the forest I am tired. | (OK) | tocht = trip/outing in nature. | |
| A38 | noun-verkoper | EN | De verkoper helpt de klant in de winkel. | The seller helps the customer in the shop. | The salesman helps the customer in the shop. | "seller" mağaza bağlamında az doğal; "salesman". | |
| A39 | noun-verpleger | EN | De verpleger helpt de patiënt in het ziekenhuis. | The male nurse helps the patient in the hospital. | (OK, "male nurse" kalsın) | verpleger = erkek hemşire. | |
| A40 | verb-bekijken | EN | Wij willen het huis nog bekijken. | We want to look at the house again. | We still want to look at the house. | "again" Felemenkçede yok; "nog" = still. TR ile birlikte. | |
| A41 | verb-knijpen | EN | Het kind wil mijn arm knijpen. | The child wants to squeeze my arm. | The child wants to pinch my arm. | TR ile birlikte (çimdiklemek). | |
| A42 | verb-lukken | EN | Het lukt mij niet. | I cannot manage it. | I cannot do it. | "manage it" belirsiz; TR "Başaramıyorum" = I cannot manage/do it. (OK) de olur. | |
| A43 | verb-opblazen | EN | Ik wil de bal opblazen. | I want to inflate the ball. | (OK) | opblazen = inflate (blow up = patlatmak). | |
| A44 | verb-reageren | EN | Hij wil niet op mijn brief reageren. | He does not want to react to my letter. | He does not want to respond to my letter. | "react to" mektup için garip. | |
| A45 | verb-twijfelen | EN | Ik twijfel tussen de rode en blauwe jas. | I am hesitating between the red and the blue jacket. | I am unsure between the red and the blue coat. | jas = "coat" tutarlılığı (A2a EN "coat"). | |
| A46 | verb-verlengen | EN | Ik wil mijn kaart verlengen. | I want to extend my card. | (OK) | verlengen = extend (renew = vernieuwen); TR "uzatmak" ile uyumlu. | |

## C — Genel çerçeveler, yeniden yazma önerisi

| # | Id | Mevcut | Öneri (NL) | Neden | Karar |
|---|---|---|---|---|---|
| C1 | noun-stroom | Er is geen stroom in de keuken. | Zonder stroom werkt de computer niet. | "Er is geen X in de keuken" her isimle doğru; yeni çerçevede tek cevap var. | |
| C2 | noun-verleden | Ik denk vaak aan het verleden. | In het verleden was het leven zwaar. | "Ik denk aan het X" her isimle doğru. | |
| C3 | verb-thuisblijven | Ik wil vandaag thuisblijven. | De kinderen mogen niet naar buiten en moeten thuisblijven. | "Ik wil vandaag X" her fiille doğru; yeni çerçeve daha dar, ama yine de zayıf. | |
| C4 | verb-sporten | Mijn dochter wil elke dag sporten. | (öneri yok) | "wil/willen X" çerçevesi; temiz çeldirici kümesi yok. Kalsın ya da kelimeyi bırak. | |
| C5 | verb-vechten | De jongens willen niet vechten. | (öneri yok) | "wil/willen X" çerçevesi; temiz çeldirici kümesi yok. Kalsın ya da kelimeyi bırak. | |
| C6 | verb-liegen | Mijn zoon wil niet liegen. | (öneri yok) | "wil/willen X" çerçevesi; temiz çeldirici kümesi yok. Kalsın ya da kelimeyi bırak. | |
| C7 | verb-ontspannen | Na het werk wil ik ontspannen. | (öneri yok) | "wil/willen X" çerçevesi; temiz çeldirici kümesi yok. Kalsın ya da kelimeyi bırak. | |

## B1 — Kontrol örneği TR (20 satır)

| # | Id | Felemenkçe | TR metin | ✓/✗ |
|---|---|---|---|---|
| B1.1 | adj-gevaarlijk | Deze weg is heel gevaarlijk. | Bu yol çok tehlikeli. | |
| B1.2 | adj-dankbaar | Ik ben je heel dankbaar. | Sana çok minnettarım. | |
| B1.3 | adj-veilig | Het is hier erg veilig. | Burası çok güvenli. | |
| B1.4 | verb-ontvangen | Wij ontvangen elke maand een brief. | Her ay bir mektup teslim alıyoruz. | |
| B1.5 | verb-afgeven | Je moet je sleutel hier afgeven. | Anahtarını buraya elden teslim etmelisin. | |
| B1.6 | noun-kopje | Ik drink een kopje thee. | Bir fincan çay içiyorum. | |
| B1.7 | noun-walvis | De walvis zwemt in de zee. | Balina denizde yüzüyor. | |
| B1.8 | noun-contact | Ik heb veel contact met mijn buur. | Komşumla çok iletişimim var. | |
| B1.9 | adj-levend | Wij zien een levende vis. | Yaşayan bir balık görüyoruz. | |
| B1.10 | noun-idee | Dat is een goed idee. | Bu iyi bir fikir. | |
| B1.11 | noun-vertraging | Het vliegtuig heeft twee uur vertraging. | Uçağın iki saat rötarı var. | |
| B1.12 | noun-schort | De kok draagt een wit schort. | Aşçı beyaz bir önlük giyiyor. | |
| B1.13 | noun-verdriet | Haar verdriet is groot. | Kederi büyük. | |
| B1.14 | noun-onzin | Dat is echt onzin. | Bu gerçekten saçmalık. | |
| B1.15 | verb-weigeren | Je kunt een cadeau weigeren. | Bir hediyeyi reddedebilirsin. | |
| B1.16 | noun-envelop | Ik doe de brief in een envelop. | Mektubu bir zarfa koyuyorum. | |
| B1.17 | verb-verzorgen | De arts moet de patiënt verzorgen. | Doktor hastanın bakımını yapmalı. | |
| B1.18 | noun-dolfijn | Een dolfijn zwemt in de zee. | Bir yunus denizde yüzüyor. | |
| B1.19 | adj-tijdelijk | Dit werk is tijdelijk. | Bu iş geçici. | |
| B1.20 | noun-insect | Ik zie een insect op de tafel. | Masanın üstünde bir böcek görüyorum. | |

## B2 — Kontrol örneği EN (20 satır)

| # | Id | Felemenkçe | EN metin | ✓/✗ |
|---|---|---|---|---|
| B2.1 | noun-punt | Voor het goede antwoord krijg je een punt. | You get one point for the right answer. | |
| B2.2 | noun-hoofdstuk | Dit hoofdstuk is erg lang. | This chapter is very long. | |
| B2.3 | noun-uitgang | De uitgang is naast de lift. | The exit is next to the lift. | |
| B2.4 | verb-opnemen | Ik kan de telefoon niet opnemen. | I cannot answer the phone. | |
| B2.5 | noun-werkgever | Mijn werkgever is erg vriendelijk. | My employer is very friendly. | |
| B2.6 | noun-zanger | De zanger is erg beroemd. | The singer is very famous. | |
| B2.7 | noun-snelheid | De snelheid van de auto is te hoog. | The speed of the car is too high. | |
| B2.8 | verb-gebruiken | Ik gebruik mijn telefoon als klok. | I use my phone as a clock. | |
| B2.9 | noun-gedicht | Ik lees een mooi gedicht. | I read a beautiful poem. | |
| B2.10 | verb-hoesten | Hij hoest vaak in de nacht. | He often coughs at night. | |
| B2.11 | noun-pakket | Het pakket komt met de post. | The parcel comes by post. | |
| B2.12 | noun-hoogte | De hoogte van de toren is veertig meter. | The height of the tower is forty metres. | |
| B2.13 | noun-trainer | De trainer roept naar de jongens. | The coach shouts at the boys. | |
| B2.14 | verb-lenen | Mag ik jouw fiets lenen? | May I borrow your bike? | |
| B2.15 | noun-gebouw | Dit gebouw is erg oud. | This building is very old. | |
| B2.16 | noun-suiker | Ik doe geen suiker in mijn thee. | I do not put sugar in my tea. | |
| B2.17 | noun-advies | Ik vraag mijn moeder om advies. | I ask my mother for advice. | |
| B2.18 | verb-parkeren | Ik wil de auto hier parkeren. | I want to park the car here. | |
| B2.19 | verb-redden | De brandweer kan het kind redden. | The fire brigade can save the child. | |
| B2.20 | noun-duin | Achter het strand ligt een duin. | There is a dune behind the beach. | |
