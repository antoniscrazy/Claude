var RiverObbyMarketController = pc.createScript('riverObbyMarketController');

// initialize code called once per entity
RiverObbyMarketController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.riverObbyNetworkManager;
    this.marketPanel = this.entity.children[0];
    this.marketButton = this.app.root.findByName("ShopButton");
    this.marketButton.button.on('click', function (event) {
        this.enableMarket();
    }, this);
    this.closeButton = this.marketPanel.findByName("CloseButton");
    this.closeButton.button.on('click', function (event) {
        this.disableMarket();
    }, this);

    this.app.on("MarketClose", this.closeMarket, this);
    this.on('destroy', function () {
        this.app.off("MarketClose", this.closeMarket, this);
    }, this);
};

// update code called every frame
RiverObbyMarketController.prototype.update = function (dt) {
    if (this.app.keyboard.wasPressed(pc.KEY_M)) {
        if (this.app.isMarketEnabled) {
            this.disableMarket();
        } else {
            this.enableMarket();
        }
    }
};

RiverObbyMarketController.prototype.enableMarket = function () {
    if (this.app.menuPanelEnabled) return;
    this.marketPanel.enabled = true;
    this.app.isMarketEnabled = true;
    this.app.fire("lockCamera", true);
    this.networkManager.setBlackBG(true);
    if (this.app.gameplayStarted) {
        this.app.gameplayStarted = false
        PokiSDK.gameplayStop();
    }
};

RiverObbyMarketController.prototype.disableMarket = function () {
    this.closeMarket();
    this.app.fire("lockCamera", false);
    this.networkManager.setBlackBG(false);
};

RiverObbyMarketController.prototype.closeMarket = function () {
    this.marketPanel.enabled = false;
    this.app.isMarketEnabled = false;
};
