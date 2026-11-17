var PlaneObbyBullet = pc.createScript('planeObbyBullet');

PlaneObbyBullet.attributes.add('explosionEffect', { type: 'asset' });

// initialize code called once per entity
PlaneObbyBullet.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;
    this.isOnline = this.networkManager.room != null;
    if (this.isOnline) { this.isLocal = (this.networkManager.room.sessionId == this.ownerId); } else { this.isLocal = true; }

    setTimeout(() => { if (this.entity && !this.entity.script) return; this.entity.destroy(); }, 2 * 1000);
    setTimeout(() => { if (this.entity && !this.entity.script) return; if (this.entity.rigidbody) this.entity.rigidbody.enabled = true; }, 100);


    this.id = "Bullet" + this.getRandomId();

    this.trigger = this.entity.findByName("HurtBox");
    this.trigger.script.planeObbyTrigger.fireName = this.id;
    //this.trigger.script.planeObbyTrigger.shouldReplicate = true;
    this.trigger.script.planeObbyTrigger.tags = ["Ground"];


    if (this.isLocal) {
        this.entity.tags.add("LocalBullet");
        //console.log("LocalBullet ADded")
    } else {
        this.entity.tags.add("RemoteBullet");

        console.log("RemoteBullet")
    }

    this.entity.on("Triggered", this.triggered, this);
    this.app.on(this.id, this.triggered, this);

    let randomRot = new pc.Vec3(
        0,
        0,
        Math.random() * 360
    );

    let children = this.entity.children;

    for (let i = 0; i < children.length; i++) {
        if (i === this.skin || children[i].name == "HurtBox") {
            children[i].enabled = true;
            children[i].setLocalEulerAngles(randomRot);
        } else {
            children[i].enabled = false;
        }
    }


    this.on('destroy', function () {
        this.app.off(this.id);
    }, this);
};

PlaneObbyBullet.prototype.update = function (dt) {
    let speed = -275;
    let forward = this.entity.forward.clone();
    this.entity.translate(forward.scale(speed * dt));
};


PlaneObbyBullet.prototype.effect = function () {
    let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.entity.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
    }
}

PlaneObbyBullet.prototype.triggered = function () {
    this.effect();
    this.entity.destroy();
}

PlaneObbyBullet.prototype.getRandomId = function () {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}