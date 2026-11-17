var CartObbyOtherPlayerController = pc.createScript('cartObbyOtherPlayerController');
CartObbyOtherPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

CartObbyOtherPlayerController.prototype.initialize = function () {
    this.body = this.entity.findByName("Body");
    this.anim = this.body.anim;
    this.username = this.entity.findByName("Username");
    this.playerRendererEntity = this.body.findByName("N00b7.001");
    this.faceSprite = this.body.findByName("FaceSprite");
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;


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

    this.tnt = {
        has: false,
        model: this.entity.findByName("TNT"),
    };

    this.powerBlock = {
        has: false,
        model: this.entity.findByName("PowerBlock"),
    }

    this.on('destroy', function () {
        if (this.networkManager.room){
            this.app.cartObbyCartManager.removeCart(this.entity.cartId);
        }
    }, this);
};


CartObbyOtherPlayerController.prototype.applyPowerUpChanges = function(){
    this.jetpack.model.enabled = this.jetpack.has;
    if (this.jetpack.using){this.jetpack.particle.play();}
    else {this.jetpack.particle.stop();}

    this.flyingCarpet.model.enabled = this.flyingCarpet.has;

    this.tnt.model.enabled = this.tnt.has;

    this.powerBlock.model.enabled = this.powerBlock.has;
}

CartObbyOtherPlayerController.prototype.died = function () {
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

CartObbyOtherPlayerController.prototype.respawn = function () {
    if (this.entity.spawnedDeadBody) {
        this.entity.spawnedDeadBody.destroy();
        this.entity.spawnedDeadBody = null;
    }

    this.playerRendererEntity.enabled = true;
    this.faceSprite.enabled = true;
};

CartObbyOtherPlayerController.prototype.handleAnimations = function (player) {
    this.anim.setBoolean("walk", player.isWalking);
    this.anim.setBoolean("isInAir", !player.grounded);
    this.anim.setBoolean("isClimbing", player.isClimbing);
    this.anim.setBoolean("isOnLadder", player.isOnLadder);
    this.anim.setBoolean("isSitting", player.isInCart);
};

