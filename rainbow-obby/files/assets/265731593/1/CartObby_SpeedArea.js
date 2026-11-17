var CartObbySpeedArea = pc.createScript('cartObbySpeedArea')

CartObbySpeedArea.attributes.add("speedScalar", {type:"number", default:3});

// initialize code called once per entity
CartObbySpeedArea.prototype.initialize = function() {
    this.entity.render.enabled = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;

    let col = this.entity.collision;
    if (col && col.type === 'box') {
        let eScale = this.entity.getLocalScale();
        let base = col.halfExtents.clone();
        col.halfExtents = new pc.Vec3(
            base.x * eScale.x,
            base.y * eScale.y,
            base.z * eScale.z
        );
    }

    this.entity.collision.on("triggerenter", (other)=>{
        if (other.tags.has("LocalCollider")){

            //console.log("speedArea")
            this.app.fire("Nitro:Enable");

            if (other.rigidbody) {
                let v = other.rigidbody.linearVelocity.clone();

                if (Math.abs(v.x) < 4) v.x = 0;
                if (Math.abs(v.y) < 4) v.y = 0;
                if (Math.abs(v.z) < 4) v.z = 0;

                let multiplier = this.speedScalar;
                v.mulScalar(multiplier);

                other.rigidbody.linearVelocity = v;
            }
        }
    }, this);
};


