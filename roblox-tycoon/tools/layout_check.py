#!/usr/bin/env python3
"""Rechnet die UI-Geometrie fuer die Zielaufloesungen nach.

Spiegelt die Formeln aus src/client/UIKit.luau (scaleFor, centeredPanel)
und src/client/HudController.luau. Ersetzt keinen Blick auf den Bildschirm,
belegt aber, dass nichts ueber den Rand laeuft und Text nicht unter die
Lesbarkeitsgrenze faellt.
"""
MIN_TEXT_PX = 11      # darunter ist Text auf einem Handy nicht mehr lesbar
MIN_TAP_PX = 30       # Mindestgroesse fuer eine Tippflaeche

def scale_for(w, h):
    if h > w:
        return max(0.72, min(w / 420, 1.15))
    if min(w, h) < 500:
        return max(0.78, min(w / 760, 1.15))
    return max(0.78, min(min(w / 1280, h / 720), 1.15))

def panel_size(w, h):
    pw, ph = w * 0.9, h * 0.84
    ratio = 0.78 if h > w else 1.45
    # AspectType.FitWithinMaxSize, DominantAxis.Width
    fh = pw / ratio
    if fh > ph:
        fh = ph
        pw = ph * ratio
    pw = max(260, min(pw, 820))
    fh = max(240, min(fh, 620))
    return pw, fh

CASES = [("Desktop", 1920, 1080), ("Tablet", 1024, 768),
         ("Handy quer", 667, 375), ("Handy hoch", 375, 667)]

print(f"{'Geraet':<12}{'Aufloesung':>12}{'Skal.':>7}{'Statusleiste':>14}"
      f"{'Knopfleiste':>14}{'Panel':>13}")
print("-" * 72)
fail = []
for name, w, h in CASES:
    s = scale_for(w, h)
    portrait = h > w
    compact = min(w, h) < 500          # gleiche Regel wie UIKit.viewportOf
    bottom_bar = portrait or compact   # gleiche Regel wie HudController.place
    stack_w, stack_h = 236 * s, 202 * s
    if bottom_bar:
        bar_w, bar_h, btn_w, btn_h, btn_text = 330 * s, 82 * s, 78 * s, 38 * s, 13 * s
    else:
        bar_w, bar_h, btn_w, btn_h, btn_text = 124 * s, (7 * 40 + 6 * 8) * s, 124 * s, 40 * s, 15 * s
    pw, ph = panel_size(w, h)

    print(f"{name:<12}{f'{w}x{h}':>12}{s:>7.2f}"
          f"{f'{stack_w:.0f}x{stack_h:.0f}':>14}"
          f"{f'{bar_w:.0f}x{bar_h:.0f}':>14}"
          f"{f'{pw:.0f}x{ph:.0f}':>13}")

    if stack_w > w - 20:        fail.append(f"{name}: Statusleiste zu breit")
    if bar_w > w - 20:          fail.append(f"{name}: Knopfleiste zu breit")
    if bottom_bar:
        # Leiste unten, Statusleiste oben: duerfen sich nicht beruehren
        if 16 + stack_h > h - 14 - bar_h:
            fail.append(f"{name}: Statusleiste und Knopfleiste ueberlappen")
    else:
        if 300 * s + bar_h > h:  fail.append(f"{name}: Knopfleiste laeuft unten raus")
        if 16 + stack_h > 300 * s:
            fail.append(f"{name}: Statusleiste ragt in die Knopfleiste")
    if pw > w or ph > h:        fail.append(f"{name}: Panel groesser als Bildschirm")
    if btn_text < MIN_TEXT_PX:  fail.append(f"{name}: Knopftext {btn_text:.1f} px < {MIN_TEXT_PX}")
    if min(btn_w, btn_h) < MIN_TAP_PX:
        fail.append(f"{name}: Tippflaeche {btn_w:.0f}x{btn_h:.0f} zu klein")
    # Grosse Zahl in der Guthabenkarte
    if 30 * s < 18:             fail.append(f"{name}: Guthabenzahl zu klein")

print("-" * 72)
if fail:
    print("LAYOUT-PROBLEME:")
    for f in fail:
        print("  -", f)
    raise SystemExit(1)
print("Alle Layouts passen: nichts laeuft ueber den Rand, kein Text unter "
      f"{MIN_TEXT_PX} px, keine Tippflaeche unter {MIN_TAP_PX} px.")
