/*
 * SkateboardObby_RingRewards
 * One-time coin reward for flying through a ring (Halka) of the stages. Fully client-side, no server.
 * - Rings are found once by name under "Search Root" (Map): every entity whose name ends with "Name Suffix"
 *   (Stage_21_Engel_Halka ...). The packs are lazy-loaded, but the entities (and their transforms) exist from the start.
 * - Ring geometry comes from the mesh units of PK_Engel_Halka (center (0, 318, 0), inner radius 180 cm) and the ring's
 *   world transform; the ring's local Z is the plane normal.
 * - One update for all rings: only enabled (chunk open), not yet rewarded rings within Active Range are checked.
 *   Reward = the player's center crosses the ring plane closer than (inner radius - Edge Margin) to the ring center.
 * - Reward: app.skateCoins.add(Reward) + save (CoinManager writes the HUD), sound, "+N" pop, the ring pulses (scale).
 * - Rewarded rings are saved by name: SkateboardObby_Utils key "SkateboardObby_RingRewards" (comma separated).
 *   The Restart portal (resetGame) does not clear it; clearing all SkateboardObby_ keys does.
 */
var SkateboardObbyRingRewards = pc.createScript('skateboardObbyRingRewards');

SkateboardObbyRingRewards.attributes.add('player', { type: 'entity', description: 'Local Player' });
SkateboardObbyRingRewards.attributes.add('searchRoot', { type: 'entity', title: 'Search Root', description: 'Rings are searched under this entity once (Map)' });
SkateboardObbyRingRewards.attributes.add('nameSuffix', { type: 'string', default: '_Engel_Halka', title: 'Name Suffix' });
SkateboardObbyRingRewards.attributes.add('ringCenter', { type: 'vec3', default: [0, 318, 0], title: 'Ring Center', description: 'Ring center in the ring entity\'s local (mesh) units' });
SkateboardObbyRingRewards.attributes.add('innerRadius', { type: 'number', default: 180, title: 'Inner Radius', description: 'Inner radius of the ring tube in local (mesh) units' });
SkateboardObbyRingRewards.attributes.add('edgeMargin', { type: 'number', default: 0.3, title: 'Edge Margin', description: 'm; the player center must pass this far inside the inner radius' });
SkateboardObbyRingRewards.attributes.add('reward', { type: 'number', default: 10, title: 'Reward', description: 'Coins per ring (once)' });
SkateboardObbyRingRewards.attributes.add('activeRange', { type: 'number', default: 40, title: 'Active Range', description: 'm; rings farther than this are not checked' });
SkateboardObbyRingRewards.attributes.add('maxStep', { type: 'number', default: 8, title: 'Max Step', description: 'm; a longer move in one frame is a teleport / respawn, not a pass' });
SkateboardObbyRingRewards.attributes.add('sound', { type: 'string', default: 'prize', description: 'Sound slot on the Player' });
SkateboardObbyRingRewards.attributes.add('screen', { type: 'entity', description: '2D Screen (for the "+N" pop)' });
SkateboardObbyRingRewards.attributes.add('font', { type: 'asset', assetType: 'font' });
SkateboardObbyRingRewards.attributes.add('popTime', { type: 'number', default: 1.2, title: 'Pop Time' });
SkateboardObbyRingRewards.attributes.add('pulseTime', { type: 'number', default: 0.6, title: 'Pulse Time', description: 'Ring scale pulse on reward' });
SkateboardObbyRingRewards.attributes.add('pulseScale', { type: 'number', default: 1.15, title: 'Pulse Scale' });

SkateboardObbyRingRewards.KEY = 'SkateboardObby_RingRewards';

SkateboardObbyRingRewards.prototype.initialize = function () {
    this.done = {};
    // per world: the next world's rings can have the same names
    const nm = this.app.skateboardObbyNetworkManager;
    this.saveKey = SkateboardObbyRingRewards.KEY + ((nm && nm.saveSuffix) || "");
    const saved = SkateboardObby_Utils.getItem(this.saveKey);
    if (saved) saved.split(',').forEach(n => { if (n) this.done[n] = true; });

    const suffix = this.nameSuffix || '_Engel_Halka';
    const found = this.searchRoot ? this.searchRoot.find(e => e.name.length > suffix.length && e.name.endsWith(suffix)) : [];
    this.rings = [];
    const lc = this.ringCenter || new pc.Vec3(0, 318, 0);
    for (const e of found) {
        const m = e.getWorldTransform();
        const c = m.transformPoint(lc, new pc.Vec3());
        const n = m.getZ(new pc.Vec3()).normalize();
        const r = this.innerRadius * m.getX(new pc.Vec3()).length() - this.edgeMargin;
        this.rings.push({ entity: e, name: e.name, c: c, n: n, r2: r * r, base: e.getLocalScale().clone(), pulse: 0 });
    }

    this._prev = new pc.Vec3();
    this._hasPrev = false;
    this._d = new pc.Vec3();
    this._q = new pc.Vec3();
    this._pulsing = 0;

    this.createPop();

    this.on('destroy', this.onDestroy, this);
};

SkateboardObbyRingRewards.prototype.createPop = function () {
    this.popT = -1;
    if (!this.screen || !this.font) return;
    const e = new pc.Entity('RingRewardPop');
    e.addComponent('element', {
        type: 'text', fontAsset: this.font.id, text: '+' + this.reward, fontSize: 72,
        anchor: [0.5, 0.72, 0.5, 0.72], pivot: [0.5, 0.5], alignment: [0.5, 0.5],
        color: new pc.Color(1, 0.84, 0.2), outlineColor: new pc.Color(0.35, 0.18, 0, 1), outlineThickness: 0.6,
        autoWidth: true, autoHeight: true, useInput: false
    });
    e.enabled = false;
    this.screen.addChild(e);
    this.popEntity = e;
};

SkateboardObbyRingRewards.prototype.onDestroy = function () {
    if (this.popEntity) { this.popEntity.destroy(); this.popEntity = null; }
    for (const r of this.rings) if (r.pulse > 0) r.entity.setLocalScale(r.base);
};

SkateboardObbyRingRewards.prototype.update = function (dt) {
    if (this._pulsing) this.updatePulse(dt);
    if (this.popT >= 0) this.updatePop(dt);

    const p = this.player;
    if (!p) return;
    const pos = p.getPosition();
    const prev = this._prev;
    if (this._hasPrev && this._d.sub2(pos, prev).lengthSq() <= this.maxStep * this.maxStep) {
        const range2 = this.activeRange * this.activeRange;
        for (let i = 0; i < this.rings.length; i++) {
            const r = this.rings[i];
            if (this.done[r.name] || !r.entity.enabled) continue;
            const dx = pos.x - r.c.x, dz = pos.z - r.c.z;
            if (dx * dx + dz * dz > range2) continue;
            const a = this._q.sub2(prev, r.c).dot(r.n);
            const b = this._q.sub2(pos, r.c).dot(r.n);
            if ((a < 0) === (b < 0) || a === b) continue;   // did not cross the plane this frame
            // crossing point on the plane
            this._q.lerp(prev, pos, a / (a - b)).sub(r.c);
            if (this._q.lengthSq() < r.r2) this.give(r);
        }
    }
    prev.copy(pos);
    this._hasPrev = true;
};

SkateboardObbyRingRewards.prototype.give = function (r) {
    this.done[r.name] = true;
    SkateboardObby_Utils.setItem(this.saveKey, Object.keys(this.done).join(','));

    const coins = this.app.skateCoins;
    if (coins) {
        coins.add(this.reward);
        coins.save();
        if (coins._iconPop !== undefined) coins._iconPop = 0.2;   // the HUD coin icon pops like on a coin pickup
    }

    const p = this.player;
    if (p && p.sound && this.sound && p.sound.slot(this.sound)) p.sound.play(this.sound);

    if (this.popEntity) {
        this.popEntity.element.text = '+' + this.reward;
        this.popEntity.enabled = true;
        this.popT = 0;
        this.updatePop(0);
    }

    if (this.pulseTime > 0) {
        if (r.pulse <= 0) this._pulsing++;
        r.pulse = this.pulseTime;
    }
};

SkateboardObbyRingRewards.prototype.updatePop = function (dt) {
    this.popT += dt;
    const t = this.popT / this.popTime;
    const e = this.popEntity;
    if (t >= 1) { e.enabled = false; this.popT = -1; return; }
    // pop in (0..0.15), hold, rise + fade out (0.6..1)
    const s = t < 0.15 ? 0.6 + 0.6 * (t / 0.15) : t < 0.3 ? 1.2 - 0.2 * ((t - 0.15) / 0.15) : 1;
    e.setLocalScale(s, s, s);
    e.setLocalPosition(0, t * 60, 0);
    e.element.opacity = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
};

SkateboardObbyRingRewards.prototype.updatePulse = function (dt) {
    for (let i = 0; i < this.rings.length; i++) {
        const r = this.rings[i];
        if (r.pulse <= 0) continue;
        r.pulse -= dt;
        if (r.pulse <= 0) { r.entity.setLocalScale(r.base); this._pulsing--; continue; }
        const k = 1 + (this.pulseScale - 1) * Math.sin(Math.PI * (1 - r.pulse / this.pulseTime));
        r.entity.setLocalScale(r.base.x * k, r.base.y * k, r.base.z * k);
    }
};
