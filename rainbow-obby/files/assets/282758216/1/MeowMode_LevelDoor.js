var MeowModeLevelDoor = pc.createScript('meowModeLevelDoor');

MeowModeLevelDoor.attributes.add("unlockLevel", {type:"number", default:0});

// initialize code called once per entity
MeowModeLevelDoor.prototype.initialize = function() {
    this.text = this.entity.findByName("Text").element;
    this.model = this.entity.findByName("Model");
    this.text.text = "Level " + this.unlockLevel;


    this.app.on("LevelChanged", this.onLevelChanged, this);
    this.app.on("Connected", this.onConnected, this);

    this.on('destroy', function () {
        this.app.off("LevelChanged", this.onLevelChanged, this);
        this.app.off("Connected", this.onConnected, this);
    }, this);

    this.unlocked = false;
};

MeowModeLevelDoor.prototype.onConnected = function(){
    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        this.onLevelChanged(this.app.playerData.level);
    }, 2000);
}


MeowModeLevelDoor.prototype.onLevelChanged = function(_newLevel){
    if ((_newLevel >= this.unlockLevel) && !this.unlocked){
        this.unlocked = true;

        this.model.tween(this.model.getLocalScale())
            .to(new pc.Vec3(1,0,1), 1, pc.SineOut)
            .onComplete(() => {
                this.entity.destroy();
            })
            .start();
    }
};
