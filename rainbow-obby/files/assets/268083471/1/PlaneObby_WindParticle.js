var PlaneObbyWindParticle = pc.createScript('planeObbyWindParticle');

// initialize code called once per entity
PlaneObbyWindParticle.prototype.initialize = function() {
    let forward = this.entity.forward.clone().scale(5);
    this.entity.particlesystem.velocity = forward;
};

// update code called every frame
PlaneObbyWindParticle.prototype.update = function(dt) {

};

