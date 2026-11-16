// ====================================================================
// Baukasten-Modell (v2), Vorlagen und Code-Erzeugung
// ====================================================================
let _uid = 0; const uid = p => p + Date.now().toString(36).slice(-4) + (++_uid).toString(36);
const SHAPE_OPTS = MOKI_SHAPE_NAMES;
const IMAGE_OPTS = MOKI_MOTIFS.filter(m => m.id !== 'star' && m.id !== 'heart').map(m => [m.id, m.name]);
const CONTROLS = [['none', 'Keine'], ['keys', 'Tasten und Finger'], ['mouse', 'Maus und Finger']];
const AXES = [['xy', 'Alle Richtungen'], ['x', 'Nur links/rechts'], ['y', 'Nur hoch/runter']];
const MOTIONS = [['none', 'Bleibt stehen'], ['fall', 'Fällt nach unten'], ['rise', 'Steigt nach oben'], ['left', 'Fliegt nach links'], ['right', 'Fliegt nach rechts'], ['bounce', 'Springt umher (prallt ab)'], ['follow', 'Verfolgt den Spieler']];
const PHYSICS = [['none', 'Keine'], ['platformer', 'Schwerkraft (Hüpfen)'], ['topdown', 'Von oben (stößt an Wände)']];
const PATTERNS = [['none', 'Kein Muster'], ['stars', 'Sterne'], ['grid', 'Gitter'], ['dots', 'Punkte']];
const KEYS = [['SPACE', 'Leertaste'], ['LEFT', 'Pfeil links'], ['RIGHT', 'Pfeil rechts'], ['UP', 'Pfeil hoch'], ['DOWN', 'Pfeil runter'], ['ENTER', 'Enter']].concat('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => [c, 'Taste ' + c]));
const DIRS = [['up', 'nach oben'], ['down', 'nach unten'], ['left', 'nach links'], ['right', 'nach rechts'], ['pointer', 'zur Maus / zum Finger']];
const SCREEN_OPS = [['==', 'ist'], ['!=', 'ist nicht']];
const SOUND_OPTS = [['coin', 'Münze'], ['hit', 'Treffer'], ['jump', 'Sprung'], ['shoot', 'Schuss'], ['pop', 'Plopp'], ['powerup', 'Power-up'], ['explosion', 'Explosion'], ['win', 'Sieg'], ['lose', 'Niederlage']];
const EFFECT_OPTS = [['sparks', 'Funken an einer Figur'], ['boom', 'Explosion an einer Figur'], ['shake', 'Bildschirm wackeln'], ['flash', 'Bildschirm blitzt']];
const OPS = [['>=', 'mindestens'], ['<=', 'höchstens'], ['==', 'genau'], ['>', 'mehr als'], ['<', 'weniger als'], ['!=', 'nicht']];
const EVENTS = [['start', 'Das Spiel startet'], ['touch', 'Zwei Figuren berühren sich'], ['key', 'Eine Taste wird gedrückt'], ['hold', 'Eine Taste wird gehalten'], ['tap', 'Irgendwo getippt oder geklickt'], ['click', 'Eine Figur wird angetippt'], ['edge', 'Eine Figur verlässt den Bildschirm'], ['destroyed', 'Eine Figur wird zerstört'], ['every', 'Alle paar Sekunden'], ['after', 'Nach einer Wartezeit (einmal)'], ['stat', 'Ein Wert erreicht eine Zahl'], ['score', 'Die Punkte erreichen eine Zahl'], ['screen', 'Ein Bildschirm (Menü) wird geöffnet']];
const ACTIONS = [['score', 'Punkte ändern'], ['life', 'Leben ändern'], ['setvar', 'Variable setzen'], ['addvar', 'Variable ändern'],
  ['respawn', 'Figur oben/am Rand neu starten'], ['scatter', 'Figur zufällig platzieren'], ['place', 'Figur an einen Ort setzen'], ['destroy', 'Figur entfernen'], ['spawn', 'Neue Figur erzeugen'],
  ['fly', 'Figur fliegen lassen'], ['stop', 'Figur anhalten'], ['move', 'Figur schieben (bei „Taste gehalten“)'], ['jump', 'Figur springen lassen'], ['shoot', 'Figur schießt'], ['hurt', 'Figur nimmt Schaden'], ['bounce', 'Figur prallt ab'],
  ['speed', 'Tempo ändern'], ['grow', 'Größe ändern'], ['color', 'Farbe ändern'], ['show', 'Figur zeigen / verstecken'],
  ['sound', 'Ton abspielen'], ['effect', 'Effekt zeigen'], ['say', 'Nachricht zeigen'], ['win', 'Spiel gewonnen'], ['lose', 'Spiel verloren'], ['go', 'Zu einem Bildschirm (Menü) wechseln'], ['restart', 'Spiel neu starten']];

// ---------- Standardwerte und Aufräumen alter Modelle ----------
const SPR_DEF = { shape: 'circle', color: '#00e5a8', size: 50, stretch: 1, x: 50, y: 50, angle: 0, spin: 0, opacity: 1, control: 'none', axis: 'xy', motion: 'none', speed: 200, physics: 'none', solid: false, screen: '', hp: 1, wrap: false, openBottom: false, jump: 640, label: '', rows: 1, cols: 1, gapX: 8, gapY: 8 };
const SET_DEF = { bg: '#0d1240', bg2: '', pattern: 'none', lives: 0, time: 0, timeMode: 'win', showScore: true, gravity: 1400, help: '' };
function normalizeModel(M) {
  M = M || {}; M.v = 2;
  M.settings = Object.assign({}, SET_DEF, M.settings || {});
  M.vars = Array.isArray(M.vars) ? M.vars : [];
  M.screens = Array.isArray(M.screens) ? M.screens : [];
  M.sprites = (M.sprites || []).map(s => Object.assign({ id: uid('s'), name: 'Figur' }, SPR_DEF, s));
  M.rules = (M.rules || []).map(r => Object.assign({ id: uid('r'), when: { type: 'start' }, conds: [], then: [] }, r, { conds: r.conds || [], then: r.then || [] }));
  return M;
}
const newModel = () => normalizeModel({ settings: {}, sprites: [], rules: [] });
const SPR = {
  player: { name: 'Spieler', shape: 'circle', color: '#00e5a8', size: 56, x: 50, y: 86, control: 'keys', axis: 'x', speed: 420 },
  item: { name: 'Stern', shape: 'star', color: '#ffd23f', size: 40, x: 30, y: -5, motion: 'fall', speed: 220 },
  enemy: { name: 'Gegner', shape: 'triangle', color: '#ff4d6d', size: 46, x: 65, y: -5, motion: 'fall', speed: 260 },
  bouncer: { name: 'Springer', shape: 'diamond', color: '#4cc9f0', size: 50, x: 50, y: 40, motion: 'bounce', speed: 220 },
  hero: { name: 'Held', shape: 'blob', color: '#7ff5d4', size: 50, x: 10, y: 80, control: 'keys', axis: 'x', physics: 'platformer', speed: 280, jump: 660 },
  ground: { name: 'Boden', shape: 'square', color: '#6b4a2e', size: 40, stretch: 20, x: 50, y: 97, solid: true },
  platform: { name: 'Plattform', shape: 'square', color: '#8a5a3a', size: 24, stretch: 5, x: 50, y: 70, solid: true },
  bullet: { name: 'Schuss', shape: 'diamond', color: '#ffd23f', size: 14, x: -10, y: -10 },
  text: { name: 'Anzeige', shape: 'text', color: '#ffffff', size: 24, x: 50, y: 8, label: 'Punkte: {score}' },
  blank: { name: 'Figur', shape: 'square', color: '#ffffff', size: 50, x: 50, y: 50 },
  button: { name: 'Knopf', shape: 'button', color: '#00e5a8', size: 56, stretch: 4, x: 50, y: 55, label: 'Knopf' }
};
function addSprite(M, kind, over) {
  const b = Object.assign({}, SPR_DEF, SPR[kind] || SPR.blank, over || {}); b.id = uid('s');
  let n = b.name, i = 2; while (M.sprites.some(s => s.name === n)) n = b.name + ' ' + i++;
  b.name = n; M.sprites.push(b); return b;
}
const R = (when, then, conds) => ({ id: uid('r'), when, conds: conds || [], then });


// ---------- Menüs: Hauptmenü, Spiel, Pause, Gewonnen, Verloren ----------
function addMenus(M, title) {
  if (M.screens.length) return;
  const sc = (name, menu) => { const s = { id: uid('c'), name, menu }; M.screens.push(s); return s; };
  const home = sc('Hauptmenü', true), play = sc('Spiel', false), pause = sc('Pause', true), won = sc('Gewonnen', true), lost = sc('Verloren', true);
  M.sprites.forEach(s => { if (!s.screen) s.screen = play.id; });
  const txt = (scr, label, y, size, color) => addSprite(M, 'text', { screen: scr.id, label, y, size, color, name: 'Text ' + scr.name });
  const btn = (scr, label, y, color, x, size, stretch) => addSprite(M, 'button', { screen: scr.id, label, y, color: color || '#00e5a8', x: x == null ? 50 : x, size: size || 56, stretch: stretch || 4.4, name: 'Knopf ' + label });
  const go = (b, to, snd) => M.rules.push(R({ type: 'click', a: b.id }, [{ type: 'sound', sound: 'pop' }, { type: 'go', screen: to.id }]));
  txt(home, title || 'Mein Spiel', 30, 56, '#ffffff'); go(btn(home, 'Spielen', 56), play); txt(home, 'Tippe auf Spielen', 72, 22, '#a3abe0');
  go(btn(play, 'II', 94, '#ffd23f', 95, 40, 1.4), pause);
  txt(pause, 'Pause', 28, 56, '#ffd23f'); go(btn(pause, 'Weiter', 52), play); go(btn(pause, 'Hauptmenü', 70, '#4cc9f0'), home);
  txt(won, '{message}', 28, 52, '#00e5a8'); txt(won, 'Punkte: {score}', 42, 28, '#ffffff');
  M.rules.push(R({ type: 'click', a: btn(won, 'Nochmal', 60).id }, [{ type: 'restart' }])); go(btn(won, 'Hauptmenü', 78, '#4cc9f0'), home);
  txt(lost, '{message}', 28, 52, '#ff6b81'); txt(lost, 'Punkte: {score}', 42, 28, '#ffffff');
  M.rules.push(R({ type: 'click', a: btn(lost, 'Nochmal', 60).id }, [{ type: 'restart' }])); go(btn(lost, 'Hauptmenü', 78, '#4cc9f0'), home);
}

// ---------- Vorlagen ----------
const TEMPLATES = {
  empty: { icon: 'blocks', name: 'Leeres Spiel', desc: 'Starte bei null und baue alles selbst im Baukasten.', title: 'Mein Spiel', mk() { return newModel(); } },
  catch: {
    icon: 'target', name: 'Fang-Spiel', desc: 'Fange fallende Sterne mit dem Korb, aber weiche den Steinen aus.', title: 'Sternenfänger',
    mk() {
      const M = newModel(); M.settings.lives = 3; M.settings.help = 'Pfeiltasten oder Finger bewegen den Korb';
      const k = addSprite(M, 'player', { name: 'Korb', shape: 'square', size: 70, y: 90, speed: 480 });
      const s = addSprite(M, 'item'); const r = addSprite(M, 'enemy', { name: 'Stein', shape: 'circle', color: '#ff6b81' });
      M.rules.push(R({ type: 'touch', a: k.id, b: s.id }, [{ type: 'score', n: 1 }, { type: 'sound', sound: 'coin' }, { type: 'effect', kind: 'sparks', target: '@b' }, { type: 'respawn', target: '@b' }]));
      M.rules.push(R({ type: 'touch', a: k.id, b: r.id }, [{ type: 'life', n: -1 }, { type: 'sound', sound: 'hit' }, { type: 'effect', kind: 'shake' }, { type: 'respawn', target: '@b' }]));
      M.rules.push(R({ type: 'every', n: 2 }, [{ type: 'spawn', sprite: s.id, where: 'auto' }]));
      M.rules.push(R({ type: 'stat', stat: 'score', op: '>=', n: 12 }, [{ type: 'win', text: 'Geschafft!' }]));
      return M;
    }
  },
  menus: {
    icon: 'blocks', name: 'Fang-Spiel mit Menüs', desc: 'Wie das Fang-Spiel, aber mit Hauptmenü, Pause und Sieger-/Verlierer-Bildschirm.', title: 'Sternenfänger',
    mk() { const M = TEMPLATES.catch.mk(); M.settings.help = ''; addMenus(M, 'Sternenfänger'); return M; }
  },
  dodge: {
    icon: 'bolt', name: 'Ausweichen', desc: 'Überlebe 30 Sekunden und weiche den Felsen aus.', title: 'Ausweich-Meister',
    mk() {
      const M = newModel(); Object.assign(M.settings, { lives: 3, time: 30, timeMode: 'win', showScore: false, bg: '#12082e', bg2: '#2a1458', pattern: 'stars', help: 'Weiche den Felsen aus und überlebe 30 Sekunden' });
      const p = addSprite(M, 'player', { shape: 'rocket', axis: 'xy', y: 50, speed: 360 });
      const e = addSprite(M, 'enemy', { name: 'Fels', shape: 'hexagon', color: '#ff9f1c', size: 50 });
      M.rules.push(R({ type: 'touch', a: p.id, b: e.id }, [{ type: 'life', n: -1 }, { type: 'sound', sound: 'hit' }, { type: 'effect', kind: 'boom', target: '@b' }, { type: 'respawn', target: '@b' }]));
      M.rules.push(R({ type: 'every', n: 1.2 }, [{ type: 'spawn', sprite: e.id, where: 'auto' }]));
      return M;
    }
  },
  click: {
    icon: 'mouse', name: 'Klick-Jagd', desc: 'Tippe das flinke Ziel an, bevor die Zeit abläuft.', title: 'Klick-Jagd',
    mk() {
      const M = newModel(); M.settings.time = 20; M.settings.timeMode = 'lose'; M.settings.pattern = 'dots'; M.settings.help = 'Tippe das Ziel an';
      const z = addSprite(M, 'bouncer', { name: 'Ziel', shape: 'ring', color: '#ff4d8d', size: 64, speed: 260 });
      M.rules.push(R({ type: 'click', a: z.id }, [{ type: 'score', n: 1 }, { type: 'sound', sound: 'pop' }, { type: 'effect', kind: 'sparks', target: '@a' }, { type: 'scatter', target: '@a' }, { type: 'speed', target: '@a', f: 1.12 }]));
      M.rules.push(R({ type: 'stat', stat: 'score', op: '>=', n: 12 }, [{ type: 'win', text: 'Schnell genug!' }]));
      return M;
    }
  },
  platformer: {
    icon: 'bolt', name: 'Hüpfen und Rennen', desc: 'Springe über Plattformen, sammle Münzen und erreiche das Ziel.', title: 'Hüpf-Abenteuer',
    mk() {
      const M = newModel(); Object.assign(M.settings, { bg: '#10244a', bg2: '#2a5f9e', pattern: 'dots', lives: 3, gravity: 1500, help: 'Pfeile oder Finger laufen, Leertaste oder nach oben tippen springt' });
      addSprite(M, 'ground'); const pa = [[18, 84], [40, 70], [62, 56], [84, 42]];
      pa.forEach((p, i) => addSprite(M, 'platform', { name: 'Plattform ' + 'ABCD'[i], x: p[0], y: p[1] }));
      const h = addSprite(M, 'hero');
      const m = addSprite(M, 'item', { name: 'Münze', shape: 'star', size: 30, motion: 'none', x: 36, y: 63, cols: 3, gapX: 12 });
      const g = addSprite(M, 'enemy', { name: 'Gegner', shape: 'ghost', color: '#ffffff', size: 40, x: 60, y: 91, motion: 'right', speed: 110, wrap: true, autoRespawn: false });
      const z = addSprite(M, 'blank', { name: 'Ziel', shape: 'crown', size: 44, x: 84, y: 33 });
      M.rules.push(R({ type: 'touch', a: h.id, b: m.id }, [{ type: 'score', n: 1 }, { type: 'sound', sound: 'coin' }, { type: 'effect', kind: 'sparks', target: '@b' }, { type: 'destroy', target: '@b' }]));
      M.rules.push(R({ type: 'touch', a: h.id, b: g.id }, [{ type: 'life', n: -1 }, { type: 'sound', sound: 'hit' }, { type: 'effect', kind: 'shake' }, { type: 'place', target: '@a', x: 8, y: 80 }]));
      M.rules.push(R({ type: 'touch', a: h.id, b: z.id }, [{ type: 'win', text: 'Ziel erreicht!' }]));
      return M;
    }
  },
  shooter: {
    icon: 'target', name: 'Weltraum-Schütze', desc: 'Fliege mit dem Raumschiff, schieße Geister ab und halte sie auf Abstand.', title: 'Weltraum-Schütze',
    mk() {
      const M = newModel(); Object.assign(M.settings, { bg: '#050816', bg2: '#1b1040', pattern: 'stars', lives: 3, help: 'Pfeile bewegen, Leertaste schießt (oder tippen)' });
      const s = addSprite(M, 'player', { name: 'Schiff', shape: 'rocket', size: 56, y: 88 });
      const b = addSprite(M, 'bullet', { name: 'Schuss', shape: 'diamond', color: '#ffd23f', size: 16, stretch: 0.6 });
      const e = addSprite(M, 'enemy', { name: 'Geist', shape: 'ghost', color: '#ffffff', size: 44, x: 14, y: 8, cols: 6, rows: 2, gapX: 30, gapY: 24, speed: 55 });
      const shoot = [{ type: 'shoot', target: s.id, sprite: b.id, dir: 'up', speed: 640 }, { type: 'sound', sound: 'shoot' }];
      M.rules.push(R({ type: 'key', key: 'SPACE' }, shoot.map(a => Object.assign({}, a))));
      M.rules.push(R({ type: 'tap' }, shoot.map(a => Object.assign({}, a))));
      M.rules.push(R({ type: 'touch', a: b.id, b: e.id }, [{ type: 'destroy', target: '@a' }, { type: 'effect', kind: 'sparks', target: '@b' }, { type: 'hurt', target: '@b', n: 1 }, { type: 'score', n: 1 }, { type: 'sound', sound: 'pop' }]));
      M.rules.push(R({ type: 'touch', a: e.id, b: s.id }, [{ type: 'life', n: -1 }, { type: 'sound', sound: 'hit' }, { type: 'effect', kind: 'shake' }, { type: 'destroy', target: '@a' }]));
      M.rules.push(R({ type: 'every', n: 1.6 }, [{ type: 'spawn', sprite: e.id, where: 'auto' }]));
      M.rules.push(R({ type: 'stat', stat: 'score', op: '>=', n: 20 }, [{ type: 'win', text: 'Sektor gesichert!' }]));
      return M;
    }
  },
  flappy: {
    icon: 'bolt', name: 'Hüpf-Vogel', desc: 'Tippe zum Flattern und fliege durch die Lücken zwischen den Säulen.', title: 'Hüpf-Vogel',
    mk() {
      const M = newModel(); Object.assign(M.settings, { bg: '#2b9cf0', bg2: '#a9defa', pattern: 'none', gravity: 1300, help: 'Tippen oder Leertaste: flattern' });
      const v = addSprite(M, 'hero', { name: 'Vogel', shape: 'blob', size: 44, x: 25, y: 45, control: 'none', physics: 'platformer', speed: 0 });
      const s = addSprite(M, 'enemy', { name: 'Säule', shape: 'square', color: '#2e9c2e', size: 280, stretch: 0.2, x: 110, y: 50, motion: 'left', speed: 220 });
      const flap = [{ type: 'jump', target: v.id, power: 480, air: true }, { type: 'sound', sound: 'jump' }];
      M.rules.push(R({ type: 'key', key: 'SPACE' }, flap.map(a => Object.assign({}, a))));
      M.rules.push(R({ type: 'tap' }, flap.map(a => Object.assign({}, a))));
      M.rules.push(R({ type: 'touch', a: v.id, b: s.id }, [{ type: 'sound', sound: 'hit' }, { type: 'effect', kind: 'shake' }, { type: 'lose', text: 'Aua!' }]));
      M.rules.push(R({ type: 'edge', a: v.id }, [{ type: 'lose', text: 'Runtergefallen' }]));
      M.rules.push(R({ type: 'every', n: 1.3 }, [{ type: 'spawn', sprite: s.id, where: 'auto' }]));
      M.rules.push(R({ type: 'every', n: 1 }, [{ type: 'score', n: 1 }]));
      return M;
    }
  },
  breakout: {
    icon: 'blocks', name: 'Ziegelbrecher', desc: 'Lenke den Ball mit dem Schläger und zerstöre alle Ziegel.', title: 'Ziegelbrecher',
    mk() {
      const M = newModel(); Object.assign(M.settings, { bg: '#0d1240', pattern: 'grid', lives: 3, help: 'Pfeile oder Finger bewegen den Schläger' });
      const p = addSprite(M, 'player', { name: 'Schläger', shape: 'square', color: '#00e5a8', size: 18, stretch: 6, y: 92, speed: 560 });
      const b = addSprite(M, 'bouncer', { name: 'Ball', shape: 'circle', color: '#ffffff', size: 18, x: 50, y: 78, speed: 380, openBottom: true });
      const z = addSprite(M, 'blank', { name: 'Ziegel', shape: 'square', color: '#ff4d6d', size: 22, stretch: 2.2, x: 26, y: 12, rows: 4, cols: 8, gapX: 6, gapY: 6 });
      M.rules.push(R({ type: 'touch', a: b.id, b: p.id }, [{ type: 'bounce', target: '@a', other: '@b' }, { type: 'sound', sound: 'pop' }]));
      M.rules.push(R({ type: 'touch', a: b.id, b: z.id }, [{ type: 'bounce', target: '@a', other: '@b' }, { type: 'score', n: 1 }, { type: 'sound', sound: 'coin' }, { type: 'effect', kind: 'sparks', target: '@b' }, { type: 'destroy', target: '@b' }]));
      M.rules.push(R({ type: 'edge', a: b.id }, [{ type: 'life', n: -1 }, { type: 'sound', sound: 'hit' }, { type: 'place', target: '@a', x: 50, y: 76 }]));
      M.rules.push(R({ type: 'stat', stat: 'count:' + z.id, op: '<=', n: 0 }, [{ type: 'win', text: 'Alle Ziegel weg!' }]));
      return M;
    }
  },
  ai: { icon: 'sparkles', name: 'Mit KI bauen', desc: 'Keine Lust selbst zu bauen? Sag einer KI, was du willst, und füge den Code hier ein.', title: 'Mein KI-Spiel', mode: 'code' },
  code: { icon: 'code', name: 'Nur Code', desc: 'Schreibe dein Spiel selbst in JavaScript. Ein kleines Beispiel ist dabei.', title: 'Mein Code-Spiel', mode: 'code' }
};
const STARTER_CODE = `// Willkommen im Code-Modus! Das hier ist ein kleines, fertiges Spiel.
// Ändere etwas und drücke Strg+Enter (oder "Neu starten"), um es auszuprobieren.

const game = Moki.game({ background: '#0d1240', lives: 3 });

// Figuren anlegen (x und y sind Prozent vom Spielfeld)
const spieler = game.sprite({ name: 'Spieler', shape: 'circle', color: '#00e5a8',
  size: 56, x: 50, y: 86, control: 'keys', axis: 'x', speed: 440 });

game.sprite({ name: 'Stern', shape: 'star', color: '#ffd23f', size: 40, x: 30, y: -5,
  motion: 'fall', speed: 230 });
game.sprite({ name: 'Stein', shape: 'triangle', color: '#ff4d6d', size: 46, x: 70, y: -5,
  motion: 'fall', speed: 280 });

// Was passiert, wenn sich zwei Figuren berühren?
game.onTouch('Spieler', 'Stern', (a, b) => {
  game.addScore(1);
  b.respawn();                       // Stern oben neu starten
  if (game.score % 5 === 0) game.say('Super!');
});
game.onTouch('Spieler', 'Stein', (a, b) => {
  game.addLife(-1);
  b.respawn();
});

game.onScore(15, () => game.win('Geschafft!'));
game.every(2, () => game.spawn('Stern'));   // alle 2 Sekunden ein neuer Stern

game.start();
`;
function newGame(kind) {
  const t = TEMPLATES[kind] || TEMPLATES.empty;
  const g = { id: null, slug: null, title: t.title, description: '', creator: App.name, icon: null, status: 'draft', dirty: true, mode: t.mode || 'builder', model: null, code: '' };
  if (g.mode === 'code') { g.code = STARTER_CODE; g.model = newModel(); } else g.model = t.mk();
  return g;
}

// ====================================================================
// Code-Erzeugung
// ====================================================================
const round = v => Math.round(num(v) * 100) / 100;
function genCode(M) {
  M = normalizeModel(M);
  const S = M.settings, L = [];
  const spr = id => M.sprites.find(s => s.id === id), nameOf = id => (spr(id) || {}).name;
  const vr = id => M.vars.find(v => v.id === id);
  L.push('// Dieses Spiel wurde im Baukasten gebaut. Du kannst den Code frei ändern.');
  const g = [`background: ${q(S.bg)}`];
  if (S.bg2) g.push(`background2: ${q(S.bg2)}`);
  if (S.pattern && S.pattern !== 'none') g.push(`pattern: ${q(S.pattern)}`);
  if (M.screens.length) g.push(`screens: [${M.screens.map(c => `{ name: ${q(c.name)}, menu: ${!!c.menu} }`).join(', ')}]`);
  g.push(`lives: ${num(S.lives) | 0}`, `time: ${num(S.time)}`, `timeMode: ${q(S.timeMode)}`, `showScore: ${!!S.showScore}`);
  if (num(S.gravity) !== 1400) g.push(`gravity: ${num(S.gravity)}`);
  if (S.help) g.push(`help: ${q(S.help)}`);
  L.push(`const game = Moki.game({ ${g.join(', ')} });`);
  if (M.vars.length) { L.push(''); M.vars.forEach(v => L.push(`game.set(${q(v.name)}, ${num(v.value)});`)); }
  if (M.sprites.length) L.push('');
  M.sprites.forEach(s => {
    const o = [`name: ${q(s.name)}`, `shape: ${q(s.shape)}`, `color: ${q(s.color)}`, `size: ${round(s.size)}`, `x: ${round(s.x)}`, `y: ${round(s.y)}`];
    if (num(s.stretch) !== 1) o.push(`stretch: ${round(s.stretch)}`);
    if (num(s.angle)) o.push(`angle: ${round(s.angle)}`);
    if (num(s.spin)) o.push(`spin: ${round(s.spin)}`);
    if (num(s.opacity) !== 1) o.push(`opacity: ${round(s.opacity)}`);
    if (s.control !== 'none') o.push(`control: ${q(s.control)}`, `axis: ${q(s.axis)}`);
    if (s.motion !== 'none') o.push(`motion: ${q(s.motion)}`);
    if (s.control !== 'none' || s.motion !== 'none' || num(s.speed) !== 200) o.push(`speed: ${round(s.speed)}`);
    if (s.physics !== 'none') o.push(`physics: ${q(s.physics)}`);
    if (s.physics === 'platformer' && num(s.jump) !== 640) o.push(`jump: ${round(s.jump)}`);
    if (s.solid) o.push('solid: true');
    const scn = M.screens.find(c => c.id === s.screen); if (scn) o.push(`screen: ${q(scn.name)}`);
    if (num(s.hp) !== 1) o.push(`hp: ${num(s.hp)}`);
    if (s.wrap) o.push('wrap: true');
    if (s.openBottom && s.motion === 'bounce') o.push('openBottom: true');
    if (s.label) o.push(`label: ${q(s.label)}`);
    if (num(s.cols) > 1 || num(s.rows) > 1) o.push(`cols: ${num(s.cols) || 1}`, `rows: ${num(s.rows) || 1}`, `gapX: ${num(s.gapX)}`, `gapY: ${num(s.gapY)}`);
    L.push(`game.sprite({ ${o.join(', ')} });`);
  });
  const tg = t => (t === '@a' ? { kind: 'v', v: 'a' } : t === '@b' ? { kind: 'v', v: 'b' } : nameOf(t) ? { kind: 'f', n: nameOf(t) } : null);
  const stat = k => {
    if (k === 'score') return 'game.score'; if (k === 'lives') return 'game.lives'; if (k === 'time') return 'game.time';
    if (String(k).startsWith('var:')) { const v = vr(k.slice(4)); return v ? `game.get(${q(v.name)})` : null; }
    if (String(k).startsWith('count:')) { const n = nameOf(k.slice(6)); return n ? `game.count(${q(n)})` : null; }
    return null;
  };
  const scrName = id => (M.screens.find(c => c.id === id) || {}).name;
  const cmp = c => {
    if (String(c.stat).startsWith('screen:')) { const n = scrName(c.stat.slice(7)); return n ? `game.screen ${c.op === '!=' ? '!==' : '==='} ${q(n)}` : null; }
    const e = stat(c.stat); const op = OPS.some(o => o[0] === c.op) ? c.op : '>='; return e ? `${e} ${op} ${num(c.n)}` : null; };
  function act(a, P) {
    const onT = fn => {
      const t = tg(a.target); if (!t) return [P + `// (Figur fehlt: ${a.type})`];
      if (t.kind === 'v') return [P + fn(t.v)];
      return [P + `{ const t = game.find(${q(t.n)}); if (t) ${fn('t')} }`];
    };
    const other = () => { const t = tg(a.other); return t ? (t.kind === 'v' ? t.v : `game.find(${q(t.n)})`) : null; };
    const dir = d => q(DIRS.some(x => x[0] === d) ? d : 'up');
    switch (a.type) {
      case 'score': return [P + `game.addScore(${num(a.n)});`];
      case 'life': return [P + `game.addLife(${num(a.n)});`];
      case 'setvar': { const v = vr(a.var); return v ? [P + `game.set(${q(v.name)}, ${num(a.n)});`] : [P + '// (Variable fehlt)']; }
      case 'addvar': { const v = vr(a.var); return v ? [P + `game.change(${q(v.name)}, ${num(a.n)});`] : [P + '// (Variable fehlt)']; }
      case 'respawn': return onT(v => v + '.respawn();');
      case 'scatter': return onT(v => v + '.scatter();');
      case 'destroy': return onT(v => v + '.destroy();');
      case 'place': return onT(v => `${v}.place(${num(a.x)}, ${num(a.y)});`);
      case 'fly': return onT(v => `${v}.fly(${dir(a.dir)}, ${num(a.speed) || 300});`);
      case 'stop': return onT(v => v + '.stop();');
      case 'move': return onT(v => `${v}.nudge(${dir(a.dir)}, ${num(a.speed) || 200} * (typeof dt === 'number' ? dt : 0.02));`);
      case 'jump': return onT(v => `${v}.jump(${num(a.power) || 640}${a.air ? ', true' : ''});`);
      case 'shoot': return nameOf(a.sprite) ? onT(v => `${v}.shoot(${q(nameOf(a.sprite))}, ${dir(a.dir)}, ${num(a.speed) || 520});`) : [P + '// (Figur fehlt: shoot)'];
      case 'hurt': return onT(v => `${v}.hurt(${num(a.n) || 1});`);
      case 'bounce': { const o = other(); return o ? onT(v => `${v}.bounceOff(${o});`) : [P + '// (Figur fehlt: bounce)']; }
      case 'speed': return onT(v => `${v}.speed *= ${num(a.f) || 1};`);
      case 'grow': return onT(v => `${v}.size *= ${num(a.f) || 1};`);
      case 'color': return onT(v => `${v}.color = ${q(a.color || '#ffffff')};`);
      case 'show': return onT(v => `${v}.visible = ${a.visible === false ? 'false' : 'true'};`);
      case 'spawn': {
        const n = nameOf(a.sprite); if (!n) return [P + '// (Figur fehlt: spawn)'];
        const w = a.where || 'auto';
        if (w === 'auto') return [P + `game.spawn(${q(n)});`];
        if (w === 'random') return [P + `game.spawn(${q(n)})?.scatter();`];
        if (w === 'xy') return [P + `game.spawn(${q(n)})?.place(${num(a.x)}, ${num(a.y)});`];
        const t = tg(w === 'at@a' ? '@a' : '@b'); return [P + `{ const n = game.spawn(${q(n)}); if (n) { n.x = ${t.v}.x; n.y = ${t.v}.y; } }`];
      }
      case 'sound': return [P + `game.sound(${q(a.sound || 'coin')});`];
      case 'effect':
        if (a.kind === 'shake') return [P + 'game.shake(300);'];
        if (a.kind === 'flash') return [P + 'game.flash("#ffffff");'];
        return onT(v => (a.kind === 'boom' ? `{ ${v}.burst(null, 30); game.shake(200); }` : `${v}.burst();`));
      case 'say': return [P + `game.say(${q(a.text || '')}, 2);`];
      case 'win': return [P + `game.win(${q(a.text || 'Gewonnen!')});`];
      case 'lose': return [P + `game.lose(${q(a.text || 'Verloren')});`];
      case 'go': { const n = scrName(a.screen); return n ? [P + `game.go(${q(n)});`] : [P + '// (Bildschirm fehlt)']; }
      case 'restart': return [P + 'game.restart();'];
    }
    return [];
  }
  M.rules.forEach(r => {
    const w = r.when || {}; let head = null;
    if (w.type === 'start') head = 'game.onStart(() => {';
    else if (w.type === 'key') head = `game.onKey(${q(w.key || 'SPACE')}, () => {`;
    else if (w.type === 'hold') head = `game.onKeyHold(${q(w.key || 'SPACE')}, (dt) => {`;
    else if (w.type === 'tap') head = 'game.onPointer(() => {';
    else if (w.type === 'touch') head = nameOf(w.a) && nameOf(w.b) ? `game.onTouch(${q(nameOf(w.a))}, ${q(nameOf(w.b))}, (a, b) => {` : null;
    else if (w.type === 'edge') head = nameOf(w.a) ? `game.onEdge(${q(nameOf(w.a))}, (a) => {` : null;
    else if (w.type === 'click') head = nameOf(w.a) ? `game.onClick(${q(nameOf(w.a))}, (a) => {` : null;
    else if (w.type === 'destroyed') head = nameOf(w.a) ? `game.onDestroy(${q(nameOf(w.a))}, (a) => {` : null;
    else if (w.type === 'every') head = `game.every(${num(w.n) || 1}, () => {`;
    else if (w.type === 'after') head = `game.after(${num(w.n) || 1}, () => {`;
    else if (w.type === 'score') head = `game.onScore(${num(w.n)}, () => {`;
    else if (w.type === 'screen') { const n = scrName(w.screen); head = n ? `game.onScreen(${q(n)}, () => {` : null; }
    else if (w.type === 'stat') { const e = cmp(w); head = e ? `game.when(() => ${e}, () => {` : null; }
    L.push('');
    if (!head) { L.push('// (Regel unvollständig, es fehlt eine Angabe)'); return; }
    const conds = (r.conds || []).map(cmp).filter(Boolean);
    L.push(head);
    const I = conds.length ? '    ' : '  ';
    if (conds.length) L.push(`  if (${conds.join(' && ')}) {`);
    (r.then || []).forEach(a => act(a, I).forEach(x => L.push(x)));
    if (conds.length) L.push('  }');
    L.push('});');
  });
  L.push(''); L.push('game.start();');
  return L.join('\n') + '\n';
}
const currentCode = () => (App.g.mode === 'code' ? App.g.code : genCode(App.g.model));
