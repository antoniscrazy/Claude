# VOXELCRAFT – Bug-Liste (Stand 2026-10-05.33)

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

## 2026-10-05.28

* ✨ **Ladebalken bei großen Aktionen:** Oben am Bildschirm erscheint ein Balken mit Prozent für `/fill`/`/sphere` (ab 40 000 Blöcken), für riesige Einzelexplosionen (`/explode`, über 50 000 Felder) und für **TNT-Ketten ab 150 gleichzeitig gezündeten TNT** („💥 TNT-Kette: 1 531 von 1 537 explodiert – 99 %“). Darunter steht, wann zuletzt gespeichert wurde; `/fillstop` bricht alles ab (auch Explosionen).
* ✅ **Absturzschutz bei TNT:** Explosionen werden bei vielen TNT / riesigem Radius in eine Warteschlange gestellt und zeitverteilt (8 ms pro Bild) abgearbeitet statt alle im selben Bild. Ab 120 gleichzeitig brennenden TNT sind weitere nur noch unsichtbare Zünder (kein Modell, keine Physik); Explosionstöne und Mehrspieler-Meldungen werden gedrosselt. Getestet mit 1 536 TNT in einem Block: lief durch, alles explodiert, kein Fehler.
* ✨ **Automatisches Speichern:** Beim Start jeder großen Aktion wird die Welt **sofort gesichert**, dann **alle 30 Sekunden** zwischengespeichert und am Ende noch einmal (Einzelspieler: Spielstand, online: Welt + Spielerdaten). Hinweise im Chat („💾 …“).
* ✅ **Speicher-Fix:** Spielstände speichern Blockänderungen jetzt als Läufe (ein 144 000-Block-Fill: 1,3 MB → 56 KB). Vorher hätte ein riesiger Fill den Browser-Speicher (~5 MB) gesprengt und das Speichern wäre fehlgeschlagen. Alte Spielstände laden weiter. Schlägt Speichern trotzdem fehl, bleibt die alte Sicherung erhalten; ab ~4 MB gibt es eine Warnung. `/undo` gilt jetzt bis 500 000 Blöcke (größere Aktionen sind nicht rückgängig zu machen, um den Arbeitsspeicher zu schonen).

## 2026-10-05.29

* ✨ **Rückfrage bei 40 000 TNT:** Sind in einer TNT-Kette **40 000 oder mehr TNT** gezündet, erscheint ein Popup „💥 Über 40.000 TNT! – Echte Explosionskraft?“ mit **Ja / Nein**. Hintergrund: Bei so vielen TNT werden die Explosionen vereinfacht berechnet (damit nichts abstürzt) und richten kaum Schaden an. **Ja** löst zusätzlich eine echte Riesen-Detonation am Mittelpunkt der Kette aus (Radius ≈ 2,2 × ∛Anzahl, höchstens 100 – bei 40 000 TNT Radius 75) mit vollem Schaden an Spielern und Mobs (Reichweite doppelt so weit), die Welt wird vorher gesichert und der Ladebalken läuft mit. **Nein** bleibt bei der vereinfachten Kette. Im Einzelspieler ist das Spiel pausiert, bis du antwortest (Esc pausiert das Popup nicht weg); im Mehrspieler läuft es weiter und ohne Antwort gilt nach 20 s „Nein“.
* Getestet: Popup erscheint, Spiel + TNT eingefroren, „Ja“ → Radius-75-Detonation über die Warteschlange (Spieler in der Nähe stirbt), „Nein“ → keine Detonation, kein Schaden.

## 2026-10-05.30

* ✅ **Seed-Eastereggs „67“ und „steve“ hingen in der Weltgenerierung fest:** Seit die Strukturen in tiefen Welten erst nach den Höhlen gebaut werden, gab es in der Egg-Plattform noch keine Strukturliste (`structOut`) – der Zugriff warf bei jedem Chunk einen Fehler, die Welt wurde nie fertig. Behoben (Zugriff abgesichert). Getestet: beide Seeds laden wieder, die große 67 (gelb, mit Aussichtshügel) und die Steve-Statue stehen direkt vor dem Spawn.

## 2026-10-05.31

* ✨ **Neues Seed-Easteregg „paris“** (Groß-/Kleinschreibung egal): Die Welt startet mitten in Paris auf einer ebenen Plattform (160 × 224 Blöcke). Spawn auf dem Champ de Mars, Blick zum Turm. Enthalten: **Eiffelturm** (110 Blöcke hoch, Eckpfeiler, Fachwerk mit Diagonalen, Bögen unten, drei Plattformen mit Geländer, leuchtende Lichter, Spitze; innen eine **Leiter** bis zur obersten Plattform), die **Seine** mit **Brücke** (Pont d'Iéna) und Kaimauern, die **Avenue** mit Bäumen und Laternen zum **Arc de Triomphe** (mit Kreisverkehr, großem Bogen, Seitenbögen, ewiger Flamme), die **Louvre-Glaspyramide** im Hof dreier Schlossflügel, **Notre-Dame** (zwei Türme mit Zinnen, Portale, blaue Rosette, Schiff mit Strebepfeilern und Dachreiter), **Haussmann-Häuser** (5 Stockwerke, Balkone, Mansarddach, Schornsteine, innen begehbar mit Leitern) samt **Cafés** (rot-weiße Markisen, Tische), **Blumenbeete** auf dem Champ de Mars und die **École Militaire** mit Kuppel am Ende der Achse. Alles aus normalen Blöcken, kreativ weiterbaubar.
* ✅ **Eastereggs in tiefen Welten gehärtet:** Die Plattform wird nach der Höhlen-Erzeugung noch einmal aufgestempelt, damit Höhlen/Schluchten sie nicht anschneiden (gilt auch für „67“ und „steve“; die große Paris-Fläche wird außerdem nicht von Zufallsstrukturen überbaut).
* Getestet: Welt lädt ohne Fehler, Screenshots von Turm, Arc, Notre-Dame, Häusern; Leiter im Turm benutzbar (Spieler klettert), Brücke/Wasser vorhanden, „67“ und „steve“ laden weiter.

## 2026-10-05.32

* ✨ **Boss-Kampf „Der Riese“ – `/animation [leben]` (nur Admin, nur Mehrspieler, nur in der Oberwelt):** Alle Spieler der Oberwelt werden auf eine **Bedrock-Bühne** (Kreis, Radius 34, Mauerring, Deckungssäulen, leuchtende Markierungen) hoch am Himmel geholt (170 Blöcke hoch, nur lokal – wird nichts gespeichert, am Ende wieder entfernt). Es regnet, dann **erwacht der Admin als 10-fach großer Riese** (Intro mit Kamerafahrt, Wachstum, Titel, Brüllen, Letterbox). Danach ist es ein **Boss-Kampf in Echtzeit**: Die Spieler können sich normal bewegen und kämpfen (Schwert, Pfeile), der Admin steuert den Riesen selbst (Dritte-Person-Kamera hinter ihm, Schritte lassen den Boden beben). Oben erscheint für alle eine **Boss-Leiste** (Leben, Phasen-Markierungen bei 66 % / 33 %, Nachzieh-Balken).
* **Angriffe des Riesen (Admin):** **LMB Hieb** (Schwung mit Körperdrehung, schleudert Spieler weg) · **RMB Packen & Fressen** (Riese beugt sich, greift den nächsten Spieler vor sich, hebt ihn zum Mund, kaut, schluckt – der Spieler ist währenddessen eingefroren und sieht den Riesen aus der Hand-Perspektive; er wird **gefressen**, der Riese heilt sich um 4 %) · **Q Stampfen** (Bein heben, Schockwelle läuft als Ring über die Bühne – drüberspringen!) · **F Feueratem** (Kegel, 24 Blöcke, Schaden über Zeit) · **R Brüllen** (Druckwelle schleudert alle weg). Abklingzeiten werden unten angezeigt. In **Phase 2 und 3** wird der Riese wütend (schneller, stärker, kürzere Wartezeiten) – mit Brüll-Animation und Titel.
* **Ultra schwer:** Leben standardmäßig 2 400 + 1 600 je Gegner (`/animation 20000` setzt es selbst), Riese ist schneller als Spieler, Hieb 11, Stampfen 13, Brüllen 4 Schaden (Phase 3 ×1,65), Feuer 2,6 pro Tick. **Gepackte Spieler können befreit werden:** Verursachen die anderen genug Schaden am Riesen (90 + 40 je Gegner), lässt er los (Stolper-Animation).
* **Spieler können den Riesen töten:** Treffer (Nahkampf und Pfeile) zählen gegen die Leiste (Trefferbox 3,2 × 18 Blöcke, max. 18 Schaden pro Treffer). Stirbt er: **Todesananimation** (Taumeln, Funken, Knien, Umfallen, Beben) → Titel „DER RIESE IST BESIEGT“, **Belohnung** für alle überlebenden Spieler (400 Erfahrung + Diamanten). Sind alle gefressen/besiegt, gewinnt der Riese.
* **Gefressene Spieler** schauen mit einer Zuschauer-Kamera zu, bis der Kampf vorbei ist, und **respawnen dann normal** (Todesbildschirm). Wer sonst stirbt, respawnt sofort normal. Am Ende kommen alle Überlebenden und der Admin an ihre alte Position zurück. `/animation stop` bricht jederzeit ab. Verlässt der Admin (>9 s), endet der Kampf.
* Spielstand/Speichern während des Kampfes nimmt die alte Position (kein Spawn in der Luft).
* Getestet (2 Clients, lokaler Server): Start, Bühne, Intro, Hieb-Schaden (11), Feuer-Schaden, Packen → Heben → Fressen (Spieler gesperrt, gefressen), Treffer auf den Riesen, Tod, Belohnung, Rückkehr + Aufräumen; alle Posen als Screenshots geprüft (Hieb, Stampfen, Feuer, Brüllen, Stolpern, Tod, Packen aus Opfer-Sicht).

## 2026-10-05.33

* ✅ **Boss in Ego-Perspektive:** Der Admin sieht den Riesen jetzt aus seinen eigenen Augen (Kamera vor dem Gesicht des Riesen, folgt Kopf und Beugen). Fadenkreuz bleibt sichtbar. ✅ **Fadenkreuz nach dem Boss weg – behoben:** Es wird jetzt in jedem Bild korrekt gesetzt und beim Beenden des Kampfes zurückgesetzt. Cooldown-Leiste liegt über der Herzleiste.
* 🎃 **HALLOWEEN-EVENT – `/event halloween` / `/event off` (nur Admin „Anton“):** Gilt für **alle Server und alle Welten – auch Einzelspieler/private Welten**. Der Schalter liegt in der Datenbank (`supabase/dev_console_part7.sql`, einmalig im SQL-Editor ausführen); jeder Client fragt ihn beim Start und danach jede Minute ab, auf dem aktuellen Server wird sofort per Ereignis umgeschaltet und Neulinge bekommen den Stand vom Host. Ohne die SQL-Datei wirkt der Befehl nur auf dem aktuellen Server bzw. lokal (der Chat sagt es). `/event` allein zeigt den Status. Ein offline gemerkter Stand verfällt nach 6 Stunden. Der Admin darf `/event` auch im Einzelspieler benutzen (Konto = zuletzt benutzter Multiplayer-Name).
* **Stimmung:** violetter Himmel (nachts tiefviolett, tagsüber orange-rosa), riesiger roter Blutmond, Nebel, fallendes Herbstlaub in 5 Farben, grüne Irrlichter, Gewitter-Blitze ohne Regen, Zufallsgeräusche (Wolfsheulen, Kirchenglocke, Hexenlachen, Geisterchor, knarrende Tür, Eule, Fledermäuse), Titel „🎃 HALLOWEEN“ beim Start, Anzeige „🎃 Halloween-Event“. Beim Ein-/Ausschalten werden entfernte Chunks neu erzeugt (mit bzw. ohne Deko – Änderungen der Spieler bleiben).
* **11 neue Mobs – alle Modelle UND Texturen selbst gezeichnet (nichts aus dem Pack):** **Kürbiszombie** (Kürbiskopf mit leuchtendem Gesicht), **Spuk-Skelett** (grüne Augen, Zylinder, schießt), **Kürbis-Creeper**, **Giftspinne** (Stundenglas, rote Augen), **Kürbis-Fledermaus**, **Geist** (durchsichtig, schwebt durch Wände, verlangsamt), **Hexe** (hält Abstand, wirft Feuerzauber, trinkt Heiltränke, Hut wackelt), **Werwolf** (nachts schnell, Sprungangriff), **Vogelscheuche** (steht starr am Pfahl, erwacht in der Nähe), **Sensenmann** (Boss-Mob mit Sense, 160 Leben, blinzelt hinter dich, schlägt weit weg, ruft Geister, wütet bei wenig Leben) und die **Schwarze Katze** (buckelt und faucht). Eigene Stimmen für alle. In der Event-Nacht ersetzen sie die normalen Monster (80 %) und dazu kommen Geister, Hexen, Werwölfe, Vogelscheuchen und – selten – der Sensenmann; tagsüber streunen Katzen, in der Dämmerung kreisen Fledermäuse.
* **Neue Items (Symbole selbst gezeichnet):** Zuckermais, Lutscher (Tempo), Schokoriegel (Regeneration), Karamellapfel (Sprungkraft), Spukkürbiskuchen, Hexengebräu (Nachtsicht/Sprung/Stärke), Süßigkeiten-Eimer (Rechtsklick: 3–6 Süßigkeiten), Ektoplasma, **Sense des Sensenmanns** (Schwert, 11 Schaden). Alle Süßigkeiten sind craftbar; alle Event-Mobs lassen Süßigkeiten fallen, in allen Truhen liegen während des Events zusätzlich Süßigkeiten, und **„Süßes oder Saures“**: Dorfbewohner geben Süßigkeiten, wenn man einen Kürbis/eine Kürbislaterne in der Hand hält.
* **Strukturen (nur in neu erzeugtem Gelände, solange das Event läuft):** **Friedhof** (Eisenzaun mit Laternen am Tor, Gruft mit Truhe, Spinnweben und Kerzen, 6 Gräber, Kürbisse; Skelett + Geister), **Spukhaus** (2 Stockwerke, Moos-/Dunkeleichen-Look, Giebeldach, Fenster, Tür mit Kürbislaternen, Leiter nach oben, Bücherregale, Truhe; Geister + Hexe), **Kürbisfelder** mit Heuballen und Vogelscheuche, einzelne **Gräber** mit Kerzen und toten Büschen, **tote Bäume** mit Spinnweben. Sie werden nur auf ebenem, freiem, natürlichem Boden gebaut (keine Bäume/Wasser/andere Strukturen im Weg, nie in Chunks mit Spieler-Bauten) und lassen sich nirgends überlappen.
* Getestet: Ein-/Ausschalten im Einzelspieler und über zwei Clients (Berechtigung, Broadcast), Himmel/Blutmond, alle 11 Mobs (Modelle als Screenshots, KI: Angriffe, Feuerzauber, Sprung, Aufwachen, Sensenmann), Beute, Eimer, Rezepte, Symbole im Inventar, Friedhof und Spukhaus als Screenshots, natürliches Spawnen, Chunk-Neuaufbau beim Umschalten ohne Fehler.

## 2026-10-05.34

* ✍ **Schilder:** Neuer Block „Schild“ (Bauteile; Rezept: 6 Bretter + 1 Stock → 3 Schilder, an der Werkbank). Auf den Boden gesetzt entsteht ein **Standschild** (Vorderseite zeigt zu dir), an einer Wand ein **Wandschild**. Direkt nach dem Setzen öffnet sich der Editor (4 Zeilen à 15 Zeichen, Live-Vorschau); **Rechtsklick** auf ein Schild bearbeitet es später erneut (mit Schleichen/Shift wird stattdessen normal daneben gebaut). Der Text wird als Schrift auf dem Schild angezeigt, nur lesbar von der Vorderseite. Fällt der Untergrund weg oder wird das Schild abgebaut, verschwinden Schild und Text. Im Einzelspieler im Spielstand, im Mehrspielermodus über denselben Datenbank-Kanal wie Truhen (kein neues SQL nötig) – auch Spieler, die später beitreten, sehen die Schilder.
* 📖 **Buch und Feder:** Neues Item (Rezept: Buch + Feder + schwarzer Farbstoff). Rechtsklick öffnet das Buch: bis zu 12 Seiten à 256 Zeichen, Blättern, mit „＋“ neue Seite. Tasten wie E/W/A/S/F/Q steuern beim Schreiben nicht das Spiel. Der Inhalt bleibt im Item (auch beim Wegwerfen, in Truhen, im Mehrspielermodus und im Spielstand).
* 🖋 **Signieren:** Im Buch „Signieren“ → Titel (max. 24 Zeichen) eingeben → das Buch wird zum **Signierten Buch** und ist **danach für niemanden mehr änderbar** (kein Rückweg, auch nicht für Admins). Der Autor ist normalerweise dein Spielername (gesperrt, nicht änderbar). **Im Admin-Modus (Anton nach /admin, im Einzelspieler als Anton) steht ein Namensfeld zur Verfügung: der Admin wählt den Autorennamen frei.** Das signierte Buch schimmert wie ein verzaubertes Item, im Tooltip stehen Titel und Autor; geöffnet zeigt es erst die Titelseite, dann die Seiten (nur lesen). Gibt es einen Stapel Bücher, wird nur eins signiert.
* Technik: 8 neue Block-IDs (am Ende angehängt – alte Welten bleiben gültig), 3 neue Symbole selbst gezeichnet, Buch-Daten in `stack.ench._bk` (kein Verzaubern/keine Falschanzeige), Schild-Text im Container-Kanal als `{sg:[…]}`.
* Getestet (Playwright): Schild setzen/beschriften/erneut öffnen/abbauen, alle 4 Wand- und 4 Standrichtungen (Screenshots: Text auf der Vorderseite), Speichern + Laden im Einzelspieler, 3 Clients im Mehrspielermodus (Schild und Bearbeitung sichtbar, Spätbeitritt lädt aus der Datenbank, Abbau entfernt es überall), Buch schreiben/blättern/speichern/signieren, Nicht-Admin: Autor gesperrt und nicht fälschbar, Admin: Autor frei wählbar, Stapel-Signieren, Rundreise durch `packItems/unpackItems`.

## 2026-10-05.35

* ⚔ **Boss: nicht mehr aus der Arena fliehen.** Die Arena-Grenze gilt jetzt für alle Spieler und den Riesen: Rückstoß, Teleport (`/tp`, Enderperle), Fliegen, Weitwurf oder Durchfallen setzen dich zurück auf die Bühne (weit draußen → wieder an einen Platz am Rand). Während des Kampfes lassen sich auf der Bühne keine Blöcke setzen oder abbauen (vorher hätte das in der Datenbank gespeichert werden können). Wird ein weit entfernter Chunk entladen und ohne Bühne neu erzeugt, baut ihn der Kampf automatisch wieder auf.
* 💚 **Respawn im Kampf:** Wer besiegt (Leben 0) oder gefressen wird, stirbt nicht mehr: du schaust 5 Sekunden zu (Kamera schwebt über der Arena, „Zurück im Kampf in N s“), kommst dann **voll geheilt** an einem Platz weit weg vom Riesen zurück, hast **4 Sekunden Schutz** und kämpfst weiter. Inventar und Erfahrung bleiben (kein Todesbildschirm, keine verlorenen Items). Der Kampf endet nur noch durch den Sieg, `/animation stop` oder wenn alle Gegner weg sind (10 s) – die frühere Niederlage „alle gefressen“ gibt es nicht mehr.
* 🍀 **Bessere Chancen:** Schaden des Riesen −20 % (Phase 1) bis −18 % (Phase 3), Hieb 11→8, Schockwelle 13→9, Feuer 2,6→1,8; Angriffe kommen ~25 % seltener (längere Wartezeiten); Packen braucht weniger Schläge zum Befreien (60+30/Spieler statt 90+40); der Riese heilt beim Fressen nur noch 1,5 % statt 4 %; deine Treffer auf den Riesen zählen **1,6×**; ohne Treffer heilst du dich im Kampf langsam (+1 Herz alle 2,5 s nach 5 s Ruhe), Hunger bleibt voll.
* 🚪 **Verlassen/Wiederbeitreten repariert:** (1) Wer mitten im Kampf das Spiel verlässt, wird jetzt an seine alte Position zurückgesetzt – vorher wurde die Arena-Position (hoch am Himmel) gespeichert und man startete beim nächsten Mal im Nichts. Auch gespeichert werden jetzt die alten Leben. (2) Wer (wieder) beitritt, während der Kampf läuft, wird automatisch **mitten in den laufenden Kampf geholt** (ohne Intro, mit Schutz) – der Admin schickt die Einladung, bis sie ankommt. (3) Verlässt der Admin das Spiel, endet der Kampf bei den anderen nach 6 s sauber, alle landen wieder an ihrer alten Stelle. (4) Verlässt jemand das Spiel, taucht er nicht mehr als „gepackt/gefressen“ auf; Listen (gefressen/ausgeschieden) werden jetzt vom Admin laufend synchronisiert.
* Getestet (2 Clients, Mehrspieler lokal): Rückstoß nach außen, Teleport 700 Blöcke weit, Hochfliegen → bleibt in der Arena; Tod → Zuschauer → Respawn voll geheilt; Gefressen → Respawn; Tab schließen + wieder beitreten → im Kampf, Position davor korrekt; Admin verlässt → Kampf endet.

## 2026-10-05.36

* 🛡 **Admin-/tp zu Offline-Spielern:** Im Admin-Modus (Anton nach `/admin`) teleportiert `/tp <name>` jetzt auch zu Spielern, die gerade **offline** sind – an die Stelle (und in die Dimension), wo sie das Spiel verlassen haben (mit „zuletzt vor N Min.“). Offline-Namen stehen in der Tab-Vervollständigung. Andere Spieler/OPs können das nicht. **Dafür einmalig `supabase/dev_console_part8.sql` im Supabase-SQL-Editor ausführen** (liefert nur Position/Dimension, kein Inventar; nur für „Anton“ mit gültigem Token). Lokale Server gehen ohne SQL.
* 👁 **HEROBRINE:** Beschwörung wie auf dem Bild – **Schrein: 3×3 Goldblöcke, Netherrack in der Mitte, 4 Redstone-Fackeln um das Netherrack, dann das Netherrack mit dem Feuerzeug anzünden** (Reihenfolge egal: auch die letzte Fackel löst es aus). Neu dafür: **Feuer-Block** (brennt auf Netherrack, verbrennt Spieler, mit der Hand löschbar). Blitze schlagen in den Schrein, Herobrine erscheint nach ein paar Sekunden in der Ferne. Er ist ein **echter Spieler**: dein Herobrine-Skin, Namensschild, steht in der **Spielerliste (Tab)**, „Herobrine ist beigetreten/hat das Spiel verlassen“, schreibt in den **Chat** (`<Herobrine> …`, nennt Spieler beim Namen). Funktioniert in Mehrspieler **und Einzelspieler**.
* **Was er tut:** beobachtet aus der Ferne und verschwindet im Rauch, wenn man näher kommt oder ihn zu lange ansieht; läuft herum; taucht hinter dir auf (Jumpscare mit Blitz und Geräusch); Blitzhagel rund um dich; und im Verborgenen: **1×2-Tunnel mit Redstone-Fackeln**, **Sand-Pyramiden**, **2×2-Türme**, stellt **Redstone-Fackeln** und **Schilder mit Drohungen** (`ICH SEHE DICH` …) auf, entfernt deine Fackeln, ruft Zombies/Skelette/Spinnen mit Blitz. Der Himmel wird dunkelrot-grau, Flüstern in der Ferne. Wer ihn schlägt, macht ihn wütend (er ist unverwundbar, weicht aus und reagiert); ab Zorn 3 **jagt er dich** mit Gewitter und schlägt zu (5 Schaden, Rückstoß, alle Spieler können Ziel sein).
* **Steuerung:** Der Beschwörer-Client simuliert die KI und sendet Position/Aktionen; alle anderen zeigen nur an (Block-Änderungen laufen wie normal über die Datenbank). Verlässt der Beschwörer das Spiel, verschwindet er. Späte Beitritte sehen ihn.
* **Stoppen (nur OPs, jederzeit):** `/herobrine stop`. Außerdem `/herobrine undo` (macht alle seine Bauwerke/Tunnel/Schilder rückgängig, solange der Beschwörer-Client noch läuft), `/herobrine summon` (ohne Schrein) und `/herobrine status`. Die Schreibweisen `/herobrien` und `/herebrien` gehen auch.
* Getestet: Schrein-Erkennung und Anzünden (Screenshot), Aussehen/Skin (Screenshot), KI-Simulation über ~7 Minuten (alle Zustände, 500+ Änderungen, Schilder, Mobs, Undo ohne Fehler), 3 Clients im Mehrspielermodus (Beschwörung, Sichtbarkeit, Chat, Spielerliste, Schaden mit „von Herobrine besiegt“, Schlagen → Zorn, Nicht-OP darf nicht stoppen, Spätbeitritt, OP stoppt), Offline-/tp mit lokalem Server.

## 2026-10-05.37

* 🧠 **Herobrine hat jetzt eine eigene KI (Groq, Modell `openai/gpt-oss-20b`).** Man kann **richtig mit ihm chatten**: Schreib seinen Namen („Herobrine, wer bist du?“, auch „hero“) oder sprich ihn an, wenn er sichtbar und weniger als 30 Blöcke weg ist – dann antwortet er (nach kurzer „Tippzeit“) im Chat, in Rolle (düster, deutsch, kurz), kennt die Spieler beim Namen, merkt sich den Gesprächsverlauf und die Lage (Tageszeit, Wetter, Abstand, Leben, was du in der Hand hast, was er zuletzt getan hat).
* **Die KI steuert auch sein Handeln:** Alle ~30–60 s fragt er das Gehirn, was er als Nächstes tut, und jede Antwort kann Aktionen enthalten: Blitz, Blitzhagel, beobachten, herumlaufen, hinter dir auftauchen, jagen, verschwinden, Tunnel, Pyramide, Turm, Redstone-Fackel, **Schild mit selbst gewähltem Text**, deine Fackeln entfernen, Monster rufen, Gewitter an/aus, Schreck, Flüstern und **kleine Geschenke** (Brot, Apfel, goldener Apfel, Fackel, Buch, Diamant). Wer ihn ärgert, wird gejagt. Mit KI wird das Zufallsprogramm (Zufalls-Chat, Zufalls-Bauwerke) abgeschaltet; Bewegung, Verschwinden und Sichtbarkeit laufen weiter wie bisher.
* **Sicherheit:** Es sind nur diese festen Aktionen erlaubt (Whitelist; max. 2 pro Antwort, Bauaktionen höchstens alle 15 s, Jagd alle 45 s, Geschenke nur aus der Liste, max. 3); keine Befehle, keine Admin-Rechte, Texte werden bereinigt. Weiter gilt: nur OPs stoppen ihn (`/herobrine stop`), `/herobrine undo` macht seine Bauwerke rückgängig. Er verrät nie, dass er eine KI ist.
* **Ausfallsicher:** Ohne Schlüssel, bei Rate-Limit (Pause 45 s), Netzwerkfehler (wachsende Pause, einmalige Chat-Meldung) oder abgelehntem Schlüssel (KI aus) handelt und antwortet Herobrine weiter wie vorher nach Zufall – das Spiel stockt nie. Anfragen laufen höchstens eine gleichzeitig, max. 500 pro Stunde.
* **Wo die KI läuft:** nur auf dem Rechner des Beschwörers (der steuert Herobrine) – nur dieser braucht den Schlüssel; alle anderen sehen und hören ihn einfach im Chat. Einzelspieler: dein eigener Rechner.
* **Der Groq-Schlüssel gehört NICHT ins Repository** (in öffentlichen Repos werden solche Schlüssel von Groq/GitHub automatisch gesperrt, und im Spiel-Code kann ihn jeder auslesen). Zwei Wege: (1) im Spiel `/herobrine key gsk_…` (nur OPs; gespeichert nur auf diesem Gerät; `/herobrine key off` entfernt ihn), oder (2) eine Kopie mit eingebautem Schlüssel bauen: `GROQ_KEY=gsk_… python3 tools/inject_groq_key.py` → `index.keyed.html` (steht in `.gitignore`). `/herobrine status` zeigt den KI-Zustand, `/herobrine ki on|off` schaltet sie.
* Getestet (mit nachgebildeter Groq-Antwort, da das Test-System keinen Zugriff auf api.groq.com hat – der echte Aufruf ist **nicht** live geprüft): Chat → Antwort + Aktion (Blitz, Schild), Rückfall bei abgelehnten Parametern (3 Anfrage-Varianten), Klartext statt JSON, böse Aktionen werden ignoriert, Rate-Limit-Pause, abgelehnter Schlüssel, Direktor-Anfragen, Mehrspieler (anderer Spieler schreibt, Antwort bei allen; ohne Ansprache keine Anfrage).

## 2026-10-05.38

* ➖ **Herobrines KI entfernt:** Herobrine handelt und schreibt wieder nur nach dem eingebauten Zufallsprogramm (kein Groq mehr, `/herobrine key|ki` gibt es nicht mehr). Der Groq-Schlüssel wird jetzt für den neuen KI-Spieler benutzt.
* 🤖 **`/ai` – ein KI-Spieler, der Minecraft SPIELT (nur OPs, nur Mehrspieler):** `/ai` (oder `/ai <name>`) ruft einen Spieler („Alex“) neben dich. Er steht in der **Spielerliste (Tab)** wie jeder andere, hat Skin und Namensschild, **schreibt im Chat** und führt **Befehle per Chat** aus: „Alex, besorge mir eine Eisenrüstung“, „Alex, bau ein Haus aus Stein“, „Alex, komm mit“, „Alex, gib mir 10 Holz“. Alle Spieler dürfen ihm schreiben (Name im Satz genügt, danach 45 s lang ohne Namen); `stopp`/`halt`/`hör auf` bricht sofort ab. `/ai stop` (OP) entlässt ihn, `/ai status` zeigt Aufgabe und Inventar, `/ai key <schlüssel>` setzt den Groq-Schlüssel (nur dieses Gerät).
* **Gehirn: Groq `openai/gpt-oss-20b`.** Es liest die Lage (Position, Inventar, Rüstung, Spieler, Aufgabe, Ergebnisse, Chat) und wählt **Fähigkeiten** als JSON: `obtain` (besorgt irgendeinen Gegenstand komplett selbst), `give`, `goto`, `follow`, `collect`, `kill`, `build` (Haus, Turm, Mauer, Plattform, Pyramide, Brücke), `place`, `tunnel`, `equip`, `report`, `wait`, `say`, `stop`. Schlägt ein Schritt fehl, bekommt das Gehirn das Ergebnis und plant neu (bis zu 2×). Ohne Auftrag unternimmt er alle ~2 Minuten selbst etwas Sinnvolles. Ausfallsicher: ohne Schlüssel/Verbindung/bei Rate-Limit bleibt er höflich stumm bzw. sagt es, das Spiel läuft weiter.
* **Die Fähigkeiten sind echter Spielcode (läuft auf dem Rechner des OP, der `/ai` gestartet hat):** **Wegfindung (A\*)**, die Treppen in Hänge gräbt, Tunnel durch Stein legt, bis zu 3 Blöcke hinunterspringt und Lava meidet; **Abbauen** mit passender Werkzeugstufe und Abbauzeit (Holz → Stein → Eisen → Diamant, Bäume, Erze, Sand …), Beute ins Inventar; **Rezeptplaner** über alle Spielrezepte: `obtain iron_chestplate` fällt Bäume, craftet Bretter/Stöcke/Werkbank/Holzspitzhacke, baut Stein ab (Steinspitzhacke, Ofen), sucht und baut Eisen ab, stellt einen Ofen auf, schmilzt mit Brennstoff, craftet die Rüstung und legt sie an – komplett selbständig; **Jagd** (Leder, Fleisch, Knochen, Fäden …), **Bauen**, **Übergeben** an Spieler (er geht hin und legt die Items vor die Füße), Erkundung neuer Gebiete, wenn nichts in der Nähe ist. Er legt gefundene Rüstung wirklich an (sichtbar) und hält Werkzeug/Schwert in der Hand, Arm-Schwung beim Abbauen.
* **Schutz:** Er baut nur natürliche Blöcke, selbst gesetzte Blöcke und echte Bäume ab (keine Spielerhäuser, Kisten, Türen, Betten, Schilder); Bauvorhaben max. 700 Blöcke; keine Angriffe auf Spieler. Er ist unverwundbar (Mobs ignorieren ihn).
* **Mehrspieler:** Der Steuerer simuliert alles und sendet Position/Haltung/Rüstung/Chat (Ereignis `ai`); Weltänderungen laufen wie normal über die Datenbank. Verlässt der Steuerer das Spiel, verschwindet der Bot. Späte Beitritte sehen ihn.
* **Schlüssel:** gehört nicht ins Repository. Entweder im Spiel `/ai key gsk_…` oder `GROQ_KEY=gsk_… python3 tools/inject_groq_key.py` (→ `index.keyed.html`, in `.gitignore`).
* Getestet (Playwright; die Groq-Antwort wurde nachgebildet, weil das Test-System api.groq.com nicht erreicht – der echte Aufruf ist **nicht** live geprüft): Bot besorgt allein eine Holzspitzhacke (2 Welten), **eine Eisenbrustplatte aus dem Nichts** (Holz, Werkbank, Stein, Eisenerz, Ofen, Schmelzen, Craften – 3100 Schritte), baut ein Haus aus 93 Bruchstein; Mehrspieler mit 2 Clients: Nicht-OP darf `/ai` nicht, Bot erscheint in der Spielerliste, Begrüßung, Plaudern, Befehl „Holzspitzhacke“ → Plan → Bot besorgt sie und übergibt sie, Bob hat sie im Inventar, `/ai stop`.

## 2026-10-13.39

* 🔧 **Intern: verdeckter Bot-Modus** für automatisierte Spieler (nur per URL-Parameter, in der Oberfläche nicht sichtbar): läuft ohne Darstellung mit festem 20-Ticks-Takt unabhängig von der Bildrate und wird über eine Programmierschnittstelle gesteuert, die dieselben Spielregeln nutzt wie normale Spieler (Reichweite, Abbauzeit, Schaden, Hunger, Rezepte) – siehe `tools/BOT_API.md`. Normale Spieler merken nichts davon.
* `aiPath` (Wegfindung des `/ai`-Spielers) akzeptiert jetzt optional eine eigene Startposition/Kostenfunktion (für den Bot-Modus: ohne Graben); das Verhalten von `/ai` ist unverändert.

