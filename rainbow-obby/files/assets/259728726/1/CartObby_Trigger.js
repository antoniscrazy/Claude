var CartObbyTrigger = pc.createScript('cartObbyTrigger');

CartObbyTrigger.attributes.add("fireName", {type:"string"})
CartObbyTrigger.attributes.add("shouldReplicate", {type:"boolean", default:false})

// initialize code called once per entity
CartObbyTrigger.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;

    this.entity.collision.on("triggerenter", (otherEntity)=>{
        if (otherEntity.tags.has("Player")){
            if (this.shouldReplicate && this.networkManager.room){
                this.networkManager.room.send("Client:FireSignal", {signal: this.fireName})
            } else {this.app.fire(this.fireName);}
        }
    }, this)
};
