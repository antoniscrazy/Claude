(function () {
  var box = document.createElement("pre");
  box.style.cssText = "position:fixed;left:0;bottom:0;max-height:45%;max-width:65%;overflow:hidden;margin:0;padding:4px;font:11px/1.25 monospace;color:#0f0;background:rgba(0,0,0,.78);z-index:2147483647;pointer-events:none;white-space:pre-wrap;word-break:break-all";
  var lines = [];
  function log(m) { lines.push(String(m).slice(0, 140)); if (lines.length > 40) lines.splice(1, 1); box.textContent = lines.join("\n"); if (!box.parentNode && document.documentElement) document.documentElement.appendChild(box); }
  log("DIAGNOSE (Bild machen, bitte)");
  var xo = XMLHttpRequest.prototype.open, xs = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__u = String(u).replace(/^.*game\.local\//, ""); return xo.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () { var x = this; x.addEventListener("loadend", function () { var n = (x.response && (x.response.length || x.response.byteLength || x.response.size)) || (x.responseText && x.responseText.length) || 0; if (x.status !== 200 && x.status !== 0 || !n) log("XHR " + x.status + " n=" + n + " " + x.__u); else if (/json|strings|levels/.test(x.__u)) log("XHR ok n=" + n + " " + x.__u); }); return xs.apply(this, arguments); };
  var f = window.fetch; window.fetch = function (r) { var u = String(r && r.url || r).replace(/^.*game\.local\//, ""); return f.apply(this, arguments).then(function (res) { if (!res.ok || /json|strings|levels/.test(u)) log("FETCH " + res.status + " " + u); return res; }, function (e) { log("FETCH FEHLER " + u + " " + e); throw e; }); };
  window.addEventListener("error", function (e) { log("ERR " + e.message + " " + String(e.filename || "").slice(-30) + ":" + e.lineno); }, true);
  window.addEventListener("unhandledrejection", function (e) { log("REJECT " + (e.reason && (e.reason.message || e.reason))); });
  setTimeout(function () { try { document.fonts.forEach(function (ff) { log("FONT " + ff.family + " " + ff.status); }); } catch (e) {} log("UA " + navigator.userAgent.slice(-60)); log("worker=" + (typeof Worker) + " offscreen=" + (typeof OffscreenCanvas)); }, 8000);
})();
