var RiverObbyDestroyer = pc.createScript('riverObbyDestroyer');
RiverObbyDestroyer.attributes.add('lifeTime', { type: 'number', default: 10 });
// initialize code called once per entity
RiverObbyDestroyer.prototype.initialize = function () {
    this.destroyTime = Date.now() + this.lifeTime * 1000;
};

// update code called every frame
RiverObbyDestroyer.prototype.update = function (dt) {
    if (this.destroyTime < Date.now())
        this.entity.destroy();
};