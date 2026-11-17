/*
 * SkateboardObby_SeaWaves
 * World 2: the Monkey World 2 sea motion without a shader. Runs on the root Sea entity, local to each client,
 * phase from Date.now() so every client sees the same water.
 * - The sea FBX is the Monkey wave frozen at one phase and has no shape keys. The same three Gerstner waves are built here as
 *   morph targets from each vertex UV (u = 0.025 * x + 5, v = 0.025 * z - 4, metres in the FBX). Horizontal only: foam stays on the water.
 * - Shallow water: each island gets a copy of its very-shallow ring in the shallow material, under the masked ring, so that ring can fade
 *   (Monkey W2_Deniz_SigAlt, but sorted instead of pushed down).
 * - Foam: scale pulse around the island, only near the player. The FBX has no foam shape keys.
 * Meshes are set up one per frame as they finish loading. No allocation in the running loop.
 */
var SkateboardObbySeaWaves = pc.createScript('skateboardObbySeaWaves');

SkateboardObbySeaWaves.attributes.add('seaRoot', { type: 'entity', title: 'Sea Root' });
SkateboardObbySeaWaves.attributes.add('islandRoots', { type: 'entity', array: true, title: 'Island Roots', description: 'Parents of the *_Deniz_Sig and *_Deniz_Kopuk meshes.' });
SkateboardObbySeaWaves.attributes.add('underlayMaterial', { type: 'asset', assetType: 'material', title: 'Underlay Material' });
SkateboardObbySeaWaves.attributes.add('waves', { type: 'boolean', default: true, title: 'Waves' });
SkateboardObbySeaWaves.attributes.add('period', { type: 'number', default: 6, title: 'Period (s)' });
SkateboardObbySeaWaves.attributes.add('waveScale', { type: 'number', default: 0.7, title: 'Wave Scale' });
SkateboardObbySeaWaves.attributes.add('foamAmplitude', { type: 'number', default: 1.2, title: 'Foam Amplitude (m)' });
SkateboardObbySeaWaves.attributes.add('foamRange', { type: 'number', default: 220, title: 'Foam Range (m)' });

// k = cycles per 400 m in the FBX, h = horizontal amplitude in m, ph = phase of the frozen frame
SkateboardObbySeaWaves.WAVES = [
    { kx: 7, kz: -4, h: 0.451, ph: -0.3 },
    { kx: 3, kz: 8, h: 0.349, ph: 2.104 },
    { kx: 9, kz: 3, h: 0.2205, ph: 1.904 }
];

SkateboardObbySeaWaves.prototype.initialize = function () {
    var device = this.app.graphicsDevice;
    this._canMorph = this.waves && !!(device.textureHalfFloatRenderable || device.textureFloatRenderable);
    this._pending = [];
    this._morphs = [];
    this._foams = [];
    this._retry = 0;

    var i, e, name;
    if (this.seaRoot) {
        for (i = 0; i < this.seaRoot.children.length; i++) {
            e = this.seaRoot.children[i];
            if (e.render) this._pending.push({ entity: e, underlay: false });
        }
    }
    for (var r = 0; r < this.islandRoots.length; r++) {
        var root = this.islandRoots[r];
        if (!root) continue;
        for (i = 0; i < root.children.length; i++) {
            e = root.children[i];
            name = e.name;
            if (!e.render) continue;
            if (/_Deniz_Sig$/.test(name)) this._pending.push({ entity: e, underlay: true });
            else if (/_Deniz_Kopuk$/.test(name)) this._foams.push({ entity: e, x: 0, z: 0, lx: 0, ly: 0, lz: 0, cx: 0, cz: 0, gain: 0, phase: this._foams.length * 1.1, on: false });
        }
    }

    var asset = this.underlayMaterial;
    if (asset && !asset.loaded) this.app.assets.load(asset);

    this.on('destroy', function () {
        for (var k = 0; k < this._foams.length; k++) {
            if (this._foams[k].on) this._resetFoam(this._foams[k]);
        }
    }, this);
};

SkateboardObbySeaWaves.prototype._buildMorph = function (mesh) {
    var uv = [];
    var count = mesh.getUvs(0, uv);
    var a = new Float32Array(count * 3);
    var b = new Float32Array(count * 3);
    var waves = SkateboardObbySeaWaves.WAVES;
    var gain = 100 * this.waveScale; // metres in the FBX to mesh units (cm)
    for (var i = 0; i < count; i++) {
        var x = (uv[i * 2] - 5) / 0.025;
        var z = (uv[i * 2 + 1] + 4) / 0.025;
        var ax = 0, az = 0, bx = 0, bz = 0;
        for (var w = 0; w < waves.length; w++) {
            var wave = waves[w];
            var len = Math.sqrt(wave.kx * wave.kx + wave.kz * wave.kz);
            var hx = wave.h * wave.kx / len, hz = wave.h * wave.kz / len;
            var th = 2 * Math.PI * (wave.kx * x + wave.kz * z) / 400 - wave.ph;
            var sn = Math.sin(th), cs = Math.cos(th);
            ax -= hx * sn; az -= hz * sn;
            bx += hx * cs; bz += hz * cs;
        }
        a[i * 3] = ax * gain; a[i * 3 + 2] = az * gain;
        b[i * 3] = bx * gain; b[i * 3 + 2] = bz * gain;
    }
    var targets = [
        new pc.MorphTarget({ name: 'Wave_Rest', deltaPositions: a }),
        new pc.MorphTarget({ name: 'Wave_Quad', deltaPositions: b })
    ];
    return new pc.Morph(targets, this.app.graphicsDevice);
};

SkateboardObbySeaWaves.prototype._addUnderlay = function (item, mesh) {
    var asset = this.underlayMaterial;
    if (!asset || !asset.resource) return null;
    var e = new pc.Entity('SigUnderlay');
    item.entity.addChild(e);
    var mi = new pc.MeshInstance(mesh, asset.resource, e);
    // drawn before the masked rings of the same island
    mi.calculateSortDistance = function (drawCall, camPos, camFwd) {
        var c = drawCall.aabb.center;
        return (c.x - camPos.x) * camFwd.x + (c.y - camPos.y) * camFwd.y + (c.z - camPos.z) * camFwd.z + 40;
    };
    e.addComponent('render', { meshInstances: [mi], castShadows: false, receiveShadows: false });
    return mi;
};

SkateboardObbySeaWaves.prototype._setup = function (item) {
    var render = item.entity.render;
    var mis = render && render.meshInstances;
    if (!mis || !mis.length) return false;
    var last = mis[mis.length - 1];
    var under = null;
    if (item.underlay) {
        if (!this.underlayMaterial || !this.underlayMaterial.resource) return false;
        under = this._addUnderlay(item, last.mesh);
    }
    if (!this._canMorph) return true;

    var morph = last.mesh.morph || this._buildMorph(last.mesh);
    if (morph.intRenderFormat) { this._canMorph = false; return true; }
    var instance = new pc.MorphInstance(morph);
    // the prims share one vertex buffer, so one morph instance serves all of them
    for (var i = 0; i < mis.length; i++) {
        mis[i].mesh.morph = morph;
        mis[i].morphInstance = instance;
    }
    if (under) under.morphInstance = instance;
    this._morphs.push(instance);
    return true;
};

SkateboardObbySeaWaves.prototype._resetFoam = function (foam) {
    foam.entity.setLocalScale(1, 1, 1);
    foam.entity.setLocalPosition(foam.lx, foam.ly, foam.lz);
    foam.on = false;
};

SkateboardObbySeaWaves.prototype._setupFoamGain = function (foam) {
    var mis = foam.entity.render.meshInstances;
    var mi = mis && mis[0];
    if (!mi) return false;
    var he = mi.aabb.halfExtents;
    foam.gain = this.foamAmplitude / Math.max(he.x, he.z, 1);
    foam.x = mi.aabb.center.x;
    foam.z = mi.aabb.center.z;
    // the hub's node sits at the pack origin, far from its mesh: pulse around the mesh centre
    var lp = foam.entity.getLocalPosition();
    foam.lx = lp.x; foam.ly = lp.y; foam.lz = lp.z;
    foam.cx = mi.mesh.aabb.center.x;
    foam.cz = mi.mesh.aabb.center.z;
    return true;
};

SkateboardObbySeaWaves.prototype.update = function (dt) {
    if (this._pending.length) {
        this._retry -= dt;
        if (this._retry <= 0) {
            var item = this._pending[0];
            if (this._setup(item)) this._pending.shift();
            else {
                this._pending.push(this._pending.shift());
                this._retry = 0.25;
            }
        }
    }

    var periodMs = this.period * 1000;
    var psi = 2 * Math.PI * (Date.now() % periodMs) / periodMs;
    var rest = Math.cos(psi) - 1, quad = Math.sin(psi);

    for (var i = 0; i < this._morphs.length; i++) {
        this._morphs[i].setWeight(0, rest);
        this._morphs[i].setWeight(1, quad);
    }

    var pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || !this.foamAmplitude) return;
    var p = pcs.entity.getPosition();
    var range2 = this.foamRange * this.foamRange;
    for (var f = 0; f < this._foams.length; f++) {
        var foam = this._foams[f];
        if (!foam.gain && !this._setupFoamGain(foam)) continue;
        var dx = foam.x - p.x, dz = foam.z - p.z;
        if (dx * dx + dz * dz > range2) {
            if (foam.on) this._resetFoam(foam);
            continue;
        }
        var s = 1 + foam.gain * Math.sin(psi + foam.phase);
        foam.entity.setLocalScale(s, 1, s);
        foam.entity.setLocalPosition(foam.lx + (1 - s) * foam.cx, foam.ly, foam.lz + (1 - s) * foam.cz);
        foam.on = true;
    }
};
