var PvpModeAuraManager = pc.createScript('pvpModeAuraManager');

PvpModeAuraManager.attributes.add("sigmaScreen", { type: "entity" });
PvpModeAuraManager.attributes.add("sigmaImage", { type: "entity" });
PvpModeAuraManager.attributes.add("sigmaText", { type: "entity" });

// initialize code called once per entity
PvpModeAuraManager.prototype.initialize = function () {
    this.editDelay = 0.25;
    this.editDuration = 3;

    this.app.aura = 0;
    this.app.auraManager = this;
    this.app.isEdit = false;
    this.lastAttacker = null;

    this.app.on("Connected", this.onConnected, this);

    this.entity.on("destroy", () => {
        this.app.off("Connected");
    }, this)

    this._editTimers = [];

    // Leaving the scene during the 3 s screen: cleanupEdit will not run, isEdit is read by other modes' cameras
    this.on("destroy", () => {
        this._editTimers.forEach((id) => clearTimeout(id));
        this._editTimers.length = 0;
        this.app.isEdit = false;
    });

    this.faceScale = 1;
};

PvpModeAuraManager.prototype.update = function () {
    this.faceScale = pc.math.lerp(this.faceScale, 1, .3);
    this.sigmaImage.setLocalScale(this.faceScale, this.faceScale, this.faceScale);
}

PvpModeAuraManager.prototype.setAura = function (newAura) {
    this.app.aura = newAura;
    PvpMode_Utils.setItem("PVPMODE_Aura", newAura);
}

PvpModeAuraManager.prototype.reset = function () {
    if (!this.app.pvpModeNetworkManager.room) return;
    this.app.pvpModeNetworkManager.room.send("Client:SetAura", { aura: 0 });
}

PvpModeAuraManager.prototype.onConnected = function () {
    if (!this.app.pvpModeNetworkManager.room) return;

    if (PvpMode_Utils.getItem("PVPMODE_Aura")) {
        this.app.pvpModeNetworkManager.room.send("Client:SetAura", { aura: PvpMode_Utils.getItem("PVPMODE_Aura") * 1 });
    } else {
        PvpMode_Utils.setItem("PVPMODE_Aura", 0);
        this.app.pvpModeNetworkManager.room.send("Client:SetAura", { aura: 0 });
    };
}

PvpModeAuraManager.prototype.edit = function (target, isAttacker, isRevenge) {
    this.app.isEdit = true;

    if (this.app.pvpModeNetworkManager.room) {
        this.app.pvpModeNetworkManager.room.send("Client:SetFrozen", { isFrozen: true });
    }

    this.sigmaScreen.enabled = true;
    this.editSFX();
    this.toggleCameraFilters(true);

    this.app.root.findByName("InventorySlots").enabled = false;

    if (isRevenge) {
        this.sigmaText.element.text = "REVENGE";
    } else if (target?.type === "bee") {
        this.sigmaText.element.text = isAttacker ? "BEE UNALIVER" : "NOOB";
    } else {
        this.sigmaText.element.text = isAttacker ? `Sigma. (+1 Aura)` : "Noob."; 
    }

    if (target?.type === "player") {
        let otherController = this.app.pvpModeNetworkManager.playerEntities[target.id]?.script.pvpModeOtherPlayerController;

        if (isAttacker) {
            //this.app.pvpModePlayerController.faceAttacker.enabled = true;
            //otherController.faceTarget.enabled = true;

            this.app.pvpModeNetworkManager.send("Client:SetFace", {attacker:true, target: false});
        } else {
            ///this.app.pvpModePlayerController.faceTarget.enabled = true;
            //otherController.faceAttacker.enabled = true;

            this.app.pvpModeNetworkManager.send("Client:SetFace", {attacker:false, target: true});
        }
    }

    if (target?.type === "bee") {
        let bee = this.app.bees[target.id];
        if (isAttacker) {
            //this.app.pvpModePlayerController.faceAttacker.enabled = true;
            bee.setTrollFace("target");
        } else {
            //this.app.pvpModePlayerController.faceTarget.enabled = true;
            bee.setTrollFace("attacker");
        }
    }

    this.faceScaleAnimate();

    const editTimer = setTimeout(() => { if (this.entity && !this.entity.script) return;
        this._editTimers.splice(this._editTimers.indexOf(editTimer), 1);
        this.cleanupEdit(target);
    }, this.editDuration * 1000);
    this._editTimers.push(editTimer);
}

PvpModeAuraManager.prototype.cleanupEdit = function (target) {
    this.sigmaScreen.enabled = false;

    if (this.app.pvpModeNetworkManager.room) {
        this.app.pvpModeNetworkManager.room.send("Client:SetFrozen", { isFrozen: false });
        this.app.pvpModeNetworkManager.room.send("Client:Attackable", { attackable: true });
    }

    this.app.isEdit = false;
    this.entity.sound.stop();
    this.toggleCameraFilters(false);
    this.app.root.findByName("InventorySlots").enabled = true;

    //this.app.pvpModePlayerController.faceTarget.enabled = false;
    //this.app.pvpModePlayerController.faceAttacker.enabled = false;
    this.app.pvpModeNetworkManager.send("Client:SetFace", {attacker:false, target: false});

    if (target?.type === "player") {
        let other = this.app.pvpModeNetworkManager.playerEntities[target.id]?.script.pvpModeOtherPlayerController;

        if (other) {
            //other.faceAttacker.enabled = false;
            //other.faceTarget.enabled = false;
        }
    }

/*     if (target?.type === "bee") {
        let bee = this.app.bees[target.id];

        if (bee) {
            bee.setTrollFace(null);
        }
    } */
}

PvpModeAuraManager.prototype.slapSFX = function () {
    this.entity.sound.play("slap");
}

PvpModeAuraManager.prototype.editSFX = function () {
    let rand = Math.floor(Math.random() * 5);
    this.entity.sound.play("sigma" + rand);
}

PvpModeAuraManager.prototype.toggleCameraFilters = function (toggle) {
    this.app.root.findByName("Camera").script.brightnessContrast.enabled = toggle;
    this.app.root.findByName("Camera").script.hueSaturation.enabled = toggle;
}

PvpModeAuraManager.prototype.faceScaleAnimate = function () {
    this.faceScale = 1.2;

    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.2; }, 200);
    //setTimeout(()=>{this.faceScale = 1.2;}, 300);
    //setTimeout(()=>{this.faceScale = 1.2;}, 500);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.3; }, 550);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.2; }, 700);
    //setTimeout(()=>{this.faceScale = 1.2;}, 850);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.3; }, 900);
    //setTimeout(()=>{this.faceScale = 1.2;}, 1100);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.2; }, 1250);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.2; }, 1300);
    //setTimeout(()=>{this.faceScale = 1.2;}, 1400);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.3; }, 1550);
    //setTimeout(()=>{this.faceScale = 1.2;}, 1700);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.2; }, 1750);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.2; }, 1800);
    //setTimeout(()=>{this.faceScale = 1.2;}, 2000);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.3; }, 2100);
    //setTimeout(()=>{this.faceScale = 1.2;}, 2250);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.2; }, 2500);
    //setTimeout(()=>{this.faceScale = 1.2;}, 2700);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.faceScale = 1.3; }, 2850);
}
