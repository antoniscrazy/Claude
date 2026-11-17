var MeowModePlayerInventoryController = pc.createScript('meowModePlayerInventoryController');

MeowModePlayerInventoryController.attributes.add("boats", { type: "entity", array: true });

MeowModePlayerInventoryController.prototype.initialize = function () {
    this.boatsInHandParent = this.boats[0].parent;
    this.activeBoat = 0;
};

MeowModePlayerInventoryController.prototype.setItem = function (newBoat) {
    this.boats.forEach(item => {
        item.enabled = false;
    });
    this.boats[newBoat].enabled = true;
    this.activeBoat = newBoat;
};
