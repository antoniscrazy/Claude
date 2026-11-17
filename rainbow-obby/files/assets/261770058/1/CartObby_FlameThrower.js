var CartObbyFlameThrower = pc.createScript('cartObbyFlameThrower');


CartObbyFlameThrower.attributes.add("timeShoot", {type:"number", default:3})
CartObbyFlameThrower.attributes.add("timeWait", {type:"number", default:2})
CartObbyFlameThrower.attributes.add('mode', {
    type: 'string',
    enum: [
        { 'Timed': 'timed' },
        { 'Signal': 'signal' }
    ],
    default: "signal",
    title: 'Mode'
});
CartObbyFlameThrower.attributes.add("signal", {type:"string"})

// initialize code called once per entity
CartObbyFlameThrower.prototype.initialize = function() {
    this.particle = this.entity.findByName("FlameParticle");
    this.state = new StateSystem;

    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player") || otherEntity.tags.has("Local")) {
            if (this.app.cartObbyPlayerController) {
                this.app.cartObbyPlayerController.dieOnCart();
            }
        }
    }, this);

    if (this.mode == "timed"){
        this.state.add("wait", {
            onStart: ()=>{
                this.particle.particlesystem.stop();
                this.entity.collision.enabled = false;

                setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                    this.state.set("shoot");
                },this.timeWait * 1000)
            },
        });

        this.state.add("shoot", {
            onStart: ()=>{
                this.particle.particlesystem.play();
                this.entity.collision.enabled = true;

                setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                    this.state.set("wait");
                },this.timeShoot * 1000)
            },
        });

        this.state.set("wait")
    } else if (this.mode == "signal"){
        this.state.add("wait", {
        onStart: ()=>{
            this.particle.particlesystem.stop();
            this.entity.collision.enabled = false;
        },
    })

        this.state.add("shoot", {
            onStart: ()=>{
                this.entity.collision.enabled = true;

                setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                    this.state.set("wait");
                },this.timeShoot * 1000)
            },
        })

        this.state.set("wait")

        this.app.on(this.signal, ()=>{
            this.state.set("shoot")
        }, this)
    }

    this.on('destroy', function () {
        this.app.off(this.signal);
    }, this);
};

// update code called every frame
CartObbyFlameThrower.prototype.update = function(dt) {
    this.state.update(dt)
};
