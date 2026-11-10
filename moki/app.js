const games = window.MOKI_GAMES;
const app = document.getElementById("app");
const search = document.getElementById("q");
let category = "Alle";

const tile = g => `<a class="tile" href="${g.url}" style="background:linear-gradient(135deg,${g.colors[0]},${g.colors[1]})">${g.image ? `<img src="${g.image}" alt="">` : `<span class="em">${g.emoji}</span>`}<span class="name">${g.title}</span></a>`;
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
    ${list.length ? `<div class="grid">${list.map(g => tile(g)).join("")}</div>` : `<p class="empty">Kein Spiel gefunden.</p>`}`;
  app.querySelectorAll(".chip").forEach(b => b.onclick = () => { category = b.dataset.c; home(); });
}

function route() {
  document.title = "Moki – Spiele";
  home();
}
search.addEventListener("input", () => { home(); });
addEventListener("hashchange", route);
route();
