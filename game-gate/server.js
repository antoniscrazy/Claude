// Gate-Dienst: Admin-Bereich (Codes erstellen) + Code-Eingabe für die Spiele-Proxys.
// Keine Abhängigkeiten, Node 18+.
//
// Umgebungsvariablen:
//   ADMIN_PASSWORD      Passwort für den Admin-Bereich
//   SESSION_SECRET      gemeinsames Geheimnis mit den Proxys (signiert Zugangs-Tokens)
//   SUPABASE_URL        z. B. https://xxxx.supabase.co
//   SUPABASE_KEY        anon/publishable Key (Zugriff nur über die gate_* Funktionen)
//   DB_SECRET           Admin-Geheimnis der gate_* Datenbankfunktionen
//   POKI_URL, CRAZY_URL Adressen der beiden Proxys
const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 8090;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SECRET = process.env.SESSION_SECRET || "";
const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_KEY || "";
const DB_SECRET = process.env.DB_SECRET || "";
const SITES = {
  poki: { name: "Poki", url: (process.env.POKI_URL || "").replace(/\/$/, "") },
  crazygames: { name: "CrazyGames", url: (process.env.CRAZY_URL || "").replace(/\/$/, "") },
};
const configured = ADMIN_PASSWORD && SECRET && SB_URL && SB_KEY && DB_SECRET;

// ---------- Tokens ----------
function mac(body, purpose) {
  return crypto.createHmac("sha256", purpose ? SECRET + "|" + purpose : SECRET).update(body).digest("base64url");
}
function sign(payload, purpose) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return body + "." + mac(body, purpose);
}
function verify(token, purpose) {
  if (!token) return null;
  const [body, m] = String(token).split(".");
  if (!body || !m) return null;
  const a = Buffer.from(m), b = Buffer.from(mac(body, purpose));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p && p.exp > Date.now() ? p : null;
  } catch { return null; }
}
function getCookie(req, name) {
  for (const c of (req.headers.cookie || "").split(/;\s*/)) {
    const i = c.indexOf("=");
    if (i > 0 && c.slice(0, i) === name) return c.slice(i + 1);
  }
  return "";
}
const isHttps = (req) => req.headers["x-forwarded-proto"] === "https";
function cookie(req, name, value, maxAgeSec) {
  return `${name}=${value}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Strict${isHttps(req) ? "; Secure" : ""}`;
}

// ---------- Rate-Limit (pro IP, im Speicher) ----------
const buckets = new Map();
function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
}
function tooMany(req, bucket, max = 6, windowMs = 15 * 60 * 1000) {
  const k = bucket + ":" + clientIp(req);
  const now = Date.now();
  const e = buckets.get(k);
  return !!e && e.reset > now && e.n >= max;
}
function fail(req, bucket, windowMs = 15 * 60 * 1000) {
  const k = bucket + ":" + clientIp(req);
  const now = Date.now();
  const e = buckets.get(k);
  if (!e || e.reset <= now) buckets.set(k, { n: 1, reset: now + windowMs });
  else e.n++;
}
setInterval(() => { const n = Date.now(); for (const [k, v] of buckets) if (v.reset <= n) buckets.delete(k); }, 60000).unref();

// ---------- Datenbank (Supabase RPC) ----------
async function rpc(fn, args) {
  const headers = { apikey: SB_KEY, "content-type": "application/json" };
  if (SB_KEY.startsWith("eyJ")) headers.authorization = "Bearer " + SB_KEY;
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST", headers, body: JSON.stringify(args), signal: AbortSignal.timeout(12000),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${fn}: HTTP ${r.status} ${t.slice(0, 160)}`);
  return t ? JSON.parse(t) : null;
}

// ---------- Hilfen ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() {
  let c = "";
  for (let i = 0; i < 8; i++) c += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return c;
}
const fmtCode = (c) => c.slice(0, 4) + "-" + c.slice(4);
const normCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const dtf = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "short", timeStyle: "medium" });
function fmtDur(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return [h && h + " Std", m && m + " Min", (s || (!h && !m)) && s + " Sek"].filter(Boolean).join(" ");
}
function readForm(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => { d += c; if (d.length > 20000) req.destroy(); });
    req.on("end", () => resolve(Object.fromEntries(new URLSearchParams(d))));
    req.on("error", () => resolve({}));
  });
}
function send(res, status, html, headers = {}) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...headers });
  res.end(html);
}
function redirect(res, loc, headers = {}) {
  res.writeHead(302, { location: loc, "cache-control": "no-store", ...headers });
  res.end();
}

const CSS = `
:root{color-scheme:dark;--bg:#14151a;--card:#1e2028;--line:#2e313c;--text:#e8eaf0;--mut:#9aa0b0;--acc:#7c9cff;--bad:#ff6b6b;--ok:#5fd18a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.45 system-ui,sans-serif;padding:16px}
main{max-width:860px;margin:0 auto}h1{font-size:1.5rem;margin:.2em 0 .6em}h2{font-size:1.1rem;margin:0 0 .6em}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px}
input,button{font:inherit;border-radius:8px;border:1px solid var(--line);background:#14151a;color:var(--text);padding:10px 12px}
input{width:100%}button{background:var(--acc);color:#0b0d14;border:0;font-weight:600;cursor:pointer}
button.sec{background:transparent;color:var(--text);border:1px solid var(--line)}button.bad{background:var(--bad)}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:end}.row>div{flex:1;min-width:90px}label{display:block;color:var(--mut);font-size:.85rem;margin-bottom:4px}
.err{color:var(--bad);margin:.6em 0}.okbox{border:1px solid var(--ok);border-radius:10px;padding:12px;margin-bottom:16px}
.code{font:700 1.4rem ui-monospace,monospace;letter-spacing:.08em}.mut{color:var(--mut)}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:middle;font-size:.92rem}
th{color:var(--mut);font-weight:500}td form{display:inline}.tag{padding:2px 8px;border-radius:99px;font-size:.8rem;border:1px solid var(--line)}
.t-ok{color:var(--ok);border-color:var(--ok)}.t-bad{color:var(--bad);border-color:var(--bad)}
.scroll{overflow-x:auto}.top{display:flex;justify-content:space-between;align-items:center;gap:10px}
a.btn{display:block;text-align:center;text-decoration:none;background:var(--acc);color:#0b0d14;font-weight:600;border-radius:8px;padding:14px;margin:8px 0}
`;
const shell = (title, body, extraHead = "") =>
  `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style>${extraHead}</head><body><main>${body}</main></body></html>`;

// ---------- Seiten ----------
function loginPage(err) {
  return shell("Admin", `<h1>Admin-Bereich</h1><div class="card"><form method="post" action="/login">
    <label for="pw">Passwort</label><input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
    ${err ? `<div class="err">${esc(err)}</div>` : ""}<p><button>Anmelden</button></p></form></div>`);
}

function status(c) {
  const now = Date.now();
  if (c.revoked) return { t: "Gesperrt", cls: "t-bad", detail: "" };
  if (!c.redeemed_at) return { t: "Unbenutzt", cls: "", detail: "" };
  const exp = Date.parse(c.expires_at);
  if (exp > now) {
    const left = Math.ceil((exp - now) / 1000);
    return { t: "Aktiv", cls: "t-ok", detail: `bis ${dtf.format(exp)} (noch ${fmtDur(left)})` };
  }
  return { t: "Abgelaufen", cls: "", detail: dtf.format(exp) };
}

const REQUEST_OPTIONS = [[300, "5 Minuten"], [900, "15 Minuten"], [1800, "30 Minuten"], [3600, "1 Stunde"], [7200, "2 Stunden"]];
const ago = (t) => {
  const s = Math.max(0, Math.floor((Date.now() - Date.parse(t)) / 1000));
  return s < 60 ? "gerade eben" : s < 3600 ? `vor ${Math.floor(s / 60)} Min` : `vor ${Math.floor(s / 3600)} Std`;
};

async function adminPage(newCodes, err) {
  const [list, reqs] = await Promise.all([
    rpc("gate_list", { p_admin: DB_SECRET }),
    rpc("gate_requests", { p_admin: DB_SECRET }),
  ]);
  const reqRows = reqs.map((r) => `<tr><td>${esc(r.name || "(ohne Name)")}</td><td>${esc((SITES[r.site] || {}).name || "")}</td>
      <td><b>${esc(fmtDur(r.seconds))}</b></td><td class="mut">${esc(ago(r.created_at))}</td>
      <td><form method="post" action="/decide"><input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="approve" value="1"><button>Freigeben</button></form>
      <form method="post" action="/decide"><input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="approve" value="0"><button class="sec">Ablehnen</button></form></td></tr>`).join("");
  const reqCard = reqs.length
    ? `<div class="card" style="border-color:var(--acc)"><h2>Anfragen (${reqs.length})</h2><div class="scroll"><table><thead><tr><th>Name</th><th>Seite</th><th>Gewünscht</th><th></th><th></th></tr></thead><tbody>${reqRows}</tbody></table></div></div>`
    : "";
  const rows = list.map((c) => {
    const s = status(c);
    const canRevoke = !c.revoked && (!c.redeemed_at || Date.parse(c.expires_at) > Date.now());
    return `<tr><td class="code" style="font-size:1rem">${c.code.length === 8 ? esc(fmtCode(c.code)) : "Anfrage"}</td><td>${esc(c.label || "")}</td>
      <td>${esc(fmtDur(c.duration_seconds))}</td>
      <td><span class="tag ${s.cls}">${s.t}</span><div class="mut">${esc(s.detail)}</div></td>
      <td>${canRevoke ? `<form method="post" action="/revoke"><input type="hidden" name="id" value="${esc(c.id)}"><button class="sec">Sperren</button></form>` : ""}
      <form method="post" action="/delete"><input type="hidden" name="id" value="${esc(c.id)}"><button class="sec">Löschen</button></form></td></tr>`;
  }).join("");
  const fresh = newCodes.length
    ? `<div class="okbox"><b>Neue Codes</b> (einmalig einlösbar):${newCodes.map((c) => `<div class="code">${esc(fmtCode(c))}</div>`).join("")}</div>` : "";
  const links = Object.values(SITES).filter((s) => s.url).map((s) => `<a href="${esc(s.url)}" class="mut">${esc(s.name)}</a>`).join(" · ");
  return shell("Zugangscodes", `
    <div class="top"><h1>Zugangscodes</h1><form method="post" action="/logout"><button class="sec">Abmelden</button></form></div>
    ${fresh}${err ? `<div class="err">${esc(err)}</div>` : ""}${reqCard}
    <div class="card"><h2>Neuen Code erstellen</h2>
      <form method="post" action="/create"><div class="row">
        <div><label for="h">Stunden</label><input id="h" name="h" type="number" min="0" max="999" value="0"></div>
        <div><label for="m">Minuten</label><input id="m" name="m" type="number" min="0" max="59" value="30"></div>
        <div><label for="s">Sekunden</label><input id="s" name="s" type="number" min="0" max="59" value="0"></div>
        <div><label for="n">Anzahl</label><input id="n" name="n" type="number" min="1" max="10" value="1"></div>
        <div style="flex:2"><label for="l">Notiz (optional)</label><input id="l" name="label" maxlength="60" placeholder="z. B. für Max"></div>
        <div style="flex:0"><button>Erstellen</button></div></div></form>
      <p class="mut">Die Zeit läuft ab dem Moment, in dem der Code eingelöst wird.</p></div>
    <div class="card"><h2>Codes</h2><div class="scroll"><table><thead><tr><th>Code</th><th>Notiz</th><th>Dauer</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="mut">Noch keine Codes.</td></tr>`}</tbody></table></div></div>
    <p class="mut">${links}</p>
    <script>setInterval(function(){var a=document.activeElement;if(!a||a.tagName!=='INPUT')location.reload()},15000)</script>`);
}

function codePage(site, err) {
  const s = SITES[site];
  return shell("Zugangscode", `<h1>${s ? esc(s.name) : "Spiele"} – Zugangscode</h1><div class="card"><form method="post" action="/redeem">
    <input type="hidden" name="site" value="${esc(site || "")}">
    <label for="c">Code eingeben</label>
    <input id="c" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX" maxlength="12" autofocus required style="font-size:1.4rem;letter-spacing:.1em;text-transform:uppercase">
    ${err ? `<div class="err">${esc(err)}</div>` : ""}<p><button>Freischalten</button></p></form></div>
    <div class="card"><h2>Keinen Code?</h2><p class="mut">Frag um eine Zeit an. Du bekommst Zugang, sobald es freigegeben wird.</p>
    <form method="post" action="/request"><input type="hidden" name="site" value="${esc(site || "")}">
      <div class="row"><div><label for="sec">Wie lange?</label><select id="sec" name="seconds" style="width:100%;font:inherit;border-radius:8px;border:1px solid var(--line);background:#14151a;color:var(--text);padding:10px 12px">
        ${REQUEST_OPTIONS.map(([v, t]) => `<option value="${v}"${v === 1800 ? " selected" : ""}>${t}</option>`).join("")}</select></div>
      <div style="flex:2"><label for="nm">Dein Name</label><input id="nm" name="name" maxlength="40" placeholder="Name"></div>
      <div style="flex:0"><button class="sec">Anfragen</button></div></div></form></div>`);
}

function waitPage(site) {
  return shell("Anfrage gesendet", `<h1>Anfrage gesendet</h1><div class="card"><p id="msg">Warte auf Freigabe …</p><p class="mut">Diese Seite bitte offen lassen. Es geht automatisch weiter.</p>
    <p><a href="/go${site ? "?site=" + esc(site) : ""}" class="mut">Abbrechen</a></p></div>
    <script>(function(){var t=setInterval(function(){fetch('/wait/status',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
      if(d.status==='granted'||d.status==='claimed'){clearInterval(t);location.href='/go${site ? "?site=" + esc(site) : ""}'}
      else if(d.status==='denied'){clearInterval(t);document.getElementById('msg').textContent='Abgelehnt.'}
      else if(d.status==='none'){clearInterval(t);location.href='/go${site ? "?site=" + esc(site) : ""}'}
    }).catch(function(){})},3000)})()</script>`);
}

function chooserPage(exp) {
  const links = Object.entries(SITES).filter(([, s]) => s.url).map(([k, s]) => `<a class="btn" href="/go?site=${k}">${esc(s.name)}</a>`).join("");
  return shell("Freigeschaltet", `<h1>Freigeschaltet</h1><div class="card"><p>Dein Zugang gilt bis <b>${esc(dtf.format(exp))}</b>.</p>${links}</div>`);
}

// ---------- Server ----------
const server = http.createServer(async (req, res) => {
  try {
    if (!configured) return send(res, 503, shell("Nicht konfiguriert", "<h1>Gesperrt</h1><p>Dienst ist nicht konfiguriert.</p>"));
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    const admin = !!verify(getCookie(req, "ga"), "admin");

    // --- Admin ---
    if (p === "/" && req.method === "GET") {
      if (!admin) return send(res, 200, loginPage());
      const nc = (url.searchParams.get("new") || "").split(",").filter((c) => /^[A-Z0-9]{8}$/.test(c));
      return send(res, 200, await adminPage(nc, url.searchParams.get("err")));
    }
    if (p === "/login" && req.method === "POST") {
      if (tooMany(req, "login")) return send(res, 429, loginPage("Zu viele Versuche. Bitte in 15 Minuten erneut versuchen."));
      const f = await readForm(req);
      const a = Buffer.from(String(f.password || "")), b = Buffer.from(ADMIN_PASSWORD);
      const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
      if (!ok) { fail(req, "login"); return send(res, 401, loginPage("Falsches Passwort.")); }
      return redirect(res, "/", { "set-cookie": cookie(req, "ga", sign({ exp: Date.now() + 12 * 3600e3 }, "admin"), 12 * 3600) });
    }
    if (p === "/logout" && req.method === "POST") return redirect(res, "/", { "set-cookie": cookie(req, "ga", "", 0) });

    if (["/create", "/revoke", "/delete"].includes(p) && req.method === "POST") {
      if (!admin) return redirect(res, "/");
      const f = await readForm(req);
      if (p === "/create") {
        const secs = (parseInt(f.h) || 0) * 3600 + (parseInt(f.m) || 0) * 60 + (parseInt(f.s) || 0);
        const n = Math.min(10, Math.max(1, parseInt(f.n) || 1));
        if (secs < 1 || secs > 999 * 3600) return redirect(res, "/?err=" + encodeURIComponent("Bitte eine Dauer größer als 0 angeben."));
        const made = [];
        for (let i = 0; i < n; i++) {
          const code = newCode();
          await rpc("gate_create", { p_admin: DB_SECRET, p_code: code, p_seconds: secs, p_label: String(f.label || "").slice(0, 60) });
          made.push(code);
        }
        return redirect(res, "/?new=" + made.join(","));
      }
      if (/^[0-9a-f-]{36}$/.test(f.id || "")) {
        await rpc(p === "/revoke" ? "gate_revoke" : "gate_delete", { p_admin: DB_SECRET, p_id: f.id });
      }
      return redirect(res, "/");
    }

    // --- Nutzer: Code einlösen ---
    if (p === "/go" && req.method === "GET") {
      const site = url.searchParams.get("site");
      const sess = verify(getCookie(req, "gg"));
      if (sess && (await rpc("gate_check", { p_id: sess.cid }))) {
        if (site && SITES[site] && SITES[site].url) {
          const token = getCookie(req, "gg");
          return redirect(res, `${SITES[site].url}/__auth?t=${encodeURIComponent(token)}`);
        }
        return send(res, 200, chooserPage(sess.exp));
      }
      return send(res, 200, codePage(SITES[site] ? site : ""));
    }
    if (p === "/redeem" && req.method === "POST") {
      const f = await readForm(req);
      const site = SITES[f.site] ? f.site : "";
      if (tooMany(req, "redeem")) return send(res, 429, codePage(site, "Zu viele Versuche. Bitte in 15 Minuten erneut versuchen."));
      const code = normCode(f.code);
      const rows = code.length === 8 ? await rpc("gate_redeem", { p_code: code }) : [];
      if (!rows || !rows.length) { fail(req, "redeem"); return send(res, 401, codePage(site, "Code ungültig oder schon benutzt.")); }
      const exp = Date.parse(rows[0].expires_at);
      const token = sign({ cid: rows[0].id, exp });
      return redirect(res, "/go" + (site ? "?site=" + site : ""), {
        "set-cookie": cookie(req, "gg", token, Math.max(1, Math.ceil((exp - Date.now()) / 1000))),
      });
    }

    // --- Nutzer: Zeit anfragen (ohne Code) ---
    if (p === "/request" && req.method === "POST") {
      const f = await readForm(req);
      const site = SITES[f.site] ? f.site : "";
      if (tooMany(req, "request", 5)) return send(res, 429, codePage(site, "Zu viele Anfragen. Bitte später erneut versuchen."));
      fail(req, "request"); // jede Anfrage zählt
      const secs = REQUEST_OPTIONS.map(([v]) => v).includes(parseInt(f.seconds)) ? parseInt(f.seconds) : 900;
      let id;
      try {
        id = await rpc("gate_request", { p_site: site, p_name: String(f.name || "").trim().slice(0, 40), p_seconds: secs });
      } catch (e) {
        return send(res, 503, codePage(site, "Gerade sind zu viele Anfragen offen. Bitte später erneut versuchen."));
      }
      return redirect(res, "/wait" + (site ? "?site=" + site : ""), { "set-cookie": cookie(req, "gr", id, 3600) });
    }
    if (p === "/wait" && req.method === "GET") {
      const site = SITES[url.searchParams.get("site")] ? url.searchParams.get("site") : "";
      if (!/^[0-9a-f-]{36}$/.test(getCookie(req, "gr"))) return redirect(res, "/go" + (site ? "?site=" + site : ""));
      return send(res, 200, waitPage(site));
    }
    if (p === "/wait/status" && req.method === "GET") {
      const id = getCookie(req, "gr");
      const out = (obj, headers = {}) => {
        res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", ...headers });
        res.end(JSON.stringify(obj));
      };
      if (!/^[0-9a-f-]{36}$/.test(id)) return out({ status: "none" });
      const st = await rpc("gate_request_status", { p_id: id });
      if (st === "approved") {
        const rows = await rpc("gate_claim", { p_id: id });
        if (rows && rows.length) {
          const exp = Date.parse(rows[0].expires_at);
          const token = sign({ cid: rows[0].id, exp });
          return out({ status: "granted" }, { "set-cookie": cookie(req, "gg", token, Math.max(1, Math.ceil((exp - Date.now()) / 1000))) });
        }
        return out({ status: "claimed" });
      }
      return out({ status: st || "none" });
    }
    if (p === "/decide" && req.method === "POST") {
      if (!admin) return redirect(res, "/");
      const f = await readForm(req);
      if (/^[0-9a-f-]{36}$/.test(f.id || "")) await rpc("gate_decide", { p_admin: DB_SECRET, p_id: f.id, p_approve: f.approve === "1" });
      return redirect(res, "/");
    }

    // --- Proxys fragen: ist der Code noch gültig (nicht gesperrt/abgelaufen)? ---
    if (p === "/api/valid" && req.method === "GET") {
      const cid = url.searchParams.get("cid") || "";
      let valid = false;
      if (/^[0-9a-f-]{36}$/.test(cid)) valid = !!(await rpc("gate_check", { p_id: cid }));
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      return res.end(JSON.stringify({ valid }));
    }

    send(res, 404, shell("Nicht gefunden", "<h1>404</h1>"));
  } catch (e) {
    console.error(e.message);
    send(res, 500, shell("Fehler", `<h1>Fehler</h1><p class="mut">Die Datenbank ist gerade nicht erreichbar. Bitte gleich nochmal versuchen.</p>`));
  }
});

server.listen(PORT, () => console.log("Gate läuft auf Port " + PORT + (configured ? "" : " [NICHT KONFIGURIERT]")));
