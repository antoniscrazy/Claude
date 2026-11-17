var SpiderObbyPlayerItemManager = pc.createScript('spiderObbyPlayerItemManager');

// initialize code called once per entity
SpiderObbyPlayerItemManager.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.spiderObbyNetworkManager;
    this.playerController = this.entity.script.spiderObbyPlayerController;
    this.camera = this.app.root.findByName('Camera');
    this.app.playerItemManager = this;
    this.database = this.app.root.findByName("ItemDatabase").script.spiderObbyItemDatabase;

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

    this.skins = {
        lego: true,
        bigShoe: false,
        turtle: false,
        emolingo: false,
        axo: false,
        hacker: false,

        current: SpiderObbyItems.SkinLego,
    }

    this.playerData = {
        testID: 1,
        iq: 1,
    }

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.on("ToggleItem", this.toggleItem, this);
    this.app.on("changeSkin", this.onChangeSkin, this);
    this.app.on("Connected", this.onConnected, this);

    this.on('destroy', function () {
        this.app.off("ToggleItem", this.toggleItem, this);
        this.app.off("changeSkin");
        this.app.off("Connected");
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }, this);

    if (SpiderObby_Utils.getItem("SpiderObby_Jetpack")) {
        this.jetpack.fuel = SpiderObby_Utils.getItem("SpiderObby_Jetpack") * 1
    }

    if (SpiderObby_Utils.getItem("SpiderObby_FlyingCarpet")) {
        this.flyingCarpet.remaining = SpiderObby_Utils.getItem("SpiderObby_FlyingCarpet") * 1
    }

    let _savedSkin = SpiderObby_Utils.getItem("SpiderObby_Skin");

    if (_savedSkin) {
        _savedSkin = Number(_savedSkin);
        _savedSkin = pc.math.clamp(_savedSkin, 9, 14);
        if (isNaN(_savedSkin)) {
            this.skins.current = SpiderObbyItems.SkinLego;
        } else {
            this.skins.current = _savedSkin;
        }
    } else {
        this.skins.current = SpiderObbyItems.SkinLego;
    }

    let _savedTestID = SpiderObby_Utils.getItem("SpiderObby_TestID");

    if (_savedTestID) {
        _savedTestID = Number(_savedTestID);
        _savedTestID = _savedTestID
        if (isNaN(_savedTestID)) {this.playerData.testID = 1;}
        else {this.playerData.testID = _savedTestID * 1;}
    } else {this.playerData.testID = 1;}

    SpiderObby_Utils.setItem("SpiderObby_TestID", this.playerData.testID);

    let _savedIQ = SpiderObby_Utils.getItem("SpiderObby_IQ");

    if (_savedIQ) {
        _savedIQ = Number(_savedIQ);
        _savedIQ = _savedIQ
        if (isNaN(_savedIQ)) {this.playerData.iq = 1;}
        else {this.playerData.iq = _savedIQ;}
    } else {this.playerData.iq = 1;}

    SpiderObby_Utils.setItem("SpiderObby_IQ", this.playerData.iq);

    this.app.inventory.load();
};

// update code called every frame
SpiderObbyPlayerItemManager.prototype.update = function (dt) {
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

            if (!this.shouldDurabilityDrain()){return;}

            this.jetpack.fuel -= dt;
            SpiderObby_Utils.setItem("SpiderObby_Jetpack", this.jetpack.fuel);

            let _m = this.jetpack.fuel / this.jetpack.fuelMax;
            this.database.items[SpiderObbyItems.Jetpack].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
            this.database.items[SpiderObbyItems.Jetpack].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

            if (this.jetpack.fuel <= 0) { this.app.inventory.load(); }
        } else {
            this.jetpack.particle.stop();
            this.jetpack.using = false;
        }
    }

    if (this.flyingCarpet.enabled) {
        if (!this.shouldDurabilityDrain()){return;}

        this.flyingCarpet.remaining -= dt;
        //console.log("carpet.remaining", this.flyingCarpet.remaining)
        SpiderObby_Utils.setItem("SpiderObby_FlyingCarpet", this.flyingCarpet.remaining);

        let _m = this.flyingCarpet.remaining / this.flyingCarpet.remainingMax;
        this.database.items[SpiderObbyItems.FlyingCarpet].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
        this.database.items[SpiderObbyItems.FlyingCarpet].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

        if (this.flyingCarpet.remaining <= 0) { this.app.inventory.load(); }
    }
};

SpiderObbyPlayerItemManager.prototype.onConnected = function () {
    this.app.spiderObbyNetworkManager.send("Client:SetSkin", { skin: this.skins.current });
    this.app.spiderObbyNetworkManager.send("Client:SetIQ", { iq: this.playerData.iq });
}

SpiderObbyPlayerItemManager.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inTroll) return;
};

SpiderObbyPlayerItemManager.prototype.toggleItem = function (itemId, toggle) {
    //console.log("toggleItem", itemId, toggle);
    switch (itemId) {
        case SpiderObbyItems.Jetpack:
            this.entity.findByName("Jetpack").enabled = toggle;
            this.jetpack.enabled = toggle;
            break

        case SpiderObbyItems.FlyingCarpet:
            this.entity.findByName("FlyingCarpet").enabled = toggle;
            this.flyingCarpet.enabled = toggle;
            break
    }

    this.setActiveItemID(toggle ? itemId : -1);
}

SpiderObbyPlayerItemManager.prototype.closeAll = function () {
    this.app.inventory.closeSlot();
}

SpiderObbyPlayerItemManager.prototype.onChangeSkin = function (_skin) {
    this.skins.current = _skin;

    this.app.spiderObbyNetworkManager.send("Client:SetSkin", { skin: this.skins.current });
    SpiderObby_Utils.setItem("SpiderObby_Skin", this.skins.current);
}

SpiderObbyPlayerItemManager.prototype.setValue = function (itemId, value) {
    switch (itemId) {
        case SpiderObbyItems.Jetpack:
            this.jetpack.fuel = value;
            SpiderObby_Utils.setItem("SpiderObby_Jetpack", this.jetpack.fuel);
            break

        case SpiderObbyItems.FlyingCarpet:
            this.flyingCarpet.remaining = value;

            SpiderObby_Utils.setItem("SpiderObby_FlyingCarpet", this.flyingCarpet.remaining);
            break
    }

    this.saveDatas();
    this.app.inventory.load();
}

SpiderObbyPlayerItemManager.prototype.saveDatas = function () {
    SpiderObby_Utils.setItem("SpiderObby_Jetpack", this.jetpack.fuel);
    SpiderObby_Utils.setItem("SpiderObby_FlyingCarpet", this.flyingCarpet.remaining);
}

SpiderObbyPlayerItemManager.prototype.canHit = function () {
    if (!this.app.spiderObbyPlayerController.canHit) { return false; }
    if (this.app.isEdit) { return false; }
    if (this.app.spiderObbyNetworkManager.menuPanel.enabled){return false;}

    if (!this.app.gameManager.isInGame) {
        this.app.fire("WarningTextController:setWarning", "You can only hit in-game.", null, new pc.Color(1, 0.51, 0.03, 1));
        this.app.gameManager.sfx_warning();
        if (this.app.spiderObbyPlayerController.entity.getPosition().z < 55) {
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

SpiderObbyPlayerItemManager.prototype.shouldDurabilityDrain = function(){
    return (!this.app.gameManager.isPlaycanvas);
}

SpiderObbyPlayerItemManager.prototype.hitPressed = function () {
    return ((window.touchJoypad.buttons.wasPressed('slapButton') || this.app.mouse.wasPressed(pc.MOUSEBUTTON_LEFT)) && this.canHit());
}

SpiderObbyPlayerItemManager.prototype.setActiveItemID = function (_itemID) {
    if (this.networkManager.room) {
        this.networkManager.room.send("Client:SetActiveItemID", { itemID: _itemID });
    }
}


SpiderObbyPlayerItemManager.prototype.isItemOwned = function (_itemID) {
    switch (_itemID) {
        case SpiderObbyItems.JETPACK:
            return this.jetpack.fuel;

        case SpiderObbyItems.FLYING_CARPET:
            return this.flyingCarpet.remaining;

        case SpiderObbyItems.Shield:
            return this.shield.durability;
    }
}

SpiderObbyPlayerItemManager.prototype.getDurabilityColor = function (v) {
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

