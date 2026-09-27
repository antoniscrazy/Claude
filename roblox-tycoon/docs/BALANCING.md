| # | Upgrade | Art | Preis $ | $/s davor | Sek | Min ges. | Effekt |
|--:|---|---|--:|--:|--:|--:|---|
| 1 | Zweiter Bohrer | dropper | 200 | 10.0 | 20 | 0.3 | Wert 10 alle 2 s |
| 2 | Band Stufe I | speed | 310 | 15.0 | 21 | 0.7 | Band 26 studs/s |
| 3 | Schmelzofen I | upgrader | 481 | 15.0 | 32 | 1.2 | x1.49 auf Erzwert |
| 4 | Dritter Bohrer | dropper | 745 | 22.4 | 33 | 1.8 | Wert 15 alle 2 s |
| 5 | Bohrkopf I | rate | 1.150 | 33.5 | 34 | 2.3 | Drops x1.25 schneller |
| 6 | Waage I | collector | 1.790 | 41.9 | 43 | 3.1 | x1.79 auf Auszahlung |
| 7 | Schmelzofen II | upgrader | 2.770 | 75.0 | 37 | 3.7 | x1.49 auf Erzwert |
| 8 | Vierter Bohrer | dropper | 4.300 | 111.8 | 38 | 4.3 | Wert 22 alle 2 s |
| 9 | Hallenwaende | cosmetic | 6.660 | 166.4 | 40 | 5.0 | Optik / Freischaltung |
| 10 | Bohrkopf II | rate | 10.300 | 166.4 | 62 | 6.0 | Drops x1.25 schneller |
| 11 | Band Stufe II | speed | 16.000 | 208.0 | 77 | 7.3 | Band 32 studs/s |
| 12 | Schmelzofen III | upgrader | 24.800 | 208.0 | 119 | 9.3 | x1.79 auf Erzwert |
| 13 | Fuenfter Bohrer | dropper | 38.500 | 372.3 | 103 | 11.0 | Wert 33 alle 2 s |
| 14 | Waage II | collector | 59.600 | 555.7 | 107 | 12.8 | x1.49 auf Auszahlung |
| 15 | Hallendach | cosmetic | 92.400 | 828.0 | 112 | 14.6 | Optik / Freischaltung |
| 16 | Bohrkopf III | rate | 143.000 | 828.0 | 173 | 17.5 | Drops x1.25 schneller |
| 17 | Schmelzofen IV | upgrader | 222.000 | 1.035.1 | 214 | 21.1 | x1.79 auf Erzwert |
| 18 | Sechster Bohrer | dropper | 344.000 | 1.852.8 | 186 | 24.2 | Wert 49 alle 2 s |
| 19 | Band Stufe III | speed | 533.000 | 2.760.6 | 193 | 27.4 | Band 40 studs/s |
| 20 | Waage III | collector | 827.000 | 2.760.6 | 300 | 32.4 | x1.49 auf Auszahlung |
| 21 | Hallenbeleuchtung | cosmetic | 1.280.000 | 4.113.3 | 311 | 37.6 | Optik / Freischaltung |
| 22 | Bohrkopf IV | rate | 1.990.000 | 4.113.3 | 484 | 45.7 | Drops x1.25 schneller |
| 23 | Schmelzofen V | upgrader | 3.080.000 | 5.141.6 | 599 | 55.6 | x1.79 auf Erzwert |
| 24 | Siebter Bohrer | dropper | 4.770.000 | 9.203.5 | 518 | 64.3 | Wert 74 alle 2 s |
| 25 | VIP-Lounge | cosmetic | 7.400.000 | 13.774.4 | 537 | 73.2 | Optik / Freischaltung |

- Startdropper (gratis): Wert 20 alle 2 s = 10 $/s
- Preiskurve: `200 x 1.55^(Rang-1)`, auf 3 signifikante Stellen gerundet
- Einkommensfaktor je einkommenswirksamem Upgrade: **1.4949** (per Bisektion auf das 30-Minuten-Ziel geloest)
- Erster Kauf moeglich nach: **20 s** (Ziel < 45 s)
- Rebirth 1 (1.000.000 $): **30.1 min** (optimal nach 17 von 25 Upgrades; Ziel 25-35 min)
- Alle 25 Upgrades: 73.2 min. Endeinkommen 13.774 $/s
- Groesster Schritt-Sprung: **1.55x** bei `rate_4` (Schranke 2,50x)
