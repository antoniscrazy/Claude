var ModeButton = pc.createScript('modeButton');

ModeButton.attributes.add('icon_on', {
    type: 'asset'
});

ModeButton.attributes.add('icon_off', {
    type: 'asset'
});

ModeButton.attributes.add('icon', {
    type: 'entity'
});

// initialize code called once per entity
ModeButton.prototype.initialize = function() {
    
    this.app.on("change_mode", function() {
        this.icon.element.sprite = (GameManager.instance.current_mode_string == "classic")?this.icon_off.resource:this.icon_on.resource;
    }.bind(this));

};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// MuteButton.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/