var KnockoutModeSpikeBall = pc.createScript('knockoutModeSpikeBall');

// initialize code called once per entity
KnockoutModeSpikeBall.prototype.initialize = function() {
    this.id = "spikeBall" + this.getRandomId();
    this.idDestroy = this.id + "Destroy";

    this.trigger = this.entity.findByName("Trigger").script.knockoutModeTrigger;
    this.model = this.entity.findByName("Model");

    this.trigger.fireName = this.id;
    this.trigger.tags = ["Player"];

    this.entity.tags.add(this.id);

    this.app.on(this.id, this.onTrigger, this);
    this.app.on(this.idDestroy, this.onDestroy, this);

    this.on('destroy', function () {
        this.app.off(this.id);
        this.app.off(this.idDestroy);
    }, this);
};

KnockoutModeSpikeBall.prototype.onTrigger = function(){
    let _player = this.app.root.findByName("Player");
    let dirToTarget = _player.getPosition().clone().sub(this.entity.getPosition().clone()).normalize();
    let velLength = this.app.knockoutModePlayerController.entity.rigidbody.linearVelocity.clone().length();
    dirToTarget.y = 0;
    this.app.gameManager.push(dirToTarget.clone(), Math.max(10, velLength) *2);

    this.app.knockoutModeNetworkManager.fire(this.idDestroy, true);
}

KnockoutModeSpikeBall.prototype.onDestroy = function(){
    this.entity.findByName("Trigger").enabled = false;
    this.entity.sound.play("spike");

    let code = this;
    let entity = this.model;
    var startScale = entity.getLocalScale().clone();
    var targetUp = startScale.clone().scale(1.25);

    // Önce büyüt
    entity.tween(entity.getLocalScale())
        .to(new pc.Vec3(1.4, 1.4, 1.4), 0.1, pc.ExponentialIn)
        .onComplete(function () {
            // Sonra küçült
            entity.tween(entity.getLocalScale())
                .to(new pc.Vec3(0,0,0), 1, pc.SineInOut)
                .onComplete(function () {
                    code.entity.destroy();
                })
                .start();

        })
        .start();
}

KnockoutModeSpikeBall.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};