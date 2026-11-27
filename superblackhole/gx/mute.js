// Schaltet den Ton des Spiels stumm. Zum Wiedereinschalten den Eintrag in config/server.json entfernen.
(function () {
  'use strict';
  // <audio>/<video> und new Audio()
  var play = window.HTMLMediaElement && HTMLMediaElement.prototype.play;
  if (play) {
    HTMLMediaElement.prototype.play = function () {
      this.muted = true;
      return play.apply(this, arguments);
    };
  }
  // WebAudio: nichts mit dem Lautsprecherausgang verbinden
  if (window.AudioNode) {
    var connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (target) {
      if (window.AudioDestinationNode && target instanceof AudioDestinationNode) return target;
      return connect.apply(this, arguments);
    };
  }
})();
