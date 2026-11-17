var TowerObbyPlayerController = pc.createScript('towerObbyPlayerController');

TowerObbyPlayerController.attributes.add("username", { type: "entity" });
TowerObbyPlayerController.attributes.add("body", { type: "entity" });
TowerObbyPlayerController.attributes.add("moveSpeed", { type: "number", default: 6 });
TowerObbyPlayerController.attributes.add("jumpHeight", { type: "number", default: 13 });
TowerObbyPlayerController.attributes.add("rotateSpeed", { type: "number", default: 5 });
TowerObbyPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

TowerObbyPlayerController.prototype.initialize = function () {

    this.app.towerObbyPlayerController = this;

    this.isDied = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.towerObbyNetworkManager;
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

    this._direction = new pc.Vec3();
    this._contactNormal = new pc.Vec3();
    this._quatLerp = new pc.Quat();
    this._desiredVelocity = new pc.Vec3();
    this._carpetVelocity = new pc.Vec3();
    this._conveyor = new pc.Vec3();
    this._platform = null;
    this._platformPoint = new pc.Vec3();
    this._platformVelocity = new pc.Vec3();
    this._platformCarry = new pc.Vec3();
    this._platformCarryTime = 0;
    this._platformYaw = new pc.Quat();
    this._desiredAngle = 0;
    this.maxLinearVelocity = this.moveSpeed;
    this._requestedJump = false;
    this._airJumpUsed = false;
    this._airJumpArmed = false;
    this._timeSinceLastJump = 0;
    this._timeSinceLastGrounded = 0;
    this.boatRayNormalRot = new pc.Quat();
    this._animComponent = this.body.anim;
    this.sendPositionInterval = setInterval(this.sendPosition.bind(this), 100);
    this.follower = this.entity.findByName("Follower");
    this.rayPoint = this.entity.findByName("RayPoint");
    this.rayGround = this.entity.findByName("RayGround");
    this.respawn();
    this.entityScale = 1;
    this.app.canJump = true;

    body = this.entity.rigidbody.body;
    body.setCcdMotionThreshold(0.5);
    body.setCcdSweptSphereRadius(0.3);

    this.skin = TowerObbyItems.SkinLego;
    this.skins = [];
    this.skins[TowerObbyItems.SkinLego] = this.entity.findByName("SkinLego");
    this.skins[TowerObbyItems.SkinBigShoe] = this.entity.findByName("SkinBigShoe");
    this.skins[TowerObbyItems.SkinTurtle] = this.entity.findByName("SkinTurtle");
    this.skins[TowerObbyItems.SkinEmolingo] = this.entity.findByName("SkinEmolingo");
    this.skins[TowerObbyItems.SkinAxo] = this.entity.findByName("SkinAxo");
    this.skins[TowerObbyItems.SkinHacker] = this.entity.findByName("SkinHacker");
    this.skins[TowerObbyItems.SkinTri] = this.entity.findByName("SkinTri");
    this.skins[TowerObbyItems.SkinChef] = this.entity.findByName("SkinChef");
    this.skins[TowerObbyItems.SkinBread] = this.entity.findByName("SkinBread");
    this.skins[TowerObbyItems.SkinCat] = this.entity.findByName("SkinCat");
    this.skins[TowerObbyItems.SkinFrog] = this.entity.findByName("SkinFrog");
    this.skins[TowerObbyItems.SkinNuclear] = this.entity.findByName("SkinNuclear");

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
            setTimeout(() => { if (this.entity && !this.entity.script) return; this.app.playerBounce.canBounce = true; }, 250);

            this.app.playerBounce.velocity = direction.clone().mulScalar(power * this.app.playerBounce.power);
            this.app.playerBounce.curve = curveTime;
        },
    }

    this.app.hp = {
        current: 3,
        max: 3,
        reset: () => {
            this.app.hp.current = this.app.hp.max;
            this.app.hp.updateUI();
        },

        damage: (_damage = 1) => {
            if (this.app.playerItemManager.shield.enabled) { return; }
            if (this.app.playerItemManager.immortality.enabled) { return; }
            this.app.hp.current = Math.max(this.app.hp.current - _damage, 0);
            if (this.app.hp.current <= 0) {
                this.app.fire("playerDie");
                this.app.hp.reset();
            }

            this.app.towerObbyNetworkManager.lowHPEffectMethod();

            this.app.hp.updateUI();

            console.log("damage", _damage, this.app.hp.current)
        },

        updateUI: () => {
            let hearts = this.app.root.findByName("HpHearts").children;
            hearts.forEach((heart, index) => {
                heart.enabled = (this.app.hp.current - 1) >= index;
            });
        }
    };

    this.app.on("playerDamage", this.app.hp.damage, this);
    this.app.hp.updateUI();

    this._animComponent.on("step1", () => {
        let rand = Math.floor(Math.random() * 2) + 1;

        this.entity.sound.play("footstep" + rand);
    });
    this._animComponent.on("step2", () => {
        let rand = Math.floor(Math.random() * 2) + 1;

        this.entity.sound.play("footstep" + rand);
    });

    this.app.on("lockCamera", this.lockCamera, this);
    this.app.on("playerDie", () => this.died(), this);

    this.entity.collision.on('collisionstart', function (otherEntity) {
        if (otherEntity.other.tags.has("Ladder")) {
            this.isClimbingLadder = true;
            this.isOnLadder = true;
            this._animComponent.setBoolean("isOnLadder", true);
        }
    }, this);
    this.entity.collision.on('collisionend', function (otherEntity) {
        if (otherEntity.tags.has("Ladder")) {
            this.isClimbingLadder = false;
            this.isOnLadder = false;
            this._animComponent.setBoolean("isClimbing", false);
            this._animComponent.setBoolean("isOnLadder", false);
        }
    }, this);

    this.app.on("resetGame", this.resetGame, this);
    this.app.on("teleportToCheckpoint", this.teleport, this);

    this.on('destroy', () => {
        clearInterval(this.sendPositionInterval);
        this.app.off("lockCamera", this.lockCamera, this);
        this.app.off("loadSkin");
        this.app.off("resetGame");
        this.app.off("toggleItem");
        this.app.off("playerDie");
        this.app.off("teleportToCheckpoint");
        this.app.off("playerDamage");
    }, this);


    this.canHit = true;
};

TowerObbyPlayerController.prototype.checkPlayers = function (_reachRange, _pushStrength, _cooldown) {
    if (!this.canHit) { return; } else { this.canHit = false; setTimeout(() => { if (this.entity && !this.entity.script) return; this.canHit = true }, 500 * _cooldown); }

    this.app.towerObbyPlayerController.playSlapAnim();
    //this.app.gameManager.sfx_swing();

    let hitRange = 3 * _reachRange;
    let pushStrength = 5 * _pushStrength;

    let me = this.entity;
    let myPos = me.getPosition();
    let forward = this.body.forward.clone().normalize().scale(-1);

    let targets = [];

    for (let key in this.app.towerObbyNetworkManager.playerEntities) {
        if (key === this.app.towerObbyNetworkManager.room.sessionId) continue;

        let playerEntity = this.app.towerObbyNetworkManager.playerEntities[key];
        if (!playerEntity) continue;
        //if (!playerEntity.script.towerObbyOtherPlayerController.attackable) continue;

        targets.push({
            entity: playerEntity,
            type: "player",
            sessionId: key
        });
    }

    let _hited = false;

    for (let i = 0; i < targets.length; i++) {
        let target = targets[i].entity;
        let targetPos = target.getPosition();

        let distance = myPos.distance(targetPos);
        if (distance > hitRange) continue;

        let dirToTarget = targetPos.clone().sub(myPos).normalize();
        let facingDot = forward.dot(dirToTarget);
        if (facingDot < 0.5) continue;

        let upAim = 0.4;
        let aimedForward = forward.clone().add(new pc.Vec3(0, upAim, 0)).normalize();
        let basePush = aimedForward.scale(pushStrength);

        if (targets[i].type === "player") {
            this.app.towerObbyNetworkManager.room.send("Client:HitPlayer", {
                targetSessionId: targets[i].sessionId,
                forceX: basePush.x,
                forceY: basePush.y,
                forceZ: basePush.z,
                dirX: dirToTarget.x,
                dirY: dirToTarget.y,
                dirZ: dirToTarget.z,
            });
            _hited = true;
        }

        /*         if (targets[i].type === "bee") {
                    if (target.script && target.script.towerObbyBee) {
                        target.script.towerObbyBee.hit(dirToTarget);
                    }
                }
        
                if (targets[i].type === "smashWall") {
                    if (target.script && target.script.towerObbySmashWall) {
                        target.script.towerObbySmashWall.hit(dirToTarget);
                    }
                } */
    }
    return _hited;
};

TowerObbyPlayerController.prototype.roll = function (state, force, dir) {
    this.isRolling = state;
    this._animComponent.setBoolean("isRolling", state);

    let capsule = this.entity.collision;
    let rb = this.entity.rigidbody;

    if (state) {

        rb.enabled = false;
        capsule.type = "sphere";
        capsule.radius = 0.58;
        capsule.linearOffset.y = -0.1; // Move the collider down

        // Apply forward force
        //this.entity.extraForce = this.body.forward.clone().scale(-20);
        //this.entity.extraForce = force;
        //this.takeDamage(10);
        this.entity.extraForce = force.clone().mulScalar(4);
        //rb.applyImpulse(force);
        //console.log(force);

        rb.angularFactor = new pc.Vec3(1, 1, 1);

        this.body.setLocalPosition(0, -.6, 0);
        rb.enabled = true;
        //this.entity.rigidbody.angularVelocity = dir.clone().mulScalar(20);
        this.entity.rigidbody.applyTorqueImpulse(dir.clone().mulScalar(.5));

        clearTimeout(this.rollGetupTimeout);
        this.rollGetupTimeout = setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.roll(false);
        }, 1000);

    } else {
        rb.enabled = false;
        capsule.type = "capsule";
        capsule.height = 2;
        capsule.radius = .5;
        capsule.linearOffset.y = 0;

        rb.angularFactor = new pc.Vec3(0, 0, 0);
        this.entity.setRotation(new pc.Quat())
        this.body.setRotation(new pc.Quat())
        this.body.setLocalPosition(0, -1, 0);
        rb.enabled = true;
    }
}

TowerObbyPlayerController.prototype.playSlapAnim = function () {
    this.upbodyLayer.transition("Hit" + Math.floor(pc.math.random(0, 2)), 0.1);
    if (this.app.towerObbyNetworkManager.room) {
        this.app.towerObbyNetworkManager.room.send("Client:HitAnim")
    }
}

TowerObbyPlayerController.prototype.stopMovement = function () {
    console.log("Game lost focus!");
    const kb = this.app.keyboard;
    if (kb) {
        kb._keymap = {};
        kb._lastmap = {};
        kb._pressed = {};
        kb._released = {};
    }
    this._direction.set(0, 0, 0);
    this._desiredVelocity.set(0, 0, 0);
    this._requestedJump = false;
    this._carpetVelocity.set(0, 0, 0);
    this.entity.rigidbody.linearVelocity.set(0, 0, 0)
    this._animComponent.setBoolean("walk", false);
}

var setMat4Forward = (function () {
    var x, y, z;

    x = new pc.Vec3();
    y = new pc.Vec3();
    z = new pc.Vec3();

    return function (mat4, forward, up) {
        // Inverse the forward direction as +z is pointing backwards due to the coordinate system
        z.copy(forward).scale(-1);
        y.copy(up).normalize();
        x.cross(y, z).normalize();
        y.cross(z, x);

        var r = mat4.data;

        r[0] = x.x;
        r[1] = x.y;
        r[2] = x.z;
        r[3] = 0;
        r[4] = y.x;
        r[5] = y.y;
        r[6] = y.z;
        r[7] = 0;
        r[8] = z.x;
        r[9] = z.y;
        r[10] = z.z;
        r[11] = 0;
        r[15] = 1;

        return mat4;
    };
}());

TowerObbyPlayerController.prototype.adjustLinearVelocity = function (scalar, delay) {
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.add(this._desiredVelocity.clone().mulScalar(scalar));

        // Check and limit the linear velocity
        if (this.entity.rigidbody.linearVelocity.length() > this.maxLinearVelocity * this.boatSpeedMul) {
            this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.normalize().scale(this.maxLinearVelocity * this.boatSpeedMul);
        }
    }, delay);
};


TowerObbyPlayerController.prototype.playerController = function (dt) {
    this._direction.set(0, 0, 0);
    this._requestedJump = false;
    this._carpetVelocity.set(0, 0, 0);

    // conveyor belts add into app.conveyorPush and we drain it here, so a belt can run
    // before or after this script and overlapping belts simply add up
    this._conveyor.set(0, 0, 0);
    if (this.app.conveyorPush) {
        this._conveyor.copy(this.app.conveyorPush);
        this.app.conveyorPush.set(0, 0, 0);
    }

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;
    canMove = this.app.powerupPanelEnabled != true && this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && !this.app.isPopupEnabled;
    if (canMove) {
        joystick = window.touchJoypad.sticks['joystick0'];
        if (this.app.isMobile) {
            let joystickX = joystick.x || 0;
            let joystickY = joystick.y || 0;

            // Create a temporary vector to calculate the combined input direction
            let inputDir = new pc.Vec3();

            if (joystickY !== 0) {
                let forwardVec = this.camera.forward.clone().mulScalar(joystickY);
                inputDir.add(forwardVec);
            }

            if (joystickX !== 0) {
                let rightVec = this.camera.right.clone().mulScalar(joystickX);
                inputDir.add(rightVec);
            }

            // Check if there is any movement input
            if (inputDir.lengthSq() > 0) {
                // Keep the magnitude proportional but cap it at 1.0 to prevent diagonal speed boosting
                let magnitude = inputDir.length();
                if (magnitude > 1) {
                    inputDir.normalize();
                }

                // Apply the normalized input to our movement and velocity vectors
                this._direction.add(inputDir);
                this._carpetVelocity.add(inputDir);
                this.sdkGamePlayStart();
            }
            if (window.touchJoypad.buttons.isPressed('jumpButton')) {
                this._requestedJump = true;
                this.sdkGamePlayStart();
            }
        } else {
            if (this.app.keyboard.isPressed(pc.KEY_SPACE)) {
                this._requestedJump = true;
                this.sdkGamePlayStart();
                this._carpetVelocity.y += 50 * dt;
            }
            if (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)) {
                this._direction.add(this.camera.forward);
                this._carpetVelocity.add(this.camera.forward);
                this.sdkGamePlayStart();

            }
            else if (this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN)) {
                this._direction.sub(this.camera.forward);
                this._carpetVelocity.sub(this.camera.forward);
                this.sdkGamePlayStart();
            }
            if (this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT)) {
                this._direction.sub(this.camera.right);
                this._carpetVelocity.sub(this.camera.right);
                this.sdkGamePlayStart();

            } if (this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)) {
                this._direction.add(this.camera.right);
                this._carpetVelocity.add(this.camera.right);
                this.sdkGamePlayStart();
            }
        }
    }

    this._direction.y = 0;

    let rayStart = this.entity.getPosition().clone();
    let rayEnd = this.rayGround.getPosition().clone();

    let box = 0.5 * this.entityScale;
    let _rayResults = [
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(box, 0, box))),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(box, 0, -box))),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(-box, 0, box))),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(-box, 0, -box)))
    ];

    this.grounded = false;
    this._platform = null;

    for (let result of _rayResults) {
        if (result) {
            if (result.entity.tags.has("Ground")) {
                this._contactNormal = result.normal.clone();
                this._timeSinceLastGrounded = 0;
                this.grounded = true;
                this._platform = this.findMovingPlatform(result.entity);
                this._platformPoint.copy(result.point);
                if (this._timeSinceLastJump >= 0.3) {
                    this._jumped = false;
                    this._airJumpUsed = false;
                    this._airJumpArmed = false;
                    this._animComponent.setBoolean("isInAir", false);
                }
                break; // Exit the loop if grounded
            }
        }
    }

    if (!this.grounded) {
        this._contactNormal = new pc.Vec3(0, 1, 0);
        this._animComponent.setBoolean("isInAir", true);
    }

    if (!this.isRolling) {
        this._desiredVelocity = this._direction.normalize().clone().mulScalar(this.moveSpeed);
        if (this._desiredVelocity.length() > 0) {
            this._desiredAngle = Math.atan2(this._direction.x, this._direction.z) * pc.math.RAD_TO_DEG;
            let targetQuat = new pc.Quat().setFromEulerAngles(0, this._desiredAngle, 0);
            this._quatLerp = new pc.Quat().slerp(this._quatLerp, targetQuat, this.rotateSpeed * dt);
            if (!this.app.isEdit) { this.body.setRotation(this._quatLerp); }
            this.rayPoint.setRotation(new pc.Quat().setFromEulerAngles(0, this._desiredAngle, 0));
        }

        this._desiredVelocity.y += this.entity.rigidbody.linearVelocity.y;
        let velocityDotNormal = this._desiredVelocity.clone().normalize().dot(this._contactNormal);
        if (velocityDotNormal > 0 && !this._jumped) {
            this._desiredVelocity.sub(this._contactNormal.clone().mulScalar(velocityDotNormal * this._desiredVelocity.length()));
        }

        this.applyPlatformCarry(dt);

        if (this.isClimbingLadder == true) {
            if (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP) || (this.app.isMobile && joystick.y > 0)) {
                let temp = this.body.up.mulScalar(15);
                this._desiredVelocity.set(this._desiredVelocity.x, 0, this._desiredVelocity.z);
                this._desiredVelocity.add(temp);
                this._desiredVelocity = this._desiredVelocity.normalize().mulScalar(6);
                this._animComponent.setBoolean("isClimbing", true);
            } else {
                this._desiredVelocity.set(this._desiredVelocity.x, 0, this._desiredVelocity.z);
                this._animComponent.setBoolean("isClimbing", false);
            }

            if (this._requestedJump) {
                let temp = this.body.up.clone().add(this.body.forward.mulScalar(4));
                this._desiredVelocity.add(temp.normalize().mulScalar(this.jumpHeight));
            }
        } else {
            // the air jump needs the key released first, otherwise holding it spends the charge instantly
            if (!this._requestedJump) { this._airJumpArmed = true; }

            //jump
            if (this.entity.jumpPlatform || (this._requestedJump && this._timeSinceLastGrounded <= 0.3 && !this._jumped) && !this.app.playerItemManager.jetpack.enabled && !this.app.playerPush.active && this.app.playerBounce.curve <= 0 && this.app.canJump) {
                this._jumped = true;
                this.entity.jumpPlatform = false;
                this._timeSinceLastJump = 0;
                this._desiredVelocity.add(this._contactNormal.clone().mulScalar(this.jumpHeight));
                this.entity.sound.play("jump");
                if (this._requestedJump) {
                    this.entity.fire('jump');
                }
            }
            //double jump
            else if (this._requestedJump && this._airJumpArmed && !this._airJumpUsed && this._jumped && this.app.playerItemManager.doubleJump.enabled
                && !this.app.playerItemManager.jetpack.enabled && !this.app.playerPush.active && this.app.playerBounce.curve <= 0 && this.app.canJump) {
                if (this.app.playerItemManager.useDoubleJump()) {
                    this._airJumpUsed = true;
                    this._airJumpArmed = false;
                    this._timeSinceLastJump = 0;
                    this._desiredVelocity.set(this._desiredVelocity.x, this.jumpHeight, this._desiredVelocity.z);
                    this.entity.sound.play("jump");
                    this.entity.fire('jump');
                }
            }
            //extra gravity
            if (!this.entity.isBallon && !this.app.playerItemManager.jetpack.using) {
                this._desiredVelocity.set(this._desiredVelocity.x, this._desiredVelocity.y - 30 * this.getGravityScale() * dt, this._desiredVelocity.z);
            }
        }

        this._desiredVelocity.add(this._conveyor);

        this.entity.rigidbody.linearVelocity = this._desiredVelocity;

        if (this._direction.x != 0 || this._direction.y != 0 || this._direction.z != 0) {
            this._animComponent.setBoolean("walk", true);
        } else {
            this._animComponent.setBoolean("walk", false);
        }

        if (this.app.playerItemManager.flyingCarpet.enabled) {
            //this._carpetVelocity;
            let scaler = 15
            this._carpetVelocity.set(this._carpetVelocity.x * scaler, this._carpetVelocity.y * scaler + dt * 19.6, this._carpetVelocity.z * scaler)
            this.entity.rigidbody.linearVelocity = this._carpetVelocity;
        }

        if (this.app.playerPush.active) {
            let power = this.app.playerPush.power;
            this.entity.rigidbody.linearVelocity = new pc.Vec3(
                this.app.playerPush.direction.x * power + this.entity.rigidbody.linearVelocity.x,
                this.app.playerPush.direction.y * power,
                this.app.playerPush.direction.z * power + this.entity.rigidbody.linearVelocity.z
            )
        }

        if (this.app.playerBounce.curve > 0) {
            let curve = this.app.playerBounce.curve;
            this.entity.rigidbody.linearVelocity = new pc.Vec3(
                this.app.playerBounce.velocity.x * curve + this.entity.rigidbody.linearVelocity.x,
                this.app.playerBounce.velocity.y * curve,
                this.app.playerBounce.velocity.z * curve + this.entity.rigidbody.linearVelocity.z,
            );
            this.app.playerBounce.curve = Math.max(this.app.playerBounce.curve - dt, 0);
        }
    }

    if (this.isRolling) {
        if (this.entity.extraForce) {
            this._desiredVelocity.set(
                this.entity.rigidbody.linearVelocity.x + this.entity.extraForce.x,
                this.entity.rigidbody.linearVelocity.y + this.entity.extraForce.y,
                this.entity.rigidbody.linearVelocity.z + this.entity.extraForce.z
            );

            this.entity.rigidbody.linearVelocity = this._desiredVelocity;
            //console.log("extra foce", this.entity.extraForce)
            this.entity.extraForce = null;
            //console.log("added extra force")
        }
    }

    if (this._direction.x != 0 || this._direction.y != 0 || this._direction.z != 0) {
        this._animComponent.setBoolean("walk", true);
    } else {
        this._animComponent.setBoolean("walk", false);
    }


    if (this.app.playerItemManager.flyingCarpet.enabled) {
        this._animComponent.setBoolean("isInAir", false);
        this._animComponent.setBoolean("walk", false);
        this._animComponent.setBoolean("isClimbing", false);
        this._animComponent.setBoolean("isOnLadder", false);
        //this._animComponent.setBoolean("sitting", false);

    }
};

TowerObbyPlayerController.prototype.getGravityScale = function () {
    if (this.app.playerItemManager && this.app.playerItemManager.lowGravity.enabled) {
        return this.app.playerItemManager.lowGravity.scale;
    }

    return 1;
};

TowerObbyPlayerController.prototype.findMovingPlatform = function (entity) {
    let current = entity;
    for (let i = 0; i < 5 && current; i++) {
        if (current.script && current.script.towerObbyMovingPlatform && current.script.towerObbyMovingPlatform.enabled) {
            return current.script.towerObbyMovingPlatform;
        }
        current = current.parent;
    }
    return null;
};

// folds the platform motion into our velocity, with a short tail after jumping off
TowerObbyPlayerController.prototype.applyPlatformCarry = function (dt) {
    if (dt <= 0) return;

    if (this._platform) {
        this._platform.stepIfNeeded(dt);
        this._platform.getDeltaAtPoint(this._platformPoint, this._platformVelocity).mulScalar(1 / dt);

        this._desiredVelocity.x += this._platformVelocity.x;
        this._desiredVelocity.z += this._platformVelocity.z;

        // clamped, not added, or it would compound frame after frame
        // skipped while jumping, the ground ray keeps hitting the platform for a few frames
        // the deadzone ignores float noise from the matrix round trip
        if (!this._jumped) {
            if (this._platformVelocity.y > 0.01) {
                this._desiredVelocity.y = Math.max(this._desiredVelocity.y, this._platformVelocity.y);
            } else if (this._platformVelocity.y < -0.01) {
                this._desiredVelocity.y = Math.min(this._desiredVelocity.y, this._platformVelocity.y);
            }
        }

        this._platformCarry.copy(this._platformVelocity);
        this._platformCarryTime = 0.4;

        if (this._platform.carryRotation && this._platform.yawDelta !== 0) {
            this._platformYaw.setFromEulerAngles(0, this._platform.yawDelta, 0);
            this._quatLerp.mul2(this._platformYaw, this._quatLerp);
            if (typeof this._desiredAngle === "number") {
                this._desiredAngle += this._platform.yawDelta;
            }
            if (!this.app.isEdit) { this.body.setRotation(this._quatLerp); }
            this.rayPoint.setRotation(this._quatLerp);
        }
        return;
    }

    if (this._platformCarryTime > 0) {
        if (this.grounded) {
            this._platformCarryTime = 0;
        } else {
            this._platformCarryTime = Math.max(this._platformCarryTime - dt, 0);
            let fade = this._platformCarryTime / 0.4;
            this._desiredVelocity.x += this._platformCarry.x * fade;
            this._desiredVelocity.z += this._platformCarry.z * fade;
        }
    }
};

TowerObbyPlayerController.prototype.update = function (dt) {
    if (this.app.keyboard.wasPressed(pc.KEY_R)) {
        this.app.fire("playerDie");
        return;
    }

    this.handleRaycast(dt);
    this.handleProgressBar();

    /*     if (this.app.keyboard.isPressed(pc.KEY_B)) {
           this.entity.rigidbody.teleport(this.app.root.findByName("AgudarDebug").getPosition().clone())
       }
   
    */
    //input
    if (this.app.isMobile && (this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT)
        || this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)
        || this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)
        || this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN))) {
        this.app.isMobile = false;
        this.networkManager.mobileControls.enabled = this.app.isMobile;
        this.cameraScript.enabled = false;
        this.setCamera();
    }

    this.playerController(dt);

    if (this.entity.getPosition().y < -10) {
        this.died();
    }
};
TowerObbyPlayerController.prototype.sdkGamePlayStart = function () {
    if (this.app.gameplayStarted || this.isDied || this.app.isWatchingAd) return;
    this.app.gameplayStarted = true;
    PokiSDK.gameplayStart();
};
//Only gets y euler angle between -180, 180
TowerObbyPlayerController.prototype.getYaw = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

TowerObbyPlayerController.prototype.sendPosition = function () {
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
        isClimbing: this._animComponent.getBoolean("isClimbing"),
        isOnLadder: this._animComponent.getBoolean("isOnLadder"),
    });
};

TowerObbyPlayerController.prototype.setCamera = function () {
    this.camera = this.app.root.findByName('Camera');
    this.cameraPosEntity = this.entity.findByName('CameraPosition');
    this.cameraParent = this.entity.findByName('Camera Axis');
    this.cameraParent.addChild(this.camera);
    this.camera.setLocalPosition(this.cameraPosEntity.getLocalPosition());
    if (this.app.isMobile) {
        this.cameraScript = this.camera.script.towerObbyMobileCameraController;
    } else {
        this.cameraScript = this.camera.script.towerObbyCameraController;
    }

    this.cameraScript.enabled = true;

    this.cameraScript.resetCamera();

    this._frameMovementRight = new pc.Vec3();
    this._frameMovementForward = new pc.Vec3();
    this._frameMovementTotal = new pc.Vec3();
};

TowerObbyPlayerController.prototype.died = function () {
    if (this.isDied || this.canDie == false) return;
    if (this.app.gameplayStarted === true) {
        console.log("gameplaystop")
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

    //this.hats.enabled = false;
    this.networkManager.diedEffect();
    this.entity.collision.enabled = false;
    this.entity.rigidbody.type = "kinematic";
    if (this.networkManager.room)
        this.networkManager.room.send("Client:Died");
    this.lockCamera(true);

    console.log("died");
    this.app.fire("PlayerDied");

    this.app.hp.reset();
};

TowerObbyPlayerController.prototype.respawn = function (vipRespawn = false) {
    this.canDie = false;
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.canDie = true; }, 1000);
    this.body.setRotation(new pc.Quat());

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

    setTimeout(() => { if (this.entity && !this.entity.script) return; this.cameraScript.reset(); }, 100);
    if (this.networkManager && this.networkManager.room) {
        this.networkManager.room.send("Client:Respawn");
    }

    console.log("respawn is vip", vipRespawn)
    if (vipRespawn) {
        this.app.gameManager.onSkipCheckpoint();
    } else {
        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.app.gameManager.teleportToCheckpoint();
        }, 50);
    }

    this.lockCamera(false);
    this.app.fire("Respawned");
};

TowerObbyPlayerController.prototype.stop = function () {

    this._desiredVelocity = new pc.Vec3(0, 0, 0);
    this.entity.rigidbody.linearVelocity = new pc.Vec3(0, 0, 0);
    this.entity.rigidbody.angularVelocity = new pc.Vec3(0, 0, 0);

    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this._desiredVelocity = new pc.Vec3(0, 0, 0);
        this.entity.rigidbody.linearVelocity = new pc.Vec3(0, 0, 0);
        this.entity.rigidbody.angularVelocity = new pc.Vec3(0, 0, 0);
    }, 50)
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this._desiredVelocity = new pc.Vec3(0, 0, 0);
        this.entity.rigidbody.linearVelocity = new pc.Vec3(0, 0, 0);
        this.entity.rigidbody.angularVelocity = new pc.Vec3(0, 0, 0);
    }, 100)
};

TowerObbyPlayerController.prototype.teleportToSavedSpawn = function (_firstTeleport = false) {
    if (this.app.playerItemManager && this.app.playerItemManager.playerData) {
        let _spawn = this.app.root.findByName("LobbySpawnPoint");
        this.entity.rigidbody.teleport(_spawn.getPosition());
        this._desiredAngle = _spawn.getRotation();
    }
};

TowerObbyPlayerController.prototype.teleportToPosition = function (_position, _rotation = null) {
    this.entity.rigidbody.teleport(_position);
    if (_rotation) { this._desiredAngle = _rotation; }
};


TowerObbyPlayerController.prototype.resetGame = function () {
    this.app.fire("resetStage")
    //this.teleport();
}

TowerObbyPlayerController.prototype.lockCamera = function (state = false) {
    console.log("lockCamera", state)
    if (state) {
        this.cameraScript.removeEventCallbacks();
        this.app.mouse.disablePointerLock();
    } else {
        this.cameraScript.addEventCallbacks();
        this.app.mouse.enablePointerLock();
    }
}

TowerObbyPlayerController.prototype.setScale = function (_float) {
    this.entity.setLocalScale(_float, _float, _float);
    this.entity.collision.height = 2 * _float
    this.entityScale = _float;
    this._desiredVelocity = new pc.Vec3();
    this.teleportToPosition(this.entity.getLocalPosition().clone().add(new pc.Vec3(0, this.entity.collision.height / 2, 0)));
}


TowerObbyPlayerController.prototype.setSkin = function (_int) {
    if (isNaN(_int) || _int == null || _int < 0) { return; }

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    this.skins[_int].enabled = true;
    this.skin = _int;
}

TowerObbyPlayerController.prototype.setActiveHandItem = function (newHandItem) {


};


TowerObbyPlayerController.prototype.handleRaycast = function (dt) {
    // in character update:
    var pos = this.entity.getPosition();
    this._rayEnd = this._rayEnd || new pc.Vec3();
    this._rayEnd.set(pos.x, pos.y - 1.5, pos.z);

    var hit = this.app.systems.rigidbody.raycastFirst(pos, this._rayEnd);

    this._sinkTarget = this._sinkTarget || new pc.Vec3();
    this._sinkCurrent = this._sinkCurrent || new pc.Vec3();
    this._sinkTarget.set(0, 0, 0);

    if (hit && hit.entity.script && hit.entity.script.squishSurface) {
        var surface = hit.entity.script.squishSurface;
        surface.pressAt(hit.point);
        surface.getSinkOffset(hit.point, this._sinkTarget);
    }

    if (hit && hit.entity.script && hit.entity.script.breakableSurface) {
        hit.entity.script.breakableSurface.trigger();
    }

    // smooth it to kill micro jitter
    var k = 1 - Math.exp(-12 * dt);
    this._sinkCurrent.lerp(this._sinkCurrent, this._sinkTarget, k);
    this.body.setLocalPosition(this._sinkCurrent.x, this._sinkCurrent.y - .9, this._sinkCurrent.z);
}

TowerObbyPlayerController.prototype.handleProgressBar = function () {
    if (!this.app.towerObbyNetworkManager) return;

    var net = this.app.towerObbyNetworkManager;
    var text = net.stagePercentageText;
    var pin = net.stagePercentagePin;
    if (!text || !pin) return;

    var yPos = this.entity.getPosition().y;
    var t = pc.math.clamp((yPos - 30) / (303 - 30), 0, 1);

    var percent = Math.round(t * 100);
    if (percent !== this._lastPercent) {
        this._lastPercent = percent;
        text.text = percent + "%";
        pin.setLocalPosition(t * 540, -40, 0);
    }
};