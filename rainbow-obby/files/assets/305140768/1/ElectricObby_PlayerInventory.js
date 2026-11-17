var ElectricObby_PlayerInventory = pc.createScript('electricObbyPlayerInventory');

ElectricObby_PlayerInventory.attributes.add("slotParent", { type: "entity" });
ElectricObby_PlayerInventory.attributes.add("slotTemplate", { type: "asset", assetType: "template" });


ElectricObby_PlayerInventory.prototype.initialize = function () {
    this.controller = this.entity.script.electricObbyPlayerController;
    this.database = this.app.root.findByName("ItemDatabase").script.electricObbyItemDatabase;
    this.networkManager = this.app.root.findByName("NetworkManager").script.electricObbyNetworkManager;
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
 
ElectricObby_PlayerInventory.prototype.load = function () {

    console.log("inv load")
    if (this.app.playerItemManager.jetpack.fuel > 0){
        this.addItem(this.database.items[ElectricObbyItems.Jetpack]);
    } else this.removeItem(ElectricObbyItems.Jetpack);

    if (this.app.playerItemManager.flyingCarpet.remaining > 0){
        this.addItem(this.database.items[ElectricObbyItems.FlyingCarpet]);
    } else this.removeItem(ElectricObbyItems.FlyingCarpet);
};

ElectricObby_PlayerInventory.prototype.giveItem = function(itemId){
    const rewardItem = this.database.items[itemId];
    ElectricObby_Track.send("reward_claimed", rewardItem ? rewardItem.name : itemId, "claimed");

    switch(itemId){
        case ElectricObbyItems.Jetpack:
            this.app.playerItemManager.setValue(ElectricObbyItems.Jetpack,this.app.playerItemManager.jetpack.fuelMax);
            this.app.fire("updateAllInvSlots");
            break;

        case ElectricObbyItems.FlyingCarpet:
            this.app.playerItemManager.setValue(ElectricObbyItems.FlyingCarpet,this.app.playerItemManager.flyingCarpet.remainingMax);
            this.app.fire("updateAllInvSlots");
            break;
        
        case ElectricObbyItems.ResetGame:
            this.app.fire("Game:ResetGame");
            break;
        
    }

    this.app.gameManager.sfx_purchase();
    this.app.playerItemManager.saveDatas();
}

ElectricObby_PlayerInventory.prototype.canBuyThisItem = function(_itemID){
    switch(_itemID){
        case ElectricObbyItems.Jetpack:
            if (this.app.playerItemManager.jetpack.fuel == this.app.playerItemManager.jetpack.fuelMax){
                this.app.fire("WarningTextController:setWarning", "The jetpack's fuel is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else {return true;}
        break;

        case ElectricObbyItems.FlyingCarpet:
            if (this.app.playerItemManager.flyingCarpet.remaining == this.app.playerItemManager.flyingCarpet.remainingMax){
                this.app.fire("WarningTextController:setWarning", "The flying carpet's energy is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else {return true;}
        break;

        case ElectricObbyItems.Hint: return true; break;
        case ElectricObbyItems.Skip: return true; break;
    }
}

ElectricObby_PlayerInventory.prototype.saveInventory = function () {
    
};

ElectricObby_PlayerInventory.prototype.reset = function () {
    this.save = {
        slots: []
    }
    this.saveInventory();
};

ElectricObby_PlayerInventory.prototype.addItem = function (item, save = false) {
    if (item == undefined || item == null) return;

    if (this.slots.length >= this.maxSlots) {
        this.app.fire('WarningTextController:setWarning', "Your inventory is full!", 5, new pc.Color(1, 0, 0, 1));
        return;
    }

    this.app.fire("StartItem", item.id, save);

    if (this.slots.filter(s => s.item.id === item.id).length <= 0)
        this.addSlot(item, save);
};

ElectricObby_PlayerInventory.prototype.removeItem = function (id, save = false) {
    for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i].item.id === id) {
            this.removeSlot(i, save);
            break;
        }
    }
};

ElectricObby_PlayerInventory.prototype.addSlot = function (item, save) {
    if (this.slots.length >= this.maxSlots) return;

    let slotEntity = this.slotTemplate.resource.instantiate();
    this.slotParent.addChild(slotEntity);

    let slot = slotEntity.script.electricObbyInventorySlot;
    this.slots.push(slot);

    slot.init(item, this.slots.length);

    if (save) {
        this.save.slots.push(item.id);
        this.saveInventory();
    }
};

ElectricObby_PlayerInventory.prototype.removeSlot = function (index, save) {
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

ElectricObby_PlayerInventory.prototype.onKeyDown = function (event) {
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

ElectricObby_PlayerInventory.prototype.selectSlot = function (index) {
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

        ElectricObby_Track.send("reward_used", slot.item.name, "equipped");

        this.app.fire("PlaySound", "equip");
    }
};

ElectricObby_PlayerInventory.prototype.closeSlot = function(){
    if (this.currentSlot != null){
        this.selectSlot(this.currentSlotIndex);
    }
}
