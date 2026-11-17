/*
 * SkateboardObby_Quests
 * Daily and weekly quests, fully client-side (no server). The HUD Quests button or T opens the panel.
 * Sits on the "QuestManager" entity at the end of the scene root (after Player, Coins, RingRewards, Analytics).
 *
 * Like SkateboardObby_Analytics it only listens to what the other scripts already do, none of them call it:
 *   player entity "jump" (ollie, fast ollie = trick), controller _ride (rail, loop), controller _vert (big air = trick too),
 *   skate:coins (delta > 0, own rewards excluded), checkpointChanged (ridden into, not tp / skip), skate:boosted and the
 *   boost pads' FOV kick (no event: app.targetFov rises to 72 while no VIP boost runs), PlayerDied, skate:finished,
 *   RingRewards.rings (its own crossing test: RingRewards only rewards a ring once in a lifetime).
 *
 * Quest sets (CATALOG below): fixed quests + a seeded pick from a pool, so every day / week has a few different goals but
 * all players of the same day get the same set. Finishing and claiming every quest of a set opens its chest row.
 * Save: "SkateboardObby_Quests" (JSON). A new local day / week (Monday) rolls a new set; rewards earned but not claimed
 * are paid out then. The clock going back does not reset anything (the set stays until the real date passes it),
 * unless the saved period is absurdly far ahead (broken clock, Max Back Days).
 * Notifications: a short strip left of the HUD button, one at a time. A finished quest shows it once (saved in
 * "SkateboardObby_QuestsSeen", so a reload or a second tab cannot repeat it). While a reward waits and no strip is up,
 * the button wiggles in short bursts; not while a panel, a menu, the dead menu, an ad or the finish flight is up.
 * Other scripts: app.skateQuests, events skate:questsPanel (open), skate:questDone (id), skate:questClaimed (id),
 * skate:questChest (set name). Scroll follows CLAUDE.md 2.4. Console: quests(), questAdd(kind, n), questAll().
 */
var SkateboardObbyQuests = pc.createScript('skateboardObbyQuests');

SkateboardObbyQuests.attributes.add('panel', { type: 'entity' });
SkateboardObbyQuests.attributes.add('panelBody', { type: 'entity' });
SkateboardObbyQuests.attributes.add('openButton', { type: 'entity', description: 'HUD Quests button' });
SkateboardObbyQuests.attributes.add('openIcon', { type: 'entity', description: 'Icon of the HUD button' });
SkateboardObbyQuests.attributes.add('openDot', { type: 'entity', description: 'Red dot on the HUD button: rewards waiting' });
SkateboardObbyQuests.attributes.add('openDotText', { type: 'entity' });
SkateboardObbyQuests.attributes.add('closeButton', { type: 'entity' });
SkateboardObbyQuests.attributes.add('tabDaily', { type: 'entity' });
SkateboardObbyQuests.attributes.add('tabWeekly', { type: 'entity' });
SkateboardObbyQuests.attributes.add('list', { type: 'entity', description: 'Masked list area' });
SkateboardObbyQuests.attributes.add('content', { type: 'entity', description: 'Scrolling content (child of list)' });
SkateboardObbyQuests.attributes.add('rowTemplate', { type: 'entity' });
SkateboardObbyQuests.attributes.add('scrollHandle', { type: 'entity' });
SkateboardObbyQuests.attributes.add('coinsText', { type: 'entity' });
SkateboardObbyQuests.attributes.add('infoText', { type: 'entity', description: 'Time left of the shown set' });
SkateboardObbyQuests.attributes.add('messageText', { type: 'entity', description: 'Short messages, same place as the time left' });
SkateboardObbyQuests.attributes.add('frame', { type: 'entity', description: 'Parent of the chest animation' });
SkateboardObbyQuests.attributes.add('toast', { type: 'entity', description: 'HUD notification (no input)' });
SkateboardObbyQuests.attributes.add('toastIcon', { type: 'entity' });
SkateboardObbyQuests.attributes.add('toastTitle', { type: 'entity' });
SkateboardObbyQuests.attributes.add('toastText', { type: 'entity' });

SkateboardObbyQuests.attributes.add('hotkey', { type: 'string', default: 'T', title: 'Hotkey', description: 'One letter. Empty = no key.' });
SkateboardObbyQuests.attributes.add('rewardScale', { type: 'number', default: 1, title: 'Reward Scale', description: 'Multiplies every coin reward and chest (raise it if Coin Value goes up)' });
SkateboardObbyQuests.attributes.add('touchRadius', { type: 'number', default: 10, title: 'Checkpoint Touch Radius (m)', description: 'A checkpoint counts only if the player is this close (not tp / skip)' });
SkateboardObbyQuests.attributes.add('maxBackDays', { type: 'number', default: 30, title: 'Max Back Days', description: 'The clock this far behind the saved day = broken save, roll a new set' });
SkateboardObbyQuests.attributes.add('toastHold', { type: 'number', default: 1.8, title: 'Toast Time (s)' });
SkateboardObbyQuests.attributes.add('wiggleAngle', { type: 'number', default: 12, title: 'Wiggle Angle', description: 'Degrees, HUD button while a reward waits. 0 = no wiggle' });
SkateboardObbyQuests.attributes.add('wiggleTime', { type: 'number', default: 0.7, title: 'Wiggle Time (s)' });
SkateboardObbyQuests.attributes.add('wigglePause', { type: 'number', default: 1.6, title: 'Wiggle Pause (s)' });
SkateboardObbyQuests.attributes.add('saveInterval', { type: 'number', default: 5, title: 'Save Interval (s)' });

SkateboardObbyQuests.attributes.add('rowHeight', { type: 'number', default: 120 });
SkateboardObbyQuests.attributes.add('rowSpacing', { type: 'number', default: 10 });
SkateboardObbyQuests.attributes.add('listPadding', { type: 'number', default: 10 });
SkateboardObbyQuests.attributes.add('fitHeight', { type: 'number', default: 760, title: 'Fit Height' });
SkateboardObbyQuests.attributes.add('fitWidth', { type: 'number', default: 790, title: 'Fit Width' });
SkateboardObbyQuests.attributes.add('fitMargin', { type: 'number', default: 0.94, title: 'Fit Margin' });
SkateboardObbyQuests.attributes.add('barMinWidth', { type: 'number', default: 26, title: 'Bar Min Width', description: 'The fill sprite is 9-sliced: narrower looks broken' });

SkateboardObbyQuests.attributes.add('coinIcon', { type: 'asset', assetType: 'texture' });
SkateboardObbyQuests.attributes.add('spriteTabOn', { type: 'asset', assetType: 'sprite' });
SkateboardObbyQuests.attributes.add('spriteTabOff', { type: 'asset', assetType: 'sprite' });
SkateboardObbyQuests.attributes.add('spriteClaim', { type: 'asset', assetType: 'sprite', description: 'Ready to claim (green)' });
SkateboardObbyQuests.attributes.add('spriteWait', { type: 'asset', assetType: 'sprite', description: 'Not finished yet (grey)' });
SkateboardObbyQuests.attributes.add('spriteClaimed', { type: 'asset', assetType: 'sprite', description: 'Claimed (dark)' });
SkateboardObbyQuests.attributes.add('spriteRow', { type: 'asset', assetType: 'sprite' });
SkateboardObbyQuests.attributes.add('spriteRowChest', { type: 'asset', assetType: 'sprite' });
SkateboardObbyQuests.attributes.add('spriteBarFill', { type: 'asset', assetType: 'sprite' });
SkateboardObbyQuests.attributes.add('spriteBarDone', { type: 'asset', assetType: 'sprite' });

SkateboardObbyQuests.KEY = 'SkateboardObby_Quests';
SkateboardObbyQuests.KEY_SEEN = 'SkateboardObby_QuestsSeen';
SkateboardObbyQuests.DAY_MS = 86400000;

// kind: what moves the progress. goal in seconds for time, metres for dist. coins / boost (seconds of the Boost power-up) = reward.
SkateboardObbyQuests.CATALOG = {
    daily: {
        title: 'Daily Chest', chest: { coins: 100 }, pick: 4,
        fixed: [
            { id: 'd-login', kind: 'login', goal: 1, title: 'Log In Today', icon: 'cal', coins: 25, silent: true },
            { id: 'd-time', kind: 'time', goal: 600, title: 'Play for 10 Minutes', icon: 'clock', coins: 75 }
        ],
        pool: [
            { id: 'd-ollie', kind: 'ollie', goal: 30, title: 'Ollie 30 Times', icon: 'ollie', coins: 40 },
            { id: 'd-trick', kind: 'trick', goal: 10, title: 'Do 10 Tricks', icon: 'trick', coins: 60 },
            { id: 'd-rail', kind: 'rail', goal: 5, title: 'Grind 5 Rails', icon: 'rail', coins: 60 },
            { id: 'd-vert', kind: 'vert', goal: 5, title: 'Catch Big Air 5 Times', icon: 'vert', coins: 60 },
            { id: 'd-coins', kind: 'coins', goal: 100, title: 'Collect 100 Coins', icon: 'coin', coins: 50 },
            { id: 'd-cp', kind: 'cp', goal: 5, title: 'Reach 5 Checkpoints', icon: 'flag', coins: 60 },
            { id: 'd-dist', kind: 'dist', goal: 3000, title: 'Ride 3000 Meters', icon: 'road', coins: 50 },
            { id: 'd-wipe', kind: 'wipe', goal: 5, title: 'Wipe Out 5 Times', icon: 'wipe', boost: 90 }
        ]
    },
    weekly: {
        title: 'Weekly Chest', chest: { coins: 500, boost: 180 }, pick: 3,
        fixed: [
            { id: 'w-days', kind: 'days', goal: 5, title: 'Log In on 5 Days', icon: 'cal', coins: 250 },
            { id: 'w-finish', kind: 'finish', goal: 1, title: 'Finish the Course', icon: 'finish', coins: 300 },
            { id: 'w-coins', kind: 'coins', goal: 1500, title: 'Collect 1500 Coins', icon: 'coin', coins: 200 }
        ],
        pool: [
            { id: 'w-time', kind: 'time', goal: 7200, title: 'Play for 2 Hours', icon: 'clock', coins: 300 },
            { id: 'w-loop', kind: 'loop', goal: 3, title: 'Ride the Loop 3 Times', icon: 'loop', coins: 200 },
            { id: 'w-ring', kind: 'ring', goal: 10, title: 'Fly Through 10 Rings', icon: 'ring', coins: 200 },
            { id: 'w-rail', kind: 'rail', goal: 40, title: 'Grind 40 Rails', icon: 'rail', coins: 200 },
            { id: 'w-vert', kind: 'vert', goal: 40, title: 'Catch Big Air 40 Times', icon: 'vert', coins: 200 },
            { id: 'w-cp', kind: 'cp', goal: 50, title: 'Reach 50 Checkpoints', icon: 'flag', coins: 200 },
            { id: 'w-trick', kind: 'trick', goal: 100, title: 'Do 100 Tricks', icon: 'trick', coins: 200 },
            { id: 'w-boost', kind: 'boost', goal: 20, title: 'Hit 20 Boosts', icon: 'bolt', coins: 200 }
        ]
    }
};

SkateboardObbyQuests.prototype.initialize = function () {
    this.app.skateQuests = this;
    this.panelOpen = false;
    this.tab = 'daily';
    this.rows = [];
    this.scrollY = 0;
    this.scrollTarget = 0;
    this.scrollMax = 0;
    this.drag = null;
    this.dragMoved = false;
    this.messageTimer = 0;
    this.fitScale = 1;
    this.sets = { daily: null, weekly: null };
    this.active = {};
    this.lastLogin = -1;
    this.claimable = -1;
    this._dirty = false;
    this._noSave = false;
    this._granting = false;
    this._secT = 0;
    this._saveT = 0;
    this._lastRide = null;
    this._lastVert = null;
    this._lastFov = 60;
    this._toastQ = [];
    this._toastT = -1;
    this._wiggleT = 0;
    this._wiggling = false;
    this._prev = new pc.Vec3();
    this._hasPrev = false;
    this._d = new pc.Vec3();
    this._q = new pc.Vec3();
    this.art = {};
    this.chestFx = null;
    this.chestT = -1;
    this.tabDots = {};
    this._infoText = '';
    this._white = new pc.Color(1, 1, 1, 1);
    this._dim = new pc.Color(0.78, 0.86, 1, 1);

    this.player = this.app.root.findByName('Player');
    this.checkpointRoot = this.app.root.findByName('Checkpoints');
    const rr = this.app.root.findByName('RingRewards');
    this.ringRewards = rr && rr.script ? rr.script.skateboardObbyRingRewards : null;
    this.lastCheckpoint = this.getCheckpoint();

    const _k = this.hotkey ? pc['KEY_' + String(this.hotkey).toUpperCase()] : undefined;
    this.hotkeyCode = _k === undefined ? -1 : _k;

    if (this.rowTemplate) this.rowTemplate.enabled = false;
    if (this.panel) this.panel.enabled = false;
    if (this.messageText) this.messageText.enabled = false;
    if (this.toast) this.toast.enabled = false;
    if (this.openDot) this.openDot.enabled = false;

    const _click = (e, fn) => { if (e && e.button) e.button.on('click', fn, this); };
    _click(this.openButton, () => this.setPanelVisible(!this.panelOpen));
    _click(this.closeButton, () => this.setPanelVisible(false));
    _click(this.tabDaily, () => this.setTab('daily'));
    _click(this.tabWeekly, () => this.setTab('weekly'));

    if (this.openIcon && this.openIcon.element) this.openIcon.element.texture = this.getArt('scroll');
    if (this.openDot && this.openDot.element) this.openDot.element.texture = this.getArt('dot');
    [['daily', this.tabDaily], ['weekly', this.tabWeekly]].forEach(([n, t]) => {
        const d = t && t.findByName('Dot');
        if (!d) return;
        d.element.texture = this.getArt('dot');
        d.enabled = false;
        this.tabDots[n] = d;
    });

    this.setupScroll();
    this.preloadUi();

    this.app.on('checkpointChanged', this.onCheckpointChanged, this);
    this.app.on('PlayerDied', this.onPlayerDied, this);
    this.app.on('skate:boosted', this.onBoosted, this);
    this.app.on('skate:finished', this.onFinished, this);
    this.app.on('skate:coins', this.onCoins, this);
    this.app.on('MarketClose', this.onMarketClose, this);
    this.app.on('resetData', this.onResetData, this);
    if (this.player) this.player.on('jump', this.onJump, this);
    this.app.graphicsDevice.on('resizecanvas', this.onResize, this);
    this._onHide = () => this.saveNow();
    window.addEventListener('pagehide', this._onHide);
    document.addEventListener('visibilitychange', this._onHide);
    this.on('destroy', this.onDestroy, this);

    SkateboardObby_QuestDebug.install(this);
};

// everything else (CoinManager, PlayerItemManager) is up by now
SkateboardObbyQuests.prototype.postInitialize = function () {
    this.load();
    this.checkRoll();
    this.refreshDots();
};

SkateboardObbyQuests.prototype.onDestroy = function () {
    this.saveNow();
    this.app.off('checkpointChanged', this.onCheckpointChanged, this);
    this.app.off('PlayerDied', this.onPlayerDied, this);
    this.app.off('skate:boosted', this.onBoosted, this);
    this.app.off('skate:finished', this.onFinished, this);
    this.app.off('skate:coins', this.onCoins, this);
    this.app.off('MarketClose', this.onMarketClose, this);
    this.app.off('resetData', this.onResetData, this);
    if (this.player) this.player.off('jump', this.onJump, this);
    this.app.graphicsDevice.off('resizecanvas', this.onResize, this);
    window.removeEventListener('pagehide', this._onHide);
    document.removeEventListener('visibilitychange', this._onHide);
    if (this.app.mouse) this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onWheel, this);
    this.endDrag();
    if (this.panelOpen) { this.app.isMarketEnabled = false; this.panelOpen = false; }
    for (const k in this.art) { if (this.art[k]) this.art[k].destroy(); }
    this.art = {};
    SkateboardObby_QuestDebug.uninstall();
    if (this.app.skateQuests === this) this.app.skateQuests = null;
};

// panel textures are not in the menu preload (same as the shop)
SkateboardObbyQuests.prototype.preloadUi = function () {
    const ids = {};
    const add = (a) => { const as = (typeof a === 'number') ? this.app.assets.get(a) : a; if (as && !as.loaded) ids[as.id] = as; };
    [this.coinIcon, this.spriteTabOn, this.spriteTabOff, this.spriteClaim, this.spriteWait, this.spriteClaimed, this.spriteRow, this.spriteRowChest, this.spriteBarFill, this.spriteBarDone].forEach(add);
    if (this.panel) {
        this.panel.findComponents('element').forEach(el => {
            if (el.textureAsset) add(el.textureAsset);
            if (el.spriteAsset) add(el.spriteAsset);
            if (el.fontAsset) add(el.fontAsset);
        });
    }
    for (const k in ids) this.app.assets.load(ids[k]);
};

// --- save / new day -----------------------------------------------------------------------

SkateboardObbyQuests.prototype.load = function () {
    let data = null;
    try { data = JSON.parse(SkateboardObby_Utils.getItem(SkateboardObbyQuests.KEY) || 'null'); } catch (e) { data = null; }
    if (!data || data.v !== 1) return;
    this.lastLogin = Number.isFinite(data.l) ? data.l : -1;
    this.sets.daily = this.readSet('daily', data.d);
    this.sets.weekly = this.readSet('weekly', data.w);
    this.buildActive();
};

SkateboardObbyQuests.prototype.readSet = function (name, d) {
    if (!d || !Number.isFinite(d.n) || !Array.isArray(d.q)) return null;
    const cat = SkateboardObbyQuests.CATALOG[name];
    const set = { name: name, period: d.n, quests: [], chest: d.x === 1 ? 1 : 0 };
    d.q.forEach(s => {
        if (!Array.isArray(s)) return;
        const def = cat.fixed.find(f => f.id === s[0]) || cat.pool.find(f => f.id === s[0]);
        if (!def) return;   // removed from the catalog
        const p = pc.math.clamp(Number.isFinite(s[1]) ? s[1] : 0, 0, def.goal);
        set.quests.push({ def: def, set: set, p: p, done: p >= def.goal, c: s[2] === 1 ? 1 : 0, row: null });
    });
    return set.quests.length ? set : null;
};

SkateboardObbyQuests.prototype.save = function () {
    this._dirty = false;
    this._saveT = 0;
    const _w = (s) => s ? { n: s.period, x: s.chest, q: s.quests.map(q => [q.def.id, Math.round(q.p * 10) / 10, q.c]) } : null;
    SkateboardObby_Utils.setItem(SkateboardObbyQuests.KEY, JSON.stringify({ v: 1, l: this.lastLogin, d: _w(this.sets.daily), w: _w(this.sets.weekly) }));
};

SkateboardObbyQuests.prototype.saveNow = function () {
    if (this._dirty && !this._noSave && this.sets.daily) this.save();
};

// "Clear all data" wipes the keys, then changes the scene: destroy must not write them back
SkateboardObbyQuests.prototype.onResetData = function () {
    this._noSave = true;
};

SkateboardObbyQuests.prototype.dayNumber = function (now) {
    this._tzOff = new Date(now).getTimezoneOffset();
    return Math.floor((now - this._tzOff * 60000) / SkateboardObbyQuests.DAY_MS);
};

// weeks start on Monday: day 0 (1 Jan 1970) was a Thursday
SkateboardObbyQuests.prototype.weekOf = function (day) {
    return Math.floor((day + 3) / 7);
};

// ms until this set ends (from the set's own period, so a clock moved back shows the real wait)
SkateboardObbyQuests.prototype.timeLeft = function (set) {
    const end = set.name === 'daily' ? set.period + 1 : (set.period + 1) * 7 - 3;
    return end * SkateboardObbyQuests.DAY_MS + (this._tzOff || 0) * 60000 - Date.now();
};

// called at start and once a second: a tab left open over midnight gets the new set too
SkateboardObbyQuests.prototype.checkRoll = function () {
    const today = this.dayNumber(Date.now());
    const week = this.weekOf(today);
    const d = this.sets.daily, w = this.sets.weekly;
    const rollD = !d || today > d.period || d.period - today > this.maxBackDays;
    const rollW = !w || week > w.period || w.period - week > Math.ceil(this.maxBackDays / 7);
    if (!rollD && !rollW && today <= this.lastLogin) return;

    let owed = 0;
    if (rollD) { owed += this.unclaimedCoins(d); this.sets.daily = this.createSet('daily', today, today); }
    if (rollW) { owed += this.unclaimedCoins(w); this.sets.weekly = this.createSet('weekly', week, week); }
    if (rollD || rollW) this.buildActive();
    const firstVisit = this.lastLogin < 0;
    if (today > this.lastLogin || this.lastLogin - today > this.maxBackDays) {
        this.lastLogin = today;
        this.add('days', 1);
    }
    if (rollD) this.add('login', 1);
    if (owed > 0) {
        this.grant({ coins: owed }, true);
        this.queueToast('Unclaimed rewards', '+' + owed + ' coins', 'coin');
    }
    if (rollD && !firstVisit) this.queueToast('New daily quests!', 'Check your quests', 'scroll');
    this.save();
    this.refreshDots();
    if (this.panelOpen) { this.buildRows(); this.setScroll(0, true); this.warn('New quests!', new pc.Color(0.3, 1, 0.45, 1)); }
};

// rewards earned but never claimed are not lost when the set ends
SkateboardObbyQuests.prototype.unclaimedCoins = function (set) {
    if (!set) return 0;
    let sum = 0, all = true;
    set.quests.forEach(q => {
        if (!q.done) { all = false; return; }
        if (!q.c && q.def.coins) sum += q.def.coins;
    });
    const chest = SkateboardObbyQuests.CATALOG[set.name].chest;
    if (all && !set.chest) sum += chest.coins;
    return Math.round(sum * this.rewardScale);
};

// same seed for the same period: the list does not depend on who rolled it, or when
SkateboardObbyQuests.prototype.createSet = function (name, period, seed) {
    const cat = SkateboardObbyQuests.CATALOG[name];
    const pool = cat.pool.slice();
    let s = (seed * 2654435761) >>> 0;
    const _next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let k = 0; k < 4; k++) _next();
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(_next() * (i + 1));
        const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    const set = { name: name, period: period, quests: [], chest: 0 };
    cat.fixed.concat(pool.slice(0, cat.pick)).forEach(def => set.quests.push({ def: def, set: set, p: 0, done: false, c: 0, row: null }));
    return set;
};

// unfinished quests by kind: progress only walks these short lists
SkateboardObbyQuests.prototype.buildActive = function () {
    this.active = {};
    ['daily', 'weekly'].forEach(n => {
        const set = this.sets[n];
        if (!set) return;
        set.quests.forEach(q => {
            if (q.done) return;
            (this.active[q.def.kind] = this.active[q.def.kind] || []).push(q);
        });
    });
};

// --- progress --------------------------------------------------------------------------------

SkateboardObbyQuests.prototype.add = function (kind, n) {
    const list = this.active[kind];
    if (!list || !list.length) return;
    for (let i = list.length - 1; i >= 0; i--) {
        const q = list[i];
        const was = Math.floor(q.p);
        q.p += n;
        if (q.p >= q.def.goal) {
            list.splice(i, 1);
            this.complete(q);
        } else if (this.panelOpen && q.row && Math.floor(q.p) !== was) {
            this.refreshRow(q.row);
        }
    }
    this._dirty = true;
};

SkateboardObbyQuests.prototype.complete = function (q) {
    q.p = q.def.goal;
    q.done = true;
    if (!q.def.silent) {
        if (this.markSeen(q)) this.queueToast('Quest complete!', q.def.title, q.def.icon);
        this.app.fire('skate:questDone', q.def.id);
    }
    if (this.panelOpen && q.row) this.refreshRow(q.row);
    this.refreshDots();
    this.save();
};

// false if this quest of this day / week already had its notification. Its own key: a second tab's older copy of the
// progress can overwrite the quests save, but never takes this back
SkateboardObbyQuests.prototype.markSeen = function (q) {
    let seen = null;
    try { seen = JSON.parse(SkateboardObby_Utils.getItem(SkateboardObbyQuests.KEY_SEEN) || 'null'); } catch (e) { seen = null; }
    if (!seen || typeof seen !== 'object' || Array.isArray(seen)) seen = {};
    const k = q.set.period + ':' + q.def.id;
    if (seen[k]) return false;
    // ended days / weeks are dropped
    const d = this.sets.daily, w = this.sets.weekly;
    for (const old in seen) {
        const id = old.slice(old.indexOf(':') + 1), p = parseInt(old, 10), set = id.charAt(0) === 'd' ? d : w;
        if (!set || set.period !== p) delete seen[old];
    }
    seen[k] = 1;
    SkateboardObby_Utils.setItem(SkateboardObbyQuests.KEY_SEEN, JSON.stringify(seen));
    return true;
};

SkateboardObbyQuests.prototype.getCheckpoint = function () {
    const c = this.app.checkpoint;
    return (c == null || isNaN(c)) ? -1 : c;
};

SkateboardObbyQuests.prototype.onCheckpointChanged = function () {
    const before = this.lastCheckpoint, now = this.getCheckpoint();
    this.lastCheckpoint = now;
    if (now <= before || this.app.isDied === true) return;   // reset, skip with an ad
    const cp = this.checkpointRoot ? this.checkpointRoot.children[now] : null;
    if (!cp || !this.player) return;
    const a = this.player.getPosition(), b = cp.getPosition();
    const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    if (dx * dx + dy * dy + dz * dz <= this.touchRadius * this.touchRadius) this.add('cp', 1);   // tp(n) is farther away
};

SkateboardObbyQuests.prototype.onPlayerDied = function () { this.add('wipe', 1); };
SkateboardObbyQuests.prototype.onBoosted = function () { this.add('boost', 1); };
SkateboardObbyQuests.prototype.onFinished = function () { this.add('finish', 1); };

// fired by PlayerController.onJump after it picked the clip (fast ollie = trick)
SkateboardObbyQuests.prototype.onJump = function () {
    this.add('ollie', 1);
    const c = this.app.skateboardObbyPlayerController;
    if (c && c._oneShotState && c._oneShotState.indexOf('Trick') === 0) this.add('trick', 1);
};

SkateboardObbyQuests.prototype.onCoins = function (balance, delta) {
    if (delta > 0 && !this._granting) this.add('coins', delta);
    if (this.panelOpen && this.coinsText && this.coinsText.element) this.coinsText.element.text = this.fmt(balance);
};

SkateboardObbyQuests.prototype.updateRings = function () {
    const rr = this.ringRewards, p = this.player;
    if (!rr || !rr.rings || !p) return;
    const pos = p.getPosition(), prev = this._prev;
    if (this._hasPrev && this._d.sub2(pos, prev).lengthSq() <= rr.maxStep * rr.maxStep) {
        const range2 = rr.activeRange * rr.activeRange;
        for (let i = 0; i < rr.rings.length; i++) {
            const r = rr.rings[i];
            if (!r.entity.enabled) continue;
            const dx = pos.x - r.c.x, dz = pos.z - r.c.z;
            if (dx * dx + dz * dz > range2) continue;
            const a = this._q.sub2(prev, r.c).dot(r.n);
            const b = this._q.sub2(pos, r.c).dot(r.n);
            if ((a < 0) === (b < 0) || a === b) continue;
            this._q.lerp(prev, pos, a / (a - b)).sub(r.c);
            if (this._q.lengthSq() < r.r2) this.add('ring', 1);
        }
    }
    prev.copy(pos);
    this._hasPrev = true;
};

// cheap field reads only; nothing is allocated here
SkateboardObbyQuests.prototype.trackPlayer = function (dt) {
    const c = this.app.skateboardObbyPlayerController;
    if (!c) return;
    const a = this.active, _dt = Math.min(dt, 0.25);

    if (a.time && a.time.length && !document.hidden && this.app.isWatchingAd !== true && this.app.menuPanelEnabled !== true) this.add('time', _dt);
    if (a.dist && a.dist.length && c.grounded && !c.isDied && this.app.isMarketEnabled !== true) this.add('dist', (c.speed + (c._rollBack || 0)) * _dt);

    const ride = c._ride;
    if (ride !== this._lastRide) {
        const old = this._lastRide;
        this._lastRide = ride;
        if (old && old.type === 'loop' && old.p >= 360) this.add('loop', 1);   // sliding back is not a loop
        if (ride && ride.type === 'grind') this.add('rail', 1);
    }

    const v = c._vert;
    if (v !== this._lastVert) {
        this._lastVert = v;
        if (v && v.big) { this.add('vert', 1); this.add('trick', 1); }   // the grab plays only on a big one
    }

    // boost pads have no event: their FOV kick; the VIP boost comes with skate:boosted
    const fov = this.app.targetFov;
    if (fov !== this._lastFov) {
        if (fov === 72 && !(c.boostTimer > 0)) this.add('boost', 1);
        this._lastFov = fov;
    }

    if (a.ring && a.ring.length) this.updateRings();
    else this._hasPrev = false;
};

// --- rewards ---------------------------------------------------------------------------------

SkateboardObbyQuests.prototype.grant = function (reward, quiet) {
    const cm = this.app.skateCoins;
    const pim = this.app.playerItemManager;
    let coins = reward.coins ? Math.round(reward.coins * (quiet ? 1 : this.rewardScale)) : 0;
    if (reward.boost) {
        if (pim && pim.grantBoostPowerup) pim.grantBoostPowerup(reward.boost);
        else coins += 50;
    }
    if (coins > 0 && cm) {
        this._granting = true;
        cm.add(coins);
        cm.save();
        this._granting = false;
        if (cm._iconPop !== undefined) cm._iconPop = 0.2;
    }
};

SkateboardObbyQuests.prototype.rewardText = function (r) {
    if (r.coins) return '+' + Math.round(r.coins * this.rewardScale);
    return '+' + r.boost + 's';
};

SkateboardObbyQuests.prototype.claim = function (q) {
    if (!q.done || q.c) return;
    q.c = 1;
    this.grant(q.def);
    this.save();
    this.refreshDots();
    this.sfx('purchase');
    this.app.fire('skate:questClaimed', q.def.id);
    if (q.row) { this.refreshRow(q.row); this.punch(q.row.button); }
    this.rows.forEach(r => { if (r.chest) this.refreshRow(r); });
};

SkateboardObbyQuests.prototype.claimedCount = function (set) {
    let n = 0;
    for (let i = 0; i < set.quests.length; i++) if (set.quests[i].c) n++;
    return n;
};

SkateboardObbyQuests.prototype.chestReady = function (set) {
    return !set.chest && this.claimedCount(set) >= set.quests.length;
};

SkateboardObbyQuests.prototype.openChest = function (set) {
    if (!this.chestReady(set)) return;
    set.chest = 1;
    const cat = SkateboardObbyQuests.CATALOG[set.name];
    this.grant(cat.chest);
    this.save();
    this.refreshDots();
    this.app.fire('skate:questChest', set.name);
    this.rows.forEach(r => { if (r.chest) this.refreshRow(r); });
    this.playChestFx(set);
};

// --- dots ------------------------------------------------------------------------------------

SkateboardObbyQuests.prototype.countClaimable = function (set) {
    if (!set) return 0;
    let n = this.chestReady(set) ? 1 : 0;
    for (let i = 0; i < set.quests.length; i++) { const q = set.quests[i]; if (q.done && !q.c) n++; }
    return n;
};

SkateboardObbyQuests.prototype.refreshDots = function () {
    const d = this.countClaimable(this.sets.daily), w = this.countClaimable(this.sets.weekly);
    const n = d + w;
    if (this.tabDots.daily) this.tabDots.daily.enabled = d > 0;
    if (this.tabDots.weekly) this.tabDots.weekly.enabled = w > 0;
    if (n === this.claimable) return;
    const up = n > this.claimable && this.claimable >= 0;
    this.claimable = n;
    if (this.openDot) {
        this.openDot.enabled = n > 0;
        if (this.openDotText && this.openDotText.element) this.openDotText.element.text = n > 9 ? '9+' : String(n);
        if (up && n > 0) this.punch(this.openDot);
    }
};

// --- list --------------------------------------------------------------------------------------

SkateboardObbyQuests.prototype.setTab = function (_tab) {
    if (this.tab === _tab && this._builtTab === _tab) return;
    this.tab = _tab;
    this.buildRows();
    this.setScroll(0, true);
    this.refreshTabs();
    this.refreshInfo(true);
};

SkateboardObbyQuests.prototype.refreshTabs = function () {
    [[this.tabDaily, 'daily'], [this.tabWeekly, 'weekly']].forEach(([e, t]) => {
        if (!e || !e.element) return;
        const _on = this.tab === t;
        const _s = _on ? this.spriteTabOn : this.spriteTabOff;
        if (_s) e.element.spriteAsset = _s;
        const _txt = e.findByName('Text');
        if (_txt && _txt.element) _txt.element.color = _on ? this._white : this._dim;
    });
};

SkateboardObbyQuests.prototype.buildRows = function () {
    this.rows.forEach(r => { if (r.q) r.q.row = null; r.entity.destroy(); });
    this.rows.length = 0;
    this._builtTab = this.tab;
    if (!this.content || !this.rowTemplate) return;
    const set = this.sets[this.tab];
    if (!set) return;

    // the chest on top, then what can be claimed, what is running, what is over (decided when the list opens, rows do not jump)
    const _rank = (q) => (q.done && !q.c) ? 0 : (q.c ? 2 : 1);
    const order = set.quests.slice().sort((a, b) => _rank(a) - _rank(b));
    const _h = this.rowHeight, _sp = this.rowSpacing;

    this.addRow(null, set, 0);
    order.forEach((q, i) => this.addRow(q, null, i + 1));

    const _n = order.length + 1;
    const _total = _n * _h + (_n - 1) * _sp;
    const _view = this.list && this.list.element ? this.list.element.height : _total;
    this.scrollMax = Math.max(0, _total + 2 * this.listPadding - _view);
    if (!Number.isFinite(this.scrollMax)) this.scrollMax = 0;
    if (this.coinsText && this.coinsText.element) this.coinsText.element.text = this.fmt(this.app.skateCoins ? this.app.skateCoins.get() : 0);
};

SkateboardObbyQuests.prototype.addRow = function (q, chestSet, i) {
    const _h = this.rowHeight, _sp = this.rowSpacing;
    const e = this.rowTemplate.clone();
    e.name = 'Row_' + (q ? q.def.id : 'chest');
    this.content.addChild(e);
    e.enabled = true;
    e.setLocalPosition(0, -(_h / 2) - i * (_h + _sp), 0);
    const r = {
        q: q, chest: chestSet, entity: e, state: null,
        icon: e.findByName('Icon'),
        name: e.findByName('NameText'),
        barBg: e.findByName('BarBg'),
        fill: e.findByName('BarFill'),
        barText: e.findByName('BarText'),
        button: e.findByName('ActionButton'),
        btnIcon: e.findByName('ActionIcon'),
        btnText: e.findByName('ActionText'),
        fillDone: null, fillWidth: -1, text: ''
    };
    const cat = chestSet ? SkateboardObbyQuests.CATALOG[chestSet.name] : null;
    if (q) q.row = r;
    if (r.name) r.name.element.text = q ? q.def.title : (cat.title + (cat.chest.boost ? ' + ' + Math.round(cat.chest.boost / 60) + 'm Boost' : ''));
    this.setImage(r.icon, q ? q.def.icon : 'chest');
    if (e.element) {
        const _s = q ? this.spriteRow : this.spriteRowChest;
        if (_s) e.element.spriteAsset = _s;
    }
    if (r.button && r.button.button) r.button.button.on('click', () => { if (!this.dragMoved) this.onRowAction(r); }, this);
    this.refreshRow(r);
    this.rows.push(r);
};

SkateboardObbyQuests.prototype.setImage = function (_e, _key) {
    if (!_e || !_e.element) return;
    if (_key === 'coin') {
        _e.element.texture = null;
        _e.element.textureAsset = this.coinIcon;
    } else {
        _e.element.textureAsset = null;
        _e.element.texture = this.getArt(_key);
    }
};

SkateboardObbyQuests.prototype.fmtTime = function (_s) {
    _s = Math.floor(_s);
    if (_s < 60) return _s + 's';
    if (_s < 3600) return Math.floor(_s / 60) + 'm';
    const m = Math.floor(_s / 60) % 60;
    return Math.floor(_s / 3600) + 'h' + (m ? ' ' + m + 'm' : '');
};

SkateboardObbyQuests.prototype.progressText = function (q) {
    const k = q.def.kind;
    if (k === 'time') return this.fmtTime(q.p) + ' / ' + this.fmtTime(q.def.goal);
    return Math.floor(q.p) + ' / ' + q.def.goal + (k === 'dist' ? ' m' : '');
};

// writes only what changed: called when a row's value changes, not every frame
SkateboardObbyQuests.prototype.refreshRow = function (r) {
    let ratio, text, state, btn, icon;
    if (r.q) {
        const q = r.q;
        ratio = q.done ? 1 : q.p / q.def.goal;
        text = q.c ? 'CLAIMED' : (q.done ? 'COMPLETE!' : this.progressText(q));
        state = q.c ? 'over' : (q.done ? 'ready' : 'wait');
        const _rt = this.rewardText(q.def);
        btn = q.c ? 'CLAIMED' : (q.done ? 'CLAIM ' + _rt : _rt);
        icon = q.c ? 'check' : (q.def.coins ? 'coin' : 'bolt');
    } else {
        const set = r.chest, n = this.claimedCount(set), all = set.quests.length, cat = SkateboardObbyQuests.CATALOG[set.name];
        ratio = n / all;
        text = set.chest ? 'OPENED' : (n >= all ? 'COMPLETE!' : n + ' / ' + all + ' Quests');
        state = set.chest ? 'over' : (n >= all ? 'ready' : 'wait');
        btn = set.chest ? 'OPENED' : (n >= all ? 'OPEN!' : this.rewardText(cat.chest));
        icon = set.chest ? 'check' : (n >= all ? 'chestOpen' : 'coin');
    }

    if (r.fill && r.barBg) {
        const _inner = r.barBg.element.width - 8;
        const _w = ratio > 0 ? Math.max(this.barMinWidth, _inner * Math.min(1, ratio)) : 0;
        if (_w !== r.fillWidth) {
            r.fillWidth = _w;
            r.fill.enabled = _w > 0;
            if (_w > 0) r.fill.element.width = _w;
        }
        const _done = ratio >= 1;
        if (_done !== r.fillDone) {
            r.fillDone = _done;
            const _s = _done ? this.spriteBarDone : this.spriteBarFill;
            if (_s) r.fill.element.spriteAsset = _s;
        }
    }
    if (r.barText && text !== r.text) {
        r.text = text;
        r.barText.element.text = text;
    }
    if (state !== r.state || (r.btnText && r.btnText.element.text !== btn)) {
        r.state = state;
        const _sprite = state === 'ready' ? this.spriteClaim : (state === 'over' ? this.spriteClaimed : this.spriteWait);
        if (r.button && r.button.element && _sprite) r.button.element.spriteAsset = _sprite;
        if (r.btnIcon) this.setImage(r.btnIcon, icon);
        if (r.btnText) {
            r.btnText.element.text = btn;
            r.btnText.element.fontSize = btn.length > 7 ? 24 : 32;
            r.btnText.element.color = state === 'wait' ? this._dim : this._white;
        }
        if (r.name) r.name.element.color = state === 'over' ? this._dim : this._white;
        if (r.button && state !== 'ready') r.button.setLocalScale(1, 1, 1);
    }
};

SkateboardObbyQuests.prototype.onRowAction = function (r) {
    if (r.q) {
        if (r.q.done && !r.q.c) { this.claim(r.q); return; }
        if (r.q.done) return;
        this.warn('Keep going! ' + this.progressText(r.q), new pc.Color(1, 0.85, 0.3, 1));
        this.punch(r.button);
        return;
    }
    const set = r.chest;
    if (this.chestReady(set)) { this.openChest(set); return; }
    if (set.chest) return;
    this.warn('Claim all ' + set.quests.length + ' quests to open the chest!', new pc.Color(1, 0.85, 0.3, 1));
    this.punch(r.button);
};

// --- panel ---------------------------------------------------------------------------------------

SkateboardObbyQuests.prototype.canOpen = function () {
    const a = this.app;
    const _pc = a.skateboardObbyPlayerController;
    return !a.isWatchingAd && !(_pc && _pc.isDied) && !a.menuPanelEnabled && !a.deadMenuEnabled && !a.isPopupEnabled && !(a.numpad && a.numpad.enabled) && !a.inCutscene && !a.isMarketEnabled;
};

SkateboardObbyQuests.prototype.setPanelVisible = function (_visible) {
    if (_visible == this.panelOpen || !this.panel) return;
    if (_visible && !this.canOpen()) return;
    this.panelOpen = _visible;

    if (_visible) {
        this.app.isMarketEnabled = true;
        this.panel.enabled = true;
        // open where a reward waits
        if (this.countClaimable(this.sets[this.tab]) === 0 && this.countClaimable(this.sets[this.tab === 'daily' ? 'weekly' : 'daily']) > 0) this.tab = this.tab === 'daily' ? 'weekly' : 'daily';
        this.endDrag();
        this.buildRows();
        this.refreshTabs();
        this.setScroll(0, true);
        this.refreshInfo(true);
        if (this.panelBody) {
            const _f = this.computeFit();
            this.panelBody.setLocalScale(0.5 * _f, 0.5 * _f, 0.5 * _f);
            this.panelBody.tween(this.panelBody.getLocalScale()).to(new pc.Vec3(_f, _f, _f), 0.35, pc.BackOut).start();
        }
        const _c = this.app.skateboardObbyPlayerController;
        if (_c && _c.stopMovement) _c.stopMovement();
        if (this.app.gameplayStarted) {
            this.app.gameplayStarted = false;
            if (typeof PokiSDK !== 'undefined') PokiSDK.gameplayStop();
        }
    } else {
        this.app.isMarketEnabled = false;
        this.endDrag();
        this.stopChestFx();
        this.messageTimer = 0;
        if (this.messageText) this.messageText.enabled = false;
        if (this.infoText) this.infoText.enabled = true;
        this.saveNow();
        const _f = this.fitScale || 1;
        const _done = () => { if (this.panelOpen) return; /* opened again while closing */ this.panel.enabled = false; if (this.panelBody) this.panelBody.setLocalScale(_f, _f, _f); };
        if (this.panelBody) this.panelBody.tween(this.panelBody.getLocalScale()).to(new pc.Vec3(0.6 * _f, 0.6 * _f, 0.6 * _f), 0.12, pc.BackIn).onComplete(_done).start();
        else _done();
    }

    this.app.fire('lockCamera', _visible);
    const nm = this.app.skateboardObbyNetworkManager;
    if (nm && nm.setBlackBG) nm.setBlackBG(_visible);
    this.app.fire('skate:questsPanel', _visible);
};

SkateboardObbyQuests.prototype.computeFit = function () {
    let _f = 1;
    const _screen = this.panel && this.panel.element && this.panel.element.screen && this.panel.element.screen.screen;
    if (_screen && _screen.scale > 0) {
        const _h = _screen.resolution.y / _screen.scale;
        const _w = _screen.resolution.x / _screen.scale;
        _f = Math.min(1, (_h * this.fitMargin) / Math.max(1, this.fitHeight), (_w * 0.96) / Math.max(1, this.fitWidth));
    }
    this.fitScale = _f;
    return _f;
};

SkateboardObbyQuests.prototype.onResize = function () {
    if (!this.panelOpen || !this.panelBody) return;
    setTimeout(() => { if (!this.panelOpen || !this.panelBody) return; const _f = this.computeFit(); this.panelBody.setLocalScale(_f, _f, _f); }, 0);
};

SkateboardObbyQuests.prototype.onMarketClose = function () {
    if (this.panelOpen) this.setPanelVisible(false);
};

SkateboardObbyQuests.prototype.fmtLeft = function (_ms) {
    const _s = Math.max(0, Math.floor(_ms / 1000));
    const d = Math.floor(_s / 86400), h = Math.floor(_s / 3600) % 24, m = Math.floor(_s / 60) % 60;
    if (d > 0) return d + 'd ' + h + 'h';
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm ' + (_s % 60) + 's';
};

SkateboardObbyQuests.prototype.refreshInfo = function (_force) {
    const set = this.sets[this.tab];
    if (!set || !this.infoText || !this.infoText.element) return;
    const t = 'New quests in ' + this.fmtLeft(this.timeLeft(set));
    if (t !== this._infoText || _force) { this._infoText = t; this.infoText.element.text = t; }
};

SkateboardObbyQuests.prototype.update = function (dt) {
    this.trackPlayer(dt);

    this._secT += dt;
    if (this._secT >= 1) {
        this._secT = 0;
        this.checkRoll();
        if (this.panelOpen) this.refreshInfo();
    }
    if (this._dirty) {
        this._saveT += dt;
        if (this._saveT >= this.saveInterval) this.save();
    }
    if (this._toastT >= 0 || this._toastQ.length) this.updateToast(dt);
    if (this.claimable > 0 || this._wiggling) this.updateWiggle(dt);

    if (this.panelOpen) {
        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                if (this.messageText) this.messageText.enabled = false;
                if (this.infoText) this.infoText.enabled = true;
            }
        }
        if (Math.abs(this.scrollTarget - this.scrollY) > 0.5) this.applyScroll(pc.math.lerp(this.scrollY, this.scrollTarget, Math.min(1, dt * 14)));
        else if (this.scrollTarget !== this.scrollY) this.applyScroll(this.scrollTarget);
        if (this.chestT >= 0) this.updateChestFx(dt);
        // "claim me" pulse
        this._pulse = (this._pulse || 0) + dt;
        const _p = 1 + 0.035 * Math.sin(this._pulse * 6);
        for (let i = 0; i < this.rows.length; i++) {
            const r = this.rows[i];
            if (r.state === 'ready' && r.button) r.button.setLocalScale(_p, _p, 1);
        }
    }

    const kb = this.app.keyboard;
    if (kb) {
        if (this.panelOpen && kb.wasPressed(pc.KEY_ESCAPE)) this.setPanelVisible(false);
        else if (this.hotkeyCode >= 0 && kb.wasPressed(this.hotkeyCode) && !this.app.isTypingEnabled) this.setPanelVisible(!this.panelOpen);
    }
};

// --- HUD notification --------------------------------------------------------------------------

SkateboardObbyQuests.prototype.queueToast = function (_title, _text, _icon) {
    if (!this.toast || this.panelOpen) return;
    if (this._toastQ.length < 4) this._toastQ.push({ title: _title, text: _text, icon: _icon });
};

SkateboardObbyQuests.prototype.updateToast = function (dt) {
    if (this._toastT < 0) {
        const a = this.app, c = a.skateboardObbyPlayerController;
        if (a.isMarketEnabled || a.menuPanelEnabled || a.deadMenuEnabled || a.isPopupEnabled || a.isWatchingAd || a.inCutscene || !c || !c.canMove()) return;
        const t = this._toastQ.shift();
        if (this.toastTitle) this.toastTitle.element.text = t.title;
        if (this.toastText) this.toastText.element.text = t.text;
        this.setImage(this.toastIcon, t.icon);
        this.toast.enabled = true;
        this._toastT = 0;
    }
    this._toastT += dt;
    const t = this._toastT, hold = this.toastHold;
    let s = 1;
    if (t < 0.2) { const u = t / 0.2 - 1; s = 1 + 2.70158 * u * u * u + 1.70158 * u * u; }
    else if (t > hold) s = Math.max(0, 1 - (t - hold) / 0.15);
    this.toast.setLocalScale(s, s, 1);
    if (t > hold + 0.15) {
        this.toast.enabled = false;
        this._toastT = -1;
    }
};

// short bursts, then a pause. One Euler write per frame during a burst, nothing allocated
SkateboardObbyQuests.prototype.updateWiggle = function (dt) {
    const a = this.app, c = a.skateboardObbyPlayerController;
    const on = this.claimable > 0 && this.wiggleAngle > 0 && this.openButton && this._toastT < 0 && !this._toastQ.length &&
        !a.isMarketEnabled && !a.menuPanelEnabled && !a.deadMenuEnabled && !a.isPopupEnabled && !a.isWatchingAd && !a.inCutscene && !(c && c.isDied) && !(a.numpad && a.numpad.enabled);
    if (!on) {
        this._wiggleT = 0;
        if (this._wiggling) { this._wiggling = false; this.openButton.setLocalEulerAngles(0, 0, 0); }
        return;
    }
    this._wiggleT += dt;
    if (this._wiggleT >= this.wiggleTime + this.wigglePause) this._wiggleT = 0;
    if (this._wiggleT < this.wiggleTime) {
        const u = this._wiggleT / this.wiggleTime;
        this.openButton.setLocalEulerAngles(0, 0, Math.sin(u * 18.85) * this.wiggleAngle * (1 - u));
        this._wiggling = true;
    } else if (this._wiggling) {
        this._wiggling = false;
        this.openButton.setLocalEulerAngles(0, 0, 0);
    }
};

// --- chest animation (image elements and scale only, no shader) ------------------------------------

SkateboardObbyQuests.prototype.createChestFx = function () {
    const fx = new pc.Entity('ChestFx');
    fx.addComponent('element', { type: pc.ELEMENTTYPE_IMAGE, anchor: new pc.Vec4(0, 0, 1, 1), pivot: new pc.Vec2(0.5, 0.5), margin: new pc.Vec4(0, 0, 0, 0), color: new pc.Color(0.06, 0.04, 0.14), opacity: 0.88, useInput: true });
    this.frame.addChild(fx);
    const _img = (name, size) => {
        const e = new pc.Entity(name);
        e.addComponent('element', { type: pc.ELEMENTTYPE_IMAGE, anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5), pivot: new pc.Vec2(0.5, 0.5), width: size, height: size });
        fx.addChild(e);
        return e;
    };
    const _txt = (name, y, size, color) => {
        const e = new pc.Entity(name);
        e.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5), pivot: new pc.Vec2(0.5, 0.5), width: 700, height: size * 1.3, fontAsset: this.messageText.element.fontAsset, fontSize: size, color: color, outlineColor: new pc.Color(0.1, 0.06, 0.18, 1), outlineThickness: 1, alignment: new pc.Vec2(0.5, 0.5), text: '' });
        e.setLocalPosition(0, y, 0);
        fx.addChild(e);
        return e;
    };
    this.chestCoins = [];
    for (let i = 0; i < 10; i++) {
        const c = _img('Coin', 64);
        c.element.textureAsset = this.coinIcon;
        // the burst directions are spread evenly, a little random
        const a = (i / 10) * Math.PI * 2 + 0.3 * Math.sin(i * 7.1);
        c._dx = Math.cos(a);
        c._dy = Math.sin(a);
        this.chestCoins.push(c);
    }
    this.chestImage = _img('Chest', 300);
    this.chestImage.setLocalPosition(0, 10, 0);
    this.chestTitle = _txt('Title', 230, 56, new pc.Color(1, 0.95, 0.6, 1));
    this.chestReward = _txt('Reward', -210, 64, new pc.Color(0.4, 1, 0.5, 1));
    fx.element.on('click', () => { if (this.chestT > 0.7) this.chestT = 9; }, this);
    this.chestFx = fx;
};

SkateboardObbyQuests.prototype.playChestFx = function (set) {
    if (!this.frame) return;
    if (!this.chestFx) this.createChestFx();
    const cat = SkateboardObbyQuests.CATALOG[set.name];
    this.chestFx.enabled = true;
    this.chestImage.element.texture = this.getArt('chest');
    this.chestImage.setLocalScale(1, 1, 1);
    this.chestImage.setLocalEulerAngles(0, 0, 0);
    this.chestTitle.element.text = cat.title + '!';
    let t = this.rewardText(cat.chest) + ' Coins';
    if (cat.chest.boost) t += ' + ' + Math.round(cat.chest.boost / 60) + 'm Boost';
    this.chestReward.element.text = t;
    this.chestReward.enabled = false;
    this.chestCoins.forEach(c => { c.enabled = false; });
    this.chestT = 0;
    this._chestOpened = false;
};

SkateboardObbyQuests.prototype.updateChestFx = function (dt) {
    this.chestT += dt;
    const t = this.chestT, img = this.chestImage;
    if (t < 0.6) {
        const k = t / 0.6;
        img.setLocalEulerAngles(0, 0, Math.sin(t * 42) * 7 * k);
        const s = 1 + 0.12 * k;
        img.setLocalScale(s, s, 1);
        return;
    }
    if (!this._chestOpened) {
        this._chestOpened = true;
        img.setLocalEulerAngles(0, 0, 0);
        img.element.texture = this.getArt('chestOpen');
        this.chestReward.enabled = true;
        this.chestCoins.forEach(c => { c.enabled = true; });
        this.sfx('purchase');
    }
    const u = Math.min(1, (t - 0.6) / 0.25);
    const s = 1.35 - 0.25 * u;
    img.setLocalScale(s, s, 1);
    const rs = 0.6 + 0.4 * u;
    this.chestReward.setLocalScale(rs, rs, 1);
    const f = Math.min(1, (t - 0.6) / 0.9);
    for (let i = 0; i < this.chestCoins.length; i++) {
        const c = this.chestCoins[i];
        const d = 330 * (1 - (1 - f) * (1 - f));
        c.setLocalPosition(c._dx * d, 10 + c._dy * d - 140 * f * f, 0);
        c.element.opacity = 1 - f * f;
        const cs = 1 - 0.4 * f;
        c.setLocalScale(cs, cs, 1);
    }
    if (t > 2.6) this.stopChestFx();
};

SkateboardObbyQuests.prototype.stopChestFx = function () {
    this.chestT = -1;
    if (this.chestFx) this.chestFx.enabled = false;
};

// --- scrolling (CLAUDE.md 2.4, same as SkateboardObby_WorldsPanel) ---------------------------------

SkateboardObbyQuests.prototype.setupScroll = function () {
    if (this.app.mouse) this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onWheel, this);
    if (!this.list || !this.list.element) return;
    this.list.element.useInput = true;
    this.list.element.on('mousedown', (e) => this.beginDrag(e.y, null), this);
    // Mobile: ElementTouchEvent.changedTouches are the browser's Touch objects (no x / y, only clientX / clientY),
    // so the start comes from e.y (canvas coordinate) and the same finger (identifier) is followed.
    this.list.element.on('touchstart', (e) => {
        if (this.drag) return;
        this.beginDrag(e.y, e.touch ? e.touch.identifier : null);
    }, this);
    this._onMove = (e) => { if (this.drag && this.drag.touchId == null) this.moveDrag(e.y); };
    this._onUp = () => this.endDrag();
    // app.touch events carry pc.Touch objects (id, x, y)
    this._onTouchMove = (e) => {
        if (!this.drag) return;
        const _list = e.changedTouches || [];
        for (let i = 0; i < _list.length; i++) {
            if (this.drag.touchId == null || _list[i].id === this.drag.touchId) { this.moveDrag(_list[i].y); return; }
        }
    };
    this._onTouchEnd = (e) => {
        if (!this.drag) return;
        const _list = e.changedTouches || [];
        for (let i = 0; i < _list.length; i++) {
            if (this.drag.touchId == null || _list[i].id === this.drag.touchId) { this.endDrag(); return; }
        }
    };
};

// panel units per CSS pixel of finger / mouse movement
SkateboardObbyQuests.prototype.dragScale = function () {
    const _screen = this.panel && this.panel.element && this.panel.element.screen && this.panel.element.screen.screen;
    const gd = this.app.graphicsDevice;
    const _ratio = gd.canvas && gd.canvas.clientHeight ? gd.height / gd.canvas.clientHeight : 1;   // canvas px per CSS px
    const _s = (_screen && _screen.scale > 0 ? _screen.scale : 1) * (this.fitScale || 1);
    return _ratio / Math.max(0.01, _s);
};

SkateboardObbyQuests.prototype.beginDrag = function (_y, _touchId) {
    if (!this.panelOpen || this.scrollMax <= 0 || !Number.isFinite(_y) || this.chestT >= 0) return;
    this.endDrag();
    this.drag = { y: _y, start: Number.isFinite(this.scrollY) ? this.scrollY : 0, touchId: (_touchId == null ? null : _touchId) };
    this.dragMoved = false;
    if (this.app.mouse) { this.app.mouse.on(pc.EVENT_MOUSEMOVE, this._onMove, this); this.app.mouse.on(pc.EVENT_MOUSEUP, this._onUp, this); }
    if (this.app.touch) { this.app.touch.on(pc.EVENT_TOUCHMOVE, this._onTouchMove, this); this.app.touch.on(pc.EVENT_TOUCHEND, this._onTouchEnd, this); this.app.touch.on(pc.EVENT_TOUCHCANCEL, this._onTouchEnd, this); }
};

SkateboardObbyQuests.prototype.moveDrag = function (_y) {
    // finger / mouse up -> the list moves up (lower rows come in)
    if (!this.drag || !Number.isFinite(_y)) return;
    const _d = (_y - this.drag.y) * this.dragScale();
    if (!Number.isFinite(_d)) return;
    if (Math.abs(_d) > 8) this.dragMoved = true;
    this.setScroll(this.drag.start - _d, true);
};

SkateboardObbyQuests.prototype.endDrag = function () {
    if (!this.drag) return;
    this.drag = null;
    if (this.app.mouse) { this.app.mouse.off(pc.EVENT_MOUSEMOVE, this._onMove, this); this.app.mouse.off(pc.EVENT_MOUSEUP, this._onUp, this); }
    if (this.app.touch) { this.app.touch.off(pc.EVENT_TOUCHMOVE, this._onTouchMove, this); this.app.touch.off(pc.EVENT_TOUCHEND, this._onTouchEnd, this); this.app.touch.off(pc.EVENT_TOUCHCANCEL, this._onTouchEnd, this); }
    if (this.dragMoved) setTimeout(() => { this.dragMoved = false; }, 0);   // the click from this release is ignored
};

SkateboardObbyQuests.prototype.onWheel = function (e) {
    if (!this.panelOpen || this.scrollMax <= 0) return;
    this.setScroll(this.scrollTarget + (e.wheelDelta > 0 ? 1 : -1) * (this.rowHeight + this.rowSpacing)); // pc: wheelDelta > 0 = wheel down
    if (e.event) e.event.preventDefault();
};

// _instant: jump there (drag / opening); otherwise update() eases towards it
SkateboardObbyQuests.prototype.setScroll = function (_v, _instant) {
    if (!Number.isFinite(_v)) _v = Number.isFinite(this.scrollTarget) ? this.scrollTarget : 0;   // never write NaN
    const _max = Number.isFinite(this.scrollMax) ? Math.max(0, this.scrollMax) : 0;
    this.scrollTarget = pc.math.clamp(_v, 0, _max);
    if (_instant || this.scrollY === undefined) this.applyScroll(this.scrollTarget);
};

SkateboardObbyQuests.prototype.applyScroll = function (_v) {
    this.scrollY = Number.isFinite(_v) ? _v : 0;
    if (this.content) {
        const _top = this.list && this.list.element ? this.list.element.height / 2 - this.listPadding : 0;
        this.content.setLocalPosition(0, _top + this.scrollY, 0);
    }
    const h = this.scrollHandle;
    if (h && h.element && this.list && this.list.element) {
        h.enabled = this.scrollMax > 0;
        const _view = this.list.element.height;
        const _hh = Math.max(40, _view * _view / (_view + this.scrollMax));
        h.element.height = _hh;
        const _u = this.scrollMax > 0 ? this.scrollY / this.scrollMax : 0;
        h.setLocalPosition(h.getLocalPosition().x, (_view - _hh) / 2 - _u * (_view - _hh), 0);
    }
};

// --- helpers -------------------------------------------------------------------------------------

SkateboardObbyQuests.prototype.getArt = function (_key) {
    if (!this.art[_key]) this.art[_key] = SkateboardObby_QuestArt.toTexture(this.app, SkateboardObby_QuestArt.draw(_key));
    return this.art[_key];
};

SkateboardObbyQuests.prototype.fmt = function (_n) {
    _n = Math.floor(_n || 0);
    if (_n < 10000) return String(_n);
    if (_n < 1e6) return (Math.floor(_n / 100) / 10) + 'K';
    return (Math.floor(_n / 1e5) / 10) + 'M';
};

SkateboardObbyQuests.prototype.warn = function (_msg, _color) {
    if (!this.messageText || !this.messageText.element) return;
    this.messageText.element.text = _msg;
    this.messageText.element.color = _color || this._white;
    this.messageText.enabled = true;
    if (this.infoText) this.infoText.enabled = false;
    this.messageText.setLocalScale(0.8, 0.8, 1);
    this.messageText.tween(this.messageText.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.15, pc.BackOut).start();
    this.messageTimer = 2.2;
};

SkateboardObbyQuests.prototype.sfx = function (_name) {
    const gm = this.app.gameManager;
    try {
        if (_name === 'purchase' && gm && gm.sfx_purchase) gm.sfx_purchase();
    } catch (e) { }
};

SkateboardObbyQuests.prototype.punch = function (_e) {
    if (!_e) return;
    _e.setLocalScale(1.15, 1.15, 1);
    _e.tween(_e.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.25, pc.BackOut).start();
};

// =================================================================================================
// Canvas icons (no texture assets), same outline as the shop's
// =================================================================================================
var SkateboardObby_QuestArt = {
    OUTLINE: '#1b1530',
    toTexture: function (app, canvas) {
        const tex = new pc.Texture(app.graphicsDevice, {
            width: canvas.width, height: canvas.height,
            format: pc.PIXELFORMAT_SRGBA8 !== undefined ? pc.PIXELFORMAT_SRGBA8 : pc.PIXELFORMAT_RGBA8,
            mipmaps: false, minFilter: pc.FILTER_LINEAR, magFilter: pc.FILTER_LINEAR,
            addressU: pc.ADDRESS_CLAMP_TO_EDGE, addressV: pc.ADDRESS_CLAMP_TO_EDGE
        });
        tex.setSource(canvas);
        return tex;
    },
    draw: function (key) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 128;
        const ctx = cv.getContext('2d');
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (this[key]) this[key](ctx);
        return cv;
    },
    // outlined shape: path() twice
    shape: function (ctx, path, fill, w) {
        ctx.strokeStyle = this.OUTLINE; ctx.lineWidth = w || 9;
        ctx.beginPath(); path(); ctx.stroke();
        ctx.fillStyle = fill;
        ctx.beginPath(); path(); ctx.fill();
    },
    line: function (ctx, path, color, w) {
        ctx.strokeStyle = this.OUTLINE; ctx.lineWidth = w + 8;
        ctx.beginPath(); path(); ctx.stroke();
        ctx.strokeStyle = color; ctx.lineWidth = w;
        ctx.beginPath(); path(); ctx.stroke();
    },
    arrow: function (ctx, x, y, color) {
        this.shape(ctx, () => { ctx.moveTo(x, y - 26); ctx.lineTo(x + 22, y); ctx.lineTo(x + 9, y); ctx.lineTo(x + 9, y + 24); ctx.lineTo(x - 9, y + 24); ctx.lineTo(x - 9, y); ctx.lineTo(x - 22, y); ctx.closePath(); }, color);
    },
    board: function (ctx, x, y, rot, s) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
        [-30, 30].forEach(px => { ctx.beginPath(); ctx.arc(px, 18, 10, 0, Math.PI * 2); ctx.fillStyle = this.OUTLINE; ctx.fill(); ctx.beginPath(); ctx.arc(px, 18, 6, 0, Math.PI * 2); ctx.fillStyle = '#ffd34d'; ctx.fill(); });
        const deck = () => { ctx.moveTo(-44, -11); ctx.lineTo(44, -11); ctx.arc(44, 0, 11, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-44, 11); ctx.arc(-44, 0, 11, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); };
        const g = ctx.createLinearGradient(-56, 0, 56, 0); g.addColorStop(0, '#ff5a7a'); g.addColorStop(1, '#ffa03a');
        this.shape(ctx, deck, g);
        ctx.restore();
    },
    star: function (ctx, x, y, r, color) {
        this.shape(ctx, () => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; const px = x + Math.cos(a) * q, py = y + Math.sin(a) * q; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); }, color, 7);
    },
    scroll: function (ctx) {
        const g = ctx.createLinearGradient(0, 14, 0, 114); g.addColorStop(0, '#fff3c4'); g.addColorStop(1, '#f2cf7a');
        this.shape(ctx, () => { ctx.moveTo(26, 16); ctx.lineTo(102, 16); ctx.lineTo(102, 112); ctx.lineTo(26, 112); ctx.closePath(); }, g, 10);
        [38, 62, 86].forEach(y => {
            ctx.strokeStyle = '#2fbf5a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(36, y); ctx.lineTo(42, y + 7); ctx.lineTo(53, y - 7); ctx.stroke();
            ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(62, y); ctx.lineTo(90, y); ctx.stroke();
        });
    },
    cal: function (ctx) {
        this.shape(ctx, () => { ctx.moveTo(20, 28); ctx.lineTo(108, 28); ctx.lineTo(108, 110); ctx.lineTo(20, 110); ctx.closePath(); }, '#f4f7ff', 10);
        ctx.fillStyle = '#ff5a5a'; ctx.fillRect(24, 32, 80, 22);
        ctx.fillStyle = this.OUTLINE; ctx.fillRect(40, 16, 10, 24); ctx.fillRect(78, 16, 10, 24);
        ctx.strokeStyle = '#2fbf5a'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(44, 82); ctx.lineTo(60, 96); ctx.lineTo(86, 66); ctx.stroke();
    },
    clock: function (ctx) {
        this.shape(ctx, () => ctx.arc(64, 64, 48, 0, Math.PI * 2), '#f4f7ff', 10);
        ctx.strokeStyle = '#4db8ff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(64, 64, 40, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = this.OUTLINE; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(64, 34); ctx.moveTo(64, 64); ctx.lineTo(84, 74); ctx.stroke();
    },
    ollie: function (ctx) {
        this.arrow(ctx, 64, 40, '#5ce65c');
        this.board(ctx, 64, 92, -0.25, 1);
    },
    trick: function (ctx) {
        ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(64, 64, 44, -2.6, 0.3); ctx.stroke();
        this.board(ctx, 64, 72, -0.7, 0.95);
        this.star(ctx, 100, 28, 17, '#ffe14d');
    },
    rail: function (ctx) {
        this.line(ctx, () => { ctx.moveTo(14, 96); ctx.lineTo(114, 56); }, '#c9d6e8', 12);
        this.line(ctx, () => { ctx.moveTo(40, 86); ctx.lineTo(40, 118); ctx.moveTo(90, 66); ctx.lineTo(90, 118); }, '#8fa3bd', 8);
        ['#ffe14d', '#ffa63d', '#ffe14d'].forEach((c, i) => { this.star(ctx, 42 + i * 26, 40 - (i % 2) * 14, 11 + (i % 2) * 3, c); });
    },
    vert: function (ctx) {
        const g = ctx.createLinearGradient(0, 20, 0, 116); g.addColorStop(0, '#6fd0ff'); g.addColorStop(1, '#3a7dff');
        this.shape(ctx, () => { ctx.moveTo(14, 112); ctx.quadraticCurveTo(92, 112, 96, 26); ctx.lineTo(114, 26); ctx.lineTo(114, 112); ctx.closePath(); }, g);
        this.arrow(ctx, 44, 44, '#ffe14d');
    },
    flag: function (ctx) {
        this.line(ctx, () => { ctx.moveTo(34, 16); ctx.lineTo(34, 114); }, '#d9e2ef', 8);
        this.shape(ctx, () => { ctx.moveTo(40, 20); ctx.lineTo(108, 40); ctx.lineTo(40, 64); ctx.closePath(); }, '#35d66b');
    },
    finish: function (ctx) {
        this.line(ctx, () => { ctx.moveTo(26, 14); ctx.lineTo(26, 116); }, '#d9e2ef', 8);
        ctx.fillStyle = this.OUTLINE; ctx.fillRect(28, 16, 84, 60);
        for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) { ctx.fillStyle = (x + y) % 2 ? '#222' : '#fff'; ctx.fillRect(33 + x * 19, 21 + y * 17, 19, 17); }
    },
    road: function (ctx) {
        this.shape(ctx, () => { ctx.moveTo(44, 16); ctx.lineTo(84, 16); ctx.lineTo(116, 112); ctx.lineTo(12, 112); ctx.closePath(); }, '#55607a');
        ctx.fillStyle = '#ffe14d'; [[61, 24, 6, 16], [60, 50, 8, 20], [59, 82, 10, 24]].forEach(r => ctx.fillRect(r[0], r[1], r[2], r[3]));
    },
    loop: function (ctx) {
        this.line(ctx, () => { ctx.arc(64, 60, 38, -2.3, 3.6); }, '#4db8ff', 15);
        this.shape(ctx, () => { ctx.moveTo(10, 42); ctx.lineTo(42, 30); ctx.lineTo(40, 66); ctx.closePath(); }, '#ffe14d', 7);
    },
    ring: function (ctx) {
        ctx.strokeStyle = this.OUTLINE; ctx.lineWidth = 28; ctx.beginPath(); ctx.ellipse(64, 64, 36, 44, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ffc93d'; ctx.lineWidth = 15; ctx.beginPath(); ctx.ellipse(64, 64, 36, 44, 0, 0, Math.PI * 2); ctx.stroke();
    },
    bolt: function (ctx) {
        this.shape(ctx, () => { ctx.moveTo(74, 10); ctx.lineTo(28, 72); ctx.lineTo(58, 72); ctx.lineTo(48, 118); ctx.lineTo(100, 52); ctx.lineTo(68, 52); ctx.closePath(); }, '#7dff5c', 10);
    },
    wipe: function (ctx) {
        this.star(ctx, 64, 64, 50, '#ff8a3d');
        ctx.strokeStyle = this.OUTLINE; ctx.lineWidth = 8;
        [[46, 56], [82, 56]].forEach(p => { ctx.beginPath(); ctx.moveTo(p[0] - 8, p[1] - 8); ctx.lineTo(p[0] + 8, p[1] + 8); ctx.moveTo(p[0] + 8, p[1] - 8); ctx.lineTo(p[0] - 8, p[1] + 8); ctx.stroke(); });
        ctx.beginPath(); ctx.arc(64, 90, 10, Math.PI, 0); ctx.stroke();
    },
    check: function (ctx) {
        this.line(ctx, () => { ctx.moveTo(24, 68); ctx.lineTo(52, 96); ctx.lineTo(104, 36); }, '#5ce65c', 16);
    },
    dot: function (ctx) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(64, 64, 62, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff3030'; ctx.beginPath(); ctx.arc(64, 64, 52, 0, Math.PI * 2); ctx.fill();
    },
    chestBase: function (ctx) {
        const g = ctx.createLinearGradient(0, 60, 0, 116); g.addColorStop(0, '#c9742f'); g.addColorStop(1, '#8a4a1c');
        this.shape(ctx, () => { ctx.moveTo(14, 62); ctx.lineTo(114, 62); ctx.lineTo(114, 114); ctx.lineTo(14, 114); ctx.closePath(); }, g, 9);
        ctx.fillStyle = '#ffd34d'; ctx.fillRect(14, 62, 100, 8); ctx.fillRect(28, 70, 8, 42); ctx.fillRect(92, 70, 8, 42);
    },
    chest: function (ctx) {
        this.chestBase(ctx);
        const g = ctx.createLinearGradient(0, 18, 0, 62); g.addColorStop(0, '#e08f3f'); g.addColorStop(1, '#a85f24');
        this.shape(ctx, () => { ctx.moveTo(14, 60); ctx.quadraticCurveTo(14, 20, 40, 20); ctx.lineTo(88, 20); ctx.quadraticCurveTo(114, 20, 114, 60); ctx.closePath(); }, g, 9);
        ctx.fillStyle = '#ffd34d'; ctx.fillRect(28, 22, 8, 38); ctx.fillRect(92, 22, 8, 38);
        this.shape(ctx, () => { ctx.moveTo(52, 50); ctx.lineTo(76, 50); ctx.lineTo(76, 78); ctx.lineTo(52, 78); ctx.closePath(); }, '#ffd34d', 7);
    },
    chestOpen: function (ctx) {
        // glow and coins inside, lid thrown back
        const g2 = ctx.createRadialGradient(64, 60, 4, 64, 60, 58); g2.addColorStop(0, 'rgba(255,240,150,0.95)'); g2.addColorStop(1, 'rgba(255,240,150,0)');
        ctx.fillStyle = g2; ctx.fillRect(0, 0, 128, 128);
        const g = ctx.createLinearGradient(0, 6, 0, 38); g.addColorStop(0, '#e08f3f'); g.addColorStop(1, '#a85f24');
        this.shape(ctx, () => { ctx.moveTo(20, 40); ctx.lineTo(30, 10); ctx.lineTo(98, 10); ctx.lineTo(108, 40); ctx.closePath(); }, g, 9);
        ctx.fillStyle = '#3a2412'; ctx.fillRect(18, 44, 92, 22);
        [[36, 56], [54, 50], [74, 52], [92, 58]].forEach(p => { ctx.fillStyle = this.OUTLINE; ctx.beginPath(); ctx.arc(p[0], p[1], 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffc93d'; ctx.beginPath(); ctx.arc(p[0], p[1], 8.5, 0, Math.PI * 2); ctx.fill(); });
        this.chestBase(ctx);
    }
};

// =================================================================================================
// Console helpers (same pattern as SkateboardObby_Debug): installed while the scene runs, old globals come back
// quests(): list. questAdd(kind, n): add progress (kind = login, time, ollie, trick, rail, vert, coins, cp, dist, wipe, ...).
// questAll(): finish every quest of both sets (claims stay to do).
// =================================================================================================
var SkateboardObby_QuestDebug = {
    names: ['quests', 'questAdd', 'questAll'],
    saved: null,
    script: null,

    install: function (script) {
        if (this.saved) this.uninstall();
        this.script = script;
        this.saved = {};
        for (let i = 0; i < this.names.length; i++) {
            const name = this.names[i];
            this.saved[name] = window[name];
            window[name] = this[name].bind(this);
        }
    },

    uninstall: function () {
        if (!this.saved) return;
        for (let i = 0; i < this.names.length; i++) {
            const name = this.names[i];
            if (this.saved[name] === undefined) delete window[name];
            else window[name] = this.saved[name];
        }
        this.saved = null;
        this.script = null;
    },

    quests: function () {
        const out = [];
        const s = this.script;
        ['daily', 'weekly'].forEach(n => {
            const set = s && s.sets[n];
            if (!set) return;
            out.push(n + ' period ' + set.period + ' chest ' + set.chest);
            set.quests.forEach(q => out.push('  ' + q.def.id + '  ' + Math.floor(q.p) + '/' + q.def.goal + (q.c ? '  claimed' : (q.done ? '  ready' : ''))));
        });
        console.log(out.join('\n'));
        return out;
    },

    questAdd: function (kind, n) {
        if (!this.script) return;
        this.script.add(kind, n === undefined ? 1 : n);
    },

    questAll: function () {
        const s = this.script;
        if (!s) return;
        for (const k in s.active) { while (s.active[k] && s.active[k].length) s.add(k, 1e7); }
    }
};
