#!/usr/bin/env python3
"""Bettet die vom Spiel benötigten Texturen aus einem Minecraft-Texturepack
(Ordner oder .zip) als Base64-PNG in minecraft/index.html ein.

Benutzung:  python3 tools/embed_textures.py <pack.zip|pack-ordner> [index.html]

Welche Texturen gebraucht werden, steht im Block /*BLOCKDEFS_BEGIN*/ ... /*BLOCKDEFS_END*/
der index.html (TILE_LIST + EXTRA_TEXTURES). Das Skript ermittelt die Liste mit Node.js,
kopiert jeweils nur die nötigen PNGs (bei animierten Texturen nur das erste Bild) und
schreibt sie zwischen die Marker /*PACK_BEGIN*/ und /*PACK_END*/.
"""
import base64, io, json, os, re, subprocess, sys, zipfile

EXTRACT_JS = r"""
const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');
const a=s.indexOf('/*BLOCKDEFS_BEGIN*/'),b=s.indexOf('/*BLOCKDEFS_END*/');
const r=new Function(s.slice(a,b)+'\nreturn {TILE_LIST,EXTRA_TEXTURES};')();
const n=new Set(r.EXTRA_TEXTURES);
for(const t of r.TILE_LIST){n.add(t.src);if(t.overlay)n.add(t.overlay);}
console.log(JSON.stringify([...n]));
"""

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pack = sys.argv[1]
    html_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'index.html')
    names = json.loads(subprocess.check_output(['node', '-e', EXTRACT_JS, html_path]))
    try:
        from PIL import Image
    except ImportError:
        Image = None

    if os.path.isdir(pack):
        def read(rel, ext='.png'):
            with open(os.path.join(pack, 'assets/minecraft/textures', rel + ext), 'rb') as f:
                return f.read()
    else:
        z = zipfile.ZipFile(pack)
        def read(rel, ext='.png'):
            return z.read('assets/minecraft/textures/' + rel + ext)

    out, anim, missing, total = {}, {}, [], 0
    for n in sorted(names):
        if '/gen_' in n: continue                                  # selbst gezeichnet (Backrooms), kommt nicht aus dem Pack
        try:
            data = read(n)
        except (KeyError, FileNotFoundError):
            missing.append(n)
            continue
        if Image is not None:
            im = Image.open(io.BytesIO(data))
            w, h = im.size
            if h > w and h % w == 0 and n.startswith('block/'):     # animierter Streifen -> erstes Bild
                full = data
                buf = io.BytesIO(); im.convert('RGBA').crop((0, 0, w, w)).save(buf, 'PNG', optimize=True); data = buf.getvalue()
                try:                                                             # Animation (.mcmeta): Bildfolge + Tempo
                    meta = json.loads(read(n, '.png.mcmeta').decode('utf-8')).get('animation', {})
                    nfr = h // w
                    frames = [f if isinstance(f, int) else f.get('index', 0) for f in meta.get('frames', range(nfr))]
                    base = meta.get('frametime', 1)
                    times = [base if isinstance(f, int) else (f.get('time') or base) for f in meta.get('frames', range(nfr))]
                    anim[n] = {'d': 'data:image/png;base64,' + base64.b64encode(full).decode(), 'f': frames, 't': times}
                except (KeyError, FileNotFoundError, ValueError):
                    pass
        out[n] = 'data:image/png;base64,' + base64.b64encode(data).decode()
        total += len(data)
    if missing:
        print('FEHLT im Pack:', ', '.join(missing), file=sys.stderr)
    js = json.dumps(out, separators=(',', ':'))
    with open(html_path, encoding='utf-8') as f:
        s = f.read()
    a, b = s.index('/*PACK_BEGIN*/'), s.index('/*PACK_END*/')
    s = s[:a] + '/*PACK_BEGIN*/' + js + s[b:]
    a, b = s.index('/*ANIM_BEGIN*/'), s.index('/*ANIM_END*/')
    s = s[:a] + '/*ANIM_BEGIN*/' + json.dumps(anim, separators=(',', ':')) + s[b:]
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(s)
    print('%d Texturen eingebettet (%.1f KB PNG, %.1f KB Base64), %d animiert' % (len(out), total / 1024, len(js) / 1024, len(anim)))

if __name__ == '__main__':
    main()
