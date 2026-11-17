var SlimeTower_NetworkManager = pc.createScript('slimeTowerNetworkManager');

SlimeTower_NetworkManager.attributes.add("mobileControls", { type: "entity" });
SlimeTower_NetworkManager.attributes.add("onlineCounter", { type: "entity" });
SlimeTower_NetworkManager.attributes.add("localPlayer", { type: "entity" });
SlimeTower_NetworkManager.attributes.add('playerTemplate', { type: 'asset', assetType: 'template' });
SlimeTower_NetworkManager.attributes.add('deadPanel', { type: 'entity' });
SlimeTower_NetworkManager.attributes.add('blackBackground', { type: 'entity' });
SlimeTower_NetworkManager.attributes.add('joinRoomUI', { type: 'entity' });
SlimeTower_NetworkManager.attributes.add('roomID', { type: 'number' });
SlimeTower_NetworkManager.attributes.add('roomName', { type: 'string', default: "slimeTower" });

SlimeTower_NetworkManager.prototype.mobileAndTabletCheck = function () {
    return this.app.touch != null;
};

// initialize code called once per entity
SlimeTower_NetworkManager.prototype.initialize = async function () {
    this.world2Layer = this.app.scene.layers.getLayerByName("World2");
    this.world2Layer.clearDepthBuffer = true;
    this.app.slimeTowerNetworkManager = this;
    this.app.isMobile = this.mobileAndTabletCheck();
    this.app.targetFov = 60;
    this.app.isPopupEnabled = false;
    this.app.isMarketEnabled = false;
    this.app.deadMenuEnabled = false;
    this.app.menuPanelEnabled = false;

    this.isPlaycanvas = false;
    this.isInspector = false;

    if (window.location.href.indexOf('launch.playcanvas.com') > -1) {
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
        const camResult = this.app.isPopupEnabled || this.app.menuPanelEnabled || this.app.deadMenuEnabled || this.app.isMarketEnabled || this.app.numpad.enabled;
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
    this.playerController = this.localPlayer.script.slimeTowerPlayerController;
    this.lowHPEffect = this.app.root.findByName("lowHPEffect");
    this.onlineCounter = this.app.root.findByName("OnlineCounter");
    this.stagePercentageText = this.app.root.findByName("stagePercentageText").element;
    this.stagePercentagePin = this.app.root.findByName("stagePercentagePin");
    this.progressBar = this.app.root.findByName("ProgressBar");
    //menu
    this.menuPanel = this.app.root.findByName("Menu");
    this.menuCloseButton = this.menuPanel.findByName("CloseButton");
    this.menuCloseButton.button.on('click', function (event) {
        this.setMenu(false);
    }, this);


    setTimeout(async () => { if (this.entity && !this.entity.script) return;
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
                    this.app.fire('WarningTextController:setWarning', "Login Error ", 5, new pc.Color(1, 0, 0, 1));
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

    this.database = this.app.root.findByName("ItemDatabase").script.slimeTowerItemDatabase;

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

                console.log("commercial break")
            });
        }
    }, this);

    this.app.root.findByName("RewardedAdButton").button.on("click", () => {
        if (this.canRespawn === true) {
            watchRewarded(() => {
                this.app.fire("Game:SkipTest");
                this.playerController.respawn(true);
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
        this.app.fire("playerDie");
    }, this);

    this.createRoomButton = this.menuPanel.findByName("CreateRoomButton");
    this.createRoomButton.button.on('click', async function (event) {
        if (this.room) {
            await this.room.leave();
        }
        SlimeTower_Utils.setItem("SlimeTower_createCustomRoom", "1");
        this.app.scenes.changeScene("SlimeTower");
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
            console.log('join roomId:', roomId);
            SlimeTower_Utils.setItem("SlimeTower_joinCustomRoom", roomId);
            if (this.room)
                await this.room.leave();
            this.app.scenes.changeScene("SlimeTower");
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
        PokiSDK.openExternalLink("https://discord.gg/QnZx3pMwHU");
    }, this);

    this.clearDataButton = this.menuPanel.findByName("ClearData");
    this.clearDataButton.button.on('click', function (event) {
        this.app.fire("popupController:showPopup",
            "Delete progress", "Would you like to reset your progress?", true, this.app, "resetData", "closePopup");
    }, this);

    this.onOrientationChange();
    this._onOrientationChangeBound = this.onOrientationChange.bind(this);
    window.addEventListener("resize", this._onOrientationChangeBound, false);
    window.addEventListener("orientationchange", this._onOrientationChangeBound, false);
    this.on('destroy', () => {
        window.removeEventListener("resize", this._onOrientationChangeBound, false);
        window.removeEventListener("orientationchange", this._onOrientationChangeBound, false);
    });

    const joined = await this.joinServer();
    if (this.entity && !this.entity.script) { if (this.room) this.room.leave(); return; }
    if (joined) {
        this.listenPlayers();
    }


    this.app.on("goToNextCheckpoint", this.goToNextCheckpoint, this)

    SlimeTower_Utils.setItem("SlimeTower_" + this.roomName, "1");

    this.on('destroy', function () {
        this.app.mouse.off("mousedown", onMouseDown);
        this.app.off("goToNextCheckpoint");
        this.app.off("copiedRoomId", this.copiedRoomId, this);
    }, this);

};

SlimeTower_NetworkManager.prototype.onOrientationChange = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > h) {
        // Landscape

    }
    else {
        // Portrait

    }
}

SlimeTower_NetworkManager.prototype.copiedRoomId = function () {
    if (this.room) {
        PokiSDK.shareableURL({ room: this.room.id + this.roomID }).then(url => {
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
        this.app.fire('WarningTextController:setWarning', "Copied the URL, now share with your friends!", 5, new pc.Color(0, 1, 0, 1));
    }
}

SlimeTower_NetworkManager.prototype.setBlackBG = function (state = true) {
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
SlimeTower_NetworkManager.prototype.postUpdate = function (dt) {

    //respawn
    if (this.app.keyboard.wasPressed(pc.KEY_SPACE) && this.app.deadMenuEnabled) {
        this.deadPanelRespawn.button.fire('click');
    }

    if (pc.platform.touch)
        return;

    if (!pc.Mouse.isPointerLocked()) {
        camResult = this.app.isWatchingAd == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && this.app.isPopupEnabled == false && this.app.numpad.enabled == false;
        if (camResult) {
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

SlimeTower_NetworkManager.prototype.setMenu = function (state = true) {
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
        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.menuCloseButton.enabled = true;
        }, 2000);
    } else {
        this.menuPanel.enabled = false;
        this.setBlackBG(false);
        this.app.menuPanelEnabled = false;
        this.app.fire("lockCamera", false);
    }
};

SlimeTower_NetworkManager.prototype.listenPlayers = function () {
    this.playerEntities = {};
    this.onlineCount = 0;

    //player connected
    this.room.state.players.onAdd((player, sessionId) => {
        this.onlineCount += 1;
        if (this.onlineCounter.element)
            this.onlineCounter.element.text = this.onlineCount;

        player.onChange(() => {
            const targetPlayer = this.playerEntities[sessionId];
            if (targetPlayer == null) return;
            //if its local player then ignore
            if (this.room.sessionId === sessionId) {
            } else { //not local player, interpolate
                let rot = new pc.Vec3(player.rotationX, player.rotationY, player.rotationZ);
                //interpolate this position in update
                targetPlayer.networkPosition = new pc.Vec3(player.x, player.y, player.z);


                //interpolate this rotation in update
                targetPlayer.networkRotation = new pc.Quat().setFromEulerAngles(rot.x, rot.y, rot.z);
                if (targetPlayer.script) {
                    targetPlayer.script.slimeTowerOtherPlayerController.handleAnimations(player);
                }

                //console.log(rot);
            }
        });

        let newPlayer;
        //if its local player
        if (this.room.sessionId === sessionId) {
            this.localSessionId = sessionId;
            newPlayer = this.player;
        } else {
            newPlayer = this.playerTemplate.resource.instantiate();
            newPlayer.sessionId = sessionId;
            this.app.root.addChild(newPlayer);
        }

        this.app.fire("player:add", newPlayer);
        //newPlayer.setPosition(player.x, player.y, player.z);
        newPlayer.networkData = player;
        this.playerEntities[sessionId] = newPlayer;

        player.listen("isDead", (isDead) => {
            if (sessionId === this.localSessionId) return;
            if (isDead) {
                this.playerEntities[sessionId].script.slimeTowerOtherPlayerController.died();
            } else {
                this.playerEntities[sessionId].script.slimeTowerOtherPlayerController.respawn();
            }
        });

        player.listen("username", (username) => {
            if (sessionId === this.localSessionId) {
                this.localPlayer.findByName("Username").element.text = username;
                this.app.fire("player:setUsername", this.localPlayer, username, true);
            } else {
                this.playerEntities[sessionId].script.slimeTowerOtherPlayerController.username.element.text = username;
                this.app.fire("player:setUsername", this.playerEntities[sessionId], username, false);
            }
        });

        player.listen("activeItemId", (newActiveItemID) => {
            if (sessionId === this.localSessionId) {

            } else {
                this.playerEntities[sessionId].script.slimeTowerOtherPlayerController.setActiveItem(newActiveItemID);
            }
        })

        player.listen("isPauseMenu", (newIsPauseMenu) => {
            if (sessionId === this.localSessionId) {
                this.app.slimeTowerPlayerController.entity.findByName("AfkBox").enabled = newIsPauseMenu;
                this.app.gameManager.isPauseMenu = newIsPauseMenu;
            } else {
                this.playerEntities[sessionId].findByName("AfkBox").enabled = newIsPauseMenu;
            }
        })

        player.listen("isSparks", (newIsSparks) => {
            if (sessionId === this.localSessionId) {
                this.app.slimeTowerPlayerController.entity.findByName("Sparks").enabled = newIsSparks;
            } else {
                this.playerEntities[sessionId].findByName("Sparks").enabled = newIsSparks;
            }
        })

        player.listen("scale", (newScale) => {
            if (sessionId === this.localSessionId) {
                this.app.slimeTowerPlayerController.setScale(newScale);
            } else {
                this.playerEntities[sessionId].script.slimeTowerOtherPlayerController.setScale(newScale);
            }
        })

        player.listen("skin", (newSkin) => {
            if (sessionId === this.localSessionId) {
                this.app.slimeTowerPlayerController.setSkin(newSkin);
            } else {
                this.playerEntities[sessionId].script.slimeTowerOtherPlayerController.setSkin(newSkin);
            }
        })
    }, false);

    //player disconnected
    this.room.state.players.onRemove((player, sessionId) => {
        this.onlineCount -= 1;
        this.onlineCounter.element.text = this.onlineCount;

        this.app.fire("player:remove", player);

        if (this.localSessionId != sessionId) {
            if (this.playerEntities[sessionId].spawnedDeadBody) {
                this.playerEntities[sessionId].spawnedDeadBody.destroy();
            }

            this.playerEntities[sessionId].destroy();
        }

        delete this.playerEntities[sessionId];
    }, false);


    this.room.onMessage("Server:PlayerController:respawn", (sessionId) => {
        this.playerEntities[sessionId].script.playerController.respawn();
    });

    this.room.onMessage("Server:PlayerControllerOther:died", (data) => {
        //local değilse
        if (data.playerId != this.localSessionId) {
            this.playerEntities[data.playerId].script.slimeTowerOtherPlayerController.died();
        }
    });

    this.room.onMessage("Server:PlayerControllerOther:respawn", (data) => {
        //local değilse
        if (data.playerId != this.localSessionId) {
            this.playerEntities[data.playerId].script.slimeTowerOtherPlayerController.respawn();
        }
    });

    this.room.onMessage("Server:PlayerDie", (data) => {
        if (data.playerId == this.localSessionId) {
            this.app.fire("playerDie");
        }
    });

    this.room.onMessage("Server:FireSignal", (data) => {
        this.app.fire(data.signal);

        //console.log("Server:FireSignal", data.signal);
    });

    this.room.onMessage("Server:Die", (data) => {
        this.app.fire("playerDie");
    });

    this.room.onMessage("Server:HitPlayer", (data) => {
        console.log("Server:HitPlayer");

        let sessionId = this.app.slimeTowerNetworkManager.room.sessionId;

        if (data.attackerSessionId == sessionId || data.targetSessionId == sessionId) { this.app.gameManager.sfx_slap(); }

        let _force = new pc.Vec3(data.forceX, data.forceY, data.forceZ)
        if (data.targetSessionId == sessionId) {
            let _dir = new pc.Vec3(data.dirX, data.dirY, data.dirZ)
            this.app.slimeTowerPlayerController.roll(true, _force, _dir)
            console.log("target");
        } else {
            this.playerEntities[data.targetSessionId].script.slimeTowerOtherPlayerController.roll(true, _force);
            console.log("attacker");
        }
    });
};

SlimeTower_NetworkManager.prototype.respawn = function () {
    this.app.deadMenuEnabled = false;
    this.deadPanel.enabled = false;
    this.setBlackBG(false);
};

SlimeTower_NetworkManager.prototype.syncLocalData = async function () {

};

SlimeTower_NetworkManager.prototype.joinServer = async function () {
    try {
        console.log("try connecting server");
        //this.app.colyseus = new Colyseus.Client("ws://localhost:2567");
        //this.app.colyseus = new Colyseus.Client("wss://rainbowtest.emolingo.games");

        if (this.isPlaycanvas) {
            if (this.app.gameManager.localhost) {
                this.app.colyseus = new Colyseus.Client("ws://localhost:2567");
                //this.app.colyseus = new Colyseus.Client("wss://rainbowobby2.emolingo.games");
                console.log("LOCALHOST")
            }
            else {
                //this.app.colyseus = new Colyseus.Client("wss://rainbowtest.emolingo.games");
                this.app.colyseus = new Colyseus.Client("wss://rainbowobby1.emolingo.games");
                //this.app.colyseus = new Colyseus.Client("ws://localhost:2567");
                console.log("GLOBAL")
            }
        } else if (this.isInspector) {
            this.app.colyseus = new Colyseus.Client("wss://rainbowtest.emolingo.games");
        } else { //global
            this.app.colyseus = new Colyseus.Client("wss://rainbowobby1.emolingo.games");
        }

        const roomIdFromURL = PokiSDK.getURLParam('room');
        const customRoomId = SlimeTower_Utils.getItem("SlimeTower_joinCustomRoom");
        if (SlimeTower_Utils.getItem("SlimeTower_createCustomRoom") === "1") {
            SlimeTower_Utils.setItem("SlimeTower_createCustomRoom", "");

            this.room = await this.app.colyseus.create(this.roomName, { accessToken: this.roomName, private: true });

            /*
                        this.app.slimeTowerPopupController.showPopup(
                            "Private Room Created",
                            "Room code: " + this.room.roomId + "12",
                            false, this.app, "copiedRoomId", "closePopup", { yesButtonText: "Copy" }, false, true)
            */
            this.app.fire("popupController:showPopup",
                "Private Room Created", "Room code: " + this.room.roomId + this.roomID, false, this, "copiedRoomId", "closePopup", { yesButtonText: "Copy" });

            console.log("--- PRIVATE ROOM CREATED");

            this.app.mouse.disablePointerLock();
            this.app.cameraStateLocked = false;
            this.app.fire("lockCamera", true);
        } else if (customRoomId != "" && customRoomId != null) {
            if (customRoomId.length > 10) {
                this.room = await this.app.colyseus.joinById(customRoomId.slice(0, -2), { accessToken: this.roomName });
            } else {
                this.room = await this.app.colyseus.joinById(customRoomId.slice(0, -1), { accessToken: this.roomName });
            }
            SlimeTower_Utils.setItem("SlimeTower_joinCustomRoom", "");
        } else if (roomIdFromURL != "" && roomIdFromURL != null) {
            if (roomIdFromURL.length > 10) {
                this.room = await this.app.colyseus.joinById(roomIdFromURL.slice(0, -2), { accessToken: this.roomName });
            } else {
                this.room = await this.app.colyseus.joinById(roomIdFromURL.slice(0, -1), { accessToken: this.roomName });
            }
            SlimeTower_Utils.setItem("SlimeTower_joinCustomRoom", "");
        } else {
            this.room = await this.app.colyseus.joinOrCreate(this.roomName, { accessToken: this.roomName });
        }
        //this.room = await this.app.colyseus.joinOrCreate(this.roomName, { accessToken: this.roomName });
        console.log("connected to the ", this.room.name);
        this.app.fire("Connected");
        //send player data to sync
        this.syncLocalData();
    } catch (e) {
        console.log(e);
        if (e.toString().includes("not found")) {
            SlimeTower_Utils.setItem("SlimeTower_joinCustomRoom", "");
            this.app.fire('WarningTextController:setWarning', "Failed to join... Room is full or Id invalid :/", 5, new pc.Color(1, 0, 0, 1));
        }

        console.log("no server");

        this.app.fire("NoServer");
    }

    if (this.room) {
        this.room.onLeave((code) => {
            console.log("client left the room with code ", code);
        });
        this.room.onError((code, message) => {
            console.log("error code:", code, "oops, error ocurred:", message);
        });
    } else {
        return false;
    }
    return true;
};

SlimeTower_NetworkManager.prototype.lowHPEffectMethod = function () {
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

SlimeTower_NetworkManager.prototype.diedEffect = function () {
    //kirmizi ekran tween
    this.canRespawn = false;
    this.app.deadMenuEnabled = true;

    this.lowHPEffectMethod();

    //console.log("end", );

    this.app.root.findByName("RewardedAdButton").enabled = (this.app.playerItemManager.playerData.checkpoint != this.app.gameManager.checkpoints.length - 1);

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

SlimeTower_NetworkManager.prototype.update = function (dt) {
    this.interpolatePositionAndRotation(dt);
}

SlimeTower_NetworkManager.prototype.interpolatePositionAndRotation = function (dt) {
    for (var key in this.playerEntities) {
        //pass local player
        if (key == this.room.sessionId) continue;

        const playerEntity = this.playerEntities[key];
        //const playerBody = playerEntity.findByName("RollPivot");
        let playerBody = playerEntity.playerBody;

        if (playerBody) {
            if (playerBody.children[0].anim.getBoolean("sitting")) {
                playerBody.setLocalEulerAngles(0, 0, 0);
            } else {
                this.interpolatedPosition = playerEntity.getPosition().clone();
                if (this.interpolatedPosition.distance(playerEntity.networkPosition) < 20) {
                    this.interpolatedPosition.lerp(playerEntity.getPosition(),
                        playerEntity.networkPosition, 10 * dt);
                    playerEntity.setPosition(this.interpolatedPosition);
                } else {
                    playerEntity.setPosition(playerEntity.networkPosition);
                }

                //rotation

                this.interpolatedRotation = playerBody.getRotation().clone();
                this.interpolatedRotation.slerp(playerBody.getRotation(),
                    playerEntity.networkRotation, 15 * dt);
                playerBody.setRotation(this.interpolatedRotation);
            }
        }
    }
};

SlimeTower_NetworkManager.prototype.fire = function (fireName, shouldReplicate = false, shouldPrint = false) {
    if (fireName === 'destroy' || fireName === 'enable' || fireName === 'disable' || fireName === 'state' || fireName === 'attr' || (typeof fireName === 'string' && fireName.indexOf('attr:') === 0)) return pc.EventHandler.prototype.fire.apply(this, arguments);
    if (shouldReplicate && this.room) {
        this.room.send("Client:FireSignal", { signal: fireName });
    } else {
        this.app.fire(fireName);
    }

    if (shouldPrint) { console.log(fireName); }
};

SlimeTower_NetworkManager.prototype.send = function (_name, _args) {
    if (this.room) {
        this.room.send(_name, _args);
    } else {
        this.app.fire(_name, _args);
    }
}
