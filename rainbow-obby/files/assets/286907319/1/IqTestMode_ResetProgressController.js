/*IqTestModeResetProgressController script that clears all the progress saved on local storage by Emre Şahin - emolingo games */
var IqTestModeResetProgressController = pc.createScript('iqTestModeResetProgressController');

IqTestModeResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.iqTestModeNetworkManager;
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);
};

IqTestModeResetProgressController.prototype.resetData = async function () {

    //this.app.playerItemManager.playerData.testID = 1;
    this.app.playerItemManager.playerData.testID = 1;

    console.log("resetdata: " + IqTestMode_Utils.getItem("IQTESTMODE_TestID"))
    //IqTestMode_Utils.setItem("IQTESTMODE_TestID", 1);
    IqTestMode_Utils.clear();
    console.log("resetdata: " + IqTestMode_Utils.getItem("IQTESTMODE_TestID"))

    if (this.networkManager.room)
        await this.networkManager.room.leave();
    console.log("resetdata: " + IqTestMode_Utils.getItem("IQTESTMODE_TestID"))

    this.app.scenes.changeScene("IqTestMode");

    //IqTestMode_Utils.clear();
};