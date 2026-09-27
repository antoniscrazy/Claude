# Ore Empire Tycoon

Ein vollständig spielbarer Roblox-Tycoon als fertige Place-Datei.

## Datei

**`OreEmpireTycoon.rbxlx`** — das ist die Spieldatei.
`.rbxlx` ist das offizielle Roblox-Place-Format (XML-Variante von `.rbxl`).
Roblox Studio öffnet sie direkt per Doppelklick oder über *Datei → Öffnen*.

## Starten

1. `OreEmpireTycoon.rbxlx` herunterladen.
2. In **Roblox Studio** öffnen.
3. Oben auf **Play** (F5) drücken — die ganze Welt wird beim Start automatisch gebaut.
4. Zum Veröffentlichen: *Datei → Auf Roblox veröffentlichen als…*

> Wenn du lieber `.rbxl` (Binärformat) brauchst: einfach in Studio öffnen und
> *Datei → Speichern unter…* mit dem Dateityp `.rbxl` wählen.

## So spielt man

1. Du spawnst in der Lobby in der Mitte.
2. Lauf auf ein **gelbes Pad** — damit beanspruchst du eines der 4 Grundstücke.
3. Der **Dropper** wirft automatisch Erze auf das **Förderband**.
4. Das Band schiebt sie in den **Sammler** → Geld auf dein Konto.
5. Lauf auf die **blauen Pads**, um Upgrades zu kaufen.

## Inhalt des Spiels

- 4 eigenständige Grundstücke (bis zu 4 Spieler gleichzeitig)
- Grundstück beanspruchen / bei Verlassen automatisch freigeben
- 3 Dropper mit unterschiedlichen Erzwerten
- Förderband mit Physik
- 2 Veredler-Tore, die den Erzwert multiplizieren (x2, x3)
- 8 Kaufknöpfe mit steigenden Preisen (150 → 500.000)
- Geschwindigkeits-Upgrades, Fabrikhalle, „Goldene Fabrik" (x5 auf alles)
- Leaderboard mit Guthaben + eigenes HUD mit Kontostand, Hinweisen und Meldungen
- DataStore-Speicherung inkl. Autosave alle 60 Sekunden
  (funktioniert erst im veröffentlichten Spiel bzw. mit aktiviertem
  *Studio Access to API Services*; im Studio ohne das schlägt sie still fehl)
- Lag-Schutz: maximal 70 Erze pro Grundstück, Erze verfallen nach 45 s

## Balancing anpassen

Alles Wichtige steht ganz oben im Skript in den Tabellen
`CONFIG`, `DROPPERS`, `UPGRADERS` und `BUTTONS`.
Im Studio findest du das Skript unter **ServerScriptService → MainTycoon**.

## Projektstruktur

```
tycoon/
├── OreEmpireTycoon.rbxlx      fertige Place-Datei (das Spiel)
├── src/MainTycoon.server.lua  Quelltext des Serverskripts
├── build.py                   baut die .rbxlx aus dem Quelltext neu
└── README.md
```

Nach Änderungen an `src/MainTycoon.server.lua` einfach `python3 build.py` ausführen.
