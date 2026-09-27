#!/usr/bin/env bash
# Strikte Typpruefung aller Luau-Module gegen die echte Roblox-API.
# Nutzt luau-lsp mit den offiziellen Typdefinitionen und der Sourcemap,
# damit require() ueber Modulgrenzen hinweg aufgeloest wird.
set -uo pipefail
cd "$(dirname "$0")/.."
python3 tools/build.py --check >/dev/null 2>&1
DEFS="${LUAU_DEFS:-/tmp/gt.d.luau}"
LSP="${LUAU_LSP:-/tmp/luau-lsp}"
fail=0
files=$(find src -name '*.luau' | sort)
out=$("$LSP" analyze --defs="$DEFS" --sourcemap=sourcemap.json $files 2>&1 \
      | grep -Ev '^\[(INFO|WARN)\]')
if [ -n "$out" ]; then
  echo "$out"
  fail=1
fi
if [ "$fail" -eq 0 ]; then
  echo "Typpruefung: $(echo "$files" | wc -l) Module, 0 Fehler"
fi
exit $fail
