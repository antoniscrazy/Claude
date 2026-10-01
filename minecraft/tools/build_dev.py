#!/usr/bin/env python3
"""Baut ../dev.html aus dev_template.html: setzt den (öffentlichen) Anon-Key aus index.html und die Block-/Item-Namen aus dev_names.json ein.
Namen neu erzeugen, wenn sich Block-IDs ändern: im Spiel window.__vc.BLOCKS / ITEMS auslesen (siehe dev_names.json)."""
import json, re, pathlib
here = pathlib.Path(__file__).parent
idx = (here.parent / 'index.html').read_text(encoding='utf-8')
key = re.search(r"const SUPABASE_KEY = '([^']+)'", idx).group(1)
names = (here / 'dev_names.json').read_text(encoding='utf-8')
html = (here / 'dev_template.html').read_text(encoding='utf-8')
html = html.replace('__ANON_KEY__', key).replace('/*NAMES*/{}/*END*/', json.dumps(json.loads(names), ensure_ascii=False, separators=(',', ':')))
(here.parent / 'dev.html').write_text(html, encoding='utf-8')
print('dev.html', len(html), 'Bytes')
