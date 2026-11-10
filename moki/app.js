const games = window.MOKI_GAMES;
const sites = window.MOKI_SITES || [];
const app = document.getElementById("app");
const search = document.getElementById("q");
let category = "Alle";

const tile = g => `<a class="tile${g.wide ? " wide" : ""}" href="${g.url}" data-id="${g.id}" style="background:linear-gradient(135deg,${g.colors[0]},${g.colors[1]})">${g.image ? `<img src="${g.image}" alt="">` : `<span class="em">${g.emoji}</span>`}<span class="name">${g.title}</span></a>`;
const esc = s => s.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function home() {
  const q = search.value.trim().toLowerCase();
  const cats = ["Alle", ...new Set(games.map(g => g.category))];
  let list = games.filter(g => (category === "Alle" || g.category === category) && g.title.toLowerCase().includes(q));
  const feat = games.filter(g => g.featured);
  app.innerHTML = `
    ${!q && category === "Alle" && feat.length ? `<h2>⭐ Empfohlen</h2><div class="hero">${feat.map(g => tile(g, true)).join("")}</div>` : ""}
    <h2>Alle Spiele</h2>
    <div class="chips">${cats.map(c => `<button class="chip ${c === category ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div style="height:16px"></div>
    ${list.length ? `<div class="grid">${list.map(g => tile(g)).join("")}</div>` : `<p class="empty">Kein Spiel gefunden.</p>`}
    ${!q && category === "Alle" && sites.length ? `<h2>🌐 Weitere Seiten</h2><p class="warn">⚠️ Achtung: Auf diesen Seiten funktionieren nicht alle Spiele. Wenn eins nicht lädt, probier ein anderes.</p><div class="grid">${sites.map(g => tile(g)).join("")}</div>` : ""}`;
  app.querySelectorAll(".chip").forEach(b => b.onclick = () => { category = b.dataset.c; home(); });
}

function route() {
  document.title = "Moki – Spiele";
  home();
}
search.addEventListener("input", () => { home(); });
addEventListener("hashchange", route);
route();

// Popup-Warnung vor Spielen mit "warning" in games.js
function warnDialog(g) {
  const o = document.createElement("div");
  o.className = "modal";
  o.innerHTML = `<div class="box" role="dialog" aria-modal="true"><h3>⚠️ Experimentell</h3><p>${esc(g.warning)}</p>
    <div class="acts"><button class="btn" data-a="no">Abbrechen</button><a class="btn go" href="${g.url}">Trotzdem öffnen</a></div></div>`;
  const close = () => o.remove();
  o.addEventListener("click", e => { if (e.target === o || e.target.dataset.a === "no") close(); });
  addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); removeEventListener("keydown", k); } });
  document.body.appendChild(o);
  o.querySelector(".go").focus();
}
document.addEventListener("click", e => {
  const t = e.target.closest("a.tile[data-id]");
  if (!t || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const g = [...games, ...sites].find(x => x.id === t.dataset.id);
  if (g && g.warning) { e.preventDefault(); warnDialog(g); }
});
