var CartObbyTrafficLightDoor = pc.createScript('cartObbyTrafficLightDoor');

CartObbyTrafficLightDoor.attributes.add("matNormal", {type:"asset"})
CartObbyTrafficLightDoor.attributes.add("matClosed", {type:"asset"})


// initialize code called once per entity
CartObbyTrafficLightDoor.prototype.initialize = function() {
    this.barrier = this.entity.findByName("Barrier").script.cartObbyBarrier;
    this.red = this.entity.findByName("Red");
    this.green = this.entity.findByName("Green");
    this.trigger = this.entity.findByName("Trigger");

    this.id = "barrier" + this.getRandomId();
    this.trigger.script.cartObbyTrigger.fireName = this.id;
    this.trigger.script.cartObbyTrigger.shouldReplicate = true;


    this.app.on(this.id, this.onTrigger, this);

    this.red.render.meshInstances[0].material = this.matNormal.resource;
    this.green.render.meshInstances[0].material = this.matClosed.resource;

    this.on('destroy', function () {
        this.app.off(this.id);
    }, this);
};

CartObbyTrafficLightDoor.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};

CartObbyTrafficLightDoor.prototype.destroy = function () {
    if (this.onTrigger) {
        this.app.off(this.id, this.onTrigger);
    }
};

CartObbyTrafficLightDoor.prototype.onTrigger = function(){
    this.barrier.trigger();

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        this.red.render.meshInstances[0].material = this.matNormal.resource;
        this.green.render.meshInstances[0].material = this.matClosed.resource;
    },4 * 1000)

    this.red.render.meshInstances[0].material = this.matClosed.resource;
    this.green.render.meshInstances[0].material = this.matNormal.resource;
}


