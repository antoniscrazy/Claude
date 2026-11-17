var RiverObbyPiranha = pc.createScript('riverObbyPiranha');


RiverObbyPiranha.attributes.add("waitTime", {type:"number", default : 1})
RiverObbyPiranha.attributes.add("jumpHeight", {type:"number", default : 3})

// initialize code called once per entity
RiverObbyPiranha.prototype.initialize = function() {
    this.sign = false;
    this.targetPosition;
    this.jumpHeight = this.jumpHeight*1
    this.entity.mouth = this.entity.findByName("piranha_mouth")
    this.entity.splash = this.entity.findByName("Splash")

    //this.entity.render.enabled = false;
    //this.entity.mouth.render.enabled = false;

    this.startPos = this.entity.getPosition().clone().sub(new pc.Vec3(0,3,0));
    this.entity.setPosition(this.startPos);
    //this.startPos = this.startPos
    this.endPos = this.entity.findByName("TargetPositionEntity").getPosition().clone()//.sub(new pc.Vec3(0,2,0));

    //this.endPos = this.endPos.sub(new pc.Vec3(0,2,0))
    this.sinRandom = Math.random() * Math.PI * 200

    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            const playerController = otherEntity.script.riverObbyPlayerController;
            if (playerController) {
                playerController.died();
            }
        }
    }, this);

    this.state = new StateSystem;

    this.state.add("wait",{
        onStart: ()=>{
            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                this.state.set("jump")
            }, this.waitTime*1000)

            this.entity.collision.enabled = false;
        },
    });

    this.state.add("jump",{
        onStart: ()=>{
            console.log("jump balikkk")
            this.sign = !this.sign;
            if (this.sign){this.targetPosition = this.endPos;}
            else {this.targetPosition = this.startPos;}

            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                this.entity.collision.enabled = true;
            }, 250)

            //this.entity.render.enabled = true;
            //this.entity.mouth.render.enabled = true;

            let startPos = this.entity.getPosition().clone();
            let endPos = this.targetPosition.clone();
            let jumpHeight = this.jumpHeight

            let progress = { t: 0 };
            let splashedEnd = false;
            let splashedStart = false;
            let sinRandom = + this.sinRandom;
            let splash = this.entity.splash.particlesystem;
            this.entity.tween(progress)
                .to({ t: 1 }, 2.0, pc.Linear) 
                .onUpdate(function (dt) {
                    let x = pc.math.lerp(startPos.x, endPos.x, progress.t);
                    let z = pc.math.lerp(startPos.z, endPos.z, progress.t);
                    //let y = startPos.y + Math.sin(progress.t * Math.PI) * jumpHeight;

                    let lerpY = startPos.y + (endPos.y - startPos.y) * progress.t; 
                    let arc = Math.sin(progress.t * Math.PI) * jumpHeight;
                    let y = lerpY + arc;


                    let lookAt = endPos.clone().sub(startPos.clone()).normalize()
                    let diveAngle = -80 + progress.t * 120
                    let quat = new pc.Quat();

                    let wiggleAngle = Math.sin(progress.t*50 + sinRandom) * 15;
                    quat.setFromEulerAngles(diveAngle, (Math.atan2(lookAt.x, lookAt.z) * pc.math.RAD_TO_DEG) + wiggleAngle, 0);

                    this.entity.setRotation(quat);
                    this.entity.setPosition(x, y, z);

                    if (progress.t > .2 && !splashedStart){
                        splashedStart = true;
                        splash.reset();
                        splash.play();
                    }

                    if (progress.t > .8 && !splashedEnd){
                        splashedEnd = true;
                        splash.reset();
                        splash.play();
                    }
                })
                .onComplete(function(){
                    //this.entity.render.enabled = false;
                    //this.entity.mouth.render.enabled = false;

                    this.entity.setRotation(0,0,0);
                })
                .start();

            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                this.state.set("wait");
            }, 3000);

        },
    });

    this.state.set("wait");
};

RiverObbyPiranha.prototype.update = function(dt) {
    this.state.update(dt)
};

