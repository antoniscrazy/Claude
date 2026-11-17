var IqTestModePowerupSignal = pc.createScript('iqTestModePowerupSignal');

IqTestModePowerupSignal.attributes.add("callback", {type:"string"});

IqTestModePowerupSignal.prototype.initialize = function() {
    this.entity.collision.on("triggerenter", this.triggerenter, this);
    this.entity.collision.on("triggerleave", this.triggerleave, this);

    this.entity.findByName("AdCount").enabled = false;
    this.entity.findByName("AdImage").enabled = false;
};

IqTestModePowerupSignal.prototype.triggerenter = function (entity) {
    if (entity.tags.has("Player")) {
        this.app.fire(this.callback);
        this.entity
            .tween(this.entity.getLocalScale())
            .to(new pc.Vec3(1.25, 1.25, 1.25), .2, pc.SineOut)
            .yoyo(true)
            .repeat(2)
            .start();
    }

    this.entity.sound.play("pickup");
};

