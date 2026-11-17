var CartObbyCart = pc.createScript('cartObbyCart');

CartObbyCart.attributes.add('moveForce', { type: 'number', default: 20 });
CartObbyCart.attributes.add('maxSpeed', { type: 'number', default: 10 });
CartObbyCart.attributes.add('explosionEffect', { type: 'asset' });

 
// initialize code called once per entity
CartObbyCart.prototype.initialize = function() {
    this.model = this.entity.findByName("Model");
    this.collider = this.entity.findByName("Collider");
    this.mount = this.entity.findByName("Mount");
    this.playerPoint = this.entity.findByName("SitPosition");
    this.body = this.entity.findByName("Body");
    this.player = null;
    this.cameraPosition = this.entity.findByName("CameraPosition");
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;
    this.isOnline = this.networkManager.room != null;
    this.camera = this.app.root.findByName('Camera');

    if (this.isOnline){this.isLocal = this.networkManager.room.sessionId == this.cartData.ownerId;} else {this.isLocal = true;}

    this.back = this.entity.findByName("back");
    this.left = this.entity.findByName("left");
    this.right = this.entity.findByName("right");
    this.front = this.entity.findByName("front");
    this.speedText = this.entity.findByName("SpeedText");


    this.nitro = {
        particle: this.entity.findByName("NitroParticle").particlesystem,
        timer: 0,
        enable: ()=>{
            this.nitro.timer = 2;
            if (this.isOnline){this.networkManager.room.send("Client:IsNitro", {cartId:this.cartData.id, isNitro: true});}
            else {this.nitro.particle.play();}
        },

        disable: ()=>{
            this.nitro.timer = -1;
            if (this.isOnline){this.networkManager.room.send("Client:IsNitro", {cartId:this.cartData.id, isNitro: false});}
            else {this.nitro.particle.stop();}
        },
    };

    this.rideable = false;
    this.leaveable = false;
    this.shouldUpdateLastValue = true;
    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.shouldUpdateLastValue = false}, 2000)

    this.moveForce = 50
    this.maxSpeed = 200
    this.spline = this.app.splines[this.cartData.splineIndex];
    this.speedMul = CartObbyItemDataBase[this.cartData.skin].speedMul;

    
    //console.log("speedMul", this.speedMul);

    this.entity.findByName("Mount").collision.on("triggerenter", (otherEntity)=>{
        if (otherEntity.tags.has("Player") && this.isLocal && this.rideable){
            this.onEnter(otherEntity);
        }
    })

    this.collider.rigidbody.linearVelocity = pc.Vec3.ZERO;
    this.collider.rigidbody.enabled = true;
    this.mount.collision.enabled = false;
    
    
    if (this.isLocal){
        this.app.on("Nitro:Enable", this.nitro.enable, this);
        this.mount.collision.enabled = true;
        this.rideable = true;
        this.collider.tags.add("Local");
        this.collider.tags.add("LocalCollider");
        this.app.localCartId = this.cartData.id;
        //console.log("this.app.localCartId = this.cartData.id;")
        this.app.rotOverrider = null;


        if (this.app.shouldAutoGetIn){
            this.app.shouldAutoGetIn = false;
            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                let player = this.app.root.findByName("Player");
                this.onEnter(player);
            }, 100)
        }
    } else {
        this.collider.tags.add("Ground");
        this.speedText.destroy();
        this.collider.tags.add("Remote");
        this.collider.tags.add("RemoteCollider");
        this.collider.rigidbody.type = "kinematic";
        this.back.collision.on("triggerenter", (other)=>{this.reciveHit(other, 1, "back")});
        this.left.collision.on("triggerenter", (other)=>{this.reciveHit(other, 1, "left")});
        this.right.collision.on("triggerenter", (other)=>{this.reciveHit(other, 1, "right")});
        this.front.collision.on("triggerenter", (other)=>{this.reciveHit(other, 1, "front")});
    }

    this.moveDir = 0;
    this.targetPosition = null;
    this.canGetHit = true;

    this.maxHealth = 3;
    this.lerpRotation = new pc.Quat();
    this.lastValue = 0;

    this.canSpawnBomb = true;
    this.bombLaunchForce = 20;
    this.bombCooldown = 1;

    if (this.cartData){
        //console.log("cartData", this.cartData);
        if (this.cartData.partLeft < this.maxHealth) {if (this.cartData.partLeft <= 0) {this.left.destroy()}  else {this.damagePart(1, "left")}}
        if (this.cartData.partRight < this.maxHealth) {if (this.cartData.partRight <= 0) {this.right.destroy()}  else {this.damagePart(1, "right")}}
        if (this.cartData.partBack < this.maxHealth) {if (this.cartData.partBack <= 0) {this.back.destroy()}  else {this.damagePart(1, "back")}}
        if (this.cartData.partFront < this.maxHealth) {if (this.cartData.partFront <= 0) {this.front.destroy()}  else {this.damagePart(1, "front")}}
    }

    this.collidingGround = false;
    this.offRailTimer = 0;
    this.isDieFired = false;
    
    this.volumeLerp = 0;



    this.on('destroy', function () {
        if (this.isLocal){
            this.app.off("Nitro:Enable");
        }
    }, this);
};

CartObbyCart.prototype.reciveHit = function(other, power, part, force = false){
    if (other.tags.has("Local") || force){

        //console.log("hit enttiy", other, part)
        if (power < .2 || !this.canGetHit) return;

        this.canGetHit = false;

        if (this.networkManager.room){
            this.networkManager.room.send("Client:Hit", {
                cartId: this.cartData.id,
                speed: power,
                part: part,
            });
        } else {
            this.app.cartObbyCartManager.damagePart(this.cartData.id, power, part);
        }

        setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.canGetHit = true;}, 1000);
    } else {}
}

CartObbyCart.prototype.damagePart = function(_damage, _part, audio = false){
    let _selectedPart = null
    switch(_part){
        case "back": _selectedPart = this.back; break;
        case "left": _selectedPart = this.left; break;
        case "right": _selectedPart = this.right; break;
        case "front": _selectedPart = this.front; break;
    }
    if (_selectedPart != null){
        let currentRot = _selectedPart.getLocalEulerAngles();
        _selectedPart.setLocalEulerAngles(
            currentRot.x + pc.math.random(-10, 10) * _damage,
            currentRot.y + pc.math.random(-10, 10) * _damage,
            currentRot.z + pc.math.random(-10, 10) * _damage,
        )

        if (audio){
            var sounds = ["hit1", "hit2", "hit3"];
            var randomIndex = Math.floor(Math.random() * sounds.length);
            this.collider.sound.play(sounds[randomIndex]);
        }
    }
}

CartObbyCart.prototype.destroyPart = function(_part, audio){
    let _selectedPart = null
    switch(_part){
        case "back": _selectedPart = this.back; break;
        case "left": _selectedPart = this.left; break;
        case "right": _selectedPart = this.right; break;
        case "front": _selectedPart = this.front; break;
    }
    if (_selectedPart != null){
        _selectedPart.addComponent('rigidbody', {
            type: 'dynamic',
            mass: 1,
            linearDamping: 0.2,
            angularDamping: 0.2
        });

        _selectedPart.rigidbody.applyImpulse(
            new pc.Vec3(pc.math.random(-5, 5), pc.math.random(5, 10), pc.math.random(-5, 5))
        );

        setTimeout(() => {
            if (_selectedPart && _selectedPart.destroy) {
                _selectedPart.destroy();
            }
        }, 3000);

        if (audio){
            var sounds = ["partDestroy1", "partDestroy2", "partDestroy3"];
            var randomIndex = Math.floor(Math.random() * sounds.length);
            this.collider.sound.play(sounds[randomIndex]);
        }
    }
}

CartObbyCart.prototype.destroyCart = function(){
    if (this.front != null){
        this.expoEffect();

        if (this.player){
            if (this.isLocal){this.player.script.cartObbyPlayerController.destroyCart();}
        }
        else {this.app.cartObbyCartManager.removeCart(this.cartData.id)}
        this.collider.sound.play("destroy")
        if (this.isLocal){this.app.localCartId = null; console.log("this.app.localCartId = null")}
    }
}


CartObbyCart.prototype.expoEffect = function(){
    let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.entity.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
    }
}

// update code called every frame
CartObbyCart.prototype.update = function(dt) {

    //console.log(this.touchingRails.size)

    if (this.isLocal){
        this.speedText.element.text = Math.floor(this.collider.rigidbody.linearVelocity.length() / 30 * 100);

        if (this.player){
            let forward = 0;
            let backward = 0;

            joystick = window.touchJoypad.sticks['joystick0'];

            if (!this.app.menuPanelEnabled && !this.app.isMarketEnabled){
                if (this.app.isMobile) {
                    if (joystick.y > 0) {
                        forward = 1;
                    } else if (joystick.y < 0) {
                        backward = 1;
                    }
                } else {
                    forward = (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP))
                    backward = (this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN))
                }
            }
            let move = (forward - backward) * 1;

            if (move !== 0 && this.camera) {
                let rb = this.collider.rigidbody;
                //let camForward = this.camera.forward.clone();
                //camForward.y = 0;
                //camForward.normalize();
                
                let dir = this.model.forward.clone().normalize();
                let currentSpeed = rb.linearVelocity.length();
                if (currentSpeed < this.maxSpeed) {
                    let force = dir.scale(this.moveForce * move * this.speedMul);
                    rb.applyForce(force);
                }
            }
                

            if ((this.app.mouse.isPressed(pc.MOUSEBUTTON_LEFT) || window.touchJoypad.buttons.wasPressed('bombButton')) && this.canSpawnBomb && !this.app.menuPanelEnabled && !this.app.isMarketEnabled) {
                this.canSpawnBomb = false;
                setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.canSpawnBomb = true;}, this.bombCooldown*1000);

                let forward = this.model.forward; // veya direction'ı nasıl alıyorsan
                //let spawnPos = this.model.getPosition().clone().add(forward.clone().scale(2.5)).add(new pc.Vec3(0, 1, 0))

                //let spawnPos = this.spline.getPosition(this.lastValue+.005).add(new pc.Vec3(0, 1, 0));
                let spawnPos = this.entity.findByName("BombSpawnPosition").getPosition();


                if(this.isOnline){
                    this.networkManager.room.send("Client:Bomb", {
                        position: spawnPos,
                        rotation: this.lerpRotation,
                        force : Math.max(this.collider.rigidbody.linearVelocity.length()/10, 1)
                    })
                } else {this.app.cartObbyCartManager.spawnBomb(null, spawnPos, this.lerpRotation, Math.max(this.collider.rigidbody.linearVelocity.length()/10, 1));}
            }
        }

        if (this.isOnline && this.networkManager.room.connection.isOpen === true){
            this.networkManager.room.send("Client:CartPosition", {
                id: this.cartData.id,
                x: this.collider.getPosition().x,
                y: this.collider.getPosition().y,
                z: this.collider.getPosition().z,
            });
        }
    } else if (this.targetPosition != null){
        let _position = this.collider.getPosition().clone();
        _position.lerp(_position, this.targetPosition, dt * 5);
        this.collider.setPosition(_position);
    }


    if (this.collider.rigidbody.linearVelocity.length() !== 0) {
        if (!this.collider.sound.isPlaying("drive")) {this.collider.sound.play("drive");}
    } else {this.collider.sound.stop("drive");}

    let speed = this.collider.rigidbody.linearVelocity.length();
    let ratio = speed / this.maxSpeed;
    let volume = Math.min(ratio*10, 1);
    let pitch = Math.max(Math.min(ratio*15, 2),1) * this.collidingGround;
    let slot = this.collider.sound.slot("drive") 
    this.volumeLerp = pc.math.lerp(this.volumeLerp, volume, .2);
    slot.volume = this.volumeLerp;
    slot.pitch = pitch

    let value = this.spline.getValue(this.collider.getPosition(), this.lastValue);
    
    if (this.collidingGround || this.shouldUpdateLastValue){this.lastValue = value;}

    let _rot = 0;
    if (this.app.rotOverrider){_rot = this.app.rotOverrider.getRotation();}
    else {_rot = this.spline.getRotation(value);}
    this.lerpRotation.slerp(this.lerpRotation, _rot, .2);

    this.model.setRotation(this.lerpRotation);
    //this.model.setRotation(this.collider.getRotation().clone());

    this.model.setPosition(this.collider.getPosition());


    this.collidingGround = (this.spline.distance < 25);

    //console.log("this.collidingGround", this.collidingGround);
    //console.log("this.spline.distance", this.spline.distance);

    
    if (!this.collidingGround && this.isLocal && this.player){
        this.offRailTimer+=dt;
        if (this.offRailTimer >= 1 && !this.isDieFired && (this.app.rotOverrider == null)){
            this.isDieFired = true;
            this.app.fire("playerDie");
        }
    } else {this.offRailTimer = 0;}
    //console.log(this.spline.distance);
    //console.log(this.cartData.splineIndex);

    if (this.isLocal){
        if (this.nitro.timer > 0){
            this.nitro.timer -= dt;
            if (this.nitro.timer <= 0){this.nitro.disable();}
        }
    }
};

CartObbyCart.prototype.onEnter = function(player, overrideValue = null, overridePosition = null){
    this.isDieFired = false;
    this.app.inCart = true;
    this.player = player;
    this.player.rigidbody.linearVelocity = pc.Vec3.ZERO;
    this.player.rigidbody.enabled = false;
    this.player.reparent(this.playerPoint);
    this.player.setLocalPosition(pc.Vec3.ZERO);
    this.player.setLocalScale(pc.Vec3.ONE);
    this.player.setLocalEulerAngles(0,0,0);
    this.player.script.cartObbyPlayerController.setCart(this);
    this.player.script.cartObbyPlayerController.setCamera();

    this.leaveable = false;
    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.leaveable = true}, 1 * 1000);

    if (overrideValue != null){
        this.shouldUpdateLastValue = true;
        setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.shouldUpdateLastValue = false}, 2000)
        this.lastValue = overrideValue
        this.collider.rigidbody.teleport(this.spline.getPosition(overrideValue));
        this.collider.rigidbody.linearVelocity = pc.Vec3.ZERO;
        //this.collider.angularVelocity = pc.Vec3.ZERO;
    }

    if (overridePosition != null){
        this.shouldUpdateLastValue = true;
        setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.shouldUpdateLastValue = false}, 2000)
        //this.lastValue = overrideValue
        this.collider.rigidbody.teleport(overridePosition);
        this.collider.rigidbody.linearVelocity = pc.Vec3.ZERO;
    }

    this.app.root.findByName("bombButton").enabled = true;
}

CartObbyCart.prototype.onExit = function(){
    this.app.inCart = false;
    this.player.rigidbody.linearVelocity = pc.Vec3.ZERO;
    this.player.rigidbody.enabled = true;
    this.player.reparent(this.app.root);
    //this.player.setLocalRotation(0,0,0,0);
    this.player.setLocalScale(pc.Vec3.ONE);
    this.player.script.cartObbyPlayerController.setCart(null);
    //this.player.script.cartObbyPlayerController.setCamera();
    this.player = null;

    this.rideable = false;
    this.mount.collision.enabled = false;
    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        if (this.mount && this.mount.collision){this.mount.collision.enabled = true;}
        this.rideable = true;
    }, 2 * 1000);

    this.app.root.findByName("bombButton").enabled = false;
}

 
 