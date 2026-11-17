var TowerObbyOtherPlayerController = pc.createScript('towerObbyOtherPlayerController');
TowerObbyOtherPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

TowerObbyOtherPlayerController.prototype.initialize = function () {
    this.body = this.entity.findByName("Body");
    this.anim = this.body.anim;
    this.username = this.entity.findByName("Username");
    this.overHeadGroup = this.entity.findByName("OverHeadGroup");
    //this.auraText = this.entity.findByName("AuraText");
    //this.rebirthText = this.entity.findByName("RebirthText");
    this.playerRendererEntity = this.body.findByName("Skin");
    this.networkManager = this.app.root.findByName("NetworkManager").script.towerObbyNetworkManager;
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

    this.skin = TowerObbyItems.SkinLego;
    this.skins = [];
    this.skins[TowerObbyItems.SkinLego] = this.entity.findByName("SkinLego");
    this.skins[TowerObbyItems.SkinBigShoe] = this.entity.findByName("SkinBigShoe");
    this.skins[TowerObbyItems.SkinTurtle] = this.entity.findByName("SkinTurtle");
    this.skins[TowerObbyItems.SkinEmolingo] = this.entity.findByName("SkinEmolingo");
    this.skins[TowerObbyItems.SkinAxo] = this.entity.findByName("SkinAxo");
    this.skins[TowerObbyItems.SkinHacker] = this.entity.findByName("SkinHacker");
    this.skins[TowerObbyItems.SkinTri] = this.entity.findByName("SkinTri");
    this.skins[TowerObbyItems.SkinChef] = this.entity.findByName("SkinChef");
    this.skins[TowerObbyItems.SkinBread] = this.entity.findByName("SkinBread");
    this.skins[TowerObbyItems.SkinCat] = this.entity.findByName("SkinCat");
    this.skins[TowerObbyItems.SkinFrog] = this.entity.findByName("SkinFrog");
    this.skins[TowerObbyItems.SkinNuclear] = this.entity.findByName("SkinNuclear");

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

TowerObbyOtherPlayerController.prototype.setActiveItem = function (newActiveItemID) {
    this.jetpack.model.enabled = (newActiveItemID == TowerObbyItems.Jetpack);
    this.flyingCarpet.model.enabled = (newActiveItemID == TowerObbyItems.FlyingCarpet);

    this.entity.findByName("SlapHand").enabled = (newActiveItemID == TowerObbyItems.SlapHand);
    this.entity.findByName("SlapBalloon").enabled = (newActiveItemID == TowerObbyItems.SlapBalloon);
    this.entity.findByName("SlapBat").enabled = (newActiveItemID == TowerObbyItems.SlapBat);
    this.entity.findByName("SlapCandy").enabled = (newActiveItemID == TowerObbyItems.SlapCandy);
    this.entity.findByName("SlapLollipop").enabled = (newActiveItemID == TowerObbyItems.SlapLollipop);

    this.entity.findByName("Shield").enabled = (newActiveItemID == TowerObbyItems.Immortality);

    // the powerups that carry their own model, same names as on the local player
    this.toggleItemEntity("Low Gravity", newActiveItemID == TowerObbyItems.LowGravity);
    this.toggleItemEntity("Grow", newActiveItemID == TowerObbyItems.Grow);
    this.toggleItemEntity("SpeedShoes_left", newActiveItemID == TowerObbyItems.DoubleJump);
    this.toggleItemEntity("SpeedShoes_Right", newActiveItemID == TowerObbyItems.DoubleJump);

    //this.shield.model.enabled = (newActiveItemID == TowerObbyItems.Shield);
};

// these models were added to the player later, so an older template may not carry them
TowerObbyOtherPlayerController.prototype.toggleItemEntity = function (_name, _toggle) {
    const _entity = this.entity.findByName(_name);
    if (_entity) { _entity.enabled = _toggle; }
};

TowerObbyOtherPlayerController.prototype.applyPowerUpChanges = function () {
    if (this.jetpack.using) { this.jetpack.particle.play(); }
    else { this.jetpack.particle.stop(); }
}

TowerObbyOtherPlayerController.prototype.died = function () {
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

TowerObbyOtherPlayerController.prototype.respawn = function () {
    if (this.entity.spawnedDeadBody) {
        this.entity.spawnedDeadBody.destroy();
        this.entity.spawnedDeadBody = null;
    }

    this.playerRendererEntity.enabled = true;
    this.overHeadGroup.enabled = true;
    this.setFaceSprite(true);
};

TowerObbyOtherPlayerController.prototype.handleAnimations = function (player) {
    this.anim.setBoolean("walk", player.isWalking);
    this.anim.setBoolean("isInAir", !player.grounded);
    this.anim.setBoolean("isClimbing", player.isClimbing);
    this.anim.setBoolean("isOnLadder", player.isOnLadder);
};

TowerObbyOtherPlayerController.prototype.playSlapAnim = function () {
    this.upbodyLayer.transition("Hit" + Math.floor(pc.math.random(0, 2)), 0.1);
}

TowerObbyOtherPlayerController.prototype.roll = function (state, force = null) {
    this.anim.setBoolean("isRolling", state);

    clearTimeout(this.rollGetupTimeout);
    if (force != null) {
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

TowerObbyOtherPlayerController.prototype.setFrozen = function (isFrozen) {
    this.anim.enabled = !isFrozen
}

TowerObbyOtherPlayerController.prototype.setTeam = function (newTeam) {
    this.team = newTeam;

    if (newTeam == null) {
        this.entity.findByName("TeamRed").enabled = false;
        this.entity.findByName("TeamBlue").enabled = false;
    }
    if (newTeam == "red") {
        this.entity.findByName("TeamRed").enabled = true;
        this.entity.findByName("TeamBlue").enabled = false;
    }
    if (newTeam == "blue") {
        this.entity.findByName("TeamRed").enabled = false;
        this.entity.findByName("TeamBlue").enabled = true;
    }
}

TowerObbyOtherPlayerController.prototype.setScale = function (_float) {
    this.entity.setLocalScale(new pc.Vec3(_float, _float, _float));
}

TowerObbyOtherPlayerController.prototype.setSkin = function (_int) {
    if (isNaN(_int) || _int == null || _int < 0) { return; }

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    this.skins[_int].enabled = true;
    this.skin = _int;
    this.setFaceSprite(true);
}

TowerObbyOtherPlayerController.prototype.setFaceSprite = function (_visible) {
    this.entity.findByName("LegoFaceSprite").enabled = (_visible && (this.skin == TowerObbyItems.SkinLego || this.skin == TowerObbyItems.SkinTri));
}