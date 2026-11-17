/*
 * SkateboardObby_BoostPad
 * Speed pad on the course (PK_Yol_Boost_*, PK_Boost_Serit, PK_Boost_Pad). The entity sits on the pad surface; the
 * zone is a box around it (Half Extents, local axes, world metres). While the local player rides through the zone
 * its speed is raised to Speed (it is never lowered), then the controller's normal overspeed deceleration brings
 * it back to max speed.
 *
 * This is not the player's VIP boost (Q / Boost button): no cooldown, no VIP lock, no "skate:boosted" event.
 * It only writes the controller's public speed and the camera FOV target (same FOV kick as the VIP boost).
 * No physics trigger: a cheap point-in-box test per frame, no allocations.
 */
var SkateboardObbyBoostPad = pc.createScript('skateboardObbyBoostPad');

SkateboardObbyBoostPad.attributes.add('halfExtents', { type: 'vec3', default: [3, 1.5, 4], title: 'Zone Half Extents (m)' });
SkateboardObbyBoostPad.attributes.add('speed', { type: 'number', default: 32, title: 'Speed', description: 'Controller speed while on the pad (max speed is 22, VIP boost max 32)' });
SkateboardObbyBoostPad.attributes.add('alongOnly', { type: 'boolean', default: false, title: 'Along Local Z Only', description: 'Only boost when riding along the pad direction (local +Z or -Z), not across it' });
SkateboardObbyBoostPad.attributes.add('fovTime', { type: 'number', default: 0.8, title: 'FOV Kick (s)' });

SkateboardObbyBoostPad.prototype.initialize = function () {
    this._inv = new pc.Mat4();
    this._p = new pc.Vec3();
    this._fwd = new pc.Vec3();
    this._fovTimer = 0;
    this._inside = false;
};

SkateboardObbyBoostPad.prototype.update = function (dt) {
    const pcs = this.app.skateboardObbyPlayerController;
    if (this._fovTimer > 0) {
        this._fovTimer -= dt;
        if (this._fovTimer <= 0 && pcs && !(pcs.boostTimer > 0)) this.app.targetFov = 60;
    }
    if (!pcs || pcs.isDied || !pcs.entity.enabled) return;

    // player feet (body) in pad space
    this._inv.copy(this.entity.getWorldTransform()).invert();
    this._inv.transformPoint(pcs.body.getPosition(), this._p);
    const h = this.halfExtents;
    const inside = Math.abs(this._p.x) <= h.x && Math.abs(this._p.y) <= h.y && Math.abs(this._p.z) <= h.z;
    if (inside && this.alongOnly) {
        this.entity.getWorldTransform().getZ(this._fwd);
        const along = Math.abs(this._fwd.x * pcs._heading.x + this._fwd.z * pcs._heading.z) / Math.max(1e-4, Math.hypot(this._fwd.x, this._fwd.z));
        if (along < 0.5) return;
    }
    if (inside && pcs.speed < this.speed) {
        pcs.speed = this.speed;
        this.app.targetFov = 72;
        this._fovTimer = this.fovTime;
        if (!this._inside && pcs.entity.sound && pcs.entity.sound.slot('prize')) pcs.entity.sound.play('prize');
    }
    this._inside = inside;
};
