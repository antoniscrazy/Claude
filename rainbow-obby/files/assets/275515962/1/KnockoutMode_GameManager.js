var KnockoutModeGameManager = pc.createScript('knockoutModeGameManager');

KnockoutModeGameManager.attributes.add("maxSlidePower", { type: "number", default: 10 });
KnockoutModeGameManager.attributes.add("maps", { type: "entity", array: true });
KnockoutModeGameManager.attributes.add("enviourments", { type: "entity", array: true });

KnockoutModeGameManager.attributes.add('assetSpikeBall', { type: 'asset' });
KnockoutModeGameManager.attributes.add('assetSlime', { type: 'asset' });
KnockoutModeGameManager.attributes.add('assetBomb', { type: 'asset' });
KnockoutModeGameManager.attributes.add('assetWall', { type: 'asset' });

// initialize code called once per entity
KnockoutModeGameManager.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.knockoutModeNetworkManager;
    this.app.gameManager = this;
    this.state = new StateSystem;
    this.currentPhase = ""
    this.isWinner = false;

    this.timerText = this.app.root.findByName("gameTimerText").element;
    this.gameStateText = this.app.root.findByName("gameStateText").element;
    this.lobbySpawnPoints = this.app.root.findByName("LobbySpawnPoints");

    this.player = this.app.root.findByName("Player");
    this.localCollideTrigger = this.player.findByName("CollideTrigger");
    this.localCollideTrigger.script.knockoutModeTrigger.fireName = "remotePlayerCollide";
    this.localCollideTrigger.script.knockoutModeTrigger.print = false;
    this.localCollideTrigger.script.knockoutModeTrigger.tags = ["RemotePlayerCollider"];

    this.aim = {
        chargeBar: this.app.root.findByName("AimChargeBar"),
        chargeBarArrow: this.app.root.findByName("aimChargeArrow"),
        chargeText: this.app.root.findByName("aimChargeText"),
        arrow: this.player.findByName("AimArrow"),
        charge: 0,
        chargeMapMin: 1.1,
        chargeMapMax: 2.0,
        rotatePlayer: false,

        ratchetTimer: 0,

        touchUp: this.app.root.findByName("ButtonChargeUp"),
        touchDown: this.app.root.findByName("ButtonChargeDown"),

        open: () => {
            this.aim.chargeBar.enabled = true;
            this.aim.arrow.enabled = true;
            this.aim.rotatePlayer = true;
            this.aiming = true;
            this.aim.ratchetTimer = 0;
        },

        close: (_shouldRotate = false) => {
            this.aim.chargeBar.enabled = false;
            this.aim.arrow.enabled = false;
            this.aim.rotatePlayer = _shouldRotate;
            this.aiming = false;
        },

        resetCharge: () => {
            this.aim.charge = .2;
        },

        handleCharge: (dt) => {
            let input = 0

            joystick = window.touchJoypad.sticks['joystick0'];

            if (!this.app.menuPanelEnabled && !this.app.isMarketEnabled) {
                if (this.app.isMobile) {
                    if (joystick.y != 0) {
                        input = joystick.y;
                    } else {
                        input = (window.touchJoypad.buttons.isPressed('ButtonChargeUp') - window.touchJoypad.buttons.isPressed('ButtonChargeDown'));
                    }
                } else {
                    input = (this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)) - (this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN));
                }
            }

            if (input != 0 && this.aim.ratchetTimer <= 0) {
                let _name = "ratchet" + (Math.floor(Math.random() * 6) + 1);
                this.entity.sound.play(_name);
                this.aim.ratchetTimer = .05;
                //console.log(_name);
            }

            this.aim.ratchetTimer = Math.max(this.aim.ratchetTimer - dt, 0);

            this.aim.charge += (input * .01);
            this.aim.charge = pc.math.clamp(this.aim.charge, 0, 1);

            this.aim.chargeText.element.text = (Math.round(this.aim.charge * 100)) + "%";
            this.aim.chargeBarArrow.setLocalPosition((this.aim.charge * 540), -40, 0);

            this.aim.arrow.setLocalScale(
                1 - this.aim.charge * .5,
                1,
                1 + this.aim.charge * 2
            )
        },
    }

    setTimeout(() => { if (this.entity && !this.entity.script) return;
        if (this.app.isMobile) {
            this.aim.touchUp.children[0].element.text = "+";
            this.aim.touchDown.children[0].element.text = "-";
        }

    }, 2000)

    this.win = {
        count: 0,

        setCount: (newCount) => {
            this.win.count = newCount;
            KnockoutMode_Utils.setItem("KNOCKOUTMODE_WinCount", newCount);
        }
    }

    this.map = {
        currentMapEntity: null,
        currentMapSpawnPointsEntity: null,
    }

    this.isSlideMode = false;
    this.isInGame = false;
    this.aiming = false;

    this.app.on("remotePlayerCollide", this.onRemoteCollide, this);
    this.app.on("PlayerDied", this.onPlayerDied, this);
    this.app.on("ActiveItemIdChanged", this.onActiveItemIdChanged, this);
    this.app.on("Connected", this.onConnected, this);

    this.on('destroy', function () {
        this.app.off("PlayerDied");
        this.app.off("remotePlayerCollide");
        this.app.off("ActiveItemIdChanged");
        this.app.off("Connected");
    }, this);

    this.isPlaycanvas = false;
    if (window.location.href.indexOf('launch.playcanvas.com') > -1) {
        this.isPlaycanvas = true;
    }


    this.state.add("waiting", {});

    this.state.add("starting", {});

    this.state.add("intro", {
        onStart: () => {
            if (this.app.knockoutModePlayerController.isDied || this.app.isAdBreak || this.app.knockoutModeNetworkManager.menuPanel.enabled) { return; }

            this.aim.rotatePlayer = false;
            //this.app.knockoutModeNetworkManager.jumpButton.enabled = false;

            this.app.knockoutModePlayerController.teleportToPosition(this.map.currentMapSpawnPointsEntity.children[this.getMyIndex()].getPosition().clone());

            this.app.knockoutModeNetworkManager.send("Client:SetIsSlideMode", { boolean: true });
            this.app.knockoutModeNetworkManager.send("Client:SetIsInGame", { boolean: true });

            this.app.knockoutModePlayerController.stop();
        }
    });

    this.state.add("aim", {
        onStart: () => {
            if (!this.isInGame) { return; }

            if (this.app.playerItemManager.activeItemId == -1) {
                this.aim.open();
                this.aim.resetCharge();
            } else { this.aim.rotatePlayer = true; }
        },

        onUpdate: (dt) => {
            if (!this.isInGame) { return; }
            this.aim.handleCharge(dt);
        },

        onEnd: () => {
            this.aim.close();
        }
    });

    this.state.add("shoot", {});

    this.state.add("finished", {
        onStart: () => {
            this.clearMap();
            if (!this.isInGame) { return; }

            //this.app.knockoutModeNetworkManager.jumpButton.enabled = true;


            this.app.knockoutModeNetworkManager.send("Client:SetIsSlideMode", { boolean: false });
            this.app.knockoutModeNetworkManager.send("Client:SetIsInGame", { boolean: false });
        },
    });
};

// update code called every frame
KnockoutModeGameManager.prototype.update = function (dt) {
    if (!this.app.knockoutModeNetworkManager.room || !this.app.knockoutModeNetworkManager.room.state) { return; }

    this.timerText.text = this.app.knockoutModeNetworkManager.room.state.roundTimer;
    this.timerText.enabled = this.app.knockoutModeNetworkManager.room.state.showRoundTimer;

    this.gameStateText.text = this.app.knockoutModeNetworkManager.room.state.gameStateLabel;

    this.state.update(dt);

    if (this.app.knockoutModeNetworkManager.menuPanel.enabled && this.isInGame) {
        this.app.fire("playerDie");
    }

    /*     if (this.isPlaycanvas && this.app.keyboard.wasPressed(pc.KEY_CONTROL)) {
            this.app.knockoutModeNetworkManager.send("Client:NextState");
        } */
};

KnockoutModeGameManager.prototype.onConnected = function () {
    if (!this.app.knockoutModeNetworkManager.room) return;

    let _savedWinCount = KnockoutMode_Utils.getItem("KNOCKOUTMODE_WinCount");
    _savedWinCount = Number(_savedWinCount);
    if (isNaN(_savedWinCount)) {
        _savedWinCount = 0;
    } else {
        _savedWinCount = Math.floor(_savedWinCount);
    }

    if (_savedWinCount > 0) {
        this.app.knockoutModeNetworkManager.send("Client:SetWin", { win: _savedWinCount });
    } else {
        KnockoutMode_Utils.setItem("KNOCKOUTMODE_WinCount", 0);
        this.app.knockoutModeNetworkManager.send("Client:SetWin", { win: 0 });
    };

    this.win.count = _savedWinCount;
}

KnockoutModeGameManager.prototype.onRemoteCollide = function (remoteCollider) {
    let otherPlayer = remoteCollider.parent.parent.parent;
    let otherId = otherPlayer.sessionId;

    let dirToTarget = otherPlayer.getPosition().clone().sub(this.player.getPosition().clone()).normalize();

    let velLength = this.app.knockoutModePlayerController.entity.rigidbody.linearVelocity.clone().length();
    this.networkManager.send("Client:HoverCollided", {
        targetId: otherId,
        dirX: dirToTarget.x,
        dirY: dirToTarget.y,
        dirZ: dirToTarget.z,
        power: velLength * 2,
    });

    this.app.gameManager.push(dirToTarget.clone().mulScalar(-1), velLength * .4);
}

KnockoutModeGameManager.prototype.push = function (_direction, _power) {
    this.app.knockoutModePlayerController.push(_direction, _power);
}

KnockoutModeGameManager.prototype.shoot = function () {
    this.app.knockoutModePlayerController.shoot(this.aim.charge);
}

KnockoutModeGameManager.prototype.teleportToLobby = function (data) {
    if (data.force || this.isInGame) {
        this.app.knockoutModePlayerController.teleportToPosition(
            this.lobbySpawnPoints.children[this.getMyIndex()].getPosition().clone()
        );
    }
}

KnockoutModeGameManager.prototype.placeItem = function (itemId, position) {
    switch (itemId) {
        case KnockoutModeItems.SpikeBall:
            if (this.assetSpikeBall && this.assetSpikeBall.resource) {
                let instance = this.assetSpikeBall.resource.instantiate();
                instance.setPosition(position);
                this.app.root.addChild(instance);
            }
            break;

        case KnockoutModeItems.Slime:
            if (this.assetSlime && this.assetSlime.resource) {
                let instance = this.assetSlime.resource.instantiate();
                instance.setPosition(position);
                this.app.root.addChild(instance);
            }
            break;

        case KnockoutModeItems.Bomb:
            if (this.assetBomb && this.assetBomb.resource) {
                let instance = this.assetBomb.resource.instantiate();
                instance.setPosition(position);
                this.app.root.addChild(instance);
            }
            break;

        case KnockoutModeItems.Wall:
            if (this.assetWall && this.assetWall.resource) {
                let instance = this.assetWall.resource.instantiate();
                instance.setPosition(position);
                this.app.root.addChild(instance);
            }
            break;
    }
}

KnockoutModeGameManager.prototype.onActiveItemIdChanged = function (_itemID) {
    if (this.currentPhase == "aim") {
        if (_itemID != -1) { this.aim.close(true); }
        else { this.aim.open(); }
    }
}

KnockoutModeGameManager.prototype.changePhase = function (newPhase) {
    this.currentPhase = newPhase;
    this.state.set(newPhase);
}

KnockoutModeGameManager.prototype.changeMap = function (_map, _enviourment) {
    if (_map != null) {
        this.maps.forEach(map => { map.enabled = false; });

        switch (_map) {
            case "green0": this.map.currentMapEntity = this.maps[0]; break;
            case "green1": this.map.currentMapEntity = this.maps[1]; break;
            case "green2": this.map.currentMapEntity = this.maps[2]; break;
            case "pink0": this.map.currentMapEntity = this.maps[3]; break;
            case "pink1": this.map.currentMapEntity = this.maps[4]; break;
            case "pink2": this.map.currentMapEntity = this.maps[5]; break;
        };
    };

    this.map.currentMapEntity.enabled = true;
    this.map.currentMapSpawnPointsEntity = this.map.currentMapEntity.children[0];

    if (_enviourment != null) {
        this.enviourments.forEach(enviourment => { enviourment.enabled = false; });

        switch (_enviourment) {
            case "blue": this.enviourments[0].enabled = true; break;
            case "green": this.enviourments[1].enabled = true; break;
            case "pink": this.enviourments[2].enabled = true; break;
        };
    };
};

KnockoutModeGameManager.prototype.clearMap = function () {
    ["Obstacle"].forEach(tag => {
        this.app.root.findByTag(tag).forEach(entity => {
            entity.destroy();
        });
    });
}

KnockoutModeGameManager.prototype.onPlayerDied = function () {
    this.app.knockoutModeNetworkManager.send("Client:SetIsSlideMode", { boolean: false });
    this.app.knockoutModeNetworkManager.send("Client:SetIsInGame", { boolean: false });

    this.aim.close();
}

KnockoutModeGameManager.prototype.getMyIndex = function () {
    let room = this.app.knockoutModeNetworkManager.room;
    if (!room || !room.state) { return null; }

    let playersArray = Array.from(room.state.players.values());
    let myIndex = playersArray.findIndex(
        p => p.sessionId === room.sessionId
    );
    return myIndex;
}

KnockoutModeGameManager.prototype.setIsSlideMode = function (_isSlideMode, _otherPlayerCont) {
    if (_otherPlayerCont == null) {
        this.isSlideMode = _isSlideMode;
        //this.app.knockoutModePlayerController._animComponent.setBoolean("sitting", _isSlideMode);
        //this.app.knockoutModePlayerController.entity.collision.height = (_isSlideMode ? 1.7 : 2.0);
        //this.app.knockoutModePlayerController.setHoverVisible(_isSlideMode);
    } else {
        //_otherPlayerCont.anim.setBoolean("sitting", _isSlideMode);
        //_otherPlayerCont.setHoverVisible(_isSlideMode);
        _otherPlayerCont.setRemoteCollider(_isSlideMode);
    }
};

KnockoutModeGameManager.prototype.setShootIndex = function (_index, _otherPlayerCont) {
    if (_otherPlayerCont == null) {
        this.app.knockoutModePlayerController.setShootIndex(_index >= 0 ? _index + 1 : null);
    } else {
        _otherPlayerCont.setShootIndex(_index >= 0 ? _index + 1 : null);
    }
};

KnockoutModeGameManager.prototype.setIsShootingNow = function (_boolean, _otherPlayerCont) {
    if (_otherPlayerCont == null) {
        this.app.knockoutModePlayerController.setIsShootingNow(_boolean);
        if (_boolean) {
            this.app.gameManager.sfx_aimMyTurn();
        }
    } else {
        _otherPlayerCont.setIsShootingNow(_boolean);
    }
};

KnockoutModeGameManager.prototype.sfx_countdown = function () {
    this.entity.sound.play("countdown");
}
KnockoutModeGameManager.prototype.sfx_intro = function () {
    this.entity.sound.play("intro");
}
KnockoutModeGameManager.prototype.sfx_aim = function () {
    this.entity.sound.play("aim");
}
KnockoutModeGameManager.prototype.sfx_aimLockIn = function () {
    this.entity.sound.play("aimLockIn");
}
KnockoutModeGameManager.prototype.sfx_aimMyTurn = function () {
    this.entity.sound.play("aimMyTurn");
}
KnockoutModeGameManager.prototype.sfx_waterSplash = function () {
    this.entity.sound.play("waterSplash");
}
KnockoutModeGameManager.prototype.sfx_purchase = function () {
    this.entity.sound.play("purchase");
}
KnockoutModeGameManager.prototype.sfx_warning = function () {
    this.entity.sound.play("warning");
}
KnockoutModeGameManager.prototype.sfx_win = function () {
    this.entity.sound.play("win");
}




