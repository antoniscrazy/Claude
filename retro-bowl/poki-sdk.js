/* Platzhalter fuer das Poki-SDK: keine Werbung, keine Netzwerkzugriffe. Belohnungs-Werbung wird sofort gewaehrt. */
(function(){
  var ok=function(){return Promise.resolve()};
  window.PokiSDK={
    init:ok, initWithVideoHB:ok, setDebug:function(){}, setLogging:function(){},
    gameLoadingStart:function(){}, gameLoadingFinished:function(){}, gameLoadingProgress:function(){},
    gameInteractive:function(){}, roundStart:function(){}, roundEnd:function(){},
    gameplayStart:function(){}, gameplayStop:function(){}, happyTime:function(){},
    customEvent:function(){}, setPlayerAge:function(){}, togglePlayerAdvertisingConsent:function(){},
    commercialBreak:ok, rewardedBreak:function(){return Promise.resolve(true)},
    displayAd:function(){}, destroyAd:function(){}, isAdBlocked:function(){return false},
    shareableURL:function(){return Promise.resolve('')}, getURLParam:function(){return ''},
    captureError:function(){}, warning:function(){}, measure:function(){}, enableEventTracking:function(){},
    getLanguage:function(){return 'en'}, getUser:ok
  };
})();
