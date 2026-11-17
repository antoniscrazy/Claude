// Simple grip bar and the OUT OF GRIP message. Reads the controller, writes only when a value changes.
var SpiderObbyGripHud = pc.createScript('spiderObbyGripHud');

SpiderObbyGripHud.attributes.add('fill', { type: 'entity', title: 'Bar Fill' });
SpiderObbyGripHud.attributes.add('label', { type: 'entity', title: 'Label' });
SpiderObbyGripHud.attributes.add('emptyMessage', { type: 'entity', title: 'Out Of Grip Message' });
SpiderObbyGripHud.attributes.add('lowRatio', { type: 'number', default: 0.35, title: 'Low Ratio', description: 'The bar turns yellow below this.' });
SpiderObbyGripHud.attributes.add('criticalRatio', { type: 'number', default: 0.15, title: 'Critical Ratio', description: 'The bar turns red below this.' });

SpiderObbyGripHud.prototype.initialize = function () {
    this.shownGrip = -1;
    this.shownMax = -1;
    this.shownRatio = -1;
    this.band = -1;
    this.colors = [new pc.Color(0.15, 0.62, 1), new pc.Color(1, 0.8, 0.12), new pc.Color(1, 0.22, 0.16)];
    this.fillScale = this.fill.getLocalScale().clone();
    if (this.emptyMessage) this.emptyMessage.enabled = false;

    this.app.on('spider:gripEmpty', this.onEmpty, this);
    this.app.on('spider:gripRecovered', this.onRecovered, this);
    this.app.on('PlayerDied', this.onRecovered, this);
    this.on('destroy', function () {
        this.app.off('spider:gripEmpty', this.onEmpty, this);
        this.app.off('spider:gripRecovered', this.onRecovered, this);
        this.app.off('PlayerDied', this.onRecovered, this);
    }, this);
};

SpiderObbyGripHud.prototype.onEmpty = function () {
    if (this.emptyMessage) this.emptyMessage.enabled = true;
};

SpiderObbyGripHud.prototype.onRecovered = function () {
    if (this.emptyMessage) this.emptyMessage.enabled = false;
};

SpiderObbyGripHud.prototype.update = function () {
    const controller = this.app.spiderObbyPlayerController;
    if (!controller) return;
    const grip = Math.ceil(controller.grip), max = Math.round(controller.maxGrip);
    if (grip === this.shownGrip && max === this.shownMax) return;
    this.shownGrip = grip;
    this.shownMax = max;

    this.label.element.text = 'GRIP ' + grip + '/' + max;

    const ratio = max > 0 ? pc.math.clamp(controller.grip / max, 0, 1) : 0;
    this.fill.setLocalScale(this.fillScale.x * ratio, this.fillScale.y, this.fillScale.z);

    const band = ratio <= this.criticalRatio ? 2 : ratio <= this.lowRatio ? 1 : 0;
    if (band !== this.band) {
        this.band = band;
        this.fill.element.color = this.colors[band];
    }
};
