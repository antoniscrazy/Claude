var KnockoutModeAdRewarder = pc.createScript('knockoutModeAdRewarder');

// initialize code called once per entity
KnockoutModeAdRewarder.prototype.initialize = function () {
    this.app.adRewarder = this;
    this.app.isAdBreak = false;
    this._adSeen = false;
    this._adDeadline = 0;
};

KnockoutModeAdRewarder.prototype.watchAd = function (eventSuccess, adCount = 1) {
    this.app.isAdBreak = true;
    this._adSeen = false;
    this._adDeadline = Date.now() + 10000;
    this.app.knockoutModeNetworkManager.send("Client:SetIsWatchingAd", {boolean : true});


/*     setTimeout(()=>{
        eventSuccess();
        this.app.isAdBreak = false;
        this.app.knockoutModeNetworkManager.send("Client:SetIsWatchingAd", {boolean : false});
    }, 3000); */

    watchRewarded(() => {
        eventSuccess();
        this.app.isAdBreak = false;
        this.app.knockoutModeNetworkManager.send("Client:SetIsWatchingAd", {boolean : false});
    }, adCount);

    //setTimeout(()=> eventSuccess(), 200);
}

// Reklam iptal edilir ya da hic baslamazsa watchRewarded onSuccess'i cagirmaz.
// Bayrak acik kalirsa oyuncu bir daha maca alinmaz (server: getPlayablePlayers, client: intro).
KnockoutModeAdRewarder.prototype.update = function(){
    if (!this.app.isAdBreak) return;
    if (this.app.isWatchingAd === true) { this._adSeen = true; return; }
    if (this._adSeen || Date.now() > this._adDeadline) {
        this.app.isAdBreak = false;
        this.app.knockoutModeNetworkManager.send("Client:SetIsWatchingAd", {boolean : false});
    }
}