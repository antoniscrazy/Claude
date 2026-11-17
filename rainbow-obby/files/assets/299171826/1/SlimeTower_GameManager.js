var SlimeTowerGameManager = pc.createScript('slimeTowerGameManager');

SlimeTowerGameManager.attributes.add("stages", { "type": "entity", "array": true });
SlimeTowerGameManager.attributes.add("stageObstacles", { "type": "asset", "array": true });

SlimeTowerGameManager.attributes.add("sceneName", {"type":"string",default:"tower1"});

SlimeTowerGameManager.attributes.add("checkpoints", { "type": "entity", "array": true });

// initialize code called once per entity
SlimeTowerGameManager.prototype.initialize = function () {
    this.localhost = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.slimeTowerNetworkManager;
    this.app.gameManager = this;

    this.player = this.app.root.findByName("Player");
    this.isPauseMenu = false;

    this._prefix = this.sceneName == "tower2" ? "SlimeTower2_" : "SlimeTower_";

    this.stageMiddlePoints = this.app.root.findByName("StageMiddlePoints");

    this.debugTextUI = this.app.root.findByName("UIDebugText0");

    this.app.on("PlayerDied", this.onPlayerDied, this);
    this.app.on("ActiveItemIdChanged", this.onActiveItemIdChanged, this);
    this.app.on("Connected", this.onConnected, this);
    this.app.on("NoServer", this.onNoServer, this);

    this.on('destroy', function () {
        this.app.off("PlayerDied");
        this.app.off("ActiveItemIdChanged");
        this.app.off("Connected", this.onConnected, this);
        this.app.off("NoServer", this.onNoServer, this);
    }, this);

    this.isPlaycanvas = false;
    if (window.location.href.indexOf('launch.playcanvas.com') > -1) {
        this.isPlaycanvas = true;
    }

    this.lobbySpawnPoint = this.app.root.findByName("LobbySpawnPoint");

    /*     window.test = function (_testID) {
            let _app = pc.Application.getApplication();
            _app.gameManager.castle.entered = true;
            _app.gameManager.loadTest(_testID);
            return true;
        } */

    window.teleport = function (_name) {
        let _app = pc.Application.getApplication();
        _app.gameManager.onTeleportStage(_name);
        return true;
    }

    this.onTeleportStage = (_name) => {

        const _parent = this.app.root.findByName("debugTeleports");

        if (_parent.findByName(_name)) {
            this.app.slimeTowerPlayerController.teleportToPosition(_parent.findByName(_name).getPosition());
        }
    }

    this.checkpoints.forEach((_checkpoint, _index) => {

        //if (!_checkpoint) {return;}

        const _trigger = _checkpoint.script.slimeTowerTrigger;

        _checkpoint.claim = (_chain = false, _claimOnlyVisual = false) => {

            _checkpoint.findByName("CheckPoint_Stage_0_Start_Circle_False").enabled = false;
            _checkpoint.findByName("CheckPoint_Stage_0_Start_Circle_True").enabled = true;

            if (_claimOnlyVisual) {
                this.app.gameManager.checkpoints.forEach((_c, _i) => {
                    if (_i < _index) {
                        _c.claim(true);
                    }
                });
            }

            if (_chain) { return; }

            this.sfx_checkpoint();

            this.app.playerItemManager.playerData.checkpoint = _index;
            SlimeTower_Utils.setItem(this.app.gameManager._prefix + "Checkpoint", _index);

            this.app.gameManager.checkpoints.forEach((_c, _i) => {
                if (_i < _index) {
                    _c.claim(true);
                }
            });
            // çakkallll
            // lannn
            // nası gidiyo kardeş
            // kanka, iyi gidiyoda, ne kaldi
            // benim current checkpoint bide kaç tane checkpoint olduğunu çekmem gerekiyor yukarıdaki progress bar için
            // kolay kanka yaziyom bidk 

            // current: this.app.playerItemManager.playerData.checkpoint
            // this.app.gameManager.checkpoints.length

            //bu ikisi

            // eyw karşim

            // np np np np
        }

        _trigger.onTriggerEnter = () => {
            if (this.app.playerItemManager.playerData.checkpoint < _index) {
                _checkpoint.claim();
            }
        }
    })

    this.stageObstaclesEntities = [];
    this.stages.forEach((_stage, _index) => {

        this.stageObstaclesEntities[_index] = _stage.findByName("StageObstacles");

        /*         _stage.findByName("StageTrigger").script.slimeTowerTrigger.onTriggerEnter = () => {
                    console.log("stage entered: ", _index);
                    this.app.gameManager.toggleStages(_index);
                } */
    })

    this.toggleStages = (_currentStage) => {
        //return;
        this.stages.forEach((_stage, _index) => {
            const _active = (_index == _currentStage || _index + 1 == _currentStage || _index - 1 == _currentStage);
            _stage.enabled = _active;
        })
    }

    //this.toggleStages(0);

    { const handle = this.app.on("Game:ResetGame", () => {
        this.app.fire("resetData");
    }, this); this.on('destroy', () => handle.off()); }

    this.sounds = {
        press: this.entity.findByName("SoundsPress"),
        wrapperPop: this.entity.findByName("SoundsWrapperPop"),
        bubblePop: this.entity.findByName("SoundsBubblePop"),

        playPress: () => {
            this.sounds.press.sound.play("key" + (1 + (Math.floor(Math.random() * 3))));
        },

        playWrapperPop: () => {
            const slotName = "key" + (1 + Math.floor(Math.random() * 4));
            const instance = this.sounds.wrapperPop.sound.play(slotName);

            if (instance) {
                // Set a random pitch between 0.8 and 1.2 for sound variation
                instance.pitch = 0.8 + Math.random() * 0.4;
            }
        },

        playBubblePop: () => {
            const slotName = "key" + (1 + Math.floor(Math.random() * 4));
            const instance = this.sounds.bubblePop.sound.play(slotName);

            if (instance) {
                // Set a random pitch between 0.8 and 1.2 for sound variation
                instance.pitch = 0.8 + Math.random() * 0.4;
            }
        },
    }
};

// update code called every frame
SlimeTowerGameManager.prototype.update = function (dt) {
    if (this.app.slimeTowerNetworkManager && this.app.slimeTowerNetworkManager.room) {
        if (this.app.slimeTowerNetworkManager.menuPanel.enabled && !this.isPauseMenu) {
            this.app.slimeTowerNetworkManager.send("Client:SetIsPauseMenu", { boolean: true });
            console.log("pause:true")
        } else if (!this.app.slimeTowerNetworkManager.menuPanel.enabled && this.isPauseMenu) {
            this.app.slimeTowerNetworkManager.send("Client:SetIsPauseMenu", { boolean: false });
            console.log("pause:false")
        }
    }

    if (this.debugTextUI) { this.debugTextUI.element.text = "checkpoint: " + this.app.playerItemManager.playerData.checkpoint; }


    let closestIndex = null;
    let closestDistance = Infinity;

    const playerPos = this.player.getPosition();

    this.stageMiddlePoints.children.forEach((child, index) => {
        const distance = playerPos.distance(child.getPosition());

        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    this.stages.forEach((_stage, _index) => {
        const _enabled = (_index == closestIndex || _index + 1 == closestIndex || _index - 1 == closestIndex);
        if (_stage.enabled != _enabled) { _stage.enabled = _enabled; }
    })
};


SlimeTowerGameManager.prototype.teleportToLobby = function () {
    /*     this.app.slimeTowerPlayerController.teleportToPosition(
            this.lobbySpawnPoint.children[this.getMyIndex()].getPosition().clone()
        ); */

    this.app.slimeTowerPlayerController.teleportToPosition(
        this.lobbySpawnPoint.getPosition().clone()
    );

    console.log("teleportToLobby");
}

SlimeTowerGameManager.prototype.teleportToCheckpoint = function () {

    console.log("teleportToCheckpoint");

    if (!this.app.playerItemManager || !this.app.playerItemManager.playerData) {
        this.teleportToLobby();
        return;
    }

    const _target = this.checkpoints[this.app.playerItemManager.playerData.checkpoint];

    if (_target) {
        this.app.slimeTowerPlayerController.teleportToPosition(_target.findByName("SpawnPoint").getPosition().clone());
        _target.claim(true);

    } else {
        this.teleportToLobby();
    }
}

SlimeTowerGameManager.prototype.onSkipCheckpoint = function () {
    console.log("onSkipCheckpoint");

    this.app.playerItemManager.playerData.checkpoint = pc.math.clamp(this.app.playerItemManager.playerData.checkpoint + 1, 0, this.app.gameManager.checkpoints.length - 1);
    SlimeTower_Utils.setItem(this.app.gameManager._prefix + "Checkpoint", this.app.playerItemManager.playerData.checkpoint);

    this.teleportToCheckpoint();
}

SlimeTowerGameManager.prototype.onConnected = function () {
    if (!this.app.slimeTowerNetworkManager.room) return;

    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.teleportToCheckpoint();
    }, 100);
}

SlimeTowerGameManager.prototype.onNoServer = function () {
    // burayı aç
    //this.teleportToCheckpoint();
}


SlimeTowerGameManager.prototype.onActiveItemIdChanged = function (_itemID) {

}

SlimeTowerGameManager.prototype.onPlayerDied = function () {
    this.app.inventory.closeSlot();
}

SlimeTowerGameManager.prototype.getMyIndex = function () {
    let room = this.app.slimeTowerNetworkManager.room;
    if (!room || !room.state) { return 0; }

    let playersArray = Array.from(room.state.players.values());
    let myIndex = playersArray.findIndex(
        p => p.sessionId === room.sessionId
    );

    console.log("myIndex", myIndex)

    return myIndex;
}


SlimeTowerGameManager.prototype.sfx_purchase = function () {
    this.entity.sound.play("purchase");
}
SlimeTowerGameManager.prototype.sfx_warning = function () {
    this.entity.sound.play("warning");
}
SlimeTowerGameManager.prototype.sfx_checkpoint = function () {
    this.entity.sound.play("checkpoint");
}
SlimeTowerGameManager.prototype.sfx_slap = function () {
    this.entity.sound.play("slap");
}
