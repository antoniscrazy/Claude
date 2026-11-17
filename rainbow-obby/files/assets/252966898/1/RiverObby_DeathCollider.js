var RiverObbyDeathCollider = pc.createScript('riverObbyDeathCollider');

// initialize code called once per entity
RiverObbyDeathCollider.prototype.initialize = function() {
    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            const playerController = otherEntity.script.riverObbyPlayerController;
            if (playerController) {
                playerController.died();
            }
        }
    }, this);
};
