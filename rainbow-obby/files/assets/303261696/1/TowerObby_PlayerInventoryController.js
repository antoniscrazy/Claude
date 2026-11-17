var TowerObbyPlayerInventoryController = pc.createScript('towerObbyPlayerInventoryController');

TowerObbyPlayerInventoryController.attributes.add("boats", { type: "entity", array: true });

TowerObbyPlayerInventoryController.prototype.initialize = function () {
    this.boatsInHandParent = this.boats[0].parent;
    this.activeBoat = 0;
};

TowerObbyPlayerInventoryController.prototype.setItem = function (newBoat) {
    this.boats.forEach(item => {
        item.enabled = false;
    });
    this.boats[newBoat].enabled = true;
    this.activeBoat = newBoat;
};
