// Wochenchallenge: Spielzeit im Wochenspiel wird gezaehlt, der Fortschritt zeigt ein Balken.
// Ziel: CH_TARGET Sekunden pro Woche. Gezaehlt wird nur, solange das Spiel offen und das Fenster sichtbar ist.
(function () {
  "use strict";
  const CFG = window.MOKI_CFG || {};
  const TKEY = "moki-tester-key";
  const CH_TARGET = 15 * 60;
  const FLUSH_EVERY = 20;   // Sekunden zwischen den Speicherungen
  let memToken = null;

  function token() {
    try {
      let t = localStorage.getItem(TKEY);
      if (!t || t.length < 16) {
        const a = new Uint8Array(24); crypto.getRandomValues(a);
        t = [...a].map(b => b.toString(16).padStart(2, "0")).join("");
        localStorage.setItem(TKEY, t);
      }
      return t;
    } catch (e) { if (!memToken) memToken = "mem-" + Math.random().toString(16).slice(2) + Date.now().toString(16); return memToken; }
  }
  async function rpc(fn, args) {
    const r = await fetch(CFG.sbUrl + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CFG.sbKey, Authorization: "Bearer " + CFG.sbKey },
      body: JSON.stringify(args || {})
    });
    const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) {}
    if (!r.ok) throw new Error((j && j.message) || "Fehler");
    return j;
  }
  // Woche wie in app.js (Montag bis Sonntag, deutsche Zeit)
  function berlinDay() {
    const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  }
  const weekIdx = () => Math.floor((berlinDay() + 3) / 7);

  // ---------- Anzeige ----------
  function card() { return document.querySelector(".chal[data-game]"); }
  function render(sec) {
    const c = card(); if (!c) return;
    const box = c.querySelector(".cprog"); if (!box) return;
    const pct = Math.min(100, Math.floor(sec / CH_TARGET * 100));
    const done = pct >= 100;
    c.classList.toggle("done", done);
    box.innerHTML = `<div class="cpt"><span>${done ? "Geschafft!" : "Fortschritt"}</span><b>${pct} %</b></div>
      <div class="cpbar"><i style="width:${pct}%"></i></div>
      <small class="cpm">${Math.floor(sec / 60)} von ${CH_TARGET / 60} Minuten Spielzeit${done ? " — Stark!" : ""}</small>`;
  }
  async function refresh() {
    const c = card(); if (!c) return;
    try { const s = await rpc("moki_challenge_get", { p_token: token(), p_week: weekIdx(), p_game: c.dataset.game }); render(Number(s) || 0); }
    catch (e) { render(0); }
  }

  // ---------- Zaehlung ----------
  let track = null;   // { game, pending, lastFlush, timer }
  function active() { return document.getElementById("player") && card() && track; }
  function flush(final) {
    if (!track || track.pending <= 0) return Promise.resolve();
    const add = Math.min(120, track.pending); track.pending -= add;
    return rpc("moki_challenge_add", { p_token: token(), p_week: track.week, p_game: track.game, p_seconds: add })
      .then(total => { render(Number(total) || 0); })
      .catch(() => { track.pending += add; });
  }
  function startTrack(game) {
    stopTrack(true);
    track = { game, week: weekIdx(), pending: 0, sinceFlush: 0 };
    track.timer = setInterval(() => {
      if (!track || !document.getElementById("player")) return;
      if (document.visibilityState !== "visible") return;
      track.pending += 1; track.sinceFlush += 1;
      if (track.sinceFlush >= FLUSH_EVERY) { track.sinceFlush = 0; flush(false); }
    }, 1000);
  }
  function stopTrack(silent) {
    if (!track) return;
    clearInterval(track.timer);
    const t = track; track = null;
    if (t.pending > 0) {
      const add = t.pending;
      rpc("moki_challenge_add", { p_token: token(), p_week: t.week, p_game: t.game, p_seconds: Math.min(120, add) })
        .then(total => { if (!silent) render(Number(total) || 0); }).catch(() => {});
    }
  }
  // Player geoeffnet: Wochenspiel? Dann zaehlen. Geschlossen: stoppen.
  function check() {
    const pl = document.getElementById("player");
    const c = card();
    const m = /^#\/play\/([a-z0-9-]{1,60})\/?$/i.exec(location.hash);
    if (pl && c && m && m[1].toLowerCase() === c.dataset.game) {
      if (!track || track.game !== c.dataset.game) startTrack(c.dataset.game);
    } else if (track) {
      stopTrack(false);
    }
  }
  new MutationObserver(() => { check(); }).observe(document.body, { childList: true, subtree: false });
  addEventListener("hashchange", check);
  addEventListener("pagehide", () => stopTrack(true));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState !== "visible") flush(false); });

  // Karte erscheint nach jedem Rendern der Startseite neu
  const app = document.getElementById("app");
  if (app) new MutationObserver(() => { if (card() && card().querySelector(".cprog") && !card().dataset.cprogLoaded) { card().dataset.cprogLoaded = "1"; refresh(); } }).observe(app, { childList: true });
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", refresh); else refresh();
})();
