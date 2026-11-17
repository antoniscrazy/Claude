var ElectricObbyPlayerController = pc.createScript('electricObbyPlayerController');

ElectricObbyPlayerController.attributes.add("username", { type: "entity" });
ElectricObbyPlayerController.attributes.add("body", { type: "entity" });
ElectricObbyPlayerController.attributes.add("moveSpeed", { type: "number", default: 6 });
ElectricObbyPlayerController.attributes.add("jumpHeight", { type: "number", default: 13 });
ElectricObbyPlayerController.attributes.add("rotateSpeed", { type: "number", default: 5 });
ElectricObbyPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

ElectricObbyPlayerController.prototype.initialize = function () {

    this.app.electricObbyPlayerController = this;

    this.isDied = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.electricObbyNetworkManager;
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
    this._desiredAngle = 0;
    this.maxLinearVelocity = this.moveSpeed;
    this._requestedJump = false;
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

    this.skin = ElectricObbyItems.SkinLego;
    this.skins = [];
    this.skins[ElectricObbyItems.SkinLego] = this.entity.findByName("SkinLego");
    this.skins[ElectricObbyItems.SkinBigShoe] = this.entity.findByName("SkinBigShoe");
    this.skins[ElectricObbyItems.SkinTurtle] = this.entity.findByName("SkinTurtle");
    this.skins[ElectricObbyItems.SkinEmolingo] = this.entity.findByName("SkinEmolingo");
    this.skins[ElectricObbyItems.SkinAxo] = this.entity.findByName("SkinAxo");
    this.skins[ElectricObbyItems.SkinHacker] = this.entity.findByName("SkinHacker");

    this.team = null;

    this.app.playerPush = {
        active: false,
        direction: new pc.Vec3(0, 0, 0),
        velocity: new pc.Vec3(0, 0, 0),
        power: 5,
        acceleration: 60,
        rampUpTime: 0.6,
        rampDownTime: 0.35,
        strength: 0,
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
};

ElectricObbyPlayerController.prototype.stopMovement = function () {
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

ElectricObbyPlayerController.prototype.adjustLinearVelocity = function (scalar, delay) {
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.add(this._desiredVelocity.clone().mulScalar(scalar));

        // Check and limit the linear velocity
        if (this.entity.rigidbody.linearVelocity.length() > this.maxLinearVelocity * this.boatSpeedMul) {
            this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.normalize().scale(this.maxLinearVelocity * this.boatSpeedMul);
        }
    }, delay);
};


ElectricObbyPlayerController.prototype.playerController = function (dt) {
    this._direction.set(0, 0, 0);
    this._requestedJump = false;
    this._carpetVelocity.set(0, 0, 0);

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;
    canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && !this.app.isPopupEnabled && !this.app.numpad.enabled && !this.app.inCutscene;
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

    for (let result of _rayResults) {
        if (result) {
            if (result.entity.tags.has("Ground")) {
                this._contactNormal = result.normal.clone();
                this._timeSinceLastGrounded = 0;
                this.grounded = true;
                if (this._timeSinceLastJump >= 0.3) {
                    this._jumped = false;
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
            //extra gravity
            if (!this.entity.isBallon && !this.app.playerItemManager.jetpack.using) {
                this._desiredVelocity.set(this._desiredVelocity.x, this._desiredVelocity.y - 30 * dt, this._desiredVelocity.z);
            }
        }

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

        this.applyPlayerPush(dt);

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

ElectricObbyPlayerController.prototype.moveTowards = function (current, target, maxDelta) {
    if (current < target) { return Math.min(target, current + maxDelta); }
    if (current > target) { return Math.max(target, current - maxDelta); }
    return current;
};

ElectricObbyPlayerController.prototype.applyPlayerPush = function (dt) {
    let push = this.app.playerPush;

    if (!push.active && push.strength <= 0 && push.velocity.lengthSq() === 0) { return; }

    if (push.active) {
        push.strength = push.rampUpTime > 0 ? Math.min(push.strength + dt / push.rampUpTime, 1) : 1;
    } else {
        push.strength = push.rampDownTime > 0 ? Math.max(push.strength - dt / push.rampDownTime, 0) : 0;
    }

    let eased = push.strength * push.strength * (3 - 2 * push.strength);
    let step = push.acceleration * dt;
    let velocity = this.entity.rigidbody.linearVelocity;
    let targetX = push.direction.x * push.power * eased;
    let targetY = push.direction.y * push.power * eased;
    let targetZ = push.direction.z * push.power * eased;

    push.velocity.x = this.moveTowards(push.velocity.x, targetX, step);
    push.velocity.z = this.moveTowards(push.velocity.z, targetZ, step);

    let velocityY = velocity.y;

    if (push.direction.y > 0 && velocityY < targetY) {
        velocityY = Math.min(targetY, velocityY + step);
    } else if (push.direction.y < 0 && velocityY > targetY) {
        velocityY = Math.max(targetY, velocityY - step);
    }

    this.entity.rigidbody.linearVelocity = new pc.Vec3(
        velocity.x + push.velocity.x,
        velocityY,
        velocity.z + push.velocity.z
    );
};

ElectricObbyPlayerController.prototype.update = function (dt) {
    if (this.app.keyboard.wasPressed(pc.KEY_R)) {
        this.app.fire("playerDie");
        return;
    }
    /*     if (this.app.keyboard.isPressed(pc.KEY_B)) {
           this.entity.rigidbody.teleport(this.app.root.findByName("AgudarDebug").getPosition().clone())
       }
   
       if (this.app.keyboard.isPressed(pc.KEY_X)) {
           this.entity.rigidbody.teleport(this.app.root.findByName("CuvanDebug").getPosition().clone())
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

    if (this.entity.getPosition().y < 0) {
        this.died();
    }
};
ElectricObbyPlayerController.prototype.sdkGamePlayStart = function () {
    if (this.app.gameplayStarted || this.isDied || this.app.isWatchingAd) return;
    this.app.gameplayStarted = true;
    PokiSDK.gameplayStart();
};
//Only gets y euler angle between -180, 180
ElectricObbyPlayerController.prototype.getYaw = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

ElectricObbyPlayerController.prototype.sendPosition = function () {
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

ElectricObbyPlayerController.prototype.setCamera = function () {
    this.camera = this.app.root.findByName('Camera');
    this.cameraPosEntity = this.entity.findByName('CameraPosition');
    this.cameraParent = this.entity.findByName('Camera Axis');
    this.cameraParent.addChild(this.camera);
    this.camera.setLocalPosition(this.cameraPosEntity.getLocalPosition());
    if (this.app.isMobile) {
        this.camera.script.electricObbyCameraController.enabled = false;
        this.cameraScript = this.camera.script.electricObbyMobileCameraController;
    } else {
        this.cameraScript = this.camera.script.electricObbyCameraController;
    }

    this.cameraScript.enabled = true;

    this.cameraScript.resetCamera();

    this._frameMovementRight = new pc.Vec3();
    this._frameMovementForward = new pc.Vec3();
    this._frameMovementTotal = new pc.Vec3();
};

ElectricObbyPlayerController.prototype.died = function () {
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
};

ElectricObbyPlayerController.prototype.respawn = function (vipRespawn = false) {
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

    setTimeout(() => { if (this.entity && !this.entity.script) return; this.cameraScript.reset(); this.faceSpawnCamera(); }, 100);
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

ElectricObbyPlayerController.prototype.stop = function () {

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

ElectricObbyPlayerController.prototype.getCheckpointSpawn = function () {
    if (this.app.checkpoint == null || this.app.checkpoint < 0) { return null; }

    let _checkpointRoot = this.app.root.findByName("Checkpoints");
    if (!_checkpointRoot) { return null; }

    let _checkpoint = _checkpointRoot.children[this.app.checkpoint];
    if (!_checkpoint) { return null; }

    return _checkpoint.findByName("SpawnPoint");
};

ElectricObbyPlayerController.prototype.teleportToSavedSpawn = function (_firstTeleport = false) {
    let _checkpointSpawn = this.getCheckpointSpawn();
    if (_checkpointSpawn) {
        this.entity.rigidbody.teleport(_checkpointSpawn.getPosition());
        this.faceSpawn(_checkpointSpawn);
        return;
    }

    if (this.app.playerItemManager && this.app.playerItemManager.playerData) {
        let _spawn = this.app.root.findByName("LobbySpawnPoint");
        this.entity.rigidbody.teleport(_spawn.getPosition());
        this.faceSpawn(_spawn);
    }
};

ElectricObbyPlayerController.prototype.faceSpawn = function (_spawn) {
    this.spawnYaw = this.getYaw(_spawn.getRotation());
    this._quatLerp.setFromEulerAngles(0, this.spawnYaw, 0);
    this.body.setRotation(this._quatLerp);
    this.rayPoint.setRotation(this._quatLerp);
    this.faceSpawnCamera();
};

ElectricObbyPlayerController.prototype.faceSpawnCamera = function () {
    if (this.spawnYaw == null || !this.cameraScript || !this.cameraScript.eulers) return;
    this.cameraScript.eulers.x = (this.spawnYaw + 360) % 360;
};

ElectricObbyPlayerController.prototype.teleport = function () {
    this.stop();
    this.teleportToSavedSpawn();
};

ElectricObbyPlayerController.prototype.teleportToPosition = function (_position, _rotation = null) {
    this.entity.rigidbody.teleport(_position);
    if (_rotation) { this._desiredAngle = _rotation; }
};


ElectricObbyPlayerController.prototype.resetGame = function () {
    this.networkManager.setCheckpoint(-1);
    this.app.fire("resetStage")
    //this.teleport();
}

ElectricObbyPlayerController.prototype.lockCamera = function (state = false) {
    console.log("lockCamera", state)
    if (state) {
        this.cameraScript.removeEventCallbacks();
        this.app.mouse.disablePointerLock();
    } else {
        this.cameraScript.addEventCallbacks();
        this.app.mouse.enablePointerLock();
    }
}

ElectricObbyPlayerController.prototype.setScale = function (_float) {
    this.entity.setLocalScale(_float, _float, _float);
    this.entity.collision.height = 2 * _float
    this.entityScale = _float;
    this._desiredVelocity = new pc.Vec3();
    this.teleportToPosition(this.entity.getLocalPosition().clone().add(new pc.Vec3(0, this.entity.collision.height / 2, 0)));
}


ElectricObbyPlayerController.prototype.setSkin = function (_int) {
    return;
    if (isNaN(_int) || _int == null || _int < 0) { return; }

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    this.skins[_int].enabled = true;
    this.skin = _int;
}

ElectricObbyPlayerController.prototype.setActiveHandItem = function (newHandItem) {


};


