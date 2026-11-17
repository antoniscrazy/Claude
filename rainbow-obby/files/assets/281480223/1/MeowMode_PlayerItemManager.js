var MeowModePlayerItemManager = pc.createScript('meowModePlayerItemManager');


// initialize code called once per entity
MeowModePlayerItemManager.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.meowModeNetworkManager;
    this.playerController = this.entity.script.meowModePlayerController;
    this.camera = this.app.root.findByName('Camera');
    this.app.playerItemManager = this;
    this.database = this.app.root.findByName("ItemDatabase").script.meowModeItemDatabase;

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

    this.paw = {
        owned: true,
        enabled: false,
    }

    this.skins = {
        lego: true,
        bigShoe: false,
        turtle: false,
        emolingo: false,
        axo: false,
        hacker: false,

        current: MeowModeItems.Skin1,
    }

    this.app.playerData = {
        level:  0,
        xp:     0,
        xpGoal: 0,
    }


    this.slapTouchButton = this.app.root.findByName("slapButton");
    this.slapTouchButton.enabled = false;

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

    if (MeowMode_Utils.getItem("MEOWMODE_Jetpack")) {
        this.jetpack.fuel = MeowMode_Utils.getItem("MEOWMODE_Jetpack") * 1
    }

    if (MeowMode_Utils.getItem("MEOWMODE_FlyingCarpet")) {
        this.flyingCarpet.remaining = MeowMode_Utils.getItem("MEOWMODE_FlyingCarpet") * 1
    }

    if (MeowMode_Utils.getItem("MEOWMODE_Shield")) {
        this.shield.durability = pc.math.clamp((MeowMode_Utils.getItem("MEOWMODE_Shield") * 1), 0, this.shield.durabilityMax);
        MeowMode_Utils.setItem("MEOWMODE_Shield", this.shield.durability);
    }

    let _savedSkin = MeowMode_Utils.getItem("MEOWMODE_Skin");
    if (_savedSkin) {
        _savedSkin = Number(_savedSkin);
        _savedSkin = pc.math.clamp(_savedSkin, 5, 8);
        if (isNaN(_savedSkin)) {
            this.skins.current = MeowModeItems.Skin1;
        } else {
            this.skins.current = _savedSkin;
        }
    } else {
        this.skins.current = MeowModeItems.Skin1;
    }
    MeowMode_Utils.setItem("MEOWMODE_Skin", this.skins.current);

    let _savedLevel = MeowMode_Utils.getItem("MEOWMODE_Level");
    if (_savedLevel) {
        _savedLevel = Number(_savedLevel);
        if (isNaN(_savedLevel)) {
            this.app.playerData.level = 0;
        } else {
            this.app.playerData.level = _savedLevel;
        }
    } else {
        this.app.playerData.level = 0;
    }
    MeowMode_Utils.setItem("MEOWMODE_Level", this.app.playerData.level);

    let _savedXp = MeowMode_Utils.getItem("MEOWMODE_Xp");
    if (_savedXp) {
        _savedXp = Number(_savedXp);
        if (isNaN(_savedXp)) {
            this.app.playerData.xp = 0;
        } else {
            this.app.playerData.xp = _savedXp;
        }
    } else {
        this.app.playerData.xp = 0;
    }
    MeowMode_Utils.setItem("MEOWMODE_Xp", this.app.playerData.xp);

    let _savedXpGoal = MeowMode_Utils.getItem("MEOWMODE_XpGoal");
    if (_savedXpGoal) {
        _savedXpGoal = Number(_savedXpGoal);
        if (isNaN(_savedXpGoal)) {
            this.app.playerData.xpGoal = 0;
        } else {
            this.app.playerData.xpGoal = _savedXpGoal;
        }
    } else {
        this.app.playerData.xpGoal = 0;
    }
    MeowMode_Utils.setItem("MEOWMODE_XpGoal", this.app.playerData.xpGoal);

    this.app.inventory.load();

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        this.app.inventory.selectSlot(0);
    }, 2000);
};

MeowModePlayerItemManager.prototype.updateUi = function(){
    this.networkManager.xpUiBar.setLocalScale(this.app.playerData.xp / this.app.playerData.xpGoal, 1,1);
}


// update code called every frame
MeowModePlayerItemManager.prototype.update = function (dt) {
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

            this.jetpack.fuel -= dt;
            MeowMode_Utils.setItem("MEOWMODE_Jetpack", this.jetpack.fuel);

            let _m = this.jetpack.fuel / this.jetpack.fuelMax;
            this.database.items[MeowModeItems.JETPACK].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
            this.database.items[MeowModeItems.JETPACK].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

            if (this.jetpack.fuel <= 0) { this.app.inventory.load(); }
        } else {
            this.jetpack.particle.stop();
            this.jetpack.using = false;
        }
    }

    if (this.flyingCarpet.enabled) {
        this.flyingCarpet.remaining -= dt;
        //console.log("carpet.remaining", this.flyingCarpet.remaining)
        MeowMode_Utils.setItem("MEOWMODE_FlyingCarpet", this.flyingCarpet.remaining);

        let _m = this.flyingCarpet.remaining / this.flyingCarpet.remainingMax;
        this.database.items[MeowModeItems.FLYING_CARPET].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
        this.database.items[MeowModeItems.FLYING_CARPET].slot.durabilityBar.element.color = this.getDurabilityColor(_m);

        if (this.flyingCarpet.remaining <= 0) { this.app.inventory.load(); }
    }

    if (this.paw.enabled) {
        if (this.hitPressed()) {
            this.app.meowModePlayerController.checkPlayers(
                1,
                1,
                pc.math.lerp(1, .2, this.app.playerData.level / 20)
            );
        }
    }
};

MeowModePlayerItemManager.prototype.onConnected = function () {
    this.app.meowModeNetworkManager.send("Client:SetSkin", { skin: this.skins.current });
    this.app.meowModeNetworkManager.send("Client:SetLevel", { level: this.app.playerData.level });
    this.app.meowModeNetworkManager.send("Client:SetXp", { xp: this.app.playerData.xp });
    //this.app.meowModeNetworkManager.send("Client:SetXpGoal", { skin: this.app.playerData.xpGoal });
}

MeowModePlayerItemManager.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inTroll) return;
};

MeowModePlayerItemManager.prototype.toggleItem = function (itemId, toggle) {
    //console.log("toggleItem", itemId, toggle);
    switch (itemId) {
        case MeowModeItems.Paw:
            //this.entity.findByName("SlapHand").enabled = toggle;
            this.paw.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case MeowModeItems.JETPACK:
            this.entity.findByName("Jetpack").enabled = toggle;
            this.jetpack.enabled = toggle;
            this.slapTouchButton.enabled = false;
            break

        case MeowModeItems.FLYING_CARPET:
            this.entity.findByName("FlyingCarpet").enabled = toggle;
            this.flyingCarpet.enabled = toggle;
            this.slapTouchButton.enabled = false;
            break

        case MeowModeItems.Shield:
            //this.entity.findByName("Shield").enabled = toggle;
            this.entity.findByName("ShieldAura").enabled = toggle;
            this.shield.enabled = toggle;
            this.slapTouchButton.enabled = false;
            //this.app.meowModeNetworkManager.room.send("Client:Attackable", { attackable: !toggle });
            break
    }

    this.setActiveItemID(toggle ? itemId : -1);
}

MeowModePlayerItemManager.prototype.closeAll = function () {
    this.app.inventory.closeSlot();
}

MeowModePlayerItemManager.prototype.onChangeSkin = function (_skin) {
    this.skins.current = _skin;

    this.app.meowModeNetworkManager.send("Client:SetSkin", { skin: this.skins.current });
    MeowMode_Utils.setItem("MEOWMODE_Skin", this.skins.current);
}

MeowModePlayerItemManager.prototype.setValue = function (itemId, value) {
    switch (itemId) {
        case MeowModeItems.JETPACK:
            this.jetpack.fuel = value;
            MeowMode_Utils.setItem("MEOWMODE_Jetpack", this.jetpack.fuel);
            break

        case MeowModeItems.FLYING_CARPET:
            this.flyingCarpet.remaining = value;
            MeowMode_Utils.setItem("MEOWMODE_FlyingCarpet", this.flyingCarpet.remaining);
            break

        case MeowModeItems.Shield:
            this.shield.durability = value;
            MeowMode_Utils.setItem("MEOWMODE_Shield", this.shield.durability);
            break
    }

    this.saveDatas();
    this.app.inventory.load();
}

MeowModePlayerItemManager.prototype.saveDatas = function () {
    MeowMode_Utils.setItem("MEOWMODE_Jetpack", this.jetpack.fuel);
    MeowMode_Utils.setItem("MEOWMODE_FlyingCarpet", this.flyingCarpet.remaining);
    MeowMode_Utils.setItem("MEOWMODE_Shield", this.shield.durability);
}

MeowModePlayerItemManager.prototype.canHit = function () {
    if (!this.app.meowModePlayerController.canHit) { return false; }
    if (this.app.meowModeNetworkManager.menuPanel.enabled){return false;}
    if (this.app.meowModePlayerController.isDancing){return false;}

    return true;

    if (!this.app.gameManager.isInGame) {
        this.app.fire("WarningTextController:setWarning", "You can only hit in-game.", null, new pc.Color(1, 0.51, 0.03, 1));
        this.app.gameManager.sfx_warning();
        if (this.app.meowModePlayerController.entity.getPosition().z < 55) {
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

MeowModePlayerItemManager.prototype.hitPressed = function () {
    return ((window.touchJoypad.buttons.wasPressed('slapButton') || this.app.mouse.wasPressed(pc.MOUSEBUTTON_LEFT)) && this.canHit());
}

MeowModePlayerItemManager.prototype.setActiveItemID = function (_itemID) {
    if (this.networkManager.room) {
        this.networkManager.room.send("Client:SetActiveItemID", { itemID: _itemID });
    }
}


MeowModePlayerItemManager.prototype.isItemOwned = function (_itemID) {
    switch (_itemID) {
        case MeowModeItems.Paw:
            return this.paw.owned;

        case MeowModeItems.JETPACK:
            return this.jetpack.fuel;

        case MeowModeItems.FLYING_CARPET:
            return this.flyingCarpet.remaining;

        case MeowModeItems.Shield:
            return this.shield.durability;
    }
}

MeowModePlayerItemManager.prototype.getDurabilityColor = function (v) {
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

