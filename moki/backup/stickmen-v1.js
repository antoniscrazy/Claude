// Moki Weihnachten: animierte Strichmaennchen in Weihnachtskleidung. Sie laufen ueber die Kacheln, springen von Kachel zu Kachel,
// klettern an den Kanten hoch, setzen sich, tanzen, winken und werfen Schneebaelle. Man kann sie packen und werfen (Ragdoll-Physik).
// Alles wird nur auf ein Canvas gezeichnet (kein Bild, kein Video). Die Kacheln der Seite sind der Boden.
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement, G = 1900;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let on = true; try { on = localStorage.getItem("moki-men") !== "0"; } catch (e) {}

  const cv = document.createElement("canvas"); cv.id = "xm-men"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv);
  const ctx = cv.getContext("2d"); let W = 0, H = 0, dpr = 1;
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; }
  size(); addEventListener("resize", size);

  const LEG = 25, TOR = 21, HR = 8.5;
  const busy = () => document.hidden || document.getElementById("player") || root.classList.contains("mi-on") || root.classList.contains("rz-on");

  // ---------- Boden: die Kacheln und Karten der Seite ----------
  const PSEL = ".tile,.advb,.door,.atree,.agift,.cat,.logo,.hero,.challenge,.xmcd";
  let plats = [], floor = { l: -1e5, r: 1e5, t: 0, b: 1e5, floor: 1, el: null }, HB = 90;
  function scan() {
    const hd = document.querySelector("header"); HB = hd ? hd.getBoundingClientRect().bottom : 90; floor.t = H - 2;
    plats = [];
    document.querySelectorAll(PSEL).forEach(e => {
      const r = e.getBoundingClientRect(), isLogo = e.classList.contains("logo");
      if (r.width < 40 || r.height < 14 || r.right < 0 || r.left > W || r.top > H - 36) return;
      if (!isLogo && r.top < HB + 6) return;
      if (isLogo && r.top < 6) return;
      plats.push({ l: r.left + 3, r: r.right - 3, t: r.top, b: r.bottom, el: e });
    });
    plats.push(floor);
  }
  const platOf = m => m.gr === null ? floor : plats.find(p => p.el === m.gr);

  // ---------- Zeichnen-Helfer ----------
  const SKIN = "#ffe6c9", INK = "#141a38", LIGHT = "#f2f6ff";
  function seg(pts, w, col) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = INK; ctx.lineWidth = w + 2.8; ctx.stroke();
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  }
  function ik(ax, ay, bx, by, l1, l2, bend) {
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || .01, d = Math.min(L, l1 + l2 - .01), a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0)), ux = dx / L, uy = dy / L;
    return [ax + ux * a - uy * h * bend, ay + uy * a + ux * h * bend];
  }

  // ---------- Kleidung ----------
  const OUT = {
    santa: { body: "#d6263b", leg: "#d6263b", skin: LIGHT, name: "Weihnachtsmann" },
    elf: { body: "#23a566", leg: "#1b7f4f", skin: LIGHT, name: "Elf" },
    reindeer: { body: "#9a5a2b", leg: "#7a4520", skin: LIGHT, name: "Rentier" },
    scarf: { body: "#2c6bd6", leg: "#233a7a", skin: LIGHT, name: "Wichtel" }
  };
  const SAY = ["Frohe Weihnachten!", "Ho ho ho!", "Schneeball!", "Hui!", "Moki rockt!", "Wer spielt mit?", "Brrr, kalt!", "Plätzchen!", "Zack!"];

  class Man {
    constructor(i, type) {
      this.type = type; this.o = OUT[type]; this.x = rnd(60, Math.max(120, W - 60)); this.y = -60 - i * 90; this.vx = 0; this.vy = 0; this.dir = Math.random() < .5 ? -1 : 1;
      this.state = "air"; this.t = 0; this.ph = rnd(0, 6); this.cp = 0; this.gr = undefined; this.timer = 1; this.goal = null; this.then = null; this.say = null; this.sayT = 0; this.land = 0;
      this.nodes = null; this.held = false; this.limpT = 0; this.wall = null; this.thrown = false; this.big = rnd(.92, 1.08);
      this.scarf = Array.from({ length: 7 }, () => [this.x, this.y]);
    }
    speak(txt, d) { this.say = txt || pick(SAY); this.sayT = d || 2.2; }
    set(s, extra) { this.state = s; this.t = 0; if (extra) Object.assign(this, extra); }
    // Zustand "aus der Luft"
    launch(vx, vy) { this.vx = vx; this.vy = vy; this.gr = undefined; this.set("air"); }
    update(dt, mouse) {
      this.t += dt; if (this.sayT > 0) this.sayT -= dt; else this.say = null;
      const s = this.state;
      if (s === "limp") return this.limp(dt);
      let P = this.gr === undefined ? null : platOf(this);
      if (s === "air") {
        const py = this.y; this.vy += G * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        if (this.x < 14) { this.x = 14; this.vx = Math.abs(this.vx) * .3; } if (this.x > W - 14) { this.x = W - 14; this.vx = -Math.abs(this.vx) * .3; }
        if (this.vy >= 0) for (const p of plats) if (this.x > p.l - 3 && this.x < p.r + 3 && py <= p.t + 2 && this.y >= p.t) {
          if (this.vy > 1250) { this.y = p.t; this.toLimp(this.vx * .4, -this.vy * .25); this.speak("Aua!", 1.6); return; }
          this.y = p.t; this.gr = p.el; this.vy = 0; this.vx = 0; this.land = .25; this.set("idle"); this.timer = rnd(.3, 1); return;
        }
        if (this.y > H + 300) { this.x = rnd(60, W - 60); this.y = -80; this.vy = 0; this.vx = 0; }
        return;
      }
      if (s === "climb") return this.climbing(dt);
      // Auf dem Boden: Plattform folgen (Scrollen, Layout)
      if (!P || (!P.floor && (P.t < HB - 2 && !P.el.classList.contains("logo") || P.t > H - 20))) { this.launch(this.vx * .2, 0); return; }
      this.y = P.t; this.land = Math.max(0, this.land - dt);
      if (s === "idle") {
        this.timer -= dt;
        if (this.timer <= 0) this.decide(P, mouse);
      } else if (s === "walk" || s === "goto") {
        const sp = (s === "goto" ? 70 : 52) * this.big; this.x += this.dir * sp * dt; this.ph += dt * sp * .14;
        if (s === "goto") {
          if ((this.goal - this.x) * this.dir <= 0) { this.x = this.goal; const th = this.then; this.then = null; if (th) th(P); else this.idle(); return; }
        } else { this.timer -= dt; if (this.timer <= 0) this.idle(); }
        if (!P.floor && (this.x < P.l + 2 || this.x > P.r - 2) && !(s === "goto" && this.edgeOk)) { this.x = clamp(this.x, P.l + 2, P.r - 2); this.atEdge(P); }
        if (P.floor) { if (this.x < 20 || this.x > W - 20) { this.x = clamp(this.x, 20, W - 20); this.dir *= -1; if (s === "goto") this.idle(); } }
      } else if (s === "sit") {
        this.timer -= dt; if (this.timer <= 0) { this.idle(); }
      } else if (s === "dance" || s === "wave") {
        this.timer -= dt; if (this.timer <= 0) this.idle();
      } else if (s === "throw") {
        if (!this.thrown && this.t > .3) { this.thrown = true; this.fire(); }
        if (this.t > .65) this.idle();
      } else if (s === "pull") {
        if (this.t > .45) { this.x = this.pullX; this.set("idle"); this.timer = rnd(.4, 1); }
      } else if (s === "cheer") {
        this.vy += G * dt; this.y += this.vy * dt; if (this.y >= P.t) { this.y = P.t; this.vy = 0; this.idle(); } else this.y = Math.min(this.y, P.t);
      }
      this.x = clamp(this.x, 10, W - 10);
    }
    idle() { this.set("idle"); this.timer = rnd(.4, 1.6); }
    atEdge(P) {
      const r = Math.random();
      if (r < .5) { this.dir *= -1; this.timer = rnd(1, 3); this.set("walk"); this.timer = rnd(1.5, 3.5); }
      else if (r < .75) { this.set("sit"); this.timer = rnd(3, 6); this.dir = this.x < (P.l + P.r) / 2 ? -1 : 1; }
      else this.launch(this.dir * rnd(60, 130), -rnd(300, 520));
    }
    decide(P, mouse) {
      const cur = mouse && mouse.in ? Math.hypot(mouse.x - this.x, mouse.y - (this.y - 30)) : 1e9;
      const r = Math.random();
      if (cur < 170 && r < .5) { this.dir = mouse.x < this.x ? -1 : 1; this.set("wave"); this.timer = rnd(1.6, 3); if (Math.random() < .5) this.speak(); return; }
      if (r < .30) { this.dir = Math.random() < .5 ? -1 : 1; this.set("walk"); this.timer = rnd(1.5, 4); return; }
      if (r < .40) { this.timer = rnd(.8, 2); return; }
      if (r < .50) { this.set("dance"); this.timer = rnd(2.5, 5); if (Math.random() < .4) this.speak("Tanzt mit!"); return; }
      if (r < .60) { this.set("wave"); this.timer = rnd(1.5, 3); this.speak(); return; }
      if (r < .68) { this.toEdgeThenSit(P); return; }
      if (r < .80) { if (this.tryJump(P)) return; }
      if (r < .90) { if (this.tryClimb(P)) return; }
      if (r < .96) { this.tryThrow(mouse); return; }
      this.dir = Math.random() < .5 ? -1 : 1; this.set("walk"); this.timer = rnd(1.5, 3);
    }
    toEdgeThenSit(P) {
      if (P.floor) { this.dir = Math.random() < .5 ? -1 : 1; this.set("walk"); this.timer = rnd(1, 3); return; }
      const ex = Math.random() < .5 ? P.l + 6 : P.r - 6; this.goTo(ex, p => { this.set("sit"); this.timer = rnd(3, 6); this.dir = ex < (p.l + p.r) / 2 ? -1 : 1; });
    }
    goTo(x, then, edgeOk) { this.goal = x; this.dir = x < this.x ? -1 : 1; this.then = then; this.edgeOk = !!edgeOk; this.set("goto"); }
    // Sprung auf eine andere Kachel
    tryJump(P) {
      const c = plats.filter(p => p !== P && !p.floor && p.t > HB + 8 && p.t >= this.y - 130 && p.t <= this.y + 320 && Math.max(p.l - P.r, P.l - p.r, 0) <= 140 && p.r > 20 && p.l < W - 20);
      if (!c.length) return false;
      const T = pick(c), tx = clamp(this.x, T.l + 10, T.r - 10), tgt = clamp(T.l + 10 + Math.random() * Math.max(1, T.r - T.l - 20), T.l + 10, T.r - 10);
      const side = T.r < P.l + 4 ? P.l + 4 : T.l > P.r - 4 ? P.r - 4 : clamp(tgt, P.l + 6, P.r - 6);
      this.goTo(clamp(side, P.l + 4, P.r - 4), p => {
        const q = plats.find(z => z.el === T.el); if (!q) return this.idle();
        const ty = q.t, apex = Math.min(this.y, ty) - rnd(35, 70), vy = -Math.sqrt(2 * G * (this.y - apex)), tt = (-vy + Math.sqrt(vy * vy + 2 * G * (ty - this.y))) / G, gx = clamp(tgt, q.l + 8, q.r - 8), vx = (gx - this.x) / tt;
        if (Math.abs(vx) > 330 || !isFinite(vx)) return this.idle();
        this.dir = vx < 0 ? -1 : 1; this.launch(vx, vy);
      }, false);
      return true;
    }
    // Klettern an der Seite der Kachel darueber
    tryClimb(P) {
      const c = plats.filter(p => p !== P && !p.floor && p.b >= this.y - 44 && p.b <= this.y + 8 && p.t < this.y - 50 && p.t > HB + 6 && p.r > 30 && p.l < W - 30);
      const opts = [];
      c.forEach(p => { [[p.l - 8, 1], [p.r + 8, -1]].forEach(([wx, cw]) => { if (wx >= P.l - 14 && wx <= P.r + 14 && wx > 8 && wx < W - 8) opts.push({ p, wx, cw }); }); });
      if (!opts.length) return false;
      opts.sort((u, v) => Math.abs(u.wx - this.x) - Math.abs(v.wx - this.x)); const o = Math.random() < .7 ? opts[0] : pick(opts.slice(0, 2));
      this.goTo(o.wx, () => { this.wall = { el: o.p.el, cw: o.cw }; this.cp = 0; this.set("climb"); }, true);
      return true;
    }
    climbing(dt) {
      const p = plats.find(z => z.el === this.wall.el); if (!p) { this.launch(0, 0); return; }
      const cw = this.wall.cw; this.x = (cw > 0 ? p.l : p.r) - cw * 8; this.dir = cw; this.cp += dt * 6.5; this.y -= 46 * dt;
      if (this.y <= p.t + 1) { this.y = p.t; this.gr = p.el; this.pullX = clamp(cw > 0 ? p.l + 16 : p.r - 16, p.l + 6, p.r - 6); this.set("pull"); }
    }
    tryThrow(mouse) {
      let tx = null, ty = null; const o = men.filter(m => m !== this && m.state !== "limp" && Math.hypot(m.x - this.x, m.y - this.y) < 480);
      if (o.length && Math.random() < .75) { const m = pick(o); tx = m.x; ty = m.y - 24; } else if (mouse && mouse.in && Math.hypot(mouse.x - this.x, mouse.y - this.y) < 520) { tx = mouse.x; ty = mouse.y; }
      if (tx === null) { this.set("wave"); this.timer = 1.5; return; }
      this.dir = tx < this.x ? -1 : 1; this.aim = [tx, ty]; this.thrown = false; this.set("throw");
    }
    fire() {
      const sx = this.x + this.dir * 8, sy = this.y - LEG - TOR + 2, T = .75, [tx, ty] = this.aim || [sx + this.dir * 200, sy];
      balls.push({ x: sx, y: sy, vx: clamp((tx - sx) / T, -700, 700), vy: clamp((ty - sy - .5 * 1200 * T * T) / T, -900, 300), life: 3, own: this });
      if (Math.random() < .4) this.speak("Schneeball!", 1.4);
    }
    // ---------- Ragdoll ----------
    toLimp(vx, vy) {
      const J = this.pose(), k = .008, N = (p, ax, ay) => ({ x: p[0], y: p[1], px: p[0] - ax * k, py: p[1] - ay * k });
      this.nodes = { hd: N(J.hd, vx, vy), nk: N(J.nk, vx, vy), hp: N(J.hp, vx, vy), h0: N(J.hn[0], vx, vy), h1: N(J.hn[1], vx, vy), f0: N(J.ft[0], vx, vy), f1: N(J.ft[1], vx, vy) };
      this.state = "limp"; this.t = 0; this.limpT = 0; this.gr = undefined;
    }
    limp(dt) {
      const n = this.nodes, all = Object.values(n), steps = 2, h = dt / steps;
      for (let s = 0; s < steps; s++) {
        all.forEach(p => {
          if (p.pin) { p.px = p.x; p.py = p.y; return; }
          const vx = (p.x - p.px) * .996, vy = (p.y - p.py) * .996; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + G * h * h;
        });
        for (let it = 0; it < 5; it++) {
          const C = (a, b, L, st) => { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, df = (d - L) / d * (st || 1) * .5; if (!a.pin) { a.x += dx * df; a.y += dy * df; } if (!b.pin) { b.x -= dx * df; b.y -= dy * df; } };
          C(n.hd, n.nk, 12); C(n.nk, n.hp, TOR); C(n.nk, n.h0, 17); C(n.nk, n.h1, 17); C(n.hp, n.f0, LEG - 1); C(n.hp, n.f1, LEG - 1);
          C(n.f0, n.f1, 9, .35);   // Beine bleiben leicht beieinander
          all.forEach(p => this.coll(p));
        }
      }
      if (this.held) { this.limpT = 0; return; }
      this.limpT += dt;
      const sp = all.reduce((a, p) => a + Math.hypot(p.x - p.px, p.y - p.py), 0) / all.length;
      if (this.limpT > 1.3 && sp < .6 || this.limpT > 5) this.getUp();
    }
    coll(p) {
      const cand = plats; for (const q of cand) {
        if (p.x > q.l && p.x < q.r && p.py <= q.t + 3 && p.y > q.t) {
          const vx = p.x - p.px, vy = p.y - p.py; p.y = q.t; p.py = q.t + vy * .28; p.px = p.x - vx * .8; p.gr = q.el; return;
        }
      }
      if (p.x < 6) p.x = 6; if (p.x > W - 6) p.x = W - 6;
    }
    getUp() {
      const n = this.nodes, fx = (n.f0.x + n.f1.x) / 2, fy = Math.max(n.f0.y, n.f1.y) + 2;
      let best = null, bd = 1e9; for (const q of plats) { if (fx > q.l - 6 && fx < q.r + 6) { const d = Math.abs(q.t - fy); if (d < bd && d < 60) { bd = d; best = q; } } }
      this.nodes = null; this.x = clamp(fx, 14, W - 14);
      if (best) { this.y = best.t; this.gr = best.el; this.land = .3; this.set("idle"); this.timer = rnd(.4, 1); this.speak(pick(["Autsch!", "Alles gut!", "Nochmal!", "Hoppla!"]), 1.6); }
      else { this.y = fy; this.launch(0, 0); }
    }
    // ---------- Pose ----------
    pose() {
      const d = this.dir, s = this.state, t = this.t, x = this.x, y = this.y, n = this.nodes;
      let hipY = y - LEG, lean = 0, f0 = [x - 6, y], f1 = [x + 6, y], h0, h1, J = { d };
      if (s === "limp" && n) {
        J.hd = [n.hd.x, n.hd.y]; J.nk = [n.nk.x, n.nk.y]; J.hp = [n.hp.x, n.hp.y]; J.ft = [[n.f0.x, n.f0.y], [n.f1.x, n.f1.y]]; J.hn = [[n.h0.x, n.h0.y], [n.h1.x, n.h1.y]];
        J.sh = [J.nk[0], J.nk[1] + 3]; J.kn = [0, 1].map(i => { const f = J.ft[i], m = [(J.hp[0] + f[0]) / 2, (J.hp[1] + f[1]) / 2]; return [m[0] + (i ? 3 : -3), m[1] - 1]; });
        J.el = [0, 1].map(i => { const h = J.hn[i], m = [(J.sh[0] + h[0]) / 2, (J.sh[1] + h[1]) / 2]; return [m[0] + (i ? -2 : 2), m[1] + 1]; }); J.floppy = 1; return J;
      }
      let sitting = false, armsUp = false, climbing = false;
      if (s === "walk" || s === "goto") {
        const s0 = Math.sin(this.ph), c0 = Math.cos(this.ph);
        f0 = [x + s0 * 13 * d, y - Math.max(0, c0) * 6]; f1 = [x - s0 * 13 * d, y - Math.max(0, -c0) * 6]; hipY = y - LEG + Math.abs(s0) * 1.8; lean = 2;
        J.hand = [s0, -s0];
      } else if (s === "air" || s === "cheer") {
        const up = this.vy < 0, fl = Math.sin(t * 16);
        hipY = y - LEG + 5; f0 = [x - 6 + fl * 1.5, y - (up ? 9 : 3)]; f1 = [x + 6, y - (up ? 5 : 1)]; armsUp = true; J.flail = this.vy > 700 ? 1 : 0;
      } else if (s === "dance") {
        const b = Math.sin(t * 9); hipY = y - LEG + 3 + Math.abs(b) * 3; lean = Math.sin(t * 4.5) * 2.5;
        f0 = [x - 7, y - Math.max(0, b) * 7]; f1 = [x + 7, y - Math.max(0, -b) * 7]; J.dance = t + .001;
      } else if (s === "sit") {
        sitting = true;
      } else if (s === "climb") {
        climbing = true;
      } else if (s === "pull") {
        const u = clamp(t / .45, 0, 1); hipY = y - LEG * (.45 + .55 * u); lean = 4 * d;
      } else { hipY = y - LEG + Math.sin(t * 2.2 + this.ph) * .7 - this.land * 7 * (this.land > 0 ? 1 : 0); }
      const hp = [x, hipY], nk = [x + lean * d, hipY - TOR + (sitting ? 2 : 0)], hd = [nk[0] + lean * .4 * d, nk[1] - HR - 3];
      J.hp = hp; J.nk = nk; J.hd = hd; const sh = [nk[0], nk[1] + 3]; J.sh = sh;
      if (sitting) {
        const hp2 = [x, y - 6], kn0 = [x + d * 11, y - 6], kn1 = [x + d * 11, y - 7]; J.hp = hp2; J.nk = [x + d * 2, y - 6 - TOR + 2]; J.hd = [J.nk[0] + d, J.nk[1] - HR - 3]; J.sh = [J.nk[0], J.nk[1] + 3];
        J.kn = [kn0, kn1]; J.ft = [[x + d * 12 + Math.sin(t * 3) * 3, y + 7], [x + d * 12 + Math.sin(t * 3 + 1.6) * 3, y + 7]];
        J.hn = [[x - d * 6, y - 2], [x - d * 3, y - 1]]; J.el = [ik(J.sh[0], J.sh[1], J.hn[0][0], J.hn[0][1], 9.5, 9.5, d), ik(J.sh[0], J.sh[1], J.hn[1][0], J.hn[1][1], 9.5, 9.5, d)]; return J;
      }
      if (climbing) {
        const cw = this.wall ? this.wall.cw : 1, a = this.cp, hx = x + cw * 9, q = k => .5 + .5 * Math.sin(a + k * Math.PI);
        J.hp = [x, y - 19]; J.nk = [x + cw * 2, y - 19 - TOR]; J.hd = [J.nk[0] + cw * 2, J.nk[1] - HR - 3]; J.sh = [J.nk[0], J.nk[1] + 3];
        J.ft = [[x + cw * 3, y - 2 - q(0) * 8], [x + cw * 3, y - 2 - q(1) * 8]];
        J.kn = J.ft.map(f => ik(J.hp[0], J.hp[1], f[0], f[1], 12.5, 12.5, cw));
        J.hn = [[hx, J.sh[1] - 4 - q(1) * 9], [hx, J.sh[1] - 4 - q(0) * 9]];
        J.el = J.hn.map(h => ik(J.sh[0], J.sh[1], h[0], h[1], 9.5, 9.5, -cw)); return J;
      }
      J.ft = [f0, f1]; J.kn = J.ft.map(f => ik(hp[0], hp[1], f[0], f[1], 12.5, 12.5, -d));
      const swing = J.hand;
      if (armsUp) {
        const fl = J.flail ? Math.sin(t * 22) * 6 : 0;
        h0 = [sh[0] - 12, sh[1] - 12 + fl]; h1 = [sh[0] + 12, sh[1] - 12 - fl];
      } else if (J.dance) {
        const b = J.dance * 9; h0 = [sh[0] - 13, sh[1] - 6 - (1 + Math.sin(b)) * 7]; h1 = [sh[0] + 13, sh[1] - 6 - (1 - Math.sin(b)) * 7];
      } else if (s === "wave") {
        h0 = [sh[0] + d * 11, sh[1] - 15 + Math.sin(t * 14) * 3]; h1 = [sh[0] - d * 6, sh[1] + 14];
      } else if (s === "throw") {
        const u = clamp(t / .6, 0, 1); h0 = u < .5 ? [sh[0] - d * 11, sh[1] - 11] : [sh[0] + d * 15, sh[1] - 6]; h1 = [sh[0] + d * 6, sh[1] + 12];
      } else if (s === "pull") {
        h0 = [sh[0] + d * 9, sh[1] + 10]; h1 = [sh[0] - d * 9, sh[1] + 10];
      } else if (swing) { h0 = [sh[0] - swing[0] * 9 * d, sh[1] + 14]; h1 = [sh[0] - swing[1] * 9 * d, sh[1] + 14]; }
      else { h0 = [sh[0] - 7, sh[1] + 14.5]; h1 = [sh[0] + 7, sh[1] + 14.5]; }
      J.hn = [h0, h1]; J.el = J.hn.map(h => ik(sh[0], sh[1], h[0], h[1], 9.5, 9.5, d)); return J;
    }
    // ---------- Zeichnen ----------
    draw() {
      const J = this.pose(), o = this.o, d = J.d, st = this.state;
      // Schatten
      if (st !== "limp" && st !== "air" && st !== "climb") { ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(this.x, this.y + 1, 13, 3, 0, 0, 7); ctx.fill(); }
      // Schal (hinten)
      if (this.type === "scarf") this.drawScarf(J);
      // Beine
      [0, 1].forEach(i => { seg([J.hp, J.kn[i], J.ft[i]], 3.6, o.leg); const f = J.ft[i]; seg([f, [f[0] + d * 4.5, f[1]]], 4.4, this.type === "elf" ? "#d6263b" : "#1a1a22"); });
      // Rumpf
      seg([J.hp, J.nk], 6.5, o.body);
      if (this.type === "santa") { seg([[J.hp[0] - 3.4, J.hp[1] - 6], [J.hp[0] + 3.4, J.hp[1] - 6]], 2.4, "#1a1a22"); seg([[J.hp[0] - 2.5, J.hp[1] + 1], [J.hp[0] + 2.5, J.hp[1] + 1]], 2.5, "#fff"); }
      if (this.type === "elf") { seg([[J.nk[0] - 3.3, J.nk[1] + 2], [J.nk[0] + 3.3, J.nk[1] + 2]], 2.4, "#ffd23f"); }
      // Arme
      [0, 1].forEach(i => { seg([J.sh, J.el[i], J.hn[i]], 3.2, o.body); const h = J.hn[i]; ctx.fillStyle = this.type === "scarf" ? "#fff" : this.type === "santa" ? "#fff" : SKIN; ctx.beginPath(); ctx.arc(h[0], h[1], 2.4, 0, 7); ctx.fill(); });
      // Kopf
      const hd = J.hd; ctx.fillStyle = SKIN; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hd[0], hd[1], HR, 0, 7); ctx.fill(); ctx.stroke();
      const lookX = J.floppy ? 0 : d * 1.6; ctx.fillStyle = INK;
      if (st === "limp" && !this.held && this.limpT < .6) { ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center"; ctx.fillText("x x", hd[0], hd[1] + 1); }
      else { ctx.beginPath(); ctx.arc(hd[0] + lookX - 2.7, hd[1] - 1.2, 1.2, 0, 7); ctx.arc(hd[0] + lookX + 2.7, hd[1] - 1.2, 1.2, 0, 7); ctx.fill(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); if (st === "air" || st === "cheer" || st === "dance") ctx.arc(hd[0] + lookX, hd[1] + 1.8, 2.8, .1, Math.PI - .1); else ctx.arc(hd[0] + lookX, hd[1] + 2.4, 2, .2, Math.PI - .2); ctx.stroke();
      this.drawHat(J);
      // Sprechblase
      if (this.say) this.bubble(J);
    }
    drawHat(J) {
      const hd = J.hd, d = J.d, tilt = J.floppy ? 0 : d * .25;
      ctx.save(); ctx.translate(hd[0], hd[1] - HR + 1.5); ctx.rotate(tilt + (J.floppy ? Math.atan2(J.hd[0] - J.nk[0], J.nk[1] - J.hd[1]) * .8 : 0));
      if (this.type === "santa") {
        ctx.fillStyle = "#d6263b"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.quadraticCurveTo(-6, -15, d * 6 + 2, -13); ctx.quadraticCurveTo(d * 11, -9, 9, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(-10, -1.5, 20, 5, 2.5); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(d * 7, -13, 3, 0, 7); ctx.fill(); ctx.stroke();
        ctx.restore(); ctx.fillStyle = "#fff"; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(hd[0] - 7.5, hd[1] + 1.5); ctx.quadraticCurveTo(hd[0], hd[1] + 17, hd[0] + 7.5, hd[1] + 1.5); ctx.quadraticCurveTo(hd[0], hd[1] + 5, hd[0] - 7.5, hd[1] + 1.5); ctx.fill(); ctx.stroke(); return;
      }
      if (this.type === "elf") {
        ctx.fillStyle = "#23a566"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.lineTo(-3, -9); ctx.quadraticCurveTo(d * 8, -14, d * 14, -6); ctx.lineTo(8, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(d * 14, -6, 2.4, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#d6263b"; ctx.fillRect(-9, -1.5, 18, 3.5); ctx.restore();
        ctx.fillStyle = SKIN; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(hd[0] + sd * 8, hd[1] - 1); ctx.lineTo(hd[0] + sd * 14, hd[1] - 5); ctx.lineTo(hd[0] + sd * 8, hd[1] + 3); ctx.fill(); ctx.stroke(); }); return;
      }
      if (this.type === "reindeer") {
        ctx.restore(); ctx.strokeStyle = "#7a4520"; ctx.lineCap = "round";
        [-1, 1].forEach(sd => { const bx = hd[0] + sd * 5, by = hd[1] - HR + 1; seg([[bx, by], [bx + sd * 4, by - 9], [bx + sd * 3, by - 15]], 2.2, "#8a5a2b"); seg([[bx + sd * 3.5, by - 8], [bx + sd * 9, by - 11]], 1.8, "#8a5a2b"); seg([[bx + sd * 3.6, by - 12], [bx + sd * 8, by - 16]], 1.6, "#8a5a2b"); });
        ctx.fillStyle = "#ff3b3b"; ctx.shadowColor = "#ff3b3b"; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(hd[0] + d * 1.6, hd[1] + 2.6, 2.6, 0, 7); ctx.fill(); ctx.shadowBlur = 0; return;
      }
      // scarf: Bommelmuetze
      ctx.fillStyle = "#2c6bd6"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 1, 9, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(-9.5, -.5, 19, 4.5, 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(d * 1, -10, 3.4, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    drawScarf(J) {
      const sc = this.scarf, a = [J.nk[0], J.nk[1] + 1];
      sc[0][0] = a[0]; sc[0][1] = a[1];
      for (let i = 1; i < sc.length; i++) {
        const p = sc[i], q = sc[i - 1]; p[1] += 1.1; p[0] -= this.vxs * .02 * (i / 3);
        const dx = p[0] - q[0], dy = p[1] - q[1], L = Math.hypot(dx, dy) || .01, k = 5.2 / L; p[0] = q[0] + dx * k; p[1] = q[1] + dy * k;
      }
      seg(sc.map(p => [p[0], p[1]]), 4.6, "#d6263b");
      ctx.save(); ctx.setLineDash([2.5, 3.5]); ctx.beginPath(); sc.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = "#fff"; ctx.lineWidth = 4.4; ctx.stroke(); ctx.restore();
    }
    bubble(J) {
      const txt = this.say; ctx.font = "800 12px system-ui,sans-serif"; const w = ctx.measureText(txt).width + 14, x = clamp(J.hd[0] - w / 2, 4, W - w - 4), y = J.hd[1] - 40 - (this.type === "reindeer" ? 6 : 0);
      const a = clamp(this.sayT / .3, 0, 1); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fff"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.roundRect(x, y, w, 20, 9); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(J.hd[0] - 4, y + 19.5); ctx.lineTo(J.hd[0], y + 27); ctx.lineTo(J.hd[0] + 4, y + 19.5); ctx.fillStyle = "#fff"; ctx.fill();
      ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x + w / 2, y + 10.5); ctx.restore();
    }
  }

  // ---------- Schneebaelle und Staub ----------
  const balls = [], parts = [];
  function puff(x, y, n) { for (let i = 0; i < n; i++) { const a = rnd(-3.1, 0), v = rnd(40, 150); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(.4, .8), t: 0, r: rnd(1.5, 3.4) }); } }
  function stepBalls(dt) {
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i]; b.life -= dt; b.vy += 1200 * dt; const py = b.y; b.x += b.vx * dt; b.y += b.vy * dt;
      let hit = b.life <= 0 || b.x < -20 || b.x > W + 20 || b.y > H + 20;
      if (!hit) for (const m of men) if (m !== b.own && m.state !== "limp") { if (Math.hypot(b.x - m.x, b.y - (m.y - 30)) < 17) { m.toLimp(b.vx * .6, b.vy * .6 - 150); m.speak(pick(["Autsch!", "Treffer!", "Oh nein!", "Hey!"]), 1.6); hit = true; b.hitMan = 1; break; } }
      if (!hit) for (const p of plats) if (b.x > p.l && b.x < p.r && py < p.t && b.y >= p.t - 1) { hit = true; break; }
      if (hit) { puff(b.x, b.y, b.hitMan ? 14 : 9); balls.splice(i, 1); }
    }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t > p.life) parts.splice(i, 1); }
  }

  // ---------- Mauszeiger, Packen und Werfen ----------
  const mouse = { x: -999, y: -999, in: false, vx: 0, vy: 0, lx: 0, ly: 0, lt: 0 };
  let drag = null, supp = 0, setCur = false;
  const popup = () => document.querySelector(".advm,.modal,.agiftv,#player");
  function near(m, x, y) {
    if (m.state === "limp" && m.nodes) { return Object.values(m.nodes).some(p => Math.hypot(p.x - x, p.y - y) < 17); }
    return x > m.x - 14 && x < m.x + 14 && y > m.y - LEG - TOR - 22 && y < m.y + 6;
  }
  addEventListener("pointermove", e => {
    const now = performance.now(), dt = Math.max(1, now - mouse.lt); mouse.vx = (e.clientX - mouse.lx) / dt * 1000; mouse.vy = (e.clientY - mouse.ly) / dt * 1000; mouse.lx = e.clientX; mouse.ly = e.clientY; mouse.lt = now;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.in = e.pointerType !== "touch";
    if (drag) { drag.man.nodes.nk.x = e.clientX; drag.man.nodes.nk.y = e.clientY; return; }
    if (e.pointerType === "mouse" && on && !busy() && !popup()) { const h = men.some(m => near(m, e.clientX, e.clientY)); if (h) { document.body.style.cursor = "grab"; setCur = true; } else if (setCur) { document.body.style.cursor = ""; setCur = false; } }
  }, { passive: true });
  document.addEventListener("mouseleave", () => { mouse.in = false; });
  addEventListener("pointerdown", e => {
    if (!on || busy() || popup() || e.button > 0) return;
    const m = men.find(q => near(q, e.clientX, e.clientY)); if (!m) return;
    e.preventDefault(); e.stopPropagation();
    if (e.pointerType === "touch") { if (m.state !== "limp") { m.launch(0, -640); m.speak(); } return; }
    if (m.state !== "limp" || !m.nodes) m.toLimp(0, 0);
    m.held = true; m.nodes.nk.pin = true; m.nodes.nk.x = e.clientX; m.nodes.nk.y = e.clientY; drag = { man: m, x: e.clientX, y: e.clientY, t: performance.now() };
    document.body.style.cursor = "grabbing"; m.speak(pick(["Huch!", "Hilfe!", "Wheee!"]), 1.4);
  }, true);
  addEventListener("pointerup", e => {
    if (!drag) return; const m = drag.man, n = m.nodes, click = Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5 && performance.now() - drag.t < 250;
    m.held = false; n.nk.pin = false;
    if (click) { m.x = n.hp.x; m.y = Math.max(n.f0.y, n.f1.y); m.nodes = null; m.launch(0, -720); m.speak("Ho ho ho!"); }
    else { const k = .008; n.nk.px = n.nk.x - clamp(mouse.vx, -2200, 2200) * k; n.nk.py = n.nk.y - clamp(mouse.vy, -2200, 2200) * k; }
    drag = null; supp = performance.now() + 350; document.body.style.cursor = ""; setCur = false;
  }, true);
  document.addEventListener("click", e => { if (performance.now() < supp) { e.preventDefault(); e.stopPropagation(); } }, true);

  // ---------- Start ----------
  const men = []; const n = innerWidth < 700 ? 3 : 5;
  ["santa", "elf", "reindeer", "scarf", "santa"].slice(0, n).forEach((t, i) => men.push(new Man(i, t)));
  men.forEach(m => { m.vxs = 0; });
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "xm-menbtn"; btn.setAttribute("aria-label", "Strichmännchen an oder aus"); btn.title = "Strichmännchen";
  btn.innerHTML = "<span>🎅</span>"; btn.setAttribute("aria-pressed", String(on)); btn.classList.toggle("on", on);
  btn.addEventListener("click", () => { on = !on; try { localStorage.setItem("moki-men", on ? "1" : "0"); } catch (e) {} btn.setAttribute("aria-pressed", String(on)); btn.classList.toggle("on", on); if (on) men.forEach(m => { m.x = rnd(60, W - 60); m.y = -60; m.vy = 0; m.gr = undefined; m.nodes = null; m.set("air"); }); });
  document.body.appendChild(btn);

  let last = performance.now(), shown = true;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, .033); last = now;
    if (!on || busy()) { if (shown) { cv.style.opacity = "0"; shown = false; } return; }
    if (!shown) { cv.style.opacity = "1"; shown = true; }
    try {
      scan(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      men.forEach(m => { const ox = m.x; m.update(dt, mouse); m.vxs = (m.x - ox) / Math.max(dt, .001); });
      stepBalls(dt);
      men.forEach(m => m.draw());
      ctx.fillStyle = "#fff"; balls.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 4.2, 0, 7); ctx.fill(); ctx.strokeStyle = "#b9cdf5"; ctx.lineWidth = 1; ctx.stroke(); });
      parts.forEach(p => { ctx.globalAlpha = 1 - p.t / p.life; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
    } catch (e) { on = false; cv.style.opacity = "0"; console.error(e); }
  }
  requestAnimationFrame(frame);
  window.MOKI_MEN = { men, plats: () => plats, state: () => men.map(m => m.state) };
})();
