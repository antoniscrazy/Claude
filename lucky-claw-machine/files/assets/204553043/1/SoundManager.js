var SoundManager = pc.createScript('soundManager');

// initialize code called once per entity
SoundManager.prototype.initialize = function() {
    SoundManager.instance = this;

    this.mute = false;
    this.start_volume = this.entity.sound.volume;

    this.app.on("mute_down", function() {
        this.mute = !this.mute;
        this.entity.sound.volume = (this.mute)? 0:this.start_volume;
    }.bind(this));
};

SoundManager.prototype.playSound = function(slot,delay = 0) {
    setTimeout(function(){
    this.entity.sound.play(slot)}.bind(this),delay * 1000);
};

SoundManager.prototype.setVolume = function(slot,value) {
    this.entity.sound.slot(slot).volume = value; 
};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// SoundManager.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/