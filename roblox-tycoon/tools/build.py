#!/usr/bin/env python3
"""
Build-Werkzeug fuer "Bergbau-Imperium".

Eine einzige Baumdefinition (TREE) erzeugt drei Artefakte:
  1. default.project.json  – Rojo-Projekt zum Versionieren / `rojo build`
  2. sourcemap.json        – damit luau-lsp require() aufloesen und strikt
                             typpruefen kann (sonst kennt er die Module nicht)
  3. TycoonGame.rbxlx      – fertiges Place-File zum Doppelklick-Oeffnen

Aufruf:  python3 tools/build.py [--check]
"""
from __future__ import annotations
import json
import pathlib
import sys
import xml.sax.saxutils as sax

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Baumdefinition
# ---------------------------------------------------------------------------
# Jeder Eintrag: (Instanzname, Klasse, Quelldatei | None, [Kinder])
# Klassen: Folder, ModuleScript, Script, LocalScript oder ein Service-Name.

# Der Quellbaum wird AUTOMATISCH aus src/ gelesen, damit neue Module und
# Unterordner nicht an zwei Stellen gepflegt werden muessen.
#   Ordner              -> Folder
#   X.server.luau       -> Script
#   X.client.luau       -> LocalScript
#   X.luau              -> ModuleScript
# Innerhalb eines Ordners kommen Dateien vor Unterordnern, beides sortiert.

# Service-Eigenschaften, die im Place gesetzt sein sollen.
SERVICE_PROPS = {
    "Workspace": [
        ("bool", "FilteringEnabled", "true"),
        ("float", "Gravity", "196.2"),
        # StreamingEnabled ist bewusst AN: der Code ist streaming-kompatibel
        # (Server haelt keine Referenzen auf clientseitig gestreamte Teile).
        ("bool", "StreamingEnabled", "true"),
        ("int", "StreamingTargetRadius", "512"),
    ],
    "Lighting": [
        ("token", "Technology", "4"),          # Enum.Technology.Future
        ("float", "ClockTime", "15"),
        ("float", "Brightness", "2"),
        ("float", "ExposureCompensation", "0.15"),
        ("float", "EnvironmentDiffuseScale", "0.6"),
        ("float", "EnvironmentSpecularScale", "0.5"),
        ("bool", "GlobalShadows", "true"),
        ("Color3", "OutdoorAmbient", ("0.42", "0.44", "0.5")),
    ],
    "Players": [
        ("int", "MaxPlayersInternal", "12"),
        ("float", "RespawnTime", "3"),
        ("bool", "CharacterAutoLoads", "true"),
    ],
    "SoundService": [
        ("bool", "RespectFilteringEnabled", "true"),
    ],
    "ReplicatedStorage": [],
    "ServerScriptService": [],
    "StarterGui": [
        ("bool", "ResetPlayerGuiOnSpawn", "false"),
    ],
}


def node(name, cls, src=None, children=None):
    return {"name": name, "class": cls, "src": src, "children": children or []}


def scan(directory: pathlib.Path):
    """Liest einen Quellordner rekursiv in Instanzknoten ein."""
    out = []
    for path in sorted(directory.iterdir(), key=lambda p: (p.is_dir(), p.name.lower())):
        rel = path.relative_to(ROOT).as_posix()
        if path.is_dir():
            out.append(node(path.name, "Folder", None, scan(path)))
        elif path.name.endswith(".server.luau"):
            out.append(node(path.name[: -len(".server.luau")], "Script", rel))
        elif path.name.endswith(".client.luau"):
            out.append(node(path.name[: -len(".client.luau")], "LocalScript", rel))
        elif path.suffix == ".luau":
            out.append(node(path.stem, "ModuleScript", rel))
    return out


def build_tree():
    shared = scan(ROOT / "src" / "shared")
    server = scan(ROOT / "src" / "server")
    client = scan(ROOT / "src" / "client")

    return [
        node("Workspace", "Workspace"),
        node("Lighting", "Lighting"),
        node("SoundService", "SoundService"),
        node("Players", "Players"),
        node("StarterGui", "StarterGui"),
        node("ReplicatedStorage", "ReplicatedStorage", None,
             [node("Shared", "Folder", None, shared)]),
        node("ServerScriptService", "ServerScriptService", None,
             [node("Server", "Folder", None, server)]),
        node("StarterPlayer", "StarterPlayer", None,
             [node("StarterPlayerScripts", "StarterPlayerScripts", None,
                   [node("Client", "Folder", None, client)])]),
    ]


# ---------------------------------------------------------------------------
# 1. Rojo-Projekt
# ---------------------------------------------------------------------------

def write_rojo():
    proj = {
        "name": "BergbauImperium",
        "tree": {
            "$className": "DataModel",
            "Workspace": {"$className": "Workspace",
                          "$properties": {"FilteringEnabled": True,
                                          "StreamingEnabled": True}},
            "Lighting": {"$className": "Lighting",
                         "$properties": {"Technology": "Future", "ClockTime": 15,
                                         "Brightness": 2, "GlobalShadows": True}},
            "SoundService": {"$className": "SoundService",
                             "$properties": {"RespectFilteringEnabled": True}},
            "Players": {"$className": "Players",
                        "$properties": {"RespawnTime": 3, "CharacterAutoLoads": True}},
            "StarterGui": {"$className": "StarterGui",
                           "$properties": {"ResetPlayerGuiOnSpawn": False}},
            "ReplicatedStorage": {"$className": "ReplicatedStorage",
                                  "Shared": {"$path": "src/shared"}},
            "ServerScriptService": {"$className": "ServerScriptService",
                                    "Server": {"$path": "src/server"}},
            "StarterPlayer": {
                "$className": "StarterPlayer",
                "StarterPlayerScripts": {"$className": "StarterPlayerScripts",
                                         "Client": {"$path": "src/client"}},
            },
        },
    }
    (ROOT / "default.project.json").write_text(json.dumps(proj, indent=2) + "\n")


# ---------------------------------------------------------------------------
# 2. Sourcemap fuer luau-lsp
# ---------------------------------------------------------------------------

def to_sourcemap(n):
    out = {"name": n["name"], "className": n["class"]}
    if n["src"]:
        out["filePaths"] = [n["src"]]
    if n["children"]:
        out["children"] = [to_sourcemap(c) for c in n["children"]]
    return out


def write_sourcemap(tree):
    sm = {"name": "BergbauImperium", "className": "DataModel",
          "children": [to_sourcemap(n) for n in tree]}
    (ROOT / "sourcemap.json").write_text(json.dumps(sm, indent=1) + "\n")


# ---------------------------------------------------------------------------
# 3. rbxlx
# ---------------------------------------------------------------------------

_ref = [0]


def next_ref() -> str:
    _ref[0] += 1
    return f"RBX{_ref[0]}"


def prop_xml(p, indent: str) -> str:
    kind, name, val = p
    if kind == "Color3":
        r, g, b = val
        return (f'{indent}<Color3 name="{name}"><R>{r}</R><G>{g}</G><B>{b}</B></Color3>')
    return f'{indent}<{kind} name="{name}">{val}</{kind}>'


def item_xml(n, depth: int) -> str:
    ind = "\t" * (depth + 1)
    pind = ind + "\t\t"
    props = [f'{pind}<string name="Name">{sax.escape(n["name"])}</string>']
    for p in SERVICE_PROPS.get(n["class"], []) if n["src"] is None else []:
        props.append(prop_xml(p, pind))
    if n["class"] in ("ModuleScript", "Script", "LocalScript"):
        source = (ROOT / n["src"]).read_text()
        if "]]>" in source:
            raise SystemExit(f"{n['src']}: enthaelt ']]>' und wuerde das CDATA beenden")
        props.append(f'{pind}<bool name="Disabled">false</bool>')
        if n["class"] == "Script":
            props.append(f'{pind}<token name="RunContext">0</token>')  # Legacy = Server
        props.append(f'{pind}<ProtectedString name="Source"><![CDATA[{source}]]></ProtectedString>')

    body = "\n".join(props)
    kids = "".join(item_xml(c, depth + 1) for c in n["children"])
    return (f'{ind}<Item class="{n["class"]}" referent="{next_ref()}">\n'
            f'{ind}\t<Properties>\n{body}\n{ind}\t</Properties>\n'
            f'{kids}{ind}</Item>\n')


def write_place(tree):
    body = "".join(item_xml(n, 0) for n in tree)
    doc = ('<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" '
           'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
           'xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" '
           'version="4">\n\t<External>null</External>\n\t<External>nil</External>\n'
           + body + '</roblox>\n')
    out = ROOT / "TycoonGame.rbxlx"
    out.write_text(doc)
    return out, len(doc)


def main():
    tree = build_tree()
    missing = []

    def walk(n):
        if n["src"] and not (ROOT / n["src"]).exists():
            missing.append(n["src"])
        for c in n["children"]:
            walk(c)
    for n in tree:
        walk(n)

    write_rojo()
    write_sourcemap(tree)

    if missing:
        print("Fehlende Quelldateien (rbxlx wird NICHT gebaut):")
        for m in missing:
            print("  -", m)
        if "--check" in sys.argv:
            return 0
        return 1

    out, size = write_place(tree)
    import xml.etree.ElementTree as ET
    ET.parse(out)                      # harte Validierung: muss parsen
    print(f"default.project.json + sourcemap.json geschrieben")
    print(f"{out.name}: {size:,} Bytes, XML valide")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
