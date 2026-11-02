#!/usr/bin/env python3
"""Bettet die Wörterbücher (dict_en.json, dict_fr.json) als <script type="application/json" id="i18nData"> in index.html ein.
Aufruf:  python3 embed_i18n.py [index.html]
Die Wörterbücher entstehen mit build_dict.py (Namen aus den offiziellen Minecraft-Sprachdateien, übrige Texte maschinell übersetzt, dazu overrides.json von Hand)."""
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
html = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', '..', 'index.html')
data = {l: json.load(open(os.path.join(here, 'dict_%s.json' % l), encoding='utf-8')) for l in ('en', 'fr')}
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
s = open(html, encoding='utf-8').read()
a, b = s.index('<!--I18N_BEGIN-->') + len('<!--I18N_BEGIN-->'), s.index('<!--I18N_END-->')
open(html, 'w', encoding='utf-8').write(s[:a] + '<script type="application/json" id="i18nData">' + blob + '</script>' + s[b:])
print('i18n eingebettet:', len(blob) // 1024, 'KB,', {l: len(d) for l, d in data.items()})
