var ElectricObbyGameManager = pc.createScript('electricObbyGameManager');

// initialize code called once per entity
ElectricObbyGameManager.prototype.initialize = function () {
    this.localhost = true;
    this.networkManager = this.app.root.findByName("NetworkManager").script.electricObbyNetworkManager;
    this.app.gameManager = this;

    this.player = this.app.root.findByName("Player");
    this.isPauseMenu = false;

    this.app.on("PlayerDied", this.onPlayerDied, this);
    this.app.on("ActiveItemIdChanged", this.onActiveItemIdChanged, this);
    this.app.on("Connected", this.onConnected, this);

    this.on('destroy', function () {
        this.app.off("PlayerDied");
        this.app.off("ActiveItemIdChanged");
        this.app.off("Connected", this.onConnected, this);
        window.removeEventListener("pagehide", this.onPageHide);
        this.flushSessionTracking();
    }, this);

    this.isPlaycanvas = false;
    if (window.location.href.indexOf('launch.playcanvas.com') > -1) {
        this.isPlaycanvas = true;
    }

    this.lobbySpawnPoint = this.app.root.findByName("LobbySpawnPoint");

    this.sessionTime = 0;
    this.peakPlayerCount = 0;
    this.sessionFlushed = false;
    this.brandedPortal = this.app.root.findByName("IEC_door");
    this.trackingCamera = this.app.root.findByName("Camera");
    ElectricObby_Track.portalVisibleTime = 0;

    const hasEnteredBefore = ElectricObby_Utils.getItem("ElectricObby_Entered") === "1";
    const hasCompletedBefore = ElectricObby_Utils.getItem("ElectricObby_Completed") === "1";

    ElectricObby_Track.send("minigame_entered", "electric_obby", hasEnteredBefore ? "return" : "first");

    if (hasEnteredBefore) {
        ElectricObby_Track.send("minigame_returned", "electric_obby", hasCompletedBefore ? "completed" : "incomplete");
    }

    ElectricObby_Utils.setItem("ElectricObby_Entered", "1");

    this.onPageHide = () => { this.flushSessionTracking(); };
    window.addEventListener("pagehide", this.onPageHide);

/*     window.test = function (_testID) {
        let _app = pc.Application.getApplication();
        _app.gameManager.castle.entered = true;
        _app.gameManager.loadTest(_testID);
        return true;
    } */
};

// update code called every frame
ElectricObbyGameManager.prototype.update = function (dt) {
    this.sessionTime += dt;
    this.updatePortalVisibility(dt);
    this.updatePeakPlayerCount();

    if (!this.app.electricObbyNetworkManager.room || !this.app.electricObbyNetworkManager.room.state) { return; }

    if (this.app.electricObbyNetworkManager.menuPanel.enabled && !this.isPauseMenu) {
        this.app.electricObbyNetworkManager.send("Client:SetIsPauseMenu", { boolean: true });
        console.log("pause:true")
    } else if (!this.app.electricObbyNetworkManager.menuPanel.enabled && this.isPauseMenu) {
        this.app.electricObbyNetworkManager.send("Client:SetIsPauseMenu", { boolean: false });
        console.log("pause:false")
    }

    //this.label.element.text = "current test: " + this.app.playerItemManager.playerData.testID;
};


ElectricObbyGameManager.prototype.teleportToLobby = function () {
    let _spawn = this.lobbySpawnPoint.children[this.getMyIndex()];
    this.app.electricObbyPlayerController.teleportToPosition(_spawn.getPosition().clone());
    this.app.electricObbyPlayerController.faceSpawn(_spawn);
}

ElectricObbyGameManager.prototype.onConnected = function () {
    if (!this.app.electricObbyNetworkManager.room) return;

    setTimeout(() => { if (this.entity && !this.entity.script) return;
        if (this.app.electricObbyPlayerController.getCheckpointSpawn()) {
            this.app.electricObbyPlayerController.teleport();
        } else {
            this.teleportToLobby();
        }
    }, 100);
}


ElectricObbyGameManager.prototype.onActiveItemIdChanged = function (_itemID) {

}

ElectricObbyGameManager.prototype.onPlayerDied = function () {
    this.app.inventory.closeSlot();
}

ElectricObbyGameManager.prototype.getMyIndex = function () {
    let room = this.app.electricObbyNetworkManager.room;
    if (!room || !room.state) { return null; }

    let playersArray = Array.from(room.state.players.values());
    let myIndex = playersArray.findIndex(
        p => p.sessionId === room.sessionId
    );

    console.log("myIndex", myIndex)

    return myIndex;
}


ElectricObbyGameManager.prototype.updatePortalVisibility = function (dt) {
    if (!this.brandedPortal || !this.trackingCamera || !this.trackingCamera.camera) { return; }

    if (this.trackingCamera.camera.frustum.containsPoint(this.brandedPortal.getPosition())) {
        ElectricObby_Track.portalVisibleTime += dt;
    }
}

ElectricObbyGameManager.prototype.updatePeakPlayerCount = function () {
    const networkManager = this.app.electricObbyNetworkManager;
    if (!networkManager || networkManager.onlineCount == null) { return; }

    if (networkManager.onlineCount > this.peakPlayerCount) {
        this.peakPlayerCount = networkManager.onlineCount;
    }
}

ElectricObbyGameManager.prototype.flushSessionTracking = function () {
    if (this.sessionFlushed) { return; }
    this.sessionFlushed = true;

    ElectricObby_Track.send("dwell_time", "electric_obby", ElectricObby_Track.seconds(this.sessionTime));
    ElectricObby_Track.send("branded_portal_visible", "iec_portal", ElectricObby_Track.seconds(ElectricObby_Track.portalVisibleTime));
    ElectricObby_Track.send("concurrent_players_peak", "electric_obby", this.peakPlayerCount);

    if (ElectricObby_Utils.getItem("ElectricObby_Completed") !== "1") {
        ElectricObby_Track.send("minigame_exited_incomplete", "electric_obby", "checkpoint_" + this.app.checkpoint);
    }
}

ElectricObbyGameManager.prototype.sfx_purchase = function () {
    this.entity.sound.play("purchase");
}
ElectricObbyGameManager.prototype.sfx_warning = function () {
    this.entity.sound.play("warning");
}
