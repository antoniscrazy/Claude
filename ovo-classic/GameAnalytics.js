// Tracker abgeschaltet: GameAnalytics-Aufrufe tun nichts.
(function () { var noop = function () {}; window.GameAnalytics = new Proxy(noop, { get: function () { return noop; }, apply: function () {} }); })();
