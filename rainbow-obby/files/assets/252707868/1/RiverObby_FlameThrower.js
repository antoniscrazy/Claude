var RiverObbyFlameThrower = pc.createScript('riverObbyFlameThrower');

RiverObbyFlameThrower.attributes.add("timeShoot", {type:"number", default:3})
RiverObbyFlameThrower.attributes.add("timeWait", {type:"number", default:2})

// initialize code called once per entity
RiverObbyFlameThrower.prototype.initialize = function() {
    this.particle = this.entity.findByName("FlameParticle");
    this.state = new StateSystem;

    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            const playerController = otherEntity.script.riverObbyPlayerController;
            if (playerController) {
                playerController.died();
            }
        }
    }, this);

    this.state.add("wait", {
        onStart: ()=>{
            this.particle.particlesystem.stop();
            this.entity.collision.enabled = false;

            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                this.state.set("shoot");
            },this.timeWait * 1000)
        },
    })

    this.state.add("shoot", {
        onStart: ()=>{
            this.particle.particlesystem.play();
            this.entity.collision.enabled = true;

            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                this.state.set("wait");
            },this.timeShoot * 1000)
        },
    })

    this.state.set("wait")
};

// update code called every frame
RiverObbyFlameThrower.prototype.update = function(dt) {
    this.state.update(dt)
};
