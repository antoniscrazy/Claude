var MeowModeBoss = pc.createScript('meowModeBoss');

// initialize code called once per entity
MeowModeBoss.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.meowModeNetworkManager;

    this.player = this.app.root.findByName("Player")
    this.model = this.entity.findByName("Model");
    this.state = new StateSystem;
    this.state.autoStart = false;

    this.defRotation = this.entity.getRotation().clone();
    this.defPosition = this.entity.getPosition().clone();
    this.hitDirection = pc.Vec3.ZERO;

    this.targetQuat = new pc.Quat();
    this.lerpSpeed = 5;

    this.moveSpeedNormal = 5.0;
    this.moveSpeedReturn = 10.0;
    this.alertRadius = 15.0;
    this.attackRadius = 1.5;
    this.alertTime = 1.0;

    this.moveSpeed = this.moveSpeedNormal;

    this.id = "boss"+this.getRandomId();
    this.debugTextState = this.entity.findByName("Text");
    this.app.boss = this;


    this.points = [];
    this.targetPosition = null;
    let bossPoints = this.app.root.findByName("BossPoints");

    if (bossPoints) {
        var children = bossPoints.children;

        for (var i = 0; i < children.length; i++) {
            this.points.push(children[i].getPosition().clone());
        }
    }

    { const handle = this.app.on("Connected", this.onConnected, this); this.on('destroy', () => handle.off()); }

    this.state.add("idle", {
        onUpdate: (dt)=> {
/*             if (this.entity.getPosition().distance(this.player.getPosition()) <= this.alertRadius && !this.app.inCannon){
                this.state.set("alerted")
            }
 */
/*             if (this.state.hit(2)){
                this.state.set("wander");
            } */

            this.targetQuat = this.defRotation.clone();
        },

        onStart: ()=>{
            this.model.fire("Motion", "idle");
            console.log("state:idle");
            this.debugTextState.element.text = "idle";
        },

        onEnd: ()=>{
            this.model.fire("Motion:Stop", "idle");
        }
    });

    this.state.add("wander", {
        onStart: ()=>{
            this.targetPosition = this.getRandomPoint();
            console.log("state:wander");
            this.debugTextState.element.text = "wander";
        },

        onUpdate: (dt)=>{
            this.look(this.targetPosition);
            this.move(dt);

            if (this.entity.getPosition().distance(this.targetPosition) < 2){
                this.state.set("idle")
            }
        },
    })

    this.state.add("alerted", {
        onUpdate: (dt)=> {
            this.look(this.player.getPosition());
            if (this.entity.getPosition().distance(this.player.getPosition()) > this.alertRadius || this.app.inCannon){
                this.state.set("idle")
            }

            if (this.state.hit(this.alertTime)){
                this.state.set("chase")
            };
        },

        onStart: ()=>{
            console.log("state:alerted");
        },

    });

    this.state.add("chase", {
        onUpdate: (dt)=> {
            this.look(this.player.getPosition());
            this.move(dt);

            if (this.entity.getPosition().distance(this.player.getPosition()) > this.alertRadius || this.app.inCannon){
                this.state.set("return");
            }

/*             if (this.entity.getPosition().distance(this.player.getPosition()) < this.attackRadius){
                this.state.set("attack");
            } */
        },

        onStart: ()=>{
            this.model.fire("Motion", "shake");
            console.log("state:chase");
        },

        onEnd: ()=>{
            this.model.fire("Motion:Stop", "shake");
        }
    });

    this.state.add("attack", {
        onUpdate:()=>{
            this.look(this.player.getPosition());
        },

        onStart:()=>{
        },
    })

    this.state.add("return", {
        onUpdate: (dt)=> {
            this.look(this.defPosition);
            this.move(dt);

            if (this.entity.getPosition().distance(this.defPosition) < 1.5){
                this.state.set("idle");
            }
        },

        onStart: ()=>{
            console.log("state:return");
            if (this.entity.getPosition().distance(this.defPosition) > 50){
                this.entity.setPosition(this.defPosition);
                this.state.set("idle");
            } else {
                this.moveSpeed = this.moveSpeedReturn;
            }
        },

        onEnd: ()=>{
            this.moveSpeed = this.moveSpeedNormal;  
        }
    });

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.state.set("idle");}, 500)
};

// update code called every frame
MeowModeBoss.prototype.update = function(dt) {
    this.state.update(dt);

    let currentQuat = this.entity.getRotation().clone();
    currentQuat.slerp(currentQuat, this.targetQuat, dt * this.lerpSpeed);
    this.entity.setRotation(currentQuat);
};

MeowModeBoss.prototype.onConnected = function(){

};

MeowModeBoss.prototype.getRandomPoint = function(){
    return this.points[Math.floor(Math.random() * this.points.length)];
}

MeowModeBoss.prototype.look = function(_position) {
    let rot = this.entity.getRotation().clone();

    this.entity.lookAt(_position);
    this.targetQuat.copy(this.entity.getRotation());

    this.entity.setRotation(rot);
}

MeowModeBoss.prototype.move = function(dt) {
    let forward = this.entity.forward.clone();
    forward.normalize();

    let move = forward.scale(this.moveSpeed * dt);
    this.entity.translate(move);
}


MeowModeBoss.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};

