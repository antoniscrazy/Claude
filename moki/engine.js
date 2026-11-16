// Moki Engine v3: 2D-Spiele-Werkzeugkasten. Läuft IM Spiel-Frame (Studio-Vorschau und Moki-Spielseite).
// Bildschirm 800 x 500. Beim Anlegen sind x/y in PROZENT der Welt (0-100), zur Laufzeit sind s.x/s.y in PIXELN (Mitte).
// (Davor im selben Skript: motifs.js mit MOKI_SHAPES und MOKI_MOTIFS.)
(function () {
  'use strict';
  var W = 800, H = 500, MAXS = 1500, MAXP = 800;
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

  // ---------- Hilfsfunktionen (auch als Moki.math) ----------
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hash(n) { n = Math.sin(n * 127.1) * 43758.5453; return n - Math.floor(n); }
  var MATH = {
    lerp: function (a, b, t) { return a + (b - a) * t; }, clamp: clamp, rand: rand, sign: function (v) { return v < 0 ? -1 : v > 0 ? 1 : 0; },
    randInt: function (a, b) { return Math.floor(rand(a, b + 1)); },
    choose: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle: function (arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
    dist: function (x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); },
    angle: function (x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; },
    map: function (v, a, b, c, d) { return c + (v - a) / (b - a) * (d - c); },
    noise: function (x, y) {   // weiches Rauschen 0..1 (1D oder 2D)
      y = y || 0; var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = hash(xi + yi * 57), b = hash(xi + 1 + yi * 57), c = hash(xi + (yi + 1) * 57), d = hash(xi + 1 + (yi + 1) * 57);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
  };
  var EASE = {
    linear: function (t) { return t; }, 'in': function (t) { return t * t; }, out: function (t) { return 1 - (1 - t) * (1 - t); },
    inout: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    back: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    bounce: function (t) { var n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
    elastic: function (t) { return t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1; }
  };

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
  function loadImg(url) { var k = 'url:' + url; if (!IMGS[k]) { var i = new Image(); i.src = url; IMGS[k] = i; } return k; }
  function rr(w, h, r) {
    var p = new Path2D(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
    p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); return p;
  }
  function keyName(e) {
    var c = e.code || '';
    if (c === 'Space') return 'SPACE';
    if (c.indexOf('Arrow') === 0) return c.slice(5).toUpperCase();
    if (c.indexOf('Key') === 0) return c.slice(3).toUpperCase();
    if (c.indexOf('Digit') === 0) return c.slice(5);
    if (c === 'Enter') return 'ENTER'; if (c === 'Escape') return 'ESCAPE'; if (c.indexOf('Shift') === 0) return 'SHIFT';
    return String(e.key || '').toUpperCase();
  }

  // ---------- Töne und Musik (selbst erzeugt, keine Dateien) ----------
  var AC = null, volume = 1, muted = false;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return AC; }
  function tone(f0, f1, dur, type, vol, delay) {
    var c = ac(); if (!c || muted) return;
    try {
      if (c.state === 'suspended') c.resume();
      var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(Math.max(20, f0), t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime((vol || 0.12) * volume, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function noise(dur, vol) {
    var c = ac(); if (!c || muted) return;
    try {
      if (c.state === 'suspended') c.resume();
      var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      var s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = (vol || 0.2) * volume; s.connect(g); g.connect(c.destination); s.start();
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
    laser: function () { tone(1800, 200, 0.18, 'sawtooth', 0.08); },
    blip: function () { tone(660, 660, 0.05, 'square', 0.08); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, f, 0.18, 'triangle', 0.14, i * 0.12); }); },
    lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, f * 0.96, 0.22, 'triangle', 0.14, i * 0.15); }); }
  };
  function mtof(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  var MUS = {
    retro: { bpm: 140, lead: 'square', bass: 'triangle', L: [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 77, 0], B: [48, 0, 48, 0, 55, 0, 55, 0, 50, 0, 50, 0, 57, 0, 57, 0] },
    chill: { bpm: 84, lead: 'sine', bass: 'sine', L: [69, 0, 0, 72, 0, 0, 76, 0, 74, 0, 0, 71, 0, 0, 67, 0], B: [45, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0] },
    action: { bpm: 160, lead: 'sawtooth', bass: 'square', L: [64, 64, 0, 67, 64, 0, 69, 0, 64, 64, 0, 71, 69, 0, 67, 0], B: [40, 0, 40, 40, 0, 40, 43, 0, 40, 0, 40, 40, 0, 45, 43, 0] },
    space: { bpm: 100, lead: 'triangle', bass: 'sine', L: [60, 0, 0, 0, 67, 0, 0, 0, 63, 0, 0, 0, 70, 0, 0, 0], B: [36, 0, 0, 0, 0, 0, 0, 0, 34, 0, 0, 0, 0, 0, 0, 0] }
  };
  var musicTimer = 0, musicStep = 0;
  function music(name) {
    clearInterval(musicTimer); musicTimer = 0; var m = name && MUS[name]; if (!m) return;
    var stepMs = 60000 / m.bpm / 4; musicStep = 0;
    musicTimer = setInterval(function () {
      var i = musicStep++ % 16, d = stepMs / 1000 * 1.9;
      if (m.L[i]) tone(mtof(m.L[i]), mtof(m.L[i]), d, m.lead, 0.05);
      if (m.B[i]) tone(mtof(m.B[i]), mtof(m.B[i]), d * 1.4, m.bass, 0.07);
    }, stepMs);
  }

  function createGame(o) {
    o = o || {};
    var WW = +o.worldWidth || W, WH = +o.worldHeight || H;
    var G = {
      score: 0, best: 0, lives: o.lives | 0, time: 0, state: 'ready', width: W, height: H, worldWidth: WW, worldHeight: WH, vars: {}, gravity: o.gravity != null ? +o.gravity : 1400,
      background: o.background || '#0d1240', background2: o.background2 || '', pattern: o.pattern || 'none', help: o.help || '', timeScale: 1, paused: false, showBest: !!o.showBest,
      title: o.title || window.MOKI_TITLE || 'Spiel', timeLimit: +o.time || 0, timeMode: o.timeMode === 'lose' ? 'lose' : 'win', showScore: o.showScore !== false, math: MATH
    };
    var scr = {}; (o.screens || []).forEach(function (x) { if (x && x.name) scr[x.name] = { menu: !!x.menu }; });
    G.screens = (o.screens && o.screens.length) ? scr : null;
    G.screen = G.screens ? o.screens[0].name : '';
    var sprites = [], defs = {}, nextId = 1, touching = {}, timers = [], scoreCbs = [], whens = [], tweens = [], msg = null, endMsg = '', SAVE = {};
    var parts = [], shakeT = 0, flashC = '', flashT = 0, stars = [], bestDirty = false, solids = [];
    var h = { screen: {}, start: [], update: [], key: {}, hold: {}, up: {}, touch: [], edge: [], click: [], pointer: [], pmove: [], pup: [], wheel: [], destroy: [], dback: [], draw: [], dhud: [] };
    var down = {}, pointer = { x: W / 2, y: H / 2, sx: W / 2, sy: H / 2, down: false, seen: false };
    G.pointer = pointer;
    for (var si = 0; si < 70; si++) stars.push([Math.random() * W, Math.random() * H, Math.random() * 1.8 + 0.4, Math.random() * 0.6 + 0.3]);
    try { SAVE = JSON.parse(JSON.stringify(window.MOKI_SAVE || {})); } catch (e) { SAVE = {}; }
    G.best = +SAVE._best || 0;

    // ----- Kamera -----
    var cam = G.camera = { x: 0, y: 0, zoom: +o.zoom || 1, target: null, lerp: 0.12, snap: false };
    cam.follow = function (s, l) { cam.target = s; if (l != null) cam.lerp = +l; cam.snap = true; };
    cam.stop = function () { cam.target = null; };
    cam.center = function (x, y) { cam.x = x - W / (2 * cam.zoom); cam.y = y - H / (2 * cam.zoom); clampCam(); };
    function clampCam() {
      var vw = W / cam.zoom, vh = H / cam.zoom;
      cam.x = WW <= vw ? (WW - vw) / 2 : clamp(cam.x, 0, WW - vw);
      cam.y = WH <= vh ? (WH - vh) / 2 : clamp(cam.y, 0, WH - vh);
    }
    function updateCamera(dt) {
      var t = cam.target;
      if (t && t.alive) {
        var tx = t.x - W / (2 * cam.zoom), ty = t.y - H / (2 * cam.zoom), k = cam.snap ? 1 : Math.min(1, cam.lerp * 60 * dt);
        cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.snap = false;
      }
      clampCam();
    }

    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    document.body.appendChild(cv);
    G.canvas = cv; G.ctx = ctx;
    var css = document.createElement('style');
    css.textContent = 'html,body{margin:0;height:100%;background:#000;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}' +
      'canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100vw,160vh);height:min(62.5vw,100vh);display:block;outline:none}';
    document.head.appendChild(css);
    function fit() { var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d)); }
    addEventListener('resize', fit); fit();
    cv.tabIndex = 0;

    function fmt(t) {   // {score} {lives} {time} {best} {message} {meineVariable}
      return String(t).replace(/\{([^{}]+)\}/g, function (m, k) {
        k = k.trim();
        if (k === 'score') return G.score; if (k === 'lives') return G.lives; if (k === 'message') return endMsg; if (k === 'best') return G.best;
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
      this.physics = opt.physics || 'none';        // none | platformer | topdown | body
      this.solid = !!opt.solid;
      this.hp = opt.hp != null ? +opt.hp : 1; this.maxHp = this.hp;
      this.wrap = !!opt.wrap;
      this.openBottom = !!opt.openBottom;
      this.jumpPower = opt.jump != null ? +opt.jump : 640;
      this.bounciness = opt.bounciness != null ? +opt.bounciness : 0.6;
      this.drag = opt.drag != null ? +opt.drag : 0.15;
      this.hitbox = opt.hitbox || 'box';
      this.radius = +opt.radius || 80; this.amp = opt.amp != null ? +opt.amp : 60; this.freq = opt.freq != null ? +opt.freq : 3;
      this.autoRespawn = opt.autoRespawn !== false;
      this.killOutside = !!opt.killOutside;
      this.label = opt.label || '';
      this.z = +opt.z || 0;
      this.scroll = opt.scroll != null ? +opt.scroll : (opt.fixed ? 0 : 1);
      this.screen = opt.screen || '';
      this.outline = opt.outline || ''; this.outlineWidth = +opt.outlineWidth || 0; this.glow = opt.glow || ''; this.flipX = !!opt.flipX;
      this.visible = opt.visible !== false;
      this.data = Object.assign({}, opt.data || {});
      this.alive = true; this.out = false; this.onGround = false; this.vx = 0; this.vy = 0; this.hurtT = 0; this.blockedX = false; this.wt = 0; this.phase = 0;
      var fw = this.scroll === 0 ? W : WW, fh = this.scroll === 0 ? H : WH;
      if (opt.at) { this.x = +opt.at[0]; this.y = +opt.at[1]; }
      else { this.x = (opt.x != null ? +opt.x : 50) / 100 * fw; this.y = (opt.y != null ? +opt.y : 50) / 100 * fh; }
      this.ox = this.x; this.oy = this.y; this.bx = 0; this.by = 0;
      if (this.motion === 'bounce') { var a = rand(0.5, 1.1), sx = Math.random() < .5 ? 1 : -1, sy = Math.random() < .5 ? 1 : -1; this.bx = Math.cos(a) * sx; this.by = Math.sin(a) * sy; }
      if (this.motion === 'patrol') this.bx = Math.random() < .5 ? 1 : -1;
      if (opt.image) { this.shape = 'image'; this.imgKey = loadImg(opt.image); }
      this._opt = opt;
    }
    Object.defineProperty(Sprite.prototype, 'w', { get: function () { return this.size * this.stretch; } });
    Object.defineProperty(Sprite.prototype, 'h', { get: function () { return this.size; } });
    var P = Sprite.prototype;
    P.place = function (xp, yp) { this.x = xp / 100 * WW; this.y = yp / 100 * WH; this.ox = this.x; this.oy = this.y; this.out = false; this.vy = 0; return this; };
    P.moveTo = function (x, y) { this.x = x; this.y = y; this.ox = x; this.oy = y; this.out = false; return this; };
    P.scatter = function () { this.x = rand(this.w / 2, WW - this.w / 2); this.y = rand(this.h / 2, WH - this.h / 2); this.out = false; return this; };
    P.destroy = function () { if (!this.alive) return; this.alive = false; var s = this; h.destroy.forEach(function (d) { if (d.a === s.name) safe(d.f, s); }); };
    P.clone = function () {
      var c = add(new Sprite(Object.assign({}, this._opt, { rows: 1, cols: 1, copies: null })));
      c.x = this.x; c.y = this.y; c.color = this.color; c.size = this.size; c.speed = this.speed; c.angle = this.angle; c.bx = this.bx; c.by = this.by; c.ox = this.x; c.oy = this.y; return c;
    };
    P.touches = function (o) { return hit(this, o); };
    P.distanceTo = function (o) { var dx = o.x - this.x, dy = o.y - this.y; return Math.sqrt(dx * dx + dy * dy); };
    P.angleTo = function (o) { return Math.atan2(o.y - this.y, o.x - this.x) * 180 / Math.PI; };
    P.face = function (o) { this.angle = this.angleTo(o); return this; };
    P.follow = function (o, speed, dt) { var d = this.distanceTo(o) || 1, k = (speed == null ? this.speed : +speed) * (dt == null ? 1 / 60 : dt); this.x += (o.x - this.x) / d * k; this.y += (o.y - this.y) / d * k; return this; };
    P.tween = function (props, sec, ease, cb) { return G.tween(this, props, sec, ease, cb); };
    P.isOnScreen = function () { var vx = (this.x - cam.x) * cam.zoom, vy = (this.y - cam.y) * cam.zoom; return vx > -this.w && vx < W + this.w && vy > -this.h && vy < H + this.h; };
    P.respawn = function () {
      var w = this.w, hh = this.h, m = this.motion;
      if (m === 'fall') { this.x = rand(w / 2, WW - w / 2); this.y = -hh / 2; }
      else if (m === 'rise') { this.x = rand(w / 2, WW - w / 2); this.y = WH + hh / 2; }
      else if (m === 'left') { this.x = WW + w / 2; this.y = rand(hh / 2, WH - hh / 2); }
      else if (m === 'right') { this.x = -w / 2; this.y = rand(hh / 2, WH - hh / 2); }
      else return this.scatter();
      this.out = false; return this;
    };
    P.hurt = function (n) {
      n = n == null ? 1 : +n; if (!this.alive) return this;
      this.hp -= n; this.hurtT = 0.18;
      if (this.hp <= 0) { this.burst(this.color, 12); this.destroy(); }
      return this;
    };
    P.jump = function (p, air) { if (air || this.onGround || (this.physics !== 'platformer' && this.physics !== 'body')) { this.vy = -(p != null ? +p : this.jumpPower); this.onGround = false; return true; } return false; };
    P.fly = function (dir, speed) { var d = toDir(this, dir); this.motion = 'drift'; this.bx = d[0]; this.by = d[1]; if (speed != null) this.speed = +speed; return this; };
    P.stop = function () { this.motion = 'none'; this.bx = 0; this.by = 0; this.vx = 0; this.vy = 0; return this; };
    P.nudge = function (dir, px) { var d = toDir(this, dir); this.x += d[0] * px; this.y += d[1] * px; return this; };
    P.shoot = function (name, dir, speed) {
      var d = defs[name]; if (!d) return null;
      var p = add(new Sprite(Object.assign({}, d, { rows: 1, cols: 1, copies: null, motion: 'drift', control: 'none', physics: 'none', killOutside: true, autoRespawn: false })));
      var v = toDir(this, dir); p.bx = v[0]; p.by = v[1]; p.speed = speed != null ? +speed : 520;
      p.x = this.x + v[0] * (this.w / 2 + p.w / 2); p.y = this.y + v[1] * (this.h / 2 + p.h / 2); p.scroll = this.scroll; return p;
    };
    P.bounceOff = function (o) {
      var dx = this.x - o.x, dy = this.y - o.y, px = (this.w + o.w) / 2 - Math.abs(dx), py = (this.h + o.h) / 2 - Math.abs(dy);
      if (px <= 0 || py <= 0) return this;
      if (px < py) { this.x += dx > 0 ? px : -px; this.bx = (dx > 0 ? 1 : -1) * Math.abs(this.bx || 0.5); }
      else { this.y += dy > 0 ? py : -py; var up = dy < 0, off = clamp(dx / (o.w / 2), -1, 1); this.bx = off * 0.85; this.by = (up ? -1 : 1) * Math.sqrt(Math.max(0.1, 1 - this.bx * this.bx)); }
      return this;
    };
    P.burst = function (color, n) { burst(this.x, this.y, color || this.color, n); return this; };
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
      var cols = Math.max(1, Math.min(60, opt.cols | 0 || 1)), rows = Math.max(1, Math.min(60, opt.rows | 0 || 1));
      var first = null, i, j, s;
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
        s = add(new Sprite(opt));
        s.x += i * (s.w + (+opt.gapX || 8)); s.y += j * (s.h + (+opt.gapY || 8)); s.ox = s.x; s.oy = s.y;
        if (!first) first = s;
      }
      if (Array.isArray(opt.copies)) opt.copies.forEach(function (c) { var o2 = Object.assign({}, opt, { rows: 1, cols: 1, copies: null, x: c[0], y: c[1] }); add(new Sprite(o2)); });
      if (!defs[first.name]) defs[first.name] = Object.assign({}, opt, { rows: 1, cols: 1, copies: null });
      return first;
    };
    // Eigene Bilder aus Text-Pixeln: rows = ['..ff..', ...], palette = ['#000', '#fff', ...]; Zeichen '.' = durchsichtig, 0-9 a-f = Farbnummer
    G.art = function (name, rows, palette, fps) {
      var frames = Array.isArray(rows[0]) ? rows : [rows], cvs = frames.map(function (fr) {
        var c = document.createElement('canvas'), n = fr.length, m = Math.max.apply(null, fr.map(function (r) { return r.length; })); c.width = m; c.height = n;
        var x = c.getContext('2d'); fr.forEach(function (r, y) { for (var i = 0; i < r.length; i++) { var ch = r[i]; if (ch === '.' || ch === ' ') continue; var idx = parseInt(ch, 16); if (isNaN(idx) || !palette[idx]) continue; x.fillStyle = palette[idx]; x.fillRect(i, y, 1, 1); } });
        return c;
      });
      IMGS[name] = { f: cvs, fps: +fps || 6 }; return name;
    };
    G.level = function (rows, legend, cell, opt) {
      cell = +cell || 40; var made = [], maxc = 0;
      rows.forEach(function (row, j) {
        maxc = Math.max(maxc, row.length);
        for (var i = 0; i < row.length; i++) {
          var ch = row[i], d = legend[ch]; if (ch === ' ' || ch === '.' || !d) continue;
          var o2 = typeof d === 'function' ? d(i, j) : d; if (!o2) continue;
          o2 = Object.assign({ size: cell }, o2, { at: [i * cell + cell / 2, j * cell + cell / 2] }); made.push(G.sprite(o2));
        }
      });
      WW = Math.max(WW, maxc * cell); WH = Math.max(WH, rows.length * cell); G.worldWidth = WW; G.worldHeight = WH; clampCam();
      return made;
    };
    G.spawn = function (name) { var d = defs[name]; if (!d) return null; var s = add(new Sprite(d)); s.respawn(); return s; };
    G.find = function (name) { for (var i = 0; i < sprites.length; i++) if (sprites[i].alive && sprites[i].name === name) return sprites[i]; return null; };
    G.all = function (name) { return sprites.filter(function (s) { return s.alive && (!name || s.name === name); }); };
    G.count = function (name) { var n = 0; for (var i = 0; i < sprites.length; i++) if (sprites[i].alive && (!name || sprites[i].name === name)) n++; return n; };
    G.clear = function (name) { sprites.forEach(function (s) { if (s.alive && (!name || s.name === name)) s.alive = false; }); };
    function nm(x) { return typeof x === 'string' ? x : (x && x.name); }
    function act(s) { return !G.screens || !s.screen || s.screen === G.screen; }
    function frozen() { return !!(G.screens && G.screens[G.screen] && G.screens[G.screen].menu) || G.paused; }
    G.go = function (name) {
      if (!G.screens || !G.screens[name]) return;
      G.screen = name; touching = {}; pointer.down = false;
      (h.screen[name] || []).forEach(function (f) { safe(f); });
    };
    G.onScreen = function (name, f) { (h.screen[name] = h.screen[name] || []).push(f); };
    G.pause = function () { G.paused = true; }; G.resume = function () { G.paused = false; };

    function bw(s) { return s.w * (s.shape === 'square' || s.shape === 'button' || IMGS[s.shape] ? 0.45 : 0.4); }
    function bh(s) { return s.h * (s.shape === 'square' || s.shape === 'button' || IMGS[s.shape] ? 0.45 : 0.4); }
    function hit(a, b) {
      if (a.hitbox === 'circle' || b.hitbox === 'circle') { var ra = Math.min(a.w, a.h) * 0.45, rb = Math.min(b.w, b.h) * 0.45, dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy < (ra + rb) * (ra + rb); }
      return Math.abs(a.x - b.x) < bw(a) + bw(b) && Math.abs(a.y - b.y) < bh(a) + bh(b);
    }
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
    G.onPointerMove = function (f) { h.pmove.push(f); };
    G.onPointerUp = function (f) { h.pup.push(f); };
    G.onWheel = function (f) { h.wheel.push(f); };
    G.onDestroy = function (a, f) { h.destroy.push({ a: nm(a), f: f }); };
    G.onDrawBack = function (f) { h.dback.push(f); };
    G.onDraw = function (f) { h.draw.push(f); };
    G.onDrawHud = function (f) { h.dhud.push(f); };
    G.every = function (sec, f) { timers.push({ t: 0, every: Math.max(0.05, +sec || 1), f: f }); };
    G.after = function (sec, f) { timers.push({ t: 0, every: Math.max(0.01, +sec || 1), f: f, once: true }); };
    G.wait = function (sec) { return new Promise(function (res) { G.after(sec, res); }); };
    G.onScore = function (n, f) { scoreCbs.push({ n: +n, f: f, done: false }); };
    G.when = function (cond, f) { whens.push({ c: cond, f: f, was: false }); };
    G.tween = function (obj, props, sec, ease, cb) {
      var from = {}; for (var k in props) from[k] = obj[k];
      var tw = { obj: obj, props: props, from: from, t: 0, dur: Math.max(0.01, +sec || 1), e: EASE[ease] || EASE.out, cb: cb, done: false, cancel: function () { this.done = true; } };
      tweens.push(tw); return tw;
    };

    // ---------- Aktionen ----------
    G.set = function (k, v) { G.vars[k] = v; }; G.get = function (k) { return Object.prototype.hasOwnProperty.call(G.vars, k) ? G.vars[k] : 0; };
    G.change = function (k, d) { G.vars[k] = (+G.get(k) || 0) + (+d || 0); };
    G.save = function (k, v) { SAVE[k] = v; send({ type: 'save', key: String(k), value: v }); };
    G.load = function (k, d) { return Object.prototype.hasOwnProperty.call(SAVE, k) ? SAVE[k] : d; };
    function bump() { if (G.score > G.best) { G.best = G.score; bestDirty = true; } }
    function flushBest() { if (bestDirty) { bestDirty = false; G.save('_best', G.best); } }
    G.addScore = function (n) { G.score += (+n || 0); bump(); };
    G.setScore = function (n) { G.score = +n || 0; bump(); };
    G.addLife = function (n) { G.lives = Math.max(0, G.lives + (+n || 0)); if (G.lives === 0 && n < 0 && G.state === 'play' && o.lives > 0) G.lose('Keine Leben mehr'); };
    G.setLives = function (n) { G.lives = Math.max(0, +n || 0); };
    G.say = function (t, sec) { msg = { t: String(t), left: sec == null ? 2 : +sec }; };
    G.win = function (m) { if (G.state !== 'play') return; endMsg = m || 'Gewonnen!'; SOUNDS.win(); bump(); flushBest(); if (G.screens && G.screens['Gewonnen']) { G.go('Gewonnen'); return; } G.state = 'won'; };
    G.lose = function (m) { if (G.state !== 'play') return; endMsg = m || 'Verloren'; SOUNDS.lose(); bump(); flushBest(); if (G.screens && G.screens['Verloren']) { G.go('Verloren'); return; } G.state = 'lost'; };
    G.sound = function (n) { var f = SOUNDS[n]; if (f) f(); };
    G.tone = function (f, dur, type, vol) { tone(f, f, dur || 0.15, type, vol); };
    G.sweep = function (f0, f1, dur, type, vol) { tone(f0, f1, dur || 0.2, type, vol); };
    G.noise = noise;
    G.music = music;
    G.volume = function (v) { volume = clamp(+v, 0, 1); }; G.mute = function (m) { muted = m !== false; };
    G.shake = function (ms) { shakeT = Math.max(shakeT, (+ms || 300) / 1000); };
    G.flash = function (c) { flashC = c || '#ffffff'; flashT = 0.35; };
    function burst(x, y, c, n) { n = Math.min(n || 14, 80); for (var i = 0; i < n && parts.length < MAXP; i++) { var a = Math.random() * 6.283, sp = rand(60, 320); parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.35, 0.8), max: 0.8, c: c || '#fff', s: rand(3, 7), g: 500, r: 0 }); } }
    G.burst = function (xp, yp, c, n) { burst(xp / 100 * WW, yp / 100 * WH, c, n); };
    G.emit = function (x, y, p) {   // Partikel an einer Weltposition (Pixel)
      p = p || {}; var n = Math.min(p.count || 20, 120), cols = Array.isArray(p.color) ? p.color : [p.color || '#ffffff'];
      var spread = (p.spread == null ? 360 : p.spread) * Math.PI / 180, base = (p.angle || 0) * Math.PI / 180;
      for (var i = 0; i < n && parts.length < MAXP; i++) {
        var a = base + (Math.random() - 0.5) * spread, sp = (p.speed || 200) * rand(0.4, 1), life = (p.life || 0.6) * rand(0.6, 1.2);
        parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: life, max: life, c: cols[i % cols.length], s: (p.size || 5) * rand(0.6, 1.2), g: p.gravity == null ? 500 : p.gravity, r: p.shape === 'circle' ? 1 : 0 });
      }
    };
    G.random = rand;
    G.key = function (k) { return !!down[String(k).toUpperCase()]; };
    G.gamepad = function (i) {
      var gp = (navigator.getGamepads ? navigator.getGamepads() : [])[i || 0]; if (!gp) return null;
      var b = function (n) { return !!(gp.buttons[n] && gp.buttons[n].pressed); };
      return { x: Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0, y: Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0, a: b(0), b: b(1), x2: b(2), y2: b(3), start: b(9) };
    };
    G.restart = function () { restart(); };
    G.start = function () { loopStart(); if (G.screens && G.state === 'ready') startPlay(); };

    // ----- Zeichen-Helfer für onDraw / onDrawBack / onDrawHud -----
    G.ui = {
      text: function (t, x, y, p) { p = p || {}; ctx.save(); ctx.font = (p.weight || 800) + ' ' + (p.size || 20) + 'px "Segoe UI",system-ui,sans-serif'; ctx.textAlign = p.align || 'left'; ctx.textBaseline = p.baseline || 'middle'; if (p.shadow) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillText(fmt(t), x + 2, y + 2); } ctx.fillStyle = p.color || '#fff'; ctx.fillText(fmt(t), x, y); ctx.restore(); },
      rect: function (x, y, w, hh, color, r) { ctx.save(); ctx.fillStyle = color || '#fff'; if (r) { ctx.translate(x + w / 2, y + hh / 2); ctx.fill(rr(w, hh, r)); } else ctx.fillRect(x, y, w, hh); ctx.restore(); },
      circle: function (x, y, r, color, stroke) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); if (color) { ctx.fillStyle = color; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } ctx.restore(); },
      line: function (x1, y1, x2, y2, color, w) { ctx.save(); ctx.strokeStyle = color || '#fff'; ctx.lineWidth = w || 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); },
      bar: function (x, y, w, hh, v, max, p) { p = p || {}; var f = clamp(v / (max || 1), 0, 1); ctx.save(); ctx.translate(x + w / 2, y + hh / 2); ctx.fillStyle = p.back || 'rgba(255,255,255,.18)'; ctx.fill(rr(w, hh, hh / 2)); if (f > 0.01) { ctx.translate(-w / 2 + (w * f) / 2, 0); ctx.fillStyle = p.color || '#00e5a8'; ctx.fill(rr(w * f, hh, hh / 2)); } ctx.restore(); }
    };

    function startPlay() {
      if (G.state !== 'ready') return;
      ac(); G.state = 'play'; cv.focus();
      h.start.forEach(function (f) { safe(f); });
      if (G.screens) (h.screen[G.screen] || []).forEach(function (f) { safe(f); });
    }
    function restart() { if (window.parent !== window) send({ type: 'restart' }); else location.reload(); }
    function safe(f, a, b) { try { f(a, b); } catch (e) { console.error(e && e.message ? e.message : String(e)); } }

    // ---------- Eingabe ----------
    function setPointer(e) { var r = cv.getBoundingClientRect(); pointer.sx = (e.clientX - r.left) / r.width * W; pointer.sy = (e.clientY - r.top) / r.height * H; pointer.x = pointer.sx / cam.zoom + cam.x; pointer.y = pointer.sy / cam.zoom + cam.y; pointer.seen = true; }
    function pAt(s) { return s.scroll === 0 ? [pointer.sx, pointer.sy] : [pointer.x, pointer.y]; }
    cv.addEventListener('pointermove', function (e) { setPointer(e); if (G.state === 'play') h.pmove.forEach(function (f) { safe(f, pointer.x, pointer.y); }); });
    cv.addEventListener('pointerdown', function (e) {
      setPointer(e); pointer.down = true; ac();
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      if (G.state === 'ready') { startPlay(); return; }
      if (G.state === 'won' || G.state === 'lost') { restart(); return; }
      sprites.forEach(function (s) { if (s.alive && act(s) && s.physics === 'platformer' && s.control !== 'none' && pointer.y < s.y - s.h * 0.6) s.jump(); });
      for (var i = sprites.length - 1; i >= 0; i--) {
        var s = sprites[i]; if (!s.alive || !act(s)) continue;
        var p = pAt(s);
        if (Math.abs(p[0] - s.x) < s.w / 2 + 6 && Math.abs(p[1] - s.y) < s.h / 2 + 6) { h.click.forEach(function (c) { if (c.a === s.name) safe(c.f, s); }); break; }
      }
      h.pointer.forEach(function (f) { safe(f, pointer.x, pointer.y); });
    });
    cv.addEventListener('pointerup', function () { pointer.down = false; if (G.state === 'play') h.pup.forEach(function (f) { safe(f, pointer.x, pointer.y); }); });
    cv.addEventListener('pointercancel', function () { pointer.down = false; });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (G.state === 'play') h.wheel.forEach(function (f) { safe(f, e.deltaY); }); }, { passive: false });
    addEventListener('keydown', function (e) {
      var k = keyName(e);
      if (['SPACE', 'LEFT', 'RIGHT', 'UP', 'DOWN'].indexOf(k) > -1) e.preventDefault();
      ac();
      if (G.state === 'ready' && !e.repeat) { startPlay(); return; }
      if ((G.state === 'won' || G.state === 'lost') && (k === 'SPACE' || k === 'ENTER') && !e.repeat) { restart(); return; }
      if (k === 'M' && !e.repeat && !e.ctrlKey) muted = !muted;
      if (!down[k] && G.state === 'play') {
        if (h.key[k]) h.key[k].forEach(function (f) { safe(f); });
        if (k === 'SPACE' || k === 'UP' || k === 'W') sprites.forEach(function (s) { if (s.alive && act(s) && (s.physics === 'platformer') && s.control === 'keys') s.jump(); });
      }
      down[k] = true;
    });
    addEventListener('keyup', function (e) { var k = keyName(e); down[k] = false; if (G.state === 'play' && h.up[k]) h.up[k].forEach(function (f) { safe(f); }); });
    addEventListener('blur', function () { down = {}; pointer.down = false; flushBest(); });
    function pressed(a, b) { return down[a] || down[b]; }

    // ---------- Update ----------
    function moveSolid(s, dx, dy) {
      var i, o; s.blockedX = false;
      s.x += dx;
      for (i = 0; i < solids.length; i++) { o = solids[i]; if (o !== s && overlap(s, o)) { s.blockedX = true; if (dx > 0) s.x = o.x - (o.w + s.w) / 2; else if (dx < 0) s.x = o.x + (o.w + s.w) / 2; if (s.physics === 'body') s.vx = -s.vx * s.bounciness; } }
      s.y += dy; s.onGround = false;
      for (i = 0; i < solids.length; i++) {
        o = solids[i]; if (o === s) continue;
        if (overlap(s, o)) {
          if (dy > 0) { s.y = o.y - (o.h + s.h) / 2; s.onGround = true; if (s.physics === 'body') { s.vy = Math.abs(s.vy) < 40 ? 0 : -s.vy * s.bounciness; } else s.vy = 0; }
          else if (dy < 0) { s.y = o.y + (o.h + s.h) / 2; if (s.physics === 'body') s.vy = -s.vy * s.bounciness; else if (s.vy < 0) s.vy = 0; }
        }
      }
    }
    function ledgeAhead(s) {
      var px = s.x + s.bx * (s.w / 2 + 6), py = s.y + s.h / 2 + 6;
      for (var i = 0; i < solids.length; i++) { var o = solids[i]; if (Math.abs(px - o.x) < o.w / 2 && Math.abs(py - o.y) < o.h / 2) return false; }
      return true;
    }
    function fxStep(dt) {
      for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; if (p.life <= 0) parts.splice(i, 1); }
      if (shakeT > 0) shakeT -= dt; if (flashT > 0) flashT -= dt;
    }
    function update(dt) {
      if (frozen()) { fxStep(dt); return; }
      G.time += dt;
      if (msg) { msg.left -= dt; if (msg.left <= 0) msg = null; }
      var i, s, k, pad = G.gamepad(0);
      solids = sprites.filter(function (o) { return o.alive && o.solid && act(o); });
      for (k in h.hold) if (down[k]) h.hold[k].forEach(function (f) { safe(f, dt); });
      var bodies = [];
      for (i = 0; i < sprites.length; i++) {
        s = sprites[i]; if (!s.alive || !act(s)) continue;
        var w2 = s.w / 2, h2 = s.h / 2, cvx = 0, cvy = 0, ph = s.physics;
        if (s.hurtT > 0) s.hurtT -= dt;
        if (s.spin) s.angle += s.spin * dt;
        if (s.control === 'keys') {
          var dx = 0, dy = 0;
          if (s.axis !== 'y') dx = (pressed('RIGHT', 'D') ? 1 : 0) - (pressed('LEFT', 'A') ? 1 : 0);
          if (s.axis !== 'x' && ph !== 'platformer') dy = (pressed('DOWN', 'S') ? 1 : 0) - (pressed('UP', 'W') ? 1 : 0);
          if (pad) { if (s.axis !== 'y' && !dx) dx = pad.x; if (s.axis !== 'x' && ph !== 'platformer' && !dy) dy = pad.y; if (pad.a && ph === 'platformer') s.jump(); }
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
        else if (m === 'patrol') { mvx = s.bx * s.speed; }
        else if (m === 'wander') { s.wt -= dt; if (s.wt <= 0) { s.wt = rand(0.6, 2); var wa = Math.random() * 6.283; s.bx = Math.cos(wa); s.by = Math.sin(wa); } mvx = s.bx * s.speed; mvy = s.by * s.speed; }
        else if (m === 'orbit') { s.phase += s.speed / Math.max(20, s.radius) * dt; s.x = s.ox + Math.cos(s.phase) * s.radius; s.y = s.oy + Math.sin(s.phase) * s.radius; }
        else if (m === 'sine') { s.phase += dt * s.freq; mvx = (s.bx || -1) * s.speed; s.y = s.oy + Math.sin(s.phase) * s.amp; }
        else if (m === 'follow') {
          var t = null; for (var j = 0; j < sprites.length; j++) if (sprites[j] !== s && sprites[j].alive && sprites[j].control !== 'none') { t = sprites[j]; break; }
          if (t) { var ax = t.x - s.x, ay = t.y - s.y, d = Math.sqrt(ax * ax + ay * ay) || 1; mvx = ax / d * s.speed; mvy = ay / d * s.speed; }
        }
        var vx = cvx + mvx, vy = cvy + mvy;
        if (ph === 'platformer') { s.vy += G.gravity * dt; vy = s.vy + mvy; }
        if (ph === 'body') {
          s.vy += G.gravity * dt; s.vx += cvx * 6 * dt; s.vx -= s.vx * Math.min(1, s.drag * dt * 4);
          vx = s.vx + mvx; vy = s.vy + mvy; bodies.push(s);
        }
        if (ph !== 'none') moveSolid(s, vx * dt, vy * dt); else if (m !== 'orbit') { s.x += vx * dt; s.y += vy * dt; }
        // Rand-Verhalten
        if (s.control !== 'none' || ph === 'body') { s.x = clamp(s.x, w2, WW - w2); if (ph !== 'platformer' && (ph !== 'body' || s.y < h2)) s.y = clamp(s.y, h2, WH - h2); if (ph === 'body' && s.y > WH - h2) { s.y = WH - h2; s.vy = Math.abs(s.vy) < 40 ? 0 : -s.vy * s.bounciness; s.onGround = true; } }
        if (m === 'bounce') {
          if (s.x < w2) { s.x = w2; s.bx = Math.abs(s.bx); } else if (s.x > WW - w2) { s.x = WW - w2; s.bx = -Math.abs(s.bx); }
          if (s.y < h2) { s.y = h2; s.by = Math.abs(s.by); } else if (s.y > WH - h2 && !s.openBottom) { s.y = WH - h2; s.by = -Math.abs(s.by); }
        }
        if (m === 'patrol' && (s.blockedX || s.x < w2 || s.x > WW - w2 || (ph === 'platformer' && s.onGround && ledgeAhead(s)))) { s.bx = -s.bx; s.x += s.bx * 3; }
        if (s.wrap) { if (s.x < -w2) s.x = WW + w2; else if (s.x > WW + w2) s.x = -w2; if (s.y < -h2) s.y = WH + h2; else if (s.y > WH + h2) s.y = -h2; }
        var outNow = !s.wrap && (s.x < -w2 || s.x > WW + w2 || s.y < -h2 || s.y > WH + h2);
        if (outNow && !s.out) {
          s.out = true; var sp = s;
          h.edge.forEach(function (e) { if (e.a === sp.name) safe(e.f, sp); });
          if (s.alive && s.killOutside) s.alive = false;
          else if (s.alive && s.autoRespawn && (m === 'fall' || m === 'rise' || m === 'left' || m === 'right')) s.respawn();
        } else if (!outNow) s.out = false;
      }
      // Körper stoßen einander ab (Kreise)
      for (i = 0; i < bodies.length; i++) for (var b2 = i + 1; b2 < bodies.length; b2++) {
        var A = bodies[i], B = bodies[b2], ddx = B.x - A.x, ddy = B.y - A.y, dd = Math.sqrt(ddx * ddx + ddy * ddy) || 0.01, rr2 = (Math.min(A.w, A.h) + Math.min(B.w, B.h)) / 2;
        if (dd < rr2) {
          var nx = ddx / dd, ny = ddy / dd, push = (rr2 - dd) / 2; A.x -= nx * push; A.y -= ny * push; B.x += nx * push; B.y += ny * push;
          var rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rv < 0) { var jn = -(1 + Math.min(A.bounciness, B.bounciness)) * rv / 2; A.vx -= jn * nx; A.vy -= jn * ny; B.vx += jn * nx; B.vy += jn * ny; }
        }
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
      tweens.forEach(function (tw) { if (tw.done) return; tw.t += dt; var p = Math.min(1, tw.t / tw.dur), e = tw.e(p); for (var k2 in tw.props) tw.obj[k2] = tw.from[k2] + (tw.props[k2] - tw.from[k2]) * e; if (p >= 1) { tw.done = true; if (tw.cb) safe(tw.cb); } });
      tweens = tweens.filter(function (tw) { return !tw.done; });
      scoreCbs.forEach(function (c) { if (!c.done && G.score >= c.n) { c.done = true; safe(c.f); } });
      whens.forEach(function (w) { var v = false; try { v = !!w.c(); } catch (e) {} if (v && !w.was) safe(w.f); w.was = v; });
      h.update.forEach(function (f) { safe(f, dt); });
      fxStep(dt); updateCamera(dt);
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
      if (G.pattern === 'stars') { ctx.fillStyle = '#fff'; for (var i = 0; i < stars.length; i++) { ctx.globalAlpha = stars[i][3]; ctx.beginPath(); ctx.arc((stars[i][0] - cam.x * 0.2 * stars[i][2] + 4000) % W, (stars[i][1] - cam.y * 0.2 * stars[i][2] + 4000) % H, stars[i][2], 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
      else if (G.pattern === 'grid') { ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; ctx.beginPath(); var ox = -((cam.x * cam.zoom) % 50), oy = -((cam.y * cam.zoom) % 50); for (var x = ox; x <= W; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (var y = oy; y <= H; y += 50) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); }
      else if (G.pattern === 'dots') { ctx.fillStyle = 'rgba(255,255,255,.09)'; var dx0 = -((cam.x * 0.5) % 50), dy0 = -((cam.y * 0.5) % 50); for (var a = dx0 + 25; a < W; a += 50) for (var b = dy0 + 25; b < H; b += 50) { ctx.beginPath(); ctx.arc(a, b, 3, 0, 7); ctx.fill(); } }
    }
    function drawSprite(s) {
      var w = s.w, hh = s.h;
      ctx.globalAlpha = clamp(s.opacity, 0, 1) * (s.hurtT > 0 ? 0.55 : 1);
      if (s.shape === 'button') {
        var p0 = pAt(s), hov = pointer.seen && Math.abs(p0[0] - s.x) < w / 2 && Math.abs(p0[1] - s.y) < hh / 2;
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle * Math.PI / 180); var sc = hov ? (pointer.down ? 0.96 : 1.05) : 1; ctx.scale(sc, sc);
        var bp = rr(w, hh, Math.min(w, hh) * 0.32); ctx.fillStyle = s.color; ctx.fill(bp);
        if (hov) { ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill(bp); }
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke(bp);
        text(fmt(s.label), 0, 0, Math.max(14, Math.min(hh * 0.42, w * 0.3)), '#0a0d2b'); ctx.restore(); ctx.globalAlpha = 1; return;
      }
      if (s.shape === 'text') { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle * Math.PI / 180); text(fmt(s.label), 0, 0, Math.max(10, s.size), s.color); ctx.restore(); ctx.globalAlpha = 1; return; }
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle * Math.PI / 180); if (s.flipX) ctx.scale(-1, 1);
      if (s.glow) { ctx.shadowColor = s.glow; ctx.shadowBlur = 22; }
      var im = s.shape === 'image' ? IMGS[s.imgKey] : IMGS[s.shape];
      if (im) {
        if (im.f) { var fr = im.f[Math.floor(G.time * im.fps) % im.f.length]; ctx.imageSmoothingEnabled = false; ctx.drawImage(fr, -w / 2, -hh / 2, w, hh); ctx.imageSmoothingEnabled = true; }
        else if (im.complete && im.naturalWidth) ctx.drawImage(im, -w / 2, -hh / 2, w, hh);
      } else {
        var p;
        if (s.shape === 'square') p = rr(w, hh, Math.min(w, hh) * 0.18);
        else { p = new Path2D(); p.addPath(PATHS[s.shape], new DOMMatrix().translate(-w / 2, -hh / 2).scale(w / 100, hh / 100)); }
        ctx.fillStyle = s.color; ctx.fill(p, s.shape === 'ring' ? 'evenodd' : 'nonzero');
        ctx.shadowBlur = 0;
        if (s.outline !== 'none') { ctx.lineWidth = s.outlineWidth || Math.max(2, Math.min(w, hh) * 0.06); ctx.strokeStyle = s.outline || 'rgba(255,255,255,.55)'; ctx.stroke(p); }
      }
      if (s.label) { ctx.shadowBlur = 0; text(fmt(s.label), 0, 0, Math.max(12, Math.min(w, hh) * 0.4), '#0a0d2b'); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function sortZ(list) { return list.some(function (s) { return s.z; }) ? list.slice().sort(function (a, b) { return a.z - b.z; }) : list; }
    function draw() {
      var k = cv.width / W, i, s;
      ctx.setTransform(k, 0, 0, k, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      drawBg();
      // Welt (mit Kamera)
      ctx.save();
      if (shakeT > 0) ctx.translate(rand(-6, 6), rand(-6, 6));
      ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
      h.dback.forEach(function (f) { safe(f, ctx); });
      var list = sortZ(sprites), huds = [];
      for (i = 0; i < list.length; i++) {
        s = list[i]; if (!s.alive || !s.visible || !act(s)) continue;
        if (s.scroll === 0) { huds.push(s); continue; }
        if (s.scroll !== 1) { ctx.save(); ctx.translate(cam.x * (1 - s.scroll), cam.y * (1 - s.scroll)); drawSprite(s); ctx.restore(); } else drawSprite(s);
      }
      for (i = 0; i < parts.length; i++) { var p = parts[i]; ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.c; if (p.r) { ctx.beginPath(); ctx.arc(p.x, p.y, p.s / 2, 0, 7); ctx.fill(); } else ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
      ctx.globalAlpha = 1;
      h.draw.forEach(function (f) { safe(f, ctx); });
      ctx.restore();
      ctx.setTransform(k, 0, 0, k, 0, 0);
      // Bildschirm-fest (HUD)
      for (i = 0; i < huds.length; i++) drawSprite(huds[i]);
      if (flashT > 0) { ctx.globalAlpha = clamp(flashT / 0.35, 0, 1) * 0.6; ctx.fillStyle = flashC; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      if (G.state !== 'ready' && !frozen()) {
        if (G.showScore) text('Punkte  ' + G.score, 20, 28, 24, '#fff', 'left');
        if (G.showBest) text('Rekord  ' + G.best, 20, 56, 16, '#a3abe0', 'left', 700);
        if (o.lives > 0) { for (var l = 0; l < G.lives; l++) { ctx.save(); ctx.translate(W - 30 - l * 34, 28); ctx.fillStyle = '#ff4d6d'; var hp = new Path2D(); hp.addPath(PATHS.heart, new DOMMatrix().translate(-12, -12).scale(0.24, 0.24)); ctx.fill(hp); ctx.restore(); } }
        if (G.timeLimit > 0) text(String(Math.max(0, Math.ceil(G.timeLimit - G.time))), W / 2, 28, 28, '#ffd23f');
      }
      if (msg && G.state === 'play' && !frozen()) text(msg.t, W / 2, 80, 30, '#ffd23f');
      h.dhud.forEach(function (f) { safe(f, ctx); });
      if (muted) text('Ton aus (M)', W - 14, H - 14, 13, '#a3abe0', 'right', 600);
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

    var last = 0, running = false, saveT = 0;
    function frame(t) {
      var raw = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      if (!pointer.down || true) { pointer.x = pointer.sx / cam.zoom + cam.x; pointer.y = pointer.sy / cam.zoom + cam.y; }
      if (G.state === 'play' && !document.hidden) { try { update(raw * G.timeScale); } catch (e) { console.error(e.message); } }
      saveT += raw; if (saveT > 3) { saveT = 0; flushBest(); }
      draw();
      var over = false; if (pointer.seen && G.state === 'play') for (var q = 0; q < sprites.length; q++) { var t2 = sprites[q]; if (t2.alive && act(t2) && t2.shape === 'button') { var pp = pAt(t2); if (Math.abs(pp[0] - t2.x) < t2.w / 2 && Math.abs(pp[1] - t2.y) < t2.h / 2) { over = true; break; } } }
      cv.style.cursor = over ? 'pointer' : '';
      requestAnimationFrame(frame);
    }
    function loopStart() { if (running) return; running = true; requestAnimationFrame(function (t) { last = t; frame(t); }); }
    send({ type: 'ready' });
    return G;
  }

  window.Moki = { version: 3, game: createGame, math: MATH };
})();
