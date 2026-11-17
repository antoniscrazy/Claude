var SkateboardObbyPlayerItemManager = pc.createScript('skateboardObbyPlayerItemManager');

SkateboardObbyPlayerItemManager.attributes.add("boostPowerupDuration", { type: "number", default: 90, title: "Boost Power-up Duration (sn)", description: "Boost power-up'i (1 reklam) Boost'u bu kadar sure acar. Olunce / respawn'da devam eder" });

// initialize code called once per entity
SkateboardObbyPlayerItemManager.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.skateboardObbyNetworkManager;
    this.playerController = this.entity.script.skateboardObbyPlayerController;
    this.camera = this.app.root.findByName('Camera');
    this.app.playerItemManager = this;
    this.database = this.app.root.findByName("ItemDatabase").script.skateboardObbyItemDatabase;

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

    // Boost power-up'i: VIP olmayan oyuncuya sureli Boost (kalan sure kayitli, oyun acikken azalir)
    this.boostPowerup = {
        remaining: 0,
        max: this.boostPowerupDuration,
        saveTimer: 0,
    };

    // Kaykay / skin id'leri (SkateboardObby_Cosmetics: 0 default, 1 VIP, 2 BOSS VIP). VipManager kademeye gore takar.
    this.cosmetics = {
        board: 0,
        skin: 0,
    };

    this.playerData = {
        testID: 1,
        iq: 1,
    }

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.on("ToggleItem", this.toggleItem, this);
    this.app.on("changeSkin", this.onChangeSkin, this);
    this.app.on("Connected", this.onConnected, this);
    this.app.on("giveItem", this.onGiveItem, this);

    this.on('destroy', function () {
        this.app.off("giveItem", this.onGiveItem, this);
        this.saveBoostPowerup();
        this.app.off("ToggleItem", this.toggleItem, this);
        this.app.off("changeSkin", this.onChangeSkin, this);
        this.app.off("Connected", this.onConnected, this);
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }, this);

    if (SkateboardObby_Utils.getItem("SkateboardObby_Jetpack")) {
        this.jetpack.fuel = SkateboardObby_Utils.getItem("SkateboardObby_Jetpack") * 1
    }

    if (SkateboardObby_Utils.getItem("SkateboardObby_FlyingCarpet")) {
        this.flyingCarpet.remaining = SkateboardObby_Utils.getItem("SkateboardObby_FlyingCarpet") * 1
    }

    const _savedBoost = Number(SkateboardObby_Utils.getItem("SkateboardObby_BoostPowerup"));
    this.boostPowerup.remaining = Number.isFinite(_savedBoost) ? pc.math.clamp(_savedBoost, 0, this.boostPowerup.max) : 0;

    // eski kayit (template'ten kalan 9..14) ya da gecersiz deger -> 0
    this.cosmetics.board = SkateboardObby_Cosmetics.sanitize(this.database, "board", SkateboardObby_Utils.getItem("SkateboardObby_Board"));
    this.cosmetics.skin = SkateboardObby_Cosmetics.sanitize(this.database, "skin", SkateboardObby_Utils.getItem("SkateboardObby_Skin"));
    this.applyCosmetics();

    let _savedTestID = SkateboardObby_Utils.getItem("SkateboardObby_TestID");

    if (_savedTestID) {
        _savedTestID = Number(_savedTestID);
        _savedTestID = _savedTestID
        if (isNaN(_savedTestID)) {this.playerData.testID = 1;}
        else {this.playerData.testID = _savedTestID * 1;}
    } else {this.playerData.testID = 1;}

    SkateboardObby_Utils.setItem("SkateboardObby_TestID", this.playerData.testID);

    let _savedIQ = SkateboardObby_Utils.getItem("SkateboardObby_IQ");

    if (_savedIQ) {
        _savedIQ = Number(_savedIQ);
        _savedIQ = _savedIQ
        if (isNaN(_savedIQ)) {this.playerData.iq = 1;}
        else {this.playerData.iq = _savedIQ;}
    } else {this.playerData.iq = 1;}

    SkateboardObby_Utils.setItem("SkateboardObby_IQ", this.playerData.iq);

    this.app.inventory.load();
};

// update code called every frame
SkateboardObbyPlayerItemManager.prototype.update = function (dt) {
    this.updateBoostPowerup(dt);

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
            SkateboardObby_Utils.setItem("SkateboardObby_Jetpack", this.jetpack.fuel);

            let _m = this.jetpack.fuel / this.jetpack.fuelMax;
            this.database.items[SkateboardObbyItems.Jetpack].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
            this.database.items[SkateboardObbyItems.Jetpack].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

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
        SkateboardObby_Utils.setItem("SkateboardObby_FlyingCarpet", this.flyingCarpet.remaining);

        let _m = this.flyingCarpet.remaining / this.flyingCarpet.remainingMax;
        this.database.items[SkateboardObbyItems.FlyingCarpet].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
        this.database.items[SkateboardObbyItems.FlyingCarpet].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

        if (this.flyingCarpet.remaining <= 0) { this.app.inventory.load(); }
    }
};

SkateboardObbyPlayerItemManager.prototype.onConnected = function () {
    this.sendCosmetics();
}

SkateboardObbyPlayerItemManager.prototype.sendCosmetics = function () {
    const _network = this.app.skateboardObbyNetworkManager;
    if (!_network || !_network.room) return;
    _network.room.send("Client:SetSkin", { skin: this.cosmetics.skin });
    // eski server: board alani / Client:SetBoard yok. Oyuncu henuz state'te degilse yine gonderilir (zararsiz),
    // NetworkManager yerel oyuncu eklenince tekrar cagirir.
    const _players = _network.room.state ? _network.room.state.players : null;
    const _me = _players ? _players.get(_network.room.sessionId) : null;
    if (!_me || "board" in _me) _network.room.send("Client:SetBoard", { board: this.cosmetics.board });
}

// --- kaykay / skin ------------------------------------------------------------

// PlayerItemManager is on the Player entity: apply directly (no dependency on the controller script order)
SkateboardObbyPlayerItemManager.prototype.applyCosmetics = function () {
    SkateboardObby_Cosmetics.apply(this.app, this.database, this.entity, "board", this.cosmetics.board);
    SkateboardObby_Cosmetics.apply(this.app, this.database, this.entity, "skin", this.cosmetics.skin);
}

SkateboardObbyPlayerItemManager.prototype.setBoard = function (_board) {
    _board = SkateboardObby_Cosmetics.sanitize(this.database, "board", _board);
    SkateboardObby_Utils.setItem("SkateboardObby_Board", _board);
    if (_board === this.cosmetics.board) return;
    this.cosmetics.board = _board;
    SkateboardObby_Cosmetics.apply(this.app, this.database, this.entity, "board", _board);
    this.sendCosmetics();
}

SkateboardObbyPlayerItemManager.prototype.setSkin = function (_skin) {
    _skin = SkateboardObby_Cosmetics.sanitize(this.database, "skin", _skin);
    SkateboardObby_Utils.setItem("SkateboardObby_Skin", _skin);
    if (_skin === this.cosmetics.skin) return;
    this.cosmetics.skin = _skin;
    SkateboardObby_Cosmetics.apply(this.app, this.database, this.entity, "skin", _skin);
    this.sendCosmetics();
}

// --- Boost power-up -------------------------------------------------------------

SkateboardObbyPlayerItemManager.prototype.hasBoostPowerup = function () {
    return this.boostPowerup.remaining > 0;
}

SkateboardObbyPlayerItemManager.prototype.canBuyBoostPowerup = function () {
    if (this.app.isVip) {
        this.app.fire("WarningTextController:setWarning", "You already have Boost with VIP.", null, new pc.Color(1, 0.51, 0.03, 1));
        this.app.gameManager.sfx_warning();
        return false;
    }
    if (this.boostPowerup.remaining > this.boostPowerup.max - 5) {
        this.app.fire("WarningTextController:setWarning", "Boost is already active.", null, new pc.Color(1, 0.51, 0.03, 1));
        this.app.gameManager.sfx_warning();
        return false;
    }
    return true;
}

// Sure katlanmaz: her alista tam sure (VIP gibi)
SkateboardObbyPlayerItemManager.prototype.grantBoostPowerup = function (_seconds) {
    const _was = this.hasBoostPowerup();
    this.boostPowerup.remaining = _seconds > 0 ? _seconds : this.boostPowerup.max;
    this.saveBoostPowerup();
    if (!_was) this.app.fire("BoostPowerup:Changed", true);
    this.app.fire("WarningTextController:setWarning", "BOOST UNLOCKED for " + Math.round(this.boostPowerup.remaining) + " seconds! Press " + (this.app.isMobile ? "BOOST" : "Q"), 4, new pc.Color(0, 1, 0, 1));
}

SkateboardObbyPlayerItemManager.prototype.endBoostPowerup = function () {
    if (!this.hasBoostPowerup()) return;
    this.boostPowerup.remaining = 0;
    this.saveBoostPowerup();
    this.app.fire("BoostPowerup:Changed", false);
}

SkateboardObbyPlayerItemManager.prototype.saveBoostPowerup = function () {
    this.boostPowerup.saveTimer = 0;
    SkateboardObby_Utils.setItem("SkateboardObby_BoostPowerup", String(Math.max(0, Math.round(this.boostPowerup.remaining))));
}

// oyun suresiyle azalir (reklam / ESC menusu acikken durur); VIP varken harcanmaz
SkateboardObbyPlayerItemManager.prototype.updateBoostPowerup = function (dt) {
    if (this.boostPowerup.remaining <= 0 || this.app.isVip || this.app.isWatchingAd || this.app.menuPanelEnabled) return;

    this.boostPowerup.remaining -= dt;
    if (this.boostPowerup.remaining <= 0) {
        this.boostPowerup.remaining = 0;
        this.saveBoostPowerup();
        this.app.fire("BoostPowerup:Changed", false);
        this.app.fire("WarningTextController:setWarning", "Your Boost power-up has expired.", 4, new pc.Color(1, 1, 0, 1));
        return;
    }

    this.boostPowerup.saveTimer += dt;
    if (this.boostPowerup.saveTimer >= 5) this.saveBoostPowerup();
}

SkateboardObbyPlayerItemManager.prototype.onGiveItem = function (itemId) {
    if (itemId === SkateboardObbyItems.Boost) this.grantBoostPowerup();
}

SkateboardObbyPlayerItemManager.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inTroll) return;
};

SkateboardObbyPlayerItemManager.prototype.toggleItem = function (itemId, toggle) {
    //console.log("toggleItem", itemId, toggle);
    switch (itemId) {
        case SkateboardObbyItems.Jetpack:
            this.entity.findByName("Jetpack").enabled = toggle;
            this.jetpack.enabled = toggle;
            break

        case SkateboardObbyItems.FlyingCarpet:
            this.entity.findByName("FlyingCarpet").enabled = toggle;
            this.flyingCarpet.enabled = toggle;
            break
    }

    this.setActiveItemID(toggle ? itemId : -1);
}

SkateboardObbyPlayerItemManager.prototype.closeAll = function () {
    this.app.inventory.closeSlot();
}

SkateboardObbyPlayerItemManager.prototype.onChangeSkin = function (_skin) {
    this.setSkin(_skin);
}

SkateboardObbyPlayerItemManager.prototype.setValue = function (itemId, value) {
    switch (itemId) {
        case SkateboardObbyItems.Jetpack:
            this.jetpack.fuel = value;
            SkateboardObby_Utils.setItem("SkateboardObby_Jetpack", this.jetpack.fuel);
            break

        case SkateboardObbyItems.FlyingCarpet:
            this.flyingCarpet.remaining = value;

            SkateboardObby_Utils.setItem("SkateboardObby_FlyingCarpet", this.flyingCarpet.remaining);
            break
    }

    this.saveDatas();
    this.app.inventory.load();
}

SkateboardObbyPlayerItemManager.prototype.saveDatas = function () {
    SkateboardObby_Utils.setItem("SkateboardObby_Jetpack", this.jetpack.fuel);
    SkateboardObby_Utils.setItem("SkateboardObby_FlyingCarpet", this.flyingCarpet.remaining);
}

SkateboardObbyPlayerItemManager.prototype.canHit = function () {
    if (!this.app.skateboardObbyPlayerController.canHit) { return false; }
    if (this.app.isEdit) { return false; }
    if (this.app.skateboardObbyNetworkManager.menuPanel.enabled){return false;}

    if (!this.app.gameManager.isInGame) {
        this.app.fire("WarningTextController:setWarning", "You can only hit while in the game.", null, new pc.Color(1, 0.51, 0.03, 1));
        this.app.gameManager.sfx_warning();
        if (this.app.skateboardObbyPlayerController.entity.getPosition().z < 55) {
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

SkateboardObbyPlayerItemManager.prototype.shouldDurabilityDrain = function(){
    return (!this.app.gameManager.isPlaycanvas);
}

SkateboardObbyPlayerItemManager.prototype.hitPressed = function () {
    return ((window.touchJoypad.buttons.wasPressed('slapButton') || this.app.mouse.wasPressed(pc.MOUSEBUTTON_LEFT)) && this.canHit());
}

SkateboardObbyPlayerItemManager.prototype.setActiveItemID = function (_itemID) {
    if (this.networkManager.room) {
        this.networkManager.room.send("Client:SetActiveItemID", { itemID: _itemID });
    }
}


SkateboardObbyPlayerItemManager.prototype.isItemOwned = function (_itemID) {
    switch (_itemID) {
        case SkateboardObbyItems.JETPACK:
            return this.jetpack.fuel;

        case SkateboardObbyItems.FLYING_CARPET:
            return this.flyingCarpet.remaining;

        case SkateboardObbyItems.Shield:
            return this.shield.durability;

        case SkateboardObbyItems.Boost:
            return this.boostPowerup.remaining;
    }
}

SkateboardObbyPlayerItemManager.prototype.getDurabilityColor = function (v) {
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

