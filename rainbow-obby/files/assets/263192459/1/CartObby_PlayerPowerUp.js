var CartObbyPlayerPowerUp = pc.createScript('cartObbyPlayerPowerUp');

CartObbyPlayerPowerUp.attributes.add("uiJetpack", { type: "entity" });
CartObbyPlayerPowerUp.attributes.add("uiFlyingCarpet", { type: "entity" });
CartObbyPlayerPowerUp.attributes.add("uiTnt", { type: "entity" });

// initialize code called once per entity
CartObbyPlayerPowerUp.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;
    this.playerController = this.entity.script.cartObbyPlayerController;
    this.camera = this.app.root.findByName('Camera');
    this.app.playerPowerUp = this;

    this.jetpack = {
        enabled: false,
        fuel: 0,
        fuelMax: 15,
        text: this.uiJetpack.findByName("Text"),
        particle: this.entity.findByName("JetpackParticle").particlesystem,
        using: false,
        firstUseFrame: true,
    };

    this.flyingCarpet = {
        enabled: false,
        remaining: 0,
        remainingMax: 100,
        text: this.uiFlyingCarpet.findByName("Text"),
    };

    this.tnt = {
        enabled: false,
        amount: 0,
        amountMax: 3,
        text: this.uiTnt.findByName("Text"),
        canUse: true,
    };

    this.powerBlock = {
        has: false,
    }

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.on("ToggleItem", this.toggleItem, this);

    this.on('destroy', function () {
        this.app.off("ToggleItem", this.toggleItem, this);
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }, this);


    if (CartObby_Utils.getItem("CARTOBBY_Jetpack")) {
        this.jetpack.fuel = CartObby_Utils.getItem("CARTOBBY_Jetpack") * 1
        this.jetpack.text.element.text = Math.round(this.jetpack.fuel / this.jetpack.fuelMax * 100) + "%"
    }

    if (CartObby_Utils.getItem("CARTOBBY_FlyingCartpet")) {
        this.flyingCarpet.remaining = CartObby_Utils.getItem("CARTOBBY_FlyingCartpet") * 1
        this.flyingCarpet.text.element.text = Math.round(this.flyingCarpet.remaining) + "s";
    }

    if (CartObby_Utils.getItem("CARTOBBY_TNT")) {
        this.tnt.amount = CartObby_Utils.getItem("CARTOBBY_TNT") * 1
        this.tnt.text.element.text = this.tnt.amount;
    }

    this.app.inventory.load();


    { const handle = this.app.on("givePowerBlock", () => {
        console.log("givePowerBlock")
        this.powerBlock.has = true;
        this.entity.findByName("PowerBlock").enabled = true;
        if (this.networkManager.room) { this.networkManager.room.send("Client:PowerBlockHas", { has: true }); }
    }, this); this.on('destroy', () => handle.off()); }

    { const handle = this.app.on("removePowerBlock", () => {
        console.log("removePowerBlock")
        this.powerBlock.has = false;
        this.entity.findByName("PowerBlock").enabled = false;
        if (this.networkManager.room) { this.networkManager.room.send("Client:PowerBlockHas", { has: false }); }
    }); this.on('destroy', () => handle.off()); }
};

// update code called every frame
CartObbyPlayerPowerUp.prototype.update = function (dt) {
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
            CartObby_Utils.setItem("CARTOBBY_Jetpack", this.jetpack.fuel);

            //this.entity.rigidbody.applyImpulse(new pc.Vec3(0, 60 * dt, 0));

            let forward = this.camera.forward.clone();
            forward.y = 0;
            forward.normalize();

            let upImpulse = new pc.Vec3(0, 1000 * dt, 0);
            //this.entity.rigidbody.applyImpulse(upImpulse);
            let velocity = this.entity.rigidbody.linearVelocity.clone();
            this.entity.rigidbody.linearVelocity = new pc.Vec3(velocity.x, 9.8 + 10, velocity.z);
            this.jetpack.particle.play();
            if (this.networkManager.room) { this.networkManager.room.send("Client:JetpackUsing", { using: true }); }
        } else {
            this.jetpack.particle.stop();
            this.jetpack.using = false;
            if (this.networkManager.room) { this.networkManager.room.send("Client:JetpackUsing", { using: false }); }
        }
    }

    if (this.flyingCarpet.enabled) {
        this.flyingCarpet.remaining -= dt;
        //console.log("carpet.remaining", this.flyingCarpet.remaining)
        this.flyingCarpet.text.element.text = Math.round(this.flyingCarpet.remaining) + "s";
        CartObby_Utils.setItem("CARTOBBY_FlyingCartpet", this.flyingCarpet.remaining);
        if (this.flyingCarpet.remaining <= 0) { this.app.inventory.load(); }
    }

    if (this.tnt.enabled && this.tnt.canUse && (this.app.mouse.isPressed(pc.MOUSEBUTTON_LEFT) || window.touchJoypad.buttons.wasPressed('tntButton'))) {
        this.tnt.canUse = false; setTimeout(() => { if (this.entity && !this.entity.script) return; this.tnt.canUse = true }, 2000);
        this.tnt.amount--;
        //console.log("tnt.amount", this.tnt.amount)
        this.tnt.text.element.text = this.tnt.amount;
        CartObby_Utils.setItem("CARTOBBY_TNT", this.tnt.amount);
        if (this.tnt.amount <= 0) { this.app.inventory.load(); }

        let spawnPos = this.entity.findByName("SpawnPoint").getPosition();

        if (this.networkManager.room != null) {
            this.networkManager.room.send("Client:TNT", {
                position: spawnPos,
            })
        } else {
            this.app.cartObbyCartManager.spawnTnt(null, spawnPos);
        }
    }
};

CartObbyPlayerPowerUp.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inCart) return;
};

CartObbyPlayerPowerUp.prototype.toggleItem = function (itemId, toggle) {
    //console.log("toggleItem", itemId, toggle);
    switch (itemId) {
        case CartObbyItems.JETPACK:
            this.entity.findByName("Jetpack").enabled = toggle;
            this.jetpack.enabled = toggle;
            this.uiJetpack.enabled = toggle;
            //this.jetpack.particle.stop();
            if (this.networkManager.room) { this.networkManager.room.send("Client:JetpackHas", { has: toggle }); }
            break

        case CartObbyItems.FLYING_CARPET:
            this.entity.findByName("FlyingCarpet").enabled = toggle;
            this.flyingCarpet.enabled = toggle;
            this.uiFlyingCarpet.enabled = toggle;
            if (this.networkManager.room) { this.networkManager.room.send("Client:FlyingCarpetHas", { has: toggle }); }
            break

        case CartObbyItems.TNT:
            this.entity.findByName("TNT").enabled = toggle;
            this.tnt.enabled = toggle;
            this.uiTnt.enabled = toggle;
            if (this.networkManager.room) { this.networkManager.room.send("Client:TntHas", { has: toggle }); }
            this.app.root.findByName("tntButton").enabled = toggle;
            break
    }
}

CartObbyPlayerPowerUp.prototype.closeAll = function () {
    this.app.inventory.closeSlot();
}

CartObbyPlayerPowerUp.prototype.setValue = function (itemId, value) {
    switch (itemId) {
        case CartObbyItems.JETPACK:
            this.jetpack.fuel = value;
            this.jetpack.text.element.text = Math.round(this.jetpack.fuel / this.jetpack.fuelMax * 100) + "%";
            CartObby_Utils.setItem("CARTOBBY_Jetpack", this.jetpack.fuel);
            break

        case CartObbyItems.FLYING_CARPET:
            this.flyingCarpet.remaining = value;
            this.flyingCarpet.text.element.text = Math.round(this.flyingCarpet.remaining) + "s";
            CartObby_Utils.setItem("CARTOBBY_FlyingCartpet", this.flyingCarpet.remaining);
            break

        case CartObbyItems.TNT:
            this.tnt.amount = value;
            this.tnt.text.element.text = this.tnt.amount;
            CartObby_Utils.setItem("CARTOBBY_TNT", this.tnt.amount);
            break
    }

    this.saveDatas();
    this.app.inventory.load();
}

CartObbyPlayerPowerUp.prototype.saveDatas = function () {
    CartObby_Utils.setItem("CARTOBBY_Jetpack", this.jetpack.fuel);
    CartObby_Utils.setItem("CARTOBBY_FlyingCartpet", this.flyingCarpet.remaining);
    CartObby_Utils.setItem("CARTOBBY_TNT", this.tnt.amount);
}
