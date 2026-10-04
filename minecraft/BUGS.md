# VOXELCRAFT – Bug-Liste (Stand 2026-10-04.4)

Gefunden durch Fuzz-/Monkey-Tests (Zufallsklicks, Tastenhagel), Zwei-Spieler-Tests im Multiplayer und Code-Durchsicht.
Status: ✅ behoben · 🟡 offen (klein / kosmetisch) · 🔴 offen (spürbar)

## Multiplayer

| # | Bug | Status |
|---|-----|--------|
| M1 | Boote/Loren waren im Mehrspieler nur für den Platzierer sichtbar (andere sahen nichts, konnten nicht einsteigen) | ✅ Fahrzeuge werden jetzt synchronisiert (Besitzer simuliert, andere sehen eine Puppe; Einsteigen übergibt den Besitz; Abbauen entfernt es für alle) |
| M2 | Fahrzeuge aus einer anderen Dimension erschienen in der eigenen | ✅ `veh`/`vehgone` sind jetzt Dimensions-Ereignisse |
| M3 | Welt lief bei Pause / verstecktem Tab nicht weiter | ✅ (frühere Runde) Simulation läuft per Worker weiter |
| M4 | Verzauberte Items verloren beim Fallenlassen / Aufheben die Verzauberung | ✅ Drops tragen `ench` |
| M5 | Redstone (Hebel, Lampen, Kolben, Trichter+Truhe) zwischen zwei Spielern | ✅ getestet, synchron |
| M6 | Pferde reiten durch einen Nicht-Host | ✅ getestet (`mobride`) |
| M7 | Ende: Spieler in verschiedenen Dimensionen sehen sich nicht / Mobs vermischen sich | ✅ getestet, getrennt |
| M8 | Drachen-Animationsphase (Kreisen/Angriff/Landung) wird bei Nicht-Hosts nur aus der Position abgeleitet → Animationen leicht verzögert | 🟡 offen |
| M9 | Gezähmte Pferde/Wölfe und Fahrzeuge anderer Spieler bleiben nicht gespeichert, wenn der Besitzer/Host den Raum verlässt | 🟡 offen |
| M10 | Supabase: `dev_console_part2.sql` muss einmalig im Supabase-SQL-Editor ausgeführt werden; Realtime-Zugriff auf `voxelcraft-actions` ungeprüft; 15-Spieler-Last nicht real getestet | 🔴 offen (Einrichtung, kein Code) |

## Einzelspieler / Allgemein

| # | Bug | Status |
|---|-----|--------|
| B1 | Backrooms: geöffnete Truhe bekam die normale Kisten-Textur | ✅ `br_crate_open` |
| B2 | Backrooms-Blöcke / Mandelwasser in Creative-Palette und `/give` | ✅ versteckt (Easter-Egg) |
| B3 | Dino-Spiel: früh 3 hohe Kakteen hintereinander, unüberwindbar | ✅ |
| B4 | Attract-Mode: Steve blieb hängen | ✅ Watchdog |
| B5 | Ende-Portal nicht betretbar (Lava-Fall vor 1,5 s Wartezeit) | ✅ Auslöser nach 0,12 s |
| B6 | Enderaugen im Rahmen verzerrt / Kristalle falsche UVs | ✅ Per-Box-Texturen |
| B7 | Drache unsichtbar vor dem Himmel, Flügelhäute zu dunkel | ✅ Texturen aufgehellt |
| B8 | EndGen: `Perlin.noise` mit 2 statt 3 Argumenten → NaN → keine Insel | ✅ |
| B9 | XP-Kugeln blieben nach Dimensionswechsel bestehen | ✅ |
| B10 | Fahrzeuge gingen beim Dimensionswechsel verloren | ✅ |
| B11 | Alter `endDead`-/Redstone-Zustand in neuer Welt | ✅ beim Start zurückgesetzt |
| B12 | Fehlende Sounds `portal`, `step` | ✅ |
| B13 | Block-/Item-IDs verschoben sich beim Einfügen neuer Blöcke (alte Saves kaputt) | ✅ neue IDs nur noch hinten angehängt, ID-Check = 0 Abweichungen |
| B14 | Enderdrache heilte durch Kristalle viel zu stark (2 HP/s je Kristall) | ✅ jetzt max. 3 HP/s gesamt |
| B15 | Bücherregal: Verzauber-Stärke ignoriert Luftlücke-Regel | 🟡 offen |
| B16 | Kein Glitzern (Glint) am gehaltenen verzauberten Item (nur im Inventar) | 🟡 offen |
| B17 | Flügelmembranen des Drachen wirken von der Seite sehr dünn | 🟡 offen |

Fuzz-/Monkey-Läufe (Tastenhagel, Zufallsklicks, Dimensionswechsel) ergaben zuletzt **keine** Konsolenfehler.
