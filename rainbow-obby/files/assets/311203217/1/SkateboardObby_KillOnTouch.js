// SkateboardObby_KillOnTouch.js
// Put on any object that has a collision component: the local player dies when it touches it.
// - Solid object (collision + rigidbody, e.g. a static box): dies on contact (side, top, bottom).
// - Trigger volume (collision without rigidbody): dies when entering it.
// Death goes through the player controller's normal path (playerDie -> died(): shatter, dead menu,
// death log line, respawn guard). Remote players have no collider here, so they are not affected.
// No per-frame work: the script only reacts to physics enter/leave events. It only runs code every
// frame while the player is still touching it during the short respawn guard after a respawn.
var SkateboardObbyKillOnTouch = pc.createScript('skateboardObbyKillOnTouch');

SkateboardObbyKillOnTouch.attributes.add('cause', {
    type: 'string',
    default: '',
    title: 'Death Cause',
    description: 'Text for the console death log. Empty = "touched <entity name>".'
});

SkateboardObbyKillOnTouch.prototype.initialize = function () {
    this._inside = null;     // the player entity while it touches this object
    this._waiting = false;   // app update hooked (player touching during the respawn guard)

    const col = this.entity.collision;
    if (!col) {
        console.warn('[SkateboardObby] skateboardObbyKillOnTouch needs a collision component:', this.entity.name);
        return;
    }

    col.on('collisionstart', this._onCollisionStart, this);
    col.on('collisionend', this._onLeave, this);
    col.on('triggerenter', this._onEnter, this);
    col.on('triggerleave', this._onLeave, this);
    this.app.on('PlayerDied', this._clear, this);
    this.app.on('Respawned', this._clear, this);
    this.on('disable', this._clear, this);

    this.on('destroy', function () {
        col.off('collisionstart', this._onCollisionStart, this);
        col.off('collisionend', this._onLeave, this);
        col.off('triggerenter', this._onEnter, this);
        col.off('triggerleave', this._onLeave, this);
        this.app.off('PlayerDied', this._clear, this);
        this.app.off('Respawned', this._clear, this);
        this._clear();
    }, this);
};

SkateboardObbyKillOnTouch.prototype._player = function () {
    const p = this.app.skateboardObbyPlayerController;
    return (p && p.entity && !p.entity._destroying) ? p : null;
};

SkateboardObbyKillOnTouch.prototype._onCollisionStart = function (result) {
    this._onEnter(result && result.other);
};

SkateboardObbyKillOnTouch.prototype._onEnter = function (other) {
    const p = this._player();
    if (!p || !other || other !== p.entity || !this.enabled) return;
    this._inside = other;
    this._tryKill(p);
};

SkateboardObbyKillOnTouch.prototype._onLeave = function (other) {
    if (other && other === this._inside) this._clear();
};

SkateboardObbyKillOnTouch.prototype._tryKill = function (p) {
    if (p.isDied) { this._clear(); return; }

    // right after a respawn the player controller ignores every death except a fall (respawn guard);
    // if the player is still touching when the guard ends, it dies then
    if ((p._time || 0) < (p._respawnGuardUntil || 0) || p.canDie === false) {
        this._wait(true);
        return;
    }

    p._deathReason = this.cause || ('touched ' + this.entity.name);
    this.app.fire('playerDie');
    if (p.isDied) this._clear(); else this._wait(true);
};

SkateboardObbyKillOnTouch.prototype._wait = function (on) {
    if (on === this._waiting) return;
    this._waiting = on;
    if (on) this.app.on('update', this._onWaitUpdate, this);
    else this.app.off('update', this._onWaitUpdate, this);
};

SkateboardObbyKillOnTouch.prototype._onWaitUpdate = function () {
    const p = this._player();
    if (!p || !this._inside || !this.enabled) { this._clear(); return; }
    this._tryKill(p);
};

SkateboardObbyKillOnTouch.prototype._clear = function () {
    this._inside = null;
    this._wait(false);
};
