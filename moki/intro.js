// Moki-Intro: Wartungsbild -> Countdown (10) -> Animation -> Moki -> Update-Übersicht.
// Läuft genau einmal pro Browser (siehe Skript im <head> von index.html).
(function () {
  const KEY = "moki-intro-v2";
  const root = document.documentElement;
  if (!root.classList.contains("intro-on")) return;

  const $ = id => document.getElementById(id);
  const intro = $("intro"), upd = $("upd"), skipBtn = $("skip");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // zusätzliche Symbole für die Übersicht
  Object.assign(SVG, {
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>'
  });

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let skipped = false, skipNow;
  const skipP = new Promise(r => (skipNow = r));
  const wait = ms => Promise.race([sleep(ms), skipP]);

  // ---------- Logo (als Linien, damit es sich "zeichnen" lässt) ----------
  const LOGO = id => `<svg viewBox="-14 -20 392 170" aria-hidden="true"><defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="362" y2="0"><stop offset="0" stop-color="#00e5a8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient></defs>
<g class="lg" fill="none" stroke="url(#${id})" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
<path pathLength="1" d="M12 120V70C12 52 22 44 38 44S64 52 64 70V120"/>
<path pathLength="1" d="M64 70C64 52 74 44 90 44S116 52 116 70V120"/>
<circle pathLength="1" cx="192" cy="82" r="38"/>
<path pathLength="1" d="M268 12V120"/><path pathLength="1" d="M268 90L304 48"/><path pathLength="1" d="M286 74L310 120"/>
<path pathLength="1" d="M350 44V120"/></g>
<circle class="dot" cx="350" cy="6" r="14" fill="url(#${id})"/>
<path class="tri" d="M183 66L207 82L183 98Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></svg>`;
  intro.querySelectorAll("[data-logo]").forEach(el => (el.innerHTML = LOGO(el.dataset.logo)));

  // ---------- Merken, dass das Intro gelaufen ist ----------
  function markSeen() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    try { document.cookie = KEY + "=1; max-age=31536000; path=/; SameSite=Lax"; } catch (e) {}
    try { if (/[?&]intro/.test(location.search)) history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
  }

  // ---------- Bildschirme umschalten ----------
  const stages = { wait: $("st-wait"), count: $("st-count"), boom: $("st-boom") };
  function show(name) { for (const k in stages) stages[k].classList.toggle("on", k === name); }

  // ---------- Countdown ----------
  const num = $("cdnum"), ring = $("ringp");
  function tick(n) {
    num.textContent = n;
    num.classList.remove("pop"); void num.offsetWidth; num.classList.add("pop");
    ring.classList.remove("tick"); void ring.getBoundingClientRect(); ring.classList.add("tick");
    stages.count.classList.toggle("hot", n <= 3);
  }

  // ---------- Konfetti ----------
  let raf = 0;
  function burst() {
    if (reduce) return;
    const cv = $("fx"), ctx = cv.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const cols = ["#00e5a8", "#2fe0c0", "#ffd23f", "#ffffff", "#2b6fd6"];
    const cx = W / 2, cy = H / 2, ps = [];
    for (let i = 0; i < 220; i++) {
      const a = Math.random() * Math.PI * 2, sp = (3 + Math.random() * 14) * dpr;
      ps.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3 * dpr, s: (4 + Math.random() * 7) * dpr,
        r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length], round: i % 3 === 0, life: 1 });
    }
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const p of ps) {
        p.vx *= .985; p.vy = p.vy * .985 + .22 * dpr; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        p.life = Math.max(0, 1 - (t - t0) / 3600);
        if (p.life <= 0) continue;
        alive++;
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life * 1.6); ctx.fillStyle = p.c;
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); }
        else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
      if (alive && !skipped) raf = requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  // ---------- Update-Übersicht ----------
  function openUpdate() {
    const fresh = games.filter(g => (g.added || "") >= "2026-11-17");
    const feats = [
      ["share", "Freunde einladen", "Mit dem Teilen-Symbol auf jeder Kachel schickst du ein Spiel per Link an Freunde. Oben rechts lädst du sie zu Moki ein."],
      ["trophy", "Wochenchallenge", "Jede Woche ein neues Spiel mit einer Aufgabe. Du markierst selbst, ob du sie geschafft hast, und sammelst eine Serie."],
      ["clock", "Mega-Update-Timer", "Oben auf der Startseite läuft der Timer bis zum Mega-Update mit über 100 Spielen."],
      ["tag", "NEU-Schilder", "Neue Spiele tragen 7 Tage lang ein NEU-Schild."],
      ["alert", "Weiterhin keine Werbung", "Keine Banner, keine Pop-ups und keine Video-Vorspänne. Das bleibt so."]
    ];
    upd.innerHTML = `<div class="ubox">
      <button class="uclose" type="button" aria-label="Schließen">${icon("x")}</button>
      <div class="uhead"><span class="uchip">${icon("sparkles")}Update</span>
        <h2 id="upd-t">Das große Moki-Update ist da</h2>
        <p>Das ist neu: Funktionen und Spiele auf einen Blick.</p></div>
      <div class="ubody">
        <section><h3>Neue Funktionen</h3><ul class="feats">${feats.map(f => `<li><span class="fi">${icon(f[0])}</span><div><b>${f[1]}</b><p>${f[2]}</p></div></li>`).join("")}</ul></section>
        <section><h3>${fresh.length} neue Spiele</h3><div class="ugrid">${fresh.map(g => `<div class="ug"><img src="${g.image}" alt=""><span>${esc(g.title)}</span></div>`).join("")}</div></section>
        <section class="utease"><h3>Als Nächstes</h3><div class="ut"><b>Mega-Update mit über 100 Spielen</b><p>${esc(megaWhen())}</p>${megaDigits()}</div></section>
      </div>
      <footer class="ufoot"><span>${games.length} Spiele · ${sites.length} Zusatzseiten</span><button class="ubtn" id="ugo" type="button">Los geht’s</button></footer>
    </div>`;
    upd.classList.add("open");
    root.classList.add("upd-open");
    requestAnimationFrame(() => upd.classList.add("show"));
    markSeen();   // ab jetzt nie wieder
    const close = () => {
      upd.classList.remove("show", "open"); root.classList.remove("upd-open");
      removeEventListener("keydown", onKey);
    };
    const onKey = e => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    upd.querySelector(".uclose").onclick = close;
    $("ugo").onclick = close;
    upd.addEventListener("click", e => { if (e.target === upd) close(); });
    $("ugo").focus({ preventScroll: true });
  }

  // Nach dem Intro: Trailer im Vollbild (nur beim ersten Besuch), danach die Update-Uebersicht
  function afterIntro() {
    if (!trailerSeen() || /[?&]trailer/.test(location.search)) showTrailerOverlay().then(openUpdate);
    else openUpdate();
  }

  function leaveIntro(fast) {
    root.classList.add("site-in");
    intro.classList.add("out");
    return wait(fast ? 350 : 900).then(() => {
      root.classList.remove("intro-on");
      setTimeout(() => root.classList.remove("site-in"), 1200);
    });
  }

  async function finishFast() {
    cancelAnimationFrame(raf);
    skipBtn.hidden = true;
    skipped = true;
    root.classList.add("site-in");
    intro.classList.add("out", "fast");
    await sleep(350);
    root.classList.remove("intro-on");
    setTimeout(() => root.classList.remove("site-in"), 1200);
    afterIntro();
  }

  skipBtn.onclick = () => { if (!skipped) { skipped = true; skipNow(); finishFast(); } };

  // ---------- Ablauf ----------
  async function run() {
    show("wait");
    await wait(3600); if (skipped) return;

    show("count");
    for (let n = 10; n >= 1; n--) { tick(n); await wait(1000); if (skipped) return; }

    // Animation
    skipBtn.hidden = true;
    show("boom");
    $("flash").classList.add("go");
    burst();
    await wait(reduce ? 1200 : 3000); if (skipped) return;

    await leaveIntro(false);
    afterIntro();
  }
  run();
})();
