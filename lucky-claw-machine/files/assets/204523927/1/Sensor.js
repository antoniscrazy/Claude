var Sensor = pc.createScript('sensor');

Sensor.attributes.add('guard_collision', {
    type: 'entity'
});

// initialize code called once per entity
Sensor.prototype.initialize = function() {
    this.entity.collision.on('triggerenter', this.onTriggerEnter, this);
};

Sensor.prototype.onTriggerEnter = function(entity) {

    if(entity.script.toy)
    {
        Collection.instance.checkToy(entity.script.toy);        
    }
    else
    {       
        entity.destroy();
    }

    this.guard_collision.enabled = false;
};