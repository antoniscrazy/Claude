# Moki Weihnachtsfilm: "Der Stern von Moki"

Alles hier ist **fertig zum Kopieren**. Du musst nichts einsetzen oder ausfüllen. Jeder Prompt enthält den Stil, die Beschreibung von Moki und des Baums. Die KI kennt Moki nicht, deshalb habe ich ihr die Figur genau beschrieben und dir Referenzbilder gebaut (Ordner `referenz/`).

Länge: ca. 75 Sekunden, 16:9, 24 fps, ohne Sprache. 14 Clips à ca. 5 Sekunden.

## So gehst du vor (Reihenfolge)
1. Lade bei deinem KI-Tool das Referenzbild hoch, das bei jedem Clip steht. Das ist der wichtigste Schritt, weil die KI Moki sonst jedes Mal anders zeichnet. Nimm Bild-zu-Video (Image-to-Video), wenn das Tool das kann.
2. Kopiere den Prompt des Clips in das Textfeld.
3. Wenn das Tool ein Feld für "Negative Prompt" hat, nimm: `text, letters, numbers, watermark, logo, subtitles, extra limbs, deformed, blurry, flicker, low quality, realistic human faces, scary, horror, violence`
4. Schneide die Clips in Blender (Video Sequence Editor) hintereinander.
5. Den Titel setzt du am Ende ein. KI kann keine Schrift. Titel: **Moki Weihnachten** und darunter **24 Türchen. 24 Spiele.** (Das Moki-Logo liegt als `moki-logo.png` bei.)

## Die Referenzbilder (alle im Ordner `referenz/`)
| Datei | Wofür |
|---|---|
| `moki-figur.png` | Die Figur Moki (Ring, Play-Dreieck als Auge, Weihnachtsmütze). Bei fast jedem Clip hochladen. |
| `baum-mit-fragezeichen.png` | Der Baum mit den 24 Fragezeichen-Kugeln. Für alle Baum-Clips. |
| `moki-logo.png` | Das Moki-Schriftlogo für den Titel am Ende. Nur für den Schnitt, nicht für die KI. |
| `logo-mit-muetze-nacht.png` | Das Logo mit Mütze auf Nachthimmel. Optional als Stimmungsbild. |

## Moki in Code (für Tools, die das lesen können, und für dich als Beschreibung)
Die KI kann kein SVG zeichnen, aber manche Chat-KIs verstehen die Form daraus. So ist Moki genau aufgebaut:
- Ein Ring: Mittelpunkt in der Mitte, Radius 38, Strichstärke 24 (also dicker Ring mit kleinem Loch).
- Farbverlauf diagonal von Grün `#00e5a8` (oben links) nach Gelb `#ffd23f` (unten rechts).
- In der Mitte ein weißes Dreieck mit abgerundeten Ecken, zeigt nach rechts (Play-Symbol), Punkte (-10,-16), (14,0), (-10,16).
- Eine rote Weihnachtsmütze mit weißem Rand und weißer Bommel sitzt schräg oben auf dem Ring.
- Hintergrund Nachtblau `#16275e` bis `#050a1c`.

SVG der Figur:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1500" height="1500"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="362" y2="0"><stop offset="0" stop-color="#00e5a8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00e5a8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient><radialGradient id="bg" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#16275e"/><stop offset="1" stop-color="#050a1c"/></radialGradient><filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs><rect width="1000" height="1000" fill="url(#bg)"/><g transform="translate(500 520) scale(4.6)"><circle r="38" fill="none" stroke="url(#g2)" stroke-width="30" opacity=".5" filter="url(#gl)"/><circle r="38" fill="none" stroke="url(#g2)" stroke-width="24"/><circle r="38" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-dasharray="40 200" transform="rotate(-125)"/><path d="M-10 -16L14 0L-10 16Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></g><g transform="translate(560 300) rotate(18) scale(2.2)"><path d="M-40 0 C-40 -40 -10 -70 30 -62 C20 -50 25 -30 40 0Z" fill="#d6263b"/><path d="M-46 0 H46 a10 10 0 0 1 0 20 H-46 a10 10 0 0 1 0 -20Z" fill="#fff"/><circle cx="32" cy="-64" r="12" fill="#fff"/></g><g fill="#fff" opacity=".9"><circle cx="190" cy="260" r="4"/><circle cx="820" cy="400" r="5"/><circle cx="260" cy="760" r="3"/><circle cx="790" cy="790" r="4"/><circle cx="130" cy="520" r="3"/></g></svg>
```
SVG des Moki-Schriftzugs (zeigt auch, woher die Figur kommt: das "o" im Logo ist der Ring):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-114 -120 592 370" width="1776" height="1110"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="362" y2="0"><stop offset="0" stop-color="#00e5a8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00e5a8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient><radialGradient id="bg" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#16275e"/><stop offset="1" stop-color="#050a1c"/></radialGradient><filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs><rect x="-114" y="-120" width="592" height="370" fill="url(#bg)"/><g fill="none" stroke="url(#g)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 120V70C12 52 22 44 38 44S64 52 64 70V120"/><path d="M64 70C64 52 74 44 90 44S116 52 116 70V120"/><circle cx="192" cy="82" r="38"/><path d="M268 12V120"/><path d="M268 90L304 48"/><path d="M286 74L310 120"/><path d="M350 44V120"/></g><circle cx="350" cy="6" r="14" fill="url(#g)"/><path d="M183 66L207 82L183 98Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></svg>
```

## Die Clips

### Clip 1: Schneekugel-Dorf
Kamera fährt langsam an einer Schneekugel heran. Ruhiger Anfang.

**Referenzbild hochladen:** `moki-figur.png nicht nötig, nur Baum-Referenz`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Slow cinematic push-in on a glass snow globe standing on a wooden shelf in a dark cozy living room at night. Inside the globe is a tiny snowy village with one huge glowing Christmas tree (the Christmas tree: three snowy triangular tiers in deep green, warm string lights in red, gold, blue and white, a golden ring-shaped star on top (a thick glowing ring with a white play-triangle in its middle), 24 round glass baubles in red, green, blue and gold hanging from it, each bauble marked with a plain white question mark). Snow swirls gently inside the globe, warm window light and soft bokeh in the background.
```

### Clip 2: Moki wacht auf
Nahaufnahme, Moki streckt sich.

**Referenzbild hochladen:** `moki-figur.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Close-up of Moki: a small character that is a thick glowing ring (torus) with a smooth gradient from emerald green (#00e5a8) at the upper left to golden yellow (#ffd23f) at the lower right; the hole of the ring is small (the ring is about as thick as the hole is wide); in the middle of the hole floats a white rounded play-button triangle pointing right, which is Moki's single eye; no mouth, no arms, no legs; a small red Santa hat sits on top of the ring; Moki moves by rolling like a wheel and hopping. Keep exactly this design in every shot (see reference image). Moki sits on the wooden shelf next to the snow globe and wakes up: the eye is first a closed thin line, then opens into the white play-triangle, Moki blinks, stretches and gives a small happy bounce. Soft rim light, warm sparkles, shallow depth of field.
```

### Clip 3: Der Stern flackert
Das Licht geht aus.

**Referenzbild hochladen:** `baum-mit-fragezeichen.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Inside the snow globe a cold gust of wind sweeps through the village, the golden ring-shaped star on top of the Christmas tree flickers three times and goes dark, the string lights go out one by one from top to bottom, blue moonlight takes over, dramatic but gentle mood, no one is hurt.
```

### Clip 4: Die Kugeln rollen davon
24 Kugeln machen sich auf den Weg.

**Referenzbild hochladen:** `baum-mit-fragezeichen.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Wide shot: 24 glass baubles in red, green, blue and gold (each with a white question mark) drop one after another from the dark Christmas tree, bounce in the snow and roll away in all directions toward 5 glowing portals at the edge of the village, each portal shows a different colorful world, magical sparkle trails behind the baubles, snow swirling.
```

### Clip 5: Moki wird entschlossen
Wendepunkt.

**Referenzbild hochladen:** `moki-figur.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Close-up of Moki: a small character that is a thick glowing ring (torus) with a smooth gradient from emerald green (#00e5a8) at the upper left to golden yellow (#ffd23f) at the lower right; the hole of the ring is small (the ring is about as thick as the hole is wide); in the middle of the hole floats a white rounded play-button triangle pointing right, which is Moki's single eye; no mouth, no arms, no legs; a small red Santa hat sits on top of the ring; Moki moves by rolling like a wheel and hopping. Keep exactly this design in every shot (see reference image). Moki looks at the dark tree, the eye shrinks in shock, then the triangle glows bright and Moki's ring starts spinning faster, small snow puffs, hero lighting from below, slow motion, determined mood.
```

### Clip 6: Rennstrecke
Erste Welt: Tempo.

**Referenzbild hochladen:** `moki-figur.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Moki: a small character that is a thick glowing ring (torus) with a smooth gradient from emerald green (#00e5a8) at the upper left to golden yellow (#ffd23f) at the lower right; the hole of the ring is small (the ring is about as thick as the hole is wide); in the middle of the hole floats a white rounded play-button triangle pointing right, which is Moki's single eye; no mouth, no arms, no legs; a small red Santa hat sits on top of the ring; Moki moves by rolling like a wheel and hopping. Keep exactly this design in every shot (see reference image). Moki rolls like a wheel at high speed on a neon-lit winter race track that curves through snowy hills, chasing a rolling red bauble, drifts around a corner with snow spray, dynamic low camera following alongside, motion blur, fast and fun.
```

### Clip 7: Wüste
Zweite Welt: Weite.

**Referenzbild hochladen:** `moki-figur.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Moki: a small character that is a thick glowing ring (torus) with a smooth gradient from emerald green (#00e5a8) at the upper left to golden yellow (#ffd23f) at the lower right; the hole of the ring is small (the ring is about as thick as the hole is wide); in the middle of the hole floats a white rounded play-button triangle pointing right, which is Moki's single eye; no mouth, no arms, no legs; a small red Santa hat sits on top of the ring; Moki moves by rolling like a wheel and hopping. Keep exactly this design in every shot (see reference image). Moki slides down a huge golden sand dune at sunset, the Santa hat flaps in the wind, a green bauble rolls just ahead, long shadows, the sand sparkles like snow, wide cinematic shot.
```

### Clip 8: Schleimland
Dritte Welt: Spaß.

**Referenzbild hochladen:** `moki-figur.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Moki: a small character that is a thick glowing ring (torus) with a smooth gradient from emerald green (#00e5a8) at the upper left to golden yellow (#ffd23f) at the lower right; the hole of the ring is small (the ring is about as thick as the hole is wide); in the middle of the hole floats a white rounded play-button triangle pointing right, which is Moki's single eye; no mouth, no arms, no legs; a small red Santa hat sits on top of the ring; Moki moves by rolling like a wheel and hopping. Keep exactly this design in every shot (see reference image). Moki bounces across a colorful land of friendly jelly blobs in pastel green, pink and blue, hopping from blob to blob like on trampolines, a blue bauble sits on top of a tall wobbling blob tower, playful and cheerful.
```

### Clip 9: Strichmännchen-Dojo
Vierte Welt: Humor.

**Referenzbild hochladen:** `moki-figur.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Moki: a small character that is a thick glowing ring (torus) with a smooth gradient from emerald green (#00e5a8) at the upper left to golden yellow (#ffd23f) at the lower right; the hole of the ring is small (the ring is about as thick as the hole is wide); in the middle of the hole floats a white rounded play-button triangle pointing right, which is Moki's single eye; no mouth, no arms, no legs; a small red Santa hat sits on top of the ring; Moki moves by rolling like a wheel and hopping. Keep exactly this design in every shot (see reference image). Moki dodges between simple stick figures made of thick black lines doing funny martial-arts moves in a snow-covered dojo with paper walls, grabs a gold bauble in mid-air, comedic timing, side view.
```

### Clip 10: Wolkenhimmel
Fünfte Welt: höchster Punkt.

**Referenzbild hochladen:** `moki-figur.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Moki: a small character that is a thick glowing ring (torus) with a smooth gradient from emerald green (#00e5a8) at the upper left to golden yellow (#ffd23f) at the lower right; the hole of the ring is small (the ring is about as thick as the hole is wide); in the middle of the hole floats a white rounded play-button triangle pointing right, which is Moki's single eye; no mouth, no arms, no legs; a small red Santa hat sits on top of the ring; Moki moves by rolling like a wheel and hopping. Keep exactly this design in every shot (see reference image). Moki jumps from cloud to cloud high above the world at dawn, glowing baubles orbit around its ring like tiny planets, a huge golden sun on the horizon, epic wide shot, camera tilts up.
```

### Clip 11: Rückweg
Alle Kugeln folgen Moki.

**Referenzbild hochladen:** `moki-figur.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Moki: a small character that is a thick glowing ring (torus) with a smooth gradient from emerald green (#00e5a8) at the upper left to golden yellow (#ffd23f) at the lower right; the hole of the ring is small (the ring is about as thick as the hole is wide); in the middle of the hole floats a white rounded play-button triangle pointing right, which is Moki's single eye; no mouth, no arms, no legs; a small red Santa hat sits on top of the ring; Moki moves by rolling like a wheel and hopping. Keep exactly this design in every shot (see reference image). Moki rolls back toward the dark tree in the snow-globe village, 24 glowing baubles in red, green, blue and gold follow behind it in a long shimmering ribbon like a comet tail, snow whirling, camera tracks from the front, heroic and emotional.
```

### Clip 12: Kugeln hängen sich auf
Der Baum leuchtet wieder.

**Referenzbild hochladen:** `baum-mit-fragezeichen.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. The 24 baubles fly up one after another and hang themselves back onto the Christmas tree (the Christmas tree: three snowy triangular tiers in deep green, warm string lights in red, gold, blue and white, a golden ring-shaped star on top (a thick glowing ring with a white play-triangle in its middle), 24 round glass baubles in red, green, blue and gold hanging from it, each bauble marked with a plain white question mark), each lands with a small golden sparkle and a gentle pendulum swing, the string lights switch on step by step from bottom to top, the camera cranes up along the tree.
```

### Clip 13: Moki wird zum Stern
Höhepunkt.

**Referenzbild hochladen:** `moki-figur.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Moki: a small character that is a thick glowing ring (torus) with a smooth gradient from emerald green (#00e5a8) at the upper left to golden yellow (#ffd23f) at the lower right; the hole of the ring is small (the ring is about as thick as the hole is wide); in the middle of the hole floats a white rounded play-button triangle pointing right, which is Moki's single eye; no mouth, no arms, no legs; a small red Santa hat sits on top of the ring; Moki moves by rolling like a wheel and hopping. Keep exactly this design in every shot (see reference image). Moki jumps up to the top of the Christmas tree, its ring grows slightly and glows brighter and settles on the tip as the golden ring-shaped star, a soft shock wave of golden light spreads through the village, sparkles and snow lift into the air, euphoric moment, slow motion.
```

### Clip 14: Schlussbild
Rauszoomen, ruhig.

**Referenzbild hochladen:** `baum-mit-fragezeichen.png`

```
Cinematic 3D animated short film, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading with deep midnight-blue shadows, warm gold highlights, red and green accents, gentle falling snow, smooth motion, 4K. No text, no letters, no numbers, no logos, no subtitles. Wide final shot pulling back from the glowing Christmas tree (the Christmas tree: three snowy triangular tiers in deep green, warm string lights in red, gold, blue and white, a golden ring-shaped star on top (a thick glowing ring with a white play-triangle in its middle), 24 round glass baubles in red, green, blue and gold hanging from it, each bauble marked with a plain white question mark), the baubles swing gently, snow falls softly, the ring star shines, then the camera pulls out of the snow globe on the shelf in the cozy living room and the scene slowly fades to dark.
```

## Zeitplan mit Ton
| Zeit | Clips | Musik / Ton |
|---|---|---|
| 0:00 bis 0:10 | 1, 2 | Leise Spieluhr, Wind, Knistern |
| 0:10 bis 0:20 | 3, 4 | Musik stoppt, tiefer Ton, Glas klirrt |
| 0:20 bis 0:25 | 5 | Herzschlag, dann Anstieg |
| 0:25 bis 0:50 | 6 bis 10 | Schneller Jingle-Bells-Groove, jede Welt hat einen eigenen Soundeffekt |
| 0:50 bis 1:00 | 11, 12 | Orchester steigert sich |
| 1:00 bis 1:15 | 13, 14 | "Stille Nacht" leise, Glöckchen bei jedem Kugel-Treffer |

## Ehrliche Grenzen
- Ich kann die KI-Videos nicht selbst erzeugen. Das machst du in deinem Tool. Alles andere habe ich vorbereitet.
- Moki bleibt trotz Referenzbild nicht in jedem Clip perfekt gleich. Wenn er abweicht: Clip neu erzeugen oder kürzer schneiden. Notfalls baust du Moki in Blender selbst (Torus mit Emission-Material und ein Dreieck).
- Ich habe die Referenzbilder nur als flache Grafik gebaut, nicht in 3D. Sie zeigen Form und Farben, aber nicht das Material.
- Die Prompts sind Englisch, weil die meisten KI-Tools damit besser arbeiten.
- Wenn der Film fertig ist, baue ich ihn auf Wunsch als Einleitung vor dem Kalender ein. Unter ca. 20 MB halten, sonst wird die Seite sehr schwer.
