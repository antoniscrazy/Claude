# Moki Weihnachtsfilm: "Der Stern von Moki"

Länge ca. 75 Sekunden, 16:9, 24 fps, ohne Sprache (nur Musik und Geräusche). Läuft als Einleitung des Weihnachts-Events und endet auf dem Baum mit 24 Fragezeichen-Kugeln, genau wie die Einleitung der Seite. Die Fragezeichen sind die 24 Türchen.

## Die Geschichte in 6 Sätzen
1. Heiligabend-Vorabend: In einem Schneekugel-Dorf steht ein riesiger Baum. Oben leuchtet als Stern der Moki-Ring.
2. Moki, ein kleines rundes Wesen aus einem leuchtenden grün-goldenen Ring mit einem weißen Play-Dreieck als Auge, wacht auf einem Regal im Wohnzimmer auf.
3. Ein Windstoß lässt den Stern flackern. Das Licht geht aus und die 24 Kugeln des Baums fallen ab. Jede Kugel zeigt ein Fragezeichen und rollt in eine andere Spielwelt davon.
4. Moki rollt (er ist ja ein Ring) hinterher: durch eine Rennstrecke, eine Wüste, ein Schleimland, ein Strichmännchen-Dojo, einen Wolkenhimmel. Überall holt er eine Kugel zurück.
5. Am Ende schafft er die letzte Kugel in letzter Sekunde, springt an die Spitze und wird selbst zum Stern.
6. Der Baum leuchtet, die 24 Kugeln pendeln, Schnee fällt. Titel: "Moki Weihnachten. 24 Türchen. 24 Spiele."

Warum das funktioniert: Eine Figur, ein Ziel, wenige Schauplätze. Die Spielwelten zeigen Spaß, ohne dass du echte Spiele nachbauen musst (das wäre auch ein Rechteproblem).

## Wichtig vorab (ehrlich)
- **Figur gleich halten ist das schwierigste Problem bei KI-Video.** Erzeuge zuerst EIN Referenzbild von Moki (Prompt unten) und benutze es bei jedem Clip als Startbild (Image-to-Video). Nur Text-zu-Video ändert die Figur von Clip zu Clip.
- **KI kann keine Schrift.** Alle Titel ("Moki Weihnachten", Zahlen, Fragezeichen auf den Kugeln, das Moki-Logo) setzt du in Blender oder im Schnitt drüber. Im Prompt steht deshalb "no text".
- Jeder Clip ist meist nur 4 bis 8 Sekunden lang. Plane 14 Clips à 5 Sekunden und schneide auf ca. 75 Sekunden.
- Mach vorher Testclips mit billiger Einstellung, bevor du alles in hoher Qualität renderst.
- Musik: Deine Aufnahme von "Stille Nacht" passt zum Ende. Urheberrecht prüfen, wenn du das Video öffentlich zeigst.

## Stil-Block (diesen Text vor JEDEN Prompt setzen)
```
Cinematic 3D animated short film style, Pixar-quality, warm and magical, soft volumetric light, shallow depth of field, rich color grading (deep midnight blue shadows, warm gold highlights, red and green accents), gentle falling snow, subsurface scattering, 4K, smooth motion, no text, no letters, no logos, no subtitles.
```

## Negativ-Prompt (falls das Tool eines hat)
```
text, letters, watermark, logo, subtitles, extra limbs, deformed, blurry, flicker, low quality, realistic human faces, scary, horror, violence
```

## Referenzbild: die Figur Moki (zuerst erzeugen)
```
Character design sheet of "Moki", a small cute mascot made of a glowing thick ring (torus), gradient from emerald green to golden yellow, with a white rounded play-button triangle floating in the middle of the ring as its single big expressive eye, no mouth, tiny sparkle particles around it, soft inner glow, wearing a tiny red Santa hat on top of the ring. Front view, side view, three-quarter view, on a neutral dark blue background. Pixar-style 3D render, clean, friendly, simple shapes.
```
Danach in jedem Clip: "Moki, the same glowing green-gold ring character with a white play-triangle eye and small red Santa hat (reference image)".

## Referenzbild: Baum
```
A tall, dreamy Christmas tree with three snowy tiers, warm string lights in red, gold, green and blue, a big glowing golden ring-shaped star on top (green-gold gradient ring with a white play-triangle in the middle), 24 round glass baubles hanging from it in red, green, blue and gold, each bauble with a plain gold question-mark symbol, in a cozy snow-globe village at night. Pixar-style 3D render.
```

---

## Shot-Liste mit Prompts (je ca. 5 Sekunden)

**1. Schneekugel-Dorf (Totale)**
Ruhig, Anfang. Kamera fährt langsam an einer Schneekugel auf einem Regal heran, im Inneren ein winziges Dorf mit dem großen Baum.
```
[Stil-Block] Slow cinematic push-in on a glass snow globe standing on a wooden shelf in a dark cozy living room, inside the globe a tiny snowy village at night with one huge glowing Christmas tree, a golden ring-shaped star on top glowing softly, snow swirling gently, warm window light, soft bokeh.
```

**2. Moki wacht auf**
```
[Stil-Block] Close-up of Moki (the glowing green-gold ring character with white play-triangle eye and small red Santa hat, reference image) waking up on the shelf next to the snow globe, stretching and blinking, the eye shape changes from a closed line to the open triangle, warm sparkles, soft rim light, shallow depth of field.
```

**3. Der Stern flackert**
```
[Stil-Block] Inside the snow globe, the golden ring-shaped star on top of the tree flickers, a cold gust of wind sweeps through the village, the lights dim one by one, the star goes dark, dramatic but gentle mood, blue moonlight.
```

**4. Die Kugeln fallen und rollen davon**
```
[Stil-Block] 24 glass baubles in red, green, blue and gold drop from the Christmas tree one after another, bounce in the snow and roll away in all directions toward glowing portals in the distance, each portal showing a different colorful world, magical sparkle trails behind the baubles, wide shot.
```

**5. Moki schaut entsetzt, dann entschlossen**
```
[Stil-Block] Close-up of Moki (reference image) looking at the dark tree, eye shrinks in shock, then determined with a bright glow, Moki's ring starts to spin faster, small snow puffs, hero lighting from below, slow-motion.
```

**6. Rennstrecke**
```
[Stil-Block] Moki (reference image) rolls like a wheel at high speed on a neon winter race track that curves through snowy hills, chasing a rolling red bauble, drifting around a corner, sparks and snow spray, dynamic low camera following alongside, motion blur.
```

**7. Wüste**
```
[Stil-Block] Moki (reference image) surfs down a huge golden sand dune at sunset with a small Santa hat flapping, a green bauble rolling just ahead, long shadows, sand trail glittering like snow, wide cinematic shot.
```

**8. Schleimland**
```
[Stil-Block] Moki (reference image) bounces across a colorful land of friendly jelly slimes in pastel green, pink and blue, hopping from slime to slime like a trampoline, a blue bauble sits on top of a tall slime tower, playful cheerful mood.
```

**9. Strichmännchen-Dojo**
```
[Stil-Block] Moki (reference image) dodges between simple stick-figure characters made of black lines doing funny martial arts moves in a snow-covered dojo, grabs a gold bauble mid-air, comedic timing, side view.
```

**10. Wolkenhimmel (höchster Punkt)**
```
[Stil-Block] Moki (reference image) jumps from cloud to cloud high above the world at dawn, holding multiple glowing baubles that orbit around its ring like tiny planets, huge golden sun on the horizon, epic wide shot, slight camera tilt up.
```

**11. Rückweg, alle Kugeln hinter ihm**
```
[Stil-Block] Moki (reference image) rolls back toward the dark tree in the snow globe village, 24 glowing baubles in red, green, blue and gold follow behind it in a long shimmering ribbon like a comet tail, snow whirling, camera tracking from the front, emotional heroic mood.
```

**12. Die Kugeln fliegen an den Baum**
```
[Stil-Block] The 24 baubles fly up one after another and hang themselves back on the Christmas tree, each landing with a small golden sparkle and a gentle pendulum swing, the tree lights turn on step by step from bottom to top, camera cranes up along the tree.
```

**13. Moki wird zum Stern**
```
[Stil-Block] Moki (reference image) jumps up to the top of the Christmas tree, its ring expands and glows brighter and settles as the golden ring-shaped star on the tree top, a soft shock wave of golden light spreads through the village, sparkles and snow lift into the air, euphoric moment, slow motion.
```

**14. Schlussbild**
```
[Stil-Block] Wide final shot pulling back from the glowing Christmas tree in the snow globe village, 24 round baubles gently swinging, snow falling softly, the golden ring star shining brightly, quiet and peaceful, camera slowly pulls back out of the snow globe on the shelf in the cozy living room, fade to dark.
```
Hier kommt in Blender der Titel: **"Moki Weihnachten"**, darunter "24 Türchen. 24 Spiele." und dann die Seite.

---

## Zeitplan mit Ton
| Zeit | Shot | Musik / Ton |
|---|---|---|
| 0:00 bis 0:10 | 1, 2 | Leise Spieluhr, Wind, Knistern |
| 0:10 bis 0:20 | 3, 4 | Musik stoppt, tiefer Ton, Glas klirrt |
| 0:20 bis 0:25 | 5 | Herzschlag, dann Anstieg |
| 0:25 bis 0:50 | 6 bis 10 | Schneller Jingle-Bells-Groove, jeder Ort hat einen eigenen Soundeffekt |
| 0:50 bis 1:00 | 11, 12 | Orchester steigert sich |
| 1:00 bis 1:15 | 13, 14 | "Stille Nacht" leise, Glöckchen bei jedem Kugel-Treffer |

## Tipps für Blender
- Titel, Zahlen und Moki-Logo als 3D-Text oder 2D-Overlay in Blender setzen (Compositor oder Video-Editor), nie von der KI.
- Alle KI-Clips mit gleichen Einstellungen (24 fps, 16:9) exportieren, im Blender-Videoschnitt (VSE) zusammensetzen und einen leichten Filmkorn-Filter über alles legen, damit die Clips einheitlich wirken.
- Wenn die Figur doch abweicht: Kamera näher ran und kürzer schneiden, oder die Figur in Blender selbst modellieren (ein Torus mit Emission-Material und ein Dreieck) und für die Nahaufnahmen verwenden. Das ist ein Ring, also sehr einfach.

## Wie es zur Webseite passt
- Das Video endet auf dem Baum mit den Fragezeichen-Kugeln, direkt danach erscheint die Seite mit dem Adventskalender.
- Einbauen kann ich es später als Datei oder als YouTube-Link, wenn du es fertig hast. Wichtig ist, dass es nicht zu groß wird (unter ca. 20 MB), sonst wird die Seite sehr schwer.
