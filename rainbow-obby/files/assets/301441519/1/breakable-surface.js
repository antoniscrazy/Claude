var BreakableSurface = pc.createScript('breakableSurface');

BreakableSurface.attributes.add('breakDelay', { type: 'number', default: 2, title: 'Break Delay (s)' });
BreakableSurface.attributes.add('respawnDelay', { type: 'number', default: 3, title: 'Respawn Delay (s)' });
BreakableSurface.attributes.add('vanishDuration', { type: 'number', default: 0.25, title: 'Vanish Duration (s)' });
BreakableSurface.attributes.add('respawnDuration', { type: 'number', default: 0.4, title: 'Respawn Duration (s)' });

BreakableSurface.attributes.add('shakeAmount', { type: 'number', default: 0.06, title: 'Shake Amount (local)' });
BreakableSurface.attributes.add('shakeSpeed', { type: 'number', default: 35, title: 'Shake Speed' });
BreakableSurface.attributes.add('shakeTilt', { type: 'number', default: 2, title: 'Shake Tilt (deg)' });

BreakableSurface.attributes.add('crustTiltBoost', { type: 'number', default: 2.5, title: 'Crust Tilt Boost' });
BreakableSurface.attributes.add('crustSpreadBoost', { type: 'number', default: 0.4, title: 'Crust Spread Boost' });
BreakableSurface.attributes.add('crustCrackPoints', { type: 'number', default: 5, title: 'Crust Crack Points' });

BreakableSurface.attributes.add('breakSounds', { type: 'asset', assetType: 'audio', array: true, title: 'Break Sounds' });
BreakableSurface.attributes.add('soundVolume', { type: 'number', default: 1, min: 0, max: 1, title: 'Sound Volume' });

var STATE_IDLE = 0;
var STATE_SHAKING = 1;
var STATE_VANISHING = 2;
var STATE_GONE = 3;
var STATE_RESPAWNING = 4;

function easeInCubic(t) {
    return t * t * t;
}

function easeOutBack(t) {
    var c1 = 1.70158;
    var c3 = c1 + 1;
    var p = t - 1;
    return 1 + c3 * p * p * p + c1 * p * p;
}

BreakableSurface.prototype.initialize = function () {
    this._state = STATE_IDLE;
    this._timer = 0;
    this._shakeTime = 0;

    this._basePos = this.entity.getLocalPosition().clone();
    this._baseScale = this.entity.getLocalScale().clone();
    this._baseRot = this.entity.getLocalEulerAngles().clone();

    this._tmpVec = new pc.Vec3();
    this._crackPoints = [];
    this._crustMats = null;

    this._squish = (this.entity.script && this.entity.script.squishSurface) || null;
    this._setupSound();
    this._setupPhysics();

    if (this._squish && this._squish.squishEnabled) {
        var self = this;
        var originalPressAt = this._squish.pressAt;
        this._squish.pressAt = function (worldPos) {
            originalPressAt.call(this, worldPos);
            self.trigger();
        };
    }

    if (this.entity.collision) {
        this.entity.collision.on('collisionstart', this._onCollision, this);
    }
};

BreakableSurface.prototype._setupPhysics = function () {
    if (this._squish) return;

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

BreakableSurface.prototype._getRender = function (entity) {
    if (!entity) return null;
    if (entity.render) return entity.render;
    var renders = entity.findComponents('render');
    return renders.length ? renders[0] : null;
};

BreakableSurface.prototype._onCollision = function (result) {
    this.trigger(result);
};

BreakableSurface.prototype.trigger = function (result) {
    if (this._state !== STATE_IDLE) return;
    if (result && result.other && result.other.tags.has("Player")) {
        this._state = STATE_SHAKING;
        this._timer = 0;
        this._shakeTime = 0;
        this._buildCrackPoints();
        this._playBreakSound();
    }
};

BreakableSurface.prototype._buildCrackPoints = function () {
    this._crackPoints.length = 0;
    if (!this._squish || !this._squish.squishEnabled) return;
    if (!this._getCrustMaterials()) return;

    var render = this._getRender(this.entity);
    if (!render || !render.meshInstances.length) return;

    var aabb = render.meshInstances[0].aabb;
    var min = aabb.getMin();
    var max = aabb.getMax();

    for (var i = 0; i < this.crustCrackPoints; i++) {
        this._crackPoints.push(new pc.Vec3(
            min.x + Math.random() * (max.x - min.x),
            max.y,
            min.z + Math.random() * (max.z - min.z)
        ));
    }
};

BreakableSurface.prototype._getCrustMaterials = function () {
    if (this._crustMats) return this._crustMats;

    var squish = this._squish;
    if (!squish || !squish._crustTarget) return null;

    var render = this._getRender(squish._crustTarget);
    if (!render || !render.meshInstances.length) return null;

    var mats = [];
    for (var i = 0; i < render.meshInstances.length; i++) {
        var m = render.meshInstances[i].material;
        if (m) mats.push(m);
    }
    if (!mats.length) return null;

    this._crustMats = mats;
    this._baseTilt = squish.tiltAmount;
    this._baseSpread = squish.radialSpread;
    return this._crustMats;
};

BreakableSurface.prototype._setCrustParams = function (tilt, spread) {
    var mats = this._getCrustMaterials();
    if (!mats) return;
    for (var i = 0; i < mats.length; i++) {
        mats[i].setParameter('uTiltAmount', tilt);
        mats[i].setParameter('uRadialSpread', spread);
    }
};

BreakableSurface.prototype.update = function (dt) {
    if (this._state === STATE_IDLE) return;

    this._timer += dt;

    if (this._state === STATE_SHAKING) {
        this._updateShake(dt);
        if (this._timer >= this.breakDelay) {
            this._state = STATE_VANISHING;
            this._timer = 0;
        }
        return;
    }

    if (this._state === STATE_VANISHING) {
        var vp = Math.min(this._timer / Math.max(this.vanishDuration, 0.001), 1);
        var s = 1 - easeInCubic(vp);
        this.entity.setLocalScale(
            this._baseScale.x * s,
            this._baseScale.y * s,
            this._baseScale.z * s
        );
        this.entity.setLocalEulerAngles(
            this._baseRot.x,
            this._baseRot.y + vp * 25,
            this._baseRot.z
        );

        if (vp >= 1) {
            this._setVisible(false);
            this._state = STATE_GONE;
            this._timer = 0;
        }
        return;
    }

    if (this._state === STATE_GONE) {
        if (this._timer >= this.respawnDelay) {
            this._resetSquish();
            this._setVisible(true);
            this.entity.setLocalPosition(this._basePos);
            this.entity.setLocalEulerAngles(this._baseRot);
            this.entity.setLocalScale(0, 0, 0);
            this._state = STATE_RESPAWNING;
            this._timer = 0;
        }
        return;
    }

    if (this._state === STATE_RESPAWNING) {
        var rp = Math.min(this._timer / Math.max(this.respawnDuration, 0.001), 1);
        var e = easeOutBack(rp);
        this.entity.setLocalScale(
            this._baseScale.x * e,
            this._baseScale.y * e,
            this._baseScale.z * e
        );

        if (rp >= 1) {
            this.entity.setLocalScale(this._baseScale);
            this._state = STATE_IDLE;
        }
    }
};

BreakableSurface.prototype._updateShake = function (dt) {
    this._shakeTime += dt;

    var p = Math.min(this._timer / Math.max(this.breakDelay, 0.001), 1);
    var amp = this.shakeAmount * p * p;
    var t = this._shakeTime * this.shakeSpeed;

    this.entity.setLocalPosition(
        this._basePos.x + Math.sin(t) * amp,
        this._basePos.y + Math.sin(t * 1.7) * amp * 0.5,
        this._basePos.z + Math.cos(t * 1.3) * amp
    );

    if (this.shakeTilt > 0) {
        this.entity.setLocalEulerAngles(
            this._baseRot.x + Math.sin(t * 0.9) * this.shakeTilt * p,
            this._baseRot.y,
            this._baseRot.z + Math.cos(t * 1.1) * this.shakeTilt * p
        );
    }

    if (this._crackPoints.length && this._squish) {
        for (var i = 0; i < this._crackPoints.length; i++) {
            this._squish.pressAt(this._crackPoints[i]);
        }
        this._setCrustParams(
            this._baseTilt + this.crustTiltBoost * p,
            this._baseSpread + this.crustSpreadBoost * p
        );
    }
};

BreakableSurface.prototype._setVisible = function (visible) {
    var render = this._getRender(this.entity);
    if (render) render.enabled = visible;

    if (this._squish && this._squish._crustTarget &&
        this._squish._crustTarget !== this.entity) {
        var crustRender = this._getRender(this._squish._crustTarget);
        if (crustRender) crustRender.enabled = visible;
    }

    if (this.entity.collision) this.entity.collision.enabled = visible;
    if (this.entity.rigidbody) this.entity.rigidbody.enabled = visible;
};

BreakableSurface.prototype._resetSquish = function () {
    if (this._crustMats) {
        this._setCrustParams(this._baseTilt, this._baseSpread);
    }
    if (!this._squish || !this._squish._slots) return;

    for (var i = 0; i < this._squish._slots.length; i++) {
        var s = this._squish._slots[i];
        s.t = 0;
        s.eased = 0;
        s.active = false;
    }
};

BreakableSurface.prototype._setupSound = function () {
    if (!this.breakSounds || !this.breakSounds.length) return;

    if (!this.entity.sound) {
        this.entity.addComponent('sound', { positional: true, refDistance: 5 });
    }
    for (var i = 0; i < this.breakSounds.length; i++) {
        var asset = this.breakSounds[i];
        if (!asset) continue;
        var name = 'break_' + i;
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

BreakableSurface.prototype._playBreakSound = function () {
    if (!this.entity.sound || !this.breakSounds || !this.breakSounds.length) return;
    var idx = Math.floor(Math.random() * this.breakSounds.length);
    var slot = this.entity.sound.slot('break_' + idx);
    if (slot) slot.play();
};