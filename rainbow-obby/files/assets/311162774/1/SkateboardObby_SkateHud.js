/*
 * SkateboardObby_SkateHud
 * Speed meter ("Speed: XX" + segmented bar) and boost button with cooldown.
 * Reads app.skateSpeed / app.skateBoost written by SkateboardObby_PlayerController.
 */
var SkateboardObbySkateHud = pc.createScript('skateboardObbySkateHud');

SkateboardObbySkateHud.attributes.add('speedText', { type: 'entity', title: 'Speed Text' });
SkateboardObbySkateHud.attributes.add('segmentsParent', { type: 'entity', title: 'Segments Parent' });
SkateboardObbySkateHud.attributes.add('boostButton', { type: 'entity', title: 'Boost Button' });
SkateboardObbySkateHud.attributes.add('boostCooldownFill', { type: 'entity', title: 'Boost Cooldown Fill' });
SkateboardObbySkateHud.attributes.add('maxDisplaySpeed', { type: 'number', default: 96, title: 'Speed for full bar' });
SkateboardObbySkateHud.attributes.add('label', { type: 'string', default: 'Speed: ', title: 'Label' });

SkateboardObbySkateHud.prototype.initialize = function () {
    this.segments = this.segmentsParent ? this.segmentsParent.children.filter(c => c.element) : [];
    this.offColor = new pc.Color(0.15, 0.15, 0.2, 0.6);
    this.segmentColors = this.segments.map((s, i) => {
        const t = this.segments.length > 1 ? i / (this.segments.length - 1) : 0;
        // green -> yellow -> orange -> red
        if (t < 0.5) return new pc.Color(0.25 + t * 1.5, 0.9, 0.2, 1);
        return new pc.Color(1, 0.9 - (t - 0.5) * 1.6, 0.15, 1);
    });
    this._shownSpeed = -1;

    if (this.boostButton && this.boostButton.button) {
        this.boostButton.button.on('click', () => this.app.fire('skate:boost'), this);
    }
    this.app.on('skate:boosted', this.onBoosted, this);
    this.on('destroy', () => {
        this.app.off('skate:boosted', this.onBoosted, this);
    });
};

SkateboardObbySkateHud.prototype.onBoosted = function () {
    if (!this.boostButton) return;
    this.boostButton.setLocalScale(1.25, 1.25, 1.25);
};

SkateboardObbySkateHud.prototype.update = function (dt) {
    const speed = this.app.skateSpeed || 0;

    if (speed !== this._shownSpeed) {
        this._shownSpeed = speed;
        if (this.speedText && this.speedText.element) {
            this.speedText.element.text = this.label + speed;
        }
        const lit = Math.ceil(pc.math.clamp(speed / this.maxDisplaySpeed, 0, 1) * this.segments.length);
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].element.color = i < lit ? this.segmentColors[i] : this.offColor;
        }
    }

    // boost button cooldown
    const boost = this.app.skateBoost;
    if (boost && this.boostCooldownFill && this.boostCooldownFill.element) {
        const t = boost.cooldownMax > 0 ? boost.cooldown / boost.cooldownMax : 0;
        this.boostCooldownFill.enabled = t > 0;
        this.boostCooldownFill.setLocalScale(1, t, 1);
    }

    if (this.boostButton) {
        const s = this.boostButton.getLocalScale().x;
        if (s > 1) {
            const ns = Math.max(1, s - dt * 1.5);
            this.boostButton.setLocalScale(ns, ns, ns);
        }
    }
};
