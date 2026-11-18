// Platzhalter fuer Portal-Lader und Engine-Tracker: alles ist ein No-op, auch verschachtelte Aufrufe.
(function () {
  function deep() {
    var f = function () {};
    return new Proxy(f, {
      get: function (t, k) { return k === 'then' ? undefined : deep(); },
      apply: function () { return deep(); },
      construct: function () { return deep(); }
    });
  }
  window.GameLoader = deep();
  window.gameanalytics = deep();
  window.GameAnalytics = deep();
})();
