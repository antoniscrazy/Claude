var TowerObbyDeformer = pc.createScript('towerObbyDeformer');

// moves, rotates and scales an entity
// pair it with towerObbyMovingPlatform if something should ride along

TowerObbyDeformer.attributes.add('autoStart', {
    type: 'boolean',
    default: true,
    title: 'Auto Start',
    description: 'Start on initialize. Turn off and call play() when you want it.'
});
TowerObbyDeformer.attributes.add('startDelay', {
    type: 'number',
    default: 0,
    min: 0,
    title: 'Start Delay',
    description: 'Seconds to wait before the first cycle.'
});
TowerObbyDeformer.attributes.add('loop', {
    type: 'boolean',
    default: true,
    title: 'Loop',
    description: 'Repeat forever. Off plays exactly one cycle and stops.'
});
TowerObbyDeformer.attributes.add('pingPong', {
    type: 'boolean',
    default: true,
    title: 'Ping Pong',
    description: 'Travel to the offset and back again instead of snapping to the start.'
});

TowerObbyDeformer.attributes.add('move', {
    type: 'boolean',
    default: false,
    title: 'Move',
    description: 'Animate the local position.'
});
TowerObbyDeformer.attributes.add('moveOffset', {
    type: 'vec3',
    default: [0, 0, 0],
    title: 'Move Offset',
    description: 'Local offset travelled to, relative to the starting position.'
});
TowerObbyDeformer.attributes.add('moveDuration', {
    type: 'number',
    default: 3,
    min: 0.01,
    title: 'Move Duration',
    description: 'Seconds for one one-way trip.'
});
TowerObbyDeformer.attributes.add('moveEasing', {
    type: 'string',
    default: 'SineInOut',
    title: 'Move Easing',
    enum: [
        { 'Linear': 'Linear' },
        { 'Sine In': 'SineIn' },
        { 'Sine Out': 'SineOut' },
        { 'Sine In Out': 'SineInOut' },
        { 'Quadratic In': 'QuadraticIn' },
        { 'Quadratic Out': 'QuadraticOut' },
        { 'Quadratic In Out': 'QuadraticInOut' },
        { 'Cubic In': 'CubicIn' },
        { 'Cubic Out': 'CubicOut' },
        { 'Cubic In Out': 'CubicInOut' },
        { 'Exponential In': 'ExponentialIn' },
        { 'Exponential Out': 'ExponentialOut' },
        { 'Exponential In Out': 'ExponentialInOut' },
        { 'Circular In Out': 'CircularInOut' },
        { 'Back In': 'BackIn' },
        { 'Back Out': 'BackOut' },
        { 'Back In Out': 'BackInOut' },
        { 'Elastic Out': 'ElasticOut' },
        { 'Bounce Out': 'BounceOut' }
    ]
});

TowerObbyDeformer.attributes.add('rotate', {
    type: 'boolean',
    default: false,
    title: 'Rotate',
    description: 'Animate the local euler angles. Use this or Spin Speed, not both.'
});
TowerObbyDeformer.attributes.add('rotateOffset', {
    type: 'vec3',
    default: [0, 0, 0],
    title: 'Rotate Offset',
    description: 'Degrees turned, relative to the starting rotation.'
});
TowerObbyDeformer.attributes.add('rotateDuration', {
    type: 'number',
    default: 3,
    min: 0.01,
    title: 'Rotate Duration',
    description: 'Seconds for one one-way turn.'
});
TowerObbyDeformer.attributes.add('rotateEasing', {
    type: 'string',
    default: 'SineInOut',
    title: 'Rotate Easing',
    enum: [
        { 'Linear': 'Linear' },
        { 'Sine In': 'SineIn' },
        { 'Sine Out': 'SineOut' },
        { 'Sine In Out': 'SineInOut' },
        { 'Quadratic In': 'QuadraticIn' },
        { 'Quadratic Out': 'QuadraticOut' },
        { 'Quadratic In Out': 'QuadraticInOut' },
        { 'Cubic In': 'CubicIn' },
        { 'Cubic Out': 'CubicOut' },
        { 'Cubic In Out': 'CubicInOut' },
        { 'Exponential In': 'ExponentialIn' },
        { 'Exponential Out': 'ExponentialOut' },
        { 'Exponential In Out': 'ExponentialInOut' },
        { 'Circular In Out': 'CircularInOut' },
        { 'Back In': 'BackIn' },
        { 'Back Out': 'BackOut' },
        { 'Back In Out': 'BackInOut' },
        { 'Elastic Out': 'ElasticOut' },
        { 'Bounce Out': 'BounceOut' }
    ]
});

TowerObbyDeformer.attributes.add('scale', {
    type: 'boolean',
    default: false,
    title: 'Scale',
    description: 'Animate the local scale. Note that a collision volume does not resize with it.'
});
TowerObbyDeformer.attributes.add('scaleTarget', {
    type: 'vec3',
    default: [1, 1, 1],
    title: 'Scale Target',
    description: 'Multiplier of the starting scale, so [2,2,2] means twice as big.'
});
TowerObbyDeformer.attributes.add('scaleDuration', {
    type: 'number',
    default: 3,
    min: 0.01,
    title: 'Scale Duration',
    description: 'Seconds for one one-way change.'
});
TowerObbyDeformer.attributes.add('scaleEasing', {
    type: 'string',
    default: 'SineInOut',
    title: 'Scale Easing',
    enum: [
        { 'Linear': 'Linear' },
        { 'Sine In': 'SineIn' },
        { 'Sine Out': 'SineOut' },
        { 'Sine In Out': 'SineInOut' },
        { 'Quadratic In': 'QuadraticIn' },
        { 'Quadratic Out': 'QuadraticOut' },
        { 'Quadratic In Out': 'QuadraticInOut' },
        { 'Cubic In': 'CubicIn' },
        { 'Cubic Out': 'CubicOut' },
        { 'Cubic In Out': 'CubicInOut' },
        { 'Exponential In': 'ExponentialIn' },
        { 'Exponential Out': 'ExponentialOut' },
        { 'Exponential In Out': 'ExponentialInOut' },
        { 'Circular In Out': 'CircularInOut' },
        { 'Back In': 'BackIn' },
        { 'Back Out': 'BackOut' },
        { 'Back In Out': 'BackInOut' },
        { 'Elastic Out': 'ElasticOut' },
        { 'Bounce Out': 'BounceOut' }
    ]
});

TowerObbyDeformer.attributes.add('spinSpeed', {
    type: 'vec3',
    default: [0, 0, 0],
    title: 'Spin Speed',
    description: 'Constant rotation in degrees per second per axis, independent of the cycle.'
});
TowerObbyDeformer.attributes.add('spinLocal', {
    type: 'boolean',
    default: true,
    title: 'Spin Locally',
    description: 'Spin around the entity own axes instead of the world axes.'
});

TowerObbyDeformer.prototype.initialize = function () {
    this._tmp = new pc.Vec3();
    this._tweens = [];
    this._stepped = false;
    this._elapsed = 0;

    this.refreshTargets();

    this.playing = this.autoStart;

    if (this.rotate && this.spinSpeed.lengthSq() > 0) {
        console.warn('towerObbyDeformer: "' + this.entity.name + '" has both Rotate and Spin Speed set, the Rotate channel overwrites the spin every frame.');
    }
};

// re-reads the start transform and recomputes the targets
TowerObbyDeformer.prototype.refreshTargets = function () {
    this._startPosition = this.entity.getLocalPosition().clone();
    this._startEulers = this.entity.getLocalEulerAngles().clone();
    this._startScale = this.entity.getLocalScale().clone();

    this._targetPosition = this._startPosition.clone().add(this.moveOffset);
    this._targetEulers = this._startEulers.clone().add(this.rotateOffset);
    this._targetScale = new pc.Vec3(
        this._startScale.x * this.scaleTarget.x,
        this._startScale.y * this.scaleTarget.y,
        this._startScale.z * this.scaleTarget.z
    );

    return this;
};

TowerObbyDeformer.prototype._easing = function (name) {
    return pc[name] || pc.Linear;
};

// true once this channel finished a full cycle
TowerObbyDeformer.prototype._applyChannel = function (time, duration, easingName, from, to, out) {
    var cycle = this.pingPong ? duration * 2 : duration;
    var done = time >= cycle;
    var t;

    if (done && !this.loop) {
        t = this.pingPong ? 0 : 1;
    } else {
        t = time % cycle;
        if (this.pingPong && t > duration) t = cycle - t;
        t = duration > 0 ? t / duration : 1;
    }

    out.lerp(from, to, this._easing(easingName)(t));
    return done;
};

TowerObbyDeformer.prototype._step = function (dt) {
    if (this.spinSpeed.lengthSq() > 0) {
        if (this.spinLocal) {
            this.entity.rotateLocal(this.spinSpeed.x * dt, this.spinSpeed.y * dt, this.spinSpeed.z * dt);
        } else {
            this.entity.rotate(this.spinSpeed.x * dt, this.spinSpeed.y * dt, this.spinSpeed.z * dt);
        }
    }

    if (!this.playing) return;

    this._elapsed += dt;

    var time = this._elapsed - this.startDelay;
    if (time < 0) return;

    var finished = true;

    if (this.move) {
        finished = this._applyChannel(time, this.moveDuration, this.moveEasing, this._startPosition, this._targetPosition, this._tmp) && finished;
        this.entity.setLocalPosition(this._tmp);
    }

    if (this.rotate) {
        finished = this._applyChannel(time, this.rotateDuration, this.rotateEasing, this._startEulers, this._targetEulers, this._tmp) && finished;
        this.entity.setLocalEulerAngles(this._tmp);
    }

    if (this.scale) {
        finished = this._applyChannel(time, this.scaleDuration, this.scaleEasing, this._startScale, this._targetScale, this._tmp) && finished;
        this.entity.setLocalScale(this._tmp);
    }

    if (finished && !this.loop) {
        this.playing = false;
        this.entity.fire('deformer:complete', this);
    }
};

// stepped by towerObbyMovingPlatform before it samples, guarded against double steps
TowerObbyDeformer.prototype.stepIfNeeded = function (dt) {
    if (this._stepped) return;
    this._stepped = true;
    this._step(dt);
};

TowerObbyDeformer.prototype.update = function (dt) {
    this.stepIfNeeded(dt);
};

TowerObbyDeformer.prototype.postUpdate = function () {
    this._stepped = false;
};

// cycle control

TowerObbyDeformer.prototype.play = function () {
    this.playing = true;
    return this;
};

TowerObbyDeformer.prototype.pause = function () {
    this.playing = false;
    return this;
};

TowerObbyDeformer.prototype.restart = function () {
    this._elapsed = 0;
    this.playing = true;
    return this;
};

// stops the cycle and restores the start transform
TowerObbyDeformer.prototype.stop = function () {
    this.playing = false;
    this._elapsed = 0;
    this.stopTweens();
    this.resetTransform();
    return this;
};

TowerObbyDeformer.prototype.resetTransform = function () {
    this.entity.setLocalPosition(this._startPosition);
    this.entity.setLocalEulerAngles(this._startEulers);
    this.entity.setLocalScale(this._startScale);
    return this;
};

// one-off moves from code, each pauses the cycle and returns the tween

TowerObbyDeformer.prototype._track = function (tween) {
    this._tweens.push(tween);
    tween.on('complete', function () {
        var i = this._tweens.indexOf(tween);
        if (i !== -1) this._tweens.splice(i, 1);
    }, this);
    tween.start();
    return tween;
};

TowerObbyDeformer.prototype.moveTo = function (target, duration, easing) {
    this.pause();
    return this._track(this.entity
        .tween(this.entity.getLocalPosition())
        .to(target, duration, easing || pc.SineInOut));
};

TowerObbyDeformer.prototype.moveBy = function (offset, duration, easing) {
    return this.moveTo(this.entity.getLocalPosition().clone().add(offset), duration, easing);
};

// slerped, shortest path
TowerObbyDeformer.prototype.rotateTo = function (eulers, duration, easing) {
    this.pause();
    return this._track(this.entity
        .tween(this.entity.getLocalEulerAngles())
        .rotate(eulers, duration, easing || pc.SineInOut));
};

TowerObbyDeformer.prototype.rotateBy = function (eulers, duration, easing) {
    return this.rotateTo(this.entity.getLocalEulerAngles().clone().add(eulers), duration, easing);
};

TowerObbyDeformer.prototype.scaleTo = function (target, duration, easing) {
    this.pause();
    return this._track(this.entity
        .tween(this.entity.getLocalScale())
        .to(target, duration, easing || pc.SineInOut));
};

TowerObbyDeformer.prototype.scaleBy = function (multiplier, duration, easing) {
    var current = this.entity.getLocalScale();
    var target = new pc.Vec3(current.x * multiplier.x, current.y * multiplier.y, current.z * multiplier.z);
    return this.scaleTo(target, duration, easing);
};

// constant spin, degrees per second
TowerObbyDeformer.prototype.spin = function (x, y, z, local) {
    this.spinSpeed.set(x || 0, y || 0, z || 0);
    if (local !== undefined) this.spinLocal = local;
    return this;
};

TowerObbyDeformer.prototype.stopTweens = function () {
    for (var i = 0; i < this._tweens.length; i++) {
        this._tweens[i].stop();
    }
    this._tweens.length = 0;
    return this;
};
