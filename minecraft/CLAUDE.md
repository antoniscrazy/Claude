# Arbeitsweise für dieses Projekt (VOXELCRAFT, `index.html`)

- Antworten und Oberfläche auf Deutsch. Pro Update: umsetzen → Syntaxcheck + Playwright-Tests → `BUGS.md`/`README.md` aktualisieren → `GAME_VER` erhöhen → committen und auf den Feature-Branch pushen → Dateien an den Nutzer schicken. Keine Pull Requests, außer der Nutzer verlangt es.
- **Bei jedem Update dem Nutzer die Version MIT eingebautem Groq-Schlüssel schicken** (für den KI-Spieler `/ai`), zusätzlich zur normalen `index.html`:
  `GROQ_KEY=gsk_… python3 tools/inject_groq_key.py <ausgabe>/index.html` und diese Datei per SendUserFile schicken (als `index.html`, mit Hinweis „enthält deinen Schlüssel – nicht öffentlich teilen“).
- Der Schlüssel selbst steht **nie** im Repository (weder in Code, Doku noch Commit). Er wird nicht gespeichert: Wenn er in einer neuen Sitzung fehlt, den Nutzer danach fragen. `index.keyed.html` ist in `.gitignore`.
