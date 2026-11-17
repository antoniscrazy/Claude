// Worlds panel (world select), copied from MonkeyObby_WorldsPanel (Monkey's script and template are not used here).
// - Opens from the HUD globe button (2D Screen/LeftCorner/WorldsButton), the G key and the Worlds portals
//   (SkateboardObby_WorldsPortal: finish island + lobby). ESC / X / clicking outside closes.
// - One card per world: photo, name, info line and a button:
//     GO (green)          -> dark loading screen (like the menu's), save, leave the server room, load the scene's tagged assets, change scene
//     HERE (blue)         -> the world you are in
//     SOON / lock (grey)  -> coming soon / locked: a short "Coming soon!" pop on the card, the button shakes
//   A tap on the photo does the same as the button.
// - Same template in every world's scene: "You are here" comes from NetworkManager.sceneName. Finishing a world (skate:finished)
//   sets the next world's Unlock Save Key.
// - While open: app.isMarketEnabled = true (like the shop: blocks movement, joystick, camera and the ESC menu),
//   lockCamera, black background, Poki gameplayStop (gameplayStart comes back with the first move, as for the shop).
// - Online counter (bottom left of a card): players in that world, by the card's Room Name, asked only while the panel
//   is open (on open, then every 15 s) from the server's /skateboardWorldsOnline ({ ccu, worlds: { <roomName>: n } }).
//   New world = a new entry in "Worlds" (and its room in the server's skateboardRooms list), no code. Coming soon = no number.
//   A server without that endpoint (404) falls back to /skateboardOnline ({ ccu } = the whole mode, shown only while
//   one world is open). The current world's card never shows less than the room we are in (NetworkManager.onlineCount).
//   No number = hidden, never "NaN".
// - Scroll follows CLAUDE.md 2.4 (beginDrag / moveDrag / endDrag, finger identifier, TOUCHCANCEL, clamp, isFinite).
// - Photos: textures tagged SkateboardObby (the menu loads them); they are also loaded here in the background.
var SkateboardObbyWorldsPanel = pc.createScript('skateboardObbyWorldsPanel');

SkateboardObbyWorldsPanel.attributes.add('worlds', {
    type: 'json', array: true, title: 'Worlds',
    schema: [
        { name: 'title', type: 'string', default: 'World 1', title: 'Title' },
        { name: 'sceneName', type: 'string', default: 'SkateboardObby', title: 'Scene Name' },
        { name: 'image', type: 'asset', assetType: 'texture', title: 'Photo' },
        { name: 'comingSoon', type: 'boolean', default: false, title: 'Coming Soon' },
        { name: 'unlockSaveKey', type: 'string', default: '', title: 'Unlock Save Key', description: 'The world is open when this save key is "1" (e.g. SkateboardObby_Completed = World 1 finished). Empty = always open.' },
        { name: 'lockedText', type: 'string', default: 'Finish World 1 to unlock', title: 'Locked Text', description: 'Info line while locked.' },
        { name: 'roomName', type: 'string', default: '', title: 'Room Name', description: 'Server room of this world (its NetworkManager room) for the online counter. Empty = no counter.' }
    ]
});
SkateboardObbyWorldsPanel.attributes.add('openButton', { type: 'entity', title: 'Open Button', description: 'Empty = the entity named WorldsButton.' });
SkateboardObbyWorldsPanel.attributes.add('hereSprite', { type: 'asset', assetType: 'sprite', title: 'HERE Button Sprite', description: 'Button of the world you are in (game blue button). GO uses the template GoButton sprite.' });
SkateboardObbyWorldsPanel.attributes.add('lockedSprite', { type: 'asset', assetType: 'sprite', title: 'Locked Button Sprite', description: 'Button of a locked / coming soon world (game grey button).' });
SkateboardObbyWorldsPanel.attributes.add('hotkey', { type: 'string', default: 'G', title: 'Hotkey', description: 'One letter. Empty = no key.' });
SkateboardObbyWorldsPanel.attributes.add('currentSceneName', { type: 'string', default: '', title: 'Current Scene Name', description: 'Empty = NetworkManager.sceneName (the same template works in every world).' });
SkateboardObbyWorldsPanel.attributes.add('travelIcon', { type: 'asset', assetType: 'texture', title: 'Loading Indicator', description: 'Spins on the loading screen of a world change.' });
SkateboardObbyWorldsPanel.attributes.add('soonMessage', { type: 'string', default: 'Coming soon!', title: 'Coming Soon Message', description: 'Pops on the card when a coming soon world is pressed.' });
SkateboardObbyWorldsPanel.attributes.add('worldsOnlinePath', { type: 'string', default: '/skateboardWorldsOnline', title: 'Worlds Online Path', description: 'Server endpoint with players per room: { ccu, worlds: { <roomName>: players } }. Empty = only Online Path.' });
SkateboardObbyWorldsPanel.attributes.add('onlinePath', { type: 'string', default: '/skateboardOnline', title: 'Online Path', description: 'Older endpoint, used when the server answers 404 to the one above: { ccu } = players of the whole mode. Empty = only the connected room.' });
SkateboardObbyWorldsPanel.attributes.add('maxVisibleCards', { type: 'number', default: 2.5, title: 'Max Visible Cards', description: 'More worlds than this scroll (the half card shows there is more).' });
SkateboardObbyWorldsPanel.attributes.add('cardGap', { type: 'number', default: 20, title: 'Card Gap' });
SkateboardObbyWorldsPanel.attributes.add('fitMargin', { type: 'number', default: 0.92, title: 'Fit Margin', description: 'Part of the screen height the panel may use.' });
SkateboardObbyWorldsPanel.attributes.add('photoPreloadDelay', { type: 'number', default: 2, title: 'Photo Preload Delay (s)', description: 'Photos not loaded yet start loading this long after the scene starts. -1 = only when the panel opens.' });

SkateboardObbyWorldsPanel.TOP = 84;       // window top edge -> list top (title tab area)
SkateboardObbyWorldsPanel.BOTTOM = 34;    // list bottom -> window bottom edge
SkateboardObbyWorldsPanel.SEEN_KEY = 'SkateboardObby_WorldsPanelSeenAll';
SkateboardObbyWorldsPanel.ONLINE_INTERVAL = 15;   // s between two requests (reopening sooner shows the last numbers)
SkateboardObbyWorldsPanel.ONLINE_TIMEOUT = 5000;  // ms
SkateboardObbyWorldsPanel.ONLINE_MAX_FAILS = 2;   // failed requests in a row (no server / no CORS) -> ask less often
SkateboardObbyWorldsPanel.ONLINE_SLOW_INTERVAL = 60;   // s between two requests after that
SkateboardObbyWorldsPanel.ONLINE_PAD = 16;        // Online strip: space right of the number
SkateboardObbyWorldsPanel.DRAG_THRESHOLD = 8;     // panel units; a longer drag is not a click
SkateboardObbyWorldsPanel.LEAVE_TIMEOUT = 3000;   // ms; a dead connection must not hold a world change
SkateboardObbyWorldsPanel.ASSET_TIMEOUT = 30000;  // ms; the scene changes anyway, its renders load on their own

SkateboardObbyWorldsPanel.prototype.initialize = function () {
    this.app.skateWorldsPanel = this;
    this.isOpen = false;
    this.travelling = false;
    this.cards = [];
    this.scrollY = 0;
    this.scrollTarget = 0;
    this.scrollMax = 0;
    this.listH = 0;
    this.drag = null;
    this.dragMoved = false;
    this.fitScale = 1;
    this.refreshTimer = 0;
    this.preloadTimer = this.photoPreloadDelay;
    this.hintTime = 0;
    this.hintAlpha = 0;
    this.hintBaseY = 0;
    this.nudge = -1;
    this.userScrolled = false;
    this.closedAt = -1e9;        // Date.now() of the last close (portals wait a few seconds after it)
    this.online = null;          // { roomName: players } of the last good answer, null = none
    this.onlineTimer = 0;
    this.onlineLast = 0;         // Date.now() of the last request
    this.onlineSeq = 0;          // request id; answers of older ids are dropped
    this.onlineBusy = false;
    this.onlineAbort = null;
    this.onlineTimeout = null;
    this.onlineFails = 0;
    this.onlineRoute = this.worldsOnlinePath || this.onlinePath;   // endpoint in use
    this.onlineRetry = false;    // the endpoint was missing: ask the older one right away
    this.onlineOff = !this.onlineRoute;   // no endpoint left (404) = no more requests in this scene
    this.seenAll = typeof SkateboardObby_Utils !== 'undefined' && SkateboardObby_Utils.getItem(SkateboardObbyWorldsPanel.SEEN_KEY) === '1';
    this.setHotkey();
    this.on('attr:hotkey', this.setHotkey, this);

    const _f = (n) => this.entity.findByName(n);
    this.body = _f('Body');
    this.blocker = _f('Blocker');
    this.window = _f('Window');
    this.closeButton = _f('CloseButton');
    this.list = _f('List');
    this.content = _f('Content');
    this.cardTemplate = _f('CardTemplate');
    this.scrollTrack = _f('ScrollTrack');
    this.scrollHandle = _f('ScrollHandle');
    this.scrollHint = _f('ScrollHint');
    if (!this.openButton) this.openButton = this.app.root.findByName('WorldsButton');

    if (this.cardTemplate) this.cardTemplate.enabled = false;
    if (this.body) this.body.enabled = false;
    this.preloadUi();

    // template card measurements (layout follows whatever is set in the editor)
    const _te = this.cardTemplate && this.cardTemplate.element;
    this.cardW = _te ? _te.width : 700;
    this.cardH = _te ? _te.height : 219;
    this.winW = this.window && this.window.element ? this.window.element.width : 800;

    // cards are cloned once here, while the scene loads (cloning them on open is a visible hitch)
    this.buildCards();

    const _click = (e, fn) => { if (e && e.button) e.button.on('click', fn, this); };
    _click(this.openButton, () => this.toggle());
    _click(this.closeButton, () => this.close());
    _click(this.blocker, () => this.close());
    _click(this.scrollHint, () => { this.userScrolled = true; this.setScroll(this.scrollTarget + this.cardH + this.cardGap); });

    this.setupScroll();
    this.app.on('MarketClose', this.onMarketClose, this);
    this.app.on('skate:finished', this.onWorldFinished, this);
    this.app.graphicsDevice.on('resizecanvas', this.onResize, this);
    this.on('destroy', this.onDestroy, this);
};

SkateboardObbyWorldsPanel.prototype.onDestroy = function () {
    this.cancelOnline();
    this.endDrag();
    this.app.off('MarketClose', this.onMarketClose, this);
    this.app.off('skate:finished', this.onWorldFinished, this);
    this.app.graphicsDevice.off('resizecanvas', this.onResize, this);
    if (this.app.mouse) this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onWheel, this);
    if (this.isOpen) this.app.isMarketEnabled = false;   // scene change while open (GO)
    if (this.app.skateWorldsPanel === this) this.app.skateWorldsPanel = null;
};

SkateboardObbyWorldsPanel.prototype.setHotkey = function () {
    const _k = this.hotkey ? pc['KEY_' + String(this.hotkey).toUpperCase()] : undefined;
    this.hotkeyCode = _k === undefined ? -1 : _k;
};

// --- worlds -----------------------------------------------------------------

SkateboardObbyWorldsPanel.prototype.currentScene = function () {
    if (this.currentSceneName) return this.currentSceneName;
    const _nm = this.app.skateboardObbyNetworkManager;
    return (_nm && _nm.sceneName) || 'SkateboardObby';
};

SkateboardObbyWorldsPanel.prototype.assetOf = function (_v) {
    if (!_v) return null;
    if (_v instanceof pc.Asset) return _v;
    return this.app.assets.get(_v) || null;
};

SkateboardObbyWorldsPanel.prototype.isUnlocked = function (_w) {
    if (_w.comingSoon) return false;
    if (!_w.unlockSaveKey || typeof SkateboardObby_Utils === 'undefined') return true;
    const _v = SkateboardObby_Utils.getItem(_w.unlockSaveKey);
    return _v === '1' || _v === 'true';
};

// Finishing a world opens the next one. Written here too because Analytics.finishMap skips its Completed flag for a
// player who resumes at the last checkpoint, and that player would never unlock the next world.
SkateboardObbyWorldsPanel.prototype.onWorldFinished = function () {
    const _next = this.nextWorld();
    if (_next && _next.unlockSaveKey && typeof SkateboardObby_Utils !== 'undefined') SkateboardObby_Utils.setItem(_next.unlockSaveKey, '1');
};

// the entry after the world you are in, null = none
SkateboardObbyWorldsPanel.prototype.nextWorld = function () {
    const _list = this.worlds || [];
    const _i = _list.findIndex(w => w && w.sceneName === this.currentScene());
    return (_i >= 0 && _list[_i + 1]) || null;
};

// --- open / close -------------------------------------------------------------

SkateboardObbyWorldsPanel.prototype.canOpen = function () {
    const a = this.app;
    const _pc = a.skateboardObbyPlayerController;
    return !a.isWatchingAd && !(_pc && _pc.isDied) && !a.menuPanelEnabled && !a.deadMenuEnabled && !a.isPopupEnabled &&
        !(a.numpad && a.numpad.enabled) && !a.inCutscene && !a.isMarketEnabled;
};

SkateboardObbyWorldsPanel.prototype.toggle = function () {
    if (this.isOpen) this.close(); else this.open();
};

// returns true when the panel opened
SkateboardObbyWorldsPanel.prototype.open = function () {
    if (this.isOpen || this.travelling || !this.body || !this.canOpen()) return false;
    this.isOpen = true;
    this.app.isMarketEnabled = true;
    this.body.enabled = true;
    this.endDrag();
    this.loadPhotos();
    for (let i = 0; i < this.cards.length; i++) this.refreshCard(this.cards[i]);
    this.refreshTimer = 0.5;
    this.onlineTimer = Math.max(0, SkateboardObbyWorldsPanel.ONLINE_INTERVAL - (Date.now() - this.onlineLast) / 1000);   // first update asks if the numbers are old
    this.applyOnline();
    this.layout();
    this.setScroll(0, true);
    this.userScrolled = false;
    this.nudge = this.scrollMax > 0 && !this.seenAll ? 0 : -1;   // show once that the list scrolls
    this.hintTime = 0;
    this.hintAlpha = this.seenAll ? 0 : 1;

    const _f = this.computeFit();
    if (this.window) {
        this.window.setLocalScale(0.5 * _f, 0.5 * _f, 1);
        if (this.window.tween) this.window.tween(this.window.getLocalScale()).to(new pc.Vec3(_f, _f, 1), 0.3, pc.BackOut).start();
        else this.window.setLocalScale(_f, _f, 1);
    }
    const _c = this.app.skateboardObbyPlayerController;
    if (_c && _c.stopMovement) _c.stopMovement();
    if (this.app.gameplayStarted) {
        this.app.gameplayStarted = false;
        if (typeof PokiSDK !== 'undefined') PokiSDK.gameplayStop();
    }
    this.app.fire('lockCamera', true);
    const _nm = this.app.skateboardObbyNetworkManager;
    if (_nm && _nm.setBlackBG) _nm.setBlackBG(true);
    this.app.fire('skate:worldsPanel', true);
    return true;
};

SkateboardObbyWorldsPanel.prototype.close = function () {
    if (!this.isOpen || this.travelling) return;
    this.isOpen = false;
    this.closedAt = Date.now();
    this.app.isMarketEnabled = false;
    this.endDrag();
    if (this.onlineBusy) { this.cancelOnline(); this.onlineLast = 0; }   // requests only while open; the next open asks again
    const _f = this.fitScale || 1;
    const _done = () => { if (this.isOpen) return; /* reopened while closing */ this.body.enabled = false; if (this.window) this.window.setLocalScale(_f, _f, 1); };
    if (this.window && this.window.tween) this.window.tween(this.window.getLocalScale()).to(new pc.Vec3(0.6 * _f, 0.6 * _f, 1), 0.12, pc.BackIn).onComplete(_done).start();
    else _done();
    this.app.fire('lockCamera', false);
    const _nm = this.app.skateboardObbyNetworkManager;
    if (_nm && _nm.setBlackBG) _nm.setBlackBG(false);
    this.app.fire('skate:worldsPanel', false);
};

SkateboardObbyWorldsPanel.prototype.onMarketClose = function () {
    if (this.isOpen && !this.travelling) this.close();
};

SkateboardObbyWorldsPanel.prototype.computeFit = function () {
    let _f = 1;
    const _screen = this.entity.element && this.entity.element.screen && this.entity.element.screen.screen;
    const _h = this.window && this.window.element ? this.window.element.height : 600;
    if (_screen && _screen.scale > 0) {
        const _sh = _screen.resolution.y / _screen.scale;
        const _sw = _screen.resolution.x / _screen.scale;
        _f = Math.min(1, (_sh * this.fitMargin) / Math.max(1, _h + 40), (_sw * 0.96) / Math.max(1, this.winW + 80));
    }
    this.fitScale = _f;
    return _f;
};

SkateboardObbyWorldsPanel.prototype.onResize = function () {
    if (!this.isOpen || !this.window) return;
    setTimeout(() => { if (!this.isOpen) return; const _f = this.computeFit(); this.window.setLocalScale(_f, _f, 1); }, 0);
};

// --- cards ---------------------------------------------------------------------

SkateboardObbyWorldsPanel.prototype.buildCards = function () {
    this.cards.forEach(c => c.entity.destroy());
    this.cards.length = 0;
    if (!this.cardTemplate || !this.content) return;
    const _list = this.worlds || [];
    for (let i = 0; i < _list.length; i++) {
        const _w = _list[i];
        if (!_w) continue;
        const e = this.cardTemplate.clone();
        e.name = 'Card_' + (i + 1);
        e.enabled = true;
        this.content.addChild(e);
        const _card = {
            world: _w, entity: e, index: this.cards.length,
            photo: e.findByName('Photo'), photoMask: e.findByName('PhotoMask'), dim: e.findByName('Dim'),
            name: e.findByName('Name'), info: e.findByName('Info'),
            button: e.findByName('GoButton'), text: e.findByName('GoText'), lock: e.findByName('GoLock'),
            toast: e.findByName('Toast'), toastLabel: e.findByName('ToastLabel'), toastTween: null,
            online: e.findByName('Online'), onlineText: e.findByName('OnlineCount'), onlineValue: null,
            state: null
        };
        if (_card.name) _card.name.element.text = _w.title || ('World ' + (i + 1));
        if (_card.toast) _card.toast.enabled = false;
        const _a = this.assetOf(_w.image);
        if (_card.photo) {
            if (_a) {
                _card.photo.element.textureAsset = _a.id;
                _card.photo.element.color = new pc.Color(1, 1, 1);
            } else {
                _card.photo.element.textureAsset = null;
                _card.photo.element.color = new pc.Color(0.25, 0.32, 0.4);
            }
        }
        if (_card.button && _card.button.button) _card.button.button.on('click', () => this.onCardClick(_card), this);
        if (_card.photoMask && _card.photoMask.element) {
            _card.photoMask.element.useInput = true;   // a tap on the photo = the button (drags bubble up to the list)
            _card.photoMask.element.on('click', () => this.onCardClick(_card), this);
        }
        this.cards.push(_card);
        this.refreshCard(_card);
    }
    this.hasOnline = this.cards.some(c => c.online && c.world.roomName && !c.world.comingSoon);
    this.applyOnline();
};

SkateboardObbyWorldsPanel.prototype.refreshCard = function (_card) {
    const _w = _card.world;
    const _here = _w.sceneName === this.currentScene();
    const _state = _w.comingSoon ? 'soon' : _here ? 'here' : this.isUnlocked(_w) ? 'go' : 'locked';
    if (_state === _card.state) return;
    _card.state = _state;

    const _info = _state === 'here' ? '[color="#ffe14d"]You are here[/color]' : _state === 'soon' ? '[color="#ffe14d"]Coming soon...[/color]' :
        _state === 'locked' ? '[color="#ff6b5e"]' + (_w.lockedText || 'Locked') + '[/color]' : '';
    if (_card.info && _card.info.element.text !== _info) _card.info.element.text = _info;

    // the game's button sprites: GO = green (template), HERE = blue, locked / soon = grey (same as the shop)
    if (_card.button && _card.button.element) {
        _card.button.element.spriteAsset = _state === 'go' ? this.greenSprite() : _state === 'here' ? this.blueSprite() : this.greySprite();
        _card.button.element.color = new pc.Color(1, 1, 1);
    }
    const _b = _card.button && _card.button.button;
    if (_b) {
        _b.inactiveTint = new pc.Color(1, 1, 1, 1);   // HERE stays full colour while not clickable
        _b.active = _state !== 'here';
    }
    if (_card.text) {
        _card.text.enabled = _state !== 'locked';
        _card.text.element.text = _state === 'go' ? 'GO' : _state === 'here' ? 'HERE' : 'SOON';
        _card.text.element.fontSize = _state === 'go' ? 50 : 40;
    }
    if (_card.lock) _card.lock.enabled = _state === 'locked';
    if (_card.dim) _card.dim.enabled = _state === 'locked';   // the coming soon photo is dark already
};

// sprites: taken from the template so the editor stays the source of truth
SkateboardObbyWorldsPanel.prototype.greenSprite = function () {
    if (this._green === undefined) { const b = this.cardTemplate && this.cardTemplate.findByName('GoButton'); this._green = b && b.element ? b.element.spriteAsset : null; }
    return this._green;
};
SkateboardObbyWorldsPanel.prototype.blueSprite = function () {
    if (this._blue === undefined) {
        const _a = this.assetOf(this.hereSprite) || this.app.assets.find('btn-dark-blu', 'sprite');
        this._blue = _a ? _a.id : this.greenSprite();
    }
    return this._blue;
};
SkateboardObbyWorldsPanel.prototype.greySprite = function () {
    if (this._grey === undefined) {
        const _a = this.assetOf(this.lockedSprite) || this.app.assets.find('btn-dark-gry', 'sprite');
        this._grey = _a ? _a.id : this.blueSprite();
    }
    return this._grey;
};

SkateboardObbyWorldsPanel.prototype.loadPhotos = function () {
    (this.worlds || []).forEach(w => { const a = w && this.assetOf(w.image); if (a && !a.loaded && !a.loading) this.app.assets.load(a); });
};

// The panel's small UI art (frame, close button, lock, blue / grey buttons...) is not preloaded by the project;
// load it with the scene so the first open has no plain rectangles. Photos: tagged (menu) or update().
SkateboardObbyWorldsPanel.prototype.preloadUi = function () {
    const _ids = [this.blueSprite(), this.greySprite()];
    const _icon = this.assetOf(this.travelIcon);
    if (_icon) _ids.push(_icon.id);
    const _photos = (this.worlds || []).map(w => { const a = w && this.assetOf(w.image); return a ? a.id : null; });
    const _walk = (e) => {
        const el = e.element;
        if (el) {
            if (el.spriteAsset) _ids.push(el.spriteAsset);
            if (el.textureAsset && _photos.indexOf(el.textureAsset) < 0) _ids.push(el.textureAsset);
            if (el.fontAsset) _ids.push(el.fontAsset);
        }
        for (let i = 0; i < e.children.length; i++) _walk(e.children[i]);
    };
    _walk(this.entity);
    if (this.openButton) _walk(this.openButton);
    _ids.forEach(id => { const a = id && this.app.assets.get(id); if (a && !a.loaded && !a.loading) this.app.assets.load(a); });
};

SkateboardObbyWorldsPanel.prototype.onCardClick = function (_card) {
    if (!this.isOpen || this.dragMoved || this.travelling) return;   // a drag on the list is not a click
    if (_card.state === 'go') { this.travel(_card); return; }
    if (_card.state === 'locked' || _card.state === 'soon') {
        const gm = this.app.gameManager;
        if (gm && gm.sfx_warning) { try { gm.sfx_warning(); } catch (e) { } }
        this.shake(_card.button);
        if (_card.state === 'locked') this.pulse(_card.info);
        this.showToast(_card, _card.state === 'soon' ? this.soonMessage : (_card.world.lockedText || 'Locked'));
    }
};

// short message on the card (Toast = dark pill, ToastLabel = text; inside the list mask), pops in and fades out
SkateboardObbyWorldsPanel.prototype.showToast = function (_card, _text) {
    const t = _card.toast, l = _card.toastLabel || t;
    if (!t || !t.element || !l.element || !_text) return;
    if (_card.toastTween) _card.toastTween.stop();
    t.enabled = true;
    if (l.element.text !== _text) l.element.text = _text;
    if (l !== t) t.element.width = l.element.width + 64;   // pill follows the text (autoWidth)
    // a long text (locked world) must not leave the card: the list mask would cut it
    const _fit = Math.min(1, (this.cardW - 2 * Math.abs(t.getLocalPosition().x) - 24) / Math.max(1, t.element.width));
    const _bgOpacity = t._wpOpacity === undefined ? (t._wpOpacity = t.element.opacity) : t._wpOpacity;
    t.setLocalScale(0.5 * _fit, 0.5 * _fit, 1);
    const _o = { t: 0 };
    const _fade = (a) => { if (l !== t) { t.element.opacity = _bgOpacity * a; l.element.opacity = a; } else t.element.opacity = a; };
    _fade(1);
    _card.toastTween = t.tween(_o).to({ t: 1 }, 1.5, pc.Linear).onUpdate(() => {
        const _s = (_o.t < 0.12 ? 0.5 + 0.6 * pc.BackOut(_o.t / 0.12) : 1.1 - 0.1 * Math.min(1, (_o.t - 0.12) / 0.12)) * _fit;
        t.setLocalScale(_s, _s, 1);
        _fade(_o.t < 0.72 ? 1 : 1 - (_o.t - 0.72) / 0.28);
    }).onComplete(() => { t.enabled = false; _card.toastTween = null; }).start();
};

SkateboardObbyWorldsPanel.prototype.pulse = function (_e) {
    if (!_e || !_e.tween) return;
    if (_e._wpPulse) _e._wpPulse.stop();
    _e.setLocalScale(1.35, 1.35, 1);
    _e._wpPulse = _e.tween(_e.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.4, pc.BackOut).start();
};

SkateboardObbyWorldsPanel.prototype.shake = function (_e) {
    if (!_e || !_e.tween) return;
    if (!_e._wpBase) _e._wpBase = _e.getLocalPosition().clone();   // the first rest position (a shake may still run)
    if (_e._wpShake) _e._wpShake.stop();
    const _p = _e._wpBase;
    const _o = { t: 0 };
    _e._wpShake = _e.tween(_o).to({ t: 1 }, 0.35, pc.Linear).onUpdate(() => {
        _e.setLocalPosition(_p.x + Math.sin(_o.t * Math.PI * 6) * 10 * (1 - _o.t), _p.y, _p.z);
    }).onComplete(() => { _e.setLocalPosition(_p); _e._wpShake = null; }).start();
};

SkateboardObbyWorldsPanel.prototype.travel = function (_card) {
    if (!this.travelTo(_card.world.sceneName, _card.world.title)) this.showToast(_card, this.soonMessage);
};

// Also for a room code of another world (NetworkManager). false = no such scene (a build must include it).
SkateboardObbyWorldsPanel.prototype.travelTo = function (_scene, _title) {
    if (this.travelling || !_scene || !this.app.scenes.find(_scene)) return false;
    this.travelling = true;
    this.cards.forEach(c => { if (c.button && c.button.button) c.button.button.active = false; });
    this.showTravelScreen(_title);
    if (window.LoadingBackdrop) LoadingBackdrop.show(this.app, _scene, this.travelScreen, 0);
    this.runTravel(_scene);
    return true;
};

// same path as the menu: tagged assets of the scene, then the scene (save + leave the room first)
SkateboardObbyWorldsPanel.prototype.runTravel = async function (_scene) {
    const S = SkateboardObbyWorldsPanel;
    const _items = this.app.playerItemManager;
    if (_items && _items.saveDatas) { try { _items.saveDatas(); } catch (e) { console.log(e); } }
    const _network = this.app.skateboardObbyNetworkManager;
    if (_network && _network.room) {
        try { await Promise.race([_network.room.leave(), new Promise(r => setTimeout(r, S.LEAVE_TIMEOUT))]); } catch (e) { console.log(e); }
    }
    const _assets = this.app.assets.findByTag(_scene).filter(a => !a.loaded);
    if (_assets.length) {
        await new Promise((res) => {
            let _left = _assets.length;
            const _timer = setTimeout(res, S.ASSET_TIMEOUT);
            this.setTravelProgress(0, _assets.length);
            _assets.forEach(a => {
                a.ready(() => {
                    _left--;
                    this.setTravelProgress(_assets.length - _left, _assets.length);
                    if (_left <= 0) { clearTimeout(_timer); res(); }
                });
                this.app.assets.load(a);
            });
        });
    }
    this.app.scenes.changeScene(_scene, (err) => { if (err) this.onTravelFailed(err); });
};

// The scene did not load (network): back to this world, back online.
SkateboardObbyWorldsPanel.prototype.onTravelFailed = function (_err) {
    console.warn('[SkateboardObby] world change failed:', _err);
    this.travelling = false;
    if (this.travelScreen) this.travelScreen.enabled = false;
    if (this.window) this.window.enabled = true;
    this.cards.forEach(c => { c.state = null; this.refreshCard(c); });
    this.app.fire('WarningTextController:setWarning', "Couldn't load the world, try again", 5, new pc.Color(1, 0, 0, 1));
    const _nm = this.app.skateboardObbyNetworkManager;
    if (_nm && _nm.room) _nm.onRoomLeft(_nm.room, 0);   // the room was left on the way here: same path as a lost connection
};

// Same look as the menu's LoadingPanel. Built on the first world change, on top of the whole panel.
SkateboardObbyWorldsPanel.prototype.showTravelScreen = function (_title) {
    if (!this.travelScreen) {
        const _src = this.cardTemplate && this.cardTemplate.findByName('Name');
        const _font = _src && _src.element ? _src.element.fontAsset : null;
        const _root = new pc.Entity('TravelScreen');
        _root.addComponent('element', { type: pc.ELEMENTTYPE_IMAGE, anchor: [0, 0, 1, 1], margin: [0, 0, 0, 0], pivot: [0.5, 0.5], color: new pc.Color(0, 0, 0), opacity: 0.8, useInput: true });
        this.entity.addChild(_root);
        const _text = (_name, _y, _color) => {
            const e = new pc.Entity(_name);
            e.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], alignment: [0.5, 0.5], fontAsset: _font, fontSize: 40, autoWidth: true, autoHeight: true, wrapLines: false, color: _color, text: '' });
            e.setLocalPosition(0, _y, 0);
            _root.addChild(e);
            return e;
        };
        const _icon = this.assetOf(this.travelIcon);
        if (_icon && _icon.loaded) {
            const e = new pc.Entity('TravelIcon');
            e.addComponent('element', { type: pc.ELEMENTTYPE_IMAGE, anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 128, height: 128, textureAsset: _icon.id });
            e.setLocalPosition(0, 44, 0);
            _root.addChild(e);
            this.travelIconEntity = e;
        }
        this.travelLabel = _text('TravelLabel', -57, new pc.Color(1, 0.667, 0));
        this.travelCount = _text('TravelCount', -112, new pc.Color(0, 1, 0));
        this.travelScreen = _root;
    }
    this.travelScreen.enabled = true;
    if (this.window) this.window.enabled = false;   // only the loading screen on the black background
    this.travelLabel.element.text = _title ? 'Loading ' + _title + '...' : 'Loading...';
    this.travelCount.element.text = '';
};

SkateboardObbyWorldsPanel.prototype.setTravelProgress = function (_done, _total) {
    if (this.travelCount) this.travelCount.element.text = _done + '/' + _total;
};

// --- online counters ----------------------------------------------------------------

// same server the game connects to (SkateboardObby_NetworkManager.getServerUrl, wss -> https)
SkateboardObbyWorldsPanel.prototype.onlineUrl = function () {
    const _nm = this.app.skateboardObbyNetworkManager;
    const _ws = _nm && _nm.getServerUrl ? _nm.getServerUrl() : 'wss://rainbowobby1.emolingo.games';
    return _ws.replace(/^ws/, 'http') + this.onlineRoute;
};

// 404: the server does not have this endpoint. Ask the older one, then no more requests in this scene.
SkateboardObbyWorldsPanel.prototype.onlineMissing = function () {
    if (this.onlinePath && this.onlineRoute !== this.onlinePath) {
        this.onlineRoute = this.onlinePath;
        this.onlineRetry = true;
    } else {
        this.onlineOff = true;
    }
};

SkateboardObbyWorldsPanel.prototype.fetchOnline = function () {
    this.onlineTimer = SkateboardObbyWorldsPanel.ONLINE_INTERVAL;
    if (this.onlineBusy || this.onlineOff || typeof fetch !== 'function') return;
    const _id = ++this.onlineSeq;
    const _abort = typeof AbortController !== 'undefined' ? new AbortController() : null;
    this.onlineBusy = true;
    this.onlineAbort = _abort;
    this.onlineLast = Date.now();
    this.onlineTimeout = setTimeout(() => { if (_abort) _abort.abort(); else this.onOnline(_id, null); }, SkateboardObbyWorldsPanel.ONLINE_TIMEOUT);
    fetch(this.onlineUrl(), _abort ? { signal: _abort.signal } : undefined)
        .then((r) => {
            if (r.status === 404 && _id === this.onlineSeq) this.onlineMissing();
            return r.ok ? r.json() : null;
        })
        .then((d) => this.onOnline(_id, d), () => this.onOnline(_id, null));
};

// answer of request _id -> { roomName: players } (null = failed); answers after destroy or of older requests are dropped
SkateboardObbyWorldsPanel.prototype.onOnline = function (_id, _d) {
    if (_id !== this.onlineSeq) return;
    clearTimeout(this.onlineTimeout);
    this.onlineBusy = false;
    this.onlineAbort = null;
    if (this.onlineRetry) {   // the older endpoint on the next update
        this.onlineRetry = false;
        this.onlineTimer = 0;
        return;
    }
    let _worlds = null;
    if (_d && typeof _d === 'object') {
        if (_d.worlds && typeof _d.worlds === 'object') _worlds = _d.worlds;
        else if (Number.isFinite(Number(_d.ccu))) {
            // older answer: players of the whole mode, it means one world's players only while one world is open
            const _open = (this.worlds || []).filter(w => w && w.roomName && !w.comingSoon);
            if (_open.length === 1) { _worlds = {}; _worlds[_open[0].roomName] = Number(_d.ccu); }
        }
    }
    this.onlineFails = _worlds ? 0 : this.onlineFails + 1;
    if (this.onlineFails >= SkateboardObbyWorldsPanel.ONLINE_MAX_FAILS) this.onlineTimer = SkateboardObbyWorldsPanel.ONLINE_SLOW_INTERVAL;
    this.online = _worlds;
    this.applyOnline();
};

SkateboardObbyWorldsPanel.prototype.cancelOnline = function () {
    this.onlineSeq++;
    clearTimeout(this.onlineTimeout);
    if (this.onlineAbort) this.onlineAbort.abort();
    this.onlineAbort = null;
    this.onlineBusy = false;
};

// players in the room we are connected to (counts ourselves); -1 = not connected
SkateboardObbyWorldsPanel.prototype.roomCount = function () {
    const _nm = this.app.skateboardObbyNetworkManager;
    if (!_nm || !_nm.room || !_nm.room.connection || _nm.room.connection.isOpen === false) return -1;
    const _n = Number(_nm.onlineCount);
    return Number.isFinite(_n) && _n > 0 ? Math.floor(_n) : -1;
};

// text and strip width change only when a card's number changes
SkateboardObbyWorldsPanel.prototype.applyOnline = function () {
    const _d = this.online;
    const _room = this.roomCount();
    for (let i = 0; i < this.cards.length; i++) {
        const c = this.cards[i];
        if (!c.online) continue;
        const _w = c.world;
        let _v = -1;   // -1 = no valid number (hidden, never "NaN")
        if (_w.roomName && !_w.comingSoon) {
            const _n = _d ? Number(_d[_w.roomName]) : NaN;
            if (Number.isFinite(_n) && _n >= 0) _v = Math.floor(_n);
            if (_w.sceneName === this.currentScene() && _room > _v) _v = _room;   // the server number is cached ~10 s
        }
        if (_v === c.onlineValue) continue;
        c.onlineValue = _v;
        c.online.enabled = _v >= 0;
        if (_v >= 0 && c.onlineText) {
            c.onlineText.element.text = this.formatOnline(_v);
            c.online.element.width = c.onlineText.getLocalPosition().x + c.onlineText.element.width + SkateboardObbyWorldsPanel.ONLINE_PAD;
        }
    }
};

SkateboardObbyWorldsPanel.prototype.formatOnline = function (_n) {
    return _n >= 10000 && typeof formatNumber === 'function' ? formatNumber(_n) : String(_n);
};

// --- layout + scrolling ------------------------------------------------------------

SkateboardObbyWorldsPanel.prototype.layout = function () {
    const S = SkateboardObbyWorldsPanel;
    const _n = this.cards.length;
    const _gap = this.cardGap, _h = this.cardH;
    const _contentH = Math.max(0, _n * _h + Math.max(0, _n - 1) * _gap);
    const _vis = Math.min(_n, Math.max(1, this.maxVisibleCards));
    const _listH = Math.max(_h, _vis * _h + Math.max(0, Math.ceil(_vis) - 1) * _gap);
    const _winH = S.TOP + _listH + S.BOTTOM;

    if (this.window && this.window.element) this.window.element.height = _winH;
    if (this.list && this.list.element) {
        this.list.element.height = _listH;
        this.list.setLocalPosition(0, _winH / 2 - S.TOP - _listH / 2, 0);
    }
    if (this.content && this.content.element) this.content.element.height = Math.max(_contentH, 1);
    for (let i = 0; i < _n; i++) this.cards[i].entity.setLocalPosition(0, -i * (_h + _gap), 0);

    this.listH = _listH;
    this.scrollMax = Math.max(0, _contentH - _listH);
    const _scroll = this.scrollMax > 0.5;
    if (this.scrollTrack) {
        this.scrollTrack.enabled = _scroll;
        if (_scroll) {
            this.scrollTrack.element.height = _listH;
            this.scrollTrack.setLocalPosition(this.scrollTrack.getLocalPosition().x, this.list.getLocalPosition().y, 0);
            if (this.scrollHandle) this.scrollHandle.element.height = Math.max(60, _listH * _listH / Math.max(1, _contentH));
        }
    }
    if (this.scrollHint) {
        this.scrollHint.enabled = _scroll && !this.seenAll;   // one-time hint
        this.hintBaseY = (this.list ? this.list.getLocalPosition().y : 0) - _listH / 2 + 4;   // on the list bottom edge
        this.scrollHint.setLocalPosition(0, this.hintBaseY, 0);
    }
};

// _instant: jump there (drag / opening); otherwise update() eases towards it
SkateboardObbyWorldsPanel.prototype.setScroll = function (_y, _instant) {
    if (!Number.isFinite(_y)) _y = Number.isFinite(this.scrollTarget) ? this.scrollTarget : 0;   // never write NaN
    const _max = Number.isFinite(this.scrollMax) ? Math.max(0, this.scrollMax) : 0;
    this.scrollTarget = pc.math.clamp(_y, 0, _max);
    if (_instant) this.applyScroll(this.scrollTarget);
};

SkateboardObbyWorldsPanel.prototype.applyScroll = function (_y) {
    if (!Number.isFinite(_y)) _y = 0;
    this.scrollY = _y;
    if (this.content) this.content.setLocalPosition(0, (this.listH || 0) / 2 + _y, 0);   // content top = list top
    if (this.scrollHandle && this.scrollTrack && this.scrollTrack.enabled) {
        const _th = this.scrollTrack.element.height, _hh = this.scrollHandle.element.height;
        const _t = this.scrollMax > 0 ? _y / this.scrollMax : 0;
        this.scrollHandle.setLocalPosition(0, (_th - _hh) / 2 - _t * (_th - _hh), 0);
    }
};

// bouncing double arrow on the list bottom; fades out near the end of the list
SkateboardObbyWorldsPanel.prototype.updateScrollHint = function (dt) {
    const _h = this.scrollHint;
    if (!_h || !_h.element) return;
    const _target = this.seenAll ? 0 : pc.math.clamp((this.scrollMax - this.scrollY - 6) / 40, 0, 1);
    this.hintAlpha += (_target - this.hintAlpha) * Math.min(1, dt * 10);
    if (Math.abs(_target - this.hintAlpha) < 0.01) this.hintAlpha = _target;
    const _on = this.hintAlpha > 0.01;
    if (_on !== _h.enabled) _h.enabled = _on;
    if (!_on) return;
    this.hintTime += dt;
    _h.element.opacity = this.hintAlpha;
    _h.setLocalPosition(0, this.hintBaseY - Math.abs(Math.sin(this.hintTime * 4)) * 9, 0);
};

SkateboardObbyWorldsPanel.prototype.setupScroll = function () {
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
SkateboardObbyWorldsPanel.prototype.dragScale = function () {
    const _screen = this.entity.element && this.entity.element.screen && this.entity.element.screen.screen;
    const gd = this.app.graphicsDevice;
    const _ratio = gd.canvas && gd.canvas.clientHeight ? gd.height / gd.canvas.clientHeight : 1;   // canvas px per CSS px
    const _s = (_screen && _screen.scale > 0 ? _screen.scale : 1) * (this.fitScale || 1);
    return _ratio / Math.max(0.01, _s);
};

SkateboardObbyWorldsPanel.prototype.beginDrag = function (_y, _touchId) {
    if (!this.isOpen || this.scrollMax <= 0 || !Number.isFinite(_y)) return;
    this.endDrag();
    this.drag = { y: _y, start: Number.isFinite(this.scrollY) ? this.scrollY : 0, touchId: (_touchId == null ? null : _touchId) };
    this.dragMoved = false;
    if (this.app.mouse) { this.app.mouse.on(pc.EVENT_MOUSEMOVE, this._onMove, this); this.app.mouse.on(pc.EVENT_MOUSEUP, this._onUp, this); }
    if (this.app.touch) { this.app.touch.on(pc.EVENT_TOUCHMOVE, this._onTouchMove, this); this.app.touch.on(pc.EVENT_TOUCHEND, this._onTouchEnd, this); this.app.touch.on(pc.EVENT_TOUCHCANCEL, this._onTouchEnd, this); }
};

SkateboardObbyWorldsPanel.prototype.moveDrag = function (_y) {
    // finger / mouse up -> the list moves up (lower cards come in)
    if (!this.drag || !Number.isFinite(_y)) return;
    const _d = (_y - this.drag.y) * this.dragScale();
    if (!Number.isFinite(_d)) return;
    if (Math.abs(_d) > SkateboardObbyWorldsPanel.DRAG_THRESHOLD) { this.dragMoved = true; this.userScrolled = true; }
    this.setScroll(this.drag.start - _d, true);
};

SkateboardObbyWorldsPanel.prototype.endDrag = function () {
    if (!this.drag) return;
    this.drag = null;
    if (this.app.mouse) { this.app.mouse.off(pc.EVENT_MOUSEMOVE, this._onMove, this); this.app.mouse.off(pc.EVENT_MOUSEUP, this._onUp, this); }
    if (this.app.touch) { this.app.touch.off(pc.EVENT_TOUCHMOVE, this._onTouchMove, this); this.app.touch.off(pc.EVENT_TOUCHEND, this._onTouchEnd, this); this.app.touch.off(pc.EVENT_TOUCHCANCEL, this._onTouchEnd, this); }
    if (this.dragMoved) setTimeout(() => { this.dragMoved = false; }, 0);   // the click from this release is ignored
};

SkateboardObbyWorldsPanel.prototype.onWheel = function (e) {
    if (!this.isOpen || this.scrollMax <= 0) return;
    this.userScrolled = true;
    this.setScroll(this.scrollTarget + (e.wheelDelta > 0 ? 1 : -1) * (this.cardH + this.cardGap) * 0.5);   // pc: wheelDelta > 0 = wheel down
};

// --- frame update -----------------------------------------------------------------

SkateboardObbyWorldsPanel.prototype.update = function (dt) {
    if (this.travelling && this.travelIconEntity) this.travelIconEntity.rotateLocal(0, 0, -200 * dt);

    // photos load in the background, so the first open shows them at once
    if (this.preloadTimer >= 0) {
        this.preloadTimer -= dt;
        if (this.preloadTimer < 0) this.loadPhotos();
    }

    const kb = this.app.keyboard;
    if (kb && !this.travelling && !this.app.isTypingEnabled) {
        if (this.isOpen && kb.wasPressed(pc.KEY_ESCAPE)) this.close();
        else if (this.hotkeyCode >= 0 && kb.wasPressed(this.hotkeyCode)) this.toggle();
    }
    if (!this.isOpen) return;

    // online counters: requests only while open
    if (this.hasOnline && !this.onlineOff) {
        this.onlineTimer -= dt;
        if (this.onlineTimer <= 0) this.fetchOnline();
    }

    // "there is more": nudge the list down and back once after the pop, until the player has seen the end
    if (this.nudge >= 0) {
        const _t0 = this.nudge;
        this.nudge += dt;
        if (this.userScrolled || this.drag) this.nudge = -1;
        else if (_t0 < 0.45 && this.nudge >= 0.45) this.setScroll(Math.min(this.scrollMax, this.cardH * 0.6));
        else if (this.nudge >= 1.25) { this.setScroll(0); this.nudge = -1; }
    }

    if (Math.abs(this.scrollTarget - this.scrollY) > 0.5) this.applyScroll(pc.math.lerp(this.scrollY, this.scrollTarget, Math.min(1, dt * (this.nudge >= 0 ? 7 : 14))));
    else if (this.scrollTarget !== this.scrollY) this.applyScroll(this.scrollTarget);

    if (this.scrollMax > 0) {
        if (!this.seenAll && this.userScrolled && this.scrollY > 20) {   // scrolled down once = knows the list scrolls
            this.seenAll = true;
            if (typeof SkateboardObby_Utils !== 'undefined') SkateboardObby_Utils.setItem(SkateboardObbyWorldsPanel.SEEN_KEY, '1');
        }
        this.updateScrollHint(dt);
    }

    // card states (unlock keys) and the connected room's count, twice a second while open
    this.refreshTimer -= dt;
    if (this.refreshTimer <= 0 && !this.travelling) {
        this.refreshTimer = 0.5;
        for (let i = 0; i < this.cards.length; i++) this.refreshCard(this.cards[i]);
        this.applyOnline();
    }
};
