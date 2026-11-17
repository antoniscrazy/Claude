var CartObbySpawner = pc.createScript('cartObbySpawner');

CartObbySpawner.attributes.add('splineIndex', {type: 'number', description: 'Spline Index'});

// initialize code called once per entity
CartObbySpawner.prototype.initialize = function() {
    this.cartManager = this.app.root.findByName("CartManager").script.cartObbyCartManager;
    this.spawn = this.entity.findByName("Spawn");
    this.trigger = this.entity.findByName("Trigger").script.cartObbyTrigger;

    this.id = "spawner" + this.getRandomId();
    this.trigger.fireName = this.id;

    this.app.on(this.id, ()=>{
        this.cartManager.createCart(this.spawn.getPosition(), this.splineIndex);
        this.app.lastSpline = this.splineIndex;
    });


    this.on('destroy', function () {
        this.app.off(this.id);
    }, this);
};


CartObbySpawner.prototype.getRandomId = function(){
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}



