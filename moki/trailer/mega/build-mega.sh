#!/bin/bash
# Baut den Mega-Update-Trailer (1920x1080): Intro + Spielewand, echte Moki-Aufnahme, Finale, Musik.
# Vorher: python3 prepare-moki.py (erzeugt die temporaere Aufnahme-Seite _trailer-moki.html, danach wieder loeschen)
# Aufruf: bash build-mega.sh <arbeitsordner> <ausgabe.mp4>   (LMOKI = Laenge der Moki-Aufnahme in Sekunden, Standard 68)
set -e
LMOKI=${LMOKI:-68}
W=$1; OUT=$2; HERE="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$W"
[ -d "$W/mrec" ] || node "$HERE/moki-rec-mega.js" "$W/mrec"
[ -d "$W/ca" ] || node "$HERE/render-scenes-mega.js" A "$W/ca"
[ -d "$W/cb" ] || node "$HERE/render-scenes-mega.js" B "$W/cb"
[ -f "$W/a.wav" ] || python3 "$HERE/audio-mega.py" "$W/a.wav" "$LMOKI"
MV=$(ls "$W"/mrec/*.webm | head -1)
MO=$(python3 -c "import json;print(json.load(open('$W/mrec/info.json'))['offset'])")
ffmpeg -y -loglevel error -framerate 30 -i "$W/ca/f%04d.jpg" -ss "$MO" -i "$MV" -framerate 30 -i "$W/cb/f%04d.jpg" -i "$W/a.wav" -filter_complex "
[0:v]setsar=1,format=yuv420p[a];
[1:v]fps=30,scale=1920:1080:flags=lanczos,tpad=stop_mode=clone:stop_duration=6,trim=duration=$LMOKI,setpts=PTS-STARTPTS,setsar=1,fade=t=in:st=0:d=0.3:color=white,format=yuv420p[m];
[2:v]setsar=1,format=yuv420p[b];
[a][m][b]concat=n=3:v=1:a=0[v]" -map "[v]" -map 3:a -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -shortest "$OUT"
