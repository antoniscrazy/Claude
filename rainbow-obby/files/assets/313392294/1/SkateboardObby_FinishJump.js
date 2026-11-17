/*
 * SkateboardObby_FinishJump
 * The big jump from the end of Stage 50 to the finish island (NewMap: ~110 m gap, ~150 m flight). The flight is
 * scripted but ballistic: when the local player rides through the launch zone (box around this entity, local axes,
 * world metres) fast enough along local +Z and the next physics step would pass the takeoff line (Launch Offset, put
 * this entity on the ramp lip), it flies on a constant-gravity parabola to Target (the landing circle):
 *  - it takes off with its own speed (measured over the last physics steps, at most Max Takeoff Speed) along the lip
 *    (Lip Angle above the horizontal, or steeper if it already moves steeper), so the path has no corner at the lip;
 *  - flight time = horizontal distance / takeoff horizontal speed, kept in Min..Max Flight Time; the gravity is solved
 *    so the vertical speed carries on unchanged (within Min..Max Gravity); apex and landing angle follow from that;
 *  - whatever the takeoff velocity lacks to reach Target in that time (slow or sideways rider) is added over the first
 *    part of the flight (at most Blend Accel): the vertical part at once (clears the lip), the horizontal part eased
 *    in; the path is solved so it still ends on Target.
 * The path follows the PHYSICS steps, not the frames: at any refresh rate each step aims at the point the path has
 * one step later. (Aiming with the frame dt overshoots when frames are shorter than a physics step and blows up
 * above 120 Hz.)
 * Input is locked during the flight (app.inCutscene), the camera follows the player as usual and the FOV eases to
 * Flight FOV. The player's Finisher clip (flip, then the board held overhead) is stretched over the flight
 * (pcs.playFinisher; 5 s = 1x).
 *
 * Landing: the horizontal speed carries on, the board rolls out braking at Land Brake (input still locked) and stops.
 * At touchdown: app event "skate:finished" (analytics map-1 complete, other scripts), the Celebrate clip, confetti and
 * a "COURSE COMPLETE!" message. Only the local player flies; the position is sent to the server as usual.
 * The player controller is not changed: this script writes the rigidbody velocity and speed after the controller.
 */
var SkateboardObbyFinishJump = pc.createScript('skateboardObbyFinishJump');

SkateboardObbyFinishJump.attributes.add('target', { type: 'entity', title: 'Landing Target' });
SkateboardObbyFinishJump.attributes.add('zoneHalfExtents', { type: 'vec3', default: [12, 6, 4], title: 'Launch Zone Half Extents (m)' });
SkateboardObbyFinishJump.attributes.add('minSpeed', { type: 'number', default: 6, title: 'Min Speed (m/s)', description: 'Speed along local +Z needed to launch' });
SkateboardObbyFinishJump.attributes.add('maxTakeoffSpeed', { type: 'number', default: 45, title: 'Max Takeoff Speed (m/s)' });
SkateboardObbyFinishJump.attributes.add('launchOffset', { type: 'number', default: -0.4, title: 'Launch Offset (m)', description: 'Takeoff line along local +Z, from this entity (the ramp lip)' });
SkateboardObbyFinishJump.attributes.add('lipAngle', { type: 'number', default: 44, title: 'Lip Angle (deg)', description: 'Ramp angle at the lip: the flight leaves along it, or steeper if the player already moves steeper' });
SkateboardObbyFinishJump.attributes.add('duration', { type: 'number', default: 5, title: 'Max Flight Time (s)' });
SkateboardObbyFinishJump.attributes.add('minDuration', { type: 'number', default: 4, title: 'Min Flight Time (s)' });
SkateboardObbyFinishJump.attributes.add('minGravity', { type: 'number', default: 6, title: 'Min Gravity (m/s2)' });
SkateboardObbyFinishJump.attributes.add('maxGravity', { type: 'number', default: 25, title: 'Max Gravity (m/s2)' });
SkateboardObbyFinishJump.attributes.add('blendAccel', { type: 'number', default: 30, title: 'Blend Accel (m/s2)', description: 'Peak extra acceleration while the takeoff velocity turns into the flight path' });
SkateboardObbyFinishJump.attributes.add('landBrake', { type: 'number', default: 16, title: 'Land Brake (m/s2)', description: 'Roll-out deceleration after touchdown (input stays locked until the board stops)' });
SkateboardObbyFinishJump.attributes.add('flightFov', { type: 'number', default: 78, title: 'Flight FOV' });
SkateboardObbyFinishJump.attributes.add('message', { type: 'string', default: 'COURSE COMPLETE!', title: 'Landing Message' });

// safety limits of the flight: velocity (m/s), how far the path may wait for a blocked body (s), landing miss before snapping (m)
SkateboardObbyFinishJump.MAX_FLIGHT_SPEED = 90;
SkateboardObbyFinishJump.MAX_PATH_LAG = 0.25;
SkateboardObbyFinishJump.MAX_LANDING_MISS = 3;

SkateboardObbyFinishJump.prototype.initialize = function () {
    this._inv = new pc.Mat4();
    this._p = new pc.Vec3();
    this._b = new pc.Vec3();
    this._v = new pc.Vec3();
    this._fwd = new pc.Vec3();
    this._from = new pc.Vec3();
    this._to = new pc.Vec3();
    this._des = new pc.Vec3();
    this._vIn = new pc.Vec3();      // takeoff velocity
    this._v0 = new pc.Vec3();       // path velocity once the takeoff difference has faded out (gravity aside)
    this._anchor1 = new pc.Vec3();  // drawn positions the takeoff speed is measured from (older, newer)
    this._anchor2 = new pc.Vec3();
    this._age1 = 0;
    this._age2 = 0;
    this._track = false;
    this._lastBody = new pc.Vec3(); // physics body position and aimed speed of the last frame: counts the physics steps
    this._lastSpeed = 0;
    this._step = this.app.systems.rigidbody.fixedTimeStep || 1 / 60;
    this._flying = false;
    this._rolling = false;
    this._t = 0;                    // flight time, frames
    this._tb = 0;                   // flight time, physics steps: the path time the body has reached
    this._T = 0;
    this._g = 0;
    this._blendH = 0;
    this._blendV = 0;
    this._roll = 0;
    this.on('disable', () => this.stopFlight());
    this.on('destroy', () => this.stopFlight());
};

SkateboardObbyFinishJump.prototype.update = function (dt) {
    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs) return;
    if (this._flying) { this.fly(pcs, dt); return; }
    if (this._rolling) { this.rollOut(pcs, dt); return; }
    const pos = pcs.entity.getPosition();
    if (this.canLaunch(pcs, dt)) this.startFlight(pcs, pos, dt);
    // the takeoff speed is measured from what was really drawn, over at least two physics steps at any frame rate
    if (this._track && this._anchor2.distance(pos) > 8) this._track = false;
    if (!this._track) {
        this._track = true;
        this._anchor1.copy(pos);
        this._anchor2.copy(pos);
        this._age1 = 0;
        this._age2 = 0;
    } else if (this._age2 >= 2 * this._step) {
        this._anchor1.copy(this._anchor2);
        this._age1 = this._age2;
        this._anchor2.copy(pos);
        this._age2 = 0;
    }
    this._age1 += dt;
    this._age2 += dt;
};

SkateboardObbyFinishJump.prototype.canLaunch = function (pcs, dt) {
    if (pcs.isDied || !this.target || pcs._ride || dt <= 0) return false;
    // the body, not the drawn position (up to one physics step behind)
    this._inv.copy(this.entity.getWorldTransform()).invert();
    this._inv.transformPoint(this.bodyPos(pcs, this._b), this._p);
    const h = this.zoneHalfExtents;
    if (Math.abs(this._p.x) > h.x || Math.abs(this._p.y) > h.y || Math.abs(this._p.z) > h.z) return false;
    this.entity.getWorldTransform().getZ(this._fwd).normalize();
    const along = pcs.entity.rigidbody.linearVelocity.dot(this._fwd);
    if (along < this.minSpeed) return false;
    // take off before the physics step that would carry the player over the line: past it the controller already
    // bends the path, at the lip the board stalls. Would not get there with Min Speed left (~11 m/s2 uphill): now.
    const need = this.launchOffset - this._p.z;
    return along * Math.max(dt, this._step) >= need || along * along - 22 * need < this.minSpeed * this.minSpeed;
};

SkateboardObbyFinishJump.prototype.startFlight = function (pcs, pos, dt) {
    // takeoff velocity: the measured speed along the lip, horizontal direction as measured
    const v = this._vIn;
    if (this._track && this._age1 >= 1.5 * this._step) v.copy(pos).sub(this._anchor1).mulScalar(1 / this._age1);
    else v.copy(pcs.entity.rigidbody.linearVelocity);
    // (the controller's speed if higher: its ground correction can pull the drawn position back for a frame)
    const speed = pc.math.clamp(Math.max(v.length(), pcs.speed), this.minSpeed, Math.max(this.minSpeed, this.maxTakeoffSpeed));
    let hx = v.x, hz = v.z, hl = Math.sqrt(hx * hx + hz * hz);
    if (hl < 0.5) { hx = this._fwd.x; hz = this._fwd.z; hl = Math.sqrt(hx * hx + hz * hz) || 1; }
    const pitch = pc.math.clamp(Math.atan2(v.y, hl) * pc.math.RAD_TO_DEG, this.lipAngle, this.lipAngle + 15) * pc.math.DEG_TO_RAD;
    const s = Math.cos(pitch) * speed / hl;
    v.set(hx * s, Math.sin(pitch) * speed, hz * s);

    // the path is followed with the physics body, which is drawn about one step behind (interpolation)
    this.bodyPos(pcs, this._from);
    this._to.copy(this.target.getPosition());
    this._to.y += 1.05;
    const f = this._from, dx = this._to.x - f.x, dy = this._to.y - f.y, dz = this._to.z - f.z;
    const vh = Math.cos(pitch) * speed;
    const tMin = Math.max(0.5, this.minDuration);
    const T = this._T = pc.math.clamp(Math.sqrt(dx * dx + dz * dz) / vh, tMin, Math.max(tMin, this.duration));
    // gravity that keeps the vertical takeoff speed: dy = vy T - g T^2 / 2
    const g = this._g = pc.math.clamp(2 * (v.y * T - dy) / (T * T), this.minGravity, Math.max(this.minGravity, this.maxGravity));
    // what the takeoff velocity lacks fades in: vertical at once, w = (1 - t/b)^2 (integral b/3), horizontal eased,
    // w = 1 - smoothstep(t/b) (integral b/2); v0 is solved so the blended path still ends on Target
    const ax = dx / T - v.x, ay = (dy + 0.5 * g * T * T) / T - v.y, az = dz / T - v.z;
    const accel = Math.max(1, this.blendAccel), bMax = Math.min(1.5, T * 0.4);
    const bh = this._blendH = pc.math.clamp(1.5 * Math.sqrt(ax * ax + az * az) / accel, 0.3, bMax);
    const bv = this._blendV = pc.math.clamp(2 * Math.abs(ay) / accel, 0.3, bMax);
    const kh = bh / 2, kv = bv / 3;
    this._v0.set((dx - v.x * kh) / (T - kh), (dy + 0.5 * g * T * T - v.y * kv) / (T - kv), (dz - v.z * kh) / (T - kh));

    this._flying = true;
    this._t = 0;
    this._tb = 0;
    this._lastBody.copy(this._from);
    this._lastSpeed = 0;
    this.app.inCutscene = true;
    pcs._ride = null;
    this.app.fire('skate:finishJump');
    if (pcs.playFinisher) pcs.playFinisher(T);
    this.fly(pcs, dt);   // first step now: the next physics step already follows the path
};

// the physics body position (the entity is drawn up to one physics step behind it)
SkateboardObbyFinishJump.prototype.bodyPos = function (pcs, out) {
    const body = pcs.entity.rigidbody && pcs.entity.rigidbody.body;
    if (!body) return out.copy(pcs.entity.getPosition());
    const o = body.getWorldTransform().getOrigin();
    return out.set(o.x(), o.y(), o.z());
};

// position on the path at time t
SkateboardObbyFinishJump.prototype.arc = function (t, out) {
    const bh = this._blendH, bv = this._blendV, s = t / bh;
    const Bh = t < bh ? t * (1 - s * s + s * s * s / 2) : bh / 2;
    const Bv = t < bv ? t - t * t / bv + t * t * t / (3 * bv * bv) : bv / 3;
    const f = this._from, v = this._vIn, v0 = this._v0;
    return out.set(f.x + v0.x * t + (v.x - v0.x) * Bh,
        f.y + v0.y * t - 0.5 * this._g * t * t + (v.y - v0.y) * Bv,
        f.z + v0.z * t + (v.z - v0.z) * Bh);
};

// velocity on the path at time t
SkateboardObbyFinishJump.prototype.arcVel = function (t, out) {
    const bh = this._blendH, bv = this._blendV, s = Math.min(t / bh, 1);
    const wh = 1 - s * s * (3 - 2 * s), wv = t < bv ? (1 - t / bv) * (1 - t / bv) : 0;
    const v = this._vIn, v0 = this._v0;
    return out.set(v0.x + (v.x - v0.x) * wh, v0.y - this._g * t + (v.y - v0.y) * wv, v0.z + (v.z - v0.z) * wh);
};

SkateboardObbyFinishJump.prototype.fly = function (pcs, dt) {
    if (pcs.isDied) { this.stopFlight(); return; }
    if (dt <= 0) return;
    const step = this._step;
    const pos = this.bodyPos(pcs, this._p);

    // the body only moves on physics steps (fixed length; none on most frames at a high refresh rate, several in a
    // long frame): count how many the last frame ran, the path time follows them
    const moved = this._b.copy(pos).sub(this._lastBody).length();
    if (moved > 1e-5 && this._lastSpeed > 0) this._tb += Math.max(1, Math.round(moved / (this._lastSpeed * step))) * step;
    this._lastBody.copy(pos);
    // blocked by something: the path does not wait for long
    this._t += dt;
    if (this._t - this._tb > SkateboardObbyFinishJump.MAX_PATH_LAG) this._tb = this._t - SkateboardObbyFinishJump.MAX_PATH_LAG;

    if (this._tb >= this._T) { this.touchDown(pcs); return; }   // the last step has reached the landing height

    // aim the next physics step(s) at the point the path has by then
    const n = Math.max(1, Math.round(dt / step));
    const next = this._tb + n * step;
    if (next < this._T) {
        this.arc(next, this._des);
        this._v.copy(this._des).sub(pos).mulScalar(1 / (n * step));
    } else {
        // last step: down to the landing height, the horizontal speed carries on
        this.arcVel(this._T, this._v);
        this._v.y = (this._to.y - pos.y) / (n * step);
    }
    const speed = this._v.length();
    if (speed > SkateboardObbyFinishJump.MAX_FLIGHT_SPEED) this._v.mulScalar(SkateboardObbyFinishJump.MAX_FLIGHT_SPEED / speed);
    this._lastSpeed = Math.min(speed, SkateboardObbyFinishJump.MAX_FLIGHT_SPEED);
    pcs.entity.rigidbody.linearVelocity = this._v;

    // face the flight direction (animation / remote players), HUD shows the flight speed
    this.arcVel(Math.min(this._tb, this._T), this._p);
    pcs.headingDeg = Math.atan2(this._p.x, this._p.z) * pc.math.RAD_TO_DEG;
    pcs.speed = Math.sqrt(this._p.x * this._p.x + this._p.z * this._p.z);
    pcs._vert = null;
    this.app.targetFov = this.flightFov;   // a boost pad resets the FOV when its timer runs out
};

SkateboardObbyFinishJump.prototype.touchDown = function (pcs) {
    this._flying = false;
    this._rolling = true;
    this.app.targetFov = 60;
    this.arcVel(this._T, this._v);
    this._roll = Math.sqrt(this._v.x * this._v.x + this._v.z * this._v.z);
    this._v.y = 0;
    if (pcs.entity.rigidbody) {
        // blocked on the way (should not happen): still ends on the landing circle
        if (this.bodyPos(pcs, this._p).distance(this._to) > SkateboardObbyFinishJump.MAX_LANDING_MISS) pcs.entity.rigidbody.teleport(this._to);
        pcs.entity.rigidbody.linearVelocity = this._v;
    }
    pcs.speed = this._roll;

    this.app.fire('skate:finished');
    if (pcs.playOneShot && pcs.animLayer && pcs.animLayer.states.indexOf('Celebrate') >= 0) pcs.playOneShot('Celebrate', 2.6, 0.2);
    const confetti = pcs.entity.findByName('ConfettiParticle');
    if (confetti && confetti.particlesystem) { confetti.enabled = true; confetti.particlesystem.reset(); confetti.particlesystem.play(); }
    if (this.message) this.app.fire('WarningTextController:setWarning', this.message, null, new pc.Color(1, 0.85, 0.2, 1));
    if (pcs.entity.sound && pcs.entity.sound.slot('checkpoint')) pcs.entity.sound.play('checkpoint');
};

// after touchdown: the controller rolls the board on, this script brakes it to a stop
SkateboardObbyFinishJump.prototype.rollOut = function (pcs, dt) {
    if (pcs.isDied) { this.stopFlight(); return; }
    this._roll = Math.max(0, this._roll - this.landBrake * dt);
    pcs.speed = this._roll;
    if (this._roll > 0) return;
    this._rolling = false;
    this.app.inCutscene = false;
};

// flight or roll-out cut short (death, disable)
SkateboardObbyFinishJump.prototype.stopFlight = function () {
    if (!this._flying && !this._rolling) return;
    const flying = this._flying;
    this._flying = false;
    this._rolling = false;
    this.app.inCutscene = false;
    this.app.targetFov = 60;
    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs) return;
    if (pcs.entity.rigidbody) pcs.entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
    pcs.speed = 0;
    if (flying && pcs.stopFinisher) pcs.stopFinisher();
};
