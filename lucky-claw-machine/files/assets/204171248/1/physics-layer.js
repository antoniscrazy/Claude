var PhysicsLayer = pc.createScript('physicsLayer');

PhysicsLayer.attributes.add('groupA', {type: 'boolean', default: false, title: 'Group A'});
PhysicsLayer.attributes.add('groupB', {type: 'boolean', default: false, title: 'Group B'});
PhysicsLayer.attributes.add('groupC', {type: 'boolean', default: false, title: 'Group C'});
PhysicsLayer.attributes.add('groupD', {type: 'boolean', default: false, title: 'Group D'});

PhysicsLayer.attributes.add('maskAll', {type: 'boolean', default: true, title: 'Mask All'});
PhysicsLayer.attributes.add('maskA', {type: 'boolean', default: false, title: 'Mask A'});
PhysicsLayer.attributes.add('maskB', {type: 'boolean', default: false, title: 'Mask B'});
PhysicsLayer.attributes.add('maskC', {type: 'boolean', default: false, title: 'Mask C'});
PhysicsLayer.attributes.add('maskD', {type: 'boolean', default: false, title: 'Mask D'});


PhysicsLayer.attributes.add('custom_on_key', {type: 'boolean', default: false});

// initialize code called once per entity
PhysicsLayer.prototype.initialize = function() {
    var body = this.entity.rigidbody;
    
    // Groups
    if (this.groupA) {
        body.group |= (pc.BODYGROUP_USER_1);
    }

    if (this.groupB) {
        body.group |= (pc.BODYGROUP_USER_2);
    }

    if (this.groupC) {
        body.group |= (pc.BODYGROUP_USER_3);
    }

    if (this.groupD) {
        body.group |= (pc.BODYGROUP_USER_4);
    }
    
    // Masks
    // Reset the mask to 0 so that the engine defaults aren't used
    body.mask = pc.BODYGROUP_TRIGGER;
    
    if (this.maskAll) {
        body.mask |= (pc.BODYMASK_ALL);
    }
    
    if (this.maskA) {
        body.mask |= (pc.BODYGROUP_USER_1);
    }

    if (this.maskB) {
        body.mask |= (pc.BODYGROUP_USER_2);
    }

    if (this.maskC) {
        body.mask |= (pc.BODYGROUP_USER_3);
    }

    if (this.maskD) {
        body.mask |= (pc.BODYGROUP_USER_4);
    }

    if(this.custom_on_key)
    {
        this.app.keyboard.on("keydown", this.onKeyDown, this);
    }
};

PhysicsLayer.prototype.onKeyDown = function(e) {

    var body = this.entity.rigidbody;

    if((e.key == pc.KEY_P)) 
    {
        body.mask = pc.BODYGROUP_TRIGGER;
    }

    if((e.key == pc.KEY_O)) 
    {
        body.mask |= (pc.BODYGROUP_USER_2);
        body.mask |= (pc.BODYGROUP_USER_3);
        body.mask |= (pc.BODYGROUP_USER_4);
    }
};
