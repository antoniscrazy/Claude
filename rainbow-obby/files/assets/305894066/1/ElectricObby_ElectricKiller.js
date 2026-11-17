var ElectricObbyElectricKiller = pc.createScript('electricObbyElectricKiller');

ElectricObbyElectricKiller.attributes.add("tags", { type: "string", array: true, default: ["Player"] });
ElectricObbyElectricKiller.attributes.add("shockDuration", { type: "number", default: 1 });
ElectricObbyElectricKiller.attributes.add("flashInterval", { type: "number", default: 0.05 });
ElectricObbyElectricKiller.attributes.add("flashColor", { type: "rgb", default: [0.35, 0.85, 1] });
ElectricObbyElectricKiller.attributes.add("shakeAmount", { type: "number", default: 0.03 });
ElectricObbyElectricKiller.attributes.add("lightIntensity", { type: "number", default: 6 });
ElectricObbyElectricKiller.attributes.add("lightRange", { type: "number", default: 6 });
ElectricObbyElectricKiller.attributes.add("reminderId", { type: "string", default: "SocketReminder" });

ElectricObbyElectricKiller.prototype.initialize = function () {
    this.isShocking = false;
    this.shockTimer = 0;
    this.flashTimer = 0;
    this.flashOn = false;
    this.playerController = null;
    this.playerBody = null;
    this.shockLight = null;
    this.originalMaterials = [];
    this.bodyBasePosition = new pc.Vec3();
    this.bodyBaseAngles = new pc.Vec3();

    this.flashMaterial = new pc.StandardMaterial();
    this.flashMaterial.diffuse.set(this.flashColor.r, this.flashColor.g, this.flashColor.b);
    this.flashMaterial.emissive.set(this.flashColor.r, this.flashColor.g, this.flashColor.b);
    this.flashMaterial.emissiveIntensity = 3;
    this.flashMaterial.useMetalness = false;
    this.flashMaterial.update();

    if (this.entity.collision) {
        this.entity.collision.on("triggerenter", this.onTriggerEnter, this);
        this.entity.collision.on("collisionstart", this.onCollisionStart, this);
    }

    this.app.on("Respawned", this.cancelShock, this);

    this.on("destroy", () => {
        this.cancelShock();
        this.app.off("Respawned", this.cancelShock, this);
        if (this.entity.collision) {
            this.entity.collision.off("triggerenter", this.onTriggerEnter, this);
            this.entity.collision.off("collisionstart", this.onCollisionStart, this);
        }
    }, this);
};

ElectricObbyElectricKiller.prototype.onTriggerEnter = function (otherEntity) {
    this.tryShock(otherEntity);
};

ElectricObbyElectricKiller.prototype.onCollisionStart = function (result) {
    this.tryShock(result.other);
};

ElectricObbyElectricKiller.prototype.hasAnyTag = function (otherEntity) {
    if (!otherEntity || !otherEntity.tags) return false;

    for (let i = 0; i < this.tags.length; i++) {
        if (otherEntity.tags.has(this.tags[i])) return true;
    }

    return false;
};

ElectricObbyElectricKiller.prototype.tryShock = function (otherEntity) {
    if (this.isShocking || this.app.electricShockActive) return;
    if (!this.hasAnyTag(otherEntity)) return;

    let controller = this.app.electricObbyPlayerController;
    if (!controller || !controller.body) return;
    if (controller.isDied || controller.canDie === false) return;

    this.startShock(controller);
};

ElectricObbyElectricKiller.prototype.startShock = function (controller) {
    this.playerController = controller;
    this.playerBody = controller.body;

    ElectricObby_Track.send("branded_interaction", "exposed_electricity", "shocked");

    this.isShocking = true;
    this.app.electricShockActive = true;
    this.setNetworkShocked(true);
    this.shockTimer = 0;
    this.flashTimer = 0;
    this.flashOn = false;

    this.app.inCutscene = true;
    controller.stop();
    controller.body.anim.speed = 0;

    this.bodyBasePosition.copy(this.playerBody.getLocalPosition());
    this.bodyBaseAngles.copy(this.playerBody.getLocalEulerAngles());

    this.originalMaterials = [];
    this.collectMaterials(this.playerBody.findComponents("render"));
    this.collectMaterials(this.playerBody.findComponents("model"));

    this.shockLight = new pc.Entity("ElectricShockLight");
    this.shockLight.addComponent("light", {
        type: "omni",
        color: new pc.Color(this.flashColor.r, this.flashColor.g, this.flashColor.b),
        intensity: this.lightIntensity,
        range: this.lightRange,
        castShadows: false
    });
    this.playerBody.addChild(this.shockLight);
    this.shockLight.setLocalPosition(0, 1, 0);
};

ElectricObbyElectricKiller.prototype.collectMaterials = function (components) {
    for (let i = 0; i < components.length; i++) {
        let meshInstances = components[i].meshInstances;
        if (!meshInstances) continue;

        for (let j = 0; j < meshInstances.length; j++) {
            this.originalMaterials.push({ meshInstance: meshInstances[j], material: meshInstances[j].material });
        }
    }
};

ElectricObbyElectricKiller.prototype.update = function (dt) {
    if (!this.isShocking) return;

    if (!this.playerController || this.playerController.isDied) {
        this.cancelShock();
        return;
    }

    this.shockTimer += dt;
    this.flashTimer += dt;

    if (this.flashTimer >= this.flashInterval) {
        this.flashTimer = 0;
        this.flashOn = !this.flashOn;
        this.applyFlash(this.flashOn);
    }

    let progress = pc.math.clamp(this.shockTimer / this.shockDuration, 0, 1);
    let jitter = this.shakeAmount * (0.35 + progress);

    this.playerBody.setLocalPosition(
        this.bodyBasePosition.x + pc.math.random(-jitter, jitter),
        this.bodyBasePosition.y + pc.math.random(-jitter, jitter),
        this.bodyBasePosition.z + pc.math.random(-jitter, jitter)
    );
    this.playerBody.setLocalEulerAngles(
        this.bodyBaseAngles.x + pc.math.random(-jitter, jitter) * 90,
        this.bodyBaseAngles.y + pc.math.random(-jitter, jitter) * 90,
        this.bodyBaseAngles.z + pc.math.random(-jitter, jitter) * 90
    );

    if (this.shockTimer >= this.shockDuration) {
        this.endShock();
    }
};

ElectricObbyElectricKiller.prototype.applyFlash = function (state) {
    for (let i = 0; i < this.originalMaterials.length; i++) {
        let entry = this.originalMaterials[i];
        entry.meshInstance.material = state ? this.flashMaterial : entry.material;
    }

    if (this.shockLight) {
        this.shockLight.light.intensity = state ? this.lightIntensity : 0;
    }
};

ElectricObbyElectricKiller.prototype.restore = function () {
    this.applyFlash(false);
    this.originalMaterials = [];

    if (this.shockLight) {
        this.shockLight.destroy();
        this.shockLight = null;
    }

    if (this.playerBody) {
        this.playerBody.setLocalPosition(this.bodyBasePosition);
        this.playerBody.setLocalEulerAngles(this.bodyBaseAngles);
        if (this.playerBody.anim) {
            this.playerBody.anim.speed = 1;
        }
    }

    this.isShocking = false;
    this.app.electricShockActive = false;
    this.setNetworkShocked(false);
    this.app.inCutscene = false;
    this.playerController = null;
    this.playerBody = null;
};

ElectricObbyElectricKiller.prototype.endShock = function () {
    this.restore();
    this.app.fire("tutorialManager:reminder", this.reminderId);
    this.app.fire("playerDie");
};

ElectricObbyElectricKiller.prototype.cancelShock = function () {
    if (!this.isShocking) return;
    this.restore();
};

ElectricObbyElectricKiller.prototype.setNetworkShocked = function (isShocked) {
    let networkManager = this.app.electricObbyNetworkManager;
    if (!networkManager || !networkManager.room || networkManager.room.connection.isOpen === false) return;

    networkManager.send("Client:SetIsShocked", { boolean: isShocked });
};
