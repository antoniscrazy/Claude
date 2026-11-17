var CartObbyPlayerController = pc.createScript('cartObbyPlayerController');

CartObbyPlayerController.attributes.add("username", { type: "entity" });
CartObbyPlayerController.attributes.add("body", { type: "entity" });
CartObbyPlayerController.attributes.add("moveSpeed", { type: "number", default: 6 });
CartObbyPlayerController.attributes.add("moveSpeedBoat", { type: "number", default: 6 });
CartObbyPlayerController.attributes.add("jumpHeight", { type: "number", default: 13 });
CartObbyPlayerController.attributes.add("rotateSpeed", { type: "number", default: 5 });
CartObbyPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

CartObbyPlayerController.prototype.initialize = function () {
    this.app.cartObbyPlayerController = this;

    this.entity.isLocal = true;
    this.boatSpeedAdjustments = [
        { scalar: 1 / 10, delay: 200 },
        { scalar: 1 / 8, delay: 400 },
        { scalar: 1 / 5, delay: 600 }
    ];
    this.lastCart = null;
    this.diedOnCart = false;
    this.lastValue = 0;
    this.cart = null;
    this.boatSpeedMul = 1;
    this.isDied = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;
    //this.inventoryController = this.entity.script.riverObbyPlayerInventoryController;
    this.playerRendererEntity = this.body.findByName("N00b7.001");
    this.faceSprite = this.body.findByName("FaceSprite");
    this.hats = this.body.findByName("hats");
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
    this.respawn();

    this._animComponent.on("step1", () => {
        const rand = Math.floor(Math.random() * 2) + 1;

        this.entity.sound.play("footstep" + rand);
    });
    this._animComponent.on("step2", () => {
        const rand = Math.floor(Math.random() * 2) + 1;

        this.entity.sound.play("footstep" + rand);
    });

    this.app.on("lockCamera", this.lockCamera, this);
    this.app.on("playerDie", () => {
        console.log("this.app.inCart", this.app.inCart);
        if (this.app.inCart) { this.dieOnCart(); }
        else { this.died(); }

    }, this);

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

    this.on('destroy', function () {
        clearInterval(this.sendPositionInterval);
        this.app.off("lockCamera", this.lockCamera, this);
        this.app.off("buyBoat");
        this.app.off("loadSkin");
        this.app.off("resetGame");
        this.app.off("toggleItem");
        this.app.off("playerDie");
        this.app.off("teleportToCheckpoint");
    }, this);

    this.app.on("resetGame", this.resetGame, this);
    this.app.on("teleportToCheckpoint", this.teleport, this);
    { const handle = this.app.on("portalTeleport", this.portalTeleport, this); this.on('destroy', () => handle.off()); }
};

CartObbyPlayerController.prototype.stopMovement = function () {
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

CartObbyPlayerController.prototype.adjustLinearVelocity = function (scalar, delay) {
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.add(this._desiredVelocity.clone().mulScalar(scalar));

        // Check and limit the linear velocity
        if (this.entity.rigidbody.linearVelocity.length() > this.maxLinearVelocity * this.boatSpeedMul) {
            this.entity.rigidbody.linearVelocity = this.entity.rigidbody.linearVelocity.normalize().scale(this.maxLinearVelocity * this.boatSpeedMul);
        }
    }, delay);
};


CartObbyPlayerController.prototype.boatController = function (dt) {
    this._direction.set(0, 0, 0);
    canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false;
    if (canMove) {
        joystick = window.touchJoypad.sticks['joystick0'];
        if (this.app.isMobile) {
            if (joystick.y > 0) {
                this._direction.add(this.camera.forward);
                this.sdkGamePlayStart();
            } else if (joystick.y < 0) {
                this._direction.add(this.camera.forward.mulScalar(-1));
                this.sdkGamePlayStart();
            }
            if (joystick.x > 0) {
                this._direction.add(this.camera.right);
                this.sdkGamePlayStart();
            } else if (joystick.x < 0) {
                this._direction.add(this.camera.right.mulScalar(-1));
                this.sdkGamePlayStart();
            }
            if (window.touchJoypad.buttons.wasPressed('jumpButton')) {
                this.sdkGamePlayStart();
                this._requestedJump = true;
            }
        } else {
            if (this.app.keyboard.isPressed(pc.KEY_SPACE)) {
                this._requestedJump = true;
                this.sdkGamePlayStart();
            }
            if (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)) {
                this._direction.add(this.camera.forward);
                this.sdkGamePlayStart();
            }
            else if (this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN)) {
                this._direction.sub(this.camera.forward);
                this.sdkGamePlayStart();
            }
            if (this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT)) {
                this._direction.sub(this.camera.right);
                this.sdkGamePlayStart();

            } if (this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)) {
                this._direction.add(this.camera.right);
                this.sdkGamePlayStart();
            }
        }
    }

    this._direction.y = 0;

    let targetQuat;
    if (this.boatRayNormalRot.getEulerAngles().x > 0) {
        if (this.hitSomethingFront) {
            targetQuat = new pc.Quat().setFromEulerAngles(this.boatRayNormalRot.getEulerAngles().x - 90, this._desiredAngle, 0);
        } else {
            targetQuat = new pc.Quat().setFromEulerAngles(90 - this.boatRayNormalRot.getEulerAngles().x, this._desiredAngle, 0);
        }
    } else if (this.boatRayNormalRot.getEulerAngles().x < 0) {
        targetQuat = new pc.Quat().setFromEulerAngles(this.boatRayNormalRot.getEulerAngles().x + 90, this._desiredAngle, 0);
    } else {
        targetQuat = new pc.Quat().setFromEulerAngles(this.boatRayNormalRot.getEulerAngles().x, this._desiredAngle, 0);
    }

    this._quatLerp = new pc.Quat().slerp(this._quatLerp, targetQuat, this.rotateSpeed * dt);
    this.body.setRotation(this._quatLerp);
    this.rayPoint.setRotation(new pc.Quat().setFromEulerAngles(0, this._desiredAngle, 0));

    this._desiredVelocity.y += this.entity.rigidbody.linearVelocity.y;
    const velocityDotNormal = this._desiredVelocity.clone().normalize().dot(this._contactNormal);
    if (velocityDotNormal > 0 && !this._jumped) {
        this._desiredVelocity.sub(this._contactNormal.clone().mulScalar(velocityDotNormal * this._desiredVelocity.length()));
    }

    //extra gravity
    this._desiredVelocity.set(this._desiredVelocity.x, this._desiredVelocity.y - 30 * dt, this._desiredVelocity.z);
};

CartObbyPlayerController.prototype.playerController = function (dt) {
    this._direction.set(0, 0, 0);
    this._requestedJump = false;
    this._carpetVelocity.set(0, 0, 0);

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;
    canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false;
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

        const rayStart = this.entity.getPosition().clone();
        const rayEnd = rayStart.clone().sub(new pc.Vec3(0, 1.5, 0));

        const _rayResults = [
            this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd),
            this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(0.5, 0, 0.5))),
            this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(0.5, 0, -0.5))),
            this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(-0.5, 0, 0.5))),
            this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(-0.5, 0, -0.5)))
        ];

        this.grounded = false;

        for (const result of _rayResults) {
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

    this._desiredVelocity = this._direction.normalize().clone().mulScalar(this.moveSpeed);
    if (this._desiredVelocity.length() > 0) {
        this._desiredAngle = Math.atan2(this._direction.x, this._direction.z) * pc.math.RAD_TO_DEG;
        const targetQuat = new pc.Quat().setFromEulerAngles(0, this._desiredAngle, 0);
        this._quatLerp = new pc.Quat().slerp(this._quatLerp, targetQuat, this.rotateSpeed * dt);
        this.body.setRotation(this._quatLerp);
        this.rayPoint.setRotation(new pc.Quat().setFromEulerAngles(0, this._desiredAngle, 0));
    }

    this._desiredVelocity.y += this.entity.rigidbody.linearVelocity.y;
    const velocityDotNormal = this._desiredVelocity.clone().normalize().dot(this._contactNormal);
    if (velocityDotNormal > 0 && !this._jumped) {
        this._desiredVelocity.sub(this._contactNormal.clone().mulScalar(velocityDotNormal * this._desiredVelocity.length()));
    }

    if (this.isClimbingLadder == true) {
        if (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP) || (this.app.isMobile && joystick.y > 0)) {
            const temp = this.body.up.mulScalar(15);
            this._desiredVelocity.set(this._desiredVelocity.x, 0, this._desiredVelocity.z);
            this._desiredVelocity.add(temp);
            this._desiredVelocity = this._desiredVelocity.normalize().mulScalar(6);
            this._animComponent.setBoolean("isClimbing", true);
        } else {
            this._desiredVelocity.set(this._desiredVelocity.x, 0, this._desiredVelocity.z);
            this._animComponent.setBoolean("isClimbing", false);
        }

        if (this._requestedJump) {
            const temp = this.body.up.clone().add(this.body.forward.mulScalar(4));
            this._desiredVelocity.add(temp.normalize().mulScalar(this.jumpHeight));
        }
    } else {
        //jump
        if (this.entity.jumpPlatform || (this._requestedJump && this._timeSinceLastGrounded <= 0.3 && !this._jumped) && !this.app.playerPowerUp.jetpack.enabled) {
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
        if (!this.entity.isBallon && !this.app.playerPowerUp.jetpack.using) {
            this._desiredVelocity.set(this._desiredVelocity.x, this._desiredVelocity.y - 30 * dt, this._desiredVelocity.z);
        }
    }

    //this.entity.rigidbody.linearVelocity = this._desiredVelocity;

    if (this._direction.x != 0 || this._direction.y != 0 || this._direction.z != 0) {
        this._animComponent.setBoolean("walk", true);
    } else {
        this._animComponent.setBoolean("walk", false);
    }



    if (!this.app.playerPowerUp.flyingCarpet.enabled) {
        this.entity.rigidbody.linearVelocity = this._desiredVelocity;
    }
    else {
        //this._carpetVelocity;
        let scaler = 15
        this._carpetVelocity.set(this._carpetVelocity.x * scaler, this._carpetVelocity.y * scaler + dt * 19.6, this._carpetVelocity.z * scaler)
        this.entity.rigidbody.linearVelocity = this._carpetVelocity;
    }

    if (this._direction.x != 0 || this._direction.y != 0 || this._direction.z != 0) {
        this._animComponent.setBoolean("walk", true);
    } else {
        this._animComponent.setBoolean("walk", false);
    }


    if (this.app.playerPowerUp.flyingCarpet.enabled) {
        this._animComponent.setBoolean("isInAir", false);
        this._animComponent.setBoolean("walk", false);
        this._animComponent.setBoolean("isClimbing", false);
        this._animComponent.setBoolean("isOnLadder", false);
        this._animComponent.setBoolean("isSitting", false);

    }
};

CartObbyPlayerController.prototype.cartController = function (dt) {
    this._direction.set(0, 0, 0);
    this._requestedJump = false;

    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;
    canMove = this.app.isWatchingAd == false && this.isDied == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false;
    if (canMove) {
        joystick = window.touchJoypad.sticks['joystick0'];
        if (this.app.isMobile) {
            if (joystick.y > 0) {
                this._direction.add(this.camera.forward);
                this.sdkGamePlayStart();
            } else if (joystick.y < 0) {
                this._direction.add(this.camera.forward.mulScalar(-1));
                this.sdkGamePlayStart();
            }
            if (joystick.x > 0) {
                this._direction.add(this.camera.right);
                this.sdkGamePlayStart();
            } else if (joystick.x < 0) {
                this._direction.add(this.camera.right.mulScalar(-1));
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
            if (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)) {
                this._direction.add(this.camera.forward);
                this.sdkGamePlayStart();

            }
            else if (this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN)) {
                this._direction.sub(this.camera.forward);
                this.sdkGamePlayStart();
            }
            if (this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT)) {
                this._direction.sub(this.camera.right);
                this.sdkGamePlayStart();

            } if (this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)) {
                this._direction.add(this.camera.right);
                this.sdkGamePlayStart();
            }
        }

        this._direction.y = 0;

        this._desiredVelocity = this._direction.normalize().clone().mulScalar(this.moveSpeed);

        this.grounded = true;
        this._animComponent.setBoolean("isInAir", false);
        this._animComponent.setBoolean("walk", false);
        this._timeSinceLastGrounded = 0;
        this._jumped = false;
    }

    this.body.setLocalRotation(0, 0, 0, 0);
};

CartObbyPlayerController.prototype.setCart = function (cart) {
    this.cart = cart
    if (this.cart != null) {
        this._animComponent.setBoolean("isSitting", true);
        this.app.playerPowerUp.closeAll();
    } else {
        this._animComponent.setBoolean("isSitting", false);

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.entity.setLocalRotation(0, 0, 0, 0);
        }, 500)
    }
}

CartObbyPlayerController.prototype.exitCart = function (_force = false) {
    if (this.cart != null && (this.cart.leaveable || _force)) {
        this.lastCart = this.cart;
        this.cart.onExit();
    }
}

CartObbyPlayerController.prototype.destroyCart = function () {
    if (this.cart != null) {
        let cartId = this.cartId;
        this.diedOnCart = this.app.inCart;
        this.lastValue = this.cart.lastValue;
        this.exitCart();
        this.lastCart = null;

        console.log("player controller destroycart")

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.app.cartObbyCartManager.removeCart(cartId);
            this.died();
        }, 200)
    }
}

CartObbyPlayerController.prototype.dieOnCart = function () {
    if (this.cart != null) {
        if (!this.cart.leaveable) return;
        this.diedOnCart = true;
        this.lastValue = this.cart.lastValue;
        console.log(this.lastValue);
        this.exitCart();

        setTimeout(() => { if (this.entity && !this.entity.script) return; this.died(); }, 200)
    } else {
        this.died();
    }
}

CartObbyPlayerController.prototype.update = function (dt) {
    if (this.app.keyboard.wasPressed(pc.KEY_R)) {
        this.dieOnCart();
        return;
    }

    /*     if (this.app.keyboard.isPressed(pc.KEY_B)) {
            this.entity.rigidbody.teleport(this.app.root.findByName("DebugPosition").getPosition().clone())
        }
    
        if (this.app.keyboard.isPressed(pc.KEY_X)) {
            this.entity.rigidbody.teleport(this.app.root.findByName("CuvanDebug").getPosition().clone())
        } */

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

    if (this.cart != null) {
        this.cartController(dt)
    } else {
        this.playerController(dt);
    }

    if (this.entity.getPosition().y < -350) {
        this.died();
    }
};
CartObbyPlayerController.prototype.sdkGamePlayStart = function () {
    if (this.app.gameplayStarted || this.isDied || this.app.isWatchingAd) return;
    this.app.gameplayStarted = true;
    PokiSDK.gameplayStart();
};
//Only gets y euler angle between -180, 180
CartObbyPlayerController.prototype.getYaw = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

CartObbyPlayerController.prototype.sendPosition = function () {
    if (this.networkManager.room == null || this.networkManager.room.connection.isOpen === false) return;
    this.networkManager.room.send("Client:Movement", {
        x: this.entity.getPosition().x,
        y: this.entity.getPosition().y,
        z: this.entity.getPosition().z,
        rotationY: this.getYaw(this.body.getRotation()),
        grounded: this.grounded,
        isWalking: this._animComponent.getBoolean("walk"),
        isClimbing: this._animComponent.getBoolean("isClimbing"),
        isOnLadder: this._animComponent.getBoolean("isOnLadder"),
        isInCart: this._animComponent.getBoolean("isSitting"),
    });
};

CartObbyPlayerController.prototype.setCamera = function () {
    this.camera = this.app.root.findByName('Camera');
    this.cameraPosEntity = this.entity.findByName('CameraPosition');
    this.cameraParent = this.entity.findByName('Camera Axis');
    this.cameraParent.addChild(this.camera);
    this.camera.setLocalPosition(this.cameraPosEntity.getLocalPosition());
    if (this.app.isMobile) {
        this.cameraScript = this.camera.script.cartObbyMobileCameraController;
    } else {
        this.cameraScript = this.camera.script.cartObbyCameraController;
    }
    this.cameraScript.enabled = true;
    this.cameraScript.resetCamera();
    this._frameMovementRight = new pc.Vec3();
    this._frameMovementForward = new pc.Vec3();
    this._frameMovementTotal = new pc.Vec3();
};

CartObbyPlayerController.prototype.died = function () {
    if (this.isDied || this.canDie == false) return;
    if (this.app.gameplayStarted === true) {
        console.log("gameplaystop")
        PokiSDK.gameplayStop();
        this.app.gameplayStarted = false;
    }

    this.app.fire("MarketClose");

    const deadPlayerEntity = this.deadPlayer.resource.instantiate();
    const playerPos = this.entity.getPosition().clone();
    this.app.root.addChild(deadPlayerEntity);
    deadPlayerEntity.setPosition(playerPos.x, playerPos.y, playerPos.z);
    deadPlayerEntity.setRotation(this.body.getRotation().clone());
    const deadPlayerEntityBody = deadPlayerEntity.children[0];
    this.playerRendererEntity.enabled = false;
    deadPlayerEntityBody.enabled = true;
    for (let i = 0; i < deadPlayerEntityBody.children.length; i++) {
        deadPlayerEntityBody.children[i].rigidbody.applyImpulse(this.body.forward.scale(-pc.math.random(0, 1)));
    }
    this.spawnedDeadBody = deadPlayerEntity;
    this.isDied = true;
    this.app.isDied = true;

    this.faceSprite.enabled = false;
    this.hats.enabled = false;
    this.networkManager.diedEffect();
    this.entity.collision.enabled = false;
    this.entity.rigidbody.type = "kinematic";
    if (this.networkManager.room)
        this.networkManager.room.send("Client:Died");
    this.lockCamera(true);

    console.log("died");
    this.exitCart();
};

CartObbyPlayerController.prototype.respawn = function (vipRespawn = false) {
    this.canDie = false;
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.canDie = true; }, 1000);
    this.body.setRotation(new pc.Quat());

    this.playerRendererEntity.enabled = true;
    this.faceSprite.enabled = true;
    this.hats.enabled = true;
    this.isDied = false;
    this.app.isDied = false;
    if (this.spawnedDeadBody)
        this.spawnedDeadBody.destroy();
    //const targetStage = this.networkManager.stagesParent.children[this.app.currentStage];
    this.entity.collision.enabled = true;
    this.entity.rigidbody.type = "dynamic"
    this.teleport();

    setTimeout(() => { if (this.entity && !this.entity.script) return; this.cameraScript.reset(); }, 100);
    if (this.networkManager.room) {
        if (this.diedOnCart && vipRespawn && this.app.section) {
            if (this.lastCart) {
                this.lastCart.onEnter(this.entity, undefined, this.app.section);
                console.log("cart var ok")
            } else {
                console.log("cart gitmis")
                this.app.cartObbyCartManager.createCart(this.app.section, this.app.lastSpline, true);
            }
        } else {
            console.log("else", "diedOnCart", this.diedOnCart, "vipRespawn", vipRespawn)
            this.app.cartObbyCartManager.removeCart(this.cartId);

            if (!this.diedOnCart && vipRespawn) {
                this.networkManager.goToNextCheckpoint();
            }
        }
        this.networkManager.room.send("Client:Respawn");
    } else {
        if (this.diedOnCart && vipRespawn && this.app.section) {
            if (this.lastCart) {
                this.lastCart.onEnter(this.entity, undefined, this.app.section);
                console.log("cart var ok")
            } else {
                console.log("cart gitmis")
                this.app.cartObbyCartManager._createCartOffline(this.app.section, this.app.lastSpline, true);
            }
        } else {
            console.log("else", "diedOnCart", this.diedOnCart, "vipRespawn", vipRespawn)
            this.app.cartObbyCartManager._removeCartOffline();

            if (!this.diedOnCart && vipRespawn) {
                this.networkManager.goToNextCheckpoint();
            }
        }
    }
    this.lockCamera(false);
    this.diedOnCart = false;

    this.app.fire("Respawned");
};

CartObbyPlayerController.prototype.teleport = function () {
    let checkpoint = 0;
    if (CartObby_Utils.getItem("CARTOBBY_Checkpoint")) {
        checkpoint = CartObby_Utils.getItem("CARTOBBY_Checkpoint")
    }

    //this.lastSavePoint = this.app.root.findByName("Checkpoints").children[checkpoint].children[0];
    this.lastSavePoint = this.app.root.findByName("Checkpoints").children[checkpoint].findByName("SpawnPoint");
    this.entity.rigidbody.teleport(this.lastSavePoint.getPosition());
    this._desiredAngle = this.getYaw(this.lastSavePoint.getRotation());

    //if (this.app.checkpoint == null){return;}
    //this.entity.rigidbody.teleport(this.app.root.findByName("Spawn").getPosition());
};

CartObbyPlayerController.prototype.portalTeleport = function (targetChapter) {
    console.log("targetChapter", targetChapter);
    this.networkManager.setCheckpoint(targetChapter);
    this.teleport();
}

CartObbyPlayerController.prototype.resetGame = function () {
    this.networkManager.setCheckpoint(0);
    this.app.fire("resetStage")
    this.teleport();
}

CartObbyPlayerController.prototype.lockCamera = function (state = false) {
    console.log("lockCamera", state)
    if (state) {
        this.cameraScript.removeEventCallbacks();
        this.app.mouse.disablePointerLock();
    } else {
        this.cameraScript.addEventCallbacks();
        this.app.mouse.enablePointerLock();
    }
}
