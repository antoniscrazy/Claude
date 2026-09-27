#!/usr/bin/env python3
"""Ersetzt den generierten Upgrade-Block in src/shared/Config.luau.

Der Rest der Datei ist handgeschrieben und bleibt unangetastet - nur der
Bereich zwischen den GENERIERT-Markern kommt aus balance_sim.py. So bleibt
die Preiskurve nachrechenbar, ohne dass die Config zur Generatorausgabe wird.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONFIG = ROOT / "src" / "shared" / "Config.luau"
BEGIN = "\t-- GENERIERT-ANFANG (tools/gen_config.py) - nicht von Hand aendern\n"
END = "\t-- GENERIERT-ENDE\n"

block = subprocess.run(
    [sys.executable, str(ROOT / "tools" / "balance_sim.py"), "--emit-luau"],
    capture_output=True, text=True, check=True,
).stdout.rstrip("\n")

text = CONFIG.read_text()
start = text.index(BEGIN) + len(BEGIN)
end = text.index(END)
CONFIG.write_text(text[:start] + block + "\n" + text[end:])
print(f"Config.luau: Upgrade-Block ersetzt ({block.count('id =')} Eintraege)")
