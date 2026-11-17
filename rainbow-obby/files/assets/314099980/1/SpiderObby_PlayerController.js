var SpiderObbyPlayerController = pc.createScript('spiderObbyPlayerController');

SpiderObbyPlayerController.attributes.add("username", { type: "entity" });
SpiderObbyPlayerController.attributes.add("body", { type: "entity" });
SpiderObbyPlayerController.attributes.add("moveSpeed", { type: "number", default: 16, title: "Move Speed", description: "On the ground (m/s)." });
SpiderObbyPlayerController.attributes.add("climbSpeed", { type: "number", default: 20, title: "Climb Speed", description: "Holding a surface (m/s)." });
SpiderObbyPlayerController.attributes.add("acceleration", { type: "number", default: 14, title: "Acceleration", description: "How fast the speed follows the input (1/s; 14 = about 0.07 s)." });
SpiderObbyPlayerController.attributes.add("hoverHeight", { type: "number", default: 3, title: "Hover Height", description: "Body center above the ground (m). The body never touches a surface, the arms carry it." });
SpiderObbyPlayerController.attributes.add("groundSlack", { type: "number", default: 1, title: "Ground Slack", description: "Counts as standing up to hover height + this (m)." });
SpiderObbyPlayerController.attributes.add("hoverResponse", { type: "number", default: 9, title: "Hover Response", description: "Fixed gain of the hover (1/s). Stable at every frame rate; keep below 30." });
SpiderObbyPlayerController.attributes.add("hoverRiseSpeed", { type: "number", default: 14, title: "Hover Rise Speed" });
SpiderObbyPlayerController.attributes.add("settleSpeed", { type: "number", default: 12, title: "Settle Speed", description: "Sinking to a floor below when only floors are held (m/s)." });
SpiderObbyPlayerController.attributes.add("wallDetect", { type: "number", default: 2.4, title: "Wall Detect", description: "Pressing into a wall this close turns into climbing (m)." });
SpiderObbyPlayerController.attributes.add("wallHold", { type: "number", default: 1.6, title: "Wall Hold", description: "The body keeps this far from the wall it climbs (m)." });
SpiderObbyPlayerController.attributes.add("ceilingHold", { type: "number", default: 2.6, title: "Ceiling Hold", description: "The body hangs this far under a ceiling (m)." });
SpiderObbyPlayerController.attributes.add("liftPitch", { type: "number", default: 30, title: "Lift Pitch", description: "Looking up more than this (degrees) leaves the ground when a wall or ceiling is in the view." });
SpiderObbyPlayerController.attributes.add("jumpHeight", { type: "number", default: 16, title: "Jump Speed", description: "From the ground (m/s)." });
SpiderObbyPlayerController.attributes.add("pushOffSpeed", { type: "number", default: 14, title: "Push Off Speed", description: "Jump while holding: away from the surface (m/s)." });
SpiderObbyPlayerController.attributes.add("pushOffUp", { type: "number", default: 10, title: "Push Off Up", description: "Jump while holding: upward (m/s)." });
SpiderObbyPlayerController.attributes.add("pushOffCarry", { type: "number", default: 12, title: "Push Off Carry", description: "Jump while holding: along the input (m/s)." });
SpiderObbyPlayerController.attributes.add("regrabDelay", { type: "number", default: 0.45, title: "Regrab Delay", description: "Seconds after a ground jump before the arms grab again." });
SpiderObbyPlayerController.attributes.add("pushOffRegrab", { type: "number", default: 0.6, title: "Push Off Regrab", description: "Seconds after jumping off a surface before the arms grab again." });
SpiderObbyPlayerController.attributes.add("extraGravity", { type: "number", default: 30, title: "Extra Gravity", description: "On top of the world gravity while falling (m/s2)." });
SpiderObbyPlayerController.attributes.add("airControl", { type: "number", default: 3, title: "Air Control", description: "How fast the input steers while falling (1/s)." });
SpiderObbyPlayerController.attributes.add("maxFallSpeed", { type: "number", default: 60, title: "Max Fall Speed" });
SpiderObbyPlayerController.attributes.add("maxGrip", { type: "number", default: 240, title: "Max Grip", description: "Level 0 value; the level system sets this property." });
SpiderObbyPlayerController.attributes.add("gripDrain", { type: "number", default: 120, title: "Grip Drain", description: "Per second while holding off the ground." });
SpiderObbyPlayerController.attributes.add("gripRefill", { type: "number", default: 260, title: "Grip Refill", description: "Per second on solid ground." });
SpiderObbyPlayerController.attributes.add("rotateSpeed", { type: "number", default: 10, title: "Body Turn Speed", description: "1/s" });
SpiderObbyPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

SpiderObbyPlayerController.prototype.initialize = function () {

    this.app.spiderObbyPlayerController = this;

    this.isDied = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.spiderObbyNetworkManager;
    //this.inventoryController = this.entity.script.riverObbyPlayerInventoryController;
    this.playerRendererEntity = this.body.findByName("Skin");
    this.overHeadGroup = this.entity.findByName("OverHeadGroup");
    this.bodyRig = this.body.findByName("BodyRig");
    this.bodyRotation = new pc.Quat();
    this.bodyRigRotation = new pc.Quat();
    this.bodyRigDefaultRotation = new pc.Quat().setFromEulerAngles(90, 0, -90);
    this.upbodyLayer = this.body.anim.findAnimationLayer('UpBody');
    this.confettiParticle = this.entity.findByName("ConfettiParticle").particlesystem;
    //this.hats = this.body.findByName("hats");

    this.setCamera();

    this._vel = new pc.Vec3();
    this._write = new pc.Vec3();
    this._target = new pc.Vec3();
    this._dir = new pc.Vec3();
    this._flatForward = new pc.Vec3(0, 0, 1);
    this._flatRight = new pc.Vec3(1, 0, 0);
    this._rayFrom = new pc.Vec3();
    this._rayTo = new pc.Vec3();
    this._wallNormal = new pc.Vec3();
    this._holdNormal = new pc.Vec3();
    this._rayOptions = { filterTags: ["Ground", "CameraCollider"] };
    this._inX = 0;
    this._inY = 0;
    this._jumpHeld = false;
    this._airLock = 0;
    this._bodyYaw = 0;
    this._stepSoundTimer = 0;
    this.grounded = false;
    this.state = "air";
    this.raysThisFrame = 0;
    this.grip = this.maxGrip;
    this._gripEmpty = false;
    this._gripFull = true;
    this._animInAir = null;
    this._animComponent = this.body.anim;
    this.axis = this.entity.findByName("Camera Axis");
    this.sendPositionInterval = setInterval(this.sendPosition.bind(this), 100);
    // first spawn: no pointer lock request without a user click (the first click locks it)
    this._firstSpawn = true;
    this.respawn();
    this._firstSpawn = false;
    this.entityScale = 1;
    this.app.canJump = true;

    const rigidBody = this.entity.rigidbody.body;
    rigidBody.setCcdMotionThreshold(0.5);
    rigidBody.setCcdSweptSphereRadius(0.3);

    this.skin = SpiderObbyItems.SkinLego;
    this.skins = [];
    this.skins[SpiderObbyItems.SkinLego] = this.entity.findByName("SkinLego");
    this.skins[SpiderObbyItems.SkinBigShoe] = this.entity.findByName("SkinBigShoe");
    this.skins[SpiderObbyItems.SkinTurtle] = this.entity.findByName("SkinTurtle");
    this.skins[SpiderObbyItems.SkinEmolingo] = this.entity.findByName("SkinEmolingo");
    this.skins[SpiderObbyItems.SkinAxo] = this.entity.findByName("SkinAxo");
    this.skins[SpiderObbyItems.SkinHacker] = this.entity.findByName("SkinHacker");

    this.team = null;

    this.app.playerPush = {
        active: false,
        direction: new pc.Vec3(0, 0, 0),
        power: 5,
    }

    this.app.playerBounce = {
        power: 20,
        canBounce: true,
        velocity: null,
        curve: 0,

        bounce: (direction = new pc.Vec3(0, 1, 0), power = 1, curveTime = .5) => {
            if (this.app.playerBounce.canBounce == false) return;
            this.app.playerBounce.canBounce = false;
            setTimeout(() => { this.app.playerBounce.canBounce = true; }, 250);

            this.app.playerBounce.velocity = direction.clone().mulScalar(power * this.app.playerBounce.power);
            this.app.playerBounce.curve = curveTime;
        },
    }

    this.app.on("spider:step", this.onArmStep, this);
    this.app.on("lockCamera", this.lockCamera, this);
    this.app.on("playerDie", () => this.died(), this);

    this.app.on("resetGame", this.resetGame, this);
    this.app.on("teleportToCheckpoint", this.teleport, this);

    this.on('destroy', () => {
        clearInterval(this.sendPositionInterval);
        this.app.off("spider:step", this.onArmStep, this);
        this.app.off("lockCamera", this.lockCamera, this);
        this.app.off("loadSkin");
        this.app.off("resetGame");
        this.app.off("toggleItem");
        this.app.off("playerDie");
        this.app.off("teleportToCheckpoint");
        this.app.off("playerDamage");
    }, this);
};

SpiderObbyPlayerController.prototype.stopMovement = function () {
    const kb = this.app.keyboard;
    if (kb) {
        kb._keymap = {};
        kb._lastmap = {};
        kb._pressed = {};
        kb._released = {};
    }
    this._inX = this._inY = 0;
    this._jumpHeld = false;
    this._vel.set(0, 0, 0);
    this.entity.rigidbody.linearVelocity = this._vel;
    this._animComponent.setBoolean("walk", false);
};

SpiderObbyPlayerController.prototype.onArmStep = function () {
    if (this._stepSoundTimer > 0) return;
    this._stepSoundTimer = 0.14;
    this.entity.sound.play(Math.random() < 0.5 ? "footstep1" : "footstep2");
};

SpiderObbyPlayerController.prototype.refillGrip = function () {
    this.grip = this.maxGrip;
    this._gripFull = true;
    if (this._gripEmpty) {
        this._gripEmpty = false;
        this.app.fire("spider:gripRecovered");
    }
    if (this.arms) { this.arms.setHidden(false); this.arms.grabEnabled = true; this.arms.reset(); this.arms.gripRatio = 1; this.arms.redness = 0; this.arms.heat = 0; this.arms.tremor = 0; this.arms.batch.setTint(0); }
};

SpiderObbyPlayerController.prototype.castSurface = function (fromX, fromY, fromZ, toX, toY, toZ) {
    this.raysThisFrame++;
    this._rayFrom.set(fromX, fromY, fromZ);
    this._rayTo.set(toX, toY, toZ);
    return this.app.systems.rigidbody.raycastFirst(this._rayFrom, this._rayTo, this._rayOptions);
};

SpiderObbyPlayerController.prototype.readInput = function (canMove) {
    this._inX = 0;
    this._inY = 0;
    let jump = false;
    if (canMove) {
        if (this.app.isMobile) {
            const joystick = window.touchJoypad.sticks['joystick0'];
            this._inX = joystick.x || 0;
            this._inY = joystick.y || 0;
            jump = window.touchJoypad.buttons.isPressed('jumpButton');
        } else {
            const kb = this.app.keyboard;
            if (kb.isPressed(pc.KEY_W) || kb.isPressed(pc.KEY_UP)) this._inY += 1;
            if (kb.isPressed(pc.KEY_S) || kb.isPressed(pc.KEY_DOWN)) this._inY -= 1;
            if (kb.isPressed(pc.KEY_A) || kb.isPressed(pc.KEY_LEFT)) this._inX -= 1;
            if (kb.isPressed(pc.KEY_D) || kb.isPressed(pc.KEY_RIGHT)) this._inX += 1;
            jump = kb.isPressed(pc.KEY_SPACE);
        }
        const mag = Math.sqrt(this._inX * this._inX + this._inY * this._inY);
        if (mag > 1) { this._inX /= mag; this._inY /= mag; }
        if (mag > 0 || jump) this.sdkGamePlayStart();
    }
    const tap = !!this.swing && this.swing.consumeTap() && canMove;
    const pressed = (jump && !this._jumpHeld) || tap;
    this._jumpHeld = jump;
    return pressed;
};

// Velocity is the only thing written to the body: speeds and fixed gains, never "position error / dt".
// Physics steps at a fixed 1/60 s, so a frame can run zero or several steps (see the 144 Hz notes in CLAUDE.md).
SpiderObbyPlayerController.prototype.moveSpider = function (dt) {
    const arms = this.arms;
    const pos = this.entity.getPosition();
    const canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && !this.app.isPopupEnabled && !this.app.numpad.enabled && !this.app.inCutscene;
    const scale = this.entityScale;
    const hover = this.hoverHeight * scale;
    const physicsStep = this.app.systems.rigidbody.fixedTimeStep;
    const worldGravity = -this.app.systems.rigidbody.gravity.y;
    const jumpPressed = this.readInput(canMove);
    const inX = this._inX, inY = this._inY;
    const inMag = Math.sqrt(inX * inX + inY * inY);

    arms.strainRunning = canMove;
    this.raysThisFrame = 0;
    this._airLock = Math.max(0, this._airLock - dt);
    this._stepSoundTimer -= dt;
    const bounce = this.app.playerBounce;
    if (bounce.curve > 0) this._airLock = Math.max(this._airLock, 0.05);

    // the floor under the body
    const floorRange = arms.armReach + 1;
    const floorHit = this.castSurface(pos.x, pos.y, pos.z, pos.x, pos.y - floorRange, pos.z);
    const hasFloor = !!floorHit && floorHit.normal.y > 0.7;
    const floorDist = hasFloor ? pos.y - floorHit.point.y : Infinity;
    const onFloor = hasFloor && floorDist <= hover + this.groundSlack * scale;

    if (this._gripEmpty && onFloor) {
        this._gripEmpty = false;
        this.app.fire("spider:gripRecovered");
    }
    this.grounded = onFloor && this._airLock <= 0;
    arms.grabEnabled = this._airLock <= 0 && !this._gripEmpty;
    const attached = arms.attached && this._airLock <= 0;

    // camera directions
    const camForward = this.axis.forward, camRight = this.axis.right;
    const flat = Math.sqrt(camForward.x * camForward.x + camForward.z * camForward.z);
    if (flat > 0.05) this._flatForward.set(camForward.x / flat, 0, camForward.z / flat);
    this._flatRight.set(-this._flatForward.z, 0, this._flatForward.x);
    if (camRight.x * this._flatRight.x + camRight.z * this._flatRight.z < 0) this._flatRight.mulScalar(-1);
    const fF = this._flatForward, fR = this._flatRight;

    // a hook in range comes before the jump; on a hook or in the flight after it, the swing script drives the body
    if (this.swing && this.swing.control(dt, jumpPressed, canMove, inX, floorDist, onFloor, attached)) {
        this.grounded = false;
        this.state = this.swing.isSwinging ? "swing" : "air";
        this.applyGrip(dt, this.swing.isSwinging, false, canMove);
        if (!this.swing.isSwinging) this.turnBody(dt);
        if (!this._animInAir) {
            this._animInAir = true;
            this._animComponent.setBoolean("isInAir", true);
        }
        return;
    }

    // jump: from the ground straight up, while holding away from the surface
    if (jumpPressed && this.app.canJump && this._airLock <= 0 && (this.grounded || attached)) {
        const v = this._vel;
        if (this.grounded) {
            v.y = this.jumpHeight;
            this._airLock = this.regrabDelay;
        } else {
            this._airLock = this.pushOffRegrab;
            arms.getHoldNormal(this._holdNormal);
            v.set(
                this._holdNormal.x * this.pushOffSpeed + (fF.x * inY + fR.x * inX) * this.pushOffCarry,
                this._holdNormal.y * this.pushOffSpeed + this.pushOffUp,
                this._holdNormal.z * this.pushOffSpeed + (fF.z * inY + fR.z * inX) * this.pushOffCarry
            );
        }
        this.grounded = false;
        arms.releaseAll();
        arms.grabEnabled = false;
        this.entity.sound.play("jump");
        this.entity.fire('jump');
        this.entity.rigidbody.linearVelocity = v;
        this.state = "air";
        this.applyGrip(dt, false, false, canMove);
        this.turnBody(dt);
        return;
    }

    if (this._airLock > 0 || (!attached && !this.grounded)) {
        // free fall: world gravity comes from the physics step
        this.state = "air";
        const v = this._vel;
        v.copy(this.entity.rigidbody.linearVelocity);
        v.y = Math.max(v.y - this.extraGravity * dt, -this.maxFallSpeed);
        if (inMag > 0) {
            const k = 1 - Math.exp(-this.airControl * dt);
            v.x += ((fF.x * inY + fR.x * inX) * this.moveSpeed - v.x) * k;
            v.z += ((fF.z * inY + fR.z * inX) * this.moveSpeed - v.z) * k;
        }
        if (bounce.curve > 0) {
            v.x += bounce.velocity.x * bounce.curve * dt;
            v.z += bounce.velocity.z * bounce.curve * dt;
            v.y = Math.max(v.y, bounce.velocity.y * bounce.curve);
            bounce.curve = Math.max(bounce.curve - dt, 0);
        }
        this.entity.rigidbody.linearVelocity = v;
    } else {
        const d = this._dir;
        const t = this._target;
        const footY = pos.y - 1.1 * scale;
        const lookingUp = camForward.y > Math.sin(this.liftPitch * pc.math.DEG_TO_RAD);
        const lookingDown = camForward.y < -0.87;

        // only floors in hand and a floor below: the arms stand on it. Looking up at a wall or ceiling lets the body leave it.
        let free = !this.grounded && !(hasFloor && arms.wallAnchors === 0);
        if (!free && inY > 0 && lookingUp) {
            const r = arms.grabReach;
            const up = this.castSurface(pos.x, pos.y, pos.z, pos.x + camForward.x * r, pos.y + camForward.y * r, pos.z + camForward.z * r);
            if (up && up.normal.y < 0.7) free = true;
        }

        if (free) d.set(camForward.x * inY + camRight.x * inX, camForward.y * inY + camRight.y * inX, camForward.z * inY + camRight.z * inX);
        else d.set(fF.x * inY + fR.x * inX, 0, fF.z * inY + fR.z * inX);

        // pressing into a wall climbs it, backing away from the wall in front goes down it. Second pass: the other wall of a corner.
        let climbing = false;
        let pushX = 0, pushZ = 0;
        for (let pass = 0; pass < 2; pass++) {
            const dh = Math.sqrt(d.x * d.x + d.z * d.z);
            if (dh < 0.05) break;
            const backing = pass === 0 && inY < 0 && !this.grounded;
            const px = backing ? fF.x : d.x / dh, pz = backing ? fF.z : d.z / dh;
            const range = this.wallDetect * scale * (backing ? 1.5 : 1);
            const feet = this.castSurface(pos.x, footY, pos.z, pos.x + px * range, footY, pos.z + pz * range);
            const head = this.castSurface(pos.x, pos.y + 0.6 * scale, pos.z, pos.x + px * range, pos.y + 0.6 * scale, pos.z + pz * range);
            const useFeet = feet && Math.abs(feet.normal.y) < 0.7;
            const useHead = head && Math.abs(head.normal.y) < 0.7;
            if (!useFeet && !useHead) break;
            const hit = useFeet && useHead ? (feet.hitFraction <= head.hitFraction ? feet : head) : (useFeet ? feet : head);
            const n = hit.normal;
            const into = -(d.x * n.x + d.z * n.z);
            if (backing ? into >= 0 : into <= 0) break;
            d.x += n.x * into; d.z += n.z * into;
            if (backing) {
                d.y += into;
                climbing = true;
                break;
            }
            // looking steeply down: the camera's way, down the wall. On the ground this stays on the ground.
            if (!lookingDown) d.y = Math.max(d.y, 0) + into;
            climbing = !lookingDown || !this.grounded;
            const gap = into * (range * hit.hitFraction - this.wallHold * scale);
            pushX += n.x * gap;
            pushZ += n.z * gap;
        }

        // a ceiling above: slide along it, brake before reaching the hold distance
        let ceilingGap = Infinity;
        if (d.y > 0.01 || this._vel.y > 0.5) {
            const range = this.ceilingHold * scale + Math.max(0, this._vel.y) * 0.1;
            const up = this.castSurface(pos.x, pos.y, pos.z, pos.x, pos.y + range, pos.z);
            if (up && up.normal.y < -0.7) {
                ceilingGap = range * up.hitFraction - this.ceilingHold * scale;
                d.y = 0;
            }
        }

        // keep the input's magnitude after the changes above
        const len = d.length();
        if (len > 0.001) d.mulScalar(inMag / len);

        const speed = free || climbing ? this.climbSpeed : this.moveSpeed;
        t.copy(d).mulScalar(speed);
        if (pushX !== 0 || pushZ !== 0) {
            t.x -= pc.math.clamp(pushX * 8, -speed, speed);
            t.z -= pc.math.clamp(pushZ * 8, -speed, speed);
        }
        if (ceilingGap !== Infinity) t.y = pc.math.clamp(ceilingGap * 8, -4, 4);

        if (this.grounded && !climbing) {
            t.y = pc.math.clamp((hover - floorDist) * this.hoverResponse, -this.settleSpeed, this.hoverRiseSpeed);
            if (free) t.y = Math.max(t.y, d.y * speed);
            this.state = "ground";
        } else if (!free && !climbing) {
            // sinking to the floor under the body
            t.y = -this.settleSpeed;
            this.state = "settle";
        } else {
            this.state = "climb";
        }

        const k = 1 - Math.exp(-this.acceleration * dt);
        const v = this._vel;
        v.x += (t.x - v.x) * k;
        v.y += (t.y - v.y) * k;
        v.z += (t.z - v.z) * k;

        // the physics step takes one step of world gravity off the written velocity
        this._write.set(v.x, v.y + worldGravity * physicsStep, v.z);
        this.entity.rigidbody.linearVelocity = this._write;
    }

    if (this.app.playerPush.active) {
        const push = this.app.playerPush;
        this._write.copy(this.entity.rigidbody.linearVelocity);
        this._write.x += push.direction.x * push.power;
        this._write.y = push.direction.y * push.power;
        this._write.z += push.direction.z * push.power;
        this.entity.rigidbody.linearVelocity = this._write;
    }

    this.applyGrip(dt, attached, this.grounded, canMove);
    this.turnBody(dt);

    const inAir = this.state !== "ground";
    if (inAir !== this._animInAir) {
        this._animInAir = inAir;
        this._animComponent.setBoolean("isInAir", inAir);
    }
};

// Grip: holding off the ground costs it, solid ground fills it, a free fall changes nothing. A menu or ad freezes it.
SpiderObbyPlayerController.prototype.applyGrip = function (dt, attached, grounded, canMove) {
    if (this.grip > this.maxGrip) this.grip = this.maxGrip;
    if (grounded) {
        if (this.grip < this.maxGrip) {
            this.grip = Math.min(this.maxGrip, this.grip + this.gripRefill * dt);
            if (this.grip >= this.maxGrip && !this._gripFull) {
                this._gripFull = true;
                this.app.fire("spider:gripRefilled");
            }
        }
        return;
    }
    if (!attached || !canMove) return;
    const onHook = !!this.swing && this.swing.isSwinging;
    this.grip -= (onHook ? this.swing.swingGripDrain : this.gripDrain) * dt;
    this._gripFull = false;
    if (this.grip <= 0) {
        this.grip = 0;
        this._gripEmpty = true;
        if (onHook) this.swing.release(false);
        this.arms.releaseAll();
        this.arms.grabEnabled = false;
        this.app.fire("spider:gripEmpty");
    }
};

// The body stays upright: it faces where it goes on the ground, the camera's way when holding. It only turns while moving.
SpiderObbyPlayerController.prototype.turnBody = function (dt) {
    const v = this._vel;
    const moving = v.x * v.x + v.z * v.z > 4;
    if (!moving && this._inX === 0 && this._inY === 0) return;
    let x = this._flatForward.x, z = this._flatForward.z;
    if (this.state === "ground" && moving) { x = v.x; z = v.z; }
    const target = Math.atan2(x, z) * pc.math.RAD_TO_DEG;
    let delta = (target - this._bodyYaw) % 360;
    if (delta > 180) delta -= 360; else if (delta < -180) delta += 360;
    this._bodyYaw += delta * (1 - Math.exp(-this.rotateSpeed * dt));
    if (!this.app.isEdit && !(this.swing && this.swing.bodyTilted)) this.body.setEulerAngles(0, this._bodyYaw, 0);
};

SpiderObbyPlayerController.prototype.update = function (dt) {
    if (!this.arms) this.arms = this.entity.script.spiderObbyArms;
    if (!this.swing) this.swing = this.entity.script.spiderObbySwingController;
    if (this.app.keyboard.wasPressed(pc.KEY_R)) {
        this.app.fire("playerDie");
        return;
    }
    if (this.app.isMobile && (this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT)
        || this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)
        || this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)
        || this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN))) {
        this.app.isMobile = false;
        this.networkManager.mobileControls.enabled = this.app.isMobile;
        this.cameraScript.enabled = false;
        this.setCamera();
    }

    if (this.isDied) return;

    this.moveSpider(dt);
    this.arms.gripRatio = this.maxGrip > 0 ? this.grip / this.maxGrip : 1;

    if (this.entity.getPosition().y < this.app.gameManager.deathHeight) {
        this.died();
    }
};

SpiderObbyPlayerController.prototype.sdkGamePlayStart = function () {
    if (this.app.gameplayStarted || this.isDied || this.app.isWatchingAd) return;
    this.app.gameplayStarted = true;
    PokiSDK.gameplayStart();
};
//Only gets y euler angle between -180, 180
SpiderObbyPlayerController.prototype.getYaw = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

SpiderObbyPlayerController.prototype.sendPosition = function () {
    if (this.networkManager.room == null || this.networkManager.room.connection.isOpen === false) return;
    this.networkManager.room.send("Client:Movement", {
        x: this.entity.getPosition().x,
        y: this.entity.getPosition().y,
        z: this.entity.getPosition().z,

        rotationX: this.body.getEulerAngles().x,
        rotationY: this.body.getEulerAngles().y,
        rotationZ: this.body.getEulerAngles().z,

        grounded: this.grounded,
        isWalking: this._animComponent.getBoolean("walk"),
        isClimbing: false,
        isOnLadder: false,
    });
};

SpiderObbyPlayerController.prototype.setCamera = function () {
    this.camera = this.app.root.findByName('Camera');
    this.cameraPosEntity = this.entity.findByName('CameraPosition');
    this.cameraParent = this.entity.findByName('Camera Axis');
    this.cameraParent.addChild(this.camera);
    this.camera.setLocalPosition(this.cameraPosEntity.getLocalPosition());
    // exactly one camera script runs: the other one still holds the entity parent it saw at initialize
    // (the scene root) and would rotate the whole scene in its postUpdate
    this.camera.script.spiderObbyMobileCameraController.enabled = this.app.isMobile;
    this.camera.script.spiderObbyCameraController.enabled = !this.app.isMobile;
    if (this.app.isMobile) {
        this.cameraScript = this.camera.script.spiderObbyMobileCameraController;
    } else {
        this.cameraScript = this.camera.script.spiderObbyCameraController;
    }

    this.cameraScript.enabled = true;

    this.cameraScript.resetCamera();

    this._frameMovementRight = new pc.Vec3();
    this._frameMovementForward = new pc.Vec3();
    this._frameMovementTotal = new pc.Vec3();
};

SpiderObbyPlayerController.prototype.died = function () {
    if (this.isDied || this.canDie == false) return;
    if (this.app.gameplayStarted === true) {
        PokiSDK.gameplayStop();
        this.app.gameplayStarted = false;
    }

    this.app.fire("MarketClose");

    let deadPlayerEntity = this.deadPlayer.resource.instantiate();
    let playerPos = this.entity.getPosition().clone();
    this.app.root.addChild(deadPlayerEntity);
    deadPlayerEntity.setPosition(playerPos.x, playerPos.y, playerPos.z);
    deadPlayerEntity.setRotation(this.body.getRotation().clone());
    let deadPlayerEntityBody = deadPlayerEntity.children[0];
    this.playerRendererEntity.enabled = false;
    this.overHeadGroup.enabled = false;
    deadPlayerEntityBody.enabled = true;
    for (let i = 0; i < deadPlayerEntityBody.children.length; i++) {
        deadPlayerEntityBody.children[i].rigidbody.applyImpulse(this.body.forward.scale(-pc.math.random(0, 1)));
    }
    this.spawnedDeadBody = deadPlayerEntity;
    this.isDied = true;
    this.app.isDied = true;
    if (this.swing) this.swing.cancel();
    if (this.arms) { this.arms.releaseAll(); this.arms.grabEnabled = false; this.arms.setHidden(true); }

    //this.hats.enabled = false;
    this.networkManager.diedEffect();
    this.entity.collision.enabled = false;
    this.entity.rigidbody.type = "kinematic";
    if (this.networkManager.room)
        this.networkManager.room.send("Client:Died");
    this.lockCamera(true);

    this.app.fire("PlayerDied");
};

SpiderObbyPlayerController.prototype.respawn = function (vipRespawn = false) {
    this.canDie = false;
    setTimeout(() => { this.canDie = true; }, 1000);
    this.body.setRotation(new pc.Quat());
    this._bodyYaw = 0;

    this.playerRendererEntity.enabled = true;
    this.overHeadGroup.enabled = true;
    //this.hats.enabled = true;
    this.isDied = false;
    this.app.isDied = false;
    if (this.spawnedDeadBody)
        this.spawnedDeadBody.destroy();
    //let targetStage = this.networkManager.stagesParent.children[this.app.currentStage];
    this.entity.collision.enabled = true;
    this.entity.rigidbody.type = "dynamic"
    this.teleportToSavedSpawn();
    this.refillGrip();

    setTimeout(() => { this.cameraScript.reset(); }, 100);
    if (this.networkManager.room) {
        if (vipRespawn && this.app.section) {
            //this.entity.rigidbody.teleport(this.app.section);
        } else {

        }
        this.networkManager.room.send("Client:Respawn");
    } else {
        if (vipRespawn && this.app.section) {
            //this.entity.rigidbody.teleport(this.app.section);
        } else {

        }
    }
    this.lockCamera(false);

    if (this.app.playerItemManager && this.app.playerItemManager.playerData && this.app.playerItemManager.playerData.testID) {
        this.app.fire("Respawned", this.app.playerItemManager.playerData.testID);
    } else {
        this.app.fire("Respawned");
    }
};

SpiderObbyPlayerController.prototype.stop = function () {
    this._vel.set(0, 0, 0);
    this._airLock = 0;
    this.entity.rigidbody.linearVelocity = this._vel;
    this.entity.rigidbody.angularVelocity = pc.Vec3.ZERO;
};

SpiderObbyPlayerController.prototype.teleportToSavedSpawn = function (_firstTeleport = false) {
    if (this.app.playerItemManager && this.app.playerItemManager.playerData) {
        let _spawn = this.app.root.findByName("LobbySpawnPoint");
        this.teleportToPosition(_spawn.getPosition());
    }
};

SpiderObbyPlayerController.prototype.teleportToPosition = function (_position, _rotation = null) {
    if (this.swing) this.swing.cancel();
    this.entity.rigidbody.teleport(_position);
    this._vel.set(0, 0, 0);
    this.entity.rigidbody.linearVelocity = this._vel;
    if (this.arms) this.arms.reset();
};


SpiderObbyPlayerController.prototype.resetGame = function () {
    this.networkManager.setCheckpoint(0);
    this.app.fire("resetStage")
    //this.teleport();
}

SpiderObbyPlayerController.prototype.lockCamera = function (state = false) {
    if (state) {
        this.cameraScript.removeEventCallbacks();
        this.app.mouse.disablePointerLock();
    } else {
        this.cameraScript.addEventCallbacks();
        if (!this._firstSpawn) this.app.mouse.enablePointerLock();
    }
}

SpiderObbyPlayerController.prototype.setScale = function (_float) {
    this.entity.setLocalScale(_float, _float, _float);
    this.entity.collision.height = 2 * _float
    this.entityScale = _float;
    this._vel.set(0, 0, 0);
    this.teleportToPosition(this.entity.getLocalPosition().clone().add(new pc.Vec3(0, this.entity.collision.height / 2, 0)));
}


SpiderObbyPlayerController.prototype.setSkin = function (_int) {
    return;
    if (isNaN(_int) || _int == null || _int < 0) { return; }

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    this.skins[_int].enabled = true;
    this.skin = _int;
}

SpiderObbyPlayerController.prototype.setActiveHandItem = function (newHandItem) {


};


