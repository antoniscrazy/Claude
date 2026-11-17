/*
 * SkateboardObby_Aura
 * Cosmetic aura around the rider (derived from Monkey's EffectShop aura, no shader): 2 particle systems made in code,
 * shapes rising around the body + a soft glow. Textures are drawn on a canvas, no assets.
 * - Other players: listens to "player:add"; one frame later networkData is there and, if the server has the field,
 *   networkData.listen("aura"). They get fewer particles and no glow (1 draw call), only within Remote Range and on screen.
 * - Off screen / dead: the particle entity is switched off (particles simulate off screen otherwise). Checked 5x a second.
 * - Local selection -> Client:SetAura {aura} (only if the server schema has "aura"; old servers are left alone).
 * - No speed or coin bonus, trails do speed. Not the Troll / PVP "aura" (a currency there).
 * Shop: SkateboardObby_Shop reads "auras" from here and calls equip(id). Console: aura(id), auraList().
 */
var SkateboardObbyAura = pc.createScript('skateboardObbyAura');

SkateboardObbyAura.attributes.add('player', { type: 'entity', description: 'Local Player' });
SkateboardObbyAura.attributes.add('height', { type: 'number', default: 1.2, title: 'Height', description: 'Aura center above the feet (m)' });
SkateboardObbyAura.attributes.add('particles', { type: 'number', default: 12, precision: 0, title: 'Particles' });
SkateboardObbyAura.attributes.add('particlesMobile', { type: 'number', default: 8, precision: 0, title: 'Particles (Mobile)' });
SkateboardObbyAura.attributes.add('remoteParticles', { type: 'number', default: 6, precision: 0, title: 'Remote Particles' });
SkateboardObbyAura.attributes.add('remoteParticlesMobile', { type: 'number', default: 4, precision: 0, title: 'Remote Particles (Mobile)' });
SkateboardObbyAura.attributes.add('remoteRange', { type: 'number', default: 40, title: 'Remote Range' });
SkateboardObbyAura.attributes.add('maxRemoteAuras', { type: 'number', default: 6, precision: 0, title: 'Max Remote Auras' });
SkateboardObbyAura.attributes.add('maxRemoteAurasMobile', { type: 'number', default: 3, precision: 0, title: 'Max Remote Auras (mobile)' });

SkateboardObbyAura.attributes.add('auras', {
    type: 'json', array: true, title: 'Auras', schema: [
        { name: 'id', type: 'string', default: 'aura_amber', description: 'Save key [a-z0-9_], do not change' },
        { name: 'name', type: 'string', default: 'Amber Flame' },
        { name: 'priceType', type: 'string', default: 'coins', enum: [{ 'Free': 'free' }, { 'Coins': 'coins' }, { 'Rewarded Ad': 'ad' }] },
        { name: 'price', type: 'number', default: 150 },
        { name: 'rowColor', type: 'string', default: 'red', enum: [{ 'Red': 'red' }, { 'Blue': 'blue' }, { 'Green': 'green' }, { 'Yellow': 'yellow' }, { 'Purple': 'purple' }] },
        { name: 'shape', type: 'string', default: 'flame', enum: [{ 'Flame': 'flame' }, { 'Snowflake': 'snow' }, { 'Leaf': 'leaf' }, { 'Spark': 'spark' }, { 'Star': 'star' }, { 'Bubble': 'bubble' }] },
        { name: 'color', type: 'rgb', default: [1, 0.6, 0.1] },
        { name: 'color2', type: 'rgb', default: [1, 0.15, 0.05] },
        { name: 'rainbow', type: 'boolean', default: false }
    ]
});

SkateboardObbyAura.KEY_EQUIPPED = 'SkateboardObby_Aura';
SkateboardObbyAura.ID_RE = /^[a-z0-9_]{1,32}$/;

SkateboardObbyAura.prototype.initialize = function () {
    this.app.skateAura = this;
    this.remotes = [];     // { entity, data, id, fx, unlisten, body }
    this.pending = [];     // remote entities whose networkData arrives next frame
    this.textures = {};    // shape -> texture
    this.localFx = null;
    this._timer = 0;
    this._netTimer = 0;
    this._sphere = new pc.BoundingSphere(new pc.Vec3(), 2.5);

    const saved = SkateboardObby_Utils.getItem(SkateboardObbyAura.KEY_EQUIPPED);
    this.equipped = (saved && this.find(saved)) ? saved : null;   // ownership lives in the shop

    this.app.on('player:add', this.onPlayerAdd, this);
    this.app.on('player:remove', this.onPlayerRemove, this);
    this.on('destroy', this.onDestroy, this);
};

SkateboardObbyAura.prototype.postInitialize = function () {
    this.applyLocal();
};

SkateboardObbyAura.prototype.onDestroy = function () {
    this.app.off('player:add', this.onPlayerAdd, this);
    this.app.off('player:remove', this.onPlayerRemove, this);
    while (this.remotes.length) this.removeRemote(this.remotes[0]);
    if (this.localFx) { this.localFx.destroy(); this.localFx = null; }
    for (const k in this.textures) this.textures[k].destroy();
    this.textures = {};
    if (this.app.skateAura === this) this.app.skateAura = null;
};

// --- list / selection -----------------------------------------------------------------

SkateboardObbyAura.prototype.find = function (_id) {
    if (typeof _id !== 'string' || !_id) return null;
    const l = this.auras || [];
    for (let i = 0; i < l.length; i++) if (l[i].id === _id) return l[i];
    return null;
};

// _id = null / "" -> no aura
SkateboardObbyAura.prototype.equip = function (_id) {
    const it = this.find(_id);
    this.equipped = it ? it.id : null;
    SkateboardObby_Utils.setItem(SkateboardObbyAura.KEY_EQUIPPED, this.equipped || '');
    this.applyLocal();
    this._netTimer = 0;   // send on the next update
    this._timer = 0;
    this.app.fire('skate:aura', this.equipped);
};

SkateboardObbyAura.prototype.applyLocal = function () {
    const it = this.find(this.equipped);
    if (this.localFx && (!it || this.localFx.id !== it.id)) { this.localFx.destroy(); this.localFx = null; }
    if (it && !this.localFx && this.player) this.localFx = new SkateboardObby_AuraFX(this, this.bodyOf(this.player), it, false);
};

SkateboardObbyAura.prototype.bodyOf = function (_ent) {
    if (_ent === this.player) {
        const c = this.app.skateboardObbyPlayerController;
        if (c && c.body) return c.body;
    }
    return _ent.findByName('Body') || _ent;
};

SkateboardObbyAura.prototype.isMobile = function () {
    return !!(pc.platform.mobile || this.app.isMobile);
};

SkateboardObbyAura.prototype.texture = function (_shape) {
    if (!this.textures[_shape]) this.textures[_shape] = SkateboardObby_AuraArt.toTexture(this.app, SkateboardObby_AuraArt.particle(_shape), false);
    return this.textures[_shape];
};

// --- remote players ---------------------------------------------------------------------

SkateboardObbyAura.prototype.onPlayerAdd = function (_ent) {
    if (!_ent || _ent === this.player) return;
    this.pending.push(_ent);   // networkData is set right after this event
};

SkateboardObbyAura.prototype.onPlayerRemove = function (_data) {
    for (let i = this.remotes.length - 1; i >= 0; i--) if (this.remotes[i].data === _data) this.removeRemote(this.remotes[i]);
};

SkateboardObbyAura.prototype.attachRemote = function (_ent) {
    const d = _ent.networkData;
    if (!d || !('aura' in d)) return;   // old server: no aura field
    const r = { entity: _ent, data: d, id: '', fx: null, unlisten: null, body: null };
    this.remotes.push(r);
    const _set = (v) => { r.id = (typeof v === 'string' && SkateboardObbyAura.ID_RE.test(v)) ? v : ''; this._timer = 0; };
    try { r.unlisten = d.listen('aura', _set); } catch (e) { r.unlisten = null; }
    _set(d.aura);
    r._onDestroy = () => this.removeRemote(r);
    _ent.once('destroy', r._onDestroy);
};

SkateboardObbyAura.prototype.removeRemote = function (r) {
    const i = this.remotes.indexOf(r);
    if (i >= 0) this.remotes.splice(i, 1);
    if (r.unlisten) { try { r.unlisten(); } catch (e) { } r.unlisten = null; }
    if (r.entity && r._onDestroy) r.entity.off('destroy', r._onDestroy);
    if (r.fx) { r.fx.destroy(); r.fx = null; }
};

// --- network: local selection -> server ----------------------------------------------------

SkateboardObbyAura.prototype.sendAura = function () {
    try {
        const nm = this.app.skateboardObbyNetworkManager, room = nm && nm.room;
        if (!room || !room.state || !room.state.players) return;
        const me = room.state.players.get(room.sessionId);
        if (!me || !('aura' in me)) return;   // old server
        const id = this.equipped || '';
        if (this._sentRoom === room && this._sentId === id) return;
        room.send('Client:SetAura', { aura: id });
        this._sentRoom = room;
        this._sentId = id;
    } catch (e) { }
};

// --- update ----------------------------------------------------------------------------------

SkateboardObbyAura.prototype.update = function (dt) {
    // entities from player:add, one frame later networkData is ready
    if (this.pending.length) {
        for (let i = this.pending.length - 1; i >= 0; i--) {
            const e = this.pending[i];
            if (e._destroyed) { this.pending.splice(i, 1); continue; }
            if (e.networkData) { this.pending.splice(i, 1); this.attachRemote(e); }
        }
    }

    this._netTimer -= dt;
    if (this._netTimer <= 0) { this._netTimer = 1; this.sendAura(); }

    const c = this.app.skateboardObbyPlayerController;
    if (this.localFx && (!c || c.isDied)) this.localFx.setVisible(false);   // right away, the character shatters

    this._timer -= dt;
    if (this._timer <= 0) { this._timer = 0.2; this.updateVisibility(c); }
};

SkateboardObbyAura.prototype.inView = function (_pos, _cam) {
    if (!_cam) return true;
    this._sphere.center.copy(_pos);
    return _cam.frustum.containsSphere(this._sphere) > 0;
};

SkateboardObbyAura.prototype.updateVisibility = function (c) {
    const cams = this.app.systems.camera.cameras;
    const cam = cams.length ? cams[0] : null;
    if (this.localFx) this.localFx.setVisible(!!c && !c.isDied && this.inView(this.player.getPosition(), cam));
    if (!this.remotes.length) return;

    const me = this.player ? this.player.getPosition() : null;
    const range2 = this.remoteRange * this.remoteRange;
    const max = this.isMobile() ? this.maxRemoteAurasMobile : this.maxRemoteAuras;
    let shown = 0;
    for (let i = 0; i < this.remotes.length; i++) {
        const r = this.remotes[i];
        const it = r.id ? this.find(r.id) : null;   // unknown id (item of a newer build) = no aura
        if (r.fx && (!it || r.fx.id !== it.id)) { r.fx.destroy(); r.fx = null; }
        const p = r.entity.getPosition();
        let show = !!it && r.entity.enabled && !(r.data && r.data.isDead) && shown < max;
        if (show && me) {
            const dx = p.x - me.x, dy = p.y - me.y, dz = p.z - me.z;
            show = dx * dx + dy * dy + dz * dz < range2;
        }
        if (show) show = this.inView(p, cam);
        if (show) {
            if (!r.fx) r.fx = new SkateboardObby_AuraFX(this, this.bodyOf(r.entity), it, true);
            r.fx.setVisible(true);
            shown++;
        } else if (r.fx) {
            r.fx.setVisible(false);
        }
    }
};

// =====================================================================================================
// One aura: shapes (rise around the body) + glow (local player only). Follows the body (local space).
// =====================================================================================================
var SkateboardObby_AuraFX = function (manager, body, item, remote) {
    this.id = item.id;
    const Art = SkateboardObby_AuraArt;
    const c1 = Art.col(item.color), c2 = Art.col(item.color2 || item.color);
    const rainbow = !!item.rainbow;
    const shape = item.shape || 'flame';
    const mobile = manager.isMobile();

    this.entity = new pc.Entity('AuraFX_' + item.id);
    this.entity.setLocalPosition(0, manager.height, 0);
    body.addChild(this.entity);

    const colorSet = rainbow
        ? new pc.CurveSet([[0, 1, 0.33, 0.3, 0.66, 0.4, 1, 1], [0, 0.4, 0.33, 1, 0.66, 0.6, 1, 0.9], [0, 0.4, 0.33, 0.4, 0.66, 1, 1, 0.3]])
        : new pc.CurveSet([[0, c1.r, 1, c2.r], [0, c1.g, 1, c2.g], [0, c1.b, 1, c2.b]]);

    const rise = { flame: [0.9, 1.6], snow: [0.2, 0.55], leaf: [0.3, 0.7], spark: [0.6, 1.3], star: [0.4, 0.9], bubble: [0.5, 1.0] }[shape] || [0.5, 1];
    const size = { flame: 0.36, snow: 0.38, leaf: 0.32, spark: 0.32, star: 0.3, bubble: 0.28 }[shape] || 0.32;
    const count = Math.max(1, Math.round(remote ? (mobile ? manager.remoteParticlesMobile : manager.remoteParticles) : (mobile ? manager.particlesMobile : manager.particles)));
    const life = 1.4;

    const common = {
        loop: true, autoPlay: true, preWarm: false, localSpace: true, lighting: false, halfLambert: false,
        depthWrite: false, depthSoftening: 0, sort: pc.PARTICLESORT_NONE, alignToMotion: false, stretch: 0, blendType: pc.BLEND_NORMAL
    };

    // shapes: born in a thin shell around the body, rise, turn, fade
    this.shapes = new pc.Entity('Shapes');
    this.shapes.addComponent('particlesystem', Object.assign({}, common, {
        numParticles: count, lifetime: life, rate: life / count * 0.85, rate2: life / count * 1.15,
        emitterShape: pc.EMITTERSHAPE_BOX,
        emitterExtents: new pc.Vec3(2.2, 1.8, 2.2),
        emitterExtentsInner: new pc.Vec3(1.5, 0, 1.5),
        colorMap: manager.texture(shape),
        startAngle: shape === 'flame' ? -12 : 0, startAngle2: shape === 'flame' ? 12 : 360,
        scaleGraph: new pc.Curve([0, size * 0.5, 0.25, size, 1, size * 0.3]),
        alphaGraph: new pc.Curve([0, 0, 0.18, 1, 0.75, 0.85, 1, 0]),
        colorGraph: colorSet,
        velocityGraph: new pc.CurveSet([[0, -0.15], [0, rise[0]], [0, -0.15]]),
        velocityGraph2: new pc.CurveSet([[0, 0.15], [0, rise[1]], [0, 0.15]]),
        rotationSpeedGraph: new pc.Curve([0, shape === 'flame' ? 0 : 70]),
        rotationSpeedGraph2: new pc.Curve([0, shape === 'flame' ? 0 : -70])
    }));
    this.entity.addChild(this.shapes);

    // glow: 2 big faint quads around the body, local player only
    if (!remote) {
        this.glow = new pc.Entity('Glow');
        this.glow.addComponent('particlesystem', Object.assign({}, common, {
            numParticles: 2, lifetime: 1.6, rate: 0.8, rate2: 0.8,
            emitterShape: pc.EMITTERSHAPE_BOX, emitterExtents: new pc.Vec3(0.2, 0.4, 0.2),
            colorMap: manager.texture('glow'),
            scaleGraph: new pc.Curve([0, 2.5, 0.5, 2.9, 1, 2.6]),
            alphaGraph: new pc.Curve([0, 0, 0.35, 0.22, 0.7, 0.22, 1, 0]),
            colorGraph: rainbow ? colorSet : new pc.CurveSet([[0, c1.r], [0, c1.g], [0, c1.b]]),
            velocityGraph: new pc.CurveSet([[0, 0], [0, 0.1], [0, 0]])
        }));
        this.entity.addChild(this.glow);
    }
};

SkateboardObby_AuraFX.prototype.setVisible = function (_v) {
    if (this.entity && this.entity.enabled !== _v) this.entity.enabled = _v;
};

SkateboardObby_AuraFX.prototype.destroy = function () {
    if (this.entity) this.entity.destroy();
    this.entity = null;
};

// =====================================================================================================
// Canvas art: particle textures + shop icon (same shapes as Monkey's aura, own copy: scripts of other modes stay untouched)
// =====================================================================================================
var SkateboardObby_AuraArt = {
    OUTLINE: '#1b1530',
    RAINBOW: ['#ff4d4d', '#ffa63d', '#ffe14d', '#5ce65c', '#4db8ff', '#b36bff'],
    css: function (c, a) { return 'rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ',' + (a === undefined ? 1 : a) + ')'; },
    col: function (v) { return v instanceof pc.Color ? v : (Array.isArray(v) ? new pc.Color(v[0], v[1], v[2]) : (v && typeof v.r === 'number' ? new pc.Color(v.r, v.g, v.b) : new pc.Color(1, 1, 1))); },
    canvas: function (n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; },

    // srgb true: colored (icons). false: white / alpha (particles get their color from colorGraph)
    toTexture: function (app, canvas, srgb) {
        const tex = new pc.Texture(app.graphicsDevice, {
            width: canvas.width, height: canvas.height,
            format: (srgb && pc.PIXELFORMAT_SRGBA8 !== undefined) ? pc.PIXELFORMAT_SRGBA8 : pc.PIXELFORMAT_RGBA8,
            mipmaps: false, minFilter: pc.FILTER_LINEAR, magFilter: pc.FILTER_LINEAR,
            addressU: pc.ADDRESS_CLAMP_TO_EDGE, addressV: pc.ADDRESS_CLAMP_TO_EDGE
        });
        tex.setSource(canvas);
        return tex;
    },

    // shape path, center 0,0, radius ~1
    path: function (ctx, shape) {
        ctx.beginPath();
        switch (shape) {
            case 'flame':
                ctx.moveTo(0, -1);
                ctx.bezierCurveTo(0.35, -0.55, 0.95, -0.2, 0.75, 0.35);
                ctx.bezierCurveTo(0.6, 0.85, 0.2, 1, 0, 1);
                ctx.bezierCurveTo(-0.2, 1, -0.6, 0.85, -0.75, 0.35);
                ctx.bezierCurveTo(-0.9, -0.1, -0.55, -0.25, -0.45, -0.55);
                ctx.bezierCurveTo(-0.3, -0.25, -0.15, -0.3, -0.12, -0.45);
                ctx.bezierCurveTo(-0.1, -0.7, -0.05, -0.85, 0, -1);
                break;
            case 'leaf':
                ctx.moveTo(0, -1);
                ctx.bezierCurveTo(0.75, -0.6, 0.8, 0.4, 0, 1);
                ctx.bezierCurveTo(-0.8, 0.4, -0.75, -0.6, 0, -1);
                break;
            case 'spark':
                ctx.moveTo(0.2, -1); ctx.lineTo(-0.55, 0.12); ctx.lineTo(-0.02, 0.12);
                ctx.lineTo(-0.25, 1); ctx.lineTo(0.6, -0.2); ctx.lineTo(0.08, -0.2); ctx.lineTo(0.35, -1);
                break;
            case 'star':
                for (let i = 0; i < 10; i++) {
                    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.45 : 1;
                    i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                break;
            case 'sparkle':
                for (let i = 0; i < 8; i++) {
                    const a = -Math.PI / 2 + i * Math.PI / 4, r = i % 2 ? 0.22 : 1;
                    i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                break;
            default: // bubble
                ctx.arc(0, 0, 0.85, 0, Math.PI * 2);
        }
        ctx.closePath();
    },

    snow: function (ctx, lw) {
        ctx.lineCap = 'round';
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a);
            ctx.moveTo(0, 0); ctx.lineTo(ca, sa);
            [0.45, 0.72].forEach((d, k) => {
                const b = 0.28 - k * 0.08;
                ctx.moveTo(ca * d, sa * d); ctx.lineTo(ca * d + Math.cos(a + 0.8) * b, sa * d + Math.sin(a + 0.8) * b);
                ctx.moveTo(ca * d, sa * d); ctx.lineTo(ca * d + Math.cos(a - 0.8) * b, sa * d + Math.sin(a - 0.8) * b);
            });
        }
        ctx.stroke();
    },

    // particle texture: white shape, soft edge
    particle: function (shape) {
        const n = 64, cv = this.canvas(n), ctx = cv.getContext('2d');
        ctx.translate(n / 2, n / 2);
        if (shape === 'glow') {
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n / 2);
            g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g; ctx.fillRect(-n / 2, -n / 2, n, n);
            return cv;
        }
        ctx.scale(n * 0.4, n * 0.4);
        ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff';
        if (shape === 'snow') this.snow(ctx, 0.16);
        else if (shape === 'bubble') { ctx.lineWidth = 0.18; this.path(ctx, 'bubble'); ctx.stroke(); ctx.globalAlpha = 0.35; ctx.fill(); }
        else { this.path(ctx, shape); ctx.fill(); }
        return cv;
    },

    // shop icon, 128 px: glow + outlined shape
    icon: function (item) {
        const n = 128, cv = this.canvas(n), ctx = cv.getContext('2d');
        const c1 = this.col(item.color), c2 = this.col(item.color2 || item.color);
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        const glow = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
        glow.addColorStop(0, this.css(c1, 0.75)); glow.addColorStop(1, this.css(c1, 0));
        ctx.fillStyle = glow; ctx.fillRect(0, 0, n, n);
        ctx.save(); ctx.translate(64, 66); ctx.scale(44, 44);
        const shape = item.shape || 'flame';
        let fill;
        if (item.rainbow) { fill = ctx.createLinearGradient(-1, -1, 1, 1); this.RAINBOW.forEach((c, i) => fill.addColorStop(i / (this.RAINBOW.length - 1), c)); }
        else { fill = ctx.createLinearGradient(0, -1, 0, 1); fill.addColorStop(0, this.css(c1)); fill.addColorStop(1, this.css(c2)); }
        if (shape === 'snow') {
            ctx.strokeStyle = this.OUTLINE; this.snow(ctx, 0.36);
            ctx.strokeStyle = fill; this.snow(ctx, 0.2);
        } else {
            ctx.lineWidth = 0.2; ctx.strokeStyle = this.OUTLINE;
            this.path(ctx, shape); ctx.stroke();
            ctx.fillStyle = fill; this.path(ctx, shape); ctx.fill();
            ctx.save(); ctx.scale(0.45, 0.45); ctx.translate(0, 0.5);
            ctx.fillStyle = 'rgba(255,255,255,0.55)'; this.path(ctx, shape); ctx.fill(); ctx.restore();
        }
        ctx.restore();
        ctx.save(); ctx.translate(100, 26); ctx.scale(12, 12); ctx.fillStyle = '#fff'; this.path(ctx, 'sparkle'); ctx.fill(); ctx.restore();
        return cv;
    }
};
