# Baut moki.html (alles in einer Datei, Bilder eingebettet). Aufruf: python3 build.py
import base64,re,json
r=lambda f:open(f,encoding="utf-8").read()
h=r("index.html").replace('<link rel="stylesheet" href="style.css">',"<style>\n"+r("style.css")+"\n</style>")
g=r("games.js")
g=re.sub(r'"([\w-]+\.jpg)"',lambda m:'"data:image/jpeg;base64,'+base64.b64encode(open(m.group(1),"rb").read()).decode()+'"',g)
h=h.replace('<script src="games.js"></script>',"<script>\n"+g+"\n</script>").replace('<script src="app.js"></script>',"<script>\n"+r("app.js")+"\n</script>").replace('<script src="intro.js"></script>',"<script>\n"+r("intro.js")+"\n</script>").replace('<script src="creations.js"></script>',"<script>\n"+r("creations.js")+"\n</script>").replace('<script src="config.js"></script>',"<script>\n"+r("config.js")+"\nwindow.MOKI_ENGINE = "+json.dumps(r("engine.js")).replace("<","\\u003c")+";\n</script>")
open("moki.html","w",encoding="utf-8").write(h)


# ---------- Studio (studio.html) ----------
import json
studio=r("studio-src.html")
idx=r("index.html")
links="\n".join(re.findall(r'<link rel="(?:icon|apple-touch-icon)"[^>]*>',idx))
logo=r("logo/moki-logo.svg").replace('id="mg"','id="slg"').replace('url(#mg)','url(#slg)').replace(' xmlns="http://www.w3.org/2000/svg"','').replace('role="img" aria-label="Moki"','aria-hidden="true"')
eng=json.dumps(r("engine.js")).replace("<","\\u003c")
studio=studio.replace("<!--ICON-->",links).replace("<!--LOGO-->",logo).replace("/*CSS*/",r("studio.css"))
studio=studio.replace("/*CONFIG*/",r("config.js")+"\nwindow.MOKI_ENGINE = "+eng+";")
studio=studio.replace("/*JS*/",r("studio-icons.js")+"\n"+r("studio.js"))
open("studio.html","w",encoding="utf-8").write(studio)
