# Owner review — A1 cümleleri (T-380), 2026-11-24

Kararlar `review/sentences-a1-owner.csv` dosyasının `decision` sütununa yazılır (içe aktarma ondan). Bu dosya aynı satırların okunaklı hali.

- **A bölümü (21 satır, işaretli):** "OK" (mevcut metin kalsın) ya da kendi düzeltilmiş metnin. "Öneri" sütunu benim önerim; kabul edersen "OK" yerine "Ö" yazabilirsin.
- **B bölümü (kontrol örneği, dil başına 20 satır):** doğruysa "✓", yanlışsa "✗" ve doğrusunu yaz. Tek hata varsa 30 satır daha eklenir (liste `review/sentences-a1-spot-<dil>.txt`, tohum 20261124); iki hata varsa o dilin içe aktarması durur.
- Boş satır = karar yok.
- Bu sayfadaki hiçbir satır `reviewed` değil; ikili okuma sonucu: TR 390 kabul / 17 işaretli (owner'a 17), EN 403 kabul / 4 işaretli.

## Q1 — verb-overlijden (cümle yok)
"overlijden" için cümle yazılmadı (doğal kullanımı "overleden" ve konu yakın ölümü; hassas kişisel bilgi). PM önerisi: cümlesiz kalsın. Karar: ______ (cümlesiz / nötr cümle yaz)

## A — İşaretli satırlar (21)
Oku sütunları: kör okuyucuların yazdığı metin (Felemenkçeden, sana göstermeden).

| # | Id | Dil | Felemenkçe | Mevcut | Kör okuyucu | Öneri | Not | Karar |
|---|---|---|---|---|---|---|---|---|
| A1 | noun-vriendin | TR | Mijn vriendin is vandaag bij haar moeder. | Arkadaşım bugün annesinin yanında. | Kız arkadaşım bugün annesinin yanında. | Kız arkadaşım bugün annesinin yanında. | "vriendin" = kız arkadaş (haar = onun annesi). EN "friend" kalsın. | |
| A2 | noun-flat | TR | Mijn zus woont in een grote flat. | Ablam büyük bir apartmanda oturuyor. | Kız kardeşim büyük bir apartman dairesinde yaşıyor. | Kız kardeşim büyük bir apartmanda oturuyor. | zus = kız kardeş, "ablam" yaş belirtir. | |
| A3 | noun-haar | TR | Mijn zus heeft lang zwart haar. | Ablamın uzun siyah saçı var. | Kız kardeşimin uzun siyah saçları var. | Kız kardeşimin uzun siyah saçı var. | zus → kız kardeşim. | |
| A4 | noun-nek | TR | Mijn nek is koud. | Ensem soğuk. | Boynum soğuk. | (OK, "Ensem soğuk" kalsın) | Kelime listesinde nek = ense. | |
| A5 | noun-echtgenoot | TR | Mijn echtgenoot werkt in het ziekenhuis. | Eşim hastanede çalışıyor. | Kocam hastanede çalışıyor. | Kocam hastanede çalışıyor. | "Eşim" cinsiyeti kaybediyor. | |
| A6 | noun-echtgenote | TR | Mijn echtgenote werkt op school. | Eşim okulda çalışıyor. | Karım okulda çalışıyor. | Karım okulda çalışıyor. | Aynı. | |
| A7 | noun-drie | TR | Mijn zus heeft drie kinderen. | Ablamın üç çocuğu var. | Kız kardeşimin üç çocuğu var. | Kız kardeşimin üç çocuğu var. | zus → kız kardeşim. | |
| A8 | noun-zestien | TR | Mijn zus is zestien jaar oud. | Ablam on altı yaşında. | Kız kardeşim on altı yaşında. | Kız kardeşim on altı yaşında. | zus → kız kardeşim. | |
| A9 | verb-bakken | TR | Mijn oma wil een brood bakken. | Büyükannem fırında ekmek pişirmek istiyor. | Büyükannem bir ekmek pişirmek istiyor. | (OK, mevcut kalsın) | "fırında" bakken'i pişirmekten ayırıyor. | |
| A10 | verb-zijn | TR | Mijn zus en ik zijn moe. | Ablam ve ben yorgunuz. | Kız kardeşim ve ben yorgunuz. | Kız kardeşim ve ben yorgunuz. | zus → kız kardeşim. | |
| A11 | verb-krijgen | TR | Ik krijg een nieuwe telefoon voor mijn verjaardag. | Doğum günümde yeni bir telefon alacağım. | Doğum günüm için yeni bir telefon alıyorum. | Doğum günümde yeni bir telefon alıyorum. | Şimdiki zaman (Felemenkçe de şimdiki zaman). | |
| A12 | verb-passen | TR | Deze schoenen passen niet. | Bu ayakkabılar bana uymuyor. | Bu ayakkabılar olmuyor. | (OK, "bana uymuyor" kalsın) | Okuyucu daha zayıf bir karşılık yazdı. | |
| A13 | adj-dagelijks | TR | Mijn zus werkt dagelijks in de winkel. | Ablam her gün mağazada çalışıyor. | Kız kardeşim mağazada her gün çalışıyor. | Kız kardeşim her gün mağazada çalışıyor. | zus → kız kardeşim. | |
| A14 | adj-zwanger | TR | Mijn zus is zwanger en heel gelukkig. | Ablam hamile ve çok mutlu. | Kız kardeşim hamile ve çok mutlu. | Kız kardeşim hamile ve çok mutlu. | zus → kız kardeşim. | |
| A15 | adj-rood | TR | De fiets van mijn zus is rood. | Ablamın bisikleti kırmızı. | Kız kardeşimin bisikleti kırmızı. | Kız kardeşimin bisikleti kırmızı. | zus → kız kardeşim. | |
| A16 | adj-dik | TR | Mijn hond is te dik. | Köpeğim fazla şişman. | Köpeğim çok şişman. | (OK, "fazla" kalsın) | "te dik" = fazla; "çok" anlamı zayıflatıyor. | |
| A17 | adj-getrouwd | TR | Mijn zus is getrouwd. | Ablam evli. | Kız kardeşim evli. | Kız kardeşim evli. | zus → kız kardeşim. | |
| A18 | noun-meneer | EN | Meneer, kunt u mij helpen? | Excuse me, sir, can you help me? | Sir, can you help me? | Sir, can you help me? | "Excuse me" Felemenkçede yok. | |
| A19 | noun-flat | EN | Mijn zus woont in een grote flat. | My sister lives in a big block of flats. | My sister lives in a big flat. | (OK, "block of flats" kalsın) | Kelime listesi: flat = apartman (bina). | |
| A20 | noun-ongeluk | EN | Er is een ongeluk op de weg. | There has been an accident on the road. | There is an accident on the road. | There is an accident on the road. | "Er is" şimdiki zaman. TR de "Yolda bir kaza var." | |
| A21 | adj-prima | EN | Het eten is prima. | The food is fine. | The food is great. | (OK, "fine" kalsın) | prima = gayet iyi (fine); "great" daha güçlü. | |

## B1 — Kontrol örneği TR (20 satır)

| # | Id | Felemenkçe | TR metin | ✓/✗ |
|---|---|---|---|---|
| B1.1 | noun-les | De les begint om twee uur. | Ders saat ikide başlıyor. | |
| B1.2 | noun-weekend | In het weekend ben ik thuis. | Hafta sonu evdeyim. | |
| B1.3 | verb-roepen | Mijn moeder roept mij naar de keuken. | Annem beni mutfağa çağırıyor. | |
| B1.4 | noun-hoofd | Mijn hoofd doet pijn. | Başım ağrıyor. | |
| B1.5 | adj-wakker | Ik ben om zes uur wakker. | Saat altıda uyanığım. | |
| B1.6 | noun-leraar | De leraar spreekt langzaam in de klas. | Öğretmen sınıfta yavaş konuşuyor. | |
| B1.7 | noun-kerst | Wij eten met kerst samen. | Noel'de birlikte yemek yiyoruz. | |
| B1.8 | verb-ontmoeten | Ik wil jouw moeder graag ontmoeten. | Annenle tanışmak istiyorum. | |
| B1.9 | noun-dinsdag | Op dinsdag werk ik thuis. | Salı günü evde çalışıyorum. | |
| B1.10 | verb-scheiden | Mijn buren gaan scheiden. | Komşularım boşanacak. | |
| B1.11 | noun-trein | De trein naar de stad is laat. | Şehre giden tren geç kaldı. | |
| B1.12 | adj-roze | Mijn dochter heeft een roze fiets. | Kızımın pembe bir bisikleti var. | |
| B1.13 | noun-zondag | Op zondag eten wij bij mijn oma. | Pazar günü büyükannemde yemek yiyoruz. | |
| B1.14 | adj-goedkoop | Het brood is hier goedkoop. | Ekmek burada ucuz. | |
| B1.15 | noun-man | De man koopt een nieuwe auto. | Adam yeni bir araba alıyor. | |
| B1.16 | noun-ontmoeting | De ontmoeting is om twee uur bij het station. | Buluşma saat ikide istasyonda. | |
| B1.17 | noun-lamp | De lamp in de keuken is nieuw. | Mutfaktaki lamba yeni. | |
| B1.18 | noun-adres | Wat is jouw adres? | Adresin ne? | |
| B1.19 | noun-afval | Wij brengen het afval naar buiten. | Çöpü dışarı çıkarıyoruz. | |
| B1.20 | noun-keer | Ik zie mijn oma een keer in de maand. | Büyükannemi ayda bir kez görüyorum. | |

## B2 — Kontrol örneği EN (20 satır)

| # | Id | Felemenkçe | EN metin | ✓/✗ |
|---|---|---|---|---|
| B2.1 | adj-leuk | Het is een leuke film. | It is a nice film. | |
| B2.2 | noun-echtgenoot | Mijn echtgenoot werkt in het ziekenhuis. | My husband works in the hospital. | |
| B2.3 | noun-neus | Ik heb een koude neus. | My nose is cold. | |
| B2.4 | verb-praten | Zij praten met de leraar in de klas. | They are talking to the teacher in the classroom. | |
| B2.5 | noun-vriendin | Mijn vriendin is vandaag bij haar moeder. | My friend is with her mother today. | |
| B2.6 | verb-vragen | Wij moeten de weg vragen. | We have to ask the way. | |
| B2.7 | noun-januari | In januari is het heel koud. | In January it is very cold. | |
| B2.8 | verb-roken | Hier mag ik niet roken. | I am not allowed to smoke here. | |
| B2.9 | noun-twintig | Er zijn twintig stoelen in de kamer. | There are twenty chairs in the room. | |
| B2.10 | noun-man | De man koopt een nieuwe auto. | The man is buying a new car. | |
| B2.11 | verb-helpen | Kun je mij met mijn werk helpen? | Can you help me with my work? | |
| B2.12 | adj-zwart | Mijn schoenen zijn zwart en nieuw. | My shoes are black and new. | |
| B2.13 | noun-mama | Mama, waar is mijn telefoon? | Mum, where is my phone? | |
| B2.14 | noun-jongen | De jongen eet een appel in de tuin. | The boy is eating an apple in the garden. | |
| B2.15 | noun-werk | Ik ga met de fiets naar mijn werk. | I go to work by bike. | |
| B2.16 | verb-bouwen | Zij bouwen een nieuw huis in de stad. | They are building a new house in the city. | |
| B2.17 | verb-weten | Weet jij waar mijn sleutel is? | Do you know where my key is? | |
| B2.18 | adj-zuur | De appel is zuur en niet lekker. | The apple is sour and not nice. | |
| B2.19 | adj-moe | Ik ben moe en wil naar bed. | I am tired and want to go to bed. | |
| B2.20 | adj-geel | De zon is geel. | The sun is yellow. | |
