# WebOffice – Textverarbeitung, Tabellenkalkulation, Präsentation im Browser

Drei eigenständige HTML-Dateien (Doppelklick genügt, offline über `file://`, keine CDN-Skripte, keine Webfonts):

| Datei | Anwendung | Projektformat |
|---|---|---|
| `powerpoint.html` | Präsentationseditor (Schwerpunkt) | `.webppt.json` (`WebOffice-Praesentation`, Version 1) |
| `excel.html` | Tabellenkalkulation | `.webxls.json` (`WebOffice-Tabelle`, Version 1) |
| `word.html` | Seitenorientierte Textverarbeitung | `.webdoc.json` (`WebOffice-Dokument`, Version 1) |

Die lesbaren Quellteile liegen in `src/` (je App: Datenmodell, Rendering, Bedienung, Befehle, Ein-/Ausgabe). `node build.js` setzt daraus die drei Dateien zusammen. Alle Bibliotheken (ZIP lesen/schreiben, Formelparser, HTML-Sanitizer, Animations-Engine) sind eigener Code ohne Fremdlizenzen; es gibt weder `eval` noch `new Function`.

## Recherche (tatsächlich durchgeführt) und Arbeitsmatrix

Es stand ein Web-Suchwerkzeug zur Verfügung (4 Suchanfragen). Es wurden **keine Screenshots/Videos angesehen** und Word/Excel-Desktopseiten wurden nicht einzeln ausgewertet; deren Bedienmuster stammen aus Fachwissen über die Desktop-Programme. Quellen:

* Start/Verzögerung von Animationen: <https://support.microsoft.com/en-us/powerpoint/set-the-start-time-and-speed-of-an-animation-effect>
* Morph und Objektkopplung über `!!`-Namen: <https://support.microsoft.com/en-us/powerpoint/morph-transition-tips-and-tricks>
* PresentationML-Zeitknoten (`clickEffect`, `withEffect`, `afterEffect`): <https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.timenodevalues> und <https://learn.microsoft.com/en-us/office/open-xml/presentation/working-with-animation>
* Übergänge (`p:transition`): <https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.transition>
* `DecompressionStream("deflate-raw")` (XLSX lesen): <https://caniuse.com/mdn-api_decompressionstream_decompressionstream_deflate-raw>

| Bedienmuster | Quelle | Umsetzung | Bekannte Grenze |
|---|---|---|---|
| Mit vorheriger = gleicher Start wie der Vorgänger, Nach vorheriger = nach dessen Ende; Verzögerung wird addiert | MS Support (Startzeit) | `buildSchedule()`: Klick → Basis 0; Mit vorheriger → Basis des Vorgängers (Beginn seiner Verzögerungsphase); Nach vorheriger → Ende des Vorgängers; Beginn = Basis + Verzögerung | Erster Effekt ohne Klick startet automatisch mit dem Folienbeginn |
| Morph koppelt Objekte gleichen Namens `!!Name` | MS Support (Morph) | Kopplung über gespeicherte `mid` (wird beim Duplizieren übernommen) oder `!!`-Name | Interpoliert Position, Größe, Drehung; Text/Farbe überblenden nicht |
| Effekte als `p:timing`-Baum | OOXML-Referenz | PPTX-Export schreibt Eingang/Ausgang/Hervorhebung/Pfad | Nicht in PowerPoint geöffnet (nur python-pptx/LibreOffice) |
| Formelbar, Namensfeld, Ausfüllgriff | Desktop-Excel | Eigene Umsetzung | siehe unten |
| Navigationsbereich aus Überschriften, Formatvorlagen, Seitenaufteilung | Desktop-Word | Eigene Umsetzung | Blöcke werden als Ganzes verschoben |

## PowerPoint (`powerpoint.html`)

* Menüband (Datei, Start, Einfügen, Entwurf, Übergänge, Animationen, Bildschirmpräsentation, Ansicht + kontextabhängiger Format-Reiter), Folienminiaturen (Umsortieren per Maus mit Einfügemarkierung), Notizen, rechte Leiste mit **Format / Auswahl / Animationen**.
* Objekte: Textfelder (Rich-Text), 8 Formen, Linien/Pfeile, Bilder (Zuschnitt), Tabellen, Diagramme (Säule/Linie/Kreis), Gruppen. Ziehen/Skalieren/Drehen mit Pointer Events, Hilfslinien, Ausrichten/Verteilen, Anordnen, Sperren/Ausblenden/Umbenennen.
* Alle Koordinaten liegen im Folienkoordinatensystem (1280×720 bzw. 960×720); Zoom und Fenstergröße ändern sie nicht. Stabile IDs für Folien, Objekte und Effekte.
* Animationen: Eingang (Erscheinen, Verblassen, Einfliegen, Vergrößern), Hervorhebung (Pulsieren, Drehen, Größe ändern), Ausgang (Verschwinden, Verblassen, Herausfliegen), Pfade (gerade, Bogen, S-Kurve; Endpunkt/Kontrollpunkt per Ziehen). Start/Dauer/Verzögerung/Richtung, Hinzufügen vs. Ersetzen, Umordnen, Duplizieren, Löschen, Vorschau (Effekt/Folie); Klickgruppen-Nummern nur im Editor.
* Übergänge: Kein, Überblenden, Schieben, Wischen, Teilen, Abdunkeln, Zoom, **Morph**; Dauer, Richtung, Vorschau (wiederholbar), auf alle anwenden, bei Klick, nach Zeit.
* Präsentation: Vollbild mit Fenstermodus-Fallback, Referentenansicht (Taste P: aktuelle/nächste Folie, Notizen, Timer), Foliensprung (Zahl + Enter). **Rücksprung-Regel:** Zurück nimmt zuerst die letzte Klickgruppe zurück; ohne gespielte Gruppe zeigt es die vorherige Folie im **Endzustand** (ohne Übergang). Sprung per Zahl/Home/End zeigt die Zielfolie im **Anfangszustand**.
* Master/Vorlagen: 3 Vorlagen (Aurora, Ozean, Sandstein), Folienmaster-Dialog (Hintergrund, Schriften, Akzentfarben) mit Vererbung; „Auf Master zurücksetzen“.
* Ausgabe: natives Projekt (vollständiger Rundlauf), **eigenständige HTML-Präsentation** (gleiche Engine, offline), PNG der Folie, Druckansicht (eine Folie je Seite), **.pptx-Export** (editierbare Textfelder/Formen/Linien/Bilder/Tabellen/Gruppen, Notizen, Hintergründe, Übergänge, Animationen; Diagramme als Bild; Morph wird als Überblenden geschrieben). .pptx-Import: nicht implementiert.

## Excel (`excel.html`)

* Virtualisiertes Raster (5000 Zeilen × 104 Spalten), Namensfeld, Formelleiste, Bereichsauswahl, Tastatur, Touch-Tippen (Auswahl erweitern per Schalter), Spaltenbreite/Zeilenhöhe, mehrere Blätter (anlegen, umbenennen mit Formelanpassung, duplizieren, verschieben, löschen).
* Formeln: eigener Parser (`+ - * / ^ & = <> < > <= >= %`), Bezüge `A1 $A$1 $A1 A$1`, Bereiche, Blattbezüge; Funktionen deutsch/englisch: SUMME, MITTELWERT, MIN, MAX, ANZAHL, ANZAHL2, RUNDEN, WENN, UND, ODER, NICHT, WENNFEHLER, SUMMEWENN, ZÄHLENWENN, SVERWEIS (exakt/Näherung), XVERWEIS (exakt), INDEX, VERGLEICH, Text- und Datumsfunktionen u. a. Zirkelbezüge → `#ZIRKEL!` mit Pfad. Formel, berechneter Wert und Format sind getrennt gespeichert.
* Ausfüllgriff (Kopieren, Zahlenreihen, „Q1→Q4“, Monate/Wochentage, Formeln mit relativer Verschiebung), Sortieren (Zeilen bleiben zusammen), Autofilter, Diagramme (Säule/Linie/Kreis, aktualisieren sich), Schnellwerte in der Statusleiste.
* CSV-Import/-Export mit Trennzeichenwahl (RFC-4180-Quoting, Zeilenumbrüche in Feldern), XLSX-Export/-Import (Werte, Formeln, Zahlenformate Zahl/Prozent/Währung/Datum, Schrift, Füllung, Rahmen, Ausrichtung, Umbruch, Spaltenbreiten, Zeilenhöhen, mehrere Blätter, Filterbereich). **Nicht** in XLSX: Diagramme, Bilder, bedingte Formatierung, verbundene Zellen.

## Word (`word.html`)

* Seiten mit sichtbaren Rändern (A4/Letter, Hoch/Quer, einstellbare Ränder), Zoom, Navigationsbereich aus echten Überschriften, Formatvorlagen, Zeichen-/Absatzformate, Listen, Tabellen (Zeilen/Spalten/Kopfzeile), Bilder (Skalieren per Griff), Seitenumbruch, Kopf-/Fußzeile, Seitenzahl, Suchen/Ersetzen (Treffer x von n, Einzel-/Gesamtersetzung), Wort-/Zeichenzahl.
* **Seitenfluss:** Absätze/Überschriften/Bilder rücken als Ganzes auf die nächste Seite, Tabellenzeilen und Listenpunkte werden einzeln verteilt. Ein einzelner Block, der höher als eine Seite ist, wird nicht abgeschnitten (sein Blatt wächst). Druckansicht und Editor verwenden dieselbe Paginierung, daher stimmen Seitenzahlen überein.
* Ausgabe: Projekt (Rundlauf), `.docx` (Absätze, Formatvorlagen, Zeichenformate, Listen, Tabellen, Bilder, Seitenumbrüche, Seitenformat, Kopf-/Fußzeile mit Seitenzahlfeld), HTML, TXT, Druckansicht/PDF-Druck. .docx-Import: nicht implementiert. Suchen findet nur Treffer innerhalb eines Textstücks (nicht über Formatwechsel).

## Tests (Chromium/Playwright, `file://`, Browser offline) und Grenzen

Ausgeführt wurden automatisierte Browsertests: PowerPoint 80+ Prüfungen (Ziehen/Skalieren/Drehen bei 75 % und 150 % mit Scrollen, Gruppieren/Duplizieren/Undo, Folie duplizieren inkl. Effekte, Umsortieren, Zeitplan A/B/C/D in Vorschau und Präsentation mit Messung, Rückwärtsnavigation, Morph mit gleichzeitiger Positions-/Größenänderung, Projekt-Rundlauf, ungültige Dateien, HTML-Export offline, PPTX-Struktur); Excel (Formeln, Fill, Blattumbenennung, Zirkelbezug, XLSX-/CSV-/Projekt-Rundlauf, 5000×10 Performance); Word (langes Dokument, Druckansicht, Bearbeiten, Tabellen, Bilder, Suchen/Ersetzen, DOCX).

Externe Gegenprüfung: `.pptx` mit python-pptx geladen und mit LibreOffice zu PDF gerendert, `.xlsx` mit openpyxl gelesen und mit LibreOffice neu berechnet (Werte identisch) sowie eine von LibreOffice geschriebene XLSX importiert, `.docx` mit python-docx gelesen und mit LibreOffice zu PDF (gleiche Seitenzahl wie im Editor). **Nicht getestet:** Microsoft PowerPoint/Excel/Word selbst, Safari/Firefox, echte Touch-Geräte, Drucken auf Papier. Die Übergangsrichtungen und Animationsknoten im PPTX folgen der Spezifikation, wurden aber nicht in PowerPoint verifiziert.

## Neu: Office-Look, App-Icons und Funktionserweiterung

- **Icons** (`icons/word|excel|powerpoint.svg` und `.png`, ohne Hintergrund) werden beim Bauen als Favicon und Titelleisten-Logo eingebettet (`@@appicon:name@@` in `build.js`).
- **Gemeinsames Erscheinungsbild** (`src/shared/chrome.css`/`chrome.js`): Akzent-Titelleiste mit Schnellzugriff und **Befehlssuche** (Alt+Q findet Befehle aller Reiter und hebt sie hervor), Reiterband, grauer Menüband-Streifen, Statusleiste mit Zoomregler.
- **Excel** (`src/xls/zz-more.js`): rund 90 weitere Funktionen (u. a. SUMMEWENNS, ZÄHLENWENNS, MITTELWERTWENN, SUMMENPRODUKT, WENNS, DATUM/EDATUM/MONATSENDE/KALENDERWOCHE, TEXTVERKETTEN, WECHSELN, RMZ/ZW/BW); Zeilen/Spalten einfügen und löschen (Formelbezüge werden angepasst); Ausfüllen nach unten/rechts (Strg+D/R); Zeilenhöhe/Spaltenbreite, Zeilen ausblenden; **bedingte Formatierung** (Schwellwerte, Doppelte, Top/Bottom, Farbskalen; wird im Projekt gespeichert, nicht im XLSX); Datentools (Duplikate entfernen, Text in Spalten, Transponieren, Text bereinigen); Reiter „Formeln“ (Funktionsbibliothek) und „Überprüfen“ (Statistik der Auswahl).
- **Word** (`src/doc/zz-more.js`): Hoch-/Tiefstellen, Schrift größer/kleiner, Groß-/Kleinschreibung, Formatierungszeichen (¶), Symbole, Datum/Uhrzeit, Inhaltsverzeichnis aus Überschriften (statische Seitenzahlen), Rändervorlagen, Reiter „Überprüfen“ (Wörter zählen, Rechtschreibung), Zoom 100 %/Ganze Seite.
- **PowerPoint** (`src/ppt/zz-more.js`, `runtime.js`): 16 weitere Formen (24 insgesamt, gruppiertes Menü, PPTX-Export mit passenden Presets), Farbverlauf (auch im PPTX), Schnellformatvorlagen, Schatten, Eckenradius, Aufzählung/Blocksatz/Zeilenabstand, Symbol/Datum/Foliennummer, Suchen & Ersetzen über die gesamte Präsentation, Reiter „Überprüfen“ (Wörter zählen, Rechtschreibung, Barrierefreiheit prüfen), Gitternetzlinien und Einrasten in der Ansicht.
- Geprüft mit Playwright (keine Konsolenfehler, keine externen Anfragen), PPTX in python-pptx/LibreOffice, XLSX in openpyxl, DOCX in python-docx. Nicht umgesetzt: Excel-Zoom und fixierte Fenster, Hyperlinks in Word, Freihandzeichnen in PowerPoint.

### Zweite Erweiterung (Menübänder gefüllt)

Gruppen verteilen sich über die ganze Leiste (`chrome.css`), und jeder Reiter hat deutlich mehr Befehle (Doppelklick auf einen Reiter oder Strg+F1 klappt das Menüband ein):
- **PowerPoint** (`zz-more2.js`): Farb-/Schrift-/Hintergrundvarianten, weitere Foliengrößen, SmartArt-Diagramme aus Text (Prozess, Liste, Matrix, Zeitleiste, Zyklus, Pyramide, Vergleich), Gliederung bearbeiten, Schnelltabellen, Textvorlagen, Kommentare, Alternativtext (auch im PPTX), Zeitsteuerung („Automatisch weiter“, Dauer), Start ab Folie Nr., Notizen exportieren, Übergänge für alle, Graustufen-Ansicht, Vollbild.
- **Excel** (`zz-more2.js`): Als Tabelle formatieren, Diagrammtypen Balken/Fläche/Ring und Typwechsel, Zellnotizen, Heute/Uhrzeit, Datenreihe, Zufallszahlen, Symbole, Formelüberwachung (Formeln anzeigen, Vorgänger/Nachfolger, Fehler suchen), beliebte Funktionen, Formeln in Werte, Text↔Zahl, Zeilen mischen, leere Zeilen löschen, Duplikate markieren, Blattschutz, Gehe zu, Spalten anpassen.
- **Word** (`zz-more2.js`): Deckblatt, leere Seite, Schnelltabellen, Blindtext, Zitat, Trennlinie, weitere Papierformate (A3/A5/Legal), Randfelder, Einzug/Abstand, Lesbarkeit (Flesch), häufige und doppelte Wörter, doppelte Leerzeichen bereinigen, Gehe zu Seite, Fokus/Vollbild.
