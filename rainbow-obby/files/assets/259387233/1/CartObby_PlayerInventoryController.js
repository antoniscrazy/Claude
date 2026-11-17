var CartObbyPlayerInventoryController = pc.createScript('cartObbyPlayerInventoryController');

CartObbyPlayerInventoryController.attributes.add("boats", { type: "entity", array: true });

CartObbyPlayerInventoryController.prototype.initialize = function () {
    this.boatsInHandParent = this.boats[0].parent;
    this.activeBoat = 0;
};

CartObbyPlayerInventoryController.prototype.setItem = function (newBoat) {
    this.boats.forEach(item => {
        item.enabled = false;
    });
    this.boats[newBoat].enabled = true;
    this.activeBoat = newBoat;
};
