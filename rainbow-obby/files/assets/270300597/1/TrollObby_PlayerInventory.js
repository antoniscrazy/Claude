var TrollObby_PlayerInventory = pc.createScript('trollObbyPlayerInventory');

TrollObby_PlayerInventory.attributes.add("slotParent", { type: "entity" });
TrollObby_PlayerInventory.attributes.add("slotTemplate", { type: "asset", assetType: "template" });

TrollObby_PlayerInventory.prototype.initialize = function () {
    this.controller = this.entity.script.trollObbyPlayerController;
    this.database = this.app.root.findByName("ItemDatabase").script.trollObbyItemDatabase;
    this.networkManager = this.app.root.findByName("NetworkManager").script.trollObbyNetworkManager;
    this.app.inventory = this;

    this.slots = [];

    this.currentSlot = null;
    this.maxSlots = 9;
    this.currentSlotIndex = null;

    this.activeItem = () => this.currentSlot?.item;

    { const handle = this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this); this.on('destroy', () => handle.off()); }
    this.app.on("giveItem", this.giveItem, this);

    this.on('destroy', function () {
        this.app.off("giveItem");
    }, this);
};
 
TrollObby_PlayerInventory.prototype.load = function () {

    console.log("inv load")

    if (this.app.playerItemManager.slapHand.owned){
        this.addItem(this.database.items[TrollObbyItems.SlapHand]);
    } else this.removeItem(TrollObbyItems.SlapHand);

    if (this.app.playerItemManager.slapBalloon.owned){
        this.addItem(this.database.items[TrollObbyItems.SlapBalloon]);
    } else this.removeItem(TrollObbyItems.SlapBalloon);

    if (this.app.playerItemManager.slapBat.owned){
        this.addItem(this.database.items[TrollObbyItems.SlapBat]);
    } else this.removeItem(TrollObbyItems.SlapBat);

    if (this.app.playerItemManager.slapCandy.owned){
        this.addItem(this.database.items[TrollObbyItems.SlapCandy]);
    } else this.removeItem(TrollObbyItems.SlapCandy);

    if (this.app.playerItemManager.slapLollipop.owned){
        this.addItem(this.database.items[TrollObbyItems.SlapLollipop]);
    } else this.removeItem(TrollObbyItems.SlapLollipop);

    if (this.app.playerItemManager.jetpack.fuel > 0){
        this.addItem(this.database.items[TrollObbyItems.JETPACK]);
    } else this.removeItem(TrollObbyItems.JETPACK);

    if (this.app.playerItemManager.flyingCarpet.remaining > 0){
        this.addItem(this.database.items[TrollObbyItems.FLYING_CARPET]);
    } else this.removeItem(TrollObbyItems.FLYING_CARPET);

    if (this.app.playerItemManager.shield.remaining > 0){
        this.addItem(this.database.items[TrollObbyItems.Shield]);
    } else this.removeItem(TrollObbyItems.Shield);
};

TrollObby_PlayerInventory.prototype.giveItem = function(itemId){
    //console.log("giving item:", itemId)

    switch(itemId){
        case TrollObbyItems.SlapBalloon:
            this.addItem(this.database.items[TrollObbyItems.SlapBalloon]);
            this.app.playerItemManager.slapBalloon.owned = true;
        break;

        case TrollObbyItems.SlapBat:
            this.addItem(this.database.items[TrollObbyItems.SlapBat]);
            this.app.playerItemManager.slapBat.owned = true;
        break;

        case TrollObbyItems.SlapCandy:
            this.addItem(this.database.items[TrollObbyItems.SlapCandy]);
            this.app.playerItemManager.slapCandy.owned = true;
        break;

        case TrollObbyItems.SlapLollipop:
            this.addItem(this.database.items[TrollObbyItems.SlapLollipop]);
            this.app.playerItemManager.slapLollipop.owned = true;
        break;

        case TrollObbyItems.JETPACK:
            this.app.playerItemManager.setValue(
                TrollObbyItems.JETPACK,
                this.app.playerItemManager.jetpack.fuel + this.app.playerItemManager.jetpack.fuelMax
            );
            break;

        case TrollObbyItems.FLYING_CARPET:
            this.app.playerItemManager.setValue(TrollObbyItems.FLYING_CARPET,
                this.app.playerItemManager.flyingCarpet.remaining + this.app.playerItemManager.flyingCarpet.remainingMax
            );
            break;

        case TrollObbyItems.Shield:
            this.app.playerItemManager.setValue(TrollObbyItems.Shield,
                this.app.playerItemManager.shield.remaining + this.app.playerItemManager.shield.remainingMax
            );
            break;

        case TrollObbyItems.Rebirth:
            this.app.fire("giveRebirth");
            this.app.fire("resetGame");
            break;
    }

    this.app.playerItemManager.saveDatas();
}

TrollObby_PlayerInventory.prototype.saveInventory = function () {
    TrollObby_Utils.setItem("CARTOBBY_Inventory", JSON.stringify(this.save));
};

TrollObby_PlayerInventory.prototype.reset = function () {
    this.save = {
        slots: []
    }
    this.saveInventory();
};

TrollObby_PlayerInventory.prototype.addItem = function (item, save = false) {
    if (item == undefined || item == null) return;

    if (this.slots.length >= this.maxSlots) {
        this.app.fire('WarningTextController:setWarning', "Your inventory reached its slot limit!", 5, new pc.Color(1, 0, 0, 1));
        return;
    }

    this.app.fire("StartItem", item.id, save);

    if (this.slots.filter(s => s.item.id === item.id).length <= 0)
        this.addSlot(item, save);
};

TrollObby_PlayerInventory.prototype.removeItem = function (id, save = false) {
    for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i].item.id === id) {
            this.removeSlot(i, save);
            break;
        }
    }
};

TrollObby_PlayerInventory.prototype.addSlot = function (item, save) {
    if (this.slots.length >= this.maxSlots) return;

    let slotEntity = this.slotTemplate.resource.instantiate();
    this.slotParent.addChild(slotEntity);

    let slot = slotEntity.script.trollObbyInventorySlot;
    this.slots.push(slot);

    slot.init(item, this.slots.length);

    if (save) {
        this.save.slots.push(item.id);
        this.saveInventory();
    }
};

TrollObby_PlayerInventory.prototype.removeSlot = function (index, save) {
    let slot = this.slots[index];
    if (slot.selected) {
        slot.deselect();
        this.app.fire("ToggleItem", slot.item.id, false);
        this.currentSlot = null;
    }

    this.slotParent.removeChild(slot.entity);
    slot.entity.destroy();

    this.slots.splice(index, 1);

    for (let i = 0; i < this.slots.length; i++) {
        this.slots[i].init(this.slots[i].item, i + 1);
    }

    if (save) {
        this.save.slots.splice(index, 1);
        this.saveInventory();
    }
};

TrollObby_PlayerInventory.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inTroll) return;
    switch (key) {
        case pc.KEY_1: this.selectSlot(0); break;
        case pc.KEY_2: this.selectSlot(1); break;
        case pc.KEY_3: this.selectSlot(2); break;
        case pc.KEY_4: this.selectSlot(3); break;
        case pc.KEY_5: this.selectSlot(4); break;
        case pc.KEY_6: this.selectSlot(5); break;
        case pc.KEY_7: this.selectSlot(6); break;
        case pc.KEY_8: this.selectSlot(7); break;
        case pc.KEY_9: this.selectSlot(8); break;
    }
};

TrollObby_PlayerInventory.prototype.selectSlot = function (index) {
    if (index >= 0 && index < this.slots.length) {
        let oldSlot = this.currentSlot;

        let slot = this.slots[index];
        this.currentSlotIndex = index

        if (oldSlot == slot) {
            slot.deselect();
            this.app.fire("ToggleItem", slot.item.id, false);
            this.currentSlot = null;
            this.currentSlotIndex = null;
            this.app.fire("PlaySound", "unequip");
            return;
        }

        if (oldSlot != null) {
            this.app.fire("ToggleItem", oldSlot.item.id, false);
            oldSlot.deselect();
        }

        slot.select();
        this.app.fire("ToggleItem", slot.item.id, true);
        this.currentSlot = slot;

        this.app.fire("PlaySound", "equip");
    }
};

TrollObby_PlayerInventory.prototype.closeSlot = function(){
    if (this.currentSlot != null){
        this.selectSlot(this.currentSlotIndex);
    }
}
