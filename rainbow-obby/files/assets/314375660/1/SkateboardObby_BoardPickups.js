/*
 * SkateboardObby_BoardPickups (on BoardSkinManager, next to SkateboardObby_BoardSkins)
 * Board pickups on the stages. Ad only: stand on it, the radial fills, one rewarded ad, the board is yours and worn.
 * No other way to take it here. A cancelled or failed ad gives nothing; step off and on to try again.
 * Table: SkateboardObby_BoardPickupTable below (world scene name -> rows). A row with `board` is a pickup, a row with only
 * `type` is a stage kept free for later (character skins).
 * A pool of pickups (template SkateboardObby_PowerupLook, the look of Monkey Obby's power-ups) with the 3D model, on the rows of every stage StageChunks has open: they appear with the stage.
 * Past DETAIL_RANGE only the ring and the model draw. A board's icon stands in until the file has loaded. Rows are checked 4 times a second.
 * A row with `skin` sells a character skin the same way (SkateboardObby_CharSkins): the figure, no animation, the file's pose. No picture: until the file has loaded only the ring and name show.
 * Analytics: app event skate:boardEvent ('board-pickup' | 'skin-pickup', 'ad-start' | 'ad-complete').
 */
var SkateboardObbyBoardPickups = pc.createScript('skateboardObbyBoardPickups');

SkateboardObbyBoardPickups.attributes.add('showRange', { type: 'number', default: 110, title: 'Show Range', description: 'Meters. The pickup appears inside this range, on an open stage. Players ride 25-30 m/s' });
SkateboardObbyBoardPickups.attributes.add('touchRadius', { type: 'number', default: 2.2, title: 'Touch Radius' });
SkateboardObbyBoardPickups.attributes.add('lookTemplate', { type: 'asset', assetType: 'template', title: 'Look Template', description: 'SkateboardObby_PowerupLook' });
SkateboardObbyBoardPickups.attributes.add('lookScale', { type: 'number', default: 1.6, title: 'Look Scale', description: 'Monkey power-up = 1. Riders pass at 25-30 m/s here' });
SkateboardObbyBoardPickups.attributes.add('imageSize', { type: 'number', default: 3.4, title: 'Image Size', description: 'World meters. The board takes about 3/4 of the cell (a real board is 2 m)' });
SkateboardObbyBoardPickups.attributes.add('imageHeight', { type: 'number', default: 1.2, title: 'Object Height', description: 'Center of the model / icon. Local, before Look Scale' });
SkateboardObbyBoardPickups.attributes.add('modelLength', { type: 'number', default: 2.8, title: 'Model Length', description: 'World meters (a real board is 2 m)' });
SkateboardObbyBoardPickups.attributes.add('modelTilt', { type: 'number', default: -20, title: 'Model Tilt', description: 'The model stands on its tail, leaning back by this many degrees, and turns' });
SkateboardObbyBoardPickups.attributes.add('holdTime', { type: 'number', default: 1.6, title: 'Hold Time', description: 'Seconds to stand on it before the ad. Riding through never fills it' });
SkateboardObbyBoardPickups.attributes.add('adTimeout', { type: 'number', default: 6, title: 'Ad Start Timeout' });

// stage = the stage whose checkpoint holds the pickup; pos = world position: 3-7 m before the flag, 3.4 m beside the riding line,
// flat ground, no collider, coin or obstacle next to it (raycast scan + seen from the rider's camera)
// Rows with type 'vip' / 'boost' belong to SkateboardObby_AdPickups (stage 0 = lobby), this script skips them.
// A row with `stages` + `layout` is the start of every stage in that range (SkateboardObby_PickupLayouts): a board, a skin and a VIP at each checkpoint flag, see SkateboardObby_PickupRows.
// Which board and skin: the next one the player does not own, from the place the row's progress points to in the price-sorted catalog (SkateboardObbyBoardPickups.pick).
var SkateboardObby_BoardPickupTable = {
    SkateboardObby: [
        { stage: 0, type: 'vip', pos: [4.42, 15, 5.6] },
        { stage: 0, type: 'boost', pos: [-13, 14.92, 4.2] },
        // tier: where in the price-sorted catalog the first and the last stage pick from (0 cheapest, 1 dearest). at: stages where the platform needs other offsets (tools/skate_vip_powerups/stage_layout_check.js)
        {
            stages: [1, 51], layout: 'start', tier: [0, 0.6], vip: true,
            at: {
                6: { board: [-3.5, 8.7] },
                7: { board: [-3.5, 8.7] },
                8: { board: [-3.5, 8.7] },
                14: { board: [-3.5, 6.2], skin: [10.5, 8.7], vip: [0, -6.2] },
                22: { board: [-3.5, 8.7] },
                23: { board: [-3.5, 8.7] },
                24: { board: [-2.5, 6.2], skin: [10.5, 8.7], vip: [-1, -6.2] },
                29: { board: [-3.5, 6.2], skin: [10.5, 8.7], vip: [0, -6.2] },
                31: { board: [-3.5, 8.7] },
                32: { board: [-3.5, 8.7] },
                37: { board: [-3.5, 6.2], skin: [10.5, 8.7], vip: [0, -6.2] },
                38: { board: [-3.5, 8.7] },
                39: { board: [-3.5, 8.7] },
                50: { board: [-4.5, 7.4], skin: [6.5, 8.7], vip: [7, -8.7] },
                51: { board: [-4.5, 7.4], skin: [6.5, 8.7], vip: [7, -8.7] }
            }
        }
    ],
    SkateboardObby_2: [
        { stage: 0, type: 'vip', pos: [24.42, 14.89, 5.6] },
        { stage: 0, type: 'boost', pos: [7, 14.81, 4.2] },
        {
            stages: [1, 59], layout: 'start', tier: [0.3, 1], vip: true,
            at: {
                7: { vip: [1, -8] },
                9: { board: [-3.5, 6.2], skin: [4.5, 6.2], vip: [0, -6.2] },
                12: { board: [-3.5, 8.7], vip: [7, -5.8] },
                16: { board: [-2.5, 6.2], skin: [10.5, 8], vip: [-1, -6.2] },
                22: { vip: [1, -8] },
                23: { vip: [1, -8] },
                27: { board: [-3.5, 8.7], vip: [7, -5.8] },
                28: { board: [-2.5, 6.2], skin: [10.5, 8.7], vip: [-1, -6.2] },
                34: { vip: [1, -8] },
                35: { board: [-3.5, 6.2], skin: [10.5, 8.7], vip: [0, -6.2] },
                43: { board: [-3.5, 6.2], skin: [10.5, 8.7], vip: [0, -6.2] },
                45: { vip: [1, -8] },
                51: { vip: [1, -8] },
                54: { vip: [1, -8] },
                56: { board: [-2.5, 8.7] }
            }
        }
    ]
};

// Offsets from the stage's checkpoint flag, in meters: [forward (towards its SpawnPoint and on), side (+ left, - right)]. Checkpoint platforms are flat for forward -12..12; the road is side -6..6, grey edge to 8, grass to 12.
// A third number lifts the name (local meters): the front board's name stands above the one behind it.
// The rings stand at the road's edge on the grass (radius ~2.1, side 6.6-10.8; user's marks on W1 Stage 1, 2026-11-04), the middle stays free. The rider respawns on the middle line at forward 5.
// Layout rings are sticky (look.setSticky): riding in from the road the board slows down instead of running off the platform.
var SkateboardObby_PickupLayouts = {
    start: { board: [-4.5, 8.7, 0.7], skin: [4.5, 8.7], vip: [1, -8.7] }
};

// The table of a scene as a flat list: layout rows become one row per pickup with a world pos (the flag's height). Same row shapes as written by hand.
var SkateboardObby_PickupRows = function (sceneName, checkpointRoot) {
    const list = SkateboardObby_BoardPickupTable[sceneName] || [], out = [];
    for (let i = 0; i < list.length; i++) {
        const r = list[i];
        if (!r.layout) { out.push(r); continue; }
        const L = SkateboardObby_PickupLayouts[r.layout], cps = checkpointRoot ? checkpointRoot.children : null;
        if (!L || !cps) continue;
        for (let st = r.stages[0]; st <= r.stages[1]; st++) {
            const cp = cps[st - 1];
            if (!cp) continue;
            const spawn = cp.findByName('SpawnPoint') || cp, f = cp.getPosition(), sp = spawn.getPosition();
            let fx = sp.x - f.x, fz = sp.z - f.z;
            const l = Math.sqrt(fx * fx + fz * fz);
            if (l < 0.01) continue;
            fx /= l; fz /= l;
            const o = (r.at && r.at[st]) || {}, at = (v) => [f.x + fx * v[0] + fz * v[1], f.y, f.z + fz * v[0] - fx * v[1]];
            const t = r.tier[0] + (r.tier[1] - r.tier[0]) * (st - r.stages[0]) / Math.max(1, r.stages[1] - r.stages[0]);
            out.push({ stage: st, auto: 'board', t: t, labelLift: L.board[2], sticky: true, pos: at(o.board || L.board) });
            out.push({ stage: st, auto: 'skin', t: t, labelLift: L.skin[2], sticky: true, pos: at(o.skin || L.skin) });
            if (r.vip) out.push({ stage: st, type: 'vip', sticky: true, pos: at(o.vip || L.vip) });
        }
    }
    return out;
};

SkateboardObbyBoardPickups.POOL = 16;                                 // 2 rows at each of up to 8 open stages
SkateboardObbyBoardPickups.SHOW_PER_SCAN = 3;                         // a new stage's pickups come in over a few scans, not in one frame
SkateboardObbyBoardPickups.DETAIL_RANGE = 90;
SkateboardObbyBoardPickups.SKIN_HEIGHT = 3;                           // world meters
SkateboardObbyBoardPickups.SKIN_FILE_HEIGHT = 213;                    // height of a skin in the file's units
SkateboardObbyBoardPickups.SKIN_MATERIALS = [311162253, 311162254, 311162254, 311162254];   // the default character's palette, one for each slot a skin file can have

SkateboardObbyBoardPickups.prototype.initialize = function () {
    this.app.skateBoardPickups = this;
    this.rows = [];
    this.slots = [];
    this.adRow = null;
    this.state = 'idle';     // idle | ad
    this._scan = 0;
    this._t = 0;
    this._sawAd = false;
    this._adSince = 0;
    this.on('destroy', this.onDestroy, this);
    this.app.on('skate:shopChanged', this.onChanged, this);
};

SkateboardObbyBoardPickups.prototype.postInitialize = function () {
    this.manager = this.app.skateBoards;
    this.player = this.app.root.findByName('Player');
    const nm = this.app.skateboardObbyNetworkManager;
    const cps = this.app.root.findByName('Checkpoints');
    const list = SkateboardObby_PickupRows(nm && nm.sceneName, cps);
    const sale = (c) => c.filter((x) => x.priceType !== 'free' && !x.boss).sort((p, q) => p.price - q.price);
    const boards = sale(SkateboardObby_BoardCatalog), skins = sale(SkateboardObby_CharSkinCatalog);
    for (let i = 0; i < list.length; i++) {
        const r = list[i];
        if (r.auto !== 'board' && r.auto !== 'skin') continue;
        const isSkin = r.auto === 'skin', mgr = isSkin ? this.app.skateCharSkins : this.manager;
        if (!mgr || !r.pos) continue;
        this.rows.push({ item: null, list: isSkin ? skins : boards, t: r.t, spent: false, mgr: mgr, isSkin: isSkin, stage: r.stage, labelLift: r.labelLift || 0, sticky: !!r.sticky, x: r.pos[0], y: r.pos[1], z: r.pos[2], cp: cps ? cps.findByName('Checkpoint_' + (r.stage - 1)) : null });
    }
    this.pickAll();
    if (this.rows.length) this.build();
};

// What a stage offers: a band of the price-sorted list that slides up with progress, the stage's place in the band, then the next dearer one the player does not own and the last BAND - 1 stages do not show, else a cheaper one.
SkateboardObbyBoardPickups.BAND = 6;

SkateboardObbyBoardPickups.prototype.pick = function (r, recent) {
    const B = SkateboardObbyBoardPickups.BAND, list = r.list, n = list.length;
    const start = Math.min(n - 1, Math.floor(r.t * Math.max(0, n - B)) + (r.stage - 1) % B);
    const fits = (it, seen) => !r.mgr.isOwned(it.id) && (seen || recent.indexOf(it) < 0);
    for (let round = 0; round < 2; round++) {     // the second round lets a repeat through rather than an empty place
        for (let i = start; i < n; i++) if (fits(list[i], round === 1)) return list[i];
        for (let i = start - 1; i >= 0; i--) if (fits(list[i], round === 1)) return list[i];
    }
    return null;
};

// A row whose pickup was just taken stays empty until the scene opens again: no new ad offer under the rider's feet.
SkateboardObbyBoardPickups.prototype.pickAll = function () {
    const B = SkateboardObbyBoardPickups.BAND, recentBoard = [], recentSkin = [];
    for (let i = 0; i < this.rows.length; i++) {
        const r = this.rows[i], recent = r.isSkin ? recentSkin : recentBoard;
        r.item = r.spent ? null : this.pick(r, recent);
        if (r.item) { recent.push(r.item); if (recent.length >= B) recent.shift(); }
    }
};

SkateboardObbyBoardPickups.prototype.onDestroy = function () {
    this.app.off('skate:shopChanged', this.onChanged, this);
    this.slots.forEach((s) => s.root.destroy());
    if (this.app.skateBoardPickups === this) this.app.skateBoardPickups = null;
};

SkateboardObbyBoardPickups.prototype.onChanged = function () {
    this._scan = 0;
    this.pickAll();
    for (let i = 0; i < this.slots.length; i++) {
        const s = this.slots[i];
        if (s.row && s.row.item !== s.item) this.show(s, null);
    }
};

// --- the pooled pickups ---------------------------------------------------------------------------

SkateboardObbyBoardPickups.prototype.build = function () {
    const asset = this.lookTemplate;
    if (!asset) { this.rows.length = 0; return; }
    const make = () => {
        if (this.slots.length || !this.entity.parent || !asset.resource) return;
        for (let i = 0; i < SkateboardObbyBoardPickups.POOL; i++) {
            const root = asset.resource.instantiate();
            root.enabled = false;
            this.app.root.addChild(root);
            const look = root.script.skateboardObbyPowerupLook, slot = { root: root, look: look, row: null };
            look.setup({ scale: this.lookScale, touchRadius: this.touchRadius, holdTime: this.holdTime, canTake: () => this.canTake(), onFull: () => this.onHoldDone(slot) });
            this.slots.push(slot);
        }
        this._scan = 1;     // the player is still at the scene's own start position for the first frames: no model download from there
    };
    if (asset.loaded) make();
    else { asset.ready(make); this.app.assets.load(asset); }
};

SkateboardObbyBoardPickups.prototype.show = function (slot, _row) {
    if (slot.row === _row) return;
    if (slot.row) slot.row.slot = null;
    slot.row = _row;
    slot.item = _row ? _row.item : null;
    if (_row) _row.slot = slot;
    if (!_row) { slot.root.enabled = false; return; }
    if (_row.isSkin) {
        slot.look.setItem(this.skinItem(_row));
        slot.look.setSticky(_row.sticky);
        slot.look.place(_row.x, _row.y, _row.z);
        return;
    }
    // the icon stands in until the model is there; the first model load is the whole board file (3.83 MB, once), it starts only here, near a pickup
    slot.look.setItem({
        name: _row.item.name, count: 1, labelLift: _row.labelLift,
        image: this.manager.iconAtlas && this.manager.iconAtlas.id, rect: SkateboardObby_BoardModel.cellRect(_row.item.cell), imageSize: this.imageSize / this.lookScale, imageHeight: this.imageHeight,
        render: _row.item.render, material: this.manager.material && this.manager.material.id,
        renderScale: this.modelLength / 2.08 / this.lookScale, renderHeight: this.imageHeight, renderTilt: this.modelTilt
    });
    slot.look.setSticky(_row.sticky);
    slot.look.place(_row.x, _row.y, _row.z);
};

// a character skin: the figure
SkateboardObbyBoardPickups.prototype.skinItem = function (_row) {
    const P = SkateboardObbyBoardPickups, it = _row.item;
    return {
        name: it.name, count: 1, labelLift: _row.labelLift,
        render: it.render, materials: P.SKIN_MATERIALS, renderScale: P.SKIN_HEIGHT / P.SKIN_FILE_HEIGHT / this.lookScale, renderHeight: 0.05
    };
};

// --- which row, who stands on it ------------------------------------------------------------------

// every open row with something to offer has a slot; the far ones draw less
SkateboardObbyBoardPickups.prototype.refresh = function () {
    if (!this.player || !this.slots.length) return;
    const P = SkateboardObbyBoardPickups, slots = this.slots, p = this.player.getPosition();
    const sc = this.app.skateStageChunks, here = sc ? sc.chunkAtPlayer() : null, first = here === null ? 0 : here - 1;     // the open window can reach far behind the rider
    for (let i = 0; i < slots.length; i++) {
        const s = slots[i], r = s.row;
        if (r && ((r.cp && !r.cp.enabled) || r.stage < first)) this.show(s, null);     // the stage is closed (StageChunks) or left behind
    }
    let budget = P.SHOW_PER_SCAN, free = 0;
    for (let i = 0; i < this.rows.length && budget > 0; i++) {
        const r = this.rows[i];
        if (!r.item || r.slot || r.stage < first || (r.cp && !r.cp.enabled)) continue;
        while (free < slots.length && slots[free].row) free++;
        if (free >= slots.length) break;
        this.show(slots[free], r);
        budget--;
    }
    const range2 = P.DETAIL_RANGE * P.DETAIL_RANGE;
    for (let i = 0; i < slots.length; i++) {
        const s = slots[i], r = s.row;
        if (!r) continue;
        const dx = r.x - p.x, dz = r.z - p.z;
        s.look.setDetail(dx * dx + dz * dz < range2);
    }
};

SkateboardObbyBoardPickups.prototype.canTake = function () {
    const a = this.app, c = a.skateboardObbyPlayerController;
    return this.state !== 'ad' && !a.isWatchingAd && !(c && c.isDied) && !a.menuPanelEnabled && !a.deadMenuEnabled && !a.isPopupEnabled && !a.isMarketEnabled && !(a.numpad && a.numpad.enabled) && !a.inCutscene;
};

SkateboardObbyBoardPickups.prototype.update = function (dt) {
    if (!this.rows.length) return;
    this._scan -= dt;
    if (this._scan <= 0 && this.state !== 'ad') {
        this._scan = 0.25;
        this.refresh();
    }
    if (this.state === 'ad') this.updateAd();
};

// the look's radial is full
SkateboardObbyBoardPickups.prototype.onHoldDone = function (slot) {
    if (!slot.row || this.state === 'ad') return;
    const ar = this.app.adRewarder, row = slot.row, item = row.item, event = row.isSkin ? 'skin-pickup' : 'board-pickup';
    if (!ar || !this.canTake()) { this.warnAds(); return; }

    this.state = 'ad';
    this._sawAd = false;
    this._adSince = pc.now();
    this.app.fire('skate:boardEvent', event, 'ad-start');
    if (this.app.gameplayStarted) {
        this.app.gameplayStarted = false;
        if (typeof PokiSDK !== 'undefined') PokiSDK.gameplayStop();
    }
    const c = this.app.skateboardObbyPlayerController;
    if (c && c.stopMovement) c.stopMovement();
    try {
        // one rewarded ad; if it is cancelled or fails the callback never runs and nothing is given
        ar.watchAd(() => this.onRewarded(row));
    } catch (e) {
        this.state = 'idle';
        this.warnAds();
    }
};

SkateboardObbyBoardPickups.prototype.onRewarded = function (_row) {
    this.state = 'idle';
    const _item = _row.item;
    _row.spent = true;
    if (!_item || _row.mgr.isOwned(_item.id)) return;
    _row.mgr.unlock(_item);
    this.app.fire('skate:boardEvent', _row.isSkin ? 'skin-pickup' : 'board-pickup', 'ad-complete');
    this.app.fire('WarningTextController:setWarning', _item.name + ' unlocked!', 3, new pc.Color(0.3, 1, 0.45, 1));
    const gm = this.app.gameManager;
    try { if (gm && gm.sfx_purchase) gm.sfx_purchase(); } catch (e) { }
};

// the ad API only reports success, so the end of a failed ad is read from isWatchingAd
SkateboardObbyBoardPickups.prototype.updateAd = function () {
    if (this.app.isWatchingAd === true) { this._sawAd = true; return; }
    if (this._sawAd) {
        this.state = 'idle';
        this.app.fire('WarningTextController:setWarning', 'Watch the whole ad to get it.', 3, new pc.Color(1, 0.6, 0.2, 1));
    } else if (pc.now() - this._adSince > this.adTimeout * 1000) {
        this.state = 'idle';
        this.warnAds();
    }
};

SkateboardObbyBoardPickups.prototype.warnAds = function () {
    this.app.fire('WarningTextController:setWarning', 'Ads are not available right now.', 3, new pc.Color(1, 0.6, 0.2, 1));
};
