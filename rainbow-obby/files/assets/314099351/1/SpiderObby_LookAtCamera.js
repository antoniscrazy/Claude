var SpiderObbyLookAtcamera = pc.createScript('spiderObbyLookAtcamera');

SpiderObbyLookAtcamera.attributes.add('angle', {
    type: 'vec3',
    default: [180, 0, 180]
});

// initialize code called once per entity
SpiderObbyLookAtcamera.prototype.initialize = function () {
    this.camera = this.app.root.findByName("Camera");
};

// update code called every frame
SpiderObbyLookAtcamera.prototype.update = function (dt) {
    this.entity.lookAt(this.camera.getPosition());
    this.entity.rotateLocal(this.angle.x, this.angle.y, this.angle.z);
};