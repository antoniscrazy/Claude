var CartObbyPolicePatrol = pc.createScript('cartObbyPolicePatrol');

CartObbyPolicePatrol.attributes.add('explosionEffect', { type: 'asset' });

CartObbyPolicePatrol.prototype.initialize = function() {
    this.spline = this.entity.script.cartObbySpline;

    this.t = 0;
    this.speed = 0.1;

    this.entity.tags.add("Local");
    this.entity.collision.on("triggerenter", (other)=>{
        if (other.tags.has("LocalCollider") && other.parent.script.cartObbyCart.player){
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

CartObbyPolicePatrol.prototype.update = function(dt) {
    this.t += dt * this.speed;
    if (this.t > 1) this.t -= 1;

    let pos = this.spline.getPosition(this.t);
    let rot = this.spline.getRotation(this.t);

    this.entity.setPosition(pos);
    this.entity.setRotation(rot);
};
