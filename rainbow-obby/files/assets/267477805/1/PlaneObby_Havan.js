var PlaneObbyHavan = pc.createScript('planeObbyHavan');

PlaneObbyHavan.attributes.add('bombAsset', { type: 'asset' });
PlaneObbyHavan.attributes.add("fireInterval", { type: "number", default: 3 });

// initialize
PlaneObbyHavan.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;
    this.shootPoint = this.entity.findByName("ShootPoint");
    this.defaultRotation = this.entity.getRotation().clone();
    this.timer = 0;
};

// update
PlaneObbyHavan.prototype.update = function (dt) {

    let closest = null;
    let closestDist = Infinity;

    if (this.networkManager.room) {
        for (let id in this.networkManager.playerEntities) {
            let ent = this.networkManager.playerEntities[id];

            let d = this.entity.getPosition().distance(ent.getPosition());
            if (d < closestDist) {
                closestDist = d;
                closest = ent;
            }
        }
    } else {
        closest = this.app.root.findByName("Player");
        closestDist = this.entity.getPosition().distance(closest.getPosition());
    }

    if (closest && closestDist < 200 && closestDist > 30) {

        // hedefe bak
        this.entity.lookAt(
            closest.getPosition().clone().add(closest.forward.clone().mulScalar(-15))
        );

        // Euler al
        let euler = this.entity.getLocalEulerAngles();

        // X ve Y clamp
        euler.x = pc.math.clamp(euler.x, -45, 45);
        euler.y = pc.math.clamp(euler.y, -45, 45);

        // geri uygula
        this.entity.setLocalEulerAngles(euler);

    } else {
        closest = null;
    }

    this.timer += dt;
    if (this.timer >= this.fireInterval) {
        this.timer = 0;
        if (closest && closestDist < 200) {
            this.spawnBomb();
        }
    }

    if (!closest) {
        this.entity.setRotation(this.defaultRotation);
    }
};

// bomba spawn
PlaneObbyHavan.prototype.spawnBomb = function () {
    if (!this.bombAsset || !this.bombAsset.resource) return;
    let bomb = this.bombAsset.resource.instantiate();

    let _position = this.shootPoint.getPosition();
    let _direction = this.entity.forward.clone();
    bomb.setPosition(_position);
    bomb.script.planeObbyBomb.direction = _direction;

    this.app.root.addChild(bomb);
};
