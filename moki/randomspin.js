// Zufallsspiel mit Animation: Der "Zufallsgenerator" laeuft ueber alle Spiele, die Kacheln in seiner Naehe werden groesser,
// die Kamera (Scrollen) folgt ihm. Waehrenddessen ist die Seite gesperrt. Er wird langsamer und bleibt beim Gewinner stehen,
// der gross in die Mitte kommt. Danach wird das Spiel geoeffnet. app.js ruft window.mokiSpin(gewinner, fertig) auf.
(function () {
  "use strict";
  const root = document.documentElement;
  let running = false;

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const TAIL = 22, MIN_STEPS = 55;     // die letzten 22 Kacheln werden immer langsamer, davor mindestens 33 schnelle

  window.mokiSpin = function (winner, done) {
    if (running) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
    running = true;
    // ---------- Sperre ----------
    const lock = document.createElement("div"); lock.id = "rz";
    lock.setAttribute("aria-hidden", "true");
    document.body.appendChild(lock);
    root.classList.add("rz-on");
    try { document.activeElement && document.activeElement.blur(); } catch (e) {}
    const stop = e => { e.preventDefault(); e.stopPropagation(); };
    const evs = ["wheel", "touchmove", "keydown", "keyup", "click", "mousedown", "contextmenu"];
    evs.forEach(ev => addEventListener(ev, stop, { capture: true, passive: false }));
    const sr = document.createElement("div"); sr.className = "mi-sr"; sr.setAttribute("role", "status"); sr.textContent = "Zufallsspiel wird ausgewählt"; document.body.appendChild(sr);

    const cleanup = () => {
      evs.forEach(ev => removeEventListener(ev, stop, { capture: true, passive: false }));
      root.classList.remove("rz-on");
      lock.remove(); sr.remove();
      document.querySelectorAll(".rz-card,.rz-fx").forEach(e => e.remove());
      running = false;
    };
    const hard = setTimeout(cleanup, 45000);   // Notbremse

    (async function run() {
      // Der Gewinner steht sofort fest: Karte erscheint gross in der Mitte, dann oeffnet sich das Spiel
      const size = Math.min(innerWidth * .8, innerHeight * .5, 440);
      const card = document.createElement("div"); card.className = "rz-card";
      card.innerHTML = `<span class="rz-chip">Dein Zufallsspiel</span><div class="rz-img"><img src="${esc(winner.image || "")}" alt=""></div><b>${esc(winner.title)}</b><small>${esc(winner.category || "")}</small><div class="rz-bar"><i></i></div>`;
      card.style.setProperty("--s", size + "px");
      document.body.appendChild(card);
      const img = card.querySelector(".rz-img"), fx = document.createElement("div"); fx.className = "rz-fx";
      // Flug von der Kachel in die Mitte (FLIP)
      const cx = innerWidth / 2, cy = innerHeight / 2 - 30;
      card.style.left = cx + "px"; card.style.top = cy + "px";
      card.animate([{ transform: "translate(-50%,-50%) scale(.3) rotate(-8deg)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.14) rotate(-3deg)", opacity: 1, offset: .65 }, { transform: "translate(-50%,-50%) scale(1) rotate(0)", opacity: 1 }], { duration: 700, easing: "cubic-bezier(.2,.9,.25,1)", fill: "forwards" });
      await sleep(550);
      // Ringe und Funken
      document.body.appendChild(fx);
      for (let i = 0; i < 3; i++) { const ring = document.createElement("i"); ring.className = "rz-ring"; ring.style.left = cx + "px"; ring.style.top = cy + "px"; ring.style.animationDelay = i * .18 + "s"; fx.appendChild(ring); }
      for (let i = 0; i < 46; i++) {
        const sp = document.createElement("i"); sp.className = "rz-spark"; const a = Math.random() * 6.283, d = 160 + Math.random() * Math.max(innerWidth, innerHeight) * .45;
        sp.style.cssText = `left:${cx}px;top:${cy}px;--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--c:${["#00e5a8", "#ffd23f", "#ffffff", "#3da5ff", "#ff4d8d"][i % 5]};animation-delay:${Math.random() * .15}s`;
        fx.appendChild(sp);
      }
      card.classList.add("rz-go");
      await sleep(2000);
      // 4) Spiel oeffnen
      clearTimeout(hard); cleanup(); done();
    })().catch(() => { clearTimeout(hard); cleanup(); done(); });
  };
})();
