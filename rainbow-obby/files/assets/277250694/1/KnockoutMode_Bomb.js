var KnockoutModeBomb = pc.createScript('knockoutModeBomb');

KnockoutModeBomb.attributes.add('explosionEffect', { type: 'asset' });

// initialize code called once per entity
KnockoutModeBomb.prototype.initialize = function() {
    this.id = "bomb" + this.getRandomId();

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

KnockoutModeBomb.prototype.onTrigger = function(){
    this.entity.findByName("Trigger").enabled = false;

    let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.model.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
        
    }

    // Önce büyüt
    this.model.tween(this.model.getLocalScale())
        .to(new pc.Vec3(1.4, 1.4, 1.4), 0.1, pc.ExponentialIn)
        .onComplete(()=> {
            
            let _player = this.app.root.findByName("Player");
            if (_player.getPosition().clone().distance(this.model.getPosition()) <= 5){
                let dirToTarget = _player.getPosition().clone().sub(this.model.getPosition().clone()).normalize();
                dirToTarget.y = 0;
                this.app.gameManager.push(dirToTarget, 25);
            }

            this.model.tween(this.model.getLocalScale())
                .to(new pc.Vec3(0,0,0), 1, pc.SineInOut)
                .onComplete(()=> {
                    this.entity.destroy();
                })
                .start();

        })
        .start();
}

KnockoutModeBomb.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};