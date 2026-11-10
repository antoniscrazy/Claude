const games = window.MOKI_GAMES;
const app = document.getElementById("app");
const search = document.getElementById("q");
let category = "Alle";

const tile = (g, big) => `<a class="tile" href="#/spiel/${g.id}" style="background:linear-gradient(135deg,${g.colors[0]},${g.colors[1]})"><span class="em">${g.emoji}</span><span class="name">${g.title}</span></a>`;
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

function play(id) {
  const g = games.find(x => x.id === id);
  if (!g) return location.hash = "#/";
  document.title = g.title + " – Moki";
  const others = games.filter(x => x.id !== id);
  app.innerHTML = `
    <a class="back" href="#/">← Zurück zu Moki</a>
    <div class="play">
      <div>
        <div class="frame"><iframe id="f" src="${g.url}" allow="fullscreen; autoplay; gamepad" allowfullscreen title="${esc(g.title)}"></iframe></div>
        <div class="bar"><h1>${g.emoji} ${esc(g.title)}</h1>
          <button class="btn" id="fs">⛶ Vollbild</button><button class="btn" id="rl">↻ Neu laden</button></div>
      </div>
      <aside class="side"><strong>Über das Spiel</strong><p>${esc(g.description)}</p>
        ${others.length ? `<h2 style="font-size:16px;margin-top:22px">Mehr Spiele</h2><div class="grid" style="grid-template-columns:1fr 1fr">${others.map(x => tile(x)).join("")}</div>` : ""}
      </aside>
    </div>`;
  const f = document.getElementById("f");
  document.getElementById("fs").onclick = () => f.requestFullscreen?.();
  document.getElementById("rl").onclick = () => { f.src = g.url; };
}

function route() {
  const m = location.hash.match(/^#\/spiel\/(.+)$/);
  window.scrollTo(0, 0);
  if (m) return play(m[1]);
  document.title = "Moki – Spiele";
  home();
}
search.addEventListener("input", () => { if (location.hash.startsWith("#/spiel")) location.hash = "#/"; else home(); });
addEventListener("hashchange", route);
route();
