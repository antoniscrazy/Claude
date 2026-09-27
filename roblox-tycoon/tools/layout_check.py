#!/usr/bin/env python3
"""Rechnet die UI-Geometrie fuer die Zielaufloesungen nach.

Spiegelt die Formeln aus:
  src/client/UI/Responsive.luau   (scaleFor, minTouchSize, read)
  src/client/Screens/Hud.luau     (layout)
  src/client/UI/Components/Panel.luau (Groessen- und Seitenverhaeltnis)

Geprueft wird, was ohne laufende Engine pruefbar ist: dass nichts ueber
den Rand laeuft, dass sich HUD-Bloecke nicht ueberlappen, dass jede
Tippflaeche NACH der Skalierung ueber 44 px bleibt und dass kein Text
unter die Lesbarkeitsgrenze faellt. Schriftmetrik und Geraete-Notches
kann das nicht ersetzen.
"""
import re
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = (ROOT / "src" / "shared" / "Theme.luau").read_text()

MIN_TOUCH = 44
MIN_TEXT = 11


def token(path: str) -> float:
    """Liest einen Zahlenwert aus Theme.luau, damit die Pruefung nicht
    mit eigenen Kopien der Werte arbeitet."""
    table, key = path.split(".")
    block = re.search(rf"Theme\.{table} = \{{(.*?)\n\}}", THEME, re.S)
    assert block, f"Tabelle Theme.{table} nicht gefunden"
    m = re.search(rf"\b{key}\s*=\s*(-?[\d.]+)", block.group(1))
    assert m, f"Theme.{table}.{key} nicht gefunden"
    return float(m.group(1))


REF_W = token("ScaleRule.referenceWidth")
REF_H = token("ScaleRule.referenceHeight")
S_MIN = token("ScaleRule.min")
S_MAX = token("ScaleRule.max")
EDGE = token("Safe.edge")
BOTTOM_MOBILE = token("Safe.bottomMobile")
TOUCH_MIN = token("Size.touchMin")
PILL_W = token("Size.pillWidth")
PILL_H = token("Size.pillHeight")
HINT_W = token("Size.hintWidth")
HINT_H = token("Size.hintHeight")
PANEL_W = token("Size.panelWidth")
PANEL_H = token("Size.panelHeight")
SLOT_W = token("Size.slotWidth")
HEADER_H = token("Size.panelHeaderHeight")
SPACE8 = token("Space.x8")
SPACE32 = token("Space.x32")
SPACE48 = token("Space.x48")
TEXT_XS = token("TextSize.xs")

NAV_COUNT = 6
ASPECT_LANDSCAPE, ASPECT_PORTRAIT = 1.45, 0.78


def scale_for(w, h):
    return max(S_MIN, min(min(w / REF_W, h / REF_H), S_MAX))


def min_touch_design():
    # Responsive.minTouchSize(): so gross entworfen, dass es nach der
    # kleinsten erlaubten Skalierung noch 44 px sind.
    import math
    return math.ceil(TOUCH_MIN / S_MIN)


def panel_size(w, h):
    pw, ph = w * 0.9, h * 0.84
    ratio = ASPECT_PORTRAIT if h > w else ASPECT_LANDSCAPE
    fh = pw / ratio
    if fh > ph:
        fh, pw = ph, ph * ratio
    pw = max(SLOT_W, min(pw, PANEL_W))
    fh = max(HEADER_H * 3, min(fh, PANEL_H))
    return pw, fh


CASES = [
    ("Desktop", 1920, 1080),
    ("Laptop", 1280, 720),
    ("Tablet hoch", 820, 1180),
    ("Handy hoch", 375, 667),
    ("Handy quer", 667, 375),
]


def main() -> int:
    side = min_touch_design()
    print(f"Entwurfsgroesse Tippflaeche: {side} px "
          f"(= {TOUCH_MIN:.0f} / {S_MIN} minimale Skalierung)\n")
    header = (f"{'Geraet':<13}{'Aufloesung':>11}{'Skal.':>7}{'Tippflaeche':>13}"
              f"{'Pills':>12}{'Nav':>11}{'Panel':>12}")
    print(header)
    print("-" * len(header))

    fails = []
    for name, w, h in CASES:
        s = scale_for(w, h)
        portrait = h > w
        bottom = BOTTOM_MOBILE if portrait or min(w, h) < REF_H / 2 else EDGE

        # reale Pixel = Entwurfswert * Skalierung
        touch_real = side * s
        pill_w = (PILL_W - SPACE48) if portrait else PILL_W
        stack_w, stack_h = pill_w * s, (PILL_H * 3 + SPACE32 + SPACE8 * 3) * s
        nav_w, nav_h = side * s, NAV_COUNT * (side + SPACE8) * s
        pw, ph = panel_size(w, h)
        hint_w = min(HINT_W, w / s - EDGE / s * 2) * s

        print(f"{name:<13}{f'{w}x{h}':>11}{s:>7.2f}{touch_real:>12.0f}p"
              f"{f'{stack_w:.0f}x{stack_h:.0f}':>12}"
              f"{f'{nav_w:.0f}x{nav_h:.0f}':>11}"
              f"{f'{pw:.0f}x{ph:.0f}':>12}")

        # --- Bedingungen ---
        if touch_real < MIN_TOUCH:
            fails.append(f"{name}: Tippflaeche {touch_real:.0f} px < {MIN_TOUCH}")
        if EDGE + stack_w > w:
            fails.append(f"{name}: Waehrungs-Pills laufen rechts raus")
        if EDGE + nav_w > w:
            fails.append(f"{name}: Navigationsleiste laeuft raus")
        # Nav ist mittig verankert -> oben und unten je die Haelfte
        if nav_h / 2 > h / 2 - EDGE:
            fails.append(f"{name}: Navigationsleiste hoeher als der Bildschirm")
        # Pills oben links vs. Nav rechts: nur pruefen, ob sie sich in X treffen
        if EDGE + stack_w > w - EDGE - nav_w:
            fails.append(f"{name}: Pills und Navigationsleiste ueberlappen")
        # Hinweisbalken unten vs. Mobilsteuerung
        if bottom + HINT_H * s > h:
            fails.append(f"{name}: Hinweisbalken liegt unter dem Bildrand")
        if hint_w > w - EDGE * 2 + 1:
            fails.append(f"{name}: Hinweisbalken breiter als die Safe Area")
        if pw > w or ph > h:
            fails.append(f"{name}: Panel groesser als der Bildschirm")
        if TEXT_XS * s < MIN_TEXT:
            fails.append(f"{name}: kleinster Text {TEXT_XS * s:.1f} px < {MIN_TEXT}")
        # Der Hinweisbalken darf die untere Steuerung nicht ueberdecken
        if h - bottom - HINT_H * s < EDGE:
            fails.append(f"{name}: kein Platz zwischen Safe Area und Hinweis")

    print("-" * len(header))
    print(f"Safe Area: {EDGE:.0f} px Rand, unten {BOTTOM_MOBILE:.0f} px auf Mobilgeraeten.")
    print("Die Topbar ist ueber IgnoreGuiInset = false bereits ausgespart.")

    if fails:
        print("\nLAYOUT-PROBLEME:")
        for f in fails:
            print("  -", f)
        return 1
    print(f"\nAlle {len(CASES)} Aufloesungen bestehen: Tippflaechen >= {MIN_TOUCH} px "
          f"nach Skalierung, kein Text < {MIN_TEXT} px, nichts ausserhalb der Safe Area.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
