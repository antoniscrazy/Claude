#!/bin/sh
# Startet einen lokalen Server und öffnet das Spiel: http://localhost:8000/ragdoll-hit.html
cd "$(dirname "$0")" && echo "Öffne http://localhost:8000/ragdoll-hit.html" && python3 -m http.server 8000
