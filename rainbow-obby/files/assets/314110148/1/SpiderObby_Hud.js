// Grip bar, level bar, wins, stage header, level up and win notices, OUT OF GRIP. Text is written only when its value changes.
var SpiderObbyHud = pc.createScript('spiderObbyHud');

SpiderObbyHud.attributes.add('levelBar', { type: 'entity', title: 'Level Bar' });
SpiderObbyHud.attributes.add('gripBar', { type: 'entity', title: 'Grip Bar' });
SpiderObbyHud.attributes.add('header', { type: 'entity', title: 'Stage Header' });
SpiderObbyHud.attributes.add('levelNotice', { type: 'entity', title: 'Level Up Notice' });
SpiderObbyHud.attributes.add('winNotice', { type: 'entity', title: 'Win Notice' });
SpiderObbyHud.attributes.add('emptyMessage', { type: 'entity', title: 'Out Of Grip Message' });
SpiderObbyHud.attributes.add('winCounter', { type: 'entity', title: 'Win Counter' });
SpiderObbyHud.attributes.add('winCounterText', { type: 'entity', title: 'Win Counter Text' });
SpiderObbyHud.attributes.add('screenEntity', { type: 'entity', title: 'Screen' });
SpiderObbyHud.attributes.add('gripHighRatio', { type: 'number', default: 0.6, title: 'Grip Green Above', description: 'The grip bar is green above this ratio.' });
SpiderObbyHud.attributes.add('gripLowRatio', { type: 'number', default: 0.3, title: 'Grip Yellow Below', description: 'The grip bar is yellow below this ratio.' });
SpiderObbyHud.attributes.add('labelInterval', { type: 'number', default: 0.1, title: 'Label Interval', description: 'Bar labels change at most this often (s). The bars themselves follow every frame.' });
SpiderObbyHud.attributes.add('mobileScale', { type: 'number', default: 1.25, title: 'Mobile Bar Scale' });
SpiderObbyHud.attributes.add('barBottom', { type: 'number', default: 16, title: 'Bar Bottom' });
SpiderObbyHud.attributes.add('barGap', { type: 'number', default: 6, title: 'Bar Gap' });
SpiderObbyHud.attributes.add('headerTop', { type: 'number', default: 10, title: 'Header Top' });
SpiderObbyHud.attributes.add('headerTopNarrow', { type: 'number', default: 96, title: 'Header Top (Portrait)', description: 'Under the corner buttons when the screen is narrow.' });
SpiderObbyHud.attributes.add('narrowWidth', { type: 'number', default: 1000, title: 'Narrow Below', description: 'Screen units.' });
SpiderObbyHud.attributes.add('levelNoticeTime', { type: 'number', default: 2.2, title: 'Level Notice Time' });
SpiderObbyHud.attributes.add('winNoticeTime', { type: 'number', default: 1.8, title: 'Win Notice Time' });
SpiderObbyHud.attributes.add('headerWarnColor', { type: 'rgb', default: [1, 0.7, 0.2], title: 'Under Recommended Color' });

SpiderObbyHud.prototype.initialize = function () {
    this.levelFill = this.levelBar.findByName('Fill');
    this.levelLabel = this.levelBar.findByName('Label');
    this.gripFill = this.gripBar.findByName('Fill');
    this.gripLabel = this.gripBar.findByName('Label');
    this.headerTitle = this.header.findByName('Title');
    this.headerLine = this.header.findByName('Line');
    this.levelNoticeLine1 = this.levelNotice.findByName('Line1');
    this.levelNoticeLine2 = this.levelNotice.findByName('Line2');
    this.levelNoticeBack = this.levelNotice.findByName('Back');
    this.winNoticeLine1 = this.winNotice.findByName('Line1');
    this.winNoticeLine2 = this.winNotice.findByName('Line2');
    this.winNoticeIcon = this.winNotice.findByName('Icon');
    this.levelBack = this.levelBar.findByName('Back');
    this.gripBack = this.gripBar.findByName('Back');

    this.fillScaleLevel = this.levelFill.getLocalScale().x;
    this.fillScaleGrip = this.gripFill.getLocalScale().x;
    this.headerLineColor = this.headerLine.element.color.clone();
    this.gripGreen = new pc.Color(0.25, 0.85, 0.32);
    this.gripYellow = new pc.Color(1, 0.82, 0.12);
    this.gripColor = new pc.Color(0.25, 0.85, 0.32);

    this.shownGrip = -1;
    this.shownMax = -1;
    this.shownRatio = -1;
    this.shownLevel = -1;
    this.shownXp = -1;
    this.shownNeed = -1;
    this.shownWins = -1;
    this.shownBar = -1;
    this.labelTimer = 0;
    this.levelNoticeLeft = 0;
    this.winNoticeLeft = 0;
    this.headerPop = 0;
    this.layoutDirty = true;

    this.levelNotice.enabled = false;
    this.winNotice.enabled = false;
    if (this.emptyMessage) this.emptyMessage.enabled = false;

    this.app.on('spider:gripEmpty', this.onGripEmpty, this);
    this.app.on('spider:gripRecovered', this.onGripRecovered, this);
    this.app.on('PlayerDied', this.onGripRecovered, this);
    this.app.on('spider:levelUp', this.onLevelUp, this);
    this.app.on('spider:win', this.onWin, this);
    this.app.on('spider:stage', this.onStage, this);
    this.app.on('spider:progressChanged', this.forceRefresh, this);
    this.app.graphicsDevice.on('resizecanvas', this.onResize, this);
    this.on('destroy', function () {
        this.app.off('spider:gripEmpty', this.onGripEmpty, this);
        this.app.off('spider:gripRecovered', this.onGripRecovered, this);
        this.app.off('PlayerDied', this.onGripRecovered, this);
        this.app.off('spider:levelUp', this.onLevelUp, this);
        this.app.off('spider:win', this.onWin, this);
        this.app.off('spider:stage', this.onStage, this);
        this.app.off('spider:progressChanged', this.forceRefresh, this);
        this.app.graphicsDevice.off('resizecanvas', this.onResize, this);
    }, this);
};

// NetworkManager hides the counter in its initialize
SpiderObbyHud.prototype.postInitialize = function () {
    if (this.winCounter) this.winCounter.enabled = true;
    const progress = this.app.spiderObbyProgress;
    if (progress && progress.stageIndex >= 0) this.onStage(progress.stageIndex, progress.stages[progress.stageIndex]);
    this.forceRefresh();
};

SpiderObbyHud.prototype.onResize = function () {
    this.layoutDirty = true;
};

SpiderObbyHud.prototype.layout = function () {
    this.layoutDirty = false;
    const device = this.app.graphicsDevice, screen = this.screenEntity.screen;
    const width = device.width / screen.scale;
    const s = this.app.isMobile ? this.mobileScale : 1;
    const levelH = this.levelBack.element.height * s, gripH = this.gripBack.element.height * s;
    this.levelBar.setLocalScale(s, s, s);
    this.gripBar.setLocalScale(s, s, s);
    this.levelBar.setLocalPosition(0, this.barBottom + levelH / 2, 0);
    this.gripBar.setLocalPosition(0, this.barBottom + levelH + this.barGap * s + gripH / 2, 0);
    const top = width < this.narrowWidth ? this.headerTopNarrow : this.headerTop;
    this.header.setLocalPosition(0, -top - this.header.element.height / 2, 0);
    this.levelNotice.setLocalPosition(0, -top - this.header.element.height - 8 - this.levelNotice.element.height / 2, 0);
};

SpiderObbyHud.prototype.onGripEmpty = function () {
    if (this.emptyMessage) this.emptyMessage.enabled = true;
};

SpiderObbyHud.prototype.onGripRecovered = function () {
    if (this.emptyMessage) this.emptyMessage.enabled = false;
};

SpiderObbyHud.prototype.onLevelUp = function (from, to, gripFrom, gripTo) {
    this.levelNoticeLine1.element.text = 'Level ' + from + ' > Level ' + to;
    this.levelNoticeLine2.element.text = 'Grip ' + gripFrom + ' > ' + gripTo;
    this.levelNotice.enabled = true;
    this.levelNoticeLeft = this.levelNoticeTime;
    this.forceRefresh();
    const gameManager = this.app.gameManager;
    if (gameManager && gameManager.sfx_purchase) gameManager.sfx_purchase();
};

SpiderObbyHud.prototype.onWin = function (wins, total) {
    this.winNoticeLine1.element.text = '+' + wins + (wins === 1 ? ' WIN!' : ' WINS!');
    this.winNoticeLine2.element.text = 'TOTAL: ' + SpiderObbyProgress.formatNumber(total);
    this.winNotice.enabled = true;
    this.winNoticeLeft = this.winNoticeTime;
    this.refreshWins();
};

SpiderObbyHud.prototype.onStage = function (index, stage) {
    this.headerTitle.element.text = stage.title;
    this.headerLine.element.text = stage.line;
    this.headerLine.element.color = this.isUnderRecommended(stage) ? this.headerWarnColor : this.headerLineColor;
    this.currentStage = stage;
    this.headerPop = index > 0 ? 0.35 : 0;
    this.header.setLocalScale(1, 1, 1);
};

SpiderObbyHud.prototype.isUnderRecommended = function (stage) {
    const progress = this.app.spiderObbyProgress;
    return !!progress && progress.level < stage.recommendedLevel;
};

SpiderObbyHud.prototype.forceRefresh = function () {
    this.labelTimer = 0;
    this.shownLevel = -1;
    this.shownWins = -1;
    if (this.currentStage) this.headerLine.element.color = this.isUnderRecommended(this.currentStage) ? this.headerWarnColor : this.headerLineColor;
    this.refreshWins();
    this.refreshLevel();
};

SpiderObbyHud.prototype.refreshWins = function () {
    const progress = this.app.spiderObbyProgress;
    if (!progress || progress.wins === this.shownWins || !this.winCounterText) return;
    this.shownWins = progress.wins;
    this.winCounterText.element.text = SpiderObbyProgress.formatNumber(progress.wins);
};

SpiderObbyHud.prototype.refreshLevel = function () {
    const progress = this.app.spiderObbyProgress;
    if (!progress) return;
    const need = progress.xpToNext(progress.level);
    if (progress.level === this.shownLevel && progress.xp === this.shownXp && need === this.shownNeed) return;
    this.shownLevel = progress.level;
    this.shownXp = progress.xp;
    this.shownNeed = need;
    this.levelLabel.element.text = 'Level ' + progress.level + '   ' + SpiderObbyProgress.formatNumber(progress.xp) + '/' + SpiderObbyProgress.formatNumber(need);
    const ratio = pc.math.clamp(progress.xp / need, 0, 1);
    this.levelFill.setLocalScale(this.fillScaleLevel * ratio, 1, 1);
};

SpiderObbyHud.prototype.updateGrip = function (labelDue) {
    const controller = this.app.spiderObbyPlayerController;
    if (!controller) return;
    const max = Math.round(controller.maxGrip);
    const ratio = max > 0 ? pc.math.clamp(controller.grip / max, 0, 1) : 0;
    if (Math.abs(ratio - this.shownRatio) > 0.001) {
        this.shownRatio = ratio;
        this.gripFill.setLocalScale(this.fillScaleGrip * ratio, 1, 1);
        const t = pc.math.clamp((ratio - this.gripLowRatio) / Math.max(0.001, this.gripHighRatio - this.gripLowRatio), 0, 1);
        this.gripColor.lerp(this.gripYellow, this.gripGreen, t);
        this.gripFill.element.color = this.gripColor;
    }
    const grip = Math.ceil(controller.grip);
    // the bar's ends always show at once
    if ((grip !== this.shownGrip || max !== this.shownMax) && (labelDue || grip === 0 || grip === max)) {
        this.shownGrip = grip;
        this.shownMax = max;
        this.gripLabel.element.text = 'GRIP ' + grip + '/' + max;
    }
};

SpiderObbyHud.prototype.updateNotices = function (dt) {
    if (this.levelNoticeLeft > 0) {
        this.levelNoticeLeft -= dt;
        const left = this.levelNoticeLeft, used = this.levelNoticeTime - left;
        const pop = used < 0.15 ? 0.8 + used / 0.15 * 0.2 : 1;
        this.levelNotice.setLocalScale(pop, pop, pop);
        const fade = pc.math.clamp(left / 0.3, 0, 1);
        this.levelNoticeLine1.element.opacity = fade;
        this.levelNoticeLine2.element.opacity = fade;
        this.levelNoticeBack.element.opacity = fade * 0.6;
        if (left <= 0) this.levelNotice.enabled = false;
    }
    if (this.winNoticeLeft > 0) {
        this.winNoticeLeft -= dt;
        const left = this.winNoticeLeft, used = this.winNoticeTime - left;
        const pop = used < 0.2 ? 0.5 + used / 0.2 * 0.7 : (used < 0.3 ? 1.2 - (used - 0.2) / 0.1 * 0.2 : 1);
        this.winNotice.setLocalScale(pop, pop, pop);
        const fade = pc.math.clamp(left / 0.3, 0, 1);
        this.winNoticeLine1.element.opacity = fade;
        this.winNoticeLine2.element.opacity = fade;
        this.winNoticeIcon.element.opacity = fade;
        if (left <= 0) this.winNotice.enabled = false;
    }
    if (this.headerPop > 0) {
        this.headerPop = Math.max(0, this.headerPop - dt);
        const s = 1 + Math.sin(this.headerPop / 0.35 * Math.PI) * 0.12;
        this.header.setLocalScale(s, s, s);
    }
};

SpiderObbyHud.prototype.update = function (dt) {
    if (this.layoutDirty) this.layout();
    this.labelTimer -= dt;
    const labelDue = this.labelTimer <= 0;
    if (labelDue) this.labelTimer = this.labelInterval;
    this.updateGrip(labelDue);
    if (labelDue) this.refreshLevel();
    this.updateNotices(dt);
};
