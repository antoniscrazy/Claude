var PlaneObbyDoor = pc.createScript('planeObbyDoor');

// initialize code called once per entity
PlaneObbyDoor.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;

    this.tweenTime = .5;

    this.doorLeft = this.entity.findByName("DoorLeft");
    this.doorRight = this.entity.findByName("DoorRight");
    this.trigger = this.entity.findByName("Trigger");

    this.id = "PowerDoor" + this.getRandomId();
    this.serverId = "PowerDoorServer" + this.id;
    this.trigger.script.planeObbyTrigger.fireName = this.id;
    this.trigger.script.planeObbyTrigger.shouldReplicate = true;
    this.trigger.script.planeObbyTrigger.tags = ["LocalBullet"];

    this.app.on(this.id, this.onTrigger, this);
    this.app.on(this.serverId, this.open, this);
    this.isOpen = false;

    this.on('destroy', function () {
        this.app.off(this.id);
        this.app.off(this.serverId);
    }, this);
};

PlaneObbyDoor.prototype.open = function () {

    this.app.fire("Motion", "DoorLeft");
    this.app.fire("Motion", "DoorRight");

    this.trigger.sound.play("button");
    this.entity.sound.play("open");

    this.isOpen = true;

    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.close();
        this.isOpen = false;
    }, 15 * 1000)

    // Sol kapı sola (-2)
    this.doorLeft
        .tween(this.doorLeft.getLocalPosition())
        .to({ x: 8 }, this.tweenTime, pc.SineIn)   // curved easing
        .onComplete(() => {
            this.app.fire("Motion:Stop", "DoorLeft");
        })
        .start();

    // Sağ kapı sağa (+2)
    this.doorRight
        .tween(this.doorRight.getLocalPosition())
        .to({ x: -8 }, this.tweenTime, pc.SineIn)
        .onComplete(() => {
            this.app.fire("Motion:Stop", "DoorRight");
        })
        .start();
};

PlaneObbyDoor.prototype.close = function () {
    this.app.fire("Motion", "DoorLeft");
    this.app.fire("Motion", "DoorRight");

    this.entity.sound.play("close");

    // Sol kapıyı x = 0
    this.doorLeft
        .tween(this.doorLeft.getLocalPosition())
        .to({ x: 0 }, this.tweenTime, pc.SineIn)
        .onComplete(() => {
            this.app.fire("Motion:Stop", "DoorLeft");
        })
        .start();

    // Sağ kapıyı x = 0
    this.doorRight
        .tween(this.doorRight.getLocalPosition())
        .to({ x: 0 }, this.tweenTime, pc.SineIn)
        .onComplete(() => {
            this.app.fire("Motion:Stop", "DoorRight");
        })
        .start();
};


PlaneObbyDoor.prototype.onTrigger = function () {
    if (this.isOpen) return;

    if (this.networkManager.room) {
        this.networkManager.room.send("Client:FireSignal", { signal: this.serverId })
    } else { this.open(); }
}


PlaneObbyDoor.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};


