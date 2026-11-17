var PlaneObbyTrigger = pc.createScript('planeObbyTrigger');

PlaneObbyTrigger.attributes.add("fireName", {type:"string"});
PlaneObbyTrigger.attributes.add("shouldReplicate", {type:"boolean", default:false});
PlaneObbyTrigger.attributes.add("print", {type:"boolean", default:false});
PlaneObbyTrigger.attributes.add("tags", {type:"string", array:true, title:"Tags", default:["Player"]});

// initialize code called once per entity
PlaneObbyTrigger.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;

    this.entity.collision.on("triggerenter", (otherEntity)=>{
        let hasAnyTag = false;

        for (let i = 0; i < this.tags.length; i++) {
            let tag = this.tags[i];
            if (otherEntity.tags.has(tag)) {
                hasAnyTag = true;
                break;
            }
        }

        if (hasAnyTag) {
            otherEntity.fire("Triggered");
            this.fire("Triggered");

            if (this.shouldReplicate && this.networkManager.room){
                this.networkManager.room.send("Client:FireSignal", {signal: this.fireName});
            } else {
                this.app.fire(this.fireName);
            }

            if (this.print){console.log(this.fireName);}
        }
    }, this);
};
