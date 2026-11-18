var MuteButton = pc.createScript('muteButton');

MuteButton.attributes.add('icon_on', {
    type: 'asset'
});

MuteButton.attributes.add('icon_off', {
    type: 'asset'
});

MuteButton.attributes.add('icon', {
    type: 'entity'
});




// initialize code called once per entity
MuteButton.prototype.initialize = function() {
    
    this.app.on("mute_down", function() {
        this.icon.element.sprite = (SoundManager.instance.mute)?this.icon_off.resource:this.icon_on.resource;
    }.bind(this));

};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// MuteButton.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/