# Einrichtung und Veröffentlichung

## 1. Öffnen

`TycoonGame.rbxlx` doppelklicken oder in Roblox Studio über
*Datei → Öffnen* wählen. Auf **Play** (F5) drücken — die Welt wird beim
Serverstart komplett aus Code gebaut.

## 2. API-Services aktivieren (für Speichern und Bestenliste)

*Home → Game Settings → Security → **Enable Studio Access to API Services***

Ohne das schlägt jeder DataStore-Aufruf fehl. Das ist **eingeplant**: das
Spiel läuft dann mit einem frischen Profil im Modus „nicht speichern" weiter
und warnt genau **einmal** im Output statt im Sekundentakt.

## 3. Asset-IDs eintragen

Alle Platzhalter stehen in `src/shared/Config.luau` bzw. im Studio unter
`ReplicatedStorage → Shared → Config`, jeweils mit `-- REPLACE ME` markiert.
Es wurden bewusst **keine** IDs erfunden.

| Ort | Konstante | Verhalten solange Platzhalter |
|---|---|---|
| `MONETIZATION.GAMEPASS_2X_CASH` | GamePass-ID | Marketplace wird nicht aufgerufen, Multiplikator 1 |
| `MONETIZATION.GAMEPASS_VIP` | GamePass-ID | VIP-Tür bleibt für alle zu |
| `GEM_PRODUCTS[*].productId` | Developer-Product-ID | Knopf zeigt „BALD", kein Kaufdialog |
| `SOUNDS.*` | `rbxassetid://…` | kein Sound wird angelegt (keine Output-Warnung) |

Nach dem Eintragen ist **keine** Codeänderung nötig.

## 4. Codes anpassen

`Config.CODES` — Schlüssel klein schreiben, das Einlösen normalisiert
Groß-/Kleinschreibung und Leerzeichen.

## 5. Als .rbxl speichern

*Datei → Speichern unter…* → Dateityp **Roblox Place Files (.rbxl)** wählen
→ Dateinamen auf `TycoonGame.rbxl` setzen und speichern. Das Binärformat
lädt schneller und ist kleiner; inhaltlich identisch zur `.rbxlx`.

## 6. Veröffentlichen

*Datei → Auf Roblox veröffentlichen als…* → neue Erfahrung anlegen.
Danach in den Game Settings die Spielerzahl setzen (`Config.WORLD.PLOT_COUNT`
ist 6 — mehr Spieler als Plots bekommen keine Fabrik und eine Warnung im
Serverlog).

---

# Definition of Done

Ehrlicher Stand. Punkte 1–4 sind hier ohne laufendes Roblox Studio
**nachweisbar geprüft**, Punkte 5–6 sind **begründet, aber nicht
play-getestet** — in dieser Umgebung läuft keine Roblox-Engine.

| # | Kriterium | Stand |
|---|---|---|
| 1 | Datei öffnet in Studio ohne Warnung oder Fehler | geprüft, siehe unten |
| 2 | Play-Test: Plot zugewiesen, Geld läuft, alle 25 Buttons kaufbar | **nicht play-getestet** |
| 3 | Rejoin: Fortschritt exakt wiederhergestellt | **nicht play-getestet** |
| 4 | Zwei Spieler: keine Kreuz-Interferenz | geprüft (statisch) |
| 5 | Kein Output-Error nach 5 Minuten | **nicht play-getestet** |
| 6 | UI lesbar auf 1920×1080 UND 375×667 | geprüft (gerechnet) |

## Begründung im Einzelnen

**1. Öffnet ohne Fehler.** `tools/verify_place.py` parst das XML hart,
prüft `<roblox version="4">`, alle 8 Services, die Instanzklassen von
`Bootstrap` (Script bzw. LocalScript), und dass jedes der 27 Skripte
Quelltext trägt und mit `--!strict` beginnt. Alle 27 Module kompilieren
mit `luau-compile` zu Bytecode und bestehen die strikte Typprüfung mit
`luau-lsp` gegen die echten Roblox-API-Definitionen. Warnungsfreiheit im
Output ist zusätzlich dadurch adressiert, dass alle Platzhalter-IDs
vor dem Aufruf abgefangen werden (siehe Tabelle oben).

**2. Kaufbarkeit aller 25 Upgrades.** Der Abhängigkeitsbaum ist eine
lineare Kette mit zwei Zusammenführungen (`roof` braucht `collector_2` +
`walls`, `lights` braucht `collector_3` + `roof`); jeder Knoten ist von
`dropper_2` aus erreichbar. `tools/balance_sim.py` fährt die vollständige
Kaufreihenfolge ab und erreicht Upgrade 25 nach 73,2 min.
**Was fehlt: ein echter Klick-Durchlauf.** Ob ein Touch-Pad im Spiel
tatsächlich auslöst, kann ich hier nicht beweisen.

**3. Rejoin.** `DataService` implementiert Session-Locking über
`UpdateAsync`, Reconcile gegen das Template, Retry mit exponentiellem
Backoff plus Jitter, Autosave alle 60 s und einen `BindToClose`-Flush mit
25-s-Budget. Geschrieben wird nur, wenn wir den Lock halten. **Was fehlt:
ein echter Speicher-/Ladezyklus gegen einen laufenden DataStore.**

**4. Zwei Spieler, keine Interferenz.** Jeder Plot hat eigene Instanzen,
einen eigenen Ore-Ordner, eigene Akkumulatoren (`dropAccum[plotIndex]`)
und eigene Touch-Handler, die in `state.owner` gegen den auslösenden
Spieler prüfen. Erze liegen in der Kollisionsgruppe `Ores`, Charaktere in
`Characters`, und beide kollidieren **nicht** miteinander — ein Spieler
kann die Erze eines anderen also nicht vom Band kicken. Beim Freigeben
eines Plots räumt `state.trove` den besitzgebundenen Zustand ab, sodass
der nächste Besitzer nichts erbt.

**5. Kein Output-Error nach 5 Minuten.** Jeder externe Aufruf
(DataStore, Marketplace, `GetNameFromUserIdAsync`) steckt in `pcall`;
`Log.throttled` verhindert Fehlerfluten; eine Scheduler-Aufgabe wird nach
10 Fehlern in Folge abgeschaltet statt 60-mal pro Sekunde zu werfen;
jeder Dienst startet in einem eigenen `pcall`, damit ein Ausfall nicht
kaskadiert. **Was fehlt: 5 Minuten tatsächliche Laufzeit.**

**6. UI-Lesbarkeit.** `tools/layout_check.py` rechnet die Formeln aus
`UIKit.scaleFor` und `HudController.place` für vier Auflösungen nach und
prüft: nichts läuft über den Rand, Statusleiste und Knopfleiste
überlappen nicht, kein Text unter 11 px, keine Tippfläche unter 30 px.

| Gerät | Auflösung | Skalierung | Ergebnis |
|---|---|---|---|
| Desktop | 1920×1080 | 1,15 | Leiste senkrecht links |
| Tablet | 1024×768 | 0,80 | Leiste senkrecht links |
| Handy quer | 667×375 | 0,88 | Leiste unten, 2 Rasterreihen |
| Handy hoch | 375×667 | 0,89 | Leiste unten, 2 Rasterreihen |

**Was fehlt: ein Blick auf einen echten Bildschirm.** Gerechnete
Geometrie sagt nichts über Schriftmetrik oder Notch-Bereiche.

---

# Nächste Erweiterungen

1. **Erz-Pool statt Neuerzeugung** — vorgefertigte Teile wiederverwenden
   und damit den Garbage-Collector bei hohen Droppraten entlasten.
2. **Zweite Bandlinie** als Prestige-Freischaltung ab Rebirth 3, um den
   Upgrade-Baum nach dem ersten Rebirth zu verbreitern.
3. **Server-Dashboard** mit Live-Kennzahlen (Erze/s, Speicherfehler,
   Remote-Ablehnungen) für Live-Ops.
4. **Offline-Einkommen** über den Zeitstempel des letzten Saves, gedeckelt
   auf 8 Stunden.
5. **Freundesbonus** (+10 % je Freund im Server) über `Players:GetFriendsAsync`.
6. **A/B-Test-Haken** in `Config`, um Preiskurven serverseitig zu variieren.
7. **Analytics-Events** bei Kauf, Rebirth und Abbruch, um den 30-Minuten-Wert
   gegen echte Sitzungsdaten zu validieren.
8. **Lokalisierung** — alle Anzeigetexte stehen bereits in `Config` und den
   Controllern und ließen sich in eine LocalizationTable ziehen.
