var TrollObbyOtherPlayerController = pc.createScript('trollObbyOtherPlayerController');
TrollObbyOtherPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

TrollObbyOtherPlayerController.prototype.initialize = function () {
    this.body = this.entity.findByName("Body");
    this.anim = this.body.anim;
    this.username = this.entity.findByName("Username");
    this.auraText = this.entity.findByName("AuraText");
    this.rebirthText = this.entity.findByName("RebirthText");
    this.rollPivot = this.entity.findByName("RollPivot");
    this.playerRendererEntity = this.body.findByName("N00b7.001");
    this.faceSprite = this.body.findByName("FaceSprite");
    this.networkManager = this.app.root.findByName("NetworkManager").script.trollObbyNetworkManager;
    this.upbodyLayer = this.body.anim.findAnimationLayer('UpBody');
    this.rotFactor = null;
    this.faceAttacker = this.entity.findByName("FaceAttacker");
    this.faceTarget = this.entity.findByName("FaceTarget");
    this.attackable = true;
    this.entity.playerBody = this.rollPivot;

    //this.rebirthText.enabled = true;
    this.auraText.enabled = true;

    this.jetpack = {
        has: false,
        using: false,
        model: this.entity.findByName("Jetpack"),
        particle: this.entity.findByName("JetpackParticle").particlesystem,
    };

    this.flyingCarpet = {
        has: false,
        model: this.entity.findByName("FlyingCarpet"),
    };

    this.shield = {
        enabled: false,
        model: this.entity.findByName("ShieldAura"),
    }

    this.on('destroy', function () {

    }, this);
};

TrollObbyOtherPlayerController.prototype.setActiveItem = function(newActiveItemID){
    this.entity.findByName("SlapHand").enabled = (newActiveItemID == TrollObbyItems.SlapHand);
    this.entity.findByName("SlapBalloon").enabled = (newActiveItemID == TrollObbyItems.SlapBalloon);
    this.entity.findByName("SlapBat").enabled = (newActiveItemID == TrollObbyItems.SlapBat);
    this.entity.findByName("SlapCandy").enabled = (newActiveItemID == TrollObbyItems.SlapCandy);
    this.entity.findByName("SlapLollipop").enabled = (newActiveItemID == TrollObbyItems.SlapLollipop);

    this.flyingCarpet.model.enabled = (newActiveItemID == TrollObbyItems.FLYING_CARPET);
    this.jetpack.model.enabled = (newActiveItemID == TrollObbyItems.JETPACK);
    this.shield.model.enabled = (newActiveItemID == TrollObbyItems.Shield);
};


TrollObbyOtherPlayerController.prototype.applyPowerUpChanges = function(){
    if (this.jetpack.using){this.jetpack.particle.play();}
    else {this.jetpack.particle.stop();}
}

TrollObbyOtherPlayerController.prototype.died = function () {
    const deadPlayerEntity = this.deadPlayer.resource.instantiate();
    const playerPos = this.entity.getPosition().clone();
    this.app.root.addChild(deadPlayerEntity);
    deadPlayerEntity.setPosition(playerPos.x, playerPos.y, playerPos.z);
    deadPlayerEntity.setRotation(this.body.getRotation().clone());
    const deadPlayerEntityBody = deadPlayerEntity.children[0];
    this.playerRendererEntity.enabled = false;
    deadPlayerEntityBody.enabled = true;
    for (let i = 0; i < deadPlayerEntityBody.children.length; i++) {
        deadPlayerEntityBody.children[i].rigidbody.applyImpulse(this.body.forward.scale(-pc.math.random(0, 1)));
    }
    this.entity.spawnedDeadBody = deadPlayerEntity;

    this.playerRendererEntity.enabled = false;
    this.faceSprite.enabled = false;
};

TrollObbyOtherPlayerController.prototype.respawn = function () {
    if (this.entity.spawnedDeadBody) {
        this.entity.spawnedDeadBody.destroy();
        this.entity.spawnedDeadBody = null;
    }

    this.playerRendererEntity.enabled = true;
    this.faceSprite.enabled = true;
};

TrollObbyOtherPlayerController.prototype.handleAnimations = function (player) {
    this.anim.setBoolean("walk", player.isWalking);
    this.anim.setBoolean("isInAir", !player.grounded);
    this.anim.setBoolean("isClimbing", player.isClimbing);
    this.anim.setBoolean("isOnLadder", player.isOnLadder);
    this.anim.setBoolean("sitting", player.isInCart);
};

TrollObbyOtherPlayerController.prototype.playSlapAnim = function () {
    this.upbodyLayer.transition("Hit" + Math.floor(pc.math.random(0, 2)), 0.1);
}

TrollObbyOtherPlayerController.prototype.roll = function(state, force = null){
    this.anim.setBoolean("isRolling", state);

    clearTimeout(this.rollGetupTimeout);
    if (force != null){
        this.rollGetupTimeout = setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.roll(false);
        }, Math.min(force.length() * 150, 5000));
    }

/*     let rb = this.entity.rigidbody;
    if (state){
        this.rotFactor = new pc.Vec3(1,1,1);
    } else {
        this.rotFactor = null;
    } */
}

TrollObbyOtherPlayerController.prototype.setFrozen = function(isFrozen){
    this.anim.enabled = !isFrozen
}
