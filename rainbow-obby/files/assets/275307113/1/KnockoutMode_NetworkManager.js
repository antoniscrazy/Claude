var KnockoutMode_NetworkManager = pc.createScript('knockoutModeNetworkManager');
KnockoutMode_NetworkManager.attributes.add("mobileControls", { type: "entity" });
KnockoutMode_NetworkManager.attributes.add("onlineCounter", { type: "entity" });
KnockoutMode_NetworkManager.attributes.add("localPlayer", { type: "entity" });
KnockoutMode_NetworkManager.attributes.add('playerTemplate', { type: 'asset', assetType: 'template' });
KnockoutMode_NetworkManager.attributes.add('deadPanel', { type: 'entity' });
KnockoutMode_NetworkManager.attributes.add('blackBackground', { type: 'entity' });
KnockoutMode_NetworkManager.attributes.add('joinRoomUI', { type: 'entity' });

KnockoutMode_NetworkManager.prototype.mobileAndTabletCheck = function () {
    return this.app.touch != null;
};

// initialize code called once per entity
KnockoutMode_NetworkManager.prototype.initialize = async function () {
    this.world2Layer = this.app.scene.layers.getLayerByName("World2");
    this.world2Layer.clearDepthBuffer = true;
    this.app.knockoutModeNetworkManager = this;
    this.app.isMobile = this.mobileAndTabletCheck();
    this.app.targetFov = 60;
    this.app.isPopupEnabled = false;
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
    this.app.on("copiedRoomId", this.copiedRoomId, this);

    this.mobileControls.enabled = this.app.isMobile;
    this.jumpButton = this.mobileControls.findByName("JumpButton");
    this.player = this.app.root.findByName("Player");
    this.playerController = this.localPlayer.script.knockoutModePlayerController;
    this.lowHPEffect = this.app.root.findByName("lowHPEffect");
    this.stageUIText = this.app.root.findByName("StageUIText");
    this.coinText = this.app.root.findByName("CoinText");
    this.winCounterUiText = this.app.root.findByName("WinCounterUiText");
    this.winCounterUiGroup = this.app.root.findByName("WinCounterUiGroup");
    this.winCounterUiGroup.enabled = false;
    this.onlineCounter = this.app.root.findByName("OnlineCounter");
    //this.stagePercentageText = this.app.root.findByName("stagePercentageText").element;
    //this.stagePercentagePin = this.app.root.findByName("stagePercentagePin");
    this.progressBar = this.app.root.findByName("ProgressBar");
    //menu
    this.menuPanel = this.app.root.findByName("MenuPanel");
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

            /*                 this.playerController.respawn();
                            this.respawn();
                            this.canRespawn = false; */
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

    this.deadPanelRewarded = this.deadPanel.findByName("RewardedAdButton");
    this.deadPanelRewarded.button.on('click', function (event) {

        this.playerController.respawn(true);
        this.respawn();

        this.localPlayer.sound.play("prize");


        //this.setCheckpoint(this.app.checkpoint + 1);
        /*         PokiSDK.rewardedBreak({
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
                }); */





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
        //this.playerController.dieOnTroll();
        this.app.fire("playerDie");
    }, this);

    this.createRoomButton = this.menuPanel.findByName("CreateRoomButton");
    this.createRoomButton.button.on('click', async function (event) {
        if (this.room) {
            await this.room.leave();
        }
        KnockoutMode_Utils.setItem("KNOCKOUTMODE_createCustomRoom", "1");
        this.app.scenes.changeScene("KnockoutMode");
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
            KnockoutMode_Utils.setItem("KNOCKOUTMODE_joinCustomRoom", roomId);
            if (this.room)
                await this.room.leave();
            this.app.scenes.changeScene("KnockoutMode");
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

    /*    this.onOrientationChange();
       this._onOrientationChangeBound = this.onOrientationChange.bind(this);
       window.addEventListener("resize", this._onOrientationChangeBound, false);
       this.on('destroy', () => {
           window.removeEventListener("resize", this._onOrientationChangeBound, false);
       });
       window.addEventListener("orientationchange", this.onOrientationChange.bind(this), false); */

    const joined = await this.joinServer();
    if (this.entity && !this.entity.script) { if (this.room) this.room.leave(); return; }
    if (joined) {
        this.listenPlayers();
    }


    this.app.on("goToNextCheckpoint", this.goToNextCheckpoint, this)

    this.on('destroy', function () {
        this.app.mouse.off("mousedown", onMouseDown);
        this.app.off("goToNextCheckpoint");
        this.app.off("copiedRoomId", this.copiedRoomId, this);
    }, this);

    this.loadLocalStorageData();
    this.setCheckpoint(this.app.checkpoint);

    this.playerController.teleport()
};

KnockoutMode_NetworkManager.prototype.loadLocalStorageData = function () {
    const currentStage = KnockoutMode_Utils.getItem("KNOCKOUTMODE_Checkpoint");
    if (currentStage) {
        this.app.checkpoint = Number.parseInt(currentStage)
    } else {
        this.app.checkpoint = 0;
        KnockoutMode_Utils.setItem("KNOCKOUTMODE_Checkpoint", 0);
    }
    const coin = KnockoutMode_Utils.getItem("KNOCKOUTMODE_Coin");
    if (coin) {
        this.app.coin = Number.parseInt(coin)
    } else {
        this.app.coin = 0;
        KnockoutMode_Utils.setItem("KNOCKOUTMODE_Coin", 0);
    }
    //this.increaseStage(this.app.currentStage);
    this.coinText.element.text = this.app.coin;

    console.log("checkpoint", this.app.checkpoint);
    this.app.fire("checkpointChanged");
};

KnockoutMode_NetworkManager.prototype.onOrientationChange = function () {
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

KnockoutMode_NetworkManager.prototype.setCheckpoint = function (new_checkpoint) {
    /*     let last_checkpoint = this.app.root.findByName("Checkpoints").children.length;
        this.app.checkpoint = new_checkpoint;
    
        KnockoutMode_Utils.setItem("KNOCKOUTMODE_Checkpoint", this.app.checkpoint);
    
        // Stage UI yazısı (1, 2, 3 gibi gösteriyor)
        this.stageUIText.element.text = this.app.checkpoint + 1;
    
        // Yüzde hesapla
        let percentage = ((this.app.checkpoint) / (last_checkpoint - 1)) * 100;
    
        // % yazısını güncelle
        //this.stagePercentageText.text = percentage.toFixed(0) + "%";
    
        // Pin pozisyonunu yüzdeye göre ayarla (0 → 540)
        //let pinX = (percentage / 100) * 540;
        //this.stagePercentagePin.setLocalPosition(pinX, -40, 0);
    
        this.app.fire("checkpointChanged", new_checkpoint); */
};

KnockoutMode_NetworkManager.prototype.goToNextCheckpoint = function () {
    let checkpointRoot = this.app.root.findByName("Checkpoints");
    let checkpointCount = checkpointRoot.children.length;
    let nextCheckpoint = this.app.checkpoint + 1;
    nextCheckpoint = pc.math.clamp(nextCheckpoint, 0, checkpointCount - 1);
    this.setCheckpoint(nextCheckpoint);
    this.app.fire("teleportToCheckpoint");
};


KnockoutMode_NetworkManager.prototype.copiedRoomId = function () {
    if (this.room) {
        PokiSDK.shareableURL({ room: this.room.id + "9" }).then(url => {
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

KnockoutMode_NetworkManager.prototype.setBlackBG = function (state = true) {
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

KnockoutMode_NetworkManager.prototype.collectCoin = function (amount = 1) {
    this.app.coin += amount;
    if (amount === 1)
        this.localPlayer.fire("collectCoin");
    this.localPlayer.sound.play("collectCoin");
    KnockoutMode_Utils.setItem("KNOCKOUTMODE_Coin", this.app.coin);
    this.coinText.element.text = this.app.coin;
};

KnockoutMode_NetworkManager.prototype.decreaseCoin = function (amount = 1) {
    this.app.coin -= amount;
    KnockoutMode_Utils.setItem("KNOCKOUTMODE_Coin", this.app.coin);
    this.coinText.element.text = this.app.coin;
};

// update code called every frame
KnockoutMode_NetworkManager.prototype.postUpdate = function (dt) {

    //respawn
    if (this.app.keyboard.wasPressed(pc.KEY_SPACE) && this.app.deadMenuEnabled) {
        this.deadPanelRespawn.button.fire('click');
    }

    if (pc.platform.touch)
        return;

    if (!pc.Mouse.isPointerLocked()) {
        camResult = this.app.isWatchingAd == false && this.app.menuPanelEnabled == false && this.app.isMarketEnabled == false && this.app.deadMenuEnabled == false && this.app.isPopupEnabled == false;
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

KnockoutMode_NetworkManager.prototype.setMenu = function (state = true) {
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

        if (this.app.gameManager.isInGame) { this.app.fire("playerDie") }

    } else {
        this.menuPanel.enabled = false;
        this.setBlackBG(false);
        this.app.menuPanelEnabled = false;
        this.app.fire("lockCamera", false);
    }
};

KnockoutMode_NetworkManager.prototype.listenPlayers = function () {
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
                    targetPlayer.script.knockoutModeOtherPlayerController.handleAnimations(player);
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
        //newPlayer.setPosition(player.x, player.y, player.z);
        newPlayer.networkData = player;
        this.playerEntities[sessionId] = newPlayer;

        player.listen("isDead", (isDead) => {
            if (sessionId === this.localSessionId) return;
            if (isDead) {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.died();
            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.respawn();
            }
        });

        player.listen("username", (username) => {
            if (sessionId === this.localSessionId) {
                this.localPlayer.findByName("Username").element.text = username;
            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.username.element.text = username;
            }
        });

        player.listen("trollId", (trollId) => {
            if (sessionId === this.localSessionId) {
                // local
                this.playerController.trollId = trollId
            } else {
                this.playerEntities[sessionId].trollId = trollId;
            }
        });

        player.listen("isInCart", (newSitting) => {
            if (sessionId === this.localSessionId) {
                // local
            } else {
                setTimeout(() => { if (this.entity && !this.entity.script) return;
                    if (player.cartId && this.app.knockoutModeCartManager.carts[player.cartId]) {
                        if (newSitting) {
                            console.log("id", player.cartId)
                            let playerPoint = this.app.knockoutModeCartManager.carts[player.cartId].script.knockoutModeCart.playerPoint;
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
                    }
                }, 200)
            }
        });

        player.listen("jetpackHas", (jetpackHas) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.jetpack.has = jetpackHas;
            this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.applyPowerUpChanges();
        })

        player.listen("jetpackUsing", (jetpackUsing) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.jetpack.using = jetpackUsing;
            this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.applyPowerUpChanges();
        })

        player.listen("flyingCarpetHas", (flyingCarpetHas) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.flyingCarpet.has = flyingCarpetHas;
            this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.applyPowerUpChanges();
        })

        player.listen("tntHas", (tntHas) => {
            if (sessionId === this.localSessionId) return;
            this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.tnt.has = tntHas;
            this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.applyPowerUpChanges();
        })

        player.listen("aura", (newAura) => {
            if (sessionId === this.localSessionId) {
                this.app.auraManager.setAura(newAura);
                this.auraText.element.text = this.app.aura;
            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.auraText.element.text = newAura;
            }
        })

        player.listen("rebirth", (newRebirth) => {
            if (sessionId === this.localSessionId) {
                this.app.rebirthManager.setRebirth(newRebirth);
                this.rebirthText.element.text = newRebirth;

                if (newRebirth > 0) {
                    this.rebirthBox.enabled = true;
                }
            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.rebirthText.element.text = newRebirth;

                if (newRebirth > 0) {
                    this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.rebirthText.enabled = true;
                }
            }
        })

        player.listen("isFrozen", (newFrozen) => {
            if (sessionId === this.localSessionId) {
                this.app.knockoutModePlayerController.setFrozen(newFrozen);
            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.setFrozen(newFrozen);
            }

        })

        player.listen("attackable", (newAttackable) => {
            if (sessionId === this.localSessionId) {
                this.app.knockoutModePlayerController.attackable = newAttackable;
            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.attackable = newAttackable;
            }
        })

        player.listen("activeItemId", (newActiveItemID) => {
            if (sessionId === this.localSessionId) {

            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.setActiveItem(newActiveItemID);
            }
        })

        player.listen("isSlideMode", (newIsSlideMode) => {
            this.app.gameManager.setIsSlideMode(newIsSlideMode, sessionId === this.localSessionId ? null : this.playerEntities[sessionId].script.knockoutModeOtherPlayerController)
        })

        player.listen("isInGame", (newIsInGame) => {
            if (sessionId === this.localSessionId) {
                this.app.gameManager.isInGame = newIsInGame;
            } else {

            }
        })

        player.listen("shootIndex", (newShootIndex) => {
            this.app.gameManager.setShootIndex(newShootIndex, sessionId === this.localSessionId ? null : this.playerEntities[sessionId].script.knockoutModeOtherPlayerController)
        })

        player.listen("isShootingNow", (newIsShootingNow) => {
            this.app.gameManager.setIsShootingNow(newIsShootingNow, sessionId === this.localSessionId ? null : this.playerEntities[sessionId].script.knockoutModeOtherPlayerController)
        })

        player.listen("isWinner", (newIsWinner) => {
            this.app.gameManager.isWinner = newIsWinner;
        })

        player.listen("scale", (newScale) => {
            if (sessionId === this.localSessionId) {
                this.app.knockoutModePlayerController.setScale(newScale);
            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.setScale(newScale);
            }
        })

        player.listen("winCount", (newWinCount) => {
            if (sessionId === this.localSessionId) {
                this.app.gameManager.win.setCount(newWinCount);
                this.app.knockoutModePlayerController.winCountText.element.text = newWinCount;
                this.app.knockoutModePlayerController.winCounterGroup.enabled = (newWinCount > 0);
                this.winCounterUiText.element.text = newWinCount;
                this.winCounterUiGroup.enabled = (newWinCount > 0);
            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.winCountText.element.text = newWinCount;
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.winCounterGroup.enabled = (newWinCount > 0);
            }
        })

        player.listen("skin", (newSkin) => {
            if (sessionId === this.localSessionId) {
                this.app.knockoutModePlayerController.setSkin(newSkin);
            } else {
                this.playerEntities[sessionId].script.knockoutModeOtherPlayerController.setSkin(newSkin);
            }
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

    /*     this.room.state.listen("roundTimer", (newTimer)=>{
            console.log("roundTimer", newTimer);
        }) */

    this.room.state.listen("currentMap", (newMap) => {
        this.app.gameManager.changeMap(newMap, null);
    })

    this.room.state.listen("currentEnviourment", (newEnviourment) => {
        this.app.gameManager.changeMap(null, newEnviourment);
    })

    this.room.onMessage("Server:PlayerController:respawn", (sessionId) => {
        this.playerEntities[sessionId].script.playerController.respawn();
    });

    this.room.onMessage("Server:PlayerControllerOther:died", (data) => {
        //local değilse
        if (data.playerId != this.localSessionId) {
            this.playerEntities[data.playerId].script.knockoutModeOtherPlayerController.died();
        }
    });

    this.room.onMessage("Server:PlayerControllerOther:respawn", (data) => {
        //local değilse
        if (data.playerId != this.localSessionId) {
            this.playerEntities[data.playerId].script.knockoutModeOtherPlayerController.respawn();
        }
    });

    this.room.onMessage("Server:DamagePart", (data) => {
        this.app.knockoutModeTrollManager.damagePart(data.trollId, data.damage, data.part);
    });

    this.room.onMessage("Server:DestroyPart", (data) => {
        this.app.knockoutModeTrollManager.destroyPart(data.trollId, data.part);
    });

    this.room.onMessage("Server:DestroyTroll", (data) => {
        if (data.playerId == this.localSessionId) {
            this.app.knockoutModeTrollManager.destroyTroll(data.trollId);
        } else { this.app.knockoutModeTrollManager.expoEffect(data.trollId); }
    });

    this.room.onMessage("Server:PlayerDie", (data) => {
        if (data.playerId == this.localSessionId) {
            this.app.fire("playerDie");
        }
    });

    this.room.onMessage("Server:Bullet", (data) => {
        this.app.knockoutModeTrollManager.spawnBullet(data.ownerId, data.position, data.rotation, data.skin);
    });

    this.room.onMessage("Server:TNT", (data) => {
        this.app.knockoutModeTrollManager.spawnTnt(data.ownerId, data.position);
    });

    this.room.onMessage("Server:FireSignal", (data) => {
        this.app.fire(data.signal);

        //console.log("Server:FireSignal", data.signal);
    });

    this.room.onMessage("Server:ToggleButton", (data) => {
        this.app.fire(data.buttonId, data.trollerId);
    });

    this.room.onMessage("Server:PhaseChanged", (data) => {
        this.app.gameManager.changePhase(data.phase);
    });

    this.room.onMessage("Server:Shoot", (data) => {
        if (this.app.gameManager.isInGame) {
            this.app.gameManager.shoot();
        }
    });

    this.room.onMessage("Server:HoverCollided", (data) => {
        if (data.targetId == this.localSessionId) {
            this.app.gameManager.push(new pc.Vec3(data.dirX, data.dirY, data.dirZ), data.power);
            console.log("pushing", data.power);
        }
    });

    this.room.onMessage("Server:PlayerShoot", (data) => {
        if (data.playerId == this.localSessionId && this.app.gameManager.isInGame) {
            this.app.gameManager.shoot();
            //this.app.gameManager.sfx_aimMyTurn();
        }
    });

    this.room.onMessage("Server:ShootList", (data) => {
        this.app.gameManager.handleShootList(data.list);
    });

    this.room.onMessage("Server:PlaceItem", (data) => {
        this.app.gameManager.placeItem(data.itemId, new pc.Vec3(data.x, data.y, data.z));
    });

    this.room.onMessage("Server:TeleportToLobby", (data) => {
        this.app.gameManager.teleportToLobby(data);
    });

    this.room.onMessage("Server:SFX:Countdown", (data) => {
        this.app.gameManager.sfx_countdown();
    });

    this.room.onMessage("Server:SFX:Intro", (data) => {
        this.app.gameManager.sfx_intro();
    });

    this.room.onMessage("Server:SFX:Aim", (data) => {
        this.app.gameManager.sfx_aim();
    });
    this.room.onMessage("Server:SFX:AimLockIn", (data) => {
        if (data.firstID != this.localSessionId) {
            this.app.gameManager.sfx_aimLockIn();
        }
    });
    this.room.onMessage("Server:SFX:WaterSplashRemote", (data) => {
        if (data.playerId != this.localSessionId) {
            this.playerEntities[data.playerId].sound.play("waterSplashRemote");
        }
    });
    this.room.onMessage("Server:SFX:Win", (data) => {
        if (data.playerId == this.localSessionId) {
            this.app.gameManager.sfx_win();
        }
    });
};


KnockoutMode_NetworkManager.prototype.respawn = function () {
    this.app.deadMenuEnabled = false;
    this.deadPanel.enabled = false;
    this.setBlackBG(false);
};

KnockoutMode_NetworkManager.prototype.syncLocalData = async function () {

};

KnockoutMode_NetworkManager.prototype.joinServer = async function () {
    try {
        console.log("try connecting server");

        this.app.colyseus = new Colyseus.Client("wss://rainbowobby1.emolingo.games");
        //this.app.colyseus = new Colyseus.Client("ws://localhost:2567");

        const roomIdFromURL = PokiSDK.getURLParam('room');
        const customRoomId = KnockoutMode_Utils.getItem("KNOCKOUTMODE_joinCustomRoom");
        if (KnockoutMode_Utils.getItem("KNOCKOUTMODE_createCustomRoom") === "1") {
            KnockoutMode_Utils.setItem("KNOCKOUTMODE_createCustomRoom", "");

            this.room = await this.app.colyseus.create("knockoutMode", { accessToken: "knockoutMode", private: true });

            this.app.knockoutModePopupController.showPopup(
                "Private Room Created",
                "Room code: " + this.room.roomId + "9",
                false, this.app, "copiedRoomId", "closePopup", { yesButtonText: "Copy" }, false, true)

            //this.app.fire("popupController:showPopup",
            //  "Private Room Created", "Room code: " + this.room.roomId + "8", false, this, "copiedRoomId", "closePopup", { yesButtonText: "Copy" });

            console.log("--- PRIVATE ROOM CREATED");

            this.app.mouse.disablePointerLock();
            this.app.cameraStateLocked = false;
            this.app.fire("lockCamera", true);
        } else if (customRoomId != "" && customRoomId != null) {
            this.room = await this.app.colyseus.joinById(customRoomId.slice(0, -1), { accessToken: "knockoutMode" });
            KnockoutMode_Utils.setItem("KNOCKOUTMODE_joinCustomRoom", "");
        } else if (roomIdFromURL != "" && roomIdFromURL != null) {
            this.room = await this.app.colyseus.joinById(roomIdFromURL.slice(0, -1), { accessToken: "knockoutMode" });
            KnockoutMode_Utils.setItem("KNOCKOUTMODE_joinCustomRoom", "");
        } else {
            this.room = await this.app.colyseus.joinOrCreate("knockoutMode", { accessToken: "knockoutMode" });
        }
        //this.room = await this.app.colyseus.joinOrCreate("knockoutMode", { accessToken: "knockoutMode" });
        console.log("connected to the ", this.room.name);
        this.app.fire("Connected");
        //send player data to sync
        this.syncLocalData();
    } catch (e) {
        console.log(e);
        if (e.toString().includes("not found")) {
            KnockoutMode_Utils.setItem("KNOCKOUTMODE_joinCustomRoom", "");
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

KnockoutMode_NetworkManager.prototype.lowHPEffectMethod = function () {
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

KnockoutMode_NetworkManager.prototype.diedEffect = function () {
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

KnockoutMode_NetworkManager.prototype.update = function (dt) {
    this.interpolatePositionAndRotation(dt);
}

KnockoutMode_NetworkManager.prototype.interpolatePositionAndRotation = function (dt) {
    for (var key in this.playerEntities) {
        //pass local player
        if (key == this.room.sessionId) continue;

        const playerEntity = this.playerEntities[key];
        //const playerBody = playerEntity.findByName("RollPivot");
        let playerBody = playerEntity.playerBody;

        if (playerBody) {
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
};

KnockoutMode_NetworkManager.prototype.fire = function (fireName, shouldReplicate = false, shouldPrint = false) {
    if (fireName === 'destroy' || fireName === 'enable' || fireName === 'disable' || fireName === 'state' || fireName === 'attr' || (typeof fireName === 'string' && fireName.indexOf('attr:') === 0)) return pc.EventHandler.prototype.fire.apply(this, arguments);
    if (shouldReplicate && this.room) {
        this.room.send("Client:FireSignal", { signal: fireName });
    } else {
        this.app.fire(fireName);
    }

    if (shouldPrint) { console.log(fireName); }
};

KnockoutMode_NetworkManager.prototype.send = function (_name, _args) {
    if (this.room) {
        this.room.send(_name, _args);
    } else {
        this.app.fire(_name, _args);
    }
}
