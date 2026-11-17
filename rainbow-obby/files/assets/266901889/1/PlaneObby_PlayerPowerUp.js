var PlaneObbyPlayerPowerUp = pc.createScript('planeObbyPlayerPowerUp');

PlaneObbyPlayerPowerUp.attributes.add("uiJetpack", { type: "entity" });
PlaneObbyPlayerPowerUp.attributes.add("uiFlyingCarpet", { type: "entity" });
PlaneObbyPlayerPowerUp.attributes.add("uiTnt", { type: "entity" });

// initialize code called once per entity
PlaneObbyPlayerPowerUp.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;
    this.playerController = this.entity.script.planeObbyPlayerController;
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


    if (PlaneObby_Utils.getItem("PLANEOBBY_Jetpack")) {
        this.jetpack.fuel = PlaneObby_Utils.getItem("PLANEOBBY_Jetpack") * 1
        this.jetpack.text.element.text = Math.round(this.jetpack.fuel / this.jetpack.fuelMax * 100) + "%"
    }

    if (PlaneObby_Utils.getItem("PLANEOBBY_FlyingPlanepet")) {
        this.flyingCarpet.remaining = PlaneObby_Utils.getItem("PLANEOBBY_FlyingPlanepet") * 1
        this.flyingCarpet.text.element.text = Math.round(this.flyingCarpet.remaining) + "s";
    }

    if (PlaneObby_Utils.getItem("PLANEOBBY_TNT")) {
        this.tnt.amount = PlaneObby_Utils.getItem("PLANEOBBY_TNT") * 1
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
PlaneObbyPlayerPowerUp.prototype.update = function (dt) {
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
            PlaneObby_Utils.setItem("PLANEOBBY_Jetpack", this.jetpack.fuel);

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
        PlaneObby_Utils.setItem("PLANEOBBY_FlyingPlanepet", this.flyingCarpet.remaining);
        if (this.flyingCarpet.remaining <= 0) { this.app.inventory.load(); }
    }

    if (this.tnt.enabled && this.tnt.canUse && (this.app.mouse.isPressed(pc.MOUSEBUTTON_LEFT) || window.touchJoypad.buttons.wasPressed('tntButton'))) {
        this.tnt.canUse = false; setTimeout(() => { if (this.entity && !this.entity.script) return; this.tnt.canUse = true }, 2000);
        this.tnt.amount--;
        //console.log("tnt.amount", this.tnt.amount)
        this.tnt.text.element.text = this.tnt.amount;
        PlaneObby_Utils.setItem("PLANEOBBY_TNT", this.tnt.amount);
        if (this.tnt.amount <= 0) { this.app.inventory.load(); }

        let spawnPos = this.entity.findByName("SpawnPoint").getPosition();

        if (this.networkManager.room != null) {
            this.networkManager.room.send("Client:TNT", {
                position: spawnPos,
            })

            //console.log("tnt 1", spawnPos)
        } else {
            this.app.planeObbyPlaneManager.spawnTnt(null, spawnPos);
            console.log("tnt 2", spawnPos)
        }
    }
};

PlaneObbyPlayerPowerUp.prototype.onKeyDown = function (event) {
    let key = event.key;

    if (this.app.inPlane) return;
};

PlaneObbyPlayerPowerUp.prototype.toggleItem = function (itemId, toggle) {
    //console.log("toggleItem", itemId, toggle);
    switch (itemId) {
        case PlaneObbyItems.JETPACK:
            this.entity.findByName("Jetpack").enabled = toggle;
            this.jetpack.enabled = toggle;
            this.uiJetpack.enabled = toggle;
            //this.jetpack.particle.stop();
            if (this.networkManager.room) { this.networkManager.room.send("Client:JetpackHas", { has: toggle }); }
            break

        case PlaneObbyItems.FLYING_CARPET:
            this.entity.findByName("FlyingCarpet").enabled = toggle;
            this.flyingCarpet.enabled = toggle;
            this.uiFlyingCarpet.enabled = toggle;
            if (this.networkManager.room) { this.networkManager.room.send("Client:FlyingCarpetHas", { has: toggle }); }
            break

        case PlaneObbyItems.TNT:
            this.entity.findByName("TNT").enabled = toggle;
            this.tnt.enabled = toggle;
            this.uiTnt.enabled = toggle;
            if (this.networkManager.room) { this.networkManager.room.send("Client:TntHas", { has: toggle }); }
            this.app.root.findByName("tntButton").enabled = toggle;
            break
    }
}

PlaneObbyPlayerPowerUp.prototype.closeAll = function () {
    this.app.inventory.closeSlot();
}

PlaneObbyPlayerPowerUp.prototype.setValue = function (itemId, value) {
    switch (itemId) {
        case PlaneObbyItems.JETPACK:
            this.jetpack.fuel = value;
            this.jetpack.text.element.text = Math.round(this.jetpack.fuel / this.jetpack.fuelMax * 100) + "%";
            PlaneObby_Utils.setItem("PLANEOBBY_Jetpack", this.jetpack.fuel);
            break

        case PlaneObbyItems.FLYING_CARPET:
            this.flyingCarpet.remaining = value;
            this.flyingCarpet.text.element.text = Math.round(this.flyingCarpet.remaining) + "s";
            PlaneObby_Utils.setItem("PLANEOBBY_FlyingPlanepet", this.flyingCarpet.remaining);
            break

        case PlaneObbyItems.TNT:
            this.tnt.amount = value;
            this.tnt.text.element.text = this.tnt.amount;
            PlaneObby_Utils.setItem("PLANEOBBY_TNT", this.tnt.amount);
            break
    }

    this.saveDatas();
    this.app.inventory.load();
}

PlaneObbyPlayerPowerUp.prototype.saveDatas = function () {
    PlaneObby_Utils.setItem("PLANEOBBY_Jetpack", this.jetpack.fuel);
    PlaneObby_Utils.setItem("PLANEOBBY_FlyingPlanepet", this.flyingCarpet.remaining);
    PlaneObby_Utils.setItem("PLANEOBBY_TNT", this.tnt.amount);
}
