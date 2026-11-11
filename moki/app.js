const games = window.MOKI_GAMES;
const sites = window.MOKI_SITES || [];
const app = document.getElementById("app");
const side = document.getElementById("side");
const search = document.getElementById("q");
const ICONS = { Alle: "🏠", Fahren: "🏎️", Rhythmus: "🎵", Action: "💥", Simulation: "🏨", Abenteuer: "🧭" };
let category = "Alle";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tile = g => `<a class="tile${g.wide ? " wide" : ""}" href="${g.url}" data-id="${g.id}" aria-label="${esc(g.title)}" title="${esc(g.title)}" style="background:linear-gradient(135deg,${g.colors[0]},${g.colors[1]})">${g.image ? `<img src="${g.image}" alt="" loading="lazy">` : `<span class="em">${g.emoji}</span>`}<span class="name">${esc(g.title)}</span></a>`;

function renderSide() {
  const cats = ["Alle", ...new Set(games.map(g => g.category))];
  side.innerHTML = `<h3>Kategorien</h3>` + cats.map(c => {
    const n = c === "Alle" ? games.length : games.filter(g => g.category === c).length;
    return `<button class="cat ${c === category ? "on" : ""}" data-c="${esc(c)}"><span class="ic">${ICONS[c] || "🎮"}</span>${esc(c)}<span class="n">${n}</span></button>`;
  }).join("");
  side.querySelectorAll(".cat").forEach(b => b.onclick = () => { category = b.dataset.c; home(); });
}

function home() {
  const q = search.value.trim().toLowerCase();
  const list = games.filter(g => (category === "Alle" || g.category === category) && g.title.toLowerCase().includes(q));
  renderSide();
  const title = category === "Alle" ? "Alle Spiele" : category;
  app.innerHTML = `
    <section>
      <h2>${esc(title)}</h2>
      <p class="sub">${list.length} ${list.length === 1 ? "Spiel" : "Spiele"}</p>
      ${list.length ? `<div class="grid">${list.map(tile).join("")}</div>` : `<p class="empty">Kein Spiel gefunden.</p>`}
    </section>
    ${!q && category === "Alle" && sites.length ? `<section>
      <h2>🌐 Weitere Seiten</h2>
      <p class="warn">⚠️ Achtung: Auf diesen Seiten funktionieren nicht alle Spiele. Wenn eins nicht lädt, probier ein anderes.</p>
      <div class="grid">${sites.map(tile).join("")}</div>
    </section>` : ""}`;
}

search.addEventListener("input", home);
document.title = "Moki – Spiele";
home();

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
