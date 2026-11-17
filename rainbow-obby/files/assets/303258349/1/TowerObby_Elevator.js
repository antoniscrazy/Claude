var TowerObbyElevator = pc.createScript('towerObbyElevator');

TowerObbyElevator.attributes.add('riseHeight', { type: 'number', default: 69, title: 'Rise Height' });
TowerObbyElevator.attributes.add('riseDuration', { type: 'number', default: 6, title: 'Rise Duration' });
TowerObbyElevator.attributes.add('fallDuration', { type: 'number', default: 4, title: 'Fall Duration' });

// initialize code called once per entity
TowerObbyElevator.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.towerObbyNetworkManager;

    //this.cabin = this.entity.findByName("Cabin");
    this.counter = this.entity.findByName("Counter").element;
    this.counter.enabled = false;

    this.pos0 = this.entity.getLocalPosition().clone();
    this.pos1 = this.pos0.clone().add(new pc.Vec3(0, this.riseHeight, 0));

    this.id = "Elevator" + this.getRandomId();
    this.idAd = this.id + "AdYes";
    this.serverId = this.id + "Server";

    this.idNo = this.id + "AdNo";

    this.app.on(this.id, this.onTrigger, this);
    this.app.on(this.serverId, this.runElevator, this);
    this.on(this.idAd, this.onAdYes, this);
    this.on(this.idNo, this.onAdNo, this);

    this.on('destroy', function () {
        this.app.off(this.serverId);
        this.app.off(this.id);
    }, this);

    this.active = false;

    this.entity.collision.on("triggerenter", (otherEntity) => {
        if (otherEntity.tags.has("Player")) {
            this.onTrigger();
        }
    }, this);
};

TowerObbyElevator.prototype.onAdYes = function () {
    this.app.adRewarder.watchAd(() => this.networkManager.fire(this.serverId, true));
    this.active = true;
    console.log("on yes");
};

TowerObbyElevator.prototype.onAdNo = function () {
    //this.app.trollObbyNetworkManager.room.send("Client:Attackable", { attackable: true });
};

TowerObbyElevator.prototype.runElevator = function () {
    console.log("run elavator");
    this.active = true;

    this.counter.enabled = true;
    this.counter.text = "5";
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "4"; }, 1000);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "3"; }, 2000);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "2"; }, 3000);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "1"; }, 4000);
    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "0"; }, 5000);
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.counter.enabled = false;
        // ileri

        this.entity
            .tween(this.entity.getLocalPosition())
            .to(this.pos1, this.riseDuration, pc.SineInOut)
            .onComplete(() => {

                // geri
                setTimeout(() => { if (this.entity && !this.entity.script) return;

                    this.counter.enabled = true;
                    this.counter.text = "5";
                    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "4"; }, 1000);
                    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "3"; }, 2000);
                    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "2"; }, 3000);
                    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "1"; }, 4000);
                    setTimeout(() => { if (this.entity && !this.entity.script) return; this.counter.text = "0"; }, 5000);

                    setTimeout(() => { if (this.entity && !this.entity.script) return;
                        this.counter.enabled = false;
                        this.entity
                            .tween(this.entity.getLocalPosition())
                            .to(this.pos0, this.fallDuration, pc.SineInOut)
                            .onComplete(() => {
                                this.active = false;
                            })
                            .start();
                    }, 6000);
                }, 3 * 1000);

            })
            .start();
    }, 6000);

}

TowerObbyElevator.prototype.onTrigger = function () {
    if (this.active) return;

    this.app.towerObbyPopupController.showPopup("Ad Break?", "Would you like to watch an ad to run the elevator?", true, this, this.idAd, this.idNo, null, true, true);
}

TowerObbyElevator.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
}