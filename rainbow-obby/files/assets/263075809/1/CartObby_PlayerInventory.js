var CartObbyPlayerInventory = pc.createScript('cartObbyPlayerInventory');

CartObbyPlayerInventory.attributes.add("slotParent", { type: "entity" });
CartObbyPlayerInventory.attributes.add("slotTemplate", { type: "asset", assetType: "template" });

CartObbyPlayerInventory.prototype.initialize = function () {
    this.controller = this.entity.script.cartObbyPlayerController;
    //this.powerup = this.entity.script.playerPowerup;
    this.database = this.app.root.findByName("CartManager").script.cartObbyCartManager;
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;
    this.app.inventory = this;

    this.slots = [];

    this.currentSlot = null;
    this.maxSlots = 9;
    this.currentSlotIndex = null;

    this.activeItem = () => this.currentSlot?.item;

    { const handle = this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this); this.on('destroy', () => handle.off()); }

/* 
    setTimeout(()=>{this.addItem(this.database.items[CartObbyItems.JETPACK], true)}, 200)
    setTimeout(()=>{this.addItem(this.database.items[CartObbyItems.FLYING_CARPET], true)}, 200)
    setTimeout(()=>{this.addItem(this.database.items[CartObbyItems.TNT], true)}, 200) */
};

CartObbyPlayerInventory.prototype.load = function () {

    if (this.app.playerPowerUp.jetpack.fuel > 0){
        this.addItem(this.database.items[CartObbyItems.JETPACK]);
    } else this.removeItem(CartObbyItems.JETPACK);

    if (this.app.playerPowerUp.flyingCarpet.remaining > 0){
        this.addItem(this.database.items[CartObbyItems.FLYING_CARPET]);
    } else this.removeItem(CartObbyItems.FLYING_CARPET);

    if (this.app.playerPowerUp.tnt.amount > 0){
        this.addItem(this.database.items[CartObbyItems.TNT]);
    } else this.removeItem(CartObbyItems.TNT);
    
};



CartObbyPlayerInventory.prototype.saveInventory = function () {
    CartObby_Utils.setItem("CARTOBBY_Inventory", JSON.stringify(this.save));
};

CartObbyPlayerInventory.prototype.reset = function () {
    this.save = {
        slots: []
    }
    this.saveInventory();
};

CartObbyPlayerInventory.prototype.addItem = function (item, save = false) {
    if (item == undefined || item == null) return;

    if (this.slots.length >= this.maxSlots) {
        this.app.fire('WarningTextController:setWarning', "Your inventory reached its slot limit!", 5, new pc.Color(1, 0, 0, 1));
        return;
    }

    this.app.fire("StartItem", item.id, save);

    if (this.slots.filter(s => s.item.id === item.id).length <= 0)
        this.addSlot(item, save);
};

CartObbyPlayerInventory.prototype.removeItem = function (id, save = false) {
    for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i].item.id === id) {
            this.removeSlot(i, save);
            break;
        }
    }
};

CartObbyPlayerInventory.prototype.addSlot = function (item, save) {
    if (this.slots.length >= this.maxSlots) return;

    let slotEntity = this.slotTemplate.resource.instantiate();
    this.slotParent.addChild(slotEntity);

    let slot = slotEntity.script.inventorySlot;
    this.slots.push(slot);

    slot.init(item, this.slots.length);

    if (save) {
        this.save.slots.push(item.id);
        this.saveInventory();
    }
};

CartObbyPlayerInventory.prototype.removeSlot = function (index, save) {
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

CartObbyPlayerInventory.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inCart) return;
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

CartObbyPlayerInventory.prototype.selectSlot = function (index) {
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

CartObbyPlayerInventory.prototype.closeSlot = function(){
    if (this.currentSlot != null){
        this.selectSlot(this.currentSlotIndex);
    }
}
