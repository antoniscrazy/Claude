var MeowModeAdRewarder = pc.createScript('meowModeAdRewarder');

// initialize code called once per entity
MeowModeAdRewarder.prototype.initialize = function () {
    this.app.adRewarder = this
};

MeowModeAdRewarder.prototype.watchAd = function (eventSuccess, adCount = 1) {
    watchRewarded(() => eventSuccess(), adCount);

    //setTimeout(()=> eventSuccess(), 200);
}

