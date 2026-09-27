#!/usr/bin/env python3
"""Schreibt den Farbblock aus tools/contrast.py in Theme.luau.

Damit kann in Theme.luau keine Farbe stehen, die den Kontrasttest nicht
bestanden hat. Der Rest von Theme.luau ist handgeschrieben.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from contrast import PALETTE, PAIRS, ratio  # noqa: E402

THEME = ROOT / "src" / "shared" / "Theme.luau"
BEGIN = "\t-- GENERIERT-ANFANG (tools/gen_theme.py) - nicht von Hand aendern\n"
END = "\t-- GENERIERT-ENDE\n"

GROUPS = [
    ("Oberflaechen", ["bg0", "bg1", "bg2", "bg3"]),
    ("Text", ["textHigh", "textMid", "textLow"]),
    ("Primary - Aktion und Kauf", ["primary", "primaryHover", "primaryPressed", "primaryDeep"]),
    ("Success - Cash und Gewinn", ["success", "successHover", "successPressed", "successDeep"]),
    ("Gem - Hartwaehrung", ["gem", "gemHover", "gemPressed", "gemDeep"]),
    ("Premium - NUR Monetarisierung", ["premium", "premiumHover", "premiumPressed",
                                       "premiumDeep", "premiumLight"]),
    ("Warning", ["warning", "warningHover", "warningPressed", "warningDeep"]),
    ("Danger - Rebirth und Reset", ["danger", "dangerHover", "dangerPressed", "dangerDeep"]),
]


def main() -> int:
    lines = []
    for title, keys in GROUPS:
        lines.append(f"\t-- {title}")
        for key in keys:
            r, g, b = PALETTE[key]
            lines.append(f"\t{key} = Color3.fromRGB({r}, {g}, {b}),")
        lines.append("")
    block = "\n".join(lines).rstrip("\n")

    text = THEME.read_text()
    start = text.index(BEGIN) + len(BEGIN)
    end = text.index(END)
    THEME.write_text(text[:start] + block + "\n" + text[end:])

    worst = min(ratio(PALETTE[f], PALETTE[b]) for f, b in PAIRS)
    print(f"Theme.luau: {len(PALETTE)} Farben geschrieben, "
          f"schlechtestes Kontrastverhaeltnis {worst:.2f}:1")
    return 0


if __name__ == "__main__":
    sys.exit(main())
