// Moki Weihnachten: Der Spielplatz. Eine eigene Winterlandschaft fuer die Strichmaennchen mit Haeusern, Schaukel, Wippe, Rutsche,
// Trampolin, Schneemann-Baustelle, Lagerfeuer, Weihnachtsbaum mit Geschenken und Eisbahn. Die Figuren benutzen alles selbst und
// spielen miteinander (High Five, Umarmen, Quatschen, Wettrennen, Schneeballduell, Fangen, Schneeballschlacht, Party, Feuerwerk).
(function () {
  "use strict";
  const A = window.MOKI_MEN_API; if (!A) return;
  const { MODE, men, rnd, pick, clamp, LEG, TOR } = A;
  const root = document.documentElement;
  let ov = null, cv = null, ctx = null, isOpen = false, dpr = 1, T = 0, objs = [], fx = [], stars = [], flakes = [], rockets = [], pines = [];
  let W = 1600, H = 900, S = 1, G0 = 800, mode = null, wind = 0, windTarget = 0, storm = 0, tagIt = null, tagCd = 0, hopT = 0;

  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const ext = (m, pp, fn) => { m.state = "ext"; m.t = 0; m.pp = pp; m.ext = fn; m.rot = 0; m.sx = 1; m.flip = 0; };
  const onFloor = m => m.gr === null;

  // ---------- Partikel ----------
  function burst(x, y, n, cols, o) {
    o = o || {};
    for (let i = 0; i < n; i++) { const a = o.up ? rnd(-2.6, -.5) : rnd(0, 6.283), v = rnd(o.v0 || 60, o.v1 || 220); fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.g === undefined ? 380 : o.g, life: rnd(.6, o.life || 1.3), t: 0, r: rnd(1.6, o.r || 3.6), c: pick(cols), k: o.k || "c" }); }
  }
  const sparkle = (x, y) => burst(x, y, 16, ["#fff", "#ffd23f", "#00e5a8"], { v1: 150, g: 120 });
  const hearts = (x, y) => { for (let i = 0; i < 5; i++) fx.push({ x: x + rnd(-14, 14), y, vx: rnd(-20, 20), vy: rnd(-70, -40), g: 0, life: rnd(1.2, 1.8), t: 0, k: "txt", txt: "❤", r: rnd(11, 17), c: "#ff4d6d" }); };
  const popEmoji = (x, y, txt) => fx.push({ x, y, vx: rnd(-18, 18), vy: -120, g: 160, life: 2, t: 0, k: "txt", txt, r: 26, c: "#fff" });
  const confetti = (x, y, n) => burst(x, y, n, ["#ff4d6d", "#ffd23f", "#00e5a8", "#3da5ff", "#fff", "#c77dff"], { up: true, v0: 120, v1: 420, g: 520, life: 2.2, r: 4.2, k: "sq" });

  // ---------- Objekte ----------
  const make = {};
  make.house = (x, v) => {
    const a = v === "A", w = a ? 230 : 172, h = a ? 172 : 140, roofTop = G0 - h - 12, cx = x + w * .24;
    const o = { type: "house", x, w, h, v, roofTop, color: a ? "#b8452f" : "#2f7d5a", door: x - w * .24, occ: 0, lit: 0, knock: 0, sm: 0, chim: { x: cx, top: roofTop - 58 },
      plats: [{ l: x - w / 2, r: x + w / 2, t: roofTop, b: G0, el: {} }, { l: cx - 11, r: cx + 11, t: roofTop - 58, b: roofTop, el: {} }] };
    o.step = dt => { o.knock = Math.max(0, o.knock - dt); o.sm -= dt; if (o.sm <= 0) { o.sm = rnd(.3, .55); fx.push({ x: o.chim.x + rnd(-3, 3), y: o.chim.top - 4, vx: wind * 20 + rnd(5, 18), vy: -rnd(28, 44), g: -4, life: 2.6, t: 0, k: "smoke", r: 5, c: "#cfd9ee" }); } };
    o.draw = () => {
      const x0 = o.x - o.w / 2, y0 = G0 - o.h, lit = o.occ > 0 || o.lit > 0;
      const g = ctx.createLinearGradient(0, y0, 0, G0); g.addColorStop(0, o.color); g.addColorStop(1, "#000"); ctx.fillStyle = o.color; ctx.fillRect(x0, y0, o.w, o.h);
      ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fillRect(x0, G0 - 16, o.w, 16);
      ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 2; for (let yy = y0 + 22; yy < G0 - 10; yy += 22) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + o.w, yy); ctx.stroke(); }
      // Kamin
      ctx.fillStyle = "#8a3a2a"; ctx.fillRect(o.chim.x - 11, o.chim.top, 22, 58); ctx.fillStyle = "#6e2c20"; ctx.fillRect(o.chim.x - 14, o.chim.top - 5, 28, 8); ctx.fillStyle = "#fff"; rr(o.chim.x - 15, o.chim.top - 10, 30, 8, 4); ctx.fill();
      // Dach
      ctx.fillStyle = "#4a2230"; ctx.beginPath(); ctx.moveTo(x0 - 12, y0 + 2); ctx.lineTo(x0 + 2, o.roofTop); ctx.lineTo(x0 + o.w - 2, o.roofTop); ctx.lineTo(x0 + o.w + 12, y0 + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; rr(x0 - 8, o.roofTop - 2, o.w + 16, 11, 6); ctx.fill();
      ctx.fillStyle = "#dbe8ff"; for (let q = 0; q < o.w; q += 17) { ctx.beginPath(); ctx.moveTo(x0 - 6 + q, y0 + 1); ctx.lineTo(x0 + q, y0 + 1); ctx.lineTo(x0 - 3 + q, y0 + 9 + (q % 3) * 3); ctx.fill(); }
      // Lichterkette
      const cols = ["#ff4d6d", "#ffd23f", "#00e5a8", "#3da5ff"]; for (let q = 0; q < o.w + 10; q += 20) { const on = (Math.floor(T * 2 + q / 20) % 2) === 0; ctx.fillStyle = cols[(q / 20 | 0) % 4]; ctx.globalAlpha = on ? 1 : .45; ctx.beginPath(); ctx.arc(x0 - 4 + q, y0 + 12 + Math.sin(q / 20 * 1.6) * 3, 3, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
      // Fenster
      const wins = o.v === "A" ? [o.x + 20, o.x + 74] : [o.x + 28, o.x + 70];
      wins.forEach((wx, i) => { const wy = y0 + 42; ctx.fillStyle = "#fff"; rr(wx - 3, wy - 3, 40, 46, 5); ctx.fill(); ctx.fillStyle = lit ? "#ffe08a" : "#e8b94d"; ctx.fillRect(wx, wy, 34, 40); if (lit) { ctx.fillStyle = "#1a1530"; for (let k = 0; k < Math.min(o.occ, 2); k++) { const hx = wx + 11 + k * 14 + Math.sin(T * 2 + i + k) * 1.5; ctx.beginPath(); ctx.arc(hx, wy + 27, 4.2, 0, 7); ctx.fill(); rr(hx - 6, wy + 31, 12, 9, 3); ctx.fill(); } } ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + 17, wy); ctx.lineTo(wx + 17, wy + 40); ctx.moveTo(wx, wy + 20); ctx.lineTo(wx + 34, wy + 20); ctx.stroke(); ctx.fillStyle = "#fff"; rr(wx - 5, wy + 40, 44, 6, 3); ctx.fill(); });
      // Tuer
      const dx = o.door - 17, dy = G0 - 58, open = o.knock > 0 || o.occ > 0 && Math.sin(T * 3) > .96; ctx.fillStyle = "#5a3418"; rr(dx, dy, 34, 58, 3); ctx.fill(); if (open) { ctx.fillStyle = "#ffe08a"; ctx.fillRect(dx + 3, dy + 3, 28, 52); } ctx.strokeStyle = "#3a2210"; ctx.lineWidth = 2; ctx.strokeRect(dx + 4, dy + 5, 26, 20); ctx.strokeRect(dx + 4, dy + 30, 26, 22);
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(dx + 27, dy + 32, 2.2, 0, 7); ctx.fill();
      ctx.strokeStyle = "#1f8a4f"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(o.door, dy + 14, 8, 0, 7); ctx.stroke(); ctx.fillStyle = "#d6263b"; ctx.beginPath(); ctx.arc(o.door, dy + 22, 3.4, 0, 7); ctx.fill();
      if (o.v === "B") { ctx.fillStyle = "#7a4a22"; rr(o.x + 6, y0 + 4, 76, 18, 3); ctx.fill(); ctx.fillStyle = "#ffe3a0"; ctx.font = "800 12px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Werkstatt", o.x + 44, y0 + 14); }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(o.x, G0 + 2, o.w / 2 + 10, 7, 0, 0, 7); ctx.fill();
    };
    return o;
  };
  make.fire = x => {
    const o = { type: "fire", x, seats: [-70, -38, 38, 70].map(d => ({ x: x + d, m: null })), plats: [] };
    o.step = dt => { if (Math.random() < dt * 14) fx.push({ x: x + rnd(-8, 8), y: G0 - 18, vx: rnd(-14, 14) + wind * 12, vy: -rnd(60, 130), g: -12, life: rnd(.7, 1.4), t: 0, r: rnd(1.2, 2.4), c: pick(["#ffd23f", "#ff9a3c", "#fff"]), k: "c" }); o.seats.forEach(s => { if (s.m && !(s.m.seat === s && (s.m.state === "ext" || s.m.state === "goto"))) s.m = null; }); };
    o.draw = () => {
      ctx.fillStyle = "#6b7a96"; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 26, G0 + 1 + Math.sin(a) * 4, 7, 5, 0, 0, 7); ctx.fill(); }
      ctx.save(); ctx.translate(x, G0 - 4); ctx.rotate(.35); ctx.fillStyle = "#5b3516"; rr(-24, -5, 48, 10, 5); ctx.fill(); ctx.rotate(-.7); rr(-24, -5, 48, 10, 5); ctx.fill(); ctx.restore();
      for (let k = 0; k < 3; k++) { const s = 1 - k * .28, fl = Math.sin(T * 9 + k * 2) * 3; ctx.fillStyle = ["#ff6a2b", "#ffb02e", "#fff3b0"][k]; ctx.beginPath(); ctx.moveTo(x - 16 * s, G0 - 8); ctx.quadraticCurveTo(x - 20 * s + fl, G0 - 34 * s, x + fl * .6, G0 - 58 * s - Math.sin(T * 7 + k) * 5); ctx.quadraticCurveTo(x + 20 * s + fl, G0 - 34 * s, x + 16 * s, G0 - 8); ctx.closePath(); ctx.fill(); }
    };
    o.glow = () => { const g = ctx.createRadialGradient(x, G0 - 30, 4, x, G0 - 30, 190 + Math.sin(T * 8) * 8); g.addColorStop(0, "rgba(255,170,60,.38)"); g.addColorStop(1, "rgba(255,120,30,0)"); ctx.fillStyle = g; ctx.fillRect(x - 200, G0 - 230, 400, 260); };
    return o;
  };
  make.swing = x => {
    const top = G0 - 150, L = 100, o = { type: "swing", x, top, L, A: .08, th: 0, rider: null, t: 0, plats: [] };
    o.step = dt => { o.t += dt; if (o.rider && !(o.rider.state === "ext" && o.rider.ext === o.fn) && o.rider.state !== "goto") o.rider = null; if (!o.rider) o.A = Math.max(.05, o.A - dt * .25); o.th = o.A * Math.sin(o.t * 2.6); };
    o.draw = () => {
      ctx.strokeStyle = "#8b5a2b"; ctx.lineCap = "round"; ctx.lineWidth = 7;
      [[-62, -78], [-62, -46], [62, 78], [62, 46]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(x + a, top); ctx.lineTo(x + b * (a < 0 ? 1 : 1) * 1.0 + (a < 0 ? -10 : 10) * 0, G0); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(x - 66, top); ctx.lineTo(x + 66, top); ctx.lineWidth = 9; ctx.stroke();
      const sx = x + L * Math.sin(o.th), sy = top + L * Math.cos(o.th); ctx.save(); ctx.translate(sx, sy + 2); ctx.rotate(o.th * .45);
      ctx.strokeStyle = "#b9c3dc"; ctx.lineWidth = 2; [-12, 12].forEach(d => { ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d - Math.sin(o.th) * 0, 0); ctx.stroke(); });
      ctx.restore();
      ctx.strokeStyle = "#b9c3dc"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, top); ctx.lineTo(sx - 11 * Math.cos(o.th), sy + 2 - 11 * Math.sin(o.th)); ctx.moveTo(x + 10, top); ctx.lineTo(sx + 11 * Math.cos(o.th), sy + 2 + 11 * Math.sin(o.th)); ctx.stroke();
      ctx.save(); ctx.translate(sx, sy + 3); ctx.rotate(o.th * .45); ctx.fillStyle = "#d6263b"; rr(-15, -3, 30, 6, 3); ctx.fill(); ctx.restore();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x, G0 + 2, 82, 6, 0, 0, 7); ctx.fill();
    };
    return o;
  };
  make.seesaw = x => {
    const L = 80, py = G0 - 30, o = { type: "seesaw", x, L, py, phi: 0, t: 0, riders: [null, null], plats: [] };
    o.seat = i => { const d = (i ? 1 : -1) * (L - 14); return [x + d * Math.cos(o.phi), py + d * Math.sin(o.phi)]; };
    o.step = dt => {
      o.t += dt; o.riders.forEach((r, i) => { if (r && !(r.seesaw === o && (r.state === "ext" || r.state === "goto"))) o.riders[i] = null; });
      const both = o.riders[0] && o.riders[1], tg = both ? .3 * Math.sin(o.t * 2.4) : o.riders[0] ? -.27 : o.riders[1] ? .27 : 0;
      o.phi += (tg - o.phi) * Math.min(1, dt * (both ? 10 : 4));
    };
    o.draw = () => {
      ctx.fillStyle = "#5b6b8c"; ctx.beginPath(); ctx.moveTo(x - 22, G0); ctx.lineTo(x + 22, G0); ctx.lineTo(x, py + 2); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.translate(x, py); ctx.rotate(o.phi); ctx.fillStyle = "#ffb02e"; rr(-L, -5, L * 2, 8, 4); ctx.fill(); ctx.fillStyle = "#c77d00"; ctx.fillRect(-L + 22, -16, 4, 12); ctx.fillRect(L - 26, -16, 4, 12); ctx.restore();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x, G0 + 2, 40, 5, 0, 0, 7); ctx.fill();
    };
    return o;
  };
  make.slide = x => {
    const deckY = G0 - 122, l = x - 26, r = x + 26, deck = { l, r, t: deckY, b: G0, el: {} };
    const P0 = [r + 2, deckY + 3], P1 = [r + 105, deckY + 38], P2 = [r + 205, G0 - 8];
    const B = u => { const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return [a * P0[0] + b * P1[0] + c * P2[0], a * P0[1] + b * P1[1] + c * P2[1]]; };
    const o = { type: "slide", x, deck, busy: false, B, plats: [deck] };
    o.draw = () => {
      ctx.strokeStyle = "#7a8aa8"; ctx.lineWidth = 6; ctx.lineCap = "round"; [l + 4, r - 4].forEach(px => { ctx.beginPath(); ctx.moveTo(px, deckY); ctx.lineTo(px, G0); ctx.stroke(); });
      // Leiter
      ctx.strokeStyle = "#caa46a"; ctx.lineWidth = 4; [l - 12, l - 2].forEach(px => { ctx.beginPath(); ctx.moveTo(px, deckY + 4); ctx.lineTo(px - 6, G0); ctx.stroke(); }); ctx.lineWidth = 3; for (let yy = deckY + 18; yy < G0 - 6; yy += 18) { const k = (yy - deckY) / (G0 - deckY); ctx.beginPath(); ctx.moveTo(l - 12 - 6 * k, yy); ctx.lineTo(l - 2 - 6 * k, yy); ctx.stroke(); }
      ctx.fillStyle = "#3da5ff"; rr(l - 2, deckY - 4, 56, 9, 3); ctx.fill();
      ctx.strokeStyle = "#d6263b"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(l + 2, deckY - 4); ctx.lineTo(l + 2, deckY - 36); ctx.lineTo(r - 2, deckY - 36); ctx.lineTo(r - 2, deckY - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); ctx.strokeStyle = "#8fd0ff"; ctx.lineWidth = 15; ctx.stroke(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(P0[0], P0[1] - 7); ctx.quadraticCurveTo(P1[0], P1[1] - 7, P2[0], P2[1] - 7); ctx.stroke();
      ctx.strokeStyle = "#7a8aa8"; ctx.lineWidth = 4; [.35, .7].forEach(u => { const p = B(u); ctx.beginPath(); ctx.moveTo(p[0], p[1] + 6); ctx.lineTo(p[0], G0); ctx.stroke(); });
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(P2[0] + 14, G0 + 1, 34, 8, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, G0 + 2, 44, 5, 0, 0, 7); ctx.fill();
    };
    return o;
  };
  make.tramp = x => {
    const pl = { l: x - 50, r: x + 50, t: G0 - 34, b: G0, el: {}, bounce: true, sq: 0 }, o = { type: "tramp", x, pl, plats: [pl] };
    o.step = dt => { pl.sq = Math.max(0, pl.sq - dt * .9); };
    o.draw = () => {
      ctx.strokeStyle = "#5b6b8c"; ctx.lineWidth = 5; ctx.lineCap = "round"; [-40, 40].forEach(d => { ctx.beginPath(); ctx.moveTo(x + d, G0 - 32); ctx.lineTo(x + d + Math.sign(d) * 6, G0); ctx.stroke(); });
      const sag = pl.sq * 40; ctx.strokeStyle = "#1f2a44"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 50, G0 - 34); ctx.quadraticCurveTo(x, G0 - 34 + sag * 2, x + 50, G0 - 34); ctx.stroke();
      ctx.strokeStyle = "#ff4d6d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 50, G0 - 36); ctx.quadraticCurveTo(x, G0 - 36 + sag * 2, x + 50, G0 - 36); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x, G0 + 2, 56, 5, 0, 0, 7); ctx.fill();
    };
    return o;
  };
  make.snowman = x => {
    const o = { type: "snowman", x, work: 0, doneT: 0, cel: 0, plats: [] };
    o.step = dt => {
      if (o.work >= 18) { o.doneT += dt; if (!o.cel) { o.cel = 1; confetti(x, G0 - 70, 36); sparkle(x, G0 - 80); men.forEach(m => { if (onFloor(m) && Math.abs(m.x - x) < 220 && m.state !== "ext" && m.state !== "limp") { m.launch(0, -520); m.speak("Fertig!", 1.6); } }); }
        if (o.doneT > 40) { o.work = Math.max(0, o.work - dt * 7); if (o.work <= 0) { o.doneT = 0; o.cel = 0; } } }
    };
    o.draw = () => {
      const w = o.work, lerp = (a, b, u) => a + (b - a) * clamp(u, 0, 1), r1 = w > 0 ? lerp(4, 24, w / 6) : 0, r2 = w > 6 ? lerp(4, 17, (w - 6) / 6) : 0, r3 = w > 12 ? lerp(3, 12, (w - 12) / 6) : 0;
      const ball = (cx, cy, r) => { const g = ctx.createRadialGradient(cx - r * .3, cy - r * .3, r * .1, cx, cy, r); g.addColorStop(0, "#fff"); g.addColorStop(1, "#c9d9f5"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); };
      const y1 = G0 - r1 + 3, y2 = y1 - r1 - r2 + 8, y3 = y2 - r2 - r3 + 6;
      if (r1) ball(x, y1, r1); if (r2) ball(x, y2, r2); if (r3) ball(x, y3, r3);
      if (w >= 18) {
        ctx.fillStyle = "#1a1a22"; [-4, 4].forEach(d => { ctx.beginPath(); ctx.arc(x + d, y3 - 2, 1.5, 0, 7); ctx.fill(); }); [0, 7, 14].forEach(d => { ctx.beginPath(); ctx.arc(x, y2 - 6 + d, 1.8, 0, 7); ctx.fill(); });
        ctx.fillStyle = "#ff8a1f"; ctx.beginPath(); ctx.moveTo(x, y3 + 1); ctx.lineTo(x + 13, y3 + 3); ctx.lineTo(x, y3 + 5); ctx.fill();
        ctx.fillStyle = "#1a1a22"; rr(x - 9, y3 - r3 - 8, 18, 10, 2); ctx.fill(); ctx.fillRect(x - 13, y3 - r3 + 1, 26, 3); ctx.fillStyle = "#d6263b"; ctx.fillRect(x - 9, y3 - r3 - 1, 18, 3);
        ctx.fillStyle = "#d6263b"; rr(x - r2 + 3, y3 + r3 - 2, r2 * 2 - 6, 5, 2.5); ctx.fill(); ctx.fillRect(x + 4, y3 + r3, 5, 14);
        ctx.strokeStyle = "#5b3516"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - r2 + 2, y2 - 2); ctx.lineTo(x - r2 - 16, y2 - 14); ctx.moveTo(x + r2 - 2, y2 - 2); ctx.lineTo(x + r2 + 16, y2 - 12); ctx.stroke();
      }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x, G0 + 2, 38, 5, 0, 0, 7); ctx.fill();
    };
    return o;
  };
  make.rink = x => {
    const o = { type: "rink", x, l: x - 66, r: x + 66, plats: [] };
    o.draw = () => {
      const g = ctx.createLinearGradient(o.l, 0, o.r, 0); g.addColorStop(0, "#bfe4ff"); g.addColorStop(.5, "#eaf7ff"); g.addColorStop(1, "#bfe4ff"); ctx.fillStyle = g; rr(o.l, G0 - 2, 132, 9, 4); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(o.l + 14, G0 + 3); ctx.lineTo(o.l + 50, G0 + 1); ctx.moveTo(o.l + 70, G0 + 4); ctx.lineTo(o.l + 112, G0 + 2); ctx.stroke();
      ctx.fillStyle = "#8b5a2b"; [o.l - 2, o.r + 2].forEach(px => { ctx.fillRect(px - 2, G0 - 22, 4, 26); }); ctx.strokeStyle = "#d6263b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.l, G0 - 18); ctx.lineTo(o.r, G0 - 18); ctx.stroke();
    };
    return o;
  };
  make.tree = x => {
    const o = { type: "tree", x, baub: 0, flash: 0, lit: false, slots: [], presents: [], plats: [] };
    const tiers = [[0, 62, 92], [62, 130, 72], [130, 186, 50]]; o.tiers = tiers;
    for (let i = 0; i < 18; i++) { const ty = rnd(30, 170), half = ty < 62 ? 14 + ty * .45 : ty < 130 ? 30 + (ty - 62) * .5 : 42 + (ty - 130) * .45; o.slots.push([rnd(-half * .75, half * .75), -ty]); }
    o.presents = [{ dx: -62, w: 30, h: 22, c: "#d6263b", open: 0 }, { dx: 56, w: 26, h: 28, c: "#3da5ff", open: 0 }, { dx: 84, w: 22, h: 18, c: "#ffd23f", open: 0 }];
    o.step = dt => { o.flash = Math.max(0, o.flash - dt); o.presents.forEach(p => { if (p.open > 0) p.open = Math.max(0, p.open - dt); }); if (o.lit && Math.random() < dt * 3) fx.push({ x: x + rnd(-30, 30), y: G0 - rnd(60, 190), vx: 0, vy: -rnd(4, 14), g: 0, life: 1, t: 0, r: rnd(1, 2), c: "#fff3b0", k: "c" }); };
    o.draw = () => {
      ctx.fillStyle = "#6a3b1d"; ctx.fillRect(x - 9, G0 - 22, 18, 24);
      const base = G0 - 18;
      [[2, 50, 92], [48, 112, 74], [108, 170, 52]].forEach(([a, b, hw], i) => { ctx.beginPath(); ctx.moveTo(x - hw, base - a); ctx.lineTo(x, base - b - 22); ctx.lineTo(x + hw, base - a); ctx.closePath(); const g = ctx.createLinearGradient(0, base - b, 0, base - a); g.addColorStop(0, "#38c083"); g.addColorStop(1, "#0d5236"); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.65)"; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = "#fff"; for (let q = 0; q < 6; q++) { const f = (q + .5) / 6; ctx.beginPath(); ctx.ellipse(x - hw + 2 * hw * f, base - a - 1, hw * .1, 3.5, 0, 0, 7); ctx.fill(); } });
      const lc = ["#ff4d6d", "#ffd23f", "#3da5ff", "#00e5a8"];
      for (let k = 0; k < 22; k++) { const ty = 14 + (k * 37) % 150, half = ty < 50 ? 8 + ty * .8 : ty < 110 ? 30 + (ty - 50) * .6 : 50 + (ty - 110) * .5, lx = ((k * 53) % 100 / 100 - .5) * half * 1.5; ctx.globalAlpha = o.lit ? (Math.sin(T * 4 + k) > -.3 ? 1 : .35) : .38; ctx.fillStyle = lc[k % 4]; ctx.beginPath(); ctx.arc(x + lx, base - ty - 10, 2.6, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
      for (let i = 0; i < o.baub; i++) { const s = o.slots[i], bc = ["#d6263b", "#ffd23f", "#3da5ff", "#c77dff"][i % 4]; ctx.fillStyle = bc; ctx.beginPath(); ctx.arc(x + s[0], base + s[1] - 8, 5.6, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.arc(x + s[0] - 1.6, base + s[1] - 9.6, 1.6, 0, 7); ctx.fill(); }
      const sy = base - 196, R = 15 + (o.flash > 0 ? 4 : 0); ctx.save(); ctx.translate(x, sy); ctx.shadowColor = "#ffd23f"; ctx.shadowBlur = o.lit || o.flash > 0 ? 28 : 12; ctx.fillStyle = "#ffd23f"; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? R * .42 : R, an = i / 10 * 6.283 - 1.5708; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
      o.presents.forEach(p => { const px = x + p.dx, py = G0 - p.h; ctx.fillStyle = p.c; ctx.fillRect(px - p.w / 2, py, p.w, p.h); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(px - 2, py, 4, p.h); const lid = p.open > 0 ? Math.sin(Math.min(1, p.open / 2.4) * 3.14) * 18 : 0; ctx.save(); ctx.translate(px, py - 4 - lid); ctx.rotate(p.open > 0 ? -.45 * Math.min(1, lid / 10) : 0); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2 - 2, -3, p.w + 4, 7); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(-2, -3, 4, 7); ctx.beginPath(); ctx.arc(-4, -6, 4, 0, 7); ctx.arc(4, -6, 4, 0, 7); ctx.fill(); ctx.restore(); });
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x, G0 + 2, 100, 7, 0, 0, 7); ctx.fill();
    };
    return o;
  };

  // ---------- Aufbau ----------
  function build() {
    objs = []; const wide = W >= 1250;
    const L = wide ? [["house", .075, "A"], ["house", .215, "B"], ["fire", .31], ["swing", .405], ["seesaw", .505], ["slide", .585], ["tree", .74], ["tramp", .835], ["snowman", .9], ["rink", .955]]
      : [["house", .17, "A"], ["tree", .43], ["snowman", .58], ["swing", .73], ["tramp", .9]];
    L.forEach(([t, f, v]) => objs.push(make[t](f * W, v)));
    const rs = [.3, .55, .75, .2]; pines = []; for (let i = 0; i < Math.round(W / 70); i++) pines.push({ x: i * 70 + rnd(-18, 18), h: rnd(40, 90), l: Math.floor(rnd(0, 2)), s: rnd(.7, 1.2) });
    stars = Array.from({ length: 170 }, () => ({ x: Math.random() * W, y: Math.random() * (G0 - 160), r: rnd(.5, 1.7), p: rnd(0, 6) }));
    flakes = Array.from({ length: 460 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: rnd(1, 2.8), vy: rnd(24, 62), p: rnd(0, 6) }));
  }
  const byType = t => objs.filter(o => o.type === t);

  // ---------- Verhalten der Figuren ----------
  const DIALOGS = [["Schöner Abend, oder?", "Ja, der Schnee ist perfekt!"], ["Hast du schon Plätzchen probiert?", "Drei! Oder vier ..."], ["Wo ist mein Geschenk?", "Unterm Baum natürlich!"], ["Wetten, ich bin schneller?", "Das glaubst du doch selbst nicht!"], ["Frohe Weihnachten!", "Dir auch, mein Freund!"], ["Brrr, ist das kalt!", "Komm ans Feuer!"], ["Baust du den Schneemann mit?", "Klar, ich hole die Karotte!"], ["Ich war gerade auf der Rutsche!", "Ich auch! Nochmal?"]];
  function chat(m, q) { return pair(m, q, "chat"); }
  function pair(m, q, kind) {
    const mx = clamp((m.x + q.x) / 2, 60, W - 60), half = kind === "duel" ? 95 : kind === "race" ? 12 : 16, S_ = { kind, arr: [0, 0], t: 0, wait: 0, mx, fx: 0, lines: pick(DIALOGS), said: {}, finish: [0, 0], run: false };
    const leftM = m.x <= q.x; const mine = [[m, leftM ? -1 : 1], [q, leftM ? 1 : -1]];
    S_.dirR = (W - mx > mx) ? 1 : -1; S_.dist = Math.min(380, (S_.dirR > 0 ? W - mx : mx) - 60); S_.sp = [rnd(140, 185), rnd(140, 185)]; S_.x0 = [0, 0];
    mine.forEach(([me, side], idx) => {
      me.pairS = S_; const gx = clamp(mx + side * half, 30, W - 30);
      me.goTo(gx, () => { me.dir = side < 0 ? 1 : -1; S_.arr[idx] = 1; ext(me, "stand", dt => seq(S_, idx, me, idx ? m : q, dt, [m, q][1 - idx] === me ? 0 : 0)); me.pairS = S_; });
    });
    return true;
  }
  function seq(S_, idx, me, other, dt) {
    const both = S_.arr[0] && S_.arr[1];
    if (!both) { S_.wait += dt / 2; if (S_.wait > 5) return false; me.pp = "stand"; return true; }
    if (!(other.state === "ext" && other.pairS === S_)) return false;
    if (idx === 0) S_.t += dt;
    const t = S_.t, cy = me.y - LEG - TOR - 10;
    if (S_.kind === "hi5") {
      me.pp = t > .15 ? "hi5" : "stand"; if (t > .5 && !S_.fx) { S_.fx = 1; sparkle(S_.mx, cy); if (idx === 0) me.speak("High five!", 1.3); }
      return t < 1.2;
    }
    if (S_.kind === "hug") {
      me.pp = t > .25 ? "hug" : "stand"; if (t > .4 && Math.random() < dt * 3 && idx === 0) hearts(S_.mx, cy); if (t > .4 && !S_.fx && idx === 0) { S_.fx = 1; me.speak("Frohe Weihnachten!", 1.8); }
      return t < 2.3;
    }
    if (S_.kind === "chat") {
      me.pp = "stand"; const li = Math.floor(t / 1.9);
      if (li < 2 && li % 2 === idx && !S_.said[li]) { S_.said[li] = 1; me.speak(S_.lines[li], 1.8); }
      if (li === 2 && idx === 0 && !S_.said[2]) { S_.said[2] = 1; me.speak("Haha!", 1); }
      return t < 6;
    }
    if (S_.kind === "race") {
      if (!S_.run) {
        me.pp = t < 2.2 ? "crouch" : "stand";
        if (idx === 0) { const k = Math.floor(t / .7); if (k < 3 && !S_.said[k]) { S_.said[k] = 1; me.speak(String(3 - k), .65); } if (t >= 2.1 && !S_.said[9]) { S_.said[9] = 1; me.speak("Los!", .9); } }
        if (t >= 2.2) { S_.run = true; S_.x0[idx] = me.x; }
        return true;
      }
      if (!S_.finish[idx]) {
        me.dir = S_.dirR; me.pp = "push"; me.ph += dt * S_.sp[idx] * .14; me.x += S_.dirR * S_.sp[idx] * dt;
        if (Math.abs(me.x - S_.x0[idx]) >= S_.dist) { S_.finish[idx] = S_.finish[1 - idx] ? 2 : 1; S_.ft = S_.ft || t; me.pp = S_.finish[idx] === 1 ? "cheer" : "stand"; me.speak(S_.finish[idx] === 1 ? "Gewonnen!" : "Menno!", 1.6); }
        return true;
      }
      me.pp = S_.finish[idx] === 1 ? "cheer" : "stand"; return S_.finish[0] && S_.finish[1] ? t < (S_.ft || 0) + 3 : t < (S_.ft || 0) + 3;
    }
    if (S_.kind === "duel") {
      me.pp = "throw"; me.dir = me.x < other.x ? 1 : -1;
      const ph = (t * 1.15 + idx * .5) % 1; if (ph < .08 && !S_["f" + idx + Math.floor(t * 1.15 + idx * .5)]) { S_["f" + idx + Math.floor(t * 1.15 + idx * .5)] = 1; me.aim = [other.x, other.y - 30]; me.fire(); }
      if (t > 7 && idx === 0) me.speak("Gut gespielt!", 1.2);
      return t < 7.6;
    }
    return false;
  }
  function social(m) {
    if (!onFloor(m)) return false;
    const c = men.filter(q => q !== m && onFloor(q) && !q.hidden && ["idle", "walk", "dance", "wave"].includes(q.state) && Math.abs(q.x - m.x) < 460 && Math.abs(q.x - m.x) > 36);
    if (!c.length) return false;
    return pair(m, pick(c), pick(["hi5", "hug", "chat", "chat", "race", "duel"]));
  }

  function rideSwing(m, o) {
    let t = 0; const T_ = rnd(8, 12); o.rider = m; m.seat = null;
    const fn = dt => { if (o.rider !== m) return false; t += dt; o.A = Math.min(.95, o.A + dt * .28); m.x = o.x + o.L * Math.sin(o.th); m.y = o.top + o.L * Math.cos(o.th) + 9; m.dir = 1; m.rot = o.th * .3;
      if (t > T_) { const vx = clamp(o.L * o.A * 2.6 * Math.cos(o.t * 2.6) * 1.1, -430, 430); o.rider = null; m.launch(vx, -240); m.flip = vx >= 0 ? 7 : -7; m.speak("Wheee!", 1.5); } return true; };
    ext(m, "ride", fn); o.fn = fn;
  }
  function joinSeesaw(m, o) {
    const i = o.riders[0] ? (o.riders[1] ? -1 : 1) : (o.riders[1] ? 0 : (m.x < o.x ? 0 : 1)); if (i < 0) return false;
    o.riders[i] = m; m.seesaw = o; const sx = o.x + (i ? 1 : -1) * (o.L - 14);
    m.goTo(sx, () => { let t = 0, tb = 0; ext(m, "sit", dt => { if (o.riders[i] !== m) return false; const p = o.seat(i); m.x = p[0]; m.y = p[1] + 3; m.dir = i ? -1 : 1; const both = o.riders[0] && o.riders[1]; if (both) tb += dt; else t += dt; if (t > 9 || tb > 9) { o.riders[i] = null; m.launch(m.dir * -120, -300); return true; } return true; }); });
    return true;
  }
  function useSlide(m, o) { if (o.busy) return false; return climbDeck(m, o); }
  function climbDeck(m, o) { m.goTo(o.deck.l - 8, () => { m.wall = { el: o.deck.el, cw: 1 }; m.cp = 0; m.set("climb"); }, true); return true; }
  function startSlide(m, o) {
    o.busy = true; let u = 0;
    m.goTo(o.deck.r - 9, () => { ext(m, "slide", dt => { u += dt / 1.1; const e = ease(Math.min(u, 1)), p = o.B(e), p2 = o.B(Math.min(1, e + .04)); m.x = p[0]; m.y = p[1] + 7; m.dir = 1; m.rot = Math.atan2(p2[1] - p[1], p2[0] - p[0]) * .8;
      if (u >= 1) { o.busy = false; m.launch(210, -140); m.flip = rnd(5, 9) * (Math.random() < .5 ? 1 : -1); m.speak(pick(["Juhuuu!", "Nochmal!"]), 1.3); } return true; }); });
    return true;
  }
  function useTramp(m, o) { m.goTo(o.pl.l - 9, () => m.leapTo(o.pl, o.x + rnd(-20, 20))); return true; }
  function useSnow(m, o) {
    if (o.work >= 18) return false; const side = m.x < o.x ? -1 : 1; let t = 0; const T_ = rnd(5, 8), x0 = o.x + side * 58;
    m.goTo(x0, () => { m.dir = -side; ext(m, "push", dt => { t += dt; m.ph += dt * 5; m.x = x0 + Math.sin(t * 2.5) * 8; o.work = Math.min(18, o.work + dt); m.ballR = 4 + Math.min(10, (t / T_) * 10); if (Math.random() < dt * 4) burst(m.x + m.dir * 18, G0 - 3, 1, ["#fff"], { v1: 40, g: 200 }); if (t > T_) { m.ballR = 0; if (Math.random() < .5) m.speak(pick(["Schnee!", "Wird groß!", "Pack mit an!"]), 1.3); return false; } return true; }); });
    return true;
  }
  function useFire(m, o) {
    const free = o.seats.filter(s => !s.m); if (!free.length) return false; const s = pick(free); s.m = m; m.seat = s; let t = 0; const T_ = rnd(9, 15);
    m.goTo(s.x, () => { m.dir = s.x < o.x ? 1 : -1; ext(m, "warm", dt => { t += dt; m.seat = s; if (t > 2 && Math.random() < dt * .22) m.speak(pick(["Wärmt gut!", "Gemütlich ...", "Erzähl was!", "Marshmallows!"]), 1.8); return t < T_; }); });
    return true;
  }
  function useTree(m, o) {
    if (Math.random() < .45) { const p = pick(o.presents); if (p.open > 0) return false; m.goTo(o.x + p.dx + (m.x < o.x + p.dx ? -22 : 22), () => { m.dir = m.x < o.x + p.dx ? 1 : -1; let t = 0, did = 0; ext(m, "cheer", dt => { t += dt; if (t > 1.1 && !did) { did = 1; p.open = 2.4; const px = o.x + p.dx; confetti(px, G0 - p.h - 10, 26); popEmoji(px, G0 - p.h - 24, pick(["🧸", "🎮", "⚽", "🚂", "🎨", "🎧", "🍪"])); m.speak("Ein Geschenk!", 1.6); } return t < 2.2; }); }); return true; }
    if (o.baub >= 18) return false; const side = m.x < o.x ? -1 : 1;
    m.goTo(o.x + side * (46 + rnd(0, 20)), () => { m.dir = -side; let t = 0, did = 0; ext(m, "cheer", dt => { t += dt; if (t > 2.2 && !did) { did = 1; const s = o.slots[o.baub]; o.baub++; sparkle(o.x + s[0], G0 - 26 + s[1]); o.flash = .8; if (o.baub >= 8) o.lit = true; if (o.baub === 8) { m.speak("Das Licht geht an!", 1.8); confetti(o.x, G0 - 120, 20); } } return t < 2.9; }); });
    return true;
  }
  function useHouse(m, o) {
    m.goTo(o.door, () => { if (!onFloor(m)) return m.idle(); let t = 0; const T_ = rnd(3.5, 7.5); o.knock = .6; ext(m, "stand", dt => { if (t === 0) { m.hidden = true; o.occ++; } t += dt; m.x = o.door;
      if (t > T_) { o.occ--; m.hidden = false; o.knock = .8; m.speak(pick(["Wieder da!", "Lecker drinnen!", "Hallo!"]), 1.5); return false; } return true; }); });
    return true;
  }
  function useRink(m, o) {
    m.goTo(o.l + 8, () => { let t = 0, sp = 0, dirv = 1; const T_ = rnd(6, 9); ext(m, "skate", dt => { t += dt; m.y = G0 - 2; m.x += dirv * 125 * dt; m.dir = dirv; m.ph += dt * 4.5; if (m.x > o.r - 6) { m.x = o.r - 6; dirv = -1; } if (m.x < o.l + 6) { m.x = o.l + 6; dirv = 1; }
      sp += dt; if (sp > 2.6) { sp = 0; m.spinT = .8; } if (m.spinT > 0) { m.spinT -= dt; m.sx = Math.cos((1 - m.spinT / .8) * 6.283 * 2); } else m.sx = 1;
      if (t > T_) { m.sx = 1; if (Math.random() < .3) { m.toLimp(dirv * 190, -120); m.speak("Hoppla!", 1.6); return true; } return false; } return true; });
    });
    return true;
  }
  function useObject(m) {
    const opts = [];
    objs.forEach(o => {
      if (o.type === "swing" && !o.rider) opts.push(() => m.goTo(o.x, () => rideSwing(m, o)) || true);
      if (o.type === "seesaw" && !(o.riders[0] && o.riders[1])) opts.push(() => joinSeesaw(m, o));
      if (o.type === "slide" && !o.busy) { opts.push(() => useSlide(m, o)); }
      if (o.type === "tramp") opts.push(() => useTramp(m, o));
      if (o.type === "snowman" && o.work < 18) { opts.push(() => useSnow(m, o)); opts.push(() => useSnow(m, o)); }
      if (o.type === "fire" && o.seats.some(s => !s.m)) opts.push(() => useFire(m, o));
      if (o.type === "tree") { opts.push(() => useTree(m, o)); }
      if (o.type === "house") opts.push(() => useHouse(m, o));
      if (o.type === "rink") opts.push(() => useRink(m, o));
    });
    while (opts.length) { const i = (Math.random() * opts.length) | 0, f = opts.splice(i, 1)[0]; if (f()) return true; }
    return false;
  }

  // ---------- Spielmodi ----------
  function modeDecide(m, P) {
    if (!P.floor) return false;
    if (mode.name === "war") {
      const tx = m.team === 0 ? rnd(.1, .3) * W : rnd(.7, .9) * W;
      if (Math.abs(m.x - tx) > 90 && Math.random() < .6) { m.goTo(tx, () => m.idle()); return true; }
      const foes = men.filter(q => q.team !== undefined && q.team !== m.team && q.state !== "limp" && !q.hidden);
      const act = foes.length && Math.random() < .72 ? "throw" : "crouch"; let fired = false;
      if (act === "throw") { const f = pick(foes); m.dir = f.x < m.x ? -1 : 1; ext(m, "throw", dt => { if (m.t > .38 && !fired) { fired = true; m.aim = [f.x, f.y - 30]; m.fire(); } return m.t < .75; }); }
      else { const cd = rnd(.8, 1.5) + .4; ext(m, "crouch", () => m.t < cd); }
      return true;
    }
    if (mode.name === "tag") {
      if (!tagIt || !men.includes(tagIt)) tagIt = pick(men);
      if (m === tagIt) { const o = men.filter(q => q !== m && onFloor(q) && !q.hidden && q.state !== "limp"); if (!o.length) return false; const q = o.reduce((a, b) => Math.abs(a.x - m.x) < Math.abs(b.x - m.x) ? a : b); const dirv = q.x < m.x ? -1 : 1; ext(m, "push", dt => { m.dir = dirv; m.ph += dt * 5.5; m.x = clamp(m.x + dirv * 135 * dt, 24, W - 24); return m.t < .5; }); return true; }
      const dirv = tagIt.x < m.x ? 1 : -1; ext(m, "push", dt => { let d = dirv; if ((m.x < 40 && d < 0) || (m.x > W - 40 && d > 0)) d = -d; m.dir = d; m.ph += dt * 5.5; m.x = clamp(m.x + d * 118 * dt, 24, W - 24); return m.t < .55; }); return true;
    }
    if (mode.name === "party") {
      const tr = byType("tree")[0], cx = (tr ? tr.x : W / 2) + rnd(-190, 190);
      m.goTo(clamp(cx, 30, W - 30), () => { m.set("dance"); m.timer = rnd(3, 6); if (Math.random() < .3) m.speak(pick(["Party!", "Tanzt mit!", "Yeah!"]), 1.4); }); return true;
    }
    return false;
  }
  function endMode() { men.forEach(m => { m.team = undefined; }); mode = null; tagIt = null; storm = 0; windTarget = 0; syncBar(); }
  function startMode(name, dur) {
    if (mode && mode.name === name) { endMode(); return; }
    endMode(); mode = { name, t: dur };
    if (name === "war") { men.forEach((m, i) => { m.team = i % 2; if (m.state === "ext") m.endExt(); }); }
    if (name === "tag") { tagIt = pick(men); tagCd = 1; }
    if (name === "storm") { storm = 1; windTarget = rnd(0, 1) < .5 ? 3.2 : -3.2; setTimeout(() => { storm = 0; windTarget = 0; if (mode && mode.name === "storm") endMode(); }, dur * 1000); }
    if (name === "fire") { rockets = []; }
    syncBar();
  }
  function decide(m, P) {
    if (m.hidden || !isOpen) return false;
    if (mode && mode.name !== "storm" && mode.name !== "fire" && modeDecide(m, P)) return true;
    const sl = byType("slide")[0]; if (sl && P.el === sl.deck.el && !sl.busy && Math.random() < .9) return startSlide(m, sl);
    const r = Math.random();
    if (r < .3 && social(m)) return true;
    if (r < .74 && P.floor && useObject(m)) return true;
    return false;
  }

  // ---------- Schritt und Zeichnen ----------
  function step(dt) {
    T += dt; wind += (windTarget - wind) * Math.min(1, dt * .8);
    objs.forEach(o => o.step && o.step(dt));
    if (mode) {
      mode.t -= dt; if (mode.t <= 0) endMode();
      else if (mode.name === "tag" && tagIt) { tagCd -= dt; if (tagCd <= 0) for (const q of men) if (q !== tagIt && onFloor(q) && !q.hidden && q.state !== "limp" && Math.abs(q.x - tagIt.x) < 22) { tagIt = q; tagCd = 1.4; q.speak("Ich bin dran!", 1.2); sparkle(q.x, q.y - 40); break; } }
      else if (mode && mode.name === "fire") {
        if (Math.random() < dt * 2.6) { const col = [["#ff4d6d", "#ffd23f"], ["#3da5ff", "#fff"], ["#00e5a8", "#ffd23f"], ["#c77dff", "#ff4d6d"]][(Math.random() * 4) | 0]; rockets.push({ x: rnd(.08, .92) * W, y: G0, vy: -rnd(540, 760), fuse: rnd(.9, 1.5), t: 0, col }); }
        hopT -= dt; if (hopT <= 0) { hopT = rnd(.6, 1.3); const c = men.filter(q => onFloor(q) && !q.hidden && (q.state === "idle" || q.state === "walk")); if (c.length) { const q = pick(c); q.launch(0, -480); q.speak(pick(["Oooh!", "Wow!", "Schön!"]), 1.1); } }
      } else if (mode.name === "party") { if (Math.random() < dt * 14) fx.push({ x: rnd(0, W), y: -10, vx: rnd(-30, 30), vy: rnd(50, 120), g: 40, life: 5, t: 0, r: 4, c: pick(["#ff4d6d", "#ffd23f", "#00e5a8", "#3da5ff", "#c77dff"]), k: "sq" }); }
    }
    for (let i = rockets.length - 1; i >= 0; i--) { const r = rockets[i]; r.t += dt; r.y += r.vy * dt; if (Math.random() < .6) fx.push({ x: r.x, y: r.y, vx: rnd(-10, 10), vy: 30, g: 60, life: .5, t: 0, r: 1.8, c: "#ffe3a0", k: "c" });
      if (r.t > r.fuse) { rockets.splice(i, 1); burst(r.x, r.y, 56, r.col, { v0: 90, v1: 250, g: 140, life: 1.5, r: 3 }); burst(r.x, r.y, 20, ["#fff"], { v0: 40, v1: 120, g: 80, life: 1.8, r: 2 }); } }
    for (let i = fx.length - 1; i >= 0; i--) { const p = fx[i]; p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt + wind * 12 * dt; p.y += p.vy * dt; if (p.t > p.life) fx.splice(i, 1); }
    if (fx.length > 700) fx.splice(0, fx.length - 700);
    const n = storm ? 460 : 150; flakes.forEach((f, i) => { if (i >= n) return; f.y += f.vy * (storm ? 1.9 : 1) * dt; f.x += (wind * 55 + Math.sin(T * .8 + f.p) * 10) * dt; if (f.y > H + 6) { f.y = -6; f.x = Math.random() * W; } if (f.x > W + 10) f.x = -10; if (f.x < -10) f.x = W + 10; });
  }
  function drawBack() {
    const sky = ctx.createLinearGradient(0, 0, 0, G0); sky.addColorStop(0, "#050a22"); sky.addColorStop(.55, "#14246a"); sky.addColorStop(1, "#3b4f9c"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    stars.forEach(s => { ctx.globalAlpha = .5 + .5 * Math.sin(T * 1.5 + s.p); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
    const mg = ctx.createRadialGradient(W * .82, 110, 10, W * .82, 110, 150); mg.addColorStop(0, "rgba(255,244,214,.55)"); mg.addColorStop(1, "rgba(255,244,214,0)"); ctx.fillStyle = mg; ctx.fillRect(W * .82 - 160, -50, 320, 320); ctx.fillStyle = "#fff4d6"; ctx.beginPath(); ctx.arc(W * .82, 110, 40, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(200,180,140,.35)"; ctx.beginPath(); ctx.arc(W * .82 - 12, 100, 8, 0, 7); ctx.arc(W * .82 + 14, 124, 6, 0, 7); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = "lighter"; [["#00ffa8", 0], ["#4aa8ff", 1.7], ["#b06bff", 3.2]].forEach(([c, ph], k) => { ctx.beginPath(); ctx.moveTo(0, 190 + k * 20); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 150 + k * 26 + Math.sin(x * .006 + T * .5 + ph) * 38 + Math.sin(x * .013 - T * .35) * 12); ctx.lineTo(W, 330 + k * 20); ctx.lineTo(0, 330 + k * 20); ctx.closePath(); const g = ctx.createLinearGradient(0, 140, 0, 340); g.addColorStop(0, c); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.globalAlpha = .1 + .05 * Math.sin(T * .7 + k); ctx.fillStyle = g; ctx.fill(); }); ctx.restore(); ctx.globalAlpha = 1;
    // Huegel und Tannen
    [[0, "#1f2f6e", 90, .004, 20], [1, "#2c4287", 60, .0065, 55]].forEach(([k, col, amp, fr, off]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, G0 - off - amp + Math.sin(x * fr + k * 2) * amp * .5); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      pines.filter(p => p.l === k).forEach(p => { const by = G0 - off - amp + Math.sin(p.x * fr + k * 2) * amp * .5 + 8; ctx.fillStyle = k ? "#183057" : "#12214f"; ctx.beginPath(); ctx.moveTo(p.x - 14 * p.s, by); ctx.lineTo(p.x, by - p.h * p.s); ctx.lineTo(p.x + 14 * p.s, by); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.moveTo(p.x - 6 * p.s, by - p.h * .6 * p.s); ctx.lineTo(p.x, by - p.h * p.s); ctx.lineTo(p.x + 6 * p.s, by - p.h * .6 * p.s); ctx.fill(); }); });
    const gg = ctx.createLinearGradient(0, G0, 0, H); gg.addColorStop(0, "#f2f7ff"); gg.addColorStop(1, "#aec3ea"); ctx.fillStyle = gg; ctx.fillRect(0, G0, W, H - G0);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, G0); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, G0 - 3 + Math.sin(x * .02) * 2); ctx.lineTo(W, G0 + 8); ctx.lineTo(0, G0 + 8); ctx.fill();
    if (party()) { ctx.save(); ctx.globalCompositeOperation = "lighter"; for (let k = 0; k < 5; k++) { const bx = (k / 4) * W, a = Math.sin(T * 1.3 + k) * .5 + (k - 2) * .15; const g = ctx.createLinearGradient(bx, 0, bx + Math.sin(a) * 600, G0); const c = ["255,77,109", "255,210,63", "0,229,168", "61,165,255", "199,125,255"][k]; g.addColorStop(0, `rgba(${c},.28)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - 14, 0); ctx.lineTo(bx + 14, 0); ctx.lineTo(bx + Math.sin(a) * 700 + 80, G0); ctx.lineTo(bx + Math.sin(a) * 700 - 80, G0); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  }
  const party = () => mode && mode.name === "party";
  function drawFront() {
    objs.forEach(o => o.glow && o.glow());
    // Wettrenn-Ball beim Schneemann-Bau
    men.forEach(m => { if (m.state === "ext" && m.pp === "push" && m.ballR > 0) { ctx.fillStyle = "#fff"; ctx.strokeStyle = "#b9cdf5"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(m.x + m.dir * 20, G0 - m.ballR + 2, m.ballR, 0, 7); ctx.fill(); ctx.stroke(); } });
    fx.forEach(p => {
      const a = clamp(1 - p.t / p.life, 0, 1); ctx.globalAlpha = a;
      if (p.k === "txt") { ctx.font = `${p.r}px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = p.c; ctx.fillText(p.txt, p.x, p.y); }
      else if (p.k === "smoke") { ctx.fillStyle = p.c; ctx.globalAlpha = a * .45; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + p.t * 4.5, 0, 7); ctx.fill(); }
      else if (p.k === "sq") { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 7 + p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r * .5, p.r * 2, p.r); ctx.restore(); }
      else { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    }); ctx.globalAlpha = 1;
    if (mode && mode.name === "tag" && tagIt) { const y = tagIt.y - LEG - TOR - 38 + Math.sin(T * 8) * 3; ctx.fillStyle = "#ff3b3b"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tagIt.x - 8, y - 12); ctx.lineTo(tagIt.x + 8, y - 12); ctx.lineTo(tagIt.x, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    rockets.forEach(r => { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(r.x, r.y, 2.4, 0, 7); ctx.fill(); });
    const n = storm ? 460 : 150; ctx.fillStyle = "#fff"; for (let i = 0; i < n; i++) { const f = flakes[i]; ctx.globalAlpha = .55 + f.r * .15; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    if (storm) { ctx.fillStyle = "rgba(210,225,255,.1)"; ctx.fillRect(0, 0, W, H); }
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .45, W / 2, H / 2, Math.max(W, H) * .8); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,10,.4)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  // ---------- Bedienung ----------
  function hit(x, y) {
    for (const o of objs) {
      if (o.type === "tree" && Math.abs(x - o.x) < 80 && y > G0 - 215 && y < G0) { o.flash = 1; o.baub = Math.min(18, o.baub + 1); if (o.baub >= 8) o.lit = true; sparkle(x, y); return true; }
      if (o.type === "tree") for (const p of o.presents) if (Math.abs(x - (o.x + p.dx)) < p.w && y > G0 - p.h - 12 && y < G0 + 4 && p.open <= 0) { p.open = 2.4; confetti(o.x + p.dx, G0 - p.h - 8, 26); popEmoji(o.x + p.dx, G0 - p.h - 20, pick(["🧸", "🎮", "⚽", "🚂", "🎨", "🎧", "🍪"])); return true; }
      if (o.type === "house" && Math.abs(x - o.x) < o.w / 2 && y > o.roofTop && y < G0) { if (Math.abs(x - o.door) < 24 && y > G0 - 62) { o.knock = 1; const ins = men.find(m => m.hidden && m.state === "ext" && Math.abs(m.x - o.door) < 4); if (ins) ins.t = 999; } else o.lit = o.lit > 0 ? 0 : 1; sparkle(x, y); return true; }
      if (o.type === "fire" && Math.abs(x - o.x) < 40 && y > G0 - 70 && y < G0) { burst(o.x, G0 - 30, 26, ["#ffd23f", "#ff9a3c", "#fff"], { up: true, v0: 80, v1: 260, g: 260 }); return true; }
      if (o.type === "snowman" && Math.abs(x - o.x) < 36 && y > G0 - 90 && y < G0) { burst(x, y, 14, ["#fff"], { v1: 120, g: 300 }); return true; }
    }
    return false;
  }
  function onDown(e) {
    if (e.target.closest(".pgbar")) return;
    const x = e.clientX / S, y = e.clientY / S; if (hit(x, y)) return;
    const c = men.filter(m => m.state !== "limp" && !m.hidden && m.state !== "ext" && onFloor(m)); if (!c.length) return;
    const m = c.reduce((a, b) => Math.abs(a.x - x) < Math.abs(b.x - x) ? a : b); m.dir = x < m.x ? -1 : 1; let fired = false;
    ext(m, "throw", dt => { if (m.t > .38 && !fired) { fired = true; m.aim = [x, y]; m.fire(); } return m.t < .75; }); burst(x, y, 6, ["#fff"], { v1: 60, g: 100 });
  }
  const BTN = [["add", "➕ Figur"], ["war", "❄️ Schneeballschlacht"], ["tag", "🏃 Fangen"], ["fire", "🎆 Feuerwerk"], ["party", "🎉 Party"], ["storm", "🌨️ Schneesturm"]];
  function syncBar() { if (!ov) return; ov.querySelectorAll("[data-pg-act]").forEach(b => { const k = b.dataset.pgAct; b.classList.toggle("on", !!mode && mode.name === k); }); const c = ov.querySelector("[data-pg-act=add] i"); if (c) c.textContent = men.length; }
  function scatter(inPg) {
    men.forEach((m, i) => { m.nodes = null; m.ext = null; m.hidden = false; m.pp = null; m.rot = 0; m.sx = 1; m.team = undefined; m.pairS = null; m.seat = null; m.seesaw = null; m.then = null; m.x = rnd(60, Math.max(120, (inPg ? W : innerWidth) - 60)); m.y = -70 - i * 60; m.vy = 0; m.vx = 0; m.held = false; m.launch(0, 0); });
  }
  function open() {
    if (isOpen) return; isOpen = true;
    ov = document.createElement("div"); ov.id = "xm-pg"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Moki Spielplatz");
    ov.innerHTML = `<canvas></canvas><div class="pgbar"><button type="button" class="pgback" data-pg-act="close">← Zurück</button><b class="pgtitle">Moki Spielplatz</b><div class="pgbtns">${BTN.map(([k, t]) => `<button type="button" data-pg-act="${k}">${t}${k === "add" ? " <i>" + men.length + "</i>" : ""}</button>`).join("")}</div></div><div class="pghint">Packe die Männchen mit der Maus und wirf sie. Klicke auf Geschenke, Baum, Haus oder Boden.</div>`;
    document.body.appendChild(ov); cv = ov.querySelector("canvas"); ctx = cv.getContext("2d"); root.classList.add("pg-on");
    layout(); MODE.ctx = ctx; MODE.plats = () => objs.flatMap(o => o.plats); MODE.begin = dt => { step(dt); ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0); drawBack(); objs.forEach(o => o.draw()); }; MODE.end = () => drawFront(); MODE.decide = decide;
    scatter(true); MODE.on = true; syncBar();
    ov.addEventListener("pointerdown", onDown); ov.addEventListener("click", e => { const b = e.target.closest("[data-pg-act]"); if (!b) return; const k = b.dataset.pgAct; if (k === "close") close(); else if (k === "add") { if (men.length < 12) { const m = A.add(); m.x = rnd(60, W - 60); m.y = -50; m.set("air"); } syncBar(); } else if (k === "fire") startMode("fire", 12); else if (k === "war") startMode("war", 30); else if (k === "tag") startMode("tag", 35); else if (k === "party") startMode("party", 25); else if (k === "storm") startMode("storm", 20); });
    addEventListener("resize", onResize); addEventListener("keydown", onKey);
  }
  function close() {
    if (!isOpen) return; isOpen = false; endMode(); storm = 0; windTarget = 0; MODE.on = false; removeEventListener("resize", onResize); removeEventListener("keydown", onKey);
    ov.remove(); ov = null; root.classList.remove("pg-on"); fx = []; rockets = []; scatter(false);
  }
  const onKey = e => { if (e.key === "Escape") close(); };
  let rz = 0; function onResize() { clearTimeout(rz); rz = setTimeout(() => { if (!isOpen) return; layout(); MODE.ctx = ctx; scatter(true); }, 150); }
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2); S = clamp(Math.min(innerWidth / 1500, innerHeight / 640), .5, 1.35); W = innerWidth / S; H = innerHeight / S; G0 = H - 80;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; MODE.s = S; MODE.W = W; MODE.H = H; MODE.ground = G0; build();
  }

  // ---------- Knopf neben "Tester werden" ----------
  function ensureBtn() {
    let f = document.getElementById("tfoot");
    if (!f) { f = document.createElement("footer"); f.id = "tfoot"; const lay = document.querySelector(".layout"); (lay || document.body).after(f); f.innerHTML = '<div class="tf-in"></div>'; }
    const row = f.querySelector(".tf-in") || f; if (row && !row.querySelector("[data-pg-open]")) { const b = document.createElement("button"); b.type = "button"; b.className = "tf-btn pg-open"; b.setAttribute("data-pg-open", ""); b.textContent = "🎄 Spielplatz der Strichmännchen"; row.appendChild(b); }
  }
  setInterval(ensureBtn, 700); ensureBtn();
  document.addEventListener("click", e => { if (e.target.closest && e.target.closest("[data-pg-open]")) { e.preventDefault(); open(); } });
  window.MOKI_PG = { open, close, get objs() { return objs; }, startMode, get W() { return W; }, get G0() { return G0; }, use: { useObject, useSlide, social, rideSwing, joinSeesaw, startSlide, climbDeck, useTramp, useSnow, useFire, useTree, useHouse, useRink, pair } };
})();
