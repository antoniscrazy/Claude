var LoStageTrigger = pc.createScript('loStageTrigger');
LoStageTrigger.attributes.add("stageId", { type: "number" });
LoStageTrigger.attributes.add("player", { type: "entity" });
LoStageTrigger.attributes.add("ladder", { type: "entity" });
LoStageTrigger.attributes.add("stagePoints", { type: "entity", array: true });
LoStageTrigger.attributes.add("isManager", { type: "boolean" });
LoStageTrigger.attributes.add("stageText", { type: "entity" });


// initialize code called once per entity
LoStageTrigger.prototype.initialize = function () {
    if (this.isManager)
        this.app.stageTrigger = this;
    if (this.stageId == 0) {
        if (Utils.getItem("loStage")) {
            this.app.currentStage = Number.parseInt(Utils.getItem("loStage"));
            this.player.rigidbody.teleport(this.stagePoints[this.app.currentStage].getPosition().clone());
            this.ladder.rigidbody.teleport(this.stagePoints[this.app.currentStage].children[0].getPosition().clone().add(new pc.Vec3(1, 0.189, 0, 0.645)))
        }
        else {
            this.app.currentStage = 0;
            Utils.setItem("loStage", 0)
            this.player.rigidbody.teleport(this.stagePoints[this.app.currentStage].getPosition().clone());
            this.ladder.rigidbody.teleport(this.stagePoints[this.app.currentStage].children[0].getPosition().clone().add(new pc.Vec3(1, 0.189, 0, 0.645)))
        }
        this.app.root.findByName("StageUIText").element.text = this.app.currentStage;
    }
    this.entity.collision.on("triggerenter", this.triggerEnter, this);

};

// update code called every frame
LoStageTrigger.prototype.triggerEnter = function (event) {
    if (event.tags.has("Player")) {
        if (this.app.currentStage < this.stageId) {
            this.app.currentStage = this.stageId;
            Utils.setItem("loStage", this.stageId);
            if (this.stageId == 4) {
                this.app.fire("lo-EndGame");
            }
            this.app.root.findByName("StageUIText").element.text = this.stageId;
        }
        this.app.stage = this.stageId;
        this.app.fire("OptimizeTrigger");
    }
};
