var MeowMode_PlayerInventory = pc.createScript('meowModePlayerInventory');

MeowMode_PlayerInventory.attributes.add("slotParent", { type: "entity" });
MeowMode_PlayerInventory.attributes.add("slotTemplate", { type: "asset", assetType: "template" });

MeowMode_PlayerInventory.prototype.initialize = function () {
    this.controller = this.entity.script.meowModePlayerController;
    this.database = this.app.root.findByName("ItemDatabase").script.meowModeItemDatabase;
    this.networkManager = this.app.root.findByName("NetworkManager").script.meowModeNetworkManager;
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
 
MeowMode_PlayerInventory.prototype.load = function () {

    console.log("inv load")

    if (this.app.playerItemManager.paw.owned){
        this.addItem(this.database.items[MeowModeItems.Paw]);
    } else this.removeItem(MeowModeItems.Paw);

    if (this.app.playerItemManager.jetpack.fuel > 0){
        this.addItem(this.database.items[MeowModeItems.JETPACK]);
    } else this.removeItem(MeowModeItems.JETPACK);

    if (this.app.playerItemManager.flyingCarpet.remaining > 0){
        this.addItem(this.database.items[MeowModeItems.FLYING_CARPET]);
    } else this.removeItem(MeowModeItems.FLYING_CARPET);

    if (this.app.playerItemManager.shield.durability > 0){
        this.addItem(this.database.items[MeowModeItems.Shield]);
    } else this.removeItem(MeowModeItems.Shield);
    console.log(this.app.playerItemManager.shield.durability)
};

MeowMode_PlayerInventory.prototype.giveItem = function(itemId){
    //console.log("giving item:", itemId)

    switch(itemId){
        case MeowModeItems.JETPACK:
            this.app.playerItemManager.setValue(MeowModeItems.JETPACK,this.app.playerItemManager.jetpack.fuelMax);
            this.app.fire("updateAllInvSlots");
            break;

        case MeowModeItems.FLYING_CARPET:
            this.app.playerItemManager.setValue(MeowModeItems.FLYING_CARPET,this.app.playerItemManager.flyingCarpet.remainingMax);
            this.app.fire("updateAllInvSlots");
            break;

        case MeowModeItems.Shield:
            this.app.playerItemManager.setValue(MeowModeItems.Shield, this.app.playerItemManager.shield.durabilityMax);
            this.app.fire("updateAllInvSlots");
            break;

        case MeowModeItems.Skin1: this.app.fire("changeSkin", MeowModeItems.Skin1); break;
        case MeowModeItems.Skin2: this.app.fire("changeSkin", MeowModeItems.Skin2); break;
        case MeowModeItems.Skin3: this.app.fire("changeSkin", MeowModeItems.Skin3); break;
        case MeowModeItems.Skin4: this.app.fire("changeSkin", MeowModeItems.Skin4); break;
    }

    this.app.gameManager.sfx_purchase();
    this.app.playerItemManager.saveDatas();
}

MeowMode_PlayerInventory.prototype.canBuyThisItem = function(_itemID){
    switch(_itemID){
        case MeowModeItems.JETPACK:
            if (this.app.playerItemManager.jetpack.fuel == this.app.playerItemManager.jetpack.fuelMax){
                this.app.fire("WarningTextController:setWarning", "Jetpack fuel is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else {return true;}
        break;

        case MeowModeItems.FLYING_CARPET:
            if (this.app.playerItemManager.flyingCarpet.remaining == this.app.playerItemManager.flyingCarpet.remainingMax){
                this.app.fire("WarningTextController:setWarning", "Flying Carpet energy is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else {return true;}
        break;

        case MeowModeItems.Shield:
            if (this.app.playerItemManager.shield.durability == this.app.playerItemManager.shield.durabilityMax){
                this.app.fire("WarningTextController:setWarning", "Shield's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else {return true;}
        break;

        case MeowModeItems.Skin1:
            if (this.app.playerItemManager.skins.current == MeowModeItems.Skin1){
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else {return true;}
            break;

        case MeowModeItems.Skin2:
            if (this.app.playerItemManager.skins.current == MeowModeItems.Skin2){
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else {return true;}
            break;

        case MeowModeItems.Skin3:
            if (this.app.playerItemManager.skins.current == MeowModeItems.Skin3){
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else {return true;}
            break;

        case MeowModeItems.Skin4:
            if (this.app.playerItemManager.skins.current == MeowModeItems.Skin4){
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else {return true;}
            break;
    }
}

MeowMode_PlayerInventory.prototype.saveInventory = function () {
    MeowMode_Utils.setItem("CARTOBBY_Inventory", JSON.stringify(this.save));
};

MeowMode_PlayerInventory.prototype.reset = function () {
    this.save = {
        slots: []
    }
    this.saveInventory();
};

MeowMode_PlayerInventory.prototype.addItem = function (item, save = false) {
    if (item == undefined || item == null) return;

    if (this.slots.length >= this.maxSlots) {
        this.app.fire('WarningTextController:setWarning', "Your inventory reached its slot limit!", 5, new pc.Color(1, 0, 0, 1));
        return;
    }

    this.app.fire("StartItem", item.id, save);

    if (this.slots.filter(s => s.item.id === item.id).length <= 0)
        this.addSlot(item, save);
};

MeowMode_PlayerInventory.prototype.removeItem = function (id, save = false) {
    for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i].item.id === id) {
            this.removeSlot(i, save);
            break;
        }
    }
};

MeowMode_PlayerInventory.prototype.addSlot = function (item, save) {
    if (this.slots.length >= this.maxSlots) return;

    let slotEntity = this.slotTemplate.resource.instantiate();
    this.slotParent.addChild(slotEntity);

    let slot = slotEntity.script.meowModeInventorySlot;
    this.slots.push(slot);

    slot.init(item, this.slots.length);

    if (save) {
        this.save.slots.push(item.id);
        this.saveInventory();
    }
};

MeowMode_PlayerInventory.prototype.removeSlot = function (index, save) {
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

MeowMode_PlayerInventory.prototype.onKeyDown = function (event) {
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

MeowMode_PlayerInventory.prototype.selectSlot = function (index) {
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

MeowMode_PlayerInventory.prototype.closeSlot = function(){
    if (this.currentSlot != null){
        this.selectSlot(this.currentSlotIndex);
    }
}
