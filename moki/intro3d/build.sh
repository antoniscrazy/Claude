#!/bin/bash
# Baut intro3d.bundle.js aus src/intro3d.js (Three.js + Nachbearbeitung + 3D-Schrift in einer Datei).
# Aufruf im Ordner intro3d: bash build.sh   (braucht Node und Internet fuer npm install)
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm install --no-audit --no-fund
npx esbuild src/intro3d.js --bundle --minify --format=iife --global-name=MOKI_INTRO3D_MOD --target=es2020 --legal-comments=none --outfile=intro3d.bundle.js
echo "fertig: $(wc -c < intro3d.bundle.js) Bytes"
