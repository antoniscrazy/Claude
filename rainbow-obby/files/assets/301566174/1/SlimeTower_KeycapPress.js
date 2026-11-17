var SlimeTowerKeycapPress = pc.createScript('slimeTowerKeycapPress');

SlimeTowerKeycapPress.prototype.initialize = function () {
    this.keycap = this.entity.children[0];
    this.basePos = this.keycap.getLocalPosition().clone();

    if (this.entity.collision) {
        this.entity.collision.on('triggerenter', this._onCollisionStart, this);
        this.entity.collision.on('triggerleave', this._onCollisionEnd, this);
    }
};

SlimeTowerKeycapPress.prototype._onCollisionStart = function (other) {
    if (!other.tags.has("Player")) return;

    this.keycap
        .tween(this.keycap.getLocalPosition())
        .to(pc.Vec3.ZERO, .35, pc.QuinticOut)
        .start();

    if (this.entity.sound) {
        this.entity.sound.play("key");
    }
};

SlimeTowerKeycapPress.prototype._onCollisionEnd = function (other) {
    if (!other.tags.has("Player")) return;

    this.keycap
        .tween(this.keycap.getLocalPosition())
        .to(this.basePos, .35, pc.QuinticOut)
        .start();


};