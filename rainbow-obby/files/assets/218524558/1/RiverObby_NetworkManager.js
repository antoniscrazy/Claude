var RiverObby_NetworkManager = pc.createScript('riverObbyNetworkManager');
RiverObby_NetworkManager.attributes.add('stageMats', { type: 'asset', assetType: 'material', array: true });
RiverObby_NetworkManager.attributes.add("mobileControls", { type: "entity" });
RiverObby_NetworkManager.attributes.add("onlineCounter", { type: "entity" });
RiverObby_NetworkManager.attributes.add("localPlayer", { type: "entity" });
RiverObby_NetworkManager.attributes.add('playerTemplate', { type: 'asset', assetType: 'template' });
RiverObby_NetworkManager.attributes.add('deadPanel', { type: 'entity' });
RiverObby_NetworkManager.attributes.add('blackBackground', { type: 'entity' });
RiverObby_NetworkManager.attributes.add('joinRoomUI', { type: 'entity' });

RiverObby_NetworkManager.prototype.mobileAndTabletCheck = function () {
    return this.app.touch != null;
};

// initialize code called once per entity
RiverObby_NetworkManager.prototype.initialize = async function () {
    this.app.riverObbyNetworkManager = this;
    this.app.isMobile = this.mobileAndTabletCheck();
    this.app.targetFov = 60;

    this.app.isMarketEnabled = false;
    this.app.deadMenuEnabled = false;
    this.app.rewardedPanelEnabled = false;
    this.app.menuPanelEnabled = false;

    this.mouseLockCounter = 0;
    this.app.canLockPointer = true;
    this.app.cameraStateLocked = false;
    this.isFirstClick = true;
    // on mouse down
    const onMouseDown = () => {
        if (this.isFirstClick == true) {
            this.isFirstClick = false;
        }
        const camResult = this.app.menuPanelEnabled || this.app.deadMenuEnabled || this.app.isMarketEnabled;
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
    this.on("copiedRoomId", this.copiedRoomId, this);

    this.mobileControls.enabled = this.app.isMobile;
    this.jumpButton = this.mobileControls.findByName("JumpButton");
    this.playerController = this.localPlayer.script.riverObbyPlayerController;
    this.lowHPEffect = this.app.root.findByName("lowHPEffect");
    this.savePoints = this.app.root.findByName("CheckPoints");
    this.stageUIText = this.app.root.findByName("StageUIText");
    this.coinText = this.app.root.findByName("CoinText");
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

    this.deadPanelRespawn = this.deadPanel.findByName("RespawnButton");
    this.deadPanelRespawn.button.on('click', function (event) {
        if (this.canRespawn === true) {
            watchCommercial(() => {
                this.playerController.respawn();
                this.respawn();
                this.canRespawn = false;
            })
        }
    }, this);


    setTimeout(async ()=>{ if (this.entity && !this.entity.script) return;
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

    this.resetButton = this.app.root.findByName("ResetButton");
    this.resetButton.button.on('click', function (event) {
        if (this.playerController.isDied == false)
            this.playerController.died();
    }, this);

    this.menuButton = this.app.root.findByName("MenuButton");
    this.menuButton.button.on('click', function (event) {
        this.setMenu(!this.menuPanel.enabled);
    }, this);

    this.deadPanelRewarded = this.deadPanel.findByName("RewardedAdButton");
    this.deadPanelRewarded.button.on('click', function (event) {
        PokiSDK.rewardedBreak({
            size: "small",
            onStart: () => {
                this.app.isWatchingAd = true;
                this.app.systems.sound.volume = 0;
            }
        }).then((success) => {
            console.log("Rewarded break finished, proceeding to game", success);
            this.app.systems.sound.volume = 1;
            this.app.isWatchingAd = false;
            if (success) {
                this.increaseStage(this.app.currentStage + 1);
                this.playerController.respawn();
                this.respawn();

                this.localPlayer.sound.play("prize");
            }
        });
    }, this);

    this.mainMenuButton = this.menuPanel.findByName("MainMenuButton");
    this.mainMenuButton.button.on('click', async function (event) {
        if (this.room)
            await this.room.leave();
        this.app.scenes.changeScene("Menu");
    }, this);

    this.createRoomButton = this.menuPanel.findByName("CreateRoomButton");
    this.createRoomButton.button.on('click', async function (event) {
        if (this.room) {
            await this.room.leave();
        }
        RiverObby_Utils.setItem("RIVEROBBY_createCustomRoom", "1");
        this.app.scenes.changeScene("RiverObby");
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
            RiverObby_Utils.setItem("RIVEROBBY_joinCustomRoom", roomId);
            if (this.room)
                await this.room.leave();
            this.app.scenes.changeScene("RiverObby");
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

    this.loadLocalStorageData();

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

    this.on('destroy', function () {
        this.app.mouse.off("mousedown", onMouseDown);
    }, this);
};

RiverObby_NetworkManager.prototype.onOrientationChange = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > h) {
        // Landscape
        this.progressBar.enabled = true;
    }
    else {
        // Portrait
        this.progressBar.enabled = false;
    }
}

RiverObby_NetworkManager.prototype.increaseStage = function (stageNumber = 0) {
    let lastStage = 13;
    this.app.currentStage = Math.min(stageNumber, lastStage);

    RiverObby_Utils.setItem("RIVEROBBY_currentStage", this.app.currentStage);

    // Stage UI yazısı (1, 2, 3 gibi gösteriyor)
    this.stageUIText.element.text = this.app.currentStage + 1;

    // Yüzde hesapla
    let percentage = ((this.app.currentStage + 1) / lastStage) * 100;

    // % yazısını güncelle
    this.stagePercentageText.text = percentage.toFixed(0) + "%";

    // Pin pozisyonunu yüzdeye göre ayarla (0 → 540)
    let pinX = (percentage / 100) * 540;
    this.stagePercentagePin.setLocalPosition(pinX, -40, 0);

    this.app.fire("stageChanged", stageNumber);
};


RiverObby_NetworkManager.prototype.loadLocalStorageData = function () {
    const currentStage = RiverObby_Utils.getItem("RIVEROBBY_currentStage");
    if (currentStage) {
        this.app.currentStage = Number.parseInt(currentStage)
    } else {
        this.app.currentStage = 0;
        RiverObby_Utils.setItem("RIVEROBBY_currentStage", 0);
    }
    const coin = RiverObby_Utils.getItem("RIVEROBBY_coin");
    if (coin) {
        this.app.coin = Number.parseInt(coin)
    } else {
        this.app.coin = 0;
        RiverObby_Utils.setItem("RIVEROBBY_coin", 0);
    }
    this.increaseStage(this.app.currentStage);
    this.coinText.element.text = this.app.coin;
};

RiverObby_NetworkManager.prototype.copiedRoomId = function () {
    if (this.room) {
        PokiSDK.shareableURL({ room: this.room.id + "5" }).then(url => {
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

RiverObby_NetworkManager.prototype.setBlackBG = function (state = true) {
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

RiverObby_NetworkManager.prototype.collectCoin = function (amount = 1) {
    this.app.coin += amount;
    if (amount === 1)
        this.localPlayer.fire("collectCoin");
    this.localPlayer.sound.play("collectCoin");
    RiverObby_Utils.setItem("RIVEROBBY_coin", this.app.coin);
    this.coinText.element.text = this.app.coin;
};

RiverObby_NetworkManager.prototype.decreaseCoin = function (amount = 1) {
    this.app.coin -= amount;
    RiverObby_Utils.setItem("RIVEROBBY_coin", this.app.coin);
    this.coinText.element.text = this.app.coin;
};

// update code called every frame
RiverObby_NetworkManager.prototype.postUpdate = function (dt) {
    //respawn
    if (this.app.keyboard.wasPressed(pc.KEY_SPACE) && this.app.deadMenuEnabled) {
        this.deadPanelRespawn.button.fire('click');
    }

    if (pc.platform.touch)
        return;

    if (!pc.Mouse.isPointerLocked()) {
        camResult = this.app.isWatchingAd == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false;
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

RiverObby_NetworkManager.prototype.setMenu = function (state = true) {
    if (state) {
        this.menuPanel.enabled = true;
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

RiverObby_NetworkManager.prototype.listenPlayers = function () {
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
                let rot = new pc.Vec3(0, player.rotationY, 0);
                //interpolate this position in update
                targetPlayer.networkPosition = new pc.Vec3(player.x, player.y, player.z);
                //interpolate this rotation in update
                targetPlayer.networkRotation = new pc.Quat().setFromEulerAngles(rot.x, rot.y, rot.z);
                targetPlayer.script.riverObbyOtherPlayerController.handleAnimations(player);
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
        //newPlayer.setPosition(player.x, player.y, player.z);
        this.playerEntities[sessionId] = newPlayer;

        player.listen("isDead", (isDead, oldData) => {
            if (sessionId === this.localSessionId) return;
            if (isDead) {
                if (oldData == false)
                    this.playerEntities[sessionId].script.riverObbyOtherPlayerController.died();
            } else {
                this.playerEntities[sessionId].script.riverObbyOtherPlayerController.respawn();
            }
        });

        player.listen("username", (username) => {
            if (sessionId === this.localSessionId) {
                this.localPlayer.findByName("Username").element.text = username;
            } else {
                this.playerEntities[sessionId].script.riverObbyOtherPlayerController.username.element.text = username;
            }
        });

        player.listen("boatId", (newBoat) => {
            //local değilse
            if (sessionId != this.localSessionId) {
                this.playerEntities[sessionId].script.riverObbyOtherPlayerController.setBoat(newBoat);
            }
        });

        player.listen("isInWater", (isInWater) => {
            //local değilse
            if (sessionId != this.localSessionId) {
                this.playerEntities[sessionId].script.riverObbyOtherPlayerController.setIsInWater(isInWater);
            }
        });
    }, false);

    //player disconnected
    this.room.state.players.onRemove((player, sessionId) => {
        this.onlineCount -= 1;
        this.onlineCounter.element.text = this.onlineCount;

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
            this.playerEntities[data.playerId].script.riverObbyOtherPlayerController.died();
        }
    });

    this.room.onMessage("Server:PlayerControllerOther:respawn", (data) => {
        //local değilse
        if (data.playerId != this.localSessionId) {
            this.playerEntities[data.playerId].script.riverObbyOtherPlayerController.respawn();
        }
    });
};

RiverObby_NetworkManager.prototype.respawn = function () {
    this.app.deadMenuEnabled = false;
    this.deadPanel.enabled = false;
    this.setBlackBG(false);
};

RiverObby_NetworkManager.prototype.syncLocalData = async function () {
    if (this.room && this.app.riverObbyPlayerController && this.app.riverObbyPlayerController.boatId) {
        this.room.send("Client:BoatChange", { boatId: this.app.riverObbyPlayerController.boatId })
    }
};

RiverObby_NetworkManager.prototype.joinServer = async function () {
    try {
        console.log("try connecting server");
        this.app.colyseus = new Colyseus.Client("wss://rainbowobby1.emolingo.games");
        //this.app.colyseus = new Colyseus.Client("ws://localhost:2567");
        const roomIdFromURL = PokiSDK.getURLParam('room');
        const customRoomId = RiverObby_Utils.getItem("RIVEROBBY_joinCustomRoom");
        if (RiverObby_Utils.getItem("RIVEROBBY_createCustomRoom") === "1") {
            RiverObby_Utils.setItem("RIVEROBBY_createCustomRoom", "");
            this.room = await this.app.colyseus.create("riverObby", { accessToken: "riverobby", private: true });
            this.app.fire("popupController:showPopup",
                "Private Room Created", "Room code: " + this.room.roomId + "5", false, this, "copiedRoomId", "closePopup", { yesButtonText: "Copy" });
            console.log("--- PRIVATE ROOM CREATED");
        } else if (customRoomId != "" && customRoomId != null) {
            this.room = await this.app.colyseus.joinById(customRoomId.slice(0, -1), { accessToken: "riverobby" });
            RiverObby_Utils.setItem("RIVEROBBY_joinCustomRoom", "");
        } else if (roomIdFromURL != "" && roomIdFromURL != null) {
            this.room = await this.app.colyseus.joinById(roomIdFromURL.slice(0, -1), { accessToken: "riverobby" });
            RiverObby_Utils.setItem("RIVEROBBY_joinCustomRoom", "");
        } else {
            this.room = await this.app.colyseus.joinOrCreate("riverObby", { accessToken: "riverobby" });
        }
        //this.room = await this.app.colyseus.joinOrCreate("riverObby", { accessToken: "riverobby" });
        console.log("connected to the ", this.room.name);
        //send player data to sync
        this.syncLocalData();
    } catch (e) {
        console.log(e);
        if (e.toString().includes("not found")) {
            RiverObby_Utils.setItem("RIVEROBBY_joinCustomRoom", "");
            this.app.fire('WarningTextController:setWarning', "Failed to join... Room is full or Id invalid :/", 5, new pc.Color(1, 0, 0, 1));
        }
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

RiverObby_NetworkManager.prototype.lowHPEffectMethod = function () {
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

RiverObby_NetworkManager.prototype.diedEffect = function () {
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

RiverObby_NetworkManager.prototype.update = function (dt) {
    this.interpolatePositionAndRotation(dt);
}

RiverObby_NetworkManager.prototype.interpolatePositionAndRotation = function (dt) {
    for (var key in this.playerEntities) {
        //pass local player
        if (key == this.room.sessionId) continue;

        const playerEntity = this.playerEntities[key];
        const playerBody = playerEntity.findByName("Body");

        this.interpolatedPosition = playerEntity.getPosition().clone();
        if (this.interpolatedPosition.distance(playerEntity.networkPosition) < 20) {
            this.interpolatedPosition.lerp(playerEntity.getPosition(),
                playerEntity.networkPosition, 5 * dt);
            playerEntity.setPosition(this.interpolatedPosition);
        } else {
            playerEntity.setPosition(playerEntity.networkPosition);
        }

        //rotation
        this.interpolatedRotation = playerBody.getRotation().clone();
        this.interpolatedRotation.slerp(playerBody.getRotation(),
            playerEntity.networkRotation, 5 * dt);
        playerBody.setRotation(this.interpolatedRotation);
    }
};