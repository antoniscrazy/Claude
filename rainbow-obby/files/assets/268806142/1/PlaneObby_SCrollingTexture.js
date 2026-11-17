var PlaneObbySCrollingTexture = pc.createScript('planeObbySCrollingTexture');

PlaneObbySCrollingTexture.attributes.add('materialAsset', {
    type: 'asset'
});

PlaneObbySCrollingTexture.attributes.add('speed', {
    type: 'vec2',
});
PlaneObbySCrollingTexture.attributes.add('opacity', { type: "boolean" });

PlaneObbySCrollingTexture.tmpVec2 = new pc.Vec2();
PlaneObbySCrollingTexture.tmpOffset = new pc.Vec2();

PlaneObbySCrollingTexture.prototype.initialize = function () {
    // get the material that we will animate
    if (this.materialAsset) {
        this.material = this.materialAsset.resource;
    }
};

PlaneObbySCrollingTexture.prototype.update = function (dt) {
    if (this.material == null) return;
    var velocity = PlaneObbySCrollingTexture.tmpVec2;
    var offset = PlaneObbySCrollingTexture.tmpOffset;

    // Calculate how much to offset the texture
    // Speed * dt
    velocity.set(this.speed.x, this.speed.y);
    velocity.scale(dt);

    // Update the diffuse and normal map offset values
    offset.copy(this.material.emissiveMapOffset);
    offset.add(velocity);

    //this.material.offset.set(new pc.Vec2(this.speed.x * dt, 0));
    this.material.emissiveMapOffset = offset;
    this.material.normalMapOffset = offset;
    this.material.diffuseMapOffset = offset;
    if (this.opacity)
        this.material.opacityMapOffset = offset;

    this.material.update();
};
