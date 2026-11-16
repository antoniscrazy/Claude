// Moki Engine v2: kleine 2D-Spiele-Engine. Läuft IM Spiel-Frame (Studio-Vorschau und Moki-Spielseite).
// Spielfeld 800 x 500. Beim Anlegen sind x/y in PROZENT (0-100), zur Laufzeit sind s.x/s.y in PIXELN (Mitte der Figur).
// (Davor im selben Skript: motifs.js mit MOKI_SHAPES und MOKI_MOTIFS.)
(function () {
  'use strict';
  var W = 800, H = 500, MAXS = 400, MAXP = 500;
  function send(o) { try { o.moki = 1; window.parent.postMessage(o, '*'); } catch (e) {} }

  // Konsole und Fehler an das Studio weiterreichen
  ['log', 'info', 'warn', 'error'].forEach(function (k) {
    var orig = console[k];
    console[k] = function () {
      var t = Array.prototype.map.call(arguments, function (a) {
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a); } catch (e) { return String(a); }
      }).join(' ');
      send({ type: 'log', level: k, text: t });
      try { orig.apply(console, arguments); } catch (e) {}
    };
  });
  window.addEventListener('error', function (e) { send({ type: 'error', text: e.message, line: e.lineno || 0 }); });
  window.addEventListener('unhandledrejection', function (e) { var r = e.reason; send({ type: 'error', text: String((r && r.message) || r), line: 0 }); });

  // ---------- Formen und Bilder ----------
  var PATHS = {}, IMGS = {};
  Object.keys(MOKI_SHAPES).forEach(function (k) { PATHS[k] = new Path2D(MOKI_SHAPES[k]); });
  MOKI_MOTIFS.forEach(function (m) {
    if (m.id === 'star' || m.id === 'heart') return;
    var img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200"><g stroke="#0d1240" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">' + m.svg + '</g></svg>');
    IMGS[m.id] = img;
  });
  function validShape(s) { return s === 'square' || s === 'text' || s === 'button' || !!PATHS[s] || !!IMGS[s]; }
  function rr(w, h, r) {   // abgerundetes Rechteck mit gleichmäßigem Radius, Mitte bei 0,0
    var p = new Path2D(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
    p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); return p;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function keyName(e) {
    var c = e.code || '';
    if (c === 'Space') return 'SPACE';
    if (c.indexOf('Arrow') === 0) return c.slice(5).toUpperCase();
    if (c.indexOf('Key') === 0) return c.slice(3).toUpperCase();
    if (c === 'Enter') return 'ENTER';
    return String(e.key || '').toUpperCase();
  }

  // ---------- Töne (selbst erzeugt, keine Dateien) ----------
  var AC = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return AC; }
  function tone(f0, f1, dur, type, vol, delay) {
    var c = ac(); if (!c) return;
    try {
      if (c.state === 'suspended') c.resume();
      var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol || 0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function noise(dur, vol) {
    var c = ac(); if (!c) return;
    try {
      if (c.state === 'suspended') c.resume();
      var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      var s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = vol || 0.2; s.connect(g); g.connect(c.destination); s.start();
    } catch (e) {}
  }
  var SOUNDS = {
    coin: function () { tone(880, 1320, 0.12, 'square', 0.1); tone(1320, 1760, 0.14, 'square', 0.1, 0.09); },
    hit: function () { tone(220, 70, 0.2, 'sawtooth', 0.14); },
    jump: function () { tone(280, 620, 0.16, 'square', 0.1); },
    shoot: function () { tone(1000, 180, 0.12, 'sawtooth', 0.09); },
    pop: function () { tone(500, 1000, 0.08, 'sine', 0.16); },
    powerup: function () { tone(400, 800, 0.1, 'square', 0.1); tone(600, 1200, 0.1, 'square', 0.1, 0.1); tone(900, 1800, 0.16, 'square', 0.1, 0.2); },
    explosion: function () { noise(0.35, 0.25); tone(120, 40, 0.3, 'sawtooth', 0.12); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, f, 0.18, 'triangle', 0.14, i * 0.12); }); },
    lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, f * 0.96, 0.22, 'triangle', 0.14, i * 0.15); }); }
  };

  function createGame(o) {
    o = o || {};
    var G = {
      score: 0, lives: o.lives | 0, time: 0, state: 'ready', width: W, height: H, vars: {}, gravity: o.gravity != null ? +o.gravity : 1400,
      background: o.background || '#0d1240', background2: o.background2 || '', pattern: o.pattern || 'none', help: o.help || '',
      title: o.title || window.MOKI_TITLE || 'Spiel', timeLimit: +o.time || 0, timeMode: o.timeMode === 'lose' ? 'lose' : 'win', showScore: o.showScore !== false
    };
    var scr = {}; (o.screens || []).forEach(function (x) { if (x && x.name) scr[x.name] = { menu: !!x.menu }; });
    G.screens = (o.screens && o.screens.length) ? scr : null;
    G.screen = G.screens ? o.screens[0].name : '';
    var sprites = [], defs = {}, nextId = 1, touching = {}, timers = [], scoreCbs = [], whens = [], msg = null, endMsg = '';
    var parts = [], shakeT = 0, flashC = '', flashT = 0, stars = [];
    var h = { screen: {}, start: [], update: [], key: {}, hold: {}, up: {}, touch: [], edge: [], click: [], pointer: [], destroy: [] };
    var down = {}, pointer = { x: W / 2, y: H / 2, down: false, seen: false };
    for (var si = 0; si < 70; si++) stars.push([Math.random() * W, Math.random() * H, Math.random() * 1.8 + 0.4, Math.random() * 0.6 + 0.3]);

    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    document.body.appendChild(cv);
    var css = document.createElement('style');
    css.textContent = 'html,body{margin:0;height:100%;background:#000;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}' +
      'canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100vw,160vh);height:min(62.5vw,100vh);display:block;outline:none}';
    document.head.appendChild(css);
    function fit() { var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d)); }
    addEventListener('resize', fit); fit();
    cv.tabIndex = 0;

    function fmt(t) {   // {score} {lives} {time} {meineVariable}
      return String(t).replace(/\{([^{}]+)\}/g, function (m, k) {
        k = k.trim();
        if (k === 'score') return G.score; if (k === 'lives') return G.lives; if (k === 'message') return endMsg;
        if (k === 'time') return G.timeLimit > 0 ? Math.max(0, Math.ceil(G.timeLimit - G.time)) : Math.floor(G.time);
        return Object.prototype.hasOwnProperty.call(G.vars, k) ? G.vars[k] : m;
      });
    }

    // ---------- Figuren ----------
    function Sprite(opt) {
      this.id = nextId++;
      this.name = String(opt.name || 'Figur');
      this.shape = validShape(opt.shape) ? opt.shape : 'circle';
      this.color = opt.color || '#00e5a8';
      this.size = +opt.size || 40;
      this.stretch = +opt.stretch || 1;
      this.angle = +opt.angle || 0;
      this.spin = +opt.spin || 0;
      this.opacity = opt.opacity != null ? +opt.opacity : 1;
      this.control = opt.control || 'none';
      this.axis = opt.axis || 'xy';
      this.motion = opt.motion || 'none';
      this.speed = opt.speed != null ? +opt.speed : 200;
      this.physics = opt.physics || 'none';        // none | platformer | topdown
      this.solid = !!opt.solid;
      this.hp = opt.hp != null ? +opt.hp : 1; this.maxHp = this.hp;
      this.wrap = !!opt.wrap;
      this.openBottom = !!opt.openBottom;
      this.jumpPower = opt.jump != null ? +opt.jump : 640;
      this.autoRespawn = opt.autoRespawn !== false;
      this.killOutside = !!opt.killOutside;
      this.label = opt.label || '';
      this.z = +opt.z || 0;
      this.screen = opt.screen || '';
      this.visible = opt.visible !== false;
      this.alive = true; this.out = false; this.onGround = false; this.vy = 0; this.hurtT = 0;
      this.x = (opt.x != null ? +opt.x : 50) / 100 * W;
      this.y = (opt.y != null ? +opt.y : 50) / 100 * H;
      this.bx = 0; this.by = 0;
      if (this.motion === 'bounce') { var a = rand(0.5, 1.1), sx = Math.random() < .5 ? 1 : -1, sy = Math.random() < .5 ? 1 : -1; this.bx = Math.cos(a) * sx; this.by = Math.sin(a) * sy; }
      this._opt = opt;
    }
    Object.defineProperty(Sprite.prototype, 'w', { get: function () { return this.size * this.stretch; } });
    Object.defineProperty(Sprite.prototype, 'h', { get: function () { return this.size; } });
    Sprite.prototype.place = function (xp, yp) { this.x = xp / 100 * W; this.y = yp / 100 * H; this.out = false; this.vy = 0; return this; };
    Sprite.prototype.scatter = function () { this.x = rand(this.w / 2, W - this.w / 2); this.y = rand(this.h / 2, H - this.h / 2); this.out = false; return this; };
    Sprite.prototype.destroy = function () { if (!this.alive) return; this.alive = false; var s = this; h.destroy.forEach(function (d) { if (d.a === s.name) safe(d.f, s); }); };
    Sprite.prototype.clone = function () {
      var c = add(new Sprite(Object.assign({}, this._opt, { rows: 1, cols: 1 })));
      c.x = this.x; c.y = this.y; c.color = this.color; c.size = this.size; c.speed = this.speed; c.angle = this.angle; c.bx = this.bx; c.by = this.by; return c;
    };
    Sprite.prototype.touches = function (o) { return hit(this, o); };
    Sprite.prototype.respawn = function () {
      var w = this.w, hh = this.h, m = this.motion;
      if (m === 'fall') { this.x = rand(w / 2, W - w / 2); this.y = -hh / 2; }
      else if (m === 'rise') { this.x = rand(w / 2, W - w / 2); this.y = H + hh / 2; }
      else if (m === 'left') { this.x = W + w / 2; this.y = rand(hh / 2, H - hh / 2); }
      else if (m === 'right') { this.x = -w / 2; this.y = rand(hh / 2, H - hh / 2); }
      else return this.scatter();
      this.out = false; return this;
    };
    Sprite.prototype.hurt = function (n) {
      n = n == null ? 1 : +n; if (!this.alive) return this;
      this.hp -= n; this.hurtT = 0.18;
      if (this.hp <= 0) { this.burst(this.color, 12); this.destroy(); }
      return this;
    };
    Sprite.prototype.jump = function (p, air) { if (air || this.onGround || this.physics !== 'platformer') { this.vy = -(p != null ? +p : this.jumpPower); this.onGround = false; return true; } return false; };
    Sprite.prototype.fly = function (dir, speed) { var d = toDir(this, dir); this.motion = 'drift'; this.bx = d[0]; this.by = d[1]; if (speed != null) this.speed = +speed; return this; };
    Sprite.prototype.stop = function () { this.motion = 'none'; this.bx = 0; this.by = 0; this.vy = 0; return this; };
    Sprite.prototype.nudge = function (dir, px) { var d = toDir(this, dir); this.x += d[0] * px; this.y += d[1] * px; return this; };
    Sprite.prototype.shoot = function (name, dir, speed) {
      var d = defs[name]; if (!d) return null;
      var p = add(new Sprite(Object.assign({}, d, { rows: 1, cols: 1, motion: 'drift', control: 'none', physics: 'none', killOutside: true, autoRespawn: false })));
      var v = toDir(this, dir); p.bx = v[0]; p.by = v[1]; p.speed = speed != null ? +speed : 520;
      p.x = this.x + v[0] * (this.w / 2 + p.w / 2); p.y = this.y + v[1] * (this.h / 2 + p.h / 2); return p;
    };
    Sprite.prototype.bounceOff = function (o) {
      var dx = this.x - o.x, dy = this.y - o.y, px = (this.w + o.w) / 2 - Math.abs(dx), py = (this.h + o.h) / 2 - Math.abs(dy);
      if (px <= 0 || py <= 0) return this;
      if (px < py) { this.x += dx > 0 ? px : -px; this.bx = (dx > 0 ? 1 : -1) * Math.abs(this.bx || 0.5); }
      else {
        this.y += dy > 0 ? py : -py; var up = dy < 0; var off = clamp(dx / (o.w / 2), -1, 1);
        this.bx = off * 0.85; this.by = (up ? -1 : 1) * Math.sqrt(Math.max(0.1, 1 - this.bx * this.bx));
      }
      return this;
    };
    Sprite.prototype.burst = function (color, n) { burst(this.x, this.y, color || this.color, n); return this; };
    function add(s) { if (sprites.length < MAXS) sprites.push(s); else s.alive = false; return s; }
    function toDir(s, d) {
      if (Array.isArray(d)) { var l = Math.sqrt(d[0] * d[0] + d[1] * d[1]) || 1; return [d[0] / l, d[1] / l]; }
      if (typeof d === 'number') { var r = d * Math.PI / 180; return [Math.cos(r), Math.sin(r)]; }
      if (d && typeof d === 'object' && d.x != null) { var ax = d.x - s.x, ay = d.y - s.y, l2 = Math.sqrt(ax * ax + ay * ay) || 1; return [ax / l2, ay / l2]; }
      switch (String(d)) {
        case 'up': return [0, -1]; case 'down': return [0, 1]; case 'left': return [-1, 0]; case 'right': return [1, 0];
        case 'pointer': var px = pointer.x - s.x, py = pointer.y - s.y, l3 = Math.sqrt(px * px + py * py) || 1; return [px / l3, py / l3];
      }
      return [0, -1];
    }
    G.sprite = function (opt) {
      opt = opt || {};
      var cols = Math.max(1, Math.min(40, opt.cols | 0 || 1)), rows = Math.max(1, Math.min(40, opt.rows | 0 || 1));
      var first = null;
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
        var s = add(new Sprite(opt));
        s.x += i * (s.w + (+opt.gapX || 8)); s.y += j * (s.h + (+opt.gapY || 8));
        if (!first) first = s;
      }
      if (!defs[first.name]) defs[first.name] = Object.assign({}, opt, { rows: 1, cols: 1 });
      return first;
    };
    G.spawn = function (name) { var d = defs[name]; if (!d) return null; var s = add(new Sprite(d)); s.respawn(); return s; };
    G.find = function (name) { for (var i = 0; i < sprites.length; i++) if (sprites[i].alive && sprites[i].name === name) return sprites[i]; return null; };
    G.all = function (name) { return sprites.filter(function (s) { return s.alive && (!name || s.name === name); }); };
    G.count = function (name) { var n = 0; for (var i = 0; i < sprites.length; i++) if (sprites[i].alive && (!name || sprites[i].name === name)) n++; return n; };
    function nm(x) { return typeof x === 'string' ? x : (x && x.name); }
    function act(s) { return !G.screens || !s.screen || s.screen === G.screen; }
    function frozen() { return !!(G.screens && G.screens[G.screen] && G.screens[G.screen].menu); }
    G.go = function (name) {
      if (!G.screens || !G.screens[name]) return;
      G.screen = name; touching = {}; pointer.down = false;
      (h.screen[name] || []).forEach(function (f) { safe(f); });
    };
    G.onScreen = function (name, f) { (h.screen[name] = h.screen[name] || []).push(f); };

    function bw(s) { return s.w * (s.shape === 'square' || s.shape === 'button' || IMGS[s.shape] ? 0.45 : 0.4); }
    function bh(s) { return s.h * (s.shape === 'square' || s.shape === 'button' || IMGS[s.shape] ? 0.45 : 0.4); }
    function hit(a, b) { return Math.abs(a.x - b.x) < bw(a) + bw(b) && Math.abs(a.y - b.y) < bh(a) + bh(b); }
    function overlap(a, b) { return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2; }

    // ---------- Ereignisse ----------
    G.onStart = function (f) { h.start.push(f); };
    G.onUpdate = function (f) { h.update.push(f); };
    G.onKey = function (k, f) { k = String(k).toUpperCase(); (h.key[k] = h.key[k] || []).push(f); };
    G.onKeyHold = function (k, f) { k = String(k).toUpperCase(); (h.hold[k] = h.hold[k] || []).push(f); };
    G.onKeyUp = function (k, f) { k = String(k).toUpperCase(); (h.up[k] = h.up[k] || []).push(f); };
    G.onTouch = function (a, b, f) { h.touch.push({ a: nm(a), b: nm(b), f: f }); };
    G.onEdge = function (a, f) { h.edge.push({ a: nm(a), f: f }); };
    G.onClick = function (a, f) { h.click.push({ a: nm(a), f: f }); };
    G.onPointer = function (f) { h.pointer.push(f); };
    G.onDestroy = function (a, f) { h.destroy.push({ a: nm(a), f: f }); };
    G.every = function (sec, f) { timers.push({ t: 0, every: Math.max(0.05, +sec || 1), f: f }); };
    G.after = function (sec, f) { timers.push({ t: 0, every: Math.max(0.01, +sec || 1), f: f, once: true }); };
    G.onScore = function (n, f) { scoreCbs.push({ n: +n, f: f, done: false }); };
    G.when = function (cond, f) { whens.push({ c: cond, f: f, was: false }); };

    // ---------- Aktionen ----------
    G.set = function (k, v) { G.vars[k] = v; }; G.get = function (k) { return Object.prototype.hasOwnProperty.call(G.vars, k) ? G.vars[k] : 0; };
    G.change = function (k, d) { G.vars[k] = (+G.get(k) || 0) + (+d || 0); };
    G.addScore = function (n) { G.score += (+n || 0); };
    G.addLife = function (n) { G.lives = Math.max(0, G.lives + (+n || 0)); if (G.lives === 0 && n < 0 && G.state === 'play' && o.lives > 0) G.lose('Keine Leben mehr'); };
    G.say = function (t, sec) { msg = { t: String(t), left: sec == null ? 2 : +sec }; };
    G.win = function (m) { if (G.state !== 'play') return; endMsg = m || 'Gewonnen!'; SOUNDS.win(); if (G.screens && G.screens['Gewonnen']) { G.go('Gewonnen'); return; } G.state = 'won'; };
    G.lose = function (m) { if (G.state !== 'play') return; endMsg = m || 'Verloren'; SOUNDS.lose(); if (G.screens && G.screens['Verloren']) { G.go('Verloren'); return; } G.state = 'lost'; };
    G.sound = function (n) { var f = SOUNDS[n]; if (f) f(); };
    G.shake = function (ms) { shakeT = Math.max(shakeT, (+ms || 300) / 1000); };
    G.flash = function (c) { flashC = c || '#ffffff'; flashT = 0.35; };
    function burst(x, y, c, n) { n = Math.min(n || 14, 60); for (var i = 0; i < n && parts.length < MAXP; i++) { var a = Math.random() * 6.283, sp = rand(60, 320); parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.35, 0.8), max: 0.8, c: c || '#fff', s: rand(3, 7) }); } }
    G.burst = function (xp, yp, c, n) { burst(xp / 100 * W, yp / 100 * H, c, n); };
    G.random = rand;
    G.restart = function () { restart(); };
    G.start = function () { loopStart(); if (G.screens && G.state === 'ready') startPlay(); };

    function startPlay() {
      if (G.state !== 'ready') return;
      ac(); G.state = 'play'; cv.focus();
      h.start.forEach(function (f) { safe(f); });
      if (G.screens) (h.screen[G.screen] || []).forEach(function (f) { safe(f); });
    }
    function restart() { if (window.parent !== window) send({ type: 'restart' }); else location.reload(); }
    function safe(f, a, b) { try { f(a, b); } catch (e) { console.error(e && e.message ? e.message : String(e)); } }

    // ---------- Eingabe ----------
    function setPointer(e) { var r = cv.getBoundingClientRect(); pointer.x = (e.clientX - r.left) / r.width * W; pointer.y = (e.clientY - r.top) / r.height * H; pointer.seen = true; }
    cv.addEventListener('pointermove', setPointer);
    cv.addEventListener('pointerdown', function (e) {
      setPointer(e); pointer.down = true; ac();
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      if (G.state === 'ready') { startPlay(); return; }
      if (G.state === 'won' || G.state === 'lost') { restart(); return; }
      sprites.forEach(function (s) { if (s.alive && act(s) && s.physics === 'platformer' && s.control !== 'none' && pointer.y < s.y - s.h * 0.6) s.jump(); });
      for (var i = sprites.length - 1; i >= 0; i--) {
        var s = sprites[i]; if (!s.alive || !act(s)) continue;
        if (Math.abs(pointer.x - s.x) < s.w / 2 + 6 && Math.abs(pointer.y - s.y) < s.h / 2 + 6) { h.click.forEach(function (c) { if (c.a === s.name) safe(c.f, s); }); break; }
      }
      h.pointer.forEach(function (f) { safe(f, pointer.x, pointer.y); });
    });
    cv.addEventListener('pointerup', function () { pointer.down = false; });
    cv.addEventListener('pointercancel', function () { pointer.down = false; });
    addEventListener('keydown', function (e) {
      var k = keyName(e);
      if (['SPACE', 'LEFT', 'RIGHT', 'UP', 'DOWN'].indexOf(k) > -1) e.preventDefault();
      if (G.state === 'ready' && !e.repeat) { startPlay(); return; }
      if ((G.state === 'won' || G.state === 'lost') && (k === 'SPACE' || k === 'ENTER') && !e.repeat) { restart(); return; }
      if (!down[k] && G.state === 'play') {
        if (h.key[k]) h.key[k].forEach(function (f) { safe(f); });
        if (k === 'SPACE' || k === 'UP' || k === 'W') sprites.forEach(function (s) { if (s.alive && act(s) && s.physics === 'platformer' && s.control === 'keys') s.jump(); });
      }
      down[k] = true;
    });
    addEventListener('keyup', function (e) { var k = keyName(e); down[k] = false; if (G.state === 'play' && h.up[k]) h.up[k].forEach(function (f) { safe(f); }); });
    addEventListener('blur', function () { down = {}; pointer.down = false; });
    function pressed(a, b) { return down[a] || down[b]; }

    // ---------- Update ----------
    function moveSolid(s, dx, dy) {
      var solids = sprites.filter(function (o) { return o.alive && o.solid && o !== s; }), i, o;
      s.x += dx;
      for (i = 0; i < solids.length; i++) { o = solids[i]; if (overlap(s, o)) { if (dx > 0) s.x = o.x - (o.w + s.w) / 2; else if (dx < 0) s.x = o.x + (o.w + s.w) / 2; } }
      s.y += dy; s.onGround = false;
      for (i = 0; i < solids.length; i++) {
        o = solids[i];
        if (overlap(s, o)) {
          if (dy > 0) { s.y = o.y - (o.h + s.h) / 2; s.vy = 0; s.onGround = true; }
          else if (dy < 0) { s.y = o.y + (o.h + s.h) / 2; if (s.vy < 0) s.vy = 0; }
        }
      }
    }
    function fxStep(dt) {
      for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; if (p.life <= 0) parts.splice(i, 1); }
      if (shakeT > 0) shakeT -= dt; if (flashT > 0) flashT -= dt;
    }
    function update(dt) {
      if (frozen()) { fxStep(dt); return; }
      G.time += dt;
      if (msg) { msg.left -= dt; if (msg.left <= 0) msg = null; }
      var i, s, k;
      for (k in h.hold) if (down[k]) h.hold[k].forEach(function (f) { safe(f, dt); });
      for (i = 0; i < sprites.length; i++) {
        s = sprites[i]; if (!s.alive || !act(s)) continue;
        var w2 = s.w / 2, h2 = s.h / 2, cvx = 0, cvy = 0, ph = s.physics;
        if (s.hurtT > 0) s.hurtT -= dt;
        if (s.spin) s.angle += s.spin * dt;
        if (s.control === 'keys') {
          var dx = 0, dy = 0;
          if (s.axis !== 'y') dx = (pressed('RIGHT', 'D') ? 1 : 0) - (pressed('LEFT', 'A') ? 1 : 0);
          if (s.axis !== 'x' && ph !== 'platformer') dy = (pressed('DOWN', 'S') ? 1 : 0) - (pressed('UP', 'W') ? 1 : 0);
          if (pointer.down) {
            if (s.axis !== 'y' && Math.abs(pointer.x - s.x) > 6) dx = pointer.x > s.x ? 1 : -1;
            if (s.axis !== 'x' && ph !== 'platformer' && Math.abs(pointer.y - s.y) > 6) dy = pointer.y > s.y ? 1 : -1;
          }
          var l = Math.sqrt(dx * dx + dy * dy) || 1; cvx = dx / l * s.speed; cvy = dy / l * s.speed;
        } else if (s.control === 'mouse' && pointer.seen) {
          if (s.axis !== 'y') s.x = pointer.x;
          if (s.axis !== 'x') s.y = pointer.y;
        }
        var m = s.motion, mvx = 0, mvy = 0;
        if (m === 'fall') mvy = s.speed; else if (m === 'rise') mvy = -s.speed;
        else if (m === 'left') mvx = -s.speed; else if (m === 'right') mvx = s.speed;
        else if (m === 'bounce' || m === 'drift') { mvx = s.bx * s.speed; mvy = s.by * s.speed; }
        else if (m === 'follow') {
          var t = null; for (var j = 0; j < sprites.length; j++) if (sprites[j] !== s && sprites[j].alive && sprites[j].control !== 'none') { t = sprites[j]; break; }
          if (t) { var ax = t.x - s.x, ay = t.y - s.y, d = Math.sqrt(ax * ax + ay * ay) || 1; mvx = ax / d * s.speed; mvy = ay / d * s.speed; }
        }
        var vx = cvx + mvx, vy = cvy + mvy;
        if (ph === 'platformer') { s.vy += G.gravity * dt; vy = s.vy + mvy; }
        if (ph !== 'none') moveSolid(s, vx * dt, vy * dt); else { s.x += vx * dt; s.y += vy * dt; }
        // Rand-Verhalten
        if (s.control !== 'none') { s.x = clamp(s.x, w2, W - w2); if (ph !== 'platformer') s.y = clamp(s.y, h2, H - h2); }
        if (m === 'bounce') {
          if (s.x < w2) { s.x = w2; s.bx = Math.abs(s.bx); } else if (s.x > W - w2) { s.x = W - w2; s.bx = -Math.abs(s.bx); }
          if (s.y < h2) { s.y = h2; s.by = Math.abs(s.by); } else if (s.y > H - h2 && !s.openBottom) { s.y = H - h2; s.by = -Math.abs(s.by); }
        }
        if (s.wrap) { if (s.x < -w2) s.x = W + w2; else if (s.x > W + w2) s.x = -w2; if (s.y < -h2) s.y = H + h2; else if (s.y > H + h2) s.y = -h2; }
        var outNow = !s.wrap && (s.x < -w2 || s.x > W + w2 || s.y < -h2 || s.y > H + h2);
        if (outNow && !s.out) {
          s.out = true; var sp = s;
          h.edge.forEach(function (e) { if (e.a === sp.name) safe(e.f, sp); });
          if (s.alive && s.killOutside) s.alive = false;
          else if (s.alive && s.autoRespawn && (m === 'fall' || m === 'rise' || m === 'left' || m === 'right')) s.respawn();
        } else if (!outNow) s.out = false;
      }
      h.touch.forEach(function (tc) {
        var A = G.all(tc.a).filter(act), B = G.all(tc.b).filter(act);
        A.forEach(function (a) { B.forEach(function (b) {
          if (a === b || !a.alive || !b.alive) return;
          var key = tc.a + '|' + tc.b + '|' + a.id + '|' + b.id, inx = hit(a, b);
          if (inx && !touching[key]) { touching[key] = 1; safe(tc.f, a, b); } else if (!inx) delete touching[key];
        }); });
      });
      timers.forEach(function (t) { t.t += dt; while (t.t >= t.every && !t.dead) { t.t -= t.every; safe(t.f); if (t.once) t.dead = true; } });
      timers = timers.filter(function (t) { return !t.dead; });
      scoreCbs.forEach(function (c) { if (!c.done && G.score >= c.n) { c.done = true; safe(c.f); } });
      whens.forEach(function (w) { var v = false; try { v = !!w.c(); } catch (e) {} if (v && !w.was) safe(w.f); w.was = v; });
      h.update.forEach(function (f) { safe(f, dt); });
      fxStep(dt);
      sprites = sprites.filter(function (s) { return s.alive; });
      if (G.timeLimit > 0 && G.time >= G.timeLimit && G.state === 'play') { G.time = G.timeLimit; G.timeMode === 'win' ? G.win('Geschafft!') : G.lose('Zeit abgelaufen'); }
    }

    // ---------- Zeichnen ----------
    function text(t, x, y, size, color, align, weight) {
      ctx.font = (weight || 800) + ' ' + size + 'px "Segoe UI",system-ui,sans-serif';
      ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color || '#fff'; ctx.fillText(t, x, y);
    }
    function overlay(a) { ctx.fillStyle = 'rgba(8,10,35,' + a + ')'; ctx.fillRect(0, 0, W, H); }
    function drawBg() {
      if (G.background2) { var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, G.background); g.addColorStop(1, G.background2); ctx.fillStyle = g; } else ctx.fillStyle = G.background;
      ctx.fillRect(0, 0, W, H);
      if (G.pattern === 'stars') { ctx.fillStyle = '#fff'; for (var i = 0; i < stars.length; i++) { ctx.globalAlpha = stars[i][3]; ctx.beginPath(); ctx.arc(stars[i][0], stars[i][1], stars[i][2], 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
      else if (G.pattern === 'grid') { ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; ctx.beginPath(); for (var x = 0; x <= W; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (var y = 0; y <= H; y += 50) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); }
      else if (G.pattern === 'dots') { ctx.fillStyle = 'rgba(255,255,255,.09)'; for (var a = 25; a < W; a += 50) for (var b = 25; b < H; b += 50) { ctx.beginPath(); ctx.arc(a, b, 3, 0, 7); ctx.fill(); } }
    }
    function drawSprite(s) {
      var w = s.w, hh = s.h;
      ctx.globalAlpha = clamp(s.opacity, 0, 1) * (s.hurtT > 0 ? 0.55 : 1);
      if (s.shape === 'button') {
        var hov = pointer.seen && Math.abs(pointer.x - s.x) < w / 2 && Math.abs(pointer.y - s.y) < hh / 2;
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle * Math.PI / 180); var sc = hov ? (pointer.down ? 0.96 : 1.05) : 1; ctx.scale(sc, sc);
        var bp = rr(w, hh, Math.min(w, hh) * 0.32); ctx.fillStyle = s.color; ctx.fill(bp);
        if (hov) { ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill(bp); }
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke(bp);
        text(fmt(s.label), 0, 0, Math.max(14, Math.min(hh * 0.42, w * 0.3)), '#0a0d2b'); ctx.restore(); ctx.globalAlpha = 1; return;
      }
      if (s.shape === 'text') { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle * Math.PI / 180); text(fmt(s.label), 0, 0, Math.max(10, s.size), s.color); ctx.restore(); ctx.globalAlpha = 1; return; }
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle * Math.PI / 180);
      if (IMGS[s.shape]) { var im = IMGS[s.shape]; if (im.complete && im.naturalWidth) ctx.drawImage(im, -w / 2, -hh / 2, w, hh); }
      else {
        var p;
        if (s.shape === 'square') p = rr(w, hh, Math.min(w, hh) * 0.18);
        else { p = new Path2D(); p.addPath(PATHS[s.shape], new DOMMatrix().translate(-w / 2, -hh / 2).scale(w / 100, hh / 100)); }
        ctx.fillStyle = s.color; ctx.fill(p, s.shape === 'ring' ? 'evenodd' : 'nonzero');
        ctx.lineWidth = Math.max(2, Math.min(w, hh) * 0.06); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke(p);
      }
      if (s.label) text(fmt(s.label), 0, 0, Math.max(12, Math.min(w, hh) * 0.4), '#0a0d2b');
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function draw() {
      var k = cv.width / W;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.save();
      if (shakeT > 0) ctx.translate(rand(-6, 6), rand(-6, 6));
      drawBg();
      var list = sprites; if (list.some(function (s) { return s.z; })) list = sprites.slice().sort(function (a, b) { return a.z - b.z; });
      for (var i = 0; i < list.length; i++) { var s = list[i]; if (s.alive && s.visible && act(s)) drawSprite(s); }
      for (i = 0; i < parts.length; i++) { var p = parts[i]; ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
      ctx.globalAlpha = 1;
      ctx.restore();
      if (flashT > 0) { ctx.globalAlpha = clamp(flashT / 0.35, 0, 1) * 0.6; ctx.fillStyle = flashC; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      if (G.state !== 'ready' && !frozen()) {
        if (G.showScore) text('Punkte  ' + G.score, 20, 28, 24, '#fff', 'left');
        if (o.lives > 0) { for (var l = 0; l < G.lives; l++) { ctx.save(); ctx.translate(W - 30 - l * 34, 28); ctx.fillStyle = '#ff4d6d'; var hp = new Path2D(); hp.addPath(PATHS.heart, new DOMMatrix().translate(-12, -12).scale(0.24, 0.24)); ctx.fill(hp); ctx.restore(); } }
        if (G.timeLimit > 0) text(String(Math.max(0, Math.ceil(G.timeLimit - G.time))), W / 2, 28, 28, '#ffd23f');
      }
      if (msg && G.state === 'play' && !frozen()) text(msg.t, W / 2, 80, 30, '#ffd23f');
      if (G.state === 'ready') {
        overlay(0.72); text(G.title, W / 2, H / 2 - (G.help ? 50 : 26), 46, '#fff');
        if (G.help) text(G.help, W / 2, H / 2 + 4, 20, '#e3e7ff', 'center', 600);
        text('Tippen oder Taste drücken zum Starten', W / 2, H / 2 + (G.help ? 60 : 34), 20, '#a3abe0', 'center', 600);
      } else if (G.state === 'won' || G.state === 'lost') {
        overlay(0.7); text(endMsg, W / 2, H / 2 - 40, 52, G.state === 'won' ? '#00e5a8' : '#ff6b81');
        text('Punkte  ' + G.score, W / 2, H / 2 + 14, 26, '#fff');
        text('Tippen für noch einmal', W / 2, H / 2 + 62, 19, '#a3abe0', 'center', 600);
      }
    }

    var last = 0, running = false;
    function frame(t) {
      var dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      if (G.state === 'play' && !document.hidden) { try { update(dt); } catch (e) { console.error(e.message); } }
      draw();
      var over = false; if (pointer.seen && G.state === 'play') for (var q = 0; q < sprites.length; q++) { var t = sprites[q]; if (t.alive && act(t) && t.shape === 'button' && Math.abs(pointer.x - t.x) < t.w / 2 && Math.abs(pointer.y - t.y) < t.h / 2) { over = true; break; } }
      cv.style.cursor = over ? 'pointer' : '';
      requestAnimationFrame(frame);
    }
    function loopStart() { if (running) return; running = true; requestAnimationFrame(function (t) { last = t; frame(t); }); }
    send({ type: 'ready' });
    return G;
  }

  window.Moki = { version: 2, game: createGame };
})();
