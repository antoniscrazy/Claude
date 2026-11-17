var PvpModePlayerInventoryController = pc.createScript('pvpModePlayerInventoryController');

PvpModePlayerInventoryController.attributes.add("boats", { type: "entity", array: true });

PvpModePlayerInventoryController.prototype.initialize = function () {
    this.boatsInHandParent = this.boats[0].parent;
    this.activeBoat = 0;
};

PvpModePlayerInventoryController.prototype.setItem = function (newBoat) {
    this.boats.forEach(item => {
        item.enabled = false;
    });
    this.boats[newBoat].enabled = true;
    this.activeBoat = newBoat;
};
