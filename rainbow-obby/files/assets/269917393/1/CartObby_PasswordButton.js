var CartObbyPasswordButton = pc.createScript('cartObbyPasswordButton');

// initialize code called once per entity
CartObbyPasswordButton.prototype.initialize = function() {

    this.id = this.getRandomId();

    this.trigger = this.entity.findByName("Trigger");
    this.trigger.script.cartObbyTrigger2.fireName = this.id;
    this.trigger.script.cartObbyTrigger2.shouldReplicate = false;
    this.trigger.script.cartObbyTrigger2.tags = ["Player"];

    this.app.on(this.id, this.onTrigger, this);

    this.on('destroy', function () {
        this.app.off(this.id);
    }, this);

    this.active = false;
    this.pos0 = this.entity.getLocalPosition().clone();
    this.pos1 = this.entity.getLocalPosition().clone().add(new pc.Vec3(0,-.3,0));
};

CartObbyPasswordButton.prototype.onTrigger = function () {
    if (this.active) return;
    this.active = true;
    console.log("basladi")

    // ileri
    this.entity
        .tween(this.entity.getLocalPosition())
        .to(this.pos1, 0.3, pc.SineOut)
        .onComplete(() => {

            // geri
            this.entity
                .tween(this.entity.getLocalPosition())
                .to(this.pos0, 0.3, pc.SineIn)
                .onComplete(() => {
                    this.active = false;
                })
                .start();

        })
        .start();
};

CartObbyPasswordButton.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};
