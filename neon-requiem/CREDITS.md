# Credits & Lizenzen

Jedes externe Asset wird hier mit Quelle und Lizenz eingetragen, **bevor** es ins Repository kommt.

## Software

| Paket | Zweck | Lizenz |
|---|---|---|
| [three.js](https://threejs.org) | 3D-Engine | MIT |
| [postprocessing](https://github.com/pmndrs/postprocessing) | Bloom, SMAA, SSAO, Aberration, Grain, Vignette | Zlib |
| [Vite](https://vite.dev) | Build-Tool | MIT |
| [TypeScript](https://www.typescriptlang.org) | Sprache | Apache-2.0 |

## Schrift

| Asset | Quelle | Lizenz |
|---|---|---|
| Share Tech Mono (Carrois Apostrophe) | Google Fonts | SIL Open Font License 1.1 |

## 3D-Modelle

Meilenstein 1 nutzt **keine** externen Modelle. Alles ist prozedural im Code gebaut:

| Objekt | Datei | Herkunft |
|---|---|---|
| Kai Brandt (Gelenkfigur mit Code-Animation) | `src/entities/Kai.ts` | eigene Arbeit |
| Büro, Möbel, Requisiten | `src/scenes/office/*` | eigene Arbeit |
| Skyline, Schilder, Spinner, Hologramm-Koi | `src/scenes/city/*` | eigene Arbeit |

Geplant ab M2/M3 (vor Einbau prüfen und hier eintragen): Charaktere mit Skelett-Animationen
von Quaternius (CC0), Straßen-Requisiten aus den Kenney-Kits (CC0).

## Texturen

Alle Texturen (Holzboden, Putz mit Wasserschaden, Leder, Metall, Milchglas-Tür, Plakat,
Ziffernblatt, Neonschrift) werden zur Laufzeit per Canvas erzeugt (`src/materials/Textures.ts`).
Die Fensterlichter der Skyline entstehen im Shader.

## Audio

Alle Klänge und die Musik werden per WebAudio-API synthetisiert (`src/systems/audio/*`):
Regen, Tropfen am Glas, Neonsummen, Ventilator, Kühlschrank, Tropfen in die Pfütze, Schritte,
Donner, Sirenen, Klopfen, Ambient-Pads und Spannungs-Schicht. Keine Audiodateien.
