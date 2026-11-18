#!/usr/bin/env python3
"""Baut aus einem PlayCanvas-Spielordner EINE HTML-Datei mit allen Dateien eingebettet (kein Netz, kein jsDelivr).
Aufruf: build_selfcontained.py <spielordner> <ausgabe.html> <Titel>
Die Index-Skripte werden inline eingesetzt, alle anderen Dateien als Base64 in ein virtuelles Dateisystem gelegt,
das XHR/fetch/Image/Script/Worker/Audio im Spiel-iframe abfaengt."""
import sys, os, re, base64, json, mimetypes

game, out, title = sys.argv[1], sys.argv[2], sys.argv[3]
INLINE = ["poki-sdk.js", "playcanvas-stable.min.js", "__settings__.js", "__modules__.js", "__start__.js", "__loading__.js"]
SKIP = set(INLINE) | {"index.html", "styles.css", "manifest.json"}

def rd(p): return open(os.path.join(game, p), encoding="utf-8").read()
def esc(js): return js.replace("</script", "<\\/script")

files = {}
for root, _, names in os.walk(game):
    for n in names:
        rel = os.path.relpath(os.path.join(root, n), game).replace(os.sep, "/")
        if rel in SKIP: continue
        files[rel] = base64.b64encode(open(os.path.join(root, n), "rb").read()).decode()

MIME = {".wasm": "application/wasm", ".js": "text/javascript", ".json": "application/json", ".glb": "model/gltf-binary",
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp3": "audio/mpeg",
        ".ogg": "audio/ogg", ".wav": "audio/wav", ".glsl": "text/plain", ".txt": "text/plain"}
mime = {k: MIME.get(os.path.splitext(k)[1].lower(), "application/octet-stream") for k in files}

BOOT = r'''
(function(){
  var VFS = window.__VFS, MIME = window.__MIME, URLS = {}, ROOT = "https://game.local/";
  function blobFor(p){ if(!(p in VFS)) return null; if(!URLS[p]){ var b=atob(VFS[p]), a=new Uint8Array(b.length); for(var i=0;i<b.length;i++) a[i]=b.charCodeAt(i); URLS[p]=URL.createObjectURL(new Blob([a],{type:MIME[p]||"application/octet-stream"})); } return URLS[p]; }
  function map(u){
    try{ var s=String(u&&u.url||u); if(/^(blob:|data:|about:)/.test(s)) return s;
      var x=new URL(s, ROOT); if(x.origin!==new URL(ROOT).origin) return "blob:null/blocked";
      var p=decodeURIComponent(x.pathname.replace(/^\//,"")); var b=blobFor(p); return b||"blob:null/missing-"+encodeURIComponent(p);
    }catch(e){ return u; }
  }
  window.__vfsMap = map;
  var xo=XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open=function(m,u){ arguments[1]=map(u); return xo.apply(this,arguments); };
  var f=window.fetch; window.fetch=function(r,i){ var m=map(r); return f.call(this,(typeof r==="string"||r instanceof URL)?m:new Request(m,r),i); };
  function hookSrc(proto){ var d=Object.getOwnPropertyDescriptor(proto,"src"); if(!d||!d.set) return; Object.defineProperty(proto,"src",{get:d.get,set:function(v){ d.set.call(this,map(v)); },configurable:true}); var sa=proto.setAttribute; }
  hookSrc(HTMLImageElement.prototype); hookSrc(HTMLScriptElement.prototype); hookSrc(HTMLMediaElement.prototype);
  var sa=Element.prototype.setAttribute; Element.prototype.setAttribute=function(n,v){ if(n==="src"&&/^(IMG|SCRIPT|AUDIO|VIDEO|SOURCE)$/.test(this.tagName)) v=map(v); return sa.call(this,n,v); };
  var W=window.Worker; window.Worker=function(u,o){ return new W(map(u),o); }; window.Worker.prototype=W.prototype;
  if(window.AudioWorklet){ var am=AudioWorklet.prototype.addModule; AudioWorklet.prototype.addModule=function(u,o){ return am.call(this,map(u),o); }; }
  if(navigator.sendBeacon) navigator.sendBeacon=function(){return false;};
  window.open=function(){return null;};
})();
'''

css = rd("styles.css")
parts = []
parts.append('<!doctype html><html><head><meta charset="utf-8">'
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">'
  '<base href="https://game.local/"><title>%s</title><script>%s</script><style>%s</style>' % (title, esc(BOOT), css))
for n in ["poki-sdk.js", "playcanvas-stable.min.js", "__settings__.js"]:
    parts.append("<script>%s</script>" % esc(rd(n)))
parts.append("</head><body>")
for n in ["__modules__.js", "__start__.js", "__loading__.js"]:
    parts.append("<script>%s</script>" % esc(rd(n)))
parts.append("</body></html>")
game_html = "".join(parts)

launcher = '''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>%(title)s</title>
<style>
  html, body { margin: 0; height: 100%%; background: #111; color: #fff; font-family: sans-serif; overflow: hidden; }
  body { display: flex; flex-direction: column; }
  #bar { flex: 0 0 auto; display: flex; justify-content: flex-end; padding: 6px 12px; background: #111; }
  #game { flex: 1 1 auto; width: 100%%; border: 0; display: block; min-height: 0; background: #000; }
  #moki-back {
    padding: 9px 16px; border-radius: 999px;
    background: linear-gradient(90deg, #00e5a8, #ffd23f);
    color: #04201a; font: 800 14px "Segoe UI", system-ui, sans-serif;
    text-decoration: none; box-shadow: 0 3px 12px rgba(0, 0, 0, .5); opacity: .92;
  }
  #moki-back:hover { opacity: 1; transform: scale(1.05); }
</style>
</head>
<body>
<div id="bar"><a id="moki-back" href="https://mokiorg.netlify.app">&larr; Back to Moki</a></div>
<iframe id="game" allow="autoplay; fullscreen" allowfullscreen></iframe>
<script type="application/json" id="vfs">%(vfs)s</script>
<script type="application/json" id="mime">%(mime)s</script>
<script type="application/json" id="html">%(html)s</script>
<script>
// Alles in dieser einen Datei: Spieldateien sind eingebettet. Kein Netz, keine Werbung, keine Tracker.
(function () {
  var w = document.getElementById("game").contentWindow;
  w.__VFS = JSON.parse(document.getElementById("vfs").textContent);
  w.__MIME = JSON.parse(document.getElementById("mime").textContent);
  var html = JSON.parse(document.getElementById("html").textContent);
  w.document.open(); w.document.write(html); w.document.close();
})();
</script>
</body>
</html>
''' % {"title": title, "vfs": json.dumps(files).replace("</", "<\\/"), "mime": json.dumps(mime),
       "html": json.dumps(game_html).replace("</", "<\\/")}
open(out, "w", encoding="utf-8").write(launcher)
print("OK", out, round(len(launcher) / 1e6, 1), "MB,", len(files), "Dateien im VFS")
