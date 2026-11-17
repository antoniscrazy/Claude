#!/usr/bin/env python3
"""Wandelt CFF-OpenType-Schriften (.otf) in TrueType (glyf) um: python3 otf2ttf.py <eingabe> <ausgabe>"""
import sys
from fontTools.ttLib import TTFont, newTable
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen

def to_quadratic(glyphs, max_err=1.0):
    out = {}
    for name in glyphs.keys():
        pen = TTGlyphPen(glyphs)
        glyphs[name].draw(Cu2QuPen(pen, max_err, reverse_direction=True))
        out[name] = pen.glyph()
    return out

f = TTFont(sys.argv[1])
assert f.sfntVersion == "OTTO" and "CFF " in f
order = f.getGlyphOrder()
f["loca"] = newTable("loca")
f["glyf"] = glyf = newTable("glyf")
glyf.glyphOrder = order
glyf.glyphs = to_quadratic(f.getGlyphSet())
del f["CFF "]
if "VORG" in f: del f["VORG"]
glyf.compile(f)
hmtx = f["hmtx"]
for n, g in glyf.glyphs.items():
    if hasattr(g, "xMin"): hmtx[n] = (hmtx[n][0], g.xMin)
f["maxp"] = m = newTable("maxp")
m.tableVersion = 0x00010000
m.maxZones = 1; m.maxTwilightPoints = 0; m.maxStorage = 0; m.maxFunctionDefs = 0; m.maxInstructionDefs = 0
m.maxStackElements = 0; m.maxSizeOfInstructions = 0
m.maxComponentElements = max((len(getattr(g, "components", [])) for g in glyf.glyphs.values()), default=0)
m.numGlyphs = len(order)
m.maxPoints = m.maxContours = m.maxCompositePoints = m.maxCompositeContours = m.maxComponentDepth = 0
post = f["post"]; post.formatType = 2.0; post.extraNames = []; post.mapping = {}; post.glyphOrder = order
f.sfntVersion = "\000\001\000\000"
f.save(sys.argv[2])
print("OK", sys.argv[2])
