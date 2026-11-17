/*
 * SkateboardObby_StageChunks
 * Sits on Map/StageLogic. Keeps only the stages around the player enabled (Monkey "checkpoint chunks" pattern)
 * and loads the stage model packs (FBX containers) shortly before the player needs them.
 *
 * Chunk n (1..stageCount) = the stage model nodes named "Stage_<n>_..." under the pack roots + StageLogic/Stage_<n>
 * (colliders, kill blocks, obstacles) + Checkpoints/Checkpoint_<n-1> (the checkpoint at the end of stage n).
 * Chunk 0 = the lobby island (Stage 0), chunk stageCount + 1 = the finish island (Stage_End model + StageLogic/Finish).
 *
 * Open chunks: [base - behind, base + ahead] where base = saved checkpoint index + 1 (lobby 0), widened by the
 * chunk of the checkpoint nearest to the player (so a teleport or riding past a checkpoint never leaves the
 * player on a closed stage). Chunks close closeDelay seconds after they are no longer needed.
 *
 * Chunk numbers: after checkpoint k the player rides chunk k + 2 (chunk k + 1 ends at that checkpoint), so "ahead 5" means
 * 4 more stages in front of the one being ridden, 5 from the middle of it on (the nearest checkpoint moves up). About 370-510 m,
 * right at the camera's far clip (500 m): a bigger value costs more without showing more.
 * Opening: chunks up to nearAhead open at once (the player can land on them). The rest of the window opens one chunk per
 * updateChunks, nearest first, so a respawn / restart / scene start does not open the whole window in one frame.
 *
 * Packs: each FBX container (Stage_1_10 ... Stage_End) is loaded prefetch stages before its first stage opens.
 * Pack roots are disabled in the scene (so their render assets do not load with the scene) and enabled here.
 * Colliders do not depend on the packs (primitive shapes + the small collider container tagged SkateboardObby),
 * so a stage is solid even while its model is still downloading.
 *
 * Death height: the player controller starts the fall at a fixed Y (deathHeight). The course climbs to y 80+, so
 * the value is moved to (lowest floor of the open chunks - deathMargin). The scene value comes back on destroy.
 */
var SkateboardObbyStageChunks = pc.createScript('skateboardObbyStageChunks');

SkateboardObbyStageChunks.attributes.add('packs', {
    type: 'json', array: true, title: 'Model Packs',
    schema: [
        { name: 'root', type: 'entity', title: 'Root', description: 'FBX template instance under Map' },
        { name: 'container', type: 'asset', assetType: 'container', title: 'Container' },
        { name: 'first', type: 'number', default: 1, title: 'First Chunk' },
        { name: 'last', type: 'number', default: 10, title: 'Last Chunk' }
    ]
});
SkateboardObbyStageChunks.attributes.add('lobby', { type: 'entity', array: true, title: 'Lobby Chunk (0)' });
SkateboardObbyStageChunks.attributes.add('finish', { type: 'entity', array: true, title: 'Finish Chunk (51)' });
SkateboardObbyStageChunks.attributes.add('stageCount', { type: 'number', default: 50, title: 'Stage Count' });
SkateboardObbyStageChunks.attributes.add('ahead', { type: 'number', default: 5, title: 'Chunks Ahead' });
SkateboardObbyStageChunks.attributes.add('nearAhead', { type: 'number', default: 2, min: 0, title: 'Near Chunks Ahead', description: 'These open at once and count for the death height. The rest of Chunks Ahead only has to be seen: it opens one chunk per update.' });
SkateboardObbyStageChunks.attributes.add('behind', { type: 'number', default: 0, title: 'Chunks Behind' });
SkateboardObbyStageChunks.attributes.add('closeDelay', { type: 'number', default: 0.6, min: 0, title: 'Close Delay (s)', description: 'Real seconds a chunk stays on after it is no longer needed (trigger leave events, teleports).' });
SkateboardObbyStageChunks.attributes.add('prefetch', { type: 'number', default: 3, title: 'Pack Prefetch (stages)', description: 'A pack starts loading when the open chunks get this close to its first stage.' });
SkateboardObbyStageChunks.attributes.add('floorY', { type: 'number', array: true, title: 'Floor Y per Chunk', description: 'Lowest floor (world y) of chunk 0..51. Written by the stage setup.' });
SkateboardObbyStageChunks.attributes.add('deathMargin', { type: 'number', default: 12, title: 'Death Margin (m)', description: 'deathHeight = lowest floor of the open chunks - this. 0 = leave deathHeight alone.' });

SkateboardObbyStageChunks.prototype.initialize = function () {
    this.app.skateStageChunks = this;
    this.player = this.app.root.findByName('Player');
    this.checkpointRoot = this.app.root.findByName('Checkpoints');
    this._last = this.stageCount + 1;
    this._chunks = [];
    for (let i = 0; i <= this._last; i++) this._chunks.push({ entities: [], on: null, offSince: -1 });

    // lobby / finish
    (this.lobby || []).forEach((e) => { if (e) this._chunks[0].entities.push(e); });
    (this.finish || []).forEach((e) => { if (e) this._chunks[this._last].entities.push(e); });

    // stage model nodes: direct children of the pack roots named Stage_<n>_... (World 2: W2_Stage_<n>_...)
    const re = /^(?:W\d+_)?Stage_(\d+)_/;
    (this.packs || []).forEach((p) => {
        if (!p || !p.root) return;
        p.root.children.forEach((c) => {
            const m = re.exec(c.name);
            if (!m) return;
            const n = parseInt(m[1], 10);
            // nodes hidden in the scene on purpose (checkpoint placeholders, lava models replaced by kill blocks) stay hidden
            if (n >= 1 && n <= this.stageCount && c._enabled) this._chunks[n].entities.push(c);
        });
    });

    // logic roots + checkpoints
    for (let n = 1; n <= this.stageCount; n++) {
        const logic = this.entity.findByName('Stage_' + n);
        if (logic && logic.parent === this.entity) this._chunks[n].entities.push(logic);
        const cp = this.checkpointRoot ? this.checkpointRoot.children[n - 1] : null;
        if (cp) this._chunks[n].entities.push(cp);
    }

    // checkpoint spawn points for the "nearest checkpoint" safety
    this._anchors = [];
    const lobbySpawn = this.app.root.findByName('LobbySpawnPoint');
    if (lobbySpawn) this._anchors.push({ pos: lobbySpawn.getPosition().clone(), chunk: 0 });
    if (this.checkpointRoot) {
        this.checkpointRoot.children.forEach((cp, i) => {
            const sp = cp.findByName('SpawnPoint') || cp;
            this._anchors.push({ pos: sp.getPosition().clone(), chunk: i + 1 });
        });
    }

    this._packLoaded = [];
    this._sceneDeathHeight = null;
    this._appliedDeath = null;
    this.chunkMin = -1;
    this.chunkMax = -1;
    this._tick = 0;

    // a new checkpoint / respawn / teleport opens the chunks at once (closing still waits closeDelay)
    this._onCheckpoint = () => this.updateChunks(false);
    this.app.on('checkpointChanged', this._onCheckpoint, this);
    this.app.on('Respawned', this._onCheckpoint, this);

    this.on('destroy', () => {
        this.app.off('checkpointChanged', this._onCheckpoint, this);
        this.app.off('Respawned', this._onCheckpoint, this);
        const pcs = this.app.skateboardObbyPlayerController;
        if (pcs && this._sceneDeathHeight !== null) pcs.deathHeight = this._sceneDeathHeight;
        if (this.app.skateStageChunks === this) this.app.skateStageChunks = null;
    });

    this.updateChunks(true);
};

// chunk of the checkpoint (or lobby) nearest to the player
SkateboardObbyStageChunks.prototype.chunkAtPlayer = function () {
    if (!this.player || !this._anchors.length) return null;
    const p = this.player.getPosition();
    let best = null, bestD = Infinity;
    for (let i = 0; i < this._anchors.length; i++) {
        const a = this._anchors[i].pos;
        const dx = a.x - p.x, dy = a.y - p.y, dz = a.z - p.z;
        const d = dx * dx + dy * dy * 4 + dz * dz;
        if (d < bestD) { bestD = d; best = this._anchors[i].chunk; }
    }
    return best;
};

SkateboardObbyStageChunks.prototype.update = function () {
    // a few times per second is enough (the open window is wide)
    if (++this._tick % 6 !== 0) return;
    this.updateChunks(false);
};

SkateboardObbyStageChunks.prototype.updateChunks = function (instant) {
    const last = this._last;
    const saved = (this.app.checkpoint == null || isNaN(this.app.checkpoint)) ? -1 : this.app.checkpoint;
    const base = Math.max(0, Math.min(last, saved + 1));
    let min = base - this.behind;
    let max = base + this.ahead;
    let reach = base;
    const here = this.chunkAtPlayer();
    if (here !== null) {
        if (here - this.behind < min) min = here - this.behind;
        if (here + this.ahead > max) max = here + this.ahead;
        if (here > reach) reach = here;
    }
    min = Math.max(0, min);
    max = Math.min(last, max);
    this.chunkMin = min;
    this.chunkMax = max;
    const nearMax = Math.min(max, reach + this.nearAhead);
    let farOpens = 1;

    const now = pc.now();
    const delay = Math.max(0, this.closeDelay || 0) * 1000;
    for (let i = 0; i <= last; i++) {
        const c = this._chunks[i];
        const want = i >= min && i <= max;
        if (want) c.offSince = -1;
        else if (!instant) {
            if (c.offSince < 0) c.offSince = now;
            if (now - c.offSince < delay) continue;
        }
        if (c.on === want) continue;
        // only seen from far away: one per update, nearest first (closing is not limited)
        if (want && i > nearMax) {
            if (farOpens <= 0) continue;
            farOpens--;
        }
        c.on = want;
        for (let k = 0; k < c.entities.length; k++) {
            const e = c.entities[k];
            if (e.enabled !== want) e.enabled = want;
        }
    }

    this.updatePackRoots(min, max);
    this.loadPacks(min - this.prefetch, max + this.prefetch);
    // the far part of the window does not move the death height: a lower stage 5 ahead must not lengthen today's falls
    this.applyDeathHeight(min, nearMax);
};

// A pack root (FBX instance) is disabled in the scene so its render assets do not start loading with the
// scene; it is enabled once one of its stages opens (the stage nodes inside are switched one by one above).
SkateboardObbyStageChunks.prototype.updatePackRoots = function (min, max) {
    const packs = this.packs || [];
    for (let i = 0; i < packs.length; i++) {
        const p = packs[i];
        if (!p || !p.root || p.root.enabled) continue;
        if (p.last >= min && p.first <= max) p.root.enabled = true;
    }
};

SkateboardObbyStageChunks.prototype.loadPacks = function (from, to) {
    const packs = this.packs || [];
    for (let i = 0; i < packs.length; i++) {
        const p = packs[i];
        if (!p || this._packLoaded[i]) continue;
        if (p.last < from || p.first > to) continue;
        this._packLoaded[i] = true;
        const asset = typeof p.container === 'number' ? this.app.assets.get(p.container) : p.container;
        if (asset && !asset.loaded) this.app.assets.load(asset);
    }
};

SkateboardObbyStageChunks.prototype.applyDeathHeight = function (min, max) {
    const pcs = this.app.skateboardObbyPlayerController;
    if (!pcs || !(this.deathMargin > 0) || !this.floorY || !this.floorY.length) return;
    if (this._sceneDeathHeight === null) this._sceneDeathHeight = pcs.deathHeight;
    let floor = Infinity;
    for (let i = min; i <= max; i++) {
        const y = this.floorY[i];
        if (typeof y === 'number' && y < floor) floor = y;
    }
    if (floor === Infinity) return;
    const h = floor - this.deathMargin;
    if (h !== this._appliedDeath) {
        this._appliedDeath = h;
        pcs.deathHeight = h;
    }
};

// debug / tests: open window, chunk at the player, applied death height
SkateboardObbyStageChunks.prototype.info = function () {
    return { min: this.chunkMin, max: this.chunkMax, here: this.chunkAtPlayer(), deathHeight: this._appliedDeath };
};
