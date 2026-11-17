var RiverObbyTongueMonster = pc.createScript('riverObbyTongueMonster');

// initialize code called once per entity
RiverObbyTongueMonster.prototype.initialize = function() {

    this.state = new StateSystem;
    this.playerController;
    this.catchPosition;
    this.eatPosition = this.entity.findByName("barnacle_tongue").getPosition().clone();
    this.tongue = this.entity.findByName("barnacle_tongue")
    this.head = this.entity.findByName("Head")
    this.rb;

    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            const playerController = otherEntity.script.riverObbyPlayerController;
            if (playerController) {
                this.playerController = playerController;
                this.catchPosition = otherEntity.getPosition().clone()
                this.rb = otherEntity.rigidbody;
                this.state.set("catch")
            }
        }
    }, this);

    this.state.add("idle", {
        onStart: ()=>{
            this.entity.collision.enabled = true;
        },
    })

    this.state.add("catch", {
        onStart: ()=>{
            let p2 = this.eatPosition.clone();

            let p = this.playerController;
            let s = this.state;
            let r = this.rb;
            let t = this.tongue;
            let h = this.head;

            this.entity.collision.enabled = false;
            
            let progress = {t:0}
            this.entity.tween(progress)
                .to({ t: 1 }, 2.0, pc.Linear)
                .onUpdate(function (dt) {
                    r.teleport(new pc.Vec3().lerp(p1,p2,progress.t));
                    t.setLocalScale(1,1-progress.t,1);
                })
                .onComplete(function(){
                    p.died();

                    let progress = {t:0}
                    this.entity.tween(progress)
                        .to({ t: 1 }, .25, pc.Linear)
                        .onUpdate(function (dt) {
                            let scale = 1 + 0.25 * Math.sin(Math.PI * progress.t); 
                            h.setLocalScale(scale,scale,scale)
                            h.setLocalPosition(0, -0.5 * Math.sin(Math.PI * progress.t),0)
                        })
                        .onComplete(()=>{
                            s.set("recovery")
                        })
                        .start();
                        })

                .start();

        },
    })

    this.state.add("recovery", {
        onStart: ()=>{
            let s = this.state;
            let t = this.tongue;

            let progress = {t:0}
            this.entity.tween(progress)
                .to({ t: 1 }, 1.0, pc.Linear)
                .onUpdate(function (dt) {
                    t.setLocalScale(1,progress.t,1);
                })
                .onComplete(function(){
                    s.set("idle")
                })
                .start();
        },
    })

    this.state.set("idle")
};

// update code called every frame
RiverObbyTongueMonster.prototype.update = function(dt) {
    this.state.update(dt)
};

