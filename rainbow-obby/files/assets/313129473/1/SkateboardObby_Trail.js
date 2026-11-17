/*
 * SkateboardObby_Trail
 * Ribbon trail behind the board like Monkey's trail (thin glowing strip, color -> color2, fades out at the end),
 * made WITHOUT a shader: Segment Count flat strip pieces (a quad model each) are laid along the path the board rode
 * and stretched with scale, so the strip bends with the turns. Every piece shows its own slice of the color / fade
 * textures (UV slices), so the pieces read as one continuous ribbon.
 * - The ribbon starts at the "TrailPoint" child of the board bone (Player/.../Armature.001/Board/TrailPoint, move it in the
 *   editor to change the start). Other players get the same point at runtime (template is not changed).
 * - Length = speed x Lag Time (at most Max Length). It grows from zero after a start / respawn (no long tail popping
 *   in) and shrinks back into the board when slowing down (Fade Time).
 * - The path is a ring buffer of points exactly Path Spacing apart (allocated once). No allocation per frame.
 * - Material: StandardMaterial, unlit, emissive map + opacity map (same setup as Monkey's mobile trail).
 *   The pieces of a trail are in one runtime dynamic batch group -> 1 draw call per trail.
 * - One big jump in a frame (teleport, respawn, checkpoint): the path restarts, no line along the teleport.
 * - The equipped trail multiplies the board's Max Speed (controller.maxSpeed = base x trail x worn board bonus), written only on change.
 * - Other players: listens to "player:add"; one frame later networkData is there and, if the server has the field,
 *   networkData.listen("trail"). Only near players (Remote Range) get a ribbon, at most Max Remote Trails.
 * - Local selection -> Client:SetTrail {trail} (only if the server schema has "trail"; old servers are left alone).
 * Shop: SkateboardObby_Shop reads "trails" from here and calls equip(id).
 */
var SkateboardObbyTrail = pc.createScript('skateboardObbyTrail');

var _SKTR_ROW_ENUM = [{ 'Red': 'red' }, { 'Blue': 'blue' }, { 'Green': 'green' }, { 'Yellow': 'yellow' }, { 'Purple': 'purple' }];
var _SKTR_PRICE_ENUM = [{ 'Free': 'free' }, { 'Coins': 'coins' }, { 'Rewarded Ad': 'ad' }];

SkateboardObbyTrail.attributes.add('player', { type: 'entity', description: 'Local Player' });
SkateboardObbyTrail.attributes.add('segmentCount', { type: 'number', default: 18, min: 2, max: 40, precision: 0, title: 'Segment Count' });
SkateboardObbyTrail.attributes.add('pathSpacing', { type: 'number', default: 0.25, title: 'Path Spacing', description: 'Distance between recorded path points (m)' });
SkateboardObbyTrail.attributes.add('maxLength', { type: 'number', default: 8, title: 'Max Length', description: 'Longest ribbon (m)' });
SkateboardObbyTrail.attributes.add('lagTime', { type: 'number', default: 0.3, title: 'Lag Time', description: 'Ribbon length = speed x this (s)' });
SkateboardObbyTrail.attributes.add('width', { type: 'number', default: 0.32, title: 'Width', description: 'Ribbon width at the board (m)' });
SkateboardObbyTrail.attributes.add('taper', { type: 'number', default: 0.35, min: 0, max: 1, title: 'Taper', description: 'Width at the end compared to the start' });
SkateboardObbyTrail.attributes.add('anchorName', { type: 'string', default: 'TrailPoint', title: 'Anchor Name', description: 'Child of the board bone where the ribbon starts' });
SkateboardObbyTrail.attributes.add('backOffset', { type: 'number', default: 0.95, title: 'Back Offset', description: 'Only without an anchor: start behind the player center (m, along the board)' });
SkateboardObbyTrail.attributes.add('heightOffset', { type: 'number', default: -0.6, title: 'Height Offset', description: 'Only without an anchor: start height from the player center (m, player center is 1 m above the ground)' });
SkateboardObbyTrail.attributes.add('minSpeed', { type: 'number', default: 3, title: 'Min Speed', description: 'Below this speed (m/s) the ribbon shrinks away' });
SkateboardObbyTrail.attributes.add('fadeTime', { type: 'number', default: 0.3, title: 'Fade Time', description: 'Time to shrink into the board' });
SkateboardObbyTrail.attributes.add('teleportDistance', { type: 'number', default: 6, title: 'Teleport Distance', description: 'Moving more than this in one frame restarts the path' });
SkateboardObbyTrail.attributes.add('remoteRange', { type: 'number', default: 60, title: 'Remote Range' });
SkateboardObbyTrail.attributes.add('maxRemoteTrails', { type: 'number', default: 8, precision: 0, title: 'Max Remote Trails' });
SkateboardObbyTrail.attributes.add('affectSpeed', { type: 'boolean', default: true, title: 'Speed Multiplier', description: 'Equipped trail multiplies the board Max Speed' });

SkateboardObbyTrail.attributes.add('trails', {
    type: 'json', array: true, title: 'Trails (Speed x)', schema: [
        { name: 'id', type: 'string', default: 'trail_red', description: 'Save key [a-z0-9_], do not change' },
        { name: 'name', type: 'string', default: 'Red Trail' },
        { name: 'mult', type: 'number', default: 1.1, description: 'Max speed multiplier' },
        { name: 'priceType', type: 'string', default: 'coins', enum: _SKTR_PRICE_ENUM },
        { name: 'price', type: 'number', default: 100 },
        { name: 'ads', type: 'number', default: 1 },
        { name: 'rowColor', type: 'string', default: 'red', enum: _SKTR_ROW_ENUM },
        { name: 'color', type: 'rgb', default: [1, 0.25, 0.3], description: 'At the board' },
        { name: 'color2', type: 'rgb', default: [1, 0.6, 0.2], description: 'At the end' },
        { name: 'rainbow', type: 'boolean', default: false, description: 'Rainbow along the ribbon' },
        { name: 'width', type: 'number', default: 1, description: 'Width multiplier' },
        { name: 'model', type: 'asset', assetType: 'render', description: 'Optional piece model (first mesh of the render asset, x -0.5..0.5 = width, z 0..1 = length). Empty = flat quad' }
    ]
});

SkateboardObbyTrail.KEY_EQUIPPED = 'SkateboardObby_Trail';
SkateboardObbyTrail.ID_RE = /^[a-z0-9_]{1,32}$/;

SkateboardObbyTrail.prototype.initialize = function () {
    this.app.skateTrail = this;
    this.chains = [];          // remote chains in use
    this.pool = [];            // free remote chains
    this.pending = [];         // remote entities whose networkData arrives next frame
    this.remotes = [];         // { entity, data, id, chain, unlisten }
    this.materials = {};       // trail id -> material
    this.textures = [];
    this._netTimer = 0;
    this.baseMaxSpeed = null;
    this.appliedMult = 1;
    this.camPos = new pc.Vec3(0, 1000, 0);

    // all ribbon pieces in one dynamic batch group (runtime only, not a project batch group)
    this.batchGroupId = null;
    try {
        const g = this.app.batcher.addGroup('SkateboardObby_Trail', true, 40);
        this.batchGroupId = g ? g.id : null;
    } catch (e) { this.batchGroupId = null; }

    const saved = SkateboardObby_Utils.getItem(SkateboardObbyTrail.KEY_EQUIPPED);
    this.equipped = (saved && this.find(saved)) ? saved : null;
    // ownership lives in the shop; the shop takes it off if the item is not owned
    this.localChain = null;

    this.app.on('player:add', this.onPlayerAdd, this);
    this.app.on('player:remove', this.onPlayerRemove, this);
    this.app.on('Respawned', this.onRespawned, this);
    this.on('destroy', this.onDestroy, this);
};

SkateboardObbyTrail.prototype.postInitialize = function () {
    this.applyLocal();
};

SkateboardObbyTrail.prototype.onDestroy = function () {
    this.app.off('player:add', this.onPlayerAdd, this);
    this.app.off('player:remove', this.onPlayerRemove, this);
    this.app.off('Respawned', this.onRespawned, this);
    while (this.remotes.length) this.removeRemote(this.remotes[0]);
    if (this.localChain) { this.localChain.destroy(); this.localChain = null; }
    this.pool.forEach(c => c.destroy());
    this.pool = [];
    for (const k in this.materials) this.materials[k].destroy();
    this.materials = {};
    this.textures.forEach(t => t.destroy());
    this.textures = [];
    if (this._meshes) { this._meshes.forEach(m => m.destroy()); this._meshes = null; }
    if (this.batchGroupId != null) { try { this.app.batcher.removeGroup(this.batchGroupId); } catch (e) { } }
    if (this.app.skateTrail === this) this.app.skateTrail = null;
};

// --- list / selection ----------------------------------------------------------------

SkateboardObbyTrail.prototype.find = function (_id) {
    if (typeof _id !== 'string' || !_id) return null;
    const l = this.trails || [];
    for (let i = 0; i < l.length; i++) if (l[i].id === _id) return l[i];
    return null;
};

SkateboardObbyTrail.prototype.getMultiplier = function () {
    const it = this.find(this.equipped);
    return it ? Math.max(1, it.mult || 1) : 1;
};

// _id = null / "" -> no trail
SkateboardObbyTrail.prototype.equip = function (_id) {
    const it = this.find(_id);
    this.equipped = it ? it.id : null;
    SkateboardObby_Utils.setItem(SkateboardObbyTrail.KEY_EQUIPPED, this.equipped || '');
    this.applyLocal();
    this._netTimer = 0;   // send on the next update
    this.app.fire('skate:trail', this.equipped);
};

SkateboardObbyTrail.prototype.applyLocal = function () {
    const it = this.find(this.equipped);
    if (this.localChain && (!it || this.localChain.item !== it)) { this.localChain.destroy(); this.localChain = null; }
    if (it && !this.localChain && this.player) {
        this.localChain = new SkateboardObby_TrailChain(this, it);
        this.localChain.bind(this.player, this.bodyOf(this.player), this.anchorOf(this.player));
    }
    this.applySpeed();
};

// controller.maxSpeed = base x trail multiplier x board bonus (the base is read once). boostMaxSpeed is not touched.
SkateboardObbyTrail.prototype.applySpeed = function () {
    const c = this.app.skateboardObbyPlayerController;
    if (!c) return;
    if (this.baseMaxSpeed == null) this.baseMaxSpeed = c.maxSpeed;
    const boards = this.app.skateBoards;
    const mult = (this.affectSpeed ? this.getMultiplier() : 1) * (boards ? boards.getSpeedMultiplier() : 1);
    if (mult === this.appliedMult && c.maxSpeed === this.baseMaxSpeed * mult) return;
    this.appliedMult = mult;
    c.maxSpeed = this.baseMaxSpeed * mult;
    c.maxLinearVelocity = c.maxSpeed;
};

// board bone child where the ribbon starts; remote players get a copy of the local player's point (same local position)
SkateboardObbyTrail.prototype.anchorOf = function (_ent) {
    const name = this.anchorName || 'TrailPoint';
    let p = _ent.findByName(name);
    if (p) return p;
    const board = _ent.findByName('Board');
    if (!board) return null;
    const mine = this.player && this.player.findByName(name);
    p = new pc.Entity(name);
    board.addChild(p);
    if (mine) p.setLocalPosition(mine.getLocalPosition()); else p.setLocalPosition(0, -0.95, 0.03);
    return p;
};

SkateboardObbyTrail.prototype.bodyOf = function (_ent) {
    if (_ent === this.player) {
        const c = this.app.skateboardObbyPlayerController;
        return (c && c.body) || _ent.findByName('Body') || _ent;
    }
    return _ent.playerBody || _ent.findByName('BodyPivot') || _ent;
};

// --- rendering resources ---------------------------------------------------------------

// piece i: flat quad x -0.5..0.5 (width), y = 0, z 0..1 (start -> end of the piece), v = its slice of the ribbon
SkateboardObbyTrail.prototype.pieceMesh = function (_i, _n, _item) {
    const m = _item && _item.model;
    const a = (typeof m === 'number') ? this.app.assets.get(m) : m;
    if (a && a.resource && a.resource.meshes && a.resource.meshes.length) return a.resource.meshes[0];
    if (a && !a.loaded) this.app.assets.load(a);   // used from the next ribbon on
    if (!this._meshes || this._meshes.length !== _n) {
        if (this._meshes) this._meshes.forEach(x => x.destroy());
        this._meshes = [];
        for (let k = 0; k < _n; k++) {
            const v0 = k / _n, v1 = (k + 1) / _n;
            const mesh = new pc.Mesh(this.app.graphicsDevice);
            mesh.setPositions(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0, 1, 0.5, 0, 1]));
            mesh.setNormals(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]));
            mesh.setUvs(0, new Float32Array([0, v0, 1, v0, 0, v1, 1, v1]));   // v 0 = board = top row of the textures
            mesh.setIndices([0, 2, 1, 1, 2, 3]);
            mesh.update(pc.PRIMITIVE_TRIANGLES);
            // own reference: destroying a ribbon's mesh instances must not destroy the shared mesh
            mesh.incRefCount();
            this._meshes.push(mesh);
        }
    }
    return this._meshes[_i];
};

SkateboardObbyTrail.prototype.materialFor = function (_item) {
    if (this.materials[_item.id]) return this.materials[_item.id];
    if (!this.maskTex) { this.maskTex = SkateboardObbyTrail.maskTexture(this.app, this.taper); this.textures.push(this.maskTex); }
    const colorTex = SkateboardObbyTrail.colorTexture(this.app, _item);
    this.textures.push(colorTex);
    const m = new pc.StandardMaterial();
    m.useLighting = false;
    m.useSkybox = false;
    m.useFog = false;
    m.useTonemap = false;
    m.diffuse = new pc.Color(0, 0, 0);
    m.emissive = new pc.Color(1, 1, 1);
    m.emissiveMap = colorTex;
    m.opacityMap = this.maskTex;
    m.opacityMapChannel = 'a';
    m.blendType = pc.BLEND_NORMAL;
    m.depthWrite = false;
    m.cull = pc.CULLFACE_NONE;
    m.update();
    this.materials[_item.id] = m;
    return m;
};

SkateboardObbyTrail.toTexture = function (app, canvas, srgb) {
    const tex = new pc.Texture(app.graphicsDevice, {
        width: canvas.width, height: canvas.height,
        format: (srgb && pc.PIXELFORMAT_SRGBA8 !== undefined) ? pc.PIXELFORMAT_SRGBA8 : pc.PIXELFORMAT_RGBA8,
        mipmaps: false, minFilter: pc.FILTER_LINEAR, magFilter: pc.FILTER_LINEAR,
        addressU: pc.ADDRESS_CLAMP_TO_EDGE, addressV: pc.ADDRESS_CLAMP_TO_EDGE
    });
    tex.setSource(canvas);
    return tex;
};

// alpha: soft edges, narrows along the ribbon (taper), solid at the board, fades out at the end. v: 0 = board (top row)
SkateboardObbyTrail.maskTexture = function (app, taper) {
    const w = 32, h = 64, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) {
        const v = y / (h - 1);
        const half = 0.5 * (1 - (1 - taper) * v);
        const along = 1 - 0.9 * pc.math.smoothstep(0.5, 1, v);
        for (let x = 0; x < w; x++) {
            const u = Math.abs((x + 0.5) / w - 0.5);
            const edge = 1 - pc.math.smoothstep(half * 0.45, half, u);
            const i = (y * w + x) * 4;
            d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(Math.max(0, Math.min(1, edge * along)) * 255);
        }
    }
    ctx.putImageData(img, 0, 0);
    return SkateboardObbyTrail.toTexture(app, cv, false);
};

// color: color -> color2 (or rainbow) from the board to the end, a bit whiter in the middle
SkateboardObbyTrail.colorTexture = function (app, item) {
    const w = 16, h = 64, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    const c1 = SkateboardObbyTrail.color(item.color), c2 = SkateboardObbyTrail.color(item.color2 || item.color);
    const hue = (t) => {
        const f = (n) => { const k = (n + t * 6) % 6; return 1 - Math.max(0, Math.min(k, 4 - k, 1)); };
        return [f(5) * 0.9 + 0.1, f(3) * 0.9 + 0.1, f(1) * 0.9 + 0.1];
    };
    for (let y = 0; y < h; y++) {
        const v = y / (h - 1);
        const c = item.rainbow ? hue(v * 0.95) : [c1.r + (c2.r - c1.r) * v, c1.g + (c2.g - c1.g) * v, c1.b + (c2.b - c1.b) * v];
        for (let x = 0; x < w; x++) {
            const u = Math.abs((x + 0.5) / w - 0.5) * 2;
            const white = 0.3 * Math.pow(1 - u, 3) * (1 - v * 0.7);
            const i = (y * w + x) * 4;
            d[i] = Math.round(255 * (c[0] + (1 - c[0]) * white));
            d[i + 1] = Math.round(255 * (c[1] + (1 - c[1]) * white));
            d[i + 2] = Math.round(255 * (c[2] + (1 - c[2]) * white));
            d[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    return SkateboardObbyTrail.toTexture(app, cv, true);
};

SkateboardObbyTrail.color = function (v) {
    if (v instanceof pc.Color) return v.clone();
    if (Array.isArray(v)) return new pc.Color(v[0], v[1], v[2]);
    if (v && typeof v.r === 'number') return new pc.Color(v.r, v.g, v.b);
    return new pc.Color(1, 1, 1);
};

// --- remote players ----------------------------------------------------------------------

SkateboardObbyTrail.prototype.onPlayerAdd = function (_ent) {
    if (!_ent || _ent === this.player) return;
    this.pending.push(_ent);   // networkData is set right after this event
};

SkateboardObbyTrail.prototype.onPlayerRemove = function (_data) {
    for (let i = this.remotes.length - 1; i >= 0; i--) if (this.remotes[i].data === _data) this.removeRemote(this.remotes[i]);
};

SkateboardObbyTrail.prototype.attachRemote = function (_ent) {
    const d = _ent.networkData;
    if (!d || !('trail' in d)) return;   // old server: no trail field
    const r = { entity: _ent, data: d, id: '', chain: null, unlisten: null, body: this.bodyOf(_ent), point: this.anchorOf(_ent) };
    this.remotes.push(r);
    try {
        r.unlisten = d.listen('trail', (v) => { r.id = (typeof v === 'string' && SkateboardObbyTrail.ID_RE.test(v)) ? v : ''; });
    } catch (e) { r.unlisten = null; }
    r.id = (typeof d.trail === 'string' && SkateboardObbyTrail.ID_RE.test(d.trail)) ? d.trail : '';
    r._onDestroy = () => this.removeRemote(r);
    _ent.once('destroy', r._onDestroy);
};

SkateboardObbyTrail.prototype.removeRemote = function (r) {
    const i = this.remotes.indexOf(r);
    if (i >= 0) this.remotes.splice(i, 1);
    if (r.unlisten) { try { r.unlisten(); } catch (e) { } r.unlisten = null; }
    if (r.entity && r._onDestroy) r.entity.off('destroy', r._onDestroy);
    this.releaseChain(r);
};

SkateboardObbyTrail.prototype.releaseChain = function (r) {
    if (!r.chain) return;
    const k = this.chains.indexOf(r.chain);
    if (k >= 0) this.chains.splice(k, 1);
    r.chain.unbind();
    this.pool.push(r.chain);
    r.chain = null;
};

SkateboardObbyTrail.prototype.updateRemotes = function (dt) {
    // entities from player:add, one frame later networkData is ready
    if (this.pending.length) {
        for (let i = this.pending.length - 1; i >= 0; i--) {
            const e = this.pending[i];
            if (e._destroyed) { this.pending.splice(i, 1); continue; }
            if (e.networkData) { this.pending.splice(i, 1); this.attachRemote(e); }
        }
    }
    if (!this.remotes.length) return;

    const me = this.player ? this.player.getPosition() : null;
    const range2 = this.remoteRange * this.remoteRange;
    for (let i = 0; i < this.remotes.length; i++) {
        const r = this.remotes[i];
        const it = r.id ? this.find(r.id) : null;
        let show = !!it && r.entity.enabled && !(r.data && r.data.isDead);
        if (show && me) {
            const p = r.entity.getPosition();
            const dx = p.x - me.x, dy = p.y - me.y, dz = p.z - me.z;
            show = dx * dx + dy * dy + dz * dz < range2;
        }
        if (r.chain && (!show || r.chain.item !== it)) this.releaseChain(r);
        if (show && !r.chain && this.chains.length < this.maxRemoteTrails) {
            let ch = this.pool.pop();
            if (ch) ch.setItem(it); else ch = new SkateboardObby_TrailChain(this, it);
            ch.bind(r.entity, r.body, r.point);
            this.chains.push(ch);
            r.chain = ch;
        }
        if (r.chain) r.chain.update(dt, -1, false);
    }
};

SkateboardObbyTrail.prototype.onRespawned = function () {
    if (this.localChain) this.localChain.reset();
};

// --- network: local selection -> server ------------------------------------------------------

SkateboardObbyTrail.prototype.sendTrail = function () {
    try {
        const nm = this.app.skateboardObbyNetworkManager, room = nm && nm.room;
        if (!room || !room.state || !room.state.players) return;
        const me = room.state.players.get(room.sessionId);
        if (!me || !('trail' in me)) return;   // old server
        const id = this.equipped || '';
        if (this._sentRoom === room && this._sentId === id) return;
        room.send('Client:SetTrail', { trail: id });
        this._sentRoom = room;
        this._sentId = id;
    } catch (e) { }
};

// --- update ------------------------------------------------------------------------------------

SkateboardObbyTrail.prototype.update = function (dt) {
    if (this.baseMaxSpeed == null && this.app.skateboardObbyPlayerController) this.applySpeed();
    this._netTimer -= dt;
    if (this._netTimer <= 0) { this._netTimer = 1; this.sendTrail(); }
};

// placed after physics + animation + camera, right before rendering (otherwise one frame behind the board)
SkateboardObbyTrail.prototype.postUpdate = function (dt) {
    const cams = this.app.systems.camera.cameras;
    if (cams.length) this.camPos.copy(cams[0].entity.getPosition());
    const c = this.app.skateboardObbyPlayerController;
    if (this.localChain) {
        const hidden = !c || c.isDied || !this.player.enabled;
        this.localChain.update(dt, c ? Math.abs(c.speed) : 0, hidden);
    }
    this.updateRemotes(dt);
};

// =====================================================================================================
// One ribbon: ring buffer path + Segment Count stretched pieces (same material, one dynamic batch)
// =====================================================================================================
var SkateboardObby_TrailChain = function (manager, item) {
    this.m = manager;
    this.app = manager.app;
    this.n = Math.max(2, Math.round(manager.segmentCount));
    this.spacing = Math.max(0.05, manager.pathSpacing);
    this.cap = Math.ceil(manager.maxLength / this.spacing) + 4;   // ring buffer size (points)
    this.pts = new Float32Array(this.cap * 3);
    this.head = 0;                                 // index of the newest recorded point
    this.count = 0;                                // recorded points
    this.anchor = new pc.Vec3();
    this.lastAnchor = new pc.Vec3();
    this.hasLast = false;
    this.len = 0;                                  // visible ribbon length (m)
    this.speed = 0;                                // remote: measured
    this.collapsed = false;
    this.target = null;
    this.body = null;
    this.pointNode = null;

    // scratch
    this._a = new pc.Vec3(); this._b = new pc.Vec3(); this._p = new pc.Vec3(); this._d = new pc.Vec3();
    this._x = new pc.Vec3(); this._y = new pc.Vec3(); this._z = new pc.Vec3();
    this._q = new pc.Quat(); this._mat = new pc.Mat4();

    this.entity = new pc.Entity('TrailRibbon');
    this.pieces = [];
    this.item = item;
    const mat = manager.materialFor(item);
    for (let i = 0; i < this.n; i++) {
        const e = new pc.Entity('Piece');
        const mi = new pc.MeshInstance(manager.pieceMesh(i, this.n, item), mat);
        mi.castShadow = false;
        mi.receiveShadow = false;
        e.addComponent('render', { meshInstances: [mi], castShadows: false, receiveShadows: false });
        if (manager.batchGroupId != null) e.render.batchGroupId = manager.batchGroupId;
        e.setLocalScale(0, 0, 0);
        this.entity.addChild(e);
        this.pieces.push(e);
    }
    this.entity.enabled = false;
    this.app.root.addChild(this.entity);
};

SkateboardObby_TrailChain.prototype.setItem = function (item) {
    if (this.item === item) return;
    this.item = item;
    const mat = this.m.materialFor(item);
    for (let i = 0; i < this.n; i++) {
        const mi = this.pieces[i].render.meshInstances[0];
        mi.material = mat;
        mi.mesh = this.m.pieceMesh(i, this.n, item);
    }
};

SkateboardObby_TrailChain.prototype.bind = function (target, body, point) {
    this.target = target;
    this.body = body || target;
    this.pointNode = point || null;
    this.reset();
    this.entity.enabled = true;
};

SkateboardObby_TrailChain.prototype.unbind = function () {
    this.target = null;
    this.body = null;
    this.pointNode = null;
    this.entity.enabled = false;
};

SkateboardObby_TrailChain.prototype.reset = function () {
    this.count = 0;
    this.hasLast = false;
    this.len = 0;
    this.speed = 0;
    this.collapse();
};

// hidden = every piece scaled to 0 (the batch stays as it is, no rebuild)
SkateboardObby_TrailChain.prototype.collapse = function () {
    if (this.collapsed) return;
    for (let i = 0; i < this.n; i++) this.pieces[i].setLocalScale(0, 0, 0);
    this.collapsed = true;
};

SkateboardObby_TrailChain.prototype.destroy = function () {
    this.entity.destroy();
    this.pieces = [];
};

SkateboardObby_TrailChain.prototype.point = function (_k, _out) {
    // _k = 0 newest ... count-1 oldest
    const idx = ((this.head - _k) % this.cap + this.cap) % this.cap * 3;
    return _out.set(this.pts[idx], this.pts[idx + 1], this.pts[idx + 2]);
};

SkateboardObby_TrailChain.prototype.push = function (_v) {
    this.head = (this.head + 1) % this.cap;
    const i = this.head * 3;
    this.pts[i] = _v.x; this.pts[i + 1] = _v.y; this.pts[i + 2] = _v.z;
    if (this.count < this.cap) this.count++;
};

// _speed < 0: measure it from the movement (remote players)
SkateboardObby_TrailChain.prototype.update = function (dt, _speed, _hidden) {
    if (!this.target || this.target._destroyed) return;
    const m = this.m;

    // anchor: the TrailPoint on the board (follows the deck in ollies / the loop)
    if (this.pointNode && !this.pointNode._destroyed) {
        this.anchor.copy(this.pointNode.getPosition());
    } else {
        // no point: behind the board (body forward is -Z = back of the board), low above the ground
        const pos = this.target.getPosition();
        const back = this.body.forward, up = this.body.up;
        this.anchor.copy(pos);
        this.anchor.x += back.x * m.backOffset + up.x * m.heightOffset;
        this.anchor.y += back.y * m.backOffset + up.y * m.heightOffset;
        this.anchor.z += back.z * m.backOffset + up.z * m.heightOffset;
    }

    if (_hidden) { this.reset(); return; }

    // teleport / respawn: one big jump -> restart the path (and the ribbon grows again from zero)
    let moved = 0;
    if (this.hasLast) {
        moved = this.anchor.distance(this.lastAnchor);
        if (moved > m.teleportDistance) { this.reset(); moved = 0; }
    }
    this.lastAnchor.copy(this.anchor);
    this.hasLast = true;

    let speed = _speed;
    if (speed < 0) {
        const inst = dt > 0 ? moved / dt : 0;
        this.speed = pc.math.lerp(this.speed, inst, Math.min(1, dt * 8));
        speed = this.speed;
    }

    // record the path in exact steps
    if (this.count === 0) {
        this.push(this.anchor);
    } else {
        const p0 = this.point(0, this._a);
        let dist = p0.distance(this.anchor);
        let guard = 0;
        while (dist >= this.spacing && guard++ < this.cap) {
            this._d.sub2(this.anchor, p0).mulScalar(this.spacing / dist);
            p0.add(this._d);
            this.push(p0);
            dist = p0.distance(this.anchor);
        }
    }

    // length: grows with the ride (never faster than the board moves), shrinks into the board when slow
    const dHead = this.point(0, this._a).distance(this.anchor);
    const pathLen = dHead + Math.max(0, this.count - 1) * this.spacing;
    const want = speed >= m.minSpeed ? Math.min(m.maxLength, speed * m.lagTime) : 0;
    if (want > this.len) this.len = Math.min(want, this.len + Math.max(speed, 1) * dt);
    else this.len += (want - this.len) * Math.min(1, dt * 3 / Math.max(0.05, m.fadeTime));
    if (this.len > pathLen) this.len = pathLen;

    if (this.len < 0.08) { this.collapse(); return; }
    this.collapsed = false;
    this.writePieces(dHead);
};

// position at path arc length L behind the anchor -> _out (dHead = anchor to newest point)
SkateboardObby_TrailChain.prototype.at = function (L, dHead, _out) {
    if (L <= dHead || this.count < 2) {
        const t = dHead > 1e-5 ? Math.min(1, L / dHead) : 0;
        return _out.lerp(this.anchor, this.point(0, this._p), t);
    }
    const r = (L - dHead) / this.spacing;
    const k = Math.floor(r);
    if (k >= this.count - 1) return this.point(this.count - 1, _out);
    this.point(k, _out);
    this.point(k + 1, this._p);
    return _out.lerp(_out, this._p, r - k);
};

SkateboardObby_TrailChain.prototype.writePieces = function (dHead) {
    const n = this.n, len = this.len;
    const w = this.m.width * (this.item.width || 1);
    const cam = this.m.camPos;
    const md = this._mat.data;
    const p0 = this.at(0, dHead, this._b);
    for (let i = 0; i < n; i++) {
        const p1 = this.at(len * (i + 1) / n, dHead, this._d);
        const z = this._z.sub2(p1, p0);
        const pl = z.length();
        const e = this.pieces[i];
        if (pl < 1e-4) { e.setLocalScale(0, 0, 0); continue; }
        z.mulScalar(1 / pl);
        // flat side turned to the camera (around the length axis), like Monkey's trail quad
        const y = this._y.sub2(cam, p0);
        y.sub(this._x.copy(z).mulScalar(y.dot(z)));
        if (y.lengthSq() < 1e-6) y.set(0, 1, 0);
        y.normalize();
        const x = this._x.cross(y, z).normalize();
        md[0] = x.x; md[1] = x.y; md[2] = x.z; md[3] = 0;
        md[4] = y.x; md[5] = y.y; md[6] = y.z; md[7] = 0;
        md[8] = z.x; md[9] = z.y; md[10] = z.z; md[11] = 0;
        md[12] = 0; md[13] = 0; md[14] = 0; md[15] = 1;
        this._q.setFromMat4(this._mat);
        e.setPosition(p0);
        e.setRotation(this._q);
        e.setLocalScale(w, 1, pl);
        p0.copy(p1);
    }
};
