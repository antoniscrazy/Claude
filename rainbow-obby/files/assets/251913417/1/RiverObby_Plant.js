var RiverObbyPlant = pc.createScript('riverObbyPlant');

// initialize code called once per entity
RiverObbyPlant.prototype.initialize = function() {
    this.head_t = this.entity.findByName("Head_T")
    this.head_b = this.entity.findByName("Head_B")

    this.state = new StateSystem;

    this.state.add("idle", {
        onUpdate: (dt)=> {
            if (this.entity.getPosition().distance(this.app.riverObbyNetworkManager.localPlayer.getPosition()) <= 30 && !this.app.isDied){
                this.state.set("trigger")
            }
        },
    });

    this.state.add("trigger",{
        onUpdate: (dt)=> {
            if (this.entity.getPosition().distance(this.app.riverObbyNetworkManager.localPlayer.getPosition()) > 30){
                this.state.set("idle")
            }
        },

        onStart: ()=>{
            let o = {t:0}
            let head_t = this.head_t
            this.entity.tween(o)
                .to({t:1}, .2, pc.Linear)
                .onUpdate(function (dt) {
                    head_t.setLocalEulerAngles(0,0,pc.math.lerp(0,-50,o.t));
                })
                .start();

        },

        onEnd: ()=>{
            let o = {t:0}
            let head_t = this.head_t
            this.entity.tween(o)
                .to({t:1}, .2, pc.Linear)
                .onUpdate(function (dt) {
                    head_t.setLocalEulerAngles(0,0,pc.math.lerp(-50,0,o.t));
                })
                .start();
        }
    });

    this.state.add("eat")

    this.state.set("idle")

    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            const playerController = otherEntity.script.riverObbyPlayerController;
            if (playerController) {
                let ent = this.entity.findByName("RotateBone")
                ent.tween(ent.getLocalEulerAngles())
                    .rotate(new pc.Vec3(-25, 0, 0), .2, pc.Linear)
                    .yoyo(true)
                    .repeat(2)
                    .start();

                setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                    playerController.died();
                    this.state.set("idle")
                }, 100)
                
            }
        }
    }, this);
};

// update code called every frame
RiverObbyPlant.prototype.update = function(dt) {
    this.state.update(dt)

    if (this.app.riverObbyNetworkManager.localPlayer){
        let lookAt = this.entity.getPosition().clone().sub(this.app.riverObbyNetworkManager.localPlayer.getPosition().clone()).normalize()
        let quat = new pc.Quat();
        quat.setFromEulerAngles(0, Math.atan2(lookAt.x, lookAt.z) * pc.math.RAD_TO_DEG, 0);
        this.entity.setRotation(quat)
    }
};


