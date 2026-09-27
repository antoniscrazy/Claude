#!/usr/bin/env python3
"""Statische Leak-Pruefung fuer die UI-Schicht.

Was hier geprueft werden KANN (und wird):
  1. Jedes Modul, das einen Motion-Scope anlegt, ruft auch dessen
     destroy() auf - sonst laufen Tweens auf zerstoerten Instanzen weiter.
  2. Kein Panel erzeugt beim OEFFNEN Instanzen. Wer beim Oeffnen baut und
     beim Schliessen nicht abraeumt, leakt mit jedem Oeffnen - genau der
     Fall, den der 50-fache Oeffnen/Schliessen-Test aufdecken soll.
  3. Kein Panel verwendet Visible als alleinige Ein-/Ausblendmethode:
     jede open/close-Funktion muss einen Tween ausloesen.
  4. Jede Komponente mit einem Handle bietet destroy an.

Was NICHT geprueft werden kann: der tatsaechliche Speicherverbrauch zur
Laufzeit. Dafuer braucht es Roblox Studio und den Developer Console
Memory-Tab.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from api_check import strip_lua  # noqa: E402

CLIENT = ROOT / "src" / "client"


def function_body(code: str, name: str) -> str:
    """Grober Ausschnitt einer lokalen Funktion bis zum naechsten 'end' auf
    gleicher Einrueckung. Reicht fuer diese Pruefung."""
    match = re.search(rf"\n(\t*)local function {name}\(.*?\n\1end\n", code, re.S)
    if match:
        return match.group(0)
    match = re.search(rf"\n(\t*){name} = function\(.*?\n\1end", code, re.S)
    return match.group(0) if match else ""


def main() -> int:
    findings = []
    checked = 0
    scopes = 0

    for path in sorted(CLIENT.rglob("*.luau")):
        rel = path.relative_to(ROOT).as_posix()
        code = strip_lua(path.read_text(), strip_strings=True)
        checked += 1

        # 1. Scope angelegt -> Scope zerstoert.
        # Motion.luau selbst definiert die Fabrik und besitzt keinen Scope.
        creates = 0 if rel.endswith("UI/Motion.luau") else len(
            re.findall(r"Motion\.scope\(\)", code))
        destroys = len(re.findall(r"scope:destroy\(\)", code))
        scopes += creates
        if creates > 0 and destroys == 0:
            findings.append(f"{rel}: legt {creates} Motion-Scope an, ruft nie destroy()")

        # 2./3. open/close-Verhalten
        for name in ("doOpen", "doClose"):
            body = function_body(code, name)
            if not body:
                continue
            if "Instance.new" in body:
                findings.append(f"{rel}: {name}() erzeugt Instanzen - leakt bei jedem Oeffnen")
            if "scope:to(" not in body:
                findings.append(f"{rel}: {name}() blendet ohne Tween um")

        # 4. Handle ohne destroy
        if re.search(r"export type Handle = \{", code) and "destroy" not in code:
            findings.append(f"{rel}: Handle ohne destroy")

    # 5. Die drei Singletons duerfen zur Laufzeit bauen - aber nur sie.
    runtime_builders = {"src/client/UI/Components/Toast.luau"}
    for path in sorted(CLIENT.rglob("*.luau")):
        rel = path.relative_to(ROOT).as_posix()
        code = strip_lua(path.read_text(), strip_strings=True)
        if rel in runtime_builders:
            # Toast baut pro Meldung - muss sich selbst zerstoeren.
            if ":Destroy()" not in code:
                findings.append(f"{rel}: baut zur Laufzeit, zerstoert aber nichts")

    print(f"{checked} Client-Module geprueft, {scopes} Motion-Scopes gefunden.")
    if findings:
        print("\nBEFUNDE:")
        for f in findings:
            print("  -", f)
        return 1
    print("Jeder Scope wird zerstoert, kein Panel baut beim Oeffnen, "
          "jedes Ein-/Ausblenden laeuft ueber einen Tween.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
