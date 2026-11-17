// A hook the arms can grab (MonkeyObby_SwingPoint pattern). The list lives in app.spiderObbySwingPoints.
var SpiderObbySwingPoint = pc.createScript('spiderObbySwingPoint');

SpiderObbySwingPoint.attributes.add('highlightEntity', { type: 'entity', title: 'Highlight Entity', description: 'Turned on while this hook is the target. Empty = a child named "Highlight".' });
SpiderObbySwingPoint.attributes.add('anchorOffset', { type: 'vec3', default: [0, 0, 0], title: 'Anchor Offset', description: 'Where the hands hold, local to this entity.' });
SpiderObbySwingPoint.attributes.add('ropeLength', { type: 'number', default: 0, title: 'Arm Length', description: 'Distance held from the hook (m). 0 = Swing Controller Max Arm Length.' });
SpiderObbySwingPoint.attributes.add('grabRadiusOverride', { type: 'number', default: 0, title: 'Grab Radius Override', description: '0 = Swing Controller Grab Range.' });
SpiderObbySwingPoint.attributes.add('grabbable', { type: 'boolean', default: true, title: 'Grabbable' });
SpiderObbySwingPoint.attributes.add('launchSpeedMin', { type: 'number', default: 0, title: 'Launch Speed Min', description: '0 = Swing Controller value.' });
SpiderObbySwingPoint.attributes.add('launchSpeedMax', { type: 'number', default: 0, title: 'Launch Speed Max', description: '0 = Swing Controller value.' });
SpiderObbySwingPoint.attributes.add('launchAngleMin', { type: 'number', default: 0, title: 'Launch Angle Min (deg)', description: '0 = Swing Controller value.' });
SpiderObbySwingPoint.attributes.add('launchAngleMax', { type: 'number', default: 0, title: 'Launch Angle Max (deg)', description: '0 = Swing Controller value.' });
SpiderObbySwingPoint.attributes.add('pulseScale', { type: 'number', default: 0.15, title: 'Pulse Scale' });
SpiderObbySwingPoint.attributes.add('pulseSpeed', { type: 'number', default: 5, title: 'Pulse Speed' });

SpiderObbySwingPoint.prototype.initialize = function () {
    this._anchor = new pc.Vec3();
    this._scale = new pc.Vec3();
    this._highlighted = false;
    this._pulse = 0;
    this.highlight = this.highlightEntity || this.entity.findByName('Highlight');
    if (this.highlight) {
        this._baseScale = this.highlight.getLocalScale().clone();
        this.highlight.enabled = false;
    }
    if (!this.app.spiderObbySwingPoints) this.app.spiderObbySwingPoints = [];
    this.app.spiderObbySwingPoints.push(this);
    this.on('destroy', function () {
        const list = this.app.spiderObbySwingPoints;
        const i = list ? list.indexOf(this) : -1;
        if (i !== -1) list.splice(i, 1);
    }, this);
};

// The returned vector belongs to this script.
SpiderObbySwingPoint.prototype.getAnchorPosition = function () {
    if (this.anchorOffset.lengthSq() > 0) this.entity.getWorldTransform().transformPoint(this.anchorOffset, this._anchor);
    else this._anchor.copy(this.entity.getPosition());
    return this._anchor;
};

SpiderObbySwingPoint.prototype.isAvailable = function () {
    return this.grabbable === true && this.enabled === true && this.entity.enabled === true;
};

SpiderObbySwingPoint.prototype.setHighlight = function (state) {
    if (this._highlighted === state) return;
    this._highlighted = state;
    this._pulse = 0;
    if (!this.highlight) return;
    this.highlight.enabled = state;
    if (!state) this.highlight.setLocalScale(this._baseScale);
};

SpiderObbySwingPoint.prototype.update = function (dt) {
    if (!this._highlighted || !this.highlight) return;
    this._pulse += dt;
    const f = 1 + Math.sin(this._pulse * this.pulseSpeed) * this.pulseScale;
    this._scale.copy(this._baseScale).mulScalar(f);
    this.highlight.setLocalScale(this._scale);
};
