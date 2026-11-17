var SlimeTower_PlayerInventory = pc.createScript('slimeTowerPlayerInventory');

SlimeTower_PlayerInventory.attributes.add("slotParent", { type: "entity" });
SlimeTower_PlayerInventory.attributes.add("slotTemplate", { type: "asset", assetType: "template" });


SlimeTower_PlayerInventory.prototype.initialize = function () {
    this.controller = this.entity.script.slimeTowerPlayerController;
    this.database = this.app.root.findByName("ItemDatabase").script.slimeTowerItemDatabase;
    this.networkManager = this.app.root.findByName("NetworkManager").script.slimeTowerNetworkManager;
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

SlimeTower_PlayerInventory.prototype.load = function () {

    console.log("inv load")
    if (this.app.playerItemManager.jetpack.fuel > 0) {
        this.addItem(this.database.items[SlimeTowerItems.Jetpack]);
    } else this.removeItem(SlimeTowerItems.Jetpack);

    if (this.app.playerItemManager.flyingCarpet.remaining > 0) {
        this.addItem(this.database.items[SlimeTowerItems.FlyingCarpet]);
    } else this.removeItem(SlimeTowerItems.FlyingCarpet);

    if (this.app.playerItemManager.shield.durability > 0) {
        this.addItem(this.database.items[SlimeTowerItems.Shield]);
    } else this.removeItem(SlimeTowerItems.Shield);

    if (this.app.playerItemManager.slapHand.owned) {
        this.addItem(this.database.items[SlimeTowerItems.SlapHand]);
    } else this.removeItem(SlimeTowerItems.SlapHand);

    if (this.app.playerItemManager.slapBalloon.owned) {
        this.addItem(this.database.items[SlimeTowerItems.SlapBalloon]);
    } else this.removeItem(SlimeTowerItems.SlapBalloon);

    if (this.app.playerItemManager.slapBat.owned) {
        this.addItem(this.database.items[SlimeTowerItems.SlapBat]);
    } else this.removeItem(SlimeTowerItems.SlapBat);

    if (this.app.playerItemManager.slapCandy.owned) {
        this.addItem(this.database.items[SlimeTowerItems.SlapCandy]);
    } else this.removeItem(SlimeTowerItems.SlapCandy);

    if (this.app.playerItemManager.slapLollipop.owned) {
        this.addItem(this.database.items[SlimeTowerItems.SlapLollipop]);
    } else this.removeItem(SlimeTowerItems.SlapLollipop);
};

SlimeTower_PlayerInventory.prototype.giveItem = function (itemId) {
    console.log("giveItem", itemId);
    switch (itemId) {
        case SlimeTowerItems.Jetpack:
            this.app.playerItemManager.setValue(SlimeTowerItems.Jetpack, this.app.playerItemManager.jetpack.fuelMax);
            this.app.fire("updateAllInvSlots");
            break;

        case SlimeTowerItems.FlyingCarpet:
            this.app.playerItemManager.setValue(SlimeTowerItems.FlyingCarpet, this.app.playerItemManager.flyingCarpet.remainingMax);
            this.app.fire("updateAllInvSlots");
            break;

        case SlimeTowerItems.ResetGame:
            this.app.fire("Game:ResetGame");
            break;

        case SlimeTowerItems.SlapHand:
            this.app.playerItemManager.slapHand.owned = true;
            this.app.playerItemManager.slapHand.durability = this.database.items[SlimeTowerItems.SlapHand].maxDurability;
            this.addItem(this.database.items[SlimeTowerItems.SlapHand]);
            this.app.fire("updateAllInvSlots");
            break;

        case SlimeTowerItems.SlapBalloon:
            this.app.playerItemManager.slapBalloon.owned = true;
            this.app.playerItemManager.slapBalloon.durability = this.database.items[SlimeTowerItems.SlapBalloon].maxDurability;
            this.addItem(this.database.items[SlimeTowerItems.SlapBalloon]);
            this.app.fire("updateAllInvSlots");
            break;

        case SlimeTowerItems.SlapBat:
            this.app.playerItemManager.slapBat.owned = true;
            this.app.playerItemManager.slapBat.durability = this.database.items[SlimeTowerItems.SlapBat].maxDurability;
            this.addItem(this.database.items[SlimeTowerItems.SlapBat]);
            this.app.fire("updateAllInvSlots");
            break;

        case SlimeTowerItems.SlapCandy:
            this.app.playerItemManager.slapCandy.owned = true;
            this.app.playerItemManager.slapCandy.durability = this.database.items[SlimeTowerItems.SlapCandy].maxDurability;
            this.addItem(this.database.items[SlimeTowerItems.SlapCandy]);
            this.app.fire("updateAllInvSlots");
            break;

        case SlimeTowerItems.SlapLollipop:
            this.app.playerItemManager.slapLollipop.owned = true;
            this.app.playerItemManager.slapLollipop.durability = this.database.items[SlimeTowerItems.SlapLollipop].maxDurability;
            this.addItem(this.database.items[SlimeTowerItems.SlapLollipop]);
            this.app.fire("updateAllInvSlots");
            break;

        case SlimeTowerItems.Shield:
            this.app.playerItemManager.setValue(SlimeTowerItems.Shield, this.app.playerItemManager.shield.durabilityMax);
            this.app.fire("updateAllInvSlots");
            break;

        case SlimeTowerItems.SkinLego:
            this.app.fire("changeSkin", SlimeTowerItems.SkinLego);
            break;

        case SlimeTowerItems.SkinBigShoe:
            this.app.fire("changeSkin", SlimeTowerItems.SkinBigShoe);
            console.log("asdasd")
            break;

        case SlimeTowerItems.SkinTurtle:
            this.app.fire("changeSkin", SlimeTowerItems.SkinTurtle);
            break;

        case SlimeTowerItems.SkinEmolingo:
            this.app.fire("changeSkin", SlimeTowerItems.SkinEmolingo);
            break;

        case SlimeTowerItems.SkinAxo:
            this.app.fire("changeSkin", SlimeTowerItems.SkinAxo);
            break;

        case SlimeTowerItems.SkinHacker:
            this.app.fire("changeSkin", SlimeTowerItems.SkinHacker);
            break;
        case SlimeTowerItems.SkinTri:
            this.app.fire("changeSkin", SlimeTowerItems.SkinTri);
            break;
        case SlimeTowerItems.SkinChef:
            this.app.fire("changeSkin", SlimeTowerItems.SkinChef);
            break;

        case SlimeTowerItems.SkinBread:
            this.app.fire("changeSkin", SlimeTowerItems.SkinBread);
            break;

        case SlimeTowerItems.SkinCat:
            this.app.fire("changeSkin", SlimeTowerItems.SkinCat);
            break;

        case SlimeTowerItems.SkinFrog:
            this.app.fire("changeSkin", SlimeTowerItems.SkinFrog);
            break;

        case SlimeTowerItems.SkinNuclear:
            this.app.fire("changeSkin", SlimeTowerItems.SkinNuclear);
            break;
    }

    this.app.gameManager.sfx_purchase();
    this.app.playerItemManager.saveDatas();
}

SlimeTower_PlayerInventory.prototype.canBuyThisItem = function (_itemID) {
    switch (_itemID) {
        case SlimeTowerItems.Jetpack:
            if (this.app.playerItemManager.jetpack.fuel == this.app.playerItemManager.jetpack.fuelMax) {
                this.app.fire("WarningTextController:setWarning", "Jetpack fuel is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.FlyingCarpet:
            if (this.app.playerItemManager.flyingCarpet.remaining == this.app.playerItemManager.flyingCarpet.remainingMax) {
                this.app.fire("WarningTextController:setWarning", "Flying Carpet energy is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SlapHand:
            if (this.app.playerItemManager.slapHand.durability == this.database.items[SlimeTowerItems.SlapHand].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Balloon's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SlapBalloon:
            if (this.app.playerItemManager.slapBalloon.durability == this.database.items[SlimeTowerItems.SlapBalloon].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Balloon's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SlapBat:
            if (this.app.playerItemManager.slapBat.durability == this.database.items[SlimeTowerItems.SlapBat].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Bat's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SlapCandy:
            if (this.app.playerItemManager.slapCandy.durability == this.database.items[SlimeTowerItems.SlapCandy].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Candy's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SlapLollipop:
            if (this.app.playerItemManager.slapLollipop.durability == this.database.items[SlimeTowerItems.SlapLollipop].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Lollipop's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.Shield:
            if (this.app.playerItemManager.shield.durability == this.app.playerItemManager.shield.durabilityMax) {
                this.app.fire("WarningTextController:setWarning", "Shield's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinLego:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinLego) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinBigShoe:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinBigShoe) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinTurtle:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinTurtle) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinEmolingo:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinEmolingo) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinAxo:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinAxo) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinHacker:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinHacker) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinTri:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinTri) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinChef:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinChef) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinBread:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinBread) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinCat:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinCat) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinFrog:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinFrog) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case SlimeTowerItems.SkinNuclear:
            if (this.app.playerItemManager.skins.current == SlimeTowerItems.SkinNuclear) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        default: return false;
    }
}

SlimeTower_PlayerInventory.prototype.saveInventory = function () {

};

SlimeTower_PlayerInventory.prototype.reset = function () {
    this.save = {
        slots: []
    }
    this.saveInventory();
};

SlimeTower_PlayerInventory.prototype.addItem = function (item, save = false) {
    if (item == undefined || item == null) return;

    if (this.slots.length >= this.maxSlots) {
        this.app.fire('WarningTextController:setWarning', "Your inventory reached its slot limit!", 5, new pc.Color(1, 0, 0, 1));
        return;
    }

    this.app.fire("StartItem", item.id, save);

    if (this.slots.filter(s => s.item.id === item.id).length <= 0)
        this.addSlot(item, save);
};

SlimeTower_PlayerInventory.prototype.removeItem = function (id, save = false) {
    for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i].item.id === id) {
            this.removeSlot(i, save);
            break;
        }
    }
};

SlimeTower_PlayerInventory.prototype.addSlot = function (item, save) {
    if (this.slots.length >= this.maxSlots) return;

    let slotEntity = this.slotTemplate.resource.instantiate();
    this.slotParent.addChild(slotEntity);

    let slot = slotEntity.script.slimeTowerInventorySlot;
    this.slots.push(slot);

    slot.init(item, this.slots.length);

    if (save) {
        this.save.slots.push(item.id);
        this.saveInventory();
    }
};

SlimeTower_PlayerInventory.prototype.removeSlot = function (index, save) {
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

SlimeTower_PlayerInventory.prototype.onKeyDown = function (event) {
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

SlimeTower_PlayerInventory.prototype.selectSlot = function (index) {
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

SlimeTower_PlayerInventory.prototype.closeSlot = function () {
    if (this.currentSlot != null) {
        this.selectSlot(this.currentSlotIndex);
    }
}
