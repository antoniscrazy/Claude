#!/usr/bin/env python3
"""Erzwingt: Theme.luau ist die EINZIGE Quelle fuer Design-Werte.

Geprueft wird echter Code - Kommentare und Stringinhalte werden vorher
entfernt (sonst schlaegt jede Erklaerung im Kopfkommentar an).

Was ausserhalb von src/shared/Theme.luau verboten ist:
  * Color3-Konstruktoren           -> Theme.Color.*
  * Enum.Font / Enum.Material      -> Theme.Font.* / Theme.Material.*
  * TweenInfo.new                  -> Theme.tweenInfo(...)
  * TextSize / Thickness / ZIndex / *Transparency mit Zahlenliteral
  * CornerRadius mit Zahlenliteral -> Theme.corner(parent, Theme.Radius.*)
  * UDim.new(_, <zahl>) mit Offset ungleich 0   -> Theme.Space.* / Theme.Size.*
  * UDim2-Offsets ungleich 0 als Literal        -> Theme.Space.* / Theme.Size.*

Erlaubt bleiben Skalenanteile (0, 0.5, 1) und AnchorPoints - das sind
Layout-Verhaeltnisse, keine Design-Werte.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from api_check import strip_lua  # noqa: E402

THEME_FILE = "src/shared/Theme.luau"

NUM = r'-?\d+(?:\.\d+)?'

SIMPLE = [
    (r'\bColor3\.(fromRGB|new|fromHSV|fromHex)\s*\(', "Color3-Literal -> Theme.Color.*"),
    (r'\bEnum\.Font\.',                               "Enum.Font -> Theme.Font.*"),
    (r'\bEnum\.Material\.',                           "Enum.Material -> Theme.Material.*"),
    (r'\bTweenInfo\.new\s*\(',                        "TweenInfo.new -> Theme.tweenInfo(...)"),
    (rf'\bTextSize\s*=\s*{NUM}\b',                    "TextSize-Literal -> Theme.TextSize.*"),
    (rf'\bThickness\s*=\s*{NUM}\b',                   "Thickness-Literal -> Theme.Stroke.*"),
    (rf'\bZIndex\s*=\s*{NUM}\b',                      "ZIndex-Literal -> Theme.Layer.* / Theme.Depth.*"),
    (rf'\b\w*Transparency\s*=\s*{NUM}\b',             "Transparency-Literal -> Theme.Alpha.*"),
    (rf'\bCornerRadius\s*=\s*UDim\.new\s*\(\s*{NUM}', "CornerRadius-Literal -> Theme.corner(p, Theme.Radius.*)"),
    (rf'\bLineHeight\s*=\s*{NUM}\b',                  "LineHeight-Literal -> Theme.LineHeight.*"),
    (rf'\bReflectance\s*=\s*{NUM}\b',                 "Reflectance-Literal -> Theme.Reflectance.*"),
]

# UDim.new(scale, offset) - nur der Offset zaehlt, und nur wenn er nicht 0 ist.
UDIM = re.compile(rf'\bUDim\.new\s*\(\s*({NUM})\s*,\s*({NUM})\s*\)')
# UDim2.new(sx, ox, sy, oy)
UDIM2 = re.compile(rf'\bUDim2\.new\s*\(\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*,\s*({NUM})\s*\)')
# UDim2.fromOffset(x, y)
UDIM2_OFF = re.compile(rf'\bUDim2\.fromOffset\s*\(\s*({NUM})\s*,\s*({NUM})\s*\)')


def offsets_in(line: str):
    """Gibt alle Pixel-Offsets zurueck, die als Zahlenliteral dastehen."""
    found = []
    for m in UDIM.finditer(line):
        found.append(float(m.group(2)))
    for m in UDIM2.finditer(line):
        found += [float(m.group(2)), float(m.group(4))]
    for m in UDIM2_OFF.finditer(line):
        found += [float(m.group(1)), float(m.group(2))]
    return [v for v in found if v != 0]


def main() -> int:
    findings = []
    files = sorted((ROOT / "src").rglob("*.luau"))
    checked = 0
    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        if rel == THEME_FILE:
            continue
        checked += 1
        code = strip_lua(path.read_text(), strip_strings=True)
        for lineno, line in enumerate(code.splitlines(), start=1):
            for pattern, message in SIMPLE:
                if re.search(pattern, line):
                    findings.append(f"{rel}:{lineno}: {message}")
            for value in offsets_in(line):
                findings.append(
                    f"{rel}:{lineno}: Pixel-Offset {value:g} als Literal "
                    f"-> Theme.Space.* / Theme.Size.*")

    if findings:
        print(f"THEME-VERSTOESSE ({len(findings)}):")
        for f in findings[:80]:
            print("  -", f)
        if len(findings) > 80:
            print(f"  ... und {len(findings) - 80} weitere")
        return 1
    print(f"{checked} Module geprueft (Theme.luau ausgenommen): "
          f"kein Farb-, Schrift-, Radius-, Abstands- oder Motion-Literal.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
