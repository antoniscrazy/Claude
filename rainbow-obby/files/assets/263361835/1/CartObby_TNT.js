var CartObbyTnt = pc.createScript('cartObbyTnt');

CartObbyTnt.attributes.add('explosionEffect', { type: 'asset' });
CartObbyTnt.attributes.add('normalMat', { type: 'asset', assetType: 'material' });
CartObbyTnt.attributes.add('whiteMat', { type: 'asset', assetType: 'material' });

// initialize code called once per entity
CartObbyTnt.prototype.initialize = function() {
    this.autoExplodetime = 3;
    this.exploded = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;
    this.model = this.entity.findByName("Model");
    this.blinkTime = 0.5;              
    this.timer = 0;
    this.isWhite = false;

    this.bombLaunchForce = 25;

    this.entity.rigidbody.teleport(this.tntData.position.x, this.tntData.position.y, this.tntData.position.z)

    this.isOwned = false;
    if (this.networkManager.room){this.isOwned = this.tntData.ownerId == this.networkManager.room.sessionId;}
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
CartObbyTnt.prototype.update = function(dt) {
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


CartObbyTnt.prototype.explode = function(){
    this.exploded = true;
    let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.entity.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
        
    }

    if (this.isOwned){
        let cartManager = this.app.cartObbyCartManager;
        if (cartManager && cartManager.carts) {
            let bombPos = this.entity.getPosition();
            let explosionRadius = 15; // menzili değiştirilebilir

            // Tüm cartları gez
            for (let id in cartManager.carts) {
                console.log("searching")
                let cart = cartManager.carts[id];
                if (!cart || !cart.script || !cart.script.cartObbyCart) continue;

                let cartPos = cart.script.cartObbyCart.collider.getPosition();
                let distance = bombPos.distance(cartPos);

                //console.log("cartPos", cartPos, "bombPos", this.entity.getPosition(), "distance", distance)

                // Yakındaki cart'lara hasar ver
                if (distance <= explosionRadius) {
                    cart.script.cartObbyCart.reciveHit(this.entity, 3, "front");
                    cart.script.cartObbyCart.reciveHit(this.entity, 3, "back");
                    cart.script.cartObbyCart.reciveHit(this.entity, 3, "left");
                    cart.script.cartObbyCart.reciveHit(this.entity, 3, "right");

                    console.log("bomb hit")
                }
            }
        }
    }

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.entity.destroy();}, 200);
    
}



