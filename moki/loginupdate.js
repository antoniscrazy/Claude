// Update-Bildschirm zum Moki-Konto: erklaert Schritt fuer Schritt, wie alles geht. Erscheint genau einmal pro Browser,
// kann nicht weggeklickt werden (jede Seite muss gelesen werden) und zeigt die echten Moki-Elemente (Kopfzeile, Anmeldefenster).
// Wer das Intro (Cutscene) noch nicht gesehen hat, bekommt erst das Intro und danach diese Erklaerung.
(function () {
  "use strict";
  const KEY = "moki-update-login-v1", root = document.documentElement, WAIT = 3;   // Sekunden, bevor "Weiter" geht
  const seen = () => { try { if (localStorage.getItem(KEY)) return true; } catch (e) {} try { if (sessionStorage.getItem(KEY)) return true; } catch (e) {} try { return document.cookie.indexOf(KEY + "=1") > -1; } catch (e) { return false; } };
  const mark = () => { try { localStorage.setItem(KEY, "1"); } catch (e) {} try { sessionStorage.setItem(KEY, "1"); } catch (e) {} try { document.cookie = KEY + "=1; max-age=31536000; path=/; SameSite=Lax"; } catch (e) {} };
  if (seen()) return;
  try { if (localStorage.getItem("moki-acc")) { mark(); return; } } catch (e) {}   // wer schon ein Konto hat, braucht die Erklaerung nicht
  const forced = /[?&]update(=1)?(&|$)/.test(location.search);   // zum Testen: ?update

  const SL = [
    { t: "Neu: Moki-Konten", c: "Update", p: "Ab jetzt kannst du dir ein eigenes Moki-Konto machen. Dein Fortschritt in den Spielen wird gesichert und ist auf jedem Gerät da, auf dem du dich anmeldest.", l: ["Du brauchst nur einen Namen und ein Passwort.", "Du bist danach sofort angemeldet und bleibst es in diesem Browser.", "Auf den nächsten Seiten erkläre ich dir alles Schritt für Schritt. Das dauert etwa eine Minute."], v: "hero" },
    { t: "1. Anmelden öffnen", c: "Schritt 1", p: "Oben in der Kopfzeile findest du den Knopf „Anmelden“, direkt neben „Einladen“.", l: ["Tippe auf „Anmelden“. Es öffnet sich ein Fenster."], v: "header" },
    { t: "2. Konto erstellen", c: "Schritt 2", p: "So sieht das Fenster aus. Wechsle oben auf „Konto erstellen“.", l: ["Denk dir einen Namen aus: 3 bis 20 Zeichen, also Buchstaben, Zahlen, Leerzeichen, Punkt, Strich oder Unterstrich.", "Wähle ein Passwort mit mindestens 6 Zeichen.", "Tippe auf „Konto erstellen“. Fertig, du bist angemeldet und dein Name steht oben im Knopf."], v: "up" },
    { t: "3. Was wird gesichert?", c: "Schritt 3", p: "Moki sichert deinen Fortschritt von allein im Hintergrund. Du musst nichts drücken.", l: ["Spielstände wie Level, Münzen und Fortschritt, bei allen Spielen, die im Browser speichern.", "Deine Favoriten und deine zuletzt gespielten Spiele.", "Alles, was du auf Moki sammelst, zum Beispiel im Adventskalender.", "Gesichert wird, wenn du ein Spiel verlässt, alle paar Minuten und wenn du die Seite schließt. Es wird nur gesendet, was sich wirklich geändert hat, deshalb braucht es kaum Daten.", "Von Hand geht es so: Tippe auf deinen Namen und dann auf „Jetzt sichern“. Dort kannst du dich auch abmelden oder das Konto löschen."], v: "menu" },
    { t: "4. Auf einem anderen Gerät", c: "Schritt 4", p: "Du willst auf dem Tablet oder auf einem anderen Computer weiterspielen? Kein Problem.", l: ["Öffne Moki auf dem anderen Gerät und tippe auf „Anmelden“.", "Gib denselben Namen und dasselbe Passwort ein und tippe auf „Anmelden“.", "Deine Spielstände werden geladen. Danach startet die Seite einmal neu und alles ist da.", "Ab dann bleiben beide Geräte automatisch auf demselben Stand."], v: "in" },
    { t: "5. Das solltest du wissen", c: "Wichtig", p: "Damit nichts schiefgeht, merk dir diese Punkte:", l: ["Es gibt keine E-Mail. Darum kann dein Passwort nicht zurückgesetzt werden. Merk es dir gut oder schreib es auf.", "Gespeichert werden nur dein Name, dein Passwort (verschlüsselt) und deine Spielstände. Sonst nichts.", "Jedes Konto hat 4 MB Platz. Das reicht normalerweise locker. Unter deinem Namen siehst du, wie viel schon belegt ist.", "„Abmelden“ beendet nur die Anmeldung. Deine Spielstände bleiben auf dem Gerät und im Konto.", "„Konto löschen“ (mit Passwort) löscht alles, was im Konto gesichert ist. Auf dem Gerät bleibt alles.", "Manche Spiele speichern gar nichts. Da gibt es dann auch nichts zu sichern."], v: "info" },
    { t: "Los geht's!", c: "Fertig", p: "Jetzt weißt du alles. Erstelle dein Konto am besten gleich, dann ist dein Fortschritt von Anfang an sicher.", l: ["Du findest diese Erklärung später nicht wieder, aber du erreichst alles über den Knopf „Anmelden“ oben in der Kopfzeile.", "Viel Spaß beim Spielen!"], v: "end" }
  ];

  let el = null, i = 0, tm = 0; const visited = new Set();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const noIds = h => h.replace(/ id="[^"]*"/g, "");
  const A = () => (window.MOKI_ACC && window.MOKI_ACC.html) || null;
  // Echte Kopfzeile: die Elemente werden aus der Seite kopiert, damit alles genauso aussieht
  function realHeader(host) {
    const hd = document.createElement("div"); hd.className = "lu-hdr"; hd.setAttribute("inert", "");
    const parts = [".logo", ".search", "#rnd", "#inv", "#acc", ".badge"];
    parts.forEach(sel => { const n = document.querySelector("header " + sel); if (!n) return; const c = n.cloneNode(true); c.removeAttribute("id"); c.querySelectorAll("[id]").forEach(x => x.removeAttribute("id")); c.setAttribute("tabindex", "-1"); if (sel === "#acc") c.classList.add("lu-hl"); hd.appendChild(c); });
    const wrap = document.createElement("div"); wrap.className = "lu-hwrap"; wrap.appendChild(hd); host.appendChild(wrap);
    requestAnimationFrame(() => { const k = Math.min(1, wrap.clientWidth / Math.max(1, hd.scrollWidth)); if (k < 1) { hd.style.transform = "scale(" + k + ")"; hd.style.transformOrigin = "left top"; wrap.style.height = Math.ceil(hd.offsetHeight * k) + "px"; } });
  }
  function dialog(html) { return `<div class="modal amodal lu-static" inert>${`<div class="box">${noIds(html)}</div>`}</div>`; }
  function visual(host, k) {
    const a = A();
    if (k === "header") { realHeader(host); return; }
    if (k === "up" && a) { host.insertAdjacentHTML("beforeend", dialog(a.auth("up", { name: "MeinName", pw: "geheim123" }))); return; }
    if (k === "in" && a) { host.insertAdjacentHTML("beforeend", dialog(a.auth("in", { name: "MeinName", pw: "geheim123" }))); return; }
    if (k === "menu" && a) { host.insertAdjacentHTML("beforeend", dialog(a.menu("MeinName", 184320))); return; }
    if (k === "hero" || k === "end") host.insertAdjacentHTML("beforeend", `<div class="lu-vis lu-hero" aria-hidden="true"><span class="lu-ic">👤</span><span class="lu-arrow">⇄</span><span class="lu-ic">☁️</span></div>`);
    else if (k === "info") host.insertAdjacentHTML("beforeend", `<div class="lu-vis lu-hero" aria-hidden="true"><span class="lu-ic">🔒</span></div>`);
  }
  function render() {
    const s = SL[i], last = i === SL.length - 1, first = visited.has(i);
    visited.add(i); clearInterval(tm);
    const card = el.querySelector(".lu-card");
    card.innerHTML = `
      <div class="lu-top"><span class="lu-chip">${esc(s.c)}</span><span class="lu-n">${i + 1} / ${SL.length}</span></div>
      <h2 id="lu-t">${esc(s.t)}</h2>
      <div class="lu-visw"></div>
      <p class="lu-p">${esc(s.p)}</p>
      <ul>${s.l.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="lu-dotsrow">${SL.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <div class="lu-acts">${i > 0 ? `<button type="button" class="btn" data-a="back">Zurück</button>` : ""}
        ${last ? `<button type="button" class="btn" data-a="create" disabled>Konto erstellen</button><button type="button" class="btn go" data-a="done" disabled>Verstanden</button>` : `<button type="button" class="btn go" data-a="next" disabled>Weiter</button>`}</div>`;
    visual(card.querySelector(".lu-visw"), s.v);
    card.classList.remove("in"); void card.offsetWidth; card.classList.add("in"); card.scrollTop = 0;
    const btns = [...card.querySelectorAll("[data-a=next],[data-a=create],[data-a=done]")], label = btns.map(b => b.textContent);
    let left = first ? 0 : WAIT;
    const tick = () => {
      if (left > 0) { btns.forEach((b, n) => { b.textContent = label[n] + " (" + left + ")"; }); left--; tm = setTimeout(tick, 1000); }
      else { btns.forEach((b, n) => { b.textContent = label[n]; b.disabled = false; }); const g = card.querySelector(".go"); if (g) g.focus({ preventScroll: true }); }
    };
    tick();
  }
  function close(create) {
    if (!el) return; clearTimeout(tm); el.classList.remove("show"); const e = el; el = null; removeEventListener("keydown", key, true); root.classList.remove("lu-open");
    document.querySelectorAll("[data-luinert]").forEach(c => { c.removeAttribute("inert"); delete c.dataset.luinert; });
    setTimeout(() => { e.remove(); if (create) { const a = document.getElementById("acc"); if (a) a.click(); } }, 350);
  }
  // Escape und andere Tasten tun nichts: der Bildschirm bleibt, bis alles gelesen ist
  function key(e) { if (!el) return; if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); return; } if (e.key === "ArrowRight") { const b = el.querySelector("[data-a=next]"); if (b && !b.disabled) { i++; render(); } } else if (e.key === "ArrowLeft" && i > 0) { i--; render(); } }
  function open() {
    mark();
    el = document.createElement("div"); el.id = "lupd"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "lu-t");
    el.innerHTML = '<div class="lu-card"></div>';
    [...document.body.children].forEach(c => { if (!c.hasAttribute("inert")) { c.setAttribute("inert", ""); c.dataset.luinert = "1"; } });
    document.body.appendChild(el); root.classList.add("lu-open"); i = 0; visited.clear(); render();
    el.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (!b || b.disabled) return; const a = b.dataset.a; if (a === "next" && i < SL.length - 1) { i++; render(); } else if (a === "back" && i > 0) { i--; render(); } else if (a === "done") close(); else if (a === "create") close(true); });
    addEventListener("keydown", key, true); requestAnimationFrame(() => el && el.classList.add("show"));
  }
  // Erst zeigen, wenn Intro (Cutscene), Spiel-Player und andere Fenster weg sind
  const busy = () => root.classList.contains("mi-on") || root.classList.contains("intro-on") || !!document.getElementById("player") || !!document.querySelector(".modal,.agiftv,.advm,.ann,#rz");
  let waited = 0;
  const t = setInterval(() => {
    if (!document.getElementById("acc") || busy()) return;
    waited++; if (waited < 3) return;   // kurz warten, damit das Intro sicher fertig ist
    clearInterval(t); if (seen() && !forced) return; open();
  }, 700);
})();
