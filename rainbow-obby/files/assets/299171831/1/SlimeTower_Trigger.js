var SlimeTowerTrigger = pc.createScript('slimeTowerTrigger');

SlimeTowerTrigger.attributes.add("fireName", {type:"string"});
SlimeTowerTrigger.attributes.add("fireNameLeave", {type:"string"});

SlimeTowerTrigger.attributes.add("args", {
    type: "string",
    array: true,
    default: []
});

SlimeTowerTrigger.attributes.add("shouldReplicate", {type:"boolean", default:false});
SlimeTowerTrigger.attributes.add("print", {type:"boolean", default:false});
SlimeTowerTrigger.attributes.add("tags", {type:"string", array:true, title:"Tags", default:["Player"]});

// initialize code called once per entity
SlimeTowerTrigger.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.slimeTowerNetworkManager;

    this.entity.collision.on("triggerenter", (otherEntity)=>{
        this.handleEnter(otherEntity);
    }, this);

    this.entity.collision.on("triggerleave", (otherEntity)=>{
        this.handleLeave(otherEntity);
    }, this);

    // Solid (rigidbody) objects don't fire trigger events, they fire collision events instead
    this.entity.collision.on("collisionstart", (result)=>{
        if (result && result.other) {this.handleEnter(result.other);}
    }, this);

    this.entity.collision.on("collisionend", (otherEntity)=>{
        this.handleLeave(otherEntity);
    }, this);
};

SlimeTowerTrigger.prototype.handleEnter = function(otherEntity) {
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
};

SlimeTowerTrigger.prototype.handleLeave = function(otherEntity) {
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
};
