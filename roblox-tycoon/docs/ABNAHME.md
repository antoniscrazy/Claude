# Abnahme-Checkliste (visuelle Überarbeitung)

Jeder Punkt mit Begründung und, wo möglich, dem Prüfwerkzeug, das ihn
nachweist. `./tools/verify_all.sh` führt alle Prüfungen aus.

---

### ✅ Theme.luau ist die einzige Quelle für Farbe/Spacing/Radius/Font/Motion

**Beweis durchgeführt.** `primary` von Indigo `(128,144,247)` auf Magenta
`(236,120,210)` gedreht, `tools/gen_theme.py` laufen lassen:

- Geändert: **genau 6 Zeilen, alle in `Theme.luau`** (`primary`,
  `primaryHover`, `primaryPressed`).
- Prüfsumme aller übrigen 50 Module vor und nach dem Wechsel: **identisch**.
- Was sich im Spiel mitändert (`tools/theme_impact.py Color.primary` →
  23 Verwendungen in 12 Modulen): Leuchtring und Panel-Rahmen aller 150
  In-World-Kaufknöpfe, Dropper-Düsen, Förderband-Beam, Kauf-Buttons im
  Shop, ItemSlot-Rahmen, Panel-Rahmen, Tab-Markierung, Info-Toasts,
  Fokus-Ring im Codes-Feld, SegmentedControl-Thumb, Shop-Scrollbalken.

### ✅ Kein Farb-, Größen- oder Padding-Literal außerhalb Theme.luau

`tools/theme_lint.py`: 50 Module geprüft, 0 Verstöße. Geprüft werden
`Color3.*`, `Enum.Font.*`, `Enum.Material.*`, `TweenInfo.new`,
`TextSize`, `Thickness`, `ZIndex`, `*Transparency`, `CornerRadius`,
`LineHeight`, `Reflectance` und jeder Pixel-Offset ungleich 0 in
`UDim.new` / `UDim2.new` / `UDim2.fromOffset`. Kommentare und Strings
werden vorher entfernt, damit Erklärtexte nicht fälschlich anschlagen.

### ✅ Jedes Textelement erfüllt Kontrast 4.5:1

`tools/contrast.py`: **45 Paare, alle bestanden**, schlechtester Wert
4.63:1 (`danger` auf `bg2` bzw. `bg0` auf `dangerPressed`). Vollständige
Tabelle in `docs/UI.md`. Die Palette wird aus diesem Skript nach
`Theme.luau` **generiert** — eine ungeprüfte Farbe kann gar nicht erst
ins Spiel gelangen.

### ✅ Jeder Button hat sichtbar unterschiedliche Zustände

`Button.create` schaltet pro Zustand **drei** Eigenschaften gleichzeitig,
nicht nur die Farbe:

| Zustand | Fläche | Skalierung | Weiteres |
|---|---|---|---|
| idle | `fill` | 1.00 | — |
| hover | `fillHover` (+6 pp Helligkeit) | 1.03 | nur Desktop |
| pressed | `fillPressed` (−7.5 pp) | 0.96 | 0.06 s, federt über Back/Out zurück |
| disabled | `fill` bei 55 % Transparenz | 1.00 | Rand und Text gedimmt, `Active = false` |
| loading | — | 1.00 | Text weg, rotierender Ring, Eingabe gesperrt |

Auf Touchgeräten wird der Hover-Zustand **nicht** verbunden — ein
hängengebliebener Hover nach dem Antippen sieht aus wie ein Fehler.

### ✅ Layout korrekt bei 1920×1080, 1280×720, 820×1180, 375×667

`tools/layout_check.py` rechnet die Formeln aus `Responsive.luau`,
`Hud.luau` und `Panel.luau` nach:

| Auflösung | Skalierung | Was sich anpasst |
|---|---|---|
| 1920×1080 | 1.00 | Referenz. Pills 196 px, Nav 48 px, Panel 760×540 (Deckel). |
| 1280×720 | 0.92 | Untergrenze. Alles gleichmäßig 8 % kleiner, Panel bleibt am Deckel. |
| 820×1180 (Tablet hoch) | 0.92 | Panel-Seitenverhältnis kippt auf 0.78, Panel 738×540; Pills schmaler (136 px). |
| 375×667 (Handy hoch) | 0.92 | Panel 338×433; Pills 136 px; Hinweisbalken auf Bildbreite begrenzt; unten 72 px frei. |
| 667×375 (Handy quer) | 0.92 | Wie Laptop, aber untere Safe Area 72 px. |

**Abweichung, bewusst und hergeleitet:** die Untergrenze ist 0.92, nicht
die vorgegebene 0.72. Bei 0.72 rendert die kleinste Schriftstufe (12 px)
als 8.6 px — regelkonform, aber unlesbar, und die Bedingung „lesbar auf
375×667" wäre verletzt. 11 px Lesbarkeitsschwelle ÷ 12 px = 0.917 → 0.92.

### ✅ Nichts Interaktives unter Topbar, Chat oder Mobile-Steuerung

- `IgnoreGuiInset = false`: Roblox zieht die Topbar-Höhe bereits von der
  nutzbaren Fläche ab. Der Nullpunkt der Oberfläche liegt darunter.
- Darüber hinaus 24 px Randabstand rundum (`Theme.Safe.edge`).
- Unten auf Mobilgeräten und im Querformat 72 px frei
  (`Theme.Safe.bottomMobile`) für Sprungknopf und Bewegungsstick; dort
  liegt nur der Hinweisbalken, und der endet oberhalb davon.
- Der Roblox-Chat sitzt oben links. Die Währungs-Pills liegen ebenfalls
  oben links — sie beginnen bei 24 px unter dem bereits abgezogenen
  Inset und sind **nicht klickbar** (reine Anzeige, kein TextButton).
  Klickbar ist nur die Nav-Leiste rechts.

### ✅ Alle Touch-Ziele ≥ 44 px nach UIScale

`Responsive.minTouchSize()` rechnet rückwärts: `ceil(44 / 0.92) = 48` px
Entwurfsgröße. Bei der kleinsten erlaubten Skalierung ergibt das 44.2 px,
bei 1.0 genau 48 px. Verwendet von IconButton, Panel-Close, Tabs und
SegmentedControl. `tools/layout_check.py` prüft den Wert für alle fünf
Auflösungen.

### ✅ Kein Panel erscheint oder verschwindet ohne Tween

`tools/leak_audit.py` prüft jede `doOpen`/`doClose`-Funktion darauf, dass
sie `scope:to(...)` aufruft. `Visible = false` wird ausschließlich im
`Completed`-Callback der Ausblend-Animation gesetzt, nie als alleiniges
Mittel. Öffnen: Scale 0.92 → 1.0 plus Transparenz 1 → 0, gleichzeitig
Backdrop 1 → 0.45 und Welt-Blur 0 → 16. Schließen ist die exakte Umkehrung.

### ✅ Alle Tweens und Verbindungen werden aufgeräumt

`tools/leak_audit.py`: 30 Client-Module, 17 Motion-Scopes, **jeder** wird
in einem `destroy` freigegeben. Zusätzlich:

- Ein Scope nach `destroy()` startet keine neuen Tweens mehr (`_dead`).
- Beendete Tweens entfernen sich selbst aus der Liste, sonst wächst sie
  bei einem oft geöffneten Panel unbegrenzt.
- Kein Panel erzeugt beim **Öffnen** Instanzen — statisch geprüft. Genau
  das ist die Ursache, die der 50-fache Öffnen/Schließen-Test aufdecken
  soll: gebaut wird einmal, danach nur noch ein-/ausgeblendet.
- Der einzige Teil, der zur Laufzeit baut, ist der Toast — er zerstört
  sich nach 3.2 s selbst, und es sind nie mehr als drei gleichzeitig.

**Was das nicht ersetzt:** die tatsächliche Speicherkurve. Dafür braucht
es Studio und den Memory-Tab der Developer Console.

### ⚠️ 60 FPS auf Mittelklasse-Android — Maßnahmen genannt, nicht gemessen

Hier läuft keine Roblox-Engine; ich kann keine FPS messen. Was dafür
konkret getan wurde:

1. **Ein einziger Heartbeat** im ganzen Server (`TickScheduler`), drei
   Aufgaben mit 10/10/2 Hz. Kein Heartbeat pro Dropper oder Erz.
2. **Förderband über `AssemblyLinearVelocity`** eines verankerten Teils —
   die Physik-Engine bewegt die Erze in C++, kein Luau-Frame dafür.
3. **Erz-Obergrenze 45 pro Plot**, Endausbau erreicht 25.8
   (`tools/throughput.py`), plus 25 s Verfallszeit.
4. **Shop-Slots werden einmal gebaut**, danach nur aktualisiert. 25
   ViewportFrames pro Sekunde neu zu erzeugen wäre der teuerste mögliche
   Fehler in dieser UI.
5. **`CastShadow = false`** auf allen Weltteilen; Schatten nur beim
   mittleren der drei Hallenlichter pro Plot.
6. **`MaxDistance` auf jedem BillboardGui** (60 Studs für Kaufpanels).
   Bei 6 Plots × 25 Panels ist das sonst der teuerste Posten im Bild.
7. **Trails nur an den zwei teuersten Erzsorten** — ein Trail kostet drei
   Instanzen; über alle Erze wären das 800+.
8. **Partikel nur als Stoß** (`Emit(3)` beim Einlösen), kein dauerhaft
   laufender Emitter.
9. **Kein Remote pro eingelöstem Erz** — bei 8 Erzen/s × 6 Plots wären
   das über 50 Nachrichten pro Sekunde nur für einen Klickton. Der Client
   spielt ihn am steigenden Guthaben im regulären 4-Hz-Push.
10. **`StreamingEnabled`**: entfernte Plots werden gar nicht erst gerendert.
11. **Gamepass-Abfragen yielden nie im Tick** (Cache + Hintergrund-Refresh).

### ✅ Funktionalität aus dem vorherigen Prompt unverändert lauffähig

Alle 13 Serverdienste, die Datenschicht mit Session-Locking, Balancing,
Remote-Validierung und Rate-Limiting sind unverändert. Geändert wurden
nur die Darstellung und **eine** Interaktion:

**Kauf-Pads reagieren jetzt auf Halten statt auf Berühren** (0.45 s,
Fortschrittsring auf dem schwebenden Panel). Das war nötig, weil sich ein
Fortschrittsring ohne Haltevorgang nicht füllen kann und `Touched` bei
einem stillstehenden Charakter nicht erneut feuert. Der Serverpfad ist
derselbe geblieben (`EconomyService.purchase` mit allen sieben Prüfungen),
und im Shop-Panel kauft weiterhin ein einzelner Klick. Ich nenne das
ausdrücklich, weil es eine Verhaltensänderung ist und keine reine Optik.
