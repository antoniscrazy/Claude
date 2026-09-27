#!/usr/bin/env python3
"""Baut OreEmpireTycoon.rbxlx aus src/MainTycoon.server.lua."""
import pathlib

root = pathlib.Path(__file__).parent
src = (root / "src" / "MainTycoon.server.lua").read_text()
assert "]]>" not in src, "Quelltext enthaelt ']]>' und wuerde das CDATA beenden"

def item(cls, referent, props, children=""):
    return (f'\t<Item class="{cls}" referent="{referent}">\n'
            f'\t\t<Properties>\n{props}\n\t\t</Properties>\n{children}\t</Item>\n')

script = item("Script", "RBX3",
    '\t\t\t<string name="Name">MainTycoon</string>\n'
    '\t\t\t<bool name="Disabled">false</bool>\n'
    '\t\t\t<token name="RunContext">0</token>\n'
    '\t\t\t<ProtectedString name="Source"><![CDATA[' + src + ']]></ProtectedString>')
script = "".join("\t" + l if l.strip() else l for l in script.splitlines(keepends=True))

doc = ('<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" '
       'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
       'xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">\n'
       '\t<External>null</External>\n\t<External>nil</External>\n'
       + item("Workspace", "RBX1",
              '\t\t\t<string name="Name">Workspace</string>\n'
              '\t\t\t<bool name="FilteringEnabled">true</bool>\n'
              '\t\t\t<float name="Gravity">196.2</float>')
       + item("Lighting", "RBX4",
              '\t\t\t<string name="Name">Lighting</string>\n'
              '\t\t\t<token name="Technology">2</token>\n'
              '\t\t\t<float name="ClockTime">14.5</float>\n'
              '\t\t\t<float name="Brightness">2.5</float>')
       + item("Players", "RBX5",
              '\t\t\t<string name="Name">Players</string>\n'
              '\t\t\t<int name="MaxPlayersInternal">12</int>\n'
              '\t\t\t<float name="RespawnTime">4</float>\n'
              '\t\t\t<bool name="CharacterAutoLoads">true</bool>')
       + item("ServerScriptService", "RBX2",
              '\t\t\t<string name="Name">ServerScriptService</string>', script)
       + '</roblox>\n')

out = root / "OreEmpireTycoon.rbxlx"
out.write_text(doc)
print(f"OK -> {out} ({len(doc)} Bytes)")
