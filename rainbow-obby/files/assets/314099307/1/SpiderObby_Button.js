var SpiderObbyButton = pc.createScript('spiderObbyButton');

SpiderObbyButton.attributes.add("fireName", {type:"string"});
SpiderObbyButton.attributes.add("shouldReplicate", {type:"boolean", default:false});
SpiderObbyButton.attributes.add("print", {type:"boolean", default:false});

// initialize code called once per entity
SpiderObbyButton.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.spiderObbyNetworkManager;

    this.id = "button" + this.getRandomId();
    this.app.on(this.id, this.onTrigger, this);
    this.trigger = this.entity.findByName("Trigger");

    this.on('destroy', function () {
        this.app.off(this.id);
    }, this);

    this.active = false;
    this.pos0 = this.trigger.getLocalPosition().clone();
    //this.pos1 = this.trigger.getLocalPosition().clone().add(new pc.Vec3(0,-.2,0));
    this.pos1 = this.entity.findByName("TriggerPressPos").getLocalPosition().clone();
};

SpiderObbyButton.prototype.setup = function(fireName, shouldReplicate = false, shouldPrint = false, method = null){
    this.trigger.script.spiderObbyTrigger.fireName = this.id;
    this.trigger.script.spiderObbyTrigger.shouldReplicate = false;
    this.trigger.script.spiderObbyTrigger.print = false;
    this.trigger.script.spiderObbyTrigger.tags = ["Player"];
    
    this.fireName = fireName;
    this.shouldReplicate = shouldReplicate;
    this.shouldPrint = shouldPrint;
    this.method = method;
}


SpiderObbyButton.prototype.onTrigger = function () {
    if (this.active) return;
    this.active = true;

    if (this.method != null){
        this.method();
    } else {
        if (this.shouldReplicate && this.networkManager.room){
            this.networkManager.room.send("Client:FireSignal", {signal: this.fireName});
        } else {
            this.app.fire(this.fireName);
        }
    }

    if (this.shouldPrint){console.log(this.fireName);}

    // ileri
    this.trigger
        .tween(this.trigger.getLocalPosition())
        .to(this.pos1, 0.3, pc.SineOut)
        .onComplete(() => {

            // geri
            this.trigger
                .tween(this.trigger.getLocalPosition())
                .to(this.pos0, 0.3, pc.SineIn)
                .onComplete(() => {
                    this.active = false;
                })
                .start();

        })
        .start();
};

SpiderObbyButton.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};
