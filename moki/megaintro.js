// Moki Mega-Intro: Kino-Einleitung beim ersten Besuch nach dem Update. Laeuft live auf einem Canvas, ist nicht ueberspringbar
// und stellt alle Spiele nach Kategorien vor (ohne Gameplay). Danach blendet sie in die Seite ueber.
// Ablauf: Logo-Aufbau -> Titel -> Kategorien mit allen Spielen -> Spielewand mit Zaehler -> Logo.
// Testen: moki.html?intro (erzwingt die Einleitung). Mit ?intro-test steht die Zeit still, window.__MOKI_MI.render(t) zeichnet Sekunde t.
(function () {
  "use strict";
  const root = document.documentElement;
  if (!root.classList.contains("mi-on")) return;
  const KEY = "moki-intro-v3";
  const TEST = /[?&]intro-test/.test(location.search);
  const markSeen = () => {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    try { document.cookie = KEY + "=1; max-age=31536000; path=/; SameSite=Lax"; } catch (e) {}
    try { if (/[?&]intro/.test(location.search)) history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
  };
  // Wer Bewegung reduziert haben will, bekommt die Einleitung nicht (kein Zwang zu schnellen Animationen).
  if (matchMedia("(prefers-reduced-motion: reduce)").matches && !TEST) { markSeen(); root.classList.remove("mi-on"); return; }

  const games = (window.MOKI_GAMES || []).filter(g => g.image);
  if (!games.length) { markSeen(); root.classList.remove("mi-on"); return; }

  // ---------- Hilfen ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eo = t => 1 - Math.pow(1 - clamp(t), 3);
  const eo4 = t => 1 - Math.pow(1 - clamp(t), 4);
  const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const back = t => { t = clamp(t); const s = 2.2; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
  const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const MINT = "#00e5a8", GOLD = "#ffd23f", PINK = "#ff4d8d", BLUE = "#3da5ff", VIO = "#8b5cf6";
  const FONT = '"Inter","Segoe UI",system-ui,sans-serif';

  // ---------- Aufbau der Ebene ----------
  const mi = document.createElement("div");
  mi.id = "mi"; mi.setAttribute("role", "dialog"); mi.setAttribute("aria-modal", "true"); mi.setAttribute("aria-label", "Moki Mega-Update, Einleitung");
  mi.innerHTML = '<canvas aria-hidden="true"></canvas><p class="mi-sr">Das Mega-Update ist da. Moki stellt alle Spiele vor. Das dauert etwa eine Minute.</p>';
  document.body.prepend(mi);
  const cv = mi.querySelector("canvas"), ctx = cv.getContext("2d");
  const blocked = [...document.body.children].filter(el => el !== mi && el.tagName !== "SCRIPT" && el.tagName !== "STYLE");
  blocked.forEach(el => { try { el.inert = true; } catch (e) {} });
  const stopKeys = e => { e.preventDefault(); e.stopPropagation(); };
  addEventListener("keydown", stopKeys, true);
  mi.addEventListener("contextmenu", e => e.preventDefault());
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  resize(); addEventListener("resize", resize);

  // ---------- Bilder und Logo ----------
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

  // ---------- Kategorien (Reihenfolge: grosse zuletzt, damit es sich steigert) ----------
  const ORDER = ["Fahren", "Kampf & Schießen", "Sport", "Strategie", "Abenteuer", "Denken", "Simulation", "Geschicklichkeit"];
  const CATCOL = { "Fahren": [GOLD, "#ff7a3d"], "Kampf & Schießen": [PINK, VIO], "Sport": ["#ff7a3d", GOLD], "Strategie": [BLUE, VIO], "Abenteuer": [VIO, PINK], "Denken": [BLUE, MINT], "Simulation": [MINT, GOLD], "Geschicklichkeit": [MINT, BLUE] };
  const groups = new Map();
  games.forEach(g => { const c = g.category || "Weitere"; if (!groups.has(c)) groups.set(c, []); groups.get(c).push(g); });
  const cats = [...groups.keys()].sort((a, b) => { const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || groups.get(a).length - groups.get(b).length; });

  // ---------- Zeitplan ----------
  const T_TITLE = 5.2, T_INFO = 10.0, T_SHOW = T_INFO + 8.4;   // Logo, Titel, "Das ist neu", dann alle Spiele nach Kategorien
  const plan = []; let tt = T_SHOW, done = 0;
  cats.forEach(name => {
    const list = groups.get(name), step = list.length > 20 ? 0.11 : 0.15;
    const card = tt, tiles = card + 0.8, end = tiles + list.length * step + 0.4, exit = end + 0.3;
    plan.push({ name, list, step, card, tiles, end, exit, done0: done, col: CATCOL[name] || [MINT, GOLD] });
    done += list.length; tt = exit;
  });
  const T_GONE = tt, T_WALL = T_GONE + 7.0, DUR = T_WALL + 8.6;   // nach den Kategorien: die Spiele, die raus sind, dann die Wand

  // ---------- Zeichnen ----------
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
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#05060f"); g.addColorStop(1, "#0b1238");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const k = Math.exp(-((t % .46875) / .46875) * 5);
    const r = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * .7);
    r.addColorStop(0, hexA(tint || MINT, .16 + .1 * k)); r.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  }
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  function sparks(t, a = 1, n = 70) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const sp = 14 + rnd(i + 3) * 60, x = rnd(i) * W, y = ((rnd(i + 9) * H - t * sp) % H + H) % H, r = 1 + rnd(i + 5) * 2.4;
      ctx.globalAlpha = clamp(a) * (.2 + .5 * (.5 + .5 * Math.sin(t * 3 + i)));
      ctx.fillStyle = [MINT, GOLD, "#fff", BLUE][i % 4]; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function rays(t, col, a, n = 22) {
    if (a <= .003) return;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * .22);
    const len = Math.hypot(W, H);
    for (let i = 0; i < n; i++) {
      ctx.rotate(Math.PI * 2 / n); ctx.fillStyle = hexA(col, a * (.55 + .45 * Math.sin(t * 2 + i)));
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, -len * .03); ctx.lineTo(len, len * .03); ctx.fill();
    }
    ctx.restore();
  }
  function flash(t, at, a = .7, d = .35) { const k = (t - at) / d; if (k < 0 || k > 1) return; ctx.save(); ctx.globalAlpha = a * (1 - k); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  function shock(t, at, x, y, col = "#fff", max = .8) {
    const k = (t - at) / 1.0; if (k < 0 || k > 1) return;
    ctx.save(); ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = col; ctx.lineWidth = 10 * (1 - k) + 1.5;
    ctx.beginPath(); ctx.arc(x, y, eo(k) * Math.max(W, H) * max, 0, 7); ctx.stroke(); ctx.restore();
  }
  function tile(g, x, y, s, a = 1, rot = 0, sc = 1, h = s, shadow = true) {
    const im = IMG.get(g.image), m = Math.min(s, h);
    ctx.save(); ctx.globalAlpha = clamp(a); ctx.translate(x + s / 2, y + h / 2); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-s / 2, -h / 2);
    if (shadow) { ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = m * .14; ctx.shadowOffsetY = m * .05; }
    ctx.beginPath(); ctx.roundRect(0, 0, s, h, m * .2); ctx.clip();
    if (im) { const k = Math.max(s / im.width, h / im.height); ctx.drawImage(im, (s - im.width * k) / 2, (h - im.height * k) / 2, im.width * k, im.height * k); }
    else { const c = g.colors || ["#1d2566", "#0d1030"]; const gr = ctx.createLinearGradient(0, 0, s, h); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); ctx.fillStyle = gr; ctx.fillRect(0, 0, s, h); }
    ctx.restore();
  }
  function grid(n, aw, ah) {
    let best = null;
    for (let cols = 1; cols <= n; cols++) { const rows = Math.ceil(n / cols), s = Math.min(aw / cols, ah / rows); if (!best || s > best.s) best = { cols, rows, s }; }
    return best;
  }
  function tilePos(i, n, L, cx, cy) {
    const row = Math.floor(i / L.cols), inRow = row === L.rows - 1 ? n - row * L.cols : L.cols, col = i % L.cols;
    return [cx - inRow * L.s / 2 + col * L.s + L.s * .06, cy - L.rows * L.s / 2 + row * L.s + L.s * .06, L.s * .88];
  }

  // Szene 1: Logo-Aufbau (0 - 5.2): Partikel sammeln sich, ein leuchtender Stift zeichnet "moki" in einem Zug
  const T_PEN = 1.3;
  function sceneLogo(t) {
    bg(t); sparks(t, clamp(t / 1.2), 80);
    const cx = W / 2, cy = H / 2, w = logoW(), start = LS(cx, cy, w)([12, 120]), hit = T_PEN + 3.15;
    if (t < T_PEN + .2) {   // Partikel ziehen sich zum Startpunkt des Stifts zusammen
      for (let i = 0; i < 120; i++) {
        const a0 = rnd(i) * 6.283, d0 = Math.max(W, H) * (.3 + rnd(i + 1) * .5), s = clamp((t - .1 - rnd(i + 2) * .8) / 1.1); if (s <= 0) continue;
        const e = eio(s), d = d0 * (1 - e), a = a0 + e * 2.4;
        ctx.fillStyle = hexA(i % 2 ? MINT : GOLD, (1 - e * .8) * .9); ctx.beginPath(); ctx.arc(start[0] + Math.cos(a) * d, start[1] + Math.sin(a) * d, 1.5 + rnd(i + 3) * 3 * (1 - e), 0, 7); ctx.fill();
      }
      const pk = eo(t / 1.2), g = ctx.createRadialGradient(start[0], start[1], 0, start[0], start[1], 60); g.addColorStop(0, `rgba(255,255,255,${.9 * pk})`); g.addColorStop(.3, hexA(MINT, .55 * pk)); g.addColorStop(1, "rgba(0,229,168,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(start[0], start[1], 60, 0, 7); ctx.fill();
    }
    const tl = t - T_PEN;
    if (tl > 2.0) rays(t, MINT, .09 * eo((tl - 2.0) / .8));
    const pu = t > hit ? 1 + .03 * Math.exp(-(((t - hit) % .46875) / .46875) * 5) : 1;
    drawLogo(cx, cy, w * pu, tl);
    shock(t, hit, cx, cy, "#fff"); shock(t, hit + .18, cx, cy, MINT); flash(t, hit, .7, .45);
  }
  // Szene 2: Titel (5.2 - 10)
  function sceneTitle(t) {
    const u = t - T_TITLE; bg(t); sparks(t, 1, 80); rays(t, GOLD, .08);
    const w = Math.min(W * .5, 520), h = w * 340 / 784, ly = lerp(H / 2, H * .17, eio(u / .7)), ls = lerp(1, .6, eio(u / .7));
    drawLogo(W / 2, ly, w * ls, 99);
    const words = [["DAS", .7, H * .36, .09, "#fff"], ["MEGA", 1.15, H * .52, .2, MINT], ["UPDATE", 1.6, H * .7, .14, GOLD]];
    words.forEach(([s, at, y, sz, col]) => { const k = clamp((u - at) / .25); if (k <= 0) return; fitText(s, W / 2, y, W * .9, Math.min(W, H * 1.7) * sz * 1.35, col, k * 3, 1 + (1 - eo(k)) * 1.6); shock(t, T_TITLE + at, W / 2, y, col, .5); });
    if (u > 2.7) fitText("Alle Spiele. Eine Seite. Keine Werbung.", W / 2, H * .87, W * .9, Math.min(W * .045, 44), "#cfd6ff", eo((u - 2.7) / .6), 1, 600, false);
    flash(t, T_TITLE + .7, .5); flash(t, T_TITLE + 1.15, .5); flash(t, T_TITLE + 1.6, .6);
  }
  // Szene 3: Kategorien mit allen Spielen (10 - T_WALL)
  function sceneShow(t) {
    let seg = plan.find(p => t < p.exit) || plan[plan.length - 1];
    const col = seg.col[0];
    bg(t, col); sparks(t, .8, 60); rays(t, col, .05);
    const L = grid(seg.list.length, W * .9, H * .6), cx = W / 2, cy = H * .5;
    // Kategorie-Karte
    const kc = t - seg.card;
    if (t < seg.tiles) {
      const a = clamp(1 - (kc - .55) / .25) * clamp(kc / .08);
      fitText(seg.name.toUpperCase(), W / 2, H * .46, W * .92, Math.min(W, H * 1.7) * .13, "#fff", a, 1 + (1 - eo4(kc / .28)) * 1.8);
      fitText(seg.list.length + " Spiele", W / 2, H * .6, W * .8, Math.min(W * .06, 56), col, a * eo((kc - .15) / .3), 1, 800);
      if (kc >= 0 && kc < .12) flash(t, seg.card, .45, .2);
      shock(t, seg.card, W / 2, H * .5, col);
    } else {
      const ex = clamp((t - seg.end) / .3);
      seg.list.forEach((g, i) => {
        const ti = seg.tiles + i * seg.step, k = (t - ti) / .32; if (k < 0) return;
        const [x, y, s] = tilePos(i, seg.list.length, L, cx, cy);
        const e = eo4(ex), sc = back(k) * (1 + e * .5), a = clamp(k * 3) * (1 - e), rot = (1 - clamp(k)) * (rnd(i + seg.card) - .5) * .9;
        tile(g, x, y, s, a, rot, sc);
        const rk = (t - ti) / .45; if (rk >= 0 && rk < 1) { ctx.save(); ctx.globalAlpha = (1 - rk) * .8 * (1 - e); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - rk * s * .25, y - rk * s * .25, s * (1 + rk * .5), s * (1 + rk * .5), s * .22); ctx.stroke(); ctx.restore(); }
      });
      // Name des neuesten Spiels gross unten
      const j = Math.min(seg.list.length - 1, Math.floor((t - seg.tiles) / seg.step));
      if (j >= 0 && t < seg.end + .05) { const lt = (t - (seg.tiles + j * seg.step)) / .2; fitText(seg.list[j].title, W / 2, H * .91, W * .9, Math.min(W * .055, 52), "#fff", clamp(lt * 3), .9 + .1 * eo(lt), 800); }
      // Kategorie-Band oben und Gesamtzaehler
      fitText(seg.name.toUpperCase(), W / 2, H * .075, W * .6, Math.min(W * .04, 34), col, .95, 1, 900, false);
      const nOn = seg.done0 + clamp(Math.floor((t - seg.tiles) / seg.step) + 1, 0, seg.list.length);
      fitText(nOn + " / " + games.length, W - Math.min(W * .1, 90), H * .075, W * .3, Math.min(W * .035, 30), GOLD, .9, 1, 800, false);
    }
    if (t < seg.card + .03 || (seg === plan[0] && t < T_SHOW + .3)) flash(t, seg.card, .5, .25);
  }
  // Szene "Das ist neu": die wichtigsten Neuerungen als Karten, eine nach der anderen
  const INFO = [
    ["54 neue Spiele", "Seit den ersten 50 Spielen dazugekommen", MINT, "54"],
    ["Alle Spiele direkt in Moki", "Ohne Umweg, im selben Fenster", BLUE, "play"],
    ["Wochenchallenge", "Spielzeit sammeln, Fortschritt im Balken", GOLD, "ring"],
    ["Tester-Programm", "Hilf mit, neue Spiele zu testen", PINK, "check"],
    ["Zufallsspiel", "Mit Animation über alle Spiele", VIO, "?"],
    ["Keine Werbung", "Weiterhin keine Banner und Pop-ups", MINT, "ad"]
  ];
  function infoIcon(kind, cx, cy, r, col) {
    ctx.save(); ctx.translate(cx, cy);
    const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, col); g.addColorStop(1, hexA(col, .55)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#fff"; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = r * .2; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (kind === "play") { ctx.beginPath(); ctx.moveTo(-r * .22, -r * .38); ctx.lineTo(r * .42, 0); ctx.lineTo(-r * .22, r * .38); ctx.closePath(); ctx.fill(); }
    else if (kind === "ring") { ctx.beginPath(); ctx.arc(0, 0, r * .46, -1.57, -1.57 + 6.283 * .72); ctx.stroke(); }
    else if (kind === "check") { ctx.beginPath(); ctx.moveTo(-r * .42, 0); ctx.lineTo(-r * .1, r * .34); ctx.lineTo(r * .46, -r * .32); ctx.stroke(); }
    else if (kind === "ad") { ctx.font = `900 ${r * .72}px ${FONT}`; ctx.fillText("AD", 0, 1); ctx.beginPath(); ctx.moveTo(-r * .58, -r * .5); ctx.lineTo(r * .58, r * .5); ctx.stroke(); }
    else { ctx.font = `900 ${r * (kind.length > 1 ? .8 : 1.1)}px ${FONT}`; ctx.fillText(kind, 0, 2); }
    ctx.restore();
  }
  function sceneInfo(t) {
    const u = t - T_INFO; bg(t, MINT); sparks(t, .9, 60); rays(t, GOLD, .05);
    const k0 = clamp(u / .3), titleY = H * .13;
    fitText("DAS IST NEU", W / 2, titleY, W * .9, Math.min(W, H * 1.7) * .09, GOLD, k0 * 3, 1 + (1 - eo4(k0)) * 1.6);
    shock(t, T_INFO, W / 2, titleY, GOLD, .5); flash(t, T_INFO, .45, .25);
    const cols = W >= 900 ? 2 : 1, rows = Math.ceil(INFO.length / cols), gap = Math.min(W, H) * .025, top = H * .25, ah = H * .72;
    const cw = Math.min((W * .92 - gap * (cols - 1)) / cols, 620), ch = Math.min((ah - gap * (rows - 1)) / rows, 130);
    const x0 = (W - (cw * cols + gap * (cols - 1))) / 2, y0 = top + (ah - (ch * rows + gap * (rows - 1))) / 2;
    INFO.forEach((it, i) => {
      const at = .9 + i * .8, k = (u - at) / .45; if (k <= 0) return;
      const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (cw + gap), y = y0 + r * (ch + gap), slide = (1 - eo4(k)) * (c ? 1 : -1) * W * .35, a = clamp(k * 3);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(slide, 0);
      ctx.fillStyle = "rgba(10,13,43,.9)"; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, ch * .24); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = hexA(it[2], .85); ctx.stroke();
      const ir = ch * .3; infoIcon(it[3], x + ch * .2 + ir, y + ch / 2, ir, it[2]);
      const tx = x + ch * .2 + ir * 2 + ch * .2, tw = cw - (tx - x) - ch * .2;
      ctx.restore();
      ctx.save(); ctx.translate(slide, 0);
      fitText(it[0], tx + tw / 2, y + ch * .38, tw, Math.min(ch * .3, W * .05), "#fff", a, 1, 900, false, false);
      fitText(it[1], tx + tw / 2, y + ch * .72, tw, Math.min(ch * .19, W * .035), "#a3abe0", a, 1, 500, false, false);
      ctx.restore();
      if (k > 0 && k < .15) shock(t, T_INFO + at, x + cw / 2, y + ch / 2, it[2], .25);
    });
    if (u > 7.9) { ctx.fillStyle = `rgba(5,6,15,${clamp((u - 7.9) / .5)})`; ctx.fillRect(0, 0, W, H); }
  }
  // Szene "Leider raus": die Spiele, die es nicht ins Update geschafft haben
  const GONE = window.MOKI_GONE || [];
  function sceneGone(t) {
    const u = t - T_GONE; bg(t, "#ff4d4d"); sparks(t, .6, 50);
    const k0 = clamp(u / .3), RED = "#ff6b6b";
    fitText("LEIDER RAUS", W / 2, H * .14, W * .92, Math.min(W, H * 1.7) * .1, RED, k0 * 3, 1 + (1 - eo4(k0)) * 1.8);
    shock(t, T_GONE, W / 2, H * .14, RED, .6); flash(t, T_GONE, .5, .3);
    if (u > .8) fitText(GONE.length + " Spiele haben es nicht ins Update geschafft", W / 2, H * .24, W * .9, Math.min(W * .045, 40), "#e6e9ff", eo((u - .8) / .5), 1, 700, false);
    const s = Math.min(W * (W < 700 ? .27 : .22), H * .3, 250), gap = s * .25, total = GONE.length * s + (GONE.length - 1) * gap, x0 = (W - total) / 2, y = H * .33;
    GONE.forEach((g, i) => {
      const at = 1.4 + i * .5, k = (u - at) / .4; if (k <= 0) return;
      const x = x0 + i * (s + gap);
      tile(g, x, y, s, clamp(k * 3), (1 - clamp(k)) * .5 * (i % 2 ? 1 : -1), back(k));
      // grau und abgedunkelt
      ctx.save(); ctx.globalAlpha = clamp(k * 3); ctx.translate(x + s / 2, y + s / 2); ctx.scale(back(k), back(k)); ctx.rotate((1 - clamp(k)) * .5 * (i % 2 ? 1 : -1)); ctx.translate(-s / 2, -s / 2);
      ctx.beginPath(); ctx.roundRect(0, 0, s, s, s * .2); ctx.clip();
      ctx.globalCompositeOperation = "saturation"; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, s, s); ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(5,6,15,.5)"; ctx.fillRect(0, 0, s, s); ctx.restore();
      // Stempel "RAUS"
      const sk = (u - at - .35) / .25;
      if (sk > 0) {
        const sc = 1 + (1 - eo4(sk)) * 1.6; ctx.save(); ctx.globalAlpha = clamp(sk * 3); ctx.translate(x + s / 2, y + s / 2); ctx.rotate(-.2); ctx.scale(sc, sc);
        ctx.lineWidth = Math.max(3, s * .03); ctx.strokeStyle = RED; ctx.fillStyle = "rgba(5,6,15,.55)"; const bw = s * .86, bh = s * .3; ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh * .2); ctx.fill(); ctx.stroke(); ctx.restore();
        fitText("RAUS", x + s / 2, y + s / 2, s * .7, s * .22, RED, clamp(sk * 3), sc, 900, false, false);
      }
      fitText(g.title, x + s / 2, y + s + s * .16, s * 1.1, Math.min(s * .15, 30), "#e6e9ff", clamp(k * 2), 1, 800, false);
    });
    const ry = y + s + s * .45;
    const lines = [["Netlify hat meine Accounts gesperrt.", 3.4, "#fff"], ["Auf die Dateien dieser Spiele habe ich keinen Zugriff mehr.", 4.2, "#cfd6ff"], ["Alle anderen Spiele sind weiter dabei.", 5.2, MINT]];
    lines.forEach(([txt, at, col], i) => { if (u > at) fitText(txt, W / 2, ry + i * Math.min(W * .055, 52), W * .92, Math.min(W * .042, 36), col, eo((u - at) / .5), 1, i === 2 ? 800 : 600, false); });
    if (u > 6.5) { ctx.fillStyle = `rgba(5,6,15,${clamp((u - 6.5) / .5)})`; ctx.fillRect(0, 0, W, H); }
  }
  // Szene 4: Spielewand mit Zaehler und Finale (T_WALL - DUR)
  function sceneWall(t) {
    const u = t - T_WALL; bg(t); sparks(t, .7, 60);
    const N = games.length, rows = Math.max(3, Math.round(Math.sqrt(N * H / W))), base = Math.floor(N / rows), extra = N - base * rows, th = H / rows;
    const fade = u > 3.6 ? 1 - .72 * eo((u - 3.6) / .8) : 1;
    // Jedes Spiel genau einmal, der Bildschirm ist komplett gefuellt: Reihen mit base oder base+1 Kacheln (gleichmaessig verteilt).
    // Der Schritt ist teilerfremd zu N, damit alle verschieden sind und keine Nachbarn gleich.
    const STEP = [7, 11, 13, 17, 19].find(k => N % k !== 0);
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      const cnt = base + (Math.floor((r + 1) * extra / rows) - Math.floor(r * extra / rows)), tw = W / cnt;
      for (let c = 0; c < cnt; c++, idx++) {
        const x = c * tw, y = r * th, d = Math.hypot(x + tw / 2 - W / 2, y + th / 2 - H / 2) / Math.hypot(W / 2, H / 2), k = (u - .15 - d * .9) / .35; if (k <= 0) continue;
        tile(games[(idx * STEP) % N], x + 1.5, y + 1.5, tw - 3, clamp(k * 2.5) * fade, 0, back(k), th - 3);
      }
    }
    ctx.fillStyle = `rgba(5,6,15,${.35 + .2 * (1 - fade)})`; ctx.fillRect(0, 0, W, H);
    flash(t, T_WALL, .8, .4); shock(t, T_WALL, W / 2, H / 2, MINT, 1);
    // Zaehler
    if (u > .5 && u < 4.4) {
      const k = back((u - .5) / .4), n = Math.round(N * eo((u - .6) / 1.8)), pw = Math.min(W * .86, 760), ph = Math.min(H * .34, 250);
      ctx.save(); ctx.globalAlpha = 1 - clamp((u - 3.9) / .5); ctx.translate(W / 2, H / 2); ctx.scale(k, k);
      ctx.fillStyle = "rgba(10,13,43,.92)"; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 40); ctx.fill();
      const gr = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0); gr.addColorStop(0, MINT); gr.addColorStop(1, GOLD); ctx.strokeStyle = gr; ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
      const narrow = W < 640;
      if (narrow) {
        fitText(String(n), W / 2, H / 2 - ph * .16, pw * .8, ph * .5, "#fff", k, 1, 900, false);
        fitText("SPIELE", W / 2, H / 2 + ph * .2, pw * .8, ph * .2, GOLD, k, 1, 900);
        fitText("direkt im Browser", W / 2, H / 2 + ph * .38, pw * .8, ph * .1, "#a3abe0", k, 1, 500, false);
      } else {
        fitText(String(n), W / 2 - pw * .18, H / 2 - ph * .04, pw * .4, ph * .62, "#fff", k, 1, 900, false);
        fitText("SPIELE", W / 2 + pw * .17, H / 2 - ph * .14, pw * .36, ph * .26, GOLD, k, 1, 900);
        fitText("direkt im Browser", W / 2 + pw * .17, H / 2 + ph * .16, pw * .36, ph * .13, "#a3abe0", k, 1, 500, false);
      }
      if (u > 2.3) { const ck = back((u - 2.3) / .35), cw = narrow ? pw * .85 : Math.min(pw * .6, 440); ctx.save(); ctx.translate(W / 2, H / 2 + ph * .75); ctx.scale(ck, ck); ctx.globalAlpha = clamp(ck) * (1 - clamp((u - 3.9) / .5)); ctx.fillStyle = MINT; ctx.beginPath(); ctx.roundRect(-cw / 2, -ph * .17, cw, ph * .34, ph * .17); ctx.fill(); ctx.restore(); fitText("KEINE WERBUNG", W / 2, H / 2 + ph * .75, cw * .86, ph * .2, "#04201a", ck * (1 - clamp((u - 3.9) / .5)), 1, 900, false, false); }
    }
    // Logo zum Schluss: wird noch einmal in einem Zug gezeichnet
    const lu = u - 3.7;
    if (lu > 0) {
      const w = logoW(), lh = w * 340 / 784, pu = lu > 3.15 ? 1 + .03 * Math.exp(-(((lu - 3.15) % .46875) / .46875) * 5) : 1;
      rays(t, MINT, .1 * eo((lu - 1.8) / .8)); drawLogo(W / 2, H / 2 - lh * .1, w * pu, lu);
      shock(t, T_WALL + 6.85, W / 2, H / 2, MINT, .9); flash(t, T_WALL + 6.85, .5, .4);
      fitText("Willkommen bei Moki", W / 2, H / 2 + lh * .6, W * .9, Math.min(W * .06, 56), "#fff", eo((lu - 3.4) / .5), 1, 800);
    }
  }
  function render(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
    const k = Math.exp(-((t % .46875) / .46875) * 6), sh = (t >= T_TITLE && t < T_TITLE + 3 ? 10 : t >= T_SHOW && t < T_GONE ? 3 : 0) * k;
    ctx.save(); ctx.translate(Math.sin(t * 91) * sh, Math.cos(t * 77) * sh);
    if (t < T_TITLE) sceneLogo(t); else if (t < T_INFO) sceneTitle(t); else if (t < T_SHOW) sceneInfo(t); else if (t < T_GONE) sceneShow(t); else if (t < T_WALL) sceneGone(t); else sceneWall(t);
    ctx.restore();
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .8); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.55)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (t < .6) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .6})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- Ende ----------
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

  // ---------- Start ----------
  async function start() {
    const imgs = Promise.all([...games, ...(window.MOKI_GONE || [])].map(g => loadImg(g.image).then(i => { IMG.set(g.image, i); })));
    await Promise.race([imgs, new Promise(r => setTimeout(r, 6000))]);
    if (TEST) { window.__MOKI_MI = { render, DUR, T_TITLE, T_INFO, T_SHOW, T_GONE, T_WALL, plan, finish }; render(0); return; }
    let t = 0, last = performance.now();
    const hard = setTimeout(finish, (DUR + 20) * 1000);   // Notbremse, falls etwas haengt
    (function frame(now) {
      t += Math.min((now - last) / 1000, .1); last = now;   // Tab im Hintergrund: Zeit steht still
      try { render(Math.min(t, DUR)); } catch (e) { clearTimeout(hard); finish(); return; }
      if (t < DUR) requestAnimationFrame(frame); else { clearTimeout(hard); finish(); }
    })(last);
  }
  start().catch(finish);
})();
