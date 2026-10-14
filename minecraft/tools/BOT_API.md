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

## Weitere Werkzeuge und KI-Aufrufe

`BOT.tools()` liefert alle Werkzeuge mit Beschreibung und Parameternamen (für Tool-Aufrufe einer KI), `BOT.call(name, {param: wert})` führt eines aus.

Zusätzlich zur Tabelle oben (gleiche Spielregeln): `drop(item,n)`, `chest(x,y,z)` (Inhalt), `take(x,y,z,item,n)`, `put(x,y,z,item,n)`, `useHeld(item,{at,hold})` (Bogen, Angel, Eimer, Perle, Trank …), `shoot(mob)`, `fill(x1,y1,z1,x2,y2,z2,item,{hollow})` (setzt Block für Block, max. 600), `scan(radius)` (Umgebungsüberblick).

## Verwaltungswerkzeuge (`BOT.admin.*`) – nur für die Claude-KI

Nur wenn der Bot-Modus aktiv ist **und** das Konto in `AC_TRUSTED` steht (derzeit `claudeai`; im Einzelspieler-Bot-Modus ebenfalls). Alle anderen bekommen `nicht erlaubt`, und die Werkzeuge erscheinen nicht in `BOT.tools()`.
`tp`, `give`, `clear`, `setblock`, `fill` (sofort, max. 20000), `fly`, `god`, `speed`, `gamemode`, `heal`, `feed`, `effect`, `xp`, `kill`, `summon`, `cmd` (beliebiger Spielbefehl), `time`, `weather`. Über `BOT.call` heißt das sofortige Füllen `afill`.
Der Name ist an einen Browser-Schlüssel (Token) des Kontos gebunden – andere können sich nicht als `ClaudeAI` anmelden. Die Mitspieler-Prüfung (Anti-Cheat) nimmt dieses Konto aus.

## Anti-Cheat (für alle anderen)

Siehe Kommentar „ANTI-CHEAT“ in `index.html`: Selbstkontrolle (Flug/Tempo/Gott/Modus/Inventar/Schweben/Noclip/Reichweite), gegenseitige Kontrolle im Mehrspielermodus (auffällige Spieler werden ignoriert und von OPs/Besitzer rausgeworfen) und `window.__vc` nur lokal (Datei/localhost). Für Tests: `__vc.AC.off = true` schaltet die eigene Kontrolle lokal aus.

## Selbstschutz und Aufgaben (2026-10-14.44)

* **Auto-Respawn:** Stirbt der Bot, respawnt er nach ca. 2 s von selbst. Laufende Aktionen enden mit `{ok:false, died:true, reason:"tot …"}`; `BOT.state()` zeigt `deaths`. Mit **`BOT.run([{tool,args},…])`** laufen Aufgabenlisten, die beim Tod pausieren, nach dem Respawn denselben Schritt wiederholen (positionsbezogene Schritte laufen einfach weiter) und erst bei echtem Fehlschlag abbrechen.
* **Selbstverteidigung:** Feindliche Mobs im Umkreis von `defendRange` (6) pausieren die laufende Aktion: der Bot nimmt die beste Waffe, kämpft und zieht sich bei wenig Leben (≤ 6, oder ≤ 10 bei 3+ Gegnern / Creeper nah) zurück. Im Kreativmodus aus. **Auto-Essen** bei Hunger ≤ 12 (wenn Nahrung da und kein Feind). `BOT.config({autoRespawn, autoDefend, autoEat, flee, defendRange})`.
* **Schutz fremder Bauten:** `mine`/`gather` bauen keine Blöcke ab, die ein Spieler gesetzt hat (stehen in den Weltänderungen), außer eigenen Blöcken des Bots. Nur mit `{force:true}` und ausdrücklicher Erlaubnis. `BOT.isPlayerBuilt(x,y,z)` fragt ab.
* **Bauen:** `BOT.shape(kind, {x,y,z,w,d,h,item,…})` liefert Zellenlisten (`floor, box, walls, line, pyramid, circle, cylinder, gable_roof, house`), `BOT.needs(cells)` prüft das Material, **`BOT.build(cells, {partial, replace, scaffold, cleanup, max})`** baut Ebene für Ebene mit kürzesten Wegen, beachtet die Blickrichtung (`facing: 'n'|'e'|'s'|'w'` für Treppen/Türen), baut bei Bedarf Gerüst (`BOT.pillar(n)` = springen und Block unter sich setzen) und räumt es wieder ab (`BOT.cleanup()`). Das Setzen prüft vorher exakt dieselbe Sichtlinie wie das Spiel und steht nie im Zielfeld.
* **Weitere Werkzeuge:** `gather(was, n)` (n Blöcke einer Sorte), `items(suche)`, `jump`, `sneak`, `emote`, `ride`/`dismount`, `skin(name | {data, slim})` / `skins()` (Skin wechseln, andere laden ihn neu), **`screenshot({w,h,radius,yaw,pitch,look})`** → JPEG-Data-URL aus der Sicht des Spielers (rendert nur auf Anfrage; sonst weiter ohne Darstellung).
* Für den Agent-Player gibt es `play/bshot.sh [w] [h] [yaw] [pitch]` → speichert das Bild als Datei (Pfad in der Antwort, mit dem Bild-Lesen ansehen).

## Ergänzungen (2026-10-14.45, Wünsche des Agents)

* **`BOT.build`:** bis zu 3 Durchgänge (`retries`), Fehlschläge werden erneut versucht, sobald Nachbarn stehen (`maxFail` 400 statt 40). Unerreichbare Zellen werden von einer Säule neben dem Ziel aus gesetzt (Standort-Suche rund um das Ziel, Säule wieder abgebaut). Frei schwebende Zellen ohne angrenzenden Block meldet er klar („nichts zum Anklicken“).
* **Kreativ:** `BOT.creative(item, n)` holt Items aus dem Kreativ-Vorrat; `place`/`build`/`pillar` tun das im Kreativmodus selbst. `admin.give` meldet „Inventar voll“ bzw. wie viele nicht mehr passten.
* **Füllmodi** für `afill`/`fill`/`shape('box')`: `mode: 'solid' | 'shell' | 'hollow' | 'ring' | 'walls'` – `hollow` = Außenhaut, bei **einer** Ebene nur der Rand; `ring`/`walls` = nur Rand in x/z in jeder Ebene (Wände ohne Boden/Dach). Über `BOT.call` dürfen `mode`, `hollow`, `partial` … direkt neben den Parametern stehen (werden zu `opts`).
* **Suche:** `BOT.items('wolle rot')` findet über Schlüssel und deutschen Namen (alle Wörter), ohne interne Varianten; `BOT.blocks(filter)` nur Blöcke. Neue Namen: `oak_stairs` (= Variante unten), `red_bed`, `quartz_block`, `cobblestone` …
* **Formen:** `door`, `bed` (zweiteilig, `facing`), `statue` (blockige Spielerfigur wie Steve, `s` = Vergrößerung, `colors`, `facing`).
* **Screenshot von außen:** `screenshot({target:{x,y,z}, dist, angle, height})` rückt die Kamera schräg neben/über das Ziel (lädt die Chunks dort).
* **Netz:** `BOT.net()` / `state().net` (wartende Blockänderungen, Datenbank-Warteschlange), `BOT.syncWait(sek)` wartet, bis alles gesendet ist.
* **Chat/Spieler:** `BOT.waitChat(sek, {from, since})` wartet auf die nächste Nachricht eines anderen Spielers; `BOT.players()` listet alle Spieler des Servers.
* **`admin.tp`** schaltet bei Zielen in der Luft automatisch Fliegen an (`fly:false` verhindert es).
* Hinweis: `BOT.call(...)` liefert ein Promise – mit `.then(r => JSON.stringify(r))` oder `await` auswerten.


## Checkliste (v47) – NUR auf ausdrücklichen Wunsch eines Spielers

* `BOT.checklist(to, title, items)` zeigt auf dem Bildschirm des Spielers `to` eine Checkliste (links oben). `items` = Liste von Texten oder `[Text, erledigt]` (max. 30 Punkte, 120 Zeichen).
* `BOT.check(nummer | text, done=true)` hakt einen Punkt ab (Nummer ab 0), `BOT.checklistClear()` entfernt die Liste. Auch über `BOT.call('checklist' | 'check' | 'checklistClear', {...})`.
* Nur das Konto `ClaudeAI` darf senden, angezeigt wird sie nur beim genannten Spieler (`/checkliste aus` blendet sie dort aus). Nicht ungefragt benutzen.

## Automatisches Brücken/Hochbauen/Graben (v48)

* `goto`/`mine`/`place`/`follow` versuchen zuerst den normalen Weg. Gibt es keinen, plant der Bot automatisch mit **Brücken** (Block vor sich setzen), **Säulen** (hochspringen + Block unter sich setzen) und zuletzt **Graben** durch natürliches Gelände. Material: billige Blöcke aus dem Inventar (Erde, Bruchstein, Stein …; Kreativ: Erde). Spielerbauten bleiben tabu.
* Optionen für `goto`: `{build:false}` = nur gehen, `{dig:false}` = bauen aber nicht graben. Kommt der Bot nicht voran, gibt es stufenweise Abhilfe und am Ende die Meldung „steckt fest bei (x,y,z) vor …“.
* Tipp: Wegen müssen nicht mehr von Hand gebaut werden – einfach `BOT.goto` mit Baumaterial im Inventar aufrufen.
