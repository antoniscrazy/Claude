var PvpModeGameTrigger = pc.createScript('pvpModeGameTrigger');

// initialize code called once per entity
PvpModeGameTrigger.prototype.initialize = function() {
    this.trigger = this.entity.findByName("Trigger").script.pvpModeTrigger;
    this.trigger.tags = ["Player"];

    this.trigger.onTriggerEnter = ()=>this.onTriggerEnter();
    this.trigger.onTriggerLeave = ()=>this.onTriggerLeave();
};

PvpModeGameTrigger.prototype.onTriggerEnter = function(){
    this.app.pvpModeNetworkManager.send("Client:SetIsReady", {boolean:true});
    this.app.gameManager.sfx_ready();
}

PvpModeGameTrigger.prototype.onTriggerLeave = function(){
    this.app.pvpModeNetworkManager.send("Client:SetIsReady", {boolean:false});
    //this.app.gameManager.sfx_unready();
}

