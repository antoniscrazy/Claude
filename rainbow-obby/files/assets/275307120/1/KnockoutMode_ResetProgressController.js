/*KnockoutModeResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var KnockoutModeResetProgressController = pc.createScript('knockoutModeResetProgressController');

KnockoutModeResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.knockoutModeNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

KnockoutModeResetProgressController.prototype.resetData = async function () {
    if (this.networkManager.room)
        await this.networkManager.room.leave();

    KnockoutMode_Utils.clear();
    this.app.scenes.changeScene("KnockoutMode");
};