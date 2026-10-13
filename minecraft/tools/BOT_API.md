# Verdeckter Bot-Modus (nur für Entwickler – nicht in der Oberfläche, nicht in der README)

Aufruf: `index.html?bot=1` (ohne den Parameter gibt es weder `window.BOT` noch irgendeine Änderung am Spiel).

* **Headless:** kein Rendern (die Bildschleife wird gar nicht gestartet), keine Chunk-Geometrie (nur Blockdaten), kein Ton.
* **Fester Takt:** Simulation mit 20 Ticks/s (`dt = 0.05`), getaktet von einem Web-Worker (läuft auch im Hintergrund-Tab). Verpasste Ticks werden nachgeholt (max. 6 pro Aufruf); unabhängig von FPS.
* **Gleiche Regeln wie ein Mensch:** die Aktionen setzen nur Blickrichtung + Bewegungs-/Klick-Eingaben (`BOTIN`, `mouse`) und laufen durch dieselbe Pipeline wie normale Spieler (`updatePlayer`, `updateInteraction`, `useItem`, `craft`): Reichweite (5, Kreativ 6), Abbauzeit je Werkzeug/Stufe, Schaden/Abklingzeit, Hunger/Sprinten, Rezepte mit Werkbank/Ofen in der Nähe, Bauhöhe, Boss-/Backrooms-Sperren. Kein Teleport, kein Fliegen, kein Graben beim Gehen, kein Gratis-Inventar. Keine Tasten-/Maus-DOM-Ereignisse.
* **Mehrspieler:** weil es der normale Spieler ist, sehen alle Position, Schwingen, Essen, Schlafen, Rüstung, Blockänderungen, Chat und Tab-Eintrag.

Der Bot setzt sich nach Pausen (Verbindungsabbruch, fehlende Maus-Sperre, Fenster-Fokus) selbst fort. Synchron (liefern direkt ein Objekt, kein Promise): `chat`, `chats`, `look`, `hold`, `select`, `respawn`, `cancel`, `wake`, `inv`, `count`, `state`, `nearby`, `blockAt`, `ticks`. Alle anderen Aktionen sind `async` und liefern `{ ok, reason?, … }`. Eine neue Aktion bricht die laufende ab (`BOT.cancel()`).

| Aufruf | Wirkung |
|---|---|
| `join({name, room, backend:'online'\|'local', create, seed, mode, dist, skin, skinData, slim, token})` | Server beitreten/erstellen (wie das Menü) |
| `single({seed, mode, dist})` | lokale Welt starten (Tests) |
| `leave()`, `respawn()`, `cancel()`, `wait(sek)` | |
| `goto(x,y,z,{range,timeout})` / `goto(x,null,z)` / `goto({x,y,z})` | A\*-Weg, nur Gehen/Springen/Fallen ≤ 3, öffnet Türen |
| `follow(name,{dist,time})`, `collect(radius)`, `look(x,y,z)` | |
| `mine(x,y,z,{walk:false,collect:false,timeout})` | Block abbauen: geht heran, wählt Werkzeug, hält „links“ bis er bricht, sammelt Beute ein |
| `place(x,y,z,id\|name,{walk:false})` | klickt an eine Nachbarfläche (Platten/Treppen/Fackeln … wie beim Spieler) |
| `use(x,y,z)` | Rechtsklick (Tür, Hebel, Knopf, Bett …) |
| `attack(mob \| mobId \| typ,{timeout,collect})` | läuft hin, schlägt mit der Abklingzeit, sammelt Beute |
| `eat(item?)`, `sleep({wait,timeout})`, `wake()` | Essen nur wenn hungrig; Schlafen nur nachts am nächsten Bett |
| `craft(rezept\|item, n)` | geht bei Bedarf zu Werkbank/Ofen (≤ 24 Blöcke) |
| `equip(item)`, `hold(item)`, `select(slot)` | |
| `chat(text)`, `chats(seit)` | Chat senden (auch `/befehle`, falls OP) / Chatprotokoll lesen |
| `inv()`, `count(item)`, `state()`, `nearby(typ,radius)`, `blockAt(x,y,z)`, `ticks()` | Abfragen (`typ`: `mob`, Mob-Typ, `player`, `drop`, Blockname, `logs`, `bed` …) |

Beispiel (Playwright): `await page.goto(url + '?bot=1'); await page.evaluate(() => BOT.join({name:'Bot1', room:'anton'})); await page.evaluate(() => BOT.mine(12, 64, 3));`
