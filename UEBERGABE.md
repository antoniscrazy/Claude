# Übergabe: Spiele-Sammlung (Repo `antoniscrazy/Claude`, Branch `claude/vigilant-mendel-5a81rh`)

## Rolle und Stil
- Antworte **auf Deutsch**, ehrlich, ohne Schmeichelei (Nutzer-Wunsch: kein "gefällt mir", lieber offen sagen, was nicht geht oder schwach ist).
- Kurz halten, wenig Ausgabe, **sparsam testen** (ein Lauf, ein Bild). Nutzung ist dem Nutzer wichtig.
- Nichts als fertig melden, was nicht getestet ist. Ungetestetes klar benennen.
- Nach jedem Spiel: committen, pushen, fertige HTML mit `SendUserFile` schicken. Nur auf Branch `claude/vigilant-mendel-5a81rh` pushen. Kein PR ohne Auftrag.
- Commit-Trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` und `Claude-Session: https://claude.ai/code/<session>`.

## Ziel pro Spiel
1. Spiel finden (GitHub-Kopie; keine Dateien von Portalen/Webseiten ziehen; Spiel muss auf GitHub liegen). Bevorzugt Konten, die der Nutzer genannt hat: `bubbls/UGS-Assets`, `bubbls/youtube-playables`, `monkeymonkeyohio`, `55gms/assets`, `CoolDude2349/everything`.
2. Werbung/Tracker/Fremdserver entfernen (Netz-Sperre im Launcher, SDKs durch Platzhalter ersetzen). **Belohnungs-Werbung (Rewarded) sofort gewähren.**
3. Dateien ins eigene Repo unter `<spiel>/` kopieren, Launcher `<spiel>.html` im Repo-Wurzelordner bauen, der aus dem Repo lädt (Moki-Button, kein lokaler Server, Doppelklick-tauglich).
4. Launcher hat oben eine **eigene Leiste** mit Button `← Back to Moki` (Link `https://mokiorg.netlify.app`, Farbverlauf `#00e5a8` → `#ffd23f`, Pille). Darf nichts vom Spiel verdecken.
5. Auf iPad prüfen/bauen: Touch-Steuerung nachrüsten, wenn nötig (nur während des Spielens sichtbar).
- Admin-Modus, wenn gewünscht: Passwort `2908`, 5 Tipps oben links (oder Reiter unten links, je nach Wunsch).

## Launcher-Muster
- **HTML5/Construct/Pixi (viele Skripte):** per **jsDelivr** mit festem Commit-Hash laden (`https://cdn.jsdelivr.net/gh/antoniscrazy/Claude@<SHA>/<spiel>/`). Launcher holt `index.html`, setzt `<base href=...>` und schreibt es in `iframe.srcdoc`. Construct braucht zusätzlich `window.__GAME_BASE=BASE` (Basis-URL-Patch in `scripts/main.js`, Zeile `if(opts.runtimeBaseUrl)` → `if(window.__GAME_BASE)...`).
- **Unity WebGL (große Dateien):** per **raw.githubusercontent.com** mit festem Commit-Hash. Launcher holt Loader als Text (inline `<script>`), Framework als Blob, Daten/Wasm als Blob-URL, `streamingAssetsUrl` = raw-Basis. Brotli-Dateien (`.unityweb`) vorher **entpacken** und unkomprimiert speichern. Muster: `rogue-sergeant.html`, `golf-orbit.html`, `ultimate-car-driving.html`.
- Skripte von raw.githubusercontent.com werden wegen `text/plain` + `nosniff` **nicht** als Skript/Modul ausgeführt: dann jsDelivr nehmen oder Skripte inline einsetzen.
- Netz-Sperre-Beispiel: `golf-orbit.html` (XHR/fetch/sendBeacon nur an eigene Herkunft, blob:, data:).
- `String.replace` mit Code als Ersatz immer als **Funktion** (`() => ...`), sonst werden `$`-Zeichen im Code verändert. `</script>` in Strings als `<\/script>` schreiben.

## jsDelivr-Zwischenstand-Verfahren (Repo ist > 50 MB, jsDelivr-Limit 50 MB/Paket, 20 MB/Datei)
1. Spiel normal committen und pushen.
2. Zwischenstand: `git ls-files | grep -v '^<spiel>/' | xargs -d '\n' git rm -q --cached` → committen → pushen → `SNAP=$(git rev-parse HEAD)`. Prüfen, dass `https://cdn.jsdelivr.net/gh/antoniscrazy/Claude@$SNAP/<spiel>/index.html` Status 200 liefert.
3. Wiederherstellen: `git add -A && git commit` (nicht `git revert`) → pushen. Danach prüfen, dass `git diff --stat HEAD~2` leer ist.
4. Launcher mit `SNAP` bauen, committen, pushen. Dateien > 20 MB gehen **nicht** über jsDelivr → raw nehmen.
- Push bei Fehlern 503 mit Wartezeit wiederholen (1, 10, 30, 60 s).

## Test (sparsam)
Playwright/Chromium im Container: Argumente `--use-angle=swiftshader --use-gl=angle --enable-unsafe-swiftshader --ignore-gpu-blocklist --enable-webgl --no-sandbox`. Touch via `hasTouch:true`. Ein Lauf, ein Screenshot, Fremd-Anfragen mitloggen. Große Unity-Spiele brauchen 60–90 s zum Laden (im Hintergrund laufen lassen).

## Fertige Spiele (alle im Repo, mit Launcher)
ragdoll-hit, hills-of-steel (+ Admin-Modus, `hills-of-steel-admin`), perfect-hotel, level-devil, slice-master, fruit-ninja, angry-bird, subway-surfers, kick-the-buddy (Geheim-Cheat Taste K), drift-hunters (Touch-Steuerung), zombie-rush, stickman-gta, war-of-sticks, johnny-trigger (Sniper, Unity; Zahlensuche-Admin), **johnny-trigger-admin** (eigene Version mit Debugger-Panel: alle Waffen/Skins/Geld per `SendMessage("Debugger", ...)`), johnny-trigger-remake (selbstgebauter Nachbau Level 1 mit Original-Modellen, Three.js), rogue-sergeant (iPad-Steuerung, Bildrate 60 fps, highp-Shader), ultimate-car-driving (Touch-Steuerung), tank-stars, open-panzer-front (Touch-Steuerung), lakeside-fishing (deutsch, Einzelspieler, Ansicht-Taste), neon-swing, golf-orbit, bowmasters, crossy-road, cookie-clicker (obere Leiste entfernt, jsDelivr), solar-smash und stick-war-legacy (YouTube-Playables-Unity, Zip-Ablauf, siehe unten).

## Offene/bekannte Punkte
- Rogue Sergeant: Baum-/Himmel-Flackern auf dem iPad, Ursache unklar (zuletzt highp-Shader + 60 fps versucht).
- Johnny Trigger Nachbau: nur Level 1, Johnny nur als Kopf im Bild, Animationen per Code (Original-Humanoid-Animationen nicht lesbar).
- Fishoria (Supabase-Backend): Tabellen sind in Projekt `heinitznavi` angelegt (17 Tabellen, RLS an), Server/Redis fehlen. Nutzer hat sich für Lakeside Fishing entschieden. Nicht weiterverfolgt.
- Super Black Hole: nicht auf GitHub gefunden, gestrichen.
- Eigene Waffen im "Special"-Reiter von Johnny Trigger: nur gefragt, nicht gebaut (Reiter ist leer, im Code gesperrt).
- Tools/Daten (nicht im Repo): Auslese-Skripte für Johnny Trigger liegen in `/tmp/jtx/` und sind nach Sitzungsende weg.

## Sicherheit
- Fremden Code nur ausführen, wenn der Nutzer das Repo genannt hat (Auto-Modus blockiert sonst). Beim Bauen fremder npm-Projekte `npm ci --ignore-scripts`.
- Keine Passwörter/Schlüssel im Chat anfordern. Datenbank-Zugänge trägt der Nutzer selbst beim Hoster ein.

## Solar Smash / YouTube-Playables-Unity (Lehre)
- Quelle: `bubbls/youtube-playables`. Loader ist obfuskiert und stuerzt ab (`GLctx`), wenn Daten/Wasm nicht als Blob aus dem Original-Zip-Ablauf kommen. Deshalb Originalablauf behalten: `Build.data.zip`/`Build.wasm.zip` im Repo, `lib/jszip`, `TemplateData`.
- Launcher holt `index.html` per raw (Basis `<base>` = raw), setzt `window.__RAW`/`__JSD`; Loader, Framework, jszip, CSS absolut ueber jsDelivr-Zwischenstand (Skripte laufen nur von dort). Assets (Bundles) kommen aus der Basis (raw), nicht aus `streamingAssetsUrl` allein.
- Geteilte Bundle-Teile (`planets.part1/2`) vorher zusammengefuegt, Merge-Skript aus index.html entfernt.
- Stick War Legacy: gleiches Muster. Zusaetzlich lud `unarchiver.min.js` jszip relativ zur Basis (raw) und hing: `loadScript` in index.html auf `__JSD` ueberschrieben. Logo-Datei in `TemplateData` nie ersetzen/loeschen (Loader prueft sie), nur per CSS `opacity:0` ausblenden. Perfect Flip (PlayHop) nicht auf GitHub gefunden. MAXGAMES-Logo im Menue bleibt.

## Neu in dieser Sitzung (Stand)
- Fertig, mit Launcher: cookie-clicker, solar-smash, stick-war-legacy, eggy-car (iPad-Touch unklar), count-control-legends (Unity, Poki-Build; `d0cum3nt`-Platzhalter noetig), robo-cleaner-simulator (PlayCanvas, **eine einzige HTML**).
- **brain-test (Tricky Puzzles, Construct 3): auf dem iPad des Nutzers fehlen Texte/schwarzer Bildschirm, Ursache NICHT geklaert.** In Chromium und WebKit (Playwright, iPad-Emulation) laeuft alles. Versuche: Worker aus, Schriften nach TrueType, eingebettete Einzeldatei, Diagnose-Version (`brain-test-diagnose.html`, Bildschirm-Log). Nutzer hat das Spiel aufgegeben. Vermutung (ungeprueft): alter Spielstand im Browser (150 Hinweise) oder iOS-Speicher.
- Perfect Flip, Brain Test All-Star, Squishy Merge, Tower Master (PlayHop/Poki): keine GitHub-Kopie gefunden.
- **jsDelivr-Zwischenstaende:** neue Binaerdateien (wasm, Bilder, Audio) sind dort oft erst nach Minuten bis Stunden abrufbar (404/503) und lassen Spiele haengen. Vor dem Test alle Dateien per curl pruefen. Dateinamen mit Leerzeichen liefert jsDelivr nicht aus.
- **Besser fuer kleine Spiele (< ca. 30 MB): eine einzige HTML mit allen Dateien eingebettet** (`tools/build_selfcontained.py` fuer PlayCanvas, `tools/build_selfcontained_c3.py` fuer Construct 3, Option `--debug` fuer Bildschirm-Log). Kein jsDelivr noetig.
- WebKit zum Testen ist installiert worden (`playwright install webkit` + `install-deps`), iPad-Emulation: `devices['iPad Pro 11 landscape']`.
- Der Nutzer will keine automatischen Loeschungen seiner Browserdaten (wurde vom System blockiert).

## Neu (Sitzung Auto-Spiel)
- Fertig, mit Launcher: **block-blast** (Unity), **harvest-simulator** (PlayCanvas/Poki-Build), **polytrack** (Low-Poly-Rennspiel, reines JS, ca. 5 MB, jsDelivr-Snapshot). Quelle Polytrack: 55gms/assets misc/polytrack; Audio/Modelle/Strecken lagen in Fremd-Repo `wergboy/NLP` (jsDelivr), wurden nach `polytrack/pt/` kopiert und die URLs im Bundle auf relativ umgeschrieben. Eigene Touch-Tasten (links/rechts/Gas/Bremse/R) in `polytrack/index.html`, erscheinen nur beim Fahren (Tacho sichtbar). Getestet in Chromium-iPad-Emulation: Gas per Touch -> 124 km/h. Auf echtem iPad ungetestet.
- Auto-Kandidaten: HexGL ist ein Hover-Ship-Spiel, kein Auto. Nicht geprueft: madstunt-cars, escaperoad, drive-mad, moto-trap, turbo-moto-racer, stunt-car-extreme, supercar-legends, retro-highway.
- Lehre: Quellen-Repos koennen Assets per jsDelivr aus Dritt-Repos laden (`grep -oE "https?://[^\"' )]+" bundle.js`) – diese mitkopieren. HTTrack-Spiegel haben meist riesige Google-Gadget-Skripte in index.html, die man entfernen kann.
