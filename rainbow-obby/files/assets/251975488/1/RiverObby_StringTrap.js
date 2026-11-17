var RiverObbyStringTrap = pc.createScript('riverObbyStringTrap');

RiverObbyStringTrap.attributes.add('targetEntity', { type: 'entity' });

// initialize code called once per entity
RiverObbyStringTrap.prototype.initialize = function() {
    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            this.targetEntity.fire("trigger")
        }
    }, this);
};





