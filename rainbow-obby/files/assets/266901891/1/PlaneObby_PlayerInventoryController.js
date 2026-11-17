var PlaneObbyPlayerInventoryController = pc.createScript('planeObbyPlayerInventoryController');

PlaneObbyPlayerInventoryController.attributes.add("boats", { type: "entity", array: true });

PlaneObbyPlayerInventoryController.prototype.initialize = function () {
    this.boatsInHandParent = this.boats[0].parent;
    this.activeBoat = 0;
};

PlaneObbyPlayerInventoryController.prototype.setItem = function (newBoat) {
    this.boats.forEach(item => {
        item.enabled = false;
    });
    this.boats[newBoat].enabled = true;
    this.activeBoat = newBoat;
};
