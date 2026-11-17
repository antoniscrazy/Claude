var CartObbyPiston = pc.createScript('cartObbyPiston');

CartObbyPiston.attributes.add("reverse", {type:"boolean"});
CartObbyPiston.attributes.add("activeTime", {type:"number", default:3});

// initialize code called once per entity
CartObbyPiston.prototype.initialize = function() {
    this.pushEntity = this.entity.findByName("Piston.001");
    this.pushPosition = new pc.Vec3(0,0,-2);
    this.startPosition = new pc.Vec3(0,0,0);

    this.trigger = this.entity.findByName("Trigger");

    this.id = "piston" + this.getRandomId();
    this.trigger.script.cartObbyTrigger.fireName = this.id;
    //this.trigger.script.cartObbyTrigger.shouldReplicate = true;

    this.toggled = false;

    this.app.on(this.id, this.onTrigger, this);

    this.on('destroy', function () {
        this.app.off(this.id);
    }, this);

    if (this.reverse){
        this.pushEntity.setLocalPosition(this.pushPosition);
    }

    this.active = false;
};

CartObbyPiston.prototype.onTrigger = function () {
    if (this.active) return;
    this.active = true;

    // toggle state (ilk kez çalışıyorsa false kabul edilir)
    this.toggled = !this.toggled;

    let target;

    if (this.toggled) {
        // ileri hareket
        target = this.reverse ? this.startPosition : this.pushPosition;
    } else {
        // geri hareket
        target = this.reverse ? this.pushPosition : this.startPosition;
    }

    this.pushEntity
        .tween(this.pushEntity.getLocalPosition())
        .to(target, 0.3, pc.SineOut)
        .onComplete(() => {
            this.active = false;
        })
        .start();
};

CartObbyPiston.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};