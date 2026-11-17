var ElectricObbyAdRewarder = pc.createScript('electricObbyAdRewarder');

// initialize code called once per entity
ElectricObbyAdRewarder.prototype.initialize = function () {
    this.app.adRewarder = this
};

ElectricObbyAdRewarder.prototype.watchAd = function (eventSuccess, adCount = 1) {
    watchRewarded(() => eventSuccess(), adCount);
}

