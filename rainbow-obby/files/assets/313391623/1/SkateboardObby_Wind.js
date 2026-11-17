/*
 * SkateboardObby_Wind
 * Fan wind (PK_Engel_Pervane, Stage 41-50). Pushes the local player along this entity's local +X while the player is
 * inside the zone (box in local axes: Zone Offset +- Zone Half Extents, world metres).
 *
 * Same pattern as the Monkey W3 wind: the push is added to the rigidbody velocity in update (after the player
 * controller wrote its own velocity) and taken out again in postUpdate, so the controller never mistakes the wind
 * for its own speed (no false "wall impact" speed loss) and the push does not depend on the frame rate.
 * No physics trigger, no allocations per frame.
 */
var SkateboardObbyWind = pc.createScript('skateboardObbyWind');

SkateboardObbyWind.attributes.add('zoneOffset', { type: 'vec3', default: [10, 4, 0], title: 'Zone Offset (m)' });
SkateboardObbyWind.attributes.add('zoneHalfExtents', { type: 'vec3', default: [10, 5, 5], title: 'Zone Half Extents (m)' });
SkateboardObbyWind.attributes.add('pushSpeed', { type: 'number', default: 8, title: 'Push Speed (m/s)' });
SkateboardObbyWind.attributes.add('airMultiplier', { type: 'number', default: 1, title: 'Air Push Multiplier' });
SkateboardObbyWind.attributes.add('falloff', { type: 'boolean', default: true, title: 'Weaker Far From Fan', description: 'Push goes down to 40% at the far end of the zone' });

SkateboardObbyWind.prototype.initialize = function () {
    this._inv = new pc.Mat4();
    this._p = new pc.Vec3();
    this._dir = new pc.Vec3();
    this._push = new pc.Vec3();
    this._applied = false;
};

SkateboardObbyWind.prototype.update = function () {
    this._applied = false;
    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || pcs.isDied || !pcs.entity.rigidbody || pcs._ride) return;
    this._inv.copy(this.entity.getWorldTransform()).invert();
    this._inv.transformPoint(pcs.entity.getPosition(), this._p);
    const o = this.zoneOffset, h = this.zoneHalfExtents;
    const dx = this._p.x - o.x;
    if (Math.abs(dx) > h.x || Math.abs(this._p.y - o.y) > h.y || Math.abs(this._p.z - o.z) > h.z) return;

    let s = this.pushSpeed * (pcs.grounded ? 1 : this.airMultiplier);
    if (this.falloff) s *= 1 - 0.6 * pc.math.clamp((dx + h.x) / (2 * h.x), 0, 1);
    this.entity.getWorldTransform().getX(this._dir);
    this._dir.y = 0;
    this._dir.normalize();
    this._push.copy(this._dir).mulScalar(s);
    const v = pcs.entity.rigidbody.linearVelocity;
    v.add(this._push);
    pcs.entity.rigidbody.linearVelocity = v;
    this._applied = true;
};

SkateboardObbyWind.prototype.postUpdate = function () {
    if (!this._applied) return;
    this._applied = false;
    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || !pcs.entity.rigidbody) return;
    const v = pcs.entity.rigidbody.linearVelocity;
    v.sub(this._push);
    pcs.entity.rigidbody.linearVelocity = v;
};
