#!/usr/bin/env python3
"""Erzeugt <slug>.html (Launcher) aus Vorlage. Aufruf:
 mk_launcher.py slug "Titel" SNAP [--entry index.html] [--strip REGEX]... [--inject datei.js] [--rawbase] [--lang de]
Der Launcher holt <entry> per jsDelivr (SNAP), setzt <base>, sperrt Fremd-Netz, schreibt es in iframe.srcdoc."""
import sys, argparse, json, os
p=argparse.ArgumentParser()
p.add_argument('slug'); p.add_argument('title'); p.add_argument('snap')
p.add_argument('--entry',default='index.html')
p.add_argument('--strip',action='append',default=[])
p.add_argument('--inject',default=None)
p.add_argument('--repl',action='append',default=[],help='A=>B (Text im HTML ersetzen)')
p.add_argument('--out',default=None)
p.add_argument('--touch',default=None,help='JSON {left:[[Code,Label]],right:[...]}')
a=p.parse_args()
inj=open(a.inject).read() if a.inject else ''
if a.touch:
    inj='<script>window.__TOUCH='+a.touch+'</script>'+inj+open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'touch.js')).read()
tpl=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'launcher_tpl.html')).read()
cfg=dict(base=f"https://cdn.jsdelivr.net/gh/antoniscrazy/Claude@{a.snap}/{a.slug}/",entry=a.entry,strip=a.strip,
         repl=[r.split('=>',1) for r in a.repl])
out=tpl.replace('__TITLE__',a.title).replace('__CFG__',json.dumps(cfg)).replace('__INJECT__',inj.replace('</script>','<\\/script>'))
open(a.out or f'../{a.slug}.html','w').write(out)
print('ok',a.slug)
