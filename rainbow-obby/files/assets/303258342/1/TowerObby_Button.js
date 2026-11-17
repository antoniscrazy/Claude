var TowerObbyButton = pc.createScript('towerObbyButton');

TowerObbyButton.attributes.add("fireName", {type:"string"});
TowerObbyButton.attributes.add("shouldReplicate", {type:"boolean", default:false});
TowerObbyButton.attributes.add("print", {type:"boolean", default:false});

// initialize code called once per entity
TowerObbyButton.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.towerObbyNetworkManager;

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

TowerObbyButton.prototype.setup = function(fireName, shouldReplicate = false, shouldPrint = false, method = null){
    this.trigger.script.towerObbyTrigger.fireName = this.id;
    this.trigger.script.towerObbyTrigger.shouldReplicate = false;
    this.trigger.script.towerObbyTrigger.print = false;
    this.trigger.script.towerObbyTrigger.tags = ["Player"];
    
    this.fireName = fireName;
    this.shouldReplicate = shouldReplicate;
    this.shouldPrint = shouldPrint;
    this.method = method;
}


TowerObbyButton.prototype.onTrigger = function () {
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

TowerObbyButton.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};
