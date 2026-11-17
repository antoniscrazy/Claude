/*PlaneObbyResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var PlaneObbyResetProgressController = pc.createScript('planeObbyResetProgressController');

PlaneObbyResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

PlaneObbyResetProgressController.prototype.resetData = async function () {
    if (this.networkManager.room)
        await this.networkManager.room.leave();

    PlaneObby_Utils.clear();
    this.app.scenes.changeScene("PlaneObby");
};