// Tester-Programm: Bewerbung, Popups, Tester-Modus (Checkliste beim Spiel, Meldungen mit Screenshot).
// Alle Daten laufen ueber die moki_tester_* Funktionen in Supabase (siehe Migration moki_tester_program).
(function () {
  "use strict";
  const CFG = window.MOKI_CFG || {};
  const TKEY = "moki-tester-key", MODE = "moki-tester-mode";
  const MAX_SHOT = 5 * 1024 * 1024;
  const CHECKS = [
    ["laedt", "Spiel lädt"],
    ["start", "Startbildschirm erscheint"],
    ["steuerung", "Steuerung funktioniert"],
    ["fluessig", "Läuft flüssig"],
    ["kein_fehler", "Kein Absturz / keine Fehlermeldung"]
  ];
  const TUTORIAL = [
    "Ganz unten auf der Seite den Button „Tester-Modus“ einschalten.",
    "Ein Spiel aussuchen und öffnen. Die Checkliste erscheint links.",
    "Die Punkte abhaken: Lädt es, reagiert die Steuerung, läuft es flüssig?",
    "Gibt es einen Fehler, einen Screenshot machen und hochladen.",
    "Die Meldung abschicken. Bereits getestete Spiele sind danach ausgegraut."
  ];

  // ---------- Hilfen ----------
  let memToken = null;
  function token() {
    try {
      let t = localStorage.getItem(TKEY);
      if (!t || t.length < 16) {
        const a = new Uint8Array(24); crypto.getRandomValues(a);
        t = [...a].map(b => b.toString(16).padStart(2, "0")).join("");
        localStorage.setItem(TKEY, t);
      }
      return t;
    } catch (e) { if (!memToken) { memToken = "mem-" + Math.random().toString(16).slice(2) + Date.now().toString(16); } return memToken; }
  }
  function getMode() { try { return localStorage.getItem(MODE) === "1"; } catch (e) { return false; } }
  function setMode(on) { try { localStorage.setItem(MODE, on ? "1" : "0"); } catch (e) {} }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  async function rpc(fn, args) {
    let r;
    try {
      r = await fetch(CFG.sbUrl + "/rest/v1/rpc/" + fn, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: CFG.sbKey, Authorization: "Bearer " + CFG.sbKey },
        body: JSON.stringify(args || {})
      });
    } catch (e) { throw new Error("Keine Verbindung. Bitte später erneut versuchen."); }
    const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) {}
    if (!r.ok) throw new Error((j && j.message) || "Fehler, bitte erneut versuchen.");
    return j;
  }
  function toast(msg) {
    const t = document.createElement("div"); t.className = "mtoast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.classList.add("out"), 2600); setTimeout(() => t.remove(), 3100);
  }
  function modal(html, onMount) {
    const el = document.createElement("div"); el.className = "modal tmodal";
    el.innerHTML = `<div class="box" role="dialog" aria-modal="true">${html}</div>`;
    const close = () => { el.remove(); removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    el.addEventListener("click", e => { if (e.target === el) close(); });
    document.body.appendChild(el);
    if (onMount) onMount(el, close);
    return el;
  }
  const dateStr = iso => new Date(iso).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // ---------- Zustand ----------
  let st = { state: "none", name: "", notice: null, cooldown_until: null };
  let board = { confirmed: new Set(), claims: new Map() };
  let session = null;   // { game, title, submitted }

  async function loadState() {
    try { st = await rpc("moki_tester_state", { p_token: token() }); }
    catch (e) { st = { state: "none" }; }
    if (st.state === "banned") { setMode(false); }
    if (st.state !== "tester" && getMode()) setMode(false);
    return st;
  }
  async function loadBoard() {
    try {
      const b = await rpc("moki_tester_board", { p_token: token() });
      board = { confirmed: new Set(b.confirmed || []), claims: new Map((b.claims || []).map(c => [c.game_id, !!c.mine])) };
    } catch (e) { board = { confirmed: new Set(), claims: new Map() }; }
  }

  // ---------- Fuss-Leiste ----------
  function footer() {
    let f = document.getElementById("tfoot");
    if (!f) {
      f = document.createElement("footer"); f.id = "tfoot";
      const lay = document.querySelector(".layout");
      (lay || document.body).after(f);
    }
    return f;
  }
  function renderFooter() {
    const f = footer();
    const tester = st.state === "tester";
    const on = tester && getMode();
    let inner = "";
    if (tester) {
      inner = `<span class="tf-info">Du bist Tester${st.name ? ": " + esc(st.name) : ""}.</span>
        <button class="tf-btn${on ? " on" : ""}" type="button" data-tf="mode">${on ? "Tester-Modus beenden" : "Tester-Modus"}</button>`;
    } else if (st.state === "pending") {
      inner = `<span class="tf-info">Deine Bewerbung als Tester wird gerade geprüft.</span>`;
    } else if (st.cooldown_until && Date.parse(st.cooldown_until) > Date.now()) {
      inner = `<span class="tf-info">Erneut bewerben als Tester ab ${esc(dateStr(st.cooldown_until))}.</span>`;
    } else {
      inner = `<button class="tf-link" type="button" data-tf="apply">Spiele testen? Tester werden</button>`;
    }
    f.innerHTML = `<div class="tf-in">${inner}</div>`;
    markTiles();
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-tf]");
    if (!b) return;
    e.preventDefault();
    if (b.dataset.tf === "apply") openApply();
    if (b.dataset.tf === "mode") toggleMode();
  });

  // ---------- Bewerbung ----------
  function openApply() {
    modal(`<h3>Spiele-Tester werden</h3>
      <p>Du testest Spiele auf Moki. Du öffnest ein Spiel, hakst eine kurze Checkliste ab und meldest Fehler mit einem Screenshot. Sei ehrlich, auch wenn ein Spiel nicht gut ist.</p>
      <label class="tf-lab" for="tf-name">Dein Name</label>
      <input id="tf-name" class="tf-in-txt" maxlength="40" placeholder="Name" autocomplete="off">
      <div class="tf-err" id="tf-err"></div>
      <div class="acts"><button class="btn" data-a="no" type="button">Abbrechen</button><button class="btn go" data-a="send" type="button">Bewerben</button></div>`,
      (el, close) => {
        const inp = el.querySelector("#tf-name"); inp.focus();
        el.querySelector("[data-a=no]").onclick = close;
        el.querySelector("[data-a=send]").onclick = async () => {
          const err = el.querySelector("#tf-err"); err.textContent = "";
          try {
            await rpc("moki_tester_apply", { p_token: token(), p_name: inp.value });
            close(); toast("Bewerbung abgeschickt. Du bekommst beim nächsten Besuch Bescheid.");
            await loadState(); renderFooter();
          } catch (e) { err.textContent = e.message; }
        };
      });
  }

  // ---------- Popups nach Entscheidung ----------
  function showNotice() {
    if (!st.notice) return;
    const notice = st.notice;
    const ackNow = () => rpc("moki_tester_ack", { p_token: token() }).catch(() => {});
    if (notice === "accepted") {
      modal(`<h3>Du bist jetzt Tester!</h3><p>Danke, dass du hilfst. So geht's:</p>
        <ol class="tf-steps">${TUTORIAL.map(t => `<li>${esc(t)}</li>`).join("")}</ol>
        <div class="acts"><button class="btn go" data-a="ok" type="button">Los geht's</button></div>`,
        (el, close) => { el.querySelector("[data-a=ok]").onclick = () => { ackNow(); close(); loadState().then(renderFooter); }; });
    } else if (notice === "rejected") {
      modal(`<h3>Leider nicht geklappt</h3><p>Deine Bewerbung als Tester wurde diesmal nicht angenommen. Du kannst dich in 48 Stunden erneut bewerben.</p>
        <div class="acts"><button class="btn" data-a="ok" type="button">Verstanden</button></div>`,
        (el, close) => { el.querySelector("[data-a=ok]").onclick = () => { ackNow(); close(); loadState().then(renderFooter); }; });
    } else if (notice === "revoked") {
      modal(`<h3>Tester-Rang entzogen</h3><p>Dein Tester-Rang wurde entzogen. Bei Fragen melde dich bei Moki.</p>
        <div class="acts"><button class="btn" data-a="ok" type="button">Verstanden</button></div>`,
        (el, close) => { el.querySelector("[data-a=ok]").onclick = () => { ackNow(); close(); loadState().then(renderFooter); }; });
    }
  }

  // ---------- Tester-Modus ----------
  async function toggleMode() {
    const on = !getMode();
    setMode(on);
    if (on) await loadBoard();
    renderFooter();
    toast(on ? "Tester-Modus ist an. Wähle ein Spiel." : "Tester-Modus ist aus.");
  }
  function markTiles() {
    const on = st.state === "tester" && getMode();
    document.querySelectorAll("#app a[data-id]").forEach(a => {
      const id = a.dataset.id;
      a.classList.remove("tdone", "tbusy");
      const old = a.querySelector(".tbadge"); if (old) old.remove();
      if (!on) return;
      if (board.confirmed.has(id)) { a.classList.add("tdone"); a.insertAdjacentHTML("beforeend", `<span class="tbadge">Bereits getestet</span>`); }
      else if (board.claims.has(id) && !board.claims.get(id)) { a.classList.add("tbusy"); a.insertAdjacentHTML("beforeend", `<span class="tbadge">Wird geprüft</span>`); }
    });
  }
  const appEl = () => document.getElementById("app");
  if (appEl()) new MutationObserver(() => markTiles()).observe(appEl(), { childList: true });

  // Klick auf ein Spiel im Tester-Modus: erst beanspruchen, dann oeffnen
  document.addEventListener("click", async e => {
    if (!(st.state === "tester" && getMode())) return;
    const a = e.target.closest("#app a[data-id]");
    if (!a) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const id = a.dataset.id, title = (a.getAttribute("aria-label") || id);
    if (board.confirmed.has(id)) return toast("Dieses Spiel ist schon getestet.");
    if (board.claims.has(id) && !board.claims.get(id)) return toast("Dieses Spiel wird gerade von einem anderen Tester geprüft.");
    try {
      await rpc("moki_tester_claim", { p_token: token(), p_game: id });
      board.claims.set(id, true);
      session = { game: id, title, submitted: false };
      location.hash = "#/play/" + id;
    } catch (err) { toast(err.message); await loadBoard(); markTiles(); }
  }, true);

  // ---------- Checkliste beim Spiel ----------
  function mountPanel() {
    if (!session || document.getElementById("tpanel")) return;
    const p = document.createElement("aside"); p.id = "tpanel";
    p.innerHTML = `<div class="tp-head"><b>Tester-Checkliste</b><button type="button" class="tp-min" aria-label="Einklappen">–</button></div>
      <div class="tp-body">
        <div class="tp-game">${esc(session.title)}</div>
        ${CHECKS.map(([k, l]) => `<label class="tp-check"><input type="checkbox" data-k="${k}"> ${esc(l)}</label>`).join("")}
        <label class="tp-check tp-err"><input type="checkbox" id="tp-hasErr"> Es gab einen Fehler</label>
        <div id="tp-errbox" hidden>
          <label class="tf-lab" for="tp-shot">Screenshot (Pflicht bei Fehler, max. 5 MB)</label>
          <input id="tp-shot" type="file" accept="image/*">
          <label class="tf-lab" for="tp-msg">Was ist passiert? (optional)</label>
          <textarea id="tp-msg" maxlength="500" rows="3"></textarea>
        </div>
        <button type="button" class="tf-btn on tp-send" id="tp-send">Meldung abschicken</button>
        <div class="tf-err" id="tp-err"></div>
      </div>`;
    document.body.appendChild(p);
    p.querySelector(".tp-min").onclick = () => p.classList.toggle("min");
    const err = p.querySelector("#tp-hasErr"), box = p.querySelector("#tp-errbox");
    err.onchange = () => { box.hidden = !err.checked; };
    p.querySelector("#tp-send").onclick = sendReport;
  }
  function unmountPanel() { const p = document.getElementById("tpanel"); if (p) p.remove(); }

  function readFile(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result); r.onerror = () => rej(new Error("Bild konnte nicht gelesen werden."));
      r.readAsDataURL(file);
    });
  }
  async function sendReport() {
    const p = document.getElementById("tpanel"); if (!p || !session) return;
    const errEl = p.querySelector("#tp-err"); errEl.textContent = "";
    const checklist = {};
    p.querySelectorAll("[data-k]").forEach(c => { checklist[c.dataset.k] = c.checked; });
    const hasErr = p.querySelector("#tp-hasErr").checked;
    const msg = p.querySelector("#tp-msg").value.trim();
    const file = p.querySelector("#tp-shot").files[0];
    if (!hasErr && CHECKS.some(([k]) => !checklist[k])) { errEl.textContent = "Bitte alle Punkte abhaken, oder einen Fehler angeben."; return; }
    let shot = null;
    if (hasErr) {
      if (!file) { errEl.textContent = "Bitte einen Screenshot hochladen."; return; }
      if (file.size > MAX_SHOT) { errEl.textContent = "Der Screenshot ist größer als 5 MB."; return; }
      if (!/^image\//.test(file.type)) { errEl.textContent = "Bitte ein Bild hochladen."; return; }
      try { shot = await readFile(file); } catch (e) { errEl.textContent = e.message; return; }
    }
    const btn = p.querySelector("#tp-send"); btn.disabled = true;
    try {
      await rpc("moki_tester_report", { p_token: token(), p_game: session.game, p_checklist: checklist, p_has_error: hasErr, p_message: msg, p_screenshot: shot });
      session.submitted = true;
      toast("Danke! Deine Meldung ist abgeschickt.");
      session = null;
      unmountPanel();
      const pl = document.getElementById("player"); if (pl) pl.remove();
      document.documentElement.classList.remove("player-open");
      if (location.hash.startsWith("#/play/")) history.replaceState(null, "", location.pathname + location.search);
      await loadBoard(); markTiles();
    } catch (e) { errEl.textContent = e.message; btn.disabled = false; }
  }
  async function endSession() {
    if (!session) return;
    const s = session; session = null;
    unmountPanel();
    if (!s.submitted) { try { await rpc("moki_tester_release", { p_token: token(), p_game: s.game }); } catch (e) {} board.claims.delete(s.game); }
    await loadBoard(); markTiles();
  }
  // Spiel geoeffnet? Panel zeigen. Spiel geschlossen? Sitzung beenden.
  new MutationObserver(() => {
    const open = !!document.getElementById("player");
    if (session && open) mountPanel();
    if (session && !open) endSession();
  }).observe(document.body, { childList: true });
  addEventListener("message", e => { if (e.data === "moki-close") endSession(); });

  // ---------- Start ----------
  async function init() {
    await loadState();
    renderFooter();
    if (st.state === "tester" && getMode()) await loadBoard();
    if (st.state === "tester" && getMode()) markTiles();
    showNotice();
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", init); else init();
  // Nach Entscheidung des Admins (beim naechsten Oeffnen) Status neu laden
  addEventListener("pageshow", e => { if (e.persisted) init(); });
})();
