/*
 * SkateboardObby_Analytics
 * Poki Game Events (PokiSDK.measure) of the Skateboard Obby mode. Names follow POKI_EVENTS.md:
 * category "skateboard", fixed "what" values, Poki's special actions or fixed custom words, no raw numbers.
 * Sits on the "Analytics" entity at the end of the scene root (after NetworkManager, Player, Checkpoints).
 *
 * It only listens to what the other scripts already do, none of them call it:
 *   checkpointChanged (NetworkManager.setCheckpoint), PlayerDied / Respawned (PlayerController),
 *   player entity "jump" (ollie / trick), skate:boosted (boost), player:add (NetworkManager),
 *   the dead menu's RewardedAdButton click (skip checkpoint offer), skate:questsPanel / questDone / questClaimed /
 *   questChest (SkateboardObby_Quests), skate:shopOffer (SkateboardObby_ShopOffer), skate:boardEvent (BoardSkins, BoardPickups, Shop), skate:crossPromo / skate:crossPromoEnd
 *   (SkateboardObby_CrossPromo: promo-<game> visible, interact, start, then complete or fail).
 *
 * Section funnel: cp-01 = start -> Checkpoint_0, cp-02 = Checkpoint_0 -> Checkpoint_1, ... (50 checkpoints, one per
 * stage). map-1 complete is sent when the player lands on the finish island after the Stage 50 jump (app event
 * skate:finished, SkateboardObby_FinishJump). One attempt = start, then complete OR fail, never both:
 *   reaching the next checkpoint      : complete + start of the next section (last one: no new section, the jump is next)
 *   death (also R / Reset)            : fail
 *   respawn                           : start of the section the player respawns in
 *   skip checkpoint (ad, while dead)  : no complete, the respawn sends the new section's start
 *   tp(n) / other checkpoint changes  : no complete (player is not at the checkpoint), start of the new section
 *   save continued on entry           : only the start of the section the player is in
 *
 * Once per gameplay (= page load, Poki's unit; kept on SkateboardObbyAnalytics.page, survives scene changes):
 * platform, time thresholds, player-count buckets, first use of each mechanic.
 * Debug: ?measureLog in the URL or window.__measureLog = true logs every event when it is sent.
 */
var SkateboardObbyAnalytics = pc.createScript('skateboardObbyAnalytics');

SkateboardObbyAnalytics.attributes.add('touchRadius', { type: 'number', default: 10, title: 'Checkpoint Touch Radius (m)', description: 'A checkpoint change counts as reached (complete) only if the player is this close to that checkpoint. tp(n) and other jumps are farther away.' });

SkateboardObbyAnalytics.attributes.add('mapName', { type: 'string', default: 'map-1', title: 'Map Event', description: 'Event name of this world: map-1, map-2.' });
SkateboardObbyAnalytics.attributes.add('sectionPrefix', { type: 'string', default: '', title: 'Section Prefix', description: 'Added before cp-NN. World 1 empty, World 2 w2-.' });
SkateboardObbyAnalytics.attributes.add('completedKey', { type: 'string', default: 'SkateboardObby_Completed', title: 'Completed Save Key', description: 'Lifetime finished flag of this world. World 2: SkateboardObby_W2_Completed.' });

SkateboardObbyAnalytics.CATEGORY = "skateboard";
SkateboardObbyAnalytics.TIMES = [60, 180, 300, 600, 1200, 2400];
SkateboardObbyAnalytics.TIME_NAMES = ["1m", "3m", "5m", "10m", "20m", "40m"];
SkateboardObbyAnalytics.PLAYER_BUCKETS = ["1", "2-5", "6-10", "11+"];

// page lifetime state (one Poki gameplay)
SkateboardObbyAnalytics.page = { sent: {}, playTime: 0, timeIndex: 0, playerBucket: -1 };

SkateboardObbyAnalytics.prototype.initialize = function () {
    this.logEnabled = /[?&]measureLog(=|&|$)/.test(window.location.search);
    this.page = SkateboardObbyAnalytics.page;

    this.player = this.app.root.findByName("Player");
    this.checkpointRoot = this.app.root.findByName("Checkpoints");
    const nm = this.app.root.findByName("NetworkManager");
    this.networkManager = nm && nm.script ? nm.script.skateboardObbyNetworkManager : null;
    const skipButton = this.app.root.findByName("RewardedAdButton");
    this.skipButton = skipButton && skipButton.button ? skipButton : null;
    this.deadPanel = this.networkManager ? this.networkManager.deadPanel : null;

    this.ready = false;          // first frame the player can move: loading complete + entry events
    this.section = -1;           // target checkpoint index of the open attempt, -1 = no open attempt
    this.lastCheckpoint = this.getCheckpoint();
    this.mapDone = false;
    this.skipShown = false;      // skip-cp visible sent for this death
    this.skipUsed = false;       // skip-cp interact sent for this death
    this.lastRide = null;

    this.app.on("checkpointChanged", this.onCheckpointChanged, this);
    this.app.on("PlayerDied", this.onPlayerDied, this);
    this.app.on("Respawned", this.onRespawned, this);
    this.app.on("skate:boosted", this.onBoosted, this);
    this.app.on("player:add", this.onPlayerAdd, this);
    this.app.on("skate:finished", this.finishMap, this);
    this.app.on("skate:questsPanel", this.onQuestsPanel, this);
    this.app.on("skate:questDone", this.onQuestDone, this);
    this.app.on("skate:questClaimed", this.onQuestClaimed, this);
    this.app.on("skate:questChest", this.onQuestChest, this);
    this.app.on("skate:shopOffer", this.onShopOffer, this);
    this.app.on("skate:boardEvent", this.onBoardEvent, this);
    this.app.on("skate:crossPromo", this.onCrossPromo, this);
    if (this.player) this.player.on("jump", this.onJump, this);
    if (this.skipButton) this.skipButton.button.on("click", this.onSkipClick, this);

    this.on("destroy", function () {
        this.app.off("checkpointChanged", this.onCheckpointChanged, this);
        this.app.off("PlayerDied", this.onPlayerDied, this);
        this.app.off("Respawned", this.onRespawned, this);
        this.app.off("skate:boosted", this.onBoosted, this);
        this.app.off("player:add", this.onPlayerAdd, this);
        this.app.off("skate:finished", this.finishMap, this);
        this.app.off("skate:questsPanel", this.onQuestsPanel, this);
        this.app.off("skate:questDone", this.onQuestDone, this);
        this.app.off("skate:questClaimed", this.onQuestClaimed, this);
        this.app.off("skate:questChest", this.onQuestChest, this);
        this.app.off("skate:shopOffer", this.onShopOffer, this);
        this.app.off("skate:boardEvent", this.onBoardEvent, this);
        this.app.off("skate:crossPromo", this.onCrossPromo, this);
        if (this.player) this.player.off("jump", this.onJump, this);
        if (this.skipButton && this.skipButton.button) this.skipButton.button.off("click", this.onSkipClick, this);
    }, this);
};

// ---------------------------------------------------------------------------
// sending
// ---------------------------------------------------------------------------

SkateboardObbyAnalytics.prototype.send = function (what, action) {
    if (this.logEnabled || window.__measureLog === true) {
        console.log("[measure] " + SkateboardObbyAnalytics.CATEGORY + " / " + what + " / " + action);
    }
    SkateboardObby_Track.send(SkateboardObbyAnalytics.CATEGORY, what, action);
};

// once per gameplay (page load)
SkateboardObbyAnalytics.prototype.sendOnce = function (what, action) {
    const key = what + "^" + action;
    if (this.page.sent[key]) return;
    this.page.sent[key] = true;
    this.send(what, action);
};

// ---------------------------------------------------------------------------
// checkpoints
// ---------------------------------------------------------------------------

SkateboardObbyAnalytics.prototype.getCheckpoint = function () {
    const c = this.app.checkpoint;
    return (c == null || isNaN(c)) ? -1 : c;
};

SkateboardObbyAnalytics.prototype.getCheckpointCount = function () {
    return this.checkpointRoot ? this.checkpointRoot.children.length : 0;
};

// cp-01 = reaching Checkpoint_0
SkateboardObbyAnalytics.prototype.sectionName = function (target) {
    const n = target + 1;
    return (this.sectionPrefix || "") + "cp-" + (n < 10 ? "0" + n : n);
};

// the next checkpoint to reach is saved + 1; none left = map finished
SkateboardObbyAnalytics.prototype.startSection = function () {
    const target = this.getCheckpoint() + 1;
    if (target >= this.getCheckpointCount()) { this.section = -1; return; }
    this.section = target;
    this.send(this.sectionName(target), "start");
};

SkateboardObbyAnalytics.prototype.isPlayerAt = function (index) {
    const cp = this.checkpointRoot ? this.checkpointRoot.children[index] : null;
    if (!cp || !this.player) return false;
    const a = this.player.getPosition();
    const b = cp.getPosition();
    const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz <= this.touchRadius * this.touchRadius;
};

SkateboardObbyAnalytics.prototype.finishMap = function () {
    if (this.mapDone) return;
    this.mapDone = true;
    this.send(this.mapName, "complete");
    // lifetime "finished map 1" flag (nothing reads it yet; a map-2 unlock can use it)
    SkateboardObby_Utils.setItem(this.completedKey, "1");
};

SkateboardObbyAnalytics.prototype.onCheckpointChanged = function () {
    const before = this.lastCheckpoint;
    const now = this.getCheckpoint();
    this.lastCheckpoint = now;
    if (!this.ready || now === before) return;

    const last = this.getCheckpointCount() - 1;
    const dead = this.app.isDied === true;

    // reached by riding into it
    if (!dead && now > before && this.isPlayerAt(now)) {
        if (this.section >= 0) this.send(this.sectionName(this.section), "complete");
        this.section = -1;
        // the last checkpoint only completes its section; map-1 complete comes with the finish landing
        if (now < last) this.startSection();
        return;
    }

    // skip (dead, rewarded ad): the respawn right after this starts the new section
    if (dead) return;

    // tp(n), reset: the open attempt is neither completed nor failed
    this.startSection();
};

// ---------------------------------------------------------------------------
// death / respawn / skip offer
// ---------------------------------------------------------------------------

SkateboardObbyAnalytics.prototype.onPlayerDied = function () {
    if (!this.ready) return;
    if (this.section >= 0) this.send(this.sectionName(this.section), "fail");
    this.section = -1;

    // the dead menu always shows the button; only count it when there is a checkpoint left to skip
    this.skipShown = false;
    this.skipUsed = false;
    if (this.skipButton && this.skipButton.enabled && this.deadPanel && this.deadPanel.enabled &&
        this.getCheckpoint() + 1 < this.getCheckpointCount()) {
        this.skipShown = true;
        this.send("skip-cp", "visible");
    }
};

SkateboardObbyAnalytics.prototype.onRespawned = function () {
    if (!this.ready) return;  // PlayerController respawns once in its own initialize
    if (this.section < 0) this.startSection();
};

// NetworkManager only takes the click once canRespawn is true. Its handler may run before this one, and on
// launch.playcanvas.com watchRewarded calls back synchronously (player already respawned, dead menu closed),
// so skipShown is only reset by the next death.
SkateboardObbyAnalytics.prototype.onSkipClick = function () {
    if (!this.skipShown || this.skipUsed) return;
    const nm = this.networkManager;
    if (!nm || (nm.canRespawn !== true && this.app.deadMenuEnabled)) return;
    this.skipUsed = true;
    this.send("skip-cp", "interact");
};

// ---------------------------------------------------------------------------
// mechanics, players
// ---------------------------------------------------------------------------

// fired by PlayerController.onJump, after it picked the clip (fast ollie = trick)
SkateboardObbyAnalytics.prototype.onJump = function () {
    if (!this.ready) return;
    this.sendOnce("ollie", "first");
    const pc_ = this.app.skateboardObbyPlayerController;
    if (pc_ && pc_._oneShotState && pc_._oneShotState.indexOf("Trick") === 0) this.sendOnce("trick", "first");
};

SkateboardObbyAnalytics.prototype.onBoosted = function () {
    if (!this.ready) return;
    this.sendOnce("boost", "first");
};

SkateboardObbyAnalytics.prototype.onPlayerAdd = function () {
    const nm = this.networkManager;
    if (!nm || !(nm.onlineCount > 0)) return;
    const n = nm.onlineCount;
    const bucket = n <= 1 ? 0 : n <= 5 ? 1 : n <= 10 ? 2 : 3;
    while (this.page.playerBucket < bucket) {
        this.page.playerBucket++;
        this.send("players", SkateboardObbyAnalytics.PLAYER_BUCKETS[this.page.playerBucket]);
    }
};

// ---------------------------------------------------------------------------
// quests
// ---------------------------------------------------------------------------

// quests / visible: every panel opening; interact: the first claim of that opening
SkateboardObbyAnalytics.prototype.onQuestsPanel = function (open) {
    this.questClaimSent = false;
    if (open) this.send("quests", "visible");
};

SkateboardObbyAnalytics.prototype.onQuestDone = function (id) {
    this.send("quest-" + id, "done");
};

SkateboardObbyAnalytics.prototype.onQuestClaimed = function (id) {
    if (!this.questClaimSent) {
        this.questClaimSent = true;
        this.send("quests", "interact");
    }
    this.send("quest-" + id, "claimed");
};

// shop-ad-offer / visible: the panel opened; accepted: WATCH AD pressed; rewarded: the ad finished and the item was given
SkateboardObbyAnalytics.prototype.onShopOffer = function (action) {
    this.send("shop-ad-offer", action);
};

// board-pickup / ad-start, ad-complete: ground pickup. board-shop / coins, ad: bought in the Shop's SKATEBOARD tab. board / equip: another board worn.
SkateboardObbyAnalytics.prototype.onBoardEvent = function (what, action) {
    this.send(what, action);
};

// complete comes after the scene change, when this script is destroyed: a one-time listener that removes itself carries it
SkateboardObbyAnalytics.prototype.onCrossPromo = function (game, action) {
    this.send("promo-" + game, action);
    if (action === "start") this.app.once("skate:crossPromoEnd", (endGame, endAction) => this.send("promo-" + endGame, endAction));
};

SkateboardObbyAnalytics.prototype.onQuestChest = function (name) {
    this.send("quest-chest-" + name, "opened");
};

// ---------------------------------------------------------------------------
// entry
// ---------------------------------------------------------------------------

SkateboardObbyAnalytics.prototype.begin = function () {
    this.ready = true;
    this.lastCheckpoint = this.getCheckpoint();

    // the Menu sets this when the Skateboard card (or an invite link) starts loading the mode
    if (this.app.skateboardLoadingStarted === true) {
        this.app.skateboardLoadingStarted = false;
        this.send("loading", "complete");
    }
    this.sendOnce("platform", this.app.isMobile ? "mobile" : "desktop");

    const saved = this.lastCheckpoint;
    this.send("session", saved >= 0 ? "resume" : "new");

    // finished players (saved at the last checkpoint) start no map / section attempt
    if (saved + 1 < this.getCheckpointCount()) {
        this.send(this.mapName, "start");
        this.startSection();
    } else {
        this.mapDone = true;
    }
};

// cheap field reads only; events go out when something happens
SkateboardObbyAnalytics.prototype.update = function (dt) {
    const controller = this.app.skateboardObbyPlayerController;
    if (!controller) return;

    if (!this.ready) {
        if (!controller.canMove()) return;
        this.begin();
    }

    // grind / loop: PlayerController keeps the running ride in _ride
    const ride = controller._ride;
    if (ride !== this.lastRide) {
        this.lastRide = ride;
        if (ride && ride.type === "grind") this.sendOnce("grind", "first");
        else if (ride && ride.type === "loop") this.sendOnce("loop", "first");
    }

    // play time: not while the tab is hidden, an ad plays or the pause menu is open
    const page = this.page;
    if (page.timeIndex < SkateboardObbyAnalytics.TIMES.length && !document.hidden &&
        this.app.isWatchingAd !== true && this.app.menuPanelEnabled !== true) {
        page.playTime += Math.min(dt, 0.25);
        if (page.playTime >= SkateboardObbyAnalytics.TIMES[page.timeIndex]) {
            this.send("time", SkateboardObbyAnalytics.TIME_NAMES[page.timeIndex]);
            page.timeIndex++;
        }
    }
};
