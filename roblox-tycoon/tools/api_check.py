#!/usr/bin/env python3
"""Sucht veraltete/verbotene Roblox-APIs - aber nur in echtem CODE.

Ein simples grep meldet auch Treffer in Kommentaren (dieses Projekt
erklaert an mehreren Stellen, warum es BodyVelocity NICHT benutzt).
Deshalb werden Zeilen- und Blockkommentare sowie Stringliterale vorher
entfernt, und erst danach gesucht.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Muster, die nur in echtem Code zaehlen (Kommentare UND Strings raus).
FORBIDDEN_CODE = [
    (r'(?<![\w.:])wait\s*\(',      "wait()  -> task.wait()"),
    (r'(?<![\w.:])spawn\s*\(',     "spawn() -> task.spawn()"),
    (r'(?<![\w.:])delay\s*\(',     "delay() -> task.delay()"),
    (r':MakeJoints\s*\(',          "Model:MakeJoints() ist entfernt"),
    (r':Remove\s*\(',              ":Remove() -> :Destroy()"),
    (r'(?<![\w.])\.Velocity\s*=',  "BasePart.Velocity -> AssemblyLinearVelocity"),
    (r'\bFilteringEnabled\s*=\s*false', "FilteringEnabled darf nie false sein"),
]

# Klassennamen tauchen als Instance.new("...") in Strings auf. Hier werden
# daher nur Kommentare entfernt, die Strings bleiben stehen - sonst gingen
# genau die echten Missbrauchsfaelle durch die Maschen.
FORBIDDEN_STRINGS = [
    (r'\bBodyVelocity\b',          "BodyVelocity -> AssemblyLinearVelocity / LinearVelocity"),
    (r'\bBodyPosition\b',          "BodyPosition -> AlignPosition"),
    (r'\bBodyGyro\b',              "BodyGyro -> AlignOrientation"),
    (r'\bBodyThrust\b',            "BodyThrust -> VectorForce"),
]


def strip_lua(text: str, strip_strings: bool = True) -> str:
    """Entfernt Blockkommentare, Zeilenkommentare und Stringliterale.

    Ersetzt sie durch Leerzeichen gleicher Laenge, damit Zeilennummern
    und Spalten erhalten bleiben.
    """
    out = list(text)
    i, n = 0, len(text)
    while i < n:
        # Blockkommentar --[[ ... ]] bzw. --[==[ ... ]==]
        m = re.compile(r'--\[(=*)\[').match(text, i)
        if m:
            close = "]" + m.group(1) + "]"
            end = text.find(close, m.end())
            end = n if end == -1 else end + len(close)
            for k in range(i, end):
                if out[k] != "\n":
                    out[k] = " "
            i = end
            continue
        # Zeilenkommentar
        if text.startswith("--", i):
            end = text.find("\n", i)
            end = n if end == -1 else end
            for k in range(i, end):
                out[k] = " "
            i = end
            continue
        # Stringliteral (einfach, doppelt, Backtick-Interpolation)
        if strip_strings and text[i] in "\"'`":
            quote = text[i]
            j = i + 1
            while j < n and text[j] != quote:
                if text[j] == "\\":
                    j += 1
                if text[j] == "\n":
                    break
                j += 1
            for k in range(i, min(j + 1, n)):
                if out[k] != "\n":
                    out[k] = " "
            i = j + 1
            continue
        i += 1
    return "".join(out)


def main() -> int:
    findings = []
    files = sorted((ROOT / "src").rglob("*.luau"))
    for path in files:
        source = path.read_text()
        rel = path.relative_to(ROOT)
        for text, patterns in (
            (strip_lua(source, strip_strings=True), FORBIDDEN_CODE),
            (strip_lua(source, strip_strings=False), FORBIDDEN_STRINGS),
        ):
            for lineno, line in enumerate(text.splitlines(), start=1):
                for pattern, message in patterns:
                    if re.search(pattern, line):
                        findings.append(f"{rel}:{lineno}: {message}")
    if findings:
        print("VERBOTENE APIs GEFUNDEN:")
        for f in findings:
            print("  -", f)
        return 1
    print(f"{len(files)} Module geprueft, keine veralteten oder verbotenen APIs "
          f"({len(FORBIDDEN_CODE) + len(FORBIDDEN_STRINGS)} Muster; Kommentare "
          f"ausgenommen, Klassennamen auch in Strings gesucht).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
