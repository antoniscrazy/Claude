var SlimeTowerAdRewarder = pc.createScript('slimeTowerAdRewarder');

// initialize code called once per entity
SlimeTowerAdRewarder.prototype.initialize = function () {
    this.app.adRewarder = this
};

SlimeTowerAdRewarder.prototype.watchAd = function (eventSuccess, adCount = 1) {
    watchRewarded(() => eventSuccess(), adCount);
}

