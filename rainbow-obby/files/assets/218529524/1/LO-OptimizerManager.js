var LoOptimizerManager = pc.createScript('loOptimizerManager');
LoOptimizerManager.attributes.add("coins", { type: "entity", array: true })
LoOptimizerManager.attributes.add("stages", { type: "entity", array: true })
LoOptimizerManager.attributes.add("stagesProps", { type: "entity", array: true })

// initialize code called once per entity
LoOptimizerManager.prototype.initialize = function () {
    this.gLight = this.app.root.findByName("Light").light;
    this.app.isEndLadderObby = false;
    this.app.on("OptimizeTrigger", this.trigger, this);
    this.app.on("AllChunkEnabled", this.allChunkEnabled, this);

    this.on("destroy", () => {
        this.app.off("OptimizeTrigger", this.trigger, this);
        this.app.off("AllChunkEnabled", this.allChunkEnabled, this);

    }, this)
};
LoOptimizerManager.prototype.allChunkEnabled = function () {
    for (let item of this.stages) {
        item.enabled = true;
    }
    for (let item of this.stagesProps) {
        item.enabled = true;
    }
}
// update code called every frame
LoOptimizerManager.prototype.trigger = function () {
    if (this.app.isEndLadderObby) return;
    console.log("chunk reload")
    this.allEnabledFalse();
    if (this.app.stage > 0) {
        this.coins[this.app.stage - 1].enabled = true;
        this.stages[this.app.stage - 1].enabled = true;
        //this.stagesProps[this.app.stage - 1].enabled = true;
    }
    if (this.app.stage < this.coins.length - 1) {
        this.coins[this.app.stage + 1].enabled = true;
        this.stages[this.app.stage + 1].enabled = true;
        //this.stagesProps[this.app.stage + 1].enabled = true;
    }
    if (this.coins[this.app.stage] != undefined)
        this.coins[this.app.stage].enabled = true;
    if (this.stages[this.app.stage] != undefined)
        this.stages[this.app.stage].enabled = true;
    if (this.stagesProps[this.app.stage] != undefined)
        this.stagesProps[this.app.stage].enabled = true;

    this.gLight.shadowUpdateMode = pc.SHADOWUPDATE_REALTIME;
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        console.log("-----> SHADOW UPDATE ONCE")
        this.gLight.shadowUpdateMode = pc.SHADOWUPDATE_NONE;
    }, 10);
};
LoOptimizerManager.prototype.allEnabledFalse = function () {
    for (let i = 0; i < this.coins.length; i++) {
        this.coins[i].enabled = false;
        this.stages[i].enabled = false;
        this.stagesProps[i].enabled = false;
    }
};