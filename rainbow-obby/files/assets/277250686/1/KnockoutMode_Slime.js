var KnockoutModeSlime = pc.createScript('knockoutModeSlime');

// initialize code called once per entity
KnockoutModeSlime.prototype.initialize = function() {
    this.id = "slime" + this.getRandomId();

    this.trigger = this.entity.findByName("Trigger").script.knockoutModeTrigger;
    this.model = this.entity.findByName("Model");

    this.trigger.fireName = this.id;
    this.trigger.shouldReplicate = true;
    this.trigger.tags = ["Player"];

    this.entity.tags.add(this.id);

    this.app.on(this.id, this.onTrigger, this);

    this.on('destroy', function () {
        this.app.off(this.id);
    }, this);
};

KnockoutModeSlime.prototype.onTrigger = function(){
    this.entity.findByName("Trigger").enabled = false;
    this.entity.sound.play("slime");

    // Önce büyüt
    this.model.tween(this.model.getLocalScale())
        .to(new pc.Vec3(3, 3, 3), 0.3, pc.SineOut)
        .onComplete(()=> {
            
            let _player = this.app.root.findByName("Player");
            if (_player.getPosition().clone().distance(this.model.getPosition()) <= 5){
                let dirToTarget = this.model.getPosition().clone().sub(_player.getPosition().clone()).normalize();
                dirToTarget.y = 0;
                this.app.gameManager.push(dirToTarget, 15);
            }

            this.model.tween(this.model.getLocalScale())
                .to(new pc.Vec3(0,0,0), 0.5, pc.SineInOut)
                .onComplete(()=> {
                    this.entity.destroy();
                })
                .start();

        })
        .start();
}

KnockoutModeSlime.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};