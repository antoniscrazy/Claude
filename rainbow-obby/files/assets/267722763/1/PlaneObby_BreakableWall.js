var PlaneObbyBreakableWall = pc.createScript('planeObbyBreakableWall');

PlaneObbyBreakableWall.attributes.add("health", {type:"number", default:3});
PlaneObbyBreakableWall.attributes.add('explosionEffect', { type: 'asset' });

// initialize code called once per entity
PlaneObbyBreakableWall.prototype.initialize = function() {
    this.id = "BreakableWall" + this.getRandomId();
    this.serverId = "BreakableWallServer" + this.id;

    this.trigger = this.entity.findByName("Trigger");
    this.trigger2 = this.entity.findByName("Trigger2");
    this.base = this.entity.findByName("Base");
    this.bar = this.entity.findByName("Bar");

    this.trigger.script.planeObbyTrigger.fireName = this.id;
    this.trigger.script.planeObbyTrigger.shouldReplicate = true;
    this.trigger.script.planeObbyTrigger.tags = ["LocalBullet"];
    this.trigger2.script.planeObbyTrigger.fireName = this.id;
    this.trigger2.script.planeObbyTrigger.shouldReplicate = true;
    this.trigger2.script.planeObbyTrigger.tags = ["LocalBullet"];

    { const handle = this.app.on(this.id, this.onTrigger, this); this.on('destroy', () => handle.off()); }

    this.text = this.entity.findByName("Text").element

    this.healthMax = this.health;
    this.healthCurrent = this.healthMax;

    this.updateText();
};


PlaneObbyBreakableWall.prototype.onTrigger = function(){
    this.healthCurrent = Math.max(this.healthCurrent-1, 0);

    //console.log(this.healthCurrent);
    this.updateText();

    //this.entity.fire("Motion");

    if (this.healthCurrent <= 0){
        this.destroy();
    }
}

PlaneObbyBreakableWall.prototype.destroy = function(){
    //this.entity.destroy();
    this.base.enabled = false;

    let asset = this.explosionEffect
    if (asset && asset.resource) {
        let instance = asset.resource.instantiate();
        let pos = this.entity.getPosition()
        instance.setPosition(pos);
        this.app.root.addChild(instance);
        
    }

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        this.base.enabled = true;
        this.healthCurrent = this.healthMax;
        this.updateText();
    }, 5 * 1000);
}

PlaneObbyBreakableWall.prototype.updateText = function(){
    this.text.text = this.healthCurrent + "/" + this.healthMax;

    let _percent = this.healthCurrent / this.healthMax


    this.bar.setLocalScale(new pc.Vec3(14*_percent, 1, 0.1));
    this.bar.setLocalPosition(new pc.Vec3(7- (14*_percent/2), 0, -0.1));
}


PlaneObbyBreakableWall.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};
