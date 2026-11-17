/*ElectricObbyResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var ElectricObbyResetProgressController = pc.createScript('electricObbyResetProgressController');

ElectricObbyResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.electricObbyNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

ElectricObbyResetProgressController.prototype.resetData = async function () {
    if (this.networkManager.room)
        await this.networkManager.room.leave();

    ElectricObby_Utils.clear();
    this.app.scenes.changeScene("ElectricObby");
};