/*
 * SkateboardObby_Obstacle
 * Moves one moving part of a stage obstacle (saw blade, hammer, crusher head, barrier arm, fan blades...).
 * The first stage FBX files had no animation clips, so the motion was done here (spin / swing / slide / cycle / blink);
 * the NewMap FBX files have one clip per obstacle kit (motion "clip").
 *
 * Setup (StageLogic/Stage_<n>/Obs_...): this entity is placed exactly on the moving model node (same world position
 * and rotation, scale 1) and carries the kill collider (kinematic rigidbody + collision, usually compound children)
 * and SkateboardObby_KillOnTouch. Every frame the same offset (rotation about Rot Axis, move along Move Axis, both in
 * this entity's local axes) is applied to this entity and to Target (the model node), so model and collider move
 * together.
 *
 * Time comes from Date.now(), so every player sees the obstacle in the same place (no server needed).
 *
 * Motions:
 *   spin   - Rot Speed deg/s about Rot Axis (+ Phase * 360 deg)
 *   swing  - pendulum, Rot Amp deg about Rot Axis, Period s
 *   slide  - back and forth, Move Amp m along Move Axis (smooth, sine), Period s
 *   cycle  - rest -> out -> rest with holds: Hold In, Move Out, Hold Out, Move In (s). "out" = Rot Amp / Move Amp.
 *   blink  - Target and this entity's collision are on during "Move Out" + "Hold Out", off otherwise (laser gate)
 * Extra Spin (deg/s about Extra Spin Axis) is added on top (saw blade rolling along its rail).
 *   clip   - plays the obstacle's FBX clip (Clip, e.g. PK_Engel_Testere_Bicak_Hareket). The clip curves are matched by
 *            node name (".001" suffixes ignored) to the nodes under Clip Root (the FBX part node); only Target and its
 *            parents are driven unless Clip All is on (fan: blades + arrow / wind bones). Clip time = Date.now() * Clip
 *            Speed + Phase * clip length. This entity follows Target with the offset it has at rest.
 *
 * Same-frame touch check: the pose is set in update, after this frame's physics step, so the physics contact
 * (SkateboardObby_KillOnTouch) only sees the new pose on the next step. A fast part could be drawn inside the player
 * for a frame, or pass through the player at a low frame rate. So after moving, a deadly obstacle tests its kill
 * shapes (box / sphere / cylinder children) against the player's capsule itself and kills on overlap. The capsule is
 * widened by half of how far the part moved at the player this frame (at most 0.6 m), so a part cannot skip over it.
 *
 * No per-frame allocations; disabled with the stage chunk when the player is far away.
 */
var SkateboardObbyObstacle = pc.createScript('skateboardObbyObstacle');

SkateboardObbyObstacle.attributes.add('target', { type: 'entity', title: 'Target (model node)' });
SkateboardObbyObstacle.attributes.add('motion', {
    type: 'string', default: 'spin', title: 'Motion',
    enum: [{ 'Spin': 'spin' }, { 'Swing': 'swing' }, { 'Slide': 'slide' }, { 'Cycle': 'cycle' }, { 'Blink': 'blink' }, { 'Clip': 'clip' }]
});
SkateboardObbyObstacle.attributes.add('rotAxis', { type: 'vec3', default: [0, 1, 0], title: 'Rot Axis (local)' });
SkateboardObbyObstacle.attributes.add('rotSpeed', { type: 'number', default: 90, title: 'Rot Speed (deg/s)', description: 'spin' });
SkateboardObbyObstacle.attributes.add('rotAmp', { type: 'number', default: 0, title: 'Rot Amp (deg)', description: 'swing / cycle' });
SkateboardObbyObstacle.attributes.add('rotCenter', { type: 'number', default: 0, title: 'Rot Center (deg)', description: 'swing: the pendulum swings around this angle (the model rest pose can be at one end of the swing)' });
SkateboardObbyObstacle.attributes.add('moveAxis', { type: 'vec3', default: [0, 1, 0], title: 'Move Axis (local)' });
SkateboardObbyObstacle.attributes.add('moveAmp', { type: 'number', default: 0, title: 'Move Amp (m)', description: 'slide / cycle (world metres)' });
SkateboardObbyObstacle.attributes.add('period', { type: 'number', default: 3, min: 0.1, title: 'Period (s)', description: 'swing / slide' });
SkateboardObbyObstacle.attributes.add('holdIn', { type: 'number', default: 1, min: 0, title: 'Hold In (s)', description: 'cycle / blink' });
SkateboardObbyObstacle.attributes.add('moveOut', { type: 'number', default: 0.25, min: 0, title: 'Move Out (s)', description: 'cycle / blink' });
SkateboardObbyObstacle.attributes.add('holdOut', { type: 'number', default: 0.8, min: 0, title: 'Hold Out (s)', description: 'cycle / blink' });
SkateboardObbyObstacle.attributes.add('moveIn', { type: 'number', default: 0.8, min: 0, title: 'Move In (s)', description: 'cycle / blink' });
SkateboardObbyObstacle.attributes.add('phase', { type: 'number', default: 0, title: 'Phase (0..1)' });
SkateboardObbyObstacle.attributes.add('spinAxis', { type: 'vec3', default: [0, 0, 1], title: 'Extra Spin Axis (local)' });
SkateboardObbyObstacle.attributes.add('spinSpeed', { type: 'number', default: 0, title: 'Extra Spin (deg/s)' });
SkateboardObbyObstacle.attributes.add('clip', { type: 'asset', assetType: 'animation', title: 'Clip', description: 'clip: the FBX clip of this obstacle kit' });
SkateboardObbyObstacle.attributes.add('clipRoot', { type: 'entity', title: 'Clip Root', description: 'clip: FBX part node (Stage_<n>_Engel_...); clip curves are matched to nodes under it by name' });
SkateboardObbyObstacle.attributes.add('clipSpeed', { type: 'number', default: 1, title: 'Clip Speed' });
SkateboardObbyObstacle.attributes.add('clipAll', { type: 'boolean', default: false, title: 'Clip All Nodes', description: 'clip: drive every animated node under Clip Root (fan arrows / wind). Off = only Target and its parents' });
SkateboardObbyObstacle.attributes.add('killMinUp', { type: 'number', default: 0, min: 0, max: 1, title: 'Kill Min Up', description: 'clip motion: the part only kills while the world up of its target is at least this (0 = always). A wave gate lying flat on the road is ridden over.' });

SkateboardObbyObstacle.prototype.initialize = function () {
    // rest transforms (local)
    this._restPos = this.entity.getLocalPosition().clone();
    this._restRot = this.entity.getLocalRotation().clone();
    if (this.target) {
        this._tRestPos = this.target.getLocalPosition().clone();
        this._tRestRot = this.target.getLocalRotation().clone();
        const ps = this.target.parent ? this.target.parent.getWorldTransform().getScale() : null;
        this._tParentScale = ps && ps.x > 0 ? ps.x : 1;
    }
    this._ownScale = 1;
    if (this.entity.parent) {
        const s = this.entity.parent.getWorldTransform().getScale();
        this._ownScale = s.x > 0 ? s.x : 1;
    }

    this._axisR = new pc.Vec3().copy(this.rotAxis).normalize();
    this._axisM = new pc.Vec3().copy(this.moveAxis).normalize();
    this._axisS = new pc.Vec3().copy(this.spinAxis).normalize();
    this._q = new pc.Quat();
    this._q2 = new pc.Quat();
    this._qOut = new pc.Quat();
    this._v = new pc.Vec3();
    this._v2 = new pc.Vec3();
    this._on = true;

    // kill shapes for the same-frame touch check, and how far they reach from this entity
    this._shapes = [];
    this._reach = 0;
    const own = this.entity.getPosition();
    this.entity.forEach((e) => {
        const c = e.collision;
        if (!c || (c.type !== 'box' && c.type !== 'sphere' && c.type !== 'cylinder')) return;
        this._shapes.push(e);
        const ext = c.type === 'box' ? c.halfExtents.length() : c.type === 'sphere' ? c.radius : Math.hypot(c.radius, c.height / 2);
        this._reach = Math.max(this._reach, e.getPosition().distance(own) + ext);
    });
    this._inv = new pc.Mat4();
    this._p = new pc.Vec3();
    this._lp = new pc.Vec3();
    this._lastAng = null;
    this._lastDist = 0;

    this.on('attr', () => {
        this._axisR.copy(this.rotAxis).normalize();
        this._axisM.copy(this.moveAxis).normalize();
        this._axisS.copy(this.spinAxis).normalize();
    });
    this.on('destroy', () => { this.applyPose(0, 0, 0, true); this.restoreClip(); });
    if (this.motion === 'clip') this.initClip();
    this.update(0);
};

// 0..1 position in a rest -> out -> rest cycle (smoothstep while moving)
SkateboardObbyObstacle.prototype.cycleValue = function (t) {
    const a = this.holdIn, b = a + this.moveOut, c = b + this.holdOut, d = c + this.moveIn;
    if (d <= 0) return 0;
    let x = (t + this.phase * d) % d;
    if (x < 0) x += d;
    if (x < a) return 0;
    if (x < b) { const u = (x - a) / Math.max(this.moveOut, 1e-4); return u * u * (3 - 2 * u); }
    if (x < c) return 1;
    const u = (x - c) / Math.max(this.moveIn, 1e-4);
    return 1 - u * u * (3 - 2 * u);
};

SkateboardObbyObstacle.prototype.update = function () {
    if (this.motion === 'clip') { this.updateClip(); return; }
    const t = Date.now() / 1000;
    let ang = 0, dist = 0;
    switch (this.motion) {
        case 'spin':
            ang = (this.rotSpeed * t + this.phase * 360) % 360;
            break;
        case 'swing':
            ang = this.rotCenter + this.rotAmp * Math.sin(2 * Math.PI * (t / this.period + this.phase));
            break;
        case 'slide':
            dist = this.moveAmp * Math.sin(2 * Math.PI * (t / this.period + this.phase));
            break;
        case 'cycle': {
            const u = this.cycleValue(t);
            ang = this.rotAmp * u;
            dist = this.moveAmp * u;
            break;
        }
        case 'blink': {
            const a = this.holdIn, d = a + this.moveOut + this.holdOut + this.moveIn;
            let x = d > 0 ? (t + this.phase * d) % d : 0;
            if (x < 0) x += d;
            this.setOn(x >= a && x < a + this.moveOut + this.holdOut);
            if (this._on) this.checkPlayer(0, 0);
            return;
        }
    }
    const spin = this.spinSpeed ? (this.spinSpeed * t) % 360 : 0;
    this.applyPose(ang, dist, spin, false);

    // how far the part turned / moved since the last frame (the extra spin is round, it is left out)
    const dAng = this._lastAng === null ? 0 : Math.abs(((ang - this._lastAng) % 360 + 540) % 360 - 180);
    const dDist = Math.abs(dist - this._lastDist);
    this._lastAng = ang;
    this._lastDist = dist;
    this.checkPlayer(dAng, dDist);
};

SkateboardObbyObstacle.prototype.applyPose = function (ang, dist, spin, rest) {
    // rotation offset (local): about rot axis, then the extra spin
    this._q.setFromAxisAngle(this._axisR, ang);
    if (spin) {
        this._q2.setFromAxisAngle(this._axisS, spin);
        this._q.mul(this._q2);
    }

    // own entity
    this._qOut.copy(this._restRot).mul(this._q);
    this.entity.setLocalRotation(this._qOut);
    this._v.copy(this._axisM).mulScalar(dist / this._ownScale);
    this._restRot.transformVector(this._v, this._v2);
    this._v2.add(this._restPos);
    this.entity.setLocalPosition(this._v2);

    // model node: same offset in its own local axes (its world rest pose equals this entity's)
    if (this.target) {
        this._qOut.copy(this._tRestRot).mul(this._q);
        this.target.setLocalRotation(this._qOut);
        this._v.copy(this._axisM).mulScalar(dist / this._tParentScale);
        this._tRestRot.transformVector(this._v, this._v2);
        this._v2.add(this._tRestPos);
        this.target.setLocalPosition(this._v2);
    }
    if (rest) this.setOn(true);
};

// ---- clip mode ----
SkateboardObbyObstacle.prototype.initClip = function () {
    this._channels = null;
    this._clipRest = null;
    this._clipDur = 0;
    this._cqA = new pc.Quat();
    this._cqB = new pc.Quat();
    this._lastPos = new pc.Vec3();
    this._lastRot = new pc.Quat();
    this._hasLast = false;
    // offset of this entity from the target at rest (world metres, rotation only)
    this._offPos = new pc.Vec3();
    this._offRot = new pc.Quat();
    if (this.target) {
        const inv = this._q.copy(this.target.getRotation()).invert();
        this._v.sub2(this.entity.getPosition(), this.target.getPosition());
        inv.transformVector(this._v, this._offPos);
        this._offRot.copy(inv).mul(this.entity.getRotation());
    }
    const asset = this.clip;
    if (!asset) return;
    const ready = (a) => { if (this.entity && this.entity.script) this.buildChannels(a.resource); };
    if (asset.loaded) ready(asset);
    else { asset.ready(ready); this.app.assets.load(asset); }
};

SkateboardObbyObstacle.prototype.buildChannels = function (track) {
    if (!track || !track.curves) return;
    const root = this.clipRoot || (this.target && this.target.parent) || this.entity;
    const byName = {};
    root.forEach((n) => { const b = n.name.replace(/\.\d+$/, ''); if (!byName[b]) byName[b] = n; });
    let allowed = null;
    if (!this.clipAll && this.target) {
        allowed = [];
        for (let n = this.target; n; n = n.parent) { allowed.push(n); if (n === root) break; }
    }
    const ch = [], rest = [];
    for (let i = 0; i < track.curves.length; i++) {
        const curve = track.curves[i];
        const input = track.inputs[curve.input], output = track.outputs[curve.output];
        for (let j = 0; j < curve.paths.length; j++) {
            const path = curve.paths[j];
            const ep = path.entityPath;
            const node = byName[String(ep[ep.length - 1]).replace(/\.\d+$/, '')];
            if (!node || (allowed && allowed.indexOf(node) < 0)) continue;
            const prop = path.propertyPath[0];
            const kind = prop === 'localPosition' ? 0 : prop === 'localRotation' ? 1 : prop === 'localScale' ? 2 : -1;
            if (kind < 0) continue;
            ch.push({ node: node, kind: kind, t: input.data, v: output.data, c: output.components, step: curve.interpolation === pc.INTERPOLATION_STEP, k: 0 });
            if (!rest.some(r => r.node === node)) rest.push({ node: node, p: node.getLocalPosition().clone(), r: node.getLocalRotation().clone(), s: node.getLocalScale().clone() });
        }
    }
    this._channels = ch;
    this._clipRest = rest;
    this._clipDur = track.duration || 0;
};

SkateboardObbyObstacle.prototype.sampleChannel = function (ch, time) {
    const t = ch.t, n = t.length;
    let k = ch.k;
    if (k >= n - 1 || t[k] > time) k = 0;
    while (k < n - 2 && t[k + 1] <= time) k++;
    ch.k = k;
    let u = 0;
    if (n > 1 && !ch.step) {
        const t0 = t[k], t1 = t[k + 1];
        u = t1 > t0 ? Math.min(1, Math.max(0, (time - t0) / (t1 - t0))) : 0;
    }
    const c = ch.c, v = ch.v, a = k * c, b = Math.min(k + 1, n - 1) * c;
    if (ch.kind === 1) {
        this._cqA.set(v[a], v[a + 1], v[a + 2], v[a + 3]);
        this._cqB.set(v[b], v[b + 1], v[b + 2], v[b + 3]);
        this._cqA.slerp(this._cqA, this._cqB, u);
        ch.node.setLocalRotation(this._cqA);
    } else {
        const x = v[a] + (v[b] - v[a]) * u, y = v[a + 1] + (v[b + 1] - v[a + 1]) * u, z = v[a + 2] + (v[b + 2] - v[a + 2]) * u;
        if (ch.kind === 0) ch.node.setLocalPosition(x, y, z);
        else ch.node.setLocalScale(x, y, z);
    }
};

SkateboardObbyObstacle.prototype.updateClip = function () {
    if (!this._channels || !(this._clipDur > 0)) return;
    const d = this._clipDur;
    let time = (Date.now() / 1000 * this.clipSpeed + this.phase * d) % d;
    if (time < 0) time += d;
    for (let i = 0; i < this._channels.length; i++) this.sampleChannel(this._channels[i], time);
    if (!this.target) return;

    // this entity (kill shapes) follows the target
    const tr = this.target.getRotation();
    tr.transformVector(this._offPos, this._v);
    this._v.add(this.target.getPosition());
    this._qOut.copy(tr).mul(this._offRot);
    this.entity.setPosition(this._v);
    this.entity.setRotation(this._qOut);

    let dAng = 0, dDist = 0;
    if (this._hasLast) {
        dDist = this._v.distance(this._lastPos);
        const q = this._qOut, l = this._lastRot;
        const dot = Math.min(1, Math.abs(q.x * l.x + q.y * l.y + q.z * l.z + q.w * l.w));
        dAng = 2 * Math.acos(dot) * pc.math.RAD_TO_DEG;
    }
    this._lastPos.copy(this._v);
    this._lastRot.copy(this._qOut);
    this._hasLast = true;
    if (this.killMinUp > 0) {
        this.target.getWorldTransform().getY(this._v);
        const on = this._v.normalize().y >= this.killMinUp;
        if (on !== this._killOn) {
            this._killOn = on;
            if (this.entity.collision) this.entity.collision.enabled = on;
        }
        if (!on) return;
    }
    this.checkPlayer(dAng, dDist);
};

SkateboardObbyObstacle.prototype.restoreClip = function () {
    const rest = this._clipRest;
    if (!rest) return;
    for (let i = 0; i < rest.length; i++) {
        const r = rest[i];
        r.node.setLocalPosition(r.p);
        r.node.setLocalRotation(r.r);
        r.node.setLocalScale(r.s);
    }
};

SkateboardObbyObstacle.prototype.setOn = function (on) {
    if (on === this._on) return;
    this._on = on;
    if (this.target) this.target.enabled = on;
    if (this.entity.collision) this.entity.collision.enabled = on;
};

// Same-frame touch check (see the header). dAng: degrees turned this frame, dDist: metres moved this frame.
SkateboardObbyObstacle.prototype.checkPlayer = function (dAng, dDist) {
    const ks = this.entity.script && this.entity.script.skateboardObbyKillOnTouch;
    if (!ks || !ks.enabled || !this._shapes.length) return;
    const p = this.app.skateboardObbyPlayerController;
    if (!p || p.isDied || !p.entity.enabled) return;
    // right after a respawn KillOnTouch waits for the guard to end, so does this
    if ((p._time || 0) < (p._respawnGuardUntil || 0) || p.canDie === false) return;

    const col = p.entity.collision;
    const radius = col ? col.radius : 0.41;
    const half = col ? Math.max(0, col.height / 2 - radius) : 0.59;
    const c = p.entity.getPosition();
    const d = c.distance(this.entity.getPosition());
    if (d > this._reach + half + radius + 0.6) return;

    const sweep = dAng * pc.math.DEG_TO_RAD * (d + half) + dDist;
    const r = radius + Math.min(sweep * 0.5, 0.6);
    for (let i = 0; i < this._shapes.length; i++) {
        const e = this._shapes[i];
        this._inv.copy(e.getWorldTransform()).invert();
        for (let s = -1; s <= 1; s++) {
            this._p.set(c.x, c.y + s * half, c.z);
            if (this.shapeDistance(e.collision, this._p) < r) {
                p._deathReason = ks.cause || ('touched ' + this.entity.name);
                this.app.fire('playerDie');
                return;
            }
        }
    }
};

// signed distance (m) from world point w to the shape (negative inside); this._inv = the shape's inverse world matrix
SkateboardObbyObstacle.prototype.shapeDistance = function (c, w) {
    const q = this._lp;
    this._inv.transformPoint(w, q);
    if (c.type === 'sphere') return q.length() - c.radius;
    if (c.type === 'cylinder') {
        const along = c.axis === 0 ? q.x : c.axis === 1 ? q.y : q.z;
        const rad = c.axis === 0 ? Math.hypot(q.y, q.z) : c.axis === 1 ? Math.hypot(q.x, q.z) : Math.hypot(q.x, q.y);
        const cx = rad - c.radius, cy = Math.abs(along) - c.height / 2;
        return Math.hypot(Math.max(cx, 0), Math.max(cy, 0)) + Math.min(Math.max(cx, cy), 0);
    }
    const he = c.halfExtents;
    const bx = Math.abs(q.x) - he.x, by = Math.abs(q.y) - he.y, bz = Math.abs(q.z) - he.z;
    return Math.hypot(Math.max(bx, 0), Math.max(by, 0), Math.max(bz, 0)) + Math.min(Math.max(bx, by, bz), 0);
};
