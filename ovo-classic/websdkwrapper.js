// Ersatz für den Mehr-Portal-Wrapper: keine Werbung, keine Tracker.
// rewarded() gewährt die Belohnung sofort (true); hasAds() = 1, damit die Belohnungsknöpfe sichtbar bleiben.
globalThis.WebSdkWrapper = new Proxy({
  init: () => Promise.resolve(),
  rewarded: () => Promise.resolve(true),
  interstitial: () => Promise.resolve(false),
  hasAds: () => 1,
  onAdStarted: () => {}, onUnmute: () => {}, onMute: () => {}, onPause: () => {}, onResume: () => {},
  onUnlockAllLevels: () => {}, replayLevel: () => {}, happyTime: () => {},
  gameplayStart: () => {}, gameplayStop: () => {}, levelStart: () => {}, mute: () => {}, unmute: () => {},
}, { get: (t, k) => (k in t ? t[k] : () => {}) });
