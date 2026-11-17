var CartObbyTrafficRobot = pc.createScript('cartObbyTrafficRobot');

CartObbyTrafficRobot.attributes.add('explosionEffect', { type: 'asset' });

// initialize code called once per entity
CartObbyTrafficRobot.prototype.initialize = function() {
    this.t = 0;

    this.entity.tags.add("Local");
    this.entity.collision.on("triggerenter", (other)=>{
        if (other.tags.has("LocalCollider")){
/*             other.parent.script.cartObbyCart.reciveHit(this.entity, 3, "front");
            other.parent.script.cartObbyCart.reciveHit(this.entity, 3, "back");
            other.parent.script.cartObbyCart.reciveHit(this.entity, 3, "left");
            other.parent.script.cartObbyCart.reciveHit(this.entity, 3, "right"); */

            this.app.fire("playerDie");

            let asset = this.explosionEffect
            if (asset && asset.resource) {
                let instance = asset.resource.instantiate();
                let pos = this.entity.getPosition()
                instance.setPosition(pos);
                this.app.root.addChild(instance);   
            }
        }
    },this)
};

CartObbyTrafficRobot.prototype.update = function(dt) {
    this.t = Math.min(this.t + (dt * 0.4), 1);

    let pos = new pc.Vec3();
    pos.lerp(this.fromPos, this.toPos, this.t);
    this.entity.setPosition(pos);

    if (this.t >= 1){this.entity.destroy();}
}; 
