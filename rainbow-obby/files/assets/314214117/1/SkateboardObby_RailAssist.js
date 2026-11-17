/*
 * SkateboardObby_RailAssist
 * A rail that stands above a ramp top (finish island pyramid). The controller only catches a rider coming down onto the bar in a narrow
 * height band, and riding up the pyramid never reaches that band: the rider went through the bar. This script sits on the rail's
 * skateboardObbyInteractable and starts the same grind from further below or from the side; the rider eases up onto the bar.
 * It does not change the controller, a rider who ollies onto the rail is still caught by the controller.
 */
var SkateboardObbyRailAssist = pc.createScript('skateboardObbyRailAssist');

SkateboardObbyRailAssist.attributes.add('solid', { type: 'entity', title: 'Rail Solid', description: 'Off while the rider eases up: he rises through the bar and posts.' });
SkateboardObbyRailAssist.attributes.add('reach', { type: 'number', default: 0.9, title: 'Side Reach (m)' });
SkateboardObbyRailAssist.attributes.add('ahead', { type: 'number', default: 1.2, title: 'Reach Past The Ends (m)' });
SkateboardObbyRailAssist.attributes.add('below', { type: 'number', default: 2.6, title: 'Reach Below (m)' });
SkateboardObbyRailAssist.attributes.add('above', { type: 'number', default: 1, title: 'Reach Above (m)' });
SkateboardObbyRailAssist.attributes.add('minSpeed', { type: 'number', default: 1, title: 'Min Speed (m/s)' });
SkateboardObbyRailAssist.attributes.add('easeTime', { type: 'number', default: 0.25, title: 'Ease Up Time (s)' });

SkateboardObbyRailAssist.prototype.initialize = function () {
    this._fwd = new pc.Vec3();
    this._side = new pc.Vec3();
    this._speed = 0;
    this._ride = null;
    this._rise = 0;
    this._t = 0;
};

SkateboardObbyRailAssist.prototype.start = function (pcs, it, lp, along, hs) {
    const s = it.localScale();
    const min = it.localAabb.getMin(), max = it.localAabb.getMax();
    const heading = pcs._heading.x * this._fwd.x + pcs._heading.z * this._fwd.z;
    const sign = (hs > 1.5 ? along : heading) >= 0 ? 1 : -1;
    const v = Math.max(Math.abs(along), Math.max(this._speed, pcs.speed) * 0.8, pcs.grindMinSpeed);
    const z = Math.min(max.z - 0.2 / s, Math.max(min.z + 0.2 / s, lp.z));
    pcs.beginRide({ type: 'grind', it: it, s: z, sign: sign, v: v });
    // beginRide keeps the feet where the rail puts them: start from where the rider is and ease up
    this._ride = pcs._ride;
    this._rise = (it.railHeight - lp.y) * s;
    this._base = this._ride.feetOffset.y;
    this._t = 0;
    this._ride.feetOffset.y = this._base - this._rise;
    if (this.solid) this.solid.enabled = false;
};

SkateboardObbyRailAssist.prototype.endEase = function () {
    this._ride = null;
    if (this.solid) this.solid.enabled = true;
};

SkateboardObbyRailAssist.prototype.update = function (dt) {
    const pcs = this.app.skateboardObbyPlayerController;
    const it = this.entity.script && this.entity.script.skateboardObbyInteractable;
    if (!pcs || !it || !it.localAabb) return;

    if (this._ride) {
        if (pcs._ride !== this._ride) { this.endEase(); }
        else {
            this._t += dt;
            const u = Math.min(1, this._t / this.easeTime);
            this._ride.feetOffset.y = this._base - this._rise * (1 - u * u * (3 - 2 * u));
            if (u >= 1) this.endEase();
        }
    }

    const vel = pcs.entity.rigidbody.linearVelocity;
    const hs = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    const fast = Math.max(hs, pcs.speed || 0);
    const speed = this._speed;
    this._speed = fast;

    if (pcs._ride || pcs._rideCooldown > 0 || pcs.isDied || pcs._falling || !pcs.body) return;
    if (Math.max(fast, speed) < this.minSpeed) return;
    const s = it.localScale();
    const lp = it.toLocal(pcs.body.getPosition());
    if (Math.abs(lp.x) * s > this.reach) return;
    const h = (lp.y - it.railHeight) * s;
    if (h < -this.below || h > this.above) return;
    const a = lp.z * s, half = (it.localAabb.getMax().z - it.localAabb.getMin().z) * 0.5 * s;
    if (Math.abs(a) > half + this.ahead) return;

    it.entity.getWorldTransform().getZ(this._fwd);
    this._fwd.normalize();
    const along = vel.x * this._fwd.x + vel.z * this._fwd.z;
    // past the end and leaving: this is the rider who just came off
    if (Math.abs(a) > half && a * along > 0) return;
    this.start(pcs, it, lp, along, hs);
};
