var PlaneObbyWindArea = pc.createScript('planeObbyWindArea');

// initialize code called once per entity
PlaneObbyWindArea.prototype.initialize = function() {

    this.area = this.entity.findByName("Area");
    this.area.render.enabled = false;
    this.entity.findByName("Cone").render.enabled = false;

    this.area.collision.on("triggerenter", (other)=>{
        if (other.tags && other.tags.has("LocalCollider")){
            this.app.wind.active = true;
            this.app.wind.direction = this.entity.up;
        }
    })

    let scale = this.area.getScale();
    this.area.collision.halfExtents = new pc.Vec3(
        scale.x / 2,
        scale.y / 2,
        scale.z / 2,
    );


    this.area.collision.on("triggerleave", (other)=>{
        if (other.tags && other.tags.has("LocalCollider")){
            this.app.wind.active = false;
            this.app.wind.direction = new pc.Vec3(0,0,0);
        }
    })
};

