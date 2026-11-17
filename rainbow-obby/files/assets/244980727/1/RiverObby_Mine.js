var RiverObbyMine = pc.createScript('riverObbyMine');
RiverObbyMine.attributes.add('explosion', { type: 'asset', assetType: 'template' });
// initialize code called once per entity
RiverObbyMine.prototype.initialize = function () {
    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            const playerController = otherEntity.script.riverObbyPlayerController;
            if (playerController) {
                otherEntity.rigidbody.applyImpulse(0, 10, 0);
                playerController.died();
                const exp = this.explosion.resource.instantiate();
                this.app.root.addChild(exp);
                exp.setPosition(this.entity.getPosition());
                exp.particlesystem.reset();
                exp.particlesystem.play();
                this.entity.destroy();
            }
        }
    }, this);
};