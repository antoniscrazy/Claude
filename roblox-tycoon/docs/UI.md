# Design-Spezifikation

Alles hier Beschriebene steht als Token in `src/shared/Theme.luau`.
`tools/theme_lint.py` bricht den Build ab, wenn irgendwo sonst ein Farb-,
Schrift-, Radius-, Abstands- oder Bewegungsliteral auftaucht.

## 1. Palette

Drei Farbfamilien, mehr nicht: **Indigo** (Oberflaechen, primary, gem),
**Mint** (success) und **Warm** (premium, warning, danger).

**Oberflaechen**

| Token | Color3.fromRGB | Hex |
|---|---|---|
| `bg0` | `Color3.fromRGB(12, 13, 20)` | `#0C0D14` |
| `bg1` | `Color3.fromRGB(20, 22, 33)` | `#141621` |
| `bg2` | `Color3.fromRGB(29, 32, 47)` | `#1D202F` |
| `bg3` | `Color3.fromRGB(41, 45, 64)` | `#292D40` |

**Text**

| Token | Color3.fromRGB | Hex |
|---|---|---|
| `textHigh` | `Color3.fromRGB(243, 243, 249)` | `#F3F3F9` |
| `textMid` | `Color3.fromRGB(183, 188, 208)` | `#B7BCD0` |
| `textLow` | `Color3.fromRGB(146, 152, 176)` | `#9298B0` |

**Primary**

| Token | Color3.fromRGB | Hex |
|---|---|---|
| `primary` | `Color3.fromRGB(128, 144, 247)` | `#8090F7` |
| `primaryHover` | `Color3.fromRGB(157, 169, 249)` | `#9DA9F9` |
| `primaryPressed` | `Color3.fromRGB(92, 112, 245)` | `#5C70F5` |
| `primaryDeep` | `Color3.fromRGB(33, 54, 189)` | `#2136BD` |

**Success**

| Token | Color3.fromRGB | Hex |
|---|---|---|
| `success` | `Color3.fromRGB(48, 207, 149)` | `#30CF95` |
| `successHover` | `Color3.fromRGB(73, 212, 161)` | `#49D4A1` |
| `successPressed` | `Color3.fromRGB(41, 176, 126)` | `#29B07E` |
| `successDeep` | `Color3.fromRGB(26, 76, 58)` | `#1A4C3A` |

**Gem**

| Token | Color3.fromRGB | Hex |
|---|---|---|
| `gem` | `Color3.fromRGB(167, 192, 251)` | `#A7C0FB` |
| `gemHover` | `Color3.fromRGB(196, 213, 253)` | `#C4D5FD` |
| `gemPressed` | `Color3.fromRGB(130, 166, 250)` | `#82A6FA` |
| `gemDeep` | `Color3.fromRGB(42, 96, 223)` | `#2A60DF` |

**Premium**

| Token | Color3.fromRGB | Hex |
|---|---|---|
| `premium` | `Color3.fromRGB(235, 163, 20)` | `#EBA314` |
| `premiumHover` | `Color3.fromRGB(237, 174, 49)` | `#EDAE31` |
| `premiumPressed` | `Color3.fromRGB(199, 139, 17)` | `#C78B11` |
| `premiumDeep` | `Color3.fromRGB(85, 62, 17)` | `#553E11` |
| `premiumLight` | `Color3.fromRGB(250, 210, 120)` | `#FAD278` |

**Warning**

| Token | Color3.fromRGB | Hex |
|---|---|---|
| `warning` | `Color3.fromRGB(236, 135, 19)` | `#EC8713` |
| `warningHover` | `Color3.fromRGB(238, 149, 47)` | `#EE952F` |
| `warningPressed` | `Color3.fromRGB(200, 115, 16)` | `#C87310` |
| `warningDeep` | `Color3.fromRGB(86, 53, 16)` | `#563510` |

**Danger**

| Token | Color3.fromRGB | Hex |
|---|---|---|
| `danger` | `Color3.fromRGB(237, 86, 69)` | `#ED5645` |
| `dangerHover` | `Color3.fromRGB(239, 111, 97)` | `#EF6F61` |
| `dangerPressed` | `Color3.fromRGB(233, 54, 35)` | `#E93623` |
| `dangerDeep` | `Color3.fromRGB(127, 36, 26)` | `#7F241A` |

### Regeln

- **Gold ist reserviert.** `premium*` markiert ausschliesslich
  Monetarisierung (Gem-Pakete, Gamepasses, VIP). Nirgends dekorativ.
- **Label-Regel.** Jede gefuellte Akzentflaeche traegt `bg0` als
  Textfarbe - ueber alle Zustaende hinweg. Ein Labelwechsel beim
  Druecken flackert sichtbar; ausserdem faellt heller Text auf einer
  Flaeche, die als Text auf `bg2` noch 4.5:1 schafft, zwangslaeufig
  unter die Schwelle.
- **Zustandsvarianten** sind vorab definiert (`hover` +6,
  `pressed` -7.5 Prozentpunkte HSL-Helligkeit) und werden nie im Code
  improvisiert.
- **Textabstufungen ueber Farbe**, nicht ueber `Transparency`:
  transparenter Text verliert ueber bunten Flaechen unkontrolliert
  Kontrast.
- Maximal zwei Akzentfarben gleichzeitig pro Bildschirm: das HUD zeigt
  Mint (Cash) und Indigo (Gems), der Shop Indigo und Mint, der
  Rebirth-Bildschirm nur Warm.

### Oberflaechen-Abstufung

| Schritt | HSL-Helligkeit | Zuwachs |
|---|---|---|
| `bg0` | 6.3 % | - |
| `bg1` | 10.4 % | +4.1 pp |
| `bg2` | 14.9 % | +4.5 pp |
| `bg3` | 20.6 % | +5.7 pp |

Gemessen wird HSL-Lightness in Prozentpunkten, nicht relative Luminanz.
Ein Schritt von "+6-10 % relativer Luminanz" waere auf einem Grund mit
L = 6 % ein Bruchteil eines RGB-Wertes und damit unsichtbar.

## 2. Kontrastnachweis

Alle Paare gegen WCAG 2.1, Schwelle 4.5:1. Erzeugt von
`tools/contrast.py`; die Palette wird von dort nach `Theme.luau`
generiert, damit keine ungeprueft Farbe ins Spiel gelangt.

| Vordergrund | Hintergrund | Verhaeltnis | Status |
|---|---|---|---|
| `textHigh` | `bg0` | 17.54:1 | ok |
| `textHigh` | `bg1` | 16.29:1 | ok |
| `textHigh` | `bg2` | 14.62:1 | ok |
| `textHigh` | `bg3` | 12.31:1 | ok |
| `textMid` | `bg0` | 10.26:1 | ok |
| `textMid` | `bg1` | 9.53:1 | ok |
| `textMid` | `bg2` | 8.55:1 | ok |
| `textMid` | `bg3` | 7.20:1 | ok |
| `textLow` | `bg0` | 6.78:1 | ok |
| `textLow` | `bg1` | 6.29:1 | ok |
| `textLow` | `bg2` | 5.65:1 | ok |
| `textLow` | `bg3` | 4.76:1 | ok |
| `primary` | `bg1` | 6.22:1 | ok |
| `primary` | `bg2` | 5.58:1 | ok |
| `success` | `bg1` | 8.99:1 | ok |
| `success` | `bg2` | 8.07:1 | ok |
| `gem` | `bg1` | 9.92:1 | ok |
| `gem` | `bg2` | 8.91:1 | ok |
| `premium` | `bg1` | 8.39:1 | ok |
| `premium` | `bg2` | 7.52:1 | ok |
| `warning` | `bg2` | 6.19:1 | ok |
| `danger` | `bg1` | 5.16:1 | ok |
| `danger` | `bg2` | 4.63:1 | ok |
| `bg0` | `primary` | 6.69:1 | ok |
| `bg0` | `success` | 9.68:1 | ok |
| `bg0` | `premium` | 9.03:1 | ok |
| `bg0` | `warning` | 7.42:1 | ok |
| `bg0` | `danger` | 5.56:1 | ok |
| `bg0` | `gem` | 10.69:1 | ok |
| `premiumLight` | `bg1` | 12.48:1 | ok |
| `premiumLight` | `bg2` | 11.20:1 | ok |
| `bg0` | `primaryHover` | 8.75:1 | ok |
| `bg0` | `primaryPressed` | 4.70:1 | ok |
| `bg0` | `successHover` | 10.35:1 | ok |
| `bg0` | `successPressed` | 7.02:1 | ok |
| `bg0` | `premiumHover` | 9.88:1 | ok |
| `bg0` | `premiumPressed` | 6.58:1 | ok |
| `bg0` | `warningHover` | 8.29:1 | ok |
| `bg0` | `warningPressed` | 5.46:1 | ok |
| `bg0` | `dangerHover` | 6.57:1 | ok |
| `bg0` | `dangerPressed` | 4.63:1 | ok |
| `bg0` | `gemHover` | 13.18:1 | ok |
| `bg0` | `gemPressed` | 8.11:1 | ok |
| `primaryHover` | `bg2` | 7.29:1 | ok |
| `dangerHover` | `bg2` | 5.47:1 | ok |

## 3. Skalen

**Abstand** - nur diese acht Werte: 2, 4, 8, 12, 16, 24, 32, 48.
Immer ueber `UIPadding` oder `UIListLayout.Padding`, nie als
Positionsoffset "nach Gefuehl".

**Radius** - `chip 4` < `control 8` < `card 12` < `panel 16` < `pill 999`.
Card und Control sind bewusst getrennt: waeren beide 8, haette ein Button
in einer Card denselben Radius wie die Card, und die Verschachtelungs-
regel (innen immer kleiner) waere verletzt.

**Schrift** - Rollen statt Namen: `display` GothamBlack, `heading`
GothamBold, `body` GothamMedium, `numeric` GothamBold.
Groessen 12, 14, 16, 20, 24, 32, 44. Zeilenhoehe 1.15 / 1.25 / 1.3.
Zahlen stehen rechtsbuendig in Feldern fester Breite - Gotham hat keine
Tabellenziffern, linksbuendig zappelt jede hochzaehlende Zahl.

**Bewegung** - `fast 0.12`, `base 0.18`, `slow 0.32`, `press 0.06`.
Easing: Quart/Out fuer Eingaenge, Quart/In fuer Ausgaenge, Back/Out fuer
Erfolgs-Pops. Kein Linear, kein Sine, nichts ueber 0.4 s.

**Ebenen** - World 0-99, HUD 100-199, Panels 200-299, Modals 300-399,
Toasts 400-499, Tooltips 500+. Innerhalb eines Bandes vergibt
`Theme.Depth` die Feinstufen.

**Skalierung** - Referenz 1920x1080 = 1.0, Deckel 1.25,
**Untergrenze 0.92 statt der vorgegebenen 0.72**. Hergeleitet: die
kleinste Schriftstufe ist 12 px, die Lesbarkeitsschwelle auf dem Handy
liegt bei etwa 11 px, also 11/12 = 0.917. Bei 0.72 waere dieselbe Stufe
8.6 px gross - regelkonform, aber unlesbar, und die Abnahmebedingung
"lesbar auf 375x667" waere verletzt. Nebeneffekt: die noetige
Entwurfsgroesse einer Tippflaeche sinkt von 44/0.72 = 62 px auf
44/0.92 = 48 px.

## 4. Elevation

Jede Flaeche entsteht in `Theme.Card` aus vier Schichten, an genau einer
Stelle im Projekt:

1. **Schatten** - 9-Slice-`ImageLabel`, `ZIndex` eine Stufe darunter,
   `ImageColor3 = bg0`, 4 px nach unten versetzt.
2. **Flaeche** mit `UICorner`.
3. **`UIStroke`** in der naechsthelleren Oberflaechenstufe.
4. **`UIGradient`** vertikal, oben heller, unten dunkler.

Die Schatten-Asset-Id ist ein Platzhalter (`Theme.Asset.SHADOW_9SLICE`).
So legst du eines an: 128x128 PNG, transparenter Rand, weicher schwarzer
Kern (Gauss ca. 24 px), hochladen, Id eintragen. `SLICE_CENTER` bleibt
`Rect.new(32, 32, 96, 96)` - das haelt die weichen 32 px an jeder Kante
fest und streckt nur die Mitte.

Solange die Id leer ist, zeichnet `Theme.shadow` eine assetfreie
Ersatzvariante: eine zweite, dunklere Flaeche mit groesserem Radius, nach
unten versetzt. Harte Kante statt Weichzeichnung, liest sich aber als
Tiefe - und es wird keine Asset-Id erfunden.

## 5. Komponenten

| Komponente | Datei | Zustaende / Varianten |
|---|---|---|
| Button | `UI/Components/Button.luau` | primary, secondary, ghost, danger, premium, success x idle, hover, pressed, disabled, loading |
| IconButton | `UI/Components/IconButton.luau` | idle, hover, pressed, aktiv, mit Badge und Tooltip |
| Card | `UI/Components/Card.luau` | Huelle um `Theme.Card` |
| Panel | `UI/Components/Panel.luau` | Header, Close, optional Scroll-Body |
| CurrencyPill | `UI/Components/CurrencyPill.luau` | Icon-Feld, Count-Up, Fehler-Blinken |
| ProgressBar | `UI/Components/ProgressBar.luau` | animierte Fuellung, Glanzstreifen |
| Tooltip | `UI/Components/Tooltip.luau` | Singleton, nur Desktop |
| Toast | `UI/Components/Toast.luau` | success, error, info; max. 3 |
| Modal | `UI/Components/Modal.luau` | Backdrop, zaehlergesteuert |
| Tabs | `UI/Components/Tabs.luau` | aktiv mit Markierungsbalken |
| Badge | `UI/Components/Badge.luau` | Punkt oder Zahl |
| ItemSlot | `UI/Components/ItemSlot.luau` | buyable, tooExpensive, locked, owned |
| SegmentedControl | `UI/Components/SegmentedControl.luau` | wandernder Auswahlbalken |
| EmptyState | `UI/Components/EmptyState.luau` | Symbol, Titel, Erklaerung |

Jede Komponente liefert `instance` und `destroy` (`UI/Types.luau`).

**Icons** werden aus Frames gezeichnet - Kreis, Ring, Raute, Balken -,
solange in `Theme.Icon` keine Asset-Id steht. Keine Emojis, keine
erfundenen Ids, und kein leeres Bild im Auslieferungszustand. Traegst du
eine Id ein, nimmt dasselbe Modul ein `ImageLabel`, ohne Codeaenderung.

## 6. Wireframes

### HUD (Querformat)

```
+----------------------------------------------------------------+
|  +------------------+                                 +----+   |
|  | (o) GUTHABEN     |                                 |Shop|   |
|  |     1.25M        |                                 +----+   |
|  +------------------+                                 |Gems|   |
|  | <> GEMS          |                                 +----+   |
|  |     340          |                                 | RB |   |
|  +------------------+                                 +----+   |
|  | (r) REBIRTH      |                                 |Aufg|   |
|  |     3            |                                 +----+   |
|  +------------------+                                 |Code|   |
|  | 13.7K $/s        |                                 +----+   |
|  +------------------+                                 |Opt |   |
|                                                       +----+   |
|                +--------------------------------+              |
|                | (^) Kaufe deinen ersten Bohrer |              |
|                +--------------------------------+              |
+----------------------------------------------------------------+
   24 px Rand rundum, Nav mittig vertikal verankert,
   Hinweis 24 px (Desktop) bzw. 72 px (Handy) ueber dem unteren Rand
```

### Shop / Upgrades

```
+--------------------------------------------------------------+
| FABRIK-UPGRADES                                         [ X ] |
| 7 von 25 gekauft                                              |
+---------------+----------------------------------------------+
| | Alle        |  +----------+ +----------+ +----------+       |
|   Bohrer      |  | [3D-Vor- | | [3D-Vor- | | [3D-Vor- |       |
|   Oefen       |  |  schau ] | |  schau ] | |  schau ] |       |
|   Tempo       |  | Bohrer 2 | | Ofen I   | | Band I   |       |
|   Gebaeude    |  | Wert 10  | | x1.49    | | 26 st/s  |       |
|               |  | 200 $    | | 481 $    | | GEKAUFT  |       |
|               |  | [KAUFEN] | | [ZU TEU] | | (v)      |       |
|               |  +----------+ +----------+ +----------+       |
+---------------+----------------------------------------------+
   Tab-Spalte 152 px, Raster aus ItemSlots 232x268,
   eigener Scrollbalken 6 px in primary
```

### Rebirth

```
+--------------------------------------------------------------+
| REBIRTH                                                 [ X ] |
| Alles zurueck - dafuer dauerhaft mehr                         |
+--------------------------------------------------------------+
|                    (r)   3                                    |
|                                                               |
|      +-----------+    ->    +-----------+                     |
|      |  JETZT    |          |  DANACH   |                     |
|      |  x3.25    |          |  x4.00    |                     |
|      +-----------+          +-----------+                     |
|                                                               |
|  842K / 1.0M $                                                |
|  [##################------------]                             |
|                                                               |
|  +--------------------------------------------------------+   |
|  | Guthaben und alle 25 Upgrades werden geloescht.        |   |
|  | Gems, Aufgaben und Rebirth-Zahl bleiben.               |   |
|  +--------------------------------------------------------+   |
|                                                               |
|  [            REBIRTH STARTEN                             ]   |
|   -> erster Druck: "WIRKLICH? NOCHMAL DRUECKEN" (4 s Fenster) |
+--------------------------------------------------------------+
```

### Codes

```
+--------------------------------------------------------------+
| CODES                                                   [ X ] |
+--------------------------------------------------------------+
|  +--------------------------------------------------------+   |
|  | Code eintippen                                         |   |  <- Fokus-Ring
|  +--------------------------------------------------------+   |     wechselt auf primary
|  Eingeloest: 5.00K $ und 10 Gems                              |  <- inline, gruen/rot
|  [                 EINLOESEN                              ]   |
|  ------------------------------------------------------------ |
|  TAGESBELOHNUNG                                               |
|  Serie: Tag 3 von 7. Naechste Belohnung 7.50K $.              |
|  [                  ABHOLEN                               ]   |
+--------------------------------------------------------------+
```

### Optionen

```
+--------------------------------------------------------------+
| OPTIONEN                                                [ X ] |
+--------------------------------------------------------------+
|  TON                                                          |
|  +--------------------------------------------------------+   |
|  | Soundeffekte                          [ An  | Aus ]    |   |
|  | Klick, Kauf und Sammeln                                |   |
|  +--------------------------------------------------------+   |
|  | Hintergrundmusik                      [ An  | Aus ]    |   |
|  +--------------------------------------------------------+   |
|  ------------------------------------------------------------ |
|  DARSTELLUNG                                                  |
|  | Reduzierte Bewegung                   [ An  | Aus ]    |   |
+--------------------------------------------------------------+
```

### Bestenlisten-Tafel (SurfaceGui in der Lobby)

```
+----------------------------------+
| TOP 50                           |
| Gesamtverdienst                  |
|  (1) [av] Spielername    1.2B $  |  <- Gold
|  (2) [av] Spielername   880.4M $ |  <- Silber, Zeile getoent
|  (3) [av] Spielername   640.1M $ |  <- Bronze
|  (4) [av] Spielername   410.0M $ |
|  ...                             |
+----------------------------------+
```

## 7. In-World-Kaufknopf

```
        +----------------------------+
        | [I] Bohrer 2               |   <- BillboardGui, MaxDistance 60
        |     200 $                  |
        | [#####-----------------]   |   <- fuellt sich beim Draufstehen
        +----------------------------+
                    |
            ________|________
           /  Trittplatte    \          <- SmoothPlastic bg3
          | ( Leuchtring    ) |         <- flacher Neon-Zylinder, primary
          +-------------------+         <- Fase: 4 WedgeParts, 90-Grad-Raster
          |      Sockel       |         <- Metal bg2, Reflectance 0.12
          +-------------------+
```

Zustaende: **erschwinglich** (Ring in primary, Neon), **zu teuer**
(Ring grau, Sockel und Platte 55 % transparent), **Voraussetzung fehlt**
(wie zu teuer, Panel zeigt den Grund), **gekauft** (versinkt 4 Studs im
Boden und verschwindet).
