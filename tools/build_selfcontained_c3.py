#!/usr/bin/env python3
"""Baut aus einem Construct-3-Spielordner EINE HTML-Datei mit allen Dateien eingebettet (kein Netz, kein jsDelivr).
Aufruf: build_selfcontained_c3.py <spielordner> <ausgabe.html> <Titel> [--worker-original]
Standard: Worker-Modus aus (Moki-Patch in main.js). Mit --worker-original wird der Originalwert wiederhergestellt."""
import sys, os, re, base64, json

args = [a for a in sys.argv[1:] if not a.startswith("--")]
game, out, title = args
original_worker = "--worker-original" in sys.argv

BOOT = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "vfs_boot.js"), encoding="utf-8").read()
INLINE = {"poki-sdk.js", "box2d.wasm.js", "scripts/supportcheck.js", "scripts/main.js"}
SKIP = INLINE | {"index.html", "style.css", "offline.json", "scripts/offlineclient.js", "scripts/register-sw.js", "appmanifest.json"}

def rd(p): return open(os.path.join(game, p), encoding="utf-8").read()
def esc(js): return js.replace("</script", "<\\/script")

files = {}
for root, _, names in os.walk(game):
    for n in names:
        rel = os.path.relpath(os.path.join(root, n), game).replace(os.sep, "/")
        if rel in SKIP or rel.endswith(".html"): continue
        files[rel] = base64.b64encode(open(os.path.join(root, n), "rb").read()).decode()

MIME = {".wasm": "application/wasm", ".js": "text/javascript", ".json": "application/json", ".png": "image/png",
        ".jpg": "image/jpeg", ".webp": "image/webp", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav",
        ".otf": "font/otf", ".ttf": "font/ttf", ".woff": "font/woff", ".woff2": "font/woff2", ".m4a": "audio/mp4"}
mime = {k: MIME.get(os.path.splitext(k)[1].lower(), "application/octet-stream") for k in files}

main_js = rd("scripts/main.js")
if original_worker:
    main_js = main_js.replace("this._useWorker = false; // Moki: immer im DOM laufen lassen (Worker-Modus laedt Texte auf iPad nicht)", "this._useWorker = opts.useWorker;")
css = rd("style.css")
head = ('<!doctype html><html><head><meta charset="utf-8">'
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">'
  '<base href="https://game.local/"><title>%s</title>'
  '<script>%s</script><script>window.__GAME_BASE="https://game.local/";</script>'
  '<script>document.write("<style>"+window.__vfsCss(%s)+"</style>")</script></head><body>' % (title, esc(BOOT), json.dumps(css).replace("</", "<\\/")))
body = "".join("<script>%s</script>" % esc(rd(n)) for n in ["poki-sdk.js", "box2d.wasm.js", "scripts/supportcheck.js"])
body += '<script type="module">%s</script></body></html>' % esc(main_js)
game_html = head + body

launcher = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "launcher_template.html"), encoding="utf-8").read()
launcher = (launcher.replace("%%TITLE%%", title)
    .replace("%%VFS%%", json.dumps(files).replace("</", "<\\/"))
    .replace("%%MIME%%", json.dumps(mime))
    .replace("%%HTML%%", json.dumps(game_html).replace("</", "<\\/")))
open(out, "w", encoding="utf-8").write(launcher)
print("OK", out, round(len(launcher) / 1e6, 1), "MB,", len(files), "Dateien im VFS")
