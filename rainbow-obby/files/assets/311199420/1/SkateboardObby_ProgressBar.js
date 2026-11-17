/*
 * SkateboardObby_ProgressBar
 * Progress bar at the top of the screen (2D Screen/ProgressBar). Adapted from the ProgressBar of
 * TrollObby (same in SlimeTower / PlaneObby / CartObby / RiverObby ...): progressBar.png track, home icon
 * at the start, checkered flag at the end. Those modes only move one arrow pin for the local player; here
 * every player gets a head on the bar, plus a tick per checkpoint and a "taken / total" counter.
 *
 * Progress = checkpoints taken / checkpoint count, plus (useDistance) how far the player is along the
 * straight line from the last taken checkpoint (or the lobby spawn) to the next one, capped at maxBetween
 * of that step, so the head never reaches a checkpoint before it is really taken.
 *   local player : app.checkpoint + own position
 *   other players: entity.networkCheckpoint (set by the NetworkManager when the server sends a
 *                  "checkpoint" field) + position; without that field the checkpoint is estimated from
 *                  the synced position (nearest step of the checkpoint path).
 * Path: LobbySpawnPoint -> Checkpoints/Checkpoint_0 -> ... -> last checkpoint (= end flag).
 *
 * Layout: the bar is centred at the top, below the timer slot (timerSlot entity, kept free for the
 * speedrun timer). Its width shrinks so it does not overlap the elements of the avoid entities
 * (LeftCorner / RightCorner buttons) or, on touch devices, the Poki pill in the top-left corner.
 * Element rects are set through element.margin (setting only the position is not enough at runtime).
 * Keep ProgressBar before BlackBG / Menu / DeadMenu / PopUp in the 2D Screen so menus draw over it.
 */
var SkateboardObbyProgressBar = pc.createScript('skateboardObbyProgressBar');

SkateboardObbyProgressBar.attributes.add('track', { type: 'entity', title: 'Track', description: 'Bar image; Ticks and Heads use the same horizontal span' });
SkateboardObbyProgressBar.attributes.add('ticksParent', { type: 'entity', title: 'Ticks' });
SkateboardObbyProgressBar.attributes.add('tickTemplate', { type: 'entity', title: 'Tick Template (disabled)' });
SkateboardObbyProgressBar.attributes.add('headsParent', { type: 'entity', title: 'Heads' });
SkateboardObbyProgressBar.attributes.add('remoteHeadTemplate', { type: 'entity', title: 'Remote Head Template (disabled)' });
SkateboardObbyProgressBar.attributes.add('localHead', { type: 'entity', title: 'Local Head' });
SkateboardObbyProgressBar.attributes.add('countText', { type: 'entity', title: 'Percent Text', description: 'Text inside the bar, shows the local progress in %' });
SkateboardObbyProgressBar.attributes.add('timerSlot', { type: 'entity', title: 'Timer Slot', description: 'Space reserved for the speedrun timer; the bar is placed below it' });
SkateboardObbyProgressBar.attributes.add('avoid', { type: 'entity', array: true, title: 'Avoid', description: 'UI groups the bar must not overlap (LeftCorner, RightCorner)' });
SkateboardObbyProgressBar.attributes.add('maxWidth', { type: 'number', default: 520, title: 'Max Width' });
SkateboardObbyProgressBar.attributes.add('minWidth', { type: 'number', default: 260, title: 'Min Width' });
SkateboardObbyProgressBar.attributes.add('gap', { type: 'number', default: 8, title: 'Gap', description: 'Space below the timer slot and next to avoided elements (screen units)' });
// Poki pill (mobile, top-left, default PokiSDK.movePill(0, 24)): measured in the Poki debug pill on a
// 375 px wide screen: left 0, top 24, 62 x 46 CSS px
SkateboardObbyProgressBar.attributes.add('pillWidth', { type: 'number', default: 72, title: 'Poki Pill Area Width (CSS px)', description: 'Touch devices only: top-left area kept free for the Poki pill (62 px wide + margin)' });
SkateboardObbyProgressBar.attributes.add('pillHeight', { type: 'number', default: 80, title: 'Poki Pill Area Height (CSS px)', description: 'From the top of the screen: 24 px offset + 46 px pill + margin' });
SkateboardObbyProgressBar.attributes.add('useDistance', { type: 'boolean', default: true, title: 'In-between Progress', description: 'Move between checkpoints by distance (off = only jumps when a checkpoint is taken)' });
SkateboardObbyProgressBar.attributes.add('maxBetween', { type: 'number', default: 0.9, min: 0, max: 1, title: 'Max In-between', description: 'Fraction of a step the head can move before the next checkpoint is taken' });
SkateboardObbyProgressBar.attributes.add('smoothing', { type: 'number', default: 8, title: 'Smoothing' });
// progressBar.png has transparent edges: 0% and 100% of the markers are the visible ends of the bar, not the ends of the track rect
SkateboardObbyProgressBar.attributes.add('barInsetLeft', { type: 'number', default: 0.0176, min: 0, max: 0.5, title: 'Bar Inset Left', description: 'Transparent left edge of the bar texture, as a fraction of its width (9 / 512)' });
SkateboardObbyProgressBar.attributes.add('barInsetRight', { type: 'number', default: 0.0195, min: 0, max: 0.5, title: 'Bar Inset Right', description: 'Transparent right edge of the bar texture, as a fraction of its width (10 / 512)' });

SkateboardObbyProgressBar.REMOTE_COLORS = [
    [0.30, 0.62, 1.00], [1.00, 0.42, 0.42], [0.55, 0.90, 0.35], [1.00, 0.62, 0.20],
    [0.76, 0.46, 1.00], [0.20, 0.86, 0.86], [1.00, 0.46, 0.76], [0.96, 0.86, 0.30]
];
SkateboardObbyProgressBar.TICK_OPEN = new pc.Color(0.12, 0.12, 0.2, 0.9);
SkateboardObbyProgressBar.TICK_TAKEN = new pc.Color(1, 1, 1, 1);

SkateboardObbyProgressBar.prototype.initialize = function () {
    this.networkManager = this.app.skateboardObbyNetworkManager;
    this._points = [];        // lobby spawn + checkpoint positions
    this._ticks = [];
    this._remote = {};        // sessionId -> { entity, head, shown }
    this._colorIndex = 0;
    this._localShown = -1;
    this._localBest = -1;     // best progress since the last respawn / checkpoint change
    this._trackWidth = 0;
    this._shownCount = null;
    this._layoutDirty = true;
    this._tmpA = new pc.Vec3();
    this._tmpB = new pc.Vec3();
    this._margin = new pc.Vec4();

    if (this.tickTemplate) this.tickTemplate.enabled = false;
    if (this.remoteHeadTemplate) this.remoteHeadTemplate.enabled = false;

    this._onResize = () => { this._layoutDirty = true; };
    this.app.graphicsDevice.on('resizecanvas', this._onResize);
    window.addEventListener('orientationchange', this._onResize);
    this.app.on('checkpointChanged', this.onCheckpointChanged, this);
    this.app.on('Respawned', this.onRespawned, this);
    this.app.on('skate:finished', this.onFinished, this);

    this.on('destroy', () => {
        this.app.graphicsDevice.off('resizecanvas', this._onResize);
        window.removeEventListener('orientationchange', this._onResize);
        this.app.off('checkpointChanged', this.onCheckpointChanged, this);
        this.app.off('Respawned', this.onRespawned, this);
        this.app.off('skate:finished', this.onFinished, this);
        for (const id in this._remote) this._remote[id].head.destroy();
        this._remote = {};
    });
};

SkateboardObbyProgressBar.prototype.postInitialize = function () {
    this.buildPath();
};

// ---------------------------------------------------------------------------
// path + ticks
// ---------------------------------------------------------------------------

SkateboardObbyProgressBar.prototype.buildPath = function () {
    const root = this.app.root.findByName('Checkpoints');
    // all checkpoints count: the stage chunks keep most of them disabled until the player gets close
    this._checkpoints = root ? root.children.slice() : [];
    const start = this.app.root.findByName('LobbySpawnPoint');

    this._points.length = 0;
    this._points.push(start ? start.getPosition().clone() : (this._checkpoints[0] ? this._checkpoints[0].getPosition().clone() : new pc.Vec3()));
    this._checkpoints.forEach(c => this._points.push(c.getPosition().clone()));
    this._count = this._checkpoints.length;
    // the finish island (landing target of the Stage 50 jump) is the end of the bar when it exists
    const logic = this.app.root.findByName('StageLogic');
    const finish = logic ? logic.findByName('LandingTarget') : null;
    if (finish) { this._points.push(finish.getPosition().clone()); this._count++; }

    // one tick per checkpoint except the last one (that one is the end flag)
    this._ticks.forEach(t => t.destroy());
    this._ticks.length = 0;
    if (this.tickTemplate && this.ticksParent) {
        // long courses: a tick every 10 checkpoints only
        const every = this._count > 12 ? 10 : 1;
        this._tickCp = [];
        for (let i = 0; i < this._count - 1; i++) {
            if ((i + 1) % every !== 0) continue;
            const t = this.tickTemplate.clone();
            t.name = 'Tick_' + i;
            this.ticksParent.addChild(t);
            t.enabled = true;
            this._ticks.push(t);
            this._tickCp.push(i);
        }
    }
    this._layoutDirty = true;
    this.onCheckpointChanged();
};

SkateboardObbyProgressBar.prototype.takenCount = function (checkpoint) {
    const c = checkpoint == null || isNaN(checkpoint) ? -1 : checkpoint;
    if (this._finished) return this._count;
    return pc.math.clamp(c + 1, 0, this._count);
};

// landed on the finish island: 100% until the next checkpoint change (Restart portal)
SkateboardObbyProgressBar.prototype.onFinished = function () {
    this._finished = true;
    this._localBest = -1;
};

SkateboardObbyProgressBar.prototype.onRespawned = function () {
    this._localBest = -1;
};

SkateboardObbyProgressBar.prototype.onCheckpointChanged = function () {
    this._localBest = -1;
    this._finished = false;
    if (this._count == null) return;
    const taken = this.takenCount(this.app.checkpoint);
    for (let i = 0; i < this._ticks.length; i++) {
        const el = this._ticks[i].element;
        if (el) el.color = this._tickCp[i] < taken ? SkateboardObbyProgressBar.TICK_TAKEN : SkateboardObbyProgressBar.TICK_OPEN;
    }
};

// fraction (0..1) of the step from point s to point s+1 covered by pos
SkateboardObbyProgressBar.prototype.stepFraction = function (pos, s) {
    const a = this._points[s], b = this._points[s + 1];
    if (!a || !b) return 0;
    const d = this._tmpA.sub2(b, a);
    const len2 = d.lengthSq();
    if (len2 < 1e-6) return 0;
    const t = this._tmpB.sub2(pos, a).dot(d) / len2;
    return pc.math.clamp(t, 0, 1);
};

// squared distance from pos to the segment s
SkateboardObbyProgressBar.prototype.stepDistanceSq = function (pos, s, t) {
    const a = this._points[s], b = this._points[s + 1];
    this._tmpA.lerp(a, b, t);
    return this._tmpA.distance(pos) ** 2;
};

// progress 0..1 from a known checkpoint
SkateboardObbyProgressBar.prototype.progressFromCheckpoint = function (checkpoint, pos) {
    if (!this._count) return 0;
    const taken = this.takenCount(checkpoint);
    if (taken >= this._count) return 1;
    let t = 0;
    if (this.useDistance && pos) t = Math.min(this.stepFraction(pos, taken), this.maxBetween);
    return (taken + t) / this._count;
};

// progress 0..1 estimated from the position only (other players without a checkpoint from the server)
SkateboardObbyProgressBar.prototype.progressFromPosition = function (pos) {
    if (!this._count) return 0;
    let best = 0, bestD = Infinity;
    for (let s = 0; s < this._count; s++) {
        const t = this.stepFraction(pos, s);
        const d = this.stepDistanceSq(pos, s, t);
        if (d <= bestD) { bestD = d; best = s + (this.useDistance ? t : (t >= 1 ? 1 : 0)); }
    }
    return pc.math.clamp(best / this._count, 0, 1);
};

// ---------------------------------------------------------------------------
// layout
// ---------------------------------------------------------------------------

// element rect for a point anchor: x/y = pivot position relative to the anchor
SkateboardObbyProgressBar.prototype.setRect = function (element, x, y, w, h) {
    const px = element.pivot.x, py = element.pivot.y;
    this._margin.set(x - w * px, y - h * py, -(x + w * (1 - px)), -(y + h * (1 - py)));
    element.margin = this._margin;
};

SkateboardObbyProgressBar.prototype.layout = function () {
    const el = this.entity.element;
    const screen = el && el.screen ? el.screen.screen : null;
    if (!screen) return;
    this._layoutDirty = false;

    const device = this.app.graphicsDevice;
    const scale = screen.scale || 1;
    const screenW = device.width / scale;
    const screenH = device.height / scale;
    const canvas = device.canvas;
    const cssToUnits = canvas && canvas.clientWidth ? (device.width / canvas.clientWidth) / scale : 1 / scale;

    // top edge: below the timer slot
    let top = 10;
    if (this.timerSlot && this.timerSlot.element) {
        const ts = this.timerSlot.element;
        top = Math.max(0, ts.margin.w) + ts.height + this.gap;
    }
    const height = el.height;

    // obstacles (in screen units, from the top-left corner)
    const obstacles = [];
    const addRect = (x0, y0, x1, y1) => obstacles.push({ x0, y0, x1, y1 });
    (this.avoid || []).forEach(group => {
        if (!group || !group.enabled) return;
        group.forEach(node => {
            if (node === group || !node.element || !node.enabled || node.element.type === 'group') return;
            if (!this.isVisible(node, group)) return;
            const c = node.element.screenCorners;   // canvas pixels, origin bottom-left
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (let i = 0; i < 4; i++) {
                minX = Math.min(minX, c[i].x); maxX = Math.max(maxX, c[i].x);
                minY = Math.min(minY, c[i].y); maxY = Math.max(maxY, c[i].y);
            }
            addRect(minX / scale, (device.height - maxY) / scale, maxX / scale, (device.height - minY) / scale);
        });
    });
    if (this.app.isMobile || pc.platform.touch) {
        addRect(0, 0, this.pillWidth * cssToUnits, this.pillHeight * cssToUnits);
    }

    // the percent text sits inside the bar (nothing sticks out on the right)
    const textW = 0;
    const centre = screenW / 2;

    const fit = (barTop) => {
        let half = this.maxWidth / 2;
        let lowest = barTop;
        obstacles.forEach(o => {
            if (o.y1 < barTop - 2 || o.y0 > barTop + height + 2) return;   // not in this band
            lowest = Math.max(lowest, o.y1);
            if (o.x1 <= centre) half = Math.min(half, centre - o.x1 - this.gap);                   // left side
            else if (o.x0 >= centre) half = Math.min(half, o.x0 - centre - this.gap - textW);      // right side
            else half = 0;                                                                        // across the centre
        });
        return { half, lowest };
    };

    let r = fit(top);
    if (r.half * 2 < this.minWidth) {
        // not enough room next to the corner buttons: move the bar below them
        top = r.lowest + this.gap;
        r = fit(top);
    }
    const width = pc.math.clamp(Math.floor(r.half * 2), Math.min(this.minWidth, screenW - 20), this.maxWidth);

    // anchor top-centre, pivot (0.5, 1)
    this.setRect(el, 0, -top, width, height);

    // track uses a stretched anchor: its width = bar width - left margin - right margin
    this._trackWidth = this.track && this.track.element
        ? Math.max(1, width - this.track.element.margin.x - this.track.element.margin.z)
        : width;

    for (let i = 0; i < this._ticks.length; i++) {
        const t = this._ticks[i].element;
        this.setRect(t, this.barX((this._tickCp[i] + 1) / this._count), 0, t.width, t.height);
    }
    this._lastLayout = { screenW, screenH, top, width, obstacles: obstacles.length };
    this._placedLocal = null;
};

// element visible = enabled up to the avoided group and not fully transparent
SkateboardObbyProgressBar.prototype.isVisible = function (node, stopAt) {
    let n = node;
    while (n && n !== stopAt) {
        if (!n.enabled) return false;
        n = n.parent;
    }
    const el = node.element;
    if (el.type === 'image' && el.opacity <= 0.01) return false;
    if (el.type === 'text' && (!el.text || el.opacity <= 0.01)) return false;
    return true;
};

// ---------------------------------------------------------------------------
// heads
// ---------------------------------------------------------------------------

// x of a progress value from the left of the track rect: 0 and 1 are the visible ends of the bar
SkateboardObbyProgressBar.prototype.barX = function (value) {
    const l = this.barInsetLeft, r = this.barInsetRight;
    return (l + value * (1 - l - r)) * this._trackWidth;
};

// markers keep the height they have in the editor (their tops on the lower edge of the bar), only x follows the progress
SkateboardObbyProgressBar.prototype.placeHead = function (head, value) {
    const el = head.element;
    if (head._baseY === undefined) head._baseY = el.margin.y + el.height * el.pivot.y;
    this.setRect(el, this.barX(value), head._baseY, el.width, el.height);
};

SkateboardObbyProgressBar.prototype.smooth = function (shown, target, dt) {
    if (shown < 0 || Math.abs(target - shown) > 0.5 || Math.abs(target - shown) < 0.0005) return target;
    return shown + (target - shown) * (1 - Math.exp(-this.smoothing * dt));
};

SkateboardObbyProgressBar.prototype.createRemoteHead = function () {
    const head = this.remoteHeadTemplate.clone();
    head.name = 'RemoteHead';
    this.headsParent.insertChild(head, 0);   // under the local head
    head.enabled = true;
    const c = SkateboardObbyProgressBar.REMOTE_COLORS[this._colorIndex++ % SkateboardObbyProgressBar.REMOTE_COLORS.length];
    const ring = head.findByName('Ring');
    if (ring && ring.element) ring.element.color = new pc.Color(c[0], c[1], c[2], 1);
    return head;
};

SkateboardObbyProgressBar.prototype.update = function (dt) {
    if (this._count == null) return;
    if (this._layoutDirty) this.layout();
    if (!this._count) return;

    // local player
    const player = this.app.skateboardObbyPlayerController;
    if (player && this.localHead) {
        let value;
        if (player.isDied) {
            // dead: keep the head where it was, but inside the current step (a reset can lower the checkpoint)
            const base = this.progressFromCheckpoint(this.app.checkpoint, null);
            const high = Math.min(1, (this.takenCount(this.app.checkpoint) + this.maxBetween) / this._count);
            value = this._localShown >= 0 ? pc.math.clamp(this._localShown, base, Math.max(base, high)) : base;
        } else {
            // never moves back while riding (loops, turning around); resets on respawn / checkpoint change
            value = this.progressFromCheckpoint(this.app.checkpoint, player.entity.getPosition());
            this._localBest = Math.max(this._localBest, value);
            value = this._localBest;
        }
        this._localShown = this.smooth(this._localShown, value, dt);
        // the triangle only moves when the value changes
        if (this._placedLocal !== this._localShown) {
            this._placedLocal = this._localShown;
            this.placeHead(this.localHead, this._localShown);
        }
        const percent = Math.round(this._localShown * 100);
        if (this.countText && this.countText.element && this._shownCount !== percent) {
            this._shownCount = percent;
            this.countText.element.text = percent + '%';
        }
    }

    // other players
    const nm = this.networkManager;
    const entities = nm && nm.playerEntities;
    const localId = nm && nm.room ? nm.room.sessionId : null;
    for (const id in this._remote) this._remote[id].seen = false;
    if (entities && this.remoteHeadTemplate && this.headsParent) {
        for (const id in entities) {
            if (id === localId) continue;
            const ent = entities[id];
            if (!ent || ent._destroyed || !ent.networkPosition) continue;
            let r = this._remote[id];
            if (!r) r = this._remote[id] = { head: this.createRemoteHead(), shown: -1 };
            r.seen = true;
            const pos = ent.getPosition();
            const target = typeof ent.networkCheckpoint === 'number'
                ? this.progressFromCheckpoint(ent.networkCheckpoint, pos)
                : this.progressFromPosition(pos);
            r.shown = this.smooth(r.shown, target, dt);
            this.placeHead(r.head, r.shown);
        }
    }
    for (const id in this._remote) {
        if (!this._remote[id].seen) {
            this._remote[id].head.destroy();
            delete this._remote[id];
        }
    }
};
