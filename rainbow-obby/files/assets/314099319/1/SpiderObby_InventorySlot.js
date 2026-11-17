var SpiderObby_InventorySlot = pc.createScript('spiderObbyInventorySlot');
SpiderObby_InventorySlot.attributes.add("selectedEntity", { type: "entity" })
SpiderObby_InventorySlot.attributes.add("nameEntity", { type: "entity" })
SpiderObby_InventorySlot.attributes.add("imageEntity", { type: "entity" })
SpiderObby_InventorySlot.attributes.add("indexEntity", { type: "entity" })

SpiderObby_InventorySlot.prototype.init = function(item, index) {
    this.playerInventory = this.app.root.findByName("Player").script.spiderObbyPlayerInventory;
    this.database = this.app.root.findByName("ItemDatabase").script.spiderObbyItemDatabase;

    this.item = item;
    this.index = index;
    this.item.slot = this;
    this.selected = false;

    this.durabilityBar = this.entity.findByName("DurabilityBar");

    this.app.on("updateAllInvSlots", this.updateSlot, this);
    this.updateSlot();

    this.app.playerItemManager.saveDatas();

    if (item.texture != null) {
        let tex = this.app.assets.get(item.texture);
        if (tex.loaded) {
            this.imageEntity.enabled = true;
            this.imageEntity.element.texture = tex.resource;

        } 
        else {
            this.app.assets.load(tex);
            tex.ready((asset) => {
                this.imageEntity.enabled = true;
                this.imageEntity.element.texture = asset.resource;
            });
        }
    }
    else {
        this.nameEntity.enabled = true;
        this.nameEntity.element.text = this.item.name;
    }

    this.indexEntity.element.text = index;

    this.entity.button.off("click");
    this.entity.button.on("click", () => {
        this.playerInventory.selectSlot(index - 1);
    }, this);
};

SpiderObby_InventorySlot.prototype.select = function() {
    if (this.selected) return;
    
    this.selected = true;
    this.selectedEntity.enabled = true;
    
    this.entity
        .tween(this.entity.getLocalScale())
        .to(new pc.Vec3(1.15, 1.15, 1.15), .25, pc.SineOut)
        .start();

    this.indexEntity
        .tween(this.indexEntity.getLocalEulerAngles())
        .rotate(new pc.Vec3(0, 0, -7.5), .25, pc.SineOut)
        .start();
};

SpiderObby_InventorySlot.prototype.deselect = function() {
    if (!this.selected) return;
    
    this.selected = false;
    this.selectedEntity.enabled = false;

    this.entity
        .tween(this.entity.getLocalScale())
        .to(new pc.Vec3(1, 1, 1), .25, pc.SineOut)
        .start();

    this.indexEntity
        .tween(this.indexEntity.getLocalEulerAngles())
        .rotate(new pc.Vec3(0, 0, 0), .25, pc.SineOut)
        .start();
};

SpiderObby_InventorySlot.prototype.updateSlot = function(){
    let _m = 0;
    switch(this.item.id){
        case SpiderObbyItems.Jetpack:
            _m = this.app.playerItemManager.jetpack.fuel / this.app.playerItemManager.jetpack.fuelMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case SpiderObbyItems.FlyingCarpet:
            _m = this.app.playerItemManager.flyingCarpet.remaining / this.app.playerItemManager.flyingCarpet.remainingMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;
    }
}




