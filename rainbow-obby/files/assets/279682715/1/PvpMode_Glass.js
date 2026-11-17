var PvpModeGlass = pc.createScript('pvpModeGlass');

PvpModeGlass.attributes.add("shouldBreak", {type:"boolean"});

PvpModeGlass.attributes.add("materialSolid", { type: 'asset', assetType: 'material' });
PvpModeGlass.attributes.add("materialBreak", { type: 'asset', assetType: 'material' });

// initialize code called once per entity
PvpModeGlass.prototype.initialize = function() {
    if (!this.shouldBreak){
        this.entity.rigidbody.enabled = true;
        this.entity.render.meshInstances[0].material = this.materialSolid.resource;
    } else {
        this.serverId = "glass" + this.getRandomId() + "Server";

        this.trigger = this.entity.findByName("Trigger").script.pvpModeTrigger;

            this.trigger.fireName = this.serverId;
            this.trigger.shouldReplicate = true;
            this.trigger.print = true;
            this.trigger.tags = ["Player"];

        this.app.on(this.serverId, this.onTrigger, this);
        this.entity.render.meshInstances[0].material = this.materialBreak.resource;

        this.on('destroy', function () {
            this.app.off(this.serverId);
        }, this);
    }
};

PvpModeGlass.prototype.onTrigger = function(){
    this.entity.render.enabled = false;


    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        if (!this.shouldBreak){this.entity.rigidbody.enabled = true;}

        if (this.entity && this.entity.render){
            this.entity.render.enabled = true;
        }
    }, 5*1000);
}


PvpModeGlass.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};



