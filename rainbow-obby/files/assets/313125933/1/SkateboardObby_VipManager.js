var SkateboardObbyVipManager = pc.createScript('skateboardObbyVipManager');

// MonkeyObby_VipManager'in Skateboard kopyasi. Akis, sureler, reklam ve kayit ayni; Monkey'e ozel
// odulleri (hiz kazanci, win carpani, hareket hizi) yok. VIP iki kademeli, ikisi de reklamla alinir:
//   1) VIP      : vipDuration sn, Boost (Q) + VIP kaykay (board 1) + VIP skin (skin 1), [VIP] etiketi
//   2) BOSS VIP : VIP aktifken panel BOSS VIP teklif eder. Alininca VIP'in yerini alir:
//                 bossDuration sn, Boost (Q) + BOSS kaykay (board 2) + BOSS skin (skin 2), [BOSS VIP] etiketi
// Sure katlanmaz: her alista sayac o kademenin suresinden baslar. Bitince uc fayda da geri alinir.
// Boss VIP varken panel kapali (ust kademe yok). VIP / Boss VIP bitince panel lockMinutes dakika
// OYUN SURESI kilitli kalir, sonra dongu yine VIP'ten baslar.
// Boss skin + boss kaykay (SkateboardObby_CharSkins / _BoardSkins, item.boss): VIP surerken iki kademede de Shop satirindan giyilir.
// Panel Shop'tan da acilir (openFromShop): Shop panel entity'si gizlenir, bayraklari ve kamera kilidi durur, kapaninca ayni liste doner.
// Boost, VIP olmayanlarda sadece Boost power-up'i (PlayerItemManager.boostPowerup) surerken acik.
SkateboardObbyVipManager.attributes.add("vipDuration", { type: "number", default: 300, title: "VIP Duration (sn)" });
SkateboardObbyVipManager.attributes.add("bossDuration", { type: "number", default: 600, title: "Boss VIP Duration (sn)" });
SkateboardObbyVipManager.attributes.add("lockMinutes", { type: "number", default: 5, title: "Lock Minutes", description: "VIP bitince panelin kilitli kalacagi oyun suresi (dk). 0 = kilit yok" });
SkateboardObbyVipManager.attributes.add("vipColor", { type: "rgb", default: [1, 0.8, 0] });
SkateboardObbyVipManager.attributes.add("bossColor", { type: "rgb", default: [0.78, 0.42, 1] });
SkateboardObbyVipManager.attributes.add("panel", { type: "entity" });
SkateboardObbyVipManager.attributes.add("panelBody", { type: "entity" });
SkateboardObbyVipManager.attributes.add("openButton", { type: "entity" });
SkateboardObbyVipManager.attributes.add("openButtonText", { type: "entity" });
SkateboardObbyVipManager.attributes.add("closeButton", { type: "entity" });
SkateboardObbyVipManager.attributes.add("watchAdButton", { type: "entity" });
SkateboardObbyVipManager.attributes.add("noThanksButton", { type: "entity", description: "Reklamsiz normal buton (reklam butonuyla ayni boyutta, solunda)" });
SkateboardObbyVipManager.attributes.add("statusText", { type: "entity" });
SkateboardObbyVipManager.attributes.add("boostLockIcons", { type: "entity", array: true, title: "Boost Lock Icons", description: "Boost butonlarindaki kilit ikonlari: Boost kilitliyken acik" });
SkateboardObbyVipManager.attributes.add("boostTimerTexts", { type: "entity", array: true, title: "Boost Timer Texts", description: "Boost power-up'inin kalan suresi (VIP degilken, sure varken gorunur)" });
SkateboardObbyVipManager.attributes.add("boostSlot", { type: "entity", title: "Boost Slot", description: "Envanter sirasindaki Boost slotu: hep sirada sonda (sagda) tutulur, mobilde joystick alanina girmesin" });

SkateboardObbyVipManager.KEY_END = "SkateboardObby_VipEndAt";
SkateboardObbyVipManager.KEY_LEVEL = "SkateboardObby_VipLevel";
SkateboardObbyVipManager.KEY_LOCK = "SkateboardObby_VipLockLeft";
SkateboardObbyVipManager.KEY_LOCK_PENDING = "SkateboardObby_VipLockPending";

SkateboardObbyVipManager.prototype.initialize = function () {
    this.app.vipManager = this;

    this.endAt = +(SkateboardObby_Utils.getItem(SkateboardObbyVipManager.KEY_END) || 0);
    this.savedLevel = Math.max(1, Math.min(2, +(SkateboardObby_Utils.getItem(SkateboardObbyVipManager.KEY_LEVEL) || 1)));
    if (!Number.isFinite(this.endAt)) this.endAt = 0;
    if (!Number.isFinite(this.savedLevel)) this.savedLevel = 1;
    this.level = Date.now() < this.endAt ? this.savedLevel : 0;
    this.app.vipLevel = this.level;
    this.app.isVip = this.level > 0;

    const _max = Math.max(0, this.lockMinutes) * 60000;
    this.lockLeft = Math.max(0, Math.min(_max, +(SkateboardObby_Utils.getItem(SkateboardObbyVipManager.KEY_LOCK) || 0) || 0));
    this.lockPending = SkateboardObby_Utils.getItem(SkateboardObbyVipManager.KEY_LOCK_PENDING) === "1";
    this.lockSaveTimer = 0;

    this.panelOpen = false;
    this.fromShop = false;
    this.bossCards = null;
    this.boostLocked = null;
    this.lastOfferTime = -10;
    this.time = 0;

    // yazilar sadece degisince yazilir (her kare string uretilmez)
    this.shownLevel = -1;
    this.shownOffer = -1;
    this.shownLocked = null;
    this.shownSeconds = -1;
    this.shownBoostSeconds = -1;

    this.white = new pc.Color(1, 1, 1, 1);
    this.red = new pc.Color(1, 0.45, 0.4, 1);
    this.levelColors = [this.white, new pc.Color(this.vipColor.r, this.vipColor.g, this.vipColor.b, 1), new pc.Color(this.bossColor.r, this.bossColor.g, this.bossColor.b, 1)];

    // Panel / stand yazilari (isimle bulunur)
    const _find = (_root, _name) => _root ? _root.findByName(_name) : null;
    this.ui = {
        title: _find(_find(this.panel, "Title"), "Text"),
        perks: _find(this.panel, "VipPerksText"),
        watchText: _find(this.watchAdButton, "Text"),
    };
    const _stand = this.app.root.findByName("VIPTrigger");
    this.ui.standText = _find(_stand, "Text");

    this.openButton.button.on('click', function () {
        this.setPanelVisible(true);
    }, this);

    this.closeButton.button.on('click', function () {
        this.setPanelVisible(false);
    }, this);

    this.watchAdButton.button.on('click', function () {
        this.setPanelVisible(false);
        this.watchAdForVip();
    }, this);

    if (this.noThanksButton && this.noThanksButton.button) {
        this.noThanksButton.button.on('click', function () {
            this.setPanelVisible(false);
        }, this);
    }

    // Boost kilitliyken teklif popup'inin "Yes"i (PopupController callerEntity.fire ile cagirir)
    this.on("Vip:OfferYes", this.watchAdForVip, this);

    this.app.on("Connected", this.sendVip, this);
    this.app.on("Boost:Locked", this.onBoostLocked, this);
    this.app.on("BoostPowerup:Changed", this.refreshBoostLock, this);
    this.onPageHide = () => this.saveLock();
    window.addEventListener("pagehide", this.onPageHide);

    // envanter yeni item slotlarini sona ekliyor: Boost slotu her eklemede tekrar sona alinir
    this.slotRow = this.boostSlot ? this.boostSlot.parent : null;
    if (this.slotRow) this.slotRow.on("childinsert", this.keepBoostSlotLast, this);

    this.on('destroy', function () {
        if (this.slotRow) this.slotRow.off("childinsert", this.keepBoostSlotLast, this);
        this.app.off("Connected", this.sendVip, this);
        this.app.off("Boost:Locked", this.onBoostLocked, this);
        this.app.off("BoostPowerup:Changed", this.refreshBoostLock, this);
        window.removeEventListener("pagehide", this.onPageHide);
        this.saveLock();
        if (this.bossCardTexture) { this.bossCardTexture.destroy(); this.bossCardTexture = null; }
        if (this.app.vipManager === this) this.app.vipManager = null;
    }, this);

    // panel / ikon texture'lari tag'siz ve preload false: panel ilk acildiginda duz renk kutu cizmesin
    this.preloadUiAssets([this.panel, this.openButton].concat(this.boostLockIcons || []));
};

SkateboardObbyVipManager.prototype.postInitialize = function () {
    this.apply(true);
};

SkateboardObbyVipManager.prototype.preloadUiAssets = function (_roots) {
    for (let i = 0; i < _roots.length; i++) {
        if (!_roots[i]) continue;
        const _elements = _roots[i].findComponents("element");
        for (let k = 0; k < _elements.length; k++) {
            const _ids = [_elements[k].textureAsset, _elements[k].spriteAsset, _elements[k].fontAsset];
            for (let j = 0; j < _ids.length; j++) {
                const _asset = _ids[j] ? this.app.assets.get(_ids[j]) : null;
                if (_asset && !_asset.loaded && !_asset.loading) this.app.assets.load(_asset);
            }
        }
    }
};

// --- durum -------------------------------------------------------------------

SkateboardObbyVipManager.prototype.isActive = function () { return this.level > 0; };
SkateboardObbyVipManager.prototype.isBoss = function () { return this.level >= 2; };

// Panel su an neyi satiyor: VIP yoksa VIP, varsa Boss VIP
SkateboardObbyVipManager.prototype.getOfferLevel = function () { return this.level > 0 ? 2 : 1; };

// Boss VIP varken ust kademe yok; VIP bittikten sonra lockMinutes kilit
SkateboardObbyVipManager.prototype.isLocked = function () {
    if (this.level >= 2) return true;
    return this.level === 0 && this.lockLeft > 0;
};

SkateboardObbyVipManager.prototype.getDuration = function (_level) {
    return _level >= 2 ? this.bossDuration : this.vipDuration;
};

SkateboardObbyVipManager.prototype.getColor = function (_level) {
    return this.levelColors[Math.max(0, Math.min(2, _level))];
};

SkateboardObbyVipManager.prototype.getName = function (_level) {
    return _level >= 2 ? "BOSS VIP" : "VIP";
};

SkateboardObbyVipManager.prototype.getRemaining = function () {
    return Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000));
};

SkateboardObbyVipManager.prototype.numberToTimer = function (_number) {
    const minutes = Math.floor(_number / 60);
    const seconds = Math.floor(_number % 60);
    return String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
};

// Boost: VIP / BOSS VIP ya da Boost power-up'i surerken
SkateboardObbyVipManager.prototype.canBoost = function () {
    if (this.level > 0) return true;
    const _items = this.app.playerItemManager;
    return !!(_items && _items.hasBoostPowerup && _items.hasBoostPowerup());
};

SkateboardObbyVipManager.prototype.keepBoostSlotLast = function (_node) {
    if (_node === this.boostSlot || this.boostSlot.parent !== this.slotRow) return;
    this.slotRow.removeChild(this.boostSlot);
    this.slotRow.addChild(this.boostSlot);
};

// Kilit ikonlari sadece durum degisince
SkateboardObbyVipManager.prototype.refreshBoostLock = function () {
    const _locked = !this.canBoost();
    if (_locked === this.boostLocked) return;
    this.boostLocked = _locked;
    const _icons = this.boostLockIcons || [];
    for (let i = 0; i < _icons.length; i++) {
        if (_icons[i]) _icons[i].enabled = _locked;
    }
    this.app.fire("Boost:LockChanged", _locked);
};

// --- kilit -------------------------------------------------------------------

SkateboardObbyVipManager.prototype.saveLock = function () {
    SkateboardObby_Utils.setItem(SkateboardObbyVipManager.KEY_LOCK, String(Math.max(0, Math.round(this.lockLeft))));
    SkateboardObby_Utils.setItem(SkateboardObbyVipManager.KEY_LOCK_PENDING, this.lockPending ? "1" : "0");
};

// Kilit sadece VIP yokken ve oyun acikken azalir
SkateboardObbyVipManager.prototype.updateLock = function (dt) {
    if (this.level !== 0 || this.lockLeft <= 0) return;

    this.lockLeft = Math.max(0, this.lockLeft - dt * 1000);
    this.lockSaveTimer += dt;
    if (this.lockSaveTimer >= 5 || this.lockLeft <= 0) {
        this.lockSaveTimer = 0;
        this.saveLock();
    }
};

// --- her kare ----------------------------------------------------------------

SkateboardObbyVipManager.prototype.update = function (dt) {
    this.time += dt;
    this.updateLock(dt);

    const _level = Date.now() < this.endAt ? this.savedLevel : 0;
    if (_level !== this.level) {
        const _was = this.level;
        this.apply(false);
        if (_level === 0) {
            this.app.fire('WarningTextController:setWarning', "Your " + this.getName(_was) + " has expired.", 5, new pc.Color(1, 1, 0, 1));
        }
    }

    this.updateTexts(false);

    if (this.app.keyboard.wasPressed(pc.KEY_V) && !this.app.isTypingEnabled) {
        if (this.panelOpen) {
            this.setPanelVisible(false);
        } else {
            this.setPanelVisible(true);
        }
    }
};

// --- yazilar -----------------------------------------------------------------

SkateboardObbyVipManager.prototype.setText = function (_entity, _text, _color) {
    if (!_entity || !_entity.element) return;
    if (_entity.element.text !== _text) _entity.element.text = _text;
    if (_color) _entity.element.color = _color;
};

// Saniyede bir (ya da durum degisince) yazar; ayni saniyede tekrar string uretmez
SkateboardObbyVipManager.prototype.updateTexts = function (_force) {
    const _offer = this.getOfferLevel();
    const _locked = this.isLocked();
    const _seconds = this.level > 0 ? this.getRemaining() : (this.level === 0 ? Math.ceil(this.lockLeft / 1000) : 0);

    const _items = this.app.playerItemManager;
    const _boostLeft = (this.level === 0 && _items && _items.hasBoostPowerup && _items.hasBoostPowerup()) ? Math.ceil(_items.boostPowerup.remaining) : 0;
    if (_boostLeft !== this.shownBoostSeconds || _force) {
        this.shownBoostSeconds = _boostLeft;
        const _texts = this.boostTimerTexts || [];
        const _label = _boostLeft > 0 ? this.numberToTimer(_boostLeft) : "";
        for (let i = 0; i < _texts.length; i++) {
            if (!_texts[i]) continue;
            _texts[i].enabled = _boostLeft > 0;
            this.setText(_texts[i], _label);
        }
    }

    if (!_force && this.level === this.shownLevel && _offer === this.shownOffer && _locked === this.shownLocked && _seconds === this.shownSeconds) return;
    this.shownLevel = this.level;
    this.shownOffer = _offer;
    this.shownLocked = _locked;
    this.shownSeconds = _seconds;

    const _offerMinutes = Math.round(this.getDuration(_offer) / 60);

    // HUD butonu: aktifken kalan sure, degilse kisayol (dokunmatikte kisayol yok)
    this.setText(this.openButtonText, this.level > 0 ? this.numberToTimer(_seconds) : (this.app.isMobile ? "VIP" : "(V)"));

    // Panel basligi: aktif kademe ya da teklif
    const _showLevel = this.level >= 2 ? 2 : _offer;
    this.setText(this.ui.title, this.getName(_showLevel), this.getColor(_showLevel));

    // Durum satiri
    let _status;
    if (this.level > 0) {
        _status = this.getName(this.level) + " Active " + this.numberToTimer(_seconds);
    } else if (_locked) {
        _status = "Unlocks in " + this.numberToTimer(_seconds);
    } else {
        _status = _offerMinutes + " Minutes";
    }
    this.setText(this.statusText, _status, _locked && this.level === 0 ? this.red : this.white);

    // Ozellikler
    const _boost = this.app.isMobile ? "Boost" : "Boost (Q)";
    this.setText(this.ui.perks, _showLevel >= 2
        ? "[BOSS VIP] Tag + " + _boost + "\nBOSS Skin + BOSS Board"
        : "[VIP] Tag + " + _boost + "\nBOSS Skin + BOSS Board", this.white);

    // Reklam butonu: sadece alinabilecek bir teklif varsa
    this.watchAdButton.enabled = !_locked;
    this.setText(this.ui.watchText, "Get " + this.getName(_offer));

    // Dunyadaki stand yazisi
    if (_locked && this.level === 0) {
        this.setText(this.ui.standText, "VIP " + this.numberToTimer(_seconds), this.red);
    } else if (this.level >= 2) {
        this.setText(this.ui.standText, "BOSS VIP", this.getColor(2));
    } else {
        this.setText(this.ui.standText, this.getName(_offer), this.getColor(_offer));
    }
};

// --- panel -------------------------------------------------------------------

SkateboardObbyVipManager.prototype.canOpenPanel = function () {
    const _controller = this.app.skateboardObbyPlayerController;
    return this.app.isWatchingAd == false && !this.app.menuPanelEnabled && !this.app.deadMenuEnabled &&
        !this.app.isPopupEnabled && !this.app.isMarketEnabled && !(this.app.numpad && this.app.numpad.enabled) &&
        !this.app.inCutscene && !(_controller && _controller.isDied);
};

SkateboardObbyVipManager.prototype.setPanelVisible = function (_visible) {
    if (_visible == this.panelOpen) return;
    if (_visible && !this.fromShop && !this.canOpenPanel()) return;   // one panel at a time
    this.panelOpen = _visible;

    if (_visible) {
        // kilitliyken ne kadar kaldigi soylenir
        if (this.level === 0 && this.lockLeft > 0) {
            this.app.fire('WarningTextController:setWarning', "VIP unlocks in " + this.numberToTimer(Math.ceil(this.lockLeft / 1000)), 3, this.red);
        }

        const _controller = this.app.skateboardObbyPlayerController;
        if (_controller) _controller.stopMovement();

        this.app.isPopupEnabled = true;
        this.buildBossCards();
        this.updateTexts(true);
        this.panel.enabled = true;
        this.panelBody.setLocalScale(0.5, 0.5, 0.5);
        this.panelBody.tween(this.panelBody.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.35, pc.BackOut).start();

        if (this.app.gameplayStarted) {
            this.app.gameplayStarted = false;
            PokiSDK.gameplayStop();
        }
    } else {
        this.app.isPopupEnabled = false;
        if (this.fromShop) {
            // the Shop still holds isMarketEnabled, lockCamera and the black background
            this.fromShop = false;
            const _shop = this.app.skateShop;
            if (_shop && _shop.panel && _shop.panelOpen) { _shop.panel.enabled = true; _shop.refresh(); }
            this.panelBody.tween(this.panelBody.getLocalScale()).to(new pc.Vec3(0.6, 0.6, 0.6), 0.12, pc.BackIn)
                .onComplete(() => {
                    if (this.panelOpen) return;
                    this.panel.enabled = false;
                    this.panelBody.setLocalScale(1, 1, 1);
                })
                .start();
            return;
        }
        this.panelBody.tween(this.panelBody.getLocalScale()).to(new pc.Vec3(0.6, 0.6, 0.6), 0.12, pc.BackIn)
            .onComplete(() => {
                if (this.panelOpen) return;   // tekrar acildi
                this.panel.enabled = false;
                this.panelBody.setLocalScale(1, 1, 1);
            })
            .start();
    }

    if (this.fromShop) return;
    this.app.fire("lockCamera", _visible);
    this.app.skateboardObbyNetworkManager.setBlackBG(_visible);
};

// A boss row of the Shop: same panel, over the Shop
SkateboardObbyVipManager.prototype.openFromShop = function () {
    const _shop = this.app.skateShop;
    if (this.panelOpen || !_shop || !_shop.panelOpen || !_shop.panel) return;
    this.fromShop = true;
    _shop.panel.enabled = false;
    this.setPanelVisible(true);
};

// Two cards with the Shop's atlas icons (no 3D model, built once on the first opening). The status, perks and buttons move down into the panel's free space.
SkateboardObbyVipManager.prototype.buildBossCards = function () {
    if (this.bossCards) return;
    this.bossCards = [];
    const _skin = this.panel.findByName("Skin"), _layout = this.panel.findByName("VipLayout");
    const _skins = this.app.skateCharSkins, _boards = this.app.skateBoards;
    if (!_skin || !_layout || !_skins || !_boards) return;
    const _p = _layout.getLocalPosition();
    _layout.setLocalPosition(_p.x, _p.y - 90, _p.z);

    const _font = this.ui.title && this.ui.title.element ? this.ui.title.element.fontAsset : null;
    const _art = () => {
        const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256;
        const c = cv.getContext("2d"), R = 26;
        const path = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
        path(2, 2, 252, 252, R); c.fillStyle = "#1b1530"; c.fill();
        path(9, 9, 238, 238, R - 6); c.fillStyle = "#ffd23f"; c.fill();
        const g = c.createLinearGradient(0, 16, 0, 240); g.addColorStop(0, "#7b35d8"); g.addColorStop(1, "#3c1680");
        path(17, 17, 222, 222, R - 12); c.fillStyle = g; c.fill();
        return cv;
    };
    this.bossCardTexture = SkateboardObby_ShopArt.toTexture(this.app, _art());

    const _make = (_manager, _item, _label, _x) => {
        if (!_item) return;
        const _card = new pc.Entity("Boss_" + _label);
        _card.addComponent("element", { type: "image", anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5), pivot: new pc.Vec2(0.5, 0.5), width: 226, height: 216, useInput: false });
        _card.element.texture = this.bossCardTexture;
        _card.setLocalPosition(_x, 158, 0);
        _skin.addChild(_card);

        const _icon = new pc.Entity("Icon");
        _icon.addComponent("element", { type: "image", anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5), pivot: new pc.Vec2(0.5, 0.5), width: 164, height: 164, useInput: false });
        _icon.setLocalPosition(0, 18, 0);
        _card.addChild(_icon);
        // a texture that is not loaded yet draws as a plain rectangle
        const _atlas = _manager.iconAtlas;
        _icon.enabled = false;
        if (_atlas) {
            _atlas.ready(() => { if (_icon.element) { _manager.setIcon(_icon.element, _item); _icon.enabled = true; } });
            this.app.assets.load(_atlas);
        }

        const _text = new pc.Entity("Label");
        _text.addComponent("element", { type: "text", anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5), pivot: new pc.Vec2(0.5, 0.5), width: 214, height: 40, fontSize: 27, fontAsset: _font, text: _label, color: new pc.Color(1, 0.86, 0.3), outlineColor: new pc.Color(0.106, 0.082, 0.188), outlineThickness: 0.6, wrapLines: false, useInput: false });
        _text.setLocalPosition(0, -80, 0);
        _card.addChild(_text);
        this.bossCards.push(_card);
    };
    const _bossSkins = _skins.items.filter((it) => it.boss);
    const _gap = 238, _count = _bossSkins.length + 1;
    _bossSkins.forEach((it, i) => _make(_skins, it, "BOSS SKIN", (i - (_count - 1) / 2) * _gap));
    _make(_boards, _boards.items.find((it) => it.boss), "BOSS BOARD", ((_count - 1) / 2) * _gap);
};

// --- alma --------------------------------------------------------------------

SkateboardObbyVipManager.prototype.watchAdForVip = function () {
    if (this.isLocked()) return;

    const _target = this.getOfferLevel();
    this.app.adRewarder.watchAd(() => {
        this.grant(_target);
    });
};

// Sure katlanmaz: sayac o kademenin suresinden baslar
SkateboardObbyVipManager.prototype.grant = function (_level, _seconds) {
    _level = Math.max(1, Math.min(2, Math.round(_level) || 1));
    const _duration = _seconds > 0 ? _seconds : this.getDuration(_level);

    this.endAt = Date.now() + _duration * 1000;
    this.savedLevel = _level;
    SkateboardObby_Utils.setItem(SkateboardObbyVipManager.KEY_END, this.endAt + "");
    SkateboardObby_Utils.setItem(SkateboardObbyVipManager.KEY_LEVEL, _level + "");

    // Bitince kilit baslayacak (oyun kapaliyken bitse bile)
    this.lockPending = this.lockMinutes > 0;
    this.saveLock();

    this.apply(true);

    const _message = _level >= 2
        ? "BOSS VIP ACTIVE! BOOST + BOSS SKIN + BOSS BOARD IN SHOP"
        : "VIP ACTIVE! BOOST + BOSS SKIN + BOSS BOARD IN SHOP";
    this.app.fire('WarningTextController:setWarning', _message, 5, this.getColor(_level));

    if (this.app.gameManager && this.app.gameManager.sfx_purchase) { this.app.gameManager.sfx_purchase(); }
    SkateboardObby_Track.send("reward_claimed", this.getName(_level), "claimed");
};

SkateboardObbyVipManager.prototype.stopVip = function () {
    this.endAt = 0;
    SkateboardObby_Utils.setItem(SkateboardObbyVipManager.KEY_END, "0");
    this.apply(true);
};

// Durum degisince: Boost kilidi, kaykay / skin, etiket, sunucu
SkateboardObbyVipManager.prototype.apply = function (_force) {
    const _level = Date.now() < this.endAt ? this.savedLevel : 0;
    const _changed = _level !== this.level;
    this.level = _level;
    this.app.vipLevel = _level;
    this.app.isVip = _level > 0;

    if (_level === 0 && this.endAt) {
        this.endAt = 0;
        SkateboardObby_Utils.setItem(SkateboardObbyVipManager.KEY_END, "0");
    }

    // VIP bitti: kilit baslar
    if (_level === 0 && this.lockPending) {
        this.lockPending = false;
        this.lockLeft = Math.max(0, this.lockMinutes) * 60000;
        this.saveLock();
    }

    this.updateTexts(true);
    this.refreshBoostLock();

    if (!_changed && !_force) return;

    // VIP kaykay + skin otomatik takilir, bitince default'a doner (id = kademe)
    const _items = this.app.playerItemManager;
    if (_items && _items.setBoard) {
        _items.setBoard(_level);
        _items.setSkin(_level);
    }

    const _controller = this.app.skateboardObbyPlayerController;
    if (_controller && _controller.setVip) {
        _controller.setVip(_level, this.getName(Math.max(1, _level)), this.getColor(Math.max(1, _level)));
    }

    this.app.fire("Vip:Changed", _level > 0, _level);
    this.sendVip();
};

SkateboardObbyVipManager.prototype.sendVip = function () {
    const _network = this.app.skateboardObbyNetworkManager;
    if (_network && _network.room) {
        _network.room.send("Client:SetVip", { vip: this.level > 0, level: this.level });
    }
};

// --- Boost kilitliyken -------------------------------------------------------

// Q / Boost butonu kilitliyken: uyari + VIP teklifi (Monkey'deki "VIP Only" popup'i gibi)
SkateboardObbyVipManager.prototype.onBoostLocked = function () {
    if (this.time - this.lastOfferTime < 1.5) return;   // tusa basili tutma / cift dokunma
    this.lastOfferTime = this.time;

    const _gm = this.app.gameManager;
    if (_gm && _gm.sfx_warning) _gm.sfx_warning();

    if (this.isLocked()) {
        this.app.fire('WarningTextController:setWarning', "Boost is VIP only! VIP unlocks in " + this.numberToTimer(Math.ceil(this.lockLeft / 1000)) + ". Grab a Boost power-up!", 4, this.red);
        return;
    }
    this.app.fire('WarningTextController:setWarning', "Boost is VIP only!", 3, this.red);

    const _popup = this.app.skateboardObbyPopupController;
    if (!_popup || !this.canOpenPanel()) return;
    const _minutes = Math.round(this.getDuration(1) / 60);
    _popup.showPopup("VIP Only", "Boost is only for VIPs. Would you like to watch an ad to become VIP for " + _minutes + " minutes?",
        true, this, "Vip:OfferYes", "closePopup", null, true, true);
};
