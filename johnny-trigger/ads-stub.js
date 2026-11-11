// Lokaler Werbe-Ersatz: keine Werbung, Belohnungen (Rewarded Ads) gelten sofort als angesehen.
(function () {
  var ok = function () { return Promise.resolve(true); };
  window.sdk = { showBanner: ok };
  window.gdsdk = { showAd: ok, preloadAd: ok, onEvent: function () {} };
  window.adSDK = { showRewardedVideo: ok, showInterstitial: ok, showBanner: ok };
  window.ShowInter = function () { return ok(); };
  window.GameMonetize = { SDK: function () { return { showBanner: ok }; } };
})();
