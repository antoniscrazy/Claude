var SpiderObbyGameManager = pc.createScript('spiderObbyGameManager');

SpiderObbyGameManager.attributes.add('deathHeight', { type: 'number', default: -25, title: 'Death Height', description: 'The player dies below this world y.' });

// initialize code called once per entity
SpiderObbyGameManager.prototype.initialize = function () {
    this.localhost = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.spiderObbyNetworkManager;
    this.app.gameManager = this;

    this.player = this.app.root.findByName("Player");
    this.isPauseMenu = false;

    this.app.on("PlayerDied", this.onPlayerDied, this);
    this.app.on("ActiveItemIdChanged", this.onActiveItemIdChanged, this);
    this.app.on("Connected", this.onConnected, this);

    // console debug helpers (tp, pos, tpPos, tpList); the previous globals come back on destroy
    SpiderObby_Debug.install(this.app);

    this.on('destroy', function () {
        this.app.off("PlayerDied", this.onPlayerDied, this);
        this.app.off("ActiveItemIdChanged", this.onActiveItemIdChanged, this);
        this.app.off("Connected", this.onConnected, this);
        SpiderObby_Debug.uninstall();
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
};

// update code called every frame
SpiderObbyGameManager.prototype.update = function (dt) {
    if (!this.app.spiderObbyNetworkManager.room || !this.app.spiderObbyNetworkManager.room.state) { return; }

    if (this.app.spiderObbyNetworkManager.menuPanel.enabled && !this.isPauseMenu) {
        this.app.spiderObbyNetworkManager.send("Client:SetIsPauseMenu", { boolean: true });
    } else if (!this.app.spiderObbyNetworkManager.menuPanel.enabled && this.isPauseMenu) {
        this.app.spiderObbyNetworkManager.send("Client:SetIsPauseMenu", { boolean: false });
    }

    //this.label.element.text = "current test: " + this.app.playerItemManager.playerData.testID;
};


SpiderObbyGameManager.prototype.teleportToLobby = function () {
    this.app.spiderObbyPlayerController.teleportToPosition(
        this.lobbySpawnPoint.children[this.getMyIndex() || 0].getPosition().clone()
    );
}

SpiderObbyGameManager.prototype.onConnected = function () {
    if (!this.app.spiderObbyNetworkManager.room && !this.app.spiderObbyNetworkManager.offline) return;

    setTimeout(() => {
        this.teleportToLobby();
    }, 100);
}


SpiderObbyGameManager.prototype.onActiveItemIdChanged = function (_itemID) {

}

SpiderObbyGameManager.prototype.onPlayerDied = function () {
    this.app.inventory.closeSlot();
}

SpiderObbyGameManager.prototype.getMyIndex = function () {
    let room = this.app.spiderObbyNetworkManager.room;
    if (!room || !room.state) { return null; }

    let playersArray = Array.from(room.state.players.values());
    let myIndex = playersArray.findIndex(
        p => p.sessionId === room.sessionId
    );


    return myIndex;
}


SpiderObbyGameManager.prototype.sfx_purchase = function () {
    this.entity.sound.play("purchase");
}
SpiderObbyGameManager.prototype.sfx_warning = function () {
    this.entity.sound.play("warning");
}
