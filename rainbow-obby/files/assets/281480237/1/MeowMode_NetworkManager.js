var MeowMode_NetworkManager = pc.createScript('meowModeNetworkManager');
MeowMode_NetworkManager.attributes.add("mobileControls", { type: "entity" });
MeowMode_NetworkManager.attributes.add("onlineCounter", { type: "entity" });
MeowMode_NetworkManager.attributes.add("localPlayer", { type: "entity" });
MeowMode_NetworkManager.attributes.add('playerTemplate', { type: 'asset', assetType: 'template' });
MeowMode_NetworkManager.attributes.add('deadPanel', { type: 'entity' });
MeowMode_NetworkManager.attributes.add('blackBackground', { type: 'entity' });
MeowMode_NetworkManager.attributes.add('joinRoomUI', { type: 'entity' });

MeowMode_NetworkManager.prototype.mobileAndTabletCheck = function () {
    return this.app.touch != null;
};

// initialize code called once per entity
MeowMode_NetworkManager.prototype.initialize = async function () {
    this.world2Layer = this.app.scene.layers.getLayerByName("World2");
    this.world2Layer.clearDepthBuffer = true;
    this.app.meowModeNetworkManager = this;
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
    this.playerController = this.localPlayer.script.meowModePlayerController;
    this.lowHPEffect = this.app.root.findByName("lowHPEffect");
    this.onlineCounter = this.app.root.findByName("OnlineCounter");
    //menu
    this.menuPanel = this.app.root.findByName("Menu");
    this.menuCloseButton = this.menuPanel.findByName("CloseButton");
    this.menuCloseButton.button.on('click', function (event) {
        this.setMenu(false);
    }, this);


    this.database = this.app.root.findByName("ItemDatabase").script.meowModeItemDatabase;

    this.levelTextOnHead = this.entity.root.findByName("levelTextOnHead");
    this.levelUiText = this.app.root.findByName("LevelUiText");
    //this.xpUiText = this.app.root.findByName("XpUiText");
    //this.xpGoalUiText = this.app.root.findByName("XpGoalUiText");
    this.xpUiBar = this.app.root.findByName("XpUiBar");


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
        MeowMode_Utils.setItem("MEOWMODE_createCustomRoom", "1");
        this.app.scenes.changeScene("MeowMode");
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
            MeowMode_Utils.setItem("PVPMODE_joinCustomRoom", roomId);
            if (this.room)
                await this.room.leave();
            this.app.scenes.changeScene("MeowMode");
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
        this.app.off("copiedRoomId", this.copiedRoomId, this);
    }, this);

};

MeowMode_NetworkManager.prototype.onOrientationChange = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > h) {
        // Landscape

    }
    else {
        // Portrait

    }
}

MeowMode_NetworkManager.prototype.copiedRoomId = function () {
    if (this.room) {
        PokiSDK.shareableURL({ room: this.room.id + "11" }).then(url => {
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

MeowMode_NetworkManager.prototype.setBlackBG = function (state = true) {
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
MeowMode_NetworkManager.prototype.postUpdate = function (dt) {

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

MeowMode_NetworkManager.prototype.setMenu = function (state = true) {
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

MeowMode_NetworkManager.prototype.listenPlayers = function () {
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
                    targetPlayer.script.meowModeOtherPlayerController.handleAnimations(player);
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
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.died();
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.respawn();
            }
        });

        player.listen("username", (username) => {
            if (sessionId === this.localSessionId) {
                this.localPlayer.findByName("Username").element.text = username;
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.username.element.text = username;
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
                    if (player.cartId && this.app.meowModeCartManager.carts[player.cartId]) {
                        if (newSitting) {
                            console.log("id", player.cartId)
                            let playerPoint = this.app.meowModeCartManager.carts[player.cartId].script.meowModeCart.playerPoint;
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

        player.listen("aura", (newAura) => {
            if (sessionId === this.localSessionId) {
                this.app.auraManager.setAura(newAura);
                this.auraText.element.text = this.app.aura;
            } else {
                //this.playerEntities[sessionId].script.meowModeOtherPlayerController.auraText.element.text = newAura;
            }
        })

        player.listen("winCount", (newWinCount) => {
            if (sessionId === this.localSessionId) {
                this.app.gameManager.win.setCount(newWinCount);
                this.winCounterUiText.element.text = newWinCount;
                this.winCounterUiGroup.enabled = (newWinCount > 0);
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.winCountText.element.text = newWinCount;
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.winCounterGroup.enabled = (newWinCount > 0);
            }
        })

        player.listen("level", (newLevel, oldLevel) => {
            if (sessionId === this.localSessionId) {
                if (oldLevel == null) {
                    this.levelTextOnHead.element.text = "Level " + this.app.playerData.level;
                    this.levelUiText.element.text = this.app.playerData.level;
                    return;
                }
                this.levelTextOnHead.element.text = "Level " + newLevel;
                this.levelUiText.element.text = newLevel;

                this.app.playerData.level = newLevel;
                MeowMode_Utils.setItem("MEOWMODE_Level", this.app.playerData.level);
                this.app.fire("LevelChanged", newLevel);
                console.log("level changed")
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.levelTextOnHead.element.text = "Level " + newLevel;
            }
        })

        player.listen("xp", (newXp, oldXp) => {
            if (sessionId === this.localSessionId) {
                if (oldXp == null) {
                    //this.app.playerItemManager.updateUi();
                    return;
                }
                this.app.playerData.xp = newXp;
                MeowMode_Utils.setItem("MEOWMODE_Xp", this.app.playerData.xp);
                this.app.playerItemManager.updateUi();
            }
        })

        player.listen("xpGoal", (newXpGoal, oldXpGoal) => {
            if (sessionId === this.localSessionId) {
                if (oldXpGoal == null) {
                    //this.app.playerItemManager.updateUi();
                    return;
                }
                this.app.playerData.xpGoal = newXpGoal;
                MeowMode_Utils.setItem("MEOWMODE_XpGoal", this.app.playerData.xpGoal);
                this.app.playerItemManager.updateUi();
                //console.log("xp goal ", newXpGoal);
            }
        })

        player.listen("speed", (newSpeed, oldSpeed) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.speedScalar = newSpeed;
                //console.log("new speed ", newSpeed);
            };
        })

        player.listen("isFrozen", (newFrozen) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.setFrozen(newFrozen);
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.setFrozen(newFrozen);
            }

        })

        player.listen("attackable", (newAttackable) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.attackable = newAttackable;
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.attackable = newAttackable;
            }
        })

        player.listen("activeItemId", (newActiveItemID) => {
            if (sessionId === this.localSessionId) {

            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.setActiveItem(newActiveItemID);
            }
        })

        player.listen("isReady", (newIsReady) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.entity.findByName("ReadyLabel").enabled = newIsReady;
                this.app.gameManager.isReady = newIsReady;
            } else {
                this.playerEntities[sessionId].findByName("ReadyLabel").enabled = newIsReady;
            }
        })

        player.listen("isPauseMenu", (newIsPauseMenu) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.entity.findByName("AfkBox").enabled = newIsPauseMenu;
                this.app.gameManager.isPauseMenu = newIsPauseMenu;
            } else {
                this.playerEntities[sessionId].findByName("AfkBox").enabled = newIsPauseMenu;
            }
        })

        player.listen("isSparks", (newIsSparks) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.entity.findByName("Sparks").enabled = newIsSparks;
            } else {
                this.playerEntities[sessionId].findByName("Sparks").enabled = newIsSparks;
            }
        })

        player.listen("isInGame", (newIsInGame) => {
            if (sessionId === this.localSessionId) {
                this.app.gameManager.isInGame = newIsInGame;
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.isInGame = newIsInGame;
            }
        })

        player.listen("team", (newTeam) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.setTeam(newTeam);
                this.app.gameManager.team = newTeam;
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.setTeam(newTeam);
            }
        })

        player.listen("scale", (newScale) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.setScale(newScale);
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.setScale(newScale);
            }
        })

        player.listen("jumpHeight", (newJumpHeight) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.jumpHeighyMul = newJumpHeight;
            }
        })

        player.listen("hasFaceAttacker", (newHasFaceAttacker) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.faceAttacker.enabled = newHasFaceAttacker;
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.faceAttacker.enabled = newHasFaceAttacker;
            }
        })

        player.listen("hasFaceTarget", (newHasFaceTarget) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.faceTarget.enabled = newHasFaceTarget;
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.faceTarget.enabled = newHasFaceTarget;
            }
        })

        player.listen("skin", (newSkin) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController.setSkin(newSkin);
            } else {
                this.playerEntities[sessionId].script.meowModeOtherPlayerController.setSkin(newSkin);
            }
        })

        player.listen("isDancing", (newIsDancing) => {
            if (sessionId === this.localSessionId) {
                this.app.meowModePlayerController._animComponent.setBoolean("isClimbing", newIsDancing);
                this.app.meowModePlayerController.isDancing = newIsDancing;
            } else {
                //this.playerEntities[sessionId].script.meowModeOtherPlayerController.setSkin(newSkin);
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

    this.room.state.breakableObjects.onAdd((_breakableObject, _id) => {
        _breakableObject.onChange(() => {
            //console.log("CHANGED", _id, _breakableObject);

            const localObj = this.app.gameManager.breakableObjects[_id];
            if (localObj) {
                localObj.receiveUpdate(_breakableObject.hpNow, _breakableObject.state);
            }
        })
    })

    this.room.state.boss.listen("state", (newState, oldState) => {
        console.log("boss state ", newState);
    })

    this.room.onMessage("Server:PlayerController:respawn", (sessionId) => {
        this.playerEntities[sessionId].script.playerController.respawn();
    });

    this.room.onMessage("Server:PlayerControllerOther:died", (data) => {
        //local değilse
        if (data.playerId != this.localSessionId) {
            this.playerEntities[data.playerId].script.meowModeOtherPlayerController.died();
        }
    });

    this.room.onMessage("Server:PlayerControllerOther:respawn", (data) => {
        //local değilse
        if (data.playerId != this.localSessionId) {
            this.playerEntities[data.playerId].script.meowModeOtherPlayerController.respawn();
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

    this.room.onMessage("Server:HitAnim", (data) => {
        this.playerEntities[data.playerId].script.meowModeOtherPlayerController.playSlapAnim();
    });

    this.room.onMessage("Server:HitPlayer", (data) => {
        //console.log("Server:HitPlayer")

        let sessionId = this.app.meowModeNetworkManager.room.sessionId;

        if (data.attackerSessionId == sessionId) { this.app.auraManager.slapSFX(); }
        if (data.targetSessionId == sessionId) { this.app.auraManager.slapSFX(); }

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            if (data.attackerSessionId == sessionId) {
                //console.log("i attacked")
                let isRevenge = data.targetSessionId == this.app.auraManager.lastAttacker;
                this.app.auraManager.edit({ type: "player", id: data.targetSessionId }, true, isRevenge);
                this.app.auraManager.lastAttacker = null;
            } else if (data.targetSessionId == sessionId) {
                //console.log("i got attacked")
                this.app.auraManager.lastAttacker = data.attackerSessionId;
                this.app.auraManager.edit({ type: "player", id: data.attackerSessionId }, false, false);
            }
        }, this.app.auraManager.editDelay * 1000);


        let _force = new pc.Vec3(data.forceX, data.forceY, data.forceZ)
        if (data.targetSessionId == sessionId) {
            let _dir = new pc.Vec3(data.dirX, data.dirY, data.dirZ)
            this.app.meowModePlayerController.roll(true, _force, _dir)
        } else {
            this.playerEntities[data.targetSessionId].script.meowModeOtherPlayerController.roll(true, _force);
        }
    });

    this.room.onMessage("Server:NotAttackableHit", (data) => {
        console.log("Server:NotAttackableHit")

        let sessionId = this.app.meowModeNetworkManager.room.sessionId;
        if (data.attackerSessionId == sessionId) {

            let dirFromTarget = this.app.meowModePlayerController.entity.getPosition().clone().sub(this.playerEntities[data.targetSessionId].getPosition().clone()).normalize();
            /*             this.app.playerPush.direction = dirFromTarget;
                        this.app.playerPush.active = true;
            
                        setTimeout(()=>{this.app.playerPush.active = false}, 2000) */

            this.app.playerBounce.bounce(dirFromTarget, 3, .5)


        } else if (data.targetSessionId == sessionId) {
            if (this.app.playerItemManager.shield.enabled) {
                this.app.playerItemManager.shield.durability--;
                if (this.app.playerItemManager.shield.durability <= 0) {
                    this.app.inventory.load();
                } else {
                    let _m = this.app.playerItemManager.shield.durability / this.app.playerItemManager.shield.durabilityMax;
                    this.database.items[MeowModeItems.Shield].slot.durabilityBar.setLocalScale(0.545 * _m, 0.035, 0.1);
                    this.database.items[MeowModeItems.Shield].slot.durabilityBar.element.color = this.app.playerItemManager.getDurabilityColor(_m);
                }


                this.app.playerItemManager.saveDatas();
            }
        }
    });

    this.room.onMessage("Server:SpawnEdit", (data) => {
        let sessionId = this.app.meowModeNetworkManager.room.sessionId;

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            if (data.attackerSessionId == sessionId) {
                //console.log("i attacked")
                let isRevenge = data.targetSessionId == this.app.auraManager.lastAttacker;
                this.app.auraManager.edit({ type: "player", id: data.targetSessionId }, true, isRevenge);
                this.app.auraManager.lastAttacker = null;
            } else if (data.targetSessionId == sessionId) {
                //console.log("i got attacked")
                this.app.auraManager.lastAttacker = data.attackerSessionId;
                this.app.auraManager.edit({ type: "player", id: data.attackerSessionId }, false, false);
            }
        }, this.app.auraManager.editDelay * 1000);
    });

    this.room.onMessage("Server:PhaseChanged", (data) => {
        this.app.gameManager.changePhase(data.phase);
    });

    this.room.onMessage("Server:TeleportToLobby", (data) => {
        if (data.playerId == this.localSessionId) {
            this.app.gameManager.teleportToLobby();
        }
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

    this.room.onMessage("Server:TeleportToGame:Classic", (data) => {
        console.log("Server:TeleportToGame:Classic");
        this.app.gameManager.teleportToGame();
    });

    this.room.onMessage("Server:TeleportToGame:TeamBattle", (data) => {
        console.log("Server:TeleportToGame:TeamBattle", data.team);
        this.app.meowModePlayerController.setTeam(data.team);
        this.app.gameManager.onTeamChanged(data.team);
    });

    this.room.onMessage("Server:TeleportToGame:PaintWar", (data) => {
        console.log("Server:TeleportToGame:PaintWar", data.team);
        this.app.meowModePlayerController.setTeam(data.team);
        this.app.gameManager.onTeamChanged(data.team);
    });

    this.room.onMessage("Server:Die", (data) => {
        this.app.fire("playerDie");
    });

    this.room.onMessage("Server:PaintWar:Paint", (data) => {
        this.app.fire("PaintWar:Paint", data.plateIndex, data.team);
    });

    this.room.onMessage("Server:BreakableObject:HitResponse", (data) => {
        if (data.success == null) { return; }

        if (!data.success) {
            if (data.reason == null) { return; }
            switch (data.reason) {
                case "level-too-low": this.app.gameManager.warning("You need more levels to hit this object."); break;
            }
        } else {
            if (data.damage == null || data.state == null) { return; }

            switch (data.state) {
                case "damaged": this.app.gameManager.sfx_hit(); break;
                case "destroyed": this.app.gameManager.sfx_destroy(); break;
            }

        }
    });

    this.room.onMessage("Server:BreakableObject:DamageText", (data) => {
        if (data.objectId == null || data.damage == null) { return; }

        this.app.gameManager.damageText(data.objectId, data.damage);
    });

    this.room.onMessage("Server:LevelUp", (data) => {
        if (data.playerId == this.localSessionId) {
            this.app.meowModePlayerController.confettiParticle.reset();
            this.app.meowModePlayerController.confettiParticle.play();

            this.app.fire("LevelChanged", data.newLevel);
            this.app.gameManager.sfx_levelUp();

            setTimeout(() => { if (this.entity && !this.entity.script) return;
                watchCommercial(() => { }, true);
            }, 2000);
        }
    });
};

MeowMode_NetworkManager.prototype.respawn = function () {
    this.app.deadMenuEnabled = false;
    this.deadPanel.enabled = false;
    this.setBlackBG(false);
};

MeowMode_NetworkManager.prototype.syncLocalData = async function () {

};

MeowMode_NetworkManager.prototype.joinServer = async function () {
    try {
        console.log("try connecting server");
        //this.app.colyseus = new Colyseus.Client("ws://localhost:2567");

        if (this.isPlaycanvas) {
            if (this.app.gameManager.localhost) {
                this.app.colyseus = new Colyseus.Client("ws://localhost:2567");
                //this.app.colyseus = new Colyseus.Client("wss://rainbowobby2.emolingo.games");
                console.log("LOCALHOST")
            }
            else {
                //this.app.colyseus = new Colyseus.Client("wss://rainbowtest.emolingo.games");
                this.app.colyseus = new Colyseus.Client("wss://rainbowobby1.emolingo.games");
                console.log("GLOBAL")
            }
        } else if (this.isInspector) {
            this.app.colyseus = new Colyseus.Client("wss://rainbowtest.emolingo.games");
        } else { //global
            this.app.colyseus = new Colyseus.Client("wss://rainbowobby1.emolingo.games");
        } /* */

        const roomIdFromURL = PokiSDK.getURLParam('room');
        const customRoomId = MeowMode_Utils.getItem("PVPMODE_joinCustomRoom");
        if (MeowMode_Utils.getItem("MEOWMODE_createCustomRoom") === "1") {
            MeowMode_Utils.setItem("MEOWMODE_createCustomRoom", "");

            this.room = await this.app.colyseus.create("meowMode", { accessToken: "meowMode", private: true });

            /*
                        this.app.meowModePopupController.showPopup(
                            "Private Room Created",
                            "Room code: " + this.room.roomId + "11",
                            false, this.app, "copiedRoomId", "closePopup", { yesButtonText: "Copy" }, false, true)
            */
            this.app.fire("popupController:showPopup",
                "Private Room Created", "Room code: " + this.room.roomId + "11", false, this, "copiedRoomId", "closePopup", { yesButtonText: "Copy" });

            console.log("--- PRIVATE ROOM CREATED");

            this.app.mouse.disablePointerLock();
            this.app.cameraStateLocked = false;
            this.app.fire("lockCamera", true);
        } else if (customRoomId != "" && customRoomId != null) {
            if (customRoomId.length > 10) {
                this.room = await this.app.colyseus.joinById(customRoomId.slice(0, -2), { accessToken: "meowMode" });
            } else {
                this.room = await this.app.colyseus.joinById(customRoomId.slice(0, -1), { accessToken: "meowMode" });
            }
            MeowMode_Utils.setItem("PVPMODE_joinCustomRoom", "");
        } else if (roomIdFromURL != "" && roomIdFromURL != null) {
            if (roomIdFromURL.length > 10) {
                this.room = await this.app.colyseus.joinById(roomIdFromURL.slice(0, -2), { accessToken: "meowMode" });
            } else {
                this.room = await this.app.colyseus.joinById(roomIdFromURL.slice(0, -1), { accessToken: "meowMode" });
            }
            MeowMode_Utils.setItem("PVPMODE_joinCustomRoom", "");
        } else {
            this.room = await this.app.colyseus.joinOrCreate("meowMode", { accessToken: "meowMode" });
        }
        //this.room = await this.app.colyseus.joinOrCreate("meowMode", { accessToken: "meowMode" });
        console.log("connected to the ", this.room.name);
        this.app.fire("Connected");
        //send player data to sync
        this.syncLocalData();
    } catch (e) {
        console.log(e);
        if (e.toString().includes("not found")) {
            MeowMode_Utils.setItem("PVPMODE_joinCustomRoom", "");
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

MeowMode_NetworkManager.prototype.lowHPEffectMethod = function () {
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

MeowMode_NetworkManager.prototype.diedEffect = function () {
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

MeowMode_NetworkManager.prototype.update = function (dt) {
    this.interpolatePositionAndRotation(dt);
}

MeowMode_NetworkManager.prototype.interpolatePositionAndRotation = function (dt) {
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

MeowMode_NetworkManager.prototype.fire = function (fireName, shouldReplicate = false, shouldPrint = false) {
    if (fireName === 'destroy' || fireName === 'enable' || fireName === 'disable' || fireName === 'state' || fireName === 'attr' || (typeof fireName === 'string' && fireName.indexOf('attr:') === 0)) return pc.EventHandler.prototype.fire.apply(this, arguments);
    if (shouldReplicate && this.room) {
        this.room.send("Client:FireSignal", { signal: fireName });
    } else {
        this.app.fire(fireName);
    }

    if (shouldPrint) { console.log(fireName); }
};

MeowMode_NetworkManager.prototype.send = function (_name, _args) {
    if (this.room) {
        this.room.send(_name, _args);
    } else {
        this.app.fire(_name, _args);
    }
}
