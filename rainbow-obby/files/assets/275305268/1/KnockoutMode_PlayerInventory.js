var KnockoutMode_PlayerInventory = pc.createScript('knockoutModePlayerInventory');

KnockoutMode_PlayerInventory.attributes.add("slotParent", { type: "entity" });
KnockoutMode_PlayerInventory.attributes.add("slotTemplate", { type: "asset", assetType: "template" });

KnockoutMode_PlayerInventory.prototype.initialize = function () {
    this.controller = this.entity.script.knockoutModePlayerController;
    this.database = this.app.root.findByName("ItemDatabase").script.knockoutModeItemDatabase;
    this.networkManager = this.app.root.findByName("NetworkManager").script.knockoutModeNetworkManager;
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

    //setTimeout(()=>{this.addItem(this.database.items[KnockoutModeItems.SLAP1])}, 200)
};
 
KnockoutMode_PlayerInventory.prototype.load = function () {

    console.log("inv load")

    if (this.app.playerItemManager.spikeBall.has){
        this.addItem(this.database.items[KnockoutModeItems.SpikeBall]);
    } else this.removeItem(KnockoutModeItems.SpikeBall);

    if (this.app.playerItemManager.slime.has){
        this.addItem(this.database.items[KnockoutModeItems.Slime]);
    } else this.removeItem(KnockoutModeItems.Slime);

    if (this.app.playerItemManager.bomb.has){
        this.addItem(this.database.items[KnockoutModeItems.Bomb]);
    } else this.removeItem(KnockoutModeItems.Bomb);

    if (this.app.playerItemManager.wall.has){
        this.addItem(this.database.items[KnockoutModeItems.Wall]);
    } else this.removeItem(KnockoutModeItems.Wall);

};

KnockoutMode_PlayerInventory.prototype.giveItem = function(itemId, itemName){
    //console.log("giving item:", itemId)

    switch(itemId){
        case KnockoutModeItems.SpikeBall:
            if (this.app.playerItemManager.spikeBall.has){
                this.app.fire("WarningTextController:setWarning", "You already have this item.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
            } else {
                this.addItem(this.database.items[KnockoutModeItems.SpikeBall]);
                this.app.playerItemManager.spikeBall.has = true;
                this.app.fire("WarningTextController:setWarning", "Item purchased successfully: " + itemName, null, new pc.Color(0, 1, 0, 1));
                this.app.gameManager.sfx_purchase();
            }
            
        break;

        case KnockoutModeItems.Slime:
            if (this.app.playerItemManager.slime.has){
                this.app.fire("WarningTextController:setWarning", "You already have this item.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
            } else {
                this.addItem(this.database.items[KnockoutModeItems.Slime]);
                this.app.playerItemManager.slime.has = true;
                this.app.fire("WarningTextController:setWarning", "Item purchased successfully: " + itemName, null, new pc.Color(0, 1, 0, 1));
                this.app.gameManager.sfx_purchase();
            }
        break;

        case KnockoutModeItems.Bomb:
            if (this.app.playerItemManager.bomb.has){
                this.app.fire("WarningTextController:setWarning", "You already have this item.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
            } else {
                this.addItem(this.database.items[KnockoutModeItems.Bomb]);
                this.app.playerItemManager.bomb.has = true;
                this.app.fire("WarningTextController:setWarning", "Item purchased successfully: " + itemName, null, new pc.Color(0, 1, 0, 1));
                this.app.gameManager.sfx_purchase();
            }
        break;

        case KnockoutModeItems.Wall:
            if (this.app.playerItemManager.wall.has){
                this.app.fire("WarningTextController:setWarning", "You already have this item.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
            } else {
                this.addItem(this.database.items[KnockoutModeItems.Wall]);
                this.app.playerItemManager.wall.has = true;
                this.app.fire("WarningTextController:setWarning", "Item purchased successfully: " + itemName, null, new pc.Color(0, 1, 0, 1));
                this.app.gameManager.sfx_purchase();
            }
        break;

/*         case KnockoutModeItems.JETPACK:
            this.app.playerItemManager.setValue(
                KnockoutModeItems.JETPACK,
                this.app.playerItemManager.jetpack.fuel + this.app.playerItemManager.jetpack.fuelMax
            );
            break;

        case KnockoutModeItems.Rebirth:
            this.app.fire("giveRebirth");
            this.app.fire("resetGame");
            break; */

        case KnockoutModeItems.PenguinDefault:
            this.app.fire("changeSkin", KnockoutModeItems.PenguinDefault);
            break;

        case KnockoutModeItems.PenguinFemale:
            this.app.fire("changeSkin", KnockoutModeItems.PenguinFemale);
            break;

        case KnockoutModeItems.PenguinBinted:
            this.app.fire("changeSkin", KnockoutModeItems.PenguinBinted);
            break;

        case KnockoutModeItems.PenguinPimp:
            this.app.fire("changeSkin", KnockoutModeItems.PenguinPimp);
            break;
    }

    this.app.playerItemManager.saveDatas();
}

KnockoutMode_PlayerInventory.prototype.saveInventory = function () {
    KnockoutMode_Utils.setItem("CARTOBBY_Inventory", JSON.stringify(this.save));
};

KnockoutMode_PlayerInventory.prototype.reset = function () {
    this.save = {
        slots: []
    }
    this.saveInventory();
};

KnockoutMode_PlayerInventory.prototype.addItem = function (item, save = false) {
    if (item == undefined || item == null) return;

    if (this.slots.length >= this.maxSlots) {
        this.app.fire('WarningTextController:setWarning', "Your inventory reached its slot limit!", 5, new pc.Color(1, 0, 0, 1));
        return;
    }

    this.app.fire("StartItem", item.id, save);

    if (this.slots.filter(s => s.item.id === item.id).length <= 0)
        this.addSlot(item, save);
};

KnockoutMode_PlayerInventory.prototype.removeItem = function (id, save = false) {
    for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i].item.id === id) {
            this.removeSlot(i, save);
            break;
        }
    }
};

KnockoutMode_PlayerInventory.prototype.addSlot = function (item, save) {
    if (this.slots.length >= this.maxSlots) return;

    let slotEntity = this.slotTemplate.resource.instantiate();
    this.slotParent.addChild(slotEntity);

    let slot = slotEntity.script.knockoutModeInventorySlot;
    this.slots.push(slot);

    slot.init(item, this.slots.length);

    if (save) {
        this.save.slots.push(item.id);
        this.saveInventory();
    }
};

KnockoutMode_PlayerInventory.prototype.removeSlot = function (index, save) {
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

KnockoutMode_PlayerInventory.prototype.onKeyDown = function (event) {
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

KnockoutMode_PlayerInventory.prototype.selectSlot = function (index) {
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

KnockoutMode_PlayerInventory.prototype.closeSlot = function(){
    if (this.currentSlot != null){
        this.selectSlot(this.currentSlotIndex);
    }
}
