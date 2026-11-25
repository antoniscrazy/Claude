// Update-Bildschirm zum Moki-Konto: erklaert Schritt fuer Schritt, wie alles geht. Erscheint genau einmal pro Browser.
// Wer das Intro (Cutscene) noch nicht gesehen hat, bekommt erst das Intro und danach diese Erklaerung.
(function () {
  "use strict";
  const KEY = "moki-update-login-v1", root = document.documentElement;
  const seen = () => { try { if (localStorage.getItem(KEY)) return true; } catch (e) {} try { if (sessionStorage.getItem(KEY)) return true; } catch (e) {} try { return document.cookie.indexOf(KEY + "=1") > -1; } catch (e) { return false; } };
  const mark = () => { try { localStorage.setItem(KEY, "1"); } catch (e) {} try { sessionStorage.setItem(KEY, "1"); } catch (e) {} try { document.cookie = KEY + "=1; max-age=31536000; path=/; SameSite=Lax"; } catch (e) {} };
  if (seen()) return;
  try { if (localStorage.getItem("moki-acc")) { mark(); return; } } catch (e) {}   // wer schon ein Konto hat, braucht die Erklaerung nicht
  const forced = /[?&]update(=1)?(&|$)/.test(location.search);   // zum Testen: ?update

  const SL = [
    { t: "Neu: Moki-Konten", c: "Update", e: "☁️", p: "Ab jetzt kannst du dir ein eigenes Moki-Konto machen. Dein Fortschritt in den Spielen wird gesichert und ist auf jedem Gerät da, auf dem du dich anmeldest.", l: ["Du brauchst nur einen Namen und ein Passwort.", "Du bist danach sofort angemeldet und bleibst es in diesem Browser.", "Auf den nächsten Seiten erkläre ich dir alles Schritt für Schritt. Das dauert etwa eine Minute."], v: "hero" },
    { t: "1. Konto erstellen", c: "Schritt 1", p: "Oben rechts neben „Einladen“ findest du den Knopf „Anmelden“.", l: ["Tippe darauf und wechsle oben im Fenster auf „Konto erstellen“.", "Denk dir einen Namen aus: 3 bis 20 Zeichen, also Buchstaben, Zahlen, Leerzeichen, Punkt, Strich oder Unterstrich.", "Wähle ein Passwort mit mindestens 6 Zeichen.", "Tippe auf „Konto erstellen“. Fertig, du bist angemeldet und dein Name steht oben im Knopf."], v: "header" },
    { t: "2. Was wird gesichert?", c: "Schritt 2", p: "Moki sichert deinen Fortschritt von allein im Hintergrund. Du musst nichts drücken.", l: ["Spielstände wie Level, Münzen und Fortschritt, bei allen Spielen, die im Browser speichern.", "Deine Favoriten und deine zuletzt gespielten Spiele.", "Alles, was du auf Moki sammelst, zum Beispiel im Adventskalender.", "Gesichert wird, wenn du ein Spiel verlässt, alle paar Minuten und wenn du die Seite schließt. Es wird nur gesendet, was sich wirklich geändert hat, deshalb braucht es kaum Daten.", "Du kannst es auch von Hand anstoßen: Tippe auf deinen Namen und dann auf „Jetzt sichern“."], v: "save" },
    { t: "3. Auf einem anderen Gerät", c: "Schritt 3", p: "Du willst auf dem Tablet oder auf einem anderen Computer weiterspielen? Kein Problem.", l: ["Öffne Moki auf dem anderen Gerät und tippe auf „Anmelden“.", "Gib denselben Namen und dasselbe Passwort ein.", "Deine Spielstände werden geladen. Danach startet die Seite einmal neu und alles ist da.", "Ab dann bleiben beide Geräte automatisch auf demselben Stand."], v: "devices" },
    { t: "4. Das solltest du wissen", c: "Wichtig", p: "Damit nichts schiefgeht, merk dir diese Punkte:", l: ["Es gibt keine E-Mail. Darum kann dein Passwort nicht zurückgesetzt werden. Merk es dir gut oder schreib es auf.", "Gespeichert werden nur dein Name, dein Passwort (verschlüsselt) und deine Spielstände. Sonst nichts.", "Jedes Konto hat 4 MB Platz. Das reicht normalerweise locker. Unter deinem Namen siehst du, wie viel schon belegt ist.", "„Abmelden“ beendet nur die Anmeldung. Deine Spielstände bleiben auf dem Gerät und im Konto.", "„Konto löschen“ (mit Passwort) löscht alles, was im Konto gesichert ist. Auf dem Gerät bleibt alles.", "Manche Spiele speichern gar nichts. Da gibt es dann auch nichts zu sichern."], v: "info" },
    { t: "Los geht's!", c: "Fertig", e: "🎮", p: "Jetzt weißt du alles. Erstelle dein Konto am besten gleich, dann ist dein Fortschritt von Anfang an sicher.", l: ["Du findest die Erklärung später nicht wieder, aber du erreichst alles über den Knopf oben rechts.", "Viel Spaß beim Spielen!"], v: "end" }
  ];

  let el = null, i = 0;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function visual(k) {
    if (k === "hero" || k === "end") return `<div class="lu-vis lu-hero" aria-hidden="true"><span class="lu-ic">👤</span><span class="lu-arrow">⇄</span><span class="lu-ic">☁️</span></div>`;
    if (k === "header") return `<div class="lu-vis lu-mock" aria-hidden="true"><b class="lu-logo">moki</b><i></i><span class="lu-b">Zufall</span><span class="lu-b">Einladen</span><span class="lu-b lu-hl">👤 Anmelden</span></div><div class="lu-vis lu-form" aria-hidden="true"><em>Anmelden</em><em class="on">Konto erstellen</em><u>Name</u><u>Passwort</u><s>Konto erstellen</s></div>`;
    if (k === "save") return `<div class="lu-vis lu-sv" aria-hidden="true"><span>🎮</span><span class="lu-dots"><i></i><i></i><i></i></span><span>☁️</span></div>`;
    if (k === "devices") return `<div class="lu-vis lu-dev" aria-hidden="true"><span>📱</span><span class="lu-dots"><i></i><i></i><i></i></span><span>☁️</span><span class="lu-dots"><i></i><i></i><i></i></span><span>💻</span></div>`;
    if (k === "info") return `<div class="lu-vis lu-hero" aria-hidden="true"><span class="lu-ic">🔒</span></div>`;
    return "";
  }
  function render() {
    const s = SL[i], last = i === SL.length - 1;
    el.querySelector(".lu-card").innerHTML = `
      <button type="button" class="lu-x" aria-label="Schließen" data-a="close">✕</button>
      <div class="lu-top"><span class="lu-chip">${esc(s.c)}</span><span class="lu-n">${i + 1} / ${SL.length}</span></div>
      <h2 id="lu-t">${esc(s.t)}</h2>
      ${visual(s.v)}
      <p class="lu-p">${esc(s.p)}</p>
      <ul>${s.l.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="lu-dotsrow">${SL.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <div class="lu-acts">${i > 0 ? `<button type="button" class="btn" data-a="back">Zurück</button>` : `<button type="button" class="btn" data-a="close">Später</button>`}
        ${last ? `<button type="button" class="btn go" data-a="create">Konto erstellen</button>` : `<button type="button" class="btn go" data-a="next">Weiter</button>`}</div>`;
    const c = el.querySelector(".lu-card"); c.classList.remove("in"); void c.offsetWidth; c.classList.add("in");
    const b = el.querySelector(".go"); if (b) b.focus({ preventScroll: true });
  }
  function close(create) {
    if (!el) return; el.classList.remove("show"); const e = el; el = null; removeEventListener("keydown", key); root.classList.remove("lu-open");
    setTimeout(() => { e.remove(); if (create) { const a = document.getElementById("acc"); if (a) a.click(); } }, 350);
  }
  function key(e) { if (e.key === "Escape") close(); else if (e.key === "ArrowRight" && i < SL.length - 1) { i++; render(); } else if (e.key === "ArrowLeft" && i > 0) { i--; render(); } }
  function open() {
    mark();
    el = document.createElement("div"); el.id = "lupd"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "lu-t");
    el.innerHTML = '<div class="lu-card"></div>'; document.body.appendChild(el); root.classList.add("lu-open"); i = 0; render();
    el.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (!b) return; const a = b.dataset.a; if (a === "next" && i < SL.length - 1) { i++; render(); } else if (a === "back" && i > 0) { i--; render(); } else if (a === "close") close(); else if (a === "create") close(true); });
    addEventListener("keydown", key); requestAnimationFrame(() => el && el.classList.add("show"));
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
