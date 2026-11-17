var CartObbyBreakableWall = pc.createScript('cartObbyBreakableWall');

//CartObbyBreakableWall.attributes.add('explosionEffect', { type: 'asset' });
CartObbyBreakableWall.attributes.add('legoWallAsset', { type: 'asset' });

// initialize code called once per entity
CartObbyBreakableWall.prototype.initialize = function() {
    this.id = "BreakableWall" + this.getRandomId();
    this.serverId = "BreakableWallServer" + this.id;

    this.trigger = this.entity.findByName("Trigger");
    this.wall = this.entity.findByName("LegoWall");

    this.trigger.script.cartObbyTrigger2.fireName = this.id;
    this.trigger.script.cartObbyTrigger2.shouldReplicate = true;
    this.trigger.script.cartObbyTrigger2.print = true;
    this.trigger.script.cartObbyTrigger2.tags = ["Bomb"];
    this.app.on(this.id, this.onTrigger, this);

    this.breaked = false;

    this.on('destroy', function () {
        this.app.off(this.id);
    }, this);
};


CartObbyBreakableWall.prototype.onTrigger = function(){
    this.destroy();
}

CartObbyBreakableWall.prototype.destroy = function(){
    if (this.breaked){return;}else{this.breaked = true;}
    if (!this.wall){return;}

    //this.base.enabled = false;
    this.wall.script.cartObbyLegoWall.activate();

/*     let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.entity.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
        
    } */

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        this.breaked = false;

        let asset = this.legoWallAsset
        if (asset && asset.resource) {
            let instance = asset.resource.instantiate();
            let pos = this.entity.getPosition()
            let rot = this.entity.getRotation();
            instance.setPosition(pos);
            instance.setRotation(rot);
            this.app.root.addChild(instance);
            this.wall = instance;
        }

    }, 10 * 1000);
}

CartObbyBreakableWall.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};
