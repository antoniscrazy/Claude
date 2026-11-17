var KnockoutModeWall = pc.createScript('knockoutModeWall');

// initialize code called once per entity
KnockoutModeWall.prototype.initialize = function() {
    this.id = "wall" + this.getRandomId();
    this.idDamage = this.id + "damage";

    this.trigger = this.entity.findByName("Trigger").script.knockoutModeTrigger;
    this.models = this.entity.findByName("Models");

    this.trigger.fireName = this.id;
    this.trigger.shouldReplicate = false;
    this.trigger.tags = ["Player"];

    this.entity.tags.add(this.id);

    this.app.on(this.id, this.onTrigger, this);
    this.app.on(this.idDamage, this.onDamage, this);

    this.hp = 3;

    this.on('destroy', function () {
        this.app.off(this.id);
        this.app.off(this.idDamage);
    }, this);
};

KnockoutModeWall.prototype.onTrigger = function(){
    let _player = this.app.root.findByName("Player");
    let dirToTarget = _player.getPosition().clone().sub(this.entity.getPosition().clone()).normalize();
    let velLength = this.app.knockoutModePlayerController.entity.rigidbody.linearVelocity.clone().length();
    dirToTarget.y = 0;
    this.app.gameManager.push(dirToTarget.clone(), Math.max(6, velLength) *2);

    this.app.knockoutModeNetworkManager.fire(this.idDamage, true);
}

KnockoutModeWall.prototype.onDamage = function(){
    this.hp = Math.max(this.hp-1, 0);

    if (this.hp > 0){
        this.tweenDamage();

        this.models.children[0].enabled = false;
        this.models.children[1].enabled = false;
        this.models.children[2].enabled = false;
        this.models.children[(this.hp == 2 ? 1 : (this.hp == 1 ? 2 : 0))].enabled = true;
    }
    else {
        this.tweenDestroy();
        this.entity.findByName("Trigger").enabled = false;
    };
}

KnockoutModeWall.prototype.tweenDamage = function(){
    this.models.tween(this.models.getLocalScale())
        .to(new pc.Vec3(1.3, 1.3, 1.3), 0.2, pc.SineInOut)
        .onComplete(()=> {

            this.models.tween(this.models.getLocalScale())
                .to(new pc.Vec3(1,1,1), .25, pc.SineInOut)
                .start();

        })
        .start();
}

KnockoutModeWall.prototype.tweenDestroy = function(){
    this.models.tween(this.models.getLocalScale())
        .to(new pc.Vec3(1.3, 1.3, 1.3), 0.2, pc.SineInOut)
        .onComplete(()=> {

            this.models.tween(this.models.getLocalScale())
                .to(new pc.Vec3(0,0,0), .5, pc.SineInOut)
                .onComplete(()=>{
                    this.entity.destroy();
                })
                .start();

        })
        .start();
}

KnockoutModeWall.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};