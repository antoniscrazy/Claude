var SlimeTowerMovingObstacle = pc.createScript('slimeTowerMovingObstacle');

SlimeTowerMovingObstacle.attributes.add('targetPointEntity', { type: 'entity', title: 'Target Point Entity' });
SlimeTowerMovingObstacle.attributes.add('duration', { type: 'number', default: 1, title: 'Duration' });

SlimeTowerMovingObstacle.prototype.initialize = function () {
    if (!this.targetPointEntity) {
        this.targetPointEntity = this.entity.findByName("TargetPoint");
    }

    if (!this.targetPointEntity) {
        if (this.entity.children.length > 0) {
            this.targetPointEntity = this.entity.children[0];
        }
    }

    if (!this.targetPointEntity) {
        return;
    }

    var targetWorldPos = this.targetPointEntity.getPosition().clone();

    if (this.entity.parent) {
        var invParentTransform = this.entity.parent.getWorldTransform().clone().invert();
        this.targetPos = invParentTransform.transformPoint(targetWorldPos);
    } else {
        this.targetPos = targetWorldPos;
    }

    this.entity
        .tween(this.entity.getLocalPosition())
        .to(this.targetPos, this.duration, pc.SineInOut)
        .loop(true)
        .yoyo(true)
        .start();
};
