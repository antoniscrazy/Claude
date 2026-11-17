var PlaneObbySpawner = pc.createScript('planeObbySpawner');

// initialize code called once per entity
PlaneObbySpawner.prototype.initialize = function () {
    this.planeManager = this.app.root.findByName("PlaneManager").script.planeObbyPlaneManager;
    this.spawn = this.entity.findByName("Spawn");
    this.trigger = this.entity.findByName("Trigger").script.planeObbyTrigger;

    this.id = "spawner" + this.getRandomId();
    this.trigger.fireName = this.id;

    this.spawn.render.enabled = false;
    this.defaultPos = this.trigger.entity.getLocalPosition().clone();
    this.pressedOffset = new pc.Vec3(0, -0.08, 0); // aşağı inme miktarı
    this.pressTween = null;

    this.app.on(this.id, () => {
        let pos = this.spawn.getPosition().clone();
        pos.x += (Math.random() * 10) - 5;
        this.planeManager.createPlane(pos);
        this.onPress();
    });

    this.on('destroy', function () {
        this.app.off(this.id);
    }, this);
};


PlaneObbySpawner.prototype.getRandomId = function () {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}


PlaneObbySpawner.prototype.onPress = function () {
    // Aktif tween varsa güvenli şekilde durdur
    if (this.pressTween) {
        this.pressTween.stop();
        this.pressTween = null;
        this.trigger.entity.setLocalPosition(this.defaultPos);
    }

    const downPos = this.defaultPos.clone().add(this.pressedOffset);

    // Aşağı in
    this.pressTween = this.trigger.entity
        .tween(this.trigger.entity.getLocalPosition())
        .to(downPos, 0.25, pc.SineOut)
        .yoyo(true)
        .repeat(2)
        .start();
};
