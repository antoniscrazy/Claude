/*
 * SkateboardObby_SandCastle
 * World 2 sand castle (W2_Stage_<n>_Engel_Kum_Kalesi): the board rides through it, the FBX clip (Yikilma, 2 s) plays once
 * and the rider loses a little speed. It does not kill. Local to each client, like the bowling pins.
 * Sits on StageLogic/Stage_<n>/Sand_...; Rig = the castle's rig node, its bones are matched to the clip curves by name.
 * The castle stands up again resetDelay seconds after the hit once the player is resetDistance away, on respawn and when
 * its chunk closes.
 */
var SkateboardObbySandCastle = pc.createScript('skateboardObbySandCastle');

SkateboardObbySandCastle.attributes.add('rig', { type: 'entity', title: 'Rig', description: 'Rig node of the castle (bones below it).' });
SkateboardObbySandCastle.attributes.add('clip', { type: 'asset', assetType: 'animation', title: 'Collapse Clip' });
SkateboardObbySandCastle.attributes.add('halfExtents', { type: 'vec3', default: [5.2, 3, 2.2], title: 'Zone Half Extents (m)' });
SkateboardObbySandCastle.attributes.add('offset', { type: 'vec3', default: [0, 2.5, 0], title: 'Zone Offset (m)' });
SkateboardObbySandCastle.attributes.add('speedLoss', { type: 'number', default: 0.1, min: 0, max: 1, title: 'Speed Loss' });
SkateboardObbySandCastle.attributes.add('hitSound', { type: 'asset', assetType: 'audio', title: 'Hit Sound' });
SkateboardObbySandCastle.attributes.add('hitVolume', { type: 'number', default: 0.4, title: 'Hit Volume' });
SkateboardObbySandCastle.attributes.add('startTime', { type: 'number', default: 0.45, min: 0, title: 'Clip Start (s)', description: 'The clip waits before the castle falls: the hit starts it here.' });
SkateboardObbySandCastle.attributes.add('clipSpeed', { type: 'number', default: 1.5, min: 0.1, title: 'Clip Speed' });
SkateboardObbySandCastle.attributes.add('resetDelay', { type: 'number', default: 4, title: 'Reset Delay (s)' });
SkateboardObbySandCastle.attributes.add('resetDistance', { type: 'number', default: 25, title: 'Reset Distance (m)' });

SkateboardObbySandCastle.prototype.initialize = function () {
    this.player = this.app.root.findByName('Player');
    this._v = new pc.Vec3();
    this._a = new pc.Vec3();
    this._q = new pc.Quat();
    this._qA = new pc.Quat();
    this._qB = new pc.Quat();
    this._inv = new pc.Mat4();
    this._channels = null;
    this._rest = null;
    this._dur = 0;
    this._t = 0;
    this._hit = false;
    this._since = 0;
    this._inv.copy(this.entity.getWorldTransform()).invert();

    if (this.hitSound) {
        if (!this.entity.sound) this.entity.addComponent('sound', { positional: false });
        this.entity.sound.addSlot('hit', { asset: this.hitSound.id, volume: this.hitVolume, overlap: true, autoPlay: false });
    }

    const asset = this.clip;
    if (asset) {
        const ready = (a) => { if (this.entity && this.entity.script) this.buildChannels(a.resource); };
        if (asset.loaded) ready(asset);
        else { asset.ready(ready); this.app.assets.load(asset); }
    }

    this._onRespawn = () => this.reset();
    this.app.on('Respawned', this._onRespawn, this);
    this.on('disable', () => this.reset());
    this.on('destroy', () => this.app.off('Respawned', this._onRespawn, this));
};

SkateboardObbySandCastle.prototype.buildChannels = function (track) {
    if (!track || !track.curves || !this.rig) return;
    const byName = {};
    this.rig.forEach((n) => { const b = n.name.replace(/\.\d+$/, ''); if (!byName[b]) byName[b] = n; });
    const ch = [], rest = [];
    for (let i = 0; i < track.curves.length; i++) {
        const curve = track.curves[i];
        const input = track.inputs[curve.input], output = track.outputs[curve.output];
        for (let j = 0; j < curve.paths.length; j++) {
            const path = curve.paths[j];
            const ep = path.entityPath;
            const node = byName[String(ep[ep.length - 1]).replace(/\.\d+$/, '')];
            if (!node) continue;
            const prop = path.propertyPath[0];
            const kind = prop === 'localPosition' ? 0 : prop === 'localRotation' ? 1 : prop === 'localScale' ? 2 : -1;
            if (kind < 0) continue;
            ch.push({ node: node, kind: kind, t: input.data, v: output.data, c: output.components });
            if (!rest.some(r => r.node === node)) rest.push({ node: node, p: node.getLocalPosition().clone(), r: node.getLocalRotation().clone(), s: node.getLocalScale().clone() });
        }
    }
    this._channels = ch;
    this._rest = rest;
    this._dur = track.duration || 0;
};

SkateboardObbySandCastle.prototype.sample = function (time) {
    const chs = this._channels;
    for (let i = 0; i < chs.length; i++) {
        const ch = chs[i], t = ch.t, n = t.length;
        let k = 0;
        while (k < n - 2 && t[k + 1] <= time) k++;
        let u = 0;
        if (n > 1) { const t0 = t[k], t1 = t[k + 1]; u = t1 > t0 ? Math.min(1, Math.max(0, (time - t0) / (t1 - t0))) : 0; }
        const c = ch.c, v = ch.v, a = k * c, b = Math.min(k + 1, n - 1) * c;
        if (ch.kind === 1) {
            this._qA.set(v[a], v[a + 1], v[a + 2], v[a + 3]);
            this._qB.set(v[b], v[b + 1], v[b + 2], v[b + 3]);
            this._qA.slerp(this._qA, this._qB, u);
            ch.node.setLocalRotation(this._qA);
        } else {
            const x = v[a] + (v[b] - v[a]) * u, y = v[a + 1] + (v[b + 1] - v[a + 1]) * u, z = v[a + 2] + (v[b + 2] - v[a + 2]) * u;
            if (ch.kind === 0) ch.node.setLocalPosition(x, y, z);
            else ch.node.setLocalScale(x, y, z);
        }
    }
};

SkateboardObbySandCastle.prototype.reset = function () {
    if (!this._hit) return;
    this._hit = false;
    this._t = 0;
    if (this._rest) for (let i = 0; i < this._rest.length; i++) { const r = this._rest[i]; r.node.setLocalPosition(r.p); r.node.setLocalRotation(r.r); r.node.setLocalScale(r.s); }
};

SkateboardObbySandCastle.prototype.update = function (dt) {
    if (!this.player) return;
    const p = this.player.getPosition();
    if (this._hit) {
        this._since += dt;
        if (this._channels && this._t < this._dur) { this._t = Math.min(this._dur, this._t + dt * this.clipSpeed); this.sample(this._t); }
        if (this._since > this.resetDelay && this._v.sub2(p, this.entity.getPosition()).lengthSq() > this.resetDistance * this.resetDistance) this.reset();
        return;
    }
    this._inv.transformPoint(p, this._a);
    const h = this.halfExtents, o = this.offset;
    if (Math.abs(this._a.x - o.x) > h.x || Math.abs(this._a.y - o.y) > h.y || Math.abs(this._a.z - o.z) > h.z) return;
    this._hit = true;
    this._since = 0;
    this._t = this.startTime;
    if (this._channels) this.sample(this._t);
    const pcs = this.app.skateboardObbyPlayerController;
    if (pcs && pcs.speed > 0) pcs.speed *= 1 - this.speedLoss;
    if (this.entity.sound && this.entity.sound.slot('hit')) this.entity.sound.play('hit');
};
