// Moki Engine: kleine 2D-Spiele-Engine. Läuft IM Spiel-Frame (Studio-Vorschau und Moki-Spielseite).
// Koordinaten: Spielfeld ist 800 x 500. Beim Anlegen sind x/y in PROZENT (0-100), zur Laufzeit sind s.x/s.y in PIXELN.
(function () {
  'use strict';
  var W = 800, H = 500, MAXS = 300;
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
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason; send({ type: 'error', text: String((r && r.message) || r), line: 0 });
  });

  function rr(c, x, y, w, h, r) {
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  var PATH = {
    circle: function (c, s) { c.arc(0, 0, s / 2, 0, 7); },
    square: function (c, s) { rr(c, -s / 2, -s / 2, s, s, s * 0.18); },
    triangle: function (c, s) { c.moveTo(0, -s / 2); c.lineTo(s / 2, s / 2); c.lineTo(-s / 2, s / 2); c.closePath(); },
    diamond: function (c, s) { c.moveTo(0, -s / 2); c.lineTo(s / 2, 0); c.lineTo(0, s / 2); c.lineTo(-s / 2, 0); c.closePath(); },
    star: function (c, s) {
      for (var i = 0; i < 10; i++) {
        var r = i % 2 ? s * 0.22 : s * 0.5, a = -Math.PI / 2 + i * Math.PI / 5;
        i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
    },
    heart: function (c, s) {
      var u = s / 2;
      c.moveTo(0, u * 0.9); c.bezierCurveTo(-u * 1.6, -u * 0.1, -u * 0.8, -u * 1.1, 0, -u * 0.35);
      c.bezierCurveTo(u * 0.8, -u * 1.1, u * 1.6, -u * 0.1, 0, u * 0.9); c.closePath();
    }
  };
  function rand(a, b) { return a + Math.random() * (b - a); }
  function keyName(e) {
    var c = e.code || '';
    if (c === 'Space') return 'SPACE';
    if (c.indexOf('Arrow') === 0) return c.slice(5).toUpperCase();
    if (c.indexOf('Key') === 0) return c.slice(3).toUpperCase();
    if (c === 'Enter') return 'ENTER';
    return String(e.key || '').toUpperCase();
  }

  function createGame(o) {
    o = o || {};
    var G = {
      score: 0, lives: o.lives | 0, time: 0, state: 'ready', width: W, height: H,
      background: o.background || '#0d1240', title: o.title || window.MOKI_TITLE || 'Spiel',
      timeLimit: +o.time || 0, timeMode: o.timeMode === 'lose' ? 'lose' : 'win', showScore: o.showScore !== false
    };
    var sprites = [], defs = {}, nextId = 1, touching = {}, timers = [], scoreCbs = [], msg = null, endMsg = '';
    var h = { start: [], update: [], key: {}, touch: [], edge: [], click: [] };
    var down = {}, pointer = { x: W / 2, y: H / 2, down: false, seen: false };

    var cv = document.createElement('canvas');
    var ctx = cv.getContext('2d');
    document.body.appendChild(cv);
    var css = document.createElement('style');
    css.textContent = 'html,body{margin:0;height:100%;background:#000;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}' +
      'canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100vw,160vh);height:min(62.5vw,100vh);display:block;outline:none}';
    document.head.appendChild(css);
    var dpr = 1;
    function fit() {
      var r = cv.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    }
    addEventListener('resize', fit); fit();
    cv.tabIndex = 0;

    // ---------- Figuren ----------
    function Sprite(opt, isClone) {
      this.id = nextId++;
      this.name = String(opt.name || 'Figur');
      this.shape = PATH[opt.shape] ? opt.shape : 'circle';
      this.color = opt.color || '#00e5a8';
      this.size = +opt.size || 40;
      this.control = opt.control || 'none';       // 'keys' | 'mouse' | 'none'
      this.axis = opt.axis || 'xy';               // 'x' | 'y' | 'xy'
      this.motion = opt.motion || 'none';         // none fall rise left right bounce follow
      this.speed = opt.speed != null ? +opt.speed : 200;
      this.autoRespawn = opt.autoRespawn !== false;
      this.label = opt.label || '';
      this.visible = true; this.alive = true; this.out = false; this.vx = 0; this.vy = 0;
      this.x = (opt.x != null ? +opt.x : 50) / 100 * W;
      this.y = (opt.y != null ? +opt.y : 50) / 100 * H;
      this._opt = opt;
      if (this.motion === 'bounce') { var a = rand(0.4, 1.2) * (Math.random() < .5 ? 1 : -1); this.vx = Math.cos(a) * this.speed * (Math.random() < .5 ? 1 : -1); this.vy = Math.abs(Math.sin(a)) * this.speed * (Math.random() < .5 ? 1 : -1); }
    }
    Sprite.prototype.place = function (xp, yp) { this.x = xp / 100 * W; this.y = yp / 100 * H; this.out = false; return this; };
    Sprite.prototype.destroy = function () { this.alive = false; };
    Sprite.prototype.clone = function () { return add(new Sprite(this._opt)); };
    Sprite.prototype.touches = function (o) { return hit(this, o); };
    Sprite.prototype.respawn = function () {
      var s = this.size, m = this.motion;
      if (m === 'fall') { this.x = rand(s / 2, W - s / 2); this.y = -s / 2; }
      else if (m === 'rise') { this.x = rand(s / 2, W - s / 2); this.y = H + s / 2; }
      else if (m === 'left') { this.x = W + s / 2; this.y = rand(s / 2, H - s / 2); }
      else if (m === 'right') { this.x = -s / 2; this.y = rand(s / 2, H - s / 2); }
      else { this.x = rand(s, W - s); this.y = rand(s, H - s); }
      this.out = false; return this;
    };
    function add(s) { if (sprites.length < MAXS) sprites.push(s); else s.alive = false; return s; }
    G.sprite = function (opt) {
      opt = opt || {};
      var s = add(new Sprite(opt));
      if (!defs[s.name]) defs[s.name] = opt;
      return s;
    };
    G.spawn = function (name) {
      var d = defs[name]; if (!d) return null;
      var s = add(new Sprite(d)); s.respawn(); return s;
    };
    G.find = function (name) { for (var i = 0; i < sprites.length; i++) if (sprites[i].alive && sprites[i].name === name) return sprites[i]; return null; };
    G.all = function (name) { return sprites.filter(function (s) { return s.alive && (!name || s.name === name); }); };
    function nm(x) { return typeof x === 'string' ? x : (x && x.name); }

    function ext(s) { return (s.shape === 'square' ? 0.45 : 0.4) * s.size; }
    function hit(a, b) { var ea = ext(a), eb = ext(b); return Math.abs(a.x - b.x) < ea + eb && Math.abs(a.y - b.y) < ea + eb; }

    // ---------- Ereignisse ----------
    G.onStart = function (f) { h.start.push(f); };
    G.onUpdate = function (f) { h.update.push(f); };
    G.onKey = function (k, f) { k = String(k).toUpperCase(); (h.key[k] = h.key[k] || []).push(f); };
    G.onTouch = function (a, b, f) { h.touch.push({ a: nm(a), b: nm(b), f: f }); };
    G.onEdge = function (a, f) { h.edge.push({ a: nm(a), f: f }); };
    G.onClick = function (a, f) { h.click.push({ a: nm(a), f: f }); };
    G.every = function (sec, f) { timers.push({ t: 0, every: Math.max(0.05, +sec || 1), f: f }); };
    G.onScore = function (n, f) { scoreCbs.push({ n: +n, f: f, done: false }); };

    // ---------- Aktionen ----------
    G.addScore = function (n) { G.score += (+n || 0); };
    G.addLife = function (n) { G.lives = Math.max(0, G.lives + (+n || 0)); if (G.lives === 0 && n < 0 && G.state === 'play' && o.lives > 0) G.lose('Keine Leben mehr'); };
    G.say = function (t, sec) { msg = { t: String(t), left: sec == null ? 2 : +sec }; };
    G.win = function (m) { if (G.state === 'play') { G.state = 'won'; endMsg = m || 'Gewonnen!'; } };
    G.lose = function (m) { if (G.state === 'play') { G.state = 'lost'; endMsg = m || 'Verloren'; } };
    G.random = rand;
    G.start = function () { loopStart(); };

    function startPlay() {
      if (G.state !== 'ready') return;
      G.state = 'play'; cv.focus();
      h.start.forEach(function (f) { safe(f); });
    }
    function restart() {
      if (window.parent !== window) send({ type: 'restart' }); else location.reload();
    }
    function safe(f, a, b) { try { f(a, b); } catch (e) { console.error(e && e.message ? e.message : String(e)); } }

    // ---------- Eingabe ----------
    function setPointer(e) {
      var r = cv.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width * W; pointer.y = (e.clientY - r.top) / r.height * H; pointer.seen = true;
    }
    cv.addEventListener('pointermove', setPointer);
    cv.addEventListener('pointerdown', function (e) {
      setPointer(e); pointer.down = true;
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      if (G.state === 'ready') { startPlay(); return; }
      if (G.state === 'won' || G.state === 'lost') { restart(); return; }
      for (var i = sprites.length - 1; i >= 0; i--) {
        var s = sprites[i]; if (!s.alive) continue;
        if (Math.abs(pointer.x - s.x) < s.size / 2 + 6 && Math.abs(pointer.y - s.y) < s.size / 2 + 6) {
          h.click.forEach(function (c) { if (c.a === s.name) safe(c.f, s); });
          break;
        }
      }
    });
    cv.addEventListener('pointerup', function () { pointer.down = false; });
    cv.addEventListener('pointercancel', function () { pointer.down = false; });
    addEventListener('keydown', function (e) {
      var k = keyName(e);
      if (['SPACE', 'LEFT', 'RIGHT', 'UP', 'DOWN'].indexOf(k) > -1) e.preventDefault();
      if (G.state === 'ready' && !e.repeat) { startPlay(); return; }
      if ((G.state === 'won' || G.state === 'lost') && (k === 'SPACE' || k === 'ENTER') && !e.repeat) { restart(); return; }
      if (!down[k] && G.state === 'play' && h.key[k]) h.key[k].forEach(function (f) { safe(f); });
      down[k] = true;
    });
    addEventListener('keyup', function (e) { down[keyName(e)] = false; });
    addEventListener('blur', function () { down = {}; pointer.down = false; });
    function pressed(a, b) { return down[a] || down[b]; }

    // ---------- Update ----------
    function update(dt) {
      G.time += dt;
      if (msg) { msg.left -= dt; if (msg.left <= 0) msg = null; }
      var i, s;
      for (i = 0; i < sprites.length; i++) {
        s = sprites[i]; if (!s.alive) continue;
        var half = s.size / 2;
        if (s.control === 'keys') {
          var dx = 0, dy = 0;
          if (s.axis !== 'y') dx = (pressed('RIGHT', 'D') ? 1 : 0) - (pressed('LEFT', 'A') ? 1 : 0);
          if (s.axis !== 'x') dy = (pressed('DOWN', 'S') ? 1 : 0) - (pressed('UP', 'W') ? 1 : 0);
          if (pointer.down) {   // Touch: Richtung zum Finger
            if (s.axis !== 'y' && Math.abs(pointer.x - s.x) > 6) dx = pointer.x > s.x ? 1 : -1;
            if (s.axis !== 'x' && Math.abs(pointer.y - s.y) > 6) dy = pointer.y > s.y ? 1 : -1;
          }
          var l = Math.sqrt(dx * dx + dy * dy) || 1;
          s.x += dx / l * s.speed * dt; s.y += dy / l * s.speed * dt;
        } else if (s.control === 'mouse' && pointer.seen) {
          if (s.axis !== 'y') s.x = pointer.x;
          if (s.axis !== 'x') s.y = pointer.y;
        }
        if (s.control !== 'none') { s.x = Math.max(half, Math.min(W - half, s.x)); s.y = Math.max(half, Math.min(H - half, s.y)); }
        var m = s.motion;
        if (m === 'fall') s.y += s.speed * dt;
        else if (m === 'rise') s.y -= s.speed * dt;
        else if (m === 'left') s.x -= s.speed * dt;
        else if (m === 'right') s.x += s.speed * dt;
        else if (m === 'bounce') {
          s.x += s.vx * dt; s.y += s.vy * dt;
          if (s.x < half) { s.x = half; s.vx = Math.abs(s.vx); } if (s.x > W - half) { s.x = W - half; s.vx = -Math.abs(s.vx); }
          if (s.y < half) { s.y = half; s.vy = Math.abs(s.vy); } if (s.y > H - half) { s.y = H - half; s.vy = -Math.abs(s.vy); }
        } else if (m === 'follow') {
          var t = null; for (var j = 0; j < sprites.length; j++) if (sprites[j].alive && sprites[j].control !== 'none') { t = sprites[j]; break; }
          if (t) { var ax = t.x - s.x, ay = t.y - s.y, d = Math.sqrt(ax * ax + ay * ay) || 1; s.x += ax / d * s.speed * dt; s.y += ay / d * s.speed * dt; }
        }
        // Rand
        var outNow = s.x < -half || s.x > W + half || s.y < -half || s.y > H + half;
        if (outNow && !s.out) {
          s.out = true;
          var sp = s;
          h.edge.forEach(function (e) { if (e.a === sp.name) safe(e.f, sp); });
          if (s.alive && s.autoRespawn && (m === 'fall' || m === 'rise' || m === 'left' || m === 'right')) s.respawn();
        } else if (!outNow) s.out = false;
      }
      // Berührungen (nur beim Beginn der Berührung)
      h.touch.forEach(function (tc) {
        var A = G.all(tc.a), B = G.all(tc.b);
        A.forEach(function (a) { B.forEach(function (b) {
          if (a === b) return;
          var key = tc.a + '|' + tc.b + '|' + a.id + '|' + b.id, inx = hit(a, b);
          if (inx && !touching[key]) { touching[key] = 1; safe(tc.f, a, b); } else if (!inx) delete touching[key];
        }); });
      });
      timers.forEach(function (t) { t.t += dt; while (t.t >= t.every) { t.t -= t.every; safe(t.f); } });
      scoreCbs.forEach(function (c) { if (!c.done && G.score >= c.n) { c.done = true; safe(c.f); } });
      h.update.forEach(function (f) { safe(f, dt); });
      sprites = sprites.filter(function (s) { return s.alive; });
      if (G.timeLimit > 0 && G.time >= G.timeLimit && G.state === 'play') { G.time = G.timeLimit; G.timeMode === 'win' ? G.win('Geschafft!') : G.lose('Zeit abgelaufen'); }
    }

    // ---------- Zeichnen ----------
    function text(t, x, y, size, color, align, weight) {
      ctx.font = (weight || 800) + ' ' + size + 'px "Segoe UI",system-ui,sans-serif';
      ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color || '#fff'; ctx.fillText(t, x, y);
    }
    function overlay(a) { ctx.fillStyle = 'rgba(8,10,35,' + a + ')'; ctx.fillRect(0, 0, W, H); }
    function draw() {
      var k = cv.width / W;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.fillStyle = G.background; ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < sprites.length; i++) {
        var s = sprites[i]; if (!s.alive || !s.visible) continue;
        ctx.save(); ctx.translate(s.x, s.y);
        ctx.beginPath(); PATH[s.shape](ctx, s.size);
        ctx.fillStyle = s.color; ctx.fill();
        ctx.lineWidth = Math.max(2, s.size * 0.06); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke();
        if (s.label) text(s.label, 0, 0, Math.max(12, s.size * 0.4), '#0a0d2b');
        ctx.restore();
      }
      if (G.state !== 'ready') {
        if (G.showScore) text('Punkte  ' + G.score, 20, 28, 24, '#fff', 'left');
        if (o.lives > 0) { for (var l = 0; l < G.lives; l++) { ctx.save(); ctx.translate(W - 30 - l * 34, 28); ctx.beginPath(); PATH.heart(ctx, 24); ctx.fillStyle = '#ff4d6d'; ctx.fill(); ctx.restore(); } }
        if (G.timeLimit > 0) text(String(Math.max(0, Math.ceil(G.timeLimit - G.time))), W / 2, 28, 28, '#ffd23f');
      }
      if (msg && G.state === 'play') { text(msg.t, W / 2, 80, 30, '#ffd23f'); }
      if (G.state === 'ready') {
        overlay(0.72); text(G.title, W / 2, H / 2 - 26, 46, '#fff'); text('Tippen oder Taste drücken zum Starten', W / 2, H / 2 + 34, 20, '#a3abe0', 'center', 600);
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
      draw(); requestAnimationFrame(frame);
    }
    function loopStart() { if (running) return; running = true; requestAnimationFrame(function (t) { last = t; frame(t); }); }
    send({ type: 'ready' });
    return G;
  }

  window.Moki = { version: 1, game: createGame };
})();
