// Reverse-Proxy für Spieleseiten (poki | crazygames) mit Code-Sperre.
// Keine Abhängigkeiten, Node 18+.
//
// Umgebungsvariablen:
//   SITE            poki | crazygames
//   GATE_URL        Adresse des Gate-Dienstes (https://...)
//   SESSION_SECRET  gemeinsames Geheimnis zum Prüfen der Zugangs-Tokens
//   DEV_NO_AUTH=1   NUR für lokale Tests: schaltet die Sperre aus
//
// Ohne GATE_URL/SESSION_SECRET ist der Proxy gesperrt (fail closed).
//
// Routing:
//   /irgendwas              -> https://<MAIN>/irgendwas
//   /__h/<host>/pfad        -> https://<host>/pfad   (nur erlaubte Hosts)
//   Relative Anfragen aus einer /__h/<host>/-Seite gehen laut echtem Referer an <host>.
const http = require("http");
const https = require("https");
const crypto = require("crypto");

const SITES = {
  poki: { main: "poki.com", aliases: ["poki.com", "www.poki.com"], domains: ["poki.com", "poki-gdn.com"] },
  crazygames: { main: "www.crazygames.com", aliases: ["crazygames.com", "www.crazygames.com"], domains: ["crazygames.com"] },
};
const SITE = process.env.SITE || "poki";
const cfg = SITES[SITE];
if (!cfg) throw new Error("Unbekannte SITE: " + SITE);

const MAIN = cfg.main;
const PORT = process.env.PORT || 8080;
const PREFIX = "/__h/";
const DEV = process.env.DEV_NO_AUTH === "1";
const SECRET = process.env.SESSION_SECRET || "";
const GATE_URL = (process.env.GATE_URL || "").replace(/\/$/, "");

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DOM = cfg.domains.map(escRe).join("|");
const ALLOWED = new RegExp("^([a-z0-9-]+\\.)*(" + DOM + ")$", "i");
const isMain = (h) => cfg.aliases.includes(h);

// ---------- Zugangs-Token (HMAC-signiert, vom Gate-Dienst ausgestellt) ----------
function hmac(body) {
  return crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
}
function verify(token) {
  if (!SECRET || !token) return null;
  const [body, mac] = String(token).split(".");
  if (!body || !mac) return null;
  const a = Buffer.from(mac), b = Buffer.from(hmac(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let p;
  try { p = JSON.parse(Buffer.from(body, "base64url").toString()); } catch { return null; }
  if (!p || !p.exp || p.exp <= Date.now()) return null;
  return p;
}
function getCookie(req, name) {
  for (const c of (req.headers.cookie || "").split(/;\s*/)) {
    const i = c.indexOf("=");
    if (i > 0 && c.slice(0, i) === name) return c.slice(i + 1);
  }
  return "";
}

// Gesperrte Codes: Gate kurz fragen (Cache 20 s). Ist das Gate nicht erreichbar,
// gilt der Token bis zu seinem eigenen Ablauf weiter.
const validCache = new Map();
async function stillValid(cid) {
  if (!cid) return true;
  const hit = validCache.get(cid);
  if (hit && Date.now() - hit.t < 20000) return hit.ok;
  let ok = true;
  try {
    const r = await fetch(GATE_URL + "/api/valid?cid=" + encodeURIComponent(cid), { signal: AbortSignal.timeout(4000) });
    if (r.ok) ok = !!(await r.json()).valid;
  } catch {}
  validCache.set(cid, { ok, t: Date.now() });
  return ok;
}

function deny(req, res) {
  const wantsPage =
    (req.headers.accept || "").includes("text/html") ||
    ["document", "iframe"].includes(req.headers["sec-fetch-dest"]);
  if (wantsPage) {
    res.writeHead(302, { location: GATE_URL + "/go?site=" + SITE, "cache-control": "no-store" });
    return res.end();
  }
  res.writeHead(401, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
  res.end("Zugang abgelaufen oder gesperrt");
}

// ---------- Umschreiben ----------
// Absolute URLs im Text (auch JSON-escaped: https://... oder https:\/\/...) umschreiben
const URL_RE = new RegExp(
  String.raw`https?:((?:\\u002F|\\\/|\/){2})((?:[a-z0-9-]+\.)*(?:${DOM}))`,
  "gi"
);
function rewriteText(s, origin) {
  return s.replace(URL_RE, (m, sl, host) => {
    const unit = sl.startsWith("\\u002F") ? "\\u002F" : sl.startsWith("\\/") ? "\\/" : "/";
    host = host.toLowerCase();
    // Volle Proxy-Adresse einsetzen (nicht nur einen Pfad), damit new URL(...) im Seitencode funktioniert
    return origin.proto + ":" + sl + origin.host + (isMain(host) ? "" : unit + "__h" + unit + host);
  });
}
function rewriteLocation(loc) {
  const m = /^https?:\/\/([^/]+)(\/.*)?$/i.exec(loc);
  if (!m) return loc;
  const host = m[1].toLowerCase();
  if (!ALLOWED.test(host)) return loc;
  return isMain(host) ? m[2] || "/" : PREFIX + host + (m[2] || "/");
}
function resolveTarget(req) {
  if (req.url.startsWith(PREFIX)) {
    const rest = req.url.slice(PREFIX.length);
    const i = rest.indexOf("/");
    const host = (i === -1 ? rest : rest.slice(0, i)).toLowerCase();
    return { host, path: i === -1 ? "/" : rest.slice(i) };
  }
  const ref = req.headers.referer || "";
  const m = /^https?:\/\/[^/]+\/__h\/([^/]+)\//i.exec(ref);
  if (m) return { host: m[1].toLowerCase(), path: req.url };
  return { host: MAIN, path: req.url };
}
// Vom Browser gesendete Proxy-URL zurück auf die Original-URL abbilden
function unproxy(url, fallbackHost) {
  if (!url) return url;
  const m = /^https?:\/\/[^/]+(\/.*)?$/i.exec(url);
  if (!m) return url;
  const p = m[1] || "/";
  if (p.startsWith(PREFIX)) {
    const rest = p.slice(PREFIX.length);
    const i = rest.indexOf("/");
    return "https://" + (i === -1 ? rest : rest.slice(0, i)) + (i === -1 ? "/" : rest.slice(i));
  }
  return "https://" + fallbackHost + p;
}

// Service Worker: leitet im Browser ALLE Anfragen an erlaubte Hosts (auch die, die
// erst im JavaScript zusammengebaut werden) über den Proxy.
const SW_JS = `
const ALLOWED = ${ALLOWED.toString()};
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (u.origin === self.location.origin || !ALLOWED.test(u.hostname)) return;
  const target = "/__h/" + u.hostname.toLowerCase() + u.pathname + u.search;
  e.respondWith(fetch(new Request(target, e.request)));
});
`;
// Wird in jede HTML-Seite eingefügt: registriert den Worker, lädt beim ersten Mal einmal neu,
// und lädt die Seite beim Ablauf der Zugangszeit neu (dann greift die Sperre).
function regTag(msLeft) {
  return (
    "<script>(function(){var top=window===window.top;" +
    (msLeft ? "if(top)setTimeout(function(){location.reload()}," + Math.max(1000, Math.floor(msLeft)) + ");" : "") +
    "if(!('serviceWorker' in navigator))return;var k='__sw_reloaded';" +
    "navigator.serviceWorker.register('/__sw.js',{scope:'/'}).then(function(){return navigator.serviceWorker.ready}).then(function(){" +
    "if(top&&!navigator.serviceWorker.controller){try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch(e){}location.reload()}" +
    "}).catch(function(){})})();</script>"
  );
}

const server = http.createServer(async (req, res) => {
  if (!DEV && (!SECRET || !GATE_URL)) {
    res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    return res.end("Gesperrt: Proxy ist nicht konfiguriert.");
  }

  // Zugang aus dem Gate übernehmen
  if (!DEV && req.url.startsWith("/__auth")) {
    const t = new URL(req.url, "http://x").searchParams.get("t");
    const s = verify(t);
    if (!s) return deny({ headers: { accept: "text/html" } }, res);
    res.writeHead(302, {
      location: "/",
      "cache-control": "no-store",
      "set-cookie": `gp=${t}; Path=/; Max-Age=${Math.ceil((s.exp - Date.now()) / 1000)}; HttpOnly; Secure; SameSite=Lax`,
    });
    return res.end();
  }

  let session = null;
  if (!DEV) {
    session = verify(getCookie(req, "gp"));
    if (!session || !(await stillValid(session.cid))) return deny(req, res);
  }

  if (req.url === "/__sw.js") {
    res.writeHead(200, {
      "content-type": "application/javascript; charset=utf-8",
      "service-worker-allowed": "/",
      "cache-control": "no-cache",
    });
    return res.end(SW_JS);
  }

  const origin = { proto: req.headers["x-forwarded-proto"] === "https" ? "https" : "http", host: req.headers.host };
  const { host, path } = resolveTarget(req);
  if (!ALLOWED.test(host)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    return res.end("Host nicht erlaubt: " + host);
  }

  const headers = { ...req.headers, host, "accept-encoding": "identity" };
  // Von Renders Infrastruktur angehängte Weiterleitungs-Header nicht an die Zielseite durchreichen
  for (const k of Object.keys(headers)) {
    if (/^(x-forwarded-|x-real-ip|cf-|cdn-loop|rndr-|render-|true-client-ip|forwarded$|via$|x-request-id|x-render-)/i.test(k)) delete headers[k];
  }
  // Unser Zugangs-Cookie gehört nicht zur Zielseite
  if (headers.cookie) {
    const c = headers.cookie.split(/;\s*/).filter((x) => !x.startsWith("gp=")).join("; ");
    if (c) headers.cookie = c; else delete headers.cookie;
  }
  if (headers.referer) headers.referer = unproxy(headers.referer, MAIN);
  if (headers.origin) headers.origin = "https://" + host;

  const up = https.request({ host, path, method: req.method, headers }, (r) => {
    const h = { ...r.headers };
    delete h["content-security-policy"];
    delete h["content-security-policy-report-only"];
    delete h["x-frame-options"];
    delete h["strict-transport-security"];
    if (h["set-cookie"]) {
      h["set-cookie"] = h["set-cookie"].map((c) =>
        c.replace(/;\s*Domain=[^;]+/i, "").replace(/;\s*Secure/i, "").replace(/;\s*SameSite=None/i, "; SameSite=Lax")
      );
    }
    if (h.location) h.location = rewriteLocation(h.location);

    const type = h["content-type"] || "";
    if (/text\/html|javascript|json|text\/css/.test(type)) {
      const chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => {
        let text = rewriteText(Buffer.concat(chunks).toString("utf8"), origin);
        if (/text\/html/.test(type)) {
          const tag = regTag(session ? session.exp - Date.now() : 0);
          text = /<head[^>]*>/i.test(text) ? text.replace(/<head[^>]*>/i, (m) => m + tag) : tag + text;
        }
        const body = Buffer.from(text);
        delete h["transfer-encoding"];
        h["content-length"] = body.length;
        res.writeHead(r.statusCode, h);
        res.end(body);
      });
    } else {
      res.writeHead(r.statusCode, h);
      r.pipe(res);
    }
  });
  up.on("error", (e) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end("Proxy-Fehler: " + e.message);
  });
  req.pipe(up);
});

server.listen(PORT, () => console.log(`Proxy (${SITE}) läuft auf Port ${PORT}${DEV ? " [DEV ohne Sperre]" : ""}`));
