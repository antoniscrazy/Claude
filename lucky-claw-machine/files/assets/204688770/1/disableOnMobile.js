var DisableOnmobile = pc.createScript('disableOnmobile');

// initialize code called once per entity
DisableOnmobile.prototype.initialize = function() {
    if (this.app.touch) {
        this.entity.enabled = false;
    }
};

// update code called every frame
DisableOnmobile.prototype.update = function(dt) {

};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// DisableOnmobile.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/