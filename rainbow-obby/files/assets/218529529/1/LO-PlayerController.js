var LOPlayerController = pc.createScript('loPlayerController');
LOPlayerController.attributes.add("username", { type: "entity" });
LOPlayerController.attributes.add("body", { type: "entity" });
LOPlayerController.attributes.add("moveSpeed", { type: "number", default: 6 });
LOPlayerController.attributes.add("jumpHeight", { type: "number", default: 13 });
LOPlayerController.attributes.add("rotateSpeed", { type: "number", default: 5 });
LOPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });
LOPlayerController.attributes.add("carpet", { type: "entity" });
LOPlayerController.attributes.add("carpetUI", { type: "entity" });
LOPlayerController.attributes.add("escapeMenu", { type: "entity" });
LOPlayerController.attributes.add("marketMenu", { type: "entity" });

LOPlayerController.prototype.initialize = function () {
    this.entity.isLocal = true;
    this.isDied = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.loNetworkManager;
    this.inventoryController = this.entity.script.inventoryController;
    this.playerRendererEntity = this.body.findByName("N00b7.001");
    //this.faceSprite = this.body.findByName("FaceSprite");
    this.hats = this.body.findByName("hats");
    this.setCamera();
    this._direction = new pc.Vec3();
    this._contactNormal = new pc.Vec3();
    this._quatLerp = new pc.Quat();
    this._desiredVelocity = new pc.Vec3();
    this._carpetVelocity = new pc.Vec3();
    this._desiredAngle = 0;
    this._requestedJump = false;
    this._timeSinceLastJump = 0;
    this._timeSinceLastGrounded = 0;
    this.isSliding = false;
    this._animComponent = this.body.anim;
    this.soundComponent = this.entity.sound;
    this.sendPositionInterval = setInterval(this.sendPosition.bind(this), 100);
    //this.playerHealtText = this.app.root.findByName("PlayerHealt");
    this.respawn();
    this.app.shiftLock = true;
    this.isFlyCarpet = false;

    const onMouseDown = () => {
        if (this.isFirstClick == true) {
            this.isFirstClick = false;
            return;
        }
        /*
        const camResult = this.app.isWatchingAd || this.app.isMarketEnabled || this.app.isMenuEnabled ||
            this.app.deadMenuEnabled || this.app.isPopupEnabled || this.app.isRewardedPopupEnabled;
        */
        const camResult = this.app.isMarketEnabled || this.app.deadMenuEnabled || this.app.rewardedPanelEnabled;
        if (!camResult) {
            if (pc.Mouse.isPointerLocked() == false) {
                if (this.app.isMarket) return;
                //this.app.mouse.enablePointerLock();
                this.app.cameraStateLocked = true;
                this.app.fire("lockCamera", false);
                return;
            }
        }
    };
    this.app.mouse.on("mousedown", onMouseDown);


    this.app.on('EnterFPS', function () {
        this.playerRendererEntity.enabled = true;
        this.username.enabled = false;
        //this.faceSprite.enabled = false;
        this.hats.enabled = false;
    }, this);

    this.app.on('ExitFPS', function () {
        this.playerRendererEntity.enabled = true;
        this.username.enabled = true;
        //this.faceSprite.enabled = true;
        this.hats.enabled = true;
    }, this);

    const isFPSLocalStorage = Utils.getItem("isFPS");
    if (isFPSLocalStorage == "true") {
        this.app.fire("EnterFPS");
    }
    else if (isFPSLocalStorage == null) {
        this.app.fire("EnterFPS");
    } else {
        this.app.fire("ExitFPS");
    }

    this.app.on("lockCamera", this.lockCamera, this);

    this.entity.on("OwnCarpet", this.ownCarpet, this);

    this.app.on("DestroyCarpet", this.destroyCarpet, this);

    this.entity.collision.on('collisionstart', function (otherEntity) {
        if (otherEntity.other.tags.has("Ladder") || otherEntity.other.tags.has("lLadder")) {
            this.isClimbingLadder = true;
            this.isOnLadder = true;
            this._animComponent.setBoolean("isOnLadder", true);
            this.app.isOnLadder = true;
            this.app.fire("OnUseLadder", true);
        }

    }, this);
    this.entity.collision.on('collisionend', function (otherEntity) {
        if (otherEntity.tags.has("Ladder") || otherEntity.tags.has("lLadder")) {
            this.isClimbingLadder = false;
            this.isOnLadder = false;
            this._animComponent.setBoolean("isClimbing", false);
            this._animComponent.setBoolean("isOnLadder", false);
            this.app.isOnLadder = false;
            this.app.fire("OnUseLadder", false);
        }
    }, this);
    this.playerHealt = 100;
    this.app.on("PlayerTakeDamage", this.takeDamage, this);

    this._animComponent.on("step1", () => {
        const rand = Math.floor(Math.random() * 2) + 1;

        this.soundComponent.play("footstep" + rand);
    });
    this._animComponent.on("step2", () => {
        const rand = Math.floor(Math.random() * 2) + 1;

        this.soundComponent.play("footstep" + rand);
    });

    this.entity.on("Sound:Coin", () => {
        this.soundComponent.play("CoinCollect");
    }, this);

    this.on('destroy', function () {
        this.app.off("DestroyCarpet", this.destroyCarpet, this);

        this.app.off('EnterFPS');
        this.app.off('ExitFPS');
        clearInterval(this.sendPositionInterval);
        this.app.off("lockCamera", this.lockCamera, this);
        this.app.off("PlayerTakeDamage", this.takeDamage, this);
        this.app.mouse.off("mousedown", onMouseDown);

    }, this);
};

LOPlayerController.prototype.stopMovement = function () {
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
    this.entity.rigidbody.linearVelocity.set(0, 0, 0)
    this._animComponent.setBoolean("walk", false);
}

LOPlayerController.prototype.destroyCarpet = function () {
    this.isFlyCarpet = false;
    this.isOwnCarpet = false;
    this.carpet.enabled = false;
    this.carpetUI.enabled = false;

}

LOPlayerController.prototype.ownCarpet = function () {
    this.isFlyCarpet = true;
    this.isOwnCarpet = true;
    this.carpet.enabled = true;
    this.carpetUI.enabled = true;

}

LOPlayerController.prototype.takeDamage = function (damage, bigBoss = false) {
    this.playerHealt -= damage;
    //this.playerHealtText.enabled = true;
    if (this.playerHealt < 0) {
        //this.playerHealtText.element.text = 0;
    }
    else {
        //this.playerHealtText.element.text = this.playerHealt;
    }
    if (this.playerHealt <= 0) {
        this.died();
    }
    if (bigBoss) {
        this.app.fire("bossReload");
    }
};
LOPlayerController.prototype.update = function (dt) {
    if (this.app.keyboard.wasPressed(pc.KEY_R)) {
        this.died();
        return;
    }
    if (this.app.keyboard.wasPressed(pc.KEY_1)) {
        if (this.isOwnCarpet) {
            if (this.isFlyCarpet) {
                this.isFlyCarpet = false
                this.carpet.enabled = false
            }
            else {
                this.isFlyCarpet = true
                this.carpet.enabled = true
            }
        }
    }
    if (window.touchJoypad.buttons.wasPressed('carpetButton')) {
        if (this.isOwnCarpet) {
            if (this.isFlyCarpet) {
                this.isFlyCarpet = false
                this.carpet.enabled = false
            }
            else {
                this.isFlyCarpet = true
                this.carpet.enabled = true
            }
        }
    }

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

    if (this.isSliding == false)
        this._direction.set(0, 0, 0);


    this._carpetVelocity.set(0, 0, 0)
    this._requestedJump = false;
    this.isRocket = false;
    this._timeSinceLastJump += dt;
    this._timeSinceLastGrounded += dt;

    if (this.isDied == false) {
        if (this.isSliding == false) {
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
                if (window.touchJoypad.buttons.wasPressed('jumpButton')) {
                    this._requestedJump = true;
                    this.sdkGamePlayStart();
                }
                if (window.touchJoypad.buttons.wasPressed('jumpButton')) {/*
                    if (this.app.rocket) {
                        this.isRocket = true;
                    }*/
                }
            } else {
                //if (!this.app.isPause) {
                if (this.app.keyboard.isPressed(pc.KEY_SPACE)) {
                    if (!this.app.rocket) {
                        this._requestedJump = true;
                    }
                    else {
                        this.isRocket = true;
                    }
                    this.sdkGamePlayStart();
                }
                if (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)) {
                    this._direction.add(this.camera.forward);
                    this._carpetVelocity.add(this.camera.forward)
                    this.sdkGamePlayStart();

                }
                else if (this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN)) {
                    this._direction.sub(this.camera.forward);
                    this._carpetVelocity.sub(this.camera.forward)

                    this.sdkGamePlayStart();
                }
                if (this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT)) {
                    this._direction.sub(this.camera.right);
                    this._carpetVelocity.sub(this.camera.right)

                    this.sdkGamePlayStart();

                } if (this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)) {
                    this._direction.add(this.camera.right);
                    this._carpetVelocity.add(this.camera.right)

                    this.sdkGamePlayStart();
                }
                //}
            }
            if (this.app.keyboard.isPressed(pc.KEY_SPACE) || window.touchJoypad.buttons.isPressed('jumpButton')) {
                this._carpetVelocity.y += 30 * dt;
            }
        }
    }

    this._direction.y = 0;

    const rayStart = this.entity.getPosition().clone();
    const rayEnd = rayStart.clone().sub(new pc.Vec3(0, 1.25, 0));

    const _rayResults = [
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(0.5, 0, 0.5))),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(0.5, 0, -0.5))),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(-0.5, 0, 0.5))),
        this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd.clone().add(new pc.Vec3(-0.5, 0, -0.5)))
    ];

    this.grounded = false;

    for (const result of _rayResults) {
        if (result && (result.entity.tags.has("Ground") || result.entity.tags.has("LGround"))) {
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

    if (!this.grounded || this.isSliding) {
        this._contactNormal = new pc.Vec3(0, 1, 0);
        this._animComponent.setBoolean("isInAir", true);
    }


    this._desiredVelocity = this._direction.normalize().clone().mulScalar(this.moveSpeed);
    if (this._desiredVelocity.length() > 0) {
        this._desiredAngle = Math.atan2(this._direction.x, this._direction.z) * pc.math.RAD_TO_DEG;
        const targetQuat = new pc.Quat().setFromEulerAngles(0, this._desiredAngle, 0);
        this._quatLerp = new pc.Quat().slerp(this._quatLerp, targetQuat, this.rotateSpeed * dt);
        if (!this.app.shiftLock)
            this.body.setRotation(this._quatLerp);

    }
    if (this.app.shiftLock) {
        let cameraQuat = this.camera.getRotation().clone();
        const y = this.getYaw(cameraQuat);
        const targetQuat = new pc.Quat().setFromEulerAngles(0, y, 0);

        this.body.setRotation(targetQuat);
        this.body.rotateLocal(0, 180, 0);
    }
    this._desiredVelocity.y += this.entity.rigidbody.linearVelocity.y;
    const velocityDotNormal = this._desiredVelocity.clone().normalize().dot(this._contactNormal);
    if (velocityDotNormal > 0 && !this._jumped) {
        this._desiredVelocity.sub(this._contactNormal.clone().mulScalar(velocityDotNormal * this._desiredVelocity.length()));
    }
    if (!this.app.isPause)
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

            if (this._requestedJump && !this.isRocket) {
                const temp = this.body.up.clone().add(this.body.forward.mulScalar(4));
                this._desiredVelocity.add(temp.normalize().mulScalar(this.jumpHeight));
            }

        } else {
            this._armatureTargetAngle = 0;
            //jump
            if (this.entity.jumpPlatform || (this._requestedJump && this._timeSinceLastGrounded <= 0.3 && !this._jumped)) {
                this._jumped = true;
                this.entity.jumpPlatform = false;
                this._timeSinceLastJump = 0;
                this._desiredVelocity.add(this._contactNormal.clone().mulScalar(this.jumpHeight));
                if (this._requestedJump) {
                    this.entity.fire('jump');
                }
            }
            if (this.isRocket) {
                this._requestedJump = false;
                this._desiredVelocity.set(this._desiredVelocity.x, 500 * dt, this._desiredVelocity.z);
                //this.entity.rigidbody.applyImpulse(new pc.Vec3(0, 500, 0));
            }
            //extra gravity
            if (!this.app.isBallon)
                this._desiredVelocity.set(this._desiredVelocity.x, this._desiredVelocity.y - 10 * dt, this._desiredVelocity.z);


        }
    if (this.app.isPause) {
        this._desiredVelocity.set(0, 0, 0)
    }

    if (!this.isFlyCarpet) {
        if (!this.entity.isRope)
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


    if (this.isFlyCarpet) {
        this._animComponent.setBoolean("isInAir", false);
        this._animComponent.setBoolean("walk", false);
        this._animComponent.setBoolean("isClimbing", false);
        this._animComponent.setBoolean("isOnLadder", false);

    }
};
LOPlayerController.prototype.sdkGamePlayStart = function () {
    if (this.app.gamePlayStart || this.isDied || this.app.isWatchingAd || this.escapeMenu.enabled || this.marketMenu.enabled) return;
    this.app.gamePlayStart = true;
    PokiSDK.gameplayStart();
};
//Only gets y euler angle between -180, 180
LOPlayerController.prototype.getYaw = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

LOPlayerController.prototype.sendPosition = function () {
    if (this.networkManager.room == null || this.networkManager.room.connection.isOpen === false) return;
    this.networkManager.room.send("SendPosition", {
        x: this.entity.getPosition().x,
        y: this.entity.getPosition().y,
        z: this.entity.getPosition().z,
        rotationY: this.getYaw(this.body.getRotation()),
        grounded: this.grounded,
        isWalking: this._animComponent.getBoolean("walk"),
        isClimbing: this._animComponent.getBoolean("isClimbing"),
        isOnLadder: this._animComponent.getBoolean("isOnLadder"),
    });
};

LOPlayerController.prototype.setCamera = function () {
    this.camera = this.app.root.findByName('Camera');
    this.cameraPosEntity = this.entity.findByName('CameraPosition');
    this.cameraParent = this.entity.findByName('Camera Axis');
    this.cameraParent.addChild(this.camera);
    this.camera.setLocalPosition(this.cameraPosEntity.getLocalPosition());
    if (this.app.isMobile) {
        this.cameraScript = this.camera.script.loMobileCameraController;
    } else {
        this.cameraScript = this.camera.script.loCameraController;
    }
    this.cameraScript.enabled = true;
    this.cameraScript.resetCamera();
    this._frameMovementRight = new pc.Vec3();
    this._frameMovementForward = new pc.Vec3();
    this._frameMovementTotal = new pc.Vec3();
};

LOPlayerController.prototype.died = function () {
    if (this.isDied) return;

    this.app.fire("LO_GetLadder");
    /*
        this.app.fire("MarketClose");
    
        //const deadPlayerEntity = this.deadPlayer.resource.instantiate();
        const playerPos = this.entity.getPosition().clone();
        //this.app.root.addChild(deadPlayerEntity);
        //deadPlayerEntity.setPosition(playerPos.x, playerPos.y, playerPos.z);
        //deadPlayerEntity.setRotation(this.body.getRotation().clone());
        //const deadPlayerEntityBody = deadPlayerEntity.children[0];
        //this.playerRendererEntity.enabled = false;
        //deadPlayerEntityBody.enabled = true;
        //for (let i = 0; i < deadPlayerEntityBody.children.length; i++) {
        //    deadPlayerEntityBody.children[i].rigidbody.applyImpulse(this.body.forward.scale(-pc.math.random(0, 1)));
        //}
        //this.spawnedDeadBody = deadPlayerEntity;
        this.isDied = true;
        this.app.isDied = true;
    
        this.faceSprite.enabled = false;
        this.hats.enabled = false;
        //this.networkManager.diedEffect();
        this.entity.collision.enabled = false;
        this.entity.rigidbody.type = "kinematic";
        if (this.networkManager.room)
            this.networkManager.room.send("Client:Died");
        this.lockCamera(true);
    */
    this.entity.rigidbody.teleport(this.app.stageTrigger.stagePoints[this.app.currentStage].getPosition().clone());
    this.app.localLadder.rigidbody.teleport(this.app.stageTrigger.stagePoints[this.app.currentStage].children[0].getPosition().clone().add(new pc.Vec3(1.250, 0.189, 0, 0.645)))
};

LOPlayerController.prototype.respawn = function () {
    //this.sdkGamePlayStart();
    this.cameraScript.reset();
    this.playerHealt = 100;
    if (this.app.isFPS) {
    } else {
        //this.faceSprite.enabled = true;
        this.hats.enabled = true;
    }
    this.takeDamage(0);
    this.isDied = false;
    this.app.isDied = false;
    if (this.app.isFPS == false)
        this.playerRendererEntity.enabled = true;
    if (this.spawnedDeadBody)
        this.spawnedDeadBody.destroy();
    //const targetStage = this.networkManager.stagesParent.children[this.app.currentStage];
    this.entity.collision.enabled = true;
    this.entity.rigidbody.type = "dynamic"
    //this.lastSavePoint = this.networkManager.savePoints.children[this.app.currentStage].children[0];
    //this.entity.rigidbody.teleport(this.lastSavePoint.getPosition());

    if (this.networkManager.room) {
        this.networkManager.room.send("Client:Respawn");
    }
    this.lockCamera(false);
};

LOPlayerController.prototype.lockCamera = function (state = false) {
    if (state) {
        this.cameraScript.removeEventCallbacks();
        this.app.mouse.disablePointerLock();
    } else {
        this.cameraScript.addEventCallbacks();
        this.app.mouse.enablePointerLock();
    }
}