var AdsManager = pc.createScript('adsManager');

AdsManager.prototype.initialize = function () {
    AdsManager.instance = this;
    this.adActive = false;
    this.gameplay = false;
    this.first_flag = true;

    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onInput, this);

    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onInput, this);
    }

    // Agregar soporte para teclado
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onInput, this);

};

AdsManager.prototype.onInput = function () {
    if(this.first_flag)
    {
        this.first_flag = false;
        AdsManager.instance.gameplayStart();
    }
};

AdsManager.prototype.showCommercialBreak = function (callback = null) {
    if (this.app.p) {
        this.app.systems.sound.volume = 0;
        this.adActive = true;
        this.app.timeScale = 0;

        PokiSDK.commercialBreak().then(function () {
            this.adActive = false;
            this.app.systems.sound.volume = 1;
            this.app.timeScale = 1;
            if (callback) {
                callback();
            }
        }.bind(this));
    }
    else {
        if (callback) {
            callback();
        }
    }
};

AdsManager.prototype.showRewardedBreak = function (callback = null) {
    if (this.app.p) {
        this.app.systems.sound.volume = 0;
        this.adActive = true;
        this.app.timeScale = 0;
        //console.log("time scale:" + this.app.timeScale);

        PokiSDK.rewardedBreak().then(function (success) {
            this.adActive = false;
            this.app.systems.sound.volume = 1;
            this.app.timeScale = 1;
            //console.log("time scale:" + this.app.timeScale);

            if (callback) {
                callback(success);
            }
            //console.log("REWARDED AD FINISHED WITH RESULT: " + success);
        }.bind(this));
    }
    else {
        if (callback) {
            callback(false);
        }
    }
};

AdsManager.prototype.gameplayStart = function () {
    console.log("gstart");
    this.gameplay = true;
    if (!this.app.p) { return };
    PokiSDK.gameplayStart();
};

AdsManager.prototype.gameplayStop = function () {
    console.log("gstop");
    this.gameplay = false;
    if (!this.app.p) { return };
    PokiSDK.gameplayStop();
};