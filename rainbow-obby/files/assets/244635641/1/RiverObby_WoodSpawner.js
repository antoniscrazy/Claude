var RiverObbyWoodSpawner = pc.createScript('riverObbyWoodSpawner');
RiverObbyWoodSpawner.attributes.add('woodTemplate', { type: 'asset', assetType: 'template' });

RiverObbyWoodSpawner.prototype.initialize = function () {
    this.canSpawnWood = false;
    this.spawnPoints = this.entity.findByName("SpawnPoints").children;
    this.activationTrigger = this.entity.findByName("Trigger");
    this.activationTrigger.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) this.canSpawnWood = true;
    }, this);
    this.lastSpawnTime = 0;
};

RiverObbyWoodSpawner.prototype.update = function (dt) {
    if (this.canSpawnWood == false) return;

    if (this.lastSpawnTime < Date.now()) {
        this.lastSpawnTime = Date.now() + 3000;
        const spawnedWood = this.woodTemplate.resource.instantiate();
        console.log("this.spawnPoints.length", this.spawnPoints.length, this.spawnPoints)
        this.spawnPoints[Math.floor(pc.math.random(0, this.spawnPoints.length))].addChild(spawnedWood);
        spawnedWood.rigidbody.teleport(spawnedWood.parent.getPosition(), new pc.Vec3(0, 90, 0));
        spawnedWood.rigidbody.applyTorqueImpulse(1, 0, 0)
    }
};