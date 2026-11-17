/*CoShopScreen script that handles shop screen panel controls by Burak Ersin - emolingo games */
var CoShopScreen = pc.createScript('coShopScreen');
CoShopScreen.attributes.add('shopButtonsParent', { type: 'entity' });
CoShopScreen.attributes.add('shopButtonTemplate', { type: 'asset', assetType: 'template' });
CoShopScreen.attributes.add('quitButton', { type: 'entity' });

CoShopScreen.prototype.initialize = function () {
    this.app.carObbyShopEnabled = false;
    this.quitButton.button.on('click', function (event) {
        this.app.fire("coUiManager:openGameScreen");
    }, this);

    this.onEnable();
    this.entity.script.on('enable', this.onEnable, this);
    this.entity.script.on('disable', this.onDisable, this);

    this.on("destroy", () => {
        this.entity.script.off('enable', this.onEnable, this);
        this.entity.script.off('disable', this.onDisable, this);
    }, this);
};

CoShopScreen.prototype.onEnable = function () {
    if (this.app.gameplayStarted == true) {
        PokiSDK.gameplayStop();
        this.app.gameplayStarted = false;
    }
    this.app.carObbyShopEnabled = true;
    let i = 0;
    this.intervalId = setInterval(() => {
        if (i < 9) {
            spawnedShopButton = this.shopButtonTemplate.resource.instantiate();
            this.shopButtonsParent.addChild(spawnedShopButton);
            i++;
        } else {
            clearInterval(this.intervalId);
        }
    }, 100);
};

CoShopScreen.prototype.onDisable = function () {
    this.app.carObbyShopEnabled = false;
    clearInterval(this.intervalId);
    let children = this.shopButtonsParent.children.slice();
    for (var i = children.length - 1; i >= 0; i--) {
        children[i].destroy();
    }
};