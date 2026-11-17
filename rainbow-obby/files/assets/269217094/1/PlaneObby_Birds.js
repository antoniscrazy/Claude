var PlaneObbyBirds = pc.createScript('planeObbyBirds');

PlaneObbyBirds.attributes.add('textures', {
    type: 'asset',
    assetType: 'texture',
    array: true
});

PlaneObbyBirds.prototype.initialize = function () {
    return;
    var mesh = this.entity.render.meshInstances[0];

    // material clone
    this.mat = mesh.material.clone();
    mesh.material = this.mat;

    // random start
    this.frame = 0;
    this.timer = 0;

    this.applyFrame();
};

PlaneObbyBirds.prototype.applyFrame = function () {
    return;
    var tex = this.frame
        ? this.textures[1].resource
        : this.textures[0].resource;

    this.mat.diffuseMap = tex;
    this.mat.opacityMap = tex;
    this.mat.update();
};

PlaneObbyBirds.prototype.update = function (dt) {
    return;
    this.timer += dt;

    if (this.timer > 0.2) {
        this.timer = 0;
        this.frame = !this.frame;
        this.applyFrame();
    }
};
