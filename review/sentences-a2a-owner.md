# Owner review — A2 cümleleri, ilk yarı (T-381), 2026-11-24

Kararlar `review/sentences-a2a-owner.csv` dosyasının `decision` sütununa yazılır (içe aktarma ondan). Bu dosya aynı satırların okunaklı hali.

- **A bölümü (19 satır, işaretli):** "OK" (mevcut metin kalsın) ya da kendi düzeltilmiş metnin. "Öneri" sütunu benim önerim; kabul edersen "OK" yerine "Ö" yazabilirsin.
- **B bölümü (kontrol örneği, dil başına 20 satır):** doğruysa "✓", yanlışsa "✗" ve doğrusunu yaz. Tek hata varsa 30 satır daha eklenir (liste `review/sentences-a2a-spot-<dil>.txt`, tohum 20261124); iki hata varsa o dilin içe aktarması durur.
- Boş satır = karar yok.
- Bu sayfadaki hiçbir satır `reviewed` değil; ikili okuma sonucu: TR 482 kabul / 12 işaretli, EN 487 kabul / 7 işaretli. Kör okuyucu metinleri bu worktree'de yok, "Öneri" sütunu işaret nedenine ve kelime listesine dayanır.

## A — İşaretli satırlar (19)

| # | Id | Dil | Felemenkçe | Mevcut | Öneri | Not | Karar |
|---|---|---|---|---|---|---|---|
| A1 | adj-dubbel | TR | Mijn broer eet dubbel zo veel. | Kardeşim iki kat fazla yiyor. | Kardeşim iki katı kadar yiyor. | "iki kat fazla" 3 kat gibi okunabilir; "twice as much" = iki katı kadar. | |
| A2 | adj-eenzaam | TR | De oude vrouw is vaak eenzaam. | Yaşlı kadın sık sık çok yalnız. | Yaşlı kadın sık sık yalnız. | "çok" Felemenkçede yok (kelime başına eklenmiş); sadece "vaak eenzaam". | |
| A3 | adj-typisch | TR | Dit eten is typisch voor ons land. | Bu yemek ülkemiz için tipik. | (OK, "tipik" kalsın) | "tipik" standart karşılık; okuyucular başka sözcük yazdı. | |
| A4 | noun-berg | TR | Wij lopen de berg op. | Dağa doğru yürüyoruz. | Dağa yürüyoruz. | "doğru" Felemenkçede yok. | |
| A5 | noun-biet | TR | Zij kookt een biet in de pan. | O, tavada bir pancar pişiriyor. | O, tencerede bir pancar pişiriyor. | pan = tencere (tava değil; "kookt" = haşlıyor/pişiriyor). | |
| A6 | noun-cijfer | TR | Ik heb een goed cijfer voor de test. | Test için iyi bir notum var. | (OK, mevcut kalsın) | Felemenkçe şimdiki zaman ("Ik heb"); okuyucular geçmiş zaman yazmış olabilir, mevcut zaman doğru. | |
| A7 | noun-cirkel | TR | Een cirkel is rond. | Çember yuvarlak. | (OK) ya da "Daire yuvarlak." | cirkel = çember; okuyucular "daire" yazdı. Kelime listesi: çember. | |
| A8 | noun-gras | TR | De koe eet gras. | İnek çim yiyor. | İnek ot yiyor. | "çim" bahçe çimi; ineğin yediği "ot". | |
| A9 | noun-hitte | TR | Bij hitte drink ik veel water. | Aşırı sıcakta çok su içiyorum. | (OK, "Aşırı sıcakta" kalsın) | kelime listesi: aşırı sıcak. | |
| A10 | noun-koek | TR | Ik eet een koek bij de thee. | Çayla birlikte bir kurabiye yiyorum. | (OK) koek = kurabiye; koekje = bisküvi | Okuyucular koek/koekje ikilisini ters çevirdi; metinde koek "kurabiye", koekje "bisküvi" kalırsa kelime listesiyle uyumlu. Tersini istersen iki satırı birlikte değiştir. | |
| A11 | noun-lening | TR | Ik betaal mijn lening elke maand. | Borcumu her ay ödüyorum. | Kredimi her ay ödüyorum. | lening = kredi (borç daha genel). | |
| A12 | noun-nicht | TR | Mijn nicht woont in een groot huis. | Kız kuzenim büyük bir evde oturuyor. | (OK, "Kız kuzenim" kalsın) | Cümlede yaş/bağlam yok; yeğen için ek bilgi gerekirdi. | |
| A13 | noun-bedrag | EN | Het bedrag op de rekening is hoog. | The amount on the bill is high. | The amount on the account is high. | TR "hesaptaki" = hesap; "bill" ile "account" arasında seçim: TR ile uyumlu olan "account". | |
| A14 | noun-boterham | EN | Ik eet een boterham met kaas. | I eat a slice of bread with cheese. | (OK, "slice of bread" kalsın) | boterham = bir dilim ekmek; "sandwich" daha geniş. | |
| A15 | noun-hek | EN | Het hek van de tuin is groen. | The fence of the garden is green. | (OK, "fence" kalsın) | hek = çit; kapı = poort. | |
| A16 | noun-kachel | EN | De kachel staat in de woonkamer. | The stove stands in the living room. | The heater stands in the living room. | İki okuyucu "heater" yazdı; TR "soba" da kalabilir. | |
| A17 | noun-koek | EN | Ik eet een koek bij de thee. | I eat a biscuit with the tea. | (OK, "biscuit" kalsın) | TR ile aynı konu: koek/koekje. | |
| A18 | noun-lach | EN | Zij heeft een mooie lach. | She has a beautiful laugh. | (OK, "laugh" kalsın) | lach = kahkaha/gülüş; "smile" = glimlach. | |
| A19 | noun-muts | EN | In de winter draag ik een muts. | In the winter I wear a woolly hat. | (OK, "woolly hat" kalsın) | muts = bere; okuyucu "hat" yazdı. | |

## B1 — Kontrol örneği TR (20 satır)

| # | Id | Felemenkçe | TR metin | ✓/✗ |
|---|---|---|---|---|
| B1.1 | noun-medewerker | De medewerker helpt de klant. | Çalışan müşteriye yardım ediyor. | |
| B1.2 | noun-brief | Ik schrijf een brief aan mijn oma. | Büyükanneme bir mektup yazıyorum. | |
| B1.3 | adj-onbekend | Ik zie een onbekende man. | Bilinmeyen bir adam görüyorum. | |
| B1.4 | noun-medaille | De winnaar krijgt een medaille. | Kazanan bir madalya alıyor. | |
| B1.5 | noun-hout | Deze tafel is van hout. | Bu masa tahtadan. | |
| B1.6 | adj-wild | Ik zie een wild dier in het bos. | Ormanda vahşi bir hayvan görüyorum. | |
| B1.7 | noun-gedicht | Ik lees een mooi gedicht. | Güzel bir şiir okuyorum. | |
| B1.8 | noun-dal | Het dorp ligt in een mooi dal. | Köy güzel bir vadide. | |
| B1.9 | noun-collega | Mijn collega drinkt koffie met melk. | Meslektaşım sütlü kahve içiyor. | |
| B1.10 | noun-garnaal | Ik eet een garnaal met rijst. | Pirinçle bir karides yiyorum. | |
| B1.11 | noun-boodschap | Ik heb een boodschap voor je. | Senin için bir mesajım var. | |
| B1.12 | noun-operatie | De operatie is morgen in het ziekenhuis. | Ameliyat yarın hastanede. | |
| B1.13 | noun-brand | In de keuken is brand. | Mutfakta yangın var. | |
| B1.14 | noun-melk | Ik drink elke ochtend melk. | Her sabah süt içiyorum. | |
| B1.15 | adj-vies | De handdoek is vies. | Havlu kirli. | |
| B1.16 | adj-vals | Dit geld is vals. | Bu para sahte. | |
| B1.17 | adj-bezorgd | Mijn moeder is bezorgd om mij. | Annem benim için kaygılı. | |
| B1.18 | noun-acteur | De acteur speelt in een film. | Aktör bir filmde oynuyor. | |
| B1.19 | noun-finale | De finale begint om acht uur. | Final saat sekizde başlıyor. | |
| B1.20 | noun-handdoek | Na de douche neem ik een handdoek. | Duştan sonra bir havlu alıyorum. | |

## B2 — Kontrol örneği EN (20 satır)

| # | Id | Felemenkçe | EN metin | ✓/✗ |
|---|---|---|---|---|
| B2.1 | noun-ingang | De ingang van het hotel is open. | The entrance of the hotel is open. | |
| B2.2 | noun-geliefde | Hij schrijft een brief aan zijn geliefde. | He writes a letter to his beloved. | |
| B2.3 | noun-dal | Het dorp ligt in een mooi dal. | The village lies in a beautiful valley. | |
| B2.4 | noun-kraag | De kraag van mijn jas is wit. | The collar of my coat is white. | |
| B2.5 | noun-boot | Wij gaan met de boot naar het eiland. | We go to the island by boat. | |
| B2.6 | noun-echtpaar | Het echtpaar woont in een klein huis. | The married couple lives in a small house. | |
| B2.7 | noun-lip | Zij heeft rode lippen. | She has red lips. | |
| B2.8 | noun-kust | Wij wonen dicht bij de kust. | We live close to the coast. | |
| B2.9 | adj-donker | In de kelder is het erg donker. | It is very dark in the cellar. | |
| B2.10 | noun-bijwerking | Die pil heeft een bijwerking. | That pill has a side effect. | |
| B2.11 | noun-gebouw | Dit gebouw is erg oud. | This building is very old. | |
| B2.12 | noun-jurk | Zij draagt een mooie jurk. | She wears a beautiful dress. | |
| B2.13 | noun-afstand | De afstand tot de school is kort. | The distance to the school is short. | |
| B2.14 | adj-onzeker | Ik ben nog onzeker over het antwoord. | I am still unsure about the answer. | |
| B2.15 | noun-beurt | Nu is het mijn beurt. | Now it is my turn. | |
| B2.16 | adj-zwaar | Deze koffer is te zwaar. | This suitcase is too heavy. | |
| B2.17 | adj-juist | Dat antwoord is juist. | That answer is correct. | |
| B2.18 | noun-centimeter | Mijn zoon is honderd centimeter lang. | My son is a hundred centimetres tall. | |
| B2.19 | adj-ernstig | De ziekte van mijn opa is ernstig. | My grandfather's illness is serious. | |
| B2.20 | noun-berg | Wij lopen de berg op. | We walk up the mountain. | |
