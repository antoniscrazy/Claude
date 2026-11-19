// Ankuendigungen: Popup beim naechsten Oeffnen von Moki. Schliessen erst nach 3 Sekunden.
(function () {
  "use strict";
  const CFG = window.MOKI_CFG || {};
  const SEEN = "moki-ann-seen";
  const WAIT = 3;   // Sekunden bis zum Schliessen

  function seen() { try { return JSON.parse(localStorage.getItem(SEEN) || "[]"); } catch (e) { return []; } }
  function markSeen(id) {
    try { const s = seen(); if (!s.includes(id)) { s.push(id); localStorage.setItem(SEEN, JSON.stringify(s.slice(-200))); } } catch (e) {}
  }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function fetchActive() {
    try {
      const r = await fetch(CFG.sbUrl + "/rest/v1/rpc/moki_announcements_active", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: CFG.sbKey, Authorization: "Bearer " + CFG.sbKey },
        body: "{}"
      });
      if (!r.ok) return [];
      const j = await r.json();
      return Array.isArray(j) ? j : [];
    } catch (e) { return []; }
  }

  // Erst zeigen, wenn Intro, Update-Uebersicht und Spiel-Player zu sind
  function busy() {
    const up = document.querySelector("#upd.open");
    const intro = document.documentElement.classList.contains("intro-on") || document.documentElement.classList.contains("mi-on");
    const pl = document.getElementById("player");
    const tr = document.getElementById("trlfs");
    return !!(up || intro || pl || tr);
  }
  function waitFree() {
    return new Promise(res => { const t = setInterval(() => { if (!busy()) { clearInterval(t); res(); } }, 500); });
  }

  function show(a) {
    return new Promise(res => {
      const el = document.createElement("div");
      el.className = "ann";
      el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", a.title);
      const link = a.link_url ? `<a class="ann-link" href="${esc(a.link_url)}" target="_blank" rel="noopener">${esc(a.link_label || "Mehr")}</a>` : "";
      el.innerHTML = `<div class="ann-card">
          <div class="ann-glow" aria-hidden="true"></div>
          <div class="ann-top"><span class="ann-chip">Ankündigung</span></div>
          <div class="ann-emoji" aria-hidden="true">${esc(a.emoji || "📣")}</div>
          <h2 class="ann-title">${esc(a.title)}</h2>
          <p class="ann-body">${esc(a.body)}</p>
          <div class="ann-acts">${link}<button type="button" class="ann-close" disabled><span>Schließen</span><i></i></button></div>
        </div>`;
      document.body.appendChild(el);
      const btn = el.querySelector(".ann-close"), lbl = btn.querySelector("span");
      let left = WAIT;
      const tick = () => {
        if (left > 0) { lbl.textContent = "Schließen (" + left + ")"; left--; setTimeout(tick, 1000); }
        else { lbl.textContent = "Verstanden"; btn.disabled = false; btn.classList.add("ready"); }
      };
      tick();
      const close = () => {
        if (btn.disabled) return;
        markSeen(a.id);
        el.classList.add("out");
        setTimeout(() => { el.remove(); res(); }, 320);
      };
      btn.addEventListener("click", close);
      const onKey = e => { if (e.key === "Escape") close(); };
      addEventListener("keydown", onKey);
      // Aufraeumen bei Schliessen
      const obs = new MutationObserver(() => { if (!document.body.contains(el)) { removeEventListener("keydown", onKey); obs.disconnect(); } });
      obs.observe(document.body, { childList: true });
      requestAnimationFrame(() => el.classList.add("in"));
      btn.focus({ preventScroll: true });
    });
  }

  async function run() {
    const all = await fetchActive();
    const todo = all.filter(a => !seen().includes(a.id));
    if (!todo.length) return;
    await waitFree();
    for (const a of todo) {
      await show(a);
      await new Promise(r => setTimeout(r, 400));
    }
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", () => setTimeout(run, 900));
  else setTimeout(run, 900);
})();
