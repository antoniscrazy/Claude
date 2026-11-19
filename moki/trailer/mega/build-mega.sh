#!/bin/bash
# Baut den Mega-Update-Trailer (1920x1080): Canvas-Szenen A/B/C, Moki-Aufnahme, Studio-Aufnahme, Musik.
# Vorher einmal die temporaere Seite erzeugen: python3 prepare-moki.py  (setzt Termin Freitag 20.11. 11:30 Uhr)
# Aufruf: NODE_PATH=$(npm root -g) bash build-mega.sh <arbeitsordner> <ausgabe.mp4>   (LMOKI = Laenge der Moki-Aufnahme, Standard 50)
set -e
LMOKI=${LMOKI:-50}
W=$1; OUT=$2; HERE="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$W"
[ -d "$W/mrec" ] || node "$HERE/moki-rec-mega.js" "$W/mrec"
[ -d "$W/srec" ] || node "$HERE/studio-rec-mega.js" "$W/srec"
[ -d "$W/ca" ] || node "$HERE/render-scenes-mega.js" A "$W/ca"
[ -d "$W/cb" ] || node "$HERE/render-scenes-mega.js" B "$W/cb"
[ -d "$W/cc" ] || node "$HERE/render-scenes-mega.js" C "$W/cc"
[ -f "$W/a.wav" ] || python3 "$HERE/../audio2.py" "$W/a.wav" "$LMOKI"
MV=$(ls "$W"/mrec/*.webm | head -1); SV=$(ls "$W"/srec/*.webm | head -1)
MO=$(python3 -c "import json,sys;print(json.load(open('$W/mrec/info.json'))['offset'])")
SO=$(python3 -c "import json,sys;print(json.load(open('$W/srec/info.json'))['offset'])")
ffmpeg -y -loglevel error -framerate 30 -i "$W/ca/f%04d.jpg" -ss "$MO" -i "$MV" -ss "$SO" -i "$SV" -framerate 30 -i "$W/cb/f%04d.jpg" -framerate 30 -i "$W/cc/f%04d.jpg" -i "$W/a.wav" -filter_complex "
[0:v]setsar=1,format=yuv420p[a];
[1:v]fps=30,scale=1920:1080:flags=lanczos,tpad=stop_mode=clone:stop_duration=6,trim=duration=$LMOKI,setpts=PTS-STARTPTS,setsar=1,fade=t=in:st=0:d=0.3:color=white,format=yuv420p[m];
[2:v]fps=30,scale=1920:1080:flags=lanczos,tpad=stop_mode=clone:stop_duration=4,trim=duration=28,setpts=PTS-STARTPTS,setsar=1,fade=t=in:st=0:d=0.3:color=white,format=yuv420p[s];
[3:v]setsar=1,format=yuv420p[b];
[4:v]setsar=1,format=yuv420p[c];
[a][m][s][b][c]concat=n=5:v=1:a=0[v]" -map "[v]" -map 5:a -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -shortest "$OUT"
