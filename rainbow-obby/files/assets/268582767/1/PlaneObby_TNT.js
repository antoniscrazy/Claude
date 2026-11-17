var PlaneObbyTnt = pc.createScript('planeObbyTnt');

PlaneObbyTnt.attributes.add('explosionEffect', { type: 'asset' });
PlaneObbyTnt.attributes.add('normalMat', { type: 'asset', assetType: 'material' });
PlaneObbyTnt.attributes.add('whiteMat', { type: 'asset', assetType: 'material' });

// initialize code called once per entity
PlaneObbyTnt.prototype.initialize = function() {
    this.autoExplodetime = 3;
    this.exploded = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;
    this.model = this.entity.findByName("Model");
    this.blinkTime = 0.5;              
    this.timer = 0;
    this.isWhite = false;

    this.bombLaunchForce = 25;

    console.log("tnt spawned")

    //this.entity.rigidbody.teleport(this.tntData.position.x, this.tntData.position.y, this.tntData.position.z)

    this.isOwned = false;
    if (this.networkManager.room){this.isOwned = this.ownerId == this.networkManager.room.sessionId;}
    else {this.isOwned = true}
    if (this.isOwned){this.entity.tags.add("Local");}

    let randomRot = new pc.Vec3(
        Math.random() * 360,
        0,0
    );
    //this.model.setEulerAngles(randomRot);

    this.entity.sound.play("fuse")

    //this.model.render.materialAssets(this.whiteMat);

    console.log("whiteMat", this.whiteMat);
};

// update code called every frame
PlaneObbyTnt.prototype.update = function(dt) {
    this.autoExplodetime = Math.max(this.autoExplodetime-dt, 0);
    if (this.autoExplodetime <= 0 && !this.exploded){
        this.explode();
    }

    let euler = this.model.getEulerAngles();

    // her eksende dönme hızı (derece cinsinden)
    euler.x += 100 * dt;  // saniyede 90 derece
    euler.y += 150 * dt;
    euler.z += 120 * dt;

    //this.model.setEulerAngles(euler);

    this.timer += dt;
    if (this.timer >= this.blinkTime) {
        this.timer = 0;
        this.isWhite = !this.isWhite;

        // material değiştir
        this.model.render.material = (this.isWhite ? this.whiteMat: this.normalMat);
        if (this.isWhite){
            this.model.render.meshInstances[0].material = this.whiteMat.resource;
        } else {this.model.render.meshInstances[0].material = this.normalMat.resource;}
    }
};


PlaneObbyTnt.prototype.explode = function(){
    this.exploded = true;
    let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.entity.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
        
    }

    if (this.isOwned){
        this.entity.findByName("HitBox").rigidbody.enabled = true;
    }

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.entity.destroy();}, 200);
    
}



