var KnockoutModeCheckpoint = pc.createScript('knockoutModeCheckpoint');

//KnockoutModeCheckpoint.attributes.add("chunkEntity", {type:"entity"});
KnockoutModeCheckpoint.attributes.add("firstSection", {type:"entity"});
KnockoutModeCheckpoint.attributes.add('mats', { type: 'asset', assetType: 'material', array: true });

// initialize code called once per entity
KnockoutModeCheckpoint.prototype.initialize = function () {
    this.knockoutModeNetworkManager = this.app.root.findByName("NetworkManager").script.knockoutModeNetworkManager;
    this.checkpointIndex = this.entity.parent.children.indexOf(this.entity);
    this.flag = this.entity.findByName("Flag");
    this.flagMeshInstance = this.flag.children[0].render.meshInstances[0];

    this.points = {
        start: this.entity.findByName("SpawnPoint"),
        end: this.entity.findByName("EndPoint"),
    }
    
    
    if ((KnockoutMode_Utils.getItem("KNOCKOUTMODE_Checkpoint") >= this.checkpointIndex && KnockoutMode_Utils.getItem("KNOCKOUTMODE_Checkpoint") > 0) || this.checkpointIndex === 0) {
        this.complete(true);
    }

    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player") || otherEntity.tags.has("LocalCollider")) {
            this.complete();
        }
    }, this);

    this.app.on("resetStage", this.resetStage, this);
    this.app.on("checkpointChanged", this.checkpointChanged, this);

    { const handle = this.app.on("nextCheckpoint"); this.on('destroy', () => handle.off()); }

    this.entity.on('destroy', function () {
        this.app.off("resetStage", this.resetStage, this);
        this.app.off("checkpointChanged", this.checkpointChanged, this);
    }, this);

    this.isActive = false;
};

KnockoutModeCheckpoint.prototype.complete = function (noTween) {
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

        this.knockoutModeNetworkManager.setCheckpoint(this.checkpointIndex);
    }
    if (this.flagMeshInstance == null) {
        this.flagMeshInstance = this.flag.children[0].render.meshInstances[0];
    }
    if (this.flagMeshInstance)
        this.flagMeshInstance.material = this.mats[1].resource;
    this.completed = true;
};

KnockoutModeCheckpoint.prototype.resetStage = function () {
    if (this.flagMeshInstance == null) {
        this.flagMeshInstance = this.flag.children[0].render.meshInstances[0];
    }

    if (this.flagMeshInstance)
        this.flagMeshInstance.material = this.mats[0].resource;
    this.completed = false;
};

KnockoutModeCheckpoint.prototype.checkpointChanged = function () {
    console.log("checkpoint changed", this.app.checkpoint);

    let _isCurrent = (this.app.checkpoint == this.checkpointIndex);
    //this.chunkEntity.enabled = _isCurrent;
    //this.entity.findByName("Models").enabled = _isCurrent
    this.isActive = _isCurrent;

    if (_isCurrent){
        this.app.section = this.firstSection.getPosition();
        console.log("checkpoint")
    }
}


KnockoutModeCheckpoint.prototype.update = function(){
/*     if (this.isActive && this.knockoutModeNetworkManager.localPlayer){

        let _startPos = this.points.start.getPosition().clone();
        let _endPos = this.points.end.getPosition().clone();
        let _playerPos = this.knockoutModeNetworkManager.localPlayer.getPosition().clone();

        let _dist1 = _endPos.sub(_startPos);
        let _dist2 = _playerPos.sub(_startPos);

        let _t = _dist2.dot(_dist1) / _dist1.lengthSq();
        _t = pc.math.clamp(_t, 0, 1);
        let _p = Math.floor(_t*100);

        this.knockoutModeNetworkManager.stagePercentageText.text = _p + "%";
        this.knockoutModeNetworkManager.stagePercentagePin.setLocalPosition(_t*540, -40, 0);
    } */
}

