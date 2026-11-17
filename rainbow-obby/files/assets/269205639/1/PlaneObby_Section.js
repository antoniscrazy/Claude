var PlaneObbySection = pc.createScript('planeObbySection');

// initialize code called once per entity
PlaneObbySection.prototype.initialize = function() {
    if (!this.app.section){this.app.section = null;}

    this.id = "Section" + this.getRandomId();
    
    this.entity.script.planeObbyTrigger.fireName = this.id;
    this.entity.script.planeObbyTrigger.shouldReplicate = false;
    this.entity.script.planeObbyTrigger.tags = ["Player", "LocalCollider"];

    { const handle = this.app.on(this.id, this.onTrigger, this); this.on('destroy', () => handle.off()); }

    this.position = this.entity.findByName("SpawnPosition").getPosition().clone();
};

PlaneObbySection.prototype.onTrigger = function(){
    this.app.section = this.position;
    console.log(this.app.section);
}


PlaneObbySection.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};
