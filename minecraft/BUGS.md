# VOXELCRAFT – Bug-Liste (Stand 2026-10-05.27)

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

## 2026-10-05.15 – Alles herstellbar

* ✨ **Neue Handwerks-Reiter „Farben“ und „Stein“** und rund 220 neue Rezepte. Geprüft per Skript: jeder Block und jedes Item, das sich weder herstellen noch in der Welt (Oberwelt/Nether/Ende) finden, aus Blöcken/Monstern/Truhen/Händlern/Angeln gewinnen lässt, hatte kein Rezept – jetzt haben alle eins (außer Netherportal und Drachenei, die einzigartig bleiben; Erze, Biom- und Naturblöcke findet man weiterhin im Gelände).
* ✨ **16 Farbstoffe** (eigene Items mit Texturen): aus Blumen (Löwenzahn, Mohn, Tulpe, Orchidee, Zierlauch, Porzellansternchen, Margerite, Kornblume, Maiglöckchen), Knochenmehl, Lapislazuli, Kohle, Kaktus (Ofen) und durch Mischen (z. B. Rot + Gelb = Orange).
* ✨ **Färben:** Wolle, Terrakotta (8×), Glas (8×), Betonpulver (4 Sand + 4 Kies + Farbstoff = 8), Kerzen. **Betonpulver wird zu Beton, sobald es Wasser berührt** (auch beim Fallen in Wasser) – oder per Rezept mit Wassereimer (der leere Eimer kommt zurück).
* ✨ **Holz:** entrindete Stämme, Planken der Sonderhölzer (Mangrove, Blasseiche, Karmesin, Wirr, Bambus), Sonderstämme (Stamm + Farbstoff), Bambusmosaik.
* ✨ **Stein & Co.:** polierte/geschliffene/gemeißelte Varianten (Diorit, Granit, Andesit, Tuff, Basalt, Schwarzstein, Sandstein, Quarz, Kupfer, Endstein, Purpur, Ziegel, Lehm), Moos- und Rissvarianten, geglätteter Sandstein/Basalt (Ofen), Ozeanstein (Prismarin), Schlamm, Packeis/Blaueis, Roheisen-/Rohgold-/Rohkupferblöcke, oxidierte Kupferblöcke (mit Knochenmehl), Kupferlampe, Leitstein.
* ✨ **Sonderblöcke:** Schleim-, Honig-, Waben-Block, Bienenstock/-nest, Zielscheibe, Notenblock, Plattenspieler, Bogenbauer-/Schmiede-/Kartentisch, Pilze und Pilzblöcke, Netherwarzenblöcke, Pilzlicht, Froschlichter, Blasses Moos, Harzblock, Zuckerrohr (Knochenmehl + Samen), Getöntes Glas, Endportalrahmen u. a.
* Hinweis: Bei Blöcken, die es in Minecraft nur als Weltgenerierung gibt (Sonderhölzer, Froschlichter …), sind die Rezepte spieleigene Ersatzrezepte.

## 2026-10-05.16

* ✨ **/gamemode <modus> [spieler]:** ohne Spielernamen wirkt es bei dir selbst, mit Namen bei einem anderen Spieler (nur OPs; `/gamemode creative Bob`, auch `@Bob` geht wie bei allen Befehlen). Im Test mit zwei Spielern: Modus von Bob gesetzt, eigener Modus, Nicht-OP abgewiesen, unbekannter Name und falscher Modus melden Fehler.
* ✅ **Fahrzeuge:** neuer Handwerks-Reiter „Fahrzeuge“ mit Boot, Lore, Schienen, Antriebsschienen und Sattel – jetzt **ohne Werkbank** herstellbar (vorher musste man Boot/Lore/Schienen an der Werkbank im Reiter „Bauen“ suchen).

## 2026-10-05.17

* ✅ **Keine „falsche Version“-Warnungen mehr bei normalen Updates.** Bisher warnte das Spiel jeden, dessen Versionsnummer nicht exakt der eigenen entsprach – bei jedem Update also alle Spieler mit der vorherigen index.html („X nutzt eine andere Spielversion, sieht eine andere Welt …“), und ein einzelnes ungebündeltes Positionspaket galt als „alter Client“. Jetzt gibt es eine eigene **Mehrspieler-Kompatibilitätsstufe** (`MP_PROTO`, aktuell 1), die nur steigt, wenn sich Netzwerkformat oder Welt-Speicherung wirklich unverträglich ändern. Normale Versionen (neue Blöcke, Rezepte, Mobs, Befehle …) vertragen sich untereinander, unbekannte Blöcke/Mobs/Ereignisse werden ohnehin ignoriert. Geprüft wird nur noch: andere Kompatibilitätsstufe, oder Spiele ohne Stufe vor 2026-10-05.1 (sehr alt). Test: zwei Spieler gleicher Version → keine Warnung; ältere Versionen (.9, .14) gelten als verträglich; sehr alt und andere Stufe warnen.

## 2026-10-05.18 – Emotes

* ✨ **Emote-Rad (nur Mehrspieler):** **R halten** öffnet ein Rad wie das Waffenrad in GTA – mit der Maus in Richtung eines Platzes zeigen, **R loslassen** führt den Emote aus (oder kurz R tippen: Rad bleibt offen, dann klicken). **Touch:** neuer Knopf „Emotes“ oben rechts, Platz antippen. Im Einzelspielermodus kommt nur ein Hinweis.
* ✨ **8 Plätze, 3 sind vorbelegt:** Winken, Klatschen, Salto. Die anderen zeigen ein **＋** → öffnet das Auswahlmenü mit **20 weiteren Emotes** (Tanzen, Verbeugung, Jubeln, Salutieren, Nein, Ja, Schulterzucken, Pirouette, Hampelmann, Floss, Roboter, Zombie, Boxen, Tritt, Siegerpose, Nachdenken, Hinsetzen, Handstand, Liegestütz, Ohnmacht). Plätze lassen sich beliebig belegen, per **✕ wieder leeren** oder ersetzen; die Belegung bleibt gespeichert.
* ✨ **Alle Spieler sehen den Emote** am Spielermodell (eigene Animation je Emote, wird über das Netzwerk synchronisiert). Beim Ausführen schwenkt deine Kamera nach vorn und zeigt **deine eigene Figur** (mit Skin, Rüstung und Item); Bewegen, Springen oder Angreifen bricht den Emote ab.
* ✅ Die Jahreszeit-Anzeige überdeckte in Mehrspielerwelten die Serverinfo oben rechts → liegt jetzt darunter.

## 2026-10-05.19

* ✅ **Emotes geprüft:** alle 23 Animationen einzeln aus zwei Blickwinkeln (von vorn und von der Seite) in je 6 Zeitpunkten angesehen (Winken, Klatschen, Salto, Tanzen, Verbeugung, Jubeln, Salutieren, Nein, Ja, Schulterzucken, Pirouette, Hampelmann, Floss, Roboter, Zombie, Boxen, Tritt, Siegerpose, Nachdenken, Hinsetzen, Handstand, Liegestütz, Ohnmacht). Zusätzlich rechnerisch geprüft: keine ungültigen Werte (NaN) in irgendeinem Bild, Figur steht nach jedem Emote wieder in der Grundstellung. Gefunden und behoben: **Ja** (Daumen hoch) hielt den Arm fast am Körper, **Nachdenken** verdeckte mit der Hand das Gesicht → jetzt Hand am Kinn, Gesicht sichtbar. Vorher schon behoben: Positionsverschiebung der Figur nach Salto/Handstand bei mehrfachem Abspielen.

## 2026-10-05.20

* ✅ **Emote-Plätze bei vollem Rad änderbar.** Bisher kam man nur über einen leeren ＋-Platz ins Auswahlmenü – waren alle 8 Plätze belegt, ließ sich nichts mehr ändern oder entfernen. Jetzt öffnet im Rad die Taste **E**, der Knopf **„✎ Bearbeiten“** (unten im Rad, auch auf Touch) oder der Befehl **`/emotes`** das Menü. Im Menü: Platz wählen und Emote antippen ersetzt ihn; ist der Emote schon auf einem anderen Platz, **tauschen** beide; **✕** am Platz oder erneutes Antippen der markierten Karte **entfernt** ihn; „Standard wiederherstellen“ setzt Winken/Klatschen/Salto zurück. Der gewählte Platz wird oben im Text benannt. Test: 8 von 8 Plätzen belegt → ersetzen, tauschen, entfernen funktionieren.

## 2026-10-05.21

* ✨ **Neuer Emote „67“** (Nr. 24): beide Hände vorn, Handflächen nach oben, abwechselnd hoch und runter im Takt, dazu leichtes Wippen. Er liegt im Auswahlmenü (nicht im Rad vorbelegt) und wird wie alle anderen mit allen Spielern synchronisiert. Es gibt jetzt 24 Emotes (3 vorbelegt + 21 weitere).

## 2026-10-05.22

* ✅ **Beim Tod gehen nur noch 50 % der Erfahrung verloren** (vorher blieben nur 40 % der Level, der Fortschritt im Level fiel ganz weg). Berechnet wird jetzt aus allen gesammelten Erfahrungspunkten, die Hälfte bleibt erhalten und wird wieder in Level + Fortschritt umgerechnet. Test: Level 10 (160 Punkte) → Level 6 mit 80 Punkten, Level 30+20 → 707 von 1415, Level 40+100 → 1510 von 3020. Dazu ein Hinweis nach dem Respawn.

## 2026-10-05.23

* ✨ **Konten sperren (Dev-Konsole → Reiter „Konten“):** Knopf **„🚫 Sperren“** je Konto, dabei stellst du die **Nachricht** ein, die der Spieler sieht (wird beim nächsten Mal vorgeschlagen). Gesperrte Konten bekommen ein rotes „gesperrt“, dazu **„✔ Entsperren“** und **„✎ Nachricht“** zum Ändern. Ein gesperrtes Konto kann **auf keinen Server mehr** beitreten oder einen erstellen und sieht stattdessen „🚫 Dein Konto ist gesperrt: <deine Nachricht>“. Wer gerade online ist, wird sofort aus dem Spiel geworfen (gleiche Nachricht); fehlgeschlagenes Speichern löst zusätzlich eine Statusprüfung aus. **Alles bleibt erhalten:** Konto, Spielerdaten, Inventar, Server und Welten werden nicht angefasst, nach dem Entsperren geht es genau dort weiter. Die Sperre wird in der Datenbank erzwungen (Anmeldung, Beitreten, Erstellen und alle schreibenden Funktionen), nicht nur im Spiel. Einmalig `supabase/dev_console_part5.sql` im Supabase-SQL-Editor ausführen (setzt Teil 4 voraus).

## 2026-10-05.24

* ✨ **Unterrichts-Abfrage:** Montag bis Freitag, während der Schulstunden (1. 07:55–08:40, 2. 08:50–09:35, 3. 09:50–10:35, 4. 10:45–11:30, 5. 12:05–12:50, 6. 12:55–13:40, 7. 13:55–14:40; nach Gerätezeit) erscheint beim Öffnen des Spiels – noch vor dem Menü – eine Vollbild-Frage mit lustigem Text (6 Varianten, zufällig), welche Stunde gerade läuft und den Knöpfen **„Ja, ich darf das! (Ehrenwort)“** und **„Nein, ich bleibe brav und warte auf die Pause“**. Bei Ja geht es normal weiter (für diese Stunde gemerkt, in der nächsten Stunde wird neu gefragt). Bei Nein läuft ein Countdown bis zur Pause, danach öffnet sich das Spiel mit „PAUSE! Zocken erlaubt“; „Ups, verklickt“ führt zurück. Beginnt mitten im Spiel eine Stunde, kommt nur ein kleiner Hinweis (kein Rauswurf). In Pausen, nach 14:40 und am Wochenende kommt nichts. Ausschaltbar unter Einstellungen → „Unterrichts-Abfrage“.

## 2026-10-05.25

* ✅ **Unterrichts-Abfrage nicht mehr abschaltbar:** Die Einstellung „Unterrichts-Abfrage“ ist entfernt, die Frage kommt immer (auch wenn ein alter Spielstand der Einstellungen etwas anderes gespeichert hat).


## 2026-10-05.26

* ✨ **Befehls-Limits aufheben (Dev-Konsole → Einstellungen → „Befehls-Limits“):** Du kannst einzelnen Spielernamen (oder allen) erlauben, die Höchstwerte der Befehle zu überschreiten. Freigegebene Spieler haben dann **kein Limit mehr** bei `/fill` (sonst 40 000 Blöcke), `/sphere` (Radius 20), `/give` (2304), `/summon` (20), `/explode`, `/effect`, `/xp`, Zeit-/Zahlenargumenten usw. – bei allen Befehlen mit Zahlen-Obergrenze (`argNum`) entfällt die Obergrenze (die Untergrenze bleibt). Wirkt nur bei Spielern, die Cheat-Befehle nutzen dürfen.
* ✨ **Warnschwelle einstellbar** (Standard 100 000, 1 000 – 2 Mrd.): Ab dieser Größe (Blöcke bei `/fill`/`/sphere`) bzw. bei `/explode` Stärke > 24 und `/summon` > 50 Mobs zeigt das Spiel „⚠ Große Aktion: … Gib den Befehl innerhalb von 30 Sekunden noch einmal ein“ – erst der identische zweite Aufruf führt aus.
* ✨ **Große Bauaktionen laufen zeitverteilt:** `/fill` > 40 000 Blöcke und `/sphere` > Radius 20 werden in kleinen Häppchen (8 ms pro Bild) im Hintergrund gebaut, mit Fortschrittsanzeige in %, **`/fillstop`** bricht ab, `/undo` geht bis 2 Mio. Blöcke. Nicht geladene Chunks werden übersprungen (Hinweis im Chat). Nur eine große Aktion gleichzeitig.
* Das Limit gilt nur online und nur, solange der Server die Freigabe bestätigt (Abfrage beim Beitritt, danach jede Minute; beim Verlassen zurückgesetzt). Einzelspieler/lokal: weiter mit Limits. Einmalig `supabase/dev_console_part6.sql` im Supabase-SQL-Editor ausführen (setzt Teil 4 voraus).
* Getestet: gesperrt (alte Fehlermeldungen), freigegeben (125 000-Block-Fill: Warnung → Bestätigung → Fertig nach ~9 s, `/undo`, `/fillstop` mittendrin, Kugel Radius 30, `/give` 5000, `/summon` 60, `/explode` 30) und Dev-Konsole mit Fake-RPCs (speichern, alle, aus, falsche Schwelle, fehlendes SQL).

## 2026-10-05.27

* ✨ **Befehls-Limits auch im Einzelspieler:** Beim Start eines Einzelspieler-Spiels (und danach jede Minute) fragt das Spiel mit dem gespeicherten Multiplayer-Konto (Name + geheimes Token dieses Browsers) bei der Datenbank nach, ob dieses Konto in der Dev-Konsole freigegeben ist. Wenn ja, gelten im Einzelspieler dieselben Regeln wie online (unbegrenzt `/fill`, keine Maximalzahlen, Warnschwelle). Der zuletzt bekannte Stand wird gemerkt, damit es auch offline klappt; wird die Freigabe entzogen, endet sie beim nächsten Abgleich. Ohne Multiplayer-Name (nie online gespielt) gelten die normalen Limits.
* ✨ **Leistungsmodus:** schaltet sich **automatisch** ein bei Bauaktionen ab **40 000 Blöcken** (`/fill`, `/sphere`), bei `/explode` ab Stärke 24 und wenn **12 oder mehr TNT gleichzeitig** gezündet sind. Er senkt die Sichtweite auf 3 Chunks, die Auflösung, blendet Wolken/Regen aus und reduziert Partikel und das TNT-Blinken. Nach 8 s Ruhe (keine Bauaktion, kein TNT, Chunks fertig) geht er von selbst aus und stellt deine Sichtweite wieder her (gespeichert wird immer deine eigene Einstellung). Einstellbar unter Einstellungen → „Leistungsmodus“ (Automatisch / Immer an / Aus) oder per `/perf auto|on|off`.
* Fix: Eine noch laufende große Bauaktion wurde beim Start einer neuen Welt nicht beendet.
* Getestet: Einzelspieler mit gefälschter Datenbank (Freigabe → unbegrenzt, Entzug → Limit, Cache), 144 000-Block-Fill (Modus an, Sichtweite 3, nach ~13 s wieder aus mit Sichtweite 6), 14 TNT (Modus an), Einstellung „Aus“.
