// Diagnose- und Kompatibilitätslaufzeit. Wird nur vom lokalen Spielserver in HTML eingefügt.
(function () {
  'use strict';
  if (window.__gx) return;
  var cfg = window.__GX_CONFIG__ || { urlMap: {}, disableServiceWorker: false };
  var gx = window.__gx = {
    errors: [], sdkCalls: [], sdkUnsupported: [], ready: [], canvasContexts: [], frames: 0, startedAt: Date.now(),
  };
  function push(list, item) { if (list.length < 300) list.push(item); }
  function text(v) {
    if (v instanceof Error) return v.name + ': ' + v.message;
    if (typeof v === 'object') { try { return JSON.stringify(v); } catch (e) { return String(v); } }
    return String(v);
  }

  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && (t.src || t.href)) {
      push(gx.errors, { kind: 'resource', message: 'Ressource nicht geladen: ' + (t.tagName || '').toLowerCase(), url: String(t.src || t.href) });
    } else {
      push(gx.errors, { kind: 'js', message: e.error ? text(e.error) : String(e.message), url: String(e.filename || '') });
    }
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    push(gx.errors, { kind: 'promise', message: text(e.reason), url: '' });
  });
  var origError = console.error;
  console.error = function () {
    push(gx.errors, { kind: 'console', message: Array.prototype.map.call(arguments, text).join(' ').slice(0, 600), url: '' });
    return origError.apply(console, arguments);
  };

  // Bekannte externe URLs auf lokale Pfade umlenken (auch zur Laufzeit zusammengesetzte).
  function mapUrl(u) {
    if (typeof u !== 'string' && !(u instanceof URL)) return u;
    var s = String(u);
    var abs;
    try { abs = new URL(s, location.href).href; } catch (e) { return u; }
    for (var key in cfg.urlMap) {
      var full = key.indexOf('//') === 0 ? location.protocol + key : key;
      if (abs === full || abs.split(/[?#]/)[0] === full) return cfg.urlMap[key];
      if (full.charAt(full.length - 1) === '/' && abs.indexOf(full) === 0) return cfg.urlMap[key] + abs.slice(full.length);
    }
    return u;
  }
  if (window.fetch) {
    var origFetch = window.fetch;
    window.fetch = function (input, init) {
      if (typeof input === 'string' || input instanceof URL) input = mapUrl(input);
      return origFetch.call(this, input, init);
    };
  }
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    var args = Array.prototype.slice.call(arguments);
    args[1] = mapUrl(url);
    return origOpen.apply(this, args);
  };
  [[window.HTMLScriptElement, 'src'], [window.HTMLImageElement, 'src'], [window.HTMLMediaElement, 'src'], [window.HTMLLinkElement, 'href']]
    .forEach(function (pair) {
      if (!pair[0]) return;
      var d = Object.getOwnPropertyDescriptor(pair[0].prototype, pair[1]);
      if (!d || !d.set) return;
      Object.defineProperty(pair[0].prototype, pair[1], {
        configurable: true, enumerable: d.enumerable, get: d.get,
        set: function (v) { d.set.call(this, mapUrl(v)); },
      });
    });

  if (cfg.disableServiceWorker && navigator.serviceWorker) {
    navigator.serviceWorker.register = function () { return Promise.reject(new Error('Service Worker ist in der lokalen Vorschau deaktiviert')); };
  }

  // Gewöhnliche Polyfills für alte Präfix-Schnittstellen.
  ['webkit', 'moz', 'ms'].forEach(function (p) {
    if (!window[p + 'RequestAnimationFrame']) window[p + 'RequestAnimationFrame'] = window.requestAnimationFrame.bind(window);
    if (!window[p + 'CancelAnimationFrame']) window[p + 'CancelAnimationFrame'] = window.cancelAnimationFrame.bind(window);
  });
  if (!window.webkitAudioContext && window.AudioContext) window.webkitAudioContext = window.AudioContext;
  if (!window.webkitURL) window.webkitURL = window.URL;

  // Canvas- und Render-Beobachtung.
  var getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type) {
    var ctx = getContext.apply(this, arguments);
    if (ctx) push(gx.canvasContexts, { type: String(type), canvas: this });
    return ctx;
  };
  var raf = window.requestAnimationFrame;
  window.requestAnimationFrame = function (cb) {
    return raf.call(window, function (t) { gx.frames++; cb(t); });
  };

  gx.signal = function (name) { if (gx.ready.indexOf(name) < 0) gx.ready.push(name); };

  // Unity: Fortschritt der createUnityInstance-Promise beobachten.
  var unityFactory;
  try {
    Object.defineProperty(window, 'createUnityInstance', {
      configurable: true,
      get: function () { return unityFactory; },
      set: function (fn) {
        unityFactory = typeof fn !== 'function' ? fn : function () {
          var p = fn.apply(this, arguments);
          if (p && p.then) p.then(function () { gx.signal('unity:instance'); }, function () {});
          return p;
        };
      },
    });
  } catch (e) { /* bereits definiert */ }

  gx.snapshot = function () {
    var canvases = Array.prototype.map.call(document.querySelectorAll('canvas'), function (c) {
      var r = c.getBoundingClientRect();
      var used = gx.canvasContexts.some(function (x) { return x.canvas === c; });
      return { width: c.width, height: c.height, visible: r.width > 2 && r.height > 2, context: used };
    });
    // Engine-spezifische, dokumentierte Bereitschaftsmerkmale.
    if (window.c3_runtimeInterface || window.cr_getC2Runtime) gx.signal('construct:runtime');
    if (window.Phaser && gx.frames > 5) gx.signal('phaser:running');
    var status = document.getElementById('status');
    if (window.Engine && window.Engine.isWebGLAvailable && (!status || getComputedStyle(status).display === 'none')) gx.signal('godot:started');
    return {
      url: location.href, readyState: document.readyState, errors: gx.errors.slice(), ready: gx.ready.slice(),
      canvases: canvases, frames: gx.frames, textLength: document.body ? document.body.innerText.trim().length : 0,
      elements: document.body ? document.body.getElementsByTagName('*').length : 0,
      sdkCalls: gx.sdkCalls.slice(-100), sdkUnsupported: gx.sdkUnsupported.slice(),
    };
  };
})();
