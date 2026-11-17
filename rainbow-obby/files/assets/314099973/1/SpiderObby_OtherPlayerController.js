var SpiderObbyOtherPlayerController = pc.createScript('spiderObbyOtherPlayerController');
SpiderObbyOtherPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

SpiderObbyOtherPlayerController.prototype.initialize = function () {
    this.body = this.entity.findByName("Body");
    this.anim = this.body.anim;
    this.username = this.entity.findByName("Username");
    this.overHeadGroup = this.entity.findByName("OverHeadGroup");
    //this.auraText = this.entity.findByName("AuraText");
    //this.rebirthText = this.entity.findByName("RebirthText");
    this.playerRendererEntity = this.body.findByName("Skin");
    this.networkManager = this.app.root.findByName("NetworkManager").script.spiderObbyNetworkManager;
    this.upbodyLayer = this.body.anim.findAnimationLayer('UpBody');
    this.rotFactor = null;
    this.faceAttacker = this.entity.findByName("FaceAttacker");
    this.faceTarget = this.entity.findByName("FaceTarget");
    this.attackable = true;
    this.entity.playerBody = this.entity.findByName("BodyPivot");

    this.isInGame = false;

    this.winCountText = this.entity.findByName("WinCountTextOnHead");
    this.winCounterGroup = this.entity.findByName("WinCounterGroup");
    this.winCounterGroup.enabled = false;

    //this.rebirthText.enabled = true;
    //this.auraText.enabled = true;

    this.skin = SpiderObbyItems.SkinLego;
    this.skins = [];
    this.skins[SpiderObbyItems.SkinLego] = this.entity.findByName("SkinLego");
    this.skins[SpiderObbyItems.SkinBigShoe] = this.entity.findByName("SkinBigShoe");
    this.skins[SpiderObbyItems.SkinTurtle] = this.entity.findByName("SkinTurtle");
    this.skins[SpiderObbyItems.SkinEmolingo] = this.entity.findByName("SkinEmolingo");
    this.skins[SpiderObbyItems.SkinAxo] = this.entity.findByName("SkinAxo");
    this.skins[SpiderObbyItems.SkinHacker] = this.entity.findByName("SkinHacker");

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

    this.on('destroy', function () {

    }, this);
};

SpiderObbyOtherPlayerController.prototype.setActiveItem = function(newActiveItemID){
    this.jetpack.model.enabled = (newActiveItemID == SpiderObbyItems.Jetpack);
    this.flyingCarpet.model.enabled = (newActiveItemID == SpiderObbyItems.FlyingCarpet);
};

SpiderObbyOtherPlayerController.prototype.setActiveHandItem = function(newHandItem){
    this.entity.findByName("ItemBox").enabled = newHandItem == "box";
    this.entity.findByName("ItemSphere").enabled = newHandItem == "sphere";
    this.entity.findByName("ItemCone").enabled = newHandItem == "cone";
};


SpiderObbyOtherPlayerController.prototype.applyPowerUpChanges = function(){
    if (this.jetpack.using){this.jetpack.particle.play();}
    else {this.jetpack.particle.stop();}
}

SpiderObbyOtherPlayerController.prototype.died = function () {
    const deadPlayerEntity = this.deadPlayer.resource.instantiate();
    const playerPos = this.entity.getPosition().clone();
    this.app.root.addChild(deadPlayerEntity);
    deadPlayerEntity.setPosition(playerPos.x, playerPos.y, playerPos.z);
    deadPlayerEntity.setRotation(this.body.getRotation().clone());
    const deadPlayerEntityBody = deadPlayerEntity.children[0];
    this.playerRendererEntity.enabled = false;
    this.overHeadGroup.enabled = false;
    deadPlayerEntityBody.enabled = true;
    for (let i = 0; i < deadPlayerEntityBody.children.length; i++) {
        deadPlayerEntityBody.children[i].rigidbody.applyImpulse(this.body.forward.scale(-pc.math.random(0, 1)));
    }
    this.entity.spawnedDeadBody = deadPlayerEntity;

    this.setFaceSprite(false);
};

SpiderObbyOtherPlayerController.prototype.respawn = function () {
    if (this.entity.spawnedDeadBody) {
        this.entity.spawnedDeadBody.destroy();
        this.entity.spawnedDeadBody = null;
    }

    this.playerRendererEntity.enabled = true;
    this.overHeadGroup.enabled = true;
    this.setFaceSprite(true);
};

SpiderObbyOtherPlayerController.prototype.handleAnimations = function (player) {
    this.anim.setBoolean("walk", player.isWalking);
    this.anim.setBoolean("isInAir", !player.grounded);
    this.anim.setBoolean("isClimbing", player.isClimbing);
    this.anim.setBoolean("isOnLadder", player.isOnLadder);
};

SpiderObbyOtherPlayerController.prototype.playSlapAnim = function () {
    this.upbodyLayer.transition("Hit" + Math.floor(pc.math.random(0, 2)), 0.1);
}

SpiderObbyOtherPlayerController.prototype.roll = function(state, force = null){
    this.anim.setBoolean("isRolling", state);

    clearTimeout(this.rollGetupTimeout);
    if (force != null){
        this.rollGetupTimeout = setTimeout(() => {
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

SpiderObbyOtherPlayerController.prototype.setFrozen = function(isFrozen){
    this.anim.enabled = !isFrozen
}

SpiderObbyOtherPlayerController.prototype.setTeam = function(newTeam){
    this.team = newTeam;

    if (newTeam == null){
        this.entity.findByName("TeamRed").enabled = false;
        this.entity.findByName("TeamBlue").enabled = false;
    }
    if (newTeam == "red"){
        this.entity.findByName("TeamRed").enabled = true;
        this.entity.findByName("TeamBlue").enabled = false;
    }
    if (newTeam == "blue"){
        this.entity.findByName("TeamRed").enabled = false;
        this.entity.findByName("TeamBlue").enabled = true;
    }
}

SpiderObbyOtherPlayerController.prototype.setScale = function(_float){
    this.entity.setLocalScale(new pc.Vec3(_float, _float, _float));
}

SpiderObbyOtherPlayerController.prototype.setSkin = function(_int){
    return;
    if (isNaN(_int) || _int == null || _int < 0) {return;}

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    this.skins[_int].enabled = true;
    this.skin = _int;
    this.setFaceSprite(true);
}

SpiderObbyOtherPlayerController.prototype.setFaceSprite = function(_visible){
    this.entity.findByName("LegoFaceSprite").enabled = (_visible && this.skin == SpiderObbyItems.SkinLego);
}