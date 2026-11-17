var RiverObbyHorhet = pc.createScript('riverObbyHorhet');

RiverObbyHorhet.attributes.add("waitTime", { type: "number", default: 1 })
RiverObbyHorhet.attributes.add("moveTime", { type: "number", default: 1.5 })

// initialize code called once per entity
RiverObbyHorhet.prototype.initialize = function () {
    this.sign = false;
    this.targetPosition;

    this.startPos = this.entity.getPosition().clone();
    this.endPos = this.entity.findByName("EndPositionEntity").getPosition().clone();

    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            const playerController = otherEntity.script.riverObbyPlayerController;
            if (playerController) {
                playerController.died();
            }
        }
    }, this);

    this.state = new StateSystem;

    this.state.add("turn", {
        onStart: ()=>{
            this.sign = !this.sign;
            if (this.sign) { this.targetPosition = this.endPos; }
            else { this.targetPosition = this.startPos; }

            let startPos = this.entity.getPosition().clone();
            let endPos = this.targetPosition.clone();

            let lookAt = endPos.clone().sub(startPos.clone()).normalize()
            let quat = new pc.Quat();
            quat.setFromEulerAngles(0, Math.atan2(lookAt.x, lookAt.z) * pc.math.RAD_TO_DEG, 0);

            this.entity.tween(this.entity.getLocalRotation())
                .to(quat, .5, pc.Linear)
                .yoyo(true)
                .start();

            setTimeout(() => { if (this.entity && !this.entity.script) return;
                this.state.set("go")
            }, 1000)
        },
    });

    this.state.add("go", {
        onStart: ()=>{
            let startPos = this.entity.getPosition().clone();
            let endPos = this.targetPosition.clone();
            let state = this.state;
            let ownerEntity = this.entity;

            let progress = { t: 0 };
            this.entity.tween(progress)
                .to({ t: 1 }, this.moveTime * 2, pc.Linear)
                .onUpdate(function (dt) {
                    startPos.lerp(startPos, endPos, progress.t)
                    this.entity.setPosition(startPos);
                })
                .onComplete(function () {
                    setTimeout(() => {
                        if (ownerEntity.script) state.set("turn");
                    }, this.waitTime * 1000);
                })
                .start();
        },
    });

    this.state.set("turn");
};

// update code called every frame
RiverObbyHorhet.prototype.update = function (dt) {
    this.state.update(dt);
};
