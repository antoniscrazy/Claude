#!/bin/bash
# Baut alle Launcher aus /tmp/snaps.txt
cd "$(dirname "$0")"
snap(){ grep "^$1 " /tmp/snaps.txt | cut -d' ' -f2; }
mk(){ slug=$1; title=$2; shift 2; python3 mk_launcher.py $slug "$title" $(snap $slug) "$@" >/dev/null; }
AR='["ArrowLeft","◀"],["ArrowRight","▶"]'
mk doodle-jump "Doodle Jump"
mk table-tanks "Table Tanks" --touch '{"left":[["ArrowLeft","◀"],["ArrowRight","▶"],["ArrowUp","▲"],["ArrowDown","▼"]],"right":[["KeyX","X"],["KeyZ","Z"],["Space","␣"]]}'
mk iron-snout "Iron Snout" --touch '{"left":[["ArrowLeft","◀"],["ArrowRight","▶"]],"right":[["ArrowUp","▲"],["ArrowDown","▼"],["KeyZ","Z"],["Space","␣"]]}'
mk stick-defenders "Stick Defenders"
mk retro-bowl "Retro Bowl" --entry new.html
mk karate-bros "Karate Bros"
mk soccer-bros "Soccer Bros"
mk monkey-mart "Monkey Mart"
mk astro-survivors "Astro Survivors"
mk head-soccer "Head Soccer" --touch '{"left":[["ArrowLeft","◀"],["ArrowRight","▶"]],"right":[["ArrowUp","▲"],["Space","⚽"]]}'
mk snow-rider "Snow Rider 3D" --touch '{"left":[["ArrowLeft","◀"],["ArrowRight","▶"]],"right":[["ArrowUp","▲"]]}'
mk stick-slasher "Stick Slasher" --touch '{"left":[["ArrowLeft","◀"],["ArrowRight","▶"]],"right":[["ArrowUp","▲"],["KeyX","⚔"],["Space","␣"]]}'
mk hill-climb-racing-lite "Hill Climb Racing Lite"
mk dan-the-man "Dan the Man"
mk mob-control "Mob Control"
mk royal-towers "Royal Towers"
mk stick-fight "Stick Fight" --touch '{"left":[["KeyA","◀"],["KeyD","▶"],["KeyW","▲"]],"right":[["KeyJ","1"],["KeyK","2"],["KeyL","3"]]}'
mk stick-jet "Stick Jet"
mk stacky-dash "Stacky Dash"
mk basket-battle "Basket Battle"
