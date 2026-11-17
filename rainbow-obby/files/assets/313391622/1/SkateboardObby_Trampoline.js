/*
 * SkateboardObby_Trampoline
 * Trampoline / spring platform on the course (PK_Trampolin, PK_Engel_Yay_Platform). The entity sits on the middle
 * of the pad surface. When the local player lands on the pad (feet inside Radius, between Trigger Below and Trigger
 * Above of the pad top) it is launched straight up with app.playerBounce (same as the Monkey trampolines).
 * Height of the bounce ~ Power and Curve Time (tune per pad).
 *
 * Approach Radius (optional): a player riding at the pad on the road (body below the pad top) is launched already
 * inside this radius, before the board hits the side of the pad (the pad collider stops the board dead and the
 * player would bounce in place). Launch Speed (optional): board speed set at the bounce, so every player flies the
 * same distance (to the next road) whatever speed they came with.
 *
 * Visual (optional): Target is squashed down (Squash, m along its up axis) and springs back when it bounces
 * (spring platform plate). No physics trigger, no allocations per frame.
 */
var SkateboardObbyTrampoline = pc.createScript('skateboardObbyTrampoline');

SkateboardObbyTrampoline.attributes.add('radius', { type: 'number', default: 3, title: 'Radius (m)' });
SkateboardObbyTrampoline.attributes.add('triggerBelow', { type: 'number', default: 0.4, title: 'Trigger Below (m)' });
SkateboardObbyTrampoline.attributes.add('triggerAbove', { type: 'number', default: 0.8, title: 'Trigger Above (m)' });
SkateboardObbyTrampoline.attributes.add('approachRadius', { type: 'number', default: 0, title: 'Approach Radius (m)', description: 'Radius used while the player is below the pad top (riding at it on the road), so the bounce starts before the board hits the side of the pad. 0 = Radius' });
SkateboardObbyTrampoline.attributes.add('power', { type: 'number', default: 2, title: 'Power', description: 'app.playerBounce.bounce power' });
SkateboardObbyTrampoline.attributes.add('curveTime', { type: 'number', default: 0.5, title: 'Curve Time (s)' });
SkateboardObbyTrampoline.attributes.add('launchSpeed', { type: 'number', default: 0, title: 'Launch Speed (m/s)', description: 'Board speed set at the bounce (same flight for everyone). 0 = keep the player speed' });
SkateboardObbyTrampoline.attributes.add('cooldown', { type: 'number', default: 0.4, title: 'Cooldown (s)' });
SkateboardObbyTrampoline.attributes.add('target', { type: 'entity', title: 'Visual Target (optional)' });
SkateboardObbyTrampoline.attributes.add('squash', { type: 'number', default: 0.4, title: 'Squash (m)' });

SkateboardObbyTrampoline.prototype.initialize = function () {
    this._p = new pc.Vec3();
    this._inv = new pc.Mat4();
    this._cool = 0;
    this._anim = 0;
    this._up = new pc.Vec3(0, 1, 0);
    if (this.target) {
        this._restPos = this.target.getLocalPosition().clone();
        const ps = this.target.parent ? this.target.parent.getWorldTransform().getScale() : null;
        this._pScale = ps && ps.x > 0 ? ps.x : 1;
        this._tmp = new pc.Vec3();
    }
};

SkateboardObbyTrampoline.prototype.update = function (dt) {
    if (this._cool > 0) this._cool -= dt;
    if (this._anim > 0) this.animate(dt);

    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || pcs.isDied || this._cool > 0 || !this.app.playerBounce || this.app.playerBounce.canBounce === false) return;
    const vel = pcs.entity.rigidbody ? pcs.entity.rigidbody.linearVelocity : null;
    if (vel && vel.y > 2) return; // still going up (just bounced)

    this._inv.copy(this.entity.getWorldTransform()).invert();
    this._inv.transformPoint(pcs.body.getPosition(), this._p);
    if (this._p.y < -this.triggerBelow || this._p.y > this.triggerAbove) return;
    // below the pad top the wider Approach Radius is used (bounce before the board hits the side of the pad)
    const r = this._p.y < 0 && this.approachRadius > this.radius ? this.approachRadius : this.radius;
    if (this._p.x * this._p.x + this._p.z * this._p.z > r * r) return;

    this.app.playerBounce.bounce(this._up, this.power, this.curveTime);
    if (this.launchSpeed > 0) pcs.speed = this.launchSpeed;
    this._cool = this.cooldown;
    this._anim = 0.45;
    if (pcs.entity.sound && pcs.entity.sound.slot('jump')) pcs.entity.sound.play('jump');
};

// plate dips and springs back (0.45 s)
SkateboardObbyTrampoline.prototype.animate = function (dt) {
    this._anim = Math.max(0, this._anim - dt);
    if (!this.target) return;
    const t = 1 - this._anim / 0.45;
    const k = t < 0.25 ? -t / 0.25 : -(1 - t) / 0.75 * Math.cos((t - 0.25) * 9);
    this._tmp.copy(this._restPos);
    this._tmp.y += k * this.squash / this._pScale;
    this.target.setLocalPosition(this._tmp);
};
