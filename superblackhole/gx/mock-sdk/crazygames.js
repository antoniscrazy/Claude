// Lokaler Mock-Adapter „CrazyGames SDK v3“ v1.0.0 – erzeugt von Game Extractor Studio PRO.
// Nur für lokale Tests. Anmeldung, Käufe, Belohnungen und Serverantworten werden nicht vorgetäuscht.
(function () {
  'use strict';
  var spec = {
 "id": "crazygames",
 "entry": {
  "global": "CrazyGames",
  "path": "SDK"
 },
 "properties": {
  "environment": "local",
  "user.isUserAccountAvailable": false,
  "user.systemInfo": {
   "countryCode": "XX",
   "locale": "$lang",
   "browser": {
    "name": "Chromium"
   },
   "os": {
    "name": "local"
   },
   "device": {
    "type": "desktop"
   }
  },
  "game.settings": {
   "disableChat": true,
   "muteAudio": false
  }
 },
 "methods": [
  {
   "path": "init",
   "kind": "async",
   "behavior": "resolve"
  },
  {
   "path": "game.loadingStart",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "game.loadingStop",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "game.gameplayStart",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "game.gameplayStop",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "game.sdkGameLoadingStart",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "game.sdkGameLoadingStop",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "game.happytime",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "game.addSettingsChangeListener",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "game.removeSettingsChangeListener",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "user.addAuthListener",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "user.removeAuthListener",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "banner.clearBanner",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "banner.clearAllBanners",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "data.getItem",
   "kind": "sync",
   "behavior": "storage.get"
  },
  {
   "path": "data.setItem",
   "kind": "sync",
   "behavior": "storage.set"
  },
  {
   "path": "data.removeItem",
   "kind": "sync",
   "behavior": "storage.remove"
  },
  {
   "path": "data.clear",
   "kind": "sync",
   "behavior": "storage.clear"
  },
  {
   "path": "ad.requestAd",
   "kind": "sync",
   "behavior": "ad.skipped",
   "value": {
    "callback": "adError",
    "args": [
     {
      "code": "unfilled",
      "message": "Lokale Testumgebung ohne Werbung"
     }
    ]
   }
  },
  {
   "path": "ad.hasAdblock",
   "kind": "async",
   "behavior": "resolve",
   "value": false
  },
  {
   "path": "ad.prefetchAd",
   "kind": "sync",
   "behavior": "noop"
  },
  {
   "path": "banner.requestBanner",
   "kind": "async",
   "behavior": "unsupported",
   "note": "Keine Werbebanner lokal"
  },
  {
   "path": "banner.requestResponsiveBanner",
   "kind": "async",
   "behavior": "unsupported",
   "note": "Keine Werbebanner lokal"
  },
  {
   "path": "user.getUser",
   "kind": "async",
   "behavior": "resolve",
   "value": null
  },
  {
   "path": "user.showAuthPrompt",
   "kind": "async",
   "behavior": "unsupported",
   "note": "Anmeldung und Konten können lokal nicht nachgebildet werden"
  },
  {
   "path": "user.getUserToken",
   "kind": "async",
   "behavior": "unsupported",
   "note": "Anmeldung und Konten können lokal nicht nachgebildet werden"
  },
  {
   "path": "user.showAccountLinkPrompt",
   "kind": "async",
   "behavior": "unsupported",
   "note": "Anmeldung und Konten können lokal nicht nachgebildet werden"
  },
  {
   "path": "user.getXsollaUserToken",
   "kind": "async",
   "behavior": "unsupported",
   "note": "Anmeldung und Konten können lokal nicht nachgebildet werden"
  },
  {
   "path": "user.submitScore",
   "kind": "async",
   "behavior": "unsupported",
   "note": "Benötigt den Plattform-Server"
  },
  {
   "path": "game.inviteLink",
   "kind": "async",
   "behavior": "unsupported",
   "note": "Benötigt den Plattform-Server"
  },
  {
   "path": "game.showInviteButton",
   "kind": "async",
   "behavior": "unsupported",
   "note": "Benötigt den Plattform-Server"
  }
 ],
 "objects": {}
};

  var gx = window.__gx || (window.__gx = { sdkCalls: [], sdkUnsupported: [], ready: [], errors: [] });
  var NS = 'gx-sdk:' + spec.id + ':';
  var memory = {};
  var store = {
    get: function (k) { try { var v = window.localStorage.getItem(NS + k); return v === null ? null : v; } catch (e) { return k in memory ? memory[k] : null; } },
    set: function (k, v) { memory[k] = String(v); try { window.localStorage.setItem(NS + k, String(v)); } catch (e) {} },
    remove: function (k) { delete memory[k]; try { window.localStorage.removeItem(NS + k); } catch (e) {} },
    clear: function () { memory = {}; try { Object.keys(window.localStorage).forEach(function (k) { if (k.indexOf(NS) === 0) window.localStorage.removeItem(k); }); } catch (e) {} },
    json: function (k, d) { try { var v = this.get(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  };
  var lang = (window.navigator && window.navigator.language || 'en').slice(0, 2);
  var listeners = {};
  function note(list, entry) { if (list.length < 400) list.push(entry); }
  function resolveValue(v) {
    if (v === '$lang') return lang;
    if (v && typeof v === 'object') { var c = Array.isArray(v) ? [] : {}; for (var k in v) c[k] = resolveValue(v[k]); return c; }
    return v;
  }
  function plain(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function pick(obj, keys) { obj = plain(obj); if (!Array.isArray(keys)) return obj; var out = {}; keys.forEach(function (k) { if (k in obj) out[k] = obj[k]; }); return out; }
  function entry(board) { var s = store.json('board:' + board, null); return s === null ? null : { score: s.score, extraData: s.extraData || '', rank: 1, formattedScore: String(s.score), player: { publicName: 'Lokaler Test', uniqueID: 'local-test-player' } }; }
  var behaviors = {
    noop: function () {}, log: function () {},
    'return': function (m) { return resolveValue(m.value); },
    resolve: function (m) { return resolveValue(m.value); },
    object: function (m) { return build(spec.objects[m.object], {}, m.object + '.'); },
    'event.on': function (m, a) { (listeners[a[0]] || (listeners[a[0]] = [])).push(a[1]); },
    'event.off': function (m, a) { listeners[a[0]] = (listeners[a[0]] || []).filter(function (f) { return f !== a[1]; }); },
    'storage.get': function (m, a) { return store.get('item:' + a[0]); },
    'storage.set': function (m, a) { store.set('item:' + a[0], a[1]); },
    'storage.remove': function (m, a) { store.remove('item:' + a[0]); },
    'storage.clear': function () { store.clear(); },
    'player.getData': function (m, a) { return pick(store.json('data', {}), a[0]); },
    'player.setData': function (m, a) { store.set('data', JSON.stringify(plain(a[0]))); },
    'player.getStats': function (m, a) { return pick(store.json('stats', {}), a[0]); },
    'player.setStats': function (m, a) { store.set('stats', JSON.stringify(plain(a[0]))); },
    'player.incrementStats': function (m, a) { var s = plain(store.json('stats', {})); var add = plain(a[0]); for (var k in add) s[k] = (Number(s[k]) || 0) + Number(add[k]); store.set('stats', JSON.stringify(s)); return s; },
    'leaderboard.set': function (m, a) { var old = store.json('board:' + a[0], null); if (!old || a[1] > old.score) store.set('board:' + a[0], JSON.stringify({ score: a[1], extraData: a[2] })); },
    'leaderboard.get': function (m, a) { var e = entry(a[0]); return { leaderboard: { name: a[0] }, entries: e ? [e] : [], userRank: e ? 1 : 0, ranges: [] }; },
    'leaderboard.entry': function (m, a) { var e = entry(a[0]); if (!e) { var err = new Error('LEADERBOARD_PLAYER_NOT_PRESENT'); err.code = 'LEADERBOARD_PLAYER_NOT_PRESENT'; throw err; } return e; },
    'ad.skipped': function (m, a) {
      var callbacks = null;
      for (var i = 0; i < a.length; i++) { var x = a[i]; if (x && typeof x === 'object') callbacks = x.callbacks || x; }
      var fn = callbacks && callbacks[m.value.callback];
      if (typeof fn === 'function') window.setTimeout(function () { fn.apply(null, resolveValue(m.value.args || [])); }, 0);
    },
    language: function () { return lang; },
    time: function () { return Date.now(); },
    unsupported: function (m) { var e = new Error('[Mock-SDK ' + spec.id + '] Nicht unterstützt: ' + m.path + (m.note ? ' – ' + m.note : '')); e.gxUnsupported = true; throw e; }
  };
  function wrap(m, label) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      note(gx.sdkCalls, spec.id + ':' + label);
      if (m.behavior === 'unsupported') note(gx.sdkUnsupported, spec.id + ':' + label);
      if (/(ready|loadingStop|gameLoadingFinished|gameplayStart|GameplayAPI\.start)$/.test(label) && gx.signal) gx.signal('sdk:' + label);
      if (m.kind === 'async') {
        return new Promise(function (resolve, reject) { try { resolve(behaviors[m.behavior](m, args)); } catch (e) { reject(e); } });
      }
      return behaviors[m.behavior](m, args);
    };
  }
  function put(target, path, value) {
    var parts = path.split('.');
    for (var i = 0; i < parts.length - 1; i++) target = target[parts[i]] || (target[parts[i]] = {});
    target[parts[parts.length - 1]] = value;
  }
  // Unbekannte Member werden protokolliert und bleiben undefiniert – es wird kein Erfolg erfunden.
  function guard(obj, label) {
    if (typeof window.Proxy !== 'function' && typeof Proxy !== 'function') return obj;
    for (var k in obj) if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) obj[k] = guard(obj[k], label + k + '.');
    return new Proxy(obj, { get: function (t, key) {
      if (typeof key === 'string' && !(key in t) && key !== 'then' && key !== 'toJSON') note(gx.sdkUnsupported, spec.id + ':' + label + key);
      return t[key];
    } });
  }
  function build(methods, target, prefix) {
    methods.forEach(function (m) { put(target, m.path, wrap(m, prefix + m.path)); });
    return guard(target, prefix);
  }
  function api() {
    var target = {};
    for (var p in spec.properties) put(target, p, resolveValue(spec.properties[p]));
    return build(spec.methods, target, '');
  }
  var root;
  if (spec.entry.factory) {
    var instance = null;
    root = {};
    root[spec.entry.factory] = function () { note(gx.sdkCalls, spec.id + ':' + spec.entry.factory); return Promise.resolve(instance || (instance = api())); };
  } else if (spec.entry.path) {
    root = {};
    put(root, spec.entry.path, api());
  } else root = api();
  if (!window[spec.entry.global]) window[spec.entry.global] = root;

})();
