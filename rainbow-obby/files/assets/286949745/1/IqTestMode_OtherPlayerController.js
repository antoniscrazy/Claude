var IqTestModeOtherPlayerController = pc.createScript('iqTestModeOtherPlayerController');
IqTestModeOtherPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

IqTestModeOtherPlayerController.prototype.initialize = function () {
    this.body = this.entity.findByName("Body");
    this.anim = this.body.anim;
    this.username = this.entity.findByName("Username");
    this.overHeadGroup = this.entity.findByName("OverHeadGroup");
    //this.auraText = this.entity.findByName("AuraText");
    //this.rebirthText = this.entity.findByName("RebirthText");
    this.rollPivot = this.entity.findByName("RollPivot");
    this.playerRendererEntity = this.body.findByName("Skin");
    this.networkManager = this.app.root.findByName("NetworkManager").script.iqTestModeNetworkManager;
    this.upbodyLayer = this.body.anim.findAnimationLayer('UpBody');
    this.rotFactor = null;
    this.faceAttacker = this.entity.findByName("FaceAttacker");
    this.faceTarget = this.entity.findByName("FaceTarget");
    this.attackable = true;
    this.entity.playerBody = this.rollPivot;

    this.isInGame = false;

    this.winCountText = this.entity.findByName("WinCountTextOnHead");
    this.winCounterGroup = this.entity.findByName("WinCounterGroup");
    this.winCounterGroup.enabled = false;

    //this.rebirthText.enabled = true;
    //this.auraText.enabled = true;

    this.skin = IqTestModeItems.SkinLego;
    this.skins = [];
    this.skins[IqTestModeItems.SkinLego] = this.entity.findByName("SkinLego");
    this.skins[IqTestModeItems.SkinBigShoe] = this.entity.findByName("SkinBigShoe");
    this.skins[IqTestModeItems.SkinTurtle] = this.entity.findByName("SkinTurtle");
    this.skins[IqTestModeItems.SkinEmolingo] = this.entity.findByName("SkinEmolingo");
    this.skins[IqTestModeItems.SkinAxo] = this.entity.findByName("SkinAxo");
    this.skins[IqTestModeItems.SkinHacker] = this.entity.findByName("SkinHacker");

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

IqTestModeOtherPlayerController.prototype.setActiveItem = function(newActiveItemID){
    this.flyingCarpet.model.enabled = (newActiveItemID == IqTestModeItems.FLYING_CARPET);
    this.jetpack.model.enabled = (newActiveItemID == IqTestModeItems.JETPACK);
    this.shield.model.enabled = (newActiveItemID == IqTestModeItems.Shield);
};

IqTestModeOtherPlayerController.prototype.setActiveHandItem = function(newHandItem){
    this.entity.findByName("ItemBox").enabled = newHandItem == "box";
    this.entity.findByName("ItemSphere").enabled = newHandItem == "sphere";
    this.entity.findByName("ItemCone").enabled = newHandItem == "cone";
};


IqTestModeOtherPlayerController.prototype.applyPowerUpChanges = function(){
    if (this.jetpack.using){this.jetpack.particle.play();}
    else {this.jetpack.particle.stop();}
}

IqTestModeOtherPlayerController.prototype.died = function () {
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

IqTestModeOtherPlayerController.prototype.respawn = function () {
    if (this.entity.spawnedDeadBody) {
        this.entity.spawnedDeadBody.destroy();
        this.entity.spawnedDeadBody = null;
    }

    this.playerRendererEntity.enabled = true;
    this.overHeadGroup.enabled = true;
    this.setFaceSprite(true);
};

IqTestModeOtherPlayerController.prototype.handleAnimations = function (player) {
    this.anim.setBoolean("walk", player.isWalking);
    this.anim.setBoolean("isInAir", !player.grounded);
    this.anim.setBoolean("isClimbing", player.isClimbing);
    this.anim.setBoolean("isOnLadder", player.isOnLadder);
    this.anim.setBoolean("sitting", player.isInCart);
};

IqTestModeOtherPlayerController.prototype.playSlapAnim = function () {
    this.upbodyLayer.transition("Hit" + Math.floor(pc.math.random(0, 2)), 0.1);
}

IqTestModeOtherPlayerController.prototype.roll = function(state, force = null){
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

IqTestModeOtherPlayerController.prototype.setFrozen = function(isFrozen){
    this.anim.enabled = !isFrozen
}

IqTestModeOtherPlayerController.prototype.setTeam = function(newTeam){
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

IqTestModeOtherPlayerController.prototype.setScale = function(_float){
    this.entity.setLocalScale(new pc.Vec3(_float, _float, _float));
}

IqTestModeOtherPlayerController.prototype.setSkin = function(_int){
    return;
    if (isNaN(_int) || _int == null || _int < 0) {return;}

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    this.skins[_int].enabled = true;
    this.skin = _int;
    this.setFaceSprite(true);
}

IqTestModeOtherPlayerController.prototype.setFaceSprite = function(_visible){
    this.entity.findByName("LegoFaceSprite").enabled = (_visible && this.skin == IqTestModeItems.SkinLego);
}