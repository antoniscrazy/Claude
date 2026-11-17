// A win pad at the end of a stage. The body hovers over the ground, so the test is a box above the pad, not a trigger.
// A pad pays once per visit: the player has to stay out of its box for a moment before it can ask or pay again.
// (A moment, not one frame: right after a teleport a high refresh rate can still draw the body back at the old place for a frame.)
var SpiderObbyWinPad = pc.createScript('spiderObbyWinPad');

SpiderObbyWinPad.attributes.add('wins', { type: 'number', default: 1, title: 'Wins' });
SpiderObbyWinPad.attributes.add('rewarded', { type: 'boolean', default: false, title: 'Rewarded', description: 'Asks first, then one rewarded ad. Cancel or error pays nothing.' });
SpiderObbyWinPad.attributes.add('height', { type: 'number', default: 6, title: 'Height', description: 'The box reaches this far above the pad (m). The body hovers 3 m up.' });

SpiderObbyWinPad.attributes.add('leaveTime', { type: 'number', default: 0.3, title: 'Leave Time', description: 'Seconds outside the box before the pad works again.' });

SpiderObbyWinPad.prototype.initialize = function () {
    const position = this.entity.getPosition(), scale = this.entity.getScale();
    this.x = position.x;
    this.y = position.y;
    this.z = position.z;
    this.halfX = scale.x / 2;
    this.halfZ = scale.z / 2;
    this.armed = false;
    this.outside = 0;
    this.adToken = 0;
    this.alive = true;
    this.entity.on('winPad:yes', this.onAdAccepted, this);
    this.on('destroy', function () {
        this.alive = false;
        this.entity.off('winPad:yes', this.onAdAccepted, this);
    }, this);
};

SpiderObbyWinPad.prototype.isBusy = function () {
    const app = this.app;
    return app.isWatchingAd !== false || app.isPopupEnabled || app.menuPanelEnabled || app.deadMenuEnabled || app.isMarketEnabled || app.inCutscene;
};

SpiderObbyWinPad.prototype.update = function (dt) {
    const controller = this.app.spiderObbyPlayerController;
    if (!controller || controller.isDied) return;
    const p = controller.entity.getPosition();
    const dy = p.y - this.y;
    if (Math.abs(p.x - this.x) > this.halfX || Math.abs(p.z - this.z) > this.halfZ || dy < -1 || dy > this.height) {
        this.outside += dt;
        if (this.outside >= this.leaveTime) this.armed = true;
        return;
    }
    this.outside = 0;
    if (!this.armed || this.isBusy()) return;
    this.armed = false;
    if (this.rewarded) this.askForAd();
    else this.app.spiderObbyProgress.finishRun(this.wins);
};

SpiderObbyWinPad.prototype.askForAd = function () {
    const label = '+' + this.wins + (this.wins === 1 ? ' WIN' : ' WINS');
    this.app.spiderObbyPopupController.showPopup(label, 'Watch an ad to collect ' + label + '?', true, this.entity, 'winPad:yes', 'closePopup', { yesButtonText: 'WATCH' }, true, true);
};

SpiderObbyWinPad.prototype.onAdAccepted = function () {
    const token = ++this.adToken;
    this.app.adRewarder.watchAd(() => {
        if (!this.alive || token !== this.adToken) return;
        // this ad cannot pay a second time
        this.adToken++;
        this.app.spiderObbyProgress.finishRun(this.wins);
    }, 1);
};
