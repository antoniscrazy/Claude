var LoPowerUp = pc.createScript('loPowerUp');
LoPowerUp.attributes.add("ballon", { type: "boolean" });
LoPowerUp.attributes.add("rocket", { type: "boolean" });
LoPowerUp.attributes.add("tallLadder", { type: "boolean" });

LoPowerUp.prototype.initialize = function () {
    this.rewardedUI = this.app.root.findByName("Rewarded");
    this.rewardedButton = this.rewardedUI.findByName("RewardedAdButton")
    this.rewardedClose = this.rewardedUI.findByName("CloseButton")

    this.rewBallon = this.app.root.findByName("BaloonCoil")
    this.rewJetpack = this.app.root.findByName("JetpackCoil")
    this.rewLadder = this.app.root.findByName("LadderCoil")

    this.rewBallonText = this.rewBallon.findByName("Text");
    this.rewJetpackText = this.rewJetpack.findByName("Text");
    this.rewLadderText = this.rewLadder.findByName("Text");


    this.networkManager = this.app.root.findByName("NetworkManager").script.loNetworkManager;

    this.rewardedClose.button.on("click", this.rewardedPanelClose, this);

    this.entity.collision.on("triggerenter", this.triggerEnter, this);
    this.entity.collision.on("triggerexit", this.triggerExit, this);
    this.rewardedButton.button.on("click", this.rewarded, this);

    this.player = this.app.root.findByName("Player")

    this.current = false;
    this.maxTimer = 30
    this.timerBallon = 0;
    this.timerJetpack = 0;
    this.timerLadder = 0;


    this.app.rocket = false;

    this.ballonImage = this.rewardedUI.findByName("BaloonImage")
    this.jetImage = this.rewardedUI.findByName("JetImage")
    this.ladderImage = this.rewardedUI.findByName("LadderImage")


    this.on("destroy", () => {
        this.rewardedClose.button.off("click", this.rewardedClose, this);
        this.rewardedButton.button.off("click", this.rewarded, this);
        clearInterval(this.intervalBallon);
        clearInterval(this.intervalRocket);

        clearInterval(this.intervalLadder);


        //this.entity.collision.off("triggerenter", this.triggerEnter, this);
        //this.entity.collision.off("triggerexit", this.triggerExit, this);
    }, this)
};

LoPowerUp.prototype.triggerEnter = function (entity) {
    if (entity.tags.has("Player")) {
        this.rewardedPanelOpen();
        this.current = true;
        if (this.ballon) {

        }
        else if (this.rocket) {

        }
        else if (this.tallLadder) {
        }
    }
};

LoPowerUp.prototype.triggerExit = function (entity) {
};
LoPowerUp.prototype.rewardedPanelOpen = function () {
    this.rewardedUI.enabled = true;
    this.app.fire("openRandomPanel");
    this.allImageEnabled(false);
    if (this.ballon) {
        this.ballonImage.enabled = true;
    }
    else if (this.rocket) {
        this.jetImage.enabled = true;
    }
    else if (this.tallLadder) {
        this.ladderImage.enabled = true;
    }
}
LoPowerUp.prototype.rewardedPanelClose = function () {
    this.rewardedUI.enabled = false;
    this.app.fire("lo-closeButton", true);
    this.current = false;
}
LoPowerUp.prototype.rewarded = function () {
    if (!this.current) return;
    PokiSDK.rewardedBreak({
        size: "small",
        onStart: () => {
            this.app.systems.sound.volume = 0;
            this.app.isWatchingAd = true;
        }
    }).then((success) => {
        this.app.isWatchingAd = false;
        this.app.systems.sound.volume = 1;
        if (success) {
            gameanalytics.GameAnalytics.addAdEvent(
                gameanalytics.EGAAdAction.Show,
                gameanalytics.EGAAdType.RewardedVideo,
                "poki",
                "LadderObby"
            );

            this.succesAds();

        }
    });
};

LoPowerUp.prototype.succesAds = function () {
    //if (!this.current) return;
    if (this.ballon) {
        this.rewBallon.enabled = true;
        clearInterval(this.intervalBallon);

        this.app.isBallon = true;
        this.rewardedEnd("ballon");
        if (this.timerBallon) {
            this.timerBallon += this.maxTimer;
        }
        else {
            this.timerBallon = this.maxTimer;
        }
        this.rewBallonText.element.text = this.timerBallon;

        this.player.script.loInventoryController.setItem(0);
        if (this.networkManager.room)
            this.networkManager.room.send("changePowerUp", { start: 0 });
    }
    else if (this.rocket) {
        this.rewJetpack.enabled = true;
        clearInterval(this.intervalRocket);

        if (this.timerJetpack) {
            this.timerJetpack += this.maxTimer;
        }
        else {
            this.timerJetpack = this.maxTimer;
        }
        this.rewJetpackText.element.text = this.timerJetpack;

        this.app.rocket = true;
        this.rewardedEnd("rocket")
        this.player.script.loInventoryController.setItem(1);
        if (this.networkManager.room)
            this.networkManager.room.send("changePowerUp", { start: 1 });
    }
    else if (this.tallLadder) {
        clearInterval(this.intervalLadder);
        this.rewLadder.enabled = true;
        if (this.timerLadder) {
            this.timerLadder += this.maxTimer;
        }
        else {
            this.timerLadder = this.maxTimer;
        }
        this.rewJetpackText.element.text = this.timerLadder;

        this.rewardedEnd("tallLadder")
        this.app.fire("PowerUpTallLadder")
        if (this.networkManager.room)
            this.networkManager.room.send("changePowerUp", { start: 2 });
    }
    this.rewardedPanelClose();
}

LoPowerUp.prototype.rewardedEnd = function (end) {
    if (end == "ballon") {
        this.intervalBallon = setInterval(() => {
            if (this.app.isWatchingAd) return;
            if (this.timerBallon == 0) {
                this.rewBallon.enabled = false;

                clearInterval(this.intervalBallon);
                this.app.isBallon = false;
                this.player.script.loInventoryController.clearItem(0);
                if (this.networkManager.room)
                    this.networkManager.room.send("changePowerUp", { end: 0 });

            }
            this.timerBallon--;
            this.rewBallonText.element.text = this.timerBallon;
        }, 1000)
    }
    else if (end == "rocket") {
        this.intervalRocket = setInterval(() => {
            if (this.app.isWatchingAd) return;

            if (this.timerJetpack == 0) {
                this.rewJetpack.enabled = false;

                clearInterval(this.intervalRocket);
                this.app.rocket = false;
                this.player.script.loInventoryController.clearItem(1);
                if (this.networkManager.room)
                    this.networkManager.room.send("changePowerUp", { end: 1 });

            }
            this.timerJetpack--;
            this.rewJetpackText.element.text = this.timerJetpack;

        }, 1000)
    }
    else if (end == "tallLadder") {
        this.intervalLadder = setInterval(() => {
            if (this.app.isWatchingAd) return;
            if (this.timerLadder == 0) {
                this.rewLadder.enabled = false;


                clearInterval(this.intervalLadder);
                this.app.fire("NanTallLadder");
                if (this.networkManager.room)
                    this.networkManager.room.send("changePowerUp", { end: 2 });
            }
            this.timerLadder--;
            this.rewLadderText.element.text = this.timerLadder;
        }, 1000)
    }
};
LoPowerUp.prototype.allImageEnabled = function (enabled) {
    this.ballonImage.enabled = enabled;
    this.jetImage.enabled = enabled;
    this.ladderImage.enabled = enabled;
};