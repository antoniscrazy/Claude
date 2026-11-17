/*
 * SkateboardObby_PowerupLook (root of template SkateboardObby_PowerupLook)
 * The look of Monkey Obby's power-ups as one reusable piece: white ring on the ground, radial, an object in the middle, sparkling stars,
 * name, count + blue video icon. It only shows and detects: what the player gets is the caller's job (onFull).
 *
 * Use:
 *   const e = templateAsset.resource.instantiate(); app.root.addChild(e);
 *   const look = e.script.skateboardObbyPowerupLook;
 *   look.setup({ scale: 1.6, touchRadius: 2.2, holdTime: 1.6, groundLift: 0.15, canTake: () => !app.isMarketEnabled, onFull: () => startAd() });
 *   look.setItem({ name: 'VIP', count: 1, render: renderAssetId, material: materialId, renderScale: 1, renderHeight: 1, renderTilt: -20, image: textureAssetId, rect: null, imageSize: 3, imageHeight: 2 });
 *   look.place(x, y, z);
 * The object: `render` turns on the spot (Rot, as in Monkey), `image` faces the camera and sways. Give either one; with both, the image shows until
 * the render has loaded (the load starts in setItem). count 0 hides the number and the video icon. `materials` = one id per mesh of the render (or `material` for all).
 * `meshes` instead of `render`: [{ mesh, material }] made in code (nothing to load, the caller keeps a refcount on the mesh), placed and turned like a render.
 * labelLift raises the name (local meters), for pickups standing one behind the other.
 * look.setSticky(true): the ring holds the board back like the sticky goo (the controller's own "sticky" surface: speed drops, Stumble, weak ollie), so a rider can stop on it.
 * look.setDetail(false): far away only the ring and the object draw (no name, stars, radial).
 * After a full radial it asks again only once the player has stepped off. look.rearm() resets that; e.enabled = false hides it and stops its work.
 */
var SkateboardObbyPowerupLook = pc.createScript('skateboardObbyPowerupLook');

SkateboardObbyPowerupLook.RADIAL_MATERIAL = 252741403;   // "UI Radial Mask Teleport1", same as the template's LoadingRadial
SkateboardObbyPowerupLook.STICKY_TOUCH = 3;            // a sticky ring also takes a board that stopped just past its line
SkateboardObbyPowerupLook.STICKY_RADIUS = 3.6;           // wider than the ring (~2.1): a board coming in at 22 m/s needs about 6 m to stop, so it stops on the ring

SkateboardObbyPowerupLook.prototype.initialize = function () {
    this.ensure();
    this.on('destroy', this.onDestroy, this);
};

SkateboardObbyPowerupLook.prototype.ensure = function () {
    if (this._ready) return;
    this._ready = true;
    this.touchRadius = 2.6;
    this.holdTime = 1.6;
    this.canTake = null;
    this.onFull = null;
    this.state = 'idle';     // idle | hold
    this.armed = true;
    this.inside = false;
    this._t = 0;
    this.player = this.app.root.findByName('Player');
    const e = this.entity;
    this.label = e.findByName('Text');
    this._labelY = this.label.getLocalPosition().y;
    this.adCount = e.findByName('AdCount');
    this.adImage = e.findByName('AdImage');
    this.rot = e.findByName('Rot');
    this.ring = e.findByName('BoatWaterSprite');
    this.radialEntity = e.findByName('LoadingRadial');
    this.sparks = e.findByName('Sparks');
    this.detail = true;
    this._event = 'skate:powerupLook:' + e.getGuid();
    this.app.on(this._event, this.onRadialFull, this);

    // object slots, made once: image (faces the camera) and render (turns with Rot)
    const holder = this.holder = new pc.Entity('ImageHolder');
    holder.addComponent('script');
    holder.script.create('skateboardObbyLookAtcamera');
    this.rot.addChild(holder);
    const img = this.image = new pc.Entity('Image');
    img.addComponent('element', { type: 'image', anchor: [0.5, 0.5, 0.5, 0.5], pivot: [0.5, 0.5], width: 100, height: 100, useInput: false, layers: this.label.element.layers.slice() });
    holder.addChild(img);
    this.model = new pc.Entity('Model');
    this.model.addComponent('render', { type: 'asset', castShadows: false });
    this.rot.addChild(this.model);
    holder.enabled = false;
    this.model.enabled = false;
};

SkateboardObbyPowerupLook.prototype.onDestroy = function () {
    this._dead = true;
    this.setSticky(false);
    this.app.off(this._event, this.onRadialFull, this);
};

// opts: scale, touchRadius, holdTime, canTake(), onFull()
SkateboardObbyPowerupLook.prototype.setup = function (opts) {
    this.ensure();
    const s = opts.scale || 1;
    this.entity.setLocalScale(s, s, s);
    // the ring must clear the road mesh: on some stages it is a few cm above the collider the pickup stands on (the ring came out broken there)
    this.ring.setLocalPosition(0, (opts.groundLift === undefined ? 0.15 : opts.groundLift) / s, 0);
    if (opts.touchRadius) this.touchRadius = opts.touchRadius;
    if (opts.holdTime) this.holdTime = opts.holdTime;
    this.canTake = opts.canTake || null;
    this.onFull = opts.onFull || null;
};

// item: name, count, color (pc.Color, optional), image + rect + imageSize + imageHeight, or render + material + renderScale + renderHeight
SkateboardObbyPowerupLook.prototype.setItem = function (item) {
    this.ensure();
    this.rearm();
    this.label.element.text = item.name || '';
    if (item.color) this.label.element.color = item.color;
    this.label.setLocalPosition(this.label.getLocalPosition().x, this._labelY + (item.labelLift || 0), this.label.getLocalPosition().z);
    const n = item.count === undefined ? 1 : item.count;
    if (this.adCount) { this.adCount.enabled = n > 0; this.adCount.element.text = String(n); }
    if (this.adImage) this.adImage.enabled = n > 0;

    // image first; with a render too, the image only stands in until the model has loaded
    this._wantRender = item.render || 0;
    this.model.enabled = false;
    this.holder.enabled = !!item.image;
    if (item.image) {
        const el = this.image.element;
        el.textureAsset = item.image;
        el.rect = item.rect || new pc.Vec4(0, 0, 1, 1);
        const size = (item.imageSize || 3) / 100;
        this.image.setLocalScale(size, size, size);
        this._imageY = item.imageHeight || 1.5;
        this.holder.setLocalPosition(0, this._imageY, 0);
    }
    if (item.render || item.meshes) {
        const m = this._modelScale = item.renderScale || 1;
        this._modelY = item.renderHeight || 0.33;
        this._modelK = 1;
        this.model.setLocalScale(m, m, m);
        this.model.setLocalPosition(0, this._modelY, 0);
        this.model.setLocalEulerAngles(item.renderTilt || 0, 0, 0);
    }
    if (item.meshes) {
        this.model.render.meshInstances = item.meshes.map((x) => new pc.MeshInstance(x.mesh, x.material, this.model));
        this.model.enabled = true;
    } else if (item.render) {
        const asset = this.app.assets.get(item.render);
        if (!asset) return;
        const show = () => {
            if (this._dead || this._wantRender !== item.render || !asset.resource) return;   // changed meanwhile, or a load error: the image stays
            this.model.render.asset = asset.id;
            if (item.materials) this.model.render.materialAssets = item.materials;
            else if (item.material) this.model.render.materialAssets = [item.material];
            this.holder.enabled = false;
            this.model.enabled = true;
        };
        if (asset.loaded) show();
        else { asset.ready(show); this.app.assets.load(asset); }
    }
};

SkateboardObbyPowerupLook.prototype.setDetail = function (on) {
    if (this.detail === on) return;
    this.detail = on;
    this.label.enabled = on;
    if (this.sparks) this.sparks.enabled = on;
    if (this.radialEntity) this.radialEntity.enabled = on;
};

// an entry of app.skateInteractables (SkateboardObby_Interactable's shape), read by the player controller; a disabled look does not count
SkateboardObbyPowerupLook.prototype.setSticky = function (on) {
    const list = this.app.skateInteractables || (this.app.skateInteractables = []);
    if (!on) {
        if (this._zone) { const i = list.indexOf(this._zone); if (i >= 0) list.splice(i, 1); this._zone = null; this.touchRadius = this._baseTouch; }
        return;
    }
    if (this._zone) return;
    this._baseTouch = this.touchRadius;
    this.touchRadius = SkateboardObbyPowerupLook.STICKY_TOUCH;
    const half = SkateboardObbyPowerupLook.STICKY_RADIUS / 0.88;      // the controller insets the box by 6% on each side
    this._zone = {
        kind: 'sticky', entity: this.entity,
        localAabb: new pc.BoundingBox(new pc.Vec3(0, 0.25, 0), new pc.Vec3(half, 0.25, half)),
        localScale: () => 1,
        toLocal: (w, out) => { const q = this.entity.getPosition(); return out.set(w.x - q.x, w.y - q.y, w.z - q.z); }
    };
    list.push(this._zone);
};

SkateboardObbyPowerupLook.prototype.place = function (x, y, z) {
    this.entity.enabled = false;     // particles and text start clean
    this.entity.setPosition(x, y, z);
    this.entity.enabled = true;
    this.rearm();
};

SkateboardObbyPowerupLook.prototype.rearm = function () {
    this.armed = true;
    this.setInside(false);
    this.setHold(false);
};

SkateboardObbyPowerupLook.prototype.setHold = function (on) {
    const s = on ? 'hold' : 'idle';
    if (this.state === s) return;
    this.state = s;
    const r = this.radialEntity && this.radialEntity.script && this.radialEntity.script.skateboardObbyLoadingRadial;
    if (!r || !r.state) return;
    r.fireName = this._event;
    r._timeRate = 1 / Math.max(0.2, this.holdTime);
    if (on) r.start(); else r.stop();
};

// standing on it: the object fades so the rider and the radial stay in sight
SkateboardObbyPowerupLook.prototype.setInside = function (on) {
    if (this.inside === on) return;
    this.inside = on;
    if (this.image) this.image.element.opacity = on ? 0.35 : 1;
};

SkateboardObbyPowerupLook.prototype.onRadialFull = function () {
    if (this.state !== 'hold') return;
    this.state = 'idle';
    this.armed = false;
    if (this.onFull) this.onFull();
};

// LoadingRadial clones the element's material in its initialize. In a fresh instance the material asset may not be loaded yet,
// it then clones the default one (a white square on the ground). So: clone again from the real material once it is there.
SkateboardObbyPowerupLook.prototype.fixRadial = function () {
    this._radialFixed = true;
    const el = this.radialEntity && this.radialEntity.element;
    const r = this.radialEntity && this.radialEntity.script && this.radialEntity.script.skateboardObbyLoadingRadial;
    const a = this.app.assets.get(SkateboardObbyPowerupLook.RADIAL_MATERIAL);   // el.materialAsset is empty by now: assigning a material clears it
    if (!el || !a || !r) return;
    const apply = () => {
        if (this._dead || !a.resource) return;
        el.material = a.resource.clone();
        r.setProgress(r.value || 0);
    };
    if (a.loaded) apply();
    else { a.ready(apply); this.app.assets.load(a); }
};

SkateboardObbyPowerupLook.prototype.update = function (dt) {
    if (!this._radialFixed && this.detail) this.fixRadial();     // far looks have the radial off, it initializes when it comes on
    if (!this.player) return;
    this._t += dt;
    if (this.holder.enabled) {
        this.holder.setLocalPosition(0, this._imageY + Math.sin(this._t * 2) * 0.1, 0);
        this.image.setLocalEulerAngles(0, 0, Math.sin(this._t * 1.3) * 10);
    }
    if (this.model.enabled) {
        // standing on it: the model shrinks and rises so the rider and the radial stay in sight
        const k = this.inside ? 0.5 : 1;
        if (this._modelK !== k) {
            const d = k - this._modelK, step = dt * 3;
            this._modelK = Math.abs(d) <= step ? k : this._modelK + Math.sign(d) * step;
            const m = this._modelScale * this._modelK;
            this.model.setLocalScale(m, m, m);
            this.model.setLocalPosition(0, this._modelY + (1 - this._modelK) * 2.4, 0);
        }
    }
    const p = this.player.getPosition(), q = this.entity.getPosition();
    const dx = q.x - p.x, dz = q.z - p.z, dy = p.y - q.y;
    const inside = dx * dx + dz * dz < this.touchRadius * this.touchRadius && dy > -1 && dy < 4;
    if (!inside) this.armed = true;
    this.setInside(inside);
    this.setHold(inside && this.armed && (!this.canTake || this.canTake()));
};
