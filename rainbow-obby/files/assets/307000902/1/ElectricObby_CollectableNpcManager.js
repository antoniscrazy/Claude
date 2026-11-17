var ElectricObbyCollectableNpcManager = pc.createScript('electricObbyCollectableNpcManager');

ElectricObbyCollectableNpcManager.attributes.add("npcs", { type: "entity", array: true });
ElectricObbyCollectableNpcManager.attributes.add("counterGroup", { type: "entity" });
ElectricObbyCollectableNpcManager.attributes.add("portal", { type: "entity" });
ElectricObbyCollectableNpcManager.attributes.add("portalTrigger", { type: "entity" });
ElectricObbyCollectableNpcManager.attributes.add("portalLight", { type: "entity" });
ElectricObbyCollectableNpcManager.attributes.add("neonMaterialName", { type: "string", default: "Neon_598499" });
ElectricObbyCollectableNpcManager.attributes.add("glowIntensity", { type: "number", default: 4 });
ElectricObbyCollectableNpcManager.attributes.add("lightIntensity", { type: "number", default: 3 });
ElectricObbyCollectableNpcManager.attributes.add("doorLeft", { type: "entity" });
ElectricObbyCollectableNpcManager.attributes.add("doorRight", { type: "entity" });
ElectricObbyCollectableNpcManager.attributes.add("doorLeftClosedRotation", { type: "vec3", default: [0, 0, 0] });
ElectricObbyCollectableNpcManager.attributes.add("doorRightClosedRotation", { type: "vec3", default: [180, 180, 180] });
ElectricObbyCollectableNpcManager.attributes.add("doorOpenAngle", { type: "number", default: 115 });
ElectricObbyCollectableNpcManager.attributes.add("doorOpenDuration", { type: "number", default: 1.5 });
ElectricObbyCollectableNpcManager.attributes.add("rewardItemId", { type: "number", default: 0 });
ElectricObbyCollectableNpcManager.attributes.add("checkpointIndex", { type: "number", default: 6 });
ElectricObbyCollectableNpcManager.attributes.add("collectRadius", { type: "number", default: 1.5 });
ElectricObbyCollectableNpcManager.attributes.add("introTutorialId", { type: "string", default: "FigureMission" });
ElectricObbyCollectableNpcManager.attributes.add("collectedTutorialId", { type: "string", default: "FiguresCollected" });
ElectricObbyCollectableNpcManager.attributes.add("finishDialogueId", { type: "string", default: "GameFinished" });

ElectricObbyCollectableNpcManager.prototype.initialize = function () {
    this.player = this.app.root.findByName("Player");
    this.counterText = this.counterGroup.findByName("CollectableCounterUiText");
    this.lobbySpawnPoint = this.app.root.findByName("LobbySpawnPoint");
    this.database = this.app.root.findByName("ItemDatabase").script.electricObbyItemDatabase;

    this.collected = [];
    for (let i = 0; i < this.npcs.length; i++) {
        this.collected.push(ElectricObby_Utils.getItem(this.getSaveKey(i)) === "1");
    }

    this.isActive = false;
    this.isPortalOpen = false;
    this.neonMaterials = null;
    this.glowTime = 0;
    this.glow = { value: 0 };

    this.portalTrigger.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            this.enterPortal();
        }
    }, this);

    this.app.on("checkpointChanged", this.onCheckpointChanged, this);

    this.on('destroy', function () {
        this.app.off("checkpointChanged", this.onCheckpointChanged, this);
    }, this);

    this.refresh();
};

ElectricObbyCollectableNpcManager.prototype.onCheckpointChanged = function (checkpoint) {
    if (checkpoint === this.checkpointIndex) {
        this.app.fire("tutorialManager:start", this.introTutorialId);
    }

    this.refresh();
};

ElectricObbyCollectableNpcManager.prototype.getSaveKey = function (index) {
    return "ElectricObby_CollectableNpc_" + index;
};

ElectricObbyCollectableNpcManager.prototype.getSavedCheckpoint = function () {
    let saved = Number.parseInt(ElectricObby_Utils.getItem("ElectricObby_Checkpoint"));
    return isNaN(saved) ? -1 : saved;
};

ElectricObbyCollectableNpcManager.prototype.getCollectedCount = function () {
    let count = 0;
    for (let i = 0; i < this.collected.length; i++) {
        if (this.collected[i]) { count++; }
    }
    return count;
};

ElectricObbyCollectableNpcManager.prototype.isAllCollected = function () {
    return this.getCollectedCount() >= this.npcs.length;
};

ElectricObbyCollectableNpcManager.prototype.refresh = function () {
    this.isActive = this.getSavedCheckpoint() >= this.checkpointIndex;

    for (let i = 0; i < this.npcs.length; i++) {
        this.npcs[i].enabled = this.isActive && !this.collected[i];
    }

    this.counterGroup.enabled = this.isActive;
    this.updateCounter();

    this.isPortalOpen = this.isActive && this.isAllCollected();
    this.portalTrigger.enabled = this.isPortalOpen;
    this.portalLight.enabled = this.isPortalOpen;
    this.glow.value = this.isPortalOpen ? 1 : 0;
    this.setDoorAngle(this.isPortalOpen ? this.doorOpenAngle : 0);
    this.updateGlow();
};

ElectricObbyCollectableNpcManager.prototype.updateCounter = function () {
    this.counterText.element.text = ElectricObbyText("collectCounter", { collected: this.getCollectedCount(), total: this.npcs.length });
};

ElectricObbyCollectableNpcManager.prototype.update = function (dt) {
    if (this.isPortalOpen) {
        this.glowTime += dt;
        this.updateGlow();
    }

    if (!this.isActive || !this.player) { return; }

    const playerPosition = this.player.getPosition();

    for (let i = 0; i < this.npcs.length; i++) {
        if (this.collected[i]) { continue; }

        if (this.npcs[i].getPosition().distance(playerPosition) <= this.collectRadius) {
            this.collect(i);
        }
    }
};

ElectricObbyCollectableNpcManager.prototype.collect = function (index) {
    const npc = this.npcs[index];

    this.collected[index] = true;
    ElectricObby_Utils.setItem(this.getSaveKey(index), "1");

    ElectricObby_Track.send("branded_interaction", "collectable_npc_" + (index + 1), "collected");

    this.player.sound.play("collectCoin");
    this.updateCounter();

    this.counterGroup.setLocalScale(1.2, 1.2, 1.2);
    this.counterGroup.tween(this.counterGroup.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.25, pc.BackOut).start();

    npc.tween(npc.getLocalScale())
        .to(new pc.Vec3(0, 0, 0), 0.2, pc.SineIn)
        .onComplete(() => {
            npc.enabled = false;
            npc.setLocalScale(1, 1, 1);
        })
        .start();

    if (this.isAllCollected()) {
        this.openPortal();
        return;
    }

    this.app.fire("WarningTextController:setWarning",
        ElectricObbyText("collectProgress", { remaining: this.npcs.length - this.getCollectedCount(), total: this.npcs.length }),
        null,
        new pc.Color(1, 1, 1, 1));
};

ElectricObbyCollectableNpcManager.prototype.setDoorAngle = function (angle) {
    const left = this.doorLeftClosedRotation;
    const right = this.doorRightClosedRotation;

    this.doorLeft.setLocalEulerAngles(left.x, left.y + angle, left.z);
    this.doorRight.setLocalEulerAngles(right.x, right.y + angle, right.z);
};

ElectricObbyCollectableNpcManager.prototype.getNeonMaterials = function () {
    if (this.neonMaterials) { return this.neonMaterials; }

    const meshInstances = this.portal.render ? this.portal.render.meshInstances : [];
    if (!meshInstances || meshInstances.length === 0) { return []; }

    this.neonMaterials = [];
    for (let i = 0; i < meshInstances.length; i++) {
        const material = meshInstances[i].material;
        if (material.name !== this.neonMaterialName) { continue; }

        const clone = material.clone();
        clone.baseEmissiveIntensity = material.emissiveIntensity;
        meshInstances[i].material = clone;
        this.neonMaterials.push(clone);
    }

    return this.neonMaterials;
};

ElectricObbyCollectableNpcManager.prototype.updateGlow = function () {
    const pulse = 0.85 + Math.sin(this.glowTime * 3) * 0.15;
    const materials = this.getNeonMaterials();

    for (let i = 0; i < materials.length; i++) {
        const base = materials[i].baseEmissiveIntensity;
        materials[i].emissiveIntensity = pc.math.lerp(base, this.glowIntensity * pulse, this.glow.value);
        materials[i].update();
    }

    this.portalLight.light.intensity = this.lightIntensity * pulse * this.glow.value;
};

ElectricObbyCollectableNpcManager.prototype.openPortal = function () {
    this.isPortalOpen = true;

    this.player.sound.play("prize");
    this.app.fire("tutorialManager:start", this.collectedTutorialId);

    this.portalTrigger.enabled = true;
    this.portalLight.enabled = true;
    this.glow.value = 0;

    this.door = { angle: 0 };
    this.entity.tween(this.door)
        .to({ angle: this.doorOpenAngle }, this.doorOpenDuration, pc.SineInOut)
        .onUpdate(() => {
            this.setDoorAngle(this.door.angle);
        })
        .start();

    this.entity.tween(this.glow)
        .to({ value: 1 }, this.doorOpenDuration, pc.SineInOut)
        .start();
};

ElectricObbyCollectableNpcManager.prototype.enterPortal = function () {
    if (!this.isPortalOpen) { return; }

    ElectricObby_Utils.setItem("ElectricObby_Completed", "1");
    ElectricObby_Track.send("branded_interaction", "iec_portal", "entered");
    ElectricObby_Track.send("minigame_completed", "electric_obby", "checkpoint_" + this.app.checkpoint);

    const room = this.app.electricObbyNetworkManager.room;
    let index = 0;
    if (room && room.state) {
        index = Math.max(0, Array.from(room.state.players.values()).findIndex(p => p.sessionId === room.sessionId));
    }

    const spawn = this.lobbySpawnPoint.children[index] || this.lobbySpawnPoint.children[0];
    this.app.electricObbyPlayerController.teleportToPosition(spawn.getPosition().clone());
    this.app.electricObbyPlayerController.faceSpawn(spawn);

    this.giveReward();

    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.app.fire("dialogueManager:start", this.finishDialogueId);
    }, 100);
};

ElectricObbyCollectableNpcManager.prototype.giveReward = function () {
    const item = this.database.items[this.rewardItemId];
    if (!item) { return; }

    this.app.fire("giveItem", this.rewardItemId);
    this.app.fire("WarningTextController:setWarning", ElectricObbyText("rewardReceived", { item: item.name }), null, new pc.Color(0, 1, 0, 1));
};
