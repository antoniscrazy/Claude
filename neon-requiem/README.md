# NEON REQUIEM – Neo-Berlin 2089

Ein 3D-Cyberpunk-Detektivspiel für den Browser (three.js + TypeScript + Vite).

## Starten

```bash
npm install
npm run dev
```

Dann http://localhost:5173 öffnen. Produktions-Build: `npm run build`, Vorschau: `npm run preview`.

## Steuerung

| Taste | Aktion |
|---|---|
| WASD / linker Stick | Bewegen |
| Maus / rechter Stick | Umsehen (ins Bild klicken fängt die Maus) |
| Shift / RT | Sprinten |
| C / Strg / B | Ducken |
| E / A | Untersuchen |
| Q / Y | Cyberauge-Scan |
| Leertaste | Untertitel überspringen |
| Esc / Start | Pause |

Tab (Inventar) und J (Fallakte) sind belegt, die Systeme folgen in M2 und M3.

## Projektstruktur

```
src/
  core/        Engine, Postprocessing, Input, Settings (+ Presets), i18n, Events, Storage
  systems/     Spieler, Schulterkamera, Kollision, Interaktion, Partikel, audio/
  entities/    Kai (prozedurale Gelenkfigur)
  scenes/      OfficeScene + office/ (Raum, Möbel, Requisiten, Fensterregen, Pfütze, Lichtkegel)
               city/ (Himmel, Skyline, Koi-Hologramm, Spinner, GPU-Regen, Schilder, Blitze)
  gameplay/    Spielzustand, Intro-Sequenz
  ui/          HUD, Menüs, Optionen, Untertitel, CSS
  data/        JSON: intro, interactables, quotes, assets, i18n/de + en
public/models, public/audio   für spätere GLB- und Audiodateien
```

Neue Inhalte (Monolog, untersuchbare Objekte, Zitate, Übersetzungen) werden in `src/data/*.json`
angelegt, ohne Code anzufassen.
