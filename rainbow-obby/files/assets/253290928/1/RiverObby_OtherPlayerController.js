var RiverObbyOtherPlayerController = pc.createScript('riverObbyOtherPlayerController');
RiverObbyOtherPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

RiverObbyOtherPlayerController.prototype.initialize = function () {
    this.body = this.entity.findByName("Body");
    this.anim = this.body.anim;
    this.username = this.entity.findByName("Username");
    this.boat = this.entity.findByName("Boat");
    this.boatModel = this.entity.findByName("BoatModel");
    this.boatHand = this.entity.findByName("boatHand");
    this.kurekL = this.entity.findByName("KurekL");
    this.kurekR = this.entity.findByName("KurekR");
    this.oarLModel = this.entity.findByName("OarL")
    this.oarRModel = this.entity.findByName("OarR")
    this.playerRendererEntity = this.body.findByName("N00b7.001");
    this.faceSprite = this.body.findByName("FaceSprite");
};

RiverObbyOtherPlayerController.prototype.update = function (dt) {
    if (this.isRowing) {
        this.kurekL.fire("Motion", "Row");
        this.kurekR.fire("Motion", "Row");
    }
}

RiverObbyOtherPlayerController.prototype.died = function () {
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

RiverObbyOtherPlayerController.prototype.respawn = function () {
    if (this.entity.spawnedDeadBody) {
        this.entity.spawnedDeadBody.destroy();
        this.entity.spawnedDeadBody = null;
    }

    this.playerRendererEntity.enabled = true;
    this.faceSprite.enabled = true;
};

RiverObbyOtherPlayerController.prototype.handleAnimations = function (player) {
    this.anim.setBoolean("walk", player.isWalking);
    this.anim.setBoolean("isInAir", !player.grounded);
    this.anim.setBoolean("isClimbing", player.isClimbing);
    this.anim.setBoolean("isOnLadder", player.isOnLadder);
    this.anim.setBoolean("isInWater", player.isInWater);
    this.anim.setBoolean("isRowing", player.isRowing);

    this.isRowing = player.isRowing;
};

RiverObbyOtherPlayerController.prototype.setBoat = function (boatID) {
    let _data = RiverObbyBoatDatabase[boatID]
    this.boatModel.render.asset = _data.asset
    this.boatHand.render.asset = _data.asset
    this.oarLModel.render.asset = _data.oarL
    this.oarRModel.render.asset = _data.oarR

    console.log("remote boat changed to ", boatID, "data", _data);
};

RiverObbyOtherPlayerController.prototype.setIsInWater = function (toggle) {
    this.anim.setBoolean("isInWater", toggle);
    this.boat.enabled = toggle;
    this.boatHand.enabled = !toggle;
    this.entity.collision.linearOffset = new pc.Vec3(0, toggle ? 0.1 : 0, 0);
};