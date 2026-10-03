#!/usr/bin/env python3
"""Bettet die vom Spiel genutzten Sounds aus einem Minecraft-Soundpack (.ogg) klein umgewandelt
(MP3, mono, 24 kHz – läuft in allen Browsern) als Base64 in minecraft/index.html ein (zwischen /*SND_BEGIN*/ und /*SND_END*/).

Benutzung:  python3 tools/embed_sounds.py <ordner-oder-zip> [<ordner-oder-zip> ...] [--html index.html]

Jeder Ordner/jede ZIP darf die Kategorien (block/, dig/, mob/, damage/, ui/, step/, random/ ...) enthalten;
mehrere werden zusammengelegt. Benötigt ffmpeg (im PATH oder über `pip install imageio-ffmpeg`).
Fehlt ein Sound im Pack, nimmt das Spiel automatisch den selbst erzeugten Ersatz.
"""
import base64, glob, json, os, re, shutil, subprocess, sys, tempfile, zipfile

MAX_VARIANTS = 4            # Varianten je Sound-Gruppe
KNOWN = ('block', 'dig', 'mob', 'damage', 'ui', 'step', 'random', 'ambient', 'liquid', 'fire', 'entity', 'item', 'weather')

# Block-Material -> Gruppen je Art (all = für Abbauen/Platzieren/Schritt gleich)
MATS = {
    'soft': {'all': ['dig/grass']}, 'wood': {'all': ['dig/wood']}, 'stone': {'all': ['dig/stone']}, 'sand': {'all': ['dig/sand']},
    'snow': {'all': ['dig/snow']}, 'glass': {'break': ['random/glass'], 'place': ['random/glass']}, 'wool': {'all': ['dig/cloth']}, 'gravel': {'all': ['dig/gravel']},
    'metal': {'break': ['block/copper/break'], 'step': ['block/copper/step']},
    'chain': {'break': ['block/chain/break'], 'step': ['block/chain/step']},
    'lantern': {'break': ['block/lantern/break'], 'place': ['block/lantern/place']},
    'netherrack': {'break': ['block/netherrack/break'], 'step': ['block/netherrack/step']},
    'soulsand': {'break': ['block/soul_sand/break'], 'step': ['block/soul_sand/step']},
    'soulsoil': {'break': ['block/soul_soil/break'], 'step': ['block/soul_soil/step']},
    'basalt': {'break': ['block/basalt/break'], 'step': ['block/basalt/step']},
    'nbrick': {'break': ['block/nether_bricks/break'], 'step': ['block/nether_bricks/step']},
    'nore': {'break': ['block/nether_ore/break'], 'step': ['block/nether_ore/step']},
    'netherite': {'break': ['block/netherite/break'], 'step': ['block/netherite/step']},
    'debris': {'break': ['block/ancient_debris/break'], 'step': ['block/netherite/step']},
    'nylium': {'break': ['block/nylium/break'], 'step': ['block/nylium/step']},
    'wart': {'break': ['block/netherwart/break'], 'step': ['block/netherwart/step']},
    'bone': {'break': ['block/bone_block/break'], 'step': ['block/bone_block/step']},
    'deepslate': {'break': ['block/deepslate/break'], 'place': ['block/deepslate/place'], 'step': ['block/deepslate/step']},
    'tuff': {'break': ['block/tuff/break'], 'place': ['block/tuff/place'], 'step': ['block/tuff/step']},
    'calcite': {'break': ['block/calcite/break'], 'place': ['block/calcite/place'], 'step': ['block/calcite/step']},
    'stem': {'break': ['block/stem/break'], 'step': ['block/stem/step']},
    'fungus': {'break': ['block/fungus/break'], 'step': ['block/roots/step']},
    'roots': {'break': ['block/roots/break'], 'step': ['block/roots/step']},
    'shroom': {'break': ['block/shroomlight/break'], 'step': ['block/shroomlight/step']},
}
# Mob-Typ -> Ordner + Gruppen je Ereignis (Name ohne Nummer); fehlende Ereignisse bleiben beim Ersatz-Sound
MOBS = {
    'pig': ('pig', {'idle': 'say', 'hurt': 'say', 'die': 'death', 'step': 'step'}),
    'cow': ('cow', {'idle': 'say', 'hurt': 'hurt', 'die': 'hurt', 'step': 'step'}),
    'sheep': ('sheep', {'idle': 'say', 'hurt': 'say', 'die': 'say', 'step': 'step'}),
    'chicken': ('chicken', {'idle': 'say', 'hurt': 'hurt', 'die': 'hurt', 'step': 'step'}),
    'zombie': ('zombie', {'idle': 'say', 'hurt': 'hurt', 'die': 'death', 'step': 'step'}),
    'husk': ('husk', {'idle': 'idle', 'hurt': 'hurt', 'die': 'death', 'step': 'step'}),
    'skeleton': ('skeleton', {'idle': 'say', 'hurt': 'hurt', 'die': 'death', 'step': 'step'}),
    'spider': ('spider', {'idle': 'say', 'hurt': 'say', 'die': 'death', 'step': 'step'}),
    'creeper': ('creeper', {'hurt': 'say', 'die': 'death'}),
    'wolf': ('wolf', {'idle': 'panting', 'hurt': 'hurt', 'die': 'death', 'step': 'step'}),
    'rabbit': ('rabbit', {'idle': 'idle', 'hurt': 'hurt', 'die': 'hurt', 'step': 'hop'}),
    'bat': ('bat', {'idle': 'idle', 'hurt': 'hurt', 'die': 'death'}),
    'slime': ('slime', {'hurt': 'small', 'die': 'small', 'step': 'small'}),
    'villager': ('villager', {'idle': 'idle', 'hurt': 'hit', 'die': 'death'}),
    'zombified_piglin': ('zombified_piglin', {'idle': 'zpig', 'hurt': 'zpighurt', 'die': 'zpigdeath'}),
    'piglin': ('piglin', {'idle': 'idle', 'hurt': 'hurt', 'die': 'death', 'step': 'step', 'angry': 'angry'}),
    'hoglin': ('hoglin', {'idle': 'idle', 'hurt': 'hurt', 'die': 'death', 'step': 'step', 'angry': 'angry'}),
    'blaze': ('blaze', {'idle': 'breathe', 'hurt': 'hit', 'die': 'death'}),
    'ghast': ('ghast', {'idle': 'moan', 'hurt': 'scream', 'die': 'death', 'fireball': 'fireball4', 'charge': 'charge'}),
    'strider': ('strider', {'idle': 'idle', 'hurt': 'hurt', 'die': 'death', 'step': 'step', 'steplava': 'step_lava'}),
    'magma_cube': ('magmacube', {'hurt': 'small', 'die': 'small', 'step': 'jump'}),
    'br_hound': ('wolf', {'idle': 'growl', 'hurt': 'hurt', 'die': 'death', 'step': 'step', 'angry': 'bark'}),
    'br_entity': ('endermen', {'idle': 'idle', 'hurt': 'hit', 'die': 'death', 'angry': 'scream', 'stare': 'stare'}),
    'br_starrer': ('stray', {'idle': 'idle', 'hurt': 'hurt', 'die': 'death', 'step': 'step'}),
    'wither_skeleton': ('wither_skeleton', {'idle': 'idle', 'hurt': 'hurt', 'die': 'death', 'step': 'step'}),
}
# Sonstige Ereignisse -> Gruppe
EVENTS = {
    'dmg': ('damage/hit',), 'fallsmall': ('damage/fallsmall',), 'fallbig': ('damage/fallbig',), 'toast': ('ui/toast/challenge_complete',),
    'chestopen': ('block/chest/open',), 'chestclose': ('block/chest/close',),
    'dooropen': ('block/wooden_door/open',), 'doorclose': ('block/wooden_door/close',),
    'gateopen': ('block/fence_gate/open',), 'gateclose': ('block/fence_gate/close',),
    'ironopen': ('block/iron_door/open',), 'ironclose': ('block/iron_door/close',),
    'stonecut': ('ui/stonecutter/cut',), 'bell': ('block/bell/bell_use',),
}

# Spiel-Effekt (sfx-Name) -> (Gruppe, Lautstärke)
SFX = {'explode': ('random/explode', 1.0), 'fuse': ('random/fuse', 0.7), 'shoot': ('random/bow', 0.8), 'eat': ('random/eat', 0.9),
       'toolbreak': ('random/break', 0.9), 'pop': ('random/pop', 0.6), 'splash': ('random/splash', 0.9), 'click': ('random/click', 0.6)}

def ffmpeg_exe():
    exe = shutil.which('ffmpeg')
    if exe: return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit('ffmpeg fehlt (apt install ffmpeg oder pip install imageio-ffmpeg)')

def collect(sources):
    """-> {relativer Pfad (z. B. 'mob/pig/say1.ogg'): Quelle}"""
    files, tmp = {}, tempfile.mkdtemp()
    for src in sources:
        root = src
        if os.path.isfile(src) and src.lower().endswith('.zip'):
            root = os.path.join(tmp, str(len(files)) + '_' + os.path.basename(src)); zipfile.ZipFile(src).extractall(root)
        for path in glob.glob(os.path.join(root, '**', '*.ogg'), recursive=True):
            parts = path[len(root):].replace('\\', '/').strip('/').split('/')
            for i, p in enumerate(parts):
                if p in KNOWN:
                    files['/'.join(parts[i:])] = path; break
    return files

def main():
    args = sys.argv[1:]
    html = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'index.html')
    if '--html' in args:
        i = args.index('--html'); html = args[i + 1]; del args[i:i + 2]
    if not args: sys.exit(__doc__)
    files = collect(args)
    groups = {}                                                     # Gruppe ("block/netherrack/break") -> [Quellpfade]
    def need(group):
        if group in groups: return
        d, base = group.rsplit('/', 1)
        found = sorted(k for k in files if re.fullmatch(re.escape(d + '/' + base) + r'\d*\.ogg', k))
        groups[group] = [files[k] for k in found[:MAX_VARIANTS]]
    mat = {}
    for m, kinds in MATS.items():
        mat[m] = {}
        for kind, gl in kinds.items():
            for g in gl: need(g)
            mat[m][kind] = [g for g in gl if groups[g]]
    mob = {}
    for t, (folder, evs) in MOBS.items():
        mob[t] = {}
        for ev, name in evs.items():
            g = 'mob/%s/%s' % (folder, name); need(g)
            if groups[g]: mob[t][ev] = g
    if 'step' in mob.get('piglin', {}) and 'zombified_piglin' in mob: mob['zombified_piglin'].setdefault('step', mob['piglin']['step'])
    ev = {}
    for k, (g,) in EVENTS.items():
        need(g)
        if groups[g]: ev[k] = g
    sfx = {}
    for k, (g, v) in SFX.items():
        need(g)
        if groups[g]: sfx[k] = [g, v]
    ff, tmp, out, total, n = ffmpeg_exe(), tempfile.mkdtemp(), {}, 0, 0
    for g, srcs in sorted(groups.items()):
        lst = []
        for s in srcs:
            dst = os.path.join(tmp, 'x.mp3')
            subprocess.run([ff, '-y', '-loglevel', 'error', '-i', s, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '32k', dst], check=True)
            data = open(dst, 'rb').read(); total += len(data); n += 1
            lst.append('data:audio/mpeg;base64,' + base64.b64encode(data).decode())
        if lst: out[g] = lst
    # nicht vorhandene Gruppen aus den Zuordnungen entfernen
    for t in list(mob):
        mob[t] = {k: v for k, v in mob[t].items() if v in out}
    mat = {m: {k: [g for g in gl if g in out] for k, gl in kinds.items()} for m, kinds in mat.items()}
    ev = {k: v for k, v in ev.items() if v in out}
    sfx = {k: v for k, v in sfx.items() if v[0] in out}
    js = json.dumps({'files': out, 'mat': mat, 'mob': mob, 'ev': ev, 'sfx': sfx}, separators=(',', ':'), ensure_ascii=False)
    s = open(html, encoding='utf-8').read()
    a, b = s.index('/*SND_BEGIN*/'), s.index('/*SND_END*/')
    s = s[:a] + '/*SND_BEGIN*/' + js + s[b:]
    open(html, 'w', encoding='utf-8').write(s)
    print('%d Gruppen, %d Klänge, %.0f KB MP3 (%.0f KB Base64)' % (len(out), n, total / 1024, len(js) / 1024))
    miss = sorted(g for g, v in groups.items() if not v)
    if miss: print('Nicht im Pack:', ', '.join(miss))

if __name__ == '__main__':
    main()
