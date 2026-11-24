# A1/A2a distractor fix log (independent editor, T-382)

Replaced distractors of the rows in `sentences-a1-a2a-distractor-recheck.csv`. Rules: same POS, noun article shared, level <= row, <=7 uses per level (script-checked), filled sentence clearly wrong.

| id | old | new (filled sentence check: all clearly wrong) |
|---|---|---|
| noun-bad | probleem, verhaal, spel | perron, kruispunt, veld ("Het perron in onze badkamer ...") |
| noun-clown | som, letter, tip | batterij, benzine, verwarming |
| noun-instrument | project, cijfer, voorbeeld | brood, dak, cijfer ("Een gitaar is een dak") |
| noun-kleinkind | inkomen, geluk, onderwijs | oosten, zuiden, noorden ("Mijn oma heeft een oosten") |
| noun-mening | temperatuur | knie |
| noun-toilet | leven | huishouden |
| noun-toekomst | doos | koffie |
| verb-roken | passen | bloeden |
| verb-rusten | overlijden, passen | groeien, bloeden |
| verb-zeggen | scheiden | groeien |
| adj-logisch | bezorgd, onzeker, creatief | bleek, nat, blind |
| adj-slim | klassiek, bruin, groen | jammer, kwijt, toevallig |
| adj-wild | zwanger, actief | welkom, nodig |
| noun-bot | doel, weer | loket, perron |
| noun-discussie | som | huid |
| noun-duin | gevaar, rapport | vak, programma |
| noun-geheim | excuus | perron |
| noun-gevaar | geheim | vaccin |
| noun-huisnummer | team | land |
| noun-insect | doel, probleem, verhaal | leven, avontuur, bezoek |
| noun-kilometer | dag | pen |
| noun-kunstwerk | zuiden, oosten, verdriet | afval, medicijn, ongeluk |
| noun-moedertaal | zaterdag, klant | griep, ziekte (+ pech) |
| noun-onderwijs | verhaal, voorbeeld | ongeluk, dal |
| noun-rapport | weer | perron (weer now <=7 in A2) |

cloze-exclude (no clean set: any other numeral or any adjective is true under negation / by world fact): noun-twee, noun-vier, noun-vijf, noun-tien, adj-agressief ("niet ..."), adj-waar ("niet ...").
Unavoidable frame weakness (generic frames, noun distractors are wrong only by oddness): noun-kleinkind, noun-onderwijs, noun-kunstwerk, noun-moedertaal.
