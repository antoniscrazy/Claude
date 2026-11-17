var PlaneObby_NetworkManager = pc.createScript('planeObbyNetworkManager');
PlaneObby_NetworkManager.attributes.add('stageMats', { type: 'asset', assetType: 'material', array: true });
PlaneObby_NetworkManager.attributes.add("mobileControls", { type: "entity" });
PlaneObby_NetworkManager.attributes.add("onlineCounter", { type: "entity" });
PlaneObby_NetworkManager.attributes.add("localPlayer", { type: "entity" });
PlaneObby_NetworkManager.attributes.add('playerTemplate', { type: 'asset', assetType: 'template' });
PlaneObby_NetworkManager.attributes.add('deadPanel', { type: 'entity' });
PlaneObby_NetworkManager.attributes.add('blackBackground', { type: 'entity' });
PlaneObby_NetworkManager.attributes.add('joinRoomUI', { type: 'entity' });

PlaneObby_NetworkManager.prototype.mobileAndTabletCheck = function () {
    return this.app.touch != null;
};

// initialize code called once per entity
PlaneObby_NetworkManager.prototype.initialize = async function () {
    this.app.planeObbyNetworkManager = this;
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
        const camResult = this.app.isPopupEnabled || this.app.menuPanelEnabled || this.app.deadMenuEnabled || this.app.isMarketEnabled;
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
    this.player = this.app.root.findByName("Player");
    this.playerController = this.localPlayer.script.planeObbyPlayerController;
    this.lowHPEffect = this.app.root.findByName("lowHPEffect");
    this.stageUIText = this.app.root.findByName("StageUIText");
    this.coinText = this.app.root.findByName("CoinText");
    this.onlineCounter = this.app.root.findByName("OnlineCounter");
    this.stagePercentageText = this.app.root.findByName("stagePercentageText").element;
    this.stagePercentagePin = this.app.root.findByName("stagePercentagePin");
    this.progressBar = this.app.root.findByName("ProgressBar");


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
            });
        }
    }, this);

    this.deadPanelRewarded = this.deadPanel.findByName("RewardedAdButton");
    this.deadPanelRewarded.button.on('click', function (event) {
        //this.setCheckpoint(this.app.checkpoint + 1);
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
                this.playerController.respawn(true);
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

    this.menuButton = this.app.root.findByName("MenuButton");
    this.menuButton.button.on('click', async function (event) {
        this.setMenu(!this.menuPanel.enabled);
    }, this);

    this.resetButton = this.app.root.findByName("ResetButton");
    this.resetButton.button.on('click', async function (event) {
        //this.playerController.dieOnPlane();
        this.app.fire("playerDie");
    }, this);

    this.createRoomButton = this.menuPanel.findByName("CreateRoomButton");
    this.createRoomButton.button.on('click', async function (event) {
        if (this.room) {
            await this.room.leave();
        }
        PlaneObby_Utils.setItem("PLANEOBBY_createCustomRoom", "1");
        this.app.scenes.changeScene("PlaneObby");
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
            PlaneObby_Utils.setItem("PLANEOBBY_joinCustomRoom", roomId);
            if (this.room)
                await this.room.leave();
            this.app.scenes.changeScene("PlaneObby");
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

    this.on('destroy', function () {
        this.app.mouse.off("mousedown", onMouseDown);
        this.app.off("goToNextCheckpoint");
    }, this);

    this.loadLocalStorageData();
    this.setCheckpoint(this.app.checkpoint);

    this.playerController.teleport()
};

PlaneObby_NetworkManager.prototype.loadLocalStorageData = function () {
    const currentStage = PlaneObby_Utils.getItem("PLANEOBBY_Checkpoint");
    if (currentStage) {
        this.app.checkpoint = Number.parseInt(currentStage)
    } else {
        this.app.checkpoint = 0;
        PlaneObby_Utils.setItem("PLANEOBBY_Checkpoint", 0);
    }
    const coin = PlaneObby_Utils.getItem("PLANEOBBY_Coin");
    if (coin) {
        this.app.coin = Number.parseInt(coin)
    } else {
        this.app.coin = 0;
        PlaneObby_Utils.setItem("PLANEOBBY_Coin", 0);
    }
    //this.increaseStage(this.app.currentStage);
    this.coinText.element.text = this.app.coin;

    console.log("checkpoint", this.app.checkpoint);
    this.app.fire("checkpointChanged");
};

PlaneObby_NetworkManager.prototype.onOrientationChange = function () {
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

PlaneObby_NetworkManager.prototype.setCheckpoint = function (new_checkpoint) {
    let last_checkpoint = this.app.root.findByName("Checkpoints").children.length;
    this.app.checkpoint = new_checkpoint;

    PlaneObby_Utils.setItem("PLANEOBBY_Checkpoint", this.app.checkpoint);

    // Stage UI yazısı (1, 2, 3 gibi gösteriyor)
    this.stageUIText.element.text = this.app.checkpoint + 1;

    // Yüzde hesapla
    let percentage = ((this.app.checkpoint) / (last_checkpoint - 1)) * 100;

    // % yazısını güncelle
    //this.stagePercentageText.text = percentage.toFixed(0) + "%";

    // Pin pozisyonunu yüzdeye göre ayarla (0 → 540)
    //let pinX = (percentage / 100) * 540;
    //this.stagePercentagePin.setLocalPosition(pinX, -40, 0);

    this.app.fire("checkpointChanged", new_checkpoint);
};

PlaneObby_NetworkManager.prototype.goToNextCheckpoint = function () {
    let checkpointRoot = this.app.root.findByName("Checkpoints");
    let checkpointCount = checkpointRoot.children.length;
    let nextCheckpoint = this.app.checkpoint + 1;
    nextCheckpoint = pc.math.clamp(nextCheckpoint, 0, checkpointCount - 1);
    this.setCheckpoint(nextCheckpoint);
    this.app.fire("teleportToCheckpoint");
};


PlaneObby_NetworkManager.prototype.copiedRoomId = function () {
    if (this.room) {
        PokiSDK.shareableURL({ room: this.room.id + "7" }).then(url => {
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

PlaneObby_NetworkManager.prototype.setBlackBG = function (state = true) {
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

PlaneObby_NetworkManager.prototype.collectCoin = function (amount = 1) {
    this.app.coin += amount;
    if (amount === 1)
        this.localPlayer.fire("collectCoin");
    this.localPlayer.sound.play("collectCoin");
    PlaneObby_Utils.setItem("PLANEOBBY_Coin", this.app.coin);
    this.coinText.element.text = this.app.coin;
};

PlaneObby_NetworkManager.prototype.decreaseCoin = function (amount = 1) {
    this.app.coin -= amount;
    PlaneObby_Utils.setItem("PLANEOBBY_Coin", this.app.coin);
    this.coinText.element.text = this.app.coin;
};

// update code called every frame
PlaneObby_NetworkManager.prototype.postUpdate = function (dt) {
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

PlaneObby_NetworkManager.prototype.setMenu = function (state = true) {
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

PlaneObby_NetworkManager.prototype.listenPlayers = function () {
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
                if (targetPlayer.script) {
                    targetPlayer.script.planeObbyOtherPlayerController.handleAnimations(player);
                }
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
        newPlayer.networkData = player;
        this.playerEntities[sessionId] = newPlayer;

        player.listen("isDead", (isDead) => {
            if (sessionId === this.localSessionId) return;
            if (isDead) {
                this.playerEntities[sessionId].script.planeObbyOtherPlayerController.died();
            } else {
                this.playerEntities[sessionId].script.planeObbyOtherPlayerController.respawn();
            }
        });

        player.listen("username", (username) => {
            if (sessionId === this.localSessionId) {
                this.localPlayer.findByName("Username").element.text = username;
            } else {
                this.playerEntities[sessionId].script.planeObbyOtherPlayerController.username.element.text = username;
            }
        });

        player.listen("planeId", (planeId) => {
            if (sessionId === this.localSessionId) {
                // local
                this.playerController.planeId = planeId
            } else {
                this.playerEntities[sessionId].planeId = planeId;
            }
        });

        player.listen("isInPlane", (newSitting) => {
            if (sessionId === this.localSessionId) {
                // local
            } else {
                setTimeout(() => { if (this.entity && !this.entity.script) return;
                    if (player.planeId && this.app.planeObbyPlaneManager.planes[player.planeId]) {
                        if (newSitting) {
                            console.log("id", player.planeId)
                            let playerPoint = this.app.planeObbyPlaneManager.planes[player.planeId].script.planeObbyPlane.driverPoint;
                            let playerEntity = this.playerEntities[sessionId]
                            if (playerEntity) {
                                playerEntity.reparent(playerPoint);
                                playerEntity.setLocalPosition(pc.Vec3.ZERO);
                                playerEntity.setLocalScale(pc.Vec3.ONE);
                                playerEntity.findByName("Body").setLocalEulerAngles(0, 0, 0);
                            }


                        } else {
                            this.playerEntities[sessionId].reparent(this.app.root);
                        }
                    } else if (player.guestPlaneId && this.app.planeObbyPlaneManager.planes[player.guestPlaneId]) {
                        if (newSitting) {
                            console.log("id", player.guestPlaneId)
                            let playerPoint = this.app.planeObbyPlaneManager.planes[player.guestPlaneId].script.planeObbyPlane.passengerPoint;
                            let playerEntity = this.playerEntities[sessionId]
                            playerEntity.reparent(playerPoint);
                            playerEntity.setLocalPosition(pc.Vec3.ZERO);
                            playerEntity.setLocalScale(pc.Vec3.ONE);
                            playerEntity.findByName("Body").setLocalEulerAngles(0, 0, 0);
                        } else {
                            this.playerEntities[sessionId].reparent(this.app.root);
                        }
                    }
                }, 200)


            }
        });

        player.listen("jetpackHas", (jetpackHas) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.jetpack.has = jetpackHas;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.applyPowerUpChanges();
        })

        player.listen("jetpackUsing", (jetpackUsing) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.jetpack.using = jetpackUsing;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.applyPowerUpChanges();
        })

        player.listen("flyingCarpetHas", (flyingCarpetHas) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.flyingCarpet.has = flyingCarpetHas;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.applyPowerUpChanges();
        })

        player.listen("tntHas", (tntHas) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.tnt.has = tntHas;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.applyPowerUpChanges();
        })

        player.listen("powerBlockHas", (powerBlockHas) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.powerBlock.has = powerBlockHas;
            this.playerEntities[sessionId].script.planeObbyOtherPlayerController.applyPowerUpChanges();
        })
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
            this.playerEntities[data.playerId].script.planeObbyOtherPlayerController.died();
        }
    });

    this.room.onMessage("Server:PlayerControllerOther:respawn", (data) => {
        //local değilse
        if (data.playerId != this.localSessionId) {
            this.playerEntities[data.playerId].script.planeObbyOtherPlayerController.respawn();
        }
    });

    this.room.onMessage("Server:DamagePart", (data) => {
        this.app.planeObbyPlaneManager.damagePart(data.planeId, data.damage, data.part);
    });

    this.room.onMessage("Server:DestroyPart", (data) => {
        this.app.planeObbyPlaneManager.destroyPart(data.planeId, data.part);
    });

    this.room.onMessage("Server:DestroyPlane", (data) => {
        if (data.playerId == this.localSessionId) {
            this.app.planeObbyPlaneManager.destroyPlane(data.planeId);
        } else { this.app.planeObbyPlaneManager.expoEffect(data.planeId); }
    });

    this.room.onMessage("Server:PlayerDie", (data) => {
        if (data.playerId == this.localSessionId) {
            this.app.fire("playerDie");
        }
    });

    this.room.onMessage("Server:Bullet", (data) => {
        this.app.planeObbyPlaneManager.spawnBullet(data.ownerId, data.position, data.rotation, data.skin);
    });

    this.room.onMessage("Server:TNT", (data) => {
        this.app.planeObbyPlaneManager.spawnTnt(data.ownerId, data.position);
    });

    this.room.onMessage("Server:FireSignal", (data) => {
        this.app.fire(data.signal);

        //console.log("Server:FireSignal", data.signal);
    });
};

PlaneObby_NetworkManager.prototype.respawn = function () {
    this.app.deadMenuEnabled = false;
    this.deadPanel.enabled = false;
    this.setBlackBG(false);
};

PlaneObby_NetworkManager.prototype.syncLocalData = async function () {

};

PlaneObby_NetworkManager.prototype.joinServer = async function () {
    try {
        console.log("try connecting server");

        this.app.colyseus = new Colyseus.Client("wss://rainbowobby1.emolingo.games");
        //this.app.colyseus = new Colyseus.Client("ws://localhost:2567");

        const roomIdFromURL = PokiSDK.getURLParam('room');
        const customRoomId = PlaneObby_Utils.getItem("PLANEOBBY_joinCustomRoom");
        if (PlaneObby_Utils.getItem("PLANEOBBY_createCustomRoom") === "1") {
            PlaneObby_Utils.setItem("PLANEOBBY_createCustomRoom", "");

            this.room = await this.app.colyseus.create("planeObby", { accessToken: "planeObby", private: true });
            this.app.fire("popupController:showPopup",
                "Private Room Created", "Room code: " + this.room.roomId + "7", false, this, "copiedRoomId", "closePopup", { yesButtonText: "Copy" });

            console.log("--- PRIVATE ROOM CREATED");

            this.app.mouse.disablePointerLock();
            this.app.cameraStateLocked = false;
            this.app.fire("lockCamera", true);
        } else if (customRoomId != "" && customRoomId != null) {
            this.room = await this.app.colyseus.joinById(customRoomId.slice(0, -1), { accessToken: "planeObby" });
            PlaneObby_Utils.setItem("PLANEOBBY_joinCustomRoom", "");
        } else if (roomIdFromURL != "" && roomIdFromURL != null) {
            this.room = await this.app.colyseus.joinById(roomIdFromURL.slice(0, -1), { accessToken: "planeObby" });
            PlaneObby_Utils.setItem("PLANEOBBY_joinCustomRoom", "");
        } else {
            this.room = await this.app.colyseus.joinOrCreate("planeObby", { accessToken: "planeObby" });
        }
        //this.room = await this.app.colyseus.joinOrCreate("planeObby", { accessToken: "planeObby" });
        console.log("connected to the ", this.room.name);
        this.app.fire("Connected");
        //send player data to sync
        this.syncLocalData();
    } catch (e) {
        console.log(e);
        if (e.toString().includes("not found")) {
            PlaneObby_Utils.setItem("PLANEOBBY_joinCustomRoom", "");
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

PlaneObby_NetworkManager.prototype.lowHPEffectMethod = function () {
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

PlaneObby_NetworkManager.prototype.diedEffect = function () {
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

PlaneObby_NetworkManager.prototype.update = function (dt) {
    this.interpolatePositionAndRotation(dt);
}

PlaneObby_NetworkManager.prototype.interpolatePositionAndRotation = function (dt) {
    for (var key in this.playerEntities) {
        //pass local player
        if (key == this.room.sessionId) continue;

        const playerEntity = this.playerEntities[key];
        const playerBody = playerEntity.findByName("Body");

        if (playerBody && playerBody.anim) {
            if (playerBody.anim.getBoolean("isSitting")) {
                playerBody.setLocalEulerAngles(0, 0, 0);
            } else {
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
        }
    }
};
