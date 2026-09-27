#!/usr/bin/env python3
"""Palette + Kontrastnachweis (WCAG 2.1 relative Luminanz).

Die Palette wird HIER definiert und geprueft, danach von tools/gen_theme.py
in Theme.luau geschrieben. So kann in der Luau-Datei keine Farbe stehen,
die den Kontrasttest nicht bestanden hat.
"""
import colorsys
import sys

# ---------------------------------------------------------------------------
# Drei Farbfamilien, mehr nicht:
#   Indigo (Oberflaechen, primary, gem) | Mint (success) | Warm (premium/warning/danger)
# ---------------------------------------------------------------------------
PALETTE = {
    # Oberflaechen - jede Stufe deutlich heller, leicht nach Indigo gekippt
    "bg0": (12, 13, 20),
    "bg1": (20, 22, 33),
    "bg2": (29, 32, 47),
    "bg3": (41, 45, 64),

    # Text - warmes Weiss, keine reine 255
    "textHigh": (243, 243, 249),
    "textMid": (183, 188, 208),
    "textLow": (146, 152, 176),

    # Primary (Indigo) - Aktion, Kauf
    "primary": (128, 144, 247),
    "primaryHover": (157, 169, 249),
    "primaryPressed": (92, 112, 245),
    "primaryDeep": (33, 54, 189),

    # Success / Cash (Mint)
    "success": (48, 207, 149),
    "successHover": (73, 212, 161),
    "successPressed": (41, 176, 126),
    "successDeep": (26, 76, 58),

    # Gem - gleiche Indigo-Familie, ueber Helligkeit klar von primary getrennt
    "gem": (167, 192, 251),
    "gemHover": (196, 213, 253),
    "gemPressed": (130, 166, 250),
    "gemDeep": (42, 96, 223),

    # Premium / Gold (Warm) - AUSSCHLIESSLICH Monetarisierung
    "premium": (235, 163, 20),
    "premiumHover": (237, 174, 49),
    "premiumPressed": (199, 139, 17),
    "premiumDeep": (85, 62, 17),
    "premiumLight": (250, 210, 120),

    # Warning (Warm)
    "warning": (236, 135, 19),
    "warningHover": (238, 149, 47),
    "warningPressed": (200, 115, 16),
    "warningDeep": (86, 53, 16),

    # Danger (Warm, nach Rot gedreht) - Rebirth / Reset
    "danger": (237, 86, 69),
    "dangerHover": (239, 111, 97),
    "dangerPressed": (233, 54, 35),
    "dangerDeep": (127, 36, 26),
}

# Welcher Text liegt im Entwurf auf welcher Flaeche?
PAIRS = [
    ("textHigh", "bg0"), ("textHigh", "bg1"), ("textHigh", "bg2"), ("textHigh", "bg3"),
    ("textMid", "bg0"), ("textMid", "bg1"), ("textMid", "bg2"), ("textMid", "bg3"),
    ("textLow", "bg0"), ("textLow", "bg1"), ("textLow", "bg2"), ("textLow", "bg3"),
    ("primary", "bg1"), ("primary", "bg2"),
    ("success", "bg1"), ("success", "bg2"),
    ("gem", "bg1"), ("gem", "bg2"),
    ("premium", "bg1"), ("premium", "bg2"),
    ("warning", "bg2"), ("danger", "bg1"), ("danger", "bg2"),
    # Text AUF gefuellten Knoepfen
    ("bg0", "primary"), ("bg0", "success"), ("bg0", "premium"),
    ("bg0", "warning"), ("bg0", "danger"), ("bg0", "gem"),
    ("premiumLight", "bg1"), ("premiumLight", "bg2"),
    # Gefuellte Knoepfe behalten ueber alle Zustaende DIESELBE Textfarbe
    # (bg0). Ein Farbwechsel des Labels beim Druecken flackert sichtbar.
    # Deshalb wird bg0 gegen idle, hover UND pressed geprueft.
    ("bg0", "primaryHover"), ("bg0", "primaryPressed"),
    ("bg0", "successHover"), ("bg0", "successPressed"),
    ("bg0", "premiumHover"), ("bg0", "premiumPressed"),
    ("bg0", "warningHover"), ("bg0", "warningPressed"),
    ("bg0", "dangerHover"), ("bg0", "dangerPressed"),
    ("bg0", "gemHover"), ("bg0", "gemPressed"),
    # Umrandete (ghost/secondary) Knoepfe: Akzenttext auf Kartenflaeche
    ("primaryHover", "bg2"), ("dangerHover", "bg2"),
]

MIN_RATIO = 4.5


def _lin(c: float) -> float:
    c /= 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminance(rgb) -> float:
    r, g, b = (_lin(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def hue_of(rgb):
    h, _l, s = colorsys.rgb_to_hls(*[v / 255 for v in rgb])
    return h * 360, s


def main() -> int:
    print("KONTRAST (WCAG 2.1, Schwelle 4.5:1)\n")
    print(f"{'Vordergrund':<16}{'auf':<4}{'Hintergrund':<14}{'Verhaeltnis':>12}  Status")
    print("-" * 62)
    failed = []
    for fg, bg in PAIRS:
        r = ratio(PALETTE[fg], PALETTE[bg])
        ok = r >= MIN_RATIO
        if not ok:
            failed.append((fg, bg, r))
        print(f"{fg:<16}{'auf':<4}{bg:<14}{r:>11.2f}:1  {'ok' if ok else 'ZU NIEDRIG'}")

    print("\nFARBFAMILIEN (Hue-Winkel der gesaettigten Toene)")
    print("-" * 62)
    families = {"Indigo": [], "Mint": [], "Warm": []}
    for name, rgb in PALETTE.items():
        h, s = hue_of(rgb)
        if s < 0.25 and name.startswith(("bg", "text")):
            fam = "Indigo"          # entsaettigte Oberflaechen, indigo-gekippt
        elif 120 <= h <= 190:
            fam = "Mint"
        elif h < 60 or h > 330:
            fam = "Warm"
        else:
            fam = "Indigo"
        families[fam].append((name, round(h)))
    for fam, items in families.items():
        span = [h for _n, h in items]
        print(f"  {fam:<8} {len(items):>2} Toene, Hue {min(span):>3}-{max(span):>3} Grad")
    print(f"  -> {len(families)} Familien (Grenze: 3)")

    print("\nOBERFLAECHEN-ABSTUFUNG (HSL-Helligkeit, Prozentpunkte)")
    print("-" * 62)
    print("  Hinweis: gemessen wird HSL-Lightness, nicht relative Luminanz.")
    print("  Ein Schritt von '+6-10% relativer Luminanz' waere auf einem so")
    print("  dunklen Grund (L=6%) unsichtbar - das sind Bruchteile eines")
    print("  RGB-Wertes. Dark-Ramps werden in Lightness-Prozentpunkten gebaut.")
    steps = ["bg0", "bg1", "bg2", "bg3"]
    for a, b in zip(steps, steps[1:]):
        la = colorsys.rgb_to_hls(*[v / 255 for v in PALETTE[a]])[1] * 100
        lb = colorsys.rgb_to_hls(*[v / 255 for v in PALETTE[b]])[1] * 100
        print(f"  {a} (L={la:.1f}%) -> {b} (L={lb:.1f}%): +{lb - la:.1f} Prozentpunkte")

    if failed:
        print(f"\n{len(failed)} PAARE UNTER 4.5:1 - Palette nachbessern")
        return 1
    print(f"\nAlle {len(PAIRS)} Paare bestehen 4.5:1.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
