var TowerObby_InventorySlot = pc.createScript('towerObbyInventorySlot');
TowerObby_InventorySlot.attributes.add("selectedEntity", { type: "entity" })
TowerObby_InventorySlot.attributes.add("nameEntity", { type: "entity" })
TowerObby_InventorySlot.attributes.add("imageEntity", { type: "entity" })
TowerObby_InventorySlot.attributes.add("indexEntity", { type: "entity" })

TowerObby_InventorySlot.prototype.init = function(item, index) {
    this.playerInventory = this.app.root.findByName("Player").script.towerObbyPlayerInventory;
    this.database = this.app.root.findByName("ItemDatabase").script.towerObbyItemDatabase;

    this.item = item;
    this.index = index;
    this.item.slot = this;
    this.selected = false;

    this.durabilityBar = this.entity.findByName("DurabilityBar");

    this.app.off("updateAllInvSlots", this.updateSlot, this);
    this.app.on("updateAllInvSlots", this.updateSlot, this);

    if (!this._destroyHooked) {
        this._destroyHooked = true;
        this.on('destroy', function () {
            this.app.off("updateAllInvSlots", this.updateSlot, this);
        }, this);
    }

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

TowerObby_InventorySlot.prototype.select = function() {
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

TowerObby_InventorySlot.prototype.deselect = function() {
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

TowerObby_InventorySlot.prototype.updateSlot = function(){
    if (!this.durabilityBar || !this.durabilityBar.element) { return; }

    let _m = 0;
    switch(this.item.id){
        case TowerObbyItems.Jetpack:
            _m = this.app.playerItemManager.jetpack.fuel / this.app.playerItemManager.jetpack.fuelMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.FlyingCarpet:
            _m = this.app.playerItemManager.flyingCarpet.remaining / this.app.playerItemManager.flyingCarpet.remainingMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.SlapHand:
            //this.entity.findByName("Durablity").enabled = false;
            _m = this.app.playerItemManager.slapHand.durability / this.database.items[TowerObbyItems.SlapHand].maxDurability;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break

        case TowerObbyItems.SlapBalloon:
            _m = this.app.playerItemManager.slapBalloon.durability / this.database.items[TowerObbyItems.SlapBalloon].maxDurability;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.SlapBat:
            _m = this.app.playerItemManager.slapBat.durability / this.database.items[TowerObbyItems.SlapBat].maxDurability;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.SlapCandy:
            _m = this.app.playerItemManager.slapCandy.durability / this.database.items[TowerObbyItems.SlapCandy].maxDurability;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.SlapLollipop:
            _m = this.app.playerItemManager.slapLollipop.durability / this.database.items[TowerObbyItems.SlapLollipop].maxDurability;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.Shield:
            _m = this.app.playerItemManager.shield.durability / this.app.playerItemManager.shield.durabilityMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.Immortality:
            _m = this.app.playerItemManager.immortality.remaining / this.app.playerItemManager.immortality.remainingMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.LowGravity:
            _m = this.app.playerItemManager.lowGravity.remaining / this.app.playerItemManager.lowGravity.remainingMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.Shrink:
            _m = this.app.playerItemManager.shrink.remaining / this.app.playerItemManager.shrink.remainingMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.Grow:
            _m = this.app.playerItemManager.grow.remaining / this.app.playerItemManager.grow.remainingMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;

        case TowerObbyItems.DoubleJump:
            _m = this.app.playerItemManager.doubleJump.durability / this.app.playerItemManager.doubleJump.durabilityMax;
            this.durabilityBar.setLocalScale(0.545*_m,0.035,0.1);
            this.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
            break;
    }
}




