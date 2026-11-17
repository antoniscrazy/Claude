// Cross promo: cards of other games next to the ESC menu (Menu panel). Everything is built here at runtime.
// - Games: the lists in CrossPromoGames.js (PopulerGames, PromoGames), edited in code. Own Scenes never show. No game = no section.
// - Choice, once per scene load: 1 card from PopulerGames, the others from PromoGames, at random, never twice. No network requests.
//   Only the chosen games' images are loaded, on the first menu open.
// - Cards look like Menu_New's: square, the image (colour edge in it) fills the card, the name in capitals over its bottom, whole card clickable.
// - Layout, the same on every screen: a "More Games" column attached to the left of the Menu panel, with the panel's scale, never taller than
//   the panel. Three cards in a column, more cards = more columns. The Menu (with Join Room's window) moves so panel + column are centered
//   together. The Menu keeps its scale, grows while the cards are under MIN_CARD_PX and shrinks if the two do not fit.
//   Colour = Section Sprite. Done on open and on resize.
// - Cards grow under the mouse / finger: SkateboardObby_HoverScale.
// - A card opens a small confirm window ("Play Monkey Obby?"). Play -> same path as a world change plus the menu's ad:
//   save, leave the room, the scene's tagged assets, commercial break, change scene. The Worlds panel's loading screen is used.
//   Failed (asset error, no progress for Stall Timeout, scene error): the Menu comes back with a Retry window, back to the room.
// - The Menu's flags stay on during the trip (NetworkManager would reopen the menu without them); the next mode's NetworkManager
//   resets them in its initialize, same as when leaving through the Menu scene.
// - A card stays hidden until its image is ready.
// - Poki events: fired as skate:crossPromo (visible / interact / start) and skate:crossPromoEnd (complete / fail) with "<popular|random>-<row's event>",
//   SkateboardObby_Analytics sends them as promo-<that>.
var SkateboardObbyCrossPromo = pc.createScript('skateboardObbyCrossPromo');

SkateboardObbyCrossPromo.attributes.add('frameSprite', { type: 'asset', assetType: 'sprite', title: 'Frame Sprite', description: 'Panel of the confirm window.' });
SkateboardObbyCrossPromo.attributes.add('sectionSprite', { type: 'asset', assetType: 'sprite', title: 'Section Sprite', description: 'Panel behind the cards. Empty = Frame Sprite.' });
SkateboardObbyCrossPromo.attributes.add('playSprite', { type: 'asset', assetType: 'sprite', title: 'Play Button Sprite' });
SkateboardObbyCrossPromo.attributes.add('cancelSprite', { type: 'asset', assetType: 'sprite', title: 'Cancel Button Sprite' });
SkateboardObbyCrossPromo.attributes.add('font', { type: 'asset', assetType: 'font', title: 'Font' });
SkateboardObbyCrossPromo.attributes.add('ownScenes', { type: 'string', default: 'SkateboardObby,SkateboardObby_2', title: 'Own Scenes', description: 'Scenes of the mode this menu is in, comma separated. Never shown as a card.' });
SkateboardObbyCrossPromo.attributes.add('cardCount', { type: 'number', default: 3, title: 'Card Count' });
SkateboardObbyCrossPromo.attributes.add('confirmNote', { type: 'string', default: 'Your progress is saved', title: 'Confirm Note' });
SkateboardObbyCrossPromo.attributes.add('headerText', { type: 'string', default: 'More Games', title: 'Header Text' });
SkateboardObbyCrossPromo.attributes.add('minButtonSize', { type: 'number', default: 46, title: 'Min Button Size (px)', description: 'Height of the confirm buttons in real pixels; the window grows for this.' });
SkateboardObbyCrossPromo.attributes.add('imagePreloadDelay', { type: 'number', default: 2, title: 'Image Preload Delay (s)', description: '-1 = only when the menu opens.' });
SkateboardObbyCrossPromo.attributes.add('stallTimeout', { type: 'number', default: 30, title: 'Stall Timeout (s)', description: 'No asset finished for this long = the trip failed.' });

// Section sizes are in the Menu panel's own units; the section gets the panel's scale.
SkateboardObbyCrossPromo.MARGIN = 12;        // screen edge, screen units
SkateboardObbyCrossPromo.PADDING = 16;       // section edge <-> cards
SkateboardObbyCrossPromo.PER_COLUMN = 3;      // cards in a column
SkateboardObbyCrossPromo.GAP = 10;           // card <-> card
SkateboardObbyCrossPromo.HEADER = 46;        // "More Games" line
SkateboardObbyCrossPromo.OVERLAP = 7;        // the section covers the panel's edge
SkateboardObbyCrossPromo.MIN_CARD_PX = 90;   // real card size the Menu grows for
// Menu_New's card, as parts of the card's side: image (its edge is transparent), name line
SkateboardObbyCrossPromo.IMAGE_PART = 1.05;
SkateboardObbyCrossPromo.NAME_WIDTH = 0.914;
SkateboardObbyCrossPromo.NAME_HEIGHT = 0.15;
SkateboardObbyCrossPromo.NAME_BOTTOM = 0.043;
SkateboardObbyCrossPromo.NAME_FONT = 0.136;
SkateboardObbyCrossPromo.LEAVE_TIMEOUT = 3000;  // ms; same as the Worlds panel

SkateboardObbyCrossPromo.prototype.initialize = function () {
    this.app.skateCrossPromo = this;
    this.cards = [];
    this.isShown = false;
    this.confirmGame = null;
    this.travelling = false;
    this.travelId = 0;
    this.dead = false;
    this.pendingReveal = false;
    this.preloadTimer = this.imagePreloadDelay;
    this.preloaded = false;
    this.menuWasOn = false;
    this.imagesAsked = false;

    this.menu = this.app.root.findByName('Menu');
    const _nm = this.app.skateboardObbyNetworkManager;
    this.joinRoomUI = _nm && _nm.joinRoomUI ? _nm.joinRoomUI : this.app.root.findByName('JoinRoom');
    this.menuScale = this.menu.getLocalScale().x;
    this.menuPos = this.menu.getLocalPosition().clone();
    const _title = this.menu.findByName('Title');
    this.titleOverhang = _title && _title.element ? Math.max(0, _title.getLocalPosition().y + _title.element.height / 2 - this.menu.element.height / 2) : 0;
    // Join Room's window opens over the Menu and moves with it; its full screen background ("bg") stays
    this.joinParts = this.joinRoomUI ? this.joinRoomUI.children.filter(c => c.name !== 'bg').map(c => ({ entity: c, pos: c.getLocalPosition().clone() })) : [];

    this.build();
    this.app.graphicsDevice.on('resizecanvas', this.onResize, this);
    this.on('destroy', this.onDestroy, this);
};

SkateboardObbyCrossPromo.prototype.onDestroy = function () {
    this.dead = true;
    this.app.graphicsDevice.off('resizecanvas', this.onResize, this);
    if (this.app.skateCrossPromo === this) this.app.skateCrossPromo = null;
};

SkateboardObbyCrossPromo.prototype.assetOf = function (_v) {
    if (!_v) return null;
    if (_v instanceof pc.Asset) return _v;
    return this.app.assets.get(_v) || null;
};

// --- building ---------------------------------------------------------------------------

SkateboardObbyCrossPromo.prototype.addElement = function (_parent, _name, _options) {
    const e = new pc.Entity(_name);
    const _o = Object.assign({ anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], useInput: false }, _options);
    e.addComponent('element', _o);
    _parent.addChild(e);
    return e;
};

SkateboardObbyCrossPromo.prototype.addText = function (_parent, _name, _max, _w, _h) {
    const _font = this.assetOf(this.font);
    return this.addElement(_parent, _name, {
        type: pc.ELEMENTTYPE_TEXT, fontAsset: _font ? _font.id : null, text: '', alignment: [0.5, 0.5], width: _w, height: _h, wrapLines: false,
        autoWidth: false, autoHeight: false, autoFitWidth: true, autoFitHeight: true, minFontSize: 10, maxFontSize: _max, fontSize: _max,
        color: new pc.Color(1, 1, 1), outlineColor: new pc.Color(0, 0, 0, 1), outlineThickness: 1
    });
};

SkateboardObbyCrossPromo.prototype.addButton = function (_parent, _name, _sprite, _w, _h, _fn) {
    const _a = this.assetOf(_sprite);
    const e = this.addElement(_parent, _name, { type: pc.ELEMENTTYPE_IMAGE, spriteAsset: _a ? _a.id : null, width: _w, height: _h, useInput: true });
    e.addComponent('button', { imageEntity: e, hoverTint: new pc.Color(0.88, 0.88, 0.88), pressedTint: new pc.Color(0.7, 0.7, 0.7) });
    e.button.on('click', _fn, this);
    return e;
};

SkateboardObbyCrossPromo.prototype.build = function () {
    const _frame = this.assetOf(this.frameSprite);
    const _picks = typeof CrossPromoGames !== 'undefined' ? CrossPromoGames.getGames(this.app, String(this.ownScenes || '').split(',').map(n => n.trim()), Math.floor(this.cardCount)) : [];

    this.root = this.addElement(this.entity, 'CrossPromoRoot', { type: pc.ELEMENTTYPE_GROUP, anchor: [0, 0, 1, 1], margin: [0, 0, 0, 0] });
    this.root.enabled = false;
    const _section = this.assetOf(this.sectionSprite) || _frame;
    this.frame = this.addElement(this.root, 'CardsFrame', { type: pc.ELEMENTTYPE_IMAGE, spriteAsset: _section ? _section.id : null, width: 100, height: 100, useInput: true });
    this.header = this.addText(this.frame, 'Header', 30, 100, 36);
    this.header.element.text = this.headerText;

    for (let i = 0; i < _picks.length; i++) {
        const e = this.addElement(this.frame, 'Card_' + i, { type: pc.ELEMENTTYPE_GROUP, width: 100, height: 100, useInput: true });
        e.addComponent('button', {});
        e.button.on('click', () => this.onCardClick(card), this);
        const _art = this.addElement(e, 'Art', { type: pc.ELEMENTTYPE_IMAGE, width: 100, height: 100 });
        const _label = this.addText(e, 'Label', 30, 90, 40);
        _label.element.outlineThickness = 0.45;
        _label.element.outlineColor = new pc.Color(0.04, 0.07, 0.13, 1);
        _label.element.shadowOffset = new pc.Vec2(0.12, -0.14);
        _label.element.shadowColor = new pc.Color(0, 0, 0, 0.6);
        const _game = _picks[i].game;
        _label.element.text = String(_game.name).toUpperCase();
        const card = { game: _game, eventKey: (_picks[i].popular ? 'popular-' : 'random-') + _game.event, entity: e, art: _art, label: _label, asset: null, ready: false, failed: false, seen: false };
        e.enabled = false;
        e.addComponent('script');
        e.script.create('skateboardObbyHoverScale');
        this.cards.push(card);
    }

    this.confirmRoot = this.addElement(this.root, 'CrossPromoConfirm', { type: pc.ELEMENTTYPE_GROUP, anchor: [0, 0, 1, 1], margin: [0, 0, 0, 0] });
    const _blocker = this.addElement(this.confirmRoot, 'Blocker', { type: pc.ELEMENTTYPE_IMAGE, anchor: [0, 0, 1, 1], margin: [0, 0, 0, 0], color: new pc.Color(0, 0, 0), opacity: 0.55, useInput: true });
    _blocker.element.on('click', () => this.closeConfirm());
    this.confirmWindow = this.addElement(this.confirmRoot, 'Window', { type: pc.ELEMENTTYPE_IMAGE, spriteAsset: _frame ? _frame.id : null, width: 540, height: 440, useInput: true });
    this.confirmArt = this.addElement(this.confirmWindow, 'Art', { type: pc.ELEMENTTYPE_IMAGE, width: 178, height: 178 });
    this.confirmArt.setLocalPosition(0, 112, 0);
    this.confirmTitle = this.addText(this.confirmWindow, 'Title', 44, 500, 60);
    this.confirmTitle.setLocalPosition(0, -5, 0);
    this.confirmNoteText = this.addText(this.confirmWindow, 'Note', 26, 500, 34);
    this.confirmNoteText.setLocalPosition(0, -56, 0);
    this.playButton = this.addButton(this.confirmWindow, 'PlayButton', this.playSprite, 225, 88, () => this.onPlay());
    this.playButton.setLocalPosition(122, -142, 0);
    this.playText = this.addText(this.playButton, 'Text', 36, 200, 50);
    this.cancelButton = this.addButton(this.confirmWindow, 'CancelButton', this.cancelSprite, 225, 88, () => this.closeConfirm());
    this.cancelButton.button.defaultTint = new pc.Color(1, 0, 0);
    this.cancelButton.element.color = new pc.Color(1, 0, 0);
    this.cancelButton.button.hoverTint = new pc.Color(0.85, 0, 0);
    this.cancelButton.button.pressedTint = new pc.Color(0.6, 0, 0);
    this.cancelButton.setLocalPosition(-122, -142, 0);
    this.addText(this.cancelButton, 'Text', 36, 200, 50).element.text = 'Cancel';
    this.confirmRoot.enabled = false;
};

// --- images -----------------------------------------------------------------------------

SkateboardObbyCrossPromo.prototype.preload = function () {
    this.preloaded = true;
    const _load = (a) => { if (a && !a.loaded && !a.loading) this.app.assets.load(a); };
    [this.frameSprite, this.sectionSprite, this.playSprite, this.cancelSprite, this.font].forEach(v => _load(this.assetOf(v)));
    this.pendingReveal = true;
};

// --- which games -------------------------------------------------------------------------

SkateboardObbyCrossPromo.prototype.loadImage = function (c) {
    c.asset = this.assetOf(c.game.image);
    if (!c.asset) { c.failed = true; return; }
    if (c.asset.loaded && c.asset.resource) { c.ready = true; return; }
    c.asset.ready(() => { if (!this.dead) { c.ready = true; this.pendingReveal = true; } });
    this.app.assets.once('error:' + c.asset.id, () => { if (!this.dead) { c.failed = true; this.pendingReveal = true; } });
    this.app.assets.load(c.asset);
};

// the section shows only once its sprites are there (an element without its sprite draws a plain rectangle)
SkateboardObbyCrossPromo.prototype.uiReady = function () {
    const _f = this.assetOf(this.sectionSprite) || this.assetOf(this.frameSprite);
    return !_f || _f.loaded;
};

SkateboardObbyCrossPromo.prototype.reveal = function () {
    this.pendingReveal = false;
    const _ui = this.uiReady();
    let _any = false;
    for (let i = 0; i < this.cards.length; i++) {
        const c = this.cards[i];
        const _on = _ui && c.ready && !c.failed;
        if (_on !== c.entity.enabled) {
            if (_on) c.art.element.texture = c.asset.resource;
            c.entity.enabled = _on;
        }
        if (_on) {
            _any = true;
            if (!c.seen) {
                c.seen = true;
                this.app.fire('skate:crossPromo', c.eventKey, 'visible');
            }
        }
    }
    this.frame.enabled = _any;
    if (!_ui) this.pendingReveal = true;
    this.layout();
    this.syncOrder();
};

SkateboardObbyCrossPromo.prototype.syncOrder = function () {
    const _s = this.entity.element && this.entity.element.screen;
    if (_s && _s.screen) _s.screen.syncDrawOrder();
};

// --- layout -----------------------------------------------------------------------------

// real (CSS) pixels per screen unit; screen.scale counts device pixels, the finger does not
SkateboardObbyCrossPromo.prototype.pxScale = function (_screen) {
    const _d = this.app.graphicsDevice;
    const _css = _d.canvas && _d.canvas.clientWidth;
    return _screen.scale * (_css > 0 && _d.width > 0 ? _css / _d.width : 1);
};

// Menu and Join Room's window to this place; no cards = the place they were built with
SkateboardObbyCrossPromo.prototype.placeMenu = function (_x, _y, _f) {
    this.menu.setLocalPosition(_x, _y, this.menuPos.z);
    this.menu.setLocalScale(_f, _f, _f);
    const _dx = _x - this.menuPos.x, _dy = _y - this.menuPos.y;
    for (let i = 0; i < this.joinParts.length; i++) {
        const p = this.joinParts[i];
        p.entity.setLocalPosition(p.pos.x + _dx, p.pos.y + _dy, p.pos.z);
    }
};

SkateboardObbyCrossPromo.prototype.layout = function () {
    const S = SkateboardObbyCrossPromo;
    const _screen = this.entity.element && this.entity.element.screen && this.entity.element.screen.screen;
    if (!_screen || !(_screen.scale > 0)) return;
    const _live = this.cards.filter(c => !c.failed);
    const _n = _live.length;
    if (!_n) {
        this.placeMenu(this.menuPos.x, this.menuPos.y, this.menuScale);
        return;
    }
    const _px = this.pxScale(_screen);
    const W = _screen.resolution.x / _screen.scale, H = _screen.resolution.y / _screen.scale;
    const _roomW = W - 2 * S.MARGIN, _roomH = H - 2 * S.MARGIN;
    const _pw = this.menu.element.width, _ph = this.menu.element.height, _top = this.titleOverhang;
    const _cols = Math.ceil(_n / S.PER_COLUMN), _rows = Math.min(_n, S.PER_COLUMN);
    const _cs = (_ph - S.HEADER - S.PADDING - (S.PER_COLUMN - 1) * S.GAP) / S.PER_COLUMN;   // three cards fill the panel's height
    const _sw = 2 * S.PADDING + _cols * _cs + (_cols - 1) * S.GAP;
    const _sh = S.HEADER + _rows * _cs + (_rows - 1) * S.GAP + S.PADDING;
    const _totalW = _pw + _sw - S.OVERLAP;

    const _f = Math.min(_roomH / (_top + _ph), _roomW / _totalW, Math.max(this.menuScale, S.MIN_CARD_PX / (_cs * _px)));
    const _mx = (_sw - S.OVERLAP) / 2 * _f, _my = -_top / 2 * _f;
    this.placeMenu(_mx, _my, _f);
    this.frame.setLocalPosition(_mx - (_pw / 2 - S.OVERLAP + _sw / 2) * _f, _my + (_ph - _sh) / 2 * _f, 0);   // top with the panel's top
    this.frame.setLocalScale(_f, _f, _f);
    this.frame.element.width = _sw;
    this.frame.element.height = _sh;
    this.header.setLocalPosition(0, _sh / 2 - S.HEADER / 2 - 3, 0);
    this.header.element.width = _sw - 2 * S.PADDING;

    const _cy = (S.PADDING - S.HEADER) / 2;
    for (let i = 0; i < _n; i++) {
        const c = _live[i];
        const _row = i % S.PER_COLUMN, _col = Math.floor(i / S.PER_COLUMN);
        const _down = Math.min(_n - _col * S.PER_COLUMN, S.PER_COLUMN);   // the last column can be short: it stays centered
        c.entity.setLocalPosition((_col - (_cols - 1) / 2) * (_cs + S.GAP), _cy + ((_down - 1) / 2 - _row) * (_cs + S.GAP), 0);
        c.entity.element.width = _cs;
        c.entity.element.height = _cs;
        c.art.element.width = _cs * S.IMAGE_PART;
        c.art.element.height = _cs * S.IMAGE_PART;
        c.label.setLocalPosition(0, -_cs / 2 + _cs * (S.NAME_BOTTOM + S.NAME_HEIGHT / 2), 0);
        c.label.element.width = _cs * S.NAME_WIDTH;
        c.label.element.height = _cs * S.NAME_HEIGHT;
        c.label.element.maxFontSize = _cs * S.NAME_FONT;
    }
    this.layoutConfirm();
};

SkateboardObbyCrossPromo.prototype.confirmFit = function () {
    const _screen = this.entity.element && this.entity.element.screen && this.entity.element.screen.screen;
    if (!_screen || !(_screen.scale > 0)) return 1;
    const W = _screen.resolution.x / _screen.scale, H = _screen.resolution.y / _screen.scale;
    const _e = this.confirmWindow.element;
    const _max = Math.min((W - 20) / _e.width, (H - 20) / _e.height);
    return Math.min(_max, Math.max(1, this.minButtonSize / (this.playButton.element.height * this.pxScale(_screen))));
};

SkateboardObbyCrossPromo.prototype.layoutConfirm = function () {
    if (!this.confirmGame) return;
    const _f = this.confirmFit();
    this.confirmWindow.setLocalScale(_f, _f, 1);
};

SkateboardObbyCrossPromo.prototype.onResize = function () {
    if (this.isShown) this.layout();
};

// --- menu state -------------------------------------------------------------------------

SkateboardObbyCrossPromo.prototype.setShown = function (_on) {
    this.isShown = _on;
    this.root.enabled = _on;
    if (_on) {
        if (!this.preloaded) this.preload();
        if (!this.imagesAsked) {
            this.imagesAsked = true;
            this.cards.forEach(c => this.loadImage(c));
        }
        this.reveal();
    } else {
        this.closeConfirm();
    }
};

SkateboardObbyCrossPromo.prototype.update = function (dt) {
    if (!this.preloaded && this.preloadTimer >= 0) {
        this.preloadTimer -= dt;
        if (this.preloadTimer < 0) this.preload();
    }
    const _menuOn = !!(this.menu && this.menu.enabled) && !this.travelling;
    if (!_menuOn && this.menuWasOn && !this.travelling) {
        // one visible per menu open
        for (let i = 0; i < this.cards.length; i++) this.cards[i].seen = false;
    }
    if (_menuOn !== this.menuWasOn) this.menuWasOn = _menuOn;
    const _show = _menuOn && !(this.joinRoomUI && this.joinRoomUI.enabled);
    if (_show !== this.isShown) this.setShown(_show);
    if (this.isShown && this.pendingReveal) this.reveal();
    if (this.confirmGame && this.app.keyboard && this.app.keyboard.wasPressed(pc.KEY_ESCAPE)) this.closeConfirm();
};

// --- confirm ----------------------------------------------------------------------------

SkateboardObbyCrossPromo.prototype.onCardClick = function (_card) {
    if (this.travelling || this.confirmGame || !this.isShown || this.app.isWatchingAd) return;
    this.app.fire('skate:crossPromo', _card.eventKey, 'interact');
    this.openConfirm(_card, false);
};

SkateboardObbyCrossPromo.prototype.openConfirm = function (_card, _failed) {
    this.confirmGame = _card;
    this.confirmTitle.element.text = _failed ? "Couldn't load " + _card.game.name : 'Play ' + _card.game.name + '?';
    this.confirmNoteText.element.text = _failed ? 'Try again?' : this.confirmNote;
    this.playText.element.text = _failed ? 'Retry' : 'Play';
    this.confirmArt.element.texture = _card.asset.resource;
    this.confirmRoot.enabled = true;
    this.syncOrder();
    const _f = this.confirmFit();
    this.confirmWindow.setLocalScale(0.7 * _f, 0.7 * _f, 1);
    if (this.confirmWindow.tween) this.confirmWindow.tween(this.confirmWindow.getLocalScale()).to(new pc.Vec3(_f, _f, 1), 0.2, pc.BackOut).start();
    else this.confirmWindow.setLocalScale(_f, _f, 1);
};

SkateboardObbyCrossPromo.prototype.closeConfirm = function () {
    this.confirmGame = null;
    if (this.confirmRoot) this.confirmRoot.enabled = false;
};

SkateboardObbyCrossPromo.prototype.onPlay = function () {
    const _card = this.confirmGame;
    if (!_card || this.travelling) return;
    this.closeConfirm();
    this.app.fire('skate:crossPromo', _card.eventKey, 'start');
    this.travel(_card);
};

// --- the trip ---------------------------------------------------------------------------

SkateboardObbyCrossPromo.prototype.travel = function (_card) {
    this.travelling = true;
    const _id = ++this.travelId;
    const _panel = this.app.skateWorldsPanel;
    if (_panel) {
        _panel.travelling = true;
        _panel.showTravelScreen(_card.game.name);
    }
    if (this.menu) this.menu.enabled = false;   // app.menuPanelEnabled stays on: camera, joystick and pointer lock stay as they were
    if (this.app.gameplayStarted) {
        this.app.gameplayStarted = false;
        if (typeof PokiSDK !== 'undefined') PokiSDK.gameplayStop();
    }
    this.runTravel(_card, _id);
};

SkateboardObbyCrossPromo.prototype.runTravel = async function (_card, _id) {
    const S = SkateboardObbyCrossPromo;
    const _game = _card.game;
    const _items = this.app.playerItemManager;
    if (_items && _items.saveDatas) { try { _items.saveDatas(); } catch (e) { console.warn(e); } }
    const _network = this.app.skateboardObbyNetworkManager;
    if (_network && _network.room) {
        try { await Promise.race([_network.room.leave(), new Promise(r => setTimeout(r, S.LEAVE_TIMEOUT))]); } catch (e) { console.warn(e); }
    }
    if (this.dead || _id !== this.travelId) return;

    if (!await this.loadTagged(_game.tag || _game.scene, _id)) {
        if (!this.dead && _id === this.travelId) this.onTravelFailed(_card, 'assets');
        return;
    }
    if (this.dead || _id !== this.travelId) return;

    const _app = this.app, _what = _card.eventKey;
    // an ad like every other entry from the Menu; loading comes first so the ad does not sit on top of a failed trip
    const _change = () => {
        if (this.dead || _id !== this.travelId) return;
        try {
            _app.scenes.changeScene(_game.scene, (err) => {
                if (err) {
                    if (!this.dead && _id === this.travelId) this.onTravelFailed(_card, err);
                    return;
                }
                // this script is gone by now, the app is not: Analytics waits for this after a start
                _app.fire('skate:crossPromoEnd', _what, 'complete');
            });
        } catch (e) {
            this.onTravelFailed(_card, e);
        }
    };
    if (typeof watchCommercial === 'function') watchCommercial(_change);
    else _change();
};

// true = all tagged assets are in; false = an asset failed or nothing finished for Stall Timeout
SkateboardObbyCrossPromo.prototype.loadTagged = function (_tag, _id) {
    const _assets = this.app.assets.findByTag(_tag).filter(a => !a.loaded);
    const _panel = this.app.skateWorldsPanel;
    if (!_assets.length) return Promise.resolve(true);
    return new Promise((res) => {
        let _left = _assets.length, _timer = 0, _done = false;
        const _errors = [];
        const _finish = (_ok) => {
            if (_done) return;
            _done = true;
            clearTimeout(_timer);
            for (let i = 0; i < _errors.length; i++) this.app.assets.off(_errors[i].name, _errors[i].fn);
            res(_ok);
        };
        const _stall = () => {
            clearTimeout(_timer);
            _timer = setTimeout(() => _finish(false), this.stallTimeout * 1000);
        };
        if (_panel) _panel.setTravelProgress(0, _assets.length);
        _stall();
        _assets.forEach((a) => {
            const _name = 'error:' + a.id, _fn = () => _finish(false);
            _errors.push({ name: _name, fn: _fn });
            this.app.assets.once(_name, _fn);
            a.ready(() => {
                if (_done || _id !== this.travelId) return;
                _left--;
                if (_panel) _panel.setTravelProgress(_assets.length - _left, _assets.length);
                if (_left <= 0) _finish(true);
                else _stall();
            });
            this.app.assets.load(a);
        });
    });
};

// Still in this scene: loading screen off, Menu back with a Retry window, back to the room.
SkateboardObbyCrossPromo.prototype.onTravelFailed = function (_card, _err) {
    console.warn('[SkateboardObby] cross promo trip failed:', _err);
    this.travelId++;
    this.travelling = false;
    this.app.fire('skate:crossPromoEnd', _card.eventKey, 'fail');
    const _panel = this.app.skateWorldsPanel;
    if (_panel) {
        _panel.travelling = false;
        if (_panel.travelScreen) _panel.travelScreen.enabled = false;
        if (_panel.window) _panel.window.enabled = true;   // the screen hid it; its Body is still off
    }
    const _nm = this.app.skateboardObbyNetworkManager;
    if (_nm && _nm.room) _nm.onRoomLeft(_nm.room, 0);   // the room was left on the way: same path as a lost connection
    if (this.menu && this.app.menuPanelEnabled && !this.app.deadMenuEnabled) {
        this.menu.enabled = true;
        this.menuWasOn = true;
        this.setShown(true);
        this.openConfirm(_card, true);
    } else {
        this.app.fire('WarningTextController:setWarning', "Couldn't load " + _card.game.name + ', try again', 5, new pc.Color(1, 0, 0, 1));
    }
};
