var KnockoutModePlayerItemManager = pc.createScript('knockoutModePlayerItemManager');

KnockoutModePlayerItemManager.attributes.add("uiJetpack", { type: "entity" });
KnockoutModePlayerItemManager.attributes.add("uiFlyingCarpet", { type: "entity" });

KnockoutModePlayerItemManager.attributes.add('assetSpikeBall', { type: 'asset' });
KnockoutModePlayerItemManager.attributes.add('assetSlime', { type: 'asset' });
KnockoutModePlayerItemManager.attributes.add('assetBomb', { type: 'asset' });

// initialize code called once per entity
KnockoutModePlayerItemManager.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.knockoutModeNetworkManager;
    this.playerController = this.entity.script.knockoutModePlayerController;
    this.camera = this.app.root.findByName('Camera');
    this.app.playerItemManager = this;

    this.itemPlacePoint = this.entity.findByName("ItemPlacePoint");

/*     this.jetpack = {
        enabled: false,
        fuel: 0,
        fuelMax: 5,
        text: this.uiJetpack.findByName("Text"),
        particle: this.entity.findByName("JetpackParticle").particlesystem,
        using: false,
        firstUseFrame: true,
    }; */

    this.activeItemId = -1;

    this.spikeBall = {
        has: false,
        enabled: false,
        entity: this.entity.findByName("SpikeBall"),
        holo: this.entity.findByName("HoloSpikeBall"),
    }

    this.slime = {
        has: false,
        enabled: false,
        entity: this.entity.findByName("Slime"),
        holo: this.entity.findByName("HoloSlime"),
    }

    this.bomb = {
        has: false,
        enabled: false,
        entity: this.entity.findByName("Bomb"),
        holo: this.entity.findByName("HoloBomb"),
    }

    this.wall = {
        has: false,
        enabled: false,
        entity: this.entity.findByName("Wall"),
        holo: this.entity.findByName("HoloWall"),
    }

    this.skins = {
        penguinDefault: true,
        penguinBinted: false,
        penguinFemale: false,
        penguinPimp: false,

        current: KnockoutModeItems.PenguinDefault,
    }

    this.actionTouchButton = this.app.root.findByName("actionButton");
    this.actionTouchButton.enabled = false;

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.on("ToggleItem", this.toggleItem, this);
    this.app.on("changeSkin", this.onChangeSkin, this);
    this.app.on("Connected", this.onConnected, this);

    this.on('destroy', function () {
        this.app.off("ToggleItem");
        this.app.off("changeSkin");
        this.app.off("Connected");
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }, this);

    if (KnockoutMode_Utils.getItem("KNOCKOUTMODE_SpikeBall")) {
        this.spikeBall.has = KnockoutMode_Utils.getItem("KNOCKOUTMODE_SpikeBall") == "true"
    }

    if (KnockoutMode_Utils.getItem("KNOCKOUTMODE_Slime")) {
        this.slime.has = KnockoutMode_Utils.getItem("KNOCKOUTMODE_Slime") == "true"
    }

    if (KnockoutMode_Utils.getItem("KNOCKOUTMODE_Bomb")) {
        this.bomb.has = KnockoutMode_Utils.getItem("KNOCKOUTMODE_Bomb") == "true"
    }

    if (KnockoutMode_Utils.getItem("KNOCKOUTMODE_Wall")) {
        this.wall.has = KnockoutMode_Utils.getItem("KNOCKOUTMODE_Wall") == "true"
    }

    let _savedSkin = KnockoutMode_Utils.getItem("KNOCKOUTMODE_Skin");

    if (_savedSkin){
        _savedSkin = Number(_savedSkin);
        if (isNaN(_savedSkin)) {
            this.skins.current = KnockoutModeItems.PenguinDefault;
        } else {
            this.skins.current = _savedSkin;
        }
    } else {
        this.skins.current = KnockoutModeItems.PenguinDefault;
    }

    KnockoutMode_Utils.setItem("KNOCKOUTMODE_Skin", this.skins.current);
    this.app.inventory.load();
};

// update code called every frame
KnockoutModePlayerItemManager.prototype.update = function (dt) {
    if (this.spikeBall.enabled && this.hitPressed()){
        if (!this.app.gameManager.isInGame) {
            this.app.fire("WarningTextController:setWarning", "This item only useable during game.", null, new pc.Color(1, 0.51, 0.03, 1));
            this.app.gameManager.sfx_warning();
            return;
        }

        if (this.app.gameManager.currentPhase != "aim"){
            this.app.fire("WarningTextController:setWarning", "Wait for aiming phase to use this item", null, new pc.Color(1, 0.51, 0.03, 1));
            this.app.gameManager.sfx_warning();
            return;
        }

        let _pos = this.itemPlacePoint.getPosition().clone();
        this.networkManager.send("Client:PlaceItem", {
            itemId: KnockoutModeItems.SpikeBall,
            x: _pos.x,
            y: _pos.y,
            z: _pos.z,
        });

        this.spikeBall.has = false;
        this.app.inventory.load();
        this.saveDatas();
    }

    if (this.slime.enabled && this.hitPressed()){
        if (!this.app.gameManager.isInGame) {
            this.app.fire("WarningTextController:setWarning", "This item only useable during game.", null, new pc.Color(1, 0.51, 0.03, 1));
            this.app.gameManager.sfx_warning();
            return;
        }

        if (this.app.gameManager.currentPhase != "aim"){
            this.app.fire("WarningTextController:setWarning", "Wait for aiming phase to use this item", null, new pc.Color(1, 0.51, 0.03, 1));
            this.app.gameManager.sfx_warning();
            return;
        }

        let _pos = this.itemPlacePoint.getPosition().clone();
        this.networkManager.send("Client:PlaceItem", {
            itemId: KnockoutModeItems.Slime,
            x: _pos.x,
            y: _pos.y,
            z: _pos.z,
        });

        this.slime.has = false;
        this.app.inventory.load();
        this.saveDatas();
    }

    if (this.bomb.enabled && this.hitPressed()){
        if (!this.app.gameManager.isInGame) {
            this.app.fire("WarningTextController:setWarning", "This item only useable during game.", null, new pc.Color(1, 0.51, 0.03, 11));
            this.app.gameManager.sfx_warning();
            return;
        }

        if (this.app.gameManager.currentPhase != "aim"){
            this.app.fire("WarningTextController:setWarning", "Wait for aiming phase to use this item", null, new pc.Color(1, 0.51, 0.03, 1));
            this.app.gameManager.sfx_warning();
            return;
        }

        let _pos = this.itemPlacePoint.getPosition().clone();
        this.networkManager.send("Client:PlaceItem", {
            itemId: KnockoutModeItems.Bomb,
            x: _pos.x,
            y: _pos.y,
            z: _pos.z,
        });

        this.bomb.has = false;
        this.app.inventory.load();
        this.saveDatas();
    }

    if (this.wall.enabled && this.hitPressed()){
        if (!this.app.gameManager.isInGame) {
            this.app.fire("WarningTextController:setWarning", "This item only useable during game.", null, new pc.Color(1, 0.51, 0.03, 11));
            this.app.gameManager.sfx_warning();
            return;
        }

        if (this.app.gameManager.currentPhase != "aim"){
            this.app.fire("WarningTextController:setWarning", "Wait for aiming phase to use this item", null, new pc.Color(1, 0.51, 0.03, 1));
            this.app.gameManager.sfx_warning();
            return;
        }

        let _pos = this.itemPlacePoint.getPosition().clone();
        this.networkManager.send("Client:PlaceItem", {
            itemId: KnockoutModeItems.Wall,
            x: _pos.x,
            y: _pos.y,
            z: _pos.z,
        });

        this.wall.has = false;
        this.app.inventory.load();
        this.saveDatas();
    }
};

KnockoutModePlayerItemManager.prototype.onConnected = function(){
    this.app.knockoutModeNetworkManager.send("Client:SetSkin", { skin: this.skins.current });
}

KnockoutModePlayerItemManager.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inTroll) return;
};

KnockoutModePlayerItemManager.prototype.toggleItem = function (itemId, toggle) {
    //console.log("toggleItem", itemId, toggle);
    switch (itemId) {
        case KnockoutModeItems.SpikeBall:
            this.spikeBall.entity.enabled = toggle;
            this.spikeBall.holo.enabled = toggle;
            this.spikeBall.enabled = toggle;
            this.actionTouchButton.enabled = toggle;
            break;

        case KnockoutModeItems.Slime:
            this.slime.entity.enabled = toggle;
            this.slime.holo.enabled = toggle;
            this.slime.enabled = toggle;
            this.actionTouchButton.enabled = toggle;
            this.actionTouchButton.enabled = toggle;
            break;

        case KnockoutModeItems.Bomb:
            this.bomb.entity.enabled = toggle;
            this.bomb.holo.enabled = toggle;
            this.bomb.enabled = toggle;
            this.actionTouchButton.enabled = toggle;
            break;

        case KnockoutModeItems.Wall:
            this.wall.entity.enabled = toggle;
            this.wall.holo.enabled = toggle;
            this.wall.enabled = toggle;
            this.actionTouchButton.enabled = toggle;
            break;
    }

    this.setActiveItemID(toggle ? itemId : -1);
}

KnockoutModePlayerItemManager.prototype.closeAll = function () {
    this.app.inventory.closeSlot();
}

KnockoutModePlayerItemManager.prototype.setValue = function (itemId, value) {
    switch (itemId) {

    }

    this.saveDatas();
    this.app.inventory.load();
}

KnockoutModePlayerItemManager.prototype.saveDatas = function () {
    KnockoutMode_Utils.setItem("KNOCKOUTMODE_SpikeBall", this.spikeBall.has ? "true" : "false");
    KnockoutMode_Utils.setItem("KNOCKOUTMODE_Slime", this.slime.has ? "true" : "false");
    KnockoutMode_Utils.setItem("KNOCKOUTMODE_Bomb", this.bomb.has ? "true" : "false");
    KnockoutMode_Utils.setItem("KNOCKOUTMODE_Wall", this.wall.has ? "true" : "false");
}

KnockoutModePlayerItemManager.prototype.canHit = function(){
    return this.app.knockoutModePlayerController.canHit;
}

KnockoutModePlayerItemManager.prototype.hitPressed = function(){
    return ((window.touchJoypad.buttons.wasPressed('actionButton') || this.app.mouse.wasPressed(pc.MOUSEBUTTON_LEFT)) && this.canHit());
}

KnockoutModePlayerItemManager.prototype.setActiveItemID = function(_itemID){
    if (this.networkManager.room){
        this.networkManager.room.send("Client:SetActiveItemID", {itemID: _itemID});
        this.activeItemId = _itemID;
        this.app.fire("ActiveItemIdChanged", _itemID);
    }
}

KnockoutModePlayerItemManager.prototype.onChangeSkin = function(_skin){
    if (_skin == this.skins.current){
        this.app.fire("WarningTextController:setWarning", "You are already using this skin.", null, new pc.Color(1, 0.51, 0.03, 1));
        this.app.gameManager.sfx_warning();
        return;
    }

    switch(_skin){
        case KnockoutModeItems.PenguinDefault:
            this.skins.current = KnockoutModeItems.PenguinDefault;
            this.app.fire("WarningTextController:setWarning", "Penguin" + " purchased successfully.", null, new pc.Color(0, 1, 0, 1));
            this.app.gameManager.sfx_purchase();
            break;

        case KnockoutModeItems.PenguinFemale:
            this.skins.current = KnockoutModeItems.PenguinFemale;
            this.app.fire("WarningTextController:setWarning", "Miss Pingu" + " purchased successfully.", null, new pc.Color(0, 1, 0, 1));
            this.app.gameManager.sfx_purchase();
            break;

        case KnockoutModeItems.PenguinBinted:
            this.skins.current = KnockoutModeItems.PenguinBinted;
            this.app.fire("WarningTextController:setWarning", "Binted" + " purchased successfully.", null, new pc.Color(0, 1, 0, 1));
            this.app.gameManager.sfx_purchase();
            break;

        case KnockoutModeItems.PenguinPimp:
            this.skins.current = KnockoutModeItems.PenguinPimp;
            this.app.fire("WarningTextController:setWarning", "Rich Pingu" + " purchased successfully.", null, new pc.Color(0, 1, 0, 1));
            this.app.gameManager.sfx_purchase();
            break;
    }
    this.app.knockoutModeNetworkManager.send("Client:SetSkin", { skin: this.skins.current });
    KnockoutMode_Utils.setItem("KNOCKOUTMODE_Skin", this.skins.current);
}

KnockoutModePlayerItemManager.prototype.isItemOwned = function(_itemID){
    switch(_itemID){
        case KnockoutModeItems.TestItem:
            return false;
    }
}


