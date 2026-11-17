// Swing from hooks with the arms (MonkeyObby_SwingController pattern, no rope: spiderObbyArms draws two arms to the hook).
//   target: a hook in range and in front gets a highlight and an aim line.
//   grab:   JUMP takes the hook; it comes before a normal jump or push-off.
//   swing:  held at arm's length like a rod, can go around the hook. A / D turns the swing.
//   release: JUMP again. Always thrown forward and up; WASD / joystick steers the flight, the next hook can be grabbed.
// The player controller calls control() from moveSpider and leaves the frame to this script when it returns true.
// For the network later: everything a remote player needs is the hook position (arms.setHook) and the body.
var SpiderObbySwingController = pc.createScript('spiderObbySwingController');

SpiderObbySwingController.attributes.add('grabRange', { type: 'number', default: 22, title: 'Grab Range (m)' });
SpiderObbySwingController.attributes.add('aimAngle', { type: 'number', default: 110, title: 'Aim Angle (deg)', description: 'Largest angle between the travel or camera direction and the hook.' });
SpiderObbySwingController.attributes.add('maxRopeLength', { type: 'number', default: 8, title: 'Max Arm Length', description: 'Distance held from the hook (m), unless the hook asks for less.' });
SpiderObbySwingController.attributes.add('reelSpeed', { type: 'number', default: 60, title: 'Reel Speed (m/s)', description: 'Grabbing from far away pulls the body in at this speed.' });
SpiderObbySwingController.attributes.add('swingGravity', { type: 'number', default: 40, title: 'Swing Gravity' });
SpiderObbySwingController.attributes.add('minSwingSpeed', { type: 'number', default: 18, title: 'Min Swing Speed', description: 'A swing never gets slower: it goes around the hook.' });
SpiderObbySwingController.attributes.add('maxSwingSpeed', { type: 'number', default: 30, title: 'Max Swing Speed' });
SpiderObbySwingController.attributes.add('steerSpeed', { type: 'number', default: 80, title: 'Steer Speed (deg/s)' });
SpiderObbySwingController.attributes.add('autoReleaseTime', { type: 'number', default: 4, title: 'Auto Release (s)', description: 'Lets go by itself after this long. 0 = off.' });
SpiderObbySwingController.attributes.add('swingGripDrain', { type: 'number', default: 60, title: 'Swing Grip Drain', description: 'Grip per second while on a hook.' });
SpiderObbySwingController.attributes.add('launchSpeedMin', { type: 'number', default: 24, title: 'Launch Speed Min' });
SpiderObbySwingController.attributes.add('launchSpeedMax', { type: 'number', default: 32, title: 'Launch Speed Max' });
SpiderObbySwingController.attributes.add('launchAngleMin', { type: 'number', default: 20, title: 'Launch Angle Min (deg)' });
SpiderObbySwingController.attributes.add('launchAngleMax', { type: 'number', default: 55, title: 'Launch Angle Max (deg)' });
SpiderObbySwingController.attributes.add('launchGravity', { type: 'number', default: 40, title: 'Launch Gravity' });
SpiderObbySwingController.attributes.add('airTurnSpeed', { type: 'number', default: 120, title: 'Air Turn Speed (deg/s)' });
SpiderObbySwingController.attributes.add('releaseRegrab', { type: 'number', default: 0.35, title: 'Release Regrab', description: 'The arms do not take a wall or a floor for this long after letting go (s).' });
SpiderObbySwingController.attributes.add('followGain', { type: 'number', default: 12, title: 'Follow Gain', description: 'How hard the rigidbody is steered back to the swing path (1/s).' });
SpiderObbySwingController.attributes.add('alignBody', { type: 'boolean', default: true, title: 'Align Body', description: 'The body hangs from the hook.' });
SpiderObbySwingController.attributes.add('aimLineOpacity', { type: 'number', default: 0.55, min: 0, max: 1, title: 'Aim Line Opacity' });
SpiderObbySwingController.attributes.add('aimLineThickness', { type: 'number', default: 0.07, title: 'Aim Line Thickness' });
SpiderObbySwingController.attributes.add('hintFont', { type: 'asset', assetType: 'font', title: 'Hint Font' });
SpiderObbySwingController.attributes.add('hintFontSize', { type: 'number', default: 30, title: 'Hint Font Size' });
SpiderObbySwingController.attributes.add('hintBottom', { type: 'number', default: 96, title: 'Hint Bottom', description: 'Above the bars (2D Screen units).' });
SpiderObbySwingController.attributes.add('jumpButtonText', { type: 'string', default: 'SWING', title: 'Jump Button Text' });
SpiderObbySwingController.attributes.add('jumpButtonFontSize', { type: 'number', default: 40, title: 'Jump Button Font Size' });

(function () {
    const MIN_ROPE = 4, FLIGHT_MAX_TIME = 4, MOVE_CHECK_TIME = 0.05, MAX_FOLLOW_SPEED = 80, STUCK_DISTANCE = 4;
    const _a = new pc.Vec3(), _b = new pc.Vec3(), _c = new pc.Vec3(), _d = new pc.Vec3(), _e = new pc.Vec3();
    const _q = new pc.Quat(), _q2 = new pc.Quat(), _m = new pc.Mat4();

    function rotateY(v, ang) {
        const c = Math.cos(ang), s = Math.sin(ang);
        const x = v.x * c - v.z * s, z = v.x * s + v.z * c;
        v.x = x; v.z = z;
    }

    SpiderObbySwingController.prototype.initialize = function () {
        this.isSwinging = false;
        this.isFlying = false;
        this.activePoint = null;
        this.hoverPoint = null;
        this.bodyTilted = false;

        this._anchor = new pc.Vec3();
        this._pos = new pc.Vec3();
        this._vel = new pc.Vec3();
        this._dir = new pc.Vec3(0, 0, 1);
        this._write = new pc.Vec3();
        this._ropeLen = 0;
        this._ropeTarget = 0;
        this._entrySpeed = 0;
        this._swingTime = 0;
        this._loopSign = 1;
        this._cooldown = 0;
        this._lastPoint = null;
        this._detectTimer = 0;
        this._cand = [];
        this._tap = false;

        this._flyTime = 0;
        this._flyDir = new pc.Vec3();
        this._flySpeed = 0;
        this._flyVy = 0;
        this._flyLast = new pc.Vec3();
        this._flyCheck = 0;

        this._bodyRest = new pc.Vec3(0, -1, 0);
        this._rayOptions = { filterTags: ['Ground', 'CameraCollider'] };

        this.controller = this.entity.script.spiderObbyPlayerController;
        this.camera = this.app.root.findByName('Camera');

        this._aimMat = new pc.StandardMaterial();
        this._aimMat.useLighting = false;
        this._aimMat.useFog = false;
        this._aimMat.useSkybox = false;
        this._aimMat.diffuse = new pc.Color(0, 0, 0);
        this._aimMat.emissive = new pc.Color(1, 1, 1);
        this._aimMat.opacity = this.aimLineOpacity;
        this._aimMat.blendType = pc.BLEND_NORMAL;
        this._aimMat.depthWrite = false;
        this._aimMat.update();
        this._aimLine = new pc.Entity('SwingAimLine');
        const mesh = new pc.Entity('SwingAimLineMesh');
        mesh.addComponent('render', { type: 'cylinder', castShadows: false, receiveShadows: false });
        mesh.render.meshInstances[0].material = this._aimMat;
        mesh.setLocalPosition(0, -0.5, 0);
        mesh.setLocalScale(this.aimLineThickness, 1, this.aimLineThickness);
        this._aimLine.addChild(mesh);
        this.app.root.addChild(this._aimLine);
        this._aimLine.enabled = false;

        // a tap shorter than a frame must not get lost
        this._jumpButton = this.app.root.findByName('JumpButton');
        this._onTap = function () { this._tap = true; };
        if (this._jumpButton && this._jumpButton.element) this._jumpButton.element.on('touchstart', this._onTap, this);

        this.on('destroy', function () {
            if (this.hoverPoint) this.hoverPoint.setHighlight(false);
            if (this._jumpButton && this._jumpButton.element) this._jumpButton.element.off('touchstart', this._onTap, this);
            if (this._buttonIcon) this._buttonIcon.enabled = true;
            if (this._buttonLabel) this._buttonLabel.destroy();
            if (this._hint) this._hint.destroy();
            this._aimLine.destroy();
            this._aimMat.destroy();
        }, this);
    };

    SpiderObbySwingController.prototype.postInitialize = function () {
        const body = this.controller.body;
        if (body) this._bodyRest.copy(body.getLocalPosition());
    };

    SpiderObbySwingController.prototype.consumeTap = function () {
        const tap = this._tap;
        this._tap = false;
        return tap;
    };

    SpiderObbySwingController.prototype.canTarget = function () {
        const a = this.app, c = this.controller;
        return !c.isDied && !c._gripEmpty && a.isWatchingAd == false && a.menuPanelEnabled == false && a.isMarketEnabled == false && a.deadMenuEnabled == false && !a.isPopupEnabled && !a.numpad.enabled && !a.inCutscene;
    };

    // ---------------------------------------------------------------- target
    SpiderObbySwingController.prototype.travelDir = function (out) {
        const v = this.entity.rigidbody.linearVelocity;
        const hs = Math.sqrt(v.x * v.x + v.z * v.z);
        if (hs > 4) return out.set(v.x / hs, 0, v.z / hs);
        const f = this.controller.axis.forward;
        out.set(f.x, 0, f.z);
        return out.lengthSq() > 1e-4 ? out.normalize() : out.set(0, 0, 1);
    };

    SpiderObbySwingController.byScore = function (a, b) { return b._swingScore - a._swingScore; };

    SpiderObbySwingController.prototype.findTarget = function () {
        const points = this.app.spiderObbySwingPoints;
        if (!points || !points.length) return null;
        const me = this.entity.getPosition();
        const fwd = this.travelDir(_c);
        const cosLimit = Math.cos(this.aimAngle * pc.math.DEG_TO_RAD);
        const cand = this._cand;
        cand.length = 0;
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (!p.isAvailable() || p === this.activePoint) continue;
            if (p === this._lastPoint && this._cooldown > 0) continue;
            const anchor = p.getAnchorPosition();
            const dx = anchor.x - me.x, dy = anchor.y - me.y, dz = anchor.z - me.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const range = p.grabRadiusOverride > 0 ? p.grabRadiusOverride : this.grabRange;
            if (dist > range) continue;
            const flat = Math.sqrt(dx * dx + dz * dz);
            const cos = flat < 3 ? 1 : (dx * fwd.x + dz * fwd.z) / flat;
            if (cos < cosLimit) continue;
            p._swingScore = cos * 1.5 + (1 - dist / range);
            cand.push(p);
        }
        if (!cand.length) return null;
        if (cand.length > 1) cand.sort(SpiderObbySwingController.byScore);
        const rb = this.app.systems.rigidbody;
        for (let k = 0; k < cand.length; k++) {
            if (!rb.raycastFirst(me, cand[k].getAnchorPosition(), this._rayOptions)) return cand[k];
        }
        return null;
    };

    SpiderObbySwingController.prototype.setHover = function (p) {
        if (p === this.hoverPoint) return;
        if (this.hoverPoint) this.hoverPoint.setHighlight(false);
        this.hoverPoint = p;
        if (p) p.setHighlight(true);
    };

    // ---------------------------------------------------------------- called by the controller; true = this frame's velocity is written here
    SpiderObbySwingController.prototype.control = function (dt, jumpPressed, canMove, inX, floorDist, onFloor, attached) {
        if (this.isSwinging) {
            this.updateSwing(dt, jumpPressed, canMove, inX, floorDist);
            return this.isSwinging || this.isFlying;
        }
        if (jumpPressed && canMove && !this.controller._gripEmpty) {
            const target = this.findTarget();
            if (target) {
                this.grab(target);
                return true;
            }
        }
        if (this.isFlying) {
            this.updateFlight(dt, canMove, onFloor, attached);
            return this.isFlying;
        }
        return false;
    };

    // ---------------------------------------------------------------- grab
    SpiderObbySwingController.prototype.grab = function (p) {
        const c = this.controller, rb = this.entity.rigidbody;
        const anchor = this._anchor.copy(p.getAnchorPosition());
        const origin = rb.body.getWorldTransform().getOrigin();
        const me = this._pos.set(origin.x(), origin.y(), origin.z());
        const vel = this._vel.copy(rb.linearVelocity);
        if (c.grounded && vel.y < 0) vel.y = 0;

        // the swing goes toward the hook if it is ahead, otherwise the way the body moves
        const hs = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        this._entrySpeed = hs;
        const tx = anchor.x - me.x, tz = anchor.z - me.z, tl = Math.sqrt(tx * tx + tz * tz);
        const vx = hs > 1 ? vel.x / hs : 0, vz = hs > 1 ? vel.z / hs : 0;
        if (tl > 3 && (hs < 4 || (tx * vx + tz * vz) / tl > 0.3)) this._dir.set(tx / tl, 0, tz / tl);
        else if (hs > 4) this._dir.set(vx, 0, vz);
        else this.travelDir(this._dir);
        const fwdSpeed = Math.max(vel.x * this._dir.x + vel.z * this._dir.z, 0);
        vel.set(this._dir.x * fwdSpeed, vel.y, this._dir.z * fwdSpeed);

        // grabbed from above: keep going the same way around
        this._loopSign = 1;
        if (anchor.y < me.y) {
            const nx = this._dir.z, nz = -this._dir.x;
            const rx = me.x - anchor.x, ry = me.y - anchor.y, rz = me.z - anchor.z;
            const ltx = ry * nz, lty = rz * nx - rx * nz, ltz = -ry * nx;
            if (vel.x * ltx + vel.y * lty + vel.z * ltz <= 0) this._loopSign = -1;
        }

        const dist = me.distance(anchor);
        const want = Math.min(p.ropeLength > 0 ? p.ropeLength : this.maxRopeLength, this.maxRopeLength, dist);
        this._ropeTarget = Math.max(MIN_ROPE, want);
        this._ropeLen = Math.max(dist, this._ropeTarget);

        this.activePoint = p;
        this.isSwinging = true;
        this.isFlying = false;
        this._swingTime = 0;
        this.setHover(null);

        c.grounded = false;
        c.state = 'swing';
        c.arms.releaseAll();
        c.arms.setHook(anchor);
        this.app.fire('spider:swingGrabbed', p);
    };

    // ---------------------------------------------------------------- swing: a rod from the hook. Simulated here, the rigidbody follows.
    SpiderObbySwingController.prototype.updateSwing = function (dt, jumpPressed, canMove, inX, floorDist) {
        const p = this.activePoint, rb = this.entity.rigidbody, c = this.controller;
        if (!p || !p.isAvailable()) { this.release(false); return; }
        if (canMove) this._swingTime += dt;

        const anchor = this._anchor.copy(p.getAnchorPosition());
        c.arms.setHook(anchor);
        const pos = this._pos, vel = this._vel, dir = this._dir, r = _a, t = _b, n = _d;
        const steer = canMove ? inX * this.steerSpeed * pc.math.DEG_TO_RAD : 0;

        const steps = Math.max(1, Math.ceil(dt * 120)), h = dt / steps;
        for (let i = 0; i < steps; i++) {
            if (steer) { rotateY(dir, steer * h); rotateY(vel, steer * h); }
            n.set(dir.z, 0, -dir.x);
            if (this._ropeLen > this._ropeTarget) this._ropeLen = Math.max(this._ropeTarget, this._ropeLen - this.reelSpeed * h);
            vel.y -= this.swingGravity * h;

            // back into the plane of the swing
            const k = Math.min(1, 6 * h);
            vel.sub(_c.copy(n).mulScalar(vel.dot(n) * k));
            r.sub2(pos, anchor);
            pos.sub(_c.copy(n).mulScalar(r.dot(n) * k));

            r.sub2(pos, anchor);
            let d = r.length();
            if (d > 0.01 && canMove) {
                r.mulScalar(1 / d);
                t.cross(r, n);
                if (this._loopSign < 0) t.mulScalar(-1);
                const fs = vel.dot(t);
                if (fs < this.minSwingSpeed) vel.add(_c.copy(t).mulScalar((this.minSwingSpeed - fs) * Math.min(1, 10 * h)));
            } else if (!canMove) {
                // a menu is open: just hang, nobody is playing
                vel.mulScalar(Math.exp(-1.2 * h));
            }
            const sp = vel.length();
            if (sp > this.maxSwingSpeed) vel.mulScalar(this.maxSwingSpeed / sp);

            pos.x += vel.x * h; pos.y += vel.y * h; pos.z += vel.z * h;

            r.sub2(pos, anchor);
            d = r.length();
            if (d > 0.001) {
                r.mulScalar(1 / d);
                if (d > this._ropeLen || this._ropeLen <= this._ropeTarget) {
                    pos.copy(anchor).add(_c.copy(r).mulScalar(this._ropeLen));
                    vel.sub(_c.copy(r).mulScalar(vel.dot(r)));
                }
            }
        }

        // the body follows: the path's velocity plus a fixed gain toward it, never "error / dt" (physics steps at a fixed 1/60 s)
        const origin = rb.body.getWorldTransform().getOrigin();
        const ex = pos.x - origin.x(), ey = pos.y - origin.y(), ez = pos.z - origin.z();
        const reeling = this._ropeLen > this._ropeTarget;
        if (!reeling && this._swingTime > 0.15 && ex * ex + ey * ey + ez * ez > STUCK_DISTANCE * STUCK_DISTANCE) { this.release(false); return; }
        const physics = this.app.systems.rigidbody;
        const w = this._write.set(vel.x + ex * this.followGain, vel.y + ey * this.followGain + (-physics.gravity.y) * physics.fixedTimeStep, vel.z + ez * this.followGain);
        if (reeling) {
            // the pull itself is not part of the swing speed
            r.sub2(pos, anchor).normalize();
            w.x -= r.x * this.reelSpeed; w.y -= r.y * this.reelSpeed; w.z -= r.z * this.reelSpeed;
        }
        const wl = w.length();
        if (wl > MAX_FOLLOW_SPEED) w.mulScalar(MAX_FOLLOW_SPEED / wl);
        rb.linearVelocity = w;
        c._vel.copy(vel);

        if (!canMove) return;
        if (jumpPressed && this._swingTime >= 0.1) { this.release(true); return; }
        if (this.autoReleaseTime > 0 && this._swingTime > this.autoReleaseTime) { this.release(true); return; }
        if (this._swingTime > 0.3 && floorDist < 1.3 * c.entityScale) this.release(false);
    };

    // ---------------------------------------------------------------- release. withBoost: thrown forward and up; otherwise the speed it had.
    SpiderObbySwingController.prototype.release = function (withBoost) {
        if (!this.isSwinging) return;
        const rb = this.entity.rigidbody, c = this.controller, hp = this.activePoint;
        const v = _c.copy(this._vel);
        if (withBoost) {
            const fwd = Math.abs(v.x * this._dir.x + v.z * this._dir.z);
            const sMin = hp && hp.launchSpeedMin > 0 ? hp.launchSpeedMin : this.launchSpeedMin;
            const sMax = hp && hp.launchSpeedMax > 0 ? hp.launchSpeedMax : this.launchSpeedMax;
            const aMin = hp && hp.launchAngleMin > 0 ? hp.launchAngleMin : this.launchAngleMin;
            const aMax = hp && hp.launchAngleMax > 0 ? hp.launchAngleMax : this.launchAngleMax;
            const ang = pc.math.clamp(Math.atan2(v.y, Math.max(fwd, 0.01)) * pc.math.RAD_TO_DEG, Math.min(aMin, aMax), aMax) * pc.math.DEG_TO_RAD;
            const speed = pc.math.clamp(Math.max(v.length(), this._entrySpeed * 1.1), sMin, Math.max(sMin, sMax));
            this._flySpeed = speed * Math.cos(ang);
            this._flyVy = speed * Math.sin(ang);
            this._flyDir.copy(this._dir);
            this._flyTime = 0;
            this._flyCheck = 0;
            this._flyLast.copy(this.entity.getPosition());
            this.isFlying = true;
            v.set(this._flyDir.x * this._flySpeed, this._flyVy, this._flyDir.z * this._flySpeed);
        }
        rb.linearVelocity = v;
        c._vel.copy(v);
        c._bodyYaw = Math.atan2(this._dir.x, this._dir.z) * pc.math.RAD_TO_DEG;
        c._airLock = Math.max(c._airLock, this.releaseRegrab);

        this._lastPoint = hp;
        this._cooldown = 0.6;
        this.isSwinging = false;
        this.activePoint = null;
        c.arms.clearHook();
        this.app.fire('spider:swingReleased', withBoost);
    };

    // death, respawn, teleport: nothing carries over
    SpiderObbySwingController.prototype.cancel = function () {
        const c = this.controller;
        this.isSwinging = false;
        this.isFlying = false;
        this.activePoint = null;
        this._lastPoint = null;
        this._cooldown = 0;
        if (c.arms) c.arms.clearHook();
        if (this.bodyTilted && c.body) {
            c.body.setEulerAngles(0, c._bodyYaw, 0);
            c.body.setLocalPosition(this._bodyRest);
            this.bodyTilted = false;
        }
    };

    // ---------------------------------------------------------------- flight after a release: the speed stays, input turns it
    SpiderObbySwingController.prototype.updateFlight = function (dt, canMove, onFloor, attached) {
        const rb = this.entity.rigidbody, c = this.controller;
        this._flyTime += dt;
        if (this._flyTime > FLIGHT_MAX_TIME || (this._flyTime > 0.1 && (onFloor || (attached && c._airLock <= 0)))) { this.isFlying = false; return; }

        // ran into something: position only changes on a physics step, so the check is over a fixed time
        const p = this.entity.getPosition();
        if (this._flyTime > 0.12) {
            this._flyCheck += dt;
            if (this._flyCheck >= MOVE_CHECK_TIME) {
                const moved = (p.x - this._flyLast.x) * this._flyDir.x + (p.z - this._flyLast.z) * this._flyDir.z;
                if (moved / this._flyCheck < this._flySpeed * 0.35) { this.isFlying = false; return; }
                this._flyLast.copy(p);
                this._flyCheck = 0;
            }
        } else {
            this._flyLast.copy(p);
            this._flyCheck = 0;
        }

        const inX = c._inX, inY = c._inY;
        if (canMove && (inX !== 0 || inY !== 0)) {
            const fF = c._flatForward, fR = c._flatRight;
            const wx = fF.x * inY + fR.x * inX, wz = fF.z * inY + fR.z * inX;
            if (wx * wx + wz * wz > 1e-4) {
                const cur = Math.atan2(this._flyDir.x, this._flyDir.z), want = Math.atan2(wx, wz);
                const diff = Math.atan2(Math.sin(want - cur), Math.cos(want - cur));
                const maxTurn = this.airTurnSpeed * pc.math.DEG_TO_RAD * dt;
                const ang = cur + pc.math.clamp(diff, -maxTurn, maxTurn);
                this._flyDir.set(Math.sin(ang), 0, Math.cos(ang));
            }
        }
        this._flyVy = Math.max(this._flyVy - this.launchGravity * dt, -c.maxFallSpeed);
        const w = this._write.set(this._flyDir.x * this._flySpeed, this._flyVy, this._flyDir.z * this._flySpeed);
        rb.linearVelocity = w;
        c._vel.copy(w);
    };

    // ---------------------------------------------------------------- body: hangs from the hook, then back upright around its center
    SpiderObbySwingController.prototype.updateBody = function (dt) {
        const body = this.controller.body;
        if (!body) return;
        if (this.isSwinging && this.alignBody) {
            const up = _a.sub2(this._anchor, this._pos);
            if (up.lengthSq() < 1e-4) return;
            up.normalize();
            const fwd = _b.copy(this._vel);
            fwd.sub(_c.copy(up).mulScalar(fwd.dot(up)));
            if (fwd.lengthSq() < 1e-4) fwd.copy(this._dir);
            fwd.normalize();
            const right = _c.cross(up, fwd).normalize();
            const m = _m.data;
            m[0] = right.x; m[1] = right.y; m[2] = right.z; m[3] = 0;
            m[4] = up.x; m[5] = up.y; m[6] = up.z; m[7] = 0;
            m[8] = fwd.x; m[9] = fwd.y; m[10] = fwd.z; m[11] = 0;
            m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
            _q.setFromMat4(_m);
            body.setRotation(_q2.slerp(body.getRotation(), _q, 1 - Math.exp(-18 * dt)));
            this.bodyTilted = true;
        } else if (this.bodyTilted) {
            _q.setFromEulerAngles(0, this.controller._bodyYaw, 0);
            body.setRotation(_q2.slerp(body.getRotation(), _q, 1 - Math.exp(-14 * dt)));
            if (body.up.y > 0.9995) {
                body.setEulerAngles(0, this.controller._bodyYaw, 0);
                body.setLocalPosition(this._bodyRest);
                this.bodyTilted = false;
                return;
            }
        } else return;
        // the pivot is at the feet: turn around the center of the player
        _e.copy(this._bodyRest);
        body.getLocalRotation().transformVector(_e, _e);
        body.setLocalPosition(_e);
    };

    // ---------------------------------------------------------------- visuals
    SpiderObbySwingController.prototype.updateAimLine = function () {
        const p = this.hoverPoint, line = this._aimLine;
        if (!p) { if (line.enabled) line.enabled = false; return; }
        const to = p.getAnchorPosition(), from = this.entity.getPosition();
        const dir = _b.sub2(from, to), len = dir.length();
        if (len < 0.3) { line.enabled = false; return; }
        dir.mulScalar(1 / len);
        const dot = -dir.y;
        if (dot < -0.9999) _q.setFromAxisAngle(pc.Vec3.RIGHT, 180);
        else _q.set(-dir.z, 0, dir.x, 1 + dot).normalize();
        line.enabled = true;
        line.setPosition(to);
        line.setRotation(_q);
        line.setLocalScale(1, len, 1);
    };

    SpiderObbySwingController.prototype.fontId = function () {
        if (this.hintFont) return this.hintFont.id;
        const hud = this.app.root.findByName('LevelText') || this.app.root.findByName('Label');
        return hud && hud.element && hud.element.fontAsset;
    };

    SpiderObbySwingController.prototype.updateButton = function () {
        if (!this.app.isMobile || this._buttonFailed) return;
        if (!this._buttonLabel) {
            const btn = this._jumpButton, font = this.fontId();
            if (!btn || !btn.element || !font) { this._buttonFailed = true; return; }
            for (let i = 0; i < btn.children.length; i++) {
                if (btn.children[i].element && btn.children[i].element.type === 'image') { this._buttonIcon = btn.children[i]; break; }
            }
            const label = new pc.Entity('JumpButtonSwingLabel');
            label.addComponent('element', {
                type: 'text', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], fontAsset: font, fontSize: this.jumpButtonFontSize,
                autoWidth: true, autoHeight: true, color: new pc.Color(1, 0.82, 0.1), outlineColor: new pc.Color(0, 0, 0, 1), outlineThickness: 1,
                text: this.jumpButtonText, useInput: false
            });
            label.enabled = false;
            btn.addChild(label);
            this._buttonLabel = label;
            this._buttonOn = false;
        }
        const on = this.isSwinging || !!this.hoverPoint;
        if (on === this._buttonOn) return;
        this._buttonOn = on;
        this._buttonLabel.enabled = on;
        if (this._buttonIcon) this._buttonIcon.enabled = !on;
    };

    SpiderObbySwingController.prototype.updateHint = function () {
        const mode = this.isSwinging ? 2 : this.hoverPoint ? 1 : 0;
        if (mode === this._hintMode) return;
        this._hintMode = mode;
        if (!this._hint && !this._hintFailed) {
            const screen = this.app.root.findByName('2D Screen'), font = this.fontId();
            if (!screen || !font) { this._hintFailed = true; return; }
            const hint = new pc.Entity('SwingHint');
            hint.addComponent('element', {
                type: 'text', anchor: [0.5, 0, 0.5, 0], pivot: [0.5, 0], fontAsset: font, fontSize: this.hintFontSize,
                autoWidth: true, autoHeight: true, color: new pc.Color(1, 1, 1), outlineColor: new pc.Color(0, 0, 0, 1), outlineThickness: 0.8, text: ' ', useInput: false
            });
            screen.addChild(hint);
            this._hint = hint;
        }
        if (!this._hint) return;
        this._hint.enabled = mode !== 0;
        if (!mode) return;
        // on a phone held upright it goes above the jump button
        const device = this.app.graphicsDevice;
        this._hint.setLocalPosition(0, this.hintBottom * (!this.app.isMobile ? 1 : device.height > device.width ? 3 : 1.6), 0);
        const key = this.app.isMobile ? 'Tap ' + this.jumpButtonText : 'Press SPACE';
        this._hint.element.text = key + (mode === 2 ? ' to let go' : ' to swing');
    };

    SpiderObbySwingController.prototype.update = function (dt) {
        if (this._cooldown > 0) this._cooldown -= dt;
        if (this.controller.grounded) this._cooldown = 0;
        this._detectTimer -= dt;
        if (this._detectTimer <= 0) {
            this._detectTimer = 0.05;
            this.setHover(!this.isSwinging && this.canTarget() ? this.findTarget() : null);
        }
    };

    // runs before the arms: they read the body
    SpiderObbySwingController.prototype.postUpdate = function (dt) {
        this.updateBody(dt);
        this.updateAimLine();
        this.updateButton();
        this.updateHint();
    };
})();
