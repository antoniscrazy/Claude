# VOXELCRAFT – Bug-Liste (Stand 2026-10-05.4)

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
| M8 | Drachen-Animationsphase (Kreisen/Angriff/Landung) kam bei Mitspielern nur verzögert an | ✅ Phase, Landung, Brüllen und Feuerball-Timer werden jetzt mitgesendet (getestet: charge/perch/strafe) |
| M9 | Gezähmte Pferde/Wölfe und Fahrzeuge gingen verloren, wenn Besitzer/Host den Raum verließ | ✅ werden im Spielerstand gespeichert und beim Beitritt (bzw. Dimensionswechsel) wiederhergestellt; weit entfernte Fahrzeuge kommen als Item ins Inventar |
| M10 | Supabase: `dev_console_part2.sql` muss einmalig im SQL-Editor des Spiel-Projekts (`wzagswxluqpfzksoqsca`) ausgeführt werden; Realtime-Zugriff auf `voxelcraft-actions` und 15-Spieler-Last ungeprüft | 🔴 offen – nur du kannst das: das Spiel-Projekt liegt nicht in dem Supabase-Konto, auf das ich Zugriff habe, und von hier erreiche ich keine Websockets |

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
| B15 | Bücherregal: Verzauber-Stärke ignorierte die Luftlücken-Regel | ✅ Regale zählen nur noch, wenn die Zelle dazwischen frei ist (getestet 15 → 13) |
| B16 | Kein Glitzern am gehaltenen verzauberten Item | ✅ pulsierende violette Überlagerung in der Hand |
| B17 | Flügelmembranen des Drachen wirkten von der Seite sehr dünn | ✅ Membranen leicht angewinkelt (V-Form) |

Fuzz-/Monkey-Läufe (Tastenhagel, Zufallsklicks, Dimensionswechsel) ergaben zuletzt **keine** Konsolenfehler.

## Neu in 2026-10-05.1 (Technik-Hinweise)

* **Baulimit 256** in allen Welten (Nether, Backrooms und Ende bleiben 64 hoch). Meldung „⚠ Baulimit erreicht“ über der Hotbar.
* **Tiefe Welten** gelten für neue Einzelspieler-Welten und für Server, die **nach** der Veröffentlichung dieser Version angelegt wurden (`GEN3_START`). Ältere Welten/Server bleiben unverändert (Block-IDs und gespeicherte Änderungen bleiben gültig).
* **Datenbank (Mehrspieler):** Die Tabelle erlaubt y nur von 0 bis 255. Damit Oberwelt (256 hoch) und die anderen Dimensionen Platz haben, steckt die Dimension jetzt im x-Wert (`x + Code·2^27`). Alte Zeilen (Code 0) bleiben lesbar – **keine SQL-Änderung nötig**.
* Spielerdaten-Transfer zwischen Servern gibt es nur in der Dev-Konsole (nicht im Spiel).
* Offen: Supabase-Einrichtung (`dev_console_part2.sql`, Realtime-Zugriff, Last mit 15 Spielern) – weiterhin nur von dir prüfbar.

## 2026-10-05.4 – Gelände & Strukturen

* Gelände neuer Welten/Server (ab `GEN4_START`) wird weich gemischt; Welten, die mit 2026-10-05.1–.3 angelegt wurden, behalten ihr Gelände (nur Strukturen sind neu gebaut).
* ✅ Leitern hingen in der Luft (Festung/Burg): Strukturen werden jetzt **nach** Höhlen und Schluchten gebaut, Leitern haben immer eine Rückwand (geprüft: 0 schwebende Leitern in 3136 Chunks).
* ✅ Burgtürme/Bergfried hatten keinen Aufstieg → Leitern mit Loch im Zwischenboden, Eingänge zum Hof.
* ✅ Sumpfhütte: Treppe zum Boden. Minenschacht, Tiefenfestung, tiefes Verlies, Prüfkammer: Leiterschacht zur Oberfläche.
* ✅ Wüstentempel/Dschungeltempel: TNT liegt jetzt **direkt unter** der Druckplatte (Platte gibt Strom nur an angrenzende Blöcke) – im Test zündet es beim Draufsteigen.
