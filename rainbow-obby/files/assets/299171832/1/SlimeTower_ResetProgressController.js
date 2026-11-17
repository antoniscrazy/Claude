/*SlimeTowerResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var SlimeTowerResetProgressController = pc.createScript('slimeTowerResetProgressController');

SlimeTowerResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.slimeTowerNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

SlimeTowerResetProgressController.prototype.resetData = async function () {
    if (this.networkManager.room)
        await this.networkManager.room.leave();

    SlimeTower_Utils.clear();
    this.app.scenes.changeScene("SlimeTower");
};