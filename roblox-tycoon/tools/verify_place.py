#!/usr/bin/env python3
"""Prueft das erzeugte Place-File strukturell.

Kein Ersatz fuer einen Play-Test in Studio, aber es faengt genau die
Fehler ab, die eine .rbxlx unbrauchbar machen: kaputtes XML, fehlende
Services, ein Skript ohne Quelltext, eine falsche Instanzklasse.
"""
import pathlib
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
PLACE = ROOT / "TycoonGame.rbxlx"

EXPECTED_SERVICES = {
    "Workspace", "Lighting", "SoundService", "Players",
    "StarterGui", "ReplicatedStorage", "ServerScriptService", "StarterPlayer",
}
EXPECTED_PATHS = {
    "ReplicatedStorage/Shared": "Folder",
    "ServerScriptService/Server": "Folder",
    "ServerScriptService/Server/Bootstrap": "Script",
    "StarterPlayer/StarterPlayerScripts": "StarterPlayerScripts",
    "StarterPlayer/StarterPlayerScripts/Client": "Folder",
    "StarterPlayer/StarterPlayerScripts/Client/Bootstrap": "LocalScript",
}

def name_of(item):
    for prop in item.find("Properties"):
        if prop.get("name") == "Name":
            return prop.text or ""
    return ""

def source_of(item):
    for prop in item.find("Properties"):
        if prop.get("name") == "Source":
            return prop.text or ""
    return None

def walk(item, prefix, out):
    n = name_of(item)
    path = f"{prefix}/{n}" if prefix else n
    out[path] = item
    for child in item.findall("Item"):
        walk(child, path, out)

def main() -> int:
    if not PLACE.exists():
        print("TycoonGame.rbxlx fehlt - erst tools/build.py laufen lassen")
        return 1

    tree = ET.parse(PLACE)               # wirft bei kaputtem XML
    root = tree.getroot()
    if root.tag != "roblox" or root.get("version") != "4":
        print("Wurzelelement ist kein <roblox version=\"4\">")
        return 1

    nodes = {}
    for item in root.findall("Item"):
        walk(item, "", nodes)

    errors = []

    services = {p for p in nodes if "/" not in p}
    missing = EXPECTED_SERVICES - services
    if missing:
        errors.append(f"Fehlende Services: {sorted(missing)}")

    for path, cls in EXPECTED_PATHS.items():
        node = nodes.get(path)
        if node is None:
            errors.append(f"Fehlt: {path}")
        elif node.get("class") != cls:
            errors.append(f"{path}: Klasse {node.get('class')}, erwartet {cls}")

    scripts, empty = 0, []
    for path, node in nodes.items():
        cls = node.get("class")
        if cls in ("ModuleScript", "Script", "LocalScript"):
            scripts += 1
            src = source_of(node)
            if not src or len(src.strip()) < 40:
                empty.append(path)
            elif not src.lstrip().startswith("--!strict"):
                errors.append(f"{path}: fehlendes --!strict")
    if empty:
        errors.append(f"Skripte ohne Quelltext: {empty}")

    modules = sum(1 for n in nodes.values() if n.get("class") == "ModuleScript")

    if errors:
        print("PLACE-PRUEFUNG FEHLGESCHLAGEN:")
        for e in errors:
            print("  -", e)
        return 1

    print(f"Place-Pruefung OK")
    print(f"  Groesse        : {PLACE.stat().st_size:,} Bytes")
    print(f"  Instanzen      : {len(nodes)}")
    print(f"  Services       : {len(services)}")
    print(f"  Skripte gesamt : {scripts} (davon {modules} ModuleScripts)")
    print(f"  alle Skripte tragen --!strict und haben Quelltext")
    return 0

if __name__ == "__main__":
    sys.exit(main())
