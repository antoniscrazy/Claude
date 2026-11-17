var RiverObbyCheckpoint = pc.createScript('riverObbyCheckpoint');

// initialize code called once per entity
RiverObbyCheckpoint.prototype.initialize = function () {
    this.riverObbyNetworkManager = this.app.root.findByName("NetworkManager").script.riverObbyNetworkManager;
    this.stageNumber = this.entity.parent.children.indexOf(this.entity);
    this.flag = this.entity.children[0].children[0];
    this.flagMeshInstance = this.flag.children[0].render.meshInstances[0];
    this.map = this.entity.findByName("Map");
    this.map.enabled = this.stageNumber == this.app.currentStage;

    if ((this.app.currentStage >= this.stageNumber && this.app.currentStage > 0) || this.stageNumber === 0) {
        this.complete(true);
    }

    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            this.complete();
        }
    }, this);

    this.app.on("resetStage", this.resetStage, this);
    this.app.on("stageChanged", this.stageChanged, this);
    this.entity.on('destroy', function () {
        this.app.off("resetStage", this.resetStage, this);
        this.app.off("stageChanged", this.stageChanged, this);
    }, this);

};

RiverObbyCheckpoint.prototype.complete = function (noTween) {
    if (this.completed) return;
    if (noTween != true) {
        let progress = {t:0}
        this.flag.tween(progress)
            .to({t:1}, 0.4, pc.Linear)
            .onUpdate(()=>{
                this.flag.setLocalEulerAngles(0,progress.t*360,0);
                this.flag.setLocalPosition(0,Math.sin(progress.t * Math.PI) * .1,0);
                let scale = 1 + Math.sin(progress.t * Math.PI) * .2
                this.flag.setLocalScale(scale,scale,scale);
            })
            .start();

        this.riverObbyNetworkManager.increaseStage(this.stageNumber);
    }
    if (this.flagMeshInstance == null) {
        this.flagMeshInstance = this.flag.children[0].render.meshInstances[0];
    }
    if (this.flagMeshInstance)
        this.flagMeshInstance.material = this.riverObbyNetworkManager.stageMats[1].resource;
    this.completed = true;
};

RiverObbyCheckpoint.prototype.resetStage = function () {
    if (this.flagMeshInstance == null) {
        this.flagMeshInstance = this.flag.children[0].render.meshInstances[0];
    }

    this.flag.tween(this.flag.getLocalEulerAngles()).rotate({ x: 0, y: 0, z: 180 }, 0.2, pc.Linear).start();
    if (this.flagMeshInstance)
        this.flagMeshInstance.material = this.riverObbyNetworkManager.stageMats[0].resource;
    this.completed = false;
};

RiverObbyCheckpoint.prototype.stageChanged = function (newStage) {
    this.map.enabled = this.stageNumber == newStage;
}