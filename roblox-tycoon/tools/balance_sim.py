#!/usr/bin/env python3
"""
Balancing-Solver fuer "Bergbau-Imperium".

Vorgehen:
  1. Die Struktur des Upgrade-Baums (welches Upgrade auf welchem Rang) steht fest.
  2. Der Preis folgt der geforderten Kurve  price(r) = BASE * FACTOR^(r-1),
     FACTOR = 1.55.
  3. Gesucht ist der Einkommens-Zuwachsfaktor g pro einkommenswirksamem Upgrade,
     sodass die Zeit bis Rebirth 1 im Zielfenster 25-35 min landet.
     g wird per Bisektion geloest, nicht geraten.
  4. Die Dropper-Werte werden aus g rueckgerechnet, Rate-Upgrades sind bei 1.25
     gedeckelt (sonst spawnen zu viele Teile -> Performance), der Fehlbetrag
     wird auf den jeweils naechsten Dropper umgelegt.
  5. Danach werden alle Werte gerundet und die Simulation mit den GERUNDETEN
     Werten erneut gefahren - nur dieses Ergebnis wird berichtet.
"""
import math

PRICE_BASE = 200.0
PRICE_FACTOR = 1.55
START_VALUE = 20.0        # Wert des Gratis-Start-Droppers
START_INTERVAL = 2.0      # Sekunden zwischen zwei Drops
# 2 s statt 1 s bei doppeltem Erzwert: gleiches Einkommen, aber nur halb so
# viele gleichzeitige Teile. Mit 1 s liegt der Endausbau bei ~52 Erzen pro
# Plot und wuerde am Limit (45) abgeschnitten - siehe tools/throughput.py.
RATE_CAP = 1.25           # max. Beschleunigung pro Rate-Upgrade (Performance)
REBIRTH_1_COST = 1_000_000

# Rang -> (id, art). art: dropper | upgrader | rate | collector | speed | cosmetic
# speed/cosmetic sind bewusst einkommensneutral (Gating + Optik + Durchsatz).
LAYOUT = [
    ("dropper_2",   "dropper"),  ("conveyor_1",  "speed"),
    ("upgrader_1",  "upgrader"), ("dropper_3",   "dropper"),
    ("rate_1",      "rate"),     ("collector_1", "collector"),
    ("upgrader_2",  "upgrader"), ("dropper_4",   "dropper"),
    ("walls",       "cosmetic"), ("rate_2",      "rate"),
    ("conveyor_2",  "speed"),    ("upgrader_3",  "upgrader"),
    ("dropper_5",   "dropper"),  ("collector_2", "collector"),
    ("roof",        "cosmetic"), ("rate_3",      "rate"),
    ("upgrader_4",  "upgrader"), ("dropper_6",   "dropper"),
    ("conveyor_3",  "speed"),    ("collector_3", "collector"),
    ("lights",      "cosmetic"), ("rate_4",      "rate"),
    ("upgrader_5",  "upgrader"), ("dropper_7",   "dropper"),
    ("vip_room",    "cosmetic"),
]
INCOME_KINDS = {"dropper", "upgrader", "rate", "collector"}


def price(rank: int) -> int:
    """Preis auf 3 signifikante Stellen gerundet - liest sich im Spiel besser."""
    raw = PRICE_BASE * (PRICE_FACTOR ** (rank - 1))
    mag = 10 ** max(0, int(math.floor(math.log10(raw))) - 2)
    return int(round(raw / mag) * mag)


def derive(g: float, rounded: bool):
    """Leitet aus dem Zielfaktor g die konkreten Upgrade-Werte ab."""
    out = {}
    base_sum = START_VALUE / START_INTERVAL   # Roh-Einkommen aller Dropper
    debt = 1.0                                # aufgelaufener Fehlbetrag der Rate-Caps
    for rank, (uid, kind) in enumerate(LAYOUT, start=1):
        if kind == "dropper":
            want = g * debt
            debt = 1.0
            value = base_sum * (want - 1.0) * START_INTERVAL
            if rounded:
                mag = 10 ** max(0, int(math.floor(math.log10(max(value, 1)))) - 1)
                value = max(1, round(value / mag) * mag)
            out[uid] = {"value": value, "interval": START_INTERVAL}
            base_sum += value / START_INTERVAL
        elif kind == "rate":
            f = min(RATE_CAP, g)
            debt *= g / f
            out[uid] = {"factor": round(f, 3) if rounded else f}
        elif kind == "upgrader":
            m = g * debt
            debt = 1.0
            out[uid] = {"mult": round(m, 2) if rounded else m}
        elif kind == "collector":
            m = g * debt
            debt = 1.0
            out[uid] = {"mult": round(m, 2) if rounded else m}
        else:
            out[uid] = {}
    return out


def run(values):
    """Fahrt die Kaufreihenfolge ab und misst Zeit + Schritt-Spruenge."""
    dropper_sum = START_VALUE / START_INTERVAL
    rate, upg, coll = 1.0, 1.0, 1.0
    t, rows, prev, worst = 0.0, [], None, (0.0, "-")
    prefix = []

    def income():
        return dropper_sum * rate * upg * coll

    for rank, (uid, kind) in enumerate(LAYOUT, start=1):
        p, inc = price(rank), income()
        step = p / inc
        if prev is not None and step / prev > worst[0]:
            worst = (step / prev, uid)
        prev = step
        t += step
        v = values[uid]
        if kind == "dropper":
            dropper_sum += v["value"] / v["interval"]
        elif kind == "rate":
            rate *= v["factor"]
        elif kind in ("upgrader", "collector"):
            upg *= v["mult"] if kind == "upgrader" else 1.0
            coll *= v["mult"] if kind == "collector" else 1.0
        rows.append((uid, kind, rank, p, inc, step, t))
        prefix.append(income())

    # Ein Spieler rebirtht, sobald es sich lohnt - Optimum ueber alle Praefixe.
    t_reb, best_k = min(
        (rows[k][6] + REBIRTH_1_COST / prefix[k], k) for k in range(len(rows))
    )
    return t_reb, rows, worst, best_k, prefix[-1]


def solve() -> float:
    """Bisektion auf g, Ziel: Rebirth 1 nach 30 Minuten."""
    lo, hi = 1.05, 4.0
    for _ in range(80):
        mid = (lo + hi) / 2
        t_reb, *_ = run(derive(mid, rounded=False))
        # groesseres g -> mehr Einkommen -> schneller
        if t_reb / 60 > 30.0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def report():
    g = solve()
    values = derive(g, rounded=True)          # gerundete, spielbare Zahlen
    t_reb, rows, worst, best_k, final_inc = run(values)

    print(f"Geloester Einkommensfaktor g pro Einkommens-Upgrade: {g:.4f}")
    print(f"Preiskurve: {PRICE_BASE:.0f} * {PRICE_FACTOR}^(Rang-1)\n")
    hdr = f"{'#':>3} {'Upgrade':<12}{'Art':<10}{'Preis':>12}{'$/s davor':>12}{'Sek':>8}{'Min':>8}  Effekt"
    print(hdr); print("-" * len(hdr))
    for uid, kind, rank, p, inc, step, t in rows:
        v = values[uid]
        eff = (f"Wert {v['value']:g} alle {v['interval']:g}s" if kind == "dropper" else
               f"x{v['mult']:g} auf Erzwert"                  if kind == "upgrader" else
               f"x{v['mult']:g} auf Auszahlung"               if kind == "collector" else
               f"Drops x{v['factor']:g} schneller"            if kind == "rate" else
               "Bandtempo / Durchsatz"                        if kind == "speed" else
               "Optik + Freischaltung")
        print(f"{rank:>3} {uid:<12}{kind:<10}{p:>12,}{inc:>12,.1f}{step:>8.0f}{t/60:>8.1f}  {eff}")
    print("-" * len(hdr))
    print(f"Erster Kauf moeglich nach      : {rows[0][5]:.0f} s        (Ziel < 45 s)")
    print(f"Alle 25 Upgrades gekauft nach  : {rows[-1][6]/60:.1f} min")
    print(f"Einkommen am Ende              : {final_inc:,.0f} $/s")
    print(f"Rebirth 1 ({REBIRTH_1_COST:,} $) nach : {t_reb/60:.1f} min "
          f"(optimal nach {best_k+1}/25 Upgrades)   (Ziel 25-35 min)")
    print(f"Groesster Schritt-Sprung       : {worst[0]:.2f}x bei '{worst[1]}'  (Schranke 2.50x)")
    ok = (rows[0][5] < 45) and (25 <= t_reb/60 <= 35) and worst[0] <= 2.5
    print("\nALLE BALANCING-ZIELE ERFUELLT" if ok else "\nZIELE VERFEHLT")
    return values, rows


import sys
if __name__ == "__main__" and "--emit-luau" not in sys.argv and "--emit-markdown" not in sys.argv:
    report()


# --------------------------------------------------------------------------
# Luau-Export: erzeugt die Upgrade-Tabelle fuer shared/Config.luau,
# damit die simulierten Zahlen 1:1 im Spiel landen (keine Abtippfehler).
# --------------------------------------------------------------------------
LABELS = {
    "dropper_2": ("Zweiter Bohrer",     "Ein weiterer Bohrer am Band"),
    "conveyor_1": ("Band Stufe I",      "Hoeherer Durchsatz auf dem Band"),
    "upgrader_1": ("Schmelzofen I",     "Veredelt jedes Erz beim Durchfahren"),
    "dropper_3": ("Dritter Bohrer",     "Noch ein Bohrer am Band"),
    "rate_1":    ("Bohrkopf I",         "Alle Bohrer foerdern schneller"),
    "collector_1":("Waage I",           "Der Sammler zahlt mehr aus"),
    "upgrader_2":("Schmelzofen II",     "Zweite Veredelungsstufe"),
    "dropper_4": ("Vierter Bohrer",     "Ein Bohrer mehr"),
    "walls":     ("Hallenwaende",       "Schliesst die Fabrikhalle ein"),
    "rate_2":    ("Bohrkopf II",        "Bohrer foerdern noch schneller"),
    "conveyor_2":("Band Stufe II",      "Schnelleres Foerderband"),
    "upgrader_3":("Schmelzofen III",    "Dritte Veredelungsstufe"),
    "dropper_5": ("Fuenfter Bohrer",    "Ein Bohrer mehr"),
    "collector_2":("Waage II",          "Der Sammler zahlt noch mehr aus"),
    "roof":      ("Hallendach",         "Setzt der Halle ein Dach auf"),
    "rate_3":    ("Bohrkopf III",       "Bohrer foerdern noch schneller"),
    "upgrader_4":("Schmelzofen IV",     "Vierte Veredelungsstufe"),
    "dropper_6": ("Sechster Bohrer",    "Ein Bohrer mehr"),
    "conveyor_3":("Band Stufe III",     "Maximales Bandtempo"),
    "collector_3":("Waage III",         "Maximale Auszahlung"),
    "lights":    ("Hallenbeleuchtung",  "Flutlicht fuer die Halle"),
    "rate_4":    ("Bohrkopf IV",        "Maximale Foerdergeschwindigkeit"),
    "upgrader_5":("Schmelzofen V",      "Fuenfte Veredelungsstufe"),
    "dropper_7": ("Siebter Bohrer",     "Der letzte Bohrer"),
    "vip_room":  ("VIP-Lounge",         "Oeffnet den VIP-Bereich auf dem Plot"),
}
# Abhaengigkeitsbaum: Button erscheint erst, wenn ALLE Requires gekauft sind.
REQUIRES = {
    "dropper_2": [], "conveyor_1": ["dropper_2"], "upgrader_1": ["conveyor_1"],
    "dropper_3": ["upgrader_1"], "rate_1": ["dropper_3"], "collector_1": ["rate_1"],
    "upgrader_2": ["collector_1"], "dropper_4": ["upgrader_2"], "walls": ["dropper_4"],
    "rate_2": ["walls"], "conveyor_2": ["rate_2"], "upgrader_3": ["conveyor_2"],
    "dropper_5": ["upgrader_3"], "collector_2": ["dropper_5"], "roof": ["collector_2", "walls"],
    "rate_3": ["roof"], "upgrader_4": ["rate_3"], "dropper_6": ["upgrader_4"],
    "conveyor_3": ["dropper_6"], "collector_3": ["conveyor_3"], "lights": ["collector_3", "roof"],
    "rate_4": ["lights"], "upgrader_5": ["rate_4"], "dropper_7": ["upgrader_5"],
    "vip_room": ["dropper_7"],
}
CONVEYOR_SPEED = {"conveyor_1": 26, "conveyor_2": 32, "conveyor_3": 40}


def emit_luau() -> str:
    g = solve()
    values = derive(g, rounded=True)
    _, rows, _, _, _ = run(values)
    lines = []
    for uid, kind, rank, p, *_ in rows:
        v = values[uid]
        label, desc = LABELS[uid]
        req = "{" + ", ".join(f'"{r}"' for r in REQUIRES[uid]) + "}"
        if kind == "dropper":
            eff = f'{{ kind = "dropper", value = {v["value"]:g}, interval = {v["interval"]:g} }}'
        elif kind == "upgrader":
            eff = f'{{ kind = "upgrader", mult = {v["mult"]:g} }}'
        elif kind == "collector":
            eff = f'{{ kind = "collector", mult = {v["mult"]:g} }}'
        elif kind == "rate":
            eff = f'{{ kind = "rate", factor = {v["factor"]:g} }}'
        elif kind == "speed":
            eff = f'{{ kind = "speed", speed = {CONVEYOR_SPEED[uid]} }}'
        else:
            eff = '{ kind = "cosmetic" }'
        lines.append(
            f'\t{{ id = "{uid}", rank = {rank}, price = {p}, requires = {req},\n'
            f'\t  label = "{label}", desc = "{desc}",\n'
            f'\t  effect = {eff} }},'
        )
    return "\n".join(lines)


if __name__ == "__main__" and "--emit-luau" in sys.argv:
    print(emit_luau())


def emit_markdown() -> str:
    g = solve()
    values = derive(g, rounded=True)
    t_reb, rows, worst, best_k, final_inc = run(values)
    out = []
    out.append("| # | Upgrade | Art | Preis $ | $/s davor | Sek | Min ges. | Effekt |")
    out.append("|--:|---|---|--:|--:|--:|--:|---|")
    for uid, kind, rank, p, inc, step, t in rows:
        v = values[uid]
        if kind == "dropper":
            eff = f"Wert {v['value']:g} alle {v['interval']:g} s"
        elif kind in ("upgrader", "collector"):
            eff = f"x{v['mult']:g} " + ("auf Erzwert" if kind == "upgrader" else "auf Auszahlung")
        elif kind == "rate":
            eff = f"Drops x{v['factor']:g} schneller"
        elif kind == "speed":
            eff = f"Band {CONVEYOR_SPEED[uid]} studs/s"
        else:
            eff = "Optik / Freischaltung"
        out.append(f"| {rank} | {LABELS[uid][0]} | {kind} | {p:,} | {inc:,.1f} "
                   f"| {step:.0f} | {t/60:.1f} | {eff} |".replace(",", "."))
    out.append("")
    out.append(f"- Startdropper (gratis): Wert {START_VALUE:g} alle {START_INTERVAL:g} s "
               f"= {START_VALUE/START_INTERVAL:g} $/s")
    out.append(f"- Preiskurve: `{PRICE_BASE:.0f} x {PRICE_FACTOR}^(Rang-1)`, auf 3 signifikante Stellen gerundet")
    out.append(f"- Einkommensfaktor je einkommenswirksamem Upgrade: **{g:.4f}** (per Bisektion auf das 30-Minuten-Ziel geloest)")
    out.append(f"- Erster Kauf moeglich nach: **{rows[0][5]:.0f} s** (Ziel < 45 s)")
    out.append(f"- Rebirth 1 ({REBIRTH_1_COST:,} $): **{t_reb/60:.1f} min** ".replace(",", ".")
               + f"(optimal nach {best_k+1} von 25 Upgrades; Ziel 25-35 min)")
    out.append(f"- Alle 25 Upgrades: {rows[-1][6]/60:.1f} min, Endeinkommen {final_inc:,.0f} $/s".replace(",", "."))
    out.append(f"- Groesster Schritt-Sprung: **{worst[0]:.2f}x** bei `{worst[1]}` (Schranke 2,50x)")
    return "\n".join(out)


if __name__ == "__main__" and "--emit-markdown" in sys.argv:
    print(emit_markdown())
