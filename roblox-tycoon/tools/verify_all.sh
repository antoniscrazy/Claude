#!/usr/bin/env bash
# Gesamtprüfung: alles, was ohne laufendes Roblox Studio prüfbar ist.
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
step() { printf '\n=== %s ===\n' "$1"; }

step "1/6  Strikte Typprüfung (luau-lsp + echte Roblox-API-Definitionen)"
./tools/check.sh || fail=1

step "2/6  Bytecode-Kompilierung aller Module"
n=0
for f in $(find src -name '*.luau'); do
  /tmp/luau-compile --binary "$f" >/dev/null || { echo "FEHLER: $f"; fail=1; }
  n=$((n+1))
done
echo "$n Module kompilieren fehlerfrei"

step "3/6  Veraltete und verbotene APIs"
python3 tools/api_check.py || fail=1

step "4/6  Balancing"
python3 tools/balance_sim.py | tail -6 || fail=1
python3 tools/throughput.py | tail -4

step "5/6  UI-Layout auf Zielauflösungen"
python3 tools/layout_check.py || fail=1

step "6/6  Place-File"
python3 tools/build.py || fail=1
python3 tools/verify_place.py || fail=1

printf '\n'
if [ "$fail" -eq 0 ]; then echo "ALLE PRÜFUNGEN BESTANDEN"; else echo "ES GAB FEHLER"; fi
exit $fail
