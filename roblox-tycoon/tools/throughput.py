#!/usr/bin/env python3
"""Prueft, ob die Erz-Obergrenze pro Plot den simulierten Ertrag abwuergt.

Steady-State-Erzmenge = Spawnrate * Transitzeit. Liegt die ueber dem Cap,
wirft der Dropper ins Leere und das reale Einkommen bleibt unter dem
simulierten - das Balancing waere dann nur auf dem Papier korrekt.
"""
BELT_FROM, BELT_TO = -62, 59      # erster Dropper -> Sammler (studs)
DISTANCE = BELT_TO - BELT_FROM

def steady(n_droppers, interval, rate_factor, belt_speed):
    spawn = n_droppers / (interval / rate_factor)
    transit = DISTANCE / belt_speed
    return spawn, transit, spawn * transit

print(f"Bandweg Dropper->Sammler: {DISTANCE} studs\n")
print(f"{'Interval':>9}{'Dropper':>9}{'Rate':>7}{'Band':>7}{'Erz/s':>8}{'Transit':>9}{'Bestand':>9}")
for interval in (1.0, 2.0):
    for n, rate, speed in ((1, 1.0, 20), (4, 1.56, 26), (7, 2.44, 40)):
        spawn, transit, count = steady(n, interval, rate, speed)
        print(f"{interval:>9}{n:>9}{rate:>7}{speed:>7}{spawn:>8.1f}{transit:>9.1f}{count:>9.1f}")
    print()
