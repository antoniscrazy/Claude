/*MeowModeResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var MeowModeResetProgressController = pc.createScript('meowModeResetProgressController');

MeowModeResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.meowModeNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

MeowModeResetProgressController.prototype.resetData = async function () {
    if (this.networkManager.room)
        await this.networkManager.room.leave();

    MeowMode_Utils.clear();
    this.app.scenes.changeScene("MeowMode");
};