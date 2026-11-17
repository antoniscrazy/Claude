// SkateboardObby_InfiniteOcean.js
// World 2: endless flat sea under the camera, a copy of MonkeyObby_InfiniteOcean.js with the map's UV axes.
// - Follows the camera on X/Z, snapped to the texture repeat, so the pattern stays fixed in the world and lines up with the near sea.
// - Its far edge melts into the horizon through the scene fog.
// - The map is rotated 90 degrees and scaled 2x: u = 5 - 0.0125 * z, v = -4.81 + 0.0125 * x.
// - Cost: 1 draw call, 2 triangles, one setPosition only when the snap changes.
var SkateboardObbyInfiniteOcean = pc.createScript('skateboardObbyInfiniteOcean');

SkateboardObbyInfiniteOcean.attributes.add('material', { type: 'asset', assetType: 'material', title: 'Material', description: 'Deep sea material (same as the near sea).' });
SkateboardObbyInfiniteOcean.attributes.add('size', { type: 'number', default: 1100, min: 10, title: 'Size (m)', description: 'Edge length. Camera farClip * 2 + a margin.' });
SkateboardObbyInfiniteOcean.attributes.add('height', { type: 'number', default: 10.02, title: 'Water Y', description: 'Must stay under the wave troughs of the near sea.' });
SkateboardObbyInfiniteOcean.attributes.add('uvScale', { type: 'number', default: 0.0125, title: 'UV / metre' });
SkateboardObbyInfiniteOcean.attributes.add('uvOffset', { type: 'vec2', default: [5, -4.81], title: 'UV Offset' });

SkateboardObbyInfiniteOcean.prototype.initialize = function () {
    this._snap = 0;
    this._lastX = NaN;
    this._lastZ = NaN;
    this._cam = null;
    this._camCheck = 0;

    this._buildMesh();
    this._bindMaterial();

    this.on('destroy', function () {
        if (this._mesh) { this._mesh.destroy(); this._mesh = null; }
    }, this);
};

SkateboardObbyInfiniteOcean.prototype._buildMesh = function () {
    var h = this.size * 0.5;
    var s = this.uvScale;
    var ou = this.uvOffset.x, ov = this.uvOffset.y;
    var positions = [-h, 0, -h,  h, 0, -h,  h, 0, h,  -h, 0, h];
    var normals = [0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0];
    var uvs = [];
    for (var i = 0; i < 4; i++) {
        uvs.push(ou - positions[i * 3 + 2] * s, ov + positions[i * 3] * s);
    }
    var indices = [0, 2, 1, 0, 3, 2];

    var mesh = new pc.Mesh(this.app.graphicsDevice);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update(pc.PRIMITIVE_TRIANGLES);
    mesh.incRefCount();
    this._mesh = mesh;

    this._meshInstance = new pc.MeshInstance(mesh, this._material || new pc.StandardMaterial());
    this.entity.addComponent('render', {
        meshInstances: [this._meshInstance],
        castShadows: false,
        receiveShadows: false
    });
};

SkateboardObbyInfiniteOcean.prototype._bindMaterial = function () {
    var asset = this.material;
    if (!asset) return;
    var self = this;
    var apply = function () {
        if (!asset.resource || !self._meshInstance) return;
        self._material = asset.resource;
        self._meshInstance.material = self._material;
        self._updateSnap();
        self._lastX = NaN;
    };
    if (asset.loaded) apply();
    else { asset.ready(apply); this.app.assets.load(asset); }
};

// One full texture repeat in metres: 1 / (uvScale * tiling)
SkateboardObbyInfiniteOcean.prototype._updateSnap = function () {
    var tiling = (this._material && this._material.diffuseMapTiling) ? this._material.diffuseMapTiling.x : 1;
    var snap = 1 / (this.uvScale * (tiling || 1));
    this._snap = isFinite(snap) && snap > 0 ? snap : 10;
};

SkateboardObbyInfiniteOcean.prototype._findCamera = function () {
    var cams = this.app.systems.camera.cameras;
    var best = null;
    for (var i = 0; i < cams.length; i++) {
        var c = cams[i];
        if (!c.enabled || !c.entity.enabled || c.renderTarget) continue;
        if (!best || c.priority >= best.priority) best = c;
    }
    return best ? best.entity : null;
};

SkateboardObbyInfiniteOcean.prototype.postUpdate = function (dt) {
    this._camCheck -= dt;
    if (!this._cam || !this._cam.enabled || this._camCheck <= 0) {
        this._cam = this._findCamera();
        this._camCheck = 1;
    }
    if (!this._cam || !this._snap) return;

    var p = this._cam.getPosition();
    var snap = this._snap;
    var x = Math.round(p.x / snap) * snap;
    var z = Math.round(p.z / snap) * snap;
    if (x !== this._lastX || z !== this._lastZ) {
        this._lastX = x;
        this._lastZ = z;
        this.entity.setPosition(x, this.height, z);
    }
};
