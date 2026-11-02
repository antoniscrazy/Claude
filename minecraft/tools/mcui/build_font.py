#!/usr/bin/env python3
"""Baut aus den Bitmap-Schriften des Minecraft-Ressourcenpakets (1.21.x) eine TTF-Schrift „MinecraftUI“.

Aufruf:  python3 build_font.py <entpackter-assets/minecraft-Ordner> <ausgabe.ttf>
Benötigt: Pillow, fonttools.   1 Bildpunkt = 125 Schrift-Einheiten (8 px = 1 em) → bei font-size 16px ist 1 MC-Pixel genau 2 CSS-Pixel.
"""
import json, sys, os
from PIL import Image
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

root, out = sys.argv[1], sys.argv[2]
PX = 125
# Zeichenbereiche, die das Spiel braucht (Latein, Satzzeichen, Pfeile, ein paar Symbole) – hält die Datei klein
RANGES = [(0x20, 0x24F), (0x2010, 0x2122), (0x2190, 0x2193), (0x2212, 0x2213), (0x221E, 0x221E), (0x25A0, 0x25CF), (0x2600, 0x2603), (0x2660, 0x2667), (0x2764, 0x2764), (0x2714, 0x2714), (0x274C, 0x274C), (0x20AC, 0x20AC), (0x2B50, 0x2B50)]
want = lambda cp: any(a <= cp <= b for a, b in RANGES)

prov = json.load(open(os.path.join(root, 'font/include/default.json')))['providers']
glyphs = {}          # codepoint -> (rects[(x0,y0,x1,y1) in Pixeln über der Grundlinie], advance in Pixeln)
for p in prov:
    if p.get('type') != 'bitmap': continue
    img = Image.open(os.path.join(root, 'textures', p['file'].split(':')[1])).convert('RGBA')
    rows = p['chars']; nr, nc = len(rows), len(rows[0]); cw, ch = img.width // nc, img.height // nr
    ascent = p['ascent']; scale = p.get('height', 8) / ch
    px = img.load()
    for r, line in enumerate(rows):
        for c, chr_ in enumerate(line):
            cp = ord(chr_)
            if cp == 0 or cp in glyphs or not want(cp): continue
            on = [[px[c * cw + x, r * ch + y][3] > 0 for x in range(cw)] for y in range(ch)]
            cols = [x for x in range(cw) if any(on[y][x] for y in range(ch))]
            if not cols: continue
            adv = int(0.5 + (max(cols) + 1) * scale) + 1
            rects = []
            for y in range(ch):                      # waagerechte Läufe → ein Rechteck je Lauf
                x = 0
                while x < cw:
                    if on[y][x]:
                        x0 = x
                        while x < cw and on[y][x]: x += 1
                        rects.append((x0 * scale, (ascent - y - 1) * scale, x * scale, (ascent - y) * scale))
                    else: x += 1
            glyphs[cp] = (rects, adv)
glyphs[0x20] = ([], 4); glyphs[0xA0] = ([], 4)
order = ['.notdef'] + ['uni%04X' % cp for cp in sorted(glyphs)]
pen_glyphs = {}
for name in order:
    pen = TTGlyphPen(None)
    if name != '.notdef':
        for (x0, y0, x1, y1) in glyphs[int(name[3:], 16)][0]:
            pen.moveTo((round(x0 * PX), round(y0 * PX))); pen.lineTo((round(x0 * PX), round(y1 * PX))); pen.lineTo((round(x1 * PX), round(y1 * PX))); pen.lineTo((round(x1 * PX), round(y0 * PX))); pen.closePath()
    pen_glyphs[name] = pen.glyph()
adv = {'.notdef': 5 * PX}; adv.update({'uni%04X' % cp: g[1] * PX for cp, g in glyphs.items()})
fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder(order); fb.setupCharacterMap({cp: 'uni%04X' % cp for cp in glyphs})
fb.setupGlyf(pen_glyphs); fb.setupHorizontalMetrics({n: (adv[n], 0) for n in order})
fb.setupHorizontalHeader(ascent=7 * PX, descent=0); fb.setupNameTable({'familyName': 'MinecraftUI', 'styleName': 'Regular'})
fb.setupOS2(version=4, sTypoAscender=7 * PX, sTypoDescender=0, usWinAscent=11 * PX, usWinDescent=3 * PX, fsSelection=0x80 | 0x40); fb.setupPost(); fb.setupMaxp() if hasattr(fb, 'setupMaxp') else None
fb.save(out); print('Glyphen:', len(glyphs), 'Größe:', os.path.getsize(out))
