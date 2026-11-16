// Lokaler Poki-SDK-Ersatz: keine Werbung, Belohnungen (Rewarded Ads) gibt es sofort.
(() => {
	const param = (k) => {
		const m = RegExp("[?&]" + k + "=([^&]*)").exec(window.location.search);
		return m && decodeURIComponent(m[1].replace(/\+/g, " "));
	};
	const ok = () => Promise.resolve();
	const noop = () => {};
	window.PokiSDK = {
		init: ok,
		initWithVideoHB: ok,
		commercialBreak: ok,              // normale Werbung: sofort fertig
		rewardedBreak: () => Promise.resolve(true), // Belohnung: sofort gewährt
		captureError: noop,
		isAdBlocked: () => false,
		displayAd: noop,
		destroyAd: noop,
		getLeaderboard: ok,
		getSharableURL: () => Promise.reject(),
		getURLParam: (k) => param("gd" + k) || param(k) || "",
	};
	["disableProgrammatic", "gameLoadingStart", "gameLoadingFinished", "gameInteractive", "roundStart", "roundEnd", "muteAd",
	 "setDebug", "gameplayStart", "gameplayStop", "gameLoadingProgress", "happyTime", "setPlayerAge",
	 "togglePlayerAdvertisingConsent", "logError", "sendHighscore", "setDebugTouchOverlayController"
	].forEach((f) => (window.PokiSDK[f] = noop));
})();
