var MeowModeBreakable = pc.createScript('meowModeBreakable');

MeowModeBreakable.attributes.add("name", {type:"string",default:"Name"});
MeowModeBreakable.attributes.add("hp", {type:"number",default:1});
MeowModeBreakable.attributes.add("minLevel", {type:"number",default:3});
//MeowModeBreakable.attributes.add("xpReward", {type:"number",default:1});
MeowModeBreakable.attributes.add("giveXpOnHit", {type:"boolean",default:true});
MeowModeBreakable.attributes.add("respawnTime", {type:"number",default:10});

MeowModeBreakable.prototype.initialize = function(){
    this.id = this.name + "_" + this.getId();
    this.hpMax = this.hp;
    this.state = "intact";

    this.texts = {
        name: this.entity.findByName("TextName").element,
        state: this.entity.findByName("TextState").element,
        hp: this.entity.findByName("TextHp").element,
        xpReward: this.entity.findByName("TextXpReward").element,
        minLevel: this.entity.findByName("TextMinLevel").element,
        respawnTime: this.entity.findByName("TextRespawnTime").element,
    }

    this.texts.name.text = this.name;
    this.texts.hp.text = this.hp + "/" + this.hpMax;
    //this.texts.xpReward.text = "xpReward: " + this.xpReward;
    this.texts.minLevel.text = "minLevel: " + this.minLevel;
    this.texts.respawnTime.text = "resTime: " + this.respawnTime;

    this.debugTextGroup = this.entity.findByName("DebugTextGroup");
    this.debugTextGroup.enabled = false;

    this.trigger = this.entity.findByName("Trigger").script.meowModeTrigger;
    this.trigger.tags = ["Player"];

    this.proximity = false;
    this.trigger.onTriggerEnter = ()=>{

        if (this.state != "destroyed"){this.healthBar.show(true);};
        this.proximity = true;
    };
    this.trigger.onTriggerLeave = ()=>{
        this.healthBar.hide();
        this.proximity = false;
    };

    this.healthBar = {
        entity: this.entity.findByName("Durablity"),
        bar: this.entity.findByName("DurabilityBar"),
        bg: this.entity.findByName("DurablityBG"),
        skipFirstShow: false,

        show: (_until_hide = false) => {
            if (!this.healthBar.skipFirstShow){this.healthBar.skipFirstShow = true; return;}
            //this.healthBar.bar.tween(this.healthBar.bar.element).to({ opacity: 1 }, 0.3, pc.SineOut).start();
            //this.healthBar.bg.tween(this.healthBar.bg.element).to({ opacity: 1 }, 0.3, pc.SineOut).start();
            this.texts.name.entity.enabled = true;
            this.healthBar.entity.enabled = true;

            if (_until_hide || this.proximity){
                this.healthBar.visibleTime = Infinity;
            } else {
                this.healthBar.visibleTime = 2;
            }
        },

        hide: () => {
            this.healthBar.visibleTime = 0;
            //this.healthBar.bar.tween(this.healthBar.bar.element).to({ opacity: 0 }, 0.3, pc.SineOut).start();
            //this.healthBar.bg.tween(this.healthBar.bg.element).to({ opacity: 0 }, 0.3, pc.SineOut).start();
            this.healthBar.entity.enabled = false;
            this.texts.name.entity.enabled = false;
        },

        setHealth: (_percent)=>{
            this.healthBar.bar.setLocalScale(0.545 * _percent, 0.035, 0.1);
            this.healthBar.bar.element.color = this.getDurabilityColor(_percent);
        },

        visibleTime: 0,
    }

    this.healthBar.hide();

    this.models = {
        materialHit: this.app.assets.get(282728055).resource,
        materialNormal: this.app.assets.get(281480200).resource,
        hitParticle: this.app.assets.get(283692543),
        destroyedObject: this.app.assets.get(283713794),
        collision: this.entity.findByName("Collision"),
        root: this.entity.findByName("Models"),
        modifier: this.entity.findByName("TransformModifier"),

        update: ()=>{
            if (this.hp > 0){
                this.models.root.children.forEach(child => {child.enabled = true;});
                this.models.collision.enabled = true;
            } else {
                this.models.root.children.forEach(child => {child.enabled = false;});
                this.models.collision.enabled = false;
            }
        },

        flash: () => {
            let children = this.models.modifier.children;

            children.forEach(child => {
                if (child.render && child.render.meshInstances) {
                    child.render.meshInstances.forEach(mi => {
                        mi.material = this.models.materialHit;
                    });
                }
            });

            setTimeout(() => { if (this.entity && !this.entity.script) return;
                children.forEach(child => {
                    if (child.render && child.render.meshInstances) {
                        child.render.meshInstances.forEach(mi => {
                            mi.material = this.models.materialNormal;
                        });
                    }
                });
            }, 180);
        },
    }

    this.app.on("Connected", this.onConnected, this);

    this.on('destroy', function () {
        this.app.off("Connected");
    }, this);

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        let _model = this.entity.findByName("TransformModifier");

        if (_model.children[0] && _model.children[0].render){
            this.models.collision.collision.renderAsset = _model.children[0].render.asset;
            this.models.collision.collision.convexHull = true;
        }

        let _displayGroup = this.entity.findByName("DisplayGroup");
        let _scale = this.entity.getLocalScale().clone();
        _displayGroup.setLocalScale(1/_scale.x*2,1/_scale.y*2,1/_scale.z*2);

        let _position = _displayGroup.getLocalPosition().clone();
        let _p = (_scale.x / 8) * 2.2;
        if (_p < 0) {_p = 0};
        if (_p > 2.2) {_p = 2.2}
        _displayGroup.setLocalPosition(_position.x,_position.y - _p,_position.z);
    }, 1000);
}

MeowModeBreakable.prototype.update = function(dt){
    if (this.healthBar.visibleTime > 0){
        this.healthBar.visibleTime = Math.max(this.healthBar.visibleTime-dt, 0);

        if (this.healthBar.visibleTime <= 0){
            this.healthBar.hide();
        }
    }
}

MeowModeBreakable.prototype.onConnected = function(){
    this.app.meowModeNetworkManager.send("Client:RegisterBreakableObject", {
        id: this.id,
        name: this.name,
        hp: this.hp,
        minLevel: this.minLevel,
        //xpReward: this.xpReward,
        giveXpOnHit: this.giveXpOnHit,
        respawnTime: this.respawnTime,
    })
    
    this.app.gameManager.breakableObjects[this.id] = this;
}

MeowModeBreakable.prototype.receiveUpdate = function(_hp, _state){
    this.hp = _hp;
    this.state = _state;
    this.texts.hp.text = _hp + "/" + this.hpMax;
    this.texts.state.text = "["+_state+"]";

    this.healthBar.setHealth(pc.math.clamp(this.hp / this.hpMax, 0,1));
    this.models.update();

    switch(_state){
        case "intact":
            this.models.root.setLocalEulerAngles(0,0,0);
            this.healthBar.show();
            break;
        
        case "damaged":
            this.damageRotate();
            this.damageScale();
            this.healthBar.show();
            this.models.flash();
            //this.app.hitParticle.spawn(this.entity.getPosition().clone());
            break;

        case "destroyed":
            this.healthBar.hide();

            if (this.models.hitParticle && this.models.hitParticle.resource) {
                let instance = this.models.hitParticle.resource.instantiate();
                let pos = this.entity.getPosition();
                instance.setPosition(new pc.Vec3(pos.x,pos.y+1,pos.z));
                this.app.root.addChild(instance);
            }

            if (this.models.destroyedObject && this.models.destroyedObject.resource) {
                let instance = this.models.destroyedObject.resource.instantiate();
                instance.setPosition(this.entity.getPosition());
                instance.setRotation(this.entity.getRotation());
                instance.setLocalScale(this.entity.getScale());

                instance.render.asset = this.models.modifier.children[0].render.asset;
                instance.render.meshInstances.forEach(mi => {mi.material = this.models.materialNormal;});
                instance.collision.renderAsset = this.models.modifier.children[0].render.asset;

                this.app.root.addChild(instance);
            }
            break;
    }
}

MeowModeBreakable.prototype.sendHitRequest = function(){
    this.app.meowModeNetworkManager.send("Client:BreakableObject:HitRequest", {id: this.id,})
}

MeowModeBreakable.prototype.hit = function(_dir){
    this.sendHitRequest();
}

MeowModeBreakable.prototype.damageRotate = function () {
    let start = this.models.root.getLocalEulerAngles().clone();

    let target = new pc.Vec3(
        pc.math.random(-10, 10),
        pc.math.random(-10, 10),
        pc.math.random(-10, 10)
    );

    let t = { x: start.x, y: start.y, z: start.z };

    this.entity.tween(t)
        .to({ x: target.x, y: target.y, z: target.z }, 0.1, pc.SineInOut)
        .onUpdate(() => {
            this.models.root.setLocalEulerAngles(t.x, t.y, t.z);
        })
        .start();
};

MeowModeBreakable.prototype.damageScale = function(){
    let entity = this.models.root;
    entity.tween(entity.getLocalScale())
        .to(new pc.Vec3(1.2, 1.2, 1.2), 0.1, pc.ExponentialIn)
        .onComplete(function () {
            // Sonra küçült
            entity.tween(entity.getLocalScale())
                .to(new pc.Vec3(1,1,1), .15, pc.SineInOut)
                .start();

        })
        .start();
}

MeowModeBreakable.prototype.getId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};

MeowModeBreakable.prototype.getDurabilityColor = function (v) {
    v = pc.math.clamp(v, 0, 1);

    const red = new pc.Color(1, 0, 0);
    const orange = new pc.Color(1, 0.5, 0);
    const green = new pc.Color(0, 1, 0);

    const color = new pc.Color();

    if (v < 0.5) {
        color.lerp(red, orange, v * 2);
    } else {
        color.lerp(orange, green, (v - 0.5) * 2);
    }

    return color;
};



