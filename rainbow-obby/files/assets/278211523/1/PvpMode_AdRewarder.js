var PvpModeAdRewarder = pc.createScript('pvpModeAdRewarder');

// initialize code called once per entity
PvpModeAdRewarder.prototype.initialize = function () {
    this.app.adRewarder = this
};

PvpModeAdRewarder.prototype.watchAd = function (eventSuccess, adCount = 1) {
    watchRewarded(() => eventSuccess(), adCount);

    //setTimeout(()=> eventSuccess(), 200);
}

