var SkateboardObbyPlayerInventoryController = pc.createScript('skateboardObbyPlayerInventoryController');

SkateboardObbyPlayerInventoryController.attributes.add("boats", { type: "entity", array: true });

SkateboardObbyPlayerInventoryController.prototype.initialize = function () {
    this.boatsInHandParent = this.boats[0].parent;
    this.activeBoat = 0;
};

SkateboardObbyPlayerInventoryController.prototype.setItem = function (newBoat) {
    this.boats.forEach(item => {
        item.enabled = false;
    });
    this.boats[newBoat].enabled = true;
    this.activeBoat = newBoat;
};
