var KnockoutModePlayerController = pc.createScript('knockoutModePlayerController');

KnockoutModePlayerController.attributes.add("username", { type: "entity" });
KnockoutModePlayerController.attributes.add("body", { type: "entity" });
KnockoutModePlayerController.attributes.add("moveSpeed", { type: "number", default: 6 });
KnockoutModePlayerController.attributes.add("slideModeGravity", { type: "number", default: 6 });
KnockoutModePlayerController.attributes.add("moveSpeedBoat", { type: "number", default: 6 });
KnockoutModePlayerController.attributes.add("jumpHeight", { type: "number", default: 13 });
KnockoutModePlayerController.attributes.add("rotateSpeed", { type: "number", default: 5 });
KnockoutModePlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

KnockoutModePlayerController.prototype.initialize = function () {
    this.app.knockoutModePlayerController = this;

    this.entity.isLocal = true;
    this.lastValue = 0;
    this.cart = null;
    this.boatSpeedMul = 1;
    this.isDied = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.knockoutModeNetworkManager;
    //this.inventoryController = this.entity.script.riverObbyPlayerInventoryController;
    this.playerRendererEntity = this.body.findByName("Skin");
    this.faceSprite = this.body.findByName("FaceSprite");
    this.bodyRig = this.body.findByName("BodyRig");
    this.bodyRotation = new pc.Quat();
    this.bodyRigRotation = new pc.Quat();
    this.bodyRigDefaultRotation = new pc.Quat().setFromEulerAngles(90, 0, -90);
    this.upbodyLayer = this.body.anim.findAnimationLayer('UpBody');
    //this.hats = this.body.findByName("hats");
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
    this._animComponent = this.entity.findByName("Armature").anim;
    this.sendPositionInterval = setInterval(this.sendPosition.bind(this), 100);
    this.rayPoint = this.entity.findByName("RayPoint");
    this.rayGround = this.entity.findByName("RayGround");
    this.respawn();
    this.isRolling = false;
    this.attackable = true;
    this.canHit = true;
    this.mapStart = this.app.root.findByName("MapStart");
    this.mapEnd = this.app.root.findByName("MapEnd");
    this.hovers = this.entity.findByName("Hovers");
    this.entityScale = 1;

    this.skins = [];
    this.skins[KnockoutModeItems.PenguinDefault] = this.entity.findByName("PenguinDefault");
    this.skins[KnockoutModeItems.PenguinFemale] = this.entity.findByName("PenguinFemale");
    this.skins[KnockoutModeItems.PenguinBinted] = this.entity.findByName("PenguinBinted");
    this.skins[KnockoutModeItems.PenguinPimp] = this.entity.findByName("PenguinPimp");

    this.winCountText = this.entity.findByName("WinCountTextOnHead");
    this.winCounterGroup = this.entity.findByName("WinCounterGroup");

    this.winCounterGroup.enabled = false;

    body = this.entity.rigidbody.body;
    body.setCcdMotionThreshold(0.5);
    body.setCcdSweptSphereRadius(0.3);

    this.app.hp = {
        current: 3,
        max: 3,
        reset: () => {
            this.app.hp.current = this.app.hp.max;
            this.app.hp.updateUI();
        },

        damage: (_damage = 1) => {
            this.app.hp.current = Math.max(this.app.hp.current - _damage, 0);
            if (this.app.hp.current <= 0) {
                this.app.fire("playerDie");
                this.app.hp.reset();
            }

            this.app.knockoutModeNetworkManager.lowHPEffectMethod();

            this.app.hp.updateUI();

            //console.log("damage", _damage, this.app.hp.current)
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
            this.app.knockoutModeCartManager.destroyCart(0);
        }
    }, this); this.on('destroy', () => handle.off()); }

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
    this.app.on("getOutCart", this.exitCart, this)

    this.on('destroy', function () {
        clearInterval(this.sendPositionInterval);
        this.app.off("lockCamera", this.lockCamera, this);
        this.app.off("buyBoat");
        this.app.off("loadSkin");
        this.app.off("resetGame");
        this.app.off("toggleItem");
        this.app.off("playerDie");
        this.app.off("getOutCart");
        this.app.off("playerDamage");
    }, this);


    { const handle = this.app.on("scaleUp", this.scaleUp, this); this.on('destroy', () => handle.off()); }
    { const handle = this.app.on("scaleDown", this.scaleDown, this); this.on('destroy', () => handle.off()); }
};

KnockoutModePlayerController.prototype.stopMovement = function () {
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

KnockoutModePlayerController.prototype.adjustLinearVelocity = function (scalar, delay) {
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.add(this._desiredVelocity.clone().mulScalar(scalar));

        // Check and limit the linear velocity
        if (this.entity.rigidbody.linearVelocity.length() > this.maxLinearVelocity * this.boatSpeedMul) {
            this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.normalize().scale(this.maxLinearVelocity * this.boatSpeedMul);
        }
    }, delay);
};


KnockoutModePlayerController.prototype.playerController = function (dt) {
    this._direction.set(0, 0, 0);
    this._requestedJump = false;
    this._carpetVelocity.set(0, 0, 0);
    //console.log(this.app.keyboard.isPressed(pc.KEY_W));

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;
    canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && !this.app.isPopupEnabled && !this.app.inCannon && !this.app.onMigato;
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
            //if (this.entity.jumpPlatform || (this._requestedJump && this._timeSinceLastGrounded <= 0.3 && !this._jumped) && !this.app.playerItemManager.jetpack.enabled && !this.app.playerPush.active && this.app.playerBounce.curve <= 0) {
            if (this.entity.jumpPlatform || (this._requestedJump && this._timeSinceLastGrounded <= 0.3 && !this._jumped) && !this.app.playerPush.active && this.app.playerBounce.curve <= 0) {
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
            //if (!this.entity.isBallon && !this.app.playerItemManager.jetpack.using) {
            if (!this.entity.isBallon) {
                this._desiredVelocity.set(this._desiredVelocity.x, this._desiredVelocity.y - 30 * dt, this._desiredVelocity.z);
            }
        }

        this.entity.rigidbody.linearVelocity = this._desiredVelocity;

        if (this._direction.x != 0 || this._direction.y != 0 || this._direction.z != 0) {
            this._animComponent.setBoolean("walk", true);
        } else {
            this._animComponent.setBoolean("walk", false);
        }

        /*         if (this.app.playerItemManager.flyingCarpet.enabled) {
                    //this._carpetVelocity;
                    let scaler = 15
                    this._carpetVelocity.set(this._carpetVelocity.x * scaler, this._carpetVelocity.y * scaler + dt * 19.6, this._carpetVelocity.z * scaler)
                    this.entity.rigidbody.linearVelocity = this._carpetVelocity;
                } */

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


    /*     if (this.app.playerItemManager.flyingCarpet.enabled) {
            this._animComponent.setBoolean("isInAir", false);
            this._animComponent.setBoolean("walk", false);
            this._animComponent.setBoolean("isClimbing", false);
            this._animComponent.setBoolean("isOnLadder", false);
            //this._animComponent.setBoolean("sitting", false);
    
        } */
};

KnockoutModePlayerController.prototype.slideModeController = function (dt) {
    this._direction.set(0, 0, 0);
    this._requestedJump = false;

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;
    canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false;
    if (canMove) {
        joystick = window.touchJoypad.sticks['joystick0'];
        if (this.app.isMobile) {
            if (joystick.x != 0) {
                this.sdkGamePlayStart();
            }
            if (joystick.y != 0) {
                this.sdkGamePlayStart();
            }
        } else {
            if (this.app.keyboard.isPressed(pc.KEY_SPACE)) {
                this._requestedJump = true;
                this.sdkGamePlayStart();

            }

            if (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP) ||
                this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN) ||
                this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT) ||
                this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)) {
                this.sdkGamePlayStart();
            }
        }
    }

    // forward -> camera forward
    if (this.app.gameManager.aim.rotatePlayer) {
        let forward = this.camera.forward.clone();
        forward.y = 0;
        forward.normalize();
        let yaw = Math.atan2(forward.x, forward.z) * pc.math.RAD_TO_DEG;
        this.body.setEulerAngles(0, yaw, 0);
    };

    if (this.app.gameManager.state.state == "intro") {
        let targetPos = this.app.root.findByName("CenterPoint").getPosition();
        let currentPos = this.entity.getPosition();
        let dir = targetPos.clone().sub(currentPos);
        let angle = Math.atan2(dir.x, dir.z) * pc.math.RAD_TO_DEG;
        this.body.setEulerAngles(0, angle, 0);
    };

    this._desiredVelocity.set(this._desiredVelocity.x, this._desiredVelocity.y - this.slideModeGravity * dt, this._desiredVelocity.z);
    this.entity.rigidbody.linearVelocity = this._desiredVelocity;

    let friction = 15;
    let decay = friction * dt;

    let speed = this._desiredVelocity.length();

    if (speed > 0) {
        let newSpeed = Math.max(speed - decay, 0);
        this._desiredVelocity.normalize().scale(newSpeed);
    }

    this.grounded = true;


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
                break; // Exit the loop if grounded
            }
        }
    }


    this._animComponent.setBoolean("isInAir", !this.grounded);
    this._animComponent.setBoolean("walk", false);
};

KnockoutModePlayerController.prototype.shoot = function (_power = 1) {
    //this.entity.rigidbody.enabled = true;
    this.entity.rigidbody.type = "dynamic";

    let forward = this.body.forward.clone();
    forward.y = 0;
    forward.normalize();

    let speed = (this.app.gameManager.maxSlidePower) * _power;
    this._desiredVelocity = forward.scale(-speed);
};

KnockoutModePlayerController.prototype.push = function (_direction, _force) {
    //this.entity.rigidbody.enabled = true;
    //this.entity.rigidbody.type = "dynamic";

    this._desiredVelocity = _direction.scale(_force);
};

KnockoutModePlayerController.prototype.stop = function () {

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



KnockoutModePlayerController.prototype.cartController = function (dt) {
    this._direction.set(0, 0, 0);
    this._requestedJump = false;

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;
    canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false;
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

KnockoutModePlayerController.prototype.setCart = function (cart) {
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

KnockoutModePlayerController.prototype.exitCart = function (_force = false) {
    if (this.cart != null && (this.cart.leaveable || _force)) {
        this.cart.onExit();
    }
}

KnockoutModePlayerController.prototype.destroyCart = function () {
    if (this.cart != null) {
        let cartId = this.cartId;
        this.exitCart();

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.app.knockoutModeCartManager.removeTroll(cartId);
            this.died();
        }, 200)
    }
}

KnockoutModePlayerController.prototype.dieOnCart = function () {
    if (this.cart != null) {
        if (!this.cart.leaveable) return;
        this.exitCart();

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.died();
        }, 200)
    }
}

KnockoutModePlayerController.prototype.update = function (dt) {
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

        this.app.knockoutModeNetworkManager.stagePercentageText.text = _p + "%";
        this.app.knockoutModeNetworkManager.stagePercentagePin.setLocalPosition(_t * 540, -40, 0);
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

    if (this.app.gameManager.isSlideMode) {
        this.slideModeController(dt);
    } else {
        this.playerController(dt);
    }


    if (this.entity.getPosition().y < -3 && !this.isDied) {
        this.app.gameManager.sfx_waterSplash();
        this.app.knockoutModeNetworkManager.send("Client:RemoteWaterSplash");
        this.died();
    }
};

KnockoutModePlayerController.prototype.sdkGamePlayStart = function () {
    if (this.app.gameplayStarted || this.isDied || this.app.isWatchingAd) return;
    this.app.gameplayStarted = true;
    PokiSDK.gameplayStart();
};
//Only gets y euler angle between -180, 180
KnockoutModePlayerController.prototype.getYaw = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

KnockoutModePlayerController.prototype.sendPosition = function () {
    if (this.networkManager.room == null || this.networkManager.room.connection.isOpen === false) return;

    let _rotX = this.body.getEulerAngles().x;
    let _rotY = this.body.getEulerAngles().y;
    let _rotZ = this.body.getEulerAngles().z;

    this.networkManager.room.send("Client:Movement", {
        x: this.entity.getPosition().x,
        y: this.entity.getPosition().y,
        z: this.entity.getPosition().z,

        rotationX: _rotX,
        rotationY: _rotY,
        rotationZ: _rotZ,

        grounded: this.grounded,
        isWalking: this._animComponent.getBoolean("walk"),
        isClimbing: this._animComponent.getBoolean("isClimbing"),
        isOnLadder: this._animComponent.getBoolean("isOnLadder"),
        isSitting: this._animComponent.getBoolean("sitting"),
    });
};

KnockoutModePlayerController.prototype.setCamera = function () {
    this.camera = this.app.root.findByName('Camera');
    this.cameraPosEntity = this.entity.findByName('CameraPosition');
    this.cameraParent = this.entity.findByName('Camera Axis');
    this.cameraParent.addChild(this.camera);
    this.camera.setLocalPosition(this.cameraPosEntity.getLocalPosition());
    if (this.app.isMobile) {
        this.cameraScript = this.camera.script.knockoutModeMobileCameraController;
    } else {
        this.cameraScript = this.camera.script.knockoutModeCameraController;
    }
    this.cameraScript.enabled = true;
    this.cameraScript.resetCamera();
    this._frameMovementRight = new pc.Vec3();
    this._frameMovementForward = new pc.Vec3();
    this._frameMovementTotal = new pc.Vec3();
};

KnockoutModePlayerController.prototype.died = function () {
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

    let deadPlayerEntityBody = null;
    switch (this.app.playerItemManager.skins.current) {
        case KnockoutModeItems.PenguinDefault: deadPlayerEntityBody = deadPlayerEntity.children[0]; break;
        case KnockoutModeItems.PenguinFemale: deadPlayerEntityBody = deadPlayerEntity.children[1]; break;
        case KnockoutModeItems.PenguinBinted: deadPlayerEntityBody = deadPlayerEntity.children[2]; break;
        case KnockoutModeItems.PenguinPimp: deadPlayerEntityBody = deadPlayerEntity.children[3]; break;
    }

    if (deadPlayerEntityBody == null) { return; }

    this.playerRendererEntity.enabled = false;
    deadPlayerEntityBody.enabled = true;
    for (let i = 0; i < deadPlayerEntityBody.children.length; i++) {
        deadPlayerEntityBody.children[i].rigidbody.applyImpulse(this.body.forward.scale(-pc.math.random(0, 1)));
    }
    this.spawnedDeadBody = deadPlayerEntity;
    this.isDied = true;
    this.app.isDied = true;

    this.faceSprite.enabled = false;
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

KnockoutModePlayerController.prototype.respawn = function (vipRespawn = false) {
    this.canDie = false;
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.canDie = true; }, 1000);
    this.body.setRotation(new pc.Quat());

    this.playerRendererEntity.enabled = true;
    this.faceSprite.enabled = true;
    //this.hats.enabled = true;
    this.isDied = false;
    this.app.isDied = false;
    if (this.spawnedDeadBody)
        this.spawnedDeadBody.destroy();
    //let targetStage = this.networkManager.stagesParent.children[this.app.currentStage];
    this.entity.collision.enabled = true;
    this.entity.rigidbody.type = "dynamic"
    this.teleport();

    setTimeout(() => { if (this.entity && !this.entity.script) return; this.cameraScript.reset(); }, 100);
    if (this.networkManager.room) {
        if (vipRespawn && this.app.section) {
            this.entity.rigidbody.teleport(this.app.section);
        } else {
            this.exitCart();
        }
        this.networkManager.room.send("Client:Respawn");
    } else {
        if (vipRespawn && this.app.section) {
            this.entity.rigidbody.teleport(this.app.section);
        } else {

        }
    }
    this.lockCamera(false);

    this.app.fire("Respawned");
};

KnockoutModePlayerController.prototype.teleport = function () {
    let spawn = this.app.root.findByName("LobbySpawnPoint");
    //let spawn = this.app.root.findByName("LobbySpawnPoints").children[this.app.gameManager.getMyIndex()];

    this.entity.rigidbody.teleport(spawn.getPosition());
    this._desiredAngle = spawn.getRotation();

};

KnockoutModePlayerController.prototype.teleportToPosition = function (_position, _rotation = null) {

    //this.lastSavePoint = this.app.root.findByName("Checkpoints").children[checkpoint].findByName("SpawnPoint");
    this.entity.rigidbody.teleport(_position);
    if (_rotation) {
        this._desiredAngle = _rotation;
    }

};

KnockoutModePlayerController.prototype.resetGame = function () {
    this.networkManager.setCheckpoint(0);
    this.app.fire("resetStage")
    this.teleport();
}

/* KnockoutModePlayerController.prototype.resetGameRebirth = function () {
    this.networkManager.setCheckpoint(0);
    this.app.fire("resetStage")
    this.teleport();
} */

KnockoutModePlayerController.prototype.lockCamera = function (state = false) {
    console.log("lockCamera", state)
    if (state) {
        this.cameraScript.removeEventCallbacks();
        this.app.mouse.disablePointerLock();
    } else {
        this.cameraScript.addEventCallbacks();
        this.app.mouse.enablePointerLock();
    }
}

KnockoutModePlayerController.prototype.playSlapAnim = function () {
    this.upbodyLayer.transition("Hit" + Math.floor(pc.math.random(0, 2)), 0.1);
    if (this.app.knockoutModeNetworkManager.room) {
        this.app.knockoutModeNetworkManager.room.send("Client:HitAnim")
    }
}

KnockoutModePlayerController.prototype.checkPlayers = function (_reachRange, _pushStrength, _cooldown) {
    if (!this.canHit) { return; } else { this.canHit = false; setTimeout(() => { if (this.entity && !this.entity.script) return; this.canHit = true }, 500 * _cooldown); }

    let hitRange = 3 * _reachRange;
    let pushStrength = 5 * _pushStrength;

    let me = this.entity;
    let myPos = me.getPosition();
    let forward = this.body.forward.clone().normalize().scale(-1);


    let targets = [];

    for (let key in this.app.knockoutModeNetworkManager.playerEntities) {
        if (key === this.app.knockoutModeNetworkManager.room.sessionId) continue;

        let playerEntity = this.app.knockoutModeNetworkManager.playerEntities[key];
        if (!playerEntity) continue;
        if (!playerEntity.script.knockoutModeOtherPlayerController.attackable) continue;

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
            this.app.knockoutModeNetworkManager.room.send("Client:HitPlayer", {
                targetSessionId: targets[i].sessionId,
                forceX: basePush.x,
                forceY: basePush.y,
                forceZ: basePush.z,
                dirX: dirToTarget.x,
                dirY: dirToTarget.y,
                dirZ: dirToTarget.z,
            });
        }

        if (targets[i].type === "bee") {
            if (target.script && target.script.knockoutModeBee) {
                target.script.knockoutModeBee.hit(dirToTarget);
            }
        }
    }
};

KnockoutModePlayerController.prototype.getNearestPlayer = function (_position, _ignoreSelf) {
    let nearestPlayer = null;
    let nearestId = null;
    let nearestDistance = Infinity;

    for (let key in this.app.knockoutModeNetworkManager.playerEntities) {

        // kendisini ignore et
        if (_ignoreSelf && key === this.app.knockoutModeNetworkManager.room.sessionId) {
            continue;
        }

        let playerEntity = this.app.knockoutModeNetworkManager.playerEntities[key];
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



KnockoutModePlayerController.prototype.roll = function (state, force, dir) {
    /*     this.isRolling = state;
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
        } */
}

KnockoutModePlayerController.prototype.setFrozen = function (isFrozen) {

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


KnockoutModePlayerController.prototype.setHoverVisible = function (_visible) {

    if (!_visible) {
        this.hovers.children.forEach(child => {
            child.enabled = false;
        });
        return;
    }

    this.hovers.children.forEach(child => {
        child.enabled = false;
    });

    if (this.hovers.children.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.hovers.children.length);
        this.hovers.children[randomIndex].enabled = true;
    }
};


KnockoutModePlayerController.prototype.setShootIndex = function (_index) {
    if (_index != null) {
        this.entity.findByName("Queue").enabled = true;
        this.entity.findByName("Queue").element.text = _index;
    } else {
        this.entity.findByName("Queue").enabled = false;
    }
};

KnockoutModePlayerController.prototype.setIsShootingNow = function (_boolean) {
    if (_boolean != null) {
        this.entity.findByName("Queue").element.color = (_boolean ? new pc.Color(0, 255, 0) : new pc.Color(1, 1, 1));
    }
};

KnockoutModePlayerController.prototype.setScale = function (_float) {
    this.entity.setLocalScale(_float, _float, _float);
    this.entity.collision.height = 2 * _float
    this.entityScale = _float;
    this._desiredVelocity = new pc.Vec3();
    this.teleportToPosition(this.entity.getLocalPosition().clone().add(new pc.Vec3(0, this.entity.collision.height / 2, 0)));
}

KnockoutModePlayerController.prototype.setSkin = function (_int) {
    if (isNaN(_int) || _int == null || _int < 0) { return; }

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    switch (_int) {
        case KnockoutModeItems.PenguinDefault:
            this.skins[KnockoutModeItems.PenguinDefault].enabled = true;
            break;

        case KnockoutModeItems.PenguinFemale:
            this.skins[KnockoutModeItems.PenguinFemale].enabled = true;
            break;

        case KnockoutModeItems.PenguinBinted:
            this.skins[KnockoutModeItems.PenguinBinted].enabled = true;
            break;

        case KnockoutModeItems.PenguinPimp:
            this.skins[KnockoutModeItems.PenguinPimp].enabled = true;
            break;
    }
}

KnockoutModePlayerController.prototype.scaleUp = function () {
    this.setScale(3);
}
KnockoutModePlayerController.prototype.scaleDown = function () {
    this.setScale(1);
}


