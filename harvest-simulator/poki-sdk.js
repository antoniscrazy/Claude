// Platzhalter fuer das Poki-SDK: keine Werbung, keine Tracker. Belohnungen gelten sofort als angesehen.
(function () {
  var ok = function () { return Promise.resolve(); };
  window.PokiSDK = {
    init: ok, setDebug: function () {}, gameLoadingStart: function () {}, gameLoadingFinished: function () {},
    gameplayStart: function () {}, gameplayStop: function () {}, happyTime: function () {}, customEvent: function () {}, measure: function () {},
    commercialBreak: ok, rewardedBreak: function () { return Promise.resolve(true); },
    displayAd: function () {}, destroyAd: function () {}, isAdBlocked: function () { return false; },
    getLanguage: function () { return "en"; }, getURLParam: function () { return ""; }, shareableURL: function () { return Promise.resolve(location.href); },
    enableEventTracking: function () {}, logError: function () {}
  };
})();
