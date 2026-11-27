#!/usr/bin/env python3
"""Bundle src/ into one self-contained index.html (plus an artifact variant without doc skeleton)."""
import pathlib, sys
root = pathlib.Path(__file__).parent; src = root / 'src'
css = (src / 'style.css').read_text(); body = (src / 'body.html').read_text()
js = '\n'.join((src / f).read_text() for f in ['core.js', 'wm.js', 'world.js', 'minigames.js', 'hack.js', 'apps.js', 'events.js', 'main.js'])
head = '<title>ZeroDay XP</title>\n<meta name="description" content="Hack-Simulator im Doors-XP-Look: Browsergame">\n'
inner = f"{head}<style>\n{css}\n</style>\n{body}\n<script>\n{js}\n</script>\n"
full = f'<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n{head}<style>\n{css}\n</style>\n</head>\n<body>\n{body}\n<script>\n{js}\n</script>\n</body>\n</html>\n'
(root / 'index.html').write_text(full)
if len(sys.argv) > 1: pathlib.Path(sys.argv[1]).write_text(inner)
print('ok', len(full))
