var SpiderObbyPlayerInventoryController = pc.createScript('spiderObbyPlayerInventoryController');

SpiderObbyPlayerInventoryController.attributes.add("boats", { type: "entity", array: true });

SpiderObbyPlayerInventoryController.prototype.initialize = function () {
    this.boatsInHandParent = this.boats[0].parent;
    this.activeBoat = 0;
};

SpiderObbyPlayerInventoryController.prototype.setItem = function (newBoat) {
    this.boats.forEach(item => {
        item.enabled = false;
    });
    this.boats[newBoat].enabled = true;
    this.activeBoat = newBoat;
};
