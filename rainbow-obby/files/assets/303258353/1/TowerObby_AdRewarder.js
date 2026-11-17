var TowerObbyAdRewarder = pc.createScript('towerObbyAdRewarder');

// initialize code called once per entity
TowerObbyAdRewarder.prototype.initialize = function () {
    this.app.adRewarder = this
};

TowerObbyAdRewarder.prototype.watchAd = function (eventSuccess, adCount = 1) {
    watchRewarded(() => eventSuccess(), adCount);
}

