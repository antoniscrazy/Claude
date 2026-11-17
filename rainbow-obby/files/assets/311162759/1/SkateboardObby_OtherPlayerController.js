var SkateboardObbyOtherPlayerController = pc.createScript('skateboardObbyOtherPlayerController');
SkateboardObbyOtherPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

SkateboardObbyOtherPlayerController.prototype.initialize = function () {
    this.body = this.entity.findByName("Body");
    this.anim = this.body.anim;
    this.animLayer = this.anim.baseLayer;
    if (typeof SkateboardObby_AnimFix !== "undefined") SkateboardObby_AnimFix.apply(this.anim);
    this.username = this.entity.findByName("Username");
    this.overHeadGroup = this.entity.findByName("OverHeadGroup");
    this.playerRendererEntity = this.body.findByName("Skin");
    this.database = this.app.root.findByName("ItemDatabase").script.skateboardObbyItemDatabase;
    this.vipLabel = this.entity.findByName("VipLabel");
    this.isVip = false;
    this.board = 0;
    this.networkManager = this.app.root.findByName("NetworkManager").script.skateboardObbyNetworkManager;
    this.entity.playerBody = this.entity.findByName("BodyPivot");

    this.isInGame = false;

    this.winCountText = this.entity.findByName("WinCountTextOnHead");
    this.winCounterGroup = this.entity.findByName("WinCounterGroup");
    if (this.winCounterGroup) this.winCounterGroup.enabled = false;

    this.sparks = this.entity.findByName("Sparks");   // boost effect, same entity as on the local player

    this.jetpack = {
        has: false,
        using: false,
        model: this.entity.findByName("Jetpack"),
        particle: this.entity.findByName("JetpackParticle") ? this.entity.findByName("JetpackParticle").particlesystem : null,
    };

    this.flyingCarpet = {
        has: false,
        model: this.entity.findByName("FlyingCarpet"),
    };

    // animation state derived from network data
    this.grounded = true;
    this.isPushing = false;
    this.speed = 0;
    this._lastPos = this.entity.getPosition().clone();
    this._forward = new pc.Vec3();   // reused in update
    this._animState = null;
    this._oneShotTimer = 0;
    this._wasGrounded = true;
    this._rideAnim = "";       // trick / grind from the server field "anim"
    this._rideAnimOk = false;
    this._rideState = "";      // anim state for _rideAnim ("Finisher_<n>" -> "Finisher")
};

SkateboardObbyOtherPlayerController.prototype.setActiveItem = function (newActiveItemID) {
    if (this.jetpack.model) this.jetpack.model.enabled = (newActiveItemID == SkateboardObbyItems.Jetpack);
    if (this.flyingCarpet.model) this.flyingCarpet.model.enabled = (newActiveItemID == SkateboardObbyItems.FlyingCarpet);
};

SkateboardObbyOtherPlayerController.prototype.setActiveHandItem = function (newHandItem) {

};

SkateboardObbyOtherPlayerController.prototype.applyPowerUpChanges = function () {
    if (!this.jetpack.particle) return;
    if (this.jetpack.using) { this.jetpack.particle.play(); }
    else { this.jetpack.particle.stop(); }
};

SkateboardObbyOtherPlayerController.prototype.died = function () {
    // hidden (closed chunk): nobody sees the shatter
    if (!this.entity.enabled) {
        this.playerRendererEntity.enabled = false;
        this.overHeadGroup.enabled = false;
        return;
    }
    try {
        // same shatter as the local player: own mesh, own texture, where it is
        this.entity.spawnedDeadBody = SkateboardObby_Shatter.explode(this.app, this.playerRendererEntity, { force: 4 });
    } catch (e) {
        const deadPlayerEntity = this.deadPlayer.resource.instantiate();
        const playerPos = this.entity.getPosition().clone();
        this.app.root.addChild(deadPlayerEntity);
        deadPlayerEntity.setPosition(playerPos.x, playerPos.y, playerPos.z);
        deadPlayerEntity.setRotation(this.body.getRotation().clone());
        deadPlayerEntity.children[0].enabled = true;
        this.entity.spawnedDeadBody = deadPlayerEntity;
    }
    this.playerRendererEntity.enabled = false;
    this.overHeadGroup.enabled = false;
};

SkateboardObbyOtherPlayerController.prototype.respawn = function () {
    if (this.entity.spawnedDeadBody) {
        this.entity.spawnedDeadBody.destroy();
        this.entity.spawnedDeadBody = null;
    }

    this.playerRendererEntity.enabled = true;
    this.overHeadGroup.enabled = true;
};

// called by the network manager on every state change
SkateboardObbyOtherPlayerController.prototype.handleAnimations = function (player) {
    const grounded = player.grounded !== false;   // undefined until the player's first Client:Movement
    // a clip from the "anim" field wins ("Boost" is not a clip); nothing to jump from right after appearing
    const hasClip = player.anim && player.anim !== "Boost";
    if (!hasClip && (this._time || 0) > 0.5) {
        if (this._wasGrounded && !grounded) {
            this.playOneShot("JumpStart", 0.4);
        } else if (!this._wasGrounded && grounded) {
            this.playOneShot("JumpLand", 0.3);
        }
    }
    this._wasGrounded = grounded;
    this.grounded = grounded;
    this.isPushing = player.isWalking;
};

SkateboardObbyOtherPlayerController.prototype.setAnimState = function (state, blend = 0.2) {
    if (this._animState === state || !this.animLayer) return;
    this._animState = state;
    this.animLayer.transition(state, blend);
};

SkateboardObbyOtherPlayerController.prototype.playOneShot = function (state, duration) {
    this._oneShotTimer = duration;
    this._animState = null;
    this.setAnimState(state, 0.08);
};

SkateboardObbyOtherPlayerController.prototype.roll = function (state, force = null) { };

SkateboardObbyOtherPlayerController.prototype.setFrozen = function (isFrozen) {
    this.anim.enabled = !isFrozen;
};

SkateboardObbyOtherPlayerController.prototype.setTeam = function (newTeam) {
    this.team = newTeam;
    const red = this.entity.findByName("TeamRed");
    const blue = this.entity.findByName("TeamBlue");
    if (!red || !blue) return;
    red.enabled = newTeam == "red";
    blue.enabled = newTeam == "blue";
};

SkateboardObbyOtherPlayerController.prototype.setScale = function (_float) {
    this.entity.setLocalScale(new pc.Vec3(_float, _float, _float));
};

// skin / board ids: SkateboardObby_Cosmetics (0 default, 1 VIP, 2 BOSS VIP). Only called when the value changes.
SkateboardObbyOtherPlayerController.prototype.setSkin = function (_int) {
    SkateboardObby_Cosmetics.apply(this.app, this.database, this.entity, "skin", _int);
};

SkateboardObbyOtherPlayerController.prototype.setBoard = function (_int) {
    this.board = _int;
    SkateboardObby_Cosmetics.apply(this.app, this.database, this.entity, "board", _int);
    this.updateVipLabel();
};

// Like Monkey: [VIP] label + gold username. The server only sends isVip; the BOSS VIP board (2) shows [BOSS VIP].
SkateboardObbyOtherPlayerController.prototype.setVip = function (_isVip) {
    this.isVip = !!_isVip;
    this.updateVipLabel();
};

SkateboardObbyOtherPlayerController.prototype.updateVipLabel = function () {
    const _vip = this.app.vipManager;
    const _level = this.isVip ? (this.board === SkateboardObby_Cosmetics.BOSS_VIP ? 2 : 1) : 0;
    const _color = _vip ? _vip.getColor(Math.max(1, _level)) : new pc.Color(1, 0.8, 0, 1);
    if (this.vipLabel && this.vipLabel.element) {
        this.vipLabel.enabled = _level > 0;
        this.vipLabel.element.text = _level >= 2 ? "[BOSS VIP]" : "[VIP]";
        this.vipLabel.element.color = _color;
    }
    if (this.username && this.username.element) {
        this.username.element.color = _level > 0 ? _color : pc.Color.WHITE;
    }
};

SkateboardObbyOtherPlayerController.prototype.update = function (dt) {
    if (dt <= 0) return;
    this._time = (this._time || 0) + dt;
    if (this._time < 3 && typeof SkateboardObby_AnimFix !== "undefined") SkateboardObby_AnimFix.apply(this.anim);

    // speed from interpolated movement
    const pos = this.entity.getPosition();
    const dx = pos.x - this._lastPos.x;
    const dz = pos.z - this._lastPos.z;
    const instSpeed = Math.sqrt(dx * dx + dz * dz) / dt;
    // teleport / respawn / coming out of a hidden chunk is not speed
    if (instSpeed < 200) this.speed = pc.math.lerp(this.speed, instSpeed, Math.min(1, 6 * dt));
    this._lastPos.copy(pos);

    // turn rate from the (network interpolated) body heading -> Turn_L / Turn_R like the local player
    if (this.body) {
        const f = this.body.getWorldTransform().getZ(this._forward);
        const yaw = Math.atan2(f.x, f.z) * pc.math.RAD_TO_DEG;
        if (this._lastYaw != null) {
            let d = yaw - this._lastYaw;
            if (d > 180) d -= 360;
            if (d < -180) d += 360;
            this._turnRateSmooth = pc.math.lerp(this._turnRateSmooth || 0, d / dt, Math.min(1, 8 * dt));
        }
        this._lastYaw = yaw;
        const allowed = this.grounded && this.speed > 3;
        if (typeof SkateboardObby_TurnDir !== "undefined") {
            this._turnDir = SkateboardObby_TurnDir(this._turnDir || 0, this._turnRateSmooth || 0, 35, allowed);
        }
        // Carve blend strength, same scale as the local player (full Turn pose at 200 deg/s)
        const target = allowed ? pc.math.clamp((this._turnRateSmooth || 0) / 200, -1, 1) : 0;
        this._turnBlend = pc.math.lerp(this._turnBlend || 0, target, Math.min(1, 6 * dt));
        if (this.anim._parameters && this.anim._parameters.turn) this.anim.setFloat("turn", this._turnBlend);
    }
    const carve = typeof SkateboardObby_Carve !== "undefined" && SkateboardObby_Carve(this.anim);

    // trick / grind the player is playing (server field "anim", "" = normal riding; old servers have no field)
    const nd = this.entity.networkData;
    const rideAnim = (nd && nd.anim) || "";
    if (rideAnim !== this._rideAnim) {
        this._rideAnim = rideAnim;
        // "Boost" is not a clip: the player is boosting (kept through a trick, off with normal riding)
        if (this.sparks) {
            if (rideAnim === "Boost") this.sparks.enabled = true;
            else if (rideAnim === "") this.sparks.enabled = false;
        }
        // finish jump trick: "Finisher_<flight time in tenths>" = state Finisher stretched to that time
        const finisher = typeof SkateboardObby_Finisher !== "undefined" ? SkateboardObby_Finisher.netDuration(rideAnim) : 0;
        this._rideState = finisher > 0 ? SkateboardObby_Finisher.STATE : rideAnim;
        this._rideAnimOk = !!rideAnim && !!this.animLayer && this.animLayer.states.indexOf(this._rideState) >= 0;
        if (this._rideAnimOk && finisher > 0) {
            this._animState = null;   // restart the clip
            this.setAnimState(this._rideState, 0.2);
            SkateboardObby_Finisher.fit(this.animLayer, finisher);
        }
    }
    if (this._rideAnimOk) {
        this.setAnimState(this._rideState, rideAnim.indexOf("Trick") === 0 ? 0.08 : 0.2);
        return;
    }

    if (this._oneShotTimer > 0) {
        this._oneShotTimer -= dt;
        if (this._oneShotTimer > 0) return;
    }

    if (!this.grounded) {
        this.setAnimState("InAir");
    } else if (this.speed < 0.6 && !this.isPushing) {
        this.setAnimState("Idle", 0.25);
    } else if (this._turnDir !== 0) {
        this.setAnimState(carve ? "Carve" : (this._turnDir > 0 ? "Turn_L" : "Turn_R"));
    } else if (this.isPushing) {
        this.setAnimState("Push");
    } else {
        this.setAnimState(carve ? "Carve" : "Move");
    }
};
