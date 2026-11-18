// Platzhalter fuer das Poki-SDK: keine Werbung, keine Tracker. rewardedBreak gewaehrt sofort (true).
(() => {
  const ok = (v) => () => Promise.resolve(v);
  const noop = () => {};
  window.PokiSDK = new Proxy({
    init: ok(), initWithVideoHB: ok(), commercialBreak: ok(), rewardedBreak: ok(true),
    displayAd: noop, destroyAd: noop, isAdBlocked: () => false, getURLParam: () => "",
    getLanguage: () => "en", getIsoLanguage: () => "en", shareableURL: ok(""), setDebug: noop,
    gameLoadingStart: noop, gameLoadingFinished: noop, gameLoadingProgress: noop,
    gameplayStart: noop, gameplayStop: noop, happyTime: noop,
  }, { get: (t, k) => (k in t ? t[k] : noop) });
})();
