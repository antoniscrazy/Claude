var CartObbyTrigger2 = pc.createScript('cartObbyTrigger2');

CartObbyTrigger2.attributes.add("fireName", {type:"string"});
CartObbyTrigger2.attributes.add("shouldReplicate", {type:"boolean", default:false});
CartObbyTrigger2.attributes.add("print", {type:"boolean", default:false});
CartObbyTrigger2.attributes.add("tags", {type:"string", array:true, title:"Tags", default:["Player"]});

// initialize code called once per entity
CartObbyTrigger2.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;

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
