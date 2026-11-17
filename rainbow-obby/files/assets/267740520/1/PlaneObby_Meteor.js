var PlaneObbyMeteor = pc.createScript('planeObbyMeteor');

PlaneObbyMeteor.attributes.add('explosionEffect', { type: 'asset' });

// initialize code called once per entity
PlaneObbyMeteor.prototype.initialize = function() {
    this.autoExplodetime = 4;
    this.exploded = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;
    this.model = this.entity.findByName("Model");
    this.bombLaunchForce = 20;


    this.id = "Bomb" + this.getRandomId();
    this.hurtBox = this.entity.findByName("HurtBox");
    this.hurtBox.script.planeObbyTrigger.fireName = this.id;

    { const handle = this.app.on(this.id, ()=>{
        if (!this.exploded){
            this.explode();
        }
    }); this.on('destroy', () => handle.off()); }

    //this.model = this.entity.findByName("Model");
    //this.model.enabled = false;
    //setTimeout(()=>{if (this.model){this.model.enabled = true}}, 50);


    this.direction = new pc.Vec3(0,-1,0);
    let impulse = this.direction.scale(this.bombLaunchForce);

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.entity.destroy();}, 5*1000);
//this.entity.rigidbody.applyImpulse(impulse);

    let randomRot = new pc.Vec3(
        Math.random() * 360,
        Math.random() * 360,
        Math.random() * 360
    );
    //this.model.setEulerAngles(randomRot);

    //this.entity.sound.play("fuse")

/*     this.model.collision.on("triggerenter", (other)=>{
        if (other.tags.has("RemoteCollider")){
            other.parent.script.planeObbyPlane.reciveHit(this.entity, 2, "front", true);
            other.parent.script.planeObbyPlane.reciveHit(this.entity, 2, "back", true);
            other.parent.script.planeObbyPlane.reciveHit(this.entity, 2, "left", true);
            other.parent.script.planeObbyPlane.reciveHit(this.entity, 2, "right", true);

            console.log("BOMB TRIGGERED");
        }
    },this) */
};

// update code called every frame
PlaneObbyMeteor.prototype.update = function(dt) {
/*     this.autoExplodetime = Math.max(this.autoExplodetime-dt, 0);
    if (this.autoExplodetime <= 0 && !this.exploded){
        this.explode();
    } */

/*     let euler = this.model.getEulerAngles();

    // her eksende dönme hızı (derece cinsinden)
    euler.x += 100 * dt;  // saniyede 90 derece
    euler.y += 150 * dt;
    euler.z += 120 * dt;

    this.model.setEulerAngles(euler); */

    this.entity.translate(0, -.5, 0);
};


PlaneObbyMeteor.prototype.explode = function(){
    this.exploded = true;

/*     this.entity.rigidbody.enabled = false;
    this.entity.findByName("HitBox").rigidbody.enabled = true; */

    let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.entity.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
        
    }

    this.app.fire("playerDie:Sarkit");

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.entity.destroy();}, 100);

    
}

PlaneObbyMeteor.prototype.getRandomId = function () {
    return Math.random().toString(36).slice(2);
};


