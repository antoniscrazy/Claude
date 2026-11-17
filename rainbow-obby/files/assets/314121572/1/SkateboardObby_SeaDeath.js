/*
 * SkateboardObby_SeaDeath
 * World 2: the sea has no collider, a falling player would keep going and the camera would follow below the water.
 * Reaching the surface splashes and kills there. Runs on the root Sea entity, reads and writes public controller fields only
 * (like FinishJump), PlayerController is unchanged. Local to each client.
 */
var SkateboardObbySeaDeath = pc.createScript('skateboardObbySeaDeath');

SkateboardObbySeaDeath.attributes.add('seaLevel', { type: 'number', default: 10.77, title: 'Sea Level (y)' });
SkateboardObbySeaDeath.attributes.add('splashTime', { type: 'number', default: 0.7, title: 'Splash Time (s)' });
SkateboardObbySeaDeath.attributes.add('splashSize', { type: 'number', default: 9, title: 'Splash Size (m)' });
SkateboardObbySeaDeath.attributes.add('splashHeight', { type: 'number', default: 3.5, title: 'Splash Height (m)' });
SkateboardObbySeaDeath.attributes.add('splashSound', { type: 'string', default: 'waterSplash', title: 'Player Sound Slot' });

SkateboardObbySeaDeath.prototype.initialize = function () {
    this._t = -1;
    this._discMat = this.makeMaterial();
    this._crownMat = this.makeMaterial();
    this._disc = this.makePart('cylinder', this._discMat);
    this._crown = this.makePart('cone', this._crownMat);
    this.on('destroy', () => {
        this._discMat.destroy();
        this._crownMat.destroy();
    });
};

SkateboardObbySeaDeath.prototype.makeMaterial = function () {
    const m = new pc.StandardMaterial();
    m.diffuse.set(1, 1, 1);
    m.emissive.set(0.75, 0.85, 0.9);
    m.useLighting = false;
    m.blendType = pc.BLEND_NORMAL;
    m.opacity = 0;
    m.depthWrite = false;
    m.update();
    return m;
};

SkateboardObbySeaDeath.prototype.makePart = function (type, material) {
    const e = new pc.Entity('Splash_' + type);
    e.addComponent('render', { type: type, castShadows: false, receiveShadows: false });
    e.render.material = material;
    e.enabled = false;
    this.entity.addChild(e);
    return e;
};

SkateboardObbySeaDeath.prototype.update = function (dt) {
    if (this._t >= 0) this.updateSplash(dt);

    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || pcs.isDied) return;
    const p = pcs.entity.getPosition();
    if (p.y >= this.seaLevel) return;

    this.startSplash(p.x, p.z);
    const sound = pcs.entity.sound;
    if (sound && sound.slot(this.splashSound)) sound.play(this.splashSound);
    pcs._falling = false;
    pcs.canDie = true;
    pcs._deathReason = SkateboardObbyPlayerController.DEATH_FALL;
    pcs.died();
};

SkateboardObbySeaDeath.prototype.startSplash = function (x, z) {
    this._t = 0;
    this._disc.setPosition(x, this.seaLevel + 0.05, z);
    this._crown.setPosition(x, this.seaLevel, z);
    this._disc.enabled = true;
    this._crown.enabled = true;
    this.updateSplash(0);
};

SkateboardObbySeaDeath.prototype.updateSplash = function (dt) {
    this._t += dt;
    const u = this._t / this.splashTime;
    if (u >= 1) {
        this._t = -1;
        this._disc.enabled = false;
        this._crown.enabled = false;
        return;
    }
    const out = 1 - (1 - u) * (1 - u);
    const size = this.splashSize * (0.2 + 0.8 * out);
    this._disc.setLocalScale(size, 0.02, size);
    this._discMat.opacity = 0.7 * (1 - u);
    this._discMat.update();

    // the crown rises and sinks back
    const h = this.splashHeight * Math.sin(Math.min(1, u * 1.4) * Math.PI);
    const w = this.splashSize * 0.25 * (0.5 + 0.5 * out);
    this._crown.setLocalScale(w, Math.max(0.01, h), w);
    this._crown.setPosition(this._crown.getPosition().x, this.seaLevel + h * 0.5, this._crown.getPosition().z);
    this._crownMat.opacity = 0.75 * (1 - u);
    this._crownMat.update();
};
