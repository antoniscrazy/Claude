var PvpModeWatchAd = pc.createScript('pvpModeWatchAd');

PvpModeWatchAd.prototype.initialize = function () {
    this.adCount = 0;
    this.circle = this.entity.findByName("Loading Radial");
    this.circle.script.progressRadial.callback = this;
    //this.adElement.text = this.adCount;
    this.entity.collision.on("triggerenter", this.triggerenter, this);
    this.entity.collision.on("triggerleave", this.triggerleave, this);

    this.callback;
    this.callback_args;
};

PvpModeWatchAd.prototype.triggerenter = function (entity) {
    if (entity.tags.has("Player")) {
        this.circle.script.progressRadial.isUse = true;
        this.soundStart()
    }
};

PvpModeWatchAd.prototype.triggerleave = function (entity) {
    if (entity.tags.has("Player")) {
        this.circle.script.progressRadial.isUse = false;
        this.soundStop();
    }
};

PvpModeWatchAd.prototype.watchAds = function () {
    watchRewarded(() => this.success(), this.adCount);
    this.circle.script.progressRadial.isUse = false;
}

PvpModeWatchAd.prototype.success = function () {
    this.app.fire(this.callback, this.callback_args);
    this.entity.sound.play("reward");
    this.rewardedEntity.enabled = false;
}

PvpModeWatchAd.prototype.soundStart = function () {
    if (!this.isSound) {
        this.isSound = true;
        if (this.entity)
            this.entity.sound.play("load");
    }
}

PvpModeWatchAd.prototype.soundStop = function () {
    if (this.isSound) {
        this.isSound = false;
        if (this.entity)
            this.entity.sound.stop("load");
    }



}