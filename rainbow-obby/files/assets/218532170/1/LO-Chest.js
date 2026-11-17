var LoChest = pc.createScript('loChest');

// initialize code called once per entity
LoChest.prototype.initialize = function () {
    this.entity.collision.on("triggerenter", this.triggerenter, this);
};

// update code called every frame
LoChest.prototype.triggerenter = function (entity) {
    if (entity.tags.has("Player")) {
        entity.fire("OwnCarpet");
        this.entity.anim.setTrigger("open");
        this.app.isEndLadderObby = true;
        this.app.fire("AllChunkEnabled");
    }
};