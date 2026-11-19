// Statistik: zaehlt anonym. Es werden nur Tageszaehler gespeichert (Aufrufe, Besuche, gespielte Spiele und Spielzeit, Geraeteart,
// Herkunft als Domain, Uhrzeit). Keine IP, keine Kennung pro Besucher, keine Cookies. Bei "Do Not Track" wird nichts gezaehlt.
// Auswertung im Moki-Admin. window.mokiStat(messwert, schluessel, menge) kann auch andere Skripte nutzen.
(function () {
  "use strict";
  const CFG = window.MOKI_CFG || {};
  const off = (location.protocol === "file:" && !window.__MOKI_STATS_FORCE) || navigator.doNotTrack === "1" || !CFG.sbUrl;
  if (off) { window.mokiStat = function () {}; return; }

  function hit(metric, key, n) {
    try {
      fetch(CFG.sbUrl + "/rest/v1/rpc/moki_stat_hit", {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", apikey: CFG.sbKey, Authorization: "Bearer " + CFG.sbKey },
        body: JSON.stringify({ p_metric: metric, p_key: key || "", p_n: n || 1 })
      }).catch(() => {});
    } catch (e) {}
  }
  window.mokiStat = hit;

  // ---------- Aufruf, Besuch, neuer Besucher ----------
  const flagS = k => { try { if (sessionStorage.getItem(k)) return true; sessionStorage.setItem(k, "1"); } catch (e) {} return false; };
  const flagL = k => { try { if (localStorage.getItem(k)) return true; localStorage.setItem(k, "1"); } catch (e) { return true; } return false; };
  hit("view");
  const w = innerWidth;
  hit("device", w < 700 ? "mobil" : w < 1100 ? "tablet" : "desktop");
  if (!flagS("moki-ss")) {   // erster Aufruf in diesem Tab = ein Besuch
    hit("session");
    let ref = "direkt";
    try { const h = new URL(document.referrer).hostname.replace(/^www\./, ""); if (h && h !== location.hostname) ref = h; } catch (e) {}
    hit("ref", ref);
    try { hit("hour", new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", hourCycle: "h23" }).format(new Date()).slice(0, 2)); } catch (e) {}
  }
  if (!flagL("moki-first")) hit("newvisitor");   // nur ein Merker "schon mal da", keine Kennung

  // ---------- Gespielte Spiele und Spielzeit ----------
  let cur = null;   // { id, pending, timer }
  function flush(final) {
    if (!cur) return;
    while (cur.pending >= (final ? 1 : 30)) { const n = Math.min(600, cur.pending); cur.pending -= n; hit("secs", cur.id, n); }
  }
  function startPlay(id) {
    stopPlay();
    cur = { id, pending: 0 };
    hit("play", id);
    cur.timer = setInterval(() => { if (document.visibilityState === "visible") { cur.pending++; flush(false); } }, 1000);
  }
  function stopPlay() {
    if (!cur) return;
    clearInterval(cur.timer); flush(true); cur = null;
  }
  function check() {
    const open = !!document.getElementById("player");
    const m = /^#\/play\/([a-z0-9-]{1,60})\/?$/i.exec(location.hash);
    if (open && m) { const id = m[1].toLowerCase(); if (!cur || cur.id !== id) startPlay(id); }
    else if (cur) stopPlay();
  }
  new MutationObserver(check).observe(document.body, { childList: true });
  addEventListener("hashchange", check);
  addEventListener("pagehide", () => stopPlay());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState !== "visible") flush(true); });
  // Spiele ohne eingebauten Player (eigene Seite) zaehlen beim Oeffnen
  if (typeof recordPlay === "function") {
    const orig = recordPlay;
    recordPlay = function (id) { try { if (!(window.MOKI_LAUNCH || {})[id]) hit("play", id); } catch (e) {} return orig.apply(this, arguments); };
  }

  // ---------- Klicks ----------
  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest && t.closest("#rnd")) hit("random");
    const c = t.closest && t.closest(".cat[data-c]"); if (c) hit("cat", c.dataset.c);
    const s = t.closest && t.closest("[data-share]"); if (s) hit("share", s.dataset.share);
  }, true);
})();
