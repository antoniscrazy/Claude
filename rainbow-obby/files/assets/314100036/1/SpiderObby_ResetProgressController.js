/*SpiderObbyResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var SpiderObbyResetProgressController = pc.createScript('spiderObbyResetProgressController');

SpiderObbyResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.spiderObbyNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

SpiderObbyResetProgressController.prototype.resetData = async function () {
    if (this.networkManager.room)
        await this.networkManager.room.leave();

    if (this.app.spiderObbyProgress) this.app.spiderObbyProgress.forget();
    SpiderObby_Utils.clear();
    this.app.scenes.changeScene("SpiderObby");
};