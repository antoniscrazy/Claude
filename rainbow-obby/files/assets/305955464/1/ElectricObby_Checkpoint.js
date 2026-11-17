var ElectricObbyCheckpoint = pc.createScript('electricObbyCheckpoint');

ElectricObbyCheckpoint.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.electricObbyNetworkManager;
    this.checkpointIndex = this.entity.parent.children.indexOf(this.entity);
    this.spawnPoint = this.entity.findByName("SpawnPoint");
    this.completed = false;

    if (this.getSavedCheckpoint() >= this.checkpointIndex) {
        this.complete(true);
    }

    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player") || otherEntity.tags.has("LocalCollider")) {
            this.complete();
        }
    }, this);

    this.app.on("resetStage", this.resetStage, this);

    this.entity.on('destroy', function () {
        this.app.off("resetStage", this.resetStage, this);
    }, this);
};

ElectricObbyCheckpoint.prototype.getSavedCheckpoint = function () {
    let saved = Number.parseInt(ElectricObby_Utils.getItem("ElectricObby_Checkpoint"));
    return isNaN(saved) ? -1 : saved;
};

ElectricObbyCheckpoint.prototype.complete = function (silent) {
    if (this.completed) return;

    if (silent != true) {
        this.app.fire("WarningTextController:setWarning", "Checkpoint reached!", null, new pc.Color(0, 1, 0, 1));

        if (this.checkpointIndex > this.getSavedCheckpoint()) {
            this.networkManager.setCheckpoint(this.checkpointIndex);
        }
    }

    this.completed = true;
};

ElectricObbyCheckpoint.prototype.resetStage = function () {
    this.completed = false;
};
