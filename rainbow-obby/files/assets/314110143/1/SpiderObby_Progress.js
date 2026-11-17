// Level, XP and wins of the local player, their save, and the trip back to the lobby after a win pad.
// spider:step -> XP -> spider:xp (amount, point) for the +N texts; a level up raises the controller's maxGrip.
var SpiderObbyProgress = pc.createScript('spiderObbyProgress');

SpiderObbyProgress.attributes.add('xpBase', { type: 'number', default: 1.5, title: 'XP Base', description: 'XP of a step at level 0, before the speed bonus.' });
SpiderObbyProgress.attributes.add('xpPerLevel', { type: 'number', default: 0.1, title: 'XP Per Level', description: 'Added to XP Base per level.' });
SpiderObbyProgress.attributes.add('xpSpeedBonus', { type: 'number', default: 2, title: 'XP Speed Bonus', description: 'A step at XP Speed Ref is worth (1 + this) times the base.' });
SpiderObbyProgress.attributes.add('xpSpeedRef', { type: 'number', default: 20, title: 'XP Speed Ref', description: 'The bonus stops growing above this speed (m/s).' });
SpiderObbyProgress.attributes.add('xpMinSpeed', { type: 'number', default: 2, title: 'XP Min Speed', description: 'Steps slower than this give nothing: a player standing still does not earn XP (m/s).' });
SpiderObbyProgress.attributes.add('levelFirstXp', { type: 'number', default: 150, title: 'Level 0 XP', description: 'XP needed from level 0 to 1.' });
SpiderObbyProgress.attributes.add('levelGrowth', { type: 'number', default: 1.25, title: 'Level Growth', description: 'Each level needs this many times the previous one.' });
SpiderObbyProgress.attributes.add('gripPerLevel', { type: 'number', default: 10, title: 'Grip Per Level', description: 'The level 0 grip is Max Grip on the player controller.' });
SpiderObbyProgress.attributes.add('returnDelay', { type: 'number', default: 0.9, title: 'Return Delay', description: 'Seconds between a win pad and the lobby.' });
SpiderObbyProgress.attributes.add('saveInterval', { type: 'number', default: 5, title: 'Save Interval', description: 'Seconds between saves while XP changes. Level ups and wins save at once.' });
SpiderObbyProgress.attributes.add('stages', {
    type: 'json', array: true, title: 'Areas', description: 'In course order. An area starts at its Start Z (world).', schema: [
        { name: 'title', type: 'string', default: 'STAGE' },
        { name: 'line', type: 'string', default: '', description: 'Second line. Empty: RECOMMENDED LEVEL x, NEEDS y GRIP.' },
        { name: 'recommendedLevel', type: 'number', default: 0 },
        { name: 'needsGrip', type: 'number', default: 0 },
        { name: 'startZ', type: 'number', default: 0 },
        { name: 'worldLabel', type: 'entity', description: 'World text that shows the recommended level.' },
    ]
});

SpiderObbyProgress.KEY_LEVEL = 'SpiderObby_Level';
SpiderObbyProgress.KEY_XP = 'SpiderObby_XP';
SpiderObbyProgress.KEY_WINS = 'SpiderObby_Wins';

SpiderObbyProgress.formatNumber = function (n) {
    return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

SpiderObbyProgress.prototype.initialize = function () {
    this.app.spiderObbyProgress = this;
    this.app.inCutscene = false;
    this.level = this.readInt(SpiderObbyProgress.KEY_LEVEL);
    this.xp = this.readInt(SpiderObbyProgress.KEY_XP);
    this.wins = this.readInt(SpiderObbyProgress.KEY_WINS);
    while (this.xp >= this.xpToNext(this.level)) this.xp -= this.xpToNext(this.level++);
    this.finishing = false;
    this._returnLock = 0;
    this.stageIndex = -1;
    this._finishTimer = 0;
    this._stageTimer = 0;
    this._saveTimer = this.saveInterval;
    this._dirty = false;
    this._noSave = false;
    this.baseGrip = 0;

    for (let i = 0; i < this.stages.length; i++) {
        const s = this.stages[i];
        if (!s.line) s.line = 'RECOMMENDED LEVEL ' + s.recommendedLevel + ' · NEEDS ' + s.needsGrip + ' GRIP';
        if (s.worldLabel && s.worldLabel.element) s.worldLabel.element.text = 'Recommended Level ' + s.recommendedLevel;
    }

    this._onLeave = () => { this.save(); };
    this._onVisibility = () => { if (document.visibilityState === 'hidden') this.save(); };
    window.addEventListener('pagehide', this._onLeave);
    document.addEventListener('visibilitychange', this._onVisibility);

    this.app.on('spider:step', this.onStep, this);
    this.on('destroy', function () {
        this.save();
        this.app.off('spider:step', this.onStep, this);
        window.removeEventListener('pagehide', this._onLeave);
        document.removeEventListener('visibilitychange', this._onVisibility);
        this.app.inCutscene = false;
        if (this.app.spiderObbyProgress === this) this.app.spiderObbyProgress = null;
    }, this);
};

// the controller's Max Grip attribute is the level 0 value
SpiderObbyProgress.prototype.postInitialize = function () {
    const controller = this.app.spiderObbyPlayerController;
    this.baseGrip = controller.maxGrip;
    controller.maxGrip = this.gripAt(this.level);
    controller.grip = controller.maxGrip;
    this.checkStage();
};

SpiderObbyProgress.prototype.readInt = function (key) {
    const value = parseInt(SpiderObby_Utils.getItem(key), 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
};

SpiderObbyProgress.prototype.save = function () {
    if (this._noSave || !this._dirty) return;
    this._dirty = false;
    SpiderObby_Utils.setItem(SpiderObbyProgress.KEY_LEVEL, String(this.level));
    SpiderObby_Utils.setItem(SpiderObbyProgress.KEY_XP, String(this.xp));
    SpiderObby_Utils.setItem(SpiderObbyProgress.KEY_WINS, String(this.wins));
};

// the reset button clears the save and reloads the scene: destroy must not write it back
SpiderObbyProgress.prototype.forget = function () {
    this._noSave = true;
};

SpiderObbyProgress.prototype.xpToNext = function (level) {
    return Math.max(1, Math.round(this.levelFirstXp * Math.pow(this.levelGrowth, level) / 10) * 10);
};

SpiderObbyProgress.prototype.gripAt = function (level) {
    return this.baseGrip + level * this.gripPerLevel;
};

SpiderObbyProgress.prototype.xpForStep = function (speed) {
    const bonus = pc.math.clamp(speed / this.xpSpeedRef, 0, 1);
    return Math.max(1, Math.round((this.xpBase + this.level * this.xpPerLevel) * (1 + this.xpSpeedBonus * bonus)));
};

SpiderObbyProgress.prototype.onStep = function (point, normal, armIndex, speed) {
    const controller = this.app.spiderObbyPlayerController;
    if (speed < this.xpMinSpeed || this.finishing || this.app.inCutscene || !controller || controller.isDied) return;
    // no input, no XP: settling after a teleport or sinking off a wall lands hands too
    if (controller._inX === 0 && controller._inY === 0) return;
    const amount = this.xpForStep(speed);
    this.addXp(amount);
    this.app.fire('spider:xp', amount, point);
};

SpiderObbyProgress.prototype.addXp = function (amount) {
    const from = this.level;
    this.xp += amount;
    this._dirty = true;
    let need = this.xpToNext(this.level);
    while (this.xp >= need) {
        this.xp -= need;
        this.level++;
        need = this.xpToNext(this.level);
    }
    if (this.level !== from) this.onLevelChanged(from);
};

SpiderObbyProgress.prototype.onLevelChanged = function (from) {
    const controller = this.app.spiderObbyPlayerController;
    const gripFrom = controller.maxGrip, gripTo = this.gripAt(this.level);
    controller.maxGrip = gripTo;
    // the extra grip is usable at once, unless the arms already let go (solid ground fills it then)
    if (!controller._gripEmpty) controller.grip = Math.min(gripTo, controller.grip + Math.max(0, gripTo - gripFrom));
    this.save();
    this.app.fire('spider:levelUp', from, this.level, gripFrom, gripTo);
};

// A win pad. False if a run is already finishing (the same pad cannot pay twice).
SpiderObbyProgress.prototype.finishRun = function (wins) {
    const controller = this.app.spiderObbyPlayerController;
    if (this.finishing || this._returnLock > 0 || controller.isDied) return false;
    this.finishing = true;
    this._finishTimer = this.returnDelay;
    this.app.inCutscene = true;
    this.wins += wins;
    this._dirty = true;
    this.save();
    if (controller.confettiParticle) { controller.confettiParticle.reset(); controller.confettiParticle.play(); }
    const sound = controller.entity.sound;
    if (sound && sound.slot('prize')) sound.play('prize');
    this.app.fire('spider:win', wins, this.wins);
    return true;
};

SpiderObbyProgress.prototype.backToLobby = function () {
    const controller = this.app.spiderObbyPlayerController;
    this.finishing = false;
    this._returnLock = 0.5;
    this.app.inCutscene = false;
    if (controller.isDied) return;
    this.app.gameManager.teleportToLobby();
    controller.refillGrip();
    this.checkStage();
};

SpiderObbyProgress.prototype.checkStage = function () {
    const controller = this.app.spiderObbyPlayerController;
    if (!controller || this.stages.length === 0) return;
    const z = controller.entity.getPosition().z;
    let index = 0;
    for (let i = 1; i < this.stages.length; i++) if (z >= this.stages[i].startZ) index = i;
    if (index === this.stageIndex) return;
    this.stageIndex = index;
    this.app.fire('spider:stage', index, this.stages[index]);
};

SpiderObbyProgress.prototype.update = function (dt) {
    if (this._returnLock > 0) this._returnLock -= dt;
    if (this.finishing) {
        this._finishTimer -= dt;
        if (this._finishTimer <= 0) this.backToLobby();
    }
    this._stageTimer -= dt;
    if (this._stageTimer <= 0) {
        this._stageTimer = 0.25;
        this.checkStage();
    }
    if (this._dirty) {
        this._saveTimer -= dt;
        if (this._saveTimer <= 0) {
            this._saveTimer = this.saveInterval;
            this.save();
        }
    }
};

// console: level(n), wins(n) in SpiderObby_Debug
SpiderObbyProgress.prototype.setLevel = function (level) {
    const from = this.level;
    this.level = Math.max(0, Math.floor(level));
    this.xp = 0;
    this._dirty = true;
    if (this.level !== from) this.onLevelChanged(from);
    else this.save();
    this.app.spiderObbyPlayerController.grip = this.app.spiderObbyPlayerController.maxGrip;
    this.app.fire('spider:progressChanged');
};

SpiderObbyProgress.prototype.setWins = function (wins) {
    this.wins = Math.max(0, Math.floor(wins));
    this._dirty = true;
    this.save();
    this.app.fire('spider:progressChanged');
};
