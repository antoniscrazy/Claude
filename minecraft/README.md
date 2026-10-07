# VoxelCraft

Ein Minecraft-ähnliches Voxel-Spiel, das komplett im Browser läuft – eine einzige Datei: [`index.html`](index.html)
(Three.js wird von cdnjs geladen, alles andere ist eingebettet; nur der Online-Mehrspielermodus lädt zusätzlich `supabase-js` von jsdelivr).

## Starten

`index.html` im Browser öffnen (Doppelklick genügt) oder z. B. `python3 -m http.server` im Ordner starten.

## Steuerung

Die Steuerung schaltet automatisch zwischen Maus/Tastatur und Touch um (auch auf Touchscreen-Laptops); in den Einstellungen lässt sie sich auf „Maus & Tastatur“ oder „Touch“ festlegen.

| Aktion | Tastatur / Maus | Touch |
| --- | --- | --- |
| Bewegen | WASD | Joystick links |
| Umsehen | Maus (Klick ins Spiel fängt die Maus) oder Pfeiltasten | Wischen auf der rechten Fläche |
| Springen / Schwimmen (im Kreativmodus: Doppeltipp = Fliegen an/aus) | Leertaste | ▲-Button (rechts unten) |
| Schleichen (kein Abstürzen von Kanten) | Shift | Knopf ▼ unter dem Sprung-Knopf (im Flug: halten = sinken) |
| Sprinten | Strg oder W doppelt tippen | Knopf » links neben ▲ / ▼ (oder Joystick ganz nach vorn) |
| Abbauen / Angreifen | Linksklick (halten) | Finger gedrückt halten |
| Platzieren / Essen & Trinken (gedrückt halten, ~1,3 s, mit Animation) | Rechtsklick | kurz antippen / halten |
| Fackeln an Wänden | Rechtsklick auf die Seite eines Blocks | genauso |
| Hotbar | 1–9 / Mausrad | Slots antippen |
| Inventar & Handwerk | E (oder Rechtsklick auf Werkbank/Ofen) | Button „Inventar“ |
| Item fallen lassen (Strg+Q = ganzer Stapel; im Inventar: außerhalb klicken) | Q | Knopf „Fallen“ |
| Chat & Befehle | T / Enter, `/` für Befehle | Button „Chat“ |
| Spielerliste (Mehrspieler) | Tab (halten) | – |
| Minikarte an/aus | N | Pausenmenü → Einstellungen |
| Screenshot | F2 | Pausenmenü |
| Fernrohr (Zoom) | Rechtsklick halten | – |
| Ton an/aus | M | Pausenmenü |
| Flugmodus (Kreativ) | F, runter: C | Button „Fliegen“, ▼ |
| Debug-Anzeige | F3 | – |
| Pause | Esc | Button „Pause“ |

## Befehle (Chat: T, Enter oder `/`)

Der Chat funktioniert im Einzel- **und** Mehrspielermodus. Beim Tippen von `/` erscheint eine **Vorschlagsliste** mit Symbolen und Beschreibung:
**Tab** übernimmt den markierten Vorschlag (Shift+Tab rückwärts), **↑/↓** wählt aus (ohne Vorschläge: Verlauf), **→** übernimmt am Zeilenende,
per Klick/Tippen geht es auch. Die Vorschläge kennen Befehle, Spielernamen, Blöcke/Items (auch deutsche Namen), Mobs, Effekte, Koordinaten (`~`) und Homes.

| Gruppe | Befehle |
| --- | --- |
| Allgemein | `/help [befehl]`, `/pos`, `/seed`, `/time`, `/fps`, `/clearchat`, `/roll [max]`, `/save`, `/kill`, `/me`, `/achievements`, `/map`, `/screenshot` |
| Bewegung | `/tp <spieler>` · `/tp x y z` · `/tp x z`, `/back`, `/spawn`, `/setspawn`, `/sethome [name]`, `/home [name]`, `/homes`, `/delhome <name>` |
| Mehrspieler | `/players`, `/msg <spieler> <text>` (`/w`), `/r <text>` |
| Cheats* | `/gamemode`, `/give <item> [anzahl]`, `/kit <paket>`, `/clear`, `/repair`, `/day`, `/night`, `/time set\|add`, `/weather <clear\|rain\|thunder>`, `/lightning`, `/heal`, `/feed`, `/fly`, `/speed`, `/god`, `/effect`, `/nv`, `/summon <mob> [n]`, `/killall`, `/setblock`, `/fill … [replace\|hollow\|outline\|keep]`, `/sphere`, `/undo`, `/explode`, `/difficulty`, `/gamerule` |

\*Cheat-Befehle gibt es im Einzelspieler und in Kreativ-Welten des Mehrspielermodus (in Überlebens-Welten bleiben nur die sozialen Befehle).
Zeit-, Wetter- und Blitzbefehle werden im Mehrspielermodus an alle Spieler übertragen. Homes und Spielregeln werden pro Welt im Browser gespeichert.

**`/locate <biom|struktur>`** (Cheat, Tab-Vervollständigung): sucht das nächste Biom (`wald`, `wueste`, `dschungel` …) oder die nächste Struktur (`dorf`, `pyramide`, `burgruine`, `minenschacht`, `tiefenfestung`, `schlucht`, `geode`, `festung` …) und nennt Koordinaten, Entfernung und Himmelsrichtung samt fertigem `/tp`-Befehl. Ohne Namen zeigt der Befehl die Liste; Umlaute und englische Namen gehen auch. Neue Strukturen gibt es nur in tiefen Welten.

## Inhalt

* **Tiefe Welten (ab Version 2026-10-05):** Neue Welten/Server sind **256 Blöcke hoch** (y 0–255, Baulimit mit Meldung über der Hotbar). Das Gelände liegt bei y≈86 (Meeresspiegel), Berge reichen bis über y 180, darunter liegen **64 Blöcke tiefe Unterwelt** mit Grundgestein, Tiefenschiefer, **Käsehöhlen** (riesige Hohlräume), Spaghetti- und Nudelhöhlen, **Schluchten**, Grundwasser, Lavaseen, echten Tiefen-Erzen (Diamanten nur nahe y 2–17), Tropfstein-, Moos- (Leuchtbeeren, Sporenblüten) und **Amethyst-Geoden**. Ab Version 2026-10-05.4 hat das Gelände **weiche Übergänge** (Biom-Höhenformen werden gemischt, Klimagrenzen sind verwirbelt), **Flusstäler**, mehr Relief und eine unregelmäßige Schneegrenze; Strukturen bekommen eine sanfte Rampe statt einer Klippe und werden erst nach den Höhlen gebaut (nichts schwebt oder wird angeschnitten). Ältere Welten und Server behalten ihre alte Form, dürfen aber jetzt auch bis y 255 bauen.
* **Viele neue Strukturen (tiefe Welten):** Dörfer (Häuser, Bibliothek, Schmiede, Brunnen, Felder, Laternen, Dorfbewohner), Wüstenpyramiden mit TNT-Falle, Dschungeltempel, Iglus, Sumpfhütten, Ruinen-Portale, Burgruinen mit Türmen und Bergfried, Steinkreise, Lager, Leuchttürme, Schiffswracks und Ozeanruinen, Findlinge, Heuhaufen, Gräber, Ruinensäulen, vergrabene Schätze, umgestürzte Bäume – unter Tage **Minenschächte** (Schienen, Stützen, Spinnenkäfig, Truhen), **Tiefenfestungen** (Sculk, Soul-Laternen, Schatzkammer), Fossilien, Kupfer-Prüfkammern und tiefe Verliese. Eigene Beutetabellen je Struktur.
* **Spielregel `backrooms`:** `/gamerule backrooms false` schaltet die Backrooms ab (Sand-Falle und `/backrooms` tun dann nichts); gilt auf Servern für alle. **Nether-Decke:** im Nether darf bis y 127 gebaut werden, also auch oben auf der Bedrock-Decke. **Enderperlen** landen nur noch auf der Seite der Wand, an der sie einschlagen, und suchen einen freien Platz; findet sich keiner, fällt die Perle als Item zu Boden. Nach dem Sieg über den Drachen füllt das Endportal den ganzen Brunnen (5×5), und der Abspann ist ein Zwiegespräch zweier Stimmen über die Spielenden.
* **Jahreszeiten & Wetter:** Frühling, Sommer, Herbst und Winter (je 7 Spieltage; `/season` stellt sie fest ein, Anzeige oben rechts). Gras und Laub ändern fließend ihre Farbe; im Winter schneit es fast überall und eine **Schneedecke** liegt auf allen Oberseiten unter freiem Himmel (wächst bei Schneefall, schmilzt im Frühling). Wetter je nach Jahreszeit: Regen im Frühling, Gewitter im Sommer, **Nebel** im Herbst (`/weather fog`), Schnee im Winter, **Sandstürme** in Wüste und Mesa. Pflanzen wachsen im Frühling und bei Regen schneller, im Winter kaum (unter Dach normal).
* **Emotes (Mehrspieler):** **R halten** öffnet das Emote-Rad (wie das Waffenrad in GTA), Maus in Richtung zeigen und R loslassen; auf Touch-Geräten der Knopf „Emotes“. Drei Plätze sind vorbelegt (Winken, Klatschen, Salto), über ＋ kommen 21 weitere Emotes hinzu (u. a. der „67“-Emote) und lassen sich wieder entfernen. Alle Spieler sehen die Animation; du selbst siehst dich dabei von vorn.
* **Spielmodus:** `/gamemode <modus> [spieler]` (ohne Spieler bei dir selbst; andere Spieler nur OPs). **Fahrzeuge** (Boot, Lore, Schienen, Antriebsschienen, Sattel) haben einen eigenen Handwerks-Reiter und brauchen keine Werkbank.
* **Alles herstellbar:** Reiter „Farben“ (16 Farbstoffe aus Blumen, Knochenmehl, Lapis, Kohle, Kaktus oder durch Mischen; Wolle, Terrakotta, Glas, Betonpulver und Kerzen färben; Betonpulver + Wasser = Beton) und „Stein“ (polierte, geschliffene und gemeißelte Varianten, Moos-/Rissvarianten, Packeis, Schlamm, Rohmetall-Blöcke …) sowie Rezepte für Sonderhölzer, Honig-/Schleimblöcke, Pilze, Froschlichter, Werkbank-Varianten u. v. m.
* **Fließendes Wasser und Lava:** Quellen (ruhig, dunkler, nicht animiert) breiten sich aus – Fluss heller und bewegt, insgesamt nie weiter als die Reichweite, auch über Kanten (Wasser 7 Blöcke, Lava in der Oberwelt 3, im Nether 7), fallen nach unten, trocknen nach dem Entfernen der Quelle wieder aus, zwei Wasserquellen nebeneinander ergeben eine neue (unendliche Quelle). **Wasser + Lava:** Lava-Quelle → Obsidian, fließende Lava → Bruchstein. Gilt in allen Welten; Eimer nehmen nur Quellen auf. Im Mehrspieler sehen alle den Fluss.
* **Spielerdaten zwischen Servern übertragen:** in der Dev-Konsole (`dev.html`) beim Server unter „Spielerdaten“: exportieren (Code/Datei), importieren oder direkt auf einen anderen Server übertragen (Inventar, Rüstung, Erfahrung, Leben/Hunger, Haustiere). Dafür einmalig `supabase/dev_console_part3.sql` im Supabase-SQL-Editor ausführen.
  **Ganzer Server auf einmal:** im selben Abschnitt „Alle Spielerdaten des Servers“: alle Spieler als Datei (`.vcs`) bzw. Code (`VCS1:…`) exportieren, in einen Server importieren oder direkt auf einen anderen Server übertragen (gleiche Namen = gleiche Personen; fehlende Spieler werden auf Wunsch neu angelegt).
* **Unterrichts-Abfrage:** Mo–Fr während der Schulstunden (Zeiten stehen in `CLASS_TIMES` in der index.html) fragt das Spiel beim Öffnen mit einem lustigen Text, ob man wirklich spielen will/darf; „Nein“ wartet per Countdown bis zur Pause. In den Einstellungen abschaltbar.
* **Konten sperren:** Dev-Konsole → „Konten“ → „🚫 Sperren“ (mit selbst gewählter Nachricht). Gesperrte Konten kommen auf keinen Server mehr, behalten aber alle Daten; „✔ Entsperren“ hebt es wieder auf. Einmalig `supabase/dev_console_part5.sql` ausführen.
* **Befehle:** `/tp <spieler>`, `/tp <spieler> zu <spieler2>`, `/tp <spieler> <x> <y> <z>` (die letzten zwei nur OPs), `/kill <spieler>` (OPs). **Server-Erstellung sperren:** Dev-Konsole → Einstellungen (Ausnahmen per Spielername; einmalig `supabase/dev_console_part4.sql` ausführen).
* **Schlauere Mobs:** Monster (auch die Backrooms-Hunde, der Lächler, der Starrer und die Entität) suchen per Wegfindung (A\*) einen Weg um Wände, Mauern und Sackgassen herum zum Spieler; alle Mobs weichen Wänden, Abgründen und Lava aus, springen Stufen hinauf und erkennen Festhängen.
* Unendliche Welt aus Chunks (16×16×256), Perlin-Rauschen, 13 Biome (Wiese, Blumenwiese, Wald, Birkenwald, Dunkler Wald, Kirschhain, Dschungel, Savanne, Wüste, Mesa, Taiga, Schneelandschaft, Sumpf; ältere Welten behalten ihre alten Biome), Seen, Berge, Höhlen, Lava in der Tiefe
* ~1900 Blöcke inkl. Halbstufen und Treppen fast aller Materialien: Erze (auch als Tiefenschiefer-Variante), Holzarten, Wolle/Beton/Terrakotta/Glas in 16 Farben, Pflanzen, Fackeln,
  Leuchtblöcke (Fackeln und Lava beleuchten ihre Umgebung), Kakteen (stechen), Eis, Lava (verbrennt) …
* **Überleben:** Herzen, Hunger, Fallschaden. Blöcke fallen als **Drops** zu Boden und müssen aufgesammelt werden.
  Alles lässt sich abbauen (außer Grundgestein), aber ohne passendes Werkzeug dauert es ~3,3× länger und es fällt nichts herunter: Stein braucht eine Holzspitzhacke, Eisenerz eine Steinspitzhacke,
  Gold/Redstone/Diamant/Smaragd eine Eisenspitzhacke, Obsidian eine Diamantspitzhacke, damit der Block etwas droppt.
* **Werkzeuge** (Holz, Stein, Eisen, Gold, Diamant): Spitzhacke, Axt, Schaufel, Schwert mit Haltbarkeit, Abbau-Tempo und Schaden.
* **Handwerk:** Rezeptliste im Inventar (Holz, Werkzeug, Bauen, Ofen). Werkbank/Ofen müssen in der Nähe stehen; der Ofen braucht Brennstoff.
* **TNT** mit dem Feuerzeug (Feuerstein + Eisenbarren) anzünden – Explosionen zerstören Blöcke, verletzen Spieler und Mobs und zünden weiteres TNT.
* **Mobs:** Schwein, Kuh, Schaf, Huhn (liefern Fleisch, Leder, Wolle …) sowie Zombie, Wüstenzombie, Skelett (schießt Pfeile),
  Spinne und Creeper (explodiert). Monster kommen nachts und in dunklen Höhlen; alle lassen sich mit Schwert, Axt … bekämpfen.
* **Landwirtschaft:** Hacke, Ackerland, Samen (Weizen, Karotten, Kartoffeln …), Knochenmehl, Setzlinge wachsen zu Bäumen, Eimer (Wasser/Lava).
* **Rüstung** (Leder, Eisen, Gold, Diamant) reduziert Schaden, **Bogen + Pfeile**, **Truhen/Fässer** mit Inhalt, **Betten** (setzen den Spawnpunkt),
  fallende Blöcke (Sand, Kies), Wolken.
* **Bauteile:** Zäune (12 Holzarten), Zauntore, Mauern (16 Steinarten), Glasscheiben (17 Farben), Eisengitter – sie verbinden sich automatisch mit Nachbarn;
  Türen und Falltüren (Rechtsklick), Leitern (klettern), Laternen, Kerzen, Lagerfeuer, Schleimblock (Sprungfeder), Werkbänke zur Deko.
* **Wetter:** Regen und Gewitter (Blitze!) mit Geräuschen, Schnee in Schneebiomen, in der Wüste bleibt es trocken.
* **Angeln** (Angel ins Wasser werfen, bei „Es beißt!“ einholen), **Tränke** und Statuseffekte (Goldener Apfel, Kugelfisch …), Fernrohr, Uhr, Kompass, Schere.
* **Mobs:** zusätzlich Wolf (mit Knochen zähmen, folgt dir, sitzt auf Rechtsklick, greift Monster an), Kaninchen, Schleim (teilt sich), Fledermaus
  und **Dorfbewohner** mit Handel (8 Berufe, Smaragde). Schafe haben Wollfarben und lassen sich scheren.
* **Bauwerke** in der Welt: Hütten mit Dorfbewohner, Brunnen, Wachtürme und Verliese mit Monsterkäfig – mit Beutetruhen.
* **Wurftränke:** jeden Trank mit Schießpulver zum Wurftrank machen (Werkbank, Reiter „Tränke“); Rechtsklick wirft ihn, in der Wolke (4 Blöcke) wirkt er auf Spieler und Mobs – auch im Mehrspielermodus.
* **Mehrspieler:** andere Spieler tragen sichtbar ihre Rüstung (Leder, Eisen, Gold, Diamant) und halten ihr Item; ein kurzer Klick genügt zum Schlagen (Touch: Mob/Spieler antippen).
* **Hand-Ansicht:** Du siehst den Gegenstand in deiner Hand (Blöcke als Würfel, Werkzeuge und Items als kleine 3D-Objekte) mit Wippen beim Laufen, Schlag-, Abbau- und Wechsel-Animation.
* **Beleuchtung:** Fackeln, Laternen, Lava usw. leuchten fest in die Welt eingebacken – aus jeder Entfernung gleich hell, ohne „Kopflampen“-Effekt.
* **Betten** in 16 Farben (zweiteilig, auf den Boden platzieren): Rechtsklick setzt den Startpunkt, nachts schläft man – im Mehrspielermodus wird die Nacht übersprungen, sobald alle Spieler im Bett liegen (die anderen sehen dich im Bett liegen, die Uhrzeit ist für alle – auch Neulinge – gleich). `/gamerule daycycle false` friert die Tageszeit auf dem ganzen Server ein. Fehlt das Bett, startet man am Weltspawn.
* **Skelette** tragen Bögen und schießen Pfeile (sie lassen manchmal einen Bogen fallen).
* **Erfolge**, **Minikarte** (N), **Einstellungen** (Sichtfeld, Empfindlichkeit, Lautstärke, Sichtweite, Wolken) und Screenshots (F2).
* **Kreativ:** alle Blöcke und Items in Kategorien, unendlich, kein Schaden
* **Sound:** Abbau-/Platzier-/Schritt-Geräusche (Gras, Stein, Holz, Sand, Kies, Schnee, Wolle, Netherrack, Seelensand, Basalt, Netherziegel, Tiefenschiefer …), Mob-Stimmen und -Schritte (alle Nether-Mobs inkl. Ghast-Schreie), Schaden-/Fall-Sounds, Truhen, Türen und Erfolgs-Ton stammen aus dem Soundpack (`tools/embed_sounds.py <ordner|zip …>` bettet sie als kleine MP3s ein; ffmpeg nötig). Was das Pack nicht hat, erzeugt das Spiel selbst per WebAudio: Schritte, Abbau-/Platzier-Geräusche je nach Material (Stein, Holz, Erde, Sand, Schnee, Glas, Wolle, Metall), Landen und Platschen, eigene Stimmen für jeden Mob, Feuerball-Geräusche, Atmosphäre (Höhlentropfen, Vögel am Tag, Grillen nachts, Nether-Dröhnen) und ruhige Hintergrundmusik (in den Einstellungen abschaltbar, im Nether dunkler). Dazu **Partikel**: Glut im Nether, Leuchtkäfer nachts, Feuerball-Spuren.
* **Animierte Texturen** (Wasser, Lava, Magma, Netherportal, Feuer, Seelaterne …) laufen mit den Original-Animationen (`.mcmeta`) aus dem Texturpaket.
* **Zuschauer-Modus:** `/gamemode spectator` (oder Knopf „Zuschauer“ im Hauptmenü): Geisterflug durch Blöcke, unsichtbar für andere, unverwundbar, Mobs ignorieren dich, kein Abbauen/Platzieren. Zurück mit `/gamemode survival` oder `creative`.
* **Backrooms (Easter Egg):** Wer sich mit Sand begräbt (Sand um dich herum platzieren und einen Sandblock über dich setzen, sodass er auf dich fällt – oder dich komplett mit Sand einmauern) fällt sofort in die Backrooms: ein endloser Komplex aus drei Zonen, die durch Türen verbunden sind – das **Büro-Labyrinth** (gelbe Tapete, feuchter Teppich, flackerndes Neonlicht, Hallen), die **Poolrooms** (weiße Fliesen, hohe Decke, Becken zum Schwimmen) und die **Parkgarage** (Beton, Pfeiler, Warnstreifen, kaum Licht). Jede Zone hat eigenen Dunst, Farbstich und Helligkeit; dazu Brummen, Knistern und keine Musik. Alles dort ist **selbst gezeichnet** (nicht aus dem Texturpaket): Blöcke (Gelbe/Fleckige Tapete, Feuchter Teppich, Deckenplatte, Neonlicht, Brummender Beton, Poolfliesen, Garagenboden/-wand/-markierungen, **Notausgang** – Rechtsklick bringt dich zurück, **Vorratskiste** mit Beute), das Item **Mandelwasser** und vier Monster mit eigenen Modellen, Texturen und Stimmen: **Hunde** (enthäutete Rudeljäger), der **Lächler** (schwebt auf dich zu – **nicht ansehen**: Angst-Effekt, Herzschlag, nach ~2 s Schaden), der **Starrer** (steht still, solange du ihn ansiehst – **nicht wegsehen**) und die **Entität** (3 Blöcke hoch, teleportiert sich in deine Nähe). **Zurück zur Oberwelt** geht jederzeit über den Knopf oben, die Taste **B**, den Pausenknopf, `/spawn` oder einen Notausgang – du landest am Bett, sonst am Weltspawn. In den Backrooms lässt sich **nichts abbauen oder platzieren** (auch nicht im Kreativmodus); nur Kisten, Notausgänge, Essen und Waffen funktionieren. `/backrooms` (Cheat) reist direkt hin. Funktioniert auch im Mehrspielermodus (jede Dimension hat eigene Spieler, Blöcke und Mobs). Backrooms-Blöcke und das Mandelwasser gibt es **nicht** im Kreativ-Inventar und nicht per `/give` – man findet sie nur dort (Vorratskisten); eine geöffnete Vorratskiste behält ihr Aussehen.
* **Easter Egg im Hauptmenü:** Der Menühintergrund besteht aus den echten Gras- und Erde-Texturen des Packs mit ziehenden Wolken; links steht **Steve** (Seitenansicht, atmet, winkt, wenn man mit der Maus darüber geht). Klickt man ihn an, startet **„Steve rennt!“**, ein Dino-Spiel mit animiertem Steve (Laufen, Springen, Hinfallen) und Kakteen aus dem Pack: Leertaste / ↑ / W / Tippen = Springen, ↓ = schneller fallen, Tag-Nacht-Wechsel, Highscore wird gespeichert, „Zurück zum Hauptmenü“ (oder Esc). Alle Texturen dort stammen aus dem Texturpaket.
* **Creeper-Snake:** Rechts im Hauptmenü steht ein **Creeper** (zischt und blinkt, wenn man draufzeigt). Klick → Snake mit Creeper-Kopf und Creeper-Haut als Körper auf Moosblock-Feld: Pfeiltasten / WASD / Wischen steuern, **Schießpulver** fressen (+1), Äpfel als Bonus (+5, verschwinden nach 7 s), **TNT**-Blöcke und Wände/Körper meiden – sonst „BUMM!“ mit Explosion. Wird mit der Zeit schneller, Rekord wird gespeichert, Esc = zurück.
* **Seed-Eastereggs:** Gibt man beim Weltstart als Seed **`67`** ein, wird das Gelände am Spawn eingeebnet und eine **riesige gelbe 67 (44×28 Blöcke) in den Boden** gelegt; man startet auf einem Aussichtshügel dahinter und blickt direkt darauf. Beim Seed **`steve`** steht am Spawn eine **32 Blöcke hohe Steve-Statue** (Pixel-Art aus Holz-, Beton- und Wolleblöcken). Groß-/Kleinschreibung und Leerzeichen am Rand sind egal; funktioniert auch im Mehrspielermodus (gleicher Seed = gleiche Welt).
* **Mehrspieler & Pause:** Im Mehrspielermodus läuft die Welt weiter, auch wenn man Pause/Inventar/Chat/Einstellungen öffnet – wie auf einem echten Server (Mobs, Spielerphysik wie Fallen/Wasser, Wetter, Sync). Auch bei einem Tab im Hintergrund wird per Timer weiter simuliert, damit z. B. der Host die Mobs nicht für alle anhält.
* **Erfahrung & Verzaubern:** Mobs, Erze (Kohle, Lapis, Redstone, Diamant, Smaragd, Quarz) und Ofen-Rezepte geben **XP-Kugeln**; grüne Leiste und Level über der Hotbar. Der **Zaubertisch** (4 Obsidian + 2 Diamanten + Buch; Rechtsklick) verzaubert Werkzeuge, Waffen, Rüstung und Bögen für Lapislazuli + Level – mehr Bücherregale im Umkreis von 2 Blöcken = höhere Stufen. 13 Verzauberungen: Schärfe, Rückstoß, Verbrennung, Plünderung, Effizienz, Glück, Behutsamkeit, Schutz, Federfall, Stärke, Unendlichkeit, Haltbarkeit, Reparatur (Erfahrung flickt Ausrüstung). Verzauberte Gegenstände glühen und zeigen ihre Verzauberungen im Tooltip.
* **Totem der Unsterblichkeit:** Seltene Beute (Dungeon-/Turmtruhen) oder beim Geistlichen (32 Smaragde). Liegt es in der Hotbar, rettet es vor dem Tod (1 Herz, Regeneration, Widerstand, Feuerresistenz).
* **Boote & Loren:** Boot (5 Bretter) auf Wasser setzen, Rechtsklick = einsteigen, W/S fahren, A/D lenken, Shift = aussteigen. **Schienen** (6 Eisen + Stock → 16) wählen beim Platzieren automatisch Gerade/Kurve; Lore (5 Eisen) auf eine Schiene setzen, W gibt Gas, S bremst, gegen die Lore laufen schiebt sie an. **Antriebsschienen** beschleunigen mit Redstone-Signal und bremsen ohne.
* **Pferde & Sattel:** Pferde in Grasland. Rechtsklick = aufsteigen (wilde bocken, 3 Versuche oder Füttern mit Apfel/Zucker/Weizen/Karotte zähmen). Sattel (5 Leder + Eisen, oder Beute) auflegen, dann: WASD reiten, Leertaste springen, Strg schneller, Shift absteigen. Im Mehrspielermodus können alle reiten (der Host simuliert das Pferd).
* **Redstone:** Hebel, Steinknopf, Steindruckplatte, Redstone-Staub (leitet Strom), Redstone-Fackel (Inverter, 0,15 s Verzögerung → Taktgeber möglich), Redstone-Block, Redstone-Lampe (an/aus), **Kolben & Klebekolben** (schieben bis 12 Blöcke), **Trichter** (saugt Items aus Behältern/vom Boden und gibt sie nach unten oder zur Seite ab; angetrieben = gesperrt), Antriebsschiene, TNT zündet bei Strom, Türen/Falltüren/Tore öffnen bei Strom. Alle Zustände stecken in den Block-IDs (speichern & Mehrspieler funktionieren); der Spieler, der etwas auslöst, berechnet die Schaltung und sendet das Ergebnis.
* **Das Ende:** In der Oberwelt gibt es **eine Festung** (versiegelter Portalraum mit Schacht, Beute und Lava) – `/locate festung` zeigt die Koordinaten (Cheat). Das **Ender-Auge** (Enderperle + Lohenpulver) fliegt beim Werfen in Richtung Festung; Augen in die 12 **Endportal-Rahmen** setzen öffnet das Portal. **Endermen** (nachts, im Nether, im Ende; nicht anstarren!) droppen Enderperlen (werfen = teleportieren). Im Ende: Hauptinsel mit 10 Obsidiansäulen und **Endkristallen**, die den **Enderdrachen** heilen (Kristalle mit Pfeil/Schlag zerstören); der Drache kreist, spuckt Feuerbälle, stürzt sich auf dich und landet auf dem Ausgangsportal (dann verwundbar). Beim Sieg: Ausgangsportal + Drachenei + 500 XP; durch das Portal zurück (Abspann). Befehle: `/end` (Cheat), `/locate`.
* **Steve spielt 2D-Minecraft (Menü-Leerlauf):** Tut man im Hauptmenü 10 Sekunden nichts, blenden sich die Menüfelder aus, Steve streckt sich und geht los – die Kamera folgt ihm und schwingt beim Laufen mit. Er spielt dann selbstständig ein Seitenansicht-Minecraft: Bäume fällen, Treppenschächte graben (Kohle/Eisen, Fackeln), kleine Häuser bauen (Bretter, Glas, Werkbank, Fackel), Schweine/Kühe/Hühner jagen und essen, nachts gegen Zombies, Skelette (Pfeile) und Creeper (Explosionen) kämpfen; mit Tag-Nacht-Wechsel, Wolken, Sonne/Mond, Herzen, Hunger und Hotbar (originale Pack-Sprites). Jede Mausbewegung, Taste oder Berührung beendet es und bringt das Menü zurück. Alle Texturen stammen aus dem Texturpaket.
* **Piglin-Tauschhandel:** Goldbarren in der Hand + Rechtsklick auf einen Piglin → zufällige Nether-Güter. Lohenrute → Lohenstaub (Crafting), Lohenrute ist Brennstoff; Lohenstaub + Schleimball → Magmacreme.
* Tag-Nacht-Zyklus, Sound, Speichern/Laden (localStorage), Seed-Eingabe, Sichtweite einstellbar

## Server & Operatoren

Im Mehrspielermodus gibt es **Server**: Wähle „Server erstellen“ (Name, Seed, Modus, öffentlich/privat) – du wirst **Besitzer** und automatisch Operator (OP).
Andere wählen „Server beitreten“ und klicken ihn in der Liste an oder tippen den Namen ein.

* Nur **OPs** dürfen Cheat- und Teleport-Befehle (`/gamemode`, `/give`, `/time`, `/weather`, `/tp`, `/fill` …) – normale Spieler nur Chat, `/msg`, `/roll`, `/pos` usw.
* Der Besitzer ernennt mit **`/op Name`** Operatoren und entfernt sie mit **`/deop Name`**. Der Besitzer ist immer OP und **kann nicht deoppt oder rausgeworfen werden**. `/ops` zeigt die Liste, 👑 = Besitzer, ⭐ = OP (Tab-Liste).
* OPs können Befehle bei anderen ausführen: `/gamemode creative @Name`, `/give diamond 5 @Name`, `/heal @Name` … und mit `/kick Name [Grund]` Spieler rauswerfen (Operatoren nur der Besitzer).

## Mehrspieler (Supabase)

Im Hauptmenü „🌍 Mehrspieler“: Namen eingeben (3–16 Zeichen), Skin wählen (9 Vorlagen aus dem Texturpaket oder eigenes 64×64-PNG hochladen;
schmale Arme werden erkannt), Weltnamen eingeben und beitreten. Wer denselben Weltnamen benutzt, spielt in derselben Welt.

* Die **Locator-Leiste** über der Hotbar zeigt Mitspieler (mit Gesicht), dein Bett (gelb) und deine Homes (pink) in Blickrichtung, dazu die Himmelsrichtungen.
* Spieler erscheinen mit ihrem Skin, Namensschild, Lauf-/Schlaganimation und Item in der Hand.
* Blockänderungen, Drops, Truhen, TNT, Pfeile und Mobs werden live synchronisiert; Blockänderungen und Truhen werden zusätzlich in der Datenbank gespeichert,
  ebenso Inventar und Position jedes Spielers (beim nächsten Beitritt geht es dort weiter).
* PvP im Überlebensmodus, Chat (T), Spielerliste mit Ping (Tab), Befehle: `/help`, `/players`, `/tp <Name>`, `/spawn`, `/me <Text>`, `/kill`.
* Mobs werden vom ältesten Spieler im Raum simuliert (Host); die anderen sehen sie als Abbild. Geht der Host, übernimmt automatisch der nächste.
* Fällt bei einem Online-Server das Internet aus, wird das Spiel angehalten („Verbindung verloren“), bis die Verbindung wieder steht; verpasste Block-Änderungen werden danach nachgeladen.
* **Admin (nur für den Spieler „Anton“, genau so geschrieben):** `/admin` gibt auf jedem Server alle Rechte (zählt als OP, nicht deop- oder rauswerfbar, auch nicht vom Besitzer; `/op`/`/deop` gelten auf fremden Servern nur für die Sitzung) und erlaubt als Einziger, Grundgestein abzubauen. Neben dem Namen steht 🛡 [Admin] in Tab-Liste, Chat und über dem Kopf. `/unadmin` schaltet alles wieder ab. Der Befehl ist für alle anderen unsichtbar.
* **Weniger Datenverkehr:** Alle Ereignisse eines Spielers werden gesammelt und als eine Nachricht pro Intervall gesendet (Intervall wächst mit der Spielerzahl, Position nur bei Änderung, Mobs 3x pro Sekunde). Supabase begrenzt die Nachrichten pro Sekunde für das ganze Projekt – zu viele Einzelnachrichten führten bei 6–7 Spielern zu Abbrüchen („MessagePerSecondRateLimitReached“). Andere Spieler laufen zwischen den Paketen mit ihrer letzten Geschwindigkeit weiter. **Alle Spieler müssen dieselbe (neue) Version der Datei nutzen.**
* **Mobs im Mehrspielermodus:** Der Host (ältester Spieler nach Serverzeit) lädt auch das Gelände um die anderen Spieler und simuliert dort die Mobs; in versteckten Tabs läuft die Simulation per Worker-Takt weiter. Doppelte Spieler (Neuladen/Verbindungsabbruch) werden nach Namen zusammengeführt, „Geister“-Mobs eines Ex-Hosts verschwinden. Spieler mit anderer Spielversion werden im Chat gemeldet.
* **Nether:** Obsidianrahmen (mind. 2 breit × 3 hoch innen; Obsidian = Lavaeimer + Wassereimer, Abbau mit Diamantspitzhacke) mit **Feuerzeug** (Rechtsklick auf den Rahmen) entzünden und 3 Sekunden im Portal stehen (Kreativ: sofort). Koordinaten im Nether sind 1/8 der Oberwelt; am Ziel wird ein Portal gesucht oder gebaut. Der Nether hat Lavameer, Seelensand-Täler, Basalt-Deltas, Netherrack-Höhlen mit Quarz-/Gold-Erz, Antikem Schutt und Leuchtstein, dazu Zombifizierte Piglins, Piglins (greifen nicht an, wenn du Goldrüstung trägst), Hoglins, Magmawürfel, Wither-Skelette, Lohen und Ghasts (beide schießen Feuerbälle) sowie friedliche Schreiter, die auf Lava laufen – alle mit den Original-Texturen aus dem Texturpaket. Neue Items: Lohenrute, Lohenstaub, Ghast-Träne, Netherquarz, Netherziegel, Leuchtsteinstaub, Magmacreme, Netheritschrott/-barren, Netherit-Werkzeuge und -Rüstung (Diamant + Netheritbarren). `/nether` und `/overworld` (OPs) reisen direkt, `/spawn` führt zurück. Der Nether funktioniert auch auf bestehenden Servern (kein Datenbank-Update nötig; Änderungen dort werden mit Höhe +128 gespeichert). Auf Servern sehen sich nur Spieler in derselben Dimension.
* Leitern lassen sich überall herstellen (7 Stöcke, keine Werkbank nötig).
* **Zwei Supabase-Projekte (optional):** In `index.html` ganz oben im Netzwerk-Teil `SUPABASE2_URL`/`SUPABASE2_KEY` setzen (URL + öffentlicher anon-Key eines zweiten Projekts, keine Tabellen nötig). Dann läuft Spielerbewegung/Schläge + Datenbank über Projekt 1 und Blöcke, Mobs, Chat und Aktionen über Projekt 2 (jeweils ca. 70 Nachrichten/s Budget statt 40). Ist das zweite Projekt nicht erreichbar, läuft automatisch alles über Projekt 1. **Alle Spieler müssen dieselbe Datei mit denselben Einstellungen nutzen.**
* **Ping:** Die Tab-Liste zeigt hinter jedem Spieler den Ping (reist in den Positions-Paketen mit); allein auf dem Server wird die Zeit eines Datenbankaufrufs angezeigt.
* Modus „Lokal“ braucht kein Internet: Spieler in anderen Tabs desselben Browsers sehen sich (BroadcastChannel) – gut zum Ausprobieren.

### Eigenes Supabase-Projekt einrichten

1. Projekt auf supabase.com anlegen, den Inhalt von [`supabase/schema.sql`](supabase/schema.sql) im SQL-Editor ausführen.
2. In `index.html` die Konstanten `SUPABASE_URL` und `SUPABASE_KEY` (der öffentliche *anon*/publishable Key) ersetzen.

Sicherheitsmodell: Alle Tabellen sind per Row Level Security gesperrt; der Client greift nur über `SECURITY DEFINER`-Funktionen (`vc_*`) zu.
Ein Spielername ist an einen zufälligen Token im Browser gebunden (in der DB nur als SHA-256-Hash), damit niemand einen fremden Namen übernehmen kann.
Die Supabase-Hinweise „RLS enabled, no policy“ und „anon can execute SECURITY DEFINER“ sind daher gewollt.
Grenzen: Es gibt keine Konten – jeder registrierte Spieler darf in jeder Welt Blöcke ändern, Welten kann jeder anlegen,
und Kampf/Mobs werden clientseitig berechnet (kein Schutz vor manipulierten Clients).

Hinweis: Der Speicherstand-Schlüssel ist `voxelcraft_save_v2`; alte Einzelspieler-Speicherstände früherer Versionen werden nicht mehr geladen.

## Texturen

Alle Block-, Item-, Mob-, Sonne/Mond- und HUD-Texturen stammen aus einem Minecraft-Ressourcenpaket (Vanilla-Stil, 16×16)
und sind als Base64-PNG in `index.html` eingebettet (Marker `/*PACK_BEGIN*/ … /*PACK_END*/`).
Ein anderes Paket (gleiche Dateinamen wie im Vanilla-Format) lässt sich so einbetten:

```sh
python3 tools/embed_textures.py pfad/zum/pack.zip      # oder Ordner; optional: Pfad zur index.html
```

Das Skript liest die benötigte Liste aus dem Block `/*BLOCKDEFS_BEGIN*/ … /*BLOCKDEFS_END*/` und kopiert nur diese Dateien.
Bitte die Lizenz des verwendeten Texturpakets beachten, bevor die Datei veröffentlicht wird.

## Erweitern

* **Neuer Block:** in `index.html` im Bereich `BLOCKDEFS` mit `add('schlüssel', 'Name', allSides('texturname'), { … })` eintragen,
  danach `tools/embed_textures.py` erneut ausführen (bettet die neue Textur ein).
* **Weltgenerierung:** `TerrainGen.generate` (Schichten, Erze, Bäume, Pflanzen).
* **Mobs:** `MOBTYPES`, `buildMobModel` und die Klasse `Mob`.
* **Items, Werkzeuge:** Funktion `item(...)` im Block `BLOCKDEFS`; Rezepte: `recipe(...)` im Abschnitt „Inventar, Crafting & HUD“.


## Dev-Konsole (`dev.html`)

Eigene Seite nur für den Betreiber: PIN-Login, dann sieht man alle Server (wer ist gerade online, Besitzer/OPs, geänderte Blöcke), alle Konten, die
Spielerdaten pro Server (Position, Leben, Inventar, Rüstung), Container und wer wie viel gebaut hat – und kann Server, Konten, Spielerdaten, Container und
einzelne Inventar-Einträge löschen, eine Welt zurücksetzen, Besitzer/OPs/Modus ändern, allen Spielern eines Servers eine Nachricht schicken und den Server **neustarten**: Die Spieler speichern ihren Stand, verlassen den Server und sehen den Hinweis, die Website zu schließen und später neu zu öffnen (der Befehl wird nur von Absendern mit „dev-“-ID angenommen).

1. Die Migration „Dev-Konsole“ ganz unten in `supabase/schema.sql` im Supabase-SQL-Editor ausführen.
2. PIN setzen (steht bewusst **nicht** im Repo): `update public.vc_dev_cfg set pin_hash = encode(extensions.digest(convert_to('vc-dev:' || 'DEIN_PIN', 'utf8'), 'sha256'), 'hex') where id = 1;`
3. `dev.html` im Browser öffnen. Die Seite wird mit `python3 tools/build_dev.py` aus `tools/dev_template.html` gebaut (Block-/Item-Namen aus `tools/dev_names.json`).

Schutz: Die Funktionen prüfen den PIN serverseitig; nach 5 falschen Eingaben ist die Konsole 15 Minuten gesperrt. Ein 4-stelliger PIN ist trotzdem schwach –
die Seite deshalb nicht öffentlich ins Netz stellen.
