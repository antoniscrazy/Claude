#!/usr/bin/env python3
"""Zeigt, was an einem einzelnen Theme-Token haengt.

Belegt die Abnahmebedingung "Theme.luau ist die einzige Quelle": fuer ein
Token wird aufgelistet, wie oft und wo es verwendet wird. Wer die Farbe
dort aendert, aendert genau diese Stellen - und keine anderen, weil der
Linter Literale ausserhalb verbietet.
"""
import collections
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from api_check import strip_lua  # noqa: E402

TOKEN = sys.argv[1] if len(sys.argv) > 1 else "Color.primary"


def main() -> int:
    pattern = re.compile(r"\bTheme\." + re.escape(TOKEN) + r"\b")
    # Kurzformen wie `local C = Theme.Color` + `C.primary` mitzaehlen
    short = None
    if TOKEN.startswith("Color."):
        short = re.compile(r"\bC\." + re.escape(TOKEN.split(".", 1)[1]) + r"\b")

    hits = collections.Counter()
    total = 0
    for path in sorted((ROOT / "src").rglob("*.luau")):
        rel = path.relative_to(ROOT).as_posix()
        if rel == "src/shared/Theme.luau":
            continue
        code = strip_lua(path.read_text(), strip_strings=True)
        count = len(pattern.findall(code))
        if short is not None:
            count += len(short.findall(code))
        if count:
            hits[rel] = count
            total += count

    print(f"Theme.{TOKEN}: {total} Verwendungen in {len(hits)} Modulen\n")
    for rel, count in hits.most_common():
        print(f"  {count:>3}x  {rel}")
    if total == 0:
        print("  (keine - Token ungenutzt)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
