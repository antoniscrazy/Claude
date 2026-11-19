# Baut moki.html (alles in einer Datei, Bilder eingebettet). Aufruf: python3 build.py
import base64,re,json,os
_L={}
for _f in sorted(os.listdir("launchers")):
    if _f.endswith(".html"):
        _h=open(os.path.join("launchers",_f),encoding="utf-8").read()
        # Eingebettete iframes bekommen alle Berechtigungen (sonst "gamepad is disallowed by permissions policy")
        _h=re.sub(r'<iframe\b[^>]*>',lambda m: re.sub(r' allow="[^"]*"','',m.group(0)).replace('<iframe','<iframe allow="autoplay *; fullscreen *; gamepad *; pointer-lock *; clipboard-write *"',1),_h)
        _L[_f[:-5]]=_h
_LJ=json.dumps(_L,ensure_ascii=False).replace("<","\\u003c").replace(">","\\u003e").replace("\u2028","\\u2028").replace("\u2029","\\u2029")
r=lambda f:open(f,encoding="utf-8").read()
h=r("index.html").replace('<link rel="stylesheet" href="style.css">',"<style>\n"+r("style.css")+"\n</style>")
g=r("games.js")
g=re.sub(r'"([\w-]+\.(?:jpg|png))"',lambda m:'"data:image/'+('png' if m.group(1).endswith('.png') else 'jpeg')+';base64,'+base64.b64encode(open(m.group(1),"rb").read()).decode()+'"',g)
h=h.replace('<script src="games.js"></script>',"<script>\n"+g+"\n</script>").replace('<script src="app.js"></script>',"<script>window.MOKI_LAUNCH="+_LJ+";</script>\n<script>\n"+r("app.js")+"\n</script>").replace('<script src="intro.js"></script>',"<script>\n"+r("intro.js")+"\n</script>").replace('<script src="intro3d/intro3d.bundle.js"></script>',"<script>\n"+r("intro3d/intro3d.bundle.js").replace("</script","<\\/script")+"\n</script>").replace('<script src="megaintro.js"></script>',"<script>\n"+r("megaintro.js")+"\n</script>").replace('<script src="randomspin.js"></script>',"<script>\n"+r("randomspin.js")+"\n</script>").replace('<script src="stats.js"></script>',"<script>\n"+r("stats.js")+"\n</script>").replace('<script src="creations.js"></script>',"<script>\n"+r("creations.js")+"\n</script>").replace('<script src="config.js"></script>',"<script>\n"+r("config.js")+"\nwindow.MOKI_ENGINE = "+json.dumps(r("motifs.js")+"\n"+r("engine.js")).replace("<","\\u003c")+";\n</script>")
i=h.rindex("</body>");h=h[:i]+"<script>\n"+r("challenge.js")+"\n</script>\n<script>\n"+r("announcements.js")+"\n</script>\n<script>\n"+r("tester.js")+"\n</script>\n<script>\n"+r("nf.js")+"\n</script>\n"+h[i:]
open("moki.html","w",encoding="utf-8").write(h)

# ---------- Weihnachts-Ausgabe (moki_weinachten.html): gleiche Seite, dazu Winter-Design, Adventskalender, Weihnachts-Einleitung ----------
_mi="<script>\n"+r("megaintro.js")+"\n</script>"
assert _mi in h
import base64 as _b64
_mu=[("Jingle Bells","jingle-bells.mp3"),("Stille Nacht","stille-nacht.mp3"),("We Wish You a Merry Christmas","we-wish-you.mp3")]
_mj="window.MOKI_XMAS_MUSIC="+json.dumps([{"n":n,"u":"data:audio/mpeg;base64,"+_b64.b64encode(open("musik/"+f,"rb").read()).decode()} for n,f in _mu if os.path.exists("musik/"+f)])+";"
_xg=re.sub(r'"(xmas/[\w-]+\.jpg)"',lambda m:'"data:image/jpeg;base64,'+base64.b64encode(open(m.group(1),"rb").read()).decode()+'"',r("xmasgames.js"))
_xl={f[:-5]:re.sub(r'<iframe\b[^>]*>',lambda m:re.sub(r' allow="[^"]*"','',m.group(0)).replace('<iframe','<iframe allow="autoplay *; fullscreen *; gamepad *; pointer-lock *; clipboard-write *"',1),open("xmas/launchers/"+f,encoding="utf-8").read()) for f in sorted(os.listdir("xmas/launchers")) if f.endswith(".html")}
_xj=json.dumps(_xl,ensure_ascii=False).replace("<","\\u003c").replace(">","\\u003e").replace("\u2028","\\u2028").replace("\u2029","\\u2029")
_xm="<script>\n"+_mj+"\n"+_xg+"\nwindow.MOKI_LAUNCH=Object.assign(window.MOKI_LAUNCH||{},"+_xj+");\n"+r("advent.js")+"\n</script>"
if os.path.exists("xmasintro.js"): _xm+="\n<script>\n"+r("xmasintro.js")+"\n</script>"
x=h.replace(_mi,_xm).replace("moki-intro-v3","moki-xmas-intro-v1").replace("</head>","<style>\n"+r("weihnachten.css")+"\n</style>\n</head>",1)
open("moki_weinachten.html","w",encoding="utf-8").write(x)


# ---------- Studio (studio.html) ----------
import json
studio=r("studio-src.html")
idx=r("index.html")
links="\n".join(re.findall(r'<link rel="(?:icon|apple-touch-icon)"[^>]*>',idx))
logo=r("logo/moki-logo.svg").replace('id="mg"','id="slg"').replace('url(#mg)','url(#slg)').replace(' xmlns="http://www.w3.org/2000/svg"','').replace('role="img" aria-label="Moki"','aria-hidden="true"')
eng=json.dumps(r("motifs.js")+"\n"+r("engine.js")).replace("<","\\u003c")
studio=studio.replace("<!--ICON-->",links).replace("<!--LOGO-->",logo).replace("/*CSS*/",r("studio.css"))
studio=studio.replace("/*CONFIG*/",r("config.js")+"\nwindow.MOKI_ENGINE = "+eng+";")
studio=studio.replace("/*JS*/",r("motifs.js")+"\n"+r("studio-icons.js")+"\n"+r("studio-core.js")+"\n"+r("studio-model.js")+"\n"+r("studio-builder.js")+"\n"+r("studio-main.js")+"\n"+r("studio-extras.js")+"\nwindow.MOKI_NF_STUDIO=true;\n"+r("nf.js"))
open("studio.html","w",encoding="utf-8").write(studio)
