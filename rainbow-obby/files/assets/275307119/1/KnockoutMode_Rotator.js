var KnockoutModeRotator = pc.createScript('knockoutModeRotator');

KnockoutModeRotator.attributes.add('speed', { type: 'vec3', default: [30, 0, 0] });
KnockoutModeRotator.attributes.add('rotateGlobally', { type: 'boolean', default: false });
// update code called every frame
KnockoutModeRotator.prototype.update = function (dt) {
    if (this.rotateGlobally) {
        this.entity.rotate(this.speed.x * dt, this.speed.y * dt, this.speed.z * dt);
    } else {
        this.entity.rotateLocal(this.speed.x * dt, this.speed.y * dt, this.speed.z * dt);
    }
};
