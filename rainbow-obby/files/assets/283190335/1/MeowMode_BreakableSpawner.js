var MeowModeBreakableSpawner = pc.createScript('meowModeBreakableSpawner');

//MeowModeBreakableSpawner.attributes.add("name", {type:"string",default:"Name"});
MeowModeBreakableSpawner.attributes.add("hp", {type:"number",default:1});
MeowModeBreakableSpawner.attributes.add("minLevel", {type:"number",default:3});
//MeowModeBreakableSpawner.attributes.add("xpReward", {type:"number",default:1});
MeowModeBreakableSpawner.attributes.add("giveXpOnHit", {type:"boolean",default:true});
MeowModeBreakableSpawner.attributes.add("respawnTime", {type:"number",default:10});

// initialize code called once per entity
MeowModeBreakableSpawner.prototype.initialize = function() {

    let _breakableTemplate = this.app.assets.get(283335577);

    if (_breakableTemplate && _breakableTemplate.resource) {
        let instance = _breakableTemplate.resource.instantiate();
        instance.setPosition(this.entity.getPosition());
        instance.setRotation(this.entity.getRotation());
        instance.setLocalScale(this.entity.getScale().clone());

        instance.script.meowModeBreakable.name = this.entity.name;
        instance.script.meowModeBreakable.hp = this.hp;
        instance.script.meowModeBreakable.minLevel = this.minLevel;
        //instance.script.meowModeBreakable.xpReward = this.xpReward;
        instance.script.meowModeBreakable.giveXpOnHit = this.giveXpOnHit;
        instance.script.meowModeBreakable.respawnTime = this.respawnTime;

        this.app.root.addChild(instance);

        this.entity.reparent(instance.findByName("TransformModifier"));
        this.entity.setLocalPosition(0,0,0);
        this.entity.setLocalRotation(0,0,0,0);
        this.entity.setLocalScale(1,1,1);

        //this.entity.children[0].enabled = false;

    }
};
