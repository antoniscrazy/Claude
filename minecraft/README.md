# VoxelCraft

Ein Minecraft-ähnliches Voxel-Spiel, das komplett im Browser läuft – eine einzige Datei: [`index.html`](index.html)
(Three.js wird von cdnjs geladen, alles andere ist eingebettet).

## Starten

`index.html` im Browser öffnen (Doppelklick genügt) oder z. B. `python3 -m http.server` im Ordner starten.

## Steuerung

| Aktion | Tastatur / Maus | Touch |
| --- | --- | --- |
| Bewegen | WASD | Joystick links (ganz nach vorn = Sprint) |
| Umsehen | Maus | Wischen auf der rechten Fläche |
| Springen / Schwimmen | Leertaste | ▲-Button |
| Sprinten | Shift | Joystick ganz nach vorn |
| Abbauen / Angreifen | Linksklick (halten) | Finger gedrückt halten |
| Platzieren / Essen | Rechtsklick | kurz antippen |
| Hotbar | 1–9 / Mausrad | Slots antippen |
| Inventar & Handwerk | E (oder Rechtsklick auf Werkbank/Ofen) | Button „Inventar“ |
| Item fallen lassen | Q | – |
| Ton an/aus | M | Pausenmenü |
| Flugmodus (Kreativ) | F, runter: C | Button „Fliegen“, ▼ |
| Debug-Anzeige | F3 | – |
| Pause | Esc | Button „Pause“ |

## Inhalt

* Unendliche Welt aus Chunks (16×16×64), Perlin-Rauschen, Biome (Wiese, Wüste, Schnee), Seen, Berge, Höhlen, Lava in der Tiefe
* ~180 Blöcke: Erze (auch als Tiefenschiefer-Variante), Holzarten, Wolle/Beton/Terrakotta/Glas in 16 Farben, Pflanzen, Fackeln,
  Leuchtblöcke (Fackeln und Lava beleuchten ihre Umgebung), Kakteen (stechen), Eis, Lava (verbrennt) …
* **Überleben:** Herzen, Hunger, Fallschaden. Blöcke fallen als **Drops** zu Boden und müssen aufgesammelt werden.
  Ohne passendes Werkzeug geht vieles nicht: Stein braucht eine Holzspitzhacke, Eisenerz eine Steinspitzhacke,
  Gold/Redstone/Diamant/Smaragd eine Eisenspitzhacke, Obsidian eine Diamantspitzhacke.
* **Werkzeuge** (Holz, Stein, Eisen, Gold, Diamant): Spitzhacke, Axt, Schaufel, Schwert mit Haltbarkeit, Abbau-Tempo und Schaden.
* **Handwerk:** Rezeptliste im Inventar (Holz, Werkzeug, Bauen, Ofen). Werkbank/Ofen müssen in der Nähe stehen; der Ofen braucht Brennstoff.
* **TNT** mit dem Feuerzeug (Feuerstein + Eisenbarren) anzünden – Explosionen zerstören Blöcke, verletzen Spieler und Mobs und zünden weiteres TNT.
* **Mobs:** Schwein, Kuh, Schaf, Huhn (liefern Fleisch, Leder, Wolle …) sowie Zombie, Wüstenzombie, Skelett (schießt Pfeile),
  Spinne und Creeper (explodiert). Monster kommen nachts und in dunklen Höhlen; alle lassen sich mit Schwert, Axt … bekämpfen.
* **Kreativ:** alle Blöcke und Items in Kategorien, unendlich, kein Schaden
* Tag-Nacht-Zyklus, Sound (per WebAudio erzeugt), Speichern/Laden (localStorage), Seed-Eingabe, Sichtweite einstellbar

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
