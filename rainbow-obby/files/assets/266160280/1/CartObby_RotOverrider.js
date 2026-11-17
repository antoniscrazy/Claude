var CartObbyRotOverrider = pc.createScript('cartObbyRotOverrider');

CartObbyRotOverrider.attributes.add('baseEntity', {type: 'entity'});

// initialize code called once per entity
CartObbyRotOverrider.prototype.initialize = function() {
    this.entity.collision.on("triggerenter", (other)=>{
        if (other.tags && other.tags.has("LocalCollider")){
            this.app.rotOverrider = this.baseEntity;
            //console.log(this.baseEntity.name);
        }
    })

    this.entity.collision.on("triggerleave", (other)=>{
        if (other.tags && other.tags.has("LocalCollider")){
            if (this.app.rotOverrider == this.baseEntity){
                this.app.rotOverrider = null;
                //console.log("null");
            }
        }
    })
};

