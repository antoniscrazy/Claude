var CartObbyFollower = pc.createScript('cartObbyFollower');

// initialize code called once per entity
CartObbyFollower.prototype.initialize = function() {
    // Inside your vagon script
    this.path = this.app.spline;

    this.t = 0; // current progress
};

// update code called every frame
CartObbyFollower.prototype.update = function(dt) {
/*     this.t = (this.t + dt * 0.01) % 1;

    let pos = this.path.getPosition(this.t);
    let rot = this.path.getRotation(this.t);

    this.entity.setPosition(pos);
    this.entity.setRotation(rot); */
};