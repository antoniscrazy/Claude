/*SkateboardObbyResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var SkateboardObbyResetProgressController = pc.createScript('skateboardObbyResetProgressController');

SkateboardObbyResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.skateboardObbyNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

SkateboardObbyResetProgressController.prototype.resetData = async function () {
    if (this.networkManager.room)
        await this.networkManager.room.leave();

    SkateboardObby_Utils.clear();
    this.app.scenes.changeScene("SkateboardObby");
};