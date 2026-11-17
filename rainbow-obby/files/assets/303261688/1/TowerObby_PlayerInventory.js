var TowerObby_PlayerInventory = pc.createScript('towerObbyPlayerInventory');

TowerObby_PlayerInventory.attributes.add("slotParent", { type: "entity" });
TowerObby_PlayerInventory.attributes.add("slotTemplate", { type: "asset", assetType: "template" });


TowerObby_PlayerInventory.prototype.initialize = function () {
    this.controller = this.entity.script.towerObbyPlayerController;
    this.database = this.app.root.findByName("ItemDatabase").script.towerObbyItemDatabase;
    this.networkManager = this.app.root.findByName("NetworkManager").script.towerObbyNetworkManager;
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

TowerObby_PlayerInventory.prototype.load = function () {

    console.log("inv load")
    if (this.app.playerItemManager.jetpack.fuel > 0) {
        this.addItem(this.database.items[TowerObbyItems.Jetpack]);
    } else this.removeItem(TowerObbyItems.Jetpack);

    if (this.app.playerItemManager.flyingCarpet.remaining > 0) {
        this.addItem(this.database.items[TowerObbyItems.FlyingCarpet]);
    } else this.removeItem(TowerObbyItems.FlyingCarpet);

    if (this.app.playerItemManager.shield.durability > 0) {
        this.addItem(this.database.items[TowerObbyItems.Shield]);
    } else this.removeItem(TowerObbyItems.Shield);

    if (this.app.playerItemManager.immortality.remaining > 0) {
        this.addItem(this.database.items[TowerObbyItems.Immortality]);
    } else this.removeItem(TowerObbyItems.Immortality);

    if (this.app.playerItemManager.lowGravity.remaining > 0) {
        this.addItem(this.database.items[TowerObbyItems.LowGravity]);
    } else this.removeItem(TowerObbyItems.LowGravity);

    if (this.app.playerItemManager.shrink.remaining > 0) {
        this.addItem(this.database.items[TowerObbyItems.Shrink]);
    } else this.removeItem(TowerObbyItems.Shrink);

    if (this.app.playerItemManager.grow.remaining > 0) {
        this.addItem(this.database.items[TowerObbyItems.Grow]);
    } else this.removeItem(TowerObbyItems.Grow);

    if (this.app.playerItemManager.doubleJump.owned) {
        this.addItem(this.database.items[TowerObbyItems.DoubleJump]);
    } else this.removeItem(TowerObbyItems.DoubleJump);

    if (this.app.playerItemManager.slapHand.owned) {
        this.addItem(this.database.items[TowerObbyItems.SlapHand]);
    } else this.removeItem(TowerObbyItems.SlapHand);

    if (this.app.playerItemManager.slapBalloon.owned) {
        this.addItem(this.database.items[TowerObbyItems.SlapBalloon]);
    } else this.removeItem(TowerObbyItems.SlapBalloon);

    if (this.app.playerItemManager.slapBat.owned) {
        this.addItem(this.database.items[TowerObbyItems.SlapBat]);
    } else this.removeItem(TowerObbyItems.SlapBat);

    if (this.app.playerItemManager.slapCandy.owned) {
        this.addItem(this.database.items[TowerObbyItems.SlapCandy]);
    } else this.removeItem(TowerObbyItems.SlapCandy);

    if (this.app.playerItemManager.slapLollipop.owned) {
        this.addItem(this.database.items[TowerObbyItems.SlapLollipop]);
    } else this.removeItem(TowerObbyItems.SlapLollipop);
};

TowerObby_PlayerInventory.prototype.giveItem = function (itemId) {
    console.log("giveItem", itemId);
    switch (itemId) {
        case TowerObbyItems.Jetpack:
            this.app.playerItemManager.setValue(TowerObbyItems.Jetpack, this.app.playerItemManager.jetpack.fuelMax);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.FlyingCarpet:
            this.app.playerItemManager.setValue(TowerObbyItems.FlyingCarpet, this.app.playerItemManager.flyingCarpet.remainingMax);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.ResetGame:
            this.app.fire("Game:ResetGame");
            break;

        case TowerObbyItems.SlapHand:
            this.app.playerItemManager.slapHand.owned = true;
            this.app.playerItemManager.slapHand.durability = this.database.items[TowerObbyItems.SlapHand].maxDurability;
            this.addItem(this.database.items[TowerObbyItems.SlapHand]);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.SlapBalloon:
            this.app.playerItemManager.slapBalloon.owned = true;
            this.app.playerItemManager.slapBalloon.durability = this.database.items[TowerObbyItems.SlapBalloon].maxDurability;
            this.addItem(this.database.items[TowerObbyItems.SlapBalloon]);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.SlapBat:
            this.app.playerItemManager.slapBat.owned = true;
            this.app.playerItemManager.slapBat.durability = this.database.items[TowerObbyItems.SlapBat].maxDurability;
            this.addItem(this.database.items[TowerObbyItems.SlapBat]);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.SlapCandy:
            this.app.playerItemManager.slapCandy.owned = true;
            this.app.playerItemManager.slapCandy.durability = this.database.items[TowerObbyItems.SlapCandy].maxDurability;
            this.addItem(this.database.items[TowerObbyItems.SlapCandy]);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.SlapLollipop:
            this.app.playerItemManager.slapLollipop.owned = true;
            this.app.playerItemManager.slapLollipop.durability = this.database.items[TowerObbyItems.SlapLollipop].maxDurability;
            this.addItem(this.database.items[TowerObbyItems.SlapLollipop]);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.Shield:
            this.app.playerItemManager.setValue(TowerObbyItems.Shield, this.app.playerItemManager.shield.durabilityMax);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.Immortality:
            this.app.playerItemManager.setValue(TowerObbyItems.Immortality, this.app.playerItemManager.immortality.remainingMax);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.LowGravity:
            this.app.playerItemManager.setValue(TowerObbyItems.LowGravity, this.app.playerItemManager.lowGravity.remainingMax);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.Shrink:
            this.app.playerItemManager.setValue(TowerObbyItems.Shrink, this.app.playerItemManager.shrink.remainingMax);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.Grow:
            this.app.playerItemManager.setValue(TowerObbyItems.Grow, this.app.playerItemManager.grow.remainingMax);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.DoubleJump:
            this.app.playerItemManager.doubleJump.owned = true;
            this.app.playerItemManager.doubleJump.durability = this.app.playerItemManager.doubleJump.durabilityMax;
            this.addItem(this.database.items[TowerObbyItems.DoubleJump]);
            this.app.fire("updateAllInvSlots");
            break;

        case TowerObbyItems.SkinLego:
            this.app.fire("changeSkin", TowerObbyItems.SkinLego);
            break;

        case TowerObbyItems.SkinBigShoe:
            this.app.fire("changeSkin", TowerObbyItems.SkinBigShoe);
            console.log("asdasd")
            break;

        case TowerObbyItems.SkinTurtle:
            this.app.fire("changeSkin", TowerObbyItems.SkinTurtle);
            break;

        case TowerObbyItems.SkinEmolingo:
            this.app.fire("changeSkin", TowerObbyItems.SkinEmolingo);
            break;

        case TowerObbyItems.SkinAxo:
            this.app.fire("changeSkin", TowerObbyItems.SkinAxo);
            break;

        case TowerObbyItems.SkinHacker:
            this.app.fire("changeSkin", TowerObbyItems.SkinHacker);
            break;
        case TowerObbyItems.SkinTri:
            this.app.fire("changeSkin", TowerObbyItems.SkinTri);
            break;
        case TowerObbyItems.SkinChef:
            this.app.fire("changeSkin", TowerObbyItems.SkinChef);
            break;

        case TowerObbyItems.SkinBread:
            this.app.fire("changeSkin", TowerObbyItems.SkinBread);
            break;

        case TowerObbyItems.SkinCat:
            this.app.fire("changeSkin", TowerObbyItems.SkinCat);
            break;

        case TowerObbyItems.SkinFrog:
            this.app.fire("changeSkin", TowerObbyItems.SkinFrog);
            break;

        case TowerObbyItems.SkinNuclear:
            this.app.fire("changeSkin", TowerObbyItems.SkinNuclear);
            break;
    }

    this.app.gameManager.sfx_purchase();
    this.app.playerItemManager.saveDatas();
}

TowerObby_PlayerInventory.prototype.canBuyThisItem = function (_itemID) {
    switch (_itemID) {
        case TowerObbyItems.Jetpack:
            if (this.app.playerItemManager.jetpack.fuel == this.app.playerItemManager.jetpack.fuelMax) {
                this.app.fire("WarningTextController:setWarning", "Jetpack fuel is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.FlyingCarpet:
            if (this.app.playerItemManager.flyingCarpet.remaining == this.app.playerItemManager.flyingCarpet.remainingMax) {
                this.app.fire("WarningTextController:setWarning", "Flying Carpet energy is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SlapHand:
            if (this.app.playerItemManager.slapHand.durability == this.database.items[TowerObbyItems.SlapHand].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Balloon's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SlapBalloon:
            if (this.app.playerItemManager.slapBalloon.durability == this.database.items[TowerObbyItems.SlapBalloon].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Balloon's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SlapBat:
            if (this.app.playerItemManager.slapBat.durability == this.database.items[TowerObbyItems.SlapBat].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Bat's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SlapCandy:
            if (this.app.playerItemManager.slapCandy.durability == this.database.items[TowerObbyItems.SlapCandy].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Candy's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SlapLollipop:
            if (this.app.playerItemManager.slapLollipop.durability == this.database.items[TowerObbyItems.SlapLollipop].maxDurability) {
                this.app.fire("WarningTextController:setWarning", "Lollipop's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.Shield:
            if (this.app.playerItemManager.shield.durability == this.app.playerItemManager.shield.durabilityMax) {
                this.app.fire("WarningTextController:setWarning", "Shield's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.Immortality:
            if (this.app.playerItemManager.immortality.remaining == this.app.playerItemManager.immortality.remainingMax) {
                this.app.fire("WarningTextController:setWarning", "Immortality is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.LowGravity:
            if (this.app.playerItemManager.lowGravity.remaining == this.app.playerItemManager.lowGravity.remainingMax) {
                this.app.fire("WarningTextController:setWarning", "Low Gravity is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.Shrink:
            if (this.app.playerItemManager.shrink.remaining == this.app.playerItemManager.shrink.remainingMax) {
                this.app.fire("WarningTextController:setWarning", "Shrink is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.Grow:
            if (this.app.playerItemManager.grow.remaining == this.app.playerItemManager.grow.remainingMax) {
                this.app.fire("WarningTextController:setWarning", "Grow is already full.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.DoubleJump:
            if (this.app.playerItemManager.doubleJump.durability == this.app.playerItemManager.doubleJump.durabilityMax) {
                this.app.fire("WarningTextController:setWarning", "Double Jump's durability is already max.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinLego:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinLego) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinBigShoe:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinBigShoe) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinTurtle:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinTurtle) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinEmolingo:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinEmolingo) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinAxo:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinAxo) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinHacker:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinHacker) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinTri:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinTri) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinChef:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinChef) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinBread:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinBread) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinCat:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinCat) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinFrog:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinFrog) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        case TowerObbyItems.SkinNuclear:
            if (this.app.playerItemManager.skins.current == TowerObbyItems.SkinNuclear) {
                this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
                this.app.gameManager.sfx_warning();
                return false;
            } else { return true; }
            break;

        default: return false;
    }
}

TowerObby_PlayerInventory.prototype.saveInventory = function () {

};

TowerObby_PlayerInventory.prototype.reset = function () {
    this.save = {
        slots: []
    }
    this.saveInventory();
};

TowerObby_PlayerInventory.prototype.addItem = function (item, save = false) {
    if (item == undefined || item == null) return;

    if (this.slots.length >= this.maxSlots) {
        this.app.fire('WarningTextController:setWarning', "Your inventory reached its slot limit!", 5, new pc.Color(1, 0, 0, 1));
        return;
    }

    this.app.fire("StartItem", item.id, save);

    if (this.slots.filter(s => s.item.id === item.id).length <= 0)
        this.addSlot(item, save);
};

TowerObby_PlayerInventory.prototype.removeItem = function (id, save = false) {
    for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i].item.id === id) {
            this.removeSlot(i, save);
            break;
        }
    }
};

TowerObby_PlayerInventory.prototype.addSlot = function (item, save) {
    if (this.slots.length >= this.maxSlots) return;

    let slotEntity = this.slotTemplate.resource.instantiate();
    this.slotParent.addChild(slotEntity);

    let slot = slotEntity.script.towerObbyInventorySlot;
    this.slots.push(slot);

    slot.init(item, this.slots.length);

    if (save) {
        this.save.slots.push(item.id);
        this.saveInventory();
    }
};

TowerObby_PlayerInventory.prototype.removeSlot = function (index, save) {
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

TowerObby_PlayerInventory.prototype.onKeyDown = function (event) {
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

TowerObby_PlayerInventory.prototype.selectSlot = function (index) {
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

TowerObby_PlayerInventory.prototype.closeSlot = function () {
    if (this.currentSlot != null) {
        this.selectSlot(this.currentSlotIndex);
    }
}
