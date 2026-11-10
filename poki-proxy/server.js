// Reverse-Proxy für poki.com inkl. Spiele-Hosts (games.poki.com, *.poki-gdn.com)
// Keine Abhängigkeiten, Node 18+.  Start: node server.js
//
// Routing:
//   /irgendwas              -> https://poki.com/irgendwas   (Hauptseite)
//   /__h/<host>/pfad        -> https://<host>/pfad          (nur erlaubte Hosts)
//   Relative Anfragen aus einer /__h/<host>/-Seite (laut echtem Referer)
//   gehen ebenfalls an <host>.
const http = require("http");
const https = require("https");

const MAIN = "poki.com";
const PORT = process.env.PORT || 8080;
const PREFIX = "/__h/";
const ALLOWED = /^([a-z0-9-]+\.)*(poki\.com|poki-gdn\.com)$/i;
const isMain = (h) => h === "poki.com" || h === "www.poki.com";

// Absolute URLs im Text (auch JSON-escaped: https://... oder https:\/\/...) umschreiben
const URL_RE = /https?:((?:\\u002F|\\\/|\/){2})((?:[a-z0-9-]+\.)*(?:poki\.com|poki-gdn\.com))/gi;
function rewriteText(s) {
  return s.replace(URL_RE, (m, sl, host) => {
    const unit = sl.startsWith("\\u002F") ? "\\u002F" : sl.startsWith("\\/") ? "\\/" : "/";
    host = host.toLowerCase();
    return isMain(host) ? "" : unit + "__h" + unit + host;
  });
}

function rewriteLocation(loc) {
  const m = /^https?:\/\/([^/]+)(\/.*)?$/i.exec(loc);
  if (!m) return loc;
  const host = m[1].toLowerCase();
  if (!ALLOWED.test(host)) return loc;
  return isMain(host) ? m[2] || "/" : PREFIX + host + (m[2] || "/");
}

// Ziel (Host + Pfad) aus der Anfrage bestimmen
function resolveTarget(req) {
  if (req.url.startsWith(PREFIX)) {
    const rest = req.url.slice(PREFIX.length);
    const i = rest.indexOf("/");
    const host = (i === -1 ? rest : rest.slice(0, i)).toLowerCase();
    return { host, path: i === -1 ? "/" : rest.slice(i) };
  }
  // Relative Anfrage aus einer Spiele-Seite? Dann steht der Host im echten Referer.
  const ref = req.headers.referer || "";
  const m = /^https?:\/\/[^/]+\/__h\/([^/]+)\//i.exec(ref);
  if (m) return { host: m[1].toLowerCase(), path: req.url };
  return { host: MAIN, path: req.url };
}

// Eine vom Browser gesendete Proxy-URL zurück auf die Original-URL abbilden
function unproxy(url, fallbackHost) {
  if (!url) return url;
  const m = /^https?:\/\/[^/]+(\/.*)?$/i.exec(url);
  if (!m) return url;
  let p = m[1] || "/";
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
// Wird in jede HTML-Seite eingefügt: registriert den Worker, lädt beim ersten Mal einmal neu.
const REG_TAG =
  "<script>(function(){if(!('serviceWorker' in navigator))return;" +
  "var top=window===window.top,k='__sw_reloaded';" +
  "navigator.serviceWorker.register('/__sw.js',{scope:'/'}).then(function(){return navigator.serviceWorker.ready}).then(function(){" +
  "if(top&&!navigator.serviceWorker.controller){try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch(e){}location.reload()}" +
  "}).catch(function(){})})();</script>";

const server = http.createServer((req, res) => {
  if (req.url === "/__sw.js") {
    res.writeHead(200, {
      "content-type": "application/javascript; charset=utf-8",
      "service-worker-allowed": "/",
      "cache-control": "no-cache",
    });
    return res.end(SW_JS);
  }
  const { host, path } = resolveTarget(req);
  if (!ALLOWED.test(host)) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    return res.end("Host nicht erlaubt: " + host);
  }

  const headers = { ...req.headers, host, "accept-encoding": "identity" };
  // Von Renders Infrastruktur angehängte Weiterleitungs-Header nicht an Poki durchreichen
  for (const k of Object.keys(headers)) {
    if (/^(x-forwarded-|x-real-ip|cf-|cdn-loop|rndr-|render-|true-client-ip|forwarded$|via$|x-request-id|x-render-)/i.test(k)) delete headers[k];
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
        let text = rewriteText(Buffer.concat(chunks).toString("utf8"));
        if (/text\/html/.test(type)) {
          text = /<head[^>]*>/i.test(text) ? text.replace(/<head[^>]*>/i, (m) => m + REG_TAG) : REG_TAG + text;
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

server.listen(PORT, () => console.log("Poki-Proxy läuft auf http://localhost:" + PORT));
