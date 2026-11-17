/*TowerObbyResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var TowerObbyResetProgressController = pc.createScript('towerObbyResetProgressController');

TowerObbyResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.towerObbyNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

TowerObbyResetProgressController.prototype.resetData = async function () {
    if (this.networkManager.room)
        await this.networkManager.room.leave();

    TowerObby_Utils.clear();
    this.app.scenes.changeScene("TowerObby");
};