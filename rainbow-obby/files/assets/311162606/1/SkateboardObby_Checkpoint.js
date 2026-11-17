/*
 * SkateboardObby_Checkpoint
 * One checkpoint gate. Template: GameModes/Skateboard/Templates/SkateboardObby_Checkpoint
 *   root   : this script + collision box (trigger, no rigidbody). Local +Z = riding direction.
 *   SpawnPoint : where the player respawns (PlayerController.teleportToSavedSpawn -> teleportBody)
 *   Flag/RootNode : flag model (SkateBoard_Obby_Checkpoint.fbx) with an anim component
 *
 * Flow (same as ElectricObby): touching a checkpoint whose index is higher than the saved one saves it
 * (NetworkManager.setCheckpoint -> app.checkpoint + localStorage "SkateboardObby_Checkpoint" ->
 * app event "checkpointChanged"). Going back to an earlier checkpoint never lowers the save.
 * Index = position among the children of the "Checkpoints" entity.
 *
 * Flag states (clips from the flag FBX):
 *   not taken : CP_Kirmizi_Idle (red flag waving)
 *   taken now : CP_Al (red flag sinks, green flag spins up) -> CP_Yesil_Idle
 *   taken     : CP_Yesil_Idle (green flag waving)
 * Checkpoints passed without touching them (save jumped past them, Skip) turn green without the clip.
 * Only the visible flag mesh is drawn (the hidden one is disabled), and the flag only animates when the
 * player is closer than animDistance.
 *
 * Optional: lightPillar (SkateboardObby_LightPillar entity). When set, the pillar is shown while this
 * checkpoint is the next one to take and hidden otherwise. Not used on any checkpoint yet.
 */
var SkateboardObbyCheckpoint = pc.createScript('skateboardObbyCheckpoint');

SkateboardObbyCheckpoint.attributes.add('flag', { type: 'entity', title: 'Flag Anim Root', description: 'Entity with the anim component (RootNode of the flag model)' });
SkateboardObbyCheckpoint.attributes.add('redIdleClip', { type: 'asset', assetType: 'animation', title: 'Red Idle Clip (not taken)' });
SkateboardObbyCheckpoint.attributes.add('takeClip', { type: 'asset', assetType: 'animation', title: 'Take Clip' });
SkateboardObbyCheckpoint.attributes.add('greenIdleClip', { type: 'asset', assetType: 'animation', title: 'Green Idle Clip (taken)' });
SkateboardObbyCheckpoint.attributes.add('spawnFacing', {
    type: 'string', default: 'next', title: 'Spawn Facing',
    description: 'next = the board faces the next checkpoint after a respawn (last checkpoint: SpawnPoint rotation). spawnPoint = always use the SpawnPoint rotation.',
    enum: [{ 'Next checkpoint': 'next' }, { 'SpawnPoint rotation': 'spawnPoint' }]
});
SkateboardObbyCheckpoint.attributes.add('animDistance', { type: 'number', default: 90, title: 'Animate Within (m)', description: 'The flag only animates when the player is closer than this. 0 = always.' });
SkateboardObbyCheckpoint.attributes.add('lightPillar', { type: 'entity', title: 'Light Pillar (optional)', description: 'SkateboardObby_LightPillar entity. Shown while this is the next checkpoint to take.' });

SkateboardObbyCheckpoint.TAKE_BLEND = 0.12;
SkateboardObbyCheckpoint.GREEN_BLEND = 0.2;

SkateboardObbyCheckpoint.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.skateboardObbyNetworkManager;
    this.checkpointIndex = this.entity.parent.children.indexOf(this.entity);
    this.spawnPoint = this.entity.findByName("SpawnPoint");
    this.completed = false;
    this._state = null;
    this._takeTimer = 0;
    this._animReady = false;

    this._redMesh = this.flag ? this.flag.findByName("PK_Checkpoint_Kirmizi") : null;
    this._greenMesh = this.flag ? this.flag.findByName("PK_Checkpoint_Yesil") : null;
    this._anim = this.flag ? this.flag.anim : null;

    this.completed = this.getSavedCheckpoint() >= this.checkpointIndex;
    this.setFlagState(this.completed ? "green" : "red", true);
    this.setupAnim();

    this.entity.collision.on('triggerenter', this.onTriggerEnter, this);
    this.app.on("resetStage", this.resetStage, this);
    this.app.on("checkpointChanged", this.onCheckpointChanged, this);

    this.on('destroy', function () {
        this.app.off("resetStage", this.resetStage, this);
        this.app.off("checkpointChanged", this.onCheckpointChanged, this);
        if (this.entity.collision) this.entity.collision.off('triggerenter', this.onTriggerEnter, this);
    }, this);
};

// all checkpoints exist now: aim the spawn point and set up the optional light pillar
SkateboardObbyCheckpoint.prototype.postInitialize = function () {
    this.getSpawnPoint();
    this.updateLightPillar(true);
};

// Used by PlayerController.getCheckpointSpawn. Can be called before this script's initialize (the player
// respawns in its own initialize, before the Checkpoints entities are initialized), so it does not rely
// on anything set in initialize.
SkateboardObbyCheckpoint.prototype.getSpawnPoint = function () {
    if (!this._spawnAimed) {
        this._spawnAimed = true;
        this.aimSpawnPoint();
    }
    return this.entity.findByName("SpawnPoint");
};

SkateboardObbyCheckpoint.prototype.getSavedCheckpoint = function () {
    let saved = Number.parseInt(SkateboardObby_Utils.getItem(this.networkManager.checkpointKey()));
    return isNaN(saved) ? -1 : saved;
};

SkateboardObbyCheckpoint.prototype.onTriggerEnter = function (otherEntity) {
    if (otherEntity.tags.has("Player") || otherEntity.tags.has("LocalCollider")) {
        this.complete();
    }
};

// touched by the local player
SkateboardObbyCheckpoint.prototype.complete = function (silent) {
    if (this.completed) return;
    if (this.app.isDied) return;

    if (silent !== true) {
        if (this.checkpointIndex > this.getSavedCheckpoint()) {
            this.app.fire("WarningTextController:setWarning", "Checkpoint reached!", null, new pc.Color(0, 1, 0, 1));
            const player = this.app.skateboardObbyPlayerController;
            if (player && player.entity.sound && player.entity.sound.slot("checkpoint")) {
                player.entity.sound.play("checkpoint");
            }
            // saves, fires checkpointChanged -> onCheckpointChanged plays the take clip
            this.networkManager.setCheckpoint(this.checkpointIndex);
            return;
        }
    }

    this.completed = true;
    this.setFlagState("green", true);
};

// app.checkpoint changed (touch, Skip, goToNextCheckpoint, reset)
SkateboardObbyCheckpoint.prototype.onCheckpointChanged = function (checkpoint) {
    const saved = (checkpoint == null || isNaN(checkpoint)) ? -1 : checkpoint;
    if (this.checkpointIndex <= saved) {
        if (!this.completed) {
            this.completed = true;
            // the checkpoint just saved plays the take clip, the ones passed over turn green directly
            this.setFlagState(this.checkpointIndex === saved ? "take" : "green", this.checkpointIndex !== saved);
        }
    } else if (this.completed) {
        this.completed = false;
        this.setFlagState("red", true);
    }
    this.updateLightPillar(false);
};

SkateboardObbyCheckpoint.prototype.resetStage = function () {
    this.completed = false;
    this.setFlagState("red", true);
    this.updateLightPillar(false);
};

// ---------------------------------------------------------------------------
// spawn direction
// ---------------------------------------------------------------------------

// The player controller faces the board along the SpawnPoint's yaw (getYaw: yaw 0 rides towards +Z,
// yaw -90 towards -X). With spawnFacing "next" the spawn point is turned towards the next checkpoint.
SkateboardObbyCheckpoint.prototype.aimSpawnPoint = function () {
    const spawn = this.entity.findByName("SpawnPoint");
    if (!spawn || this.spawnFacing !== "next") return;
    const index = this.entity.parent.children.indexOf(this.entity);
    const next = this.entity.parent.children[index + 1];
    if (!next || !next.script || !next.script.skateboardObbyCheckpoint) return;
    const nextSpawn = next.findByName("SpawnPoint") || next;
    const from = spawn.getPosition();
    const to = nextSpawn.getPosition();
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (dx * dx + dz * dz < 0.01) return;
    const yaw = Math.atan2(dx, dz) * pc.math.RAD_TO_DEG;
    spawn.setEulerAngles(0, yaw, 0);
};

// ---------------------------------------------------------------------------
// flag
// ---------------------------------------------------------------------------

SkateboardObbyCheckpoint.prototype.setupAnim = function () {
    if (!this._anim) return;
    const clips = [this.redIdleClip, this.takeClip, this.greenIdleClip];
    if (clips.some(a => !a)) { console.warn("[SkateboardObby] checkpoint " + this.checkpointIndex + ": flag clips missing"); return; }

    const tryBuild = () => {
        if (this._animReady || !this._anim) return;
        if (clips.some(a => !a.resource)) return;
        this._anim.loadStateGraph({
            layers: [{
                name: "Base",
                states: [
                    { name: "START" },
                    { name: "Red", speed: 1, loop: true },
                    { name: "Take", speed: 1, loop: false },
                    { name: "Green", speed: 1, loop: true },
                    { name: "END" }
                ],
                transitions: [
                    { from: "START", to: "Red", time: 0 },
                    { from: "Take", to: "Green", time: SkateboardObbyCheckpoint.GREEN_BLEND, exitTime: 1 }
                ]
            }],
            parameters: {}
        });
        this._anim.assignAnimation("Red", this.redIdleClip.resource, "Base");
        this._anim.assignAnimation("Take", this.takeClip.resource, "Base");
        this._anim.assignAnimation("Green", this.greenIdleClip.resource, "Base");
        this._takeDuration = this.takeClip.resource.duration || 1.67;
        this._animReady = true;
        // different start phase per checkpoint so the flags do not wave in sync
        this._anim.baseLayer.transition(this._state === "red" ? "Red" : "Green", 0, (this.checkpointIndex * 0.37) % 1);
        this._anim.playing = true;
    };

    clips.forEach(a => {
        if (!a.resource) {
            a.ready(tryBuild);
            this.app.assets.load(a);
        }
    });
    tryBuild();
};

// state: "red" | "take" | "green"
SkateboardObbyCheckpoint.prototype.setFlagState = function (state, instant) {
    this._state = state === "take" ? "green" : state;

    if (state === "take") {
        this._takeTimer = this._takeDuration || 1.67;
        if (this._redMesh) this._redMesh.enabled = true;
        if (this._greenMesh) this._greenMesh.enabled = true;
        if (this._animReady) {
            this._anim.playing = true;
            this._anim.baseLayer.transition("Take", SkateboardObbyCheckpoint.TAKE_BLEND);
        } else {
            this._takeTimer = 0;
            this.showOnly("green");
        }
        return;
    }

    this._takeTimer = 0;
    this.showOnly(state);
    if (this._animReady) {
        this._anim.baseLayer.transition(state === "red" ? "Red" : "Green", instant ? 0 : SkateboardObbyCheckpoint.GREEN_BLEND);
    }
};

SkateboardObbyCheckpoint.prototype.showOnly = function (state) {
    if (this._redMesh) this._redMesh.enabled = state === "red";
    if (this._greenMesh) this._greenMesh.enabled = state !== "red";
};

SkateboardObbyCheckpoint.prototype.update = function (dt) {
    if (this._takeTimer > 0) {
        this._takeTimer -= dt;
        if (this._takeTimer <= 0) {
            this._takeTimer = 0;
            this.showOnly(this._state);
        }
        return;
    }

    // only animate flags near the player
    if (this._animReady && this.animDistance > 0) {
        const player = this.app.skateboardObbyPlayerController;
        if (player) {
            const d = player.entity.getPosition().distance(this.entity.getPosition());
            const near = d < this.animDistance;
            if (near !== this._anim.playing) this._anim.playing = near;
        }
    }
};

// ---------------------------------------------------------------------------
// optional light pillar
// ---------------------------------------------------------------------------

SkateboardObbyCheckpoint.prototype.updateLightPillar = function (instant) {
    const pillar = this.lightPillar && this.lightPillar.script ? this.lightPillar.script.skateboardObbyLightPillar : null;
    if (!pillar) return;
    const saved = this.app.checkpoint == null || isNaN(this.app.checkpoint) ? -1 : this.app.checkpoint;
    pillar.setVisible(this.checkpointIndex === saved + 1, instant ? 0 : 0.5);
};
