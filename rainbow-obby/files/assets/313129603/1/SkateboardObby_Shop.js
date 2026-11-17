/*
 * SkateboardObby_Shop
 * Shop panel (copied from Monkey's EffectShop, coins instead of wins). The HUD Shop button or M opens it.
 * - Tabs: TRAIL (speed multiplier trails), AURA (cosmetic), SKIN (character skins, SkateboardObby_CharSkins) and SKATEBOARD (board models, SkateboardObby_BoardSkins).
 * - The lists come from SkateboardObby_Trail ("trails") and SkateboardObby_Aura ("auras"); rows are cloned from RowTemplate.
 * - priceType: "free" | "coins" | "ad". An ad item is always one rewarded ad (Poki). With Ad Chain, an ad item stays locked
 *   until the previous ad item of the same tab is owned.
 * - One trail + one aura at a time. Pressing the equipped one takes it off (UNEQUIP).
 * - Save: owned "SkateboardObby_TrailOwned" / "SkateboardObby_AuraOwned" (id lists), equipped "SkateboardObby_Trail" /
 *   "SkateboardObby_Aura" (written by their scripts). Old "SkateboardObby_TrailAdProgress": 1+ ads watched = owned, then emptied.
 * - Boss items (item.boss, priceType 'vip'): first row of SKIN and SKATEBOARD, gold / purple. No VIP: a VIP button that opens the VIP panel over the Shop. VIP on: EQUIP / EQUIPPED.
 * - A coin item the player cannot afford opens the ad offer (SkateboardObby_ShopOffer) from its button or its row.
 * - Scroll follows CLAUDE.md 2.4 (beginDrag / moveDrag / endDrag, finger identifier, TOUCHCANCEL, clamp, isFinite).
 * Console: coins(n), trail(id), trailList(), aura(id), auraList().
 */
var SkateboardObbyShop = pc.createScript('skateboardObbyShop');

SkateboardObbyShop.attributes.add('panel', { type: 'entity' });
SkateboardObbyShop.attributes.add('panelBody', { type: 'entity' });
SkateboardObbyShop.attributes.add('openButton', { type: 'entity', description: 'HUD Shop button' });
SkateboardObbyShop.attributes.add('closeButton', { type: 'entity' });
SkateboardObbyShop.attributes.add('tabTrail', { type: 'entity' });
SkateboardObbyShop.attributes.add('tabAura', { type: 'entity' });
SkateboardObbyShop.attributes.add('tabSkin', { type: 'entity' });
SkateboardObbyShop.attributes.add('tabBoard', { type: 'entity', title: 'Tab Skateboard' });
SkateboardObbyShop.attributes.add('list', { type: 'entity', description: 'Masked list area' });
SkateboardObbyShop.attributes.add('content', { type: 'entity', description: 'Scrolling content (child of list)' });
SkateboardObbyShop.attributes.add('rowTemplate', { type: 'entity' });
SkateboardObbyShop.attributes.add('scrollHandle', { type: 'entity', description: 'Optional scroll bar handle' });
SkateboardObbyShop.attributes.add('coinsText', { type: 'entity' });
SkateboardObbyShop.attributes.add('infoText', { type: 'entity', description: 'Speed xN' });
SkateboardObbyShop.attributes.add('messageText', { type: 'entity' });
SkateboardObbyShop.attributes.add('comingSoonText', { type: 'entity', description: 'Shown on the empty tabs' });

SkateboardObbyShop.attributes.add('rowHeight', { type: 'number', default: 112 });
SkateboardObbyShop.attributes.add('rowSpacing', { type: 'number', default: 12 });
SkateboardObbyShop.attributes.add('listPadding', { type: 'number', default: 10, description: 'Top / bottom padding of the list' });
SkateboardObbyShop.attributes.add('fitHeight', { type: 'number', default: 820, title: 'Fit Height' });
SkateboardObbyShop.attributes.add('fitMargin', { type: 'number', default: 0.94, title: 'Fit Margin' });
SkateboardObbyShop.attributes.add('adChain', { type: 'boolean', default: true, title: 'Ad Chain', description: 'An ad item stays locked until the previous ad item of the same tab is owned' });

SkateboardObbyShop.attributes.add('coinIcon', { type: 'asset', assetType: 'texture' });
SkateboardObbyShop.attributes.add('adIcon', { type: 'asset', assetType: 'texture' });
SkateboardObbyShop.attributes.add('lockIcon', { type: 'asset', assetType: 'texture', description: 'On the button of an ad item locked by the chain' });
SkateboardObbyShop.attributes.add('spriteTabOn', { type: 'asset', assetType: 'sprite' });
SkateboardObbyShop.attributes.add('spriteTabOff', { type: 'asset', assetType: 'sprite' });
SkateboardObbyShop.attributes.add('spriteBuy', { type: 'asset', assetType: 'sprite', description: 'Buy with coins (green)' });
SkateboardObbyShop.attributes.add('spriteLocked', { type: 'asset', assetType: 'sprite', description: 'Not enough coins (grey)' });
SkateboardObbyShop.attributes.add('spriteAd', { type: 'asset', assetType: 'sprite', description: 'Rewarded ad (purple)' });
SkateboardObbyShop.attributes.add('spriteEquip', { type: 'asset', assetType: 'sprite', description: 'Equip (blue)' });
SkateboardObbyShop.attributes.add('spriteUnequip', { type: 'asset', assetType: 'sprite', description: 'Unequip (yellow)' });
SkateboardObbyShop.attributes.add('rowSprites', {
    type: 'json', title: 'Row Sprites', schema: [
        { name: 'red', type: 'asset', assetType: 'sprite' },
        { name: 'blue', type: 'asset', assetType: 'sprite' },
        { name: 'green', type: 'asset', assetType: 'sprite' },
        { name: 'yellow', type: 'asset', assetType: 'sprite' },
        { name: 'purple', type: 'asset', assetType: 'sprite' }
    ]
});

SkateboardObbyShop.KEY_OWNED = 'SkateboardObby_TrailOwned';
SkateboardObbyShop.KEY_AURA_OWNED = 'SkateboardObby_AuraOwned';
SkateboardObbyShop.KEY_ADS = 'SkateboardObby_TrailAdProgress';

SkateboardObbyShop.prototype.initialize = function () {
    this.app.skateShop = this;
    this.panelOpen = false;
    this.tab = 'trail';
    this.rows = [];
    this.scrollY = 0;
    this.scrollTarget = 0;
    this.scrollMax = 0;
    this.drag = null;
    this.dragMoved = false;
    this.messageTimer = 0;
    this.iconCache = {};
    this._refreshedCoins = -1;
    this.fitScale = 1;

    this.loadSave();

    if (this.rowTemplate) this.rowTemplate.enabled = false;
    if (this.panel) this.panel.enabled = false;
    if (this.messageText) this.messageText.enabled = false;
    if (this.comingSoonText) this.comingSoonText.enabled = false;

    const _click = (e, fn) => { if (e && e.button) e.button.on('click', fn, this); };
    _click(this.openButton, () => this.setPanelVisible(!this.panelOpen));
    _click(this.closeButton, () => this.setPanelVisible(false));
    _click(this.tabTrail, () => this.setTab('trail'));
    _click(this.tabAura, () => this.setTab('aura'));
    _click(this.tabSkin, () => this.setTab('skin'));
    _click(this.tabBoard, () => this.setTab('board'));

    this.setupScroll();
    this.preloadUi();

    this.app.on('MarketClose', this.onMarketClose, this);
    this.app.on('skate:coins', this.onCoins, this);
    this.app.on('Vip:Changed', this.onVipChanged, this);
    this.app.graphicsDevice.on('resizecanvas', this.onResize, this);
    this.on('destroy', this.onDestroy, this);

    SkateboardObby_ShopDebug.install(this.app);
};

SkateboardObbyShop.prototype.postInitialize = function () {
    // every manager has initialized now (the aura manager may come after this entity)
    this.loadSave();
    this.setupTabIcons();
    // an equipped item that is not owned (old save / removed item) comes off
    ['trail', 'aura'].forEach(t => {
        const m = this.manager(t);
        if (m && m.equipped && !this.owned[t][m.equipped]) m.equip(null);
    });
};

SkateboardObbyShop.prototype.onDestroy = function () {
    this.app.off('MarketClose', this.onMarketClose, this);
    this.app.off('skate:coins', this.onCoins, this);
    this.app.off('Vip:Changed', this.onVipChanged, this);
    this.app.graphicsDevice.off('resizecanvas', this.onResize, this);
    if (this.app.mouse) this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onWheel, this);
    this.endDrag();
    if (this.panelOpen) { this.app.isMarketEnabled = false; this.panelOpen = false; }
    for (const k in this.iconCache) { if (this.iconCache[k]) this.iconCache[k].destroy(); }
    this.iconCache = {};
    SkateboardObby_ShopDebug.uninstall();
    if (this.app.skateShop === this) this.app.skateShop = null;
};

// UI textures / fonts of the panel are not in the menu preload: start loading them now (small), so the panel
// does not show plain rectangles on its first opening
SkateboardObbyShop.prototype.preloadUi = function () {
    const ids = {};
    const add = (a) => { const as = (typeof a === 'number') ? this.app.assets.get(a) : a; if (as && !as.loaded) ids[as.id] = as; };
    [this.coinIcon, this.adIcon, this.lockIcon, this.spriteTabOn, this.spriteTabOff, this.spriteBuy, this.spriteLocked, this.spriteAd, this.spriteEquip, this.spriteUnequip].forEach(add);
    if (this.rowSprites) for (const k in this.rowSprites) add(this.rowSprites[k]);
    if (this.panel) {
        this.panel.findComponents('element').forEach(el => {
            if (el.textureAsset) add(el.textureAsset);
            if (el.spriteAsset) add(el.spriteAsset);
            if (el.fontAsset) add(el.fontAsset);
        });
    }
    for (const k in ids) this.app.assets.load(ids[k]);
};

// --- save --------------------------------------------------------------------------------

SkateboardObbyShop.prototype.loadSave = function () {
    const _read = (k, def) => { try { return JSON.parse(SkateboardObby_Utils.getItem(k) || 'null') || def; } catch (e) { return def; } };
    const _boards = this.manager('board'), _skins = this.manager('skin');
    this.owned = { trail: {}, aura: {}, board: _boards ? _boards.owned : {}, skin: _skins ? _skins.owned : {} };
    const _load = (t, key) => {
        const list = _read(key, []);
        if (Array.isArray(list)) list.forEach(id => { if (typeof id === 'string') this.owned[t][id] = true; });
        this.items(t).forEach(it => { if (it.priceType === 'free') this.owned[t][it.id] = true; });
    };
    _load('trail', SkateboardObbyShop.KEY_OWNED);
    _load('aura', SkateboardObbyShop.KEY_AURA_OWNED);

    // Poki: every reward is one ad. Old progress (1/2): at least 1 ad watched = earned, the record is emptied (once)
    const _old = _read(SkateboardObbyShop.KEY_ADS, {});
    if (_old && typeof _old === 'object' && !Array.isArray(_old) && Object.keys(_old).length) {
        const tr = this.manager('trail');
        Object.keys(_old).forEach(id => {
            const it = tr && tr.find(id);
            if (it && it.priceType === 'ad' && (+_old[id] || 0) >= 1) this.owned.trail[id] = true;
        });
        this.save();
    }
};

// Chain: returns the ad item that locks this one (null = not locked). An owned item is never locked.
SkateboardObbyShop.prototype.adLockedBy = function (_type, _item) {
    if (!this.adChain || _item.priceType !== 'ad' || this.owned[_type][_item.id]) return null;
    const _list = this.items(_type);
    let _prev = null;
    for (let i = 0; i < _list.length; i++) {
        if (_list[i] === _item) break;
        if (_list[i].priceType === 'ad') _prev = _list[i];
    }
    return _prev && !this.owned[_type][_prev.id] ? _prev : null;
};

SkateboardObbyShop.prototype.save = function () {
    SkateboardObby_Utils.setItem(SkateboardObbyShop.KEY_OWNED, JSON.stringify(Object.keys(this.owned.trail).filter(k => this.owned.trail[k])));
    SkateboardObby_Utils.setItem(SkateboardObbyShop.KEY_AURA_OWNED, JSON.stringify(Object.keys(this.owned.aura).filter(k => this.owned.aura[k])));
    SkateboardObby_Utils.setItem(SkateboardObbyShop.KEY_ADS, '{}');
    const _boards = this.manager('board');
    if (_boards) _boards.save();
    const _skins = this.manager('skin');
    if (_skins) _skins.save();
};

// the script behind a tab: find(id), equip(id), equipped (null = nothing to sell yet)
SkateboardObbyShop.prototype.manager = function (_type) {
    if (_type === 'trail') return this.app.skateTrail || null;
    if (_type === 'aura') return this.app.skateAura || null;
    if (_type === 'board') return this.app.skateBoards || null;
    if (_type === 'skin') return this.app.skateCharSkins || null;
    return null;
};

SkateboardObbyShop.prototype.items = function (_type) {
    const m = this.manager(_type);
    if (!m) return [];
    if (_type === 'board' || _type === 'skin') return m.items || [];
    return (_type === 'aura' ? m.auras : m.trails) || [];
};

SkateboardObbyShop.prototype.equippedId = function (_type) {
    const m = this.manager(_type);
    return m ? m.equipped : null;
};

SkateboardObbyShop.prototype.getCoins = function () {
    return this.app.skateCoins ? this.app.skateCoins.get() : 0;
};

SkateboardObbyShop.prototype.getSpeedMultiplier = function () {
    const tr = this.manager('trail'), bd = this.manager('board');
    return (tr ? tr.getMultiplier() : 1) * (bd ? bd.getSpeedMultiplier() : 1);
};

// --- list ----------------------------------------------------------------------------------

SkateboardObbyShop.prototype.setTab = function (_tab) {
    if (this.tab === _tab && this._builtTab === _tab) return;
    this.tab = _tab;
    this.buildRows();
    this.setScroll(0, true);
    this.refreshTabs();
};

SkateboardObbyShop.prototype.refreshTabs = function () {
    [[this.tabTrail, 'trail'], [this.tabAura, 'aura'], [this.tabSkin, 'skin'], [this.tabBoard, 'board']].forEach(([e, t]) => {
        if (!e || !e.element) return;
        const _on = this.tab === t;
        const _s = _on ? this.spriteTabOn : this.spriteTabOff;
        if (_s) e.element.spriteAsset = _s;
        // the selected tab sticks to the frame, the others move in a bit
        if (e._baseX === undefined) e._baseX = e.getLocalPosition().x;
        const p = e.getLocalPosition();
        e.setLocalPosition(e._baseX + (_on ? 0 : 12), p.y, p.z);
        const _txt = e.findByName('Text');
        if (_txt && _txt.element) _txt.element.color = _on ? new pc.Color(1, 1, 1) : new pc.Color(0.85, 0.92, 1);
    });
};

// The button moves to a still, invisible sibling, so the visual can wiggle while the touch area stays put.
SkateboardObbyShop.prototype.splitButtonHit = function (_visual) {
    const el = _visual.element, b = _visual.button;
    const hit = new pc.Entity('ActionHit');
    hit.addComponent('element', { type: 'group', anchor: el.anchor.clone(), pivot: el.pivot.clone(), width: el.width, height: el.height, useInput: true });
    hit.addComponent('button', {
        imageEntity: _visual, transitionMode: b.transitionMode, hitPadding: b.hitPadding.clone(),
        hoverTint: b.hoverTint.clone(), pressedTint: b.pressedTint.clone(), inactiveTint: b.inactiveTint.clone(), fadeDuration: b.fadeDuration
    });
    _visual.parent.insertChild(hit, _visual.parent.children.indexOf(_visual) + 1);
    const p = _visual.getLocalPosition();
    hit.setLocalPosition(p.x, p.y, p.z);
    _visual.removeComponent('button');
    el.useInput = false;
    return hit;
};

SkateboardObbyShop.prototype.buildRows = function () {
    this.rows.forEach(r => r.entity.destroy());
    this.rows = [];
    this._rowQueue = null;
    this._builtTab = this.tab;
    if (!this.content || !this.rowTemplate) return;

    // SKIN / SKATEBOARD: nothing to sell yet
    const _type = this.tab;
    const _items = this.items(_type);
    if (this.comingSoonText) this.comingSoonText.enabled = !_items.length;

    const _h = this.rowHeight, _sp = this.rowSpacing;
    const _make = (it, i) => {
        const e = this.rowTemplate.clone();
        e.name = 'Row_' + it.id;
        this.content.addChild(e);
        e.enabled = true;
        e.setLocalPosition(0, -(_h / 2) - i * (_h + _sp), 0);

        const r = {
            item: it, type: _type, entity: e,
            icon: e.findByName('Icon'),
            name: e.findByName('NameText'),
            mult: e.findByName('MultText'),
            button: e.findByName('ActionButton'),
            btnIcon: e.findByName('ActionIcon'),
            btnText: e.findByName('ActionText'),
            badge: e.findByName('EquippedBadge')
        };
        if (r.name) r.name.element.text = it.name;
        if (r.mult) {
            r.multText = _type === 'aura' ? 'Cosmetic' : (_type === 'skin' ? it.tier : (_type === 'board' ? this.boardRowText(it) : 'x' + this.fmtMult(it.mult) + ' Speed'));
            r.multColor = r.mult.element.color.clone();
            r.multSize = r.mult.element.fontSize;
            r.mult.element.text = r.multText;
        }
        if (r.icon) {
            this.setIconElement(r.icon.element, _type, it);
            if (_type === 'board' || _type === 'skin') {
                // the atlas cells are tight: a bit larger than the template, inside the row
                r.icon.setLocalScale(1.2, 1.2, 1);
                const _ip = r.icon.getLocalPosition();
                r.icon.setLocalPosition(_ip.x, 6, _ip.z);
            }
        }
        const _rs = this.rowSprites && this.rowSprites[it.rowColor];
        if (_rs && e.element) e.element.spriteAsset = _rs;

        if (r.button && r.button.button) {
            r.hit = this.splitButtonHit(r.button);
            r.hit.button.on('click', () => { if (!this.dragMoved) this.onRowAction(r); }, this);
            r.hit.button.on('hoverstart', () => r.button.tween(r.button.getLocalScale()).to(new pc.Vec3(1.06, 1.06, 1), 0.08, pc.SineOut).start());
            r.hit.button.on('hoverend', () => r.button.tween(r.button.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.08, pc.SineOut).start());
        }
        if (it.boss) this.decorateBossRow(r);
        if (it.boss && e.element) {
            // the rest of the row opens the VIP panel too; the drag still bubbles to the list
            e.element.useInput = true;
            e.element.on('click', (evt) => {
                if (this.dragMoved || (evt && evt.element && evt.element !== e.element)) return;
                if (!this.isOwnedNow(r.type, r.item)) this.openVip();
            }, this);
        }
        if (it.priceType === 'coins' && e.element) {
            // the rest of the row opens the ad offer too; the drag still bubbles to the list
            e.element.useInput = true;
            e.element.on('click', (evt) => {
                if (this.dragMoved || (evt && evt.element && evt.element !== e.element)) return;
                const o = this.app.skateShopOffer;
                if (o && o.open(r.type, r.item)) return;
                if (!this.owned[r.type][r.item.id] && this.getCoins() < r.item.price) this.notEnoughCoins(r);
            }, this);
        }
        this.rows.push(r);
    };
    // A long list (SKATEBOARD) fills over a few frames so the panel opens without a hitch: only the first rows can be seen at first.
    const _first = Math.min(_items.length, 8);
    for (let i = 0; i < _first; i++) _make(_items[i], i);
    if (_first < _items.length) this._rowQueue = { make: _make, items: _items, next: _first };

    const _total = _items.length * _h + Math.max(0, _items.length - 1) * _sp;
    const _view = this.list && this.list.element ? this.list.element.height : _total;
    this.scrollMax = Math.max(0, _total + 2 * this.listPadding - _view);
    if (!Number.isFinite(this.scrollMax)) this.scrollMax = 0;
    this.refresh();
};

// A boss item counts as owned only while VIP is on, it is never saved
SkateboardObbyShop.prototype.isOwnedNow = function (_type, _item) {
    if (!_item.boss) return !!this.owned[_type][_item.id];
    return SkateboardObby_Boss.vipActive(this.app);
};

// Gold frame + BOSS tag over the purple row. One shared frame texture, drawn at the row's own size.
SkateboardObbyShop.prototype.decorateBossRow = function (r) {
    const e = r.entity, w = e.element.width, h = e.element.height;
    if (!this.iconCache['boss:frame']) this.iconCache['boss:frame'] = SkateboardObby_ShopArt.toTexture(this.app, SkateboardObby_ShopArt.bossRowFrame(w, h));
    if (!this.iconCache['boss:tag']) this.iconCache['boss:tag'] = SkateboardObby_ShopArt.toTexture(this.app, SkateboardObby_ShopArt.bossTag());

    const frame = new pc.Entity('BossFrame');
    frame.addComponent('element', { type: 'image', anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5), pivot: new pc.Vec2(0.5, 0.5), width: w, height: h, useInput: false });
    frame.element.texture = this.iconCache['boss:frame'];
    e.insertChild(frame, 0);

    const tag = new pc.Entity('BossTag');
    tag.addComponent('element', { type: 'image', anchor: new pc.Vec4(0, 0.5, 0, 0.5), pivot: new pc.Vec2(0, 0.5), width: 76, height: 32, useInput: false });
    tag.element.texture = this.iconCache['boss:tag'];
    if (r.name) {

        // on the name line, just left of the button: the longest boss name still fits
        tag.setLocalPosition(w * 0.645 - 76, r.name.getLocalPosition().y, 0);
    }
    e.addChild(tag);
};

// Over the Shop: the VIP panel closes back to this same list, scroll kept. Not while an ad runs.
SkateboardObbyShop.prototype.openVip = function () {
    const v = this.app.vipManager;
    if (!v || this.app.isWatchingAd) return;
    this.endDrag();
    this.app.fire('skate:boardEvent', 'boss-item', 'interact');
    v.openFromShop();
};

SkateboardObbyShop.prototype.onVipChanged = function () {
    if (this.panelOpen) this.refresh();
};

// 'Common  +1% Speed'; a board without a bonus shows only its tier
SkateboardObbyShop.prototype.boardRowText = function (_item) {
    const m = this.manager('board'), l = m ? m.speedLabel(_item) : '';
    return l ? _item.tier + '  ' + l : _item.tier;
};

SkateboardObbyShop.prototype.refresh = function () {
    const _coins = this.getCoins();
    this._refreshedCoins = _coins;
    const _white = new pc.Color(1, 1, 1, 1);
    const _red = new pc.Color(1, 0.55, 0.5, 1);
    if (this.coinsText && this.coinsText.element) this.coinsText.element.text = this.fmt(_coins);

    this.rows.forEach(r => {
        const it = r.item, t = r.type;
        const _owned = this.isOwnedNow(t, it);
        const _equipped = _owned && this.equippedId(t) === it.id;
        let _sprite = this.spriteEquip, _icon = null, _text = 'EQUIP', _color = _white, _lockBy = null;

        if (_equipped) {
            _sprite = this.spriteUnequip; _text = (t === 'board' || t === 'skin') ? 'EQUIPPED' : 'UNEQUIP';
        } else if (_owned) {
            _sprite = this.spriteEquip; _text = 'EQUIP';
        } else if (it.boss) {
            _sprite = (this.rowSprites && this.rowSprites.yellow) || this.spriteBuy; _text = 'VIP'; _color = this._bossText || (this._bossText = new pc.Color(0.2, 0.08, 0.36, 1)); _icon = this.vipIconAsset();
        } else if (it.priceType === 'coins') {
            const _can = _coins >= it.price;
            _sprite = _can ? this.spriteBuy : (this.spriteLocked || this.spriteBuy);
            _icon = this.coinIcon; _text = this.fmt(it.price);
            _color = _can ? _white : _red;
        } else if (it.priceType === 'ad') {
            _lockBy = this.adLockedBy(t, it);
            if (_lockBy) {
                _sprite = this.spriteLocked || this.spriteAd; _icon = this.lockIcon || null; _text = 'LOCKED';
            } else {
                _sprite = this.spriteAd; _icon = this.adIcon; _text = 'FREE';
            }
        } else {
            _text = 'FREE';
        }

        // locked row: "Unlock X first" instead of the second line
        if (r.mult) {
            const _mt = _lockBy ? 'Unlock ' + _lockBy.name + ' first' : r.multText;
            if (r.mult.element.text !== _mt) {
                r.mult.element.text = _mt;
                r.mult.element.color = _lockBy ? this._lockColor || (this._lockColor = new pc.Color(1, 0.75, 0.3, 1)) : r.multColor;
                r.mult.element.fontSize = _lockBy && _mt.length > 18 ? Math.round(r.multSize * 0.8) : r.multSize;
            }
        }
        if (r.button && r.button.element && _sprite) r.button.element.spriteAsset = _sprite;
        if (r.btnIcon) { r.btnIcon.enabled = !!_icon; if (_icon) r.btnIcon.element.textureAsset = _icon; }
        if (r.btnText) {
            r.btnText.element.text = _text;
            r.btnText.element.color = _color;
            r.btnText.element.fontSize = _text === 'VIP' ? 44 : (_text.length > 7 ? 28 : 34);
            r.btnText.setLocalPosition(_icon ? 24 : 0, 0, 0);
        }
        if (r.badge) r.badge.enabled = _equipped;
    });

    if (this.infoText && this.infoText.element) this.infoText.element.text = 'Speed x' + this.fmtMult(this.getSpeedMultiplier());
};

// The crown of the HUD VIP button
SkateboardObbyShop.prototype.vipIconAsset = function () {
    if (this._vipIcon !== undefined) return this._vipIcon;
    this._vipIcon = null;
    const v = this.app.vipManager, b = v && v.openButton;
    if (b) {
        const els = b.findComponents('element');
        for (let i = 0; i < els.length; i++) {
            if (els[i].entity !== b && els[i].type === 'image' && els[i].textureAsset) { this._vipIcon = els[i].textureAsset; break; }
        }
    }
    return this._vipIcon;
};

SkateboardObbyShop.prototype.onRowAction = function (r) {
    const it = r.item, t = r.type;
    if (it.boss) {
        if (!this.isOwnedNow(t, it)) this.openVip();
        else if (this.equippedId(t) !== it.id) this.equip(t, it);
        return;
    }
    if (this.owned[t][it.id]) {
        if (this.equippedId(t) === it.id) { if (t !== 'board' && t !== 'skin') this.unequip(t); }   // a board or a skin is changed, never taken off
        else this.equip(t, it);
        return;
    }
    if (it.priceType === 'coins') {
        const cm = this.app.skateCoins;
        if (!cm || !cm.spend(it.price)) {
            if (cm && this.app.skateShopOffer && this.app.skateShopOffer.open(t, it)) return;
            this.notEnoughCoins(r);
            return;
        }
        this.unlock(t, it);
        return;
    }
    if (it.priceType === 'ad') {
        const _lockBy = this.adLockedBy(t, it);
        if (_lockBy) {
            this.warn('Unlock ' + _lockBy.name + ' first!', new pc.Color(1, 0.6, 0.2, 1));
            this.punch(r.button || r.entity);
            this.sfx('warning');
            return;
        }
        if (!this.app.adRewarder) { this.warn('Ads are not available right now.', new pc.Color(1, 0.6, 0.2, 1)); return; }
        // one ad; if it is cancelled or fails, watchRewarded does not call back and nothing is given
        this.app.adRewarder.watchAd(() => {
            if (this.owned[t][it.id]) return;
            this.unlock(t, it);
        });
        return;
    }
    this.unlock(t, it); // free
};

SkateboardObbyShop.prototype.unlock = function (_type, _item) {
    this.owned[_type][_item.id] = true;
    this.save();
    this.app.fire('skate:shopChanged');
    if (_type === 'board') this.app.fire('skate:boardEvent', 'board-shop', this._unlockVia || 'coins');
    if (_type === 'skin') this.app.fire('skate:boardEvent', 'skin-shop', this._unlockVia || 'coins');
    this._unlockVia = null;
    this.equip(_type, _item, true);
};

SkateboardObbyShop.prototype.equip = function (_type, _item, _isNew) {
    const m = this.manager(_type);
    if (!m) return;
    m.equip(_item.id);
    this.refresh();
    const _what = _type === 'trail' ? ' Speed x' + this.fmtMult(_item.mult) : (_type === 'board' && m.speedLabel(_item) ? ' ' + m.speedLabel(_item) : '');
    this.warn(_item.name + (_isNew ? ' unlocked!' : ' equipped!') + _what, new pc.Color(0.3, 1, 0.45, 1));
    if (_isNew) this.sfx('purchase');
};

SkateboardObbyShop.prototype.unequip = function (_type) {
    const m = this.manager(_type);
    if (!m) return;
    const it = m.find(m.equipped);
    m.equip(null);
    this.refresh();
    if (it) this.warn(it.name + ' removed.', new pc.Color(1, 0.85, 0.3, 1));
};

SkateboardObbyShop.prototype.onCoins = function () {
    // prices turn red / white when the balance changes (only on change, not every frame)
    if (this.panelOpen && this.getCoins() !== this._refreshedCoins) this.refresh();
};

// --- panel ----------------------------------------------------------------------------------

SkateboardObbyShop.prototype.canOpen = function () {
    const a = this.app;
    const _pc = a.skateboardObbyPlayerController;
    return !a.isWatchingAd && !(_pc && _pc.isDied) && !a.menuPanelEnabled && !a.deadMenuEnabled && !a.isPopupEnabled && !(a.numpad && a.numpad.enabled) && !a.inCutscene && !a.isMarketEnabled;
};

SkateboardObbyShop.prototype.setPanelVisible = function (_visible) {
    if (_visible == this.panelOpen || !this.panel) return;
    if (_visible && !this.canOpen()) return;
    this.panelOpen = _visible;

    if (_visible) {
        this.app.isMarketEnabled = true;
        this.loadSave();
        this.panel.enabled = true;
        this.rows.length = 0;
        if (this.content) this.content.children.slice().forEach(c => { if (c !== this.rowTemplate) c.destroy(); });
        this._builtTab = null;
        this.endDrag();
        this.buildRows();
        this.refreshTabs();
        this.setScroll(0, true);
        if (this.panelBody) {
            const _f = this.computeFit();
            this.fitBoardLabel();
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
        if (this.app.skateShopOffer) this.app.skateShopOffer.close(true);
        const _vip = this.app.vipManager;
        if (_vip && _vip.fromShop) _vip.setPanelVisible(false);
        this.app.isMarketEnabled = false;
        this.endDrag();
        this.messageTimer = 0;
        if (this.messageText) this.messageText.enabled = false;
        const _f = this.fitScale || 1;
        const _done = () => { if (this.panelOpen) return; /* opened again while closing */ this.panel.enabled = false; if (this.panelBody) this.panelBody.setLocalScale(_f, _f, _f); };
        if (this.panelBody) this.panelBody.tween(this.panelBody.getLocalScale()).to(new pc.Vec3(0.6 * _f, 0.6 * _f, 0.6 * _f), 0.12, pc.BackIn).onComplete(_done).start();
        else _done();
    }

    this.app.fire('lockCamera', _visible);
    const nm = this.app.skateboardObbyNetworkManager;
    if (nm && nm.setBlackBG) nm.setBlackBG(_visible);
};

SkateboardObbyShop.prototype.computeFit = function () {
    let _f = 1;
    const _screen = this.panel && this.panel.element && this.panel.element.screen && this.panel.element.screen.screen;
    if (_screen && _screen.scale > 0) {
        const _h = _screen.resolution.y / _screen.scale;
        const _w = _screen.resolution.x / _screen.scale;
        _f = Math.min(1, (_h * this.fitMargin) / Math.max(1, this.fitHeight), (_w * 0.96) / 960);
    }
    this.fitScale = _f;
    return _f;
};

SkateboardObbyShop.prototype.fitBoardLabel = function () {
    const t = this.tabBoard && this.tabBoard.findByName('Text');
    if (!t || !t.element) return;
    // same size as TRAIL / AURA / SKIN on every screen: SKATEBOARD did not fit a tab at this size
    t.element.text = 'BOARDS';
    t.element.width = 120;
    t.element.maxFontSize = t.element.fontSize = 28;
};

SkateboardObbyShop.prototype.onResize = function () {
    if (!this.panelOpen || !this.panelBody) return;
    setTimeout(() => { const _f = this.computeFit(); this.panelBody.setLocalScale(_f, _f, _f); this.fitBoardLabel(); }, 0);
};

SkateboardObbyShop.prototype.onMarketClose = function () {
    if (this.panelOpen) this.setPanelVisible(false);
};

SkateboardObbyShop.prototype.update = function (dt) {
    if (this._rowQueue && this.panelOpen) {
        const q = this._rowQueue;
        for (let n = 0; n < 3 && q.next < q.items.length; n++, q.next++) q.make(q.items[q.next], q.next);
        if (q.next >= q.items.length) {
            this._rowQueue = null;
            this.refresh();
            this.app.fire('skate:shopChanged');   // the offer script reads the finished list
        }
    }
    if (this.messageTimer > 0) {
        this.messageTimer -= dt;
        if (this.messageTimer <= 0 && this.messageText) this.messageText.enabled = false;
    }
    if (this.panelOpen && Math.abs(this.scrollTarget - this.scrollY) > 0.5) {
        this.applyScroll(pc.math.lerp(this.scrollY, this.scrollTarget, Math.min(1, dt * 14)));
    } else if (this.panelOpen && this.scrollTarget !== this.scrollY) {
        this.applyScroll(this.scrollTarget);
    }
    const kb = this.app.keyboard;
    const _offer = this.app.skateShopOffer;
    const _vip = this.app.vipManager;
    if (kb && _vip && _vip.fromShop) {
        if (kb.wasPressed(pc.KEY_ESCAPE)) _vip.setPanelVisible(false);
    } else if (kb && _offer && _offer.isOpen) {
        if (kb.wasPressed(pc.KEY_ESCAPE)) _offer.close();
    } else if (kb) {
        if (this.panelOpen && kb.wasPressed(pc.KEY_ESCAPE)) this.setPanelVisible(false);
        else if (kb.wasPressed(pc.KEY_M) && !this.app.isTypingEnabled) this.setPanelVisible(!this.panelOpen);
    }
};

// --- scrolling (CLAUDE.md 2.4, same as MonkeyObby_EffectShop) -----------------------------------

SkateboardObbyShop.prototype.setupScroll = function () {
    if (this.app.mouse) this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onWheel, this);
    if (!this.list || !this.list.element) return;
    this.list.element.useInput = true;
    this.list.element.on('mousedown', (e) => this.beginDrag(e.y), this);
    // Mobile: ElementTouchEvent.changedTouches are the browser's Touch objects (no x / y, only clientX / clientY),
    // so the start comes from e.y (canvas coordinate) and the same finger (identifier) is followed.
    this.list.element.on('touchstart', (e) => {
        if (this.drag) return;
        const _id = e.touch ? e.touch.identifier : null;
        this.beginDrag(e.y, _id);
    }, this);
    this._onMove = (e) => { if (this.drag && this.drag.touchId == null) this.moveDrag(e.y); };
    this._onUp = () => this.endDrag();
    // app.touch events carry pc.Touch objects (id, x, y)
    this._onTouchMove = (e) => {
        if (!this.drag) return;
        const _list = e.changedTouches || [];
        for (let i = 0; i < _list.length; i++) {
            const t = _list[i];
            if (this.drag.touchId == null || t.id === this.drag.touchId) { this.moveDrag(t.y); return; }
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

SkateboardObbyShop.prototype.screenScale = function () {
    const s = this.panel && this.panel.element && this.panel.element.screen && this.panel.element.screen.screen;
    return (s && s.scale > 0 ? s.scale : 1) * (this.fitScale || 1);
};

SkateboardObbyShop.prototype.beginDrag = function (_y, _touchId) {
    if (!this.panelOpen || this.scrollMax <= 0 || !Number.isFinite(_y)) return;
    this.drag = { y: _y, start: Number.isFinite(this.scrollY) ? this.scrollY : 0, touchId: (_touchId == null ? null : _touchId) };
    this.dragMoved = false;
    if (this.app.mouse) { this.app.mouse.on(pc.EVENT_MOUSEMOVE, this._onMove, this); this.app.mouse.on(pc.EVENT_MOUSEUP, this._onUp, this); }
    if (this.app.touch) { this.app.touch.on(pc.EVENT_TOUCHMOVE, this._onTouchMove, this); this.app.touch.on(pc.EVENT_TOUCHEND, this._onTouchEnd, this); this.app.touch.on(pc.EVENT_TOUCHCANCEL, this._onTouchEnd, this); }
};

SkateboardObbyShop.prototype.moveDrag = function (_y) {
    // finger / mouse up -> the list moves up (lower rows come in)
    if (!this.drag || !Number.isFinite(_y)) return;
    const _d = (_y - this.drag.y) / this.screenScale();
    if (Math.abs(_d) > 8) this.dragMoved = true;
    this.setScroll(this.drag.start - _d, true);
};

SkateboardObbyShop.prototype.endDrag = function () {
    if (!this.drag) return;
    this.drag = null;
    if (this.app.mouse) { this.app.mouse.off(pc.EVENT_MOUSEMOVE, this._onMove, this); this.app.mouse.off(pc.EVENT_MOUSEUP, this._onUp, this); }
    if (this.app.touch) { this.app.touch.off(pc.EVENT_TOUCHMOVE, this._onTouchMove, this); this.app.touch.off(pc.EVENT_TOUCHEND, this._onTouchEnd, this); this.app.touch.off(pc.EVENT_TOUCHCANCEL, this._onTouchEnd, this); }
    // a click right after a drag is ignored
    setTimeout(() => { this.dragMoved = false; }, 0);
};

SkateboardObbyShop.prototype.onWheel = function (e) {
    if (!this.panelOpen || (this.app.skateShopOffer && this.app.skateShopOffer.isOpen)) return;
    // wheel down -> lower rows come in, one row per tick
    const _step = this.rowHeight + this.rowSpacing;
    const _base = Math.round(this.scrollTarget / _step) * _step;
    this.setScroll(_base + (e.wheelDelta > 0 ? 1 : -1) * _step); // pc: wheelDelta > 0 = wheel down
    if (e.event) e.event.preventDefault();
};

// _instant: jump there (drag / opening); otherwise update() eases towards it
SkateboardObbyShop.prototype.setScroll = function (_v, _instant) {
    if (!Number.isFinite(_v)) _v = Number.isFinite(this.scrollTarget) ? this.scrollTarget : 0;   // never write NaN
    const _max = Number.isFinite(this.scrollMax) ? Math.max(0, this.scrollMax) : 0;
    this.scrollTarget = pc.math.clamp(_v, 0, _max);
    if (_instant || this.scrollY === undefined) this.applyScroll(this.scrollTarget);
};

SkateboardObbyShop.prototype.applyScroll = function (_v) {
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

// --- icons --------------------------------------------------------------------------------------

SkateboardObbyShop.prototype.setupTabIcons = function () {
    const _set = (tab, key, draw) => {
        const ic = tab && tab.findByName('Icon');
        if (!ic || !ic.element) return;
        if (!this.iconCache[key]) this.iconCache[key] = SkateboardObby_ShopArt.toTexture(this.app, draw());
        ic.element.texture = this.iconCache[key];
    };
    const first = this.items('trail')[0];
    if (first) _set(this.tabTrail, 'tab:trail', () => SkateboardObby_ShopArt.trailIcon(first));
    const auras = this.items('aura');
    const aura = auras.find(a => a.shape === 'snow') || auras[0];
    if (aura) _set(this.tabAura, 'tab:aura', () => SkateboardObby_AuraArt.icon(aura));
    _set(this.tabSkin, 'tab:skin', () => SkateboardObby_ShopArt.skinIcon());
    _set(this.tabBoard, 'tab:board', () => SkateboardObby_ShopArt.boardIcon());
};

// Row / offer image. Boards and skins show one cell of their atlas, the others a canvas icon.
SkateboardObbyShop.prototype.setIconElement = function (_element, _type, _item) {
    const _atlas = (_type === 'board' || _type === 'skin') ? this.manager(_type) : null;
    if (_atlas) { _atlas.setIcon(_element, _item); return; }
    _element.textureAsset = null;
    _element.rect = new pc.Vec4(0, 0, 1, 1);
    _element.texture = this.getIcon(_type, _item);
};

SkateboardObbyShop.prototype.getIcon = function (_type, _item) {
    const _key = _type + ':' + _item.id;
    if (this.iconCache[_key]) return this.iconCache[_key];
    const _art = _type === 'aura' ? SkateboardObby_AuraArt.icon(_item) : SkateboardObby_ShopArt.trailIcon(_item);
    const tex = SkateboardObby_ShopArt.toTexture(this.app, _art);
    this.iconCache[_key] = tex;
    return tex;
};

// --- helpers ----------------------------------------------------------------------------------

SkateboardObbyShop.prototype.fmt = function (_n) {
    _n = Math.floor(_n || 0);
    if (_n < 10000) return String(_n);
    if (_n < 1e6) return (Math.floor(_n / 100) / 10) + 'K';
    return (Math.floor(_n / 1e5) / 10) + 'M';
};

SkateboardObbyShop.prototype.fmtMult = function (_n) {
    return String(Math.round((_n || 1) * 100) / 100);
};

SkateboardObbyShop.prototype.warn = function (_msg, _color) {
    if (this.panelOpen && this.messageText && this.messageText.element) {
        this.messageText.element.text = _msg;
        this.messageText.element.color = _color || new pc.Color(1, 1, 1, 1);
        this.messageText.enabled = true;
        this.messageText.setLocalScale(0.8, 0.8, 1);
        this.messageText.tween(this.messageText.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.15, pc.BackOut).start();
        this.messageTimer = 2.5;
        return;
    }
    this.app.fire('WarningTextController:setWarning', _msg, 3, _color || new pc.Color(1, 1, 1, 1));
};

SkateboardObbyShop.prototype.sfx = function (_name) {
    const gm = this.app.gameManager;
    try {
        if (_name === 'purchase' && gm && gm.sfx_purchase) gm.sfx_purchase();
        else if (_name === 'warning' && gm && gm.sfx_warning) gm.sfx_warning();
    } catch (e) { }
};

// a coin item the player cannot afford: the price button shakes and the Limited Offer button calls for attention
SkateboardObbyShop.prototype.notEnoughCoins = function (r) {
    this.warn('Not enough coins!', new pc.Color(1, 0.3, 0.3, 1));
    this.sfx('warning');
    const o = this.app.skateShopOffer;
    if (o) o.attention(r);
    else this.punch(r.button || r.entity);
};

SkateboardObbyShop.prototype.punch = function (_e) {
    _e.setLocalScale(1.12, 1.12, 1);
    _e.tween(_e.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.25, pc.BackOut).start();
};

// =================================================================================================
// Canvas icons (no texture assets): ribbon trail, shirt (skin tab), skateboard (board tab)
// =================================================================================================
var SkateboardObby_ShopArt = {
    css: function (c, a) { return 'rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ',' + (a === undefined ? 1 : a) + ')'; },
    col: function (v) { return v instanceof pc.Color ? v : (Array.isArray(v) ? new pc.Color(v[0], v[1], v[2]) : (v && typeof v.r === 'number' ? new pc.Color(v.r, v.g, v.b) : new pc.Color(1, 1, 1))); },
    canvas: function (n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; },
    OUTLINE: '#1b1530',
    RAINBOW: ['#ff4d4d', '#ffa63d', '#ffe14d', '#5ce65c', '#4db8ff', '#b36bff'],

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

    // ribbon along a curve, wide at the start, thin and fading at the end (like the in-game trail)
    trailIcon: function (item) {
        const n = 128, cv = this.canvas(n), ctx = cv.getContext('2d');
        const c1 = this.col(item.color), c2 = this.col(item.color2 || item.color);
        const pt = (t) => {   // cubic bezier from the head (112,26) to the end (16,102)
            const u = 1 - t;
            return [u * u * u * 112 + 3 * u * u * t * 78 + 3 * u * t * t * 40 + t * t * t * 16,
                u * u * u * 26 + 3 * u * u * t * 118 + 3 * u * t * t * 30 + t * t * t * 102];
        };
        const steps = 24, left = [], right = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps, p = pt(t), q = pt(Math.min(1, t + 0.01)), o = pt(Math.max(0, t - 0.01));
            let dx = q[0] - o[0], dy = q[1] - o[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
            const w = 15 * (1 - 0.75 * t);
            left.push([p[0] - dy * w, p[1] + dx * w]); right.push([p[0] + dy * w, p[1] - dx * w]);
        }
        const strip = () => { ctx.beginPath(); left.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]); ctx.closePath(); };
        ctx.lineJoin = 'round';
        ctx.strokeStyle = this.OUTLINE; ctx.lineWidth = 8; strip(); ctx.stroke();
        const g = ctx.createLinearGradient(112, 26, 16, 102);
        if (item.rainbow) this.RAINBOW.forEach((c, i) => g.addColorStop(i / (this.RAINBOW.length - 1), c));
        else { g.addColorStop(0, this.css(c1)); g.addColorStop(1, this.css(c2, 0.55)); }
        ctx.fillStyle = g; strip(); ctx.fill();
        // bright core line
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); for (let i = 0; i <= steps * 0.8; i++) { const p = pt(i / steps); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
        return cv;
    },

    skinIcon: function () {
        const n = 128, cv = this.canvas(n), ctx = cv.getContext('2d');
        ctx.lineJoin = 'round';
        const shirt = () => {
            ctx.beginPath();
            ctx.moveTo(44, 22); ctx.lineTo(18, 36); ctx.lineTo(10, 62); ctx.lineTo(30, 68); ctx.lineTo(32, 108);
            ctx.lineTo(96, 108); ctx.lineTo(98, 68); ctx.lineTo(118, 62); ctx.lineTo(110, 36); ctx.lineTo(84, 22);
            ctx.quadraticCurveTo(64, 40, 44, 22); ctx.closePath();
        };
        ctx.strokeStyle = this.OUTLINE; ctx.lineWidth = 10; shirt(); ctx.stroke();
        const g = ctx.createLinearGradient(0, 20, 0, 108); g.addColorStop(0, '#5ce0ff'); g.addColorStop(1, '#3a7dff');
        ctx.fillStyle = g; shirt(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(40, 56, 48, 10);
        return cv;
    },

    // Same aspect as the row: gold wash from the left + gold line inside the row's edge + a few sparkles. Clear in the middle, the row sprite shows through.
    bossRowFrame: function (w, h) {
        const cv = document.createElement('canvas'); cv.width = Math.max(64, Math.round(w)); cv.height = Math.max(16, Math.round(h));
        const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
        const round = (x, y, rw, rh, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + rw, y, x + rw, y + rh, r); ctx.arcTo(x + rw, y + rh, x, y + rh, r); ctx.arcTo(x, y + rh, x, y, r); ctx.arcTo(x, y, x + rw, y, r); ctx.closePath(); };
        const wash = ctx.createLinearGradient(0, 0, W, 0);
        wash.addColorStop(0, 'rgba(255,205,60,0.55)'); wash.addColorStop(0.35, 'rgba(255,205,60,0.10)'); wash.addColorStop(1, 'rgba(255,205,60,0)');
        round(4, 4, W - 8, H - 12, 12); ctx.fillStyle = wash; ctx.fill();
        round(5, 5, W - 10, H - 14, 12); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
        ctx.fillStyle = 'rgba(255,240,170,0.95)';
        [[0.03, 0.22, 7], [0.045, 0.72, 5], [0.215, 0.2, 6], [0.6, 0.76, 5], [0.57, 0.24, 7]].forEach((s) => {
            const x = s[0] * W, y = s[1] * H, r = s[2];
            ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.28, y - r * 0.28); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.28, y + r * 0.28); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.28, y + r * 0.28); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.28, y - r * 0.28); ctx.closePath(); ctx.fill();
        });
        return cv;
    },

    bossTag: function () {
        const cv = document.createElement('canvas'); cv.width = 184; cv.height = 76;
        const ctx = cv.getContext('2d');
        const pill = (x, y, w, h) => { const r = h / 2; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
        pill(2, 2, 180, 72); ctx.fillStyle = this.OUTLINE; ctx.fill();
        const g = ctx.createLinearGradient(0, 8, 0, 68); g.addColorStop(0, '#ffe680'); g.addColorStop(1, '#ffae1f');
        pill(8, 8, 168, 60); ctx.fillStyle = g; ctx.fill();
        ctx.fillStyle = '#34145c'; ctx.font = '900 44px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('BOSS', 92, 40);
        return cv;
    },

    boardIcon: function () {
        const n = 128, cv = this.canvas(n), ctx = cv.getContext('2d');
        ctx.translate(64, 64); ctx.rotate(-0.45);
        const deck = () => { ctx.beginPath(); ctx.moveTo(-44, -13); ctx.lineTo(44, -13); ctx.arc(44, 0, 13, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-44, 13); ctx.arc(-44, 0, 13, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); };
        [-30, 30].forEach(x => { ctx.beginPath(); ctx.arc(x, 20, 10, 0, Math.PI * 2); ctx.fillStyle = this.OUTLINE; ctx.fill(); ctx.beginPath(); ctx.arc(x, 20, 6, 0, Math.PI * 2); ctx.fillStyle = '#ffd34d'; ctx.fill(); });
        ctx.strokeStyle = this.OUTLINE; ctx.lineWidth = 9; deck(); ctx.stroke();
        const g = ctx.createLinearGradient(-56, 0, 56, 0); g.addColorStop(0, '#ff5a7a'); g.addColorStop(1, '#ffa03a');
        ctx.fillStyle = g; deck(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-38, -8, 76, 5);
        return cv;
    }
};

// =================================================================================================
// Console helpers (same pattern as SkateboardObby_Debug): installed while the scene runs, old globals come back
// coins(n): set the balance (coins() = show). trail(id) / aura(id): own + equip ("" = none). trailList() / auraList(): list.
// =================================================================================================
var SkateboardObby_ShopDebug = {
    names: ['coins', 'trail', 'trailList', 'aura', 'auraList'],
    saved: null,
    app: null,

    install: function (app) {
        if (this.saved) this.uninstall();
        this.app = app;
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
        this.app = null;
    },

    coins: function (n) {
        const cm = this.app && this.app.skateCoins;
        if (!cm) return null;
        if (n === undefined) return cm.get();
        cm.set(n);
        cm.save();
        return cm.get();
    },

    trail: function (id) {
        const tr = this.app && this.app.skateTrail, shop = this.app && this.app.skateShop;
        if (!tr) return null;
        if (id === undefined) return tr.equipped;
        if (!id) { tr.equip(null); if (shop && shop.panelOpen) shop.refresh(); return null; }
        const it = tr.find(id);
        if (!it) { console.warn('trail("' + id + '"): unknown id, trailList() lists them'); return null; }
        if (shop) { shop.owned.trail[it.id] = true; shop.save(); }
        tr.equip(it.id);
        if (shop && shop.panelOpen) shop.refresh();
        return it.id + ' x' + it.mult + ' -> maxSpeed ' + (this.app.skateboardObbyPlayerController ? this.app.skateboardObbyPlayerController.maxSpeed.toFixed(1) : '?');
    },

    trailList: function () {
        const tr = this.app && this.app.skateTrail;
        const lines = (tr ? tr.trails : []).map(t => t.id + '  ' + t.name + '  x' + t.mult + '  ' + (t.priceType === 'coins' ? t.price + ' coins' : t.priceType === 'ad' ? '1 ad' : 'free') + (tr.equipped === t.id ? '  [equipped]' : ''));
        console.log(lines.join('\n'));
        return lines;
    },

    aura: function (id) {
        const m = this.app && this.app.skateAura, shop = this.app && this.app.skateShop;
        if (!m) return null;
        if (id === undefined) return m.equipped;
        if (!id) { m.equip(null); if (shop && shop.panelOpen) shop.refresh(); return null; }
        const it = m.find(id);
        if (!it) { console.warn('aura("' + id + '"): unknown id, auraList() lists them'); return null; }
        if (shop) { shop.owned.aura[it.id] = true; shop.save(); }
        m.equip(it.id);
        if (shop && shop.panelOpen) shop.refresh();
        return it.id;
    },

    auraList: function () {
        const m = this.app && this.app.skateAura;
        const lines = (m ? m.auras : []).map(t => t.id + '  ' + t.name + '  ' + (t.priceType === 'coins' ? t.price + ' coins' : t.priceType === 'ad' ? '1 ad' : 'free') + (m.equipped === t.id ? '  [equipped]' : ''));
        console.log(lines.join('\n'));
        return lines;
    }
};
