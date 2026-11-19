// Moki Weihnachten: Einleitung (ca. 35 Sekunden, einmal pro Browser, nicht ueberspringbar).
// Nacht und Schnee, das Logo wird gezeichnet und bekommt eine Zipfelmuetze, "Frohe Weihnachten", ein Tannenbaum baut sich auf,
// die 24 Adventsspiele haengen als schwingende Kugeln daran. Wird nur in moki_weinachten.html eingebettet (nach advent.js).
// Testen: ?intro (erzwingt), ?intro-test (Zeit steht still, window.__MOKI_MI.render(t) zeichnet Sekunde t).
(function () {
  "use strict";
  const root = document.documentElement;
  if (!root.classList.contains("mi-on")) return;
  const KEY = "moki-xmas-intro-v1";
  const TEST = /[?&]intro-test/.test(location.search);
  const markSeen = () => {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    try { document.cookie = KEY + "=1; max-age=31536000; path=/; SameSite=Lax"; } catch (e) {}
    try { if (/[?&]intro/.test(location.search)) history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches && !TEST) { markSeen(); root.classList.remove("mi-on"); return; }
  const API = window.MOKI_XMAS_API;
  const games = (window.MOKI_GAMES || []).filter(g => g.image);
  if (!API || !games.length) { markSeen(); root.classList.remove("mi-on"); return; }
  const ADV = API.DAYS.map((d, i) => ({ day: i + 1, g: d.g ? API.findGame(d.g) : null, o: d.o }));

  // ---------- Hilfen ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eo = t => 1 - Math.pow(1 - clamp(t), 3);
  const eo4 = t => 1 - Math.pow(1 - clamp(t), 4);
  const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const back = t => { t = clamp(t); const s = 2.2; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
  const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const MINT = "#00e5a8", GOLD = "#ffd23f", PINK = "#ff4d8d", BLUE = "#3da5ff", VIO = "#8b5cf6";
  const GOLDW = "#f6c667", REDW = "#d93a49", PINEW = "#1f8a5b";
  const FONT = '"Inter","Segoe UI",system-ui,sans-serif';

  // ---------- Aufbau der Ebene ----------
  const mi = document.createElement("div");
  mi.id = "mi"; mi.setAttribute("role", "dialog"); mi.setAttribute("aria-modal", "true"); mi.setAttribute("aria-label", "Moki Weihnachten, Einleitung");
  mi.innerHTML = '<canvas aria-hidden="true"></canvas><p class="mi-sr">Frohe Weihnachten. Der Moki-Adventskalender wird vorgestellt. Das dauert etwa eine halbe Minute.</p>';
  document.body.prepend(mi);
  const cv = mi.querySelector("canvas"), ctx = cv.getContext("2d");
  const blocked = [...document.body.children].filter(el => el !== mi && el.tagName !== "SCRIPT" && el.tagName !== "STYLE");
  blocked.forEach(el => { try { el.inert = true; } catch (e) {} });
  const stopKeys = e => { e.preventDefault(); e.stopPropagation(); };
  addEventListener("keydown", stopKeys, true);
  mi.addEventListener("contextmenu", e => e.preventDefault());
  let W = 0, H = 0, dpr = 1, GL = null;
  function resize() { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  resize(); addEventListener("resize", resize);
  const IMG = new Map();
  const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

  // ---------- Logo: wird mit einem leuchtenden Stift in einem Zug gezeichnet ----------
  // Pfade im Koordinatensystem des Logos (viewBox -14 -20 392 170). Reihenfolge und Zeiten: m, o (mit Dreieck), k, i, Punkt.
  const SEGS = [
    { d: "M12 120V70C12 52 22 44 38 44S64 52 64 70V120", t0: 0, t1: .55 },
    { d: "M64 70C64 52 74 44 90 44S116 52 116 70V120", t0: .45, t1: 1.0 },
    { d: "M154 82A38 38 0 0 1 230 82A38 38 0 0 1 154 82", t0: .92, t1: 1.6 },
    { d: "M268 12V120V90L304 48L286 70L310 120", t0: 1.5, t1: 2.5 },   // das K: ein einziger durchgehender Strich (ganzer Stamm, Arm bis zur Spitze, zurueck, Bein)
    { d: "M350 44V120", t0: 2.45, t1: 2.75 }
  ];
  const svgNS = "http://www.w3.org/2000/svg", msvg = document.createElementNS(svgNS, "svg");
  msvg.setAttribute("aria-hidden", "true"); msvg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  mi.appendChild(msvg);
  SEGS.forEach(sg => { const el = document.createElementNS(svgNS, "path"); el.setAttribute("d", sg.d); msvg.appendChild(el); sg.el = el; sg.len = el.getTotalLength(); sg.p2d = new Path2D(sg.d); });
  const LS = (cx, cy, w) => { const sc = w / 392; return p => [cx + (p[0] - 182) * sc, cy + (p[1] - 65) * sc]; };
  // Stiftspitze zur Logo-Zeit tl (Bildschirmkoordinaten) oder null
  function headAt(tl, map) {
    let act = null;
    for (const sg of SEGS) { const p = (tl - sg.t0) / (sg.t1 - sg.t0); if (p > 0 && p < 1) act = { sg, p }; }
    if (!act) return null;
    const pt = act.sg.el.getPointAtLength(act.sg.len * eio(act.p)); return map([pt.x, pt.y]);
  }
  const lc = document.createElement("canvas"), lx = lc.getContext("2d");
  function drawLogo(cx, cy, w, tl) {
    if (tl <= 0) return;
    const sc = w / 392, map = LS(cx, cy, w), pad = 50, cw = Math.ceil((w + pad * 2) * dpr), ch = Math.ceil((170 * sc + pad * 2) * dpr);
    if (lc.width !== cw || lc.height !== ch) { lc.width = cw; lc.height = ch; }
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, cw, ch);
    lx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * (pad + 14 * sc), dpr * (pad + 20 * sc));
    const gr = lx.createLinearGradient(0, 0, 362, 0); gr.addColorStop(0, MINT); gr.addColorStop(1, GOLD);
    lx.strokeStyle = gr; lx.fillStyle = gr; lx.lineWidth = 24; lx.lineCap = "round"; lx.lineJoin = "round";
    SEGS.forEach(sg => { const p = eio((tl - sg.t0) / (sg.t1 - sg.t0)); if (p <= 0.002) return; lx.setLineDash([sg.len + 2, sg.len + 2]); lx.lineDashOffset = (sg.len + 2) * (1 - p); lx.stroke(sg.p2d); });
    lx.setLineDash([]);
    if (tl > 2.75) { const k = back((tl - 2.75) / .38); lx.save(); lx.translate(350, 6 - (1 - clamp((tl - 2.75) / .38)) * 40); lx.scale(k, k); lx.beginPath(); lx.arc(0, 0, 14, 0, 7); lx.fill(); lx.restore(); }
    if (tl > 1.62) { const k = back((tl - 1.62) / .4); lx.save(); lx.translate(195, 82); lx.scale(k, k); lx.translate(-195, -82); lx.fillStyle = "#fff"; lx.strokeStyle = "#fff"; lx.lineWidth = 7; lx.beginPath(); lx.moveTo(183, 66); lx.lineTo(207, 82); lx.lineTo(183, 98); lx.closePath(); lx.fill(); lx.stroke(); lx.restore(); }
    ctx.save(); ctx.shadowColor = MINT; ctx.shadowBlur = 26;
    ctx.drawImage(lc, cx - w / 2 - pad, cy - 85 * sc - pad, cw / dpr, ch / dpr);
    ctx.restore();
    // Funkenspur und leuchtende Stiftspitze
    const h = headAt(tl, map);
    if (h) {
      const gs = Math.max(.6, sc * 1.4);
      for (let j = 1; j <= 18; j++) {
        const hp = headAt(tl - j * .03, map); if (!hp) continue; const f = 1 - j / 18, a = rnd(j + Math.floor(tl * 20)) * 6.283;
        ctx.fillStyle = hexA(j % 2 ? MINT : GOLD, f * .9); ctx.beginPath(); ctx.arc(hp[0] + Math.cos(a) * j * 3 * gs, hp[1] + Math.sin(a) * j * 3 * gs, (1 + f * 4) * gs, 0, 7); ctx.fill();
      }
      const R = 46 * gs + 16, gl = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], R); gl.addColorStop(0, "rgba(255,255,255,.95)"); gl.addColorStop(.25, hexA(MINT, .6)); gl.addColorStop(1, "rgba(0,229,168,0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(h[0], h[1], R, 0, 7); ctx.fill();
    }
  }
  const logoW = () => Math.min(W * .62, 780);
  function fitText(s, x, y, maxW, size, col, a = 1, sc = 1, weight = 900, glow = true, outline = true) {
    if (a <= 0.003) return;
    ctx.save(); ctx.globalAlpha = clamp(a); ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const w = ctx.measureText(s).width; if (w > maxW) ctx.font = `${weight} ${size * maxW / w}px ${FONT}`;
    if (outline) { ctx.lineJoin = "round"; ctx.lineWidth = Math.max(4, size * .12); ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.strokeText(s, 0, 0); }
    if (glow) { ctx.shadowColor = col; ctx.shadowBlur = size * .3; }
    ctx.fillStyle = col; ctx.fillText(s, 0, 0); ctx.restore();
  }
  function bg(t, tint) {
    if (GL) return;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#05060f"); g.addColorStop(1, "#0b1238");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const k = Math.exp(-((t % .46875) / .46875) * 5);
    const r = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * .7);
    r.addColorStop(0, hexA(tint || MINT, .16 + .1 * k)); r.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  }
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  function sparks(t, a = 1, n = 70) {
    if (GL) return;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const sp = 14 + rnd(i + 3) * 60, x = rnd(i) * W, y = ((rnd(i + 9) * H - t * sp) % H + H) % H, r = 1 + rnd(i + 5) * 2.4;
      ctx.globalAlpha = clamp(a) * (.2 + .5 * (.5 + .5 * Math.sin(t * 3 + i)));
      ctx.fillStyle = [MINT, GOLD, "#fff", BLUE][i % 4]; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function rays(t, col, a, n = 22) {
    if (GL) return;
    if (a <= .003) return;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * .22);
    const len = Math.hypot(W, H);
    for (let i = 0; i < n; i++) {
      ctx.rotate(Math.PI * 2 / n); ctx.fillStyle = hexA(col, a * (.55 + .45 * Math.sin(t * 2 + i)));
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, -len * .03); ctx.lineTo(len, len * .03); ctx.fill();
    }
    ctx.restore();
  }
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  function flash(t, at, a = .7, d = .35) { const k = (t - at) / d; if (k < 0 || k > 1) return; ctx.save(); ctx.globalAlpha = a * (1 - k); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  function shock(t, at, x, y, col = "#fff", max = .8) {
    const k = (t - at) / 1.0; if (k < 0 || k > 1) return;
    ctx.save(); ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = col; ctx.lineWidth = 10 * (1 - k) + 1.5;
    ctx.beginPath(); ctx.arc(x, y, eo(k) * Math.max(W, H) * max, 0, 7); ctx.stroke(); ctx.restore();
  }

  // ---------- Zeitplan ----------
  const T_TITLE = 7, T_TREE = 13, T_BAUBLE = 17, T_FIN = T_BAUBLE + 24 * .42 + .2, DUR = 35;
  const T_PEN = 1.0, HIT = T_PEN + 3.15;   // der Punkt vom i landet bei HIT, danach faellt die Muetze

  // ---------- Nachthimmel, Sterne, Mond, Huegel, Schnee ----------
  function sky(t, glow) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#030716"); g.addColorStop(.55, "#0a1538"); g.addColorStop(1, "#17306a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 110; i++) { const x = rnd(i) * W, y = rnd(i + 5) * H * .7, tw = .35 + .65 * (.5 + .5 * Math.sin(t * (1 + rnd(i + 9) * 2) + i)); ctx.globalAlpha = tw * (.3 + .7 * rnd(i + 2)); ctx.fillStyle = i % 9 ? "#fff" : "#ffe9a8"; ctx.beginPath(); ctx.arc(x, y, .6 + rnd(i + 3) * 1.4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // Mond
    const mx = W * .82, my = H * .16, mr = Math.min(W, H) * .055, mg = ctx.createRadialGradient(mx, my, mr * .5, mx, my, mr * 4); mg.addColorStop(0, "rgba(255,244,214,.35)"); mg.addColorStop(1, "rgba(255,244,214,0)");
    ctx.fillStyle = mg; ctx.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8); ctx.fillStyle = "#fff6dc"; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
    // verschneite Huegel
    for (const [yy, amp, col, snow, ph] of [[.80, .05, "#0d1f4a", "#c9defc", 0], [.88, .045, "#08142f", "#ffffff", 2]]) {
      ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 16) ctx.lineTo(x, H * yy + Math.sin(x / W * 5 + ph) * H * amp + Math.sin(x / W * 11 + ph * 2) * H * amp * .4); ctx.lineTo(W, H); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = snow; ctx.globalAlpha = .55; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (glow > 0) { const cx = W / 2, cy = H * .5, r = Math.max(W, H) * .6, gg = ctx.createRadialGradient(cx, cy, 20, cx, cy, r); gg.addColorStop(0, `rgba(246,198,103,${.28 * glow})`); gg.addColorStop(1, "rgba(246,198,103,0)"); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); }
  }
  function snow(t, n = 130) {
    ctx.fillStyle = "#fff";
    for (let i = 0; i < n; i++) { const r = .8 + rnd(i + 1) * 2.8, v = 22 + rnd(i + 3) * 50, x = (rnd(i) * W + Math.sin(t * .6 + i) * 22 + W) % W, y = (rnd(i + 7) * H + t * v * (.6 + r / 3.5)) % H; ctx.globalAlpha = .35 + rnd(i + 4) * .55; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function glitter(t, a) {
    if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
    for (let i = 0; i < 46; i++) { const x = (rnd(i + 20) * W + Math.sin(t * .8 + i) * 30 + W) % W, y = (rnd(i + 31) * H + t * (14 + rnd(i) * 26)) % H, tw = .5 + .5 * Math.sin(t * 5 + i * 2), r = 1.2 + rnd(i + 8) * 2; ctx.fillStyle = i % 3 ? "#ffd98a" : "#fff"; ctx.globalAlpha = a * tw; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function burst(t, at, x, y, n = 12, rad = 60, col = "#ffe3a0") {
    const k = (t - at) / .8; if (k < 0 || k > 1) return;
    ctx.save(); ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2.2;
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rnd(i) * .4, r0 = rad * eo(k) * .55, r1 = rad * eo(k); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke(); }
    ctx.restore();
  }
  // ---------- Zipfelmuetze (Mittelpunkt des unteren Randes bei x,y) ----------
  function drawHat(x, y, size, rot, a = 1) {
    const k = size / 40; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.translate(-20, -29);
    ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 8; ctx.fillStyle = REDW;
    ctx.beginPath(); ctx.moveTo(5, 28); ctx.bezierCurveTo(6, 14, 16, 5, 33, 7); ctx.bezierCurveTo(29, 12, 29, 20, 35, 28); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,138,148,.75)"; ctx.lineWidth = 1.6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(5, 28); ctx.bezierCurveTo(6, 14, 16, 5, 33, 7); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(2, 25, 36, 9, 4.5); ctx.fill(); ctx.beginPath(); ctx.arc(34, 7, 4.6, 0, 7); ctx.fill();
    ctx.restore();
  }
  function logoWithHat(cx, cy, w, tl, hatAge) {
    drawLogo(cx, cy, w, tl);
    if (hatAge < 0) return;
    const sc = w / 392, dot = LS(cx, cy, w)([350, 6]), k = clamp(hatAge / .9), size = 66 * sc;
    const ay = dot[1] - 9 * sc, bounce = k < 1 ? Math.abs(Math.sin(k * Math.PI * 2.5)) * (1 - k) * size * .9 : 0;
    drawHat(dot[0] + 2 * sc, ay - (H * .45) * (1 - eo4(k)) - bounce, size, lerp(.9, .28, eo(k)) + Math.sin(hatAge * 3) * .02 * k, clamp(hatAge / .15));
  }
  // ---------- Lichterkette ----------
  function garland(t, t0) {
    if (t < t0) return;
    const n = Math.max(12, Math.round(W / 46)), cols = ["#ff4d5e", "#ffd23f", "#3ddc84", "#4da6ff", "#ff8a3d"], seg = W / n;
    ctx.save(); ctx.strokeStyle = "#0a1030"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 8);
    for (let i = 0; i < n; i++) ctx.quadraticCurveTo((i + .5) * seg, 30, (i + 1) * seg, 8); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const cx = (i + .5) * seg, on = clamp((t - t0 - i * .045) / .15); if (on <= 0) continue; const tw = .65 + .35 * Math.sin(t * 3 + i * 1.7), c = cols[i % 5];
      ctx.fillStyle = "#1b2140"; ctx.fillRect(cx - 2.5, 18, 5, 6); ctx.save(); ctx.globalAlpha = on * tw; ctx.shadowColor = c; ctx.shadowBlur = 16; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, 30, 5.4, 7.4, 0, 0, 7); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  // ---------- Buchstabe fuer Buchstabe mit Fall und Federung ----------
  function dropText(t, s, cx, cy, size, t0, dt, grad) {
    ctx.save(); ctx.font = `900 ${size}px ${FONT}`; const ws = [...s].map(c => ctx.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0), fit = Math.min(1, W * .92 / tot); ctx.restore();
    let x = cx - tot * fit / 2;
    [...s].forEach((ch, i) => {
      const k = (t - (t0 + i * dt)) / .5, w = ws[i] * fit; if (k > 0) {
        const kk = clamp(k), yoff = -(1 - eo4(kk)) * size * 1.6, sc = back(kk);
        ctx.save(); ctx.globalAlpha = clamp(k * 3); ctx.translate(x + w / 2, cy + yoff); ctx.scale(sc * fit, sc * fit); ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.lineJoin = "round"; ctx.lineWidth = Math.max(4, size * .1); ctx.strokeStyle = "rgba(20,6,12,.75)"; ctx.strokeText(ch, 0, 0);
        const g = ctx.createLinearGradient(0, -size * .5, 0, size * .5); g.addColorStop(0, grad[0]); g.addColorStop(.5, grad[1]); g.addColorStop(1, grad[2]);
        ctx.shadowColor = grad[1]; ctx.shadowBlur = size * .3; ctx.fillStyle = g; ctx.fillText(ch, 0, 0); ctx.restore();
      }
      x += w;
    });
  }
  // ---------- Szene 1: Logo wird gezeichnet, die Muetze faellt ----------
  function sceneLogo(t) {
    sky(t, 0); snow(t, 100);
    const cx = W / 2, cy = H * .46, w = logoW(), tl = t - T_PEN, pu = t > HIT ? 1 + .03 * Math.exp(-(((t - HIT) % .46875) / .46875) * 5) : 1, hatAge = t - (HIT + .25);
    if (t < T_PEN + .2) {   // Lichtpunkt sammelt sich am Stiftanfang
      const start = LS(cx, cy, w)([12, 120]), pk = eo(t / 1.0), g = ctx.createRadialGradient(start[0], start[1], 0, start[0], start[1], 60);
      g.addColorStop(0, `rgba(255,255,255,${.9 * pk})`); g.addColorStop(.3, hexA(GOLDW, .55 * pk)); g.addColorStop(1, "rgba(246,198,103,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(start[0], start[1], 60, 0, 7); ctx.fill();
    }
    logoWithHat(cx, cy, w * pu, tl, hatAge);
    const dot = LS(cx, cy, w)([350, 6]); burst(t, HIT + .25 + .55, dot[0], dot[1] - 10, 14, 70 * (w / 392) + 30); shock(t, HIT, cx, cy, "#fff", .28); shock(t, HIT + .12, cx, cy, "#f6c667", .2); flash(t, HIT, .25, .4);
    if (t > 5.3) fitText("wünscht dir", W / 2, cy + w * .2 + Math.min(W * .045, 40) * 1.6, W * .9, Math.min(W * .045, 40), "#ffe3a0", eo((t - 5.3) / .6), 1, 600, false, false);
  }
  // ---------- Szene 2: Frohe Weihnachten ----------
  function sceneTitle(t) {
    const u = t - T_TITLE; sky(t, 0); snow(t, 140);
    const w0 = logoW(), k = eio(u / .9), cx = W / 2, cy = lerp(H * .46, H * .17, k), w = lerp(w0, w0 * .5, k);
    logoWithHat(cx, cy, w, 99, 99);
    const size = Math.min(W * .17, H * .15);
    dropText(t, "FROHE", W / 2, H * .4, size, T_TITLE + .9, .09, ["#ffffff", "#fff3d4", "#ffe29a"]);
    dropText(t, "WEIHNACHTEN", W / 2, H * .4 + size * 1.05, size * .74, T_TITLE + 1.5, .06, ["#fff1c2", "#f6c667", "#e0883e"]);
    if (u > 3.4) fitText("Der Moki-Adventskalender", W / 2, H * .4 + size * 1.95, W * .9, Math.min(W * .05, 46), "#ffe3a0", eo((u - 3.4) / .6), 1, 700, false);
    if (u > 1.4) glitter(t, clamp((u - 1.4) / 1.5) * .7);
    flash(t, T_TITLE + .9, .25, .3);
  }
  // ---------- Szene 3 und 4: der Baum mit den 24 Kugeln ----------
  const TIERS = [[[11, 78], [50, 38], [89, 78]], [[20, 54], [50, 20], [80, 54]], [[28, 34], [50, 6], [72, 34]]];
  function box() { const h = Math.min(H * .72, W * .9 * 4 / 3), w = h * .75; return { w, h, x0: (W - w) / 2, y0: Math.min(H * .19, H * .95 - h) }; }
  function star(x, y, R, rot, col, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? R * .42 : R, an = i / 10 * 6.283 - 1.5708; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function bauble(t, b, i) {
    const A = ADV[i], sl = API.SLOTS[i], ti = T_BAUBLE + i * .42, age = t - ti; if (age < 0) return null;
    const r = b.w * .043, px = b.x0 + b.w * sl.x / 100, py = b.y0 + b.h * sl.y / 100, L = r * 1.1;
    const k = clamp(age / .5), drop = -(1 - eo4(k)) * b.h * .5, sw = .5 * Math.exp(-2.1 * Math.max(age - .3, 0)) * Math.cos(8 * Math.max(age - .3, 0)), pop = age < .45 ? back(age / .4) : 1;
    ctx.save(); ctx.globalAlpha = clamp(age / .12); ctx.translate(px, py - L - r + drop); ctx.rotate(sw);
    ctx.strokeStyle = "#e7c36a"; ctx.lineWidth = Math.max(1.2, r * .06); ctx.beginPath(); ctx.moveTo(0, -L * .7); ctx.lineTo(0, 0); ctx.stroke();
    ctx.translate(0, L); ctx.scale(pop, pop);
    // Kappe
    ctx.fillStyle = "#e9c46a"; ctx.beginPath(); ctx.roundRect(-r * .3, -r * 1.22, r * .6, r * .4, r * .1); ctx.fill();
    // Kugel mit Spielbild
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = r * .5; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = "#c98a2b"; ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r * .94, 0, 7); ctx.clip();
    const BC = [["#ff7a86", "#b3202f"], ["#5fe0a0", "#12703f"], ["#6fa0ff", "#1f3f9e"], ["#ffe08a", "#c98a1b"]][i % 4];
    { const g = ctx.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r * 1.05); g.addColorStop(0, BC[0]); g.addColorStop(1, BC[1]); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
      ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = r * .2; ctx.font = `900 ${r * 1.3}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", 0, r * .06); ctx.shadowBlur = 0; }
    ctx.restore();
    ctx.lineWidth = r * .12; ctx.strokeStyle = "#f6c667"; ctx.beginPath(); ctx.arc(0, 0, r * .96, 0, 7); ctx.stroke();
    ctx.globalAlpha = .5; ctx.strokeStyle = "#fff"; ctx.lineWidth = r * .1; ctx.beginPath(); ctx.arc(0, 0, r * .72, 3.5, 4.5); ctx.stroke(); ctx.globalAlpha = 1;
    // Tuerchen-Nummer
    ctx.fillStyle = REDW; ctx.beginPath(); ctx.arc(r * .62, r * .62, r * .4, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = `900 ${r * .5}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(A.day), r * .62, r * .66);
    ctx.restore();
    burst(t, ti + .3, px, py, 9, r * 2.2);
    return { px, py, r };
  }
  function sceneTree(t) {
    const fin = t >= T_FIN ? eo((t - T_FIN) / 1.6) : 0;
    sky(t, fin); snow(t, 170);
    const b = box(), u = t - T_TREE, zoom = 1 + .05 * eio(clamp((t - T_TREE) / (DUR - T_TREE))), tcx = W / 2, tcy = b.y0 + b.h * .55;
    ctx.save(); ctx.translate(tcx, tcy); ctx.scale(zoom, zoom); ctx.translate(-tcx, -tcy);
    const X = p => b.x0 + b.w * p / 100, Y = p => b.y0 + b.h * p / 100;
    // Stamm
    const tk = eo(u / .6); ctx.fillStyle = "#6a3b1d"; ctx.beginPath(); ctx.roundRect(X(43), Y(78), b.w * .14, b.h * .15 * tk, 4); ctx.fill();
    // drei Etagen wachsen von unten nach oben
    const starts = [.5, 1.3, 2.1];
    TIERS.forEach((tr, i) => {
      const k = back((u - starts[i]) / 1.1); if (k <= 0) return; const baseY = Y(Math.max(tr[0][1], tr[2][1])), cx = X(50);
      ctx.save(); ctx.translate(cx, baseY); ctx.scale(clamp(k, 0, 1.12), clamp(k, 0, 1.12)); ctx.translate(-cx, -baseY);
      const g = ctx.createLinearGradient(0, Y(tr[1][1]), 0, baseY); g.addColorStop(0, "#38c083"); g.addColorStop(1, "#0d5236");
      ctx.beginPath(); tr.forEach((p, j) => j ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))); ctx.closePath();
      ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 16; ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
      ctx.lineJoin = "round"; ctx.lineWidth = Math.max(2, b.w * .012); ctx.strokeStyle = "#fff"; ctx.stroke();
      // Schneehaeubchen am unteren Rand
      ctx.fillStyle = "#fff"; for (let q = 0; q < 6; q++) { const f = (q + .5) / 6, x = X(tr[0][0]) + (X(tr[2][0]) - X(tr[0][0])) * f; ctx.beginPath(); ctx.ellipse(x, baseY - 1, b.w * .035, b.w * .018, 0, 0, 7); ctx.fill(); }
      ctx.restore();
    });
    // Lichter entlang der Etagen
    if (t > T_TREE + 3.4) TIERS.forEach((tr, i) => { for (let q = 0; q < 7; q++) { const f = (q + .5) / 7, y0 = Math.max(tr[0][1], tr[2][1]); const x = X(tr[0][0] + (tr[2][0] - tr[0][0]) * f), y = Y(y0 - 2.5 - Math.sin(f * 3.14) * 1.5), on = clamp((t - T_TREE - 3.4 - (i * 7 + q) * .04) / .2); if (on <= 0) return; const tw = .55 + .45 * Math.sin(t * 3 + i * 5 + q * 1.7), c = ["#ff4d5e", "#ffd23f", "#3ddc84", "#4da6ff"][(q + i) % 4]; ctx.save(); ctx.globalAlpha = on * tw; ctx.shadowColor = c; ctx.shadowBlur = 14; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, b.w * .011, 0, 7); ctx.fill(); ctx.restore(); } });
    // Stern
    const sk = back((t - (T_TREE + 3.4)) / .6); if (sk > 0) { const sx = X(50), sy = Y(5), R = b.w * .07 * sk; ctx.save(); ctx.shadowColor = "#ffd23f"; ctx.shadowBlur = 30; star(sx, sy, R, Math.sin(t * 1.3) * .08, "#ffd23f"); ctx.restore(); burst(t, T_TREE + 3.7, sx, sy, 14, b.w * .22); }
    // Kugeln
    let landed = 0; for (let i = 0; i < 24; i++) if (bauble(t, b, i)) landed++;
    ctx.restore();
    // Texte
    if (t < T_FIN) {
      if (t > T_TREE + .4) fitText("24 Türchen. 24 Überraschungen.", W / 2, H * .105, W * .9, Math.min(W * .06, 54), "#ffe3a0", eo((t - T_TREE - .4) / .6), 1, 800);
      if (landed > 0) fitText("Türchen " + landed + " von 24", W / 2, H * .955, W * .9, Math.min(W * .04, 32), "#fff", .9, 1, 700, false, false);
    } else {
      const u2 = t - T_FIN;
      fitText("24 Türchen warten auf dich", W / 2, H * .105, W * .92, Math.min(W * .062, 56), "#ffe3a0", eo(u2 / .6), 1 + (1 - eo4(u2 / .5)) * .5, 900);
      const td = API.today(), line = td === 0 ? "Ab dem 1. Dezember öffnet sich jeden Tag ein Türchen." : td < 24 ? "Heute ist Türchen " + td + " dran." : "Alle Türchen sind offen. Frohe Weihnachten!";
      if (u2 > 1.2) fitText(line, W / 2, H * .955, W * .92, Math.min(W * .042, 34), "#fff", eo((u2 - 1.2) / .6), 1, 700, false, false);
      glitter(t, .8 * fin);
    }
  }
  function render(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
    if (t < T_TITLE) sceneLogo(t); else if (t < T_TREE) sceneTitle(t); else sceneTree(t);
    garland(t, T_TITLE + .8);
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .8); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.5)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (t < .7) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .7})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- Ende und Start ----------
  let ended = false;
  function finish() {
    if (ended) return; ended = true;
    markSeen();
    try { if (window.mokiStat) window.mokiStat("intro", "done"); } catch (e) {}
    root.classList.add("site-in"); mi.classList.add("out");
    blocked.forEach(el => { try { el.inert = false; } catch (e) {} });
    removeEventListener("keydown", stopKeys, true);
    root.classList.remove("mi-on");
    setTimeout(() => { mi.remove(); root.classList.remove("site-in"); }, 1300);
  }
  async function start() {
    const list = [];
    await Promise.race([Promise.all(list.map(src => loadImg(src).then(i => { IMG.set(src, i); }))), new Promise(r => setTimeout(r, 6000))]);
    if (TEST) { window.__MOKI_MI = { render, DUR, T_TITLE, T_TREE, T_BAUBLE, T_FIN, finish }; render(0); return; }
    let t = 0, last = performance.now();
    const hard = setTimeout(finish, (DUR + 20) * 1000);
    (function frame(now) {
      t += Math.min((now - last) / 1000, .1); last = now;
      try { render(Math.min(t, DUR)); } catch (e) { clearTimeout(hard); finish(); return; }
      if (t < DUR) requestAnimationFrame(frame); else { clearTimeout(hard); finish(); }
    })(last);
  }
  start().catch(finish);
})();
