var IqTestMode_InventorySlot = pc.createScript('iqTestModeInventorySlot');
IqTestMode_InventorySlot.attributes.add("selectedEntity", { type: "entity" })
IqTestMode_InventorySlot.attributes.add("nameEntity", { type: "entity" })
IqTestMode_InventorySlot.attributes.add("imageEntity", { type: "entity" })
IqTestMode_InventorySlot.attributes.add("indexEntity", { type: "entity" })

IqTestMode_InventorySlot.prototype.init = function(item, index) {
    this.playerInventory = this.app.root.findByName("Player").script.iqTestModePlayerInventory;
    this.database = this.app.root.findByName("ItemDatabase").script.iqTestModeItemDatabase;

    this.item = item;
    this.index = index;
    this.item.slot = this;
    this.selected = false;

    this.durabilityBar = this.entity.findByName("DurabilityBar");

    { const handle = this.app.on("updateAllInvSlots", this.updateSlot, this); this.on('destroy', () => handle.off()); }
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

IqTestMode_InventorySlot.prototype.select = function() {
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

IqTestMode_InventorySlot.prototype.deselect = function() {
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

IqTestMode_InventorySlot.prototype.updateSlot = function(){
    let _m = 0;
    switch(this.item.id){
        case IqTestModeItems.SlapHand:
            this.entity.findByName("Durablity").enabled = false;
            break

        case IqTestModeItems.SlapBalloon:
            _m = this.app.playerItemManager.slapBalloon.durability / this.database.items[IqTestModeItems.SlapBalloon].maxDurability;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case IqTestModeItems.SlapBat:
            _m = this.app.playerItemManager.slapBat.durability / this.database.items[IqTestModeItems.SlapBat].maxDurability;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case IqTestModeItems.SlapCandy:
            _m = this.app.playerItemManager.slapCandy.durability / this.database.items[IqTestModeItems.SlapCandy].maxDurability;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case IqTestModeItems.SlapLollipop:
            _m = this.app.playerItemManager.slapLollipop.durability / this.database.items[IqTestModeItems.SlapLollipop].maxDurability;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case IqTestModeItems.Shield:
            _m = this.app.playerItemManager.shield.durability / this.app.playerItemManager.shield.durabilityMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case IqTestModeItems.JETPACK:
            _m = this.app.playerItemManager.jetpack.fuel / this.app.playerItemManager.jetpack.fuelMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case IqTestModeItems.FLYING_CARPET:
            _m = this.app.playerItemManager.flyingCarpet.remaining / this.app.playerItemManager.flyingCarpet.remainingMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;
    }
}




