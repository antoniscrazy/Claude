var MeowModeGameManager = pc.createScript('meowModeGameManager');


// initialize code called once per entity
MeowModeGameManager.prototype.initialize = async function () {
    this.localhost = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.meowModeNetworkManager;
    this.app.gameManager = this;

    this.lobbySpawnPoints = this.app.root.findByName("LobbySpawnPoints");
    this.player = this.app.root.findByName("Player");
    this.isPauseMenu = false;

    this.breakableObjects = {}
    this.effects = {
        hit: this.app.assets.get(283313510),
        damageText: this.app.assets.get(283314360),
    }

    this.app.on("debug:giveLevel", () => {
        this.app.meowModeNetworkManager.send("Client:GiveLevel");
    }, this)

    this.app.on("PlayerDied", this.onPlayerDied, this);
    this.app.on("ActiveItemIdChanged", this.onActiveItemIdChanged, this);
    this.app.on("Connected", this.onConnected, this);

    this.on('destroy', function () {
        this.app.off("PlayerDied");
        this.app.off("ActiveItemIdChanged");
        this.app.off("Connected");
        this.app.off("debug:giveLevel");
    }, this);

    this.isPlaycanvas = false;
    if (window.location.href.indexOf('launch.playcanvas.com') > -1) {
        this.isPlaycanvas = true;
    }


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
};

// update code called every frame
MeowModeGameManager.prototype.update = function (dt) {
    if (!this.app.meowModeNetworkManager.room || !this.app.meowModeNetworkManager.room.state) { return; }

    if (this.app.meowModeNetworkManager.menuPanel.enabled && !this.isPauseMenu) {
        this.app.meowModeNetworkManager.send("Client:SetIsPauseMenu", { boolean: true });
        console.log("pause:true")
    } else if (!this.app.meowModeNetworkManager.menuPanel.enabled && this.isPauseMenu) {
        this.app.meowModeNetworkManager.send("Client:SetIsPauseMenu", { boolean: false });
        console.log("pause:false")
    }

    if (this.app.keyboard.wasPressed(pc.KEY_SHIFT)){
        this.app.meowModeNetworkManager.send("Client:GiveLevel");
    }
};

MeowModeGameManager.prototype.teleportToGame = function () {
    let _spawn =
        this.app.meowModePlayerController.teleportToPosition(this.map.currentMapSpawnPointsEntity.children[this.getMyIndex()].getPosition().clone());
    this.app.meowModePlayerController.stop();
}

MeowModeGameManager.prototype.onConnected = function () {
    if (!this.app.meowModeNetworkManager.room) return;

    setTimeout(() => { if (this.entity && !this.entity.script) return; return this.teleportToLobby(); }, 500);
}

MeowModeGameManager.prototype.teleportToLobby = function () {
    //if (!this.isInGame){return;}

    this.app.meowModePlayerController.teleportToPosition(
        this.lobbySpawnPoints.children[this.getMyIndex()].getPosition().clone()
    );
}


MeowModeGameManager.prototype.onActiveItemIdChanged = function (_itemID) {

}

MeowModeGameManager.prototype.onPlayerDied = function () {
    this.app.inventory.closeSlot();
}

MeowModeGameManager.prototype.getMaxXpForThisLevel = function (_level) {
    return Math.pow(2, _level);
}

MeowModeGameManager.prototype.getMyIndex = function () {
    let room = this.app.meowModeNetworkManager.room;
    if (!room || !room.state) { return null; }

    let playersArray = Array.from(room.state.players.values());
    let myIndex = playersArray.findIndex(
        p => p.sessionId === room.sessionId
    );

    console.log("myIndex", myIndex)

    return myIndex;
}

MeowModeGameManager.prototype.warning = function (_text) {
    this.app.fire("WarningTextController:setWarning", _text, null, new pc.Color(1, 0.51, 0.03, 1));
    this.app.gameManager.sfx_warning();
}

MeowModeGameManager.prototype.damageText = function (_objectId, _damage) {
    //this.app.fire("WarningTextController:setWarning", `${_damage} damage done.`, null, new pc.Color(1, 1, 1, 1));

    if (this.effects.damageText && this.effects.damageText.resource && this.breakableObjects[_objectId] && this.effects.hit && this.effects.hit.resource) {
        let _inst = this.effects.damageText.resource.instantiate();
        let _inst2 = this.effects.hit.resource.instantiate();

        let _pos = this.breakableObjects[_objectId].entity.getPosition();
        let _offset = .75;
        let _pos_offeted = new pc.Vec3(_pos.x + pc.math.random(-_offset, _offset), _pos.y + pc.math.random(-_offset, _offset), _pos.z + pc.math.random(-_offset, _offset));
        _inst.setPosition(_pos_offeted);
        _inst2.setPosition(_pos_offeted);
        _inst.children[0].element.text = "-" + _damage;
        this.app.root.addChild(_inst);
        this.app.root.addChild(_inst2);

        //console.log(_objectId,_damage, _pos);
    }
}

MeowModeGameManager.prototype.sfx_hit = function () { this.entity.sound.play("hit"); }
MeowModeGameManager.prototype.sfx_destroy = function () { this.entity.sound.play("destroy"); }
MeowModeGameManager.prototype.sfx_levelUp = function () { this.entity.sound.play("levelup"); }
MeowModeGameManager.prototype.sfx_warning = function () { this.entity.sound.play("warning"); }
MeowModeGameManager.prototype.sfx_purchase = function () { this.entity.sound.play("purchase"); }
MeowModeGameManager.prototype.sfx_death = function () { this.entity.sound.play("death"); }




