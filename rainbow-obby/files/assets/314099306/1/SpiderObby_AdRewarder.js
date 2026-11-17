var SpiderObbyAdRewarder = pc.createScript('spiderObbyAdRewarder');

// initialize code called once per entity
SpiderObbyAdRewarder.prototype.initialize = function () {
    this.app.adRewarder = this
};

SpiderObbyAdRewarder.prototype.watchAd = function (eventSuccess, adCount = 1) {
    watchRewarded(() => eventSuccess(), adCount);
}

