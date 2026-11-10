# Baut moki.html (alles in einer Datei, Bilder eingebettet). Aufruf: python3 build.py
import base64,re
r=lambda f:open(f,encoding="utf-8").read()
h=r("index.html").replace('<link rel="stylesheet" href="style.css">',"<style>\n"+r("style.css")+"\n</style>")
g=r("games.js")
g=re.sub(r'"([\w-]+\.jpg)"',lambda m:'"data:image/jpeg;base64,'+base64.b64encode(open(m.group(1),"rb").read()).decode()+'"',g)
h=h.replace('<script src="games.js"></script>',"<script>\n"+g+"\n</script>").replace('<script src="app.js"></script>',"<script>\n"+r("app.js")+"\n</script>")
open("moki.html","w",encoding="utf-8").write(h)
