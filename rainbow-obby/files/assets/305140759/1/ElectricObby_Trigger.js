var ElectricObbyTrigger = pc.createScript('electricObbyTrigger');

ElectricObbyTrigger.attributes.add("fireName", {type:"string"});
ElectricObbyTrigger.attributes.add("fireNameLeave", {type:"string"});

ElectricObbyTrigger.attributes.add("args", {
    type: "string",
    array: true,
    default: []
});

ElectricObbyTrigger.attributes.add("shouldReplicate", {type:"boolean", default:false});
ElectricObbyTrigger.attributes.add("print", {type:"boolean", default:false});
ElectricObbyTrigger.attributes.add("tags", {type:"string", array:true, title:"Tags", default:["Player"]});

// initialize code called once per entity
ElectricObbyTrigger.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.electricObbyNetworkManager;

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
                this.app.fire(this.fireName, this.args);
                if (this.onTriggerEnter){this.onTriggerEnter(otherEntity, this.args);}
            }

            if (this.print){console.log(this.fireName);}
        }
    }, this);

    this.entity.collision.on("triggerleave", (otherEntity)=>{
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
                this.networkManager.room.send("Client:FireSignal", {signal: this.fireNameLeave});
            } else {
                this.app.fire(this.fireNameLeave, this.args);
                if (this.onTriggerLeave){this.onTriggerLeave(otherEntity, this.args);}
            }

            if (this.print){console.log(this.fireNameLeave);}
        }
    }, this);
};
