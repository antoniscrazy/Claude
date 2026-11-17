var TrollObbyPlayerItemManager = pc.createScript('trollObbyPlayerItemManager');

TrollObbyPlayerItemManager.attributes.add("uiJetpack", { type: "entity" });
TrollObbyPlayerItemManager.attributes.add("uiFlyingCarpet", { type: "entity" });
TrollObbyPlayerItemManager.attributes.add("uiShield", { type: "entity" });
TrollObbyPlayerItemManager.attributes.add("uiTnt", { type: "entity" });

// initialize code called once per entity
TrollObbyPlayerItemManager.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.trollObbyNetworkManager;
    this.playerController = this.entity.script.trollObbyPlayerController;
    this.camera = this.app.root.findByName('Camera');
    this.app.playerItemManager = this;

    this.jetpack = {
        enabled: false,
        fuel: 0,
        fuelMax: 5,
        text: this.uiJetpack.findByName("Text"),
        particle: this.entity.findByName("JetpackParticle").particlesystem,
        using: false,
        firstUseFrame: true,
    };

    this.flyingCarpet = {
        enabled: false,
        remaining: 0,
        remainingMax: 60,
        text: this.uiFlyingCarpet.findByName("Text"),
    };

    this.shield = {
        enabled: false,
        remaining: 0,
        remainingMax: 60,
        text: this.uiShield.findByName("Text"),
    }

    this.slapHand = {
        owned: true,
        enabled: false,
        pushMultiplier: 1,
        cooldownMultiplier: 2,
        reachMultiplier: 1.4,
    }

    this.slapBalloon = {
        owned: false,
        enabled: false,
        pushMultiplier: 1.15,
        cooldownMultiplier: 1.4,
        reachMultiplier: 1.5,
    }

    this.slapBat = {
        owned: false,
        enabled: false,
        pushMultiplier: 1.25,
        cooldownMultiplier: 1,
        reachMultiplier: 1.6,
    }

    this.slapCandy = {
        owned: false,
        enabled: false,
        pushMultiplier: 1.5,
        cooldownMultiplier: .6,
        reachMultiplier: 1.7,
    }

    this.slapLollipop = {
        owned: false,
        enabled: false,
        pushMultiplier: 2,
        cooldownMultiplier: .4,
        reachMultiplier: 1.8,
    }

    this.slapTouchButton = this.app.root.findByName("slapButton");
    this.slapTouchButton.enabled = false;

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.on("ToggleItem", this.toggleItem, this);

    this.on('destroy', function () {
        this.app.off("ToggleItem", this.toggleItem, this);
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }, this);

    if (TrollObby_Utils.getItem("TROLLOBBY_Jetpack")) {
        this.jetpack.fuel = TrollObby_Utils.getItem("TROLLOBBY_Jetpack") * 1
        this.jetpack.text.element.text = Math.round(this.jetpack.fuel / this.jetpack.fuelMax * 100) + "%"
    }

    if (TrollObby_Utils.getItem("TROLLOBBY_FlyingCarpet")) {
        this.flyingCarpet.remaining = TrollObby_Utils.getItem("TROLLOBBY_FlyingCarpet") * 1
        this.flyingCarpet.text.element.text = Math.round(this.flyingCarpet.remaining) + "s";
    }

    if (TrollObby_Utils.getItem("TROLLOBBY_Shield")) {
        this.shield.remaining = TrollObby_Utils.getItem("TROLLOBBY_Shield") * 1
        this.shield.text.element.text = Math.round(this.shield.remaining) + "s";
    }

    if (TrollObby_Utils.getItem("TROLLOBBY_SlapBalloon")) {
        this.slapBalloon.owned = TrollObby_Utils.getItem("TROLLOBBY_SlapBalloon")==="true";
    }

    if (TrollObby_Utils.getItem("TROLLOBBY_SlapBat")) {
        this.slapBat.owned = TrollObby_Utils.getItem("TROLLOBBY_SlapBat")==="true";
    }

    if (TrollObby_Utils.getItem("TROLLOBBY_SlapCandy")) {
        this.slapCandy.owned = TrollObby_Utils.getItem("TROLLOBBY_SlapCandy")==="true";
    }

    if (TrollObby_Utils.getItem("TROLLOBBY_SlapLollipop")) {
        this.slapLollipop.owned = TrollObby_Utils.getItem("TROLLOBBY_SlapLollipop")==="true";
    }

    this.app.inventory.load();
};

// update code called every frame
TrollObbyPlayerItemManager.prototype.update = function (dt) {
    if (this.jetpack.enabled) {
        if (this.app.keyboard.wasPressed(pc.KEY_SPACE) || window.touchJoypad.buttons.wasPressed('jumpButton')) {
            this.entity.rigidbody.linearVelocity = new pc.Vec3();
            //console.log("sifirlandi")
        }
        if (this.app.keyboard.isPressed(pc.KEY_SPACE) || window.touchJoypad.buttons.isPressed('jumpButton')) {
            this.jetpack.fuel -= dt;
            if (this.jetpack.fuel <= 0) { this.app.inventory.load(); }
            //console.log("jetpack.fuel", this.jetpack.fuel)
            this.jetpack.text.element.text = Math.round(this.jetpack.fuel / this.jetpack.fuelMax * 100) + "%";
            TrollObby_Utils.setItem("TROLLOBBY_Jetpack", this.jetpack.fuel);

            //this.entity.rigidbody.applyImpulse(new pc.Vec3(0, 60 * dt, 0));

            let forward = this.camera.forward.clone();
            forward.y = 0;
            forward.normalize();

            let upImpulse = new pc.Vec3(0, 1000 * dt, 0);
            //this.entity.rigidbody.applyImpulse(upImpulse);
            let velocity = this.entity.rigidbody.linearVelocity.clone();
            this.entity.rigidbody.linearVelocity = new pc.Vec3(velocity.x, 9.8 + 10, velocity.z);
            this.jetpack.particle.play();
        } else {
            this.jetpack.particle.stop();
            this.jetpack.using = false;
        }
    }

    if (this.flyingCarpet.enabled) {
        this.flyingCarpet.remaining -= dt;
        //console.log("carpet.remaining", this.flyingCarpet.remaining)
        this.flyingCarpet.text.element.text = Math.round(this.flyingCarpet.remaining) + "s";
        TrollObby_Utils.setItem("TROLLOBBY_FlyingCarpet", this.flyingCarpet.remaining);
        if (this.flyingCarpet.remaining <= 0) { this.app.inventory.load(); }
    }

    if (this.shield.enabled) {
        this.shield.remaining -= dt;
        this.shield.text.element.text = Math.round(this.shield.remaining) + "s";
        TrollObby_Utils.setItem("TROLLOBBY_Shield", this.shield.remaining);
        if (this.shield.remaining <= 0) { this.app.inventory.load(); }
    }


    if (this.slapHand.enabled){
        if (this.hitPressed()) {
            this.app.trollObbyPlayerController.playSlapAnim();
            this.app.trollObbyPlayerController.checkPlayers(
                this.slapHand.reachMultiplier,
                this.slapHand.pushMultiplier,
                this.slapHand.cooldownMultiplier
            );
        }
    }

    if (this.slapBalloon.enabled){
        if (this.hitPressed()) {
            if (this.canHit()){
                this.app.trollObbyPlayerController.playSlapAnim();
                this.app.trollObbyPlayerController.checkPlayers(
                    this.slapBalloon.reachMultiplier,
                    this.slapBalloon.pushMultiplier,
                    this.slapBalloon.cooldownMultiplier
                );
            }
        }
    }

    if (this.slapBat.enabled){
        if (this.hitPressed()) {
            if (this.canHit()){
                this.app.trollObbyPlayerController.playSlapAnim();
                this.app.trollObbyPlayerController.checkPlayers(
                    this.slapBat.reachMultiplier,
                    this.slapBat.pushMultiplier,
                    this.slapBat.cooldownMultiplier
                );
            }
        }
    }

    if (this.slapCandy.enabled){
        if (this.hitPressed()) {
            if (this.canHit()){
                this.app.trollObbyPlayerController.playSlapAnim();
                this.app.trollObbyPlayerController.checkPlayers(
                    this.slapCandy.reachMultiplier,
                    this.slapCandy.pushMultiplier,
                    this.slapCandy.cooldownMultiplier
                );
            }
        }
    }

    if (this.slapLollipop.enabled){
        if (this.hitPressed()) {
            if (this.canHit()){
                this.app.trollObbyPlayerController.playSlapAnim();
                this.app.trollObbyPlayerController.checkPlayers(
                    this.slapLollipop.reachMultiplier,
                    this.slapLollipop.pushMultiplier,
                    this.slapLollipop.cooldownMultiplier
                );
            }
        }
    }
};

TrollObbyPlayerItemManager.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inTroll) return;
};

TrollObbyPlayerItemManager.prototype.toggleItem = function (itemId, toggle) {
    //console.log("toggleItem", itemId, toggle);
    switch (itemId) {
        case TrollObbyItems.SlapHand:
            this.entity.findByName("SlapHand").enabled = toggle;
            this.slapHand.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TrollObbyItems.SlapBalloon:
            this.entity.findByName("SlapBalloon").enabled = toggle;
            this.slapBalloon.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TrollObbyItems.SlapBat:
            this.entity.findByName("SlapBat").enabled = toggle;
            this.slapBat.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TrollObbyItems.SlapCandy:
            this.entity.findByName("SlapCandy").enabled = toggle;
            this.slapCandy.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TrollObbyItems.SlapLollipop:
            this.entity.findByName("SlapLollipop").enabled = toggle;
            this.slapLollipop.enabled = toggle;
            this.slapTouchButton.enabled = toggle;
            break;

        case TrollObbyItems.JETPACK:
            this.entity.findByName("Jetpack").enabled = toggle;
            this.jetpack.enabled = toggle;
            this.uiJetpack.enabled = toggle;
            this.slapTouchButton.enabled = false;
            break

        case TrollObbyItems.FLYING_CARPET:
            this.entity.findByName("FlyingCarpet").enabled = toggle;
            this.flyingCarpet.enabled = toggle;
            this.uiFlyingCarpet.enabled = toggle;
            this.slapTouchButton.enabled = false;
            break

        case TrollObbyItems.Shield:
            //this.entity.findByName("Shield").enabled = toggle;
            this.entity.findByName("ShieldAura").enabled = toggle;
            this.shield.enabled = toggle;
            this.uiShield.enabled = toggle;
            this.slapTouchButton.enabled = false;
            this.app.trollObbyNetworkManager.room.send("Client:Attackable", { attackable: !toggle });
            break
    }

    this.setActiveItemID(toggle ? itemId : -1);
}

TrollObbyPlayerItemManager.prototype.closeAll = function () {
    this.app.inventory.closeSlot();
}

TrollObbyPlayerItemManager.prototype.setValue = function (itemId, value) {
    switch (itemId) {
        case TrollObbyItems.JETPACK:
            this.jetpack.fuel = value;
            this.jetpack.text.element.text = Math.round(this.jetpack.fuel / this.jetpack.fuelMax * 100) + "%";
            TrollObby_Utils.setItem("TROLLOBBY_Jetpack", this.jetpack.fuel);
            break

        case TrollObbyItems.FLYING_CARPET:
            this.flyingCarpet.remaining = value;
            this.flyingCarpet.text.element.text = Math.round(this.flyingCarpet.remaining) + "s";
            TrollObby_Utils.setItem("TROLLOBBY_FlyingCarpet", this.flyingCarpet.remaining);
            break

        case TrollObbyItems.Shield:
            this.shield.remaining = value;
            this.shield.text.element.text = Math.round(this.shield.remaining) + "s";
            TrollObby_Utils.setItem("TROLLOBBY_Shield", this.shield.remaining);
            break
    }

    this.saveDatas();
    this.app.inventory.load();
}

TrollObbyPlayerItemManager.prototype.saveDatas = function () {
    TrollObby_Utils.setItem("TROLLOBBY_Jetpack", this.jetpack.fuel);
    TrollObby_Utils.setItem("TROLLOBBY_FlyingCarpet", this.flyingCarpet.remaining);
    TrollObby_Utils.setItem("TROLLOBBY_Shield", this.shield.remaining);
    TrollObby_Utils.setItem("TROLLOBBY_SlapBalloon", this.slapBalloon.owned);
    TrollObby_Utils.setItem("TROLLOBBY_SlapBat", this.slapBat.owned);
    TrollObby_Utils.setItem("TROLLOBBY_SlapCandy", this.slapCandy.owned);
    TrollObby_Utils.setItem("TROLLOBBY_SlapLollipop", this.slapLollipop.owned);
}

TrollObbyPlayerItemManager.prototype.canHit = function(){
    return this.app.trollObbyPlayerController.canHit && !this.app.isEdit;
}

TrollObbyPlayerItemManager.prototype.hitPressed = function(){
    return ((window.touchJoypad.buttons.wasPressed('slapButton') || this.app.mouse.wasPressed(pc.MOUSEBUTTON_LEFT)) && this.canHit());
}

TrollObbyPlayerItemManager.prototype.setActiveItemID = function(_itemID){
    if (this.networkManager.room){
        this.networkManager.room.send("Client:SetActiveItemID", {itemID: _itemID});
    }
}


TrollObbyPlayerItemManager.prototype.isItemOwned = function(_itemID){
    switch(_itemID){
        case TrollObbyItems.SlapHand:
            return this.slapHand.owned;

        case TrollObbyItems.SlapBalloon:
            return this.slapBalloon.owned;

        case TrollObbyItems.SlapBat:
            return this.slapBat.owned;

        case TrollObbyItems.SlapCandy:
            return this.slapCandy.owned;

        case TrollObbyItems.SlapLollipop:
            return this.slapLollipop.owned;

        case TrollObbyItems.JETPACK:
            return this.jetpack.fuel;

        case TrollObbyItems.FLYING_CARPET:
            return this.flyingCarpet.remaining;

        case TrollObbyItems.Shield:
            return this.shield.remaining;
    }
}


