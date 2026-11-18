var CollectionButton = pc.createScript('collectionButton');


CollectionButton.attributes.add('icon_collection', {
    type: 'asset'
});

CollectionButton.attributes.add('icon_machine', {
    type: 'asset'
});

CollectionButton.attributes.add('icon', {
    type: 'entity'
});

CollectionButton.attributes.add('exclamation', {
    type: 'entity'
});

// initialize code called once per entity
CollectionButton.prototype.initialize = function() {
    this.exclamation.enabled = false;  
};

// update code called every frame
CollectionButton.prototype.update = function(dt) {
    this.icon.element.sprite = (!CameraRotation.instance.show_collection)?this.icon_collection.resource:this.icon_machine.resource;
};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// CollectionButton.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/