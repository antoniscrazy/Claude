/*
 * SkateboardObby_BowlingPins
 * Bowling pins (Stage_<n>_Engel_Bowling_Lobutlari: a group whose children are the pins) that scatter when the local
 * player rides through them. Client-side only: every player sees their own pins, nothing is sent to the server.
 *
 * No rigidbody: a hit pin flies on a scripted ballistic path (player velocity x Push Factor + Side Speed + Up Speed),
 * tumbles, bounces on the floor (one downward ray on the Ground tag every few frames while it falls), lies down and
 * slides to a stop. A flying pin knocks the standing pins it touches (Chain Factor); a pin lying on the floor can be
 * kicked again. The player is not stopped: each standing pin hit takes Speed Loss Per Pin of the board speed, at most
 * Max Speed Loss per pass. Pins never kill.
 * The pins stand up again Reset Delay seconds after the last hit once the player is Reset Distance away, right after
 * a death / respawn / teleport, or when the stage chunk closes. Nothing runs while the player is farther than Active
 * Range and the pins are standing. No allocations per frame (except the engine's ray result while a pin falls).
 */
var SkateboardObbyBowlingPins = pc.createScript('skateboardObbyBowlingPins');

SkateboardObbyBowlingPins.attributes.add('pins', { type: 'entity', title: 'Pins', description: 'Group entity; every child with a render is a pin (pivot at the base, local Y up)' });
SkateboardObbyBowlingPins.attributes.add('pinList', { type: 'entity', array: true, title: 'Pin List', description: 'Used when Pins is empty: pins that are not children of one group (World 2 lanterns).' });
SkateboardObbyBowlingPins.attributes.add('pinRadius', { type: 'number', default: 0.425, title: 'Pin Radius (m)' });
SkateboardObbyBowlingPins.attributes.add('pinHeight', { type: 'number', default: 2.24, title: 'Pin Height (m)' });
SkateboardObbyBowlingPins.attributes.add('pushFactor', { type: 'number', default: 0.8, title: 'Push Factor', description: 'Pin speed along the player velocity = player speed x this' });
SkateboardObbyBowlingPins.attributes.add('minPushSpeed', { type: 'number', default: 6, title: 'Min Push Speed (m/s)' });
SkateboardObbyBowlingPins.attributes.add('sideSpeed', { type: 'number', default: 6, title: 'Side Speed (m/s)', description: 'Sideways push away from the player path' });
SkateboardObbyBowlingPins.attributes.add('upSpeed', { type: 'number', default: 7.5, title: 'Up Speed (m/s)' });
SkateboardObbyBowlingPins.attributes.add('spinSpeed', { type: 'number', default: 540, title: 'Spin Speed (deg/s)' });
SkateboardObbyBowlingPins.attributes.add('chainFactor', { type: 'number', default: 0.6, title: 'Chain Factor', description: 'A flying pin knocks a standing pin with its own velocity x this' });
SkateboardObbyBowlingPins.attributes.add('chainRadius', { type: 'number', default: 1.5, title: 'Chain Radius (m)', description: 'A flying pin knocks the standing pins whose center is this close (horizontal)' });
SkateboardObbyBowlingPins.attributes.add('gravity', { type: 'number', default: 22, title: 'Gravity (m/s2)' });
SkateboardObbyBowlingPins.attributes.add('bounce', { type: 'number', default: 0.35, title: 'Bounce' });
SkateboardObbyBowlingPins.attributes.add('friction', { type: 'number', default: 6, title: 'Floor Friction (m/s2)' });
SkateboardObbyBowlingPins.attributes.add('speedLossPerPin', { type: 'number', default: 0.02, title: 'Speed Loss Per Pin', description: 'Fraction of the board speed taken by each standing pin the player hits' });
SkateboardObbyBowlingPins.attributes.add('maxSpeedLoss', { type: 'number', default: 0.08, title: 'Max Speed Loss', description: 'At most this fraction per pass (until the pins stand up again)' });
SkateboardObbyBowlingPins.attributes.add('resetDelay', { type: 'number', default: 4, title: 'Reset Delay (s)' });
SkateboardObbyBowlingPins.attributes.add('resetDistance', { type: 'number', default: 25, title: 'Reset Distance (m)' });
SkateboardObbyBowlingPins.attributes.add('activeRange', { type: 'number', default: 60, title: 'Active Range (m)' });
SkateboardObbyBowlingPins.attributes.add('fallLimit', { type: 'number', default: 25, title: 'Fall Limit (m)', description: 'A pin this far below its base is hidden until the reset' });
SkateboardObbyBowlingPins.attributes.add('hitSound', { type: 'asset', assetType: 'audio', title: 'Hit Sound' });
SkateboardObbyBowlingPins.attributes.add('hitVolume', { type: 'number', default: 0.6, title: 'Hit Volume' });

SkateboardObbyBowlingPins.prototype.initialize = function () {
    this._a = new pc.Vec3();
    this._b = new pc.Vec3();
    this._v = new pc.Vec3();
    this._q = new pc.Quat();
    this._up = new pc.Vec3(0, 1, 0);
    this._prev = new pc.Vec3();
    this._hasPrev = false;
    this._center = new pc.Vec3();
    this._time = 0;
    this._lastHit = -1e9;
    this._lastSound = -1e9;
    this._lossLeft = this.maxSpeedLoss;
    this._scattered = false;
    this._sawDeath = false;
    this._frame = 0;

    this.list = [];
    const kids = this.pins ? this.pins.children : (this.pinList || []);
    for (let i = 0; i < kids.length; i++) {
        const e = kids[i];
        if (!e.render) continue;
        const up = new pc.Vec3();
        e.getWorldTransform().getY(up).normalize();
        const pin = {
            e: e,
            restPos: e.getPosition().clone(),
            restRot: e.getRotation().clone(),
            restScale: e.getLocalScale().clone(),
            restCenter: e.getPosition().clone().add(up.mulScalar(this.pinHeight * 0.5)),
            c: new pc.Vec3(),           // pin center
            v: new pc.Vec3(),           // velocity
            axis: new pc.Vec3(0, 0, 1), // spin axis (world)
            rate: 0,                    // spin rate (rad/s)
            rot: new pc.Quat(),         // world rotation
            upNow: new pc.Vec3(),
            lie: 0,                     // 0..1 blend to lying
            lieFrom: new pc.Quat(),
            lieRot: new pc.Quat(),
            floorY: 0,
            state: 0,                   // 0 standing, 1 flying, 2 sliding, 3 resting, 4 gone
            pop: 0
        };
        this.list.push(pin);
        this._center.add(pin.restCenter);
    }
    if (this.list.length) this._center.mulScalar(1 / this.list.length);

    this._sound = null;
    if (this.hitSound) {
        if (!this.entity.sound) this.entity.addComponent('sound', { positional: false });
        this._sound = this.entity.sound.addSlot('pinHit', { asset: this.hitSound.id, volume: this.hitVolume, overlap: true, autoPlay: false });
        if (!this.hitSound.loaded) this.app.assets.load(this.hitSound);
    }

    this.on('enable', () => this.resetPins(false));
    this.on('disable', () => this.resetPins(false));
    this.on('destroy', () => this.resetPins(false));
};

SkateboardObbyBowlingPins.prototype.update = function (dt) {
    if (!this.list.length || !(dt > 0)) return;
    this._time += dt;
    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || !pcs.entity) return;
    const p = pcs.entity.getPosition();
    const dx = p.x - this._center.x, dz = p.z - this._center.z;
    const d2 = dx * dx + dz * dz;
    if (!this._scattered && d2 > this.activeRange * this.activeRange) {
        this._hasPrev = false;
        if (this._popping) this.popIn(dt);
        return;
    }
    if (pcs.isDied) this._sawDeath = true;

    // teleport / respawn: the player moved more than 15 m in one frame
    let jumped = false;
    if (this._hasPrev) {
        const mx = p.x - this._prev.x, my = p.y - this._prev.y, mz = p.z - this._prev.z;
        jumped = mx * mx + my * my + mz * mz > 225;
    }
    if (this._scattered && ((this._sawDeath && !pcs.isDied) || jumped ||
        (d2 > this.resetDistance * this.resetDistance && this._time - this._lastHit > this.resetDelay))) {
        this.resetPins(true);
    }

    if (!pcs.isDied && !jumped && this._hasPrev) this.hitTest(pcs, p, dt);
    this._prev.copy(p);
    this._hasPrev = true;

    if (this._scattered) this.simulate(dt);
    if (this._popping) this.popIn(dt);
};

// player capsule vs pins, swept along the last frame's xz path (no tunnelling at 30 m/s / 30 FPS)
SkateboardObbyBowlingPins.prototype.hitTest = function (pcs, p, dt) {
    const col = pcs.entity.collision;
    const pr = col && col.radius ? col.radius : 0.45;
    const ph = col && col.height ? col.height * 0.5 : 1.0;
    const ax = this._prev.x, az = this._prev.z;
    const sx = p.x - ax, sz = p.z - az;
    const len2 = sx * sx + sz * sz;
    const r = this.pinRadius;
    const reach = pr + r;
    const vel = pcs.entity.rigidbody ? pcs.entity.rigidbody.linearVelocity : null;
    let vx = vel ? vel.x : sx / dt, vz = vel ? vel.z : sz / dt;
    let sp = Math.sqrt(vx * vx + vz * vz);
    for (let i = 0; i < this.list.length; i++) {
        const pin = this.list[i];
        const st = pin.state;
        if (st === 1 || st === 4) continue;
        let px, pz;
        if (st === 0) {
            if (p.y - ph > pin.restPos.y + this.pinHeight || p.y + ph < pin.restPos.y) continue; // over (ollie) / under
            px = pin.restPos.x; pz = pin.restPos.z;
        } else { // lying on the floor: can be kicked again
            if (p.y - ph > pin.c.y + r || p.y + ph < pin.c.y - r) continue;
            px = pin.c.x; pz = pin.c.z;
        }
        // closest point of the segment prev -> p to the pin
        const cx = px - ax, cz = pz - az;
        let t = len2 > 1e-8 ? (cx * sx + cz * sz) / len2 : 1;
        t = t < 0 ? 0 : (t > 1 ? 1 : t);
        let nx = cx - sx * t, nz = cz - sz * t;
        const nl2 = nx * nx + nz * nz;
        if (nl2 > reach * reach) continue;
        // away from the player path (random side when dead centre)
        const nl = Math.sqrt(nl2);
        if (nl > 1e-4) { nx /= nl; nz /= nl; } else if (sp > 1e-3) { const s = Math.random() < 0.5 ? -1 : 1; nx = -vz / sp * s; nz = vx / sp * s; } else { nx = 1; nz = 0; }
        let fx = vx, fz = vz, fs = sp;
        if (fs < 1e-3) { fx = nx; fz = nz; fs = 1; }
        const push = Math.max(this.minPushSpeed, fs * this.pushFactor) / fs;
        const side = this.sideSpeed * (0.6 + Math.random() * 0.8);
        const up = this.upSpeed * (st === 0 ? 0.8 + Math.random() * 0.4 : 0.5 + Math.random() * 0.3);
        this.knock(pin, fx * push + nx * side, up, fz * push + nz * side);
        // the player keeps going: small speed loss for standing pins, capped per pass
        if (st === 0 && this._lossLeft > 0 && pcs.speed > 0) {
            const l = Math.min(this.speedLossPerPin, this._lossLeft);
            pcs.speed *= 1 - l;
            this._lossLeft -= l;
        }
    }
};

SkateboardObbyBowlingPins.prototype.knock = function (pin, vx, vy, vz) {
    if (pin.state === 0) {
        pin.c.copy(pin.restCenter);
        pin.rot.copy(pin.restRot);
        if (pin.pop) { pin.pop = 0; pin.e.setLocalScale(pin.restScale); }
    }
    pin.state = 1;
    pin.v.set(vx, vy, vz);
    pin.floorY = pin.restPos.y;
    // tumble forward (axis = up x horizontal velocity) with a random tilt
    const h = Math.sqrt(vx * vx + vz * vz) || 1;
    pin.axis.set(vz / h + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4, -vx / h + (Math.random() - 0.5) * 0.6).normalize();
    pin.rate = this.spinSpeed * pc.math.DEG_TO_RAD * (0.7 + Math.random() * 0.6);
    this._scattered = true;
    this._lastHit = this._time;
    if (this._sound && this._time - this._lastSound > 0.25) {
        this._lastSound = this._time;
        this._sound.pitch = 0.9 + Math.random() * 0.25;
        this._sound.play();
    }
};

SkateboardObbyBowlingPins.prototype.simulate = function (dt) {
    this._frame++;
    const g = this.gravity, r = this.pinRadius, half = this.pinHeight * 0.5;
    for (let i = 0; i < this.list.length; i++) {
        const pin = this.list[i];
        const st = pin.state;
        if (st === 0 || st === 3 || st === 4) continue;
        const v = pin.v, c = pin.c;
        if (st === 1) {
            v.y -= g * dt;
            c.x += v.x * dt; c.y += v.y * dt; c.z += v.z * dt;
            // floor under the pin: one ray every 2nd frame while falling (staggered per pin)
            if (v.y < 0 && ((this._frame + i) & 1) === 0) this.findFloor(pin);
            if (v.y < 0 && c.y - r <= pin.floorY) {
                c.y = pin.floorY + r;
                v.y = -v.y * this.bounce;
                v.x *= 0.75; v.z *= 0.75;
                pin.rate *= 0.6;
                if (v.y < 2) { v.y = 0; pin.state = 2; this.startLie(pin); }
            }
            if (c.y < pin.restPos.y - this.fallLimit) { pin.state = 4; pin.e.enabled = false; continue; }
            this._q.setFromAxisAngle(pin.axis, pin.rate * dt * pc.math.RAD_TO_DEG);
            pin.rot.mul2(this._q, pin.rot);
        } else { // sliding on the floor while it lies down
            const h = Math.sqrt(v.x * v.x + v.z * v.z);
            const nh = Math.max(0, h - this.friction * dt);
            if (h > 1e-4) { v.x *= nh / h; v.z *= nh / h; }
            c.x += v.x * dt; c.z += v.z * dt;
            if (((this._frame + i) & 3) === 0) {
                this.findFloor(pin);
                if (pin.floorY < c.y - r - 0.3) { pin.state = 1; v.y = 0; continue; } // slid off an edge
                c.y = pin.floorY + r;
            }
            pin.lie = Math.min(1, pin.lie + dt * 4);
            pin.rot.slerp(pin.lieFrom, pin.lieRot, pin.lie);
            if (nh < 0.2 && pin.lie >= 1) pin.state = 3;
        }
        // entity pivot is the pin base: place it so the pin turns about its center
        pin.rot.transformVector(this._up, pin.upNow);
        pin.e.setPosition(c.x - pin.upNow.x * half, c.y - pin.upNow.y * half, c.z - pin.upNow.z * half);
        pin.e.setRotation(pin.rot);
    }
    // chain: flying pins knock the standing pins they touch
    const reach2 = this.chainRadius * this.chainRadius;
    for (let i = 0; i < this.list.length; i++) {
        const f = this.list[i];
        if (f.state !== 1) continue;
        for (let j = 0; j < this.list.length; j++) {
            const s = this.list[j];
            if (s.state !== 0 || f.c.y - r > s.restPos.y + this.pinHeight) continue;
            const ddx = s.restCenter.x - f.c.x, ddz = s.restCenter.z - f.c.z;
            const dd2 = ddx * ddx + ddz * ddz;
            if (dd2 > reach2) continue;
            const d = Math.sqrt(dd2) || 1;
            const k = this.chainFactor;
            const side = this.sideSpeed * 0.5 * (0.6 + Math.random() * 0.8);
            this.knock(s, f.v.x * k + ddx / d * side, this.upSpeed * 0.7 * (0.8 + Math.random() * 0.4), f.v.z * k + ddz / d * side);
        }
    }
};

SkateboardObbyBowlingPins.prototype.startLie = function (pin) {
    pin.lieFrom.copy(pin.rot);
    pin.rot.transformVector(this._up, this._a);
    // target: the pin axis laid flat (its own horizontal direction, or the slide direction if it landed upright)
    this._b.set(this._a.x, 0, this._a.z);
    if (this._b.lengthSq() < 0.04) this._b.set(pin.v.x, 0, pin.v.z);
    if (this._b.lengthSq() < 1e-6) this._b.set(1, 0, 0);
    this._b.normalize();
    const dot = Math.max(-1, Math.min(1, this._a.dot(this._b)));
    this._v.cross(this._a, this._b);
    if (this._v.lengthSq() < 1e-8) this._v.set(1, 0, 0);
    this._v.normalize();
    this._q.setFromAxisAngle(this._v, Math.acos(dot) * pc.math.RAD_TO_DEG);
    pin.lieRot.mul2(this._q, pin.rot);
    pin.lie = 0;
};

SkateboardObbyBowlingPins.prototype.findFloor = function (pin) {
    const c = pin.c;
    this._a.set(c.x, c.y + 1, c.z);
    this._b.set(c.x, c.y - 30, c.z);
    const hit = this.app.systems.rigidbody.raycastFirst(this._a, this._b, { filterTags: ['Ground'] });
    pin.floorY = hit ? hit.point.y : -1e9;
};

// back to the rest pose; pop = grow back in 0.3 s (the pins that had moved)
SkateboardObbyBowlingPins.prototype.resetPins = function (pop) {
    this._popping = false;
    for (let i = 0; i < this.list.length; i++) {
        const pin = this.list[i];
        const moved = pin.state !== 0;
        pin.state = 0;
        pin.e.enabled = true;
        pin.e.setPosition(pin.restPos);
        pin.e.setRotation(pin.restRot);
        pin.pop = pop === true && moved ? 0.001 : 0;
        const s = pin.pop ? 0.2 : 1;
        pin.e.setLocalScale(pin.restScale.x * s, pin.restScale.y * s, pin.restScale.z * s);
        if (pin.pop) this._popping = true;
    }
    this._scattered = false;
    this._sawDeath = false;
    this._lossLeft = this.maxSpeedLoss;
};

SkateboardObbyBowlingPins.prototype.popIn = function (dt) {
    let any = false;
    for (let i = 0; i < this.list.length; i++) {
        const pin = this.list[i];
        if (!pin.pop) continue;
        pin.pop = Math.min(1, pin.pop + dt / 0.3);
        const u = pin.pop - 1, s = 0.2 + 0.8 * (1 + 2.7 * u * u * u + 1.7 * u * u); // ease out back
        if (pin.pop >= 1) { pin.pop = 0; pin.e.setLocalScale(pin.restScale); }
        else { pin.e.setLocalScale(pin.restScale.x * s, pin.restScale.y * s, pin.restScale.z * s); any = true; }
    }
    this._popping = any;
};
