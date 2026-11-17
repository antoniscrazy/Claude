var CartObbyBomb = pc.createScript('cartObbyBomb');

CartObbyBomb.attributes.add('explosionEffect', { type: 'asset' });

// initialize code called once per entity
CartObbyBomb.prototype.initialize = function() {
    this.autoExplodetime = 1;
    this.exploded = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;
    this.model = this.entity.findByName("Model");
    this.bombLaunchForce = 25;

    this.entity.rigidbody.teleport(this.bombData.position.x, this.bombData.position.y, this.bombData.position.z)

    let q = new pc.Quat(this.bombData.rotation.x, this.bombData.rotation.y, this.bombData.rotation.z, this.bombData.rotation.w);
    this.entity.setRotation(q);


    let forward = this.entity.forward.clone().normalize();
    let impulse = forward.scale(this.bombLaunchForce * this.bombData.force);
    this.entity.rigidbody.applyImpulse(impulse);

    if (this.networkManager.room){
        this.isOwned = this.bombData.ownerId == this.networkManager.room.sessionId
    } else {this.isOwned = true;}
    
    //if (this.isOwned){this.entity.tags.add("Local");}
    this.entity.tags.add("Bomb");

    let randomRot = new pc.Vec3(
        Math.random() * 360,
        Math.random() * 360,
        Math.random() * 360
    );
    this.model.setEulerAngles(randomRot);

    this.entity.sound.play("fuse")

    this.model.collision.on("triggerenter", (other)=>{
        if (other.tags.has("RemoteCollider")){
            other.parent.script.cartObbyCart.reciveHit(this.entity, 2, "front", true);
            other.parent.script.cartObbyCart.reciveHit(this.entity, 2, "back", true);
            other.parent.script.cartObbyCart.reciveHit(this.entity, 2, "left", true);
            other.parent.script.cartObbyCart.reciveHit(this.entity, 2, "right", true);

            console.log("BOMB TRIGGERED");
        }
    },this)
};

// update code called every frame
CartObbyBomb.prototype.update = function(dt) {
    this.autoExplodetime = Math.max(this.autoExplodetime-dt, 0);
    if (this.autoExplodetime <= 0 && !this.exploded){
        this.explode();
    }

    let euler = this.model.getEulerAngles();

    // her eksende dönme hızı (derece cinsinden)
    euler.x += 100 * dt;  // saniyede 90 derece
    euler.y += 150 * dt;
    euler.z += 120 * dt;

    this.model.setEulerAngles(euler);
};


CartObbyBomb.prototype.explode = function(){
    this.exploded = true;

    this.model.collision.enabled = true;

    let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.entity.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
    }

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.entity.destroy();}, 200);
}



