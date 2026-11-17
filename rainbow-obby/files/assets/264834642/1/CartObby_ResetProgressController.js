/*CartObbyResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var CartObbyResetProgressController = pc.createScript('cartObbyResetProgressController');

CartObbyResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

CartObbyResetProgressController.prototype.resetData = async function () {
    if (this.networkManager.room)
        await this.networkManager.room.leave();

    CartObby_Utils.clear();
    this.app.scenes.changeScene("CartObby");
};