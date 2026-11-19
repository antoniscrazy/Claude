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
  const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -20 392 170" width="784" height="340"><defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="362" y2="0"><stop offset="0" stop-color="#00e5a8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient></defs>'
    + '<g fill="none" stroke="url(#g)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 120V70C12 52 22 44 38 44S64 52 64 70V120"/><path d="M64 70C64 52 74 44 90 44S116 52 116 70V120"/><circle cx="192" cy="82" r="38"/><path d="M268 12V120"/><path d="M268 90L304 48"/><path d="M286 74L310 120"/><path d="M350 44V120"/></g>'
    + '<circle cx="350" cy="6" r="14" fill="url(#g)"/><path d="M183 66L207 82L183 98Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></svg>';
  let LOGO = null;

  // ---------- Kategorien (Reihenfolge: grosse zuletzt, damit es sich steigert) ----------
  const ORDER = ["Fahren", "Kampf & Schießen", "Sport", "Strategie", "Abenteuer", "Denken", "Simulation", "Geschicklichkeit"];
  const CATCOL = { "Fahren": [GOLD, "#ff7a3d"], "Kampf & Schießen": [PINK, VIO], "Sport": ["#ff7a3d", GOLD], "Strategie": [BLUE, VIO], "Abenteuer": [VIO, PINK], "Denken": [BLUE, MINT], "Simulation": [MINT, GOLD], "Geschicklichkeit": [MINT, BLUE] };
  const groups = new Map();
  games.forEach(g => { const c = g.category || "Weitere"; if (!groups.has(c)) groups.set(c, []); groups.get(c).push(g); });
  const cats = [...groups.keys()].sort((a, b) => { const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || groups.get(a).length - groups.get(b).length; });

  // ---------- Zeitplan ----------
  const T_TITLE = 5.2, T_SHOW = 10.0;
  const plan = []; let tt = T_SHOW, done = 0;
  cats.forEach(name => {
    const list = groups.get(name), step = list.length > 20 ? 0.11 : 0.15;
    const card = tt, tiles = card + 0.8, end = tiles + list.length * step + 0.4, exit = end + 0.3;
    plan.push({ name, list, step, card, tiles, end, exit, done0: done, col: CATCOL[name] || [MINT, GOLD] });
    done += list.length; tt = exit;
  });
  const T_WALL = tt, T_FIN = T_WALL + 5.6, DUR = T_FIN + 2.2;

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
  function tile(g, x, y, s, a = 1, rot = 0, sc = 1) {
    const im = IMG.get(g.image);
    ctx.save(); ctx.globalAlpha = clamp(a); ctx.translate(x + s / 2, y + s / 2); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-s / 2, -s / 2);
    ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = s * .14; ctx.shadowOffsetY = s * .05;
    ctx.beginPath(); ctx.roundRect(0, 0, s, s, s * .2); ctx.clip();
    if (im) { const k = Math.max(s / im.width, s / im.height); ctx.drawImage(im, (s - im.width * k) / 2, (s - im.height * k) / 2, im.width * k, im.height * k); }
    else { const c = g.colors || ["#1d2566", "#0d1030"]; const gr = ctx.createLinearGradient(0, 0, s, s); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); ctx.fillStyle = gr; ctx.fillRect(0, 0, s, s); }
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

  // Szene 1: Logo-Aufbau (0 - 5.2)
  function sceneLogo(t) {
    bg(t); sparks(t, clamp(t / 1.2), 80);
    const cx = W / 2, cy = H / 2 - H * .02, R = Math.min(W, H) * .17;
    if (t < 3.5) {   // Partikel ziehen sich zusammen
      for (let i = 0; i < 120; i++) {
        const a0 = rnd(i) * 6.283, d0 = Math.max(W, H) * (.35 + rnd(i + 1) * .5), s = clamp((t - .2 - rnd(i + 2) * 1.2) / 2.2); if (s <= 0) continue;
        const e = eio(s), d = d0 * (1 - e), a = a0 + e * 2.2;
        ctx.fillStyle = hexA(i % 2 ? MINT : GOLD, (1 - e * .9) * .9); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.5 + rnd(i + 3) * 3 * (1 - e), 0, 7); ctx.fill();
      }
      const gl = ctx.createRadialGradient(cx, cy, 5, cx, cy, R * 3); gl.addColorStop(0, hexA(MINT, .4 * eo(t / 3))); gl.addColorStop(1, "rgba(0,229,168,0)"); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      // Ring zeichnet sich, Dreieck springt auf
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 1.6); const gr = ctx.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, MINT); gr.addColorStop(1, GOLD);
      ctx.strokeStyle = gr; ctx.lineWidth = R * .28; ctx.lineCap = "round"; ctx.shadowColor = MINT; ctx.shadowBlur = R * .4; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283 * eio((t - .8) / 2.2)); ctx.stroke(); ctx.restore();
      if (t > 2.6) { const k = back((t - 2.6) / .5); ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(-R * .3, -R * .4); ctx.lineTo(R * .42, 0); ctx.lineTo(-R * .3, R * .4); ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
    if (t >= 3.4) {   // Logo-Einschlag
      const k = back((t - 3.4) / .6), w = Math.min(W * .62, 780), h = w * 340 / 784;
      rays(t, MINT, .09 * eo((t - 3.4) / .5));
      ctx.save(); ctx.translate(cx, cy); const pu = 1 + .03 * Math.exp(-(((t - 3.4) % .46875) / .46875) * 5); ctx.scale(k * pu, k * pu); ctx.shadowColor = MINT; ctx.shadowBlur = 50;
      if (LOGO) ctx.drawImage(LOGO, -w / 2, -h / 2, w, h); ctx.restore();
    }
    shock(t, 3.4, cx, cy, "#fff"); shock(t, 3.58, cx, cy, MINT); flash(t, 3.4, 1, .45);
  }
  // Szene 2: Titel (5.2 - 10)
  function sceneTitle(t) {
    const u = t - T_TITLE; bg(t); sparks(t, 1, 80); rays(t, GOLD, .08);
    const w = Math.min(W * .5, 520), h = w * 340 / 784, ly = lerp(H / 2, H * .17, eio(u / .7)), ls = lerp(1, .6, eio(u / .7));
    if (LOGO) { ctx.save(); ctx.translate(W / 2, ly); ctx.scale(ls, ls); ctx.shadowColor = MINT; ctx.shadowBlur = 30; ctx.drawImage(LOGO, -w / 2, -h / 2, w, h); ctx.restore(); }
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
  // Szene 4: Spielewand mit Zaehler und Finale (T_WALL - DUR)
  function sceneWall(t) {
    const u = t - T_WALL; bg(t); sparks(t, .7, 60);
    const N = games.length, cols = Math.ceil(Math.sqrt(N * W / H)), rows = Math.ceil(N / cols), s = Math.max(W / cols, H / rows) * 1.0;
    const fade = u > 3.6 ? 1 - .72 * eo((u - 3.6) / .8) : 1;
    for (let i = 0; i < cols * rows; i++) {
      const c = i % cols, r = Math.floor(i / cols), x = (W - cols * s) / 2 + c * s, y = (H - rows * s) / 2 + r * s;
      const d = Math.hypot(x + s / 2 - W / 2, y + s / 2 - H / 2) / Math.hypot(W / 2, H / 2), k = (u - .15 - d * .9) / .35; if (k <= 0) continue;
      tile(games[(i * 7 + (i >= N ? 3 : 0)) % N], x + s * .04, y + s * .04, s * .92, clamp(k * 2.5) * fade, 0, back(k));
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
    // Logo zum Schluss
    if (u > 4.2) {
      const k = back((u - 4.2) / .6), w = Math.min(W * .6, 760), h = w * 340 / 784;
      rays(t, MINT, .1 * eo((u - 4.2) / .6)); flash(t, T_WALL + 4.2, .6, .4); shock(t, T_WALL + 4.2, W / 2, H / 2, MINT, .9);
      if (LOGO) { ctx.save(); ctx.translate(W / 2, H / 2 - h * .15); const pu = 1 + .03 * Math.exp(-(((u - 4.2) % .46875) / .46875) * 5); ctx.scale(k * pu, k * pu); ctx.shadowColor = MINT; ctx.shadowBlur = 50; ctx.drawImage(LOGO, -w / 2, -h / 2, w, h); ctx.restore(); }
      fitText("Willkommen bei Moki", W / 2, H / 2 + h * .52, W * .9, Math.min(W * .06, 56), "#fff", eo((u - 4.8) / .5), 1, 800);
    }
  }
  function render(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
    const k = Math.exp(-((t % .46875) / .46875) * 6), sh = (t >= T_TITLE && t < T_TITLE + 3 ? 10 : t >= T_SHOW && t < T_WALL ? 3 : 0) * k;
    ctx.save(); ctx.translate(Math.sin(t * 91) * sh, Math.cos(t * 77) * sh);
    if (t < T_TITLE) sceneLogo(t); else if (t < T_SHOW) sceneTitle(t); else if (t < T_WALL) sceneShow(t); else sceneWall(t);
    ctx.restore();
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .8); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.55)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (t < .6) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .6})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- Ende ----------
  let ended = false;
  function finish() {
    if (ended) return; ended = true;
    markSeen();
    root.classList.add("site-in"); mi.classList.add("out");
    blocked.forEach(el => { try { el.inert = false; } catch (e) {} });
    removeEventListener("keydown", stopKeys, true);
    root.classList.remove("mi-on");
    setTimeout(() => { mi.remove(); root.classList.remove("site-in"); }, 1300);
  }

  // ---------- Start ----------
  async function start() {
    const logoP = loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(LOGO_SVG)).then(i => { LOGO = i; });
    const imgs = Promise.all(games.map(g => loadImg(g.image).then(i => { IMG.set(g.image, i); })));
    await Promise.race([Promise.all([logoP, imgs]), new Promise(r => setTimeout(r, 6000))]);
    if (TEST) { window.__MOKI_MI = { render, DUR, T_TITLE, T_SHOW, T_WALL, plan, finish }; render(0); return; }
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
