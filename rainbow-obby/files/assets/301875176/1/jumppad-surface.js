var JumppadSurface = pc.createScript('jumppadSurface');

JumppadSurface.attributes.add('jumpForce', { type: 'number', default: 1, title: 'Jump Force' });
JumppadSurface.attributes.add('launchAngle', { type: 'number', default: 0, title: 'Launch Angle (deg from up)' });
JumppadSurface.attributes.add('curveTime', { type: 'number', default: 0.5, title: 'Curve Time (s)' });

JumppadSurface.attributes.add('squishScale', { type: 'number', default: 0.6, min: 0.1, max: 1, title: 'Squish Scale (Y)' });
JumppadSurface.attributes.add('squishDuration', { type: 'number', default: 0.08, title: 'Squish Duration (s)' });
JumppadSurface.attributes.add('popDuration', { type: 'number', default: 0.35, title: 'Pop Back Duration (s)' });

JumppadSurface.attributes.add('bounceSounds', { type: 'asset', assetType: 'audio', array: true, title: 'Bounce Sounds' });
JumppadSurface.attributes.add('soundVolume', { type: 'number', default: 1, min: 0, max: 1, title: 'Sound Volume' });
JumppadSurface.attributes.add('soundPitch', { type: 'number', default: 1, min: 0, max: 1, title: 'Sound Pitch' });

JumppadSurface.prototype.initialize = function () {
    this._baseScale = this.entity.getLocalScale().clone();

    this._setupPhysics();
    this._setupSound();

    if (this.entity.collision) {
        this.entity.collision.on('collisionstart', this._onCollision, this);
    }
};

JumppadSurface.prototype._setupPhysics = function () {
    if (!this.entity.tags.has('Ground')) {
        this.entity.tags.add('Ground');
    }

    if (!this.entity.collision) {
        this.entity.addComponent('collision', { type: 'mesh' });
        var render = this._getRender(this.entity);
        if (render && render.asset) this.entity.collision.renderAsset = render.asset;
    }

    if (!this.entity.rigidbody) {
        this.entity.addComponent('rigidbody', {
            type: pc.BODYTYPE_KINEMATIC,
            friction: 0,
            restitution: 0
        });
    }
};

JumppadSurface.prototype._getRender = function (entity) {
    if (!entity) return null;
    if (entity.render) return entity.render;
    var renders = entity.findComponents('render');
    return renders.length ? renders[0] : null;
};

JumppadSurface.prototype._onCollision = function (result) {
    var other = result.other;
    if (!other || !other.tags.has('Player') || !other.rigidbody || !this.app.playerBounce) return;

    var rad = this.launchAngle * pc.math.DEG_TO_RAD;
    var dir = this.entity.up.mulScalar(Math.cos(rad))
        .add(this.entity.forward.mulScalar(Math.sin(rad)))
        .normalize();

    this.app.playerBounce.bounce(dir, this.jumpForce, this.curveTime);

    this._playSquish();
    this._playBounceSound(other);
};

JumppadSurface.prototype._setupSound = function () {
    if (!this.bounceSounds || !this.bounceSounds.length) return;

    if (!this.entity.sound) {
        this.entity.addComponent('sound', { positional: true, refDistance: 5 });
    }

    for (var i = 0; i < this.bounceSounds.length; i++) {
        var asset = this.bounceSounds[i];
        if (!asset) continue;
        var name = 'bounce_' + i;
        if (!this.entity.sound.slot(name)) {
            this.entity.sound.addSlot(name, {
                asset: asset.id,
                volume: this.soundVolume,
                autoPlay: false,
                overlap: true
            });
        }
    }
};

JumppadSurface.prototype._playBounceSound = function (player) {
    var slot = this._playRandomBounceSlot();
    if (slot) return;

    // no valid custom sound played: fall back to the player's own jump sound
    if (player && player.sound && player.sound.slot('jump')) {
        player.sound.play('jump');
    }
};

JumppadSurface.prototype._playRandomBounceSlot = function () {
    if (!this.bounceSounds || !this.bounceSounds.length || !this.entity.sound) return null;

    var validAssets = this.bounceSounds.filter(function (a) { return !!a; });
    if (!validAssets.length) return null;

    var idx = Math.floor(Math.random() * this.bounceSounds.length);
    var slot = this.entity.sound.slot('bounce_' + idx);

    // the randomly picked index had no asset assigned: fall back to the first valid slot
    if (!slot) {
        var firstValidIdx = this.bounceSounds.indexOf(validAssets[0]);
        slot = this.entity.sound.slot('bounce_' + firstValidIdx);
    }

    if (slot) {
        slot.pitch = (this.soundPitch - .2) + Math.random() * 0.4;
        slot.play();
    }
    return slot;
};

JumppadSurface.prototype._playSquish = function () {
    var self = this;
    var base = this._baseScale;
    var squished = new pc.Vec3(base.x * 1.15, base.y * this.squishScale, base.z * 1.15);

    this.entity.tween(this.entity.getLocalScale())
        .to(squished, this.squishDuration, pc.SineOut)
        .onComplete(function () {
            self.entity.tween(self.entity.getLocalScale())
                .to(base, self.popDuration, pc.BackOut)
                .start();
        })
        .start();
};
