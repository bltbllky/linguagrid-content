# Owner review, English, 2026-10-17

Her satırın son sütununa kararını yaz: "OK" (mevcut kalsın), "Ö" (öneriyi al) ya da kendi metnin.

Source: English round trip (ADR-012), `review/roundtrip-en/result.csv`. Nothing in `data/` was changed.

## Part A: words to decide (18)
These are the 3 round-trip mismatches, the 2 close/close rows the editor sends on, and the 13 English pre-check `unsure` findings
(`review/en/a1.findings.csv`, `a2.findings.csv`) that are not mismatches. Words already in
`review/owner-2026-10-17.md` Part C are left out (tegenwoordig is C42 there). "(keep)" means the editor recommends the current
text. E1, E2, E5 and E14 ask the same sense question as Turkish rows A10, A9, A3 and A5 of that sheet, so decide each pair the same way.

| # | Dutch | Turkish | Current EN | Suggested EN | Why | Decision |
|---|---|---|---|---|---|---|
| E1 | heel | bütün | whole | (keep), or "very" | Mismatch: blind NL pass read "very". At A1 heel is mostly the adverb (heel goed). Same question as A10. |  |
| E2 | erg | berbat | awful | (keep), or "very" | Mismatch: blind NL pass read "very" (erg leuk). Same question as A9. |  |
| E3 | de bank | banka | bank | (keep) | Mismatch: blind NL pass read "couch". Both senses are A1; the category a1-shopping fits the money sense. |  |
| E4 | de vriendin | kız arkadaş | girlfriend | friend (female) | vriendin is first a female friend; matches the "(female)" pattern of lerares and buurvrouw. |  |
| E5 | rijden | taşıtla gitmek | to drive | to ride | autorijden is "to drive a car" (same category); rijden also covers bike and train. Pass 1 read "to ride". |  |
| E6 | weten | bilmek | to know | to know (a fact) | kennen is "to know (someone)"; a bare "to know" fits both. |  |
| E7 | engels (lemma) | İngilizce | English | lemma "Engels" | Dutch capitalises language names. This changes words.json, not the English text. |  |
| E8 | nederlands (lemma) | Hollandaca | Dutch | lemma "Nederlands" | Same as E7. Turkish A7 is a separate question about the Turkish text. |  |
| E9 | de kaart | kart, harita | map | (keep), or "card" | Turkish gives both senses and English only map; pass 1 read "card". At A1 kaart is often card/ticket. Pick one sense for both languages. |  |
| E10 | de woning | konut | dwelling | home | "dwelling" is rare, formal English; huis already has "house". |  |
| E11 | de leraar | öğretmen | teacher | teacher (male) | lerares is "teacher (female)"; a bare "teacher" fits both (same A1 category). |  |
| E12 | leven | yaşamak | to live | to live (be alive) | wonen is "to live (somewhere)"; a bare "to live" fits both. |  |
| E13 | nerveus | gergin | tense | nervous | Blind NL pass read "nervous". zenuwachtig (A2) is also "nervous", but the level builder keeps A1 and A2 apart. |  |
| E14 | poetsen | fırçalamak | to polish | to brush (teeth) | Pass 1 read "to brush" from the Turkish; A1 use is tanden poetsen. Same word as A5. |  |
| E15 | het voedsel | gıda | nourishment | food (in general) | Close/close: both passes read "food". "nourishment" is not A2; eten has "food", so a bracket is needed. |  |
| E16 | de arts | hekim | physician | doctor (physician) | "physician" is formal; dokter has "doctor", so a bracket is needed. |  |
| E17 | betekenen | anlamına gelmek | to mean | to mean (signify) | bedoelen is "to mean (intend)"; a bare "to mean" fits both. |  |
| E18 | de ontmoeting | buluşma | encounter | meeting (with someone) | Close/close: both passes read "meeting". "encounter" is above A2; vergadering has "meeting". |  |

## Accepted without the owner
The editor kept 5 close/close rows: leuk "nice" ("fun" is plezier's text), boodschap "groceries" (boodschappen doen),
apparaat "appliance" (a2-home), gezin "nuclear family" (keeps it apart from familie), and afspreken "to arrange to meet"
(regelen is "to arrange"). See `result.csv`, verdict "editor: keep".
