/*
 * SkateboardObby_BoardSkins (on BoardSkinManager, scene root, World 1 + World 2)
 * Board models the player owns and rides. The list and the pickup table are plain data below: to add an item, add a row.
 * - SkateboardObby_BoardCatalog: type "board" rows are rigid models fixed to the Board bone. "skin" is kept free for character skins.
 * - Owned for good. Save: "SkateboardObby_BoardSkinOwned" (id list), "SkateboardObby_BoardSkin" (equipped id). Shared by the worlds.
 * - The Shop's SKATEBOARD tab sells them (SkateboardObby_Shop: manager('board') = this, same owned object). Pickups: SkateboardObby_BoardPickups.
 * - Other players: Client:SetBoardSkin {board} and the schema field boardSkin ("" = default). Not the older int field `board`,
 *   that is the VIP tier slot. Client checks `"boardSkin" in player`, an old server just shows default boards.
 * - The model is only loaded when someone wears it. Until it is ready the player keeps the default board. Physics never change.
 * - Trucks and wheels ride the default board's bones (SkateboardObby_BoardRig): same ground contact, spin and lean as the default board.
 * - The rider stands on the model's own deck (SkateboardObby_BoardLift). Only bones move, once per frame after the animation; the body, collider and camera stay.
 * - boss: true (priceType 'vip') = VIP only, on both VIP tiers: never sold, never a pickup, never saved as owned. Worn only from its Shop row while VIP is on.
 *   KEY_EQUIPPED always keeps the last normal board, KEY_BOSS says the boss board is on. VIP ends: back to the normal board; a new VIP does not put it back on.
 * Analytics: app event skate:boardEvent (what, action), SkateboardObby_Analytics sends them.
 * Console: boards(), board(id).
 */
var SkateboardObbyBoardSkins = pc.createScript('skateboardObbyBoardSkins');

SkateboardObbyBoardSkins.attributes.add('iconAtlas', { type: 'asset', assetType: 'texture', title: 'Icon Atlas', description: '6 x 4 cells, cell = catalog row "cell". Loaded on demand' });
SkateboardObbyBoardSkins.attributes.add('material', { type: 'asset', assetType: 'material', description: 'Palette material of the boards (same as the default board)' });
SkateboardObbyBoardSkins.attributes.add('remoteShadows', { type: 'boolean', default: false, title: 'Remote Shadows', description: 'Other players\' board models cast shadows' });

// price = coins. tier colors the Shop row. render = render asset id. tris only for the notes / reports.
var SkateboardObby_BoardCatalog = [
    { boss: true, id: 'v11_sokak_motoru', type: 'board', name: 'Street Motor', tier: 'Legendary', rowColor: 'purple', priceType: 'vip', price: 0, render: 314371202, cell: 16, tris: 9578 },
    { id: 'board_default', type: 'board', name: 'Classic', tier: 'Default', rowColor: 'blue', priceType: 'free', price: 0, render: 0, cell: 22 },
    { id: 'k08_lav_catlagi', type: 'board', name: 'Lava Crack', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 250, render: 314371200, cell: 14, tris: 5380 },
    { id: 'k06_kozmik_yolcu', type: 'board', name: 'Cosmic Rider', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 300, render: 314371198, cell: 12, tris: 5544 },
    { id: 'k07_sakura_ruzgari', type: 'board', name: 'Sakura Breeze', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 350, render: 314371199, cell: 13, tris: 6084 },
    { id: 'k09_grafiti_canavari', type: 'board', name: 'Graffiti Monster', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 400, render: 314371201, cell: 15, tris: 6538 },
    { id: 'k03_retro_arcade', type: 'board', name: 'Retro Arcade', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 450, render: 314371196, cell: 10, tris: 4782 },
    { id: 'v17_renk_paleti', type: 'board', name: 'Color Palette', tier: 'Common', rowColor: 'green', priceType: 'coins', price: 500, render: 314371205, cell: 20, tris: 6288 },
    { id: 'v15_kuzey_kalkani', type: 'board', name: 'Northern Shield', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 800, render: 314371204, cell: 18, tris: 7334 },
    { id: 'a01_dev_terlik', type: 'board', name: 'Giant Slipper', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 900, render: 314371188, cell: 0, tris: 5670 },
    { id: 'a06_dev_silgi', type: 'board', name: 'Giant Eraser', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 1000, render: 314371191, cell: 5, tris: 4302 },
    { id: 'a02_sosisli_ekspres', type: 'board', name: 'Hot Dog Express', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 1100, render: 314371186, cell: 1, tris: 5730 },
    { id: 'v13_kaktus_cruiser', type: 'board', name: 'Cactus Cruiser', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 1200, render: 314371203, cell: 17, tris: 8378 },
    { id: 'k01_muz_ekspresi', type: 'board', name: 'Banana Express', tier: 'Rare', rowColor: 'blue', priceType: 'coins', price: 1400, render: 314371195, cell: 9, tris: 9482 },
    { id: 'a05_yumurta_tavasi', type: 'board', name: 'Egg Pan', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 2000, render: 314371190, cell: 4, tris: 4186 },
    { id: 'v19_tilki_kuyrugu', type: 'board', name: 'Fox Tail', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 2200, render: 314371207, cell: 21, tris: 6222 },
    { id: 'a08_yayli_kapan', type: 'board', name: 'Mouse Trap', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 2500, render: 314371192, cell: 6, tris: 10154 },
    { id: 'a03_waffle_vagonu', type: 'board', name: 'Waffle Wagon', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 2800, render: 314371187, cell: 2, tris: 6830 },
    { id: 'a10_kayan_valiz', type: 'board', name: 'Rolling Suitcase', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 3000, render: 314371194, cell: 8, tris: 8706 },
    { id: 'a04_susi_ekspresi', type: 'board', name: 'Sushi Express', tier: 'Epic', rowColor: 'purple', priceType: 'coins', price: 3500, render: 314371189, cell: 3, tris: 10490 },
    { id: 'v16_disli_ekspres', type: 'board', name: 'Gear Express', tier: 'Legendary', rowColor: 'yellow', priceType: 'coins', price: 4500, render: 314371206, cell: 19, tris: 8994 },
    { id: 'a09_robot_supurge', type: 'board', name: 'Robot Vacuum', tier: 'Legendary', rowColor: 'yellow', priceType: 'coins', price: 6000, render: 314371193, cell: 7, tris: 8068 },
    { id: 'k04_pizza_cruiser', type: 'board', name: 'Pizza Cruiser', tier: 'Legendary', rowColor: 'yellow', priceType: 'coins', price: 7500, render: 314371197, cell: 11, tris: 13460 }
];

// Vertex ranges of each board model that belong to a truck or a wheel, read from the GLB (separate mesh islands). Everything else rides the Board bone.
// v = vertex count (another count = the FBX changed: that board stays one rigid piece). runs = start, count, bone (index in SkateboardObby_BoardModel.BONES).
var SkateboardObby_BoardRig = {
    k08_lav_catlagi: { v: 3032, runs: [1920,128,1,2048,194,3,2242,194,4,2516,128,2,2644,194,5,2838,194,6] },
    k06_kozmik_yolcu: { v: 3144, runs: [2032,128,1,2160,194,3,2354,194,4,2628,128,2,2756,194,5,2950,194,6] },
    k07_sakura_ruzgari: { v: 3385, runs: [2273,128,1,2401,194,3,2595,194,4,2869,128,2,2997,194,5,3191,194,6] },
    k09_grafiti_canavari: { v: 3579, runs: [2467,128,1,2595,194,3,2789,194,4,3063,128,2,3191,194,5,3385,194,6] },
    k03_retro_arcade: { v: 3329, runs: [2089,128,1,2217,146,3,2363,146,4,2589,128,2,2717,146,5,2863,146,6,3009,48,3,3057,48,4,3105,48,5,3153,48,6,3201,32,3,3233,32,4,3265,32,5,3297,32,6] },
    v17_renk_paleti: { v: 3320, runs: [1868,48,1,2056,56,2,2112,130,6,2242,130,5,2372,130,4,2502,130,3,2664,112,6,2776,112,5,2888,112,4,3000,112,3,3112,24,6,3136,24,5,3160,24,4,3184,24,3,3288,8,6,3296,8,5,3304,8,4,3312,8,3] },
    v15_kuzey_kalkani: { v: 3974, runs: [2586,48,1,2774,56,2,2830,130,6,2960,130,5,3090,130,4,3220,130,3,3382,112,6,3494,112,5,3606,112,4,3718,112,3,3830,16,6,3846,16,5,3862,16,4,3878,16,3] },
    a01_dev_terlik: { v: 2982, runs: [1594,48,1,1782,56,2,1838,130,6,1968,130,5,2098,130,4,2228,130,3,2390,112,6,2502,112,5,2614,112,4,2726,112,3,2838,16,6,2854,16,5,2870,16,4,2886,16,3] },
    a06_dev_silgi: { v: 2343, runs: [955,48,1,1143,56,2,1199,130,6,1329,130,5,1459,130,4,1589,130,3,1751,112,6,1863,112,5,1975,112,4,2087,112,3,2199,16,6,2215,16,5,2231,16,4,2247,16,3] },
    a02_sosisli_ekspres: { v: 3022, runs: [1634,48,1,1822,56,2,1878,130,6,2008,130,5,2138,130,4,2268,130,3,2430,112,6,2542,112,5,2654,112,4,2766,112,3,2878,16,6,2894,16,5,2910,16,4,2926,16,3] },
    v13_kaktus_cruiser: { v: 4636, runs: [3248,48,1,3436,56,2,3492,130,6,3622,130,5,3752,130,4,3882,130,3,4044,112,6,4156,112,5,4268,112,4,4380,112,3,4492,16,6,4508,16,5,4524,16,4,4540,16,3] },
    k01_muz_ekspresi: { v: 5104, runs: [3716,48,1,3904,56,2,3960,130,6,4090,130,5,4220,130,4,4350,130,3,4512,112,6,4624,112,5,4736,112,4,4848,112,3,4960,16,6,4976,16,5,4992,16,4,5008,16,3] },
    a05_yumurta_tavasi: { v: 2230, runs: [1254,184,3,1438,184,4,1622,56,1,1734,184,5,1918,184,6,2102,56,2,2214,4,3,2218,4,4,2222,4,5,2226,4,6] },
    v19_tilki_kuyrugu: { v: 3338, runs: [1890,48,1,2078,56,2,2134,130,6,2264,130,5,2394,130,4,2524,130,3,2686,112,6,2798,112,5,2910,112,4,3022,112,3,3134,16,6,3150,16,5,3166,16,4,3182,16,3] },
    a08_yayli_kapan: { v: 5484, runs: [3360,48,1,3548,56,2,3604,130,6,3734,130,5,3864,130,4,3994,130,3,4156,112,6,4268,112,5,4380,112,4,4492,112,3,4604,16,6,4620,16,5,4636,16,4,4652,16,3] },
    a03_waffle_vagonu: { v: 3783, runs: [2395,48,1,2583,56,2,2639,130,6,2769,130,5,2899,130,4,3029,130,3,3191,112,6,3303,112,5,3415,112,4,3527,112,3,3639,16,6,3655,16,5,3671,16,4,3687,16,3] },
    a10_kayan_valiz: { v: 4650, runs: [3262,48,1,3450,56,2,3506,130,6,3636,130,5,3766,130,4,3896,130,3,4058,112,6,4170,112,5,4282,112,4,4394,112,3,4506,16,6,4522,16,5,4538,16,4,4554,16,3] },
    a04_susi_ekspresi: { v: 5566, runs: [3553,48,1,3741,56,2,3797,130,6,3927,130,5,4057,130,4,4187,130,3,4349,112,6,4461,112,5,4573,112,4,4685,112,3,4797,16,6,4813,16,5,4829,16,4,4845,16,3] },
    v16_disli_ekspres: { v: 5188, runs: [3800,48,1,3988,56,2,4044,130,6,4174,130,5,4304,130,4,4434,130,3,4596,112,6,4708,112,5,4820,112,4,4932,112,3,5044,16,6,5060,16,5,5076,16,4,5092,16,3] },
    v11_sokak_motoru: { v: 5310, runs: [3986,48,1,4174,56,2,4230,64,6,4294,4,4,4298,50,6,4348,114,5,4462,60,4,4522,4,3,4526,50,4,4576,110,3,4718,112,6,4830,112,5,4942,112,4,5054,112,3,5166,16,6,5182,16,5,5198,16,4,5214,16,3] },
    a09_robot_supurge: { v: 4239, runs: [2851,48,1,3039,56,2,3095,130,6,3225,130,5,3355,130,4,3485,130,3,3647,112,6,3759,112,5,3871,112,4,3983,112,3,4095,16,6,4111,16,5,4127,16,4,4143,16,3] },
    k04_pizza_cruiser: { v: 7097, runs: [5709,48,1,5897,56,2,5953,130,6,6083,130,5,6213,130,4,6343,130,3,6505,112,6,6617,112,5,6729,112,4,6841,112,3,6953,16,6,6969,16,5,6985,16,4,7001,16,3] }
};

// How far the real deck top sits over the default deck under each foot, meters: [front foot, back foot], read from the model's mesh.
// The rider goes up by this much, the wheels and the deck stay down. A board that is not listed uses the default height.
var SkateboardObby_BoardLift = {
    a01_dev_terlik: [0.104, 0.104],
    a02_sosisli_ekspres: [0.295, 0.295],
    a03_waffle_vagonu: [0.165, 0.2],
    a04_susi_ekspresi: [0.2, 0.2],
    a05_yumurta_tavasi: [0.014, 0.014],
    a06_dev_silgi: [0.258, 0.258],
    a08_yayli_kapan: [0.09, 0.08],
    a09_robot_supurge: [0.175, 0.175],
    a10_kayan_valiz: [0.375, 0.375],
    k01_muz_ekspresi: [0.155, 0.275],
    k04_pizza_cruiser: [0.073, 0.104],
    v11_sokak_motoru: [0.1, 0.21],
    v13_kaktus_cruiser: [0.08, 0.08],
    v15_kuzey_kalkani: [0.107, 0.094],
    v16_disli_ekspres: [0.066, 0.066],
    v17_renk_paleti: [0.055, 0.05],
    v19_tilki_kuyrugu: [0.183, 0.183]
};

SkateboardObbyBoardSkins.KEY_OWNED = 'SkateboardObby_BoardSkinOwned';
SkateboardObbyBoardSkins.KEY_EQUIPPED = 'SkateboardObby_BoardSkin';
SkateboardObbyBoardSkins.DEFAULT_ID = 'board_default';
SkateboardObbyBoardSkins.KEY_BOSS = 'SkateboardObby_BoardSkinBoss';
SkateboardObbyBoardSkins.ID_RE = /^[a-z0-9_]{1,32}$/;

// Speed bonus of the worn board, one value per tier (0.05 = +5%). Local player only, nothing goes to the server.
// Goes through SkateboardObby_Trail.applySpeed: controller.maxSpeed = base x trail x board.
// VIP check shared by the boss board and the boss skin. VipManager may initialize after them: then the saved end time decides.
var SkateboardObby_Boss = {
    vipActive: function (app) {
        const v = app.vipManager;
        if (v && v.isActive) return v.isActive();
        return Date.now() < (+(SkateboardObby_Utils.getItem('SkateboardObby_VipEndAt') || 0) || 0);
    }
};

var SkateboardObby_BoardSpeedBonus = { Default: 0, Common: 0.01, Rare: 0.02, Epic: 0.03, Legendary: 0.05 };

SkateboardObbyBoardSkins.prototype.speedBonus = function (_item) {
    return (_item && SkateboardObby_BoardSpeedBonus[_item.tier]) || 0;
};

SkateboardObbyBoardSkins.prototype.getSpeedMultiplier = function () {
    return 1 + this.speedBonus(this.byId[this.equipped]);
};

// '+5% Speed', '' for a board without a bonus (Classic)
SkateboardObbyBoardSkins.prototype.speedLabel = function (_item) {
    const b = this.speedBonus(_item);
    return b > 0 ? '+' + Math.round(b * 100) + '% Speed' : '';
};

SkateboardObbyBoardSkins.prototype.applySpeed = function () {
    if (this.app.skateTrail) this.app.skateTrail.applySpeed();
};

SkateboardObbyBoardSkins.prototype.initialize = function () {
    this.app.skateBoards = this;
    this._speedApplied = false;
    this.items = SkateboardObby_BoardCatalog;
    this.byId = {};
    this.items.forEach(it => { this.byId[it.id] = it; });
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
    SkateboardObby_BoardDebug.install(this.app);
};

SkateboardObbyBoardSkins.prototype.onDestroy = function () {
    this.app.off('player:add', this.onPlayerAdd, this);
    this.app.off('player:remove', this.onPlayerRemove, this);
    this.app.off('Vip:Changed', this.onVipChanged, this);
    for (let i = this.remotes.length - 1; i >= 0; i--) this.removeRemote(this.remotes[i]);
    SkateboardObby_BoardDebug.uninstall();
    SkateboardObby_BoardModel.worn.length = 0;
    if (this.app.skateBoards === this) this.app.skateBoards = null;
};

// --- save ---------------------------------------------------------------------------------------

SkateboardObbyBoardSkins.prototype.loadSave = function () {
    this.owned = {};
    let list = null;
    try { list = JSON.parse(SkateboardObby_Utils.getItem(SkateboardObbyBoardSkins.KEY_OWNED) || 'null'); } catch (e) { list = null; }
    if (Array.isArray(list)) list.forEach(id => { if (this.byId[id] && !this.byId[id].boss) this.owned[id] = true; });
    this.items.forEach(it => { if (it.priceType === 'free') this.owned[it.id] = true; });
    const eq = SkateboardObby_Utils.getItem(SkateboardObbyBoardSkins.KEY_EQUIPPED);
    this.normal = (eq && this.byId[eq] && this.owned[eq]) ? eq : SkateboardObbyBoardSkins.DEFAULT_ID;
    const boss = this.items.find(it => it.boss);
    const on = !!boss && SkateboardObby_Utils.getItem(SkateboardObbyBoardSkins.KEY_BOSS) === '1';
    this.equipped = on && SkateboardObby_Boss.vipActive(this.app) ? boss.id : this.normal;
    if (on && this.equipped !== boss.id) SkateboardObby_Utils.setItem(SkateboardObbyBoardSkins.KEY_BOSS, '0');
};

SkateboardObbyBoardSkins.prototype.save = function () {
    SkateboardObby_Utils.setItem(SkateboardObbyBoardSkins.KEY_OWNED, JSON.stringify(Object.keys(this.owned).filter(k => this.owned[k])));
};

// --- API (Shop, pickups) --------------------------------------------------------------------------

SkateboardObbyBoardSkins.prototype.find = function (_id) { return this.byId[_id] || null; };
SkateboardObbyBoardSkins.prototype.isOwned = function (_id) { return !!this.owned[_id]; };

// null = back to the default board
SkateboardObbyBoardSkins.prototype.equip = function (_id) {
    const _boss = !!(_id && this.byId[_id] && this.byId[_id].boss);
    if (_boss && !SkateboardObby_Boss.vipActive(this.app)) return;   // VIP only
    if (!_boss && (!_id || !this.byId[_id] || !this.owned[_id])) _id = SkateboardObbyBoardSkins.DEFAULT_ID;
    if (_id === this.equipped) return;
    this.equipped = _id;
    SkateboardObby_Utils.setItem(SkateboardObbyBoardSkins.KEY_BOSS, _boss ? '1' : '0');
    if (!_boss) { this.normal = _id; SkateboardObby_Utils.setItem(SkateboardObbyBoardSkins.KEY_EQUIPPED, _id); }
    this.applyLocal();
    this.applySpeed();
    this.sendBoard();
    this.app.fire('skate:boardEvent', 'board', 'equip');
    if (_boss) this.app.fire('skate:boardEvent', 'boss-item', 'equip');
};

// VIP ended: back to the last normal board. Not an equip of the player's, no event.
SkateboardObbyBoardSkins.prototype.onVipChanged = function (_active) {
    const it = this.byId[this.equipped];
    if (_active || !it || !it.boss) return;
    this.equipped = this.normal;
    SkateboardObby_Utils.setItem(SkateboardObbyBoardSkins.KEY_BOSS, '0');
    this.applyLocal();
    this.applySpeed();
    this.sendBoard();
};

// Ground pickup: owned for good, worn at once. The Shop has its own unlock (same owned object).
SkateboardObbyBoardSkins.prototype.unlock = function (_item) {
    if (_item.boss) return;
    this.owned[_item.id] = true;
    this.save();
    this.app.fire('skate:shopChanged');
    this.equip(_item.id);
};

SkateboardObbyBoardSkins.prototype.applyLocal = function () {
    if (this.player) SkateboardObby_BoardModel.apply(this.app, this.player, this.byId[this.equipped], this.material, true);
};

// UI cell of an item: image element shows only that part of the atlas
SkateboardObbyBoardSkins.prototype.setIcon = function (_element, _item) {
    if (this.iconAtlas) _element.textureAsset = this.iconAtlas.id;
    const c = SkateboardObby_BoardModel.cellRect(_item.cell);
    _element.rect = c;
};

// --- network ------------------------------------------------------------------------------------

SkateboardObbyBoardSkins.prototype.onPlayerAdd = function (_ent) {
    if (_ent) this.pending.push(_ent);   // networkData is set right after this event
};

SkateboardObbyBoardSkins.prototype.onPlayerRemove = function (_data) {
    for (let i = this.remotes.length - 1; i >= 0; i--) if (this.remotes[i].data === _data) this.removeRemote(this.remotes[i]);
};

SkateboardObbyBoardSkins.prototype.attachRemote = function (_ent) {
    const d = _ent.networkData;
    if (!d || !('boardSkin' in d)) return;   // old server: no field
    const r = { entity: _ent, data: d, unlisten: null, onDestroy: null };
    this.remotes.push(r);
    const _set = (v) => {
        const it = (typeof v === 'string' && SkateboardObbyBoardSkins.ID_RE.test(v)) ? this.byId[v] : null;
        if (r.entity && r.entity.parent) SkateboardObby_BoardModel.apply(this.app, r.entity, it && it.type === 'board' ? it : null, this.material, this.remoteShadows);
    };
    try { r.unlisten = d.listen('boardSkin', _set); } catch (e) { r.unlisten = null; }
    _set(d.boardSkin);
    r.onDestroy = () => this.removeRemote(r);
    _ent.once('destroy', r.onDestroy);
};

SkateboardObbyBoardSkins.prototype.removeRemote = function (r) {
    const i = this.remotes.indexOf(r);
    if (i >= 0) this.remotes.splice(i, 1);
    if (r.unlisten) { try { r.unlisten(); } catch (e) { } r.unlisten = null; }
    if (r.entity && r.onDestroy) r.entity.off('destroy', r.onDestroy);
};

SkateboardObbyBoardSkins.prototype.sendBoard = function () {
    try {
        const nm = this.app.skateboardObbyNetworkManager, room = nm && nm.room;
        if (!room || !room.state || !room.state.players) return;
        const me = room.state.players.get(room.sessionId);
        if (!me || !('boardSkin' in me)) return;   // old server
        const id = this.equipped === SkateboardObbyBoardSkins.DEFAULT_ID ? '' : this.equipped;
        if (this._sentRoom === room && this._sentId === id) return;
        room.send('Client:SetBoardSkin', { board: id });
        this._sentRoom = room;
        this._sentId = id;
    } catch (e) { }
};

SkateboardObbyBoardSkins.prototype.postUpdate = function (dt) {
    const worn = SkateboardObby_BoardModel.worn;
    for (let i = worn.length - 1; i >= 0; i--) {
        if (worn[i].entity.parent) SkateboardObby_BoardModel.applyLift(worn[i], dt);
        else worn.splice(i, 1);
    }
};

SkateboardObbyBoardSkins.prototype.update = function (dt) {
    // the saved board at scene start: the trail may have read the speed before this script existed
    if (!this._speedApplied) { this._speedApplied = true; this.applySpeed(); }
    if (this.pending.length) {
        for (let i = 0; i < this.pending.length; i++) this.attachRemote(this.pending[i]);
        this.pending.length = 0;
    }
    // a new room (reconnect, other world) needs the id again; sendBoard returns at once when nothing changed
    this._netTimer -= dt;
    if (this._netTimer <= 0) { this._netTimer = 1; this.sendBoard(); }
};

// =================================================================================================
// The model on a player entity (local Player or a RemotePlayer copy)
// =================================================================================================
var SkateboardObby_BoardModel = {
    // Board bone -> model: same place as the FBX default board in the bind pose (bottom of the wheels on the ground, 25 cm under the bone)
    LOCAL_POS: [0, 0, -0.25],
    LOCAL_ROT: [0, 0, 180],
    ATLAS_W: 1020, ATLAS_H: 680, CELL: 170,

    // The trucks and wheels of a model ride the default board's own bones: the clips spin the wheels, the lean keeps them flat on the ground.
    BONES: ['Board', 'Truck_F', 'Truck_B', 'Wheel_FL', 'Wheel_FR', 'Wheel_BL', 'Wheel_BR'],
    _rigSkin: null,
    _rigMeshes: {},

    // One skin for all boards: model space -> each bone, in the default board's bind pose (a wheel island sits exactly on its Wheel_* bone in all 22 models)
    rigSkin: function (app, _defaultSkin) {
        if (this._rigSkin) return this._rigSkin;
        const names = _defaultSkin.boneNames, ibp = _defaultSkin.inverseBindPose, b = names.indexOf('Board');
        if (b < 0) return null;
        const local = new pc.Mat4().setTRS(new pc.Vec3(this.LOCAL_POS[0], this.LOCAL_POS[1], this.LOCAL_POS[2]),
            new pc.Quat().setFromEulerAngles(this.LOCAL_ROT[0], this.LOCAL_ROT[1], this.LOCAL_ROT[2]), pc.Vec3.ONE);
        const fromModel = new pc.Mat4().copy(ibp[b]).invert().mul(local);
        const out = [];
        for (let i = 0; i < this.BONES.length; i++) {
            const k = names.indexOf(this.BONES[i]);
            if (k < 0) return null;
            out.push(new pc.Mat4().mul2(ibp[k], fromModel));
        }
        this._rigSkin = new pc.Skin(app.graphicsDevice, out, this.BONES);
        return this._rigSkin;
    },

    // Skinned copy of the model, built once per board (the file's vertices plus bone data). null = keep the model rigid
    rigMesh: function (app, _item, _asset, _defaultSkin) {
        const cached = this._rigMeshes[_item.id];
        if (cached) return cached;
        const rig = SkateboardObby_BoardRig[_item.id], src = _asset.resource && _asset.resource.meshes && _asset.resource.meshes[0];
        if (!rig || !src || !src.vertexBuffer || src.vertexBuffer.numVertices !== rig.v) return null;
        const skin = this.rigSkin(app, _defaultSkin);
        if (!skin) return null;
        const n = rig.v, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
        src.getPositions(pos);
        src.getNormals(nor);
        src.getUvs(0, uv);
        src.getIndices(idx);
        const bi = new Uint8Array(n * 4), bw = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) bw[i * 4] = 1;
        for (let r = 0; r < rig.runs.length; r += 3) {
            const end = rig.runs[r] + rig.runs[r + 1];
            for (let i = rig.runs[r]; i < end; i++) bi[i * 4] = rig.runs[r + 2];
        }
        const m = new pc.Mesh(app.graphicsDevice);
        m.setPositions(pos);
        m.setNormals(nor);
        m.setUvs(0, uv);
        m.setVertexStream(pc.SEMANTIC_BLENDINDICES, bi, 4, n, pc.TYPE_UINT8, false);
        m.setVertexStream(pc.SEMANTIC_BLENDWEIGHT, bw, 4, n, pc.TYPE_FLOAT32, false);
        m.setIndices(idx);
        m.skin = skin;
        m.update(pc.PRIMITIVE_TRIANGLES);
        m.incRefCount();   // shared by players and kept for the next wear: destroying an entity must not destroy it
        this._rigMeshes[_item.id] = m;
        return m;
    },

    // Skinned mesh instance of this player, null = no rig for this board, the caller uses the rigid model
    rigInstance: function (app, s, _item, _asset, _material, _node) {
        const def = s.target.render.meshInstances[0];
        if (!def || !def.mesh.skin) return null;
        if (!s.rigBones) {
            s.rigBones = [];
            for (let i = 0; i < this.BONES.length; i++) s.rigBones.push(this.BONES[i] === 'Board' ? s.bone : s.bone.findByName(this.BONES[i]));
        }
        if (s.rigBones.indexOf(null) >= 0) return null;
        const mesh = this.rigMesh(app, _item, _asset, def.mesh.skin);
        if (!mesh) return null;
        const mi = new pc.MeshInstance(mesh, (_material && _material.resource) || def.material, _node);
        const si = new pc.SkinInstance(mesh.skin);
        si.bones = s.rigBones.slice();
        mi.skinInstance = si;
        return mi;
    },

    // --- the rider on a thick deck ---
    worn: [],   // states with a lift, applied in postUpdate
    // Finisher: the rider holds the board over the head in this part of the clip (0..1), the board comes up with the hands.
    // Grab tricks need nothing: the deck top under the hands is at the same distance as on the default board.
    HOLD_FROM: 0.55,
    HOLD_TO: 0.9,
    HOLD_EASE: 0.15,
    _up: new pc.Vec3(),

    setLift: function (s, _ent, _item) {
        const lift = _item && SkateboardObby_BoardLift[_item.id];
        const i = this.worn.indexOf(s);
        if (!lift) {
            if (i >= 0) this.worn.splice(i, 1);
            return;
        }
        if (!s.hips) {
            const skin = _ent.findByName('Skin');
            s.entity = _ent;
            s.arm = skin.findByName('Armature.001');
            s.hips = skin.findByName('Body.001');
            s.torso = skin.findByName('BodyRig');
            s.legF = skin.findByName('UpperLeg_L');
            s.legB = skin.findByName('UpperLeg_R');
            s.anim = skin.anim || (skin.parent && skin.parent.anim) || _ent.anim || null;
        }
        if (!s.arm || !s.hips || !s.torso || !s.legF || !s.legB) {
            if (i >= 0) this.worn.splice(i, 1);
            return;
        }
        s.lift = (lift[0] + lift[1]) / 2;
        s.liftLeg = (lift[0] - lift[1]) / 2;
        s.grab = 0;
        // the name tag keeps its distance over the head
        if (s.label === undefined) s.label = _ent.findByName('OverHeadGroup');
        if (s.label) {
            const p = s.label.getLocalPosition();
            if (s.labelY === undefined) s.labelY = p.y;
            s.label.setLocalPosition(p.x, s.labelY + Math.max(lift[0], lift[1]) / (_ent.getLocalScale().y || 1), p.z);
        }
        if (i < 0) this.worn.push(s);
    },

    // Runs after the animation wrote the pose. A bone the animation did not write this frame still holds the lift: "mark" skips it, nothing adds up.
    liftBone: function (_bone, s, _mark, _z) {
        const p = _bone.getLocalPosition();
        if (p.z === s[_mark]) return;
        _bone.setLocalPosition(p.x, p.y, p.z + _z);
        s[_mark] = p.z;
    },

    liftLeg: function (_leg, s, _mark, _d) {
        const p = _leg.getLocalPosition();
        if (p.x + p.y + p.z === s[_mark]) return;
        const w = _leg.getPosition(), up = this._up;
        _leg.setPosition(w.x + up.x * _d, w.y + up.y * _d, w.z + up.z * _d);
        s[_mark] = p.x + p.y + p.z;
    },

    applyLift: function (s, dt) {
        const layer = s.anim ? s.anim.baseLayer : null;
        let hold = 0;
        if (layer && layer.activeState === 'Finisher') {
            const t = layer.activeStateProgress;
            if (t >= this.HOLD_FROM && t <= this.HOLD_TO) hold = 1;
        }
        s.grab += (hold - s.grab) * Math.min(1, dt / this.HOLD_EASE);
        this.liftBone(s.hips, s, '_markHips', s.lift);
        this.liftBone(s.torso, s, '_markTorso', s.lift);
        if (s.grab > 0.001) this.liftBone(s.bone, s, '_markBoard', s.lift * s.grab);
        if (s.liftLeg !== 0) {
            s.arm.getWorldTransform().getZ(this._up).normalize();
            this.liftLeg(s.legF, s, '_markLegF', s.liftLeg);
            this.liftLeg(s.legB, s, '_markLegB', -s.liftLeg);
        }
    },

    cellRect: function (_cell) {
        const col = _cell % 6, row = Math.floor(_cell / 6), w = this.CELL / this.ATLAS_W, h = this.CELL / this.ATLAS_H;
        return new pc.Vec4(col * w, 1 - (row + 1) * h, w, h);
    },

    state: function (_ent) {
        if (_ent._skateBoardModel) return _ent._skateBoardModel;
        const skin = _ent.findByName('Skin');
        const s = { bone: skin ? skin.findByName('Board') : null, target: skin ? skin.findByName(SkateboardObby_Cosmetics.TARGETS.board) : null, model: null, wantId: null };
        _ent._skateBoardModel = s;
        return s;
    },

    // _item: catalog row, null or the default row = default board
    apply: function (app, _ent, _item, _material, _shadows) {
        const s = this.state(_ent);
        if (!s.bone || !s.target || !s.target.render) return;
        const id = _item && _item.render ? _item.id : null;
        if (s.wantId === id) return;
        s.wantId = id;
        if (!id) { this.clear(s); return; }
        const asset = app.assets.get(_item.render);
        if (!asset) { s.wantId = null; this.clear(s); return; }
        const attach = () => {
            if (s.wantId !== id || !_ent.parent) return;   // changed or gone meanwhile
            if (!asset.resource) { s.wantId = null; this.clear(s); return; }   // load error: keep the default board
            this.clear(s);
            const e = new pc.Entity('BoardModel');
            const mi = this.rigInstance(app, s, _item, asset, _material, e);
            if (mi) {
                e.addComponent('render', { type: 'asset', castShadows: !!_shadows, receiveShadows: true });
                e.render.meshInstances = [mi];
                e.render.castShadows = !!_shadows;
            } else {
                e.addComponent('render', { type: 'asset', asset: asset.id, castShadows: !!_shadows, receiveShadows: true });
                if (_material) e.render.materialAssets = [_material.id !== undefined ? _material.id : _material];
            }
            s.bone.addChild(e);
            e.setLocalPosition(this.LOCAL_POS[0], this.LOCAL_POS[1], this.LOCAL_POS[2]);
            e.setLocalEulerAngles(this.LOCAL_ROT[0], this.LOCAL_ROT[1], this.LOCAL_ROT[2]);
            s.model = e;
            s.target.render.enabled = false;
            this.setLift(s, _ent, _item);
        };
        if (asset.loaded) attach();
        else { asset.ready(attach); asset.once('error', () => { if (s.wantId === id) { s.wantId = null; this.clear(s); } }); app.assets.load(asset); }
    },

    clear: function (s) {
        const i = this.worn.indexOf(s);
        if (i >= 0) this.worn.splice(i, 1);
        if (s.label && s.labelY !== undefined) { const p = s.label.getLocalPosition(); s.label.setLocalPosition(p.x, s.labelY, p.z); }
        if (s.model) { s.model.destroy(); s.model = null; }
        if (s.target && s.target.render) s.target.render.enabled = true;
    }
};

// =================================================================================================
// Console helpers: boards() lists, board(id) owns + wears ("" = default)
// =================================================================================================
var SkateboardObby_BoardDebug = {
    names: ['boards', 'board'],
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
    boards: function () {
        const m = this.app && this.app.skateBoards;
        return m ? m.items.map(t => t.id + '  ' + t.name + '  ' + t.price + (m.owned[t.id] ? '  owned' : '') + (m.equipped === t.id ? '  [equipped]' : '')) : [];
    },
    board: function (id) {
        const m = this.app && this.app.skateBoards;
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
