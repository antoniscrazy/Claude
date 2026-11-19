// Stand-in for the Poki SDK: the game calls these, nothing is shown.
(() => {
  const done = (value) => () => Promise.resolve(value);
  const noop = () => {};
  window.PokiSDK = new Proxy(
    {
      init: done(),
      commercialBreak: done(),
      // No reward without an ad: 55GMS Ads' SDK (sdk.min.js) replaces this.
      rewardedBreak: done(false),
      displayAd: noop,
      destroyAd: noop,
      getURLParam: () => "",
      shareableURL: done(""),
      isAdBlocked: () => false,
      getLanguage: () => "en",
    },
    { get: (sdk, name) => (name in sdk ? sdk[name] : noop) },
  );
})();
