#!/bin/bash
# Baut den Trailer (100 s, 1920x1080) aus: Canvas-Szenen A/B, Moki-Aufnahme, Studio-Aufnahme, Musik.
# Aufruf: NODE_PATH=$(npm root -g) bash build-trailer.sh <arbeitsordner> <ausgabe.mp4>
set -e
W=$1; OUT=$2; HERE="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$W"
[ -d "$W/ca" ] || node "$HERE/render-scenes.js" A "$W/ca"
[ -d "$W/cb" ] || node "$HERE/render-scenes.js" B "$W/cb"
[ -d "$W/mrec" ] || node "$HERE/moki-rec.js" "$W/mrec"
[ -d "$W/srec" ] || node "$HERE/studio-rec.js" "$W/srec"
[ -f "$W/a.wav" ] || python3 "$HERE/audio2.py" "$W/a.wav"
MV=$(ls "$W"/mrec/*.webm | head -1); SV=$(ls "$W"/srec/*.webm | head -1)
MO=$(python3 -c "import json,sys;print(json.load(open('$W/mrec/info.json'))['offset'])")
SO=$(python3 -c "import json,sys;print(json.load(open('$W/srec/info.json'))['offset'])")
ffmpeg -y -loglevel error -framerate 30 -i "$W/ca/f%04d.jpg" -ss "$MO" -i "$MV" -ss "$SO" -i "$SV" -framerate 30 -i "$W/cb/f%04d.jpg" -i "$W/a.wav" -filter_complex "
[0:v]setsar=1,format=yuv420p[a];
[1:v]fps=30,scale=1920:1080:flags=lanczos,tpad=stop_mode=clone:stop_duration=4,trim=duration=44,setpts=PTS-STARTPTS,setsar=1,fade=t=in:st=0:d=0.3:color=white,format=yuv420p[m];
[2:v]fps=30,scale=1920:1080:flags=lanczos,tpad=stop_mode=clone:stop_duration=4,trim=duration=28,setpts=PTS-STARTPTS,setsar=1,fade=t=in:st=0:d=0.3:color=white,format=yuv420p[s];
[3:v]setsar=1,format=yuv420p[b];
[a][m][s][b]concat=n=4:v=1:a=0[v]" -map "[v]" -map 4:a -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -shortest "$OUT"
