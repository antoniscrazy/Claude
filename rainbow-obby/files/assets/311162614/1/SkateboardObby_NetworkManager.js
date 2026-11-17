var SkateboardObby_NetworkManager = pc.createScript('skateboardObbyNetworkManager');

SkateboardObby_NetworkManager.attributes.add("mobileControls", { type: "entity" });
SkateboardObby_NetworkManager.attributes.add("onlineCounter", { type: "entity" });
SkateboardObby_NetworkManager.attributes.add("localPlayer", { type: "entity" });
SkateboardObby_NetworkManager.attributes.add('playerTemplate', { type: 'asset', assetType: 'template' });
SkateboardObby_NetworkManager.attributes.add('deadPanel', { type: 'entity' });
SkateboardObby_NetworkManager.attributes.add('blackBackground', { type: 'entity' });
SkateboardObby_NetworkManager.attributes.add('joinRoomUI', { type: 'entity' });
SkateboardObby_NetworkManager.attributes.add('roomID', { type: 'number' });
SkateboardObby_NetworkManager.attributes.add('roomName', { type: 'string', default: 'skateboardObby', title: 'Room Name', description: 'Server room of this world (also the accessToken). World 2: skateboardObby2.' });
SkateboardObby_NetworkManager.attributes.add('sceneName', { type: 'string', default: 'SkateboardObby', title: 'Scene Name', description: 'Scene reloaded by Create Room / Join Room.' });
SkateboardObby_NetworkManager.attributes.add('saveSuffix', { type: 'string', default: '', title: 'Save Suffix', description: 'Added to the checkpoint save key so each world keeps its own progress. World 1 empty, World 2 _W2. Coins, shop, VIP and quests stay shared.' });

// room code = room id + mode id (the scene's roomID): which scene a code belongs to. New world = a line here and in MenuController.
SkateboardObby_NetworkManager.SCENE_BY_MODE = { 20: "SkateboardObby", 22: "SkateboardObby_2" };

SkateboardObby_NetworkManager.prototype.mobileAndTabletCheck = function () {
    return this.app.touch != null;
};

// initialize code called once per entity
SkateboardObby_NetworkManager.prototype.initialize = async function () {
    this.setLocalNameTag(false);   // first in initialize: the scene's "test" never reaches the first frame
    this.world2Layer = this.app.scene.layers.getLayerByName("World2");
    this.world2Layer.clearDepthBuffer = true;
    this.app.skateboardObbyNetworkManager = this;
    SkateboardObby_Rtl.register(this.app);
    this.app.isMobile = this.mobileAndTabletCheck();
    this.app.targetFov = 60;
    this.app.isWatchingAd = false;
    this.app.isPopupEnabled = false;
    this.app.isMarketEnabled = false;
    this.app.deadMenuEnabled = false;
    this.app.menuPanelEnabled = false;

    // commercialBreak when the last menu closes (see updateMenuCloseAd). The global watchRewarded (Helpers) is wrapped
    // while this scene runs, every rewarded ad passes here: a menu that asked for one gets no second ad when it closes.
    this._menuWasOpen = false;
    this._menuAdSkip = false;
    this._rewardedInMenu = false;
    this._menuAdBusy = false;
    this._menuAdStarted = false;
    this._waitRelock = false;
    if (typeof window.watchRewarded === 'function') {
        const _self = this;
        const _orig = window.watchRewarded;
        this._watchRewardedOrig = _orig;
        this._watchRewardedWrap = function () { _self._rewardedInMenu = true; return _orig.apply(this, arguments); };
        window.watchRewarded = this._watchRewardedWrap;
    }
    this.app.on("resetData", this.skipMenuCloseAd, this);   // the popup closes, but the scene is changing
    // a lock asked for when the menu closed can arrive after the ad started: let it go again
    this._onPointerLockChange = () => {
        if (!pc.Mouse.isPointerLocked()) return;
        this._waitRelock = false;
        if (this._menuAdStarted) this.app.mouse.disablePointerLock();
    };
    document.addEventListener('pointerlockchange', this._onPointerLockChange, false);

    this.loadLocalStorageData();

    this.isPlaycanvas = false;
    this.isInspector = false;

    if (window.location.href.indexOf('launch.playcanvas.com') > -1 || window.location.href.indexOf('playcanv.as') > -1) {
        this.isPlaycanvas = true;
    } else if (window.location.href.indexOf('inspector.poki.dev') > -1) {
        this.isInspector = true;
    }


    this.mouseLockCounter = 0;
    this.app.canLockPointer = true;
    this.app.cameraStateLocked = false;
    this.isFirstClick = true;
    // on mouse down
    const onMouseDown = () => {
        if (this.isFirstClick == true) {
            this.isFirstClick = false;
        }
        const camResult = this.app.isPopupEnabled || this.app.menuPanelEnabled || this.app.deadMenuEnabled || this.app.isMarketEnabled || this.app.numpad.enabled || this.app.isWatchingAd === true;
        if (camResult == false) {
            if (pc.Mouse.isPointerLocked() == false) {
                this.app.mouse.enablePointerLock();
                this.app.cameraStateLocked = true;
                this.app.fire("lockCamera", false);
                return;
            }
        }
    };
    this.app.mouse.on("mousedown", onMouseDown);
    this.app.on("copiedRoomId", this.copiedRoomId, this);

    this.mobileControls.enabled = this.app.isMobile;
    this.jumpButton = this.mobileControls.findByName("JumpButton");
    this.player = this.app.root.findByName("Player");
    this.playerController = this.localPlayer.script.skateboardObbyPlayerController;
    this.lowHPEffect = this.app.root.findByName("lowHPEffect");
    this.onlineCounter = this.app.root.findByName("OnlineCounter");
    //menu
    this.menuPanel = this.app.root.findByName("Menu");
    this.menuCloseButton = this.menuPanel.findByName("CloseButton");
    this.menuCloseButton.button.on('click', function (event) {
        this.setMenu(false);
    }, this);


    setTimeout(async () => {
        //poki login
        this.pokiButton = this.app.root.findByName("PokiButton");
        this.pokiLoggedText = this.pokiButton.findByName("Text");
        const userData = await getUserFromSDK();
        if (userData) {
            this.pokiButton.button.active = false;
            this.pokiLoggedText.element.text = "Logged in :)"
        }
        else {
            this.pokiButton.button.on('click', async function (event) {
                const user = await loginToSDK();
                if (!user) {
                    this.app.fire('WarningTextController:setWarning', "Login error", 5, new pc.Color(1, 0, 0, 1));
                    return;
                }
                this.entity.sound.play("loggedIn");
                this.pokiButton.button.active = false;
                this.pokiLoggedText.element.text = "Logged in :)";
                this.app.fire('WarningTextController:setWarning', "Welcome " + user.username, 5, new pc.Color(0, 1, 0, 1));
            }, this);
        }
    }, 1)

    this.auraText = this.app.root.findByName("AuraText");

    this.database = this.app.root.findByName("ItemDatabase").script.skateboardObbyItemDatabase;

    this.winCounterUiText = this.app.root.findByName("WinCounterUiText");
    this.winCounterUiGroup = this.app.root.findByName("WinCounterUiGroup");
    this.winCounterUiGroup.enabled = false;


    this.deadPanelRespawn = this.deadPanel.findByName("RespawnButton");
    this.deadPanelRespawn.button.on('click', function (event) {
        if (this.canRespawn === true) {
            watchCommercial(() => {
                this.playerController.respawn();
                this.respawn();
                this.canRespawn = false;
            });
        }
    }, this);

    this.app.root.findByName("RewardedAdButton").button.on("click", () => {
        if (this.canRespawn === true) {
            watchRewarded(() => {
                this.app.fire("Game:SkipTest");
                this.playerController.respawn();
                this.respawn();
                this.canRespawn = false;
            });
        }
    });



    this.mainMenuButton = this.menuPanel.findByName("MainMenuButton");
    this.mainMenuButton.button.on('click', async function (event) {
        if (this.room)
            await this.room.leave();
        this.app.scenes.changeScene("Menu");
    }, this);

    this.menuButton = this.app.root.findByName("MenuButton");
    this.menuButton.button.on('click', async function (event) {
        this.setMenu(!this.menuPanel.enabled);
    }, this);

    this.resetButton = this.app.root.findByName("ResetButton");
    this.resetButton.button.on('click', async function (event) {
        //this.playerController.dieOnTroll();
        if (this.playerController && this.playerController.requestReset) this.playerController.requestReset();
        else this.app.fire("playerDie");
    }, this);

    this.createRoomButton = this.menuPanel.findByName("CreateRoomButton");
    this.createRoomButton.button.on('click', async function (event) {
        if (this.room) {
            await this.room.leave();
        }
        SkateboardObby_Utils.setItem("SkateboardObby_createCustomRoom", "1");
        this.app.scenes.changeScene(this.sceneName);
    }, this);

    this.joinRoomButton = this.joinRoomUI.findByName("JoinRoomFromCodeButton");
    this.joinRoomCloseButton = this.joinRoomUI.findByName("CloseButton");
    this.joinRoomCloseButton.button.on('click', async function (event) {
        if (this.joinRoomUI.enabled) {
            this.joinRoomUI.enabled = false;
        }
    }, this);
    this.joinRoomInputbox = this.joinRoomUI.findByName("RoomIdInputBox");
    this.joinRoomButton.button.on('click', async function (event) {
        const value = this.joinRoomInputbox.script.uiInputField.value;
        if (value.length > 0) {
            var roomId;
            if (value.includes("https")) {
                roomParamIndex = value.indexOf('room=');
                if (roomParamIndex !== -1) {
                    var roomId = value.substring(roomParamIndex + 5); // 'room=' kelimesinin uzunluğu kadar ileri git
                } else {
                    return;
                }
            } else {
                roomId = value;
            }
            // a code of another world opens that world (the panel's path: save, leave, tagged assets, scene)
            if (this.isOtherWorldCode(roomId)) {
                const panel = this.app.skateWorldsPanel;
                if (panel && panel.travelTo(this.sceneOfCode(roomId))) {
                    SkateboardObby_Utils.setItem("SkateboardObby_joinCustomRoom", roomId);
                } else {
                    this.app.fire('WarningTextController:setWarning', "Couldn't join... the room is full or the code is wrong :/", 5, new pc.Color(1, 0, 0, 1));
                }
                return;
            }
            SkateboardObby_Utils.setItem("SkateboardObby_joinCustomRoom", roomId);
            if (this.room)
                await this.room.leave();
            this.app.scenes.changeScene(this.sceneName);
        }
    }, this);
    this.joinRoomPanelButton = this.menuPanel.findByName("JoinRoomButton");
    this.joinRoomPanelButton.button.on('click', async function (event) {
        if (this.joinRoomUI.enabled == false) {
            this.joinRoomUI.enabled = true;
        } else {
            this.joinRoomUI.enabled = false;
        }
    }, this);

    this.discordButton = this.menuPanel.findByName("DiscordButton");
    this.discordButton.button.on('click', async function (event) {
        SkateboardObby_Track.send("banner_clicked", "discord", "click");
        PokiSDK.openExternalLink("https://discord.gg/QnZx3pMwHU");
    }, this);

    this.clearDataButton = this.menuPanel.findByName("ClearData");
    this.clearDataButton.button.on('click', function (event) {
        this.app.fire("popupController:showPopup",
            "Delete Progress", "Do you want to reset your progress?", true, this.app, "resetData", "closePopup");
    }, this);

    this.onOrientationChange();
    this._onOrientationChange = this.onOrientationChange.bind(this);
    window.addEventListener("resize", this._onOrientationChange, false);
    window.addEventListener("orientationchange", this._onOrientationChange, false);

    this.app.on("goToNextCheckpoint", this.goToNextCheckpoint, this);
    // dead menu "Skip Test" (rewarded ad): fired right before playerController.respawn(), so the player
    // respawns at the next checkpoint
    this.app.on("Game:SkipTest", this.onSkipTest, this);

    // registered before the await below: leaving the mode while joinServer() is still running destroys
    // this script before initialize finishes, and its listeners must still be removed
    this.on('destroy', function () {
        this._nmDestroyed = true;
        if (this._watchRewardedWrap && window.watchRewarded === this._watchRewardedWrap) window.watchRewarded = this._watchRewardedOrig;
        this.app.off("resetData", this.skipMenuCloseAd, this);
        document.removeEventListener('pointerlockchange', this._onPointerLockChange, false);
        window.removeEventListener("orientationchange", this._onOrientationChange);
        window.removeEventListener("resize", this._onOrientationChange);
        this.app.mouse.off("mousedown", onMouseDown);
        this.app.off("goToNextCheckpoint", this.goToNextCheckpoint, this);
        this.app.off("Game:SkipTest", this.onSkipTest, this);
        this.app.off("copiedRoomId", this.copiedRoomId, this);
        if (this._rejoinTimer) clearTimeout(this._rejoinTimer);
        if (this._templateRetryTimer) clearTimeout(this._templateRetryTimer);
        if (this._offTemplateEvents) this._offTemplateEvents();
        // every way out of the mode leaves the room first; this is only the safety net
        if (this.room && this.room.connection && this.room.connection.isOpen) this.room.leave();
    }, this);

    this._firstJoin = true;
    if (await this.joinServer()) {
        if (this._nmDestroyed) { this.room.leave(); return; }
        this.listenPlayers();
    } else if (!this._nmDestroyed) {
        this._firstJoin = false;   // no "Connected" later: it would teleport a player that is already riding
        this.scheduleRejoin();
    }

};

// checkpoint save key of this world
SkateboardObby_NetworkManager.prototype.checkpointKey = function () {
    return "SkateboardObby_Checkpoint" + (this.saveSuffix || "");
};

SkateboardObby_NetworkManager.prototype.loadLocalStorageData = function () {
    const savedCheckpoint = SkateboardObby_Utils.getItem(this.checkpointKey());
    if (savedCheckpoint) {
        this.app.checkpoint = Number.parseInt(savedCheckpoint);
    } else {
        this.app.checkpoint = -1;
        SkateboardObby_Utils.setItem(this.checkpointKey(), -1);
    }

    if (isNaN(this.app.checkpoint)) {
        this.app.checkpoint = -1;
        SkateboardObby_Utils.setItem(this.checkpointKey(), -1);
    }
};

SkateboardObby_NetworkManager.prototype.getCheckpointCount = function () {
    const checkpointRoot = this.app.root.findByName("Checkpoints");
    return checkpointRoot ? checkpointRoot.children.length : 0;
};

SkateboardObby_NetworkManager.prototype.setCheckpoint = function (new_checkpoint) {
    const checkpointCount = Math.max(1, this.getCheckpointCount());

    this.app.checkpoint = pc.math.clamp(new_checkpoint, -1, checkpointCount - 1);
    SkateboardObby_Utils.setItem(this.checkpointKey(), this.app.checkpoint);

    this.sendCheckpoint();
    this.app.fire("checkpointChanged", this.app.checkpoint);
};

// Tells the server the local checkpoint, so other players can show it on their progress bar.
// Only sent when the room's player schema has a "checkpoint" field (the skateboardObby room does not exist
// on the server yet; without the field remote progress is estimated from the synced position).
SkateboardObby_NetworkManager.prototype.sendCheckpoint = function () {
    if (!this.room || !this.player || !this.player.networkData) return;
    if (!("checkpoint" in this.player.networkData)) return;
    this.room.send("Client:Checkpoint", { checkpoint: this.app.checkpoint });
};

SkateboardObby_NetworkManager.prototype.goToNextCheckpoint = function () {
    this.setCheckpoint(this.app.checkpoint + 1);
    this.app.fire("teleportToCheckpoint");
};

// Skip Test (dead menu, after the rewarded ad): save the next checkpoint. The caller respawns the player
// right after this, which teleports to the new checkpoint (teleportToSavedSpawn -> teleportBody).
SkateboardObby_NetworkManager.prototype.onSkipTest = function () {
    const count = this.getCheckpointCount();
    const current = this.app.checkpoint == null || isNaN(this.app.checkpoint) ? -1 : this.app.checkpoint;
    if (count <= 0 || current >= count - 1) {
        this.app.fire('WarningTextController:setWarning', "No checkpoint left to skip", 3, new pc.Color(1, 0.51, 0.03, 1));
        return;
    }
    this.setCheckpoint(current + 1);
    this.app.fire('WarningTextController:setWarning', "Checkpoint skipped!", 3, new pc.Color(0, 1, 0, 1));
};

SkateboardObby_NetworkManager.prototype.onOrientationChange = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > h) {
        // Landscape

    }
    else {
        // Portrait

    }
}

SkateboardObby_NetworkManager.prototype.copiedRoomId = function () {
    if (this.room) {
        PokiSDK.shareableURL({ room: this.room.roomId + this.roomID }).then(url => {
            if (window.clipboardData && window.clipboardData.setData) {
                // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
                return window.clipboardData.setData("Text", url);
            }
            else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
                var textarea = document.createElement("textarea");
                textarea.textContent = url;
                textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand("copy");  // Security exception may be thrown by some browsers.
                }
                catch (ex) {
                    console.warn("Copy to clipboard failed.", ex);
                }
                finally {
                    document.body.removeChild(textarea);
                }
            }
        });
        this.app.fire('WarningTextController:setWarning', "Link copied! Now share it with your friends!", 5, new pc.Color(0, 1, 0, 1));
    }
}

SkateboardObby_NetworkManager.prototype.setBlackBG = function (state = true) {
    if (state) {
        this.blackBackground.enabled = true;
        this.data = { value: 0 };
        this.blackBackground
            .tween(this.data).to({ value: 0.75 }, 0.2, pc.SineOut)
            .onUpdate((dt) => {
                this.blackBackground.element.opacity = this.data.value;
            })
            .start();
    } else {
        this.data = { value: 0.75 };
        this.blackBackground
            .tween(this.data).to({ value: 0 }, 0.1, pc.SineOut)
            .onUpdate((dt) => {
                this.blackBackground.element.opacity = this.data.value;
            })
            .onComplete(() => {
                this.blackBackground.enabled = false;
            })
            .start();
    }
};


// update code called every frame
SkateboardObby_NetworkManager.prototype.postUpdate = function (dt) {

    //respawn
    if (this.app.keyboard.wasPressed(pc.KEY_SPACE) && this.app.deadMenuEnabled && !this.app.menuPanelEnabled) {
        this.deadPanelRespawn.button.fire('click');
    }

    if (pc.platform.touch)
        return;

    if (!pc.Mouse.isPointerLocked()) {
        const camResult = this.app.isWatchingAd == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && this.app.isPopupEnabled == false && this.app.numpad.enabled == false;
        if (camResult && !this._waitRelock) {
            this.mouseLockCounter += 1;
        } else {
            this.mouseLockCounter = 0;
        }
    } else {
        this.mouseLockCounter = 0;
    }

    if (this.mouseLockCounter > 20) {
        if (this.isFirstClick == false) {
            this.setMenu(true);
            this.mouseLockCounter = 0;
        }
    }
};

// Is a menu / panel the player opens and closes open (ads not included)? A new panel: add its flag here.
// Market = Shop (with its ad offer), Worlds, Quests. Popup = popups and VIP.
SkateboardObby_NetworkManager.prototype.isMenuOpen = function () {
    const a = this.app;
    return a.isPopupEnabled === true || a.menuPanelEnabled === true || a.deadMenuEnabled === true || a.isMarketEnabled === true
        || !!(a.numpad && a.numpad.enabled) || !!(this.joinRoomUI && this.joinRoomUI.enabled)
        || !!(a.vipManager && a.vipManager.panelOpen);
};

// Poki: "fire a commercialBreak() event when players close any menu". Once, when the last open menu closes and the
// game is back; going from menu to menu (ESC -> Join Room / Clear Data popup, Shop -> ad offer) keeps isMenuOpen true.
// Skipped: a rewarded ad was asked for in this menu, the dead menu (Respawn already shows watchCommercial), a dead
// player, a close that leads to a scene change. Worlds GO, Main Menu, Create / Join Room and More Games Play keep their
// flag on until the scene changes, so they never get here. How often an ad really shows is up to the Poki SDK.
SkateboardObby_NetworkManager.prototype.updateMenuCloseAd = function () {
    if (this.isMenuOpen()) {
        if (!this._menuWasOpen) {   // a new menu session
            this._menuWasOpen = true;
            this._menuAdSkip = false;
            this._rewardedInMenu = false;
        }
        if (this.app.deadMenuEnabled === true) this._menuAdSkip = true;
        return;
    }
    if (!this._menuWasOpen) return;
    this._menuWasOpen = false;
    const _pc = this.playerController;
    if (this._menuAdSkip || this._rewardedInMenu || this.app.isWatchingAd === true || (_pc && _pc.isDied)) return;
    this.menuCommercialBreak();
};

SkateboardObby_NetworkManager.prototype.skipMenuCloseAd = function () {
    this._menuAdSkip = true;
};

// The only way to the menu close ad. Nothing happens on launch or without the SDK.
// Desktop: the lock taken by the closing click stays unless an ad really starts. After an ad the lock is not asked for
// (no user gesture there): the first click in the game takes it (onMouseDown), and _waitRelock keeps the ESC menu from
// opening by itself until then.
SkateboardObby_NetworkManager.prototype.menuCommercialBreak = function () {
    const a = this.app;
    if (this.isPlaycanvas || typeof PokiSDK === 'undefined' || !PokiSDK || typeof PokiSDK.commercialBreak !== 'function') return false;
    const _now = Date.now();
    if (this._menuAdBusy || a.isWatchingAd === true || _now - (this._menuAdLast || 0) < 500) return false;   // double close
    this._menuAdBusy = true;
    this._menuAdLast = _now;

    if (a.gameplayStarted) {
        a.gameplayStarted = false;
        PokiSDK.gameplayStop();
    }
    const _sound = a.systems.sound;
    const _volume = _sound.volume;
    const _touch = !!(pc.platform.touch || a.isMobile);
    _sound.volume = 0;
    a.isWatchingAd = true;   // no moving, camera, jumping or opening panels (they all check it)
    if (_touch) a.fire("lockCamera", true);

    let _started = false;
    let _done = false;
    const _finish = () => {
        if (_done) return;
        _done = true;
        clearTimeout(this._menuAdWatchdog);
        this._menuAdBusy = false;
        this._menuAdStarted = false;
        _sound.volume = _volume;
        a.isWatchingAd = false;
        if (_started && typeof restoreGameFocusRetry === 'function') restoreGameFocusRetry();
        if (this._nmDestroyed || this.isMenuOpen()) return;   // scene changed / the player died during the ad
        if (_touch) a.fire("lockCamera", false);
        else if (_started) this._waitRelock = !pc.Mouse.isPointerLocked();
        if (this.playerController && this.playerController.sdkGamePlayStart) this.playerController.sdkGamePlayStart();
    };
    // the ad never starts and the SDK does not answer: the game must not stay locked
    this._menuAdWatchdog = setTimeout(() => { if (!_started) _finish(); }, 6000);
    try {
        PokiSDK.commercialBreak(() => {
            if (_done) return;
            _started = true;
            this._menuAdStarted = true;
            clearTimeout(this._menuAdWatchdog);
            if (!_touch) a.fire("lockCamera", true);
            else if (pc.Mouse.isPointerLocked()) a.mouse.disablePointerLock();   // touch laptop: the closing tap's lock
            if (typeof clearHeldKeys === 'function') clearHeldKeys();
            const _c = this.playerController;
            if (_c && !this._nmDestroyed) {   // menus only cut the input: without this the board rolls on behind the ad
                if (_c.stopMovement) _c.stopMovement();
                if (_c.stop && !_c.isDied) _c.stop();
            }
        }).then(_finish, _finish);
    } catch (e) {
        _finish();
    }
    return true;
};

SkateboardObby_NetworkManager.prototype.setMenu = function (state = true) {
    if (state && this.app.menuPanelEnabled) return;
    if (!state && !this.app.menuPanelEnabled && !this.menuPanel.enabled) return;

    // dead: the menu replaces the dead panel while it is open, and gives it back when closed
    if (this.app.deadMenuEnabled) {
        if (state) {
            this.deadPanel.enabled = false;
            this.menuPanel.enabled = true;
            this.app.menuPanelEnabled = true;
            this.menuCloseButton.enabled = true;
        } else {
            this.menuPanel.enabled = false;
            this.app.menuPanelEnabled = false;
            this.deadPanel.setLocalPosition(0, 0, 0);
            this.deadPanel.enabled = true;
        }
        return;
    }

    if (state) {
        this.menuPanel.enabled = true;
        this.playerController.stopMovement();
        this.setBlackBG(true);
        this.app.menuPanelEnabled = true;
        this.menuCloseButton.enabled = false;
        this.app.fire("lockCamera", true);
        if (this.app.gameplayStarted) {
            this.app.gameplayStarted = false
            PokiSDK.gameplayStop();
        }
        setTimeout(() => {
            this.menuCloseButton.enabled = true;
        }, 2000);
    } else {
        this.menuPanel.enabled = false;
        this.setBlackBG(false);
        this.app.menuPanelEnabled = false;
        this.app.fire("lockCamera", false);
    }
};

SkateboardObby_NetworkManager.prototype.listenPlayers = function () {
    const room = this.room;
    this.playerEntities = {};
    this.pendingPlayers = {};   // remote players waiting for the RemotePlayer template, by sessionId
    this.onlineCount = 0;
    this.localSessionId = room.sessionId;
    this.lastRoomId = room.roomId;
    this.loadPlayerTemplate();

    //player connected
    room.state.players.onAdd((player, sessionId) => {
        if (room !== this.room) return;
        this.onlineCount += 1;
        if (this.onlineCounter.element)
            this.onlineCounter.element.text = this.onlineCount;

        if (sessionId === this.localSessionId || (this.playerTemplate && this.playerTemplate.resource)) {
            this.spawnPlayer(player, sessionId);
        } else {
            // the template is preload false and not tagged: it comes with loadPlayerTemplate, the player waits here
            this.pendingPlayers[sessionId] = player;
            this.loadPlayerTemplate();
        }
    }, false);

    //player disconnected
    room.state.players.onRemove((player, sessionId) => {
        if (room !== this.room) return;
        this.onlineCount -= 1;
        if (this.onlineCounter.element)
            this.onlineCounter.element.text = this.onlineCount;

        if (this.pendingPlayers[sessionId]) {   // left before the template came
            delete this.pendingPlayers[sessionId];
            return;
        }
        this.removePlayerEntity(player, sessionId);
    }, false);

    // connection lost (not our own leave): the remote players are stale, get back in when possible
    room.onLeave((code) => this.onRoomLeft(room, code));

    this.room.onMessage("Server:PlayerController:respawn", (sessionId) => {
        const entity = this.playerEntities[sessionId];
        if (entity && entity.script && entity.script.playerController) entity.script.playerController.respawn();
    });

    this.room.onMessage("Server:PlayerControllerOther:died", (data) => {
        //local değilse
        const entity = this.playerEntities[data.playerId];
        if (entity && data.playerId != this.localSessionId) {
            entity.script.skateboardObbyOtherPlayerController.died();
        }
    });

    this.room.onMessage("Server:PlayerControllerOther:respawn", (data) => {
        //local değilse
        const entity = this.playerEntities[data.playerId];
        if (entity && data.playerId != this.localSessionId) {
            entity.script.skateboardObbyOtherPlayerController.respawn();
        }
    });

    this.room.onMessage("Server:PlayerDie", (data) => {
        if (data.playerId == this.localSessionId) {
            this.app.fire("playerDie");
        }
    });

    this.room.onMessage("Server:FireSignal", (data) => {
        // any client can send any name here: only the signals this mode replicates on purpose become app events
        if (data && SkateboardObby_NetworkManager.REPLICATED_SIGNALS[data.signal] === true) this.app.fire(data.signal);
    });

    this.room.onMessage("Server:Die", (data) => {
        this.app.fire("playerDie");
    });

    // first join only: GameManager teleports the player on this. After the first state, so the player index is known.
    if (this._firstJoin) {
        this._firstJoin = false;
        room.onStateChange.once(() => {
            if (room !== this.room || this._nmDestroyed) return;
            this.app.fire("Connected");
            this.syncLocalData();
        });
    }
};

// Signals other players may fire on this client (Client:FireSignal). No trigger / button of this mode replicates today.
SkateboardObby_NetworkManager.REPLICATED_SIGNALS = {};

// The RemotePlayer template is preload false and has no mode tag (2026-10-28, Skateboard hidden from the menu preload):
// it is loaded here on demand. Players that join before it is ready wait in pendingPlayers.
SkateboardObby_NetworkManager.prototype.loadPlayerTemplate = function () {
    const asset = this.playerTemplate;
    if (!asset || asset.resource || this._templateLoading) return;
    this._templateLoading = true;

    const onLoad = () => {
        this._offTemplateEvents();
        this.flushPendingPlayers();
    };
    const onError = (err) => {
        this._offTemplateEvents();
        console.warn("[SkateboardObby] RemotePlayer template did not load, retrying:", err);
        this._templateRetryTimer = setTimeout(() => this.loadPlayerTemplate(), 3000);
    };
    this._offTemplateEvents = () => {
        this._templateLoading = false;
        asset.off("load", onLoad);
        asset.off("error", onError);
    };
    asset.once("load", onLoad);
    asset.once("error", onError);
    this.app.assets.load(asset);
};

SkateboardObby_NetworkManager.prototype.flushPendingPlayers = function () {
    if (this._nmDestroyed) return;
    const pending = this.pendingPlayers;
    this.pendingPlayers = {};
    for (const sessionId in pending) this.spawnPlayer(pending[sessionId], sessionId);
};

// One broken player must not stop the state patch: Colyseus does not catch errors in these callbacks,
// the rest of the patch (other players, the local player) would never be applied.
SkateboardObby_NetworkManager.prototype.spawnPlayer = function (player, sessionId) {
    try {
        this.setupPlayer(player, sessionId);
    } catch (e) {
        console.warn("[SkateboardObby] player setup failed:", sessionId, e);
    }
};

SkateboardObby_NetworkManager.prototype.removePlayerEntity = function (player, sessionId) {
    this.app.fire("player:remove", player);

    const entity = this.playerEntities[sessionId];
    if (entity && sessionId !== this.localSessionId) {
        if (entity.spawnedDeadBody) entity.spawnedDeadBody.destroy();
        entity.destroy();
    }

    delete this.playerEntities[sessionId];
};

// The local player's name exists only in a server room. Offline there is no name: the tag stays off.
// On = name arrived (listen "username"), off = initialize and connection lost. A room with nobody else keeps it.
// To also hide it when alone in a room, see notes/status/skate_network.md.
SkateboardObby_NetworkManager.prototype.setLocalNameTag = function (_show) {
    if (this._localNameTagOn === _show) return;
    if (!this._localNameTag) this._localNameTag = this.localPlayer ? this.localPlayer.findByName("Username") : null;
    if (!this._localNameTag) return;
    this._localNameTagOn = _show;
    if (!_show && this._localNameTag.element) this._localNameTag.element.text = "";
    this._localNameTag.enabled = _show;
};

SkateboardObby_NetworkManager.prototype.onRoomLeft = function (room, code) {
    if (this._nmDestroyed || room !== this.room) return;
    if (code === SkateboardObby_NetworkManager.WS_CLOSE_CONSENTED) return;   // our own room.leave()

    console.warn("[SkateboardObby] connection lost:", code);
    for (const sessionId in this.playerEntities) {
        const entity = this.playerEntities[sessionId];
        this.removePlayerEntity(entity.networkData, sessionId);
    }
    this.pendingPlayers = {};
    this.onlineCount = 0;
    if (this.onlineCounter.element) this.onlineCounter.element.text = this.onlineCount;
    this.room = null;
    this.setLocalNameTag(false);
    this.scheduleRejoin();
};

SkateboardObby_NetworkManager.WS_CLOSE_CONSENTED = 4000;
SkateboardObby_NetworkManager.REJOIN_TRIES = 8;

// 2, 4, 8, 16, 30, 30... seconds. The game keeps running offline in between.
SkateboardObby_NetworkManager.prototype.scheduleRejoin = function () {
    if (this._nmDestroyed || this._rejoinTimer) return;
    this._rejoinTries = (this._rejoinTries || 0) + 1;
    if (this._rejoinTries > SkateboardObby_NetworkManager.REJOIN_TRIES) return;
    const delay = Math.min(30, Math.pow(2, this._rejoinTries)) * 1000;
    this._rejoinTimer = setTimeout(() => {
        this._rejoinTimer = null;
        this.rejoinServer();
    }, delay);
};

// Same room if it is still there, otherwise any public room. No "Connected": the player stays where it is.
SkateboardObby_NetworkManager.prototype.rejoinServer = async function () {
    if (this._nmDestroyed) return;
    let room = null;
    try {
        const options = { accessToken: this.roomName };
        if (this.app.colyseus && this.lastRoomId) {
            try { room = await this.app.colyseus.joinById(this.lastRoomId, options); } catch (e) { room = null; }
        }
        if (!room) {
            if (!this.app.colyseus) this.app.colyseus = new Colyseus.Client(this.getServerUrl());
            room = await this.app.colyseus.joinOrCreate(this.roomName, options);
        }
    } catch (e) {
        console.warn("[SkateboardObby] rejoin failed:", e);
    }
    if (this._nmDestroyed) { if (room) room.leave(); return; }
    if (!room) { this.scheduleRejoin(); return; }

    this._rejoinTries = 0;
    this.room = room;
    room.onError((code, message) => {
        console.warn("[SkateboardObby] room error:", code, message);
    });
    const manager = this.app.gameManager;
    if (manager) manager._sentPauseMenu = false;   // sent again if the menu is open
    this.listenPlayers();
};

SkateboardObby_NetworkManager.prototype.setupPlayer = function (player, sessionId) {
        const room = this.room;
        let newPlayer;
        //if its local player
        if (sessionId === this.localSessionId) {
            newPlayer = this.player;
        } else {
            newPlayer = this.playerTemplate.resource.instantiate();
            newPlayer.sessionId = sessionId;
            this.app.root.addChild(newPlayer);

            // already where the server says (a player that joined earlier may not move for a long time)
            newPlayer.networkPosition = new pc.Vec3(player.x, player.y, player.z);
            newPlayer.networkRotation = new pc.Quat();
            newPlayer.networkVelocity = new pc.Vec3();
            newPlayer.setPosition(newPlayer.networkPosition);
            newPlayer.networkRotation.setFromEulerAngles(player.rotationX || 0, player.rotationY || 0, player.rotationZ || 0);
            if (newPlayer.playerBody) newPlayer.playerBody.setRotation(newPlayer.networkRotation);
            newPlayer.script.skateboardObbyOtherPlayerController.handleAnimations(player);

            player.onChange(() => {
                if (room !== this.room) return;
                const targetPlayer = this.playerEntities[sessionId];
                if (targetPlayer == null || !targetPlayer.script) return;
                //interpolate this position in update
                targetPlayer.networkPosition.set(player.x, player.y, player.z);

                //interpolate this rotation in update
                targetPlayer.networkRotation.setFromEulerAngles(player.rotationX || 0, player.rotationY || 0, player.rotationZ || 0);
                targetPlayer.script.skateboardObbyOtherPlayerController.handleAnimations(player);
            });
        }

        this.app.fire("player:add", newPlayer);
        //newPlayer.setPosition(player.x, player.y, player.z);
        newPlayer.networkData = player;
        this.playerEntities[sessionId] = newPlayer;
        SkateboardObby_Rtl.apply(newPlayer);

        // checkpoint of the player for the progress bar (only if the server schema has the field)
        if ("checkpoint" in player) {
            if (sessionId === this.localSessionId) {
                this.sendCheckpoint();
            } else {
                player.listen("checkpoint", (newCheckpoint) => {
                    const entity = this.playerEntities[sessionId];
                    if (entity) entity.networkCheckpoint = newCheckpoint;
                });
            }
        }

        player.listen("isDead", (isDead) => {
            if (sessionId === this.localSessionId) return;
            if (isDead) {
                this.playerEntities[sessionId].script.skateboardObbyOtherPlayerController.died();
            } else {
                this.playerEntities[sessionId].script.skateboardObbyOtherPlayerController.respawn();
            }
        });

        player.listen("username", (serverUsername) => {
            const username = SkateboardObby_LocalName.get(sessionId, serverUsername);
            if (sessionId === this.localSessionId) {
                this.localPlayer.findByName("Username").element.text = username;
                this.setLocalNameTag(true);
                this.app.fire("player:setUsername", this.localPlayer, username, true);
            } else {
                this.playerEntities[sessionId].script.skateboardObbyOtherPlayerController.username.element.text = username;
                this.app.fire("player:setUsername", this.playerEntities[sessionId], username, false);
            }
        });

        player.listen("activeItemId", (newActiveItemID) => {
            if (sessionId === this.localSessionId) {

            } else {
                this.playerEntities[sessionId].script.skateboardObbyOtherPlayerController.setActiveItem(newActiveItemID);
            }
        })

        player.listen("activeHandItem", (newActiveHandItem) => {
            if (sessionId === this.localSessionId) {
                this.app.skateboardObbyPlayerController.setActiveHandItem(newActiveHandItem);
            } else {
                this.playerEntities[sessionId].script.skateboardObbyOtherPlayerController.setActiveHandItem(newActiveHandItem);
            }
        })

        player.listen("isPauseMenu", (newIsPauseMenu) => {
            if (sessionId === this.localSessionId) {
                this.app.skateboardObbyPlayerController.entity.findByName("AfkBox").enabled = newIsPauseMenu;
                this.app.gameManager.isPauseMenu = newIsPauseMenu;
            } else {
                this.playerEntities[sessionId].findByName("AfkBox").enabled = newIsPauseMenu;
            }
        })

        player.listen("isSparks", (newIsSparks) => {
            if (sessionId === this.localSessionId) {
                this.app.skateboardObbyPlayerController.entity.findByName("Sparks").enabled = newIsSparks;
            } else {
                this.playerEntities[sessionId].findByName("Sparks").enabled = newIsSparks;
            }
        })

        player.listen("scale", (newScale) => {
            if (sessionId === this.localSessionId) {
                this.app.skateboardObbyPlayerController.setScale(newScale);
            } else {
                this.playerEntities[sessionId].script.skateboardObbyOtherPlayerController.setScale(newScale);
            }
        })

        // the local skin / board / VIP are applied locally (PlayerItemManager / VipManager), the server echo is ignored
        player.listen("skin", (newSkin) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.skateboardObbyOtherPlayerController.setSkin(newSkin);
        })

        // VIP / board only if the server schema has the fields (older server: no VIP label, default board)
        if ("isVip" in player) {
            player.listen("isVip", (newIsVip) => {
                if (sessionId === this.localSessionId) return;
                this.playerEntities[sessionId].script.skateboardObbyOtherPlayerController.setVip(newIsVip);
            })
        }

        if ("board" in player) {
            player.listen("board", (newBoard) => {
                if (sessionId === this.localSessionId) return;
                this.playerEntities[sessionId].script.skateboardObbyOtherPlayerController.setBoard(newBoard);
            })
        }

        // the local player is in the state now: send board / VIP again (Connected can come before the first state)
        if (sessionId === this.localSessionId) {
            if (this.app.playerItemManager) this.app.playerItemManager.sendCosmetics();
            if (this.app.vipManager) this.app.vipManager.sendVip();
            // back in after a lost connection while dead: the new room does not know yet
            if (this.playerController && this.playerController.isDied) room.send("Client:Died", {});
        }
};

SkateboardObby_NetworkManager.prototype.respawn = function () {
    this.app.deadMenuEnabled = false;
    this.deadPanel.enabled = false;
    if (this.app.menuPanelEnabled) return; // menu still open: keep its background
    this.setBlackBG(false);
};

SkateboardObby_NetworkManager.prototype.syncLocalData = async function () {

};

// launch and inspector: test server. Poki (live): prod.
SkateboardObby_NetworkManager.prototype.getServerUrl = function () {
    if (this.isPlaycanvas || this.isInspector) return "wss://rainbowtest.emolingo.games";
    return "wss://rainbowobby1.emolingo.games";
};

// room code = room id + mode id ("20")
SkateboardObby_NetworkManager.prototype.joinByCode = function (code) {
    return this.app.colyseus.joinById(code.length > 10 ? code.slice(0, -2) : code.slice(0, -1), { accessToken: this.roomName });
};

// scene of a room code (room ids have 9 characters), null = not a Skateboard world's code
SkateboardObby_NetworkManager.prototype.sceneOfCode = function (code) {
    return code ? SkateboardObby_NetworkManager.SCENE_BY_MODE[parseInt(String(code).slice(9), 10)] || null : null;
};

SkateboardObby_NetworkManager.prototype.isOtherWorldCode = function (code) {
    const scene = this.sceneOfCode(code);
    return scene !== null && scene !== this.sceneName;
};

SkateboardObby_NetworkManager.prototype.joinServer = async function () {
    try {
        this.app.colyseus = new Colyseus.Client(this.getServerUrl());

        // the URL keeps its room code after a world change: a code of another world is not for this scene
        const urlCode = SkateboardObby_NetworkManager.urlRoomFailed ? null : PokiSDK.getURLParam('room');
        const roomIdFromURL = this.isOtherWorldCode(urlCode) ? null : urlCode;
        const customRoomId = SkateboardObby_Utils.getItem("SkateboardObby_joinCustomRoom");
        if (SkateboardObby_Utils.getItem("SkateboardObby_createCustomRoom") === "1") {
            SkateboardObby_Utils.setItem("SkateboardObby_createCustomRoom", "");

            this.room = await this.app.colyseus.create(this.roomName, { accessToken: this.roomName, private: true });

            /*
                        this.app.skateboardObbyPopupController.showPopup(
                            "Private Room Created",
                            "Room code: " + this.room.roomId + "12",
                            false, this.app, "copiedRoomId", "closePopup", { yesButtonText: "Copy" }, false, true)
            */
            this.app.fire("popupController:showPopup",
                "Private room created", "Room code: " + this.room.roomId + this.roomID, false, this, "copiedRoomId", "closePopup", { yesButtonText: "Copy" });

            this.app.mouse.disablePointerLock();
            this.app.cameraStateLocked = false;
            this.app.fire("lockCamera", true);
        } else {
            // a room code / invite link that does not work (full, closed, wrong) must not leave the player offline
            const code = (customRoomId != "" && customRoomId != null) ? customRoomId : roomIdFromURL;
            if (code != "" && code != null) {
                SkateboardObby_Utils.setItem("SkateboardObby_joinCustomRoom", "");
                try {
                    this.room = await this.joinByCode(code);
                } catch (e) {
                    console.warn("[SkateboardObby] could not join room code:", e);
                    if (code === roomIdFromURL) SkateboardObby_NetworkManager.urlRoomFailed = true;
                    this.app.fire('WarningTextController:setWarning', "Couldn't join... the room is full or the code is wrong :/", 5, new pc.Color(1, 0, 0, 1));
                }
            }
            if (!this.room) {
                this.room = await this.app.colyseus.joinOrCreate(this.roomName, { accessToken: this.roomName });
            }
        }
    } catch (e) {
        console.warn("[SkateboardObby] no server:", e);
    }

    if (this.room) {
        this.room.onError((code, message) => {
            console.warn("[SkateboardObby] room error:", code, message);
        });
    } else {
        return false;
    }
    return true;
};

SkateboardObby_NetworkManager.prototype.lowHPEffectMethod = function () {
    this.lowHPEffect.enabled = true;
    this.lowHPEffectData = { value: 0 };

    this.lowHPEffectTween = this.lowHPEffect
        .tween(this.lowHPEffectData).to({ value: 1 }, 0.25, pc.Linear)
        .onUpdate((dt) => {
            this.lowHPEffect.element.opacity = this.lowHPEffectData.value;
        })
        .yoyo(true)
        .repeat(2)
        .start();
};

SkateboardObby_NetworkManager.prototype.diedEffect = function () {
    // dying while the pause menu is open (the board can still roll off while paused): close it, only the dead panel stays
    if (this.app.menuPanelEnabled || this.menuPanel.enabled) {
        this.menuPanel.enabled = false;
        this.app.menuPanelEnabled = false;
    }

    //kirmizi ekran tween
    this.canRespawn = false;
    this.app.deadMenuEnabled = true;

    this.lowHPEffectMethod();

    this.deadPanel.setLocalPosition(0, -600, 0);
    this.deadPanel.enabled = true;
    this.deadPanel
        .tween(this.deadPanel.getLocalPosition()).to(new pc.Vec3(0, 0, 0), 0.5, pc.SinOut)
        .delay(0.5)
        .start();

    this.blackBackground.enabled = true;
    this.data = { value: 0 };
    this.blackBackground
        .tween(this.data).to({ value: 0.8 }, 0.5, pc.SineOut)
        .onUpdate((dt) => {
            this.blackBackground.element.opacity = this.data.value;
        })
        .onComplete(() => {
            this.canRespawn = true;
        })
        .delay(0.25)
        .start();
};

SkateboardObby_NetworkManager.prototype.update = function (dt) {
    this.updateMenuCloseAd();
    if (!this.room || !this.playerEntities) return;
    this.interpolatePositionAndRotation(dt);
    this.updateRemoteChunks(dt);
}

// A remote player on a closed chunk has no ground under it: hidden until its stage opens or it comes close.
// A disabled entity keeps its position (progress bar) and state, and costs no animation / skinning.
SkateboardObby_NetworkManager.REMOTE_NEAR_RANGE = 40;
SkateboardObby_NetworkManager.REMOTE_SMOOTH_TIME = 0.2;   // seconds behind the last sample while moving
SkateboardObby_NetworkManager.REMOTE_TURN_RATE = 6;

SkateboardObby_NetworkManager.prototype.updateRemoteChunks = function (dt) {
    this._chunkTimer = (this._chunkTimer || 0) - dt;
    if (this._chunkTimer > 0) return;
    this._chunkTimer = 0.25;

    const chunks = this.app.skateStageChunks;
    const anchors = chunks && chunks._anchors;
    if (!anchors || !anchors.length || !this.player) return;
    const me = this.player.getPosition();
    const near = SkateboardObby_NetworkManager.REMOTE_NEAR_RANGE;
    for (const sessionId in this.playerEntities) {
        if (sessionId === this.localSessionId) continue;
        const entity = this.playerEntities[sessionId];
        const p = entity.getPosition();
        let best = 0, bestD = Infinity;
        for (let i = 0; i < anchors.length; i++) {
            const a = anchors[i].pos;
            const dx = a.x - p.x, dy = a.y - p.y, dz = a.z - p.z;
            const d = dx * dx + dy * dy * 4 + dz * dz;
            if (d < bestD) { bestD = d; best = anchors[i].chunk; }
        }
        // the anchor is the checkpoint at a stage's end: the first half of a stage still counts as the stage before
        let show = best >= chunks.chunkMin - 1 && best <= chunks.chunkMax;
        if (!show) {
            const dx = me.x - p.x, dy = me.y - p.y, dz = me.z - p.z;
            show = dx * dx + dy * dy + dz * dz < near * near;
        }
        if (entity.enabled !== show) entity.enabled = show;
    }
};

SkateboardObby_NetworkManager.prototype.interpolatePositionAndRotation = function (dt) {
    if (!this.interpolatedRotation) {
        this.interpolatedRotation = new pc.Quat();
    }
    for (var key in this.playerEntities) {
        //pass local player
        if (key == this.room.sessionId) continue;

        const playerEntity = this.playerEntities[key];
        const playerBody = playerEntity.playerBody;
        if (!playerBody || !playerEntity.networkPosition) continue;

        const position = playerEntity.getPosition();
        const target = playerEntity.networkPosition;
        const velocity = playerEntity.networkVelocity;
        if (position.distance(target) < 20) {
            // critically damped follow, same formula on each axis (Unity SmoothDamp): a remote player keeps a steady
            // speed although the samples arrive unevenly; it never overshoots and does not depend on the frame rate
            const omega = 2 / SkateboardObby_NetworkManager.REMOTE_SMOOTH_TIME;
            const x = omega * dt;
            const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

            let change = position.x - target.x;
            let temp = (velocity.x + omega * change) * dt;
            velocity.x = (velocity.x - omega * temp) * decay;
            const px = target.x + (change + temp) * decay;

            change = position.y - target.y;
            temp = (velocity.y + omega * change) * dt;
            velocity.y = (velocity.y - omega * temp) * decay;
            const py = target.y + (change + temp) * decay;

            change = position.z - target.z;
            temp = (velocity.z + omega * change) * dt;
            velocity.z = (velocity.z - omega * temp) * decay;
            const pz = target.z + (change + temp) * decay;

            playerEntity.setPosition(px, py, pz);
        } else {
            velocity.set(0, 0, 0);
            playerEntity.setPosition(target);
        }

        //rotation, about as late as the position: the board stays on the slope / loop it is drawn on

        this.interpolatedRotation.slerp(playerBody.getRotation(),
            playerEntity.networkRotation, Math.min(1, SkateboardObby_NetworkManager.REMOTE_TURN_RATE * dt));
        playerBody.setRotation(this.interpolatedRotation);
    }
};

// The engine fires this script's own events (enable / disable / state / destroy / attr) through this.fire.
// They must reach this script's listeners (e.g. the 'destroy' cleanup in initialize), not become app events
// or network signals. Before this check the cleanup never ran and every visit to the mode left its
// mousedown / goToNextCheckpoint / copiedRoomId listeners behind (found 2026-10-14).
SkateboardObby_NetworkManager.SCRIPT_EVENTS = { enable: true, disable: true, state: true, destroy: true, attr: true };
SkateboardObby_NetworkManager.prototype.fire = function (fireName, shouldReplicate = false, shouldPrint = false) {
    if (SkateboardObby_NetworkManager.SCRIPT_EVENTS[fireName] === true || (typeof fireName === "string" && fireName.indexOf("attr:") === 0)) {
        return pc.EventHandler.prototype.fire.apply(this, arguments);
    }
    if (shouldReplicate && this.room) {
        this.room.send("Client:FireSignal", { signal: fireName });
    } else {
        this.app.fire(fireName);
    }

    if (shouldPrint) { console.log(fireName); }
};

SkateboardObby_NetworkManager.prototype.send = function (_name, _args) {
    if (this.room) {
        this.room.send(_name, _args);
    } else {
        this.app.fire(_name, _args);
    }
}


// Server usernames are Hebrew for now; show a local English nickname instead.
// Each player gets one random name for the whole session.
var SkateboardObby_LocalName = {
    adjective: ["Funny", "Giga", "Angry", "Sad", "Happy", "Second", "First", "White", "Blue", "Green", "Red", "Wow", "Hey", "Excited", "Anxious", "Overweight", "Demonic", "Jumpy", "Bald", "Squashed", "Clean", "Broad", "Crooked", "Curved", "Deep", "Even", "Excited", "Anxious", "Long", "Demonic", "Jumpy", "Fit", "Squashed", "Good", "Broad", "Crooked", "Curved", "Deep", "Even", "Flat", "Hilly", "Jagged", "Round", "Shallow", "Square", "Steep", "Straight", "Thick", "Thin", "Simple", "Deafening", "Faint", "Harsh", "High", "Hissing", "Hushed", "Husky", "Loud", "Melodic", "Moaning", "Mute", "Noisy", "Purring", "Quiet", "Raspy", "Plain", "Shrill", "Silent", "Soft", "Squeaky", "Squealing", "Thundering", "Voiceless", "Bad"],
    object: ["Memo", "Buro", "Amhet", "Emo", "Cuvan", "Pillow", "Word", "Mirror", "Balloon", "Nail", "Lamp", "Roll", "Bow", "Hair", "Fishing", "Steak", "Broccoli", "Packet", "Shovel", "Harmonica", "Pack", "Rope", "Pencil", "Fish", "Pocketwatch", "Bow", "Notepad", "Bottle", "Pair", "Locket", "Jigsaw", "Leg", "Baseball", "Tomato", "Lotion", "Table", "Fake", "Spice", "Nail", "Screw", "Cookie", "Television", "Spatula", "CD", "Perfume", "Shoe", "Lace", "Phone", "Plush", "Glasses", "Dove", "Toy", "Needle", "Street", "Package", "Can", "Laser", "Matchbook", "Conditioner", "Sandal", "Wallet", "Roll", "Door", "Rubber", "Lamp", "Pair", "Football", "Sword", "Paintbrush", "Panda", "Model", "Pair", "Face", "Bag", "Comic", "Video", "Bag", "Chain", "Bag", "Screwdriver", "Socks", "Salt", "Glass", "Book", "Deodorant", "Tea", "Rhino", "Twister", "Magnet", "Paint", "Clay", "Can", "Bottle", "Stick", "Bell", "Shark", "Handheld", "Outlet", "Shoe", "Card", "Grass", "Folder", "Chad", "Pepe", "Air", "Type", "Color", "Key", "King", "Mask", "Bottle", "Mouse", "Player", "Bankrupt", "Taco", "Burger", "Sphere", "Watermelon", "Cheese", "Apple", "Spider", "Dragon", "Control", "Soda", "Barbie", "Watch", "Pen", "Bill", "Stuffed", "Hair", "Sun", "Guy", "Key", "Towel", "Hat", "Camera", "Sanitizer", "Photo", "Bone", "Brush", "Birthday", "Berna", "Sunset", "Wind", "Penguin", "Turkey", "Poki", "Babe", "Lava", "Bruh", "Tooth", "Nail", "Rat", "Cat", "Dog", "Lemur", "Crystal", "Tiger", "Quartz", "Diamond", "Emerald", "Sock", "Bread", "Ice", "Cube", "Unicorn", "Cow", "Chest", "Gold", "Wheat", "Farmer", "Farm", "Bear", "Sword", "Soda", "Can", "Stick", "Fish", "Sandal", "Space", "Car", "Vase", "Lion", "Bulb", "Flower", "Daisy", "Snail", "Carrot"],
    names: {},

    random: function () {
        const prefix = this.adjective[Math.floor(Math.random() * this.adjective.length)];
        const name = this.object[Math.floor(Math.random() * this.object.length)];
        return prefix + name;
    },

    get: function (sessionId, serverName) {
        if (serverName && !/[\u0590-\u05FF]/.test(serverName)) { return serverName; }
        if (!this.names[sessionId]) { this.names[sessionId] = this.random(); }
        return this.names[sessionId];
    }
};
