var CoinCounter = pc.createScript('coinCounter');

// initialize code called once per entity
CoinCounter.prototype.initialize = function() {
    this.color = pc.Color.WHITE;
    this.time = 0; 

};

// update code called every frame
CoinCounter.prototype.update = function(dt) {

   
};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// CoinCounter.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/