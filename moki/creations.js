// Kreationen: Spiele aus dem Moki Studio. Liste laden und Spiele IN Moki öffnen (mit Moki-Animation und "Made by").
(function () {
  const CFGM = window.MOKI_CFG;
  if (!CFGM || !window.MOKI_CRE) return;
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function rpc(fn, args) {
    const r = await fetch(CFGM.sbUrl + "/rest/v1/rpc/" + fn, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: CFGM.sbKey, Authorization: "Bearer " + CFGM.sbKey }, body: JSON.stringify(args || {})
    });
    if (!r.ok) throw new Error("Fehler " + r.status);
    return r.json();
  }

  // ---------- Liste der veröffentlichten Spiele ----------
  rpc("moki_list_published").then(l => { CRE.list = Array.isArray(l) ? l : []; }).catch(() => { CRE.error = true; })
    .finally(() => { CRE.loaded = true; home(); });

  // ---------- Logo-Animation (gleich wie beim Update-Intro) ----------
  const LOGO = id => `<svg viewBox="-14 -20 392 170" aria-hidden="true"><defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="362" y2="0"><stop offset="0" stop-color="#00e5a8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient></defs>
<g class="lg" fill="none" stroke="url(#${id})" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
<path pathLength="1" d="M12 120V70C12 52 22 44 38 44S64 52 64 70V120"/>
<path pathLength="1" d="M64 70C64 52 74 44 90 44S116 52 116 70V120"/>
<circle pathLength="1" cx="192" cy="82" r="38"/>
<path pathLength="1" d="M268 12V120"/><path pathLength="1" d="M268 90L304 48"/><path pathLength="1" d="M286 74L310 120"/>
<path pathLength="1" d="M350 44V120"/></g>
<circle class="dot" cx="350" cy="6" r="14" fill="url(#${id})"/>
<path class="tri" d="M183 66L207 82L183 98Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></svg>`;

  function burst(cv, stop) {
    if (reduce) return;
    const ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
    const W = (cv.width = Math.max(1, r.width * dpr)), H = (cv.height = Math.max(1, r.height * dpr));
    const cols = ["#00e5a8", "#2fe0c0", "#ffd23f", "#ffffff", "#2b6fd6"], ps = [];
    for (let i = 0; i < 220; i++) {
      const a = Math.random() * Math.PI * 2, sp = (3 + Math.random() * 14) * dpr;
      ps.push({ x: W / 2, y: H / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3 * dpr, s: (4 + Math.random() * 7) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length], round: i % 3 === 0 });
    }
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, W, H); let alive = 0;
      for (const p of ps) {
        p.vx *= .985; p.vy = p.vy * .985 + .22 * dpr; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        const life = Math.max(0, 1 - (t - t0) / 3600); if (life <= 0) continue; alive++;
        ctx.save(); ctx.globalAlpha = Math.min(1, life * 1.6); ctx.fillStyle = p.c; ctx.translate(p.x, p.y); ctx.rotate(p.r);
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
      if (alive && !stop()) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  window.MOKI_SPLASH = { LOGO, burst };   // auch fuer Moki-Originals im eingebauten Player
  // ---------- Spiel-Seite ----------
  let play = null;   // { slug, el, html, token }
  function saveKey(slug) { return "moki_save_" + slug; }
  function getSave(slug) { try { return JSON.parse(localStorage.getItem(saveKey(slug)) || "{}"); } catch (e) { return {}; } }
  function srcdoc(code, title, slug) {
    const inj = "<script>window.MOKI_TITLE=" + JSON.stringify(title).replace(/</g, "\\u003c") + ";window.MOKI_SAVE=" + JSON.stringify(getSave(slug)).replace(/</g, "\\u003c") + ";<\/script><script>" + window.MOKI_ENGINE + "<\/script>";
    code = String(code);
    if (/^\s*(<!doctype|<html|<head|<body)/i.test(code)) {
      const m = /<head[^>]*>/i.exec(code) || /<html[^>]*>/i.exec(code) || /<!doctype[^>]*>/i.exec(code), at = m ? m.index + m[0].length : 0;
      return code.slice(0, at) + inj + code.slice(at);
    }
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + inj + "<script>\n" + code.replace(/<\/script/gi, "<\\/script") + "\n<\/script></body></html>";
  }
  function mountFrame(stage, html) {
    const old = stage.querySelector("iframe"); if (old) old.remove();
    const f = document.createElement("iframe");
    f.setAttribute("sandbox", "allow-scripts");   // geschützte Box: kein Zugriff auf Moki
    f.title = "Spiel"; f.srcdoc = html;
    stage.insertBefore(f, stage.firstChild);
    return f;
  }
  async function openPlay(slug) {
    if (play && play.slug === slug) return;
    closePlay(true);
    const el = document.createElement("div");
    el.id = "play"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Spiel");
    el.innerHTML = `<div class="pbar"><div class="pinfo"><b>Lade …</b><span></span></div><a class="pback" href="#/">&larr; Back to Moki</a></div><div class="pstage"><div class="pmsg"><span>Lade Spiel …</span></div></div>`;
    document.body.appendChild(el); root.classList.add("playing");
    const me = (play = { slug, el });
    let g = null, err = "";
    try { g = await rpc("moki_get_published", { p_slug: slug }); } catch (e) { err = "Das Spiel konnte nicht geladen werden. Prüfe dein Internet."; }
    if (play !== me) return;   // inzwischen woanders hin
    const stage = el.querySelector(".pstage");
    if (!g) {
      el.querySelector(".pinfo b").textContent = "Spiel nicht gefunden";
      stage.innerHTML = `<div class="pmsg"><b>${esc(err ? "Fehler" : "Dieses Spiel gibt es nicht (mehr)")}</b><span>${esc(err || "Vielleicht wurde es zurückgezogen oder gelöscht.")}</span></div>`;
      return;
    }
    document.title = g.title + " – Moki";
    el.querySelector(".pinfo b").textContent = g.title;
    el.querySelector(".pinfo span").textContent = "von " + g.creator;
    stage.innerHTML = "";
    me.code = g.code; me.title = g.title; me.html = srcdoc(g.code, g.title, slug);
    mountFrame(stage, me.html);   // lädt schon im Hintergrund. Gestartet wird erst durch Tippen im Spiel.
    // Moki-Animation mit "Made by ..."
    const sp = document.createElement("div");
    sp.className = "splash"; sp.setAttribute("aria-label", "Moki: Made by " + g.creator);
    sp.innerHTML = `<canvas class="fxc" aria-hidden="true"></canvas><div class="flash go" aria-hidden="true"></div>
      <section class="st boom on"><i class="wave w1"></i><i class="wave w2"></i><i class="wave w3"></i>
      <div class="biglogo">${LOGO("slg" + Date.now().toString(36))}</div><p class="btag">Made by ${esc(g.creator)}</p></section>`;
    stage.appendChild(sp);
    let skipped = false;
    const finish = () => {
      if (skipped) return; skipped = true; sp.classList.add("out");
      setTimeout(() => { sp.remove(); const f = stage.querySelector("iframe"); if (f) f.focus(); }, reduce ? 50 : 900);
    };
    sp.addEventListener("click", finish);
    burst(sp.querySelector(".fxc"), () => skipped || play !== me);
    await sleep(reduce ? 1400 : 3400);
    if (play === me) finish();
  }
  function closePlay(silent) {
    if (!play) return;
    play.el.remove(); play = null; root.classList.remove("playing");
    document.title = "Moki – Spiele";
  }
  function route() {
    const m = /^#\/spiel\/([a-z0-9-]{1,80})\/?$/i.exec(location.hash) || /^\/spiel\/([a-z0-9-]{1,80})\/?$/i.exec(location.pathname);
    if (m) openPlay(m[1].toLowerCase()); else closePlay();
  }
  addEventListener("hashchange", route);
  // "Nochmal spielen" im Spiel
  addEventListener("message", e => {
    const d = e.data; if (!d || d.moki !== 1 || !play || !play.html) return;
    const f = play.el.querySelector("iframe"); if (!f || e.source !== f.contentWindow) return;
    if (d.type === "save" && play) { const sv = getSave(play.slug); sv[String(d.key).slice(0, 60)] = d.value; try { localStorage.setItem(saveKey(play.slug), JSON.stringify(sv).slice(0, 100000)); } catch (x) {} return; }
    if (d.type === "restart") { const st = play.el.querySelector(".pstage"); play.html = srcdoc(play.code, play.title, play.slug); mountFrame(st, play.html).focus(); }
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && play && !document.querySelector("#upd.open")) location.hash = "#/"; });
  const sb = document.getElementById("studio"); if (sb && CFGM.studioUrl) sb.href = CFGM.studioUrl;
  route();
})();
