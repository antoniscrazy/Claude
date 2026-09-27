# Bergbau-Imperium — Roblox-Tycoon

Vollständiges Dropper-Conveyor-Tycoon-Spiel. Lieferung als öffenbares
Place-File **und** als Rojo-Projekt.

> **Zum Thema:** der Prompt enthielt `[HIER THEMA EINSETZEN]`. Gewählt wurde
> **Bergbau-Imperium**. Das Thema steckt ausschließlich in Namen, Farben und
> Materialien in `src/shared/Config.luau` — die Spiellogik ist themenneutral
> und lässt sich in wenigen Minuten auf Pizza-Fabrik oder Autowerk umbenennen.

## Auslieferung

| Datei | Zweck |
|---|---|
| `TycoonGame.rbxlx` | Place-File, per Doppelklick in Roblox Studio zu öffnen |
| `default.project.json` + `src/` | Rojo-Projekt zum Versionieren und `rojo build` |
| `tools/` | Build, Balancing-Solver, Prüfskripte |
| `docs/` | Architekturbaum, Balancing-Tabelle |

Beides kommt aus **einer** Quelle: `tools/build.py` liest dieselbe
Baumdefinition und erzeugt daraus Rojo-Projekt, Sourcemap und `.rbxlx`.
Der Quelltext liegt nur einmal in `src/` — es gibt keine Kopie im XML,
die auseinanderlaufen könnte.

## Schnellstart

```bash
python3 tools/build.py      # erzeugt TycoonGame.rbxlx neu
./tools/verify_all.sh       # Typprüfung, Balancing, Layout, Place-Struktur
rojo build -o TycoonGame.rbxlx   # Alternative, falls Rojo installiert ist
```

Danach `TycoonGame.rbxlx` in Roblox Studio öffnen und auf **Play** drücken.
Die gesamte Welt (Lobby, 6 Plots, Beleuchtung, UI) wird zur Laufzeit gebaut.

Siehe `SETUP.md` für Asset-IDs, API-Services und Veröffentlichung.

## Architektur

Drei Schichten mit klarer Richtung: `Shared` kennt niemanden, `Server` und
`Client` kennen `Shared`, und der Client kennt den Server nur über Remotes.

```
ReplicatedStorage/Shared   Types, Config, Log, Format, Trove, RateLimiter, Remotes
ServerScriptService/Server Bootstrap + 12 Dienste mit Init/Start-Lifecycle
StarterPlayerScripts/Client Bootstrap + 6 Controller
```

Vollständiger Baum: `docs/ARCHITEKTUR.txt`

### Dienste

| Dienst | Verantwortung |
|---|---|
| `TickScheduler` | der einzige Heartbeat des Servers; alle periodischen Aufgaben |
| `DataService` | Profile mit Session-Locking, Reconcile, Backoff, BindToClose |
| `WorldService` | Lobby, Beleuchtung, Ambiente, Bestenlisten-Tafel |
| `PlotBuilder` | reine Geometrie eines Plots, ohne Spiellogik |
| `PlotService` | Besitz, Zuweisung, Freigabe, Optik |
| `MonetizationService` | Gamepasses, Developer-Products, VIP-Tür |
| `ProgressionService` | Quests, Tagesbelohnung, Codes |
| `EconomyService` | Dropper, Erze, Sammler, Kaufvalidierung |
| `RebirthService` | Prestige-Schleife |
| `LeaderboardService` | OrderedDataStore, Top 50 |
| `StateService` | Replikation zum Client, alle eingehenden Remotes |
| `RemoteGuard` | Rate-Limit, Typprüfung, Fehlerabschirmung |

`Init()` darf nicht yielden und verdrahtet nur; `Start()` darf yielden.
Die Reihenfolge in `Bootstrap.server.luau` ist die Abhängigkeitsreihenfolge
und bewusst nicht alphabetisch.

### Client/Server-Grenze

Der Client sendet ausschließlich Absichten („kaufe Upgrade X"). Für jeden
Kauf prüft der Server in `EconomyService.purchase` einzeln und kommentiert:
Existenz des Upgrades, geladenes Profil, Plotbesitz, Doppelkauf,
Abhängigkeiten, **Distanz zum eigenen Plot**, Guthaben. Der Client hält
keinen eigenen fortgeschriebenen Zustand, sondern zeigt nur den letzten
Server-Schnappschuss.

## Balancing

Die Zahlen sind nicht geraten. `tools/balance_sim.py` löst den
Einkommensfaktor per Bisektion auf das 30-Minuten-Ziel und erzeugt den
Upgrade-Block in `Config.luau` (`tools/gen_config.py`).

- Erster Kauf nach **20 s** (Ziel < 45 s)
- Rebirth 1 nach **30,1 min** (Ziel 25–35 min)
- Größter Schritt-Sprung **1,55×** (Schranke 2,50×)

Vollständige Tabelle: `docs/BALANCING.md`

`tools/throughput.py` prüft zusätzlich, dass die Erz-Obergrenze pro Plot
den simulierten Ertrag nicht abschneidet (Endausbau: 25,8 Erze bei Limit 45).

## Performance

- Genau **eine** Heartbeat-Verbindung im ganzen Server (`TickScheduler`)
- Förderband über `AssemblyLinearVelocity` eines verankerten Teils — die
  Physik-Engine bewegt die Erze, kein Luau-Frame dafür
- Multiplikatoren gecacht, Invalidierung nur bei Kauf/Rebirth/Gamepass
- Gamepass-Abfragen yielden **nie** im Tick (Cache + Hintergrund-Refresh)
- Harte Erz-Obergrenze pro Plot plus Verfallszeit
- Shop-Zeilen werden einmal gebaut und danach nur aktualisiert
- Kein `wait`, kein `spawn`, kein `delay`, kein `BodyVelocity` — geprüft
  von `tools/api_check.py`

## Prüfstand

`./tools/verify_all.sh` führt aus:

1. **Strikte Typprüfung** aller 27 Module mit `luau-lsp` gegen die echten
   Roblox-API-Definitionen und eine Sourcemap (require wird aufgelöst)
2. **Bytecode-Kompilierung** jedes Moduls
3. **API-Prüfung** auf veraltete/verbotene Aufrufe, Kommentare ausgenommen
4. **Balancing** inkl. Durchsatzgrenze
5. **UI-Layout** auf 1920×1080, 1024×768, 667×375, 375×667
6. **Place-Struktur**: XML valide, alle Services und Skripte vorhanden,
   jedes Skript mit `--!strict` und Quelltext

Was das **nicht** ersetzt: einen Play-Test in Studio. Siehe „Definition of
Done" in `SETUP.md`.
