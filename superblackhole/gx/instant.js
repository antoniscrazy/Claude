// Lokaler Einzelspieler-Modus: Werbung entfällt, Video-Belohnungen kommen sofort,
// und es wird nichts an den Entwickler-Server gesendet.
// Zum Abschalten den Eintrag in config/server.json entfernen.
(function () {
  'use strict';
  function later(fn) { if (typeof fn === 'function') setTimeout(fn, 0); }
  // Capture-Phase: läuft nach dem Laden von VkApp.js, aber bevor das Spiel es startet.
  document.addEventListener('load', function () {
    var app = window.VkApp;
    if (!app || !app.showRewarded || app.__lokal) return;
    app.__lokal = true;
    app.Request = function () { return Promise.resolve({ code: 0 }); };
    app.showRewarded = function (success) { later(success); };
    app.showInterstitial = function (complete) { later(complete); };
    app.showInterAdAndCallBack = function (complete) { later(complete); };
    // Eigenwerbung, Spiele-Empfehlungen und Links nach außen entfernen
    ['showSingleArr', 'showSingleGameBtn', 'showMoreGameBtn', 'initMoreGameBtn', 'getSingleGameRecommendArray',
      'showBuddyFullScreenGames', 'showEnd', 'showGameHome', 'showYdBtns', 'showYdUserBtn', 'showYdUserView',
      'showUserCenter', 'showCommunityView', 'showGamesRank', 'showDeskBtn', 'showRankBtn', 'showInGameRankBtn',
      'showShareBtn', 'initShareBtn', 'showClubBtn', 'showInviteBtn', 'createCoverBtn', 'createRed', 'openApp',
      'openClub', 'openNewWindow', 'ShowWallPost', 'friendInvite', 'appShare', 'addToHomeScreen', 'addToFavorites',
      'showBanner', 'showRandomInterAd', 'ShowXZMessage'
    ].forEach(function (name) { app[name] = function () {}; });
    // Werbefenster: nicht anzeigen, aber dem Spiel "geschlossen" melden
    app.showRecommendGames = function (type, left, right, top, bottom, onClose) { later(onClose); };
    // Bonus-Kisten: alle 9 Belohnungen sofort gutschreiben
    app.showNineBoxView = function (base, name, onReward, onClose) {
      later(function () { if (onReward) onReward(base * 9); if (onClose) onClose(); });
    };
    app.showSingleGameRecommend = function (onClose) { later(onClose); };
    app.showSharePopupByFailVideo = function (onClose) { later(onClose); };
  }, true);
  window.open = function () { return null; };
  // Zusätzliche Sicherung: Werbe-Elemente nie anzeigen
  var style = document.createElement('style');
  style.textContent = '#SingleGameRecommend,#SharePopup,[id^="singleIcon_"],#more_game_icon,#SingleGameBtn{display:none!important}';
  document.documentElement.appendChild(style);
})();
