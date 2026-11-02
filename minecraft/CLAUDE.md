# Arbeitsweise für dieses Projekt (VOXELCRAFT, `index.html`)

- Antworten und Oberfläche auf Deutsch. Pro Update: umsetzen → Syntaxcheck + Playwright-Tests → `BUGS.md`/`README.md` aktualisieren → `GAME_VER` erhöhen → committen und auf den Feature-Branch pushen → Dateien an den Nutzer schicken. Keine Pull Requests, außer der Nutzer verlangt es.
- **Bei jedem Update dem Nutzer die Version MIT eingebautem Groq-Schlüssel schicken** (für den KI-Spieler `/ai`), zusätzlich zur normalen `index.html`:
  `GROQ_KEY=gsk_… python3 tools/inject_groq_key.py <ausgabe>/index.html` und diese Datei per SendUserFile schicken (als `index.html`, mit Hinweis „enthält deinen Schlüssel – nicht öffentlich teilen“).
- Der Schlüssel selbst steht **nie** im Repository (weder in Code, Doku noch Commit). Er wird nicht gespeichert: Wenn er in einer neuen Sitzung fehlt, den Nutzer danach fragen. `index.keyed.html` ist in `.gitignore`.
- Menü-Look (Java-Edition): CSS-Variablen `--mc-…` und die Schrift stehen im `<style id="mcui-data">` zwischen `/*MCUI_BEGIN*/` und `/*MCUI_END*/` und werden mit `tools/mcui/embed_mcui.py` erzeugt – nicht von Hand ändern. Das Panorama kommt aus `tools/mcui/panorama_0..5.jpg`.

- Sprachen (Deutsch/Englisch/Französisch): Der Quelltext ist deutsch. `tools/i18n/` enthält die Wörterbücher (`dict_en.json`, `dict_fr.json`, gebaut mit `build_dict.py`, von Hand korrigiert über `overrides.json`); `embed_i18n.py` bettet sie zwischen `<!--I18N_BEGIN-->` und `<!--I18N_END-->` ein. Die Übersetzung läuft zur Laufzeit über den DOM (`tr()`, `i18nSet()` im Spielcode). **Neue deutsche Texte** funktionieren nur auf Englisch/Französisch, wenn sie im Wörterbuch stehen – neue Einträge in `overrides.json` ergänzen und `embed_i18n.py` laufen lassen.
