/*
 * SkateboardObby_ShopOffer (on ShopManager, next to SkateboardObby_Shop)
 * 1. Shop mark: a spinning badge on the HUD Shop button while a coin item can be bought (+ a dot on that tab in the Shop).
 *    Recalculated only when the balance or the owned list changes (skate:coins, skate:shopChanged).
 * 2. Ad offer: pressing a coin item the player cannot afford opens a small panel over the Shop: one rewarded ad = the item.
 *    Cancelled or failed ad: nothing is given, no coins are spent, the panel stays open. Ad items of the Shop are unchanged.
 *    NO THANKS (as big as WATCH AD): closes the panel, no ad. X and tapping outside close it too, only NO THANKS sends "declined".
 * Behind the item icon a glow: rays turn slowly, a soft disc pulses (2 image elements, canvas art, no shader). Runs only while the panel is open.
 *    OFF since 2026-11-04 (user: not to shake the economy): SkateboardObbyShopOffer.AD_OFFER below is the only switch, true brings it back.
 * 3. Limited Offer: rosette badge beside the open Shop (coins, amount, WATCH AD label, turning rays, a sway now and then), canvas art, no shader.
 *    One rewarded ad = Coin Ad Amount coins, then Coin Ad Cooldown seconds dark with a filling ring and a countdown. Nothing moves while the Shop is closed.
 *    The cooldown starts only when the ad is finished and is a clock time, so it goes on while the Shop is closed and across worlds.
 *    Analytics: app event skate:boardEvent, what shop-coin-ad (visible, interact, ad-start, ad-complete).
 * Everything is built at runtime (no scene entities, no texture assets). The Shop already holds isMarketEnabled.
 * Analytics: app event skate:shopOffer (action, item id).
 */
var SkateboardObbyShopOffer = pc.createScript('skateboardObbyShopOffer');

// false = a coin item the player cannot afford opens no panel (Not enough coins + Limited Offer instead)
SkateboardObbyShopOffer.AD_OFFER = false;
SkateboardObbyShopOffer.coinAdReadyAt = 0;   // pc.now() clock, outlives the scene

SkateboardObbyShopOffer.attributes.add('coinAd', { type: 'boolean', default: true, title: 'Coin Ad' });
SkateboardObbyShopOffer.attributes.add('coinAdAmount', { type: 'number', default: 1000, title: 'Coin Ad Amount' });
SkateboardObbyShopOffer.attributes.add('coinAdCooldown', { type: 'number', default: 10, title: 'Coin Ad Cooldown', description: 'Seconds after a finished ad' });
SkateboardObbyShopOffer.attributes.add('adOffer', { type: 'boolean', default: true, title: 'Ad Offer' });
SkateboardObbyShopOffer.attributes.add('adOfferMaxPrice', { type: 'number', default: 0, title: 'Ad Offer Max Price', description: 'Items above this coin price get no offer. 0 = no limit' });
SkateboardObbyShopOffer.attributes.add('adOfferExclude', { type: 'string', default: '', title: 'Ad Offer Exclude', description: 'Item ids without an offer, comma separated (trail_rainbow,aura_star)' });
SkateboardObbyShopOffer.attributes.add('adTimeout', { type: 'number', default: 6, title: 'Ad Start Timeout', description: 'Seconds to wait for the ad to start before the button comes back' });

SkateboardObbyShopOffer.attributes.add('glowSize', { type: 'number', default: 235, title: 'Glow Size', description: 'Icon glow in the ad offer panel' });
SkateboardObbyShopOffer.attributes.add('glowSpin', { type: 'number', default: 28, title: 'Glow Spin', description: 'Degrees per second' });
SkateboardObbyShopOffer.attributes.add('glowPulse', { type: 'number', default: 2.4, title: 'Glow Pulse', description: 'Radians per second' });

SkateboardObbyShopOffer.attributes.add('shopMark', { type: 'boolean', default: true, title: 'Shop Mark' });
SkateboardObbyShopOffer.attributes.add('markSize', { type: 'number', default: 64, title: 'Mark Size' });
SkateboardObbyShopOffer.attributes.add('markOffset', { type: 'vec2', default: [50, 50], title: 'Mark Offset', description: 'From the center of the Shop button' });
SkateboardObbyShopOffer.attributes.add('markSpin', { type: 'number', default: 120, title: 'Mark Spin', description: 'Degrees per second' });
SkateboardObbyShopOffer.attributes.add('tabDots', { type: 'boolean', default: true, title: 'Tab Dots' });
SkateboardObbyShopOffer.attributes.add('wiggleHudButton', { type: 'boolean', default: true, title: 'Wiggle Hud Button', description: 'The HUD Shop button wiggles while an item is affordable, like the quest button' });
SkateboardObbyShopOffer.attributes.add('wiggleBuyButton', { type: 'boolean', default: true, title: 'Wiggle Buy Button', description: 'In the Shop, the buy button of an affordable item wiggles' });
SkateboardObbyShopOffer.attributes.add('wigglePhase', { type: 'number', default: 0.18, title: 'Wiggle Row Phase', description: 'Seconds between the buy buttons of two rows' });
SkateboardObbyShopOffer.attributes.add('wiggleAngle', { type: 'number', default: 12, title: 'Wiggle Angle' });
SkateboardObbyShopOffer.attributes.add('wiggleTime', { type: 'number', default: 0.7, title: 'Wiggle Time' });
SkateboardObbyShopOffer.attributes.add('wigglePause', { type: 'number', default: 1.6, title: 'Wiggle Pause' });

SkateboardObbyShopOffer.prototype.initialize = function () {
    this.app.skateShopOffer = this;
    this.isOpen = false;
    this.busy = false;
    this.markOn = false;
    this._dirty = true;
    this._spin = 0;
    this._wiggleT = 0;
    this._wiggling = false;
    this._buyRows = [];
    this._rowsRef = null;
    this._buyT = 0;
    this._buyWiggling = false;
    this._textures = [];
    this._exclude = {};
    (this.adOfferExclude || '').split(',').forEach(s => { s = s.trim(); if (s) this._exclude[s] = true; });

    this.app.on('skate:coins', this.onChanged, this);
    this.app.on('skate:shopChanged', this.onChanged, this);
    this.app.graphicsDevice.on('resizecanvas', this.onResize, this);
    this.on('destroy', this.onDestroy, this);
};

SkateboardObbyShopOffer.prototype.postInitialize = function () {
    this.shop = this.app.skateShop;
    if (!this.shop) return;
    this.buildMark();
};

SkateboardObbyShopOffer.prototype.onDestroy = function () {
    this.app.off('skate:coins', this.onChanged, this);
    this.app.off('skate:shopChanged', this.onChanged, this);
    this.app.graphicsDevice.off('resizecanvas', this.onResize, this);
    if (this.root) this.root.destroy();
    if (this._resizeTimer) clearTimeout(this._resizeTimer);
    this._textures.forEach(t => t.destroy());
    this._textures = [];
    if (this.app.skateShopOffer === this) this.app.skateShopOffer = null;
    this._gone = true;
};

SkateboardObbyShopOffer.prototype.onChanged = function () {
    this._dirty = true;
};

// --- buy button wiggle ---------------------------------------------------------------------------

SkateboardObbyShopOffer.prototype.refreshBuyRows = function () {
    const s = this.shop, cm = this.app.skateCoins;
    this._rowsRef = s.rows;
    if (this._buyWiggling) this.stopBuyWiggle();
    this._buyRows.length = 0;
    if (!cm) return;
    for (let i = 0; i < s.rows.length; i++) {
        const r = s.rows[i];
        if (r.button && r.item.priceType === 'coins' && !s.owned[r.type][r.item.id] && cm.coins >= r.item.price) this._buyRows.push(r);
    }
};

SkateboardObbyShopOffer.prototype.updateBuyWiggle = function (dt) {
    const s = this.shop;
    if (!this.wiggleBuyButton || !s.panelOpen || this.isOpen || !this._buyRows.length) {
        this._buyT = 0;
        if (this._buyWiggling) this.stopBuyWiggle();
        return;
    }
    const total = this.wiggleTime + this.wigglePause;
    this._buyT = (this._buyT + dt) % total;
    const half = (s.list && s.list.element ? s.list.element.height / 2 : 0) + s.rowHeight / 2;
    const top = s.content ? s.content.getLocalPosition().y : 0;
    for (let i = 0; i < this._buyRows.length; i++) {
        const r = this._buyRows[i];
        let t = this._buyT - i * this.wigglePhase;
        if (t < 0) t += total;
        const y = top + r.entity.getLocalPosition().y;
        let a = 0;
        if (t < this.wiggleTime && y > -half && y < half) {
            const u = t / this.wiggleTime;
            a = Math.sin(u * 18.85) * this.wiggleAngle * (1 - u);
        }
        if (a !== 0 || r.wiggled) {
            r.button.setLocalEulerAngles(0, 0, a);
            r.wiggled = a !== 0;
        }
    }
    this._buyWiggling = true;
};

SkateboardObbyShopOffer.prototype.stopBuyWiggle = function () {
    this._buyWiggling = false;
    for (let i = 0; i < this._buyRows.length; i++) {
        const r = this._buyRows[i];
        if (r.wiggled && r.button.parent) r.button.setLocalEulerAngles(0, 0, 0);
        r.wiggled = false;
    }
};

// --- shop mark -----------------------------------------------------------------------------------

SkateboardObbyShopOffer.prototype.image = function (_parent, _name, _tex, _size) {
    const e = new pc.Entity(_name);
    e.addComponent('element', { type: 'image', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: _size, height: _size, useInput: false });
    e.element.texture = _tex;
    _parent.addChild(e);
    return e;
};

SkateboardObbyShopOffer.prototype.texture = function (_canvas) {
    const t = SkateboardObby_ShopArt.toTexture(this.app, _canvas);
    this._textures.push(t);
    return t;
};

SkateboardObbyShopOffer.prototype.buildMark = function () {
    const btn = this.shop.openButton;
    if (this.shopMark && btn) {
        this.mark = new pc.Entity('ShopMark');
        this.mark.addComponent('element', { type: 'group', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: this.markSize, height: this.markSize, useInput: false });
        btn.addChild(this.mark);
        this.mark.setLocalPosition(this.markOffset.x, this.markOffset.y, 0);
        this.burst = this.image(this.mark, 'Burst', this.texture(SkateboardObby_ShopOfferArt.burst()), this.markSize);
        this.image(this.mark, 'Bang', this.texture(SkateboardObby_ShopOfferArt.bang()), this.markSize * 0.56);
        this.mark.enabled = false;
    }
    this.dots = {};
    if (this.tabDots) {
        const tex = this.texture(SkateboardObby_ShopOfferArt.dot());
        [['trail', this.shop.tabTrail], ['aura', this.shop.tabAura], ['skin', this.shop.tabSkin], ['board', this.shop.tabBoard]].forEach(p => {
            if (!p[1]) return;
            const d = this.image(p[1], 'OfferDot', tex, 36);
            d.setLocalPosition(-50, 44, 0);   // top left: the right side of a tab goes under the panel frame
            d.enabled = false;
            this.dots[p[0]] = d;
        });
    }
};

SkateboardObbyShopOffer.prototype.canBuy = function (_type) {
    const s = this.shop, cm = this.app.skateCoins, list = s.items(_type), owned = s.owned[_type];
    if (!cm || !owned) return false;
    for (let i = 0; i < list.length; i++) {
        const it = list[i];
        if (it.priceType === 'coins' && !owned[it.id] && cm.coins >= it.price) return true;
    }
    return false;
};

SkateboardObbyShopOffer.prototype.refreshMark = function () {
    let any = false;
    for (const t in this.dots) {
        const on = this.canBuy(t);
        any = any || on;
        this.dots[t].enabled = on;
    }
    if (!this.tabDots) any = this.canBuy('trail') || this.canBuy('aura') || this.canBuy('board') || this.canBuy('skin');
    if (any === this.markOn) return;
    this.markOn = any;
    if (this.mark) {
        this.mark.enabled = any;
        if (any) {
            this.mark.setLocalScale(0.4, 0.4, 1);
            this.mark.tween(this.mark.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.3, pc.BackOut).start();
        }
    }
};

SkateboardObbyShopOffer.prototype.updateMark = function (dt) {
    if (!this.markOn) {
        if (this._wiggling) this.stopWiggle();
        return;
    }
    const a = this.app, c = a.skateboardObbyPlayerController;
    if (a.isMarketEnabled || a.menuPanelEnabled || a.deadMenuEnabled || a.isPopupEnabled || a.isWatchingAd || a.inCutscene || (c && c.isDied) || (a.numpad && a.numpad.enabled)) {
        this._wiggleT = 0;
        if (this._wiggling) this.stopWiggle();
        return;
    }
    if (this.burst) {
        this._spin = (this._spin + this.markSpin * dt) % 360;
        this.burst.setLocalEulerAngles(0, 0, this._spin);
    }
    if (!this.wiggleHudButton || !this.shop.openButton) {
        if (this._wiggling) this.stopWiggle();
        return;
    }
    this._wiggleT += dt;
    if (this._wiggleT >= this.wiggleTime + this.wigglePause) this._wiggleT = 0;
    if (this._wiggleT < this.wiggleTime) {
        const u = this._wiggleT / this.wiggleTime;
        this.shop.openButton.setLocalEulerAngles(0, 0, Math.sin(u * 18.85) * this.wiggleAngle * (1 - u));
        this._wiggling = true;
    } else if (this._wiggling) {
        this.stopWiggle();
    }
};

SkateboardObbyShopOffer.prototype.stopWiggle = function () {
    this._wiggling = false;
    this.shop.openButton.setLocalEulerAngles(0, 0, 0);
};

// --- ad offer panel -------------------------------------------------------------------------------

SkateboardObbyShopOffer.prototype.canOffer = function (_type, _item) {
    const s = this.shop, cm = this.app.skateCoins;
    if (!SkateboardObbyShopOffer.AD_OFFER || !this.adOffer || !s || !cm || !_item || _item.priceType !== 'coins') return false;
    if (s.owned[_type][_item.id] || cm.coins >= _item.price) return false;
    if (this.adOfferMaxPrice > 0 && _item.price > this.adOfferMaxPrice) return false;
    return !this._exclude[_item.id];
};

// true = the panel is open for this item (the Shop then shows no "not enough coins" warning)
SkateboardObbyShopOffer.prototype.open = function (_type, _item) {
    if (this.isOpen) return true;
    if (!this.canOffer(_type, _item)) return false;
    if (!this.root) this.buildPanel();
    this.type = _type;
    this.item = _item;
    this.isOpen = true;
    this.setBusy(false);

    const coins = this.app.skateCoins.coins, s = this.shop;
    s.setIconElement(this.iconEntity.element, _type, _item);
    this.nameText.element.text = _item.name;
    this.priceText.element.text = s.fmt(_item.price);
    this.needText.element.text = 'You need ' + s.fmt(_item.price - coins) + ' more coins';
    this.infoText.element.text = 'Get it with 1 ad';
    this.infoText.element.color = this.infoColor;
    this.speedText.element.text = this.speedInfo(_type, _item);
    this.layoutPrice();
    this._glowT = 0;

    this.root.enabled = true;
    const screen = this.root.parent.screen;
    if (screen && screen.syncDrawOrder) screen.syncDrawOrder();
    const f = this.computeFit();
    this.window.setLocalScale(0.6 * f, 0.6 * f, 0.6 * f);
    this.window.tween(this.window.getLocalScale()).to(new pc.Vec3(f, f, f), 0.25, pc.BackOut).start();
    this.app.fire('skate:shopOffer', 'visible', _item.id);
    return true;
};

// coin + price centered as one group next to the icon; without a speed line the block moves down to stay centered on the icon
SkateboardObbyShopOffer.prototype.layoutPrice = function () {
    const w = this.priceText.element.width, speed = !!this.speedText.element.text, y = speed ? 150 : 125;
    const coin = 56, gap = 12, left = 90 - (coin + gap + w) / 2;
    this.coinIcon.setLocalPosition(left + coin / 2, y, 0);
    this.priceText.setLocalPosition(left + coin + gap + w / 2, y, 0);
    this.nameText.setLocalPosition(90, speed ? 215 : 195, 0);
};

// what the item does for speed, '' = nothing (aura)
SkateboardObbyShopOffer.prototype.speedInfo = function (_type, _item) {
    const m = this.shop.manager(_type);
    if (_type === 'board') return m ? m.speedLabel(_item) : '';
    if (_type === 'trail') return 'x' + this.shop.fmtMult(_item.mult) + ' Speed';
    return '';
};

SkateboardObbyShopOffer.prototype.updateGlow = function (dt) {
    this._glowT += dt;
    const t = this._glowT, s = 1 + 0.08 * Math.sin(t * this.glowPulse);
    this.glowRays.setLocalEulerAngles(0, 0, -t * this.glowSpin);
    this.glowSoft.setLocalScale(s, s, 1);
};

SkateboardObbyShopOffer.prototype.close = function (_force) {
    if (!this.isOpen || (this.busy && !_force)) return;
    this.isOpen = false;
    this.busy = false;
    if (this.root) this.root.enabled = false;
};

SkateboardObbyShopOffer.prototype.setBusy = function (_busy) {
    this.busy = _busy;
    if (!this.watchText) return;
    this.watchText.element.text = _busy ? 'LOADING...' : 'WATCH AD';
    this.watchIcon.enabled = !_busy;
    this.watchText.setLocalPosition(_busy ? 0 : 38, 0, 0);
    this.watchButton.button.active = !_busy;
    this.declineButton.button.active = !_busy;
};

SkateboardObbyShopOffer.prototype.onDecline = function () {
    if (!this.isOpen || this.busy) return;
    this.app.fire('skate:shopOffer', 'declined', this.item.id);
    this.close();
};

SkateboardObbyShopOffer.prototype.onWatch = function () {
    if (!this.isOpen || this.busy || this.app.isWatchingAd) return;
    const ar = this.app.adRewarder, type = this.type, item = this.item;
    this.app.fire('skate:shopOffer', 'accepted', item.id);
    if (!ar) { this.showError('Ads are not available right now.'); return; }
    this.setBusy(true);
    this._sawAd = false;
    this._busySince = pc.now();
    try {
        // one rewarded ad; if it is cancelled or fails the callback never runs and nothing is given
        ar.watchAd(() => this.onRewarded(type, item));
    } catch (e) {
        this.setBusy(false);
        this.showError('Ads are not available right now.');
    }
};

SkateboardObbyShopOffer.prototype.onRewarded = function (_type, _item) {
    const s = this.shop;
    if (!s || s.owned[_type][_item.id]) return;
    this.busy = false;
    s._unlockVia = 'ad';
    s.unlock(_type, _item);
    this.app.fire('skate:shopOffer', 'rewarded', _item.id);
    this.close(true);
};

SkateboardObbyShopOffer.prototype.showError = function (_msg) {
    this.infoText.element.text = _msg;
    this.infoText.element.color = this.errorColor;
};

// the ad API only reports success, so the end of a failed ad is read from isWatchingAd
SkateboardObbyShopOffer.prototype.updateBusy = function () {
    const watching = this.app.isWatchingAd === true;
    if (watching) { this._sawAd = true; return; }
    if (this._sawAd) {
        this.setBusy(false);
        this.showError('Watch the whole ad to get it.');
    } else if (pc.now() - this._busySince > this.adTimeout * 1000) {
        this.setBusy(false);
        this.showError('Ads are not available right now.');
    }
};

SkateboardObbyShopOffer.prototype.computeFit = function () {
    const sc = this.root && this.root.parent.screen;
    let f = 1;
    if (sc && sc.scale > 0) f = Math.min(1, sc.resolution.x / sc.scale * 0.92 / 640, sc.resolution.y / sc.scale * 0.9 / 580);
    return f;
};

SkateboardObbyShopOffer.prototype.onResize = function () {
    if (this.coinAdRoot && this.shop && this.shop.panelOpen) setTimeout(() => { if (!this._gone && this.shop.panelOpen) this.layoutCoinAd(); }, 0);
    if (!this.isOpen) return;
    if (this._resizeTimer) clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => {
        this._resizeTimer = 0;
        if (this.window && this.isOpen) { const f = this.computeFit(); this.window.setLocalScale(f, f, f); }
    }, 0);
};

SkateboardObbyShopOffer.prototype.text = function (_parent, _name, _size, _x, _y, _w, _color) {
    const e = new pc.Entity(_name);
    e.addComponent('element', {
        type: 'text', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: _w, height: _size * 1.3, alignment: [0.5, 0.5],
        fontAsset: this.font, fontSize: _size, minFontSize: Math.round(_size * 0.6), maxFontSize: _size, autoFitWidth: true, autoWidth: false, autoHeight: false,
        wrapLines: false, text: '', color: _color || new pc.Color(1, 1, 1),
        outlineColor: new pc.Color(0.11, 0.08, 0.19), outlineThickness: 0.35, useInput: false
    });
    _parent.addChild(e);
    e.setLocalPosition(_x, _y, 0);
    return e;
};

SkateboardObbyShopOffer.prototype.buildPanel = function () {
    const s = this.shop, screenEntity = s.panel.parent;
    const frame = s.closeButton.parent;
    this.font = s.coinsText && s.coinsText.element ? s.coinsText.element.fontAsset : null;
    this.infoColor = new pc.Color(1, 1, 1);
    this.errorColor = new pc.Color(0.78, 0.08, 0.1);

    this.root = new pc.Entity('ShopOffer');
    this.root.addComponent('element', { type: 'group', anchor: [0, 0, 1, 1], pivot: [0.5, 0.5], margin: [0, 0, 0, 0], useInput: false });
    screenEntity.addChild(this.root);

    const blocker = new pc.Entity('Blocker');
    blocker.addComponent('element', { type: 'image', anchor: [0, 0, 1, 1], pivot: [0.5, 0.5], margin: [0, 0, 0, 0], color: new pc.Color(0, 0, 0), opacity: 0.45, useInput: true });
    this.root.addChild(blocker);
    blocker.element.on('click', () => this.close(), this);

    const w = this.window = new pc.Entity('Window');
    w.addComponent('element', { type: 'image', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 640, height: 580, useInput: true });
    if (frame && frame.element) {
        w.element.spriteAsset = frame.element.spriteAsset;
        w.element.pixelsPerUnit = frame.element.pixelsPerUnit;
    }
    this.root.addChild(w);

    // under the icon and every text (draw order follows the hierarchy)
    this.glowSoft = this.image(w, 'GlowSoft', this.texture(SkateboardObby_ShopOfferArt.glowSoft()), this.glowSize * 0.86);
    this.glowSoft.setLocalPosition(-185, 155, 0);
    this.glowRays = this.image(w, 'GlowRays', this.texture(SkateboardObby_ShopOfferArt.glowRays()), this.glowSize);
    this.glowRays.setLocalPosition(-185, 155, 0);
    this._glowT = 0;

    // right of the icon: name, price, speed. Then the full width lines and the two buttons. Same step (15) between the buttons and to the lines.
    this.iconEntity = this.image(w, 'Icon', null, 170);
    this.iconEntity.setLocalPosition(-185, 155, 0);
    this.nameText = this.text(w, 'Name', 52, 90, 215, 400);

    const coin = this.coinIcon = new pc.Entity('CoinIcon');
    coin.addComponent('element', { type: 'image', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 56, height: 56, useInput: false, textureAsset: s.coinIcon ? s.coinIcon.id : null });
    w.addChild(coin);
    this.priceText = this.text(w, 'Price', 46, 90, 150, 150);
    this.priceText.element.autoFitWidth = false;
    this.priceText.element.autoWidth = true;
    this.speedText = this.text(w, 'Speed', 30, 90, 95, 400, new pc.Color(0.04, 0.5, 0.16));
    this.needText = this.text(w, 'Need', 34, 0, 28, 580, new pc.Color(0.78, 0.08, 0.1));
    this.infoText = this.text(w, 'Info', 28, 0, -14, 580);

    const b = this.watchButton = new pc.Entity('WatchButton');
    b.addComponent('element', { type: 'image', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 380, height: 100, useInput: true });
    if (s.spriteAd) b.element.spriteAsset = s.spriteAd.id;
    w.addChild(b);
    b.setLocalPosition(0, -95, 0);
    b.addComponent('button', { imageEntity: b, hitPadding: new pc.Vec4(6, 6, 6, 6) });
    b.button.on('click', this.onWatch, this);

    this.watchIcon = new pc.Entity('AdIcon');
    this.watchIcon.addComponent('element', { type: 'image', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 64, height: 64, useInput: false, textureAsset: s.adIcon ? s.adIcon.id : null });
    b.addChild(this.watchIcon);
    this.watchIcon.setLocalPosition(-140, 0, 0);
    this.watchText = this.text(b, 'Label', 42, 38, 0, 260);

    const d = this.declineButton = new pc.Entity('NoThanksButton');
    d.addComponent('element', { type: 'image', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 380, height: 100, useInput: true });
    const dimSprite = s.spriteLocked || s.spriteEquip;
    if (dimSprite) d.element.spriteAsset = dimSprite.id;
    w.addChild(d);
    d.setLocalPosition(0, -210, 0);
    d.addComponent('button', { imageEntity: d, hitPadding: new pc.Vec4(6, 6, 6, 6) });
    d.button.on('click', this.onDecline, this);
    this.text(d, 'Label', 42, 0, 0, 340).element.text = 'NO THANKS';

    const x = this.xButton = s.closeButton.clone();
    x.name = 'CloseButton';
    w.addChild(x);
    x.button.on('click', () => this.close(), this);

    this.root.enabled = false;
};

// --- limited offer: coins for an ad -----------------------------------------------------------------

SkateboardObbyShopOffer.prototype.buildCoinAd = function () {
    const s = this.shop, A = SkateboardObby_ShopOfferArt;
    this.font = s.coinsText && s.coinsText.element ? s.coinsText.element.fontAsset : null;
    const root = this.coinAdRoot = new pc.Entity('LimitedOffer');
    root.addComponent('element', { type: 'group', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 240, height: 240, useInput: false });
    s.panel.addChild(root);

    // behind the badge, does not sway. On only while the offer can be taken.
    this.coinAdSoft = this.image(root, 'GlowSoft', this.texture(A.glowSoft()), 230);
    this.coinAdRays = this.image(root, 'GlowRays', this.texture(A.glowRays()), 270);
    this.coinAdRays.element.color = new pc.Color(1, 0.9, 0.45);
    this.coinAdRays.element.opacity = 0.9;

    const vis = this.coinAdVisual = new pc.Entity('Visual');
    vis.addComponent('element', { type: 'group', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 240, height: 240, useInput: false });
    root.addChild(vis);

    this._badgeOn = this.texture(A.badge('#ff66a8', '#d91a70', '#8c0d4a'));
    this._badgeOff = this.texture(A.badge('#7f8995', '#59626e', '#39404a'));
    this.coinAdBadge = this.image(vis, 'Badge', this._badgeOn, 200);

    // what is on offer: coins + amount + an unmistakable WATCH AD label
    const on = this.coinAdOn = new pc.Entity('Offer');
    on.addComponent('element', { type: 'group', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 240, height: 240, useInput: false });
    vis.addChild(on);
    const coinIcon = (x, y, size, angle) => {
        const c = new pc.Entity('Coin');
        c.addComponent('element', { type: 'image', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: size, height: size, useInput: false, textureAsset: s.coinIcon ? s.coinIcon.id : null });
        on.addChild(c);
        c.setLocalPosition(x, y, 0);
        c.setLocalEulerAngles(0, 0, angle);
    };
    coinIcon(-38, 28, 58, 14);
    coinIcon(38, 28, 58, -14);
    coinIcon(0, 24, 88, 0);
    this.text(on, 'Amount', 46, 0, -36, 180).element.text = '+' + this.coinAdAmount;
    const chip = this.image(on, 'AdChip', this.texture(A.adChip()), 180);
    chip.element.height = 54;
    chip.setLocalPosition(0, -88, 0);
    this.text(chip, 'Label', 25, 26, 0, 118).element.text = 'WATCH AD';

    // cooldown: the same badge, dark, a ring that fills up and the seconds
    this.coinAdRing = this.image(vis, 'Ring', null, 150);
    this.coinAdRing.enabled = false;
    this._ringRect = new pc.Vec4(0, 0, 0.25, 0.25);
    this.coinAdTimer = this.text(vis, 'Timer', 60, 0, 0, 130);

    this.coinAdRibbon = this.image(vis, 'Ribbon', this.texture(A.ribbon()), 236);
    this.coinAdRibbon.element.height = 58;
    this.coinAdRibbon.setLocalPosition(0, 88, 0);
    this.text(this.coinAdRibbon, 'Title', 25, 0, 2, 180).element.text = 'Limited Offer!';

    // the touch area stays still while the look sways. Same box as what is drawn.
    const hit = this.coinAdButton = new pc.Entity('Hit');
    hit.addComponent('element', { type: 'group', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 236, height: 236, useInput: true });
    root.addChild(hit);
    hit.element.on('click', this.onCoinAd, this);
    ['mousedown', 'touchstart'].forEach(n => hit.element.on(n, () => { if (this.coinAdState === 'ready') this._coinPress = true; }));
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel', 'touchleave'].forEach(n => hit.element.on(n, () => { this._coinPress = false; }));

    this._coinAttT = 0;
    this._coinShown = false;
    this._coinSec = -1;
    this._coinFrame = -1;
    this._coinK = 1;
    this._coinT = 0;
    this._coinPopT = 0;
    this._coinPress = false;
    this._coinVis = 1;
    this._coinSwung = false;
    this._shakeRow = null;
    this._shakeT = 0;
    this.setCoinAdState(pc.now() < SkateboardObbyShopOffer.coinAdReadyAt ? 'cool' : 'ready');
    const sc = s.panel.parent.screen;
    if (sc && sc.syncDrawOrder) sc.syncDrawOrder();
};

SkateboardObbyShopOffer.prototype.setCoinAdState = function (_state) {
    const ready = _state === 'ready', e = this.coinAdTimer.element;
    if (ready && this.coinAdState === 'cool') this._coinPopT = 0.45;   // "ready again"
    this.coinAdState = _state;
    this._coinPress = false;
    this.coinAdBadge.element.texture = ready ? this._badgeOn : this._badgeOff;
    this.coinAdOn.enabled = ready;
    this.coinAdRays.enabled = ready;
    this.coinAdSoft.enabled = ready;
    this.coinAdRibbon.element.color = ready ? (this._ribbonOn || (this._ribbonOn = new pc.Color(1, 1, 1))) : (this._ribbonOff || (this._ribbonOff = new pc.Color(0.55, 0.55, 0.55)));
    this.coinAdTimer.enabled = !ready;
    this.coinAdRing.enabled = _state === 'cool';
    this._coinSec = -1;
    this._coinFrame = -1;
    if (_state === 'busy') { e.fontSize = e.maxFontSize = 28; e.text = 'LOADING...'; }
    if (_state === 'cool') {
        e.fontSize = e.maxFontSize = 60;
        if (!this._ringTex) {
            this._ringTex = this.texture(SkateboardObby_ShopOfferArt.progressRing());
            this.coinAdRing.element.texture = this._ringTex;
        }
    }
    if (!ready && this._coinSwung) { this._coinSwung = false; this.coinAdVisual.setLocalEulerAngles(0, 0, 0); }
};

SkateboardObbyShopOffer.prototype.onCoinAd = function () {
    if (this.coinAdState !== 'ready' || this.app.isWatchingAd) return;
    const ar = this.app.adRewarder;
    this.app.fire('skate:boardEvent', 'shop-coin-ad', 'interact');
    if (!ar) { this.shop.warn('Ads are not available right now.', new pc.Color(1, 0.6, 0.2, 1)); return; }
    this.setCoinAdState('busy');
    this._coinSaw = false;
    this._coinSince = pc.now();
    try {
        // if the ad is cancelled or fails the callback never runs: no coins, no cooldown
        ar.watchAd(() => this.onCoinAdReward());
    } catch (e) {
        this.setCoinAdState('ready');
        this.shop.warn('Ads are not available right now.', new pc.Color(1, 0.6, 0.2, 1));
    }
};

SkateboardObbyShopOffer.prototype.onCoinAdReward = function () {
    if (this._gone) return;
    if (!this._coinSaw) this.app.fire('skate:boardEvent', 'shop-coin-ad', 'ad-start');
    this._coinSaw = true;
    // skate:coins: prices, red dots and wiggles update at once. An ad is not collected coins: the quests skip it like their own rewards.
    const q = this.app.skateQuests;
    if (q) q._granting = true;
    if (this.app.skateCoins) this.app.skateCoins.add(this.coinAdAmount);
    if (q) q._granting = false;
    this.app.fire('skate:boardEvent', 'shop-coin-ad', 'ad-complete');
    SkateboardObbyShopOffer.coinAdReadyAt = pc.now() + this.coinAdCooldown * 1000;
    this.setCoinAdState('cool');
    this.shop.sfx('purchase');
    this.shop.warn('+' + this.coinAdAmount + ' coins!', new pc.Color(0.3, 1, 0.45, 1));
};

SkateboardObbyShopOffer.prototype.updateCoinAdBusy = function () {
    if (this.app.isWatchingAd === true) {
        if (!this._coinSaw) { this._coinSaw = true; this.app.fire('skate:boardEvent', 'shop-coin-ad', 'ad-start'); }
        return;
    }
    if (this._coinSaw) {
        this.setCoinAdState('ready');
        this.shop.warn('Watch the whole ad to get the coins.', new pc.Color(1, 0.6, 0.2, 1));
    } else if (pc.now() - this._coinSince > this.adTimeout * 1000) {
        this.setCoinAdState('ready');
        this.shop.warn('Ads are not available right now.', new pc.Color(1, 0.6, 0.2, 1));
    }
};

// Beside the frame's lower right corner when there is room, else under the frame (portrait phone). Above the jump button.
SkateboardObbyShopOffer.prototype.layoutCoinAd = function () {
    const s = this.shop, sc = s.panel.parent.screen || s.panel.screen, frame = s.closeButton.parent, root = this.coinAdRoot;
    if (!sc || !(sc.scale > 0) || !frame.element) return;
    const W = sc.resolution.x / sc.scale, H = sc.resolution.y / sc.scale, f = s.computeFit();
    const fp = frame.getLocalPosition(), right = (fp.x + frame.element.width / 2) * f, bottom = (fp.y - frame.element.height / 2) * f;
    const BW = 240, BH = 240;
    let floor = -H / 2 + 10;
    const jump = this.app.isMobile && this.app.root.findByName('JumpButton');
    if (jump && jump.element && jump.enabled) floor = Math.max(floor, jump.element.screenCorners[2].y / sc.scale - H / 2 + 12);
    const side = W / 2 - right;
    let k = Math.min(1, (side - 24) / BW), x, y;
    if (k >= 0.7) {
        x = right + 12 + BW * k / 2;
        y = Math.max(bottom, floor) + BH * k / 2;
    } else {
        // the message line sits right under the frame
        const msg = s.messageText ? (s.messageText.getLocalPosition().y - 20) * f : bottom, top = Math.min(bottom, msg) - 6;
        k = Math.min(1, Math.max(0.5, (top - floor) / BH));
        x = fp.x * f;
        y = top - BH * k / 2;
    }
    this._coinK = k;
    root.setLocalPosition(x, y, 0);
    root.setLocalScale(k, k, 1);
};

// feedback for an item the player cannot afford (Shop.notEnoughCoins)
SkateboardObbyShopOffer.prototype.attention = function (r) {
    this.stopRowShake();
    if (r && r.button) { this._shakeRow = r; this._shakeT = 0; }
    this._coinAttT = 0.9;
};

SkateboardObbyShopOffer.prototype.stopRowShake = function () {
    const r = this._shakeRow;
    if (r && r.button.parent) r.button.setLocalEulerAngles(0, 0, 0);
    this._shakeRow = null;
};

SkateboardObbyShopOffer.prototype.updateCoinAd = function (dt) {
    const s = this.shop;
    if (this.coinAdState === 'busy') this.updateCoinAdBusy();
    if (this._shakeRow) {
        this._shakeT += dt;
        const u = this._shakeT / 0.45;
        if (u >= 1 || !s.panelOpen || !this._shakeRow.button.parent) this.stopRowShake();
        else this._shakeRow.button.setLocalEulerAngles(0, 0, Math.sin(u * 25.1) * 9 * (1 - u));
    }
    if (!s.panelOpen) { this._coinShown = false; return; }
    if (!this._coinShown) {
        this._coinShown = true;
        this.layoutCoinAd();
        this.app.fire('skate:boardEvent', 'shop-coin-ad', 'visible');
    }
    if (this.coinAdState === 'cool') {
        const left = SkateboardObbyShopOffer.coinAdReadyAt - pc.now();
        if (left <= 0) this.setCoinAdState('ready');
        else {
            const n = Math.ceil(left / 1000);
            if (n !== this._coinSec) { this._coinSec = n; this.coinAdTimer.element.text = String(n); }
            // 16 steps of the ring atlas, the image only moves when the step changes
            const f = Math.min(15, Math.floor((1 - left / (this.coinAdCooldown * 1000)) * 16));
            if (f !== this._coinFrame) {
                this._coinFrame = f;
                this._ringRect.set((f % 4) * 0.25, 1 - (Math.floor(f / 4) + 1) * 0.25, 0.25, 0.25);
                this.coinAdRing.element.rect = this._ringRect;
            }
        }
    }
    if (this.coinAdState === 'ready' && !this.app.isWatchingAd) {
        // rays turn, glow pulses; a short sway, then a long rest
        const t = this._coinT = (this._coinT + dt) % 3600;
        this.coinAdRays.setLocalEulerAngles(0, 0, -t * this.glowSpin);
        const g = 1 + 0.08 * Math.sin(t * this.glowPulse);
        this.coinAdSoft.setLocalScale(g, g, 1);
        const cycle = t % (this.wiggleTime + 2.5);
        if (cycle < this.wiggleTime) {
            const u = cycle / this.wiggleTime;
            this.coinAdVisual.setLocalEulerAngles(0, 0, Math.sin(u * 18.85) * this.wiggleAngle * (1 - u));
            this._coinSwung = true;
        } else if (this._coinSwung) {
            this._coinSwung = false;
            this.coinAdVisual.setLocalEulerAngles(0, 0, 0);
        }
    }
    // press + "ready again" pop, written only when it changes
    let vs = this._coinPress ? 0.92 : 1;
    if (this._coinPopT > 0) {
        this._coinPopT = Math.max(0, this._coinPopT - dt);
        vs *= 1 + 0.28 * Math.sin(this._coinPopT / 0.45 * Math.PI);
    }
    if (vs !== this._coinVis) { this._coinVis = vs; this.coinAdVisual.setLocalScale(vs, vs, 1); }
    if (this._coinAttT > 0) {
        this._coinAttT = Math.max(0, this._coinAttT - dt);
        const p = this._coinK * (1 + 0.14 * Math.abs(Math.sin(this._coinAttT * 10.5)));
        this.coinAdRoot.setLocalScale(p, p, 1);
    }
};

SkateboardObbyShopOffer.prototype.update = function (dt) {
    if (!this.shop) return;
    // built on the first Shop opening
    if (!this.coinAdRoot && this.coinAd && this.shop.panel && this.shop.panelOpen) this.buildCoinAd();
    if (this.coinAdRoot) this.updateCoinAd(dt);
    if (this._dirty) { this._dirty = false; this.refreshMark(); this.refreshBuyRows(); }
    else if (this._rowsRef !== this.shop.rows) this.refreshBuyRows();
    this.updateMark(dt);
    this.updateBuyWiggle(dt);
    if (this.isOpen && this.busy) this.updateBusy();
    if (this.isOpen && !this.app.isWatchingAd) this.updateGlow(dt);
};

// =================================================================================================
// Canvas art (no texture assets)
// =================================================================================================
var SkateboardObby_ShopOfferArt = {
    OUTLINE: '#1b1530',
    canvas: function (n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; },
    burst: function () {
        const n = 128, c = this.canvas(n), g = c.getContext('2d'), r1 = 60, r2 = 44, pts = 10;
        g.beginPath();
        for (let i = 0; i < pts * 2; i++) {
            const a = i / (pts * 2) * Math.PI * 2, r = i % 2 ? r2 : r1, x = n / 2 + Math.cos(a) * r, y = n / 2 + Math.sin(a) * r;
            if (i) g.lineTo(x, y); else g.moveTo(x, y);
        }
        g.closePath();
        g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = this.OUTLINE; g.stroke();
        g.fillStyle = '#ffd23c'; g.fill();
        return c;
    },
    // scalloped rosette: dark edge, darker lip under it, gradient face, thin light ring
    badge: function (top, bottom, lip) {
        const n = 256, c = this.canvas(n), g = c.getContext('2d'), m = n / 2;
        const shape = (r, dy) => {
            g.beginPath();
            for (let i = 0; i <= 96; i++) {
                const a = i / 96 * Math.PI * 2, q = r * (1 + 0.045 * Math.cos(a * 16)), x = m + Math.cos(a) * q, y = m + dy + Math.sin(a) * q;
                if (i) g.lineTo(x, y); else g.moveTo(x, y);
            }
            g.closePath();
        };
        g.lineJoin = 'round';
        shape(112, 4); g.lineWidth = 14; g.strokeStyle = this.OUTLINE; g.stroke(); g.fillStyle = this.OUTLINE; g.fill();
        shape(110, 6); g.fillStyle = lip; g.fill();
        const f = g.createLinearGradient(0, m - 110, 0, m + 100);
        f.addColorStop(0, top); f.addColorStop(1, bottom);
        shape(108, -4); g.fillStyle = f; g.fill();
        g.beginPath(); g.arc(m, m - 4, 90, 0, Math.PI * 2); g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,0.45)'; g.stroke();
        return c;
    },
    // dark pill, white video icon with a play mark
    adChip: function () {
        const w = 360, h = 108, c = document.createElement('canvas'), g = c.getContext('2d');
        c.width = w; c.height = h;
        const pill = (x, y, pw, ph, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + pw, y, x + pw, y + ph, r); g.arcTo(x + pw, y + ph, x, y + ph, r); g.arcTo(x, y + ph, x, y, r); g.arcTo(x, y, x + pw, y, r); g.closePath(); };
        pill(4, 4, w - 8, h - 8, 46); g.fillStyle = '#ffffff'; g.fill();
        pill(11, 11, w - 22, h - 22, 40); g.fillStyle = this.OUTLINE; g.fill();
        pill(32, 26, 76, 56, 14); g.fillStyle = '#ffffff'; g.fill();
        g.beginPath(); g.moveTo(58, 38); g.lineTo(58, 70); g.lineTo(86, 54); g.closePath(); g.fillStyle = '#d91a70'; g.fill();
        return c;
    },
    ribbon: function () {
        const w = 472, h = 116, c = document.createElement('canvas'), g = c.getContext('2d');
        c.width = w; c.height = h;
        const path = () => { g.beginPath(); g.moveTo(10, 16); g.lineTo(w - 10, 16); g.lineTo(w - 42, 58); g.lineTo(w - 10, 100); g.lineTo(10, 100); g.lineTo(42, 58); g.closePath(); };
        g.lineJoin = 'round';
        path(); g.lineWidth = 16; g.strokeStyle = this.OUTLINE; g.stroke();
        const f = g.createLinearGradient(0, 16, 0, 100);
        f.addColorStop(0, '#ffb43a'); f.addColorStop(1, '#f2761b');
        path(); g.fillStyle = f; g.fill();
        return c;
    },
    // 4 x 4 cells of 128 px: frame k has k of 16 segments lit, clockwise from the top
    progressRing: function () {
        const n = 512, s = 128, c = this.canvas(n), g = c.getContext('2d');
        g.lineWidth = 11;
        for (let k = 0; k < 16; k++) {
            const cx = (k % 4) * s + s / 2, cy = Math.floor(k / 4) * s + s / 2;
            for (let i = 0; i < 16; i++) {
                const a0 = -Math.PI / 2 + i / 16 * Math.PI * 2 + 0.035, a1 = a0 + Math.PI / 8 - 0.07;
                g.beginPath(); g.arc(cx, cy, 54, a0, a1);
                g.strokeStyle = i < k ? '#ffd23c' : 'rgba(255,255,255,0.22)';
                g.stroke();
            }
        }
        return c;
    },
    glowRays: function () {
        const n = 256, c = this.canvas(n), g = c.getContext('2d'), m = n / 2, rays = 12, half = 0.13;
        const f = g.createRadialGradient(m, m, 20, m, m, m - 2);
        f.addColorStop(0, 'rgba(255,255,255,0.95)');
        f.addColorStop(0.6, 'rgba(255,255,255,0.55)');
        f.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = f;
        for (let i = 0; i < rays; i++) {
            const a = i / rays * Math.PI * 2;
            g.beginPath();
            g.moveTo(m, m);
            g.lineTo(m + Math.cos(a - half) * (m - 2), m + Math.sin(a - half) * (m - 2));
            g.lineTo(m + Math.cos(a + half) * (m - 2), m + Math.sin(a + half) * (m - 2));
            g.closePath();
            g.fill();
        }
        return c;
    },
    glowSoft: function () {
        const n = 128, c = this.canvas(n), g = c.getContext('2d'), m = n / 2;
        const f = g.createRadialGradient(m, m, 0, m, m, m - 1);
        f.addColorStop(0, 'rgba(255,255,255,1)');
        f.addColorStop(0.55, 'rgba(255,255,255,0.7)');
        f.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = f;
        g.fillRect(0, 0, n, n);
        return c;
    },
    bang: function () {
        const n = 96, c = this.canvas(n), g = c.getContext('2d');
        g.beginPath(); g.arc(48, 48, 43, 0, Math.PI * 2);
        g.fillStyle = '#ff3b3b'; g.fill(); g.lineWidth = 6; g.strokeStyle = this.OUTLINE; g.stroke();
        g.fillStyle = '#ffffff';
        g.beginPath(); g.roundRect ? g.roundRect(40, 18, 16, 40, 7) : g.rect(40, 18, 16, 40); g.fill();
        g.beginPath(); g.arc(48, 72, 9, 0, Math.PI * 2); g.fill();
        return c;
    },
    dot: function () {
        const n = 64, c = this.canvas(n), g = c.getContext('2d');
        g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2);
        g.fillStyle = '#ff3b3b'; g.fill(); g.lineWidth = 6; g.strokeStyle = this.OUTLINE; g.stroke();
        return c;
    }
};
