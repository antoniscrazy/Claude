/*
 * SkateboardObby_CoinManager
 * Coins lying on the track, collected by riding through them. Fully client-side: every player collects his own coins.
 * - The coins come from "Coin Layout" (JSON asset made by tools/skate_coins: positions per stage chunk). Without a layout
 *   they are the children of "Coins Root"; those are only an editor preview, at runtime ONE instanced mesh draws all coins.
 * - With a layout only the coins of the open stage chunks (app.skateStageChunks) are checked, and only those within
 *   Draw Range are drawn, so the coin count of the whole course does not cost anything per frame.
 * - Look: every drawn coin is "Coin Model" (PK_Coin of SkateBoard_Obby_Coin.fbx, 4.4k triangles), one instanced mesh, 1 draw call.
 *   No LOD (user decision, Model Range 0); Model Range > 0 would switch coins farther than that to the cylinder.
 *   Empty Coin Model, or until it is loaded = cylinder (1 draw call).
 * - One update for all coins: spin + bob only within Update Range of the player, pickup is a distance check (no triggers).
 * - A collected coin stays collected (Respawn Time 0, default). Respawn Time > 0: it comes back after that many seconds.
 *   Collected coins are not saved: entering the mode again lays all coins out again, and so does the Restart portal
 *   (app event "resetStage", Respawn On Reset). Dying does not bring them back.
 * - Balance: SkateboardObby_Utils key "SkateboardObby_Coins". The HUD text is written only when the balance changes.
 * Other scripts: app.skateCoins.get() / add(n) / spend(n) / set(n), app event "skate:coins" (balance, delta).
 */
var SkateboardObbyCoinManager = pc.createScript('skateboardObbyCoinManager');

SkateboardObbyCoinManager.attributes.add('coinsRoot', { type: 'entity', title: 'Coins Root', description: 'Children = coin positions (SkateTestTrack/Coins)' });
SkateboardObbyCoinManager.attributes.add('player', { type: 'entity', description: 'Local Player' });
SkateboardObbyCoinManager.attributes.add('counterText', { type: 'entity', title: 'Counter Text', description: 'HUD text element' });
SkateboardObbyCoinManager.attributes.add('counterIcon', { type: 'entity', title: 'Counter Icon', description: 'Pops when a coin is collected (optional)' });
SkateboardObbyCoinManager.attributes.add('coinMaterial', { type: 'asset', assetType: 'material', title: 'Coin Material', description: 'Optional; empty = gold StandardMaterial made in code' });
SkateboardObbyCoinManager.attributes.add('coinModel', { type: 'asset', assetType: 'render', title: 'Coin Model', description: 'Optional render asset (PK_Coin). Pivot in the coin center, face along Z; scaled so its diameter = Coin Size. Empty = cylinder' });
SkateboardObbyCoinManager.attributes.add('coinModelMaterial', { type: 'asset', assetType: 'material', title: 'Coin Model Material', description: 'Material for Coin Model (Skateboard Endesga)' });
SkateboardObbyCoinManager.attributes.add('modelRange', { type: 'number', default: 0, title: 'Model Range', description: '0 = Coin Model everywhere (no LOD). > 0: coins farther than this (m) use the cylinder' });
SkateboardObbyCoinManager.attributes.add('layout', { type: 'asset', assetType: 'json', title: 'Coin Layout', description: 'JSON from tools/skate_coins: {chunks: [{c: chunk, p: [x, y, z, ...]}]}, sorted by chunk. Empty = the children of Coins Root' });
SkateboardObbyCoinManager.attributes.add('drawRange', { type: 'number', default: 120, title: 'Draw Range', description: 'Coins farther than this (m) are not drawn. 0 = no limit' });
SkateboardObbyCoinManager.attributes.add('respawnOnReset', { type: 'boolean', default: true, title: 'Respawn On Reset', description: 'Restart portal / resetGame lays the coins out again' });
SkateboardObbyCoinManager.attributes.add('coinValue', { type: 'number', default: 1, title: 'Coin Value' });
SkateboardObbyCoinManager.attributes.add('respawnTime', { type: 'number', default: 0, title: 'Respawn Time', description: '0 = a collected coin never comes back. > 0: seconds before it comes back' });
SkateboardObbyCoinManager.attributes.add('pickupRadius', { type: 'number', default: 0, title: 'Pickup Radius', description: 'Player center to coin center (m). 0 = automatic: Coin Size / 2 + 1 (the coin you ride through is always collected)' });
SkateboardObbyCoinManager.attributes.add('cameraClear', { type: 'number', default: 5, title: 'Camera Clear', description: 'Coins closer than this to the camera (m) are not drawn, so a coin left behind does not cover the screen' });
SkateboardObbyCoinManager.attributes.add('updateRange', { type: 'number', default: 80, title: 'Update Range', description: 'Coins farther than this (m) are not animated / checked' });
SkateboardObbyCoinManager.attributes.add('coinSize', { type: 'number', default: 1.7, title: 'Coin Size', description: 'Diameter (m). The only value to change for bigger / smaller coins: model, cylinder, pickup radius and height above the ground follow it' });
SkateboardObbyCoinManager.attributes.add('coinThickness', { type: 'number', default: 0.14, title: 'Coin Thickness' });
SkateboardObbyCoinManager.attributes.add('spinSpeed', { type: 'number', default: 180, title: 'Spin Speed', description: 'deg/s' });
SkateboardObbyCoinManager.attributes.add('bobHeight', { type: 'number', default: 0.15, title: 'Bob Height' });
SkateboardObbyCoinManager.attributes.add('bobSpeed', { type: 'number', default: 2.2, title: 'Bob Speed' });
SkateboardObbyCoinManager.attributes.add('sound', { type: 'string', default: 'collectCoin', title: 'Sound Slot', description: 'Sound slot on the Player' });

SkateboardObbyCoinManager.KEY = 'SkateboardObby_Coins';
SkateboardObbyCoinManager.POP_TIME = 0.15;
SkateboardObbyCoinManager.MAX_FAR = 160;    // instances drawn with the cylinder at once
SkateboardObbyCoinManager.MAX_NEAR = 160;   // instances drawn with Coin Model at once

SkateboardObbyCoinManager.prototype.initialize = function () {
    this.app.skateCoins = this;
    this.coins = Math.max(0, Math.floor(Number(SkateboardObby_Utils.getItem(SkateboardObbyCoinManager.KEY)) || 0));
    this._saveTimer = -1;
    this._shown = -1;
    this._time = 0;
    this._iconPop = 0;

    // scratch (no allocation in update)
    this._q = new pc.Quat();
    this._qTilt = new pc.Quat().setFromEulerAngles(90, 0, 0);
    this._qSpin = new pc.Quat();
    this._m = new pc.Mat4();
    this._v = new pc.Vec3();
    this._s = new pc.Vec3();
    this._zero = new Float32Array(16);
    this._frame = 0;
    this.camera = this.app.root.findByName('Camera');
    this._first = this._end = -1;

    this.count = 0;
    this.writeCounter();

    if (this.layout) {
        this.layout.ready(() => this.buildFromLayout());
        this.app.assets.load(this.layout);
    } else {
        this.buildFromChildren();
    }

    this._onReset = () => { if (this.respawnOnReset) this.respawnAll(); };
    this.app.on('resetStage', this._onReset, this);

    this._onPageHide = () => this.save();
    window.addEventListener('pagehide', this._onPageHide);
    this.on('destroy', this.onDestroy, this);
};

// coin list (positions read once)
SkateboardObbyCoinManager.prototype.allocCoins = function (count) {
    this.count = count;
    this.pos = new Float32Array(count * 3);
    this.phase = new Float32Array(count);
    this.state = new Float32Array(count);    // 0 = there, > 0 = collected: seconds since pickup
    this.dirty = new Uint8Array(count);
    this.lod = new Uint8Array(count);        // 1 = drawn with Coin Model (near)
    this.dist2 = new Float32Array(count);    // to the player, last frame it was checked
    this.aabb = new pc.BoundingBox();
};

SkateboardObbyCoinManager.prototype.finishCoins = function () {
    const count = this.count, pos = this.pos;
    if (!count) return;
    const min = new pc.Vec3(Infinity, Infinity, Infinity), max = new pc.Vec3(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < count; i++) {
        this._v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        min.min(this._v); max.max(this._v);
        this.phase[i] = (i * 0.618034) % 1;
        this.dirty[i] = 1;
    }
    const pad = this.coinSize + this.bobHeight;
    min.sub(new pc.Vec3(pad, pad, pad)); max.add(new pc.Vec3(pad, pad, pad));
    this.aabb.setMinMax(min, max);
    this.createMesh();
};

SkateboardObbyCoinManager.prototype.buildFromChildren = function () {
    const list = this.coinsRoot ? this.coinsRoot.children : [];
    this.allocCoins(list.length);
    for (let i = 0; i < list.length; i++) {
        const p = list[i].getPosition();
        this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
        if (list[i].render) list[i].render.enabled = false;   // editor preview only
    }
    this.capFar = this.capNear = list.length;
    this.finishCoins();
};

SkateboardObbyCoinManager.prototype.buildFromLayout = function () {
    const chunks = (this.layout.resource && this.layout.resource.chunks) || [];
    // the layout was made for one coin size: another Coin Size keeps the same gap to the ground
    const lift = this.layout.resource && this.layout.resource.size ? (this.coinSize - this.layout.resource.size) / 2 : 0;
    let count = 0, last = -1;
    for (let c = 0; c < chunks.length; c++) { count += chunks[c].p.length / 3; last = Math.max(last, chunks[c].c); }
    this.allocCoins(count);
    this.chunkFirst = new Int32Array(last + 2);   // first coin of each chunk
    let i = 0, ci = 0;
    for (let n = 0; n <= last; n++) {
        this.chunkFirst[n] = i;
        if (ci < chunks.length && chunks[ci].c === n) {
            const p = chunks[ci].p;
            for (let k = 0; k < p.length; k++) this.pos[i * 3 + k] = p[k] + (k % 3 === 1 ? lift : 0);
            i += p.length / 3;
            ci++;
        }
    }
    this.chunkFirst[last + 1] = i;
    this.lastChunk = last;
    // instance buffers hold what can be visible at once, not the whole course
    this.capFar = Math.min(count, SkateboardObbyCoinManager.MAX_FAR);
    this.capNear = Math.min(count, SkateboardObbyCoinManager.MAX_NEAR);
    if (this.coinsRoot) this.coinsRoot.children.forEach((e) => { e.enabled = false; });   // old editor preview
    this.finishCoins();
};

SkateboardObbyCoinManager.prototype.createMesh = function () {
    if (!this.count) return;
    const device = this.app.graphicsDevice;
    const mesh = pc.createCylinder(device, { radius: 0.5, height: 1, heightSegments: 1, capSegments: 14 });

    let mat = this.coinMaterial && this.coinMaterial.resource;
    if (!mat) {
        mat = new pc.StandardMaterial();
        mat.diffuse = new pc.Color(1, 0.74, 0.12);
        mat.emissive = new pc.Color(0.55, 0.36, 0.02);
        mat.specular = new pc.Color(0.6, 0.5, 0.25);
        mat.gloss = 0.7;
        mat.update();
    }
    this.material = mat;

    this.meshInstance = new pc.MeshInstance(mesh, mat);
    this.meshInstance.castShadow = false;
    this.meshInstance.receiveShadow = false;

    this.instanceData = new Float32Array(this.count * 16);
    this.instancingSupported = !!(pc.VertexFormat.getDefaultInstancingFormat && device.supportsInstancing !== false);
    if (this.instancingSupported) {
        this.farData = new Float32Array(this.capFar * 16);
        this.vb = new pc.VertexBuffer(device, pc.VertexFormat.getDefaultInstancingFormat(device), this.capFar, {
            usage: pc.BUFFER_DYNAMIC, data: this.farData
        });
        this.meshInstance.setInstancing(this.vb);
        this.meshInstance.setCustomAabb(this.aabb);
        this.meshInstance.instancingCount = 0;
    } else {
        // fallback: the editor coins draw themselves (one draw call each)
        this.meshInstance = null;
        const list = this.coinsRoot ? this.coinsRoot.children : [];
        for (let i = 0; i < list.length; i++) if (list[i].render) { list[i].enabled = true; list[i].render.enabled = true; }
        return;
    }

    this.renderEntity = new pc.Entity('CoinsInstanced');
    this.renderEntity.addComponent('render', { meshInstances: [this.meshInstance], castShadows: false, receiveShadows: false });
    this.app.root.addChild(this.renderEntity);

    // material from the asset may arrive later
    if (this.coinMaterial && !this.coinMaterial.resource) {
        this.coinMaterial.ready((a) => { if (this.meshInstance && a.resource) this.meshInstance.material = a.resource; });
        this.app.assets.load(this.coinMaterial);
    }

    // FBX coin model: replaces the cylinder once the render asset is loaded (the menu normally loads it already)
    if (this.coinModel) {
        const swap = () => this.applyModel();
        this.coinModel.ready(swap);
        this.app.assets.load(this.coinModel);
        if (this.coinModelMaterial) { this.coinModelMaterial.ready(swap); this.app.assets.load(this.coinModelMaterial); }
    }
};

SkateboardObbyCoinManager.prototype.applyModel = function () {
    const render = this.coinModel && this.coinModel.resource;
    const mesh = render && render.meshes && render.meshes[0];
    if (!this.renderEntity || !mesh) return;
    const mat = (this.coinModelMaterial && this.coinModelMaterial.resource) || this.material;
    if (this.modelInstance) { this.modelInstance.material = mat; return; }

    // second instanced mesh for the near coins (LOD); the cylinder keeps the far ones
    const he = mesh.aabb.halfExtents;
    this._modelScale = 1 / (2 * Math.max(he.x, he.y));   // model diameter -> 1 (then x Coin Size)
    const device = this.app.graphicsDevice;
    this.nearData = new Float32Array(this.capNear * 16);
    this.vbModel = new pc.VertexBuffer(device, pc.VertexFormat.getDefaultInstancingFormat(device), this.capNear, {
        usage: pc.BUFFER_DYNAMIC, data: this.nearData
    });
    this.modelInstance = new pc.MeshInstance(mesh, mat);
    this.modelInstance.castShadow = false;
    this.modelInstance.receiveShadow = false;
    this.modelInstance.setInstancing(this.vbModel);
    this.modelInstance.setCustomAabb(this.aabb);
    this.modelInstance.instancingCount = 0;
    this.modelEntity = new pc.Entity('CoinsInstancedModel');
    this.modelEntity.addComponent('render', { meshInstances: [this.modelInstance], castShadows: false, receiveShadows: false });
    this.renderEntity.addChild(this.modelEntity);
    this._model = true;
    for (let i = 0; i < this.count; i++) this.dirty[i] = 1;
};

// copy the coins to draw into the near (model) / far (cylinder) instance buffers, no allocation
SkateboardObbyCoinManager.prototype.compact = function (a, b) {
    const src = this.instanceData, near = this.nearData, far = this.farData, state = this.state, lod = this.lod, d2 = this.dist2;
    const pop = SkateboardObbyCoinManager.POP_TIME;
    const draw2 = this.drawRange > 0 ? this.drawRange * this.drawRange : Infinity;
    const capN = this._model ? this.capNear * 16 : 0, capF = this.capFar * 16;
    const cam = this.camera ? this.camera.getPosition() : null, clear2 = this.cameraClear * this.cameraClear;
    let nn = 0, nf = 0;
    for (let i = a; i < b; i++) {
        if (state[i] >= pop || d2[i] > draw2) continue;   // collected / too far
        const off = i * 16;
        if (lod[i]) {
            if (cam) {
                const cx = src[off + 12] - cam.x, cy = src[off + 13] - cam.y, cz = src[off + 14] - cam.z;
                if (cx * cx + cy * cy + cz * cz < clear2) continue;
            }
            if (nn < capN) { for (let k = 0; k < 16; k++) near[nn + k] = src[off + k]; nn += 16; }
        } else if (nf < capF) {
            for (let k = 0; k < 16; k++) far[nf + k] = src[off + k]; nf += 16;
        }
    }
    if (this.modelInstance) this.modelInstance.instancingCount = nn / 16;
    this.meshInstance.instancingCount = nf / 16;
    if (nn) this.vbModel.setData(near);
    if (nf) this.vb.setData(far);
};

SkateboardObbyCoinManager.prototype.onDestroy = function () {
    window.removeEventListener('pagehide', this._onPageHide);
    this.app.off('resetStage', this._onReset, this);
    this.save();
    if (this.renderEntity) { this.renderEntity.destroy(); this.renderEntity = null; }
    if (this.vb) { this.vb.destroy(); this.vb = null; }
    if (this.vbModel) { this.vbModel.destroy(); this.vbModel = null; }
    if (this.app.skateCoins === this) this.app.skateCoins = null;
};

// --- balance ------------------------------------------------------------------------

SkateboardObbyCoinManager.prototype.get = function () { return this.coins; };

SkateboardObbyCoinManager.prototype.set = function (_n) {
    const n = Math.max(0, Math.floor(Number(_n) || 0));
    const delta = n - this.coins;
    this.coins = n;
    this._saveTimer = 0.8;   // saved a little later (several coins in a row = one write)
    this.writeCounter();
    this.app.fire('skate:coins', this.coins, delta);
    return this.coins;
};

SkateboardObbyCoinManager.prototype.add = function (_n) { return this.set(this.coins + (Number(_n) || 0)); };

SkateboardObbyCoinManager.prototype.spend = function (_n) {
    const n = Math.max(0, Math.floor(Number(_n) || 0));
    if (this.coins < n) return false;
    this.set(this.coins - n);
    this.save();
    return true;
};

SkateboardObbyCoinManager.prototype.save = function () {
    this._saveTimer = -1;
    SkateboardObby_Utils.setItem(SkateboardObbyCoinManager.KEY, String(this.coins));
};

SkateboardObbyCoinManager.prototype.writeCounter = function () {
    if (this.coins === this._shown) return;
    this._shown = this.coins;
    if (this.counterText && this.counterText.element) this.counterText.element.text = SkateboardObbyCoinManager.fmt(this.coins);
};

SkateboardObbyCoinManager.fmt = function (n) {
    if (n < 10000) return String(n);
    if (n < 1e6) return (Math.floor(n / 100) / 10) + 'K';
    return (Math.floor(n / 1e5) / 10) + 'M';
};

// --- update ---------------------------------------------------------------------------

SkateboardObbyCoinManager.prototype.update = function (dt) {
    this._time += dt;
    if (this._saveTimer > 0) { this._saveTimer -= dt; if (this._saveTimer <= 0) this.save(); }

    if (this.counterIcon && this._iconPop > 0) {
        this._iconPop = Math.max(0, this._iconPop - dt);
        const s = 1 + 0.35 * (this._iconPop / 0.2);
        this.counterIcon.setLocalScale(s, s, s);
    }

    if (!this.count) return;
    const player = this.player;
    const controller = this.app.skateboardObbyPlayerController;
    const alive = !!(player && controller && !controller.isDied);
    const pp = player ? player.getPosition() : null;
    const range2 = this.updateRange * this.updateRange;
    const pick = this.pickupRadius > 0 ? this.pickupRadius : this.coinSize / 2 + 1;
    const pick2 = pick * pick;
    const respawn = this.respawnTime;
    const pop = SkateboardObbyCoinManager.POP_TIME;
    const pos = this.pos, state = this.state, dist2 = this.dist2;
    let changed = ++this._frame % 15 === 0;   // coins entering Draw Range also show up when nothing near animates

    // only the open stage chunks
    let first = 0, end = this.count;
    const stages = this.app.skateStageChunks;
    if (this.chunkFirst && stages && stages.chunkMin >= 0) {
        first = this.chunkFirst[Math.min(stages.chunkMin, this.lastChunk + 1)];
        end = this.chunkFirst[Math.min(stages.chunkMax, this.lastChunk) + 1];
    }
    if (first !== this._first || end !== this._end) {
        this._first = first; this._end = end;
        for (let i = first; i < end; i++) this.dirty[i] = 1;
        changed = true;
    }

    for (let i = first; i < end; i++) {
        const o = i * 3;
        // collected: count up (pick-up pop), come back after respawnTime when it is > 0 (also far away)
        if (state[i] > 0) {
            if (respawn > 0) {
                state[i] += dt;
                if (state[i] >= respawn) { state[i] = 0; this.dirty[i] = 1; }
            } else if (state[i] < pop + 1) {
                state[i] += dt;
            }
        }

        let near = 0;
        if (pp) {
            const dx = pos[o] - pp.x, dy = pos[o + 1] - pp.y, dz = pos[o + 2] - pp.z;
            const d2 = dx * dx + dy * dy + dz * dz;
            dist2[i] = d2;
            near = d2 < range2 ? 1 : 0;
            if (this._model) {   // LOD, 2 m hysteresis
                const r = this.modelRange <= 0 ? Infinity : this.modelRange + (this.lod[i] ? 2 : -2);
                const l = d2 < r * r ? 1 : 0;
                if (l !== this.lod[i]) { this.lod[i] = l; this.dirty[i] = 1; }
            }
            if (near && alive && state[i] === 0 && d2 < pick2) this.collect(i);
        }

        // far coins keep their last matrix (static), collected ones finish their pop, then vanish
        if (near || this.dirty[i] || (state[i] > 0 && state[i] < pop + dt)) {
            this.writeMatrix(i);
            this.dirty[i] = 0;
            changed = true;
        }
    }

    if (changed && this.vb) this.compact(first, end);
};

SkateboardObbyCoinManager.prototype.collect = function (i) {
    this.state[i] = 1e-4;
    this.add(this.coinValue);
    this._iconPop = 0.2;
    const p = this.player;
    if (p && p.sound && this.sound && p.sound.slot(this.sound)) p.sound.play(this.sound);
};

SkateboardObbyCoinManager.prototype.writeMatrix = function (i) {
    const off = i * 16;
    const st = this.state[i];
    const pop = SkateboardObbyCoinManager.POP_TIME;
    if (st >= pop) { this.instanceData.set(this._zero, off); return; }   // collected: zero matrix = not drawn

    const o = i * 3;
    const ph = this.phase[i];
    let k = 1, lift = 0;
    if (st > 0) { const t = st / pop; k = 1 + 0.5 * t; lift = 0.6 * t; }   // pick-up pop: grows and rises, then gone
    const bob = Math.sin((this._time * this.bobSpeed + ph * 6.283) ) * this.bobHeight;
    this._v.set(this.pos[o], this.pos[o + 1] + bob + lift, this.pos[o + 2]);
    this._qSpin.setFromEulerAngles(0, this._time * this.spinSpeed + ph * 360, 0);
    const d = this.coinSize * k;
    if (this._model && this.lod[i]) {   // model: already stands (face along Z), keeps its own thickness
        const m = d * this._modelScale;
        this._s.set(m, m, m);
        this._m.setTRS(this._v, this._qSpin, this._s);
    } else {
        this._q.mul2(this._qSpin, this._qTilt);
        this._s.set(d, this.coinThickness * k, d);
        this._m.setTRS(this._v, this._q, this._s);
    }
    this.instanceData.set(this._m.data, off);
};

// debug: put every coin back
SkateboardObbyCoinManager.prototype.respawnAll = function () {
    for (let i = 0; i < this.count; i++) { this.state[i] = 0; this.dirty[i] = 1; }
};
