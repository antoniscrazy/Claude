var ElectricObbyOtherPlayerController = pc.createScript('electricObbyOtherPlayerController');
ElectricObbyOtherPlayerController.attributes.add('deadPlayer', { type: 'asset', assetType: 'template' });

ElectricObbyOtherPlayerController.prototype.initialize = function () {
    this.body = this.entity.findByName("Body");
    this.anim = this.body.anim;
    this.username = this.entity.findByName("Username");
    this.overHeadGroup = this.entity.findByName("OverHeadGroup");
    //this.auraText = this.entity.findByName("AuraText");
    //this.rebirthText = this.entity.findByName("RebirthText");
    this.playerRendererEntity = this.body.findByName("Skin");
    this.networkManager = this.app.root.findByName("NetworkManager").script.electricObbyNetworkManager;
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

    this.skin = ElectricObbyItems.SkinLego;
    this.skins = [];
    this.skins[ElectricObbyItems.SkinLego] = this.entity.findByName("SkinLego");
    this.skins[ElectricObbyItems.SkinBigShoe] = this.entity.findByName("SkinBigShoe");
    this.skins[ElectricObbyItems.SkinTurtle] = this.entity.findByName("SkinTurtle");
    this.skins[ElectricObbyItems.SkinEmolingo] = this.entity.findByName("SkinEmolingo");
    this.skins[ElectricObbyItems.SkinAxo] = this.entity.findByName("SkinAxo");
    this.skins[ElectricObbyItems.SkinHacker] = this.entity.findByName("SkinHacker");

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

    this.isShocked = false;
    this.shockTimer = 0;
    this.flashTimer = 0;
    this.flashOn = false;
    this.shockLight = null;
    this.shockMaterials = [];
    this.bodyBasePosition = new pc.Vec3();
    this.bodyBaseAngles = new pc.Vec3();

    this.flashMaterial = new pc.StandardMaterial();
    this.flashMaterial.diffuse.set(0.35, 0.85, 1);
    this.flashMaterial.emissive.set(0.35, 0.85, 1);
    this.flashMaterial.emissiveIntensity = 3;
    this.flashMaterial.useMetalness = false;
    this.flashMaterial.update();

    this.on('destroy', function () {

    }, this);
};

ElectricObbyOtherPlayerController.prototype.setActiveItem = function(newActiveItemID){
    this.jetpack.model.enabled = (newActiveItemID == ElectricObbyItems.Jetpack);
    this.flyingCarpet.model.enabled = (newActiveItemID == ElectricObbyItems.FlyingCarpet);
};

ElectricObbyOtherPlayerController.prototype.setActiveHandItem = function(newHandItem){
    this.entity.findByName("ItemBox").enabled = newHandItem == "box";
    this.entity.findByName("ItemSphere").enabled = newHandItem == "sphere";
    this.entity.findByName("ItemCone").enabled = newHandItem == "cone";
};


ElectricObbyOtherPlayerController.prototype.applyPowerUpChanges = function(){
    if (this.jetpack.using){this.jetpack.particle.play();}
    else {this.jetpack.particle.stop();}
}

ElectricObbyOtherPlayerController.prototype.died = function () {
    this.setShocked(false);
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

ElectricObbyOtherPlayerController.prototype.respawn = function () {
    if (this.entity.spawnedDeadBody) {
        this.entity.spawnedDeadBody.destroy();
        this.entity.spawnedDeadBody = null;
    }

    this.playerRendererEntity.enabled = true;
    this.overHeadGroup.enabled = true;
    this.setFaceSprite(true);
};

ElectricObbyOtherPlayerController.prototype.handleAnimations = function (player) {
    this.anim.setBoolean("walk", player.isWalking);
    this.anim.setBoolean("isInAir", !player.grounded);
    this.anim.setBoolean("isClimbing", player.isClimbing);
    this.anim.setBoolean("isOnLadder", player.isOnLadder);
};

ElectricObbyOtherPlayerController.prototype.playSlapAnim = function () {
    this.upbodyLayer.transition("Hit" + Math.floor(pc.math.random(0, 2)), 0.1);
}

ElectricObbyOtherPlayerController.prototype.roll = function(state, force = null){
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

ElectricObbyOtherPlayerController.prototype.setFrozen = function(isFrozen){
    this.anim.enabled = !isFrozen
}

ElectricObbyOtherPlayerController.prototype.setTeam = function(newTeam){
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

ElectricObbyOtherPlayerController.prototype.setScale = function(_float){
    this.entity.setLocalScale(new pc.Vec3(_float, _float, _float));
}

ElectricObbyOtherPlayerController.prototype.setSkin = function(_int){
    return;
    if (isNaN(_int) || _int == null || _int < 0) {return;}

    this.skins.forEach(skin => {
        skin.enabled = false;
    });

    this.skins[_int].enabled = true;
    this.skin = _int;
    this.setFaceSprite(true);
}

ElectricObbyOtherPlayerController.prototype.setFaceSprite = function(_visible){
    this.entity.findByName("LegoFaceSprite").enabled = (_visible && this.skin == ElectricObbyItems.SkinLego);
}

ElectricObbyOtherPlayerController.prototype.update = function (dt) {
    if (!this.isShocked) return;

    this.shockTimer += dt;
    this.flashTimer += dt;

    if (this.flashTimer >= 0.05) {
        this.flashTimer = 0;
        this.flashOn = !this.flashOn;
        this.applyShockFlash(this.flashOn);
    }

    let jitter = 0.03 * (0.35 + pc.math.clamp(this.shockTimer, 0, 1));

    this.body.setLocalPosition(
        this.bodyBasePosition.x + pc.math.random(-jitter, jitter),
        this.bodyBasePosition.y + pc.math.random(-jitter, jitter),
        this.bodyBasePosition.z + pc.math.random(-jitter, jitter)
    );
    this.body.setLocalEulerAngles(
        this.bodyBaseAngles.x + pc.math.random(-jitter, jitter) * 90,
        this.bodyBaseAngles.y + pc.math.random(-jitter, jitter) * 90,
        this.bodyBaseAngles.z + pc.math.random(-jitter, jitter) * 90
    );
};

ElectricObbyOtherPlayerController.prototype.setShocked = function (isShocked) {
    if (this.isShocked === isShocked) return;

    if (isShocked) {
        this.isShocked = true;
        this.shockTimer = 0;
        this.flashTimer = 0;
        this.flashOn = false;
        this.anim.speed = 0;

        this.bodyBasePosition.copy(this.body.getLocalPosition());
        this.bodyBaseAngles.copy(this.body.getLocalEulerAngles());

        this.shockMaterials = [];
        this.collectShockMaterials(this.body.findComponents("render"));
        this.collectShockMaterials(this.body.findComponents("model"));

        this.shockLight = new pc.Entity("ElectricShockLight");
        this.shockLight.addComponent("light", {
            type: "omni",
            color: new pc.Color(0.35, 0.85, 1),
            intensity: 6,
            range: 6,
            castShadows: false
        });
        this.body.addChild(this.shockLight);
        this.shockLight.setLocalPosition(0, 1, 0);
    } else {
        this.applyShockFlash(false);
        this.shockMaterials = [];

        if (this.shockLight) {
            this.shockLight.destroy();
            this.shockLight = null;
        }

        this.body.setLocalPosition(this.bodyBasePosition);
        this.body.setLocalEulerAngles(this.bodyBaseAngles);
        this.anim.speed = 1;
        this.isShocked = false;
    }
};

ElectricObbyOtherPlayerController.prototype.collectShockMaterials = function (components) {
    for (let i = 0; i < components.length; i++) {
        let meshInstances = components[i].meshInstances;
        if (!meshInstances) continue;

        for (let j = 0; j < meshInstances.length; j++) {
            this.shockMaterials.push({ meshInstance: meshInstances[j], material: meshInstances[j].material });
        }
    }
};

ElectricObbyOtherPlayerController.prototype.applyShockFlash = function (state) {
    for (let i = 0; i < this.shockMaterials.length; i++) {
        let entry = this.shockMaterials[i];
        entry.meshInstance.material = state ? this.flashMaterial : entry.material;
    }

    if (this.shockLight) {
        this.shockLight.light.intensity = state ? 6 : 0;
    }
};