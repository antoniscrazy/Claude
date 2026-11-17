var IqTestModePlayerController = pc.createScript('iqTestModePlayerController');

IqTestModePlayerController.attributes.add("username", { type: "entity" });
IqTestModePlayerController.attributes.add("body", { type: "entity" });
IqTestModePlayerController.attributes.add("moveSpeed", { type: "number", default: 6 });
IqTestModePlayerController.attributes.add("moveSpeedBoat", { type: "number", default: 6 });
IqTestModePlayerController.attributes.add("jumpHeight", { type: "number", default: 13 });
IqTestModePlayerController.attributes.add("rotateSpeed", { type: "number", default: 5 });
IqTestModePlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

IqTestModePlayerController.prototype.initialize = function () {
    this.app.iqTestModePlayerController = this;

    this.entity.isLocal = true;
    this.lastValue = 0;
    this.cart = null;
    this.boatSpeedMul = 1;
    this.isDied = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.iqTestModeNetworkManager;
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
    this.app.cameraAdd = 0;
    this.setCamera();
    this._direction = new pc.Vec3();
    this._contactNormal = new pc.Vec3();
    this._quatLerp = new pc.Quat();
    this._desiredVelocity = new pc.Vec3();
    this._carpetVelocity = new pc.Vec3();
    this._desiredAngle = 0;
    this.maxLinearVelocity = this.moveSpeedBoat;
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
    this.isRolling = false;
    this.faceAttacker = this.entity.findByName("FaceAttacker");
    this.faceTarget = this.entity.findByName("FaceTarget");
    this.attackable = true;
    this.canHit = true;
    this.mapStart = this.app.root.findByName("MapStart");
    this.mapEnd = this.app.root.findByName("MapEnd");
    this.entityScale = 1;
    this.app.canJump = true;

    body = this.entity.rigidbody.body;
    body.setCcdMotionThreshold(0.5);
    body.setCcdSweptSphereRadius(0.3);

    this.skin = IqTestModeItems.SkinLego;
    this.skins = [];
    this.skins[IqTestModeItems.SkinLego] = this.entity.findByName("SkinLego");
    this.skins[IqTestModeItems.SkinBigShoe] = this.entity.findByName("SkinBigShoe");
    this.skins[IqTestModeItems.SkinTurtle] = this.entity.findByName("SkinTurtle");
    this.skins[IqTestModeItems.SkinEmolingo] = this.entity.findByName("SkinEmolingo");
    this.skins[IqTestModeItems.SkinAxo] = this.entity.findByName("SkinAxo");
    this.skins[IqTestModeItems.SkinHacker] = this.entity.findByName("SkinHacker");

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

    this._animComponent.on("step1", () => {
        let rand = Math.floor(Math.random() * 2) + 1;

        this.entity.sound.play("footstep" + rand);
    });
    this._animComponent.on("step2", () => {
        let rand = Math.floor(Math.random() * 2) + 1;

        this.entity.sound.play("footstep" + rand);
    });

    this.app.on("lockCamera", this.lockCamera, this);
    this.app.on("playerDie", () => {
        console.log("this.app.inCart", this.app.inCart);
        if (this.app.inCart) {
            this.app.fire("destroyCart");
        }
        else { this.died(); }

    }, this);

    this.app.deadFrom = null;
    { const handle = this.app.on("playerDie:Water", () => {
        this.app.deadFrom = "water";
        this.app.fire("playerDie");
    }); this.on('destroy', () => handle.off()); }

    { const handle = this.app.on("playerDie:Explosion", () => {
        this.app.deadFrom = "explosion";
        this.app.fire("playerDie");
    }); this.on('destroy', () => handle.off()); }

    { const handle = this.app.on("playerDie:Sarkit", () => {
        this.app.deadFrom = "explosion";
        this.app.fire("playerDie");
    }); this.on('destroy', () => handle.off()); }

    { const handle = this.app.on("destroyCart", () => {
        console.log("destroyCart")
        if (this.networkManager.room) {
            this.networkManager.room.send("Client:DestroyCart", { cartId: this.cartId });
        } else {
            //console.log("1")
            this.app.iqTestModeCartManager.destroyCart(0);
        }
    }, this); this.on('destroy', () => handle.off()); }

    this.app.on("Cutscene:Started", () => {
        this.entity.findByName("OverHeadGroup").enabled = false;
    }, this)

    this.app.on("Cutscene:Clear", () => {
        this.entity.findByName("OverHeadGroup").enabled = true;
    }, this)

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
    this.app.on("getOutCart", this.exitCart, this)

    this.on('destroy', () => {
        clearInterval(this.sendPositionInterval);
        this.app.off("lockCamera", this.lockCamera, this);
        this.app.off("buyBoat");
        this.app.off("loadSkin");
        this.app.off("resetGame");
        this.app.off("toggleItem");
        this.app.off("playerDie");
        this.app.off("teleportToCheckpoint");
        this.app.off("getOutCart");
        this.app.off("playerDamage");

        this.app.off("Cutscene:Started");
        this.app.off("Cutscene:Clear");

    }, this);
};

IqTestModePlayerController.prototype.stopMovement = function () {
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

IqTestModePlayerController.prototype.adjustLinearVelocity = function (scalar, delay) {
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.add(this._desiredVelocity.clone().mulScalar(scalar));

        // Check and limit the linear velocity
        if (this.entity.rigidbody.linearVelocity.length() > this.maxLinearVelocity * this.boatSpeedMul) {
            this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.normalize().scale(this.maxLinearVelocity * this.boatSpeedMul);
        }
    }, delay);
};


IqTestModePlayerController.prototype.playerController = function (dt) {
    this._direction.set(0, 0, 0);
    this._requestedJump = false;
    this._carpetVelocity.set(0, 0, 0);

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;
    canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && !this.app.isPopupEnabled && !this.app.numpad.enabled && !this.app.inCutscene;
    if (canMove) {
        joystick = window.touchJoypad.sticks['joystick0'];
        if (this.app.isMobile) {
            if (joystick.y > 0) {
                this._direction.add(this.camera.forward);
                this._carpetVelocity.add(this.camera.forward);
                this.sdkGamePlayStart();
            } else if (joystick.y < 0) {
                this._direction.add(this.camera.forward.mulScalar(-1));
                this._carpetVelocity.add(this.camera.forward.mulScalar(-1));
                this.sdkGamePlayStart();
            }
            if (joystick.x > 0) {
                this._direction.add(this.camera.right);
                this._carpetVelocity.add(this.camera.right);
                this.sdkGamePlayStart();
            } else if (joystick.x < 0) {
                this._direction.add(this.camera.right.mulScalar(-1));
                this._carpetVelocity.add(this.camera.right.mulScalar(-1));
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

IqTestModePlayerController.prototype.cartController = function (dt) {
    this._direction.set(0, 0, 0);
    this._requestedJump = false;

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;
    canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && this.app.inCutscene == false;
    if (canMove) {
        joystick = window.touchJoypad.sticks['joystick0'];
        if (this.app.isMobile) {
            if (joystick.x != 0) {
                this.sdkGamePlayStart();
            }
            if (joystick.y != 0) {
                this.sdkGamePlayStart();
            }
            if (window.touchJoypad.buttons.isPressed('jumpButton')) {
                this._requestedJump = true;
                this.sdkGamePlayStart();
                this.exitCart();
            }
        } else {
            if (this.app.keyboard.isPressed(pc.KEY_SPACE)) {
                this._requestedJump = true;
                this.sdkGamePlayStart();
                this.exitCart();
            }
            if (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP) ||
                this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN) ||
                this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT) ||
                this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)) {
                this.sdkGamePlayStart();
            }
        }
    }

    this.body.setLocalRotation(0, 0, 0, 0);
};

IqTestModePlayerController.prototype.setCart = function (cart) {
    this.cart = cart
    if (this.cart != null) {
        this._animComponent.setBoolean("sitting", true);
        this.app.playerItemManager.closeAll();
    } else {
        this._animComponent.setBoolean("sitting", false);

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.entity.setLocalRotation(0, 0, 0, 0);
        }, 500)
    }
}

IqTestModePlayerController.prototype.exitCart = function (_force = false) {
    if (this.cart != null && (this.cart.leaveable || _force)) {
        this.cart.onExit();
    }
}

IqTestModePlayerController.prototype.destroyCart = function () {
    if (this.cart != null) {
        let cartId = this.cartId;
        this.exitCart();

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.app.iqTestModeCartManager.removeTroll(cartId);
            this.died();
        }, 200)
    }
}

IqTestModePlayerController.prototype.dieOnCart = function () {
    if (this.cart != null) {
        if (!this.cart.leaveable) return;
        this.exitCart();

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.died();
        }, 200)
    }
}

IqTestModePlayerController.prototype.update = function (dt) {
    this.handleRaycast(dt);

    if (this.app.keyboard.wasPressed(pc.KEY_R)) {
        this.app.fire("playerDie");
        return;
    }

    if (this.mapStart && this.mapEnd) {
        let _startPos = this.mapStart.getPosition().clone();
        let _endPos = this.mapEnd.getPosition().clone();
        let _playerPos = this.entity.getPosition().clone();

        let _dist1 = _endPos.sub(_startPos);
        let _dist2 = _playerPos.sub(_startPos);

        let _t = _dist2.dot(_dist1) / _dist1.lengthSq();
        _t = pc.math.clamp(_t, 0, 1);
        let _p = Math.floor(_t * 100);

        this.app.iqTestModeNetworkManager.stagePercentageText.text = _p + "%";
        this.app.iqTestModeNetworkManager.stagePercentagePin.setLocalPosition(_t * 540, -40, 0);
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
IqTestModePlayerController.prototype.sdkGamePlayStart = function () {
    if (this.app.gameplayStarted || this.isDied || this.app.isWatchingAd) return;
    this.app.gameplayStarted = true;
    PokiSDK.gameplayStart();
};
//Only gets y euler angle between -180, 180
IqTestModePlayerController.prototype.getYaw = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

IqTestModePlayerController.prototype.sendPosition = function () {
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
        isInCart: this._animComponent.getBoolean("sitting"),
    });
};

IqTestModePlayerController.prototype.setCamera = function () {
    this.camera = this.app.root.findByName('Camera');
    this.cameraPosEntity = this.entity.findByName('CameraPosition');
    this.cameraParent = this.entity.findByName('Camera Axis');
    this.cameraParent.addChild(this.camera);
    this.camera.setLocalPosition(this.cameraPosEntity.getLocalPosition());
    if (this.app.isMobile) {
        this.cameraScript = this.camera.script.iqTestModeMobileCameraController;
    } else {
        this.cameraScript = this.camera.script.iqTestModeCameraController;
    }
    this.cameraScript.enabled = true;
    this.cameraScript.resetCamera();
    this._frameMovementRight = new pc.Vec3();
    this._frameMovementForward = new pc.Vec3();
    this._frameMovementTotal = new pc.Vec3();
};

IqTestModePlayerController.prototype.died = function () {
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

    this.setFaceSprite(false);
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

IqTestModePlayerController.prototype.respawn = function (vipRespawn = false) {
    this.canDie = false;
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.canDie = true; }, 1000);
    this.body.setRotation(new pc.Quat());

    this.playerRendererEntity.enabled = true;
    this.overHeadGroup.enabled = true;
    this.setFaceSprite(true);
    //this.hats.enabled = true;
    this.isDied = false;
    this.app.isDied = false;
    if (this.spawnedDeadBody)
        this.spawnedDeadBody.destroy();
    //let targetStage = this.networkManager.stagesParent.children[this.app.currentStage];
    this.entity.collision.enabled = true;
    this.entity.rigidbody.type = "dynamic"
    this.teleportToSavedSpawn();

    setTimeout(() => { if (this.entity && !this.entity.script) return; this.resetCameraToSpawn(); }, 100);
    if (this.networkManager.room) {
        if (vipRespawn && this.app.section) {
            //this.entity.rigidbody.teleport(this.app.section);
        } else {
            this.exitCart();
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

/* IqTestModePlayerController.prototype.teleport = function () {
    let checkpoint = 0;
    if (IqTestMode_Utils.getItem("IQTESTMODE_Checkpoint")) {
        checkpoint = IqTestMode_Utils.getItem("IQTESTMODE_Checkpoint")
    }

    //this.lastSavePoint = this.app.root.findByName("Checkpoints").children[checkpoint].children[0];
    this.lastSavePoint = this.app.root.findByName("Checkpoints").children[checkpoint].findByName("SpawnPoint");
    this.entity.rigidbody.teleport(this.lastSavePoint.getPosition());
    this._desiredAngle = this.getYaw(this.lastSavePoint.getRotation());

    //if (this.app.checkpoint == null){return;}
    //this.entity.rigidbody.teleport(this.app.root.findByName("Spawn").getPosition());
}; */

IqTestModePlayerController.prototype.stop = function () {

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

// Spawn'in yerel rotasyonu kamera acisini tutar: x = yatay, y = egim (odaya gore).
// Dunya euler'i kullanilamaz: +-90 derece donuk odalarda yon 100 derece sapik, egim +-70 cikiyordu.
IqTestModePlayerController.prototype.setCameraToSpawn = function (_spawn) {
    const _local = _spawn.getLocalEulerAngles();
    const _roomForward = _spawn.parent.forward;
    const _roomYaw = Math.atan2(-_roomForward.x, -_roomForward.z) * pc.math.RAD_TO_DEG;
    this.app.cameraAdd = 0;
    this.app.fire("Camera:SetEulers", new pc.Vec3((_local.x + _roomYaw + 360) % 360, _local.y, 0));
};

IqTestModePlayerController.prototype.resetCameraToSpawn = function () {
    const _manager = this.app.playerItemManager;
    const _castle = this.app.gameManager && this.app.gameManager.castle;
    if (_manager && _manager.playerData && _castle && _castle.entered) {
        const _test = this.app.root.findByName("Test" + _manager.playerData.testID);
        if (_test) {
            this.setCameraToSpawn(_test.findByName("Spawn"));
            return;
        }
    }
    this.app.cameraAdd = 0;
    this.cameraScript.reset();
};

IqTestModePlayerController.prototype.teleportToSavedSpawn = function (_firstTeleport = false) {
    //console.log("teleportToSavedSpawn");
    //console.log("teleport 1")
    if (this.app.playerItemManager && this.app.playerItemManager.playerData) {
        //console.log("teleport 2")

        if (this.app.gameManager.castle.entered) {
            //console.log("teleport 3")
            let _test = this.app.root.findByName("Test" + this.app.playerItemManager.playerData.testID);
            if (_test) {
                //console.log("teleport 4")
                //console.log("teleporting", _test);
                let _spawn = _test.findByName("Spawn");
                this.entity.rigidbody.teleport(_spawn.getPosition());
                this._desiredAngle = _spawn.getRotation();
                this.setCameraToSpawn(_spawn);

                if (_firstTeleport) {
                    let _backWall = _test.findByName("BackWall");
                    if (_backWall) { _backWall.enabled = true };
                }
            }
        } else {
            //console.log("teleport 5")
            let _spawn = this.app.root.findByName("LobbySpawnPoint");
            this.entity.rigidbody.teleport(_spawn.getPosition());
            this._desiredAngle = _spawn.getRotation();
        }
    } else {
        //console.log("teleport 6")
        let _spawn = this.app.root.findByName("LobbySpawnPoint");
        this.entity.rigidbody.teleport(_spawn.getPosition());
        this._desiredAngle = _spawn.getRotation();
    }
};

IqTestModePlayerController.prototype.teleportToPosition = function (_position, _rotation = null) {
    this.entity.rigidbody.teleport(_position);
    if (_rotation) { this._desiredAngle = _rotation; }
};


IqTestModePlayerController.prototype.resetGame = function () {
    this.networkManager.setCheckpoint(0);
    this.app.fire("resetStage")
    //this.teleport();
}

/* IqTestModePlayerController.prototype.resetGameRebirth = function () {
    this.networkManager.setCheckpoint(0);
    this.app.fire("resetStage")
    this.teleport();
} */

IqTestModePlayerController.prototype.lockCamera = function (state = false) {
    console.log("lockCamera", state)
    if (state) {
        this.cameraScript.removeEventCallbacks();
        this.app.mouse.disablePointerLock();
    } else {
        this.cameraScript.addEventCallbacks();
        this.app.mouse.enablePointerLock();
    }
}

IqTestModePlayerController.prototype.playSlapAnim = function () {
    this.upbodyLayer.transition("Hit" + Math.floor(pc.math.random(0, 2)), 0.1);
    if (this.app.iqTestModeNetworkManager.room) {
        this.app.iqTestModeNetworkManager.room.send("Client:HitAnim")
    }
}

IqTestModePlayerController.prototype.checkPlayers = function (_reachRange, _pushStrength, _cooldown) {
    if (!this.canHit) { return; } else { this.canHit = false; setTimeout(() => { if (this.entity && !this.entity.script) return; this.canHit = true }, 500 * _cooldown); }

    this.app.iqTestModePlayerController.playSlapAnim();
    this.app.gameManager.sfx_swing();

    let hitRange = 3 * _reachRange;
    let pushStrength = 5 * _pushStrength;

    let me = this.entity;
    let myPos = me.getPosition();
    let forward = this.body.forward.clone().normalize().scale(-1);

    let targets = [];

    for (let key in this.app.iqTestModeNetworkManager.playerEntities) {
        if (key === this.app.iqTestModeNetworkManager.room.sessionId) continue;

        let playerEntity = this.app.iqTestModeNetworkManager.playerEntities[key];
        if (!playerEntity) continue;
        //if (!playerEntity.script.iqTestModeOtherPlayerController.attackable) continue;
        if (!playerEntity.script.iqTestModeOtherPlayerController.isInGame) continue;
        if (playerEntity.script.iqTestModeOtherPlayerController.team != null && playerEntity.script.iqTestModeOtherPlayerController.team == this.team) continue;
        //if (playerEntity.script.iqTestModeOtherPlayerController.shield.model.enabled) continue;

        targets.push({
            entity: playerEntity,
            type: "player",
            sessionId: key
        });
    }

    let bees = this.app.root.findByTag("bee");
    for (let i = 0; i < bees.length; i++) {
        let bee = bees[i];

        targets.push({
            entity: bee,
            type: "bee"
        });
    }

    let smashWalls = this.app.root.findByTag("SmashWall");
    for (let i = 0; i < smashWalls.length; i++) {
        let smashWall = smashWalls[i];

        targets.push({
            entity: smashWall,
            type: "smashWall"
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
            this.app.iqTestModeNetworkManager.room.send("Client:HitPlayer", {
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
                    if (target.script && target.script.iqTestModeBee) {
                        target.script.iqTestModeBee.hit(dirToTarget);
                    }
                }
        
                if (targets[i].type === "smashWall") {
                    if (target.script && target.script.iqTestModeSmashWall) {
                        target.script.iqTestModeSmashWall.hit(dirToTarget);
                    }
                } */
    }
    return _hited;
};

IqTestModePlayerController.prototype.getNearestPlayer = function (_position, _ignoreSelf) {
    let nearestPlayer = null;
    let nearestId = null;
    let nearestDistance = Infinity;

    for (let key in this.app.iqTestModeNetworkManager.playerEntities) {

        // kendisini ignore et
        if (_ignoreSelf && key === this.app.iqTestModeNetworkManager.room.sessionId) {
            continue;
        }

        let playerEntity = this.app.iqTestModeNetworkManager.playerEntities[key];
        if (!playerEntity) continue;

        let playerPos = playerEntity.getPosition();
        let distance = _position.distance(playerPos);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestPlayer = playerEntity;
            nearestId = key;
        }
    }

    // tek kişi varsa ve ignoreSelf true ise
    if (_ignoreSelf && !nearestPlayer) {
        return null;
    }

    return {
        entity: nearestPlayer,
        id: nearestId
    };
};



IqTestModePlayerController.prototype.roll = function (state, force, dir) {
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

IqTestModePlayerController.prototype.setFrozen = function (isFrozen) {

    if (isFrozen) { this.entity.savedVelocity = this.entity.rigidbody.linearVelocity.clone().mulScalar(1.2); }
    //console.log(this.entity.savedVelocity)

    this.entity.rigidbody.type = (isFrozen ? "kinematic" : "dynamic");

    if (!isFrozen && this.entity.savedVelocity) {
        this.entity.extraForce = this.entity.savedVelocity;

        clearTimeout(this.rollGetupTimeout);
        this.rollGetupTimeout = setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.roll(false);
        }, 1000);
    }

    this.body.anim.enabled = !isFrozen;
}

IqTestModePlayerController.prototype.setTeam = function (newTeam) {
    this.team = newTeam;

    if (newTeam == null) {
        this.entity.findByName("TeamRed").enabled = false;
        this.entity.findByName("TeamBlue").enabled = false;
    }
    if (newTeam == "red") {
        this.entity.findByName("TeamRed").enabled = true;
        this.entity.findByName("TeamBlue").enabled = false;
    }
    if (newTeam == "blue") {
        this.entity.findByName("TeamRed").enabled = false;
        this.entity.findByName("TeamBlue").enabled = true;
    }
}

IqTestModePlayerController.prototype.setScale = function (_float) {
    this.entity.setLocalScale(_float, _float, _float);
    this.entity.collision.height = 2 * _float
    this.entityScale = _float;
    this._desiredVelocity = new pc.Vec3();
    this.teleportToPosition(this.entity.getLocalPosition().clone().add(new pc.Vec3(0, this.entity.collision.height / 2, 0)));
}


IqTestModePlayerController.prototype.setSkin = function (_int) {
    return;
    if (isNaN(_int) || _int == null || _int < 0) { return; }

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    this.skins[_int].enabled = true;
    this.skin = _int;
    this.setFaceSprite(true);
}

IqTestModePlayerController.prototype.setFaceSprite = function (_visible) {
    this.entity.findByName("LegoFaceSprite").enabled = (_visible && this.skin == IqTestModeItems.SkinLego);
}

IqTestModePlayerController.prototype.setActiveHandItem = function (newHandItem) {
    this.entity.findByName("ItemBox").enabled = newHandItem == "box";
    this.entity.findByName("ItemSphere").enabled = newHandItem == "sphere";
    this.entity.findByName("ItemCone").enabled = newHandItem == "cone";
};



IqTestModePlayerController.prototype.handleRaycast = function (dt) {
    // inside your character controller's update:
    var pos = this.entity.getPosition();
    this._rayEnd = this._rayEnd || new pc.Vec3();
    this._rayEnd.set(pos.x, pos.y - 1.5, pos.z);

    var hit = this.app.systems.rigidbody.raycastFirst(pos, this._rayEnd);
    var sink = 0;

    if (hit && hit.entity.script && hit.entity.script.butterSquish) {
        var butter = hit.entity.script.butterSquish;
        butter.pressAt(hit.point);
        sink = butter.getDisplacementAt(hit.point.x, hit.point.z);
    }

    if (hit && hit.entity.script && hit.entity.script.squishSurface) {
        var butter = hit.entity.script.squishSurface;
        butter.pressAt(hit.point);
        sink = butter.getDisplacementAt(hit.point.x, hit.point.z);
    }

    // in character update, after computing sink:
    if (this._sink === undefined) this._sink = 0;
    this._sink += (sink - this._sink) * (1 - Math.exp(-12 * dt));
    this.body.setLocalPosition(0, (-this._sink / 2) + (-1), 0);
}
