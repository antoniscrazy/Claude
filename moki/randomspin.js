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
    // Immer in der Ansicht "Alle Spiele" ohne Suche, damit der Generator ueber alle Spiele laeuft
    try {
      if (category !== "Alle" || search.value.trim()) { category = "Alle"; search.value = ""; home(); }
    } catch (e) { running = false; done(); return; }
    const tiles = [...document.querySelectorAll("#mainGrid .tile[data-id]")];
    const n = tiles.length, w = tiles.findIndex(t => t.dataset.id === winner.id);
    if (n < 8 || w < 0) { running = false; done(); return; }

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

    const center = el => { const r = el.getBoundingClientRect(); return r.top + scrollY + r.height / 2; };
    let cam = scrollY, camTarget = scrollY, raf = 0;
    const camLoop = () => {   // Kamera gleitet weich zum Ziel
      cam += (camTarget - cam) * .16; scrollTo(0, cam);
      raf = requestAnimationFrame(camLoop);
    };
    camLoop();
    const look = el => { camTarget = Math.max(0, center(el) - innerHeight / 2); };

    let cur = -1;
    const mark = i => {
      if (cur >= 0) tiles[cur].classList.add("rz-seen");
      tiles.forEach(t => t.classList.remove("rz-h", "rz-n1", "rz-n2", "rz-l1"));
      const at = k => tiles[((k % n) + n) % n];
      at(i).classList.remove("rz-seen"); at(i).classList.add("rz-h");
      at(i - 1).classList.add("rz-n1"); at(i - 2).classList.add("rz-n2"); at(i + 1).classList.add("rz-l1");
      cur = i; look(at(i));
    };

    // Der Lauf startet sofort bei der Kachel, die gerade in der Bildschirmmitte liegt, und endet beim Gewinner
    let s0 = 0, bd = 1e9;
    tiles.forEach((tl, i) => { const r = tl.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - innerHeight / 2) + Math.abs(r.left + r.width / 2 - innerWidth / 2) * .3; if (d < bd) { bd = d; s0 = i; } });
    let STEPS = ((w - s0) % n + n) % n; if (STEPS < MIN_STEPS) STEPS += n;
    const head = STEPS - TAIL, stepTimes = [0];
    for (let k = 1; k <= STEPS; k++) { const iv = k <= head ? 26 + 40 * Math.pow(k / head, 2) : 90 + 250 * Math.pow((k - head) / TAIL, 3); stepTimes.push(stepTimes[k - 1] + iv); }
    const cleanup = () => {
      cancelAnimationFrame(raf);
      evs.forEach(ev => removeEventListener(ev, stop, { capture: true, passive: false }));
      tiles.forEach(t => t.classList.remove("rz-h", "rz-n1", "rz-n2", "rz-l1", "rz-seen", "rz-win", "rz-dim"));
      root.classList.remove("rz-on");
      lock.remove(); sr.remove();
      document.querySelectorAll(".rz-card,.rz-fx").forEach(e => e.remove());
      running = false;
    };
    const hard = setTimeout(cleanup, 45000);   // Notbremse

    (async function run() {
      // Der Generator laeuft sofort los und wird zum Ende immer langsamer
      const t0 = performance.now();
      let k = -1;
      await new Promise(res => {
        (function frame() {
          const el = performance.now() - t0;
          let s = k < 0 ? 0 : k; while (s < STEPS && stepTimes[s + 1] <= el) s++;
          if (s !== k) { k = s; mark((s0 + k) % n); }
          if (k >= STEPS && el >= stepTimes[STEPS] + 450) res(); else requestAnimationFrame(frame);
        })();
      });
      // 3) Gewinner: alles andere tritt zurueck, die Kachel fliegt gross in die Mitte
      const wt = tiles[w]; wt.classList.add("rz-win");
      look(wt); await sleep(900);
      const r = wt.getBoundingClientRect(), size = Math.min(innerWidth * .8, innerHeight * .5, 440);
      const card = document.createElement("div"); card.className = "rz-card";
      card.innerHTML = `<span class="rz-chip">Dein Zufallsspiel</span><div class="rz-img"><img src="${esc(winner.image || "")}" alt=""></div><b>${esc(winner.title)}</b><small>${esc(winner.category || "")}</small><div class="rz-bar"><i></i></div>`;
      card.style.setProperty("--s", size + "px");
      document.body.appendChild(card);
      const img = card.querySelector(".rz-img"), fx = document.createElement("div"); fx.className = "rz-fx";
      // Flug von der Kachel in die Mitte (FLIP)
      const cx = innerWidth / 2, cy = innerHeight / 2 - 30;
      card.style.left = cx + "px"; card.style.top = cy + "px";
      const dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy, sc0 = r.width / size;
      card.animate([{ transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(${sc0})`, opacity: .2 }, { transform: "translate(-50%,-50%) scale(1.14) rotate(-3deg)", opacity: 1, offset: .65 }, { transform: "translate(-50%,-50%) scale(1) rotate(0)", opacity: 1 }], { duration: 900, easing: "cubic-bezier(.2,.9,.25,1)", fill: "forwards" });
      await sleep(700);
      // Ringe und Funken
      document.body.appendChild(fx);
      for (let i = 0; i < 3; i++) { const ring = document.createElement("i"); ring.className = "rz-ring"; ring.style.left = cx + "px"; ring.style.top = cy + "px"; ring.style.animationDelay = i * .18 + "s"; fx.appendChild(ring); }
      for (let i = 0; i < 46; i++) {
        const sp = document.createElement("i"); sp.className = "rz-spark"; const a = Math.random() * 6.283, d = 160 + Math.random() * Math.max(innerWidth, innerHeight) * .45;
        sp.style.cssText = `left:${cx}px;top:${cy}px;--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--c:${["#00e5a8", "#ffd23f", "#ffffff", "#3da5ff", "#ff4d8d"][i % 5]};animation-delay:${Math.random() * .15}s`;
        fx.appendChild(sp);
      }
      card.classList.add("rz-go");
      await sleep(2300);
      // 4) Spiel oeffnen
      clearTimeout(hard); cleanup(); done();
    })().catch(() => { clearTimeout(hard); cleanup(); done(); });
  };
})();
