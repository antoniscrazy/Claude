/*
 * SkateboardObby_PushBall
 * World 2 beach ball (same idea as SkateboardObby_BowlingPins): waits still on the road, the rider pushes it, it rolls with the push,
 * slows down on the ground and falls off the road. No rigidbody, no collider, it never kills and never stops the rider.
 * Local to each client. It goes back to its place Reset Delay after the last push once the player is Reset Distance away, on respawn
 * and when its chunk closes. An ollie over it does not touch it.
 * Sits on StageLogic/Stage_<n>/Ball_...: this entity marks the rest position of the ball's centre.
 */
var SkateboardObbyPushBall = pc.createScript('skateboardObbyPushBall');

SkateboardObbyPushBall.attributes.add('model', { type: 'entity', title: 'Model' });
SkateboardObbyPushBall.attributes.add('pushFactor', { type: 'number', default: 1.1, title: 'Push Factor', description: 'Ball speed = rider speed along the hit * this.' });
SkateboardObbyPushBall.attributes.add('minPush', { type: 'number', default: 2, title: 'Min Push (m/s)' });
SkateboardObbyPushBall.attributes.add('maxPush', { type: 'number', default: 26, title: 'Max Push (m/s)' });
SkateboardObbyPushBall.attributes.add('speedLoss', { type: 'number', default: 0.03, min: 0, max: 1, title: 'Speed Loss' });
SkateboardObbyPushBall.attributes.add('hitCooldown', { type: 'number', default: 0.4, title: 'Hit Cooldown (s)' });
SkateboardObbyPushBall.attributes.add('rollDrag', { type: 'number', default: 5, title: 'Roll Drag (m/s2)' });
SkateboardObbyPushBall.attributes.add('gravity', { type: 'number', default: 22, title: 'Gravity (m/s2)' });
SkateboardObbyPushBall.attributes.add('bounce', { type: 'number', default: 0.3, title: 'Bounce' });
SkateboardObbyPushBall.attributes.add('upKick', { type: 'number', default: 0.12, title: 'Up Kick', description: 'Part of the push that lifts the ball.' });
SkateboardObbyPushBall.attributes.add('resetDelay', { type: 'number', default: 4, title: 'Reset Delay (s)' });
SkateboardObbyPushBall.attributes.add('resetDistance', { type: 'number', default: 25, title: 'Reset Distance (m)' });
SkateboardObbyPushBall.attributes.add('fallLimit', { type: 'number', default: 30, title: 'Fall Limit (m)', description: 'Hidden after falling this far below its place.' });
SkateboardObbyPushBall.attributes.add('activeRange', { type: 'number', default: 60, title: 'Active Range (m)' });

SkateboardObbyPushBall.prototype.initialize = function () {
    this._c = this.entity.getPosition().clone();
    this._rest = this._c.clone();
    this._v = new pc.Vec3();
    this._rot = new pc.Quat();
    this._rot0 = new pc.Quat();
    this._dq = new pc.Quat();
    this._q = new pc.Quat();
    this._a = new pc.Vec3();
    this._b = new pc.Vec3();
    this._n = new pc.Vec3();
    this._off = new pc.Vec3();
    this._localC = new pc.Vec3();
    this._ready = false;
    this._moved = false;
    this._gone = false;
    this._since = 0;
    this._cool = 0;
    this._t = 0;
    this._onRespawn = () => this.reset();
    this.app.on('Respawned', this._onRespawn, this);
    this.on('disable', () => this.reset());
    this.on('destroy', () => { this.reset(); this.app.off('Respawned', this._onRespawn, this); });
};

SkateboardObbyPushBall.prototype._setup = function () {
    const mis = this.model && this.model.render && this.model.render.meshInstances;
    if (!mis || !mis.length) return false;
    const box = mis[0].mesh.aabb;
    const s = this.model.getWorldTransform().getScale().x;
    this._scale = s;
    this.radius = Math.max(box.halfExtents.x, box.halfExtents.y, box.halfExtents.z) * s;
    this._localC.copy(box.center).mulScalar(s);
    this._rot0.copy(this.model.getRotation());
    this._rot.copy(this._rot0);
    this._ready = true;
    this.place();
    return true;
};

// the mesh pivot is not the ball's centre
SkateboardObbyPushBall.prototype.place = function () {
    this._rot.transformVector(this._localC, this._off);
    this.model.setPosition(this._c.x - this._off.x, this._c.y - this._off.y, this._c.z - this._off.z);
    this.model.setRotation(this._rot);
};

SkateboardObbyPushBall.prototype.reset = function () {
    this._v.set(0, 0, 0);
    this._since = 0;
    this._cool = 0;
    this._moved = false;
    this._onFloor = false;
    if (this._gone && this.model) this.model.enabled = true;
    this._gone = false;
    if (!this._ready || !this.model) return;
    this._c.copy(this._rest);
    this._rot.copy(this._rot0);
    this.place();
};

SkateboardObbyPushBall.prototype._hit = function (pcs, dt) {
    const col = pcs.entity.collision;
    const rc = col ? col.radius : 0.41;
    const half = col ? Math.max(0, col.height / 2 - rc) : 0.59;
    const p = pcs.entity.getPosition();
    const c = this._c, R = this.radius;
    const y = Math.max(p.y - half, Math.min(p.y + half, c.y));
    const dx = c.x - p.x, dy = c.y - y, dz = c.z - p.z;
    const d2 = dx * dx + dy * dy + dz * dz, reach = R + rc;
    if (d2 >= reach * reach) return;

    const v = pcs.entity.rigidbody.linearVelocity;
    const n = this._n;
    n.set(dx, 0, dz);
    const flat = n.length();
    if (flat > 0.05) n.mulScalar(1 / flat);
    else {
        const sp = Math.hypot(v.x, v.z);
        if (sp < 0.1) return; // standing on top of it
        n.set(v.x / sp, 0, v.z / sp);
    }
    // out of the rider, along the ground
    const need = Math.sqrt(Math.max(0, reach * reach - dy * dy)) - flat;
    if (need > 0) { c.x += n.x * need; c.z += n.z * need; }

    const along = v.x * n.x + v.z * n.z;
    const ball = this._v.x * n.x + this._v.z * n.z;
    if (along <= ball) return;
    const target = Math.min(Math.max(along * this.pushFactor, this.minPush), this.maxPush);
    if (target <= ball) return;
    this._v.x += n.x * (target - ball);
    this._v.z += n.z * (target - ball);
    this._since = 0;
    this._moved = true;
    if (this._cool <= 0) {
        this._cool = this.hitCooldown;
        this._v.y = Math.max(this._v.y, along * this.upKick);
        if (pcs.speed > 0) pcs.speed *= 1 - this.speedLoss;
        this.app.fire('skate:sound', 'bump');
    }
};

SkateboardObbyPushBall.prototype.update = function (dt) {
    if (!this._ready && !this._setup()) return;
    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || !pcs.entity.rigidbody) return;
    this._cool -= dt;

    if (!this._moved) {
        const p0 = pcs.entity.getPosition();
        const far = this.activeRange;
        if (this._a.sub2(p0, this._c).lengthSq() > far * far) return;
    }
    if (!this._gone && !pcs.isDied) this._hit(pcs, dt);
    if (!this._moved) return;

    this._since += dt;
    const p = pcs.entity.getPosition();
    if (this._since > this.resetDelay && this._a.sub2(p, this._rest).lengthSq() > this.resetDistance * this.resetDistance) { this.reset(); return; }
    if (this._gone) return;

    // ground under the ball
    const c = this._c, v = this._v, R = this.radius;
    this._a.set(c.x, c.y + 0.5, c.z);
    this._b.set(c.x, c.y - R - Math.max(1, -v.y * dt + 0.5), c.z);
    const g = this.app.systems.rigidbody.raycastFirst(this._a, this._b, { filterTags: ['Ground'] });
    const floor = g ? g.point.y + R : -1e9;
    v.y -= this.gravity * dt;
    c.x += v.x * dt;
    c.y += v.y * dt;
    c.z += v.z * dt;
    if (c.y <= floor) {
        // going up a slope costs speed
        const rise = this._onFloor ? floor - this._floorY : 0;
        c.y = floor;
        v.y = v.y < -2 ? -v.y * this.bounce : 0;
        const sp = Math.hypot(v.x, v.z);
        if (sp > 0) {
            const climbed = Math.sqrt(Math.max(0, sp * sp - 2 * this.gravity * Math.max(0, rise)));
            const k = Math.max(0, climbed - this.rollDrag * dt) / sp;
            v.x *= k;
            v.z *= k;
        }
    }
    this._onFloor = c.y <= floor + 0.01;
    this._floorY = floor;
    if (c.y < this._rest.y - this.fallLimit) {
        this._gone = true;
        this.model.enabled = false;
        return;
    }

    // rolls: axis = up x direction, angle = distance / radius
    const sp2 = Math.hypot(v.x, v.z);
    if (sp2 > 0.01) {
        const ang = sp2 * dt / R * pc.math.RAD_TO_DEG;
        this._n.set(v.z / sp2, 0, -v.x / sp2);
        this._dq.setFromAxisAngle(this._n, ang);
        this._q.copy(this._dq).mul(this._rot);
        this._rot.copy(this._q).normalize();
    }
    this.place();
};
