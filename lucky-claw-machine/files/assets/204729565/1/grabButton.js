var GrabButton = pc.createScript('grabButton');

// initialize code called once per entity
GrabButton.prototype.initialize = function() {

    this.entity.button.on('click', function(event) {
        this.app.fire("grab");
    }, this);

};

// update code called every frame
GrabButton.prototype.update = function(dt) {
    if(this.app.keyboard.isPressed(pc.KEY_SPACE))
    {
        this.app.fire("grab");
    }
};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// GrabButton.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/