// Moki-Konten: Name und Passwort, automatisch angemeldet im Browser. Spielstaende (localStorage und IndexedDB der Spiele)
// werden komprimiert gesichert und auf anderen Geraeten wieder geladen. Es wird nur gesendet, was sich geaendert hat.
// Die Datenbank ist nur ueber geprueft Funktionen erreichbar (moki_acc_*, moki_sync_*), pro Konto sind hoechstens 4 MB erlaubt.
(function () {
  "use strict";
  const CFG = window.MOKI_CFG || {};
  if (!CFG.sbUrl) return;
  const LS = localStorage;
  const KEY = "moki-acc", SNAP = "moki-acc-snap", SEQ = "moki-acc-seq";
  const SKIP_LS = /^(moki-acc|moki-tester|moki-intro|moki-xmas-intro|moki-first|moki-ss|moki-side|moki-close|moki-ann-seen|moki-men)/;
  const SKIP_DB = /cache|workbox|firebase|google|analytics|tracking|sentry/i;
  const J = { get(k, d) { try { const v = JSON.parse(LS.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { LS.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = msg => { if (typeof mtoast === "function") mtoast(msg); };
  let acct = J.get(KEY, null), snap = J.get(SNAP, {}), seq = +LS.getItem(SEQ) || 0, busy = false, lastPush = 0;
  const SKIP = {};

  async function rpc(fn, args) {
    const r = await fetch(CFG.sbUrl + "/rest/v1/rpc/" + fn, { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.sbKey, Authorization: "Bearer " + CFG.sbKey }, body: JSON.stringify(args) });
    if (!r.ok) throw new Error("http " + r.status);
    return r.json();
  }

  // ---------- Kodierung ----------
  const b64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  function enc(v) {
    if (v === null || typeof v === "string" || typeof v === "boolean") return v;
    if (typeof v === "number") return isFinite(v) ? v : { $n: String(v) };
    if (v === undefined) return { $un: 1 };
    if (v instanceof Date) return { $d: +v };
    if (v instanceof ArrayBuffer) return { $ab: b64(new Uint8Array(v)) };
    if (ArrayBuffer.isView(v)) return { $ta: v.constructor.name, b: b64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
    if (typeof Blob !== "undefined" && v instanceof Blob) throw SKIP;
    if (Array.isArray(v)) return v.map(enc);
    if (typeof v === "object") { const o = {}; for (const k in v) o[k[0] === "$" ? "$" + k : k] = enc(v[k]); return o; }
    throw SKIP;
  }
  function dec(v) {
    if (Array.isArray(v)) return v.map(dec);
    if (v && typeof v === "object") {
      const ks = Object.keys(v);
      if (ks.length === 1 && ks[0] === "$d") return new Date(v.$d);
      if (ks.length === 1 && ks[0] === "$n") return Number(v.$n);
      if (ks.length === 1 && ks[0] === "$un") return undefined;
      if (ks.length === 1 && ks[0] === "$ab") return unb64(v.$ab).buffer;
      if (ks.length === 2 && ks.includes("$ta")) { const u = unb64(v.b), C = self[v.$ta]; return C && C !== Uint8Array ? new C(u.buffer) : u; }
      const o = {}; for (const k in v) o[k.slice(0, 2) === "$$" ? k.slice(1) : k] = dec(v[k]); return o;
    }
    return v;
  }
  async function pack(str) {
    if (str.length < 160 || typeof CompressionStream === "undefined") return "r:" + str;
    try {
      const cs = new Blob([str]).stream().pipeThrough(new CompressionStream("gzip")), buf = new Uint8Array(await new Response(cs).arrayBuffer());
      const g = "g:" + b64(buf); return g.length < str.length + 2 ? g : "r:" + str;
    } catch (e) { return "r:" + str; }
  }
  async function unpack(s) {
    if (s.slice(0, 2) === "r:") return s.slice(2);
    if (typeof DecompressionStream === "undefined") throw new Error("kein gzip");
    const ds = new Blob([unb64(s.slice(2))]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(ds).text();
  }
  const hash = s => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36) + "." + s.length; };

  // ---------- Lokale Staende einsammeln ----------
  function snapLS(out) {
    for (let i = 0; i < LS.length; i++) {
      const k = LS.key(i); if (SKIP_LS.test(k) || k.length > 200) continue;
      const v = LS.getItem(k); if (v == null || v.length > 900000) continue; out.set("ls:" + k, v);
    }
  }
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  async function snapIDB(out) {
    if (!indexedDB || !indexedDB.databases) return;
    let dbs = []; try { dbs = await indexedDB.databases(); } catch (e) { return; }
    for (const info of dbs) {
      const name = info.name; if (!name || SKIP_DB.test(name)) continue;
      try {
        const db = await new Promise((res, rej) => { const r = indexedDB.open(name); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error("b")); });
        const names = [...db.objectStoreNames]; if (!names.length) { db.close(); continue; }
        const tx = db.transaction(names, "readonly"), schema = { v: db.version, s: {} }, local = new Map(); let total = 0, over = false;
        for (const sn of names) {
          const st = tx.objectStore(sn);
          schema.s[sn] = { kp: st.keyPath, ai: st.autoIncrement, ix: [...st.indexNames].map(n => { const i = st.index(n); return { n, kp: i.keyPath, u: i.unique, m: i.multiEntry }; }) };
          const [keys, vals] = await Promise.all([req(st.getAllKeys()), req(st.getAll())]);
          for (let i = 0; i < keys.length; i++) {
            try {
              const k = enc(keys[i]), s = JSON.stringify([k, enc(vals[i])]), id = "ix:" + name + "|" + sn + "|" + JSON.stringify(k);
              if (s.length > 900000 || id.length > 300) continue; total += s.length; if (total > 3000000) { over = true; break; } local.set(id, s);
            } catch (e) { if (e !== SKIP) throw e; }
          }
          if (over) break;
        }
        db.close(); if (over || !local.size) continue;
        local.forEach((v, k) => out.set(k, v)); out.set("ixs:" + name, JSON.stringify(schema));
      } catch (e) { /* Datenbank nicht lesbar: ueberspringen */ }
    }
  }
  async function collect(deep) { const m = new Map(); snapLS(m); if (deep) await snapIDB(m); return m; }

  // ---------- Hochladen ----------
  async function push(deep) {
    if (!acct) return;
    const cur = await collect(deep), now = Date.now(), items = [], dbs = new Set();
    cur.forEach((v, id) => { const h = hash(v), o = snap[id]; if (!o || o[0] !== h) { snap[id] = [h, (o || deep === "init") ? now : 1]; items.push({ id, v }); if (id.slice(0, 3) === "ix:") dbs.add(id.slice(3).split("|")[0]); } });
    dbs.forEach(n => { const id = "ixs:" + n; if (cur.has(id) && !items.some(i => i.id === id)) { snap[id] = [hash(cur.get(id)), now]; items.push({ id, v: cur.get(id) }); } });
    if (!items.length) return;
    const list = [];
    for (const it of items) list.push({ i: it.id, t: snap[it.id][1], v: await pack(it.v) });
    let part = [], size = 0;
    const flush = async () => {
      if (!part.length) return; const r = await rpc("moki_sync_push", { p_token: acct.token, p_items: part }); part = []; size = 0;
      if (r.err === "quota") { toast("Dein Moki-Speicher ist voll. Neue Spielstände werden nicht mehr gesichert."); throw new Error("quota"); }
      if (r.err === "session") { logoutLocal(); toast("Du wurdest abgemeldet. Bitte melde dich neu an."); throw new Error("session"); }
      if (!r.ok) throw new Error("push");
      acct.bytes = r.bytes; J.set(KEY, acct); if (r.seq > seq) { seq = r.seq; LS.setItem(SEQ, String(seq)); }
    };
    for (const it of list) { part.push(it); size += it.v.length; if (size > 700000 || part.length >= 300) await flush(); }
    await flush(); J.set(SNAP, snap); lastPush = Date.now();
  }

  // ---------- Herunterladen und anwenden ----------
  async function idbApply(name, schema, ents) {
    const open = v => new Promise((res, rej) => {
      const r = v ? indexedDB.open(name, v) : indexedDB.open(name);
      r.onupgradeneeded = () => { const d = r.result; for (const sn in schema.s) { if (d.objectStoreNames.contains(sn)) continue; const sc = schema.s[sn], st = d.createObjectStore(sn, { keyPath: sc.kp || undefined, autoIncrement: !!sc.ai }); (sc.ix || []).forEach(i => { try { st.createIndex(i.n, i.kp, { unique: !!i.u, multiEntry: !!i.m }); } catch (e) {} }); } };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error("b"));
    });
    let db; try { db = await open(schema.v || 1); } catch (e) { db = await open(0); }
    try {
      const by = {}; ents.forEach(e => { (by[e.store] = by[e.store] || []).push(e); });
      for (const sn in by) {
        if (!db.objectStoreNames.contains(sn)) continue;
        const tx = db.transaction(sn, "readwrite"), st = tx.objectStore(sn);
        for (const e of by[sn]) { try { if (st.keyPath != null) st.put(dec(e.v)); else st.put(dec(e.v), dec(e.k)); } catch (er) {} }
        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
      }
    } finally { db.close(); }
  }
  async function pull() {
    if (!acct) return 0;
    const w = await rpc("moki_acc_who", { p_token: acct.token });
    if (w.err === "session") { logoutLocal(); toast("Du wurdest abgemeldet. Bitte melde dich neu an."); return 0; }
    acct.name = w.name; acct.bytes = w.bytes; J.set(KEY, acct); renderBtn();
    if (!(w.seq > seq)) return 0;
    const r = await rpc("moki_sync_pull", { p_token: acct.token, p_since: seq });
    if (!r.ok) return 0;
    let changed = 0; const schemas = {}, ents = {};
    for (const it of r.items) {
      const mine = snap[it.i], t = +it.t || 0; if (mine && mine[1] >= t) continue;
      let str; try { str = await unpack(it.v); } catch (e) { continue; }
      if (it.i.slice(0, 3) === "ls:") { try { LS.setItem(it.i.slice(3), str); snap[it.i] = [hash(str), t]; changed++; } catch (e) {} }
      else if (it.i.slice(0, 4) === "ixs:") { try { schemas[it.i.slice(4)] = JSON.parse(str); snap[it.i] = [hash(str), t]; } catch (e) {} }
      else if (it.i.slice(0, 3) === "ix:") {
        const p = it.i.slice(3).split("|"); const name = p[0], store = p[1]; let kv; try { kv = JSON.parse(str); } catch (e) { continue; }
        (ents[name] = ents[name] || []).push({ store, k: kv[0], v: kv[1], id: it.i, h: hash(str), t });
      }
    }
    for (const name in ents) {
      if (!schemas[name]) continue;
      try { await idbApply(name, schemas[name], ents[name]); ents[name].forEach(e => { snap[e.id] = [e.h, e.t]; }); changed += ents[name].length; } catch (e) { /* Spiel hat die Datenbank gerade offen: beim naechsten Mal */ }
    }
    if (r.seq > seq) { seq = r.seq; LS.setItem(SEQ, String(seq)); }
    J.set(SNAP, snap); return changed;
  }

  // ---------- Ablauf ----------
  async function sync(deep, first) {
    if (!acct || busy) return; busy = true;
    try {
      const ch = await pull();
      await push(first ? "init" : deep);
      if (ch && first && !document.getElementById("player")) { toast("Deine Spielstände wurden geladen. Seite wird neu gestartet …"); setTimeout(() => location.reload(), 900); }
    } catch (e) { /* offline oder voll: spaeter erneut */ }
    busy = false; renderBtn();
  }
  function logoutLocal() { acct = null; LS.removeItem(KEY); renderBtn(); }
  setInterval(() => { if (acct && !document.hidden) sync(!!document.getElementById("player")); }, 75000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) sync(true); else if (acct && Date.now() - lastPush > 20000) sync(false); });
  addEventListener("pagehide", () => { if (acct) sync(true); });
  new MutationObserver(() => { if (!document.getElementById("player") && acct && document.body.dataset.pl === "1") { document.body.dataset.pl = ""; setTimeout(() => sync(true), 2500); } else if (document.getElementById("player")) document.body.dataset.pl = "1"; }).observe(document.body, { childList: true });

  // ---------- Oberflaeche ----------
  const ERR = { name: "Der Name braucht 3 bis 20 Zeichen (Buchstaben, Zahlen, Leerzeichen, _ . -).", pw: "Das Passwort braucht mindestens 6 Zeichen.", taken: "Diesen Namen gibt es schon. Nimm einen anderen.", busy: "Gerade werden viele Konten erstellt. Versuche es später noch einmal.", bad: "Name oder Passwort stimmt nicht.", locked: "Zu viele falsche Versuche. Bitte warte 10 Minuten.", net: "Keine Verbindung. Prüfe dein Internet und versuche es noch einmal.", session: "Du bist nicht mehr angemeldet." };
  function renderBtn() {
    const b = document.getElementById("acc"); if (!b) return;
    const n = b.querySelector("span"); if (n) n.textContent = acct ? acct.name : "Anmelden";
    b.classList.toggle("on", !!acct); b.title = acct ? "Dein Moki-Konto: " + acct.name : "Anmelden oder Konto erstellen";
  }
  function modal(html) {
    const o = document.createElement("div"); o.className = "modal amodal"; o.innerHTML = `<div class="box" role="dialog" aria-modal="true">${html}</div>`;
    const close = () => { o.remove(); removeEventListener("keydown", k); }; const k = e => { if (e.key === "Escape") close(); };
    o.addEventListener("click", e => { if (e.target === o || e.target.dataset.a === "close") close(); }); addEventListener("keydown", k);
    document.body.appendChild(o); o.close = close; return o;
  }
  function authDialog(tab) {
    const o = modal(`<h3>Moki-Konto</h3>
      <div class="atabs"><button type="button" data-t="in" class="on">Anmelden</button><button type="button" data-t="up">Konto erstellen</button></div>
      <p class="ainfo"></p>
      <label class="tf-lab" for="ac-n">Name</label><input id="ac-n" class="tf-in-txt" maxlength="20" autocomplete="username" autocapitalize="off" spellcheck="false">
      <label class="tf-lab" for="ac-p">Passwort</label><input id="ac-p" class="tf-in-txt" type="password" maxlength="72" autocomplete="current-password">
      <div class="tf-err" id="ac-e" role="alert"></div>
      <div class="acts"><button class="btn" type="button" data-a="close">Abbrechen</button><button class="btn go" type="button" id="ac-go">Anmelden</button></div>`);
    let mode = tab || "in"; const $ = s => o.querySelector(s);
    const set = m => { mode = m; o.querySelectorAll(".atabs button").forEach(b => b.classList.toggle("on", b.dataset.t === m)); $("#ac-go").textContent = m === "in" ? "Anmelden" : "Konto erstellen"; $("#ac-p").autocomplete = m === "in" ? "current-password" : "new-password"; $(".ainfo").textContent = m === "in" ? "Melde dich an, dann werden deine Spielstände auf diesem Gerät geladen." : "Wähle einen Namen und ein Passwort. Du bist danach sofort angemeldet. Deine Spielstände werden gesichert und sind auf jedem Gerät da. Es gibt keine E-Mail, merke dir das Passwort gut, es kann nicht zurückgesetzt werden."; $("#ac-e").textContent = ""; };
    o.querySelectorAll(".atabs button").forEach(b => b.addEventListener("click", () => set(b.dataset.t))); set(mode);
    const go = async () => {
      const name = $("#ac-n").value.trim(), pw = $("#ac-p").value, bt = $("#ac-go"); $("#ac-e").textContent = "";
      if (!name || !pw) { $("#ac-e").textContent = "Bitte Name und Passwort eingeben."; return; }
      bt.disabled = true; bt.textContent = "Moment …";
      try {
        const r = await rpc(mode === "in" ? "moki_acc_login" : "moki_acc_register", { p_name: name, p_pw: pw });
        if (!r.ok) { $("#ac-e").textContent = ERR[r.err] || "Das hat nicht geklappt."; bt.disabled = false; bt.textContent = mode === "in" ? "Anmelden" : "Konto erstellen"; return; }
        acct = { name: r.name, token: r.token, bytes: r.bytes || 0 }; J.set(KEY, acct); seq = 0; LS.setItem(SEQ, "0"); snap = {}; J.set(SNAP, snap);
        renderBtn(); o.close(); toast(mode === "in" ? "Angemeldet als " + r.name : "Konto erstellt. Willkommen, " + r.name + "!"); sync(true, true);
      } catch (e) { $("#ac-e").textContent = ERR.net; bt.disabled = false; bt.textContent = mode === "in" ? "Anmelden" : "Konto erstellen"; }
    };
    $("#ac-go").addEventListener("click", go); o.querySelectorAll("input").forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") go(); }));
    $("#ac-n").focus();
  }
  function menuDialog() {
    const used = ((acct.bytes || 0) / 1024).toFixed(1), pct = Math.min(100, Math.round((acct.bytes || 0) / 4000000 * 100));
    const o = modal(`<h3>Hallo, ${esc(acct.name)}!</h3><p>Du bist angemeldet. Deine Spielstände werden automatisch gesichert und auf anderen Geräten geladen, sobald du dich dort anmeldest.</p>
      <div class="amet"><div class="amet-b"><i style="width:${pct}%"></i></div><small>Gesicherte Daten: ${used} KB von 4000 KB</small></div>
      <div class="tf-err" id="ac-e" role="alert"></div>
      <div class="acts amenu"><button class="btn" type="button" data-a="close">Schließen</button><button class="btn" type="button" id="ac-save">Jetzt sichern</button><button class="btn" type="button" id="ac-out">Abmelden</button><button class="btn" type="button" id="ac-del">Konto löschen</button></div>`);
    const $ = s => o.querySelector(s);
    $("#ac-save").addEventListener("click", async () => { $("#ac-save").disabled = true; $("#ac-save").textContent = "Sichere …"; await sync(true); $("#ac-save").textContent = "Gesichert ✓"; setTimeout(() => { if (o.isConnected) { o.close(); menuDialog(); } }, 700); });
    $("#ac-out").addEventListener("click", async () => { try { await rpc("moki_acc_logout", { p_token: acct.token }); } catch (e) {} logoutLocal(); o.close(); toast("Abgemeldet. Deine Spielstände bleiben auf diesem Gerät und im Konto."); });
    $("#ac-del").addEventListener("click", () => {
      $(".acts").style.display = "none"; $("p").textContent = "Konto wirklich löschen? Alle gesicherten Spielstände im Konto werden gelöscht. Auf diesem Gerät bleibt alles. Gib zur Bestätigung dein Passwort ein.";
      $("#ac-e").insertAdjacentHTML("beforebegin", '<input id="ac-dp" class="tf-in-txt" type="password" placeholder="Passwort" autocomplete="current-password">'); const row = document.createElement("div"); row.className = "acts"; row.innerHTML = '<button class="btn" type="button" data-a="close">Abbrechen</button><button class="btn go" type="button" id="ac-dgo">Endgültig löschen</button>'; $(".box").appendChild(row);
      row.querySelector("#ac-dgo").addEventListener("click", async () => { try { const r = await rpc("moki_acc_delete", { p_token: acct.token, p_pw: $("#ac-dp").value }); if (r.ok) { logoutLocal(); o.close(); toast("Konto gelöscht."); } else $("#ac-e").textContent = r.err === "bad" ? "Das Passwort stimmt nicht." : ERR.session; } catch (e) { $("#ac-e").textContent = ERR.net; } });
    });
  }
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("#acc"); if (!b) return; e.preventDefault(); if (acct) menuDialog(); else authDialog("in"); });
  renderBtn(); setTimeout(renderBtn, 600);
  if (acct) setTimeout(() => sync(false, true), 1200);
  window.MOKI_ACC = { get name() { return acct && acct.name; }, sync: () => sync(true) };
})();
