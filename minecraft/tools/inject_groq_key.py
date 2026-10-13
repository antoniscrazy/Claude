#!/usr/bin/env python3
"""Baut aus index.html eine Kopie mit eingebautem Groq-Schlüssel für Herobrines KI (Platzhalter zwischen HB_KEY_BEGIN/HB_KEY_END).
Der Schlüssel wird NICHT ins Repository geschrieben: Ausgabe standardmäßig nach index.keyed.html (steht in .gitignore).
Aufruf:  GROQ_KEY=gsk_... python3 tools/inject_groq_key.py [ausgabe.html]
(Alternativ ohne Neubau: im Spiel als Beschwörer `/herobrine key gsk_...` – gilt nur auf diesem Gerät.)"""
import os, re, sys
key = os.environ.get('GROQ_KEY', '').strip()
if not key or not re.fullmatch(r'gsk_[A-Za-z0-9]+', key):
    sys.exit('Bitte GROQ_KEY=gsk_... setzen.')
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, '..', 'index.html')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', 'index.keyed.html')
t = open(src, encoding='utf-8').read()
m = '/*HB_KEY_BEGIN*/\'\'/*HB_KEY_END*/'
if t.count(m) != 1:
    sys.exit('Platzhalter nicht gefunden.')
open(out, 'w', encoding='utf-8').write(t.replace(m, "/*HB_KEY_BEGIN*/'" + key + "'/*HB_KEY_END*/"))
print('geschrieben:', out)
