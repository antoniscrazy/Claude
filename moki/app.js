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
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-1.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98 1.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
};
const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${SVG[n] || SVG.spiel}</svg>`;
const CATICON = { Alle: "alle", __fav: "star", __cre: "sparkles", Fahren: "fahren", Geschicklichkeit: "target", "Kampf & Schießen": "crosshair", Simulation: "simulation", Strategie: "strategie", Sport: "sport", Abenteuer: "abenteuer" };
const CATORDER = ["Fahren", "Geschicklichkeit", "Kampf & Schießen", "Simulation", "Strategie", "Sport", "Abenteuer"];
const CATLABEL = { Alle: "Alle", __fav: "Favoriten", __cre: "Kreationen" };

// ---- Kreationen (Spiele aus dem Studio). Wird von creations.js befüllt. ----
const CRE = window.MOKI_CRE = { list: [], loaded: false, error: false };
const studioUrl = () => (window.MOKI_CFG && window.MOKI_CFG.studioUrl) || "studio.html";
const creTile = c => `<a class="tile cre" href="#/spiel/${esc(c.slug)}" data-cre="${esc(c.slug)}" aria-label="${esc(c.title)} von ${esc(c.creator)}" title="${esc(c.title)} von ${esc(c.creator)}">${c.icon ? `<img src="${esc(c.icon)}" alt="" loading="lazy">` : ""}<span class="name">${esc(c.title)}<small class="by">von ${esc(c.creator)}</small></span></a>`;
const studioTile = () => `<a class="tile studio" href="${esc(studioUrl())}" aria-label="Im Studio ein eigenes Spiel bauen"><span class="stin">${icon("plus")}<b>Dein Spiel</b><small>Im Studio bauen</small></span></a>`;

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
const shareBtn = g => `<span class="shr" role="button" tabindex="0" data-share="${g.id}" aria-label="${esc(g.title)} mit Freunden teilen" title="Mit Freunden teilen">${icon("share")}</span>`;
let category = "Alle";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tile = g => `<a class="tile${g.wide ? " wide" : ""}" href="${g.url}" data-id="${g.id}" aria-label="${esc(g.title)}" title="${esc(g.title)}" style="background:linear-gradient(135deg,${g.colors[0]},${g.colors[1]})">${g.image ? `<img src="${g.image}" alt="" loading="lazy">` : `<span class="em">${g.emoji}</span>`}<span class="name">${esc(g.title)}</span>${isNew(g) ? `<span class="new">NEU</span>` : ""}${g.category ? favBtn(g) + shareBtn(g) : ""}</a>`;

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
  const cats = ["Alle", "__fav", "__cre", ...CATORDER.filter(c => used.includes(c)), ...used.filter(c => !CATORDER.includes(c))];
  const collapsed = document.body.classList.contains("side-collapsed");
  side.innerHTML = `<div class="sidehead"><h3>Kategorien</h3><button class="toggle" type="button" aria-label="${collapsed ? "Seitenleiste ausklappen" : "Seitenleiste einklappen"}" aria-expanded="${!collapsed}" title="${collapsed ? "Ausklappen" : "Einklappen"}">${icon("panel")}</button></div>` + cats.map(c => {
    const n = c === "Alle" ? games.length : c === "__fav" ? favs.size : c === "__cre" ? CRE.list.length : games.filter(g => g.category === c).length;
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

const creMatches = q => CRE.list.filter(c => !q || c.title.toLowerCase().includes(q) || c.creator.toLowerCase().includes(q));

function homeCre(q) {
  const cm = creMatches(q);
  app.innerHTML = `<section>
    <h2>${icon("sparkles")}Kreationen</h2>
    <p class="sub">${cm.length} ${cm.length === 1 ? "Spiel" : "Spiele"} · selbstgemacht im Moki Studio</p>
    <div class="grid">${cm.map(creTile).join("")}${q ? "" : studioTile()}</div>
    ${cm.length ? "" : `<p class="empty">${!CRE.loaded ? "Lade Kreationen …" : CRE.error ? "Kreationen konnten gerade nicht geladen werden." : q ? "Kein Spiel gefunden." : "Hier ist noch nichts. Sei der Erste: Bau dein Spiel im Studio."}</p>`}
  </section>`;
}

function home() {
  const q = search.value.trim().toLowerCase();
  renderSide();
  if (category === "__cre") return homeCre(q);
  const inCat = g => category === "Alle" || (category === "__fav" ? favs.has(g.id) : g.category === category);
  const list = games.filter(g => inCat(g) && g.title.toLowerCase().includes(q));
  const title = category === "Alle" ? "Alle Spiele" : (CATLABEL[category] || category);
  const rec = recent.map(id => games.find(g => g.id === id)).filter(Boolean).slice(0, 6);
  const emptyMsg = category === "__fav" && !q ? `Noch keine Favoriten. Tippe bei einem Spiel auf den Stern, dann erscheint es hier.` : "Kein Spiel gefunden.";
  const cm = category === "Alle" ? creMatches(q) : [];
  const creSec = category !== "Alle" ? "" : q
    ? (cm.length ? `<section><h2>${icon("sparkles")}Kreationen</h2><div class="grid">${cm.map(creTile).join("")}</div></section>` : "")
    : `<section>
      <h2>${icon("sparkles")}Kreationen</h2>
      <p class="sub">Selbstgemachte Spiele aus dem Moki Studio</p>
      <div class="grid">${cm.slice(0, 5).map(creTile).join("")}${studioTile()}</div>
      ${cm.length > 5 ? `<button class="btn more" data-cat="__cre" type="button">Alle ${cm.length} Kreationen ansehen</button>` : ""}
    </section>`;
  app.innerHTML = `
    ${!q && category === "Alle" ? megaHtml() + heroHtml() + challengeHtml() + trailerHtml() : ""}
    ${!q && category === "Alle" && rec.length ? `<section>
      <h2>${icon("clock")}Zuletzt gespielt</h2>
      <div class="grid">${rec.map(tile).join("")}</div>
    </section>` : ""}
    <section>
      <h2>${esc(title)}</h2>
      <p class="sub">${list.length} ${list.length === 1 ? "Spiel" : "Spiele"}</p>
      ${list.length ? `<div class="grid">${list.map(tile).join("")}</div>` : `<p class="empty">${emptyMsg}</p>`}
    </section>
    ${creSec}
    ${!q && category === "Alle" && sites.length ? `<section>
      <h2>Weitere Seiten</h2>
      <p class="warn">${icon("alert")}<span>Achtung: Auf diesen Seiten funktionieren nicht alle Spiele. Wenn eins nicht lädt, probier ein anderes.</span></p>
      <div class="grid">${sites.map(tile).join("")}</div>
    </section>` : ""}`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-cat]");
  if (b) { category = b.dataset.cat; home(); window.scrollTo(0, 0); }
});

search.addEventListener("input", home);
document.title = "Moki – Spiele";

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
  const sh = e.target.closest("[data-share]");
  if (sh) { e.preventDefault(); e.stopPropagation(); shareGame(sh.dataset.share); return; }
  const tr = e.target.closest("[data-trl]");
  if (tr) { e.preventDefault(); playTrailer(tr); return; }
  const ch = e.target.closest("[data-ch]");
  if (ch) { e.preventDefault(); onChallenge(ch.dataset.ch); return; }
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
  if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("shr")) { e.preventDefault(); shareGame(e.target.dataset.share); }
});
// Zufälliges Spiel
const rnd = document.getElementById("rnd");
if (rnd) rnd.addEventListener("click", () => {
  const pool = games.filter(g => g.id !== (recent[0] || ""));
  openGame(pool[Math.floor(Math.random() * pool.length)]);
});
// Zurück-Taste des Browsers: Liste "Zuletzt gespielt" neu laden
addEventListener("pageshow", e => { if (e.persisted) { recent = store.get("moki-recent", []).filter(id => known.has(id)); home(); } });

// ====================================================================
// Freunde einladen (Teilen) und Wochenchallenge
// ====================================================================
const mokiBase = () => ((window.MOKI_CFG && window.MOKI_CFG.mokiUrl) || location.href.split("#")[0]).replace(/\/?$/, "/");
const gameLink = id => mokiBase() + "#/g/" + id;
function mtoast(msg) {
  const t = document.createElement("div"); t.className = "mtoast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.classList.add("out"), 2200); setTimeout(() => t.remove(), 2700);
}
function copyText(txt) {
  const ok = () => mtoast("Link kopiert");
  const fb = () => { const x = document.createElement("textarea"); x.value = txt; x.style.position = "fixed"; x.style.opacity = "0"; document.body.appendChild(x); x.select(); try { document.execCommand("copy"); ok(); } catch (e) { mtoast("Kopieren nicht möglich"); } x.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fb); else fb();
}
// Allgemeiner Teilen-Dialog: { head, title, image, text, url }
const MOKI_ICON_SVG = '<svg viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="mig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00e5a8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient></defs><rect width="128" height="128" rx="30" fill="#0a0d2b"/><circle cx="64" cy="64" r="34" fill="none" stroke="url(#mig)" stroke-width="20"/><path d="M55 49L79 64L55 79Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></svg>';
function shareDialog(o) {
  const msg = o.text + " " + o.url;
  const enc = encodeURIComponent;
  const el = document.createElement("div"); el.className = "modal";
  el.innerHTML = `<div class="box shbox" role="dialog" aria-modal="true" aria-label="${esc(o.head)}">
    <h3>${icon("share")}${esc(o.head)}</h3>
    <div class="shgame">${o.svg ? `<span class="shicon">${o.svg}</span>` : o.image ? `<img src="${esc(o.image)}" alt="">` : ""}<div><b>${esc(o.title)}</b><span>${esc(o.sub || "")}</span></div></div>
    <p class="shmsg">${esc(o.text)}</p>
    <div class="shlink"><input type="text" readonly value="${esc(o.url)}" aria-label="Link"><button class="btn go" data-a="copy" type="button">${icon("link")}Kopieren</button></div>
    <div class="shbtns">
      <a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${enc(msg)}">WhatsApp</a>
      <a class="btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=${enc(o.url)}&text=${enc(o.text)}">Telegram</a>
      <a class="btn" href="mailto:?subject=${enc(o.title)}&body=${enc(msg)}">E-Mail</a>
      ${navigator.share ? `<button class="btn" data-a="native" type="button">Weitere …</button>` : ""}
    </div>
    <div class="acts"><button class="btn" data-a="no" type="button">Schließen</button></div></div>`;
  const close = () => { el.remove(); removeEventListener("keydown", onKey); };
  const onKey = e => { if (e.key === "Escape") close(); };
  addEventListener("keydown", onKey);
  el.addEventListener("click", e => {
    if (e.target === el || e.target.closest("[data-a=no]")) return close();
    if (e.target.closest("[data-a=copy]")) copyText(o.url);
    if (e.target.closest("[data-a=native]")) navigator.share({ title: o.title, text: o.text, url: o.url }).catch(() => {});
  });
  document.body.appendChild(el);
  el.querySelector("[data-a=copy]").focus();
  return el;
}
function shareGame(id) {
  const g = games.find(x => x.id === id); if (!g) return;
  shareDialog({ head: "Mit Freunden spielen", title: g.title, sub: g.category, image: g.image, text: `Komm, wir zocken ${g.title} auf Moki. Läuft direkt im Browser, ohne Werbung.`, url: gameLink(g.id) });
}
const inv = document.getElementById("inv");
if (inv) inv.addEventListener("click", () => shareDialog({ head: "Freunde einladen", title: "Moki", sub: games.length + " Spiele", svg: MOKI_ICON_SVG, text: `Ich spiele auf Moki: ${games.length} Spiele direkt im Browser, ohne Werbung.`, url: mokiBase() }));
// Eingehender Link #/g/<id>: Einladung anzeigen
function handleInvite() {
  const m = /^#\/g\/([a-z0-9-]{1,60})\/?$/i.exec(location.hash); if (!m) return;
  const clear = () => history.replaceState(null, "", location.pathname + location.search);
  const g = games.find(x => x.id === m[1].toLowerCase());
  if (!g) return clear();
  const el = document.createElement("div"); el.className = "modal";
  el.innerHTML = `<div class="box shbox" role="dialog" aria-modal="true"><h3>${icon("share")}Ein Freund hat dir ein Spiel geschickt</h3>
    <div class="shgame big">${g.image ? `<img src="${esc(g.image)}" alt="">` : ""}<div><b>${esc(g.title)}</b><span>${esc(g.category || "")}</span></div></div>
    <p class="shmsg">${esc(g.description)}</p>
    <div class="acts"><button class="btn" data-a="no" type="button">Alle Spiele ansehen</button><a class="btn go" data-a="go" href="${g.url}">${icon("play")}Jetzt spielen</a></div></div>`;
  const close = () => { el.remove(); clear(); };
  el.addEventListener("click", e => {
    if (e.target === el || e.target.closest("[data-a=no]")) return close();
    if (e.target.closest("[data-a=go]")) { e.preventDefault(); clear(); openGame(g); }
  });
  document.body.appendChild(el); el.querySelector("[data-a=go]").focus();
}
addEventListener("hashchange", handleInvite);
handleInvite();

// ---- Wochenchallenge: jede Woche (Montag bis Sonntag, deutsche Zeit) ein Spiel mit einer Aufgabe ----
const CHALLENGES = [
  "Knack deinen eigenen Rekord.", "Spiel drei Runden hintereinander, ohne aufzugeben.", "Schaff eine Runde ohne einen einzigen Fehler.",
  "Hol dir einen neuen persönlichen Bestwert.", "Spiel eine Runde mit nur einer Hand.", "Fordere einen Freund heraus und schlag seinen Wert.",
  "Spiel so lange, bis du dein bestes Ergebnis geknackt hast.", "Übertriff deinen letzten Versuch, auch wenn es nur knapp ist.",
  "Schaff deine beste Runde, die du bisher hattest.", "Spiel zehn Minuten am Stück und merk dir deinen besten Wert."
];
const weekIdx = (d = berlinDay()) => Math.floor((d + 3) / 7);   // Montag-Wochen (1.1.1970 war ein Donnerstag)
function weekGame(w = weekIdx()) {
  const pool = games.filter(g => g.daily !== false && g.image).sort((a, b) => hashId(a.id + "w") - hashId(b.id + "w"));
  return pool[w % pool.length];
}
const weekTask = (w = weekIdx()) => CHALLENGES[(w * 7 + 3) % CHALLENGES.length];
const chDone = () => store.get("moki-chal", {});
function chStreak() {   // zusammenhängende erledigte Wochen bis jetzt (laufende Woche zählt nur, wenn erledigt)
  const d = chDone(); let w = weekIdx(), n = 0;
  if (!d[w]) w--;
  while (d[w]) { n++; w--; }
  return n;
}
function chLeft() {
  const parts = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = +parts.find(p => p.type === "hour").value % 24, mi = +parts.find(p => p.type === "minute").value;
  const mins = ((weekIdx() + 1) * 7 - 3 - berlinDay()) * 1440 - (h * 60 + mi);
  const dd = Math.floor(mins / 1440), hh = Math.floor((mins % 1440) / 60), mm = mins % 60;
  return dd > 0 ? `noch ${dd} ${dd === 1 ? "Tag" : "Tage"} ${hh} Std.` : hh > 0 ? `noch ${hh} Std. ${mm} Min.` : `noch ${mm} Min.`;
}
function challengeHtml() {
  const g = weekGame(), w = weekIdx(), done = !!chDone()[w], s = chStreak();
  if (!g) return "";
  return `<section class="chal${done ? " done" : ""}" aria-label="Wochenchallenge">
    <div class="cimg">${g.image ? `<img src="${g.image}" alt="">` : ""}</div>
    <div class="ctxt"><span class="chip">${icon("trophy")}Wochenchallenge</span><span class="cleft" id="chal-left">${chLeft()}</span>
      <h2>${esc(g.title)}</h2><p>${esc(weekTask(w))}</p>
      <small>${s ? `${icon("flame")} Serie: ${s} ${s === 1 ? "Woche" : "Wochen"} in Folge. ` : ""}Ob du es geschafft hast, sagst du selbst an. Moki kann die Ergebnisse der Spiele nicht messen.</small></div>
    <div class="cact"><button class="btn go" data-ch="start" type="button">${icon("play")}Challenge starten</button>
      <button class="btn" data-ch="done" type="button" aria-pressed="${done}">${icon("check")}${done ? "Geschafft" : "Als geschafft markieren"}</button>
      <button class="btn" data-ch="invite" type="button">${icon("share")}Freund herausfordern</button></div></section>`;
}
function onChallenge(act) {
  const g = weekGame(), w = weekIdx();
  if (act === "start") return openGame(g);
  if (act === "done") { const d = chDone(); d[w] ? delete d[w] : d[w] = 1; store.set("moki-chal", d); home(); if (d[w]) mtoast("Challenge geschafft. Stark!"); return; }
  if (act === "invite") shareDialog({ head: "Freund herausfordern", title: g.title, sub: "Wochenchallenge", image: g.image, text: `Ich fordere dich heraus: ${weekTask(w)} Spiel ${g.title} auf Moki.`, url: gameLink(g.id) });
}
setInterval(() => { const el = document.getElementById("chal-left"); if (el) el.textContent = chLeft(); }, 60000);

// ---- Timer bis zum Mega-Update: 2. Dezember 2026, 00:00 Uhr deutsche Zeit (Dezember = UTC+1) ----
const MEGA_AT = new Date("2026-12-02T00:00:00+01:00").getTime();
const megaWhen = () => "Am 2. Dezember 2026 um 00:00 Uhr. Der Timer läuft schon.";
function megaParts() {
  const ms = MEGA_AT - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
}
function megaDigits() {
  const p = megaParts() || { d: 0, h: 0, m: 0, s: 0 };
  const box = (k, label) => `<div class="mdig"><b data-mega="${k}">${String(p[k]).padStart(2, "0")}</b><span>${label}</span></div>`;
  return `<div class="mtimer" role="timer" aria-label="Zeit bis zum Mega-Update">${box("d", "Tage")}${box("h", "Std.")}${box("m", "Min.")}${box("s", "Sek.")}</div>`;
}
function megaHtml() {
  if (!megaParts()) return "";
  return `<section class="mega" aria-label="Mega-Update">
    <div class="mtxt"><span class="chip">${icon("sparkles")}Mega-Update</span><h2>Über 100 Spiele kommen</h2><p>${esc(megaWhen())}</p></div>
    <div class="mq" aria-hidden="true"><i>?</i><i>?</i><i>?</i><i>?</i></div>${megaDigits()}</section>`;
}
setInterval(() => {
  const p = megaParts();
  if (!p) { document.querySelectorAll(".mega").forEach(e => e.remove()); return; }
  document.querySelectorAll("[data-mega]").forEach(e => { e.textContent = String(p[e.dataset.mega]).padStart(2, "0"); });
}, 1000);

// ---- Moki-Trailer: YouTube, laedt erst nach dem Klick (vorher wird nichts von YouTube geladen) ----
const TRAILER_ID = "QjldhlgWFlk";
function trailerHtml() {
  return `<section class="trl" aria-label="Moki-Trailer">
    <button class="trlv" type="button" data-trl="play" aria-label="Moki-Trailer abspielen"><img src="trailer-poster.jpg" alt=""><span class="trlp">${icon("play")}</span></button>
    <div class="trlt"><span class="chip">${icon("flame")}Trailer</span><h2>Der Moki-Trailer</h2>
      <p>Alle Funktionen, die neuen Spiele und ein Blick auf das Mega-Update.</p>
      <small>Das Video liegt bei YouTube. Erst wenn du auf Play drückst, öffnet es sich im Vollbild und es wird etwas von dort geladen.</small>
      <a class="btn" href="https://www.youtube.com/watch?v=${TRAILER_ID}" target="_blank" rel="noopener">Auf YouTube ansehen</a></div></section>`;
}
function playTrailer() { showTrailerOverlay(true); }

// ---- Trailer im Vollbild-Overlay: startet beim ersten Besuch automatisch (zuerst ohne Ton, ein Klick holt Ton und echtes Vollbild) ----
const TRAILER_KEY = "moki-trailer-v1";
function trailerSeen() { return store.get(TRAILER_KEY, 0) === 1; }
function showTrailerOverlay(byClick) {   // byClick: kam von einem Klick, dann geht Ton und Vollbild sofort
  return new Promise(resolve => {
    store.set(TRAILER_KEY, 1);
    const el = document.createElement("div"); el.id = "trlfs"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Moki-Trailer");
    el.innerHTML = `<iframe title="Moki-Trailer" src="https://www.youtube-nocookie.com/embed/${TRAILER_ID}?autoplay=1&mute=${byClick ? 0 : 1}&controls=1&rel=0&playsinline=1&enablejsapi=1&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <button class="btn trlfs-skip" type="button" data-a="skip">Überspringen</button>
      ${byClick ? "" : `<button class="btn go trlfs-sound" type="button" data-a="sound">${icon("play")}Ton an und Vollbild</button>`}`;
    const fr = el.querySelector("iframe");
    const send = (func, args) => { try { fr.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: args || [] }), "*"); } catch (e) {} };
    let done = false;
    const close = () => {
      if (done) return; done = true;
      removeEventListener("keydown", onKey); removeEventListener("message", onMsg);
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
      fr.src = "about:blank"; el.remove(); resolve();
    };
    const onKey = e => { if (e.key === "Escape") close(); };
    const onMsg = e => {   // Ende des Videos erkennen
      if (e.source !== fr.contentWindow) return;
      let d = e.data; if (typeof d === "string") { try { d = JSON.parse(d); } catch (x) { return; } }
      if (d && d.event === "onStateChange" && d.info === 0) close();
      if (d && d.event === "infoDelivery" && d.info && d.info.playerState === 0) close();
    };
    addEventListener("keydown", onKey); addEventListener("message", onMsg);
    fr.addEventListener("load", () => {
      try { fr.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*"); } catch (e) {}
      send("addEventListener", ["onStateChange"]);
    });
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "skip") return close();
      if (b.dataset.a === "sound") {
        send("unMute"); send("setVolume", [100]); send("playVideo");
        b.remove();
        try { if (el.requestFullscreen) el.requestFullscreen(); } catch (x) {}
      }
    });
    document.body.appendChild(el);
    if (byClick) { try { if (el.requestFullscreen) el.requestFullscreen(); } catch (x) {} }
    else el.querySelector("[data-a=sound]").focus({ preventScroll: true });
  });
}
if (/[?&]trailer(=1)?(&|$)/.test(location.search) && !document.documentElement.classList.contains("intro-on")) showTrailerOverlay();

home();   // erster Aufbau erst hier, damit alle Funktionen oben bereit sind

// ---- Eingebaute Spiele (Launcher-Huellen): Hash "#/play/<id>" oeffnet das Spiel im Vollbild-Player ----
function openPlayer(id) {
  const html = (window.MOKI_LAUNCH || {})[id];
  if (!html) { if (location.hash.startsWith("#/play/")) history.replaceState(null, "", location.pathname + location.search); return; }
  closePlayer(true);
  const el = document.createElement("div"); el.id = "player"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Spiel");
  el.innerHTML = `<iframe title="Spiel" allow="autoplay; fullscreen; gamepad; pointer-lock"></iframe>`;
  el.querySelector("iframe").srcdoc = html;
  document.body.appendChild(el);
  document.documentElement.classList.add("player-open");
}
function closePlayer(silent) {
  const el = document.getElementById("player");
  if (el) el.remove();
  document.documentElement.classList.remove("player-open");
  if (!silent && location.hash.startsWith("#/play/")) history.replaceState(null, "", location.pathname + location.search);
}
function playerFromHash() {
  const m = /^#\/play\/([a-z0-9-]{1,60})\/?$/i.exec(location.hash);
  if (m) openPlayer(m[1].toLowerCase()); else closePlayer(true);
}
addEventListener("hashchange", playerFromHash);
addEventListener("message", e => { if (e.data === "moki-close") closePlayer(); });
addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("player")) closePlayer(); });
playerFromHash();
