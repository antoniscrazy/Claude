var PlaneObbyColliderToRender = pc.createScript('planeObbyColliderToRender');

// initialize code called once per entity
PlaneObbyColliderToRender.prototype.initialize = function() {
    let _scale = this.entity.getScale();
    this.entity.collision.halfExtents = new pc.Vec3(_scale.x/2, _scale.y/2, _scale.z/2);
    this.entity.render.enabled = false;
};
