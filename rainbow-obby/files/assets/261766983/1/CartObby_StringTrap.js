var CartObbyStringTrap = pc.createScript('cartObbyStringTrap');

CartObbyStringTrap.attributes.add("signal", {type:"string"});

// initialize code called once per entity
CartObbyStringTrap.prototype.initialize = function() {
    this.trigger = this.entity.findByName("Trigger").script.cartObbyTrigger;
    this.trigger.fireName = this.signal;

    this.app.on(this.signal, ()=>{console.log(this.signal)}, this);

    this.on('destroy', function () {
        this.app.off(this.signal);
    }, this);
};


