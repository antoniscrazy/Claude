// Short lived +N at the point where an arm landed. A fixed pool of screen texts; nothing is created after initialize.
var SpiderObbyStepPopups = pc.createScript('spiderObbyStepPopups');

SpiderObbyStepPopups.attributes.add('template', { type: 'entity', title: 'Template', description: 'A disabled text element, cloned at initialize.' });
SpiderObbyStepPopups.attributes.add('screenEntity', { type: 'entity', title: 'Screen' });
SpiderObbyStepPopups.attributes.add('cameraEntity', { type: 'entity', title: 'Camera' });
SpiderObbyStepPopups.attributes.add('poolSize', { type: 'number', default: 6, title: 'Pool Size', description: 'At most this many at once; when all are busy a step shows nothing (the XP still counts).' });
SpiderObbyStepPopups.attributes.add('lifetime', { type: 'number', default: 0.6, title: 'Lifetime' });
SpiderObbyStepPopups.attributes.add('rise', { type: 'number', default: 44, title: 'Rise', description: 'Screen units over the lifetime.' });
SpiderObbyStepPopups.attributes.add('maxDistance', { type: 'number', default: 45, title: 'Max Distance', description: 'Steps farther from the camera show nothing (m).' });
SpiderObbyStepPopups.attributes.add('mobileScale', { type: 'number', default: 1.3, title: 'Mobile Scale' });

SpiderObbyStepPopups.prototype.initialize = function () {
    this.pool = [];
    this.template.enabled = false;
    const size = Math.max(1, Math.round(this.poolSize));
    for (let i = 0; i < size; i++) {
        const entity = this.template.clone();
        entity.name = 'Popup_' + i;
        this.entity.addChild(entity);
        entity.enabled = false;
        this.pool.push({ entity: entity, point: new pc.Vec3(), age: 0, active: false, text: '', scale: 1 });
    }
    this.activeCount = 0;
    this._screen = new pc.Vec3();
    this._toPoint = new pc.Vec3();
    this.app.on('spider:xp', this.onXp, this);
    this.on('destroy', function () {
        this.app.off('spider:xp', this.onXp, this);
    }, this);
};

// Screen units from the camera's own axes (worldToScreen keeps the view of the last render).
// False: behind the camera, too far or off the screen.
SpiderObbyStepPopups.prototype.project = function (point, out) {
    const camera = this.cameraEntity, to = this._toPoint;
    to.sub2(point, camera.getPosition());
    const depth = to.dot(camera.forward);
    if (depth < 0.5 || to.lengthSq() > this.maxDistance * this.maxDistance) return false;
    const device = this.app.graphicsDevice;
    const halfHeight = depth * Math.tan(camera.camera.fov * 0.5 * pc.math.DEG_TO_RAD);
    const nx = to.dot(camera.right) / (halfHeight * device.width / device.height);
    const ny = to.dot(camera.up) / halfHeight;
    if (nx < -1 || nx > 1 || ny < -1 || ny > 1) return false;
    const scale = this.screenEntity.screen.scale;
    out.x = (nx + 1) * 0.5 * device.width / scale;
    out.y = (ny + 1) * 0.5 * device.height / scale;
    return true;
};

SpiderObbyStepPopups.prototype.onXp = function (amount, point) {
    if (this.activeCount >= this.pool.length) return;
    if (!this.project(point, this._screen)) return;
    // a free text that already shows this value needs no text rebuild
    const text = '+' + amount;
    let item = null;
    for (let i = 0; i < this.pool.length; i++) {
        const candidate = this.pool[i];
        if (candidate.active) continue;
        if (!item) item = candidate;
        if (candidate.text === text) { item = candidate; break; }
    }
    if (!item) return;
    if (item.text !== text) {
        item.text = text;
        item.entity.element.text = text;
    }
    item.point.copy(point);
    item.age = 0;
    item.active = true;
    item.scale = this.app.isMobile ? this.mobileScale : 1;
    this.activeCount++;
    item.entity.enabled = true;
    this.place(item);
};

SpiderObbyStepPopups.prototype.place = function (item) {
    const t = item.age / this.lifetime;
    if (t >= 1 || !this.project(item.point, this._screen)) {
        item.active = false;
        item.entity.enabled = false;
        this.activeCount--;
        return;
    }
    const entity = item.entity;
    entity.setLocalPosition(this._screen.x, this._screen.y + this.rise * t, 0);
    const pop = (t < 0.2 ? 0.6 + t * 2 : 1) * item.scale;
    entity.setLocalScale(pop, pop, pop);
    entity.element.opacity = t > 0.65 ? (1 - t) / 0.35 : 1;
};

// after the camera moved, so the text sits on the point
SpiderObbyStepPopups.prototype.postUpdate = function (dt) {
    if (this.activeCount === 0) return;
    for (let i = 0; i < this.pool.length; i++) {
        const item = this.pool[i];
        if (!item.active) continue;
        item.age += dt;
        this.place(item);
    }
};
