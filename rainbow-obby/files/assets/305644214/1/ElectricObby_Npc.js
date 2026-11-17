var ElectricObbyNpc = pc.createScript('electricObbyNpc');

ElectricObbyNpc.attributes.add("npcName", { type: "string", default: "" });
ElectricObbyNpc.attributes.add("dialogueId", { type: "string", default: "" });
ElectricObbyNpc.attributes.add("avatar", { type: "asset", assetType: "sprite" });
ElectricObbyNpc.attributes.add("triggerRadius", { type: "number", default: 4 });
ElectricObbyNpc.attributes.add("autoStart", { type: "boolean", default: true });
ElectricObbyNpc.attributes.add("repeatable", { type: "boolean", default: true });
ElectricObbyNpc.attributes.add("saveProgress", { type: "boolean", default: false });
ElectricObbyNpc.attributes.add("closeWhenPlayerLeaves", { type: "boolean", default: true });
ElectricObbyNpc.attributes.add("lookAtPlayer", { type: "boolean", default: true });
ElectricObbyNpc.attributes.add("turnSpeed", { type: "number", default: 8 });
ElectricObbyNpc.attributes.add("yawOffset", { type: "number", default: 0 });
ElectricObbyNpc.attributes.add("bodyPivot", { type: "entity" });
ElectricObbyNpc.attributes.add("indicator", { type: "entity" });

ElectricObbyNpc.prototype.initialize = function () {
    this.player = this.app.root.findByName("Player");
    this.pivot = this.bodyPivot || this.entity;

    this.isInRange = false;
    this.isTalking = false;
    this.talked = false;

    this.saveKey = "ElectricObby_Dialogue_" + this.dialogueId;
    if (this.saveProgress && ElectricObby_Utils.getItem(this.saveKey) === "1") {
        this.talked = true;
    }

    this._toPlayer = new pc.Vec3();
    this._currentRotation = new pc.Quat();
    this._targetRotation = new pc.Quat();

    this.updateIndicator();

    this.on('destroy', function () {
        if (this.isTalking) {
            this.app.fire("dialogueManager:close");
        }
    }, this);
};

ElectricObbyNpc.prototype.update = function (dt) {
    if (!this.player) { return; }

    const manager = this.app.electricObbyDialogueManager;
    if (!manager) { return; }

    const distance = this.getPlayerDistance();
    const inRange = distance <= this.triggerRadius;

    if (inRange && !this.isInRange) {
        this.onPlayerEnter(manager);
    } else if (!inRange && this.isInRange) {
        this.onPlayerLeave(manager);
    }

    this.isInRange = inRange;

    if (this.isTalking && !manager.isOpen) {
        this.isTalking = false;
        this.updateIndicator();
    }

    if (this.lookAtPlayer && inRange) {
        this.turnToPlayer(dt);
    }
};

ElectricObbyNpc.prototype.getPlayerDistance = function () {
    const a = this.entity.getPosition();
    const b = this.player.getPosition();
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dz * dz + dy * dy * 0.25);
};

ElectricObbyNpc.prototype.onPlayerEnter = function (manager) {
    if (!this.canTalk()) { return; }

    if (this.autoStart) {
        this.talk();
    } else {
        manager.showTalkPrompt(this);
    }
};

ElectricObbyNpc.prototype.onPlayerLeave = function (manager) {
    manager.hideTalkPrompt(this);

    if (this.isTalking && this.closeWhenPlayerLeaves) {
        manager.close();
    }
};

ElectricObbyNpc.prototype.canTalk = function () {
    if (this.dialogueId === "") { return false; }
    if (this.talked && !this.repeatable) { return false; }
    return true;
};

ElectricObbyNpc.prototype.talk = function () {
    if (!this.canTalk()) { return; }

    const manager = this.app.electricObbyDialogueManager;
    if (!manager) { return; }

    if (manager.startDialogue(this.dialogueId, this)) {
        this.isTalking = true;
        this.updateIndicator();
    }
};

ElectricObbyNpc.prototype.onDialogueFinished = function () {
    this.isTalking = false;
    this.talked = true;

    if (this.saveProgress) {
        ElectricObby_Utils.setItem(this.saveKey, "1");
    }

    this.updateIndicator();
};

ElectricObbyNpc.prototype.updateIndicator = function () {
    if (!this.indicator) { return; }
    this.indicator.enabled = this.canTalk() && !this.isTalking;
};

ElectricObbyNpc.prototype.turnToPlayer = function (dt) {
    const from = this.pivot.getPosition();
    const to = this.player.getPosition();

    this._toPlayer.set(to.x - from.x, 0, to.z - from.z);

    if (this._toPlayer.lengthSq() < 0.0001) { return; }

    const angle = Math.atan2(this._toPlayer.x, this._toPlayer.z) * pc.math.RAD_TO_DEG + this.yawOffset;

    this._targetRotation.setFromEulerAngles(0, angle, 0);
    this._currentRotation.copy(this.pivot.getRotation());
    this._currentRotation.slerp(this._currentRotation, this._targetRotation, Math.min(1, this.turnSpeed * dt));
    this.pivot.setRotation(this._currentRotation);
};
