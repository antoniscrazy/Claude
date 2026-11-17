var PvpModeGameManager = pc.createScript('pvpModeGameManager');

/* PvpModeGameManager.attributes.add("mapsClassic", {type:"entity", array:true});
PvpModeGameManager.attributes.add("mapsTeamBattle", {type:"entity", array:true}); */

PvpModeGameManager.attributes.add("mapsClassic", { type: "asset", array: true });
PvpModeGameManager.attributes.add("mapsTeamBattle", { type: "asset", array: true });
PvpModeGameManager.attributes.add("mapsPaintWar", { type: "asset", array: true });
PvpModeGameManager.attributes.add("mapDefault", { type: "asset" });


// initialize code called once per entity
PvpModeGameManager.prototype.initialize = function () {
    this.localhost = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.pvpModeNetworkManager;
    this.app.gameManager = this;
    this.state = new StateSystem;
    this.currentPhase = "";
    this.mode = "";

    this.timerText = this.app.root.findByName("gameTimerText").element;
    this.gameStateText = this.app.root.findByName("gameStateText").element;
    this.lobbySpawnPoints = this.app.root.findByName("LobbySpawnPoints");
    this.waitForTeamToTeleport = false;

    this.player = this.app.root.findByName("Player");
    this.team = null;

    this.win = {
        count: 0,

        setCount: (newCount) => {
            this.win.count = newCount;
            PvpMode_Utils.setItem("PVPMODE_WinCount", newCount);
        }
    }

    this.map = {
        currentMapEntity: null,
        currentMapSpawnPointsEntity: null,
    }

    this.mapRoot = this.app.root.findByName("Maps")
    this.mapRoot.children.forEach(map => { map.destroy(); });
    this.changeMap(null);

    this.nextGameMode = {
        entity: this.app.root.findByName("NextGameModeGroup"),
        label: this.app.root.findByName("gameModeText").element,

        show: () => {
            this.nextGameMode.entity.tween(this.nextGameMode.entity.getLocalScale())
                .to(new pc.Vec3(1, 1, 1), 0.5, pc.SineInOut)
                .start();

            this.sfx_nextGameModeIs();
        },

        hide: () => {
            this.nextGameMode.entity.tween(this.nextGameMode.entity.getLocalScale())
                .to(new pc.Vec3(0, 0, 0), 0.5, pc.SineInOut)
                .start();
        }
    }

    this.nextGameMode.entity.setLocalScale(0, 0, 0);

    this.isInGame = false;
    this.isReady = false;
    this.isPauseMenu = false;

    this.app.on("PlayerDied", this.onPlayerDied, this);
    this.app.on("ActiveItemIdChanged", this.onActiveItemIdChanged, this);
    this.app.on("Connected", this.onConnected, this);

    this.on('destroy', function () {
        this.app.off("PlayerDied");
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
            console.log
            if (this.app.pvpModePlayerController.isDied || !this.isReady) { return; }

            //this.app.pvpModeNetworkManager.send("Client:SetIsInGame", {boolean: true});

            /*             if (this.mode != "team_battle") {
                            this.app.pvpModePlayerController.teleportToPosition(this.map.currentMapSpawnPointsEntity.children[this.getMyIndex()].getPosition().clone());
                            this.app.pvpModePlayerController.stop();
                        } else {
                            this.waitForTeamToTeleport = true;
                        } */
        }
    });

    this.state.add("action", {
        onStart: () => {
            this.app.fire("Map:Start");
            if (this.isInGame) { this.sfx_action(); }
        }

    })

    this.state.add("finished", {
        onStart: () => {
            this.clearMap();
        },
    });
};

// update code called every frame
PvpModeGameManager.prototype.update = function (dt) {
    if (!this.app.pvpModeNetworkManager.room || !this.app.pvpModeNetworkManager.room.state) { return; }

    this.timerText.text = this.app.pvpModeNetworkManager.room.state.roundTimer;
    this.timerText.enabled = this.app.pvpModeNetworkManager.room.state.showRoundTimer;

    this.gameStateText.text = this.app.pvpModeNetworkManager.room.state.gameStateLabel;

    this.state.update(dt);

/*     if (this.app.pvpModePlayerController.entity.getPosition().z < 55) {
        this.app.fire("playerDie");
    } */

    if (this.app.pvpModeNetworkManager.menuPanel.enabled && !this.isPauseMenu) {
        this.app.pvpModeNetworkManager.send("Client:SetIsPauseMenu", { boolean: true });
        console.log("pause:true")
    } else if (!this.app.pvpModeNetworkManager.menuPanel.enabled && this.isPauseMenu) {
        this.app.pvpModeNetworkManager.send("Client:SetIsPauseMenu", { boolean: false });
        console.log("pause:false")
    }

    /*     if (this.isPlaycanvas && this.app.keyboard.wasPressed(pc.KEY_CONTROL)) {
            this.app.pvpModeNetworkManager.send("Client:NextState");
        } */

    //console.log(this.getMyIndex())
};

PvpModeGameManager.prototype.teleportToGame = function () {
    let _spawn =
        this.app.pvpModePlayerController.teleportToPosition(this.map.currentMapSpawnPointsEntity.children[this.getMyIndex()].getPosition().clone());
    this.app.pvpModePlayerController.stop();
}

PvpModeGameManager.prototype.onTeamChanged = function (_team) {
    if (_team == null) { this.waitForTeamToTeleport = false; return; }

    let _spawn = this.map.currentMapSpawnPointsEntity.findByName((_team == "red" ? "Red" : "Blue"));
    console.log("_spawn", _spawn)
    this.app.pvpModePlayerController.teleportToPosition(_spawn.children[this.getMyIndex()].getPosition().clone());
    this.app.pvpModePlayerController.stop();

    let _color = _team == "red" ? new pc.Color(1, .27, .17, 1) : new pc.Color(0, .58, 1, 1);
    this.app.fire('WarningTextController:setWarning', "You are in the " + _team + " team.", 5, _color);
}

PvpModeGameManager.prototype.onConnected = function () {
    if (!this.app.pvpModeNetworkManager.room) return;

    let _savedWinCount = PvpMode_Utils.getItem("PVPMODE_WinCount");
    _savedWinCount = Number(_savedWinCount);
    if (isNaN(_savedWinCount)) {
        _savedWinCount = 0;
    } else {
        _savedWinCount = Math.floor(_savedWinCount);
    }

    if (_savedWinCount > 0) {
        this.app.pvpModeNetworkManager.send("Client:SetWin", { win: _savedWinCount });
    } else {
        PvpMode_Utils.setItem("PVPMODE_WinCount", 0);
        this.app.pvpModeNetworkManager.send("Client:SetWin", { win: 0 });
    };

    this.win.count = _savedWinCount;

    setTimeout(() => { if (this.entity && !this.entity.script) return; return this.teleportToLobby(); }, 500);

/*     setTimeout(()=>{
        this.app.pvpModeNetworkManager.room.send("Client:SetAura", { aura: 1000 });
        this.app.pvpModeNetworkManager.room.send("Client:SetWin", { win: 1000 });

        this.app.inventory.giveItem(PvpModeItems.SlapLollipop);
        this.app.inventory.giveItem(PvpModeItems.Shield);
        this.app.inventory.giveItem(PvpModeItems.JETPACK);
        this.app.inventory.giveItem(PvpModeItems.FLYING_CARPET);
    }, 3*1000); */
}

PvpModeGameManager.prototype.teleportToLobby = function () {
    //if (!this.isInGame){return;}

    this.app.pvpModePlayerController.teleportToPosition(
        this.lobbySpawnPoints.children[this.getMyIndex()].getPosition().clone()
    );
}

PvpModeGameManager.prototype.placeItem = function (itemId, position) {
    switch (itemId) {
        case PvpModeItems.SpikeBall:
            if (this.assetSpikeBall && this.assetSpikeBall.resource) {
                let instance = this.assetSpikeBall.resource.instantiate();
                instance.setPosition(position);
                this.app.root.addChild(instance);
            }
            break;

        case PvpModeItems.Slime:
            if (this.assetSlime && this.assetSlime.resource) {
                let instance = this.assetSlime.resource.instantiate();
                instance.setPosition(position);
                this.app.root.addChild(instance);
            }
            break;

        case PvpModeItems.Bomb:
            if (this.assetBomb && this.assetBomb.resource) {
                let instance = this.assetBomb.resource.instantiate();
                instance.setPosition(position);
                this.app.root.addChild(instance);
            }
            break;

        case PvpModeItems.Wall:
            if (this.assetWall && this.assetWall.resource) {
                let instance = this.assetWall.resource.instantiate();
                instance.setPosition(position);
                this.app.root.addChild(instance);
            }
            break;
    }
}

PvpModeGameManager.prototype.onActiveItemIdChanged = function (_itemID) {

}

PvpModeGameManager.prototype.changePhase = function (newPhase) {
    this.currentPhase = newPhase;
    this.state.set(newPhase);
}

PvpModeGameManager.prototype.changeMap = function (_map) {
    this.mapRoot.children.forEach(map => { map.destroy(); });

    if (_map != null) {
        let _asset = null;
        switch (_map) {
            case "classic_01": _asset = this.mapsClassic[0]; break;
            case "classic_02": _asset = this.mapsClassic[1]; break;
            case "classic_03": _asset = this.mapsClassic[2]; break;
            case "teamBattle_01": _asset = this.mapsTeamBattle[0]; break;
            case "teamBattle_02": _asset = this.mapsTeamBattle[1]; break;
            case "teamBattle_03": _asset = this.mapsTeamBattle[2]; break;
            case "teamBattle_04": _asset = this.mapsTeamBattle[3]; break;
            case "paintWar_01": _asset = this.mapsPaintWar[0]; break;
        };

        if (_asset && _asset.resource) {
            let _instance = _asset.resource.instantiate();
            //instance.setPosition(this.entity.getPosition());
            this.mapRoot.addChild(_instance);

            this.map.currentMapEntity = _instance;
            this.map.currentMapSpawnPointsEntity = this.map.currentMapEntity.findByName("MapSpawnPoints");
        }
    } else {
        /*         if (this.mapDefault && this.mapDefault.resource) {
                    let _instance = this.mapDefault.resource.instantiate();
                    this.mapRoot.addChild(_instance);
                } */
    }
};

PvpModeGameManager.prototype.clearMap = function () {
    ["Obstacle"].forEach(tag => {
        this.app.root.findByTag(tag).forEach(entity => {
            entity.destroy();
        });
    });
}

PvpModeGameManager.prototype.onPlayerDied = function () {
    this.app.inventory.closeSlot();
}

PvpModeGameManager.prototype.getMyIndex = function () {
    let room = this.app.pvpModeNetworkManager.room;
    if (!room || !room.state) { return null; }

    let playersArray = Array.from(room.state.players.values());
    let myIndex = playersArray.findIndex(
        p => p.sessionId === room.sessionId
    );

    console.log("myIndex", myIndex)

    return myIndex;
}

PvpModeGameManager.prototype.isInIntro = function () {
    return (this.app.gameManager.currentPhase == "intro" && this.app.gameManager.isInGame);
}

PvpModeGameManager.prototype.isInAction = function () {
    return (this.app.gameManager.currentPhase == "action" && this.app.gameManager.isInGame);
}

PvpModeGameManager.prototype.sfx_countdown = function () {
    this.entity.sound.play("countdown");
}
PvpModeGameManager.prototype.sfx_intro = function () {
    this.entity.sound.play("intro");
}
PvpModeGameManager.prototype.sfx_aim = function () {
    this.entity.sound.play("aim");
}
PvpModeGameManager.prototype.sfx_aimLockIn = function () {
    this.entity.sound.play("aimLockIn");
}
PvpModeGameManager.prototype.sfx_aimMyTurn = function () {
    this.entity.sound.play("aimMyTurn");
}
PvpModeGameManager.prototype.sfx_waterSplash = function () {
    this.entity.sound.play("waterSplash");
}
PvpModeGameManager.prototype.sfx_purchase = function () {
    this.entity.sound.play("purchase");
}
PvpModeGameManager.prototype.sfx_warning = function () {
    this.entity.sound.play("warning");
}
PvpModeGameManager.prototype.sfx_win = function () {
    this.entity.sound.play("win");
}
PvpModeGameManager.prototype.sfx_swing = function () {
    this.entity.sound.play("swing");
}
PvpModeGameManager.prototype.sfx_ready = function () {
    this.entity.sound.play("ready");
}
PvpModeGameManager.prototype.sfx_unready = function () {
    this.entity.sound.play("unready");
}
PvpModeGameManager.prototype.sfx_nextGameModeIs = function () {
    this.entity.sound.play("nextGameModeIs");
}
PvpModeGameManager.prototype.sfx_action = function () {
    this.entity.sound.play("action");
}
PvpModeGameManager.prototype.sfx_paint = function () {
    //this.entity.sound.play("action");
}




