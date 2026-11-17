var CartObbySection = pc.createScript('cartObbySection');

// initialize code called once per entity
CartObbySection.prototype.initialize = function() {
    if (!this.app.section){this.app.section = null;}

    this.id = "Section" + this.getRandomId();
    
    this.entity.script.cartObbyTrigger2.fireName = this.id;
    this.entity.script.cartObbyTrigger2.shouldReplicate = false;
    this.entity.script.cartObbyTrigger2.tags = ["Player", "LocalCollider"];

    { const handle = this.app.on(this.id, this.onTrigger, this); this.on('destroy', () => handle.off()); }

    this.position = this.entity.findByName("SpawnPosition").getPosition().clone();
};

CartObbySection.prototype.onTrigger = function(){
    this.app.section = this.position;
    console.log(this.app.section);
}


CartObbySection.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};
