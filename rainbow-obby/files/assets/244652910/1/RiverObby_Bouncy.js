var RiverObbyBouncy = pc.createScript('riverObbyBouncy');

// initialize code called once per entity
RiverObbyBouncy.prototype.initialize = function () {
    this.entity.children[0].collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            const playerController = otherEntity.script.riverObbyPlayerController;
            if (playerController) {
                otherEntity.rigidbody.applyImpulse(0, 10, 0);
                this.entity
                    .tween(this.entity.getLocalScale())
                    .to(this.entity.getLocalScale().clone().addScalar(0.5), 0.1, pc.SineOut)
                    .yoyo(true)
                    .repeat(2)
                    .onComplete(() => {
                    })
                    .start();
            }
        }
    }, this);
};