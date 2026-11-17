var PlaneObbyPlane = pc.createScript('planeObbyPlane');

PlaneObbyPlane.attributes.add('explosionEffect', { type: 'asset' });
PlaneObbyPlane.attributes.add('skinRoots', { type: 'entity', array: true });
PlaneObbyPlane.attributes.add('colliders', { type: 'entity', array: true });
PlaneObbyPlane.attributes.add('hortBoxes', { type: 'entity', array: true });


// initialize code called once per entity
PlaneObbyPlane.prototype.initialize = function () {

    if (!this.planeData) { this.entity.destroy(); return; }


    //this.collider = this.entity.findByName("Collider");
    this.modelRoot = this.entity.findByName("ModelRoot");
    this.models = this.entity.findByName("Models");
    this.skin = this.skinRoots[this.planeData.skin];
    this.collider = this.colliders[this.planeData.skin];
    this.hurtbox = this.hortBoxes[this.planeData.skin]
    this.mount = this.skin.findByName("Mount");
    this.driverPoint = this.skin.findByName("SitPoint1");
    this.passengerPoint = this.skin.findByName("SitPoint2");
    this.bulletPoint = this.skin.findByName("ShootPoint");
    this.trail = this.skin.findByName("Trail");
    this.arrow = this.skin.findByName("Arrow");

    this.hurtbox.enabled = false;


    setTimeout(() => { if (this.entity && !this.entity.script) return; if (this.modelRoot && this.modelRoot.sound) this.modelRoot.sound.play("spawn"); }, 100);


    this.died = false;

    this.muzzle = {
        entity: this.skin.findByName("MuzzleFlash"),
        particle: this.skin.findByName("Particle").particlesystem,
        time: -1,

        activate: () => {
            this.muzzle.time = .5;
            this.muzzle.entity.enabled = true;
            this.muzzle.particle.reset();
            this.muzzle.particle.play();
        },

        deactivate: () => {
            this.muzzle.time = -1;
            this.muzzle.entity.enabled = false;
        }
    }

    this.muzzle.deactivate();

    this.player = null;
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;
    this.isOnline = this.networkManager.room != null;
    this.camera = this.app.root.findByName('Camera');

    if (this.isOnline) { this.isLocal = this.networkManager.room.sessionId == this.planeData.ownerId; } else { this.isLocal = true; }

    this.rideable = false;
    this.leaveable = false;

    this.targetPosition = null;
    this.targetRotation = null;

    this.moveForce = 50
    this.maxSpeed = 150
    this.responsiveness = PlaneObbyItemDataBase[this.planeData.skin].responsiveness;
    this.bulletSkin = PlaneObbyItemDataBase[this.planeData.skin].bulletSkin;
    //console.log("speedMul", this.speedMul);

    for (let i = 0; i < this.skinRoots.length; i++) {
        let model = this.models.children[i];
        let collider = this.colliders[i];
        let hurtbox = this.hortBoxes[i];
        if (this.planeData.skin == i) {
            model.enabled = true;
            collider.enabled = true;
            hurtbox.enabled = true;
        }
        else {
            model.enabled = false;
            collider.enabled = false;
            hurtbox.enabled = false;
        }
    }

    this.models.enabled = false;
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        if (this && this.entity && this.models) {
            this.models.enabled = true;
        }
    }, 100);

    this.canShoot = true;
    this.shootCooldown = .15;

    this.mount.collision.on("triggerenter", (otherEntity) => {
        if (otherEntity.tags.has("Player") && this.rideable) {

            if (this.isLocal) { this.onEnter(otherEntity); }
            else {
                if (this.passengerPoint.children.length === 0) {
                    this.onEnter(otherEntity, undefined, true);
                }
            }
        }
    })

    this.collider.rigidbody.linearVelocity = pc.Vec3.ZERO;
    this.collider.rigidbody.enabled = true;
    this.mount.collision.enabled = false;


    if (this.isLocal) {
        this.mount.collision.enabled = true;
        this.rideable = true;
        this.collider.tags.add("LocalCollider");
        this.entity.tags.add("LocalPlane");

        //console.log("plane tags", this.entity.tags)
        this.app.localPlaneId = this.planeData.id;
        console.log("this.app.localPlaneId", this.app.localPlaneId)

        this.app.wind = {
            active: false,
            direction: new pc.Vec3(0, 0, 0),
            strength: 110,
        };

        if (this.app.shouldAutoGetIn) {
            this.app.shouldAutoGetIn = false;
            setTimeout(() => { if (this.entity && !this.entity.script) return;
                let player = this.app.root.findByName("Player");
                this.onEnter(player);
            }, 100)
        }

        this.app.on("planeHurtBox", () => {
            this.app.fire("destroyPlane");
        }, this)

        //this.entity.findByName("HurtBox").collision.enabled = true;
        this.hurtbox.collision.enabled = true;
    } else {
        this.arrow.enabled = false;
        this.collider.tags.add("Ground");
        this.collider.tags.add("RemoteCollider");
        this.collider.rigidbody.type = "kinematic";
        this.hurtbox.collision.enabled = false;
        this.mount.collision.enabled = true;
        this.rideable = true;
    }

    this.on('destroy', function () {
        this.app.off("planeHurtBox");
    }, this);
};

PlaneObbyPlane.prototype.destroyPlane = function () {
    this.expoEffect();
    if (this.player) {
        if (this.isLocal) { this.player.script.planeObbyPlayerController.destroyPlane(); }
    }
    else {
        if (this.isOnline) {
            this.app.planeObbyPlaneManager.removePlane(this.planeData.id);
        } else {
            this.app.planeObbyPlaneManager._removePlaneOffline();
        }
    }
    //this.collider.sound.play("destroy")
    if (this.isLocal) { this.app.localPlaneId = null; console.log("this.app.localPlaneId = null") }
}


PlaneObbyPlane.prototype.expoEffect = function () {
    let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.modelRoot.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
    }
}

// update code called every frame
PlaneObbyPlane.prototype.update = function (dt) {
    if (this.isLocal) {

        this.arrow.enabled = (this.player == null);

        if (this.player) {
            this.hurtbox.enabled = (this.collider.getPosition().z > 30);

            let forwardForce = .1;
            let vecticalForce = .5;
            let horizontalForce = .5;

            let vertical = 0;
            let horizontal = 0;

            joystick = window.touchJoypad.sticks['joystick0'];

            if (!this.app.menuPanelEnabled && !this.app.isMarketEnabled) {

                if (this.app.isMobile) {

                    if (joystick.y > 0.1) vertical = joystick.y;
                    else if (joystick.y < -0.1) vertical = joystick.y;

                    if (joystick.x > 0.1) horizontal = -joystick.x;
                    else if (joystick.x < -0.1) horizontal = -joystick.x;

                } else {

                    vertical =
                        (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)) ? vecticalForce :
                            (this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN)) ? -vecticalForce :
                                0;

                    horizontal =
                        (this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)) ? -horizontalForce :
                            (this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT)) ? horizontalForce :
                                0;
                }
            }

            if (this.camera) {

                let rb = this.collider.rigidbody;

                let forwardDir = new pc.Vec3(0, 0, 1);
                let verticalDir = new pc.Vec3(0, 1, 0);
                let horizontalDir = new pc.Vec3(1, 0, 0);

                let totalForce = new pc.Vec3();


                let _y = this.collider.getPosition().y > 49;

                totalForce.add(forwardDir.scale(this.moveForce * 3 * (1 + (this.responsiveness / 10)) * forwardForce));
                totalForce.add(verticalDir.scale(this.moveForce * this.responsiveness * vertical));
                totalForce.add(horizontalDir.scale(this.moveForce * this.responsiveness * horizontal));

                if (this.app.wind.active && this.app.wind.direction) {
                    let windForce = this.app.wind.direction
                        .clone()
                        .normalize()
                        .scale(this.app.wind.strength);

                    totalForce.add(windForce);

                    //console.log("wind", this.app.wind.active, "dir", this.app.wind.direction)
                }

                if (_y) {
                    totalForce.y = 0;
                    rb.linearVelocity = new pc.Vec3(rb.linearVelocity.x, -10, rb.linearVelocity.z)
                }
                rb.applyForce(totalForce);

                if (this.collider.getPosition().y < 2 && !this.died) {
                    this.died = true;
                    this.app.fire("playerDie");
                }

                if (rb.linearVelocity.z < 1 && this.leaveable && !this.died) {
                    this.died = true;
                    this.app.fire("playerDie");
                }

            }

            if (this.modelRoot) {

                let tiltForward = -vertical * 30;
                let tiltSide = -horizontal * 30;
                let tiltTop = horizontal * 20;

                let targetEuler = new pc.Vec3(tiltForward, tiltTop, tiltSide);
                let currentEuler = this.modelRoot.getLocalEulerAngles();
                let lerpSpeed = 8 * dt;
                let newEuler = new pc.Vec3(
                    pc.math.lerp(currentEuler.x, targetEuler.x, lerpSpeed),
                    pc.math.lerp(currentEuler.y, targetEuler.y, lerpSpeed),
                    pc.math.lerp(currentEuler.z, targetEuler.z, lerpSpeed)
                );

                this.modelRoot.setLocalEulerAngles(newEuler);
            }


            if ((this.app.mouse.isPressed(pc.MOUSEBUTTON_LEFT) || window.touchJoypad.buttons.wasPressed('shootButton')) && this.canShoot && !this.app.menuPanelEnabled && !this.app.isMarketEnabled) {
                this.canShoot = false;
                setTimeout(() => { if (this.entity && !this.entity.script) return; this.canShoot = true; }, this.shootCooldown * 1000);

                let _position = this.bulletPoint.getPosition();
                let _rotation = this.bulletPoint.getEulerAngles();
                let _skin = this.bulletSkin;
                if (this.isOnline) {
                    this.networkManager.room.send("Client:Bullet", {
                        position: _position,
                        rotation: _rotation,
                        skin: _skin,
                    })

                } else { this.app.planeObbyPlaneManager.spawnBullet(null, _position, _rotation, _skin); }

                this.modelRoot.sound.play("bullet");
                this.muzzle.activate();
            }
        } else {
            let cur = this.modelRoot.getLocalEulerAngles();
            let t = dt * 5;

            this.modelRoot.setLocalEulerAngles(
                pc.math.lerp(cur.x, 0, t),
                pc.math.lerp(cur.y, 0, t),
                pc.math.lerp(cur.z, 0, t)
            );
        }

        if (this.isOnline && this.networkManager.room.connection.isOpen === true) {
            this.networkManager.room.send("Client:PlanePosition", {
                id: this.planeData.id,
                x: this.collider.getPosition().x,
                y: this.collider.getPosition().y,
                z: this.collider.getPosition().z,
                rotX: this.modelRoot.getLocalEulerAngles().x,
                rotY: this.modelRoot.getLocalEulerAngles().y,
                rotZ: this.modelRoot.getLocalEulerAngles().z,
            });
        }

        if (this.muzzle.time > 0) {
            this.muzzle.time -= dt;
            if (this.muzzle.time <= 0) {
                this.muzzle.deactivate()
            }
        }

    } else {
        if (this.targetPosition != null) {
            let _position = this.collider.getPosition().clone();
            _position.lerp(_position, this.targetPosition, dt * 5);
            this.collider.setPosition(_position);
        }

        if (this.targetRotation != null) {
            let current = this.modelRoot.getLocalEulerAngles();
            let lerpSpeed = 8 * dt;
            let newEuler = new pc.Vec3(
                pc.math.lerp(current.x, this.targetRotation.x, lerpSpeed),
                pc.math.lerp(current.y, this.targetRotation.y, lerpSpeed),
                pc.math.lerp(current.z, this.targetRotation.z, lerpSpeed)
            );

            this.modelRoot.setLocalEulerAngles(newEuler);
        }
    }


    /*     if (this.collider.rigidbody.linearVelocity.length() !== 0) {
            if (!this.collider.sound.isPlaying("drive")) {this.collider.sound.play("drive");}
        } else {this.collider.sound.stop("drive");} */

    /*     let speed = this.collider.rigidbody.linearVelocity.length();
        let ratio = speed / this.maxSpeed;
        let volume = Math.min(ratio*10, 1);
        let pitch = Math.max(Math.min(ratio*15, 2),1) * this.collidingGround;
        let slot = this.collider.sound.slot("drive") 
        this.volumeLerp = pc.math.lerp(this.volumeLerp, volume, .2);
        slot.volume = this.volumeLerp;
        slot.pitch = pitch */

    //this.modelRoot.setRotation(this.collider.getRotation());
    this.modelRoot.setPosition(this.collider.getPosition());
};

PlaneObbyPlane.prototype.onEnter = function (player, overridePosition = null, asPassenger = false) {

    this.modelRoot.sound.play("enter");

    this.isDieFired = false;
    this.app.inPlane = !asPassenger;
    this.player = player;
    this.player.rigidbody.linearVelocity = pc.Vec3.ZERO;
    this.player.rigidbody.enabled = false;


    let _point = (asPassenger ? this.passengerPoint : this.driverPoint);
    this.player.reparent(_point);
    //console.log("player", this.player, "sitPoint", this.driverPoint)
    this.player.setLocalPosition(pc.Vec3.ZERO);
    this.player.setLocalScale(pc.Vec3.ONE);
    this.player.setLocalEulerAngles(0, 0, 0);
    this.player.script.planeObbyPlayerController.setPlane(this);
    this.player.script.planeObbyPlayerController.setCamera();

    this.leaveable = false;
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.leaveable = true }, 1 * 1000);

    if (overridePosition != null) {
        this.collider.rigidbody.teleport(overridePosition);
        this.collider.rigidbody.linearVelocity = pc.Vec3.ZERO;
    }

    if (this.networkManager.room && asPassenger) {
        this.networkManager.room.send("Client:Passenger", { guestPlaneId: this.planeData.id, passengerId: this.networkManager.room.sessionId })
    }
    this.app.isPassenger = asPassenger;

    this.app.root.findByName("shootButton").enabled = true;
}

PlaneObbyPlane.prototype.onExit = function (asPassenger) {

    if (this.modelRoot && this.modelRoot.sound) {
        this.modelRoot.sound.play("exit");
    }
    console.log("XXXXXXXXX ONEXIT", this.player)
    this.app.inPlane = false;
    this.player.rigidbody.linearVelocity = pc.Vec3.ZERO;
    this.player.rigidbody.enabled = true;
    this.player.reparent(this.app.root);
    //this.player.setPosition(this.entity.getPosition());
    this.player.setLocalScale(pc.Vec3.ONE);
    this.player.script.planeObbyPlayerController.setPlane(null);
    this.player = null;

    this.rideable = false;
    if (this.mount && this.mount.collision) {
        this.mount.collision.enabled = false;
        setTimeout(() => { if (this.entity && !this.entity.script) return;
            if (this.mount && this.mount.collision) { this.mount.collision.enabled = true; }
            this.rideable = true;
        }, 2 * 1000);
    }

    if (this.networkManager.room && asPassenger) {
        this.networkManager.room.send("Client:Passenger", { guestPlaneId: this.planeData.id, passengerId: null })
    } this.app.isPassenger = asPassenger;

    this.app.root.findByName("shootButton").enabled = false;
}
