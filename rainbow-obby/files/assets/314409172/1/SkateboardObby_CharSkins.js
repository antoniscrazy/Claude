/*
 * SkateboardObby_CharSkins (on CharSkinManager, scene root, World 1 + World 2)
 * Character skins the player owns and wears. Only the look changes: speed, collider and controller stay.
 * - SkateboardObby_CharSkinCatalog: one row per skin. To add an item, add a row. The Shop's SKIN tab sells them (manager('skin') = this, same owned object).
 * - All skins use the default character's rig (same 19 bones, same bind pose), so every clip works as it is.
 * - Owned for good. Save: "SkateboardObby_CharSkinOwned" (id list), "SkateboardObby_CharSkin" (equipped id). Shared by the worlds.
 * - Other players: Client:SetCharSkin {skin} and the schema field charSkin ("" = default). Not the older int field `skin`,
 *   that is the VIP slot (SkateboardObby_Cosmetics). Client checks `"charSkin" in player`, an old server just shows the default character.
 * - The model is only loaded when someone wears it: the file holds 5 skins and comes down as one. Until it is ready the player keeps the default look.
 * - Goth Girl, Cherry College, Strawberry Fairy: revised models (2026-11-05), the skirt is shaped to the legs and rides them, no rig row. The glue and panel code below has no user now (a row with glue: or panels: would use it).
 * - Pirate coat, Witch robe (SkateboardObby_SkirtRig): the file weights a skirt to the thighs, in a riding pose it wraps them and breaks. Here it hangs from the waist to one extra bone,
 *   SkirtHem. The thigh becomes one straight tube: its top moves down into the hem ring and rides that bone, its bottom stays at the knee, so a leg always comes out of the opening.
 *   The whole skirt rides that one bone, so it keeps its bind pose relation to the legs in that frame. The bone hangs from the waist in the line of the torso; every frame it turns and shortens only as much
 *   as needed to keep knees and feet under the hem plane: the plane separates the skirt from the legs, they cannot cross (postUpdate, no shader, no allocation).
 * Analytics: app event skate:boardEvent (what, action): skin-shop / coins, ad; skin / equip.
 * Console: skins(), skin(id).
 */
var SkateboardObbyCharSkins = pc.createScript('skateboardObbyCharSkins');

SkateboardObbyCharSkins.attributes.add('iconAtlas', { type: 'asset', assetType: 'texture', title: 'Icon Atlas', description: '6 x 4 cells, cell = catalog row "cell". Loaded on demand' });
SkateboardObbyCharSkins.attributes.add('remoteShadows', { type: 'boolean', default: false, title: 'Remote Shadows', description: 'Other players\' skins cast shadows' });

// price = coins. tier colors the Shop row. render = render asset id. glass = material slot that is see-through. tris only for the notes / reports.
// boss: true (priceType 'vip') = VIP only, same rule as the boss board (SkateboardObby_BoardSkins): worn only from its Shop row while VIP is on, never sold, no pickup, not saved as owned.
// hidden: true = not for sale, no Shop row and no stage pickup. Witch: the robe's back still turns with the thighs and the dress shows through it in Push (2026-11-05, waits for a revised model). Other players wearing one still show it. Console: skin(id) still wears it.
var SkateboardObby_CharSkinAll = [
    { boss: true, id: 's21_astronaut', type: 'skin', name: 'Astronaut', tier: 'Legendary', rowColor: 'purple', priceType: 'vip', price: 0, render: 314408562, cell: 8, glass: 2, tris: 15476 },
    { boss: true, id: 's43_spacegirl', type: 'skin', name: 'Space Girl', tier: 'Legendary', rowColor: 'purple', priceType: 'vip', price: 0, render: 314522595, cell: 18, glass: 1, tris: 13492 },
    { id: 'skin_default', type: 'skin', name: 'Default', tier: 'Default', rowColor: 'blue', priceType: 'free', price: 0, render: 0, cell: 21 },
    { id: 's10_jersey', type: 'skin', name: 'Jersey 10', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 250, render: 314408557, cell: 2, tris: 11514 },
    { id: 's25_goth', type: 'skin', name: 'Goth Girl', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 300, render: 314522591, cell: 11, tris: 8472 },
    { id: 's35_buckethat', type: 'skin', name: 'Bucket Hat Girl', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 350, render: 314522590, cell: 13, tris: 10358 },
    { id: 's39_overalls', type: 'skin', name: 'Overalls', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 400, render: 314522589, cell: 14, tris: 12000 },
    { id: 's04_punk', type: 'skin', name: 'Punk Mohawk', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 450, render: 314408559, cell: 1, tris: 11306 },
    { id: 's03_college', type: 'skin', name: 'College Jacket', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 500, render: 314408556, cell: 0, tris: 13524 },
    { id: 's40_cherry', type: 'skin', name: 'Cherry College', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 800, render: 314522597, cell: 15, tris: 12900 },
    { id: 's46_yinyang', type: 'skin', name: 'Yin Yang', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 900, render: 314522598, cell: 20, tris: 11780 },
    { id: 's16_cowboy', type: 'skin', name: 'Cowboy', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 1000, render: 314408560, cell: 6, tris: 11236 },
    { id: 's23_zombie', type: 'skin', name: 'Zombie', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 1200, render: 314408565, cell: 9, tris: 12392 },
    { id: 's14_ninja', type: 'skin', name: 'Ninja', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 1400, render: 314408563, cell: 5, tris: 10980 },
    { id: 's12_pirate', type: 'skin', name: 'Pirate', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 2000, render: 314408558, cell: 3, tris: 14652 },
    { id: 's19_vampire', type: 'skin', name: 'Vampire', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 2200, render: 314408561, cell: 7, tris: 11168 },
    { id: 's29_ghosthunter', type: 'skin', name: 'Ghost Hunter', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 2500, render: 314522592, cell: 12, tris: 13820 },
    { id: 's44_foxgirl', type: 'skin', name: 'Fox Girl', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 3000, render: 314522594, cell: 19, tris: 10320 },
    { id: 's13_viking', type: 'skin', name: 'Viking', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 3500, render: 314408564, cell: 4, tris: 14092 },
    { id: 's42_witch', hidden: true, type: 'skin', name: 'Witch', tier: 'Legendary', rowColor: 'yellow', priceType: 'coins', price: 4500, render: 314522593, cell: 17, tris: 11328 },
    { id: 's41_fairy', type: 'skin', name: 'Strawberry Fairy', tier: 'Legendary', rowColor: 'yellow', priceType: 'coins', price: 5000, render: 314522596, cell: 16, glass: 1, tris: 12132 },
    { id: 's22_alien', type: 'skin', name: 'Alien', tier: 'Legendary', rowColor: 'yellow', priceType: 'coins', price: 6000, render: 314408538, cell: 10, tris: 6500 },
];

// What the Shop and the stage pickups see.
var SkateboardObby_CharSkinCatalog = SkateboardObby_CharSkinAll.filter(it => !it.hidden);

// Skirts: which vertices, read from the GLB (separate mesh islands). A row that does not match (FBX changed) keeps the file's own weights.
// v = vertex count of the mesh, runs = start, count of the skirt's vertices. top / bottom = waist and hem height, x0..x1 / z0..z1 = width and depth of the ring, in the file's units.
var SkateboardObby_SkirtRig = {
    s12_pirate: { v: 8731, runs: [4035, 363, 5125, 161, 7515, 10], top: 78.2, bottom: 56.7, x0: -44.8, x1: 44.8, z0: -28.8, z1: 24.6 },
    // not a skirt, same problem: the robe hangs over the thighs
    s42_witch: { v: 7360, pivot: 84, margin: 2, runs: [2270,10,2284,7,2293,6,2301,6,2309,6,2317,6,2325,6,2333,6,2341,6,2349,6,2357,6,2365,6,2373,6,2381,1,2860,73,2935,3,3050,1,3052,47,3100,1,6871,2,6884,2,6897,2,6908,4,6922,4,6935,4,6947,4,6959,4,6971,4,6986,4,7002,2,7015,2,7028,2,7236,1,7239,1,7242,5,7249,3,7254,4,7262,3,7268,3,7274,3,7278,3,7283,3,7289,4,7295,3,7300,1], top: 107.3, bottom: 59.2, x0: -71.5, x1: 70, z0: -35.5, z1: 22.6 }
};

// How the hem follows the thighs (file units). Measured on the clips, see notes/status/skate_skins.md.
// A row with panels: the skirt hangs from the waist in slices around the body, each slice swings out only as far as a leg needs. The legs are not touched.
// A row with glue: each side of the hem is stuck to the point of the thigh at hem height. It moves with that point and stays upright, so the pleats keep their shape.
// The waist stays on the body. The cloth between the waist and the hem shifts in a straight line, the same line as the thigh inside it. Only the hem between the legs stretches.
var SkateboardObby_SkirtGlue = {
    KNEE_R: 24, FOOT_R: 26,  // half size of a knee and a shoe, for the hem going over them
    CAP: 1.5,           // the top of the thigh tube sits this far inside the hem
    MIDDLE: 14,         // half width of the part between the legs that stretches
    THIGH_TOP: 0.5,     // the thigh under the skirt is this much thinner and stays on the pelvis, its corner cannot swing out
    THIGH_X: 20, THIGH_Z: -1
};

var SkateboardObby_SkirtPanels = {
    THIGH_R: 20,     // half width of a thigh
    THIGH_TOP: 0.5,  // the thigh under the skirt is this much thinner
    THIGH_X: 20, THIGH_Z: -1,   // middle of a thigh in the bind pose
    SHIN_R: 21,      // half width of a lower leg, with its corners
    SHOE_R: 16,      // half width of a shoe around heel and toe
    ROOM: 2,         // room between a leg and the cloth
    MAX_DEG: 80,     // a slice never swings further
    NEIGHBOUR: 0.5,  // a slice follows its neighbours by this share: the cloth stretches smoothly between them
    MAX_OUT: 34, MAX_RISE: 30,
    TENT: 3,         // extra room when the top of a slice goes around a leg at the waist
    REACH: 8,        // a leg this far past the hem still opens the slice: knees stay under the cloth
   
    TOP_BAND: 0.2    // share of the length at the waist that stays on the body
};

var SkateboardObby_SkirtFit = {
    KNEE_RADIUS: 30, // half width of a knee: the edge of a turned knee must stay under the hem plane too
    FOOT_RADIUS: 38, // half size of a shoe: a foot pulled up (tuck) must stay under the hem plane too
    MARGIN: 6,       // room to the hem plane
    GOOD_LEN: 0.7,   // the turn stops as soon as the skirt can keep this share of its length
    BAND_LEN: 8,     // shorter than this = only the bottom edge of a jacket, it never leaves the waist
    MIN_LEN: 0.15,   // the skirt never gets shorter than this share of its length
    KNEE_Y: 36,      // height of the knee ring in the bind pose
    WAIST_BAND: 0, // share of the skirt's length that still follows the body at the waist
    TUBE: 24,        // half width of a thigh, only for how wide the skirt looks
    MAX_SCALE: 1.3   // limit of the stretch
};

SkateboardObbyCharSkins.KEY_OWNED = 'SkateboardObby_CharSkinOwned';
SkateboardObbyCharSkins.KEY_EQUIPPED = 'SkateboardObby_CharSkin';
SkateboardObbyCharSkins.DEFAULT_ID = 'skin_default';
SkateboardObbyCharSkins.KEY_BOSS = 'SkateboardObby_CharSkinBoss';
SkateboardObbyCharSkins.ID_RE = /^[a-z0-9_]{1,32}$/;

SkateboardObbyCharSkins.prototype.initialize = function () {
    this.app.skateCharSkins = this;
    this.items = SkateboardObby_CharSkinCatalog;
    this.byId = {};
    SkateboardObby_CharSkinAll.forEach(it => { this.byId[it.id] = it; });
    this.remotes = [];
    this.pending = [];
    this._sentRoom = null;
    this._sentId = null;
    this._netTimer = 0;
    this.player = this.app.root.findByName('Player');

    this.loadSave();
    this.applyLocal();

    this.app.on('player:add', this.onPlayerAdd, this);
    this.app.on('player:remove', this.onPlayerRemove, this);
    this.app.on('Vip:Changed', this.onVipChanged, this);
    this.on('destroy', this.onDestroy, this);
    SkateboardObby_CharSkinDebug.install(this.app);
};

SkateboardObbyCharSkins.prototype.onDestroy = function () {
    this.app.off('player:add', this.onPlayerAdd, this);
    this.app.off('player:remove', this.onPlayerRemove, this);
    this.app.off('Vip:Changed', this.onVipChanged, this);
    for (let i = this.remotes.length - 1; i >= 0; i--) this.removeRemote(this.remotes[i]);
    SkateboardObby_CharSkinDebug.uninstall();
    SkateboardObby_CharSkinModel.skirted.length = 0;
    if (this.app.skateCharSkins === this) this.app.skateCharSkins = null;
};

// --- save ---------------------------------------------------------------------------------------

SkateboardObbyCharSkins.prototype.loadSave = function () {
    this.owned = {};
    let list = null;
    try { list = JSON.parse(SkateboardObby_Utils.getItem(SkateboardObbyCharSkins.KEY_OWNED) || 'null'); } catch (e) { list = null; }
    if (Array.isArray(list)) list.forEach(id => { if (this.byId[id] && !this.byId[id].boss) this.owned[id] = true; });
    this.items.forEach(it => { if (it.priceType === 'free') this.owned[it.id] = true; });
    const eq = SkateboardObby_Utils.getItem(SkateboardObbyCharSkins.KEY_EQUIPPED);
    this.normal = (eq && this.byId[eq] && this.owned[eq] && !this.byId[eq].hidden) ? eq : SkateboardObbyCharSkins.DEFAULT_ID;
    const bossId = SkateboardObby_Utils.getItem(SkateboardObbyCharSkins.KEY_BOSS);   // id of the worn boss skin, '0' = none
    const boss = bossId && this.byId[bossId] && this.byId[bossId].boss ? this.byId[bossId] : null;
    this.equipped = boss && SkateboardObby_Boss.vipActive(this.app) ? boss.id : this.normal;
    if (bossId && bossId !== '0' && this.equipped !== bossId) SkateboardObby_Utils.setItem(SkateboardObbyCharSkins.KEY_BOSS, '0');
};

SkateboardObbyCharSkins.prototype.save = function () {
    SkateboardObby_Utils.setItem(SkateboardObbyCharSkins.KEY_OWNED, JSON.stringify(Object.keys(this.owned).filter(k => this.owned[k])));
};

// --- API (Shop, later the pickups) ---------------------------------------------------------------

SkateboardObbyCharSkins.prototype.find = function (_id) { return this.byId[_id] || null; };
SkateboardObbyCharSkins.prototype.isOwned = function (_id) { return !!this.owned[_id]; };

// null = back to the default character
SkateboardObbyCharSkins.prototype.equip = function (_id) {
    const _boss = !!(_id && this.byId[_id] && this.byId[_id].boss);
    if (_boss && !SkateboardObby_Boss.vipActive(this.app)) return;   // VIP only
    if (!_boss && (!_id || !this.byId[_id] || !this.owned[_id])) _id = SkateboardObbyCharSkins.DEFAULT_ID;
    if (_id === this.equipped) return;
    this.equipped = _id;
    SkateboardObby_Utils.setItem(SkateboardObbyCharSkins.KEY_BOSS, _boss ? _id : '0');
    if (!_boss) { this.normal = _id; SkateboardObby_Utils.setItem(SkateboardObbyCharSkins.KEY_EQUIPPED, _id); }
    this.applyLocal();
    this.sendSkin();
    this.app.fire('skate:boardEvent', 'skin', 'equip');
    if (_boss) this.app.fire('skate:boardEvent', 'boss-item', 'equip');
};

// VIP ended: back to the last normal skin. Not an equip of the player's, no event.
SkateboardObbyCharSkins.prototype.onVipChanged = function (_active) {
    const it = this.byId[this.equipped];
    if (_active || !it || !it.boss) return;
    this.equipped = this.normal;
    SkateboardObby_Utils.setItem(SkateboardObbyCharSkins.KEY_BOSS, '0');
    this.applyLocal();
    this.sendSkin();
};

// Ground pickup: owned for good, worn at once (same call as the boards' unlock). The Shop has its own unlock (same owned object).
SkateboardObbyCharSkins.prototype.unlock = function (_item) {
    if (_item.boss) return;
    this.owned[_item.id] = true;
    this.save();
    this.app.fire('skate:shopChanged');
    this.equip(_item.id);
};

SkateboardObbyCharSkins.prototype.applyLocal = function () {
    if (this.player) SkateboardObby_CharSkinModel.apply(this.app, this.player, this.byId[this.equipped], true);
};

// UI cell of an item: image element shows only that part of the atlas
SkateboardObbyCharSkins.prototype.setIcon = function (_element, _item) {
    if (this.iconAtlas) _element.textureAsset = this.iconAtlas.id;
    _element.rect = SkateboardObby_CharSkinModel.cellRect(_item.cell);
};

// --- network ------------------------------------------------------------------------------------

SkateboardObbyCharSkins.prototype.onPlayerAdd = function (_ent) {
    if (_ent) this.pending.push(_ent);   // networkData is set right after this event
};

SkateboardObbyCharSkins.prototype.onPlayerRemove = function (_data) {
    for (let i = this.remotes.length - 1; i >= 0; i--) if (this.remotes[i].data === _data) this.removeRemote(this.remotes[i]);
};

SkateboardObbyCharSkins.prototype.attachRemote = function (_ent) {
    const d = _ent.networkData;
    if (!d || !('charSkin' in d)) return;   // old server: no field
    const r = { entity: _ent, data: d, unlisten: null, onDestroy: null };
    this.remotes.push(r);
    const _set = (v) => {
        const it = (typeof v === 'string' && SkateboardObbyCharSkins.ID_RE.test(v)) ? this.byId[v] : null;
        if (r.entity && r.entity.parent) SkateboardObby_CharSkinModel.apply(this.app, r.entity, it, this.remoteShadows);
    };
    try { r.unlisten = d.listen('charSkin', _set); } catch (e) { r.unlisten = null; }
    _set(d.charSkin);
    r.onDestroy = () => this.removeRemote(r);
    _ent.once('destroy', r.onDestroy);
};

SkateboardObbyCharSkins.prototype.removeRemote = function (r) {
    const i = this.remotes.indexOf(r);
    if (i >= 0) this.remotes.splice(i, 1);
    if (r.unlisten) { try { r.unlisten(); } catch (e) { } r.unlisten = null; }
    if (r.entity && r.onDestroy) r.entity.off('destroy', r.onDestroy);
};

SkateboardObbyCharSkins.prototype.sendSkin = function () {
    try {
        const nm = this.app.skateboardObbyNetworkManager, room = nm && nm.room;
        if (!room || !room.state || !room.state.players) return;
        const me = room.state.players.get(room.sessionId);
        if (!me || !('charSkin' in me)) return;   // old server
        const id = this.equipped === SkateboardObbyCharSkins.DEFAULT_ID ? '' : this.equipped;
        if (this._sentRoom === room && this._sentId === id) return;
        room.send('Client:SetCharSkin', { skin: id });
        this._sentRoom = room;
        this._sentId = id;
    } catch (e) { }
};

SkateboardObbyCharSkins.prototype.postUpdate = function () {
    const list = SkateboardObby_CharSkinModel.skirted;
    for (let i = list.length - 1; i >= 0; i--) {
        if (!list[i].entity.parent) list.splice(i, 1);
        else if (list[i].built.glue) SkateboardObby_CharSkinModel.fitGlue(list[i]);
        else if (list[i].built.panels) SkateboardObby_CharSkinModel.fitPanels(list[i]);
        else SkateboardObby_CharSkinModel.fit(list[i]);
    }
};

SkateboardObbyCharSkins.prototype.update = function (dt) {
    if (this.pending.length) {
        for (let i = 0; i < this.pending.length; i++) this.attachRemote(this.pending[i]);
        this.pending.length = 0;
    }
    // a new room (reconnect, other world) needs the id again; sendSkin returns at once when nothing changed
    this._netTimer -= dt;
    if (this._netTimer <= 0) { this._netTimer = 1; this.sendSkin(); }
};

// =================================================================================================
// The model on a player entity (local Player or a RemotePlayer copy)
// =================================================================================================
var SkateboardObby_CharSkinModel = {
    ATLAS_W: 1020, ATLAS_H: 680, CELL: 170,
    TARGET: 'SkateBoardObby_Skin_Default',
    GLASS_OPACITY: 0.45,
    skirted: [],     // states with a skirt, fitted in postUpdate
    _glass: null,
    _built: {},      // id -> { meshes, skin, rig }: built once per skin, shared by all players
    _samples: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(() => new pc.Vec3()), _radii: new Float32Array(18), _m: new pc.Mat4(), _m2: new pc.Mat4(), _foot: new pc.Vec3(), _nf: new pc.Vec3(), _td: new pc.Vec3(), _fl: new pc.Vec3(), _fr: new pc.Vec3(), _inv: new pc.Mat4(), _a: new pc.Vec3(), _b: new pc.Vec3(), _c: new pc.Vec3(), _n: new pc.Vec3(), _w: new pc.Vec3(), _ax: new pc.Vec3(), _dl: new pc.Vec3(), _dr: new pc.Vec3(), _kl: new pc.Vec3(), _kr: new pc.Vec3(), _qt: new pc.Quat(), _qo: new pc.Quat(),

    cellRect: function (_cell) {
        const col = _cell % 6, row = Math.floor(_cell / 6), w = this.CELL / this.ATLAS_W, h = this.CELL / this.ATLAS_H;
        return new pc.Vec4(col * w, 1 - (row + 1) * h, w, h);
    },

    state: function (_ent) {
        if (_ent._skateCharSkin) return _ent._skateCharSkin;
        const skin = _ent.findByName('Skin');
        const s = { entity: _ent, root: skin, target: skin ? skin.findByName(this.TARGET) : null, model: null, wantId: null, hem: null, rig: null, mis: null };
        _ent._skateCharSkin = s;
        return s;
    },

    // See-through slot (visor, wings): the palette material, blended. One copy for all players.
    glassFrom: function (_base) {
        if (this._glass) return this._glass;
        const m = _base.clone();
        m.blendType = pc.BLEND_NORMAL;
        m.opacity = this.GLASS_OPACITY;
        m.depthWrite = false;
        m.update();
        this._glass = m;
        return m;
    },

    // Once per skin: the meshes of the file, a skirt gets its weights and the extra bone. The slots of one skin share a vertex buffer.
    build: function (app, _item, _asset) {
        const done = this._built[_item.id];
        if (done) return done;
        const meshes = (_asset.resource && _asset.resource.meshes) || [];
        const out = { meshes: meshes, skin: null, rig: null };
        for (let i = 0; i < meshes.length; i++) meshes[i].incRefCount();   // shared and kept for the next wear: destroying an entity must not destroy them
        const rig = SkateboardObby_SkirtRig[_item.id], m0 = meshes[0];
        if (rig && rig.glue && m0 && m0.skin && m0.vertexBuffer && m0.vertexBuffer.numVertices === rig.v) {
            const gd = this.writeGlue(m0, rig);
            if (gd) {
                const base = m0.skin, ib = base.inverseBindPose.slice(), nm = base.boneNames.slice(), H = base.boneNames.indexOf('Body.001');
                for (let i = 0; i < 2; i++) { ib.push(new pc.Mat4().setTranslate(-gd.ax[i], -gd.ay, -gd.az)); nm.push('SkirtS' + i); }
                const skin = new pc.Skin(app.graphicsDevice, ib, nm);
                for (let i = 0; i < meshes.length; i++) { meshes[i].skin = skin; meshes[i].boneAabb = null; }
                const x = new pc.Vec3();
                base.inverseBindPose[H].getX(x);
                gd.ibp = base.inverseBindPose[H];
                gd.quat = new pc.Quat().setFromMat4(gd.ibp);
                gd.unit = x.length();
                gd.ibpLowL = base.inverseBindPose[base.boneNames.indexOf('LowerLeg_L')];
                gd.ibpLowR = base.inverseBindPose[base.boneNames.indexOf('LowerLeg_R')];
                out.glue = gd;
                if (typeof SkateboardObby_Shatter !== 'undefined') { SkateboardObby_Shatter.MERGE.SkirtS0 = 'SkirtHem'; SkateboardObby_Shatter.MERGE.SkirtS1 = 'SkirtHem'; }
            }
        } else if (rig && rig.panels && m0 && m0.skin && m0.vertexBuffer && m0.vertexBuffer.numVertices === rig.v) {
            const pd = this.writePanels(m0, rig);
            if (pd) {
                const base = m0.skin, ib = base.inverseBindPose.slice(), nm = base.boneNames.slice(), B = base.boneNames.indexOf('Body');
                for (let i = 0; i < rig.panels; i++) { ib.push(new pc.Mat4().setTranslate(-pd.px[i], -rig.top, -pd.pz[i])); nm.push('SkirtP' + i); }
                const skin = new pc.Skin(app.graphicsDevice, ib, nm);
                for (let i = 0; i < meshes.length; i++) { meshes[i].skin = skin; meshes[i].boneAabb = null; }
                const x = new pc.Vec3();
                base.inverseBindPose[B].getX(x);
                pd.ibpBody = base.inverseBindPose[B];
                pd.quat = new pc.Quat().setFromMat4(pd.ibpBody);
                pd.unit = x.length();
                pd.ibpLowL = base.inverseBindPose[base.boneNames.indexOf('LowerLeg_L')];
                pd.ibpLowR = base.inverseBindPose[base.boneNames.indexOf('LowerLeg_R')];
                out.panels = pd;
                // death: the slices fall as one piece, not 12
                if (typeof SkateboardObby_Shatter !== 'undefined') for (let i = 0; i < rig.panels; i++) SkateboardObby_Shatter.MERGE['SkirtP' + i] = 'SkirtHem';
            }
        } else if (rig && !rig.panels && !rig.glue && m0 && m0.skin && m0.vertexBuffer && m0.vertexBuffer.numVertices === rig.v && this.writeSkirt(m0, rig)) {
            const base = m0.skin, c = (rig.x0 + rig.x1) / 2, z = (rig.z0 + rig.z1) / 2;
            const skin = new pc.Skin(app.graphicsDevice, base.inverseBindPose.concat([new pc.Mat4().setTranslate(-c, -(rig.pivot || rig.top), -z)]), base.boneNames.concat(['SkirtHem']));
            for (let i = 0; i < meshes.length; i++) { meshes[i].skin = skin; meshes[i].boneAabb = null; }
            const ibp = base.inverseBindPose[base.boneNames.indexOf('Body.001')], x = new pc.Vec3();
            ibp.getX(x);
            out.rig = rig;
            out.ibp = ibp;
            out.quat = new pc.Quat().setFromMat4(ibp);
            out.unit = x.length();
            out.ibpBody = base.inverseBindPose[base.boneNames.indexOf('Body')];
            out.ibpLowL = base.inverseBindPose[base.boneNames.indexOf('LowerLeg_L')];
            out.ibpLowR = base.inverseBindPose[base.boneNames.indexOf('LowerLeg_R')];
        }
        out.skin = m0 ? m0.skin : null;
        this._built[_item.id] = out;
        return out;
    },

    writeGlue: function (_mesh, rig) {
        const names = _mesh.skin.boneNames, B = names.indexOf('Body'), H = names.indexOf('Body.001'), UL = names.indexOf('UpperLeg_L'), UR = names.indexOf('UpperLeg_R');
        const legs = [UL, UR, names.indexOf('LowerLeg_L'), names.indexOf('LowerLeg_R')];
        if (B < 0 || H < 0 || legs.indexOf(-1) >= 0) return null;
        const vb = _mesh.vertexBuffer, n = vb.numVertices, G = SkateboardObby_SkirtGlue, cx = (rig.x0 + rig.x1) / 2, len = rig.top - rig.bottom, first = names.length;
        let ew = null, ei = null, ep = null;
        vb.getFormat().elements.forEach(el => {
            if (el.name === pc.SEMANTIC_BLENDWEIGHT) ew = el;
            if (el.name === pc.SEMANTIC_BLENDINDICES) ei = el;
            if (el.name === pc.SEMANTIC_POSITION) ep = el;
        });
        if (!ew || !ei || !ep || ei.dataType !== pc.TYPE_UINT8 || ew.dataType !== pc.TYPE_FLOAT32) return null;
        const dv = new DataView(vb.lock()), st = ep.stride, skirt = new Uint8Array(n);
        const ss = v => { v = v < 0 ? 0 : (v > 1 ? 1 : v); return v * v * (3 - 2 * v); };
        const put = (i, b0, b1, w1) => {
            const io = ei.offset + i * st, wo = ew.offset + i * st;
            dv.setUint8(io, b0); dv.setUint8(io + 1, b1); dv.setUint8(io + 2, 0); dv.setUint8(io + 3, 0);
            dv.setFloat32(wo, 1 - w1, true); dv.setFloat32(wo + 4, w1, true); dv.setFloat32(wo + 8, 0, true); dv.setFloat32(wo + 12, 0, true);
        };
        for (let r = 0; r < rig.runs.length; r += 2) {
            const end = rig.runs[r] + rig.runs[r + 1];
            for (let i = rig.runs[r]; i < end; i++) {
                skirt[i] = 1;
                const o = ep.offset + i * st, x = dv.getFloat32(o, true) - cx, y = dv.getFloat32(o + 4, true);
                let u = (rig.top - y) / len;
                u = u < 0 ? 0 : (u > 1 ? 1 : u);
                const fl = ss((x + G.MIDDLE) / (2 * G.MIDDLE)), io = ei.offset + i * st, wo = ew.offset + i * st;
                dv.setUint8(io, B); dv.setUint8(io + 1, first); dv.setUint8(io + 2, first + 1); dv.setUint8(io + 3, 0);
                dv.setFloat32(wo, 1 - u, true); dv.setFloat32(wo + 4, u * fl, true); dv.setFloat32(wo + 8, u * (1 - fl), true); dv.setFloat32(wo + 12, 0, true);
            }
        }
        const knee = rig.kneeY || SkateboardObby_SkirtFit.KNEE_Y;
        for (let i = 0; i < n; i++) {
            const o = ep.offset + i * st, vy = dv.getFloat32(o + 4, true);
            if (skirt[i] || vy <= knee) continue;
            let w = 0, up = 0;
            for (let k = 0; k < 4; k++) {
                const b = dv.getUint8(ei.offset + i * st + k), bw = dv.getFloat32(ew.offset + i * st + k * 4, true);
                if (legs.indexOf(b) >= 0) w += bw;
                if (b === UL || b === UR) up += bw;
            }
            if (w <= 0) continue;
            if (vy <= rig.bottom) {
                // the thigh from the hem to the knee is one straight tube: its top starts inside the hem, no ring of it swings up over the skirt
                if (up < 0.5) continue;
                if ((vy - knee) / (rig.bottom - knee) >= 0.5) {
                    dv.setFloat32(o + 4, rig.bottom + G.CAP, true);
                    put(i, first + (dv.getFloat32(o, true) >= cx ? 0 : 1), 0, 0);
                } else dv.setFloat32(o + 4, knee, true);
                continue;
            }
            if (w >= 0.5) {
                const x = dv.getFloat32(o, true), z = dv.getFloat32(o + 8, true), sx = x >= 0 ? G.THIGH_X : -G.THIGH_X;
                dv.setFloat32(o, sx + (x - sx) * G.THIGH_TOP, true);
                dv.setFloat32(o + 8, G.THIGH_Z + (z - G.THIGH_Z) * G.THIGH_TOP, true);
                put(i, H, 0, 0);
            } else put(i, B, 0, 0);
        }
        vb.unlock();
        return { ax: [G.THIGH_X, -G.THIGH_X], ay: rig.bottom, az: G.THIGH_Z };
    },

    // Runs after the animation wrote the pose. Where the thigh reaches hem height (or its knee, if it does not get that low): the side of the hem goes there.
    fitGlue: function (s) {
        const d = s.built.glue, G = SkateboardObby_SkirtGlue, up = this._a, kn = this._b, dir = this._c, ws = s.pelvis.getWorldTransform();
        this._m.mul2(ws, d.ibp);
        this._inv.copy(this._m).invert();
        for (let k = 0; k < 2; k++) {
            this._inv.transformPoint(s.legs[k * 2].getPosition(), up);
            this._inv.transformPoint(s.legs[k * 2 + 1].getPosition(), kn);
            dir.sub2(kn, up);
            const L = dir.length();
            dir.mulScalar(1 / (L > 1e-4 ? L : 1));
            let dist = L;
            if (-dir.y > 0.05) { const h = (up.y - d.ay) / -dir.y; if (h < L) dist = h; }
            const side = Math.sqrt(Math.max(0, 1 - dir.y * dir.y));
            dir.mulScalar(dist).add(up);
            // a raised knee or foot: the hem goes over it, it stays under the cloth's edge
            let top = kn.y + G.KNEE_R * side;
            this._m2.mul2(s.legs[k * 2 + 1].getWorldTransform(), k ? d.ibpLowR : d.ibpLowL);
            this._m2.transformPoint(this._foot.set(k ? -G.THIGH_X : G.THIGH_X, 12, 2), up);
            this._inv.transformPoint(up, this._fl);
            if (this._fl.y + G.FOOT_R > top) top = this._fl.y + G.FOOT_R;
            if (top > dir.y) dir.y = top;
            d.ibp.transformPoint(dir, kn);
            s.panels[k].setLocalPosition(kn);
        }
    },

    // Panels: every skirt vertex rides the two slices around it. Reads the model's own waist and hem radius per slice.
    writePanels: function (_mesh, rig) {
        const names = _mesh.skin.boneNames, B = names.indexOf('Body');
        if (B < 0 || names.indexOf('LowerLeg_L') < 0 || names.indexOf('LowerLeg_R') < 0) return null;
        const vb = _mesh.vertexBuffer, N = rig.panels, first = names.length, F = SkateboardObby_SkirtPanels;
        let ew = null, ei = null, ep = null;
        vb.getFormat().elements.forEach(el => {
            if (el.name === pc.SEMANTIC_BLENDWEIGHT) ew = el;
            if (el.name === pc.SEMANTIC_BLENDINDICES) ei = el;
            if (el.name === pc.SEMANTIC_POSITION) ep = el;
        });
        if (!ew || !ei || !ep || ei.dataType !== pc.TYPE_UINT8 || ew.dataType !== pc.TYPE_FLOAT32) return null;
        const cx = (rig.x0 + rig.x1) / 2, cz = (rig.z0 + rig.z1) / 2, len = rig.top - rig.bottom;
        const rw = new Array(N).fill(0), rh = new Array(N).fill(0), dv = new DataView(vb.lock()), st = ep.stride;
        for (let r = 0; r < rig.runs.length; r += 2) {
            const end = rig.runs[r] + rig.runs[r + 1];
            for (let i = rig.runs[r]; i < end; i++) {
                const o = ep.offset + i * st, dx = dv.getFloat32(o, true) - cx, y = dv.getFloat32(o + 4, true), dz = dv.getFloat32(o + 8, true) - cz;
                let a = Math.atan2(dx, dz) / (Math.PI * 2);
                if (a < 0) a += 1;
                const c = a * N, p = Math.floor(c) % N, q = (p + 1) % N, w = c - Math.floor(c), near = w < 0.5 ? p : q, rad = Math.sqrt(dx * dx + dz * dz);
                let u = (rig.top - y) / len;
                u = u < 0 ? 0 : (u > 1 ? 1 : u);
                if (u < 0.2 && rad > rw[near]) rw[near] = rad;
                if (u > 0.8 && rad > rh[near]) rh[near] = rad;
                const k = u >= F.TOP_BAND ? 1 : u / F.TOP_BAND, io = ei.offset + i * st, wo = ew.offset + i * st;
                dv.setUint8(io, first + p); dv.setUint8(io + 1, first + q); dv.setUint8(io + 2, B); dv.setUint8(io + 3, 0);
                dv.setFloat32(wo, (1 - w) * k, true); dv.setFloat32(wo + 4, w * k, true); dv.setFloat32(wo + 8, 1 - k, true); dv.setFloat32(wo + 12, 0, true);
            }
        }
        // The part of a thigh under the skirt: thinner and on the pelvis, its corner cannot swing out through the waist. What shows under the hem stays as it is.
        const nv = vb.numVertices, H = names.indexOf('Body.001'), legs = ['UpperLeg_L', 'UpperLeg_R', 'LowerLeg_L', 'LowerLeg_R'].map(b => names.indexOf(b)), isSkirt = new Uint8Array(nv);
        for (let r = 0; r < rig.runs.length; r += 2) for (let i = rig.runs[r]; i < rig.runs[r] + rig.runs[r + 1]; i++) isSkirt[i] = 1;
        for (let i = 0; i < nv; i++) {
            const o = ep.offset + i * st, y = dv.getFloat32(o + 4, true);
            if (isSkirt[i] || y <= rig.bottom) continue;
            let w = 0;
            for (let k = 0; k < 4; k++) if (legs.indexOf(dv.getUint8(ei.offset + i * st + k)) >= 0) w += dv.getFloat32(ew.offset + i * st + k * 4, true);
            if (w <= 0) continue;
            const io = ei.offset + i * st, wo = ew.offset + i * st, x = dv.getFloat32(o, true), z = dv.getFloat32(o + 8, true), side = x >= 0 ? F.THIGH_X : -F.THIGH_X;
            if (w >= 0.5) { dv.setFloat32(o, side + (x - side) * F.THIGH_TOP, true); dv.setFloat32(o + 8, F.THIGH_Z + (z - F.THIGH_Z) * F.THIGH_TOP, true); }
            dv.setUint8(io, w >= 0.5 ? H : B); dv.setUint8(io + 1, 0); dv.setUint8(io + 2, 0); dv.setUint8(io + 3, 0);
            dv.setFloat32(wo, 1, true); dv.setFloat32(wo + 4, 0, true); dv.setFloat32(wo + 8, 0, true); dv.setFloat32(wo + 12, 0, true);
        }
        vb.unlock();
        const d = { n: N, cx: cx, cz: cz, top: rig.top, ax: [], az: [], rw: rw, len: [], rest: [], px: [], pz: [], ux: [], uz: [], deg: new Float32Array(N), out: new Float32Array(N), rise: new Float32Array(N) };
        for (let i = 0; i < N; i++) {
            if (!rw[i]) rw[i] = rw[(i + N - 1) % N] || 30;
            if (!rh[i]) rh[i] = rh[(i + N - 1) % N] || rw[i];
            const a = i / N * Math.PI * 2, ax = Math.sin(a), az = Math.cos(a), slope = rh[i] - rw[i];
            d.ax.push(ax); d.az.push(az);
            d.len.push(Math.sqrt(slope * slope + len * len));
            d.rest.push(Math.atan2(slope, len));
            d.px.push(cx + ax * rw[i]); d.pz.push(cz + az * rw[i]);
            d.ux.push(-az); d.uz.push(ax);   // axis of the swing: down turns to the outside
        }
        return d;
    },

    // Runs after the animation wrote the pose. Leg samples in the file's space (the body's frame); each slice takes the smallest angle that keeps them inside.
    fitPanels: function (s) {
        const d = s.built.panels, F = SkateboardObby_SkirtPanels, P = this._samples, R = this._radii, up = this._a, kn = this._b, c = this._c;
        this._m.mul2(s.waist.getWorldTransform(), d.ibpBody);
        this._inv.copy(this._m).invert();
        let m = 0;
        for (let k = 0; k < 2; k++) {
            this._inv.transformPoint(s.legs[k * 2].getPosition(), up);
            this._inv.transformPoint(s.legs[k * 2 + 1].getPosition(), kn);
            for (let j = 0; j <= 4; j++) { P[m].lerp(up, kn, j / 4); R[m] = F.THIGH_R * (F.THIGH_TOP + (1 - F.THIGH_TOP) * Math.min(1, j / 2)); m++; }
            this._m2.mul2(s.legs[k * 2 + 1].getWorldTransform(), k ? d.ibpLowR : d.ibpLowL);
            const sx = k ? -20 : 20;
            this._m2.transformPoint(this._foot.set(sx, 22, 0), c);
            this._inv.transformPoint(c, up);
            P[m].lerp(kn, up, 0.5); R[m] = F.SHIN_R; m++;
            P[m].copy(up); R[m] = F.SHIN_R; m++;
            // the shoe is long: heel and toe
            this._m2.transformPoint(this._foot.set(sx, 6, -14), c);
            this._inv.transformPoint(c, P[m]); R[m] = F.SHOE_R; m++;
            this._m2.transformPoint(this._foot.set(sx, 6, 18), c);
            this._inv.transformPoint(c, P[m]); R[m] = F.SHOE_R; m++;
        }
        const n = d.n, deg = d.deg, toDeg = pc.math.RAD_TO_DEG;
        for (let i = 0; i < n; i++) {
            let need = 0, out = 0, rise = 0;
            const ax = d.ax[i], az = d.az[i], rw = d.rw[i], L = d.len[i];
            // a leg at the height of the waist: the top of the slice goes out and up around it, the cloth stretches from the body
            for (let j = 0; j < m; j++) {
                const p = P[j], r = R[j] + F.ROOM + F.TENT, rc = (p.x - d.cx) * ax + (p.z - d.cz) * az - rw, y = d.top - p.y;
                if (y < r && rc + r > 0) {
                    const o = rc + r * 0.7;
                    if (o > out) out = o;
                    if (r - y > rise) rise = r - y;
                }
            }
            if (out > F.MAX_OUT) out = F.MAX_OUT;
            if (rise > F.MAX_RISE) rise = F.MAX_RISE;
            d.out[i] = out;
            d.rise[i] = rise;
            for (let j = 0; j < m; j++) {
                const p = P[j], r = R[j] + F.ROOM, rc = (p.x - d.cx) * ax + (p.z - d.cz) * az - rw - out, y = d.top + rise - p.y, dd = rc * rc + y * y;
                if (dd <= r * r) continue;
                if (dd - r * r > (L + F.REACH) * (L + F.REACH)) continue;   // past the hem: comes out of the opening
                const a = Math.atan2(rc, y) + Math.asin(r / Math.sqrt(dd)) - d.rest[i];
                if (a > need) need = a;
            }
            deg[i] = need * toDeg;
        }
        // neighbours, around the ring twice
        for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
            const v = Math.max(deg[(i + 1) % n], deg[(i + n - 1) % n]) * F.NEIGHBOUR;
            if (v > deg[i]) deg[i] = v;
        }
        for (let i = 0; i < n; i++) {
            const a = deg[i] > F.MAX_DEG ? F.MAX_DEG : deg[i];
            this._qt.setFromAxisAngle(this._ax.set(d.ux[i], 0, d.uz[i]), a);
            this._qo.mul2(d.quat, this._qt);
            s.panels[i].setLocalRotation(this._qo);
            d.ibpBody.transformPoint(c.set(d.px[i] + d.ax[i] * d.out[i], d.top + d.rise[i], d.pz[i] + d.az[i] * d.out[i]), up);
            s.panels[i].setLocalPosition(up);
        }
    },

    // Skirt: waist = Body, hem = the extra bone (index right after the file's bones).
    // Leg over the hem height: moved down into the hem ring, rides the extra bone. A leg vertex there always stays inside the ring, in any pose.
    writeSkirt: function (_mesh, rig) {
        const names = _mesh.skin.boneNames, B = names.indexOf('Body'), H = names.indexOf('Body.001');
        const legs = ['UpperLeg_L', 'UpperLeg_R', 'LowerLeg_L', 'LowerLeg_R'].map(n => names.indexOf(n));
        if (B < 0 || H < 0 || legs.indexOf(-1) >= 0) return false;
        const vb = _mesh.vertexBuffer, n = vb.numVertices;
        let ew = null, ei = null, ep = null;
        vb.getFormat().elements.forEach(el => {
            if (el.name === pc.SEMANTIC_BLENDWEIGHT) ew = el;
            if (el.name === pc.SEMANTIC_BLENDINDICES) ei = el;
            if (el.name === pc.SEMANTIC_POSITION) ep = el;
        });
        if (!ew || !ei || !ep || ei.dataType !== pc.TYPE_UINT8 || ew.dataType !== pc.TYPE_FLOAT32) return false;
        const dv = new DataView(vb.lock()), st = ep.stride, hem = names.length, skirt = new Uint8Array(n), knee = rig.kneeY || SkateboardObby_SkirtFit.KNEE_Y;
        const put = (i, bone0, bone1, w1) => {
            const io = ei.offset + i * st, wo = ew.offset + i * st;
            dv.setUint8(io, bone0); dv.setUint8(io + 1, bone1); dv.setUint8(io + 2, 0); dv.setUint8(io + 3, 0);
            dv.setFloat32(wo, 1 - w1, true); dv.setFloat32(wo + 4, w1, true); dv.setFloat32(wo + 8, 0, true); dv.setFloat32(wo + 12, 0, true);
        };
        for (let r = 0; r < rig.runs.length; r += 2) {
            const end = rig.runs[r] + rig.runs[r + 1];
            for (let i = rig.runs[r]; i < end; i++) {
                skirt[i] = 1;
                let u = (rig.top - dv.getFloat32(ep.offset + i * st + 4, true)) / (rig.top - rig.bottom);
                u = u < 0 ? 0 : (u > 1 ? 1 : u);
                const band = rig.pivot ? (rig.top - rig.pivot) / (rig.top - rig.bottom) + SkateboardObby_SkirtFit.WAIST_BAND : SkateboardObby_SkirtFit.WAIST_BAND;
                put(i, B, hem, u >= band ? 1 : u / band);
            }
        }
        for (let i = 0; i < n; i++) {
            const y = dv.getFloat32(ep.offset + i * st + 4, true);
            if (skirt[i] || y <= knee) continue;
            let w = 0, up = -1, upW = 0;
            for (let k = 0; k < 4; k++) {
                const b = dv.getUint8(ei.offset + i * st + k), bw = dv.getFloat32(ew.offset + i * st + k * 4, true);
                if (legs.indexOf(b) >= 0) w += bw;
                if ((b === legs[0] || b === legs[1]) && bw > upW) { up = b; upW = bw; }
            }
            if (w <= 0) continue;
            if (y > rig.bottom) {
                if (w >= 0.5) { dv.setFloat32(ep.offset + i * st + 4, rig.bottom, true); put(i, H, hem, 1); }
                else put(i, B, hem, 0);   // the bottom of the shirt only follows the body
            } else if (up >= 0) {
                // between the hem and the knee: the thigh becomes one straight tube from the hem to the knee ring, so no ring of it swings back over the hem plane
                if ((y - knee) / (rig.bottom - knee) >= 0.5) { dv.setFloat32(ep.offset + i * st + 4, rig.bottom, true); put(i, H, hem, 1); }
                else dv.setFloat32(ep.offset + i * st + 4, knee, true);
            }
        }
        vb.unlock();
        return true;
    },

    // The bones of this player, once. A bone that is missing leaves the default look.
    bones: function (s, _names) {
        if (!s.bones || s.bonesFor !== _names) {
            s.bonesFor = _names;
            s.bones = [];
            for (let i = 0; i < _names.length; i++) {
                if (_names[i].indexOf('SkirtS') === 0) {
                    if (!s.panels) s.panels = [];
                    const no = parseInt(_names[i].slice(6), 10);
                    if (!s.panels[no]) { s.panels[no] = new pc.GraphNode(_names[i]); s.pelvis = s.root.findByName('Body.001'); s.pelvis.addChild(s.panels[no]); }
                    s.bones.push(s.panels[no]);
                } else if (_names[i].indexOf('SkirtP') === 0) {
                    if (!s.panels) s.panels = [];
                    const no = parseInt(_names[i].slice(6), 10);
                    if (!s.panels[no]) { s.panels[no] = new pc.GraphNode(_names[i]); s.root.findByName('Body').addChild(s.panels[no]); }
                    s.bones.push(s.panels[no]);
                } else if (_names[i] === 'SkirtHem') {
                    if (!s.hem) { s.hem = new pc.GraphNode('SkirtHem'); s.pelvis = s.root.findByName('Body.001'); s.pelvis.addChild(s.hem); }
                    s.bones.push(s.hem);
                } else {
                    const b = s.root.findByName(_names[i]);
                    if (!b) { s.bones = null; return null; }
                    s.bones.push(b);
                }
            }
            s.waist = s.root.findByName('Body');
            s.legs = [s.root.findByName('UpperLeg_L'), s.root.findByName('LowerLeg_L'), s.root.findByName('UpperLeg_R'), s.root.findByName('LowerLeg_R')];
        }
        return s.bones;
    },

    // Runs after the animation wrote the pose. Thighs and feet into the file's space. The hem plane turns from straight down to the middle of both thighs
    // only as far as it takes, and stays above the knees and the feet.
    fit: function (s) {
        const b = s.built, r = b.rig, F = SkateboardObby_SkirtFit, py = r.pivot || r.top, len = py - r.bottom, up = this._a, kn = this._b, d = this._c, n = this._n, w = this._w, nf = this._nf;
        this._m.mul2(s.pelvis.getWorldTransform(), b.ibp);
        this._inv.copy(this._m).invert();
        // the waist and the line of the torso, in the same space
        this._m2.mul2(s.waist.getWorldTransform(), b.ibpBody);
        this._m2.transformPoint(w.set((r.x0 + r.x1) / 2, py, (r.z0 + r.z1) / 2), up);
        this._inv.transformPoint(up, w);
        this._m2.transformVector(pc.Vec3.DOWN, up);
        this._inv.transformVector(up, this._td);
        this._td.normalize();
        const td = this._td;
        nf.set(0, 0, 0);
        let lx0 = 1e9, lx1 = -1e9, lz0 = 1e9, lz1 = -1e9;
        for (let k = 0; k < 2; k++) {
            const dk = k ? this._dr : this._dl, kk = k ? this._kr : this._kl, ff = k ? this._fr : this._fl;
            this._inv.transformPoint(s.legs[k * 2].getPosition(), up);
            this._inv.transformPoint(s.legs[k * 2 + 1].getPosition(), kn);
            dk.sub2(kn, up).normalize();
            kk.copy(kn);
            nf.add(dk);
            d.copy(dk).mulScalar(len).add(up);
            if (d.x < lx0) lx0 = d.x;
            if (d.x > lx1) lx1 = d.x;
            if (d.z < lz0) lz0 = d.z;
            if (d.z > lz1) lz1 = d.z;
            this._m2.mul2(s.legs[k * 2 + 1].getWorldTransform(), k ? b.ibpLowR : b.ibpLowL);
            this._m2.transformPoint(this._foot.set(k ? -20 : 20, 5, 2), up);
            this._inv.transformPoint(up, ff);
        }
        if (nf.lengthSq() < 1e-6) nf.set(0, -1, 0);
        nf.normalize();
        let L = -1e9, bx = td.x, by = td.y, bz = td.z;
        const margin = r.margin !== undefined ? r.margin : F.MARGIN;   // Witch: 2 (Finisher, a bigger room tilts the hem into the legs)
        for (let i = 0; i <= 4; i++) {
            const a = i * 0.25;
            n.set(nf.x * a + td.x * (1 - a), nf.y * a + td.y * (1 - a), nf.z * a + td.z * (1 - a)).normalize();
            let room = len;
            for (let k = 0; k < 2; k++) {
                const dk = k ? this._dr : this._dl, cos = dk.dot(n), sin = Math.sqrt(Math.max(0, 1 - cos * cos));
                d.sub2(k ? this._kr : this._kl, w);
                const r1 = d.dot(n) - F.KNEE_RADIUS * sin - margin;
                if (r1 < room) room = r1;
                d.sub2(k ? this._fr : this._fl, w);
                const r2 = d.dot(n) - F.FOOT_RADIUS - margin;
                if (r2 < room) room = r2;
            }
            if (room > L) { L = room; bx = n.x; by = n.y; bz = n.z; }
            if (room >= len * F.GOOD_LEN) break;
        }
        // a tuck deeper than the shortest skirt: the whole skirt rides up the body by the difference
        let lift = 0;
        if (L < len * F.MIN_LEN) { if (len > F.BAND_LEN) lift = len * F.MIN_LEN - L; L = len * F.MIN_LEN; }
        let sx = (lx1 - lx0 + 2 * F.TUBE) / (r.x1 - r.x0), sz = (lz1 - lz0 + 2 * F.TUBE) / (r.z1 - r.z0);
        sx = sx < 1 ? 1 : (sx > F.MAX_SCALE ? F.MAX_SCALE : sx);
        sz = sz < 1 ? 1 : (sz > F.MAX_SCALE ? F.MAX_SCALE : sz);
        const ax = this._ax;   // cross((0, -1, 0), n)
        ax.set(-bz, 0, bx);
        const sinA = ax.length();
        if (sinA > 1e-4) {
            ax.mulScalar(1 / sinA);
            this._qt.setFromAxisAngle(ax, Math.atan2(sinA, -by) * pc.math.RAD_TO_DEG);
            this._qo.mul2(b.quat, this._qt);
        } else this._qo.copy(b.quat);
        s.hem.setLocalRotation(this._qo);
        s.hem.setLocalScale(b.unit * sx, b.unit * (L / len), b.unit * sz);
        w.x -= bx * lift; w.y -= by * lift; w.z -= bz * lift;
        b.ibp.transformPoint(w, up);
        s.hem.setLocalPosition(up);
    },

    // _item: catalog row, null or the default row = default character
    apply: function (app, _ent, _item, _shadows) {
        const s = this.state(_ent);
        if (!s.target || !s.target.render) return;
        const id = _item && _item.render ? _item.id : null;
        if (s.wantId === id) return;
        s.wantId = id;
        if (!id) { this.clear(s); return; }
        const asset = app.assets.get(_item.render);
        if (!asset) { s.wantId = null; this.clear(s); return; }
        const attach = () => {
            if (s.wantId !== id || !_ent.parent) return;   // changed or gone meanwhile
            if (!asset.resource) { s.wantId = null; this.clear(s); return; }   // load error: keep the default look
            this.clear(s);
            const def = s.target.render, built = this.build(app, _item, asset);
            const bones = built.skin ? this.bones(s, built.skin.boneNames) : null;
            if (built.glue && bones) {
                for (let i = 0; i < 2; i++) { s.panels[i].setLocalRotation(built.glue.quat); s.panels[i].setLocalScale(built.glue.unit, built.glue.unit, built.glue.unit); }
            }
            if (built.panels && bones) {
                const pd = built.panels, v = new pc.Vec3();
                for (let i = 0; i < pd.n; i++) {
                    pd.ibpBody.transformPoint(v.set(pd.px[i], pd.top, pd.pz[i]), v);
                    s.panels[i].setLocalPosition(v);
                    s.panels[i].setLocalRotation(pd.quat);
                    s.panels[i].setLocalScale(pd.unit, pd.unit, pd.unit);
                }
            }
            if (!bones) { s.wantId = null; return; }
            const e = new pc.Entity('CharSkinModel');
            const mis = [];
            for (let i = 0; i < built.meshes.length; i++) {
                // the file's own materials are empty copies: every slot is the default character's palette
                const own = def.meshInstances[Math.min(i, def.meshInstances.length - 1)].material;
                const mi = new pc.MeshInstance(built.meshes[i], _item.glass === i ? this.glassFrom(def.meshInstances[0].material) : own, e);
                const si = new pc.SkinInstance(built.skin);
                si.bones = bones.slice(0, built.skin.boneNames.length);
                mi.skinInstance = si;
                mis.push(mi);
            }
            e.addComponent('render', { type: 'asset', castShadows: !!_shadows, receiveShadows: true });
            e.render.meshInstances = mis;
            e.render.castShadows = !!_shadows;
            s.root.addChild(e);
            s.model = e;
            s.mis = mis;
            s.built = built;
            def.enabled = false;
            if (built.rig || built.panels || built.glue) this.skirted.push(s);
        };
        if (asset.loaded) attach();
        else { asset.ready(attach); asset.once('error', () => { if (s.wantId === id) { s.wantId = null; this.clear(s); } }); app.assets.load(asset); }
    },

    clear: function (s) {
        const i = this.skirted.indexOf(s);
        if (i >= 0) this.skirted.splice(i, 1);
        if (s.model) { s.model.destroy(); s.model = null; }
        s.mis = null;
        if (s.target && s.target.render) s.target.render.enabled = true;
    }
};

// =================================================================================================
// Console helpers: skins() lists, skin(id) owns + wears ("" = default)
// =================================================================================================
var SkateboardObby_CharSkinDebug = {
    names: ['skins', 'skin'],
    saved: null,
    app: null,
    install: function (app) {
        if (this.saved) this.uninstall();
        this.app = app;
        this.saved = {};
        this.names.forEach(n => { this.saved[n] = window[n]; window[n] = this[n].bind(this); });
    },
    uninstall: function () {
        if (!this.saved) return;
        this.names.forEach(n => { if (this.saved[n] === undefined) delete window[n]; else window[n] = this.saved[n]; });
        this.saved = null;
        this.app = null;
    },
    skins: function () {
        const m = this.app && this.app.skateCharSkins;
        return m ? SkateboardObby_CharSkinAll.map(t => t.id + '  ' + t.name + '  ' + t.price + (m.owned[t.id] ? '  owned' : '') + (m.equipped === t.id ? '  [equipped]' : '')) : [];
    },
    skin: function (id) {
        const m = this.app && this.app.skateCharSkins;
        if (!m) return null;
        if (id === undefined) return m.equipped;
        if (!id) { m.equip(null); return m.equipped; }
        const it = m.find(id);
        if (!it) return null;
        if (!it.boss) { m.owned[id] = true; m.save(); }
        m.equip(id);
        return m.equipped;
    }
};
