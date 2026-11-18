var Toy = pc.createScript('toy');

Toy.attributes.add('id', {type: 'string'});

Toy.prototype.initialize = function() {

    if(!Toy.all_toys)
    {
        Toy.all_toys = [];
    }

    Toy.all_toys.push(this);
    
    this.entity.rigidbody.group |= (pc.BODYGROUP_USER_2);
    this.entity.rigidbody.mask |= (pc.BODYMASK_ALL);  
};

Toy.prototype.update = function(dt) {

};
