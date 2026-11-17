/*
 * SkateboardObby_AdPickups (entity AdPickups, scene root)
 * VIP and Boost as ground pickups, in the look of Monkey Obby's power-ups (template SkateboardObby_PowerupLook): stand on the ring, the radial
 * fills, one rewarded ad. The rewards are the old ones: VipManager.watchAdForVip (VIP, then BOSS VIP while VIP runs; lock, duration, Client:SetVip,
 * Vip:Changed all stay there) and the giveItem event of the Boost power-up (PlayerItemManager).
 * Rows: SkateboardObby_BoardPickupTable (SkateboardObby_BoardPickups.js), rows with `type` 'vip' or 'boost'. stage 0 = lobby, always offered.
 *   Stage rows: a pool of looks on the rows of every open stage (past DETAIL_RANGE only the ring and the crown draw), hidden while the player has VIP or the lock runs.
 *   Lobby VIP: shows what is on offer (VIP, BOSS VIP, or the lock's countdown: VipManager writes its stand text into this label).
 * Rows are checked 4 times a second. Analytics: skate:boardEvent ('vip-pickup' | 'boost-pickup', 'ad-start' | 'ad-complete').
 */
var SkateboardObbyAdPickups = pc.createScript('skateboardObbyAdPickups');

SkateboardObbyAdPickups.attributes.add('showRange', { type: 'number', default: 110, title: 'Show Range', description: 'Meters' });
SkateboardObbyAdPickups.attributes.add('lookScale', { type: 'number', default: 1.6, title: 'Look Scale', description: 'Same as the board pickups' });
SkateboardObbyAdPickups.attributes.add('touchRadius', { type: 'number', default: 2.2, title: 'Touch Radius' });
SkateboardObbyAdPickups.attributes.add('holdTime', { type: 'number', default: 1.6, title: 'Hold Time', description: 'Seconds to stand on it before the ad. Riding through never fills it' });
SkateboardObbyAdPickups.attributes.add('objectHeight', { type: 'number', default: 1.2, title: 'Object Height', description: 'Local, before Look Scale' });
SkateboardObbyAdPickups.attributes.add('crownTilt', { type: 'number', default: -14, title: 'Crown Tilt' });
SkateboardObbyAdPickups.attributes.add('boostScale', { type: 'number', default: 0.7, title: 'Boost Model Scale' });
SkateboardObbyAdPickups.attributes.add('adTimeout', { type: 'number', default: 6, title: 'Ad Start Timeout' });

SkateboardObbyAdPickups.POOL = 8;              // one row at each of up to 8 open stages
SkateboardObbyAdPickups.DETAIL_RANGE = 90;
SkateboardObbyAdPickups.TEMPLATE = 314386071;              // SkateboardObby_PowerupLook
SkateboardObbyAdPickups.BOOST_RENDER = 313129839;          // Boost_Bolt.001, same model as the old RadialAwarder_Boost
SkateboardObbyAdPickups.BOOST_MATERIALS = [313129813, 313129814];

SkateboardObbyAdPickups.prototype.initialize = function () {
    this.app.skateAdPickups = this;
    this.stageRows = [];
    this.state = 'idle';     // idle | ad
    this._scan = 0;
    this._offer = -1;
    this._adEvent = null;
    this._sawAd = false;
    this._adSince = 0;
    this.on('destroy', this.onDestroy, this);
    this.app.on('Vip:Changed', this.onVipChanged, this);
};

SkateboardObbyAdPickups.prototype.postInitialize = function () {
    this.player = this.app.root.findByName('Player');
    this.vip = this.app.vipManager;
    const nm = this.app.skateboardObbyNetworkManager;
    const cps = this.app.root.findByName('Checkpoints');
    const list = SkateboardObby_PickupRows(nm && nm.sceneName, cps);
    let vipRow = null, boostRow = null;
    for (let i = 0; i < list.length; i++) {
        const r = list[i];
        if (!r.pos || (r.type !== 'vip' && r.type !== 'boost')) continue;
        const row = { type: r.type, stage: r.stage, sticky: !!r.sticky, x: r.pos[0], y: r.pos[1], z: r.pos[2], cp: cps ? cps.findByName('Checkpoint_' + (r.stage - 1)) : null };
        if (r.stage > 0) this.stageRows.push(row);
        else if (r.type === 'vip') vipRow = row;
        else boostRow = row;
    }
    const asset = this.app.assets.get(SkateboardObbyAdPickups.TEMPLATE);
    if (!asset || (!vipRow && !boostRow && !this.stageRows.length)) return;
    const make = () => {
        if (this.built || !this.entity.parent || !asset.resource) return;
        this.built = true;
        this.lobbyVip = vipRow && this.vip ? this.makeSlot(asset, vipRow, 'vip') : null;
        this.lobbyBoost = boostRow ? this.makeSlot(asset, boostRow, 'boost') : null;
        this.stageVips = [];
        if (this.stageRows.length && this.vip) for (let i = 0; i < SkateboardObbyAdPickups.POOL; i++) this.stageVips.push(this.makeSlot(asset, null, 'vip'));
        if (this.lobbyVip) this.vip.ui.standText = this.lobbyVip.look.label;
        if (this.lobbyBoost) this.setBoostItem(this.lobbyBoost);
        for (let i = 0; i < this.stageVips.length; i++) this.setVipItem(this.stageVips[i], 1);
        this._scan = 0;
    };
    if (asset.loaded) make();
    else { asset.ready(make); this.app.assets.load(asset); }
};

SkateboardObbyAdPickups.prototype.onDestroy = function () {
    this.app.off('Vip:Changed', this.onVipChanged, this);
    if (this.vip && this.vip.ui && this.lobbyVip && this.vip.ui.standText === this.lobbyVip.look.label) this.vip.ui.standText = null;
    [this.lobbyVip, this.lobbyBoost].concat(this.stageVips || []).forEach((s) => { if (s) s.root.destroy(); });
    if (this.app.skateAdPickups === this) this.app.skateAdPickups = null;
};

// --- looks ----------------------------------------------------------------------------------------

SkateboardObbyAdPickups.prototype.makeSlot = function (asset, row, kind) {
    const root = asset.resource.instantiate();
    root.enabled = false;
    this.app.root.addChild(root);
    const look = root.script.skateboardObbyPowerupLook;
    look.setup({ scale: this.lookScale, touchRadius: this.touchRadius, holdTime: this.holdTime, canTake: () => this.canTake(kind), onFull: () => this.onHoldDone(kind) });
    return { root: root, look: look, row: row, on: false };
};

// A low-poly crown made here once: no asset, nothing to load, 2 draw calls. Radius about 0.7, height about 0.85 (before Look Scale).
SkateboardObbyAdPickups.crown = function (device) {
    if (SkateboardObbyAdPickups._crown) return SkateboardObbyAdPickups._crown;
    const gold = [], gems = [];
    const addTri = (out, a, b, c) => { out.push(a, b, c); };
    const ring = (angle, r, y) => [Math.sin(angle) * r, y, Math.cos(angle) * r];
    const N = 10, step = Math.PI * 2 / N;
    for (let i = 0; i < N; i++) {
        const a0 = i * step, a1 = (i + 1) * step;
        const y0 = i % 2 === 0 ? 0.3 : 0.72, y1 = i % 2 === 0 ? 0.72 : 0.3;      // valley, tip, valley...
        for (let k = 0; k < 2; k++) {           // outer wall, inner wall (seen from behind the crown)
            const r = k === 0 ? 0.68 : 0.6, rt = k === 0 ? 0.76 : 0.68;
            const b0 = ring(a0, r, 0), b1 = ring(a1, r, 0), t0 = ring(a0, r + (rt - r) * y0 / 0.72, y0), t1 = ring(a1, r + (rt - r) * y1 / 0.72, y1);
            if (k === 0) { addTri(gold, b0, b1, t1); addTri(gold, b0, t1, t0); }
            else { addTri(gold, b1, b0, t0); addTri(gold, b1, t0, t1); }
        }
        // band: a thicker ring around the foot
        const o0 = ring(a0, 0.74, 0), o1 = ring(a1, 0.74, 0), p0 = ring(a0, 0.74, 0.17), p1 = ring(a1, 0.74, 0.17), q0 = ring(a0, 0.66, 0.2), q1 = ring(a1, 0.66, 0.2);
        addTri(gold, o0, o1, p1); addTri(gold, o0, p1, p0);
        addTri(gold, p0, p1, q1); addTri(gold, p0, q1, q0);
        // a gem on every tip, a gem on the band under every tip
        if (i % 2 === 1) continue;
        const tip = ring(a1, 0.76, 0.76), band = ring(a1, 0.76, 0.09);
        [[tip, 0.09], [band, 0.075]].forEach((g) => {
            const c = g[0], s = g[1], ax = [Math.cos(a1) * s, 0, -Math.sin(a1) * s], az = [Math.sin(a1) * s, 0, Math.cos(a1) * s];
            const top = [c[0], c[1] + s * 1.2, c[2]], bot = [c[0], c[1] - s * 1.2, c[2]];
            const v = [[c[0] + ax[0], c[1], c[2] + ax[2]], [c[0] + az[0], c[1], c[2] + az[2]], [c[0] - ax[0], c[1], c[2] - ax[2]], [c[0] - az[0], c[1], c[2] - az[2]]];
            for (let j = 0; j < 4; j++) {
                const m = v[j], n = v[(j + 1) % 4];
                addTri(gems, m, n, top);
                addTri(gems, n, m, bot);
            }
        });
    }
    const build = (tris) => {
        const pos = [], nor = [], idx = [];
        for (let i = 0; i < tris.length; i += 3) {
            const a = tris[i], b = tris[i + 1], c = tris[i + 2];
            const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
            let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            nx /= l; ny /= l; nz /= l;
            pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
            nor.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
            idx.push(i, i + 1, i + 2);
        }
        const mesh = new pc.Mesh(device);
        mesh.setPositions(pos);
        mesh.setNormals(nor);
        mesh.setIndices(idx);
        mesh.update();
        mesh.incRefCount();     // shared by every look, for the whole page: Render never destroys it
        return mesh;
    };
    const material = (r, g, b, e) => {
        const m = new pc.StandardMaterial();
        m.diffuse.set(r, g, b);
        m.emissive.set(r * e, g * e, b * e);
        m.gloss = 0.6;
        m.update();
        return m;
    };
    SkateboardObbyAdPickups._crown = [
        { mesh: build(gold), material: material(1, 0.66, 0.05, 0.16) },
        { mesh: build(gems), material: material(0.55, 0.15, 0.9, 0.22) }
    ];
    return SkateboardObbyAdPickups._crown;
};

// count 0 hides the video icon: the lock's countdown, or BOSS VIP already running (lobby only)
SkateboardObbyAdPickups.prototype.setVipItem = function (slot, count) {
    const look = slot.look, armed = look.armed;
    look.setItem({
        name: this.vip.getName(1), color: this.vip.getColor(1), count: count,
        meshes: SkateboardObbyAdPickups.crown(this.app.graphicsDevice), renderScale: 1, renderHeight: this.objectHeight, renderTilt: this.crownTilt
    });
    look.armed = armed;     // VIP just given while standing here: no BOSS VIP ad until the player has stepped off
};

SkateboardObbyAdPickups.prototype.setBoostItem = function (slot) {
    const db = this.app.root.findByName('ItemDatabase'), items = db && db.script.skateboardObbyItemDatabase.items;
    const item = items && items[SkateboardObbyItems.Boost];
    this.boostFee = item ? item.priceAd : 1;
    slot.look.setItem({
        name: item ? item.name : 'Boost', count: this.boostFee,
        render: SkateboardObbyAdPickups.BOOST_RENDER, materials: SkateboardObbyAdPickups.BOOST_MATERIALS, renderScale: this.boostScale, renderHeight: this.objectHeight
    });
};

SkateboardObbyAdPickups.prototype.setOn = function (slot, on) {
    if (slot.on === on) return;
    slot.on = on;
    if (on) { slot.look.setSticky(slot.row.sticky); slot.look.place(slot.row.x, slot.row.y, slot.row.z); }
    else slot.root.enabled = false;
};

// --- which row ------------------------------------------------------------------------------------

SkateboardObbyAdPickups.prototype.inRange = function (r, p) {
    const dx = r.x - p.x, dy = r.y - p.y, dz = r.z - p.z;
    return dx * dx + dy * dy + dz * dz;
};

SkateboardObbyAdPickups.prototype.refresh = function () {
    const p = this.player.getPosition(), range2 = this.showRange * this.showRange;
    if (this.lobbyBoost) this.setOn(this.lobbyBoost, this.inRange(this.lobbyBoost.row, p) < range2);
    if (this.lobbyVip) {
        const offer = this.vip.isLocked() ? 0 : this.vip.getOfferLevel();
        if (offer !== this._offer) {
            this._offer = offer;
            this.setVipItem(this.lobbyVip, offer > 0 ? 1 : 0);
            this.vip.updateTexts(true);     // the label belongs to VipManager: VIP, BOSS VIP or the countdown
        }
        this.setOn(this.lobbyVip, this.inRange(this.lobbyVip.row, p) < range2);
    }
    const vips = this.stageVips;
    if (vips.length) {
        const offer = !this.vip.isActive() && !this.vip.isLocked(), range2 = SkateboardObbyAdPickups.DETAIL_RANGE * SkateboardObbyAdPickups.DETAIL_RANGE;
        const sc = this.app.skateStageChunks, here = sc ? sc.chunkAtPlayer() : null, first = here === null ? 0 : here - 1;     // the open window can reach far behind the rider
        for (let i = 0; i < vips.length; i++) {
            const s = vips[i], r = s.row;
            if (r && (!offer || r.stage < first || (r.cp && !r.cp.enabled))) { this.setOn(s, false); r.slot = null; s.row = null; }
        }
        let free = 0, budget = 3;
        if (offer) {
            for (let i = 0; i < this.stageRows.length && budget > 0; i++) {
                const r = this.stageRows[i];
                if (r.slot || r.stage < first || (r.cp && !r.cp.enabled)) continue;
                while (free < vips.length && vips[free].row) free++;
                if (free >= vips.length) break;
                vips[free].row = r;
                r.slot = vips[free];
                this.setOn(vips[free], true);
                budget--;
            }
        }
        for (let i = 0; i < vips.length; i++) {
            const s = vips[i], r = s.row;
            if (!r) continue;
            const dx = r.x - p.x, dz = r.z - p.z;
            s.look.setDetail(dx * dx + dz * dz < range2);
        }
    }
};

SkateboardObbyAdPickups.prototype.onVipChanged = function (_active) {
    this._scan = 0;
    if (this.state === 'ad' && _active) this.adDone();
};

SkateboardObbyAdPickups.prototype.update = function (dt) {
    if (!this.built || !this.player) return;
    this._scan -= dt;
    if (this._scan <= 0 && this.state !== 'ad') {
        this._scan = 0.25;
        this.refresh();
    }
    if (this.state === 'ad') this.updateAd();
};

// --- standing on it, the ad -----------------------------------------------------------------------

SkateboardObbyAdPickups.prototype.canTake = function (kind) {
    const a = this.app, c = a.skateboardObbyPlayerController;
    if (this.state === 'ad' || a.isWatchingAd || (c && c.isDied) || a.menuPanelEnabled || a.deadMenuEnabled || a.isPopupEnabled || a.isMarketEnabled || (a.numpad && a.numpad.enabled) || a.inCutscene) return false;
    return kind !== 'vip' || !this.vip.isLocked();
};

SkateboardObbyAdPickups.prototype.onHoldDone = function (kind) {
    if (!this.canTake(kind) || !this.app.adRewarder) return;
    if (kind === 'vip') {
        this.startAd('vip-pickup', () => this.vip.watchAdForVip());
        return;
    }
    const pim = this.app.playerItemManager;
    if (!pim || !pim.canBuyBoostPowerup()) return;     // it says why itself
    this.startAd('boost-pickup', () => this.app.adRewarder.watchAd(() => {
        this.adDone();
        this.app.fire('giveItem', SkateboardObbyItems.Boost);
    }, this.boostFee));
};

SkateboardObbyAdPickups.prototype.startAd = function (eventName, go) {
    this.state = 'ad';
    this._adEvent = eventName;
    this._sawAd = false;
    this._adSince = pc.now();
    this.app.fire('skate:boardEvent', eventName, 'ad-start');
    if (this.app.gameplayStarted) {
        this.app.gameplayStarted = false;
        if (typeof PokiSDK !== 'undefined') PokiSDK.gameplayStop();
    }
    const c = this.app.skateboardObbyPlayerController;
    if (c && c.stopMovement) c.stopMovement();
    try {
        go();     // a cancelled or failed ad never runs the reward
    } catch (e) {
        this.state = 'idle';
        this.warnAds();
    }
};

SkateboardObbyAdPickups.prototype.adDone = function () {
    this.state = 'idle';
    this._scan = 0;
    this.app.fire('skate:boardEvent', this._adEvent, 'ad-complete');
};

// the ad API only reports success, so the end of a failed ad is read from isWatchingAd
SkateboardObbyAdPickups.prototype.updateAd = function () {
    if (this.app.isWatchingAd === true) { this._sawAd = true; return; }
    if (this._sawAd) {
        this.state = 'idle';
        this.app.fire('WarningTextController:setWarning', 'Watch the whole ad to get it.', 3, new pc.Color(1, 0.6, 0.2, 1));
    } else if (pc.now() - this._adSince > this.adTimeout * 1000) {
        this.state = 'idle';
        this.warnAds();
    }
};

SkateboardObbyAdPickups.prototype.warnAds = function () {
    this.app.fire('WarningTextController:setWarning', 'Ads are not available right now.', 3, new pc.Color(1, 0.6, 0.2, 1));
};
