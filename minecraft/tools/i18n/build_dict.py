#!/usr/bin/env python3
"""Baut dict_en.json / dict_fr.json (Entwickler-Werkzeug).
Eingaben (Arbeitsordner W): de_de.json, en_us.json, fr_fr.json (offizielle Sprachdateien), de_strings*.json / rest.json (aus dem Spiel
extrahierte deutsche Texte), mt_en.json / mt_fr.json (maschinelle Übersetzung der restlichen Texte), names_de.json (Block-/Item-Namen aus dem Spiel).
Reihenfolge der Quellen (spätere gewinnen): Namen < offizielle Texte < maschinelle Übersetzung < overrides.json."""
import json, re, sys, os
W = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__))
L = lambda f: json.load(open(os.path.join(W, f), encoding='utf-8'))
de, en, fr = L('de_de.json'), L('en_us.json'), L('fr_fr.json')
names = L('names_de.json'); rest = L('rest.json'); allw = L('de_strings.json'); w2 = L('de_strings2.json'); allw += w2['html'] + w2['words']
out = {'en': {}, 'fr': {}}
rev = {}
for k, v in de.items():
    if k in en and k in fr and v and len(v) >= 3: rev.setdefault(v, k)
# 1) Block-/Item-Namen
revb = {}
for k, v in de.items():
    if k.startswith(('block.minecraft.', 'item.minecraft.')) and k.count('.') == 2: revb.setdefault(v, []).append(k)
SUF = re.compile(r'(_(b|t)\d+|_c\d+|_\d+|_top|_foot|_head|_on|_off|_open|_lit|_powered)$')
def lookup(key):
    for pre in ('block.minecraft.', 'item.minecraft.'):
        if pre + key in en: return pre + key
best = {}
for k, nm in names.items():
    key = k.split(':', 1)[1]; k1 = lookup(key); lvl = 1; suffix = ''
    if not k1:
        kk = key
        for _ in range(3):
            kk2 = SUF.sub('', kk)
            if kk2 == kk: break
            kk = kk2; k1 = lookup(kk)
            if k1: lvl = 2; suffix = ' (top)' if key.endswith('_top') else ''; break
    if not k1:
        c = revb.get(nm) or revb.get(re.sub(r'\s*\([^)]*\)\s*$', '', nm))
        if c: k1 = c[0]; lvl = 3
    if k1: val = (en[k1] + suffix, fr.get(k1, en[k1]) + suffix.replace('top', 'haut'))
    else: lvl = 4; g = ' '.join(w.capitalize() for w in SUF.sub('', key).split('_')); val = (g, g)
    if nm not in best or lvl < best[nm][0]: best[nm] = (lvl, val)
for nm, (lvl, val) in best.items():
    out['en'][nm] = val[0]; out['fr'][nm] = val[1]
# 2) offizielle Texte
for w in allw:
    if w in rev: out['en'][w] = en[rev[w]]; out['fr'][w] = fr[rev[w]]
# 3) maschinelle Übersetzung
for l in ('en', 'fr'):
    p = os.path.join(W, 'mt_%s.json' % l)
    if os.path.exists(p):
        for k, v in L('mt_%s.json' % l).items():
            if k not in rev: out[l][k] = v
# 4) Handarbeit
ov = json.load(open(os.path.join(here, 'overrides.json'), encoding='utf-8'))
for k, (e, f) in ov.items(): out['en'][k] = e; out['fr'][k] = f
for l in out:
    out[l] = {k: v for k, v in out[l].items() if k and k != v and not re.fullmatch(r'[\d\W]+', k)}
    json.dump(out[l], open(os.path.join(here, 'dict_%s.json' % l), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(l, len(out[l]))
