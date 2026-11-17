var CartObbyFerrisRail = pc.createScript('cartObbyFerrisRail');

CartObbyFerrisRail.attributes.add("baseEntity", {type:"entity"});

// initialize code called once per entity
CartObbyFerrisRail.prototype.initialize = function() {

};

CartObbyFerrisRail.prototype.update = function (dt) {
    let parentRot = this.baseEntity.getRotation().clone();
    parentRot.invert();
    this.entity.setLocalRotation(parentRot);
};