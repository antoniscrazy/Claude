# VOXELCRAFT – Bug-Liste (Stand 2026-10-05.7)

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

## 2026-10-05.5 – Schluchten & Schacht-Pfähle

* ✅ Zu viele, viel zu tiefe Schluchten (teils fast bis zum Grundgestein, gefühlt alle 10 m): Schluchten sind jetzt seltener (Wahrscheinlichkeit 55 % → 30 % je Region), nur noch 14–28 Blöcke tief unter der Oberfläche und etwas schmaler. Gemessen: vorher 1,2 % aller Spalten offen bis tief unten, jetzt 0 %.
* ✅ Freistehende Pfähle aus Kupfer/Planken in Schluchten und Höhlen (Leiterschächte von Prüfkammer, Verlies, Minenschacht, Tiefenfestung): Rückwand und Leiter werden nur noch gebaut, wo wirklich Gestein ist; im Hohlraum entsteht kein Pfahl mehr. 0 schwebende Leitern.

## 2026-10-05.6

* ✅ Löchrige Hänge (schwebende Grasblöcke über Höhlen): Höhlen bleiben jetzt unter der **niedrigsten** Oberfläche der Umgebung (statt unter der eigenen Spaltenhöhe), und die alten Tunnel brechen nur noch in wenigen Chunks als Höhleneingang durch die Oberfläche. Gemessen: Anteil der Oberflächen mit Luft direkt darunter nur noch ≈ 0,8 %.
* ✅ Bäume an Strukturen wurden abgeschnitten: rund um große Strukturen (Fußabdruck + Rampe + Krone) wachsen keine Bäume mehr.
* ✅ Ruinen-Portal ließ sich nicht reparieren: Rahmen nur noch aus echtem Obsidian (kein Weinender Obsidian im Rahmen), nur 2–4 Lücken, dazu eine Beutetruhe mit Obsidian und Feuerzeug. Im Test ließ sich jeder Rahmen vervollständigen und entzünden.
* ✅ **Wasser und Lava fließen** (siehe README): Fließ-Blöcke in 8 Stufen, Fallen, Austrocknen, unendliche Quellen, Obsidian/Bruchstein, Mehrspieler-Sync, Chunk-Scan beim Laden.

## 2026-10-05.7

* ✅ Backrooms lassen sich per `/gamerule backrooms false` abschalten (auch Sand-Falle und `/backrooms`).
* ✅ Enderperlen-Glitch durch Wände: die Landung hob den Spieler vorher bis zu 4 Blöcke an und konnte so hinter die Wand setzen; jetzt wird ein freier Platz auf der Einschlagseite gesucht (freie Sichtlinie zur Perle), Flugschritte sind höchstens 0,2 Blöcke lang (auch bei Lag). Im Test landete die Perle vor der Wand bzw. unter der Decke.
* ✅ Nether-Decke bebaubar (bis y 127).
* ✅ Endportal nach dem Drachen: ganzer 5×5-Brunnen statt nur 3×3 (24 Portalblöcke).
* ✅ Abspann: richtiger Dialog zweier Stimmen über „die Spielenden“ (nicht mehr „Du“), Laufzeit richtet sich nach der Textlänge.

## 2026-10-05.8

* ✅ **Mobs laufen nicht mehr gegen Wände:** neue Navigation für alle Mobs (Oberwelt, Nether, Ende, Backrooms). Verfolger (Zombies, Husks, Skelette, Spinnen, Creeper, Piglins, Hoglins, Wölfe, Endermen, Backrooms-Hunde, Lächler, Starrer, Entität) planen per **A\*-Wegsuche** (bis 30 Blöcke Radius, 1 Block hinaufspringen, bis 3 Blöcke hinunter, keine Ecken schneiden, Wasser kostet mehr, Lava wird gemieden) einen Weg um Wände, Mauern und U-Taschen herum; fliegende Mobs (Lächler) suchen den Weg in ihrer Höhe. Ist das Ziel unerreichbar, laufen sie so nah wie möglich heran. Die Suche läuft höchstens 2× pro Frame und nur für Verfolger (gemessen: ≤ 15 ms im schlimmsten Fall, im Schnitt ≈ 1 ms), alle anderen weichen nur lokal aus.
* ✅ **Lokales Ausweichen für alle:** Tiere, Wanderer, Fledermäuse, Blazes, Ghasts usw. prüfen vor jedem Schritt Wand, Abgrund (> 3 Blöcke) und Lava und drehen dann zur freien Seite statt stumpf in die Wand zu laufen; Festhängen wird erkannt (neuer Weg bzw. Richtungswechsel).
* ✅ Mobs springen vor 1-Block-Stufen zuverlässiger (Sprung mit kurzem Anschub nach vorn; auch bei niedriger Bildrate).
* ✅ **Dev-Konsole: Spielerdaten eines ganzen Servers** exportieren (Datei `.vcs` oder Code `VCS1:…`), in einen anderen Server importieren oder mit einem Klick auf einen anderen Server übertragen („fehlende Spieler neu anlegen“ optional); Warnung, wenn betroffene Spieler gerade online sind; Fehlerbericht pro Spieler. Position/Spawn/Dimension auf dem Zielserver bleiben.

## 2026-10-05.9

* ✅ **Wasser fließt höchstens 7 Blöcke weit – auch über Kanten:** fallendes Wasser behielt vorher seine Reichweite nicht, sondern begann unten wieder mit 7 (Treppe/Kante → bis 11 Blöcke). Jetzt behält eine fallende Wassersäule die Stufe von oben; gemessen auf Fläche, Stufen und Fall von 5 Blöcken: höchstens 7. (Lava: 3 in der Oberwelt, 7 im Nether, ebenso begrenzt.)
* ✅ **Quellblock erkennbar:** Quellen (und Ozeane/Seen) sind jetzt ein **ruhiges, dunkleres Bild ohne Animation** und etwas höher (0,9); fließendes Wasser/Lava ist **heller, bewegt sich schneller** und wird je Stufe flacher (Stufe 7 = 0,76). Die Quelle ist so auf einen Blick vom Fluss zu unterscheiden.

## 2026-10-05.10 – Jahreszeiten & mehr Wetter

* ✨ **Jahreszeiten:** Frühling → Sommer → Herbst → Winter, je 7 Spieltage (ein Jahr = 28 Spieltage = 4 h echte Zeit); neue Welten starten im Frühling. Anzeige oben rechts („🍂 Herbst · Tag 3/7 · Nebel“), Hinweis beim Wechsel. `/season [spring|summer|autumn|winter|auto]` (Cheat) stellt sie fest ein; auf Servern gilt es für alle und wird mit der Welt gespeichert.
* ✨ **Farben:** Gras und Laub wechseln fließend die Farbe (Frühling frischgrün, Herbst orange/gelb/olivbraun, Winter fahl); Fichten bleiben fast grün.
* ✨ **Winter:** In allen nicht heißen Biomen (außer Wüste, Mesa, Savanne, Dschungel) schneit es statt zu regnen. **Schneedecke** legt sich auf alle Oberseiten unter freiem Himmel (auch Bäume, Dächer), wächst bei Schneefall, im Winter liegt immer etwas Schnee und er schmilzt im Frühling wieder.
* ✨ **Wetterlage je Jahreszeit:** Frühling regnerisch, Sommer sonnig mit häufigen Gewittern (Blitze öfter), Herbst viel **Nebel** (neues Wetter, `/weather fog`), Winter Schnee. In **Wüste und Mesa** wird aus Regen ein **Sandsturm** (Sandschleier, Sicht stark eingeschränkt).
* ✨ **Pflanzen:** wachsen im Frühling schneller (×1,25), im Herbst etwas langsamer, im Winter kaum (×0,3), bei Regen +50 % – nur unter freiem Himmel; unter Dach/Glas (Gewächshaus) normal.

## 2026-10-05.11

* ✨ **/kill <spieler>** (nur OPs; ohne Namen tötet `/kill` weiter dich selbst) und **/tp erweitert:** `/tp <spieler>` (zu ihm), `/tp <spieler> <ziel>` bzw. `/tp <spieler> zu <ziel>` (einen anderen Spieler zu einem Spieler teleportieren) und `/tp <spieler> <x> <y> <z>` – die beiden letzten nur für OPs. Im Test mit zwei Spielern: Teleport über 60 Blöcke, in der „zu“-Schreibweise, per Koordinate, Nicht-OPs werden abgewiesen, unbekannte Namen melden einen Fehler.
* ✨ **Dev-Konsole → Einstellungen: Server-Erstellung sperren.** Schalter „für alle gesperrt“ plus Liste freigegebener Spielernamen (Ausnahmen, z. B. du). Gesperrte Spieler bekommen beim Erstellen eine klare Meldung, Beitreten bleibt möglich. Dafür einmalig `supabase/dev_console_part4.sql` im Supabase-SQL-Editor ausführen (prüft die Sperre serverseitig in `vc_create_room`, nicht nur im Spiel).

## 2026-10-05.12

* ✅ **Treffer-Rotfärbung bei Spielern:** wer einen anderen Spieler schlägt oder mit dem Pfeil trifft, sieht ihn kurz (0,3 s) rot aufleuchten wie bei Mobs; auch alle anderen Spieler sehen den Treffer. Nur Haut/Körper werden rot, **Rüstung und gehaltenes Item bleiben unverändert**; das Aufleuchten kommt bei jedem Treffer, egal wie viel die Rüstung abfängt.

## 2026-10-05.13

* ✅ **Nether: Ankunft nie mehr auf der Decke.** Die Suche nach festem Boden lief bis weit über die Decke hinaus und fand in Säulen aus massivem Netherrack die Luft **über** dem Grundgestein-Dach (Test: 2 von 14 Portal-Ankünften landeten auf y 65). Jetzt wird nur unter der Decke gesucht (y 17 bis Decke − 8, nicht über Lava) und bei einer Säule ohne freien Platz in bis zu 14 Blöcken Umkreis die nächste mit Boden genommen; gibt es keine, wird eine Höhle in den Fels geschlagen. Test: 0 von 14 auf dem Dach. Gilt für Portale und `/nether`.

## 2026-10-05.14

* ✅ **Rückweg durch das Portal führt wieder zum Ausgangsportal.** Vorher wurde nur über umgerechnete Koordinaten (÷8 / ×8) das „nächste“ Portal im Umkreis von 22 Blöcken gesucht – lag das Gegenportal wegen der Rundung oder einer verschobenen Nether-Landung weiter weg, entstand ein neues Portal bzw. man kam an einem fremden Portal heraus (Test: 2 von 6 Rückwegen landeten 55 und 180 Blöcke vom Ausgangsportal entfernt). Jetzt merkt sich das Spiel jedes benutzte Portalpaar (je Welt gespeichert) und führt auf dem Rückweg genau zum verknüpften Portal; ist es zerstört, wird wie bisher gesucht (Umkreis 32) bzw. ein neues gebaut. Test: 6 von 6 Rückwegen kommen am Ausgangsportal heraus.

