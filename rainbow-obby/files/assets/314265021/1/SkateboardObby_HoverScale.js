// Small UI pattern: an element grows a little while the mouse is over it or a finger holds it, and comes back when it leaves.
// Put it on any entity with an element that has Use Input on (a button, a card). No per-frame work when nothing moves, no allocation.
// The mouse does nothing while the pointer is locked (during play).
var SkateboardObbyHoverScale = pc.createScript('skateboardObbyHoverScale');

SkateboardObbyHoverScale.attributes.add('scale', { type: 'number', default: 1.1, title: 'Scale', description: 'Size while hovered / held, 1 = same.' });
SkateboardObbyHoverScale.attributes.add('time', { type: 'number', default: 0.12, title: 'Time (s)' });

SkateboardObbyHoverScale.prototype.initialize = function () {
    this.base = this.entity.getLocalScale().x;
    this.current = 1;
    this.target = 1;
    const el = this.entity.element;
    if (!el) return;
    el.on('mouseenter', this.onMouseEnter, this);
    el.on('mouseleave', this.shrink, this);
    el.on('touchstart', this.grow, this);
    el.on('touchend', this.shrink, this);
    el.on('touchcancel', this.shrink, this);
    el.on('touchleave', this.shrink, this);
    this.on('disable', this.reset, this);
    this.on('destroy', function () {
        el.off('mouseenter', this.onMouseEnter, this);
        el.off('mouseleave', this.shrink, this);
        el.off('touchstart', this.grow, this);
        el.off('touchend', this.shrink, this);
        el.off('touchcancel', this.shrink, this);
        el.off('touchleave', this.shrink, this);
    }, this);
};

SkateboardObbyHoverScale.prototype.onMouseEnter = function () {
    if (!pc.Mouse.isPointerLocked()) this.grow();
};

SkateboardObbyHoverScale.prototype.grow = function () {
    this.target = this.scale;
};

SkateboardObbyHoverScale.prototype.shrink = function () {
    this.target = 1;
};

// hidden while grown: no leave event comes, so it opens at its normal size next time
SkateboardObbyHoverScale.prototype.reset = function () {
    this.target = 1;
    this.current = 1;
    this.entity.setLocalScale(this.base, this.base, this.base);
};

SkateboardObbyHoverScale.prototype.update = function (dt) {
    if (this.current === this.target) return;
    const _step = Math.abs(this.scale - 1) / Math.max(0.001, this.time) * dt;
    const _left = this.target - this.current;
    this.current = Math.abs(_left) <= _step ? this.target : this.current + Math.sign(_left) * _step;
    const _s = this.base * this.current;
    this.entity.setLocalScale(_s, _s, _s);
};
