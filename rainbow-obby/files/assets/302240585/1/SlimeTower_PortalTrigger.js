var SlimeTowerPortalTrigger = pc.createScript('slimeTowerPortalTrigger');

SlimeTowerPortalTrigger.attributes.add('sceneName', { type: 'string', default: 'SlimeTower_2', title: 'Scene Name' });
SlimeTowerPortalTrigger.attributes.add('isAd', { type: 'boolean', default: false, title: 'Watch Ad To Teleport' });

SlimeTowerPortalTrigger.prototype.initialize = function () {
    this.hasTriggered = false;

    if (SlimeTower_Utils.getItem("SlimeTower_" + this.app.slimeTowerNetworkManager.roomName) == "1" && this.sceneName == "SlimeTower_2") {
        this.isAd = false;
    }

    this.id = "PortalTrigger" + this.getRandomId();
    this.idAdYes = this.id + "AdYes";
    this.idAdNo = this.id + "AdNo";

    this.on(this.idAdYes, this.onAdYes, this);
    this.on(this.idAdNo, this.onAdNo, this);

    this.on('destroy', function () {
        this.off(this.idAdYes, this.onAdYes, this);
        this.off(this.idAdNo, this.onAdNo, this);
    }, this);

    this.entity.collision.on('triggerenter', this.onTriggerEnter, this);
};

SlimeTowerPortalTrigger.prototype.onTriggerEnter = function (otherEntity) {
    if (this.hasTriggered) return;
    if (!otherEntity.tags.has('Player')) return;

    // Player template'i diger oyunculara da instantiate edildigi ve hepsi "Player" tag'ine sahip oldugu icin sadece local player'i kontrol et
    var localPlayerController = this.app.slimeTowerPlayerController;
    if (localPlayerController && otherEntity !== localPlayerController.entity) return;

    this.hasTriggered = true;

    if (this.isAd) {
        this.app.slimeTowerPopupController.showPopup("Ad Break?", "Would you like to watch an ad to teleport?", true, this, this.idAdYes, this.idAdNo, null, true, true);
    } else {
        this.app.slimeTowerPopupController.showPopup("Teleport?", "Do you want to teleport to the other world?", true, this, this.idAdYes, this.idAdNo, null, false, true);
    }
};

SlimeTowerPortalTrigger.prototype.onAdYes = function () {
    if (this.isAd) {
        this.app.adRewarder.watchAd(() => this.goToScene());
    } else {
        this.goToScene();
    }
};

SlimeTowerPortalTrigger.prototype.onAdNo = function () {
    this.hasTriggered = false;
};

SlimeTowerPortalTrigger.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
};

SlimeTowerPortalTrigger.prototype.goToScene = async function () {
    var networkManager = this.app.slimeTowerNetworkManager;

    if (networkManager && networkManager.room) {
        try {
            await networkManager.room.leave();
        } catch (e) {
            console.log(e);
        }
    }

    if (!this.app.scenes.find(this.sceneName)) {
        console.log('SlimeTowerPortalTrigger: scene not found -', this.sceneName);
        this.hasTriggered = false;
        return;
    }

    this.app.scenes.changeScene(this.sceneName);
};
