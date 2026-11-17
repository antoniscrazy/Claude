var IqTestModePlayerInventoryController = pc.createScript('iqTestModePlayerInventoryController');

IqTestModePlayerInventoryController.attributes.add("boats", { type: "entity", array: true });

IqTestModePlayerInventoryController.prototype.initialize = function () {
    this.boatsInHandParent = this.boats[0].parent;
    this.activeBoat = 0;
};

IqTestModePlayerInventoryController.prototype.setItem = function (newBoat) {
    this.boats.forEach(item => {
        item.enabled = false;
    });
    this.boats[newBoat].enabled = true;
    this.activeBoat = newBoat;
};
