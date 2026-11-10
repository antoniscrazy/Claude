// Minimaler Reverse-Proxy für poki.com (keine Abhängigkeiten, Node 18+)
// Start: node server.js   -> dann http://localhost:8080 öffnen
const http = require("http");
const https = require("https");

const TARGET = "poki.com";
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  const headers = { ...req.headers, host: TARGET, "accept-encoding": "identity" };
  delete headers.origin;
  if (headers.referer) headers.referer = headers.referer.replace(/^https?:\/\/[^/]+/, "https://" + TARGET);

  const up = https.request(
    { host: TARGET, path: req.url, method: req.method, headers },
    (r) => {
      const h = { ...r.headers };
      // Einbett-/Sicherheitsheader entfernen
      delete h["content-security-policy"];
      delete h["content-security-policy-report-only"];
      delete h["x-frame-options"];
      delete h["strict-transport-security"];
      // Cookies auf lokale Domain umbiegen
      if (h["set-cookie"]) {
        h["set-cookie"] = h["set-cookie"].map((c) =>
          c.replace(/;\s*Domain=[^;]+/i, "").replace(/;\s*Secure/i, "").replace(/;\s*SameSite=None/i, "; SameSite=Lax")
        );
      }
      // Redirects auf poki.com zurück auf den Proxy leiten
      if (h.location) h.location = h.location.replace(/^https?:\/\/(www\.)?poki\.com/i, "");

      const type = h["content-type"] || "";
      if (/text\/html|javascript|json/.test(type)) {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => {
          const body = Buffer.from(
            Buffer.concat(chunks).toString("utf8").replace(/https?:\/\/(www\.)?poki\.com/g, "")
          );
          h["content-length"] = body.length;
          res.writeHead(r.statusCode, h);
          res.end(body);
        });
      } else {
        res.writeHead(r.statusCode, h);
        r.pipe(res);
      }
    }
  );
  up.on("error", (e) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end("Proxy-Fehler: " + e.message);
  });
  req.pipe(up);
});

server.listen(PORT, () => console.log("Poki-Proxy läuft auf http://localhost:" + PORT));
