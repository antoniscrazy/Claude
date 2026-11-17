var KnockoutModeOtherPlayerController = pc.createScript('knockoutModeOtherPlayerController');
KnockoutModeOtherPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });
KnockoutModeOtherPlayerController.attributes.add('armature', { type: 'entity' });

KnockoutModeOtherPlayerController.prototype.initialize = function () {
    this.body = this.entity.findByName("Body");
    //this.anim = this.body.anim;
    this.anim = this.armature.anim;
    this.username = this.entity.findByName("Username");
    this.rebirthText = this.entity.findByName("RebirthText");
    this.rollPivot = this.entity.findByName("RollPivot");
    this.playerRendererEntity = this.body.findByName("PenguinDefault");
    this.faceSprite = this.body.findByName("FaceSprite");
    this.networkManager = this.app.root.findByName("NetworkManager").script.knockoutModeNetworkManager;
    this.upbodyLayer = this.body.anim.findAnimationLayer('UpBody');
    this.rotFactor = null;
    this.faceAttacker = this.entity.findByName("FaceAttacker");
    this.faceTarget = this.entity.findByName("FaceTarget");
    this.attackable = true;
    this.entity.playerBody = this.rollPivot;
    this.winCountText = this.entity.findByName("WinCountTextOnHead");
    this.winCounterGroup = this.entity.findByName("WinCounterGroup");

    this.skin = KnockoutModeItems.PenguinDefault;

    this.skins = [];
    this.skins[KnockoutModeItems.PenguinDefault] = this.entity.findByName("PenguinDefault");
    this.skins[KnockoutModeItems.PenguinFemale] = this.entity.findByName("PenguinFemale");
    this.skins[KnockoutModeItems.PenguinBinted] = this.entity.findByName("PenguinBinted");
    this.skins[KnockoutModeItems.PenguinPimp] = this.entity.findByName("PenguinPimp");

    this.winCounterGroup.enabled = false;

    this.hovers = this.entity.findByName("Hovers");

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

KnockoutModeOtherPlayerController.prototype.setActiveItem = function(newActiveItemID){
    this.entity.findByName("SpikeBall").enabled = (newActiveItemID == KnockoutModeItems.SpikeBall);
    this.entity.findByName("Slime").enabled = (newActiveItemID == KnockoutModeItems.Slime);
    this.entity.findByName("Bomb").enabled = (newActiveItemID == KnockoutModeItems.Bomb);
};


KnockoutModeOtherPlayerController.prototype.applyPowerUpChanges = function(){
    if (this.jetpack.using){this.jetpack.particle.play();}
    else {this.jetpack.particle.stop();}
}

KnockoutModeOtherPlayerController.prototype.died = function () {
    const deadPlayerEntity = this.deadPlayer.resource.instantiate();
    const playerPos = this.entity.getPosition().clone();
    this.app.root.addChild(deadPlayerEntity);
    deadPlayerEntity.setPosition(playerPos.x, playerPos.y, playerPos.z);
    deadPlayerEntity.setRotation(this.body.getRotation().clone());

    let deadPlayerEntityBody = null;
    switch(this.skin){
        case KnockoutModeItems.PenguinDefault: deadPlayerEntityBody = deadPlayerEntity.children[0]; break;
        case KnockoutModeItems.PenguinFemale: deadPlayerEntityBody = deadPlayerEntity.children[1]; break;
        case KnockoutModeItems.PenguinBinted: deadPlayerEntityBody = deadPlayerEntity.children[2]; break;
        case KnockoutModeItems.PenguinPimp: deadPlayerEntityBody = deadPlayerEntity.children[3]; break;
    }

    if (deadPlayerEntityBody == null) {return;}


    this.playerRendererEntity.enabled = false;
    deadPlayerEntityBody.enabled = true;
    for (let i = 0; i < deadPlayerEntityBody.children.length; i++) {
        deadPlayerEntityBody.children[i].rigidbody.applyImpulse(this.body.forward.scale(-pc.math.random(0, 1)));
    }
    this.entity.spawnedDeadBody = deadPlayerEntity;

    this.playerRendererEntity.enabled = false;
    this.faceSprite.enabled = false;
};

KnockoutModeOtherPlayerController.prototype.respawn = function () {
    if (this.entity.spawnedDeadBody) {
        this.entity.spawnedDeadBody.destroy();
        this.entity.spawnedDeadBody = null;
    }

    this.playerRendererEntity.enabled = true;
    this.faceSprite.enabled = true;
};

KnockoutModeOtherPlayerController.prototype.handleAnimations = function (player) {
    this.anim.setBoolean("walk", player.isWalking);
    this.anim.setBoolean("isInAir", !player.grounded);
    this.anim.setBoolean("isClimbing", player.isClimbing);
    this.anim.setBoolean("isOnLadder", player.isOnLadder);
    //this.anim.setBoolean("sitting", player.isSitting);
};

KnockoutModeOtherPlayerController.prototype.playSlapAnim = function () {
    this.upbodyLayer.transition("Hit" + Math.floor(pc.math.random(0, 2)), 0.1);
}

KnockoutModeOtherPlayerController.prototype.roll = function(state, force = null){
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

KnockoutModeOtherPlayerController.prototype.setFrozen = function(isFrozen){
    this.anim.enabled = !isFrozen
}

KnockoutModeOtherPlayerController.prototype.setHoverVisible = function (_visible) {

    if (!_visible) {
        this.hovers.children.forEach(child => {
            child.enabled = false;
        });
        return;
    }

    this.hovers.children.forEach(child => {
        child.enabled = false;
    });

    if (this.hovers.children.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.hovers.children.length);
        this.hovers.children[randomIndex].enabled = true;
    }
};


KnockoutModeOtherPlayerController.prototype.setShootIndex = function(_index){
    if (_index != null){
        this.entity.findByName("Queue").enabled = true;
        this.entity.findByName("Queue").element.text = _index;
    } else {
        this.entity.findByName("Queue").enabled = false;
    }
};

KnockoutModeOtherPlayerController.prototype.setRemoteCollider = function(_boolean){
    this.entity.findByName("RemoteCollider").enabled = _boolean;
}

KnockoutModeOtherPlayerController.prototype.setIsShootingNow = function(_boolean){
    if (_boolean != null){
        this.entity.findByName("Queue").element.color = (_boolean ? new pc.Color(0, 255, 0) : new pc.Color(1,1,1));
    } 
};

KnockoutModeOtherPlayerController.prototype.setScale = function(_float){
    this.entity.setLocalScale(new pc.Vec3(_float, _float, _float));
}


KnockoutModeOtherPlayerController.prototype.setSkin = function(_int){
    if (isNaN(_int) || _int == null || _int < 0) {return;}

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    switch(_int){
        case KnockoutModeItems.PenguinDefault:
            this.skins[KnockoutModeItems.PenguinDefault].enabled = true;
            this.skin = KnockoutModeItems.PenguinDefault;
            this.playerRendererEntity = this.body.findByName("PenguinDefault");
            break;

        case KnockoutModeItems.PenguinFemale:
            this.skins[KnockoutModeItems.PenguinFemale].enabled = true;
            this.skin = KnockoutModeItems.PenguinFemale;
            this.playerRendererEntity = this.body.findByName("PenguinFemale");
            break;

        case KnockoutModeItems.PenguinBinted:
            this.skins[KnockoutModeItems.PenguinBinted].enabled = true;
            this.skin = KnockoutModeItems.PenguinBinted;
            this.playerRendererEntity = this.body.findByName("PenguinBinted");
            break;

        case KnockoutModeItems.PenguinPimp:
            this.skins[KnockoutModeItems.PenguinPimp].enabled = true;
            this.skin = KnockoutModeItems.PenguinPimp;
            this.playerRendererEntity = this.body.findByName("PenguinPimp");
            break;
    }
}