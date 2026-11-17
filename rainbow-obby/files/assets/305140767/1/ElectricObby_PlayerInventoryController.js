var ElectricObbyPlayerInventoryController = pc.createScript('electricObbyPlayerInventoryController');

ElectricObbyPlayerInventoryController.attributes.add("boats", { type: "entity", array: true });

ElectricObbyPlayerInventoryController.prototype.initialize = function () {
    this.boatsInHandParent = this.boats[0].parent;
    this.activeBoat = 0;
};

ElectricObbyPlayerInventoryController.prototype.setItem = function (newBoat) {
    this.boats.forEach(item => {
        item.enabled = false;
    });
    this.boats[newBoat].enabled = true;
    this.activeBoat = newBoat;
};
