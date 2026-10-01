# VoxelCraft

Ein Minecraft-ähnliches Voxel-Spiel, das komplett im Browser läuft – eine einzige Datei: [`index.html`](index.html)
(Three.js wird von cdnjs geladen, alles andere ist eingebettet; nur der Online-Mehrspielermodus lädt zusätzlich `supabase-js` von jsdelivr).

## Starten

`index.html` im Browser öffnen (Doppelklick genügt) oder z. B. `python3 -m http.server` im Ordner starten.

## Steuerung

| Aktion | Tastatur / Maus | Touch |
| --- | --- | --- |
| Bewegen | WASD | Joystick links (ganz nach vorn = Sprint) |
| Umsehen | Maus | Wischen auf der rechten Fläche |
| Springen / Schwimmen (im Kreativmodus: Doppeltipp = Fliegen an/aus) | Leertaste | ▲-Button |
| Schleichen (kein Abstürzen von Kanten) | Shift | Knopf „Schleichen“ |
| Sprinten | Strg oder W doppelt tippen | Joystick ganz nach vorn |
| Abbauen / Angreifen | Linksklick (halten) | Finger gedrückt halten |
| Platzieren / Essen & Trinken (gedrückt halten, ~1,3 s, mit Animation) | Rechtsklick | kurz antippen / halten |
| Hotbar | 1–9 / Mausrad | Slots antippen |
| Inventar & Handwerk | E (oder Rechtsklick auf Werkbank/Ofen) | Button „Inventar“ |
| Item fallen lassen | Q | – |
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

## Inhalt

* Unendliche Welt aus Chunks (16×16×64), Perlin-Rauschen, Biome (Wiese, Wüste, Schnee), Seen, Berge, Höhlen, Lava in der Tiefe
* ~1900 Blöcke inkl. Halbstufen und Treppen fast aller Materialien: Erze (auch als Tiefenschiefer-Variante), Holzarten, Wolle/Beton/Terrakotta/Glas in 16 Farben, Pflanzen, Fackeln,
  Leuchtblöcke (Fackeln und Lava beleuchten ihre Umgebung), Kakteen (stechen), Eis, Lava (verbrennt) …
* **Überleben:** Herzen, Hunger, Fallschaden. Blöcke fallen als **Drops** zu Boden und müssen aufgesammelt werden.
  Ohne passendes Werkzeug geht vieles nicht: Stein braucht eine Holzspitzhacke, Eisenerz eine Steinspitzhacke,
  Gold/Redstone/Diamant/Smaragd eine Eisenspitzhacke, Obsidian eine Diamantspitzhacke.
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
* Tag-Nacht-Zyklus, Sound (per WebAudio erzeugt), Speichern/Laden (localStorage), Seed-Eingabe, Sichtweite einstellbar

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
* PvP im Überlebensmodus, Chat (T), Spielerliste (Tab), Befehle: `/help`, `/players`, `/tp <Name>`, `/spawn`, `/me <Text>`, `/kill`.
* Mobs werden vom ältesten Spieler im Raum simuliert (Host); die anderen sehen sie als Abbild. Geht der Host, übernimmt automatisch der nächste.
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
