var PlaneObbyRing = pc.createScript('planeObbyRing');

// initialize code called once per entity
PlaneObbyRing.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;

    this.collected = false;

    this.entity.collision.on("triggerenter", (other) => {
        if (other && other.tags && other.tags.has("LocalCollider")) {
            this.networkManager.collectCoin();
            this.entity.fire("Motion")
            this.collected = true;
            this.entity.setLocalScale(1, 1, 1);
            this.entity.sound.play("collect");
        }
    })
};


PlaneObbyRing.prototype.update = function (dt) {
    if (this.collected) {
        let currentScale = this.entity.getLocalScale().clone();
        currentScale.lerp(currentScale, new pc.Vec3(0, 0, 0), 6 * dt);
        this.entity.setLocalScale(currentScale);
        this.entity.rotateLocal(0, 10, 0);

        if (this.entity.getLocalScale().x < .01) { this.entity.destroy(); }
    } else {
        this.entity.rotateLocal(0, 0, 1);
    }
};

