var SkateboardObbyAdRewarder = pc.createScript('skateboardObbyAdRewarder');

// initialize code called once per entity
SkateboardObbyAdRewarder.prototype.initialize = function () {
    this.app.adRewarder = this
};

SkateboardObbyAdRewarder.prototype.watchAd = function (eventSuccess, adCount = 1) {
    watchRewarded(() => eventSuccess(), adCount);
}

