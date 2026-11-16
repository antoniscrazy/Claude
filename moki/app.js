const games = window.MOKI_GAMES;
const sites = window.MOKI_SITES || [];
const app = document.getElementById("app");
const side = document.getElementById("side");
const search = document.getElementById("q");
try { if (localStorage.getItem("moki-side") === "1") document.body.classList.add("side-collapsed"); } catch (e) {}
// Linien-Symbole (SVG) statt Emojis
const SVG = {
  alle: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  fahren: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  action: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  simulation: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
  strategie: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  sport: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-1.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98 1.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  abenteuer: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  spiel: '<path d="M6 12h4M8 10v4"/><path d="M15 13h.01M18 11h.01"/><rect width="20" height="12" x="2" y="6" rx="2"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  crosshair: '<circle cx="12" cy="12" r="10"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
};
const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${SVG[n] || SVG.spiel}</svg>`;
const CATICON = { Alle: "alle", __fav: "star", Fahren: "fahren", Geschicklichkeit: "target", "Kampf & Schießen": "crosshair", Simulation: "simulation", Strategie: "strategie", Sport: "sport", Abenteuer: "abenteuer" };
const CATORDER = ["Fahren", "Geschicklichkeit", "Kampf & Schießen", "Simulation", "Strategie", "Sport", "Abenteuer"];
const CATLABEL = { Alle: "Alle", __fav: "Favoriten" };

// ---- Favoriten und "Zuletzt gespielt" (nur in diesem Browser gespeichert) ----
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const known = new Set(games.map(g => g.id));
let favs = new Set(store.get("moki-fav", []).filter(id => known.has(id)));
let recent = store.get("moki-recent", []).filter(id => known.has(id));
function toggleFav(id) {
  favs.has(id) ? favs.delete(id) : favs.add(id);
  store.set("moki-fav", [...favs]);
}
function recordPlay(id) {
  if (!known.has(id)) return;
  recent = [id, ...recent.filter(x => x !== id)].slice(0, 12);
  store.set("moki-recent", recent);
}
const favBtn = g => `<span class="fav${favs.has(g.id) ? " on" : ""}" role="button" tabindex="0" data-fav="${g.id}" aria-pressed="${favs.has(g.id)}" aria-label="${esc(g.title)} ${favs.has(g.id) ? "aus Favoriten entfernen" : "zu Favoriten hinzufügen"}" title="${favs.has(g.id) ? "Aus Favoriten entfernen" : "Zu Favoriten"}">${icon("star")}</span>`;
let category = "Alle";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tile = g => `<a class="tile${g.wide ? " wide" : ""}" href="${g.url}" data-id="${g.id}" aria-label="${esc(g.title)}" title="${esc(g.title)}" style="background:linear-gradient(135deg,${g.colors[0]},${g.colors[1]})">${g.image ? `<img src="${g.image}" alt="" loading="lazy">` : `<span class="em">${g.emoji}</span>`}<span class="name">${esc(g.title)}</span>${isNew(g) ? `<span class="new">NEU</span>` : ""}${g.category ? favBtn(g) : ""}</a>`;

// ---- Spiel des Tages: wechselt jeden Tag um Mitternacht (deutsche Zeit), für alle gleich ----
function berlinDay() {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
// NEU-Schild: 7 Tage ab dem Datum "added" in games.js (Tag 0 bis Tag 6), danach automatisch weg.
function isNew(g, day = berlinDay()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(g.added || "");
  if (!m) return false;
  const age = day - Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
  return age >= 0 && age < 7;
}
function hashId(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
// Feste, gemischte Reihenfolge: jedes Spiel kommt einmal pro Runde dran, zwei Tage hintereinander nie dasselbe.
function gameOfTheDay(day = berlinDay()) {
  const pool = games.filter(g => g.daily !== false && g.image).sort((a, b) => hashId(a.id) - hashId(b.id));
  return pool[day % pool.length];
}
function heroHtml() {
  const g = gameOfTheDay();
  const date = new Date().toLocaleDateString("de-DE", { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long" });
  return `<a class="hero${g.wide ? "" : " sq"}" href="${g.url}" data-id="${g.id}" aria-label="Spiel des Tages: ${esc(g.title)}">
    <div class="hbg" style="background-image:url(${g.image})"></div>
    <div class="htxt"><span class="chip">${icon("flame")}Spiel des Tages</span><span class="hdate">${esc(date)}</span>
      <h1>${esc(g.title)}</h1><p>${esc(g.description)}</p><span class="play">${icon("play")}Jetzt spielen</span></div>
    <img src="${g.image}" alt="">
  </a>`;
}

function renderSide() {
  const used = [...new Set(games.map(g => g.category))];
  const cats = ["Alle", "__fav", ...CATORDER.filter(c => used.includes(c)), ...used.filter(c => !CATORDER.includes(c))];
  const collapsed = document.body.classList.contains("side-collapsed");
  side.innerHTML = `<div class="sidehead"><h3>Kategorien</h3><button class="toggle" type="button" aria-label="${collapsed ? "Seitenleiste ausklappen" : "Seitenleiste einklappen"}" aria-expanded="${!collapsed}" title="${collapsed ? "Ausklappen" : "Einklappen"}">${icon("panel")}</button></div>` + cats.map(c => {
    const n = c === "Alle" ? games.length : c === "__fav" ? favs.size : games.filter(g => g.category === c).length;
    const label = CATLABEL[c] || c;
    return `<button class="cat ${c === category ? "on" : ""}" data-c="${esc(c)}" title="${esc(label)} (${n})" aria-label="${esc(label)}, ${n} Spiele">${icon(CATICON[c])}<span class="lbl">${esc(label)}</span><span class="n">${n}</span></button>`;
  }).join("");
  side.querySelectorAll(".cat").forEach(b => b.onclick = () => { category = b.dataset.c; home(); });
  side.querySelector(".toggle").onclick = () => {
    const now = document.body.classList.toggle("side-collapsed");
    try { localStorage.setItem("moki-side", now ? "1" : "0"); } catch (e) {}
    renderSide();
  };
}

function home() {
  const q = search.value.trim().toLowerCase();
  const inCat = g => category === "Alle" || (category === "__fav" ? favs.has(g.id) : g.category === category);
  const list = games.filter(g => inCat(g) && g.title.toLowerCase().includes(q));
  renderSide();
  const title = category === "Alle" ? "Alle Spiele" : (CATLABEL[category] || category);
  const rec = recent.map(id => games.find(g => g.id === id)).filter(Boolean).slice(0, 6);
  const emptyMsg = category === "__fav" && !q ? `Noch keine Favoriten. Tippe bei einem Spiel auf den Stern, dann erscheint es hier.` : "Kein Spiel gefunden.";
  app.innerHTML = `
    ${!q && category === "Alle" ? heroHtml() : ""}
    ${!q && category === "Alle" && rec.length ? `<section>
      <h2>${icon("clock")}Zuletzt gespielt</h2>
      <div class="grid">${rec.map(tile).join("")}</div>
    </section>` : ""}
    <section>
      <h2>${esc(title)}</h2>
      <p class="sub">${list.length} ${list.length === 1 ? "Spiel" : "Spiele"}</p>
      ${list.length ? `<div class="grid">${list.map(tile).join("")}</div>` : `<p class="empty">${emptyMsg}</p>`}
    </section>
    ${!q && category === "Alle" && sites.length ? `<section>
      <h2>Weitere Seiten</h2>
      <p class="warn">${icon("alert")}<span>Achtung: Auf diesen Seiten funktionieren nicht alle Spiele. Wenn eins nicht lädt, probier ein anderes.</span></p>
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
  o.innerHTML = `<div class="box" role="dialog" aria-modal="true"><h3>${icon("alert")}Experimentell</h3><p>${esc(g.warning)}</p>
    <div class="acts"><button class="btn" data-a="no">Abbrechen</button><a class="btn go" href="${g.url}">Trotzdem öffnen</a></div></div>`;
  const close = () => o.remove();
  o.addEventListener("click", e => { if (e.target === o || e.target.dataset.a === "no") close(); });
  addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); removeEventListener("keydown", k); } });
  document.body.appendChild(o);
  o.querySelector(".go").addEventListener("click", () => recordPlay(g.id));
  o.querySelector(".go").focus();
}
function setFavUi(id) {
  const on = favs.has(id);
  document.querySelectorAll(`.fav[data-fav="${id}"]`).forEach(el => {
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", on);
    const t = (games.find(g => g.id === id) || {}).title || "";
    el.setAttribute("aria-label", t + (on ? " aus Favoriten entfernen" : " zu Favoriten hinzufügen"));
    el.title = on ? "Aus Favoriten entfernen" : "Zu Favoriten";
  });
}
function onFav(el) {
  const id = el.dataset.fav;
  toggleFav(id);
  setFavUi(id);
  renderSide();
  if (category === "__fav") home();   // Spiel verschwindet aus der Favoriten-Ansicht
}
function openGame(g) {   // Popup bei Warnung, sonst direkt öffnen
  if (g.warning) return warnDialog(g);
  recordPlay(g.id);
  location.href = g.url;
}
document.addEventListener("click", e => {
  const f = e.target.closest(".fav");
  if (f) { e.preventDefault(); e.stopPropagation(); onFav(f); return; }
  const t = e.target.closest("a[data-id]");
  if (!t) return;
  const g = [...games, ...sites].find(x => x.id === t.dataset.id);
  if (!g) return;
  if (g.warning && !(e.ctrlKey || e.metaKey || e.shiftKey)) { e.preventDefault(); warnDialog(g); return; }
  recordPlay(g.id);
});
document.addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("fav")) { e.preventDefault(); onFav(e.target); }
});
// Zufälliges Spiel
const rnd = document.getElementById("rnd");
if (rnd) rnd.addEventListener("click", () => {
  const pool = games.filter(g => g.id !== (recent[0] || ""));
  openGame(pool[Math.floor(Math.random() * pool.length)]);
});
// Zurück-Taste des Browsers: Liste "Zuletzt gespielt" neu laden
addEventListener("pageshow", e => { if (e.persisted) { recent = store.get("moki-recent", []).filter(id => known.has(id)); home(); } });
