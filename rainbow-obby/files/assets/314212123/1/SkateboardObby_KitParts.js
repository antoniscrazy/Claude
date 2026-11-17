/*
 * SkateboardObby_KitParts
 * World 2: some obstacle kits are one FBX mesh, but one piece of them has to blink or move on its own. The kit mesh is split
 * here into its connected pieces at load (no new asset, no shader). A kit render is shared by all its copies, so the split is
 * cached on the source mesh.
 *   skateboardObbyBarGate  - the ropes / pipes of a gate are shown only while the gate kills (SkateboardObby_Obstacle blink).
 *   skateboardObbyFanLines - the white wind lines of a fan flow along the wind (this entity's +X), from Date.now().
 */
var SkateboardObby_KitParts = {
    // test(min, max, triangles): true = this connected piece goes to the parts. Returns { rest, parts: [{ mesh, center }] }.
    split: function (src, key, test, device) {
        var cache = src.__kitParts || (src.__kitParts = {});
        if (cache[key]) return cache[key];
        var pos = [], idx = [];
        src.getPositions(pos);
        src.getIndices(idx);
        var count = pos.length / 3;
        var parent = new Int32Array(count);
        var weld = new Map();
        var i, t;
        for (i = 0; i < count; i++) {
            parent[i] = i;
            var k = Math.round(pos[i * 3] * 10) + '_' + Math.round(pos[i * 3 + 1] * 10) + '_' + Math.round(pos[i * 3 + 2] * 10);
            if (weld.has(k)) parent[i] = weld.get(k); else weld.set(k, i);
        }
        var find = function (x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
        for (t = 0; t < idx.length; t += 3) {
            var a = find(idx[t]), b = find(idx[t + 1]), c = find(idx[t + 2]);
            parent[a] = b;
            parent[find(c)] = find(b);
        }
        var comps = new Map();
        for (t = 0; t < idx.length; t += 3) {
            var root = find(idx[t]);
            var s = comps.get(root);
            if (!s) { s = { tris: [], min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] }; comps.set(root, s); }
            s.tris.push(idx[t], idx[t + 1], idx[t + 2]);
            for (var v = 0; v < 3; v++) {
                for (var e = 0; e < 3; e++) {
                    var p = pos[idx[t + v] * 3 + e];
                    if (p < s.min[e]) s.min[e] = p;
                    if (p > s.max[e]) s.max[e] = p;
                }
            }
        }
        var rest = [], parts = [];
        comps.forEach(function (s) {
            if (test(s.min, s.max, s.tris.length / 3)) parts.push(s);
            else rest = rest.concat(s.tris);
        });
        var self = this;
        var result = {
            rest: self._mesh(src, rest, device),
            parts: parts.map(function (s) {
                return {
                    mesh: self._mesh(src, s.tris, device),
                    center: new pc.Vec3((s.min[0] + s.max[0]) / 2, (s.min[1] + s.max[1]) / 2, (s.min[2] + s.max[2]) / 2),
                    min: s.min, max: s.max
                };
            })
        };
        cache[key] = result;
        return result;
    },

    merged: function (src, key, test, device) {
        var cache = src.__kitParts || (src.__kitParts = {});
        var mk = key + ':merged';
        if (cache[mk]) return cache[mk];
        var res = this.split(src, key, test, device);
        var idx = [];
        res.parts.forEach(function (p) { var part = []; p.mesh.getIndices(part); idx = idx.concat(part); });
        cache[mk] = { rest: res.rest, mesh: this._mesh(src, idx, device) };
        return cache[mk];
    },

    // the bars pushed out along their normals (welded, so no cracks), same shape as the bars: one draw call per glow layer
    glowMesh: function (src, key, bars, ks, pad, device) {
        var cache = src.__kitParts || (src.__kitParts = {});
        var gk = key + ':glow:' + pad;
        if (cache[gk]) return cache[gk];
        var pos = [], nor = [], tris = [];
        src.getPositions(pos);
        src.getNormals(nor);
        bars.getIndices(tris);
        var count = bars.primitive[0].count;
        var weld = new Map(), remap = new Map(), out = [], idx = [];
        var i, v, k, w;
        var kOf = function (a) { return Math.round(pos[a * 3] * 10) + '_' + Math.round(pos[a * 3 + 1] * 10) + '_' + Math.round(pos[a * 3 + 2] * 10); };
        for (i = 0; i < count; i++) {
            v = tris[i]; k = kOf(v);
            w = weld.get(k);
            if (!w) { w = [0, 0, 0, -1]; weld.set(k, w); }
            if (!remap.has(v)) { remap.set(v, w); w[0] += nor[v * 3]; w[1] += nor[v * 3 + 1]; w[2] += nor[v * 3 + 2]; }
        }
        for (i = 0; i < count; i++) {
            v = tris[i]; w = remap.get(v);
            if (w[3] < 0) {
                var l = Math.hypot(w[0], w[1], w[2]) || 1;
                w[3] = out.length / 3;
                out.push(pos[v * 3] + w[0] / l * pad / ks.x, pos[v * 3 + 1] + w[1] / l * pad / ks.y, pos[v * 3 + 2] + w[2] / l * pad / ks.z);
            }
            idx.push(w[3]);
        }
        var mesh = pc.createMesh(device, out, { normals: pc.calculateNormals(out, idx), indices: idx });
        mesh.incRefCount(); // cached for the copies of the kit
        cache[gk] = mesh;
        return mesh;
    },

    _mesh: function (src, tris, device) {
        var mesh = new pc.Mesh(device);
        var data = src.indexBuffer[0].format === pc.INDEXFORMAT_UINT32 || src.vertexBuffer.numVertices > 65535 ? new Uint32Array(tris) : new Uint16Array(tris);
        var format = data instanceof Uint32Array ? pc.INDEXFORMAT_UINT32 : pc.INDEXFORMAT_UINT16;
        mesh.vertexBuffer = src.vertexBuffer;
        mesh.indexBuffer[0] = new pc.IndexBuffer(device, format, data.length, pc.BUFFER_STATIC, data.buffer);
        mesh.primitive[0] = { type: pc.PRIMITIVE_TRIANGLES, base: 0, baseVertex: 0, count: data.length, indexed: true };
        mesh.aabb = src.aabb;
        mesh.incRefCount(); // cached for the copies of the kit
        return mesh;
    }
};

// ---- gate ----
var SkateboardObbyBarGate = pc.createScript('skateboardObbyBarGate');

SkateboardObbyBarGate.attributes.add('kit', { type: 'entity', title: 'Kit Render' });
SkateboardObbyBarGate.attributes.add('holder', { type: 'entity', title: 'Holder', description: 'SkateboardObby_Obstacle Target: switched on while the gate kills.' });
SkateboardObbyBarGate.attributes.add('minSpan', { type: 'number', default: 700, title: 'Bar Min Span (mesh units)' });
SkateboardObbyBarGate.attributes.add('maxThick', { type: 'number', default: 30, title: 'Bar Max Thickness (mesh units)' });

SkateboardObbyBarGate.attributes.add('maxBarY', { type: 'number', default: 100000, title: 'Bar Max Y (mesh units)', description: 'Only bars below this height blink, higher ones stay in the kit mesh (World 1 Stage 9: bottom rope).' });

SkateboardObbyBarGate.attributes.add('glow', { type: 'asset', assetType: 'material', array: true, title: 'Glow Layers', description: 'Fake glow: the bars pushed out along their normals, one layer per material (inner first). They blink with the bars.' });
SkateboardObbyBarGate.GLOW_PADS = [0.05, 0.1, 0.15]; // metres

SkateboardObbyBarGate.prototype.update = function () {
    if (this._done || !this.kit || !this.holder) return;
    var mis = this.kit.render && this.kit.render.meshInstances;
    if (!mis || !mis.length) return;
    this._done = true;
    var mi = mis[0], span = this.minSpan, thick = this.maxThick, maxY = this.maxBarY;
    var src = mi.mesh, key = 'bars' + maxY;
    var test = function (min, max) {
        return max[0] - min[0] >= span && max[1] - min[1] <= thick && max[1] <= maxY;
    };
    var res = SkateboardObby_KitParts.merged(src, key, test, this.app.graphicsDevice);
    mi.mesh = res.rest;
    var e = new pc.Entity('Bars');
    this.holder.addChild(e);
    e.setPosition(this.kit.getPosition());
    e.setRotation(this.kit.getRotation());
    var ks = this.kit.getWorldTransform().getScale(), hs = this.holder.getWorldTransform().getScale();
    e.setLocalScale(ks.x / (hs.x || 1), ks.y / (hs.y || 1), ks.z / (hs.z || 1));
    e.addComponent('render', { meshInstances: [new pc.MeshInstance(res.mesh, mi.material, e)], castShadows: false, receiveShadows: false });
    if (this.glow && this.glow.length) this._addGlow(e, src, key, res.mesh, { x: ks.x, y: ks.y, z: ks.z });
};

SkateboardObbyBarGate.prototype._addGlow = function (holder, src, key, barMesh, ks) {
    var device = this.app.graphicsDevice;
    var self = this;
    this.glow.forEach(function (asset, i) {
        var pad = SkateboardObbyBarGate.GLOW_PADS[i];
        if (!asset || pad === undefined) return;
        asset.ready(function () {
            if (!holder.parent || !asset.resource) return; // scene changed while it loaded
            var mesh = SkateboardObby_KitParts.glowMesh(src, key, barMesh, ks, pad, device);
            var g = new pc.Entity('Glow_' + (i + 1));
            holder.addChild(g);
            g.addComponent('render', { meshInstances: [new pc.MeshInstance(mesh, asset.resource, g)], castShadows: false, receiveShadows: false });
        });
        self.app.assets.load(asset);
    });
};

// ---- fan ----
var SkateboardObbyFanLines = pc.createScript('skateboardObbyFanLines');

SkateboardObbyFanLines.attributes.add('kit', { type: 'entity', title: 'Kit Render' });
SkateboardObbyFanLines.attributes.add('minX', { type: 'number', default: 190, title: 'Line Min X (mesh units)' });
SkateboardObbyFanLines.attributes.add('minY', { type: 'number', default: 200, title: 'Line Min Y (mesh units)' });
SkateboardObbyFanLines.attributes.add('period', { type: 'number', default: 1.4, title: 'Period (s)' });
SkateboardObbyFanLines.attributes.add('travel', { type: 'number', default: 5, title: 'Travel (m)' });

SkateboardObbyFanLines.prototype.initialize = function () {
    this._lines = null;
    this._dir = new pc.Vec3();
};

SkateboardObbyFanLines.prototype._setup = function () {
    var mis = this.kit && this.kit.render && this.kit.render.meshInstances;
    if (!mis || !mis.length) return;
    var mi = mis[0], minX = this.minX, minY = this.minY;
    var res = SkateboardObby_KitParts.split(mi.mesh, 'lines', function (min) {
        return min[0] >= minX && min[1] >= minY;
    }, this.app.graphicsDevice);
    mi.mesh = res.rest;
    this._body = mi;
    // the wind direction in the kit's local axes, mesh units
    var q = new pc.Quat().copy(this.kit.getRotation()).invert();
    var d = new pc.Vec3();
    this.entity.getWorldTransform().getX(d);
    d.y = 0;
    d.normalize();
    q.transformVector(d, this._dir);
    this._scale = this.kit.getWorldTransform().getScale().x || 1;
    this._lines = [];
    for (var i = 0; i < res.parts.length; i++) {
        var e = new pc.Entity('Line_' + i);
        this.kit.addChild(e);
        var line = new pc.MeshInstance(res.parts[i].mesh, mi.material, e);
        e.addComponent('render', { meshInstances: [line], castShadows: false, receiveShadows: false });
        this._lines.push({ entity: e, mi: line, center: res.parts[i].center, phase: i / res.parts.length });
    }
};

SkateboardObbyFanLines.prototype.update = function () {
    if (!this._lines) { this._setup(); if (!this._lines) return; }
    if (!this._body.visibleThisFrame) return; // off screen
    var t = Date.now() / 1000 / this.period;
    var reach = this.travel / this._scale;
    for (var i = 0; i < this._lines.length; i++) {
        var l = this._lines[i];
        var u = (t + l.phase) % 1;
        var s = Math.sin(Math.PI * u);
        var o = (u - 0.5) * reach;
        var c = l.center, d = this._dir;
        l.entity.setLocalScale(s, s, s);
        l.entity.setLocalPosition(d.x * o + (1 - s) * c.x, d.y * o + (1 - s) * c.y, d.z * o + (1 - s) * c.z);
    }
};
