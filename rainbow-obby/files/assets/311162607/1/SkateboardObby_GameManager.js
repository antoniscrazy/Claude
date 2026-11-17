var SkateboardObbyGameManager = pc.createScript('skateboardObbyGameManager');

// initialize code called once per entity
SkateboardObbyGameManager.prototype.initialize = function () {
    // true: launch.playcanvas.com connects to the test server (ws://localhost is commented out in joinServer). Leave false.
    this.localhost = false;
    this.networkManager = this.app.root.findByName("NetworkManager").script.skateboardObbyNetworkManager;
    this.app.gameManager = this;

    this.player = this.app.root.findByName("Player");
    this.isPauseMenu = false;
    this._sentPauseMenu = false;

    this.app.on("PlayerDied", this.onPlayerDied, this);
    this.app.on("ActiveItemIdChanged", this.onActiveItemIdChanged, this);
    this.app.on("Connected", this.onConnected, this);

    // console debug helpers (tp, pos, tpPos, tpList); the previous globals (Monkey's) come back on destroy
    SkateboardObby_Debug.install(this.app);

    this.on('destroy', function () {
        this.app.off("PlayerDied", this.onPlayerDied, this);
        this.app.off("ActiveItemIdChanged", this.onActiveItemIdChanged, this);
        this.app.off("Connected", this.onConnected, this);
        SkateboardObby_Debug.uninstall();
    }, this);

    this.isPlaycanvas = false;
    if (window.location.href.indexOf('launch.playcanvas.com') > -1) {
        this.isPlaycanvas = true;
    }

    this.lobbySpawnPoint = this.app.root.findByName("LobbySpawnPoint");

    // Poki Game Events: SkateboardObby_Analytics (POKI_EVENTS.md). The ElectricObby-era events
    // (minigame_*, dwell_time, concurrent_players_peak) were removed on 2026-10-27.

/*     window.test = function (_testID) {
        let _app = pc.Application.getApplication();
        _app.gameManager.castle.entered = true;
        _app.gameManager.loadTest(_testID);
        return true;
    } */
};

// update code called every frame
SkateboardObbyGameManager.prototype.update = function (dt) {
    if (!this.app.skateboardObbyNetworkManager.room || !this.app.skateboardObbyNetworkManager.room.state) { return; }

    // sent once per change (isPauseMenu only flips when the server echoes it back, a few frames later)
    const menuOpen = this.app.skateboardObbyNetworkManager.menuPanel.enabled;
    if (menuOpen !== this._sentPauseMenu) {
        this._sentPauseMenu = menuOpen;
        this.app.skateboardObbyNetworkManager.send("Client:SetIsPauseMenu", { boolean: menuOpen });
    }

    //this.label.element.text = "current test: " + this.app.playerItemManager.playerData.testID;
};


SkateboardObbyGameManager.prototype.teleportToLobby = function () {
    let _spawn = this.lobbySpawnPoint.children[this.getMyIndex()];
    this.app.skateboardObbyPlayerController.teleportToPosition(_spawn.getPosition().clone());
    this.app.skateboardObbyPlayerController.faceSpawn(_spawn);
}

SkateboardObbyGameManager.prototype.onConnected = function () {
    if (!this.app.skateboardObbyNetworkManager.room) return;

    setTimeout(() => {
        if (this.app.skateboardObbyPlayerController.getCheckpointSpawn()) {
            this.app.skateboardObbyPlayerController.teleport();
        } else {
            this.teleportToLobby();
        }
    }, 100);
}


SkateboardObbyGameManager.prototype.onActiveItemIdChanged = function (_itemID) {

}

SkateboardObbyGameManager.prototype.onPlayerDied = function () {
    this.app.inventory.closeSlot();
}

SkateboardObbyGameManager.prototype.getMyIndex = function () {
    let room = this.app.skateboardObbyNetworkManager.room;
    if (!room || !room.state) { return null; }

    let playersArray = Array.from(room.state.players.values());
    let myIndex = playersArray.findIndex(
        p => p.sessionId === room.sessionId
    );

    return myIndex;
}


SkateboardObbyGameManager.prototype.sfx_purchase = function () {
    this.entity.sound.play("purchase");
}
SkateboardObbyGameManager.prototype.sfx_warning = function () {
    this.entity.sound.play("warning");
}
