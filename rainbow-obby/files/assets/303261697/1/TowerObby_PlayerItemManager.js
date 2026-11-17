var TowerObbyPlayerItemManager = pc.createScript('towerObbyPlayerItemManager');
TowerObbyPlayerItemManager.attributes.add("faceEntity", { type: "entity" });
// initialize code called once per entity
TowerObbyPlayerItemManager.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.towerObbyNetworkManager;
    this.playerController = this.entity.script.towerObbyPlayerController;
    this.camera = this.app.root.findByName('Camera');
    this.app.playerItemManager = this;
    this.database = this.app.root.findByName("ItemDatabase").script.towerObbyItemDatabase;

    this.jetpack = {
        enabled: false,
        fuel: 0,
        fuelMax: 5,
        particle: this.entity.findByName("JetpackParticle").particlesystem,
        using: false,
        firstUseFrame: true,
    };

    this.flyingCarpet = {
        enabled: false,
        remaining: 0,
        remainingMax: 30,
    };

    this.shield = {
        enabled: false,
        durability: 0,
        durabilityMax: 5,
    };

    this.immortality = {
        enabled: false,
        remaining: 0,
        remainingMax: 10,
    };

    this.lowGravity = {
        enabled: false,
        remaining: 0,
        remainingMax: 20,
        scale: 0.2,
    };

    this.shrink = {
        enabled: false,
        remaining: 0,
        remainingMax: 20,
        scale: 0.5,
    };

    this.grow = {
        enabled: false,
        remaining: 0,
        remainingMax: 20,
        scale: 1.6,
    };

    this.doubleJump = {
        owned: false,
        enabled: false,
        durability: 0,
        durabilityMax: 5,
    };

    this.slapHand = {
        owned: false,
        enabled: false,
        pushMultiplier: 1,
        cooldownMultiplier: 2,
        reachMultiplier: 1,
        durability: 1,
    }

    this.slapBalloon = {
        owned: false,
        enabled: false,
        pushMultiplier: 1.15,
        cooldownMultiplier: 1.4,
        reachMultiplier: 1.1,
        durability: 1,
    }

    this.slapBat = {
        owned: false,
        enabled: false,
        pushMultiplier: 1.25,
        cooldownMultiplier: 1,
        reachMultiplier: 1.2,
        durability: 1,
    }

    this.slapCandy = {
        owned: false,
        enabled: false,
        pushMultiplier: 1.5,
        cooldownMultiplier: .6,
        reachMultiplier: 1.3,
        durability: 1,
    }

    this.slapLollipop = {
        owned: false,
        enabled: false,
        pushMultiplier: 2,
        cooldownMultiplier: .4,
        reachMultiplier: 1.4,
        durability: 1,
    }

    this.skins = {
        lego: true,
        bigShoe: false,
        turtle: false,
        emolingo: false,
        axo: false,
        hacker: false,

        current: TowerObbyItems.SkinLego,
    }

    // the checkpoint is never saved, the stage order decides what it means and it resets with every shuffle
    this.playerData = {
        checkpoint: -1,
    }

    this.slapTouchButton = this.app.root.findByName("slapButton");
    this.slapTouchButton.enabled = false;

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.on("ToggleItem", this.toggleItem, this);
    this.app.on("changeSkin", this.onChangeSkin, this);
    this.app.on("Connected", this.onConnected, this);
    { const handle = this.app.on("NoServer", this.onNoServer, this); this.on('destroy', () => handle.off()); }

    this.on('destroy', function () {
        this.app.off("ToggleItem", this.toggleItem, this);
        this.app.off("changeSkin");
        this.app.off("Connected");
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }, this);

    if (TowerObby_Utils.getItem("TowerObby_Jetpack")) {
        this.jetpack.fuel = TowerObby_Utils.getItem("TowerObby_Jetpack") * 1
    }

    if (TowerObby_Utils.getItem("TowerObby_FlyingCarpet")) {
        this.flyingCarpet.remaining = TowerObby_Utils.getItem("TowerObby_FlyingCarpet") * 1
    }


    if (TowerObby_Utils.getItem("TowerObby_Shield")) {
        this.shield.durability = pc.math.clamp((TowerObby_Utils.getItem("TowerObby_Shield") * 1), 0, this.shield.durabilityMax);
        TowerObby_Utils.setItem("TowerObby_Shield", this.shield.durability);
    }

    if (TowerObby_Utils.getItem("TowerObby_Immortality")) {
        this.immortality.remaining = TowerObby_Utils.getItem("TowerObby_Immortality") * 1
    }

    if (TowerObby_Utils.getItem("TowerObby_LowGravity")) {
        this.lowGravity.remaining = TowerObby_Utils.getItem("TowerObby_LowGravity") * 1
    }

    if (TowerObby_Utils.getItem("TowerObby_Shrink")) {
        this.shrink.remaining = TowerObby_Utils.getItem("TowerObby_Shrink") * 1
    }

    if (TowerObby_Utils.getItem("TowerObby_Grow")) {
        this.grow.remaining = TowerObby_Utils.getItem("TowerObby_Grow") * 1
    }

    if (TowerObby_Utils.getItem("TowerObby_DoubleJump")) {
        this.doubleJump.owned = TowerObby_Utils.getItem("TowerObby_DoubleJump") === "true";

        if (TowerObby_Utils.getItem("TowerObby_DoubleJumpDurability")) {
            this.doubleJump.durability = pc.math.clamp(TowerObby_Utils.getItem("TowerObby_DoubleJumpDurability") * 1, 0, this.doubleJump.durabilityMax);
        } else {
            this.doubleJump.durability = this.doubleJump.durabilityMax;
            TowerObby_Utils.setItem("TowerObby_DoubleJumpDurability", this.doubleJump.durability);
        }
    }

    if (TowerObby_Utils.getItem("TowerObby_Slap")) {
        this.slapHand.owned = TowerObby_Utils.getItem("TowerObby_Slap") === "true";

        if (TowerObby_Utils.getItem("TowerObby_SlapDurability")) {
            this.slapHand.durability = TowerObby_Utils.getItem("TowerObby_SlapDurability") * 1;
        } else {
            this.slapHand.durability = this.database.items[TowerObbyItems.SlapHand].maxDurability;
            TowerObby_Utils.setItem("TowerObby_SlapDurability", this.slapHand.durability);
        }
    }

    if (TowerObby_Utils.getItem("TowerObby_SlapBalloon")) {
        this.slapBalloon.owned = TowerObby_Utils.getItem("TowerObby_SlapBalloon") === "true";

        if (TowerObby_Utils.getItem("TowerObby_SlapBalloonDurability")) {
            this.slapBalloon.durability = TowerObby_Utils.getItem("TowerObby_SlapBalloonDurability") * 1;
        } else {
            this.slapBalloon.durability = this.database.items[TowerObbyItems.SlapBalloon].maxDurability;
            TowerObby_Utils.setItem("TowerObby_SlapBalloonDurability", this.slapBalloon.durability);
        }
    }

    if (TowerObby_Utils.getItem("TowerObby_SlapBat")) {
        this.slapBat.owned = TowerObby_Utils.getItem("TowerObby_SlapBat") === "true";

        if (TowerObby_Utils.getItem("TowerObby_SlapBatDurability")) {
            this.slapBat.durability = TowerObby_Utils.getItem("TowerObby_SlapBatDurability") * 1;
        } else {
            this.slapBat.durability = this.database.items[TowerObbyItems.SlapBat].maxDurability;
            TowerObby_Utils.setItem("TowerObby_SlapBatDurability", this.slapBat.durability);
        }
    }

    if (TowerObby_Utils.getItem("TowerObby_SlapCandy")) {
        this.slapCandy.owned = TowerObby_Utils.getItem("TowerObby_SlapCandy") === "true";

        if (TowerObby_Utils.getItem("TowerObby_SlapCandyDurability")) {
            this.slapCandy.durability = TowerObby_Utils.getItem("TowerObby_SlapCandyDurability") * 1;
        } else {
            this.slapCandy.durability = this.database.items[TowerObbyItems.SlapCandy].maxDurability;
            TowerObby_Utils.setItem("TowerObby_SlapCandyDurability", this.slapCandy.durability);
        }
    }

    if (TowerObby_Utils.getItem("TowerObby_SlapLollipop")) {
        this.slapLollipop.owned = TowerObby_Utils.getItem("TowerObby_SlapLollipop") === "true";

        if (TowerObby_Utils.getItem("TowerObby_SlapLollipopDurability")) {
            this.slapLollipop.durability = TowerObby_Utils.getItem("TowerObby_SlapLollipopDurability") * 1;
        } else {
            this.slapLollipop.durability = this.database.items[TowerObbyItems.SlapLollipop].maxDurability;
            TowerObby_Utils.setItem("TowerObby_SlapLollipopDurability", this.slapLollipop.durability);
        }
    }


    let _savedSkin = TowerObby_Utils.getItem("TowerObby_Skin");

    if (_savedSkin) {
        _savedSkin = Number(_savedSkin);
        _savedSkin = pc.math.clamp(_savedSkin, 9, 20);
        if (isNaN(_savedSkin)) {
            this.skins.current = TowerObbyItems.SkinLego;
            console.log("skin 1")
        } else {
            this.skins.current = _savedSkin;
            console.log("skin 2")
        }
    } else {
        this.skins.current = TowerObbyItems.SkinLego;
        console.log("skin 3")
    }

    if (this.skins.current != TowerObbyItems.SkinLego && this.skins.current != TowerObbyItems.SkinTri) {
        this.faceEntity.enabled = false;
    } else {
        this.faceEntity.enabled = true;
    }

    this.app.inventory.load();
};

// update code called every frame
TowerObbyPlayerItemManager.prototype.update = function (dt) {
    if (this.jetpack.enabled) {
        if (this.app.keyboard.wasPressed(pc.KEY_SPACE) || window.touchJoypad.buttons.wasPressed('jumpButton')) {
            this.entity.rigidbody.linearVelocity = new pc.Vec3();
            //console.log("sifirlandi")
        }
        if (this.app.keyboard.isPressed(pc.KEY_SPACE) || window.touchJoypad.buttons.isPressed('jumpButton')) {
            let forward = this.camera.forward.clone();
            forward.y = 0;
            forward.normalize();
            let upImpulse = new pc.Vec3(0, 1000 * dt, 0);
            let velocity = this.entity.rigidbody.linearVelocity.clone();
            this.entity.rigidbody.linearVelocity = new pc.Vec3(velocity.x, 9.8 + 10, velocity.z);
            this.jetpack.particle.play();

            if (!this.shouldDurabilityDrain()) { return; }

            this.jetpack.fuel -= dt;
            //this.jetpack.text.element.text = Math.round(this.jetpack.fuel / this.jetpack.fuelMax * 100) + "%";
            TowerObby_Utils.setItem("TowerObby_Jetpack", this.jetpack.fuel);

            let _m = this.jetpack.fuel / this.jetpack.fuelMax;
            this.database.items[TowerObbyItems.Jetpack].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
            this.database.items[TowerObbyItems.Jetpack].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

            if (this.jetpack.fuel <= 0) { this.app.inventory.load(); }
        } else {
            this.jetpack.particle.stop();
            this.jetpack.using = false;
        }
    }

    if (this.flyingCarpet.enabled) {
        if (!this.shouldDurabilityDrain()) { return; }

        this.flyingCarpet.remaining -= dt;
        //console.log("carpet.remaining", this.flyingCarpet.remaining)
        //this.flyingCarpet.text.element.text = Math.round(this.flyingCarpet.remaining) + "s";
        TowerObby_Utils.setItem("TowerObby_FlyingCarpet", this.flyingCarpet.remaining);

        let _m = this.flyingCarpet.remaining / this.flyingCarpet.remainingMax;
        this.database.items[TowerObbyItems.FlyingCarpet].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
        this.database.items[TowerObbyItems.FlyingCarpet].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

        if (this.flyingCarpet.remaining <= 0) { this.app.inventory.load(); }
    }

    if (this.immortality.enabled) {
        if (!this.shouldDurabilityDrain()) { return; }
        this.drainTimedItem(this.immortality, TowerObbyItems.Immortality, "TowerObby_Immortality", dt);
    }

    if (this.lowGravity.enabled) {
        if (!this.shouldDurabilityDrain()) { return; }
        this.drainTimedItem(this.lowGravity, TowerObbyItems.LowGravity, "TowerObby_LowGravity", dt);
    }

    if (this.shrink.enabled) {
        if (!this.shouldDurabilityDrain()) { return; }
        this.drainTimedItem(this.shrink, TowerObbyItems.Shrink, "TowerObby_Shrink", dt);
    }

    if (this.grow.enabled) {
        if (!this.shouldDurabilityDrain()) { return; }
        this.drainTimedItem(this.grow, TowerObbyItems.Grow, "TowerObby_Grow", dt);
    }

    if (this.slapHand.enabled) {
        if (this.hitPressed()) {
            if (this.canHit()) {
                if (this.app.towerObbyPlayerController.checkPlayers(
                    this.slapHand.reachMultiplier,
                    this.slapHand.pushMultiplier,
                    this.slapHand.cooldownMultiplier
                )) {
                    if (!this.shouldDurabilityDrain()) { return; }

                    this.slapHand.durability = Math.max(this.app.playerItemManager.slapHand.durability - 1, 0);
                    let _m = this.slapHand.durability / this.database.items[TowerObbyItems.SlapHand].maxDurability
                    this.database.items[TowerObbyItems.SlapHand].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
                    this.database.items[TowerObbyItems.SlapHand].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

                    if (this.slapHand.durability <= 0) {
                        this.slapHand.owned = false;
                        this.app.inventory.load();
                    }

                    this.app.playerItemManager.saveDatas();
                }

            }
        }
    }

    if (this.slapBalloon.enabled) {
        if (this.hitPressed()) {
            if (this.canHit()) {
                if (this.app.towerObbyPlayerController.checkPlayers(
                    this.slapBalloon.reachMultiplier,
                    this.slapBalloon.pushMultiplier,
                    this.slapBalloon.cooldownMultiplier
                )) {
                    if (!this.shouldDurabilityDrain()) { return; }

                    this.slapBalloon.durability = Math.max(this.app.playerItemManager.slapBalloon.durability - 1, 0);
                    let _m = this.slapBalloon.durability / this.database.items[TowerObbyItems.SlapBalloon].maxDurability
                    this.database.items[TowerObbyItems.SlapBalloon].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
                    this.database.items[TowerObbyItems.SlapBalloon].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

                    if (this.slapBalloon.durability <= 0) {
                        this.slapBalloon.owned = false;
                        this.app.inventory.load();
                    }

                    this.app.playerItemManager.saveDatas();
                }

            }
        }
    }

    if (this.slapBat.enabled) {
        if (this.hitPressed()) {
            if (this.canHit()) {
                if (this.app.towerObbyPlayerController.checkPlayers(
                    this.slapBat.reachMultiplier,
                    this.slapBat.pushMultiplier,
                    this.slapBat.cooldownMultiplier
                )) {
                    if (!this.shouldDurabilityDrain()) { return; }

                    this.slapBat.durability = Math.max(this.app.playerItemManager.slapBat.durability - 1, 0);
                    let _m = this.slapBat.durability / this.database.items[TowerObbyItems.SlapBat].maxDurability
                    this.database.items[TowerObbyItems.SlapBat].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
                    this.database.items[TowerObbyItems.SlapBat].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

                    if (this.slapBat.durability <= 0) {
                        this.slapBat.owned = false;
                        this.app.inventory.load();
                    }

                    this.app.playerItemManager.saveDatas();
                }
            }
        }
    }

    if (this.slapCandy.enabled) {
        if (this.hitPressed()) {
            if (this.canHit()) {
                if (this.app.towerObbyPlayerController.checkPlayers(
                    this.slapCandy.reachMultiplier,
                    this.slapCandy.pushMultiplier,
                    this.slapCandy.cooldownMultiplier
                )) {
                    if (!this.shouldDurabilityDrain()) { return; }

                    this.slapCandy.durability = Math.max(this.app.playerItemManager.slapCandy.durability - 1, 0);
                    let _m = this.slapCandy.durability / this.database.items[TowerObbyItems.SlapCandy].maxDurability
                    this.database.items[TowerObbyItems.SlapCandy].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
                    this.database.items[TowerObbyItems.SlapCandy].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

                    if (this.slapCandy.durability <= 0) {
                        this.slapCandy.owned = false;
                        this.app.inventory.load();
                    }

                    this.app.playerItemManager.saveDatas();
                }

            }
        }
    }

    if (this.slapLollipop.enabled) {
        if (this.hitPressed()) {
            if (this.canHit()) {
                if (this.app.towerObbyPlayerController.checkPlayers(
                    this.slapLollipop.reachMultiplier,
                    this.slapLollipop.pushMultiplier,
                    this.slapLollipop.cooldownMultiplier
                )) {
                    if (!this.shouldDurabilityDrain()) { return; }

                    this.slapLollipop.durability = Math.max(this.app.playerItemManager.slapLollipop.durability - 1, 0);
                    let _m = this.slapLollipop.durability / this.database.items[TowerObbyItems.SlapLollipop].maxDurability
                    this.database.items[TowerObbyItems.SlapLollipop].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
                    this.database.items[TowerObbyItems.SlapLollipop].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

                    if (this.slapLollipop.durability <= 0) {
                        this.slapLollipop.owned = false;
                        this.app.inventory.load();
                    }

                    this.app.playerItemManager.saveDatas();
                }

            }
        }
    }
};

TowerObbyPlayerItemManager.prototype.onConnected = function () {
    this.app.towerObbyNetworkManager.send("Client:SetSkin", { skin: this.skins.current });
    this.app.towerObbyNetworkManager.send("Client:SetIQ", { iq: this.playerData.iq });
};

TowerObbyPlayerItemManager.prototype.onNoServer = function () {
    this.app.towerObbyPlayerController.setSkin(this.skins.current);
};

TowerObbyPlayerItemManager.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inTroll) return;
};

TowerObbyPlayerItemManager.prototype.toggleItem = function (itemId, toggle) {
    //console.log("toggleItem", itemId, toggle);
    switch (itemId) {
        case TowerObbyItems.Jetpack:
            this.entity.findByName("Jetpack").enabled = toggle;
            this.jetpack.enabled = toggle;
            break

        case TowerObbyItems.FlyingCarpet:
            this.entity.findByName("FlyingCarpet").enabled = toggle;
            this.flyingCarpet.enabled = toggle;
            break

        case TowerObbyItems.SlapHand:
            this.entity.findByName("SlapHand").enabled = toggle;
            this.slapHand.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TowerObbyItems.SlapBalloon:
            this.entity.findByName("SlapBalloon").enabled = toggle;
            this.slapBalloon.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TowerObbyItems.SlapBat:
            this.entity.findByName("SlapBat").enabled = toggle;
            this.slapBat.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TowerObbyItems.SlapCandy:
            this.entity.findByName("SlapCandy").enabled = toggle;
            this.slapCandy.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TowerObbyItems.SlapLollipop:
            this.entity.findByName("SlapLollipop").enabled = toggle;
            this.slapLollipop.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TowerObbyItems.Immortality:
            this.toggleItemEntity("Shield", toggle);
            this.immortality.enabled = toggle;
            break

        case TowerObbyItems.LowGravity:
            this.toggleItemEntity("Low Gravity", toggle);
            this.lowGravity.enabled = toggle;
            break

        case TowerObbyItems.Shrink:
            this.shrink.enabled = toggle;
            this.applyScale();
            break

        case TowerObbyItems.Grow:
            this.toggleItemEntity("Grow", toggle);
            this.grow.enabled = toggle;
            this.applyScale();
            break

        case TowerObbyItems.DoubleJump:
            this.toggleItemEntity("SpeedShoes_left", toggle);
            this.toggleItemEntity("SpeedShoes_Right", toggle);
            this.doubleJump.enabled = toggle;
            break

        case TowerObbyItems.Shield:
            //this.entity.findByName("Shield").enabled = toggle;
            this.entity.findByName("ShieldAura").enabled = toggle;
            this.shield.enabled = toggle;
            this.slapTouchButton.enabled = false;
            //this.app.towerObbyNetworkManager.room.send("Client:Attackable", { attackable: !toggle });
            break
    }

    this.setActiveItemID(toggle ? itemId : -1);
}

TowerObbyPlayerItemManager.prototype.closeAll = function () {
    this.app.inventory.closeSlot();
}

TowerObbyPlayerItemManager.prototype.onChangeSkin = function (_skin) {
    this.skins.current = _skin;


    if (this.app.towerObbyNetworkManager.room) {
        this.app.towerObbyNetworkManager.send("Client:SetSkin", { skin: this.skins.current });
    } else {
        this.app.towerObbyPlayerController.setSkin(this.skins.current);
    }
    TowerObby_Utils.setItem("TowerObby_Skin", this.skins.current);

    if (this.skins.current != TowerObbyItems.SkinLego && this.skins.current != TowerObbyItems.SkinTri) {
        this.faceEntity.enabled = false;
    } else {
        this.faceEntity.enabled = true;
    }

    console.log("onChangeSkin", _skin);
}

TowerObbyPlayerItemManager.prototype.setValue = function (itemId, value) {
    switch (itemId) {
        case TowerObbyItems.Jetpack:
            this.jetpack.fuel = value;
            TowerObby_Utils.setItem("TowerObby_Jetpack", this.jetpack.fuel);
            break

        case TowerObbyItems.FlyingCarpet:
            this.flyingCarpet.remaining = value;

            TowerObby_Utils.setItem("TowerObby_FlyingCarpet", this.flyingCarpet.remaining);
            break

        case TowerObbyItems.Shield:
            this.shield.durability = value;
            TowerObby_Utils.setItem("TowerObby_Shield", this.shield.durability);
            break

        case TowerObbyItems.Immortality:
            this.immortality.remaining = value;
            TowerObby_Utils.setItem("TowerObby_Immortality", this.immortality.remaining);
            break

        case TowerObbyItems.LowGravity:
            this.lowGravity.remaining = value;
            TowerObby_Utils.setItem("TowerObby_LowGravity", this.lowGravity.remaining);
            break

        case TowerObbyItems.Shrink:
            this.shrink.remaining = value;
            TowerObby_Utils.setItem("TowerObby_Shrink", this.shrink.remaining);
            break

        case TowerObbyItems.Grow:
            this.grow.remaining = value;
            TowerObby_Utils.setItem("TowerObby_Grow", this.grow.remaining);
            break
    }

    this.saveDatas();
    this.app.inventory.load();
}

TowerObbyPlayerItemManager.prototype.saveDatas = function () {
    TowerObby_Utils.setItem("TowerObby_Jetpack", this.jetpack.fuel);
    TowerObby_Utils.setItem("TowerObby_FlyingCarpet", this.flyingCarpet.remaining);

    TowerObby_Utils.setItem("TowerObby_Shield", this.shield.durability);
    TowerObby_Utils.setItem("TowerObby_Slap", this.slapHand.owned);
    TowerObby_Utils.setItem("TowerObby_SlapBalloon", this.slapBalloon.owned);
    TowerObby_Utils.setItem("TowerObby_SlapBat", this.slapBat.owned);
    TowerObby_Utils.setItem("TowerObby_SlapCandy", this.slapCandy.owned);
    TowerObby_Utils.setItem("TowerObby_SlapLollipop", this.slapLollipop.owned);

    TowerObby_Utils.setItem("TowerObby_SlapDurability", this.slapHand.durability);
    TowerObby_Utils.setItem("TowerObby_SlapBalloonDurability", this.slapBalloon.durability);
    TowerObby_Utils.setItem("TowerObby_SlapBatDurability", this.slapBat.durability);
    TowerObby_Utils.setItem("TowerObby_SlapCandyDurability", this.slapCandy.durability);
    TowerObby_Utils.setItem("TowerObby_SlapLollipopDurability", this.slapLollipop.durability);

    TowerObby_Utils.setItem("TowerObby_Immortality", this.immortality.remaining);
    TowerObby_Utils.setItem("TowerObby_LowGravity", this.lowGravity.remaining);
    TowerObby_Utils.setItem("TowerObby_Shrink", this.shrink.remaining);
    TowerObby_Utils.setItem("TowerObby_Grow", this.grow.remaining);

    TowerObby_Utils.setItem("TowerObby_DoubleJump", this.doubleJump.owned);
    TowerObby_Utils.setItem("TowerObby_DoubleJumpDurability", this.doubleJump.durability);
}

TowerObbyPlayerItemManager.prototype.canHit = function () {
    if (!this.app.towerObbyPlayerController.canHit) { return false; }

    return true;
    if (this.app.isEdit) { return false; }
    if (this.app.towerObbyNetworkManager.menuPanel.enabled) { return false; }

    if (!this.app.gameManager.isInGame) {
        this.app.fire("WarningTextController:setWarning", "You can only hit in-game.", null, new pc.Color(1, 0.51, 0.03, 1));
        this.app.gameManager.sfx_warning();
        if (this.app.towerObbyPlayerController.entity.getPosition().z < 55) {
            this.app.fire("playerDie");
        }
        return false;
    }

    if (!this.app.gameManager.isInAction()) {
        this.app.fire("WarningTextController:setWarning", "You can't do that right now.", null, new pc.Color(1, 0.51, 0.03, 1));
        this.app.gameManager.sfx_warning();
        return false;
    }


    return true;
}

TowerObbyPlayerItemManager.prototype.shouldDurabilityDrain = function () {
    return (!this.app.gameManager.isPlaycanvas);
}

TowerObbyPlayerItemManager.prototype.hitPressed = function () {
    return ((window.touchJoypad.buttons.wasPressed('slapButton') || this.app.mouse.wasPressed(pc.MOUSEBUTTON_LEFT)) && this.canHit());
}

TowerObbyPlayerItemManager.prototype.setActiveItemID = function (_itemID) {
    if (this.networkManager.room) {
        this.networkManager.room.send("Client:SetActiveItemID", { itemID: _itemID });
    }
}


TowerObbyPlayerItemManager.prototype.isItemOwned = function (_itemID) {
    switch (_itemID) {
        case TowerObbyItems.Jetpack:
            return this.jetpack.fuel;

        case TowerObbyItems.FlyingCarpet:
            return this.flyingCarpet.remaining;

        case TowerObbyItems.Shield:
            return this.shield.durability;

        case TowerObbyItems.Immortality:
            return this.immortality.remaining;

        case TowerObbyItems.LowGravity:
            return this.lowGravity.remaining;

        case TowerObbyItems.Shrink:
            return this.shrink.remaining;

        case TowerObbyItems.Grow:
            return this.grow.remaining;

        case TowerObbyItems.DoubleJump:
            return this.doubleJump.owned;

        case PvpModeItems.SlapHand:
            return this.slapHand.owned;

        case PvpModeItems.SlapBalloon:
            return this.slapBalloon.owned;

        case PvpModeItems.SlapBat:
            return this.slapBat.owned;

        case PvpModeItems.SlapCandy:
            return this.slapCandy.owned;

        case PvpModeItems.SlapLollipop:
            return this.slapLollipop.owned;
    }
}

// drains a timed item and updates its slot bar, shared by the four timed powerups
TowerObbyPlayerItemManager.prototype.drainTimedItem = function (_item, _itemId, _storageKey, dt) {
    _item.remaining -= dt;
    TowerObby_Utils.setItem(_storageKey, _item.remaining);

    this.setSlotBar(_itemId, _item.remaining / _item.remainingMax);

    if (_item.remaining <= 0) { this.app.inventory.load(); }
}

// the slot is gone for a frame while the inventory rebuilds, so check before drawing
TowerObbyPlayerItemManager.prototype.setSlotBar = function (_itemId, _m) {
    const _slot = this.database.items[_itemId].slot;
    if (!_slot || !_slot.durabilityBar || !_slot.durabilityBar.element) { return; }

    _slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
    _slot.durabilityBar.element.color = this.getDurabilityColor(_m);
}

// spends one double jump charge, call it from wherever the second jump happens
TowerObbyPlayerItemManager.prototype.useDoubleJump = function () {
    if (!this.doubleJump.enabled) { return false; }
    if (!this.shouldDurabilityDrain()) { return true; }

    this.doubleJump.durability = Math.max(this.doubleJump.durability - 1, 0);

    this.setSlotBar(TowerObbyItems.DoubleJump, this.doubleJump.durability / this.doubleJump.durabilityMax);

    if (this.doubleJump.durability <= 0) {
        this.doubleJump.owned = false;
        this.app.inventory.load();
    }

    this.saveDatas();
    return true;
}

// scale is server owned, we ask for it and the state listener applies it to everyone
TowerObbyPlayerItemManager.prototype.applyScale = function () {
    let _scale = 1;
    if (this.shrink.enabled) { _scale = this.shrink.scale; }
    else if (this.grow.enabled) { _scale = this.grow.scale; }

    if (this.networkManager.room) {
        this.networkManager.send("Client:SetScale", { scale: _scale });
    } else {
        this.app.towerObbyPlayerController.setScale(_scale);
    }
}

// enables a child entity only if it exists
TowerObbyPlayerItemManager.prototype.toggleItemEntity = function (_name, _toggle) {
    let _entity = this.entity.findByName(_name);
    if (_entity) { _entity.enabled = _toggle; }
}

TowerObbyPlayerItemManager.prototype.getDurabilityColor = function (v) {
    v = pc.math.clamp(v, 0, 1);

    const red = new pc.Color(1, 0, 0);
    const orange = new pc.Color(1, 0.5, 0);
    const green = new pc.Color(0, 1, 0);

    const color = new pc.Color();

    if (v < 0.5) {
        color.lerp(red, orange, v * 2);
    } else {
        color.lerp(orange, green, (v - 0.5) * 2);
    }

    return color;
};
