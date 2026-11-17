/**
 * SquishSurface — modular press deformation for arbitrary meshes.
 *
 * Layers (both optional, at least one required):
 *  - SQUISH  (squishEnabled): vertex-shader dents on the entity's own render mesh.
 *  - CRUST   (crustEntity != null): pre-fractured shell (child entity, GLB from
 *    Blender cell fracture, piece pivots baked to vertex color). Pieces tilt and
 *    spread rigidly around their pivots based on press proximity.
 *
 * All deformation happens in the HOST ENTITY'S LOCAL SPACE:
 *  - pressAt(worldPos) converts the point to local space before storing.
 *  - Dents sink along the entity's local -Y. Rotated/scaled entities work.
 *  - radius/depth attributes are WORLD units; converted to local via entity scale
 *    (assumes uniform-ish scale; strongly non-uniform scale will distort dents).
 *
 * Press slots: MAX_PRESS static slots, positions never move once spawned.
 * Linear timer t (pressDuration/releaseDuration) -> easeInOutSine 'eased'.
 * Uniform format: uPress[i] = (localX, localY, localZ, eased).
 * MAX_PRESS must match #define in squish.vert.glsl and crust.vert.glsl.
 */
var SquishSurface = pc.createScript('squishSurface');

SquishSurface.attributes.add('squishEnabled', { type: 'boolean', default: true, title: 'Squish Enabled' });
SquishSurface.attributes.add('selfCrust', { type: 'boolean', default: false, title: 'Self Crust (use own mesh)' });

SquishSurface.attributes.add('crustEntity', { type: 'entity', title: 'Crust Entity (optional)' });
SquishSurface.attributes.add('crustSinkAmount', { type: 'number', default: 1.0, title: 'Crust Sink Amount' });

SquishSurface.attributes.add('radius', { type: 'number', default: 3, title: 'Dent Radius (world)' });
SquishSurface.attributes.add('depth', { type: 'number', default: 0.5, title: 'Dent Depth (world)' });
SquishSurface.attributes.add('pressDuration', { type: 'number', default: 0.2, title: 'Press Duration (s)' });
SquishSurface.attributes.add('releaseDuration', { type: 'number', default: 0.7, title: 'Release Duration (s)' });
SquishSurface.attributes.add('dentSpacing', { type: 'number', default: 0.6, title: 'Dent Spacing (world)' });
SquishSurface.attributes.add('bendFactor', { type: 'number', default: 0.8, min: 0, max: 1, title: 'Bend Factor (bottom)' });
SquishSurface.attributes.add('color', { type: 'rgb', default: [1, 0.83, 0.35], title: 'Surface Color' });

SquishSurface.attributes.add('crustOverrideColor', { type: 'boolean', default: false, title: 'Override Crust Color' });
SquishSurface.attributes.add('crustColor', { type: 'rgb', default: [0.9, 0.55, 0.2], title: 'Crust Color' });
SquishSurface.attributes.add('crustOpacity', { type: 'number', default: 0.55, min: 0, max: 1, title: 'Crust Opacity' });
SquishSurface.attributes.add('tiltAmount', { type: 'number', default: 1.0, title: 'Piece Tilt Amount' });
SquishSurface.attributes.add('spreadAmount', { type: 'number', default: 0.15, title: 'Piece Spread Amount' });
SquishSurface.attributes.add('radialSpread', { type: 'number', default: 0, title: 'Radial Spread' });

SquishSurface.attributes.add('lightEntity', { type: 'entity', title: 'Directional Light' });
SquishSurface.attributes.add('generateMesh', { type: 'boolean', default: false, title: 'Generate Subdivided Box' });
SquishSurface.attributes.add('segments', { type: 'number', default: 48, title: 'Box Segments' });

SquishSurface.attributes.add('dentShadowStrength', { type: 'number', default: 0.12, min: 0, max: 1, title: 'Dent Shadow Strength' });
SquishSurface.attributes.add('dentShadowPower', { type: 'number', default: 1.5, title: 'Dent Shadow Power' });

SquishSurface.attributes.add('soundCooldown', { type: 'number', default: 0.5, title: 'Sound Cooldown (s)' });
SquishSurface.attributes.add('soundVolume', { type: 'number', default: 1, min: 0, max: 1, title: 'Sound Volume' });
SquishSurface.attributes.add('soundPitch', { type: 'number', default: 1, min: 0, max: 1, title: 'Sound Pitch' });
SquishSurface.attributes.add('pressSounds', { type: 'asset', assetType: 'audio', array: true, title: 'Press Sounds' });
SquishSurface.attributes.add('crustSounds', { type: 'asset', assetType: 'audio', array: true, title: 'Crust Sounds' });
SquishSurface.attributes.add('jumpSounds', { type: 'asset', assetType: 'audio', array: true, title: 'Jump Off Sounds' });
SquishSurface.attributes.add('soundContactGrace', { type: 'number', default: 0.15, title: 'Sound Contact Grace (s)' });

var MAX_PRESS = 24;

var SHADER_ASSETS = {
    squishTransform: 299356625,
    squishNormal: 299356626,
    crustTransform: 301421107,
    crustNormal: 301421113
};

function easeInOutSine(t) {
    return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

function smoothFalloff(dist, radius) {
    var x = Math.min(Math.max(dist / radius, 0), 1);
    var f = 1.0 - (x * x * (3.0 - 2.0 * x));
    return f * f * (3.0 - 2.0 * f);
}

SquishSurface.prototype.initialize = function () {
    this._setupPhysics();

    // resolve the crust target once: self-crust wins over the entity slot
    this._crustTarget = this.selfCrust ? this.entity : this.crustEntity;

    // crust on our own mesh: the crust chunk already does sink + tilt,
    // so the squish layer would just fight it (and break varyings)
    this._selfCrust = !!(this._crustTarget &&
        this._getRender(this._crustTarget) === this._getRender(this.entity));

    this._crustSoundsAvailable = !!(this.crustSounds && this.crustSounds.length);
    // real, separate crust object: its own once-per-contact crust sound, alongside pressSounds
    this._crustSoundEligible = this._crustSoundsAvailable && this._crustTarget && !this._selfCrust;
    this._jumpSoundsAvailable = !!(this.jumpSounds && this.jumpSounds.length);
    // self-crust already replaces pressSounds with crustSounds on press; keep jump sounds out of that too
    this._jumpSoundEligible = this._jumpSoundsAvailable && !this._selfCrust;

    this._soundTimer = 0;
    this._inContact = false;
    this._contactGrace = 0;
    this._pressedNow = false;
    this._crustSoundPlayed = false;
    this._setupSound();

    this._slots = [];
    for (var i = 0; i < MAX_PRESS; i++) {
        this._slots.push({ pos: new pc.Vec3(), t: 0, eased: 0, active: false });
    }
    this._pressData = new Float32Array(MAX_PRESS * 4);
    this._materials = [];
    this._tmpVec = new pc.Vec3();
    this._invModel = new pc.Mat4();

    var sc = this.entity.getWorldTransform().getScale();
    this._invScale = 3.0 / Math.max(sc.x + sc.y + sc.z, 0.0001);
    this._localRadius = this.radius * this._invScale;
    this._localDepth = this.depth * this._invScale;

    this._squishReady = !this.squishEnabled || this._selfCrust;
    this._crustReady = !this._crustTarget;
    this._trySetup();

    // catch late-loading assets explicitly instead of relying on update() polling
    if (!this._squishReady || !this._crustReady) {
        this.app.assets.on('load', this._onAssetLoad, this);
        this.on('destroy', function () {
            this.app.assets.off('load', this._onAssetLoad, this);
        }, this);
    }
};

// auto-setup so the script works by just dropping it on an entity
SquishSurface.prototype._setupPhysics = function () {
    if (!this.entity.tags.has('Ground')) {
        this.entity.tags.add('Ground');
    }

    if (!this.entity.collision) {
        this.entity.addComponent('collision', { type: 'mesh' });
    }

    if (!this.entity.rigidbody) {
        this.entity.addComponent('rigidbody', {
            type: pc.BODYTYPE_KINEMATIC,
            friction: 0,
            restitution: 0
        });
    } else {
        this.entity.rigidbody.friction = 0;
        this.entity.rigidbody.restitution = 0;
    }
};

// collision mesh needs the render asset, which may load late
SquishSurface.prototype._applyCollisionMesh = function () {
    if (this._collisionDone) return;

    var col = this.entity.collision;
    var render = this._getRender(this.entity);
    if (!col || col.type !== 'mesh' || !render) return;

    if (render.asset) {
        col.renderAsset = render.asset;
        this._collisionDone = true;
    } else if (render.meshInstances.length) {
        // procedural / non-asset mesh: fall back to a box hull
        var aabb = render.meshInstances[0].mesh.aabb;
        col.type = 'box';
        col.halfExtents = aabb.halfExtents.clone();
        this._collisionDone = true;
    }
};

SquishSurface.prototype._onAssetLoad = function () {
    if (this._squishReady && this._crustReady) {
        this.app.assets.off('load', this._onAssetLoad, this);
        return;
    }
    this._trySetup();
};

// meshes from GLBs load async; retry until meshInstances exist
SquishSurface.prototype._trySetup = function () {
    if (!this._squishReady && this._hasMesh(this.entity) && this._chunksReady()) {
        this._initSquish();
        this._squishReady = true;
    }
    if (!this._crustReady && this._hasMesh(this._crustTarget) && this._chunksReady()) {
        this._initCrust();
        this._crustReady = true;
    }
    this._applyCollisionMesh();
};

// resolve a shader asset by id, kicking off a load if it isn't loaded yet
SquishSurface.prototype._getChunk = function (id) {
    var asset = this.app.assets.get(id);
    if (!asset) return null;
    if (!asset.resource) {
        if (!asset.loading) this.app.assets.load(asset);
        return null;
    }
    return asset.resource;
};

SquishSurface.prototype._chunksReady = function () {
    if (this.squishEnabled) {
        if (!this._getChunk(SHADER_ASSETS.squishTransform)) return false;
        if (!this._getChunk(SHADER_ASSETS.squishNormal)) return false;
    }
    if (this._crustTarget) {
        if (!this._getChunk(SHADER_ASSETS.crustTransform)) return false;
        if (!this._getChunk(SHADER_ASSETS.crustNormal)) return false;
    }
    return true;
};

SquishSurface.prototype._hasMesh = function (entity) {
    var render = this._getRender(entity);
    return !!(render && render.meshInstances &&
        render.meshInstances.length &&
        render.meshInstances[0].mesh &&
        render.meshInstances[0].material);
};

SquishSurface.prototype._getSourceMaterial = function (entity) {
    var render = this._getRender(entity);
    if (!render) return null;

    var assets = render.materialAssets;
    if (assets && assets.length) {
        var a = assets[0];
        var asset = (typeof a === 'number') ? this.app.assets.get(a) : a;
        if (asset && asset.resource) return asset.resource;
    }
    return render.meshInstances.length ? render.meshInstances[0].material : null;
};

SquishSurface.prototype._getRender = function (entity) {
    if (!entity) return null;
    if (entity.render) return entity.render;
    var renders = entity.findComponents('render');
    return renders.length ? renders[0] : null;
};

SquishSurface.prototype._buildMaterial = function (vsAsset, fsAsset, attributes, uniqueName) {
    var mat = new pc.ShaderMaterial({
        uniqueName: uniqueName,
        vertexGLSL: vsAsset.resource,
        fragmentGLSL: fsAsset.resource,
        attributes: attributes
    });
    mat.setParameter('uRadius', this._localRadius);
    mat.setParameter('uDepth', this._localDepth);
    mat.setParameter('uLightDir', [0.4, -1.0, 0.3]);
    mat.setParameter('uPress[0]', this._pressData);
    mat.update();
    return mat;
};

SquishSurface.prototype._initSquish = function () {
    var render = this._getRender(this.entity);
    var mis = render.meshInstances;

    var localAabb = mis[0].mesh.aabb;
    var heightRange = new Float32Array([localAabb.getMin().y, localAabb.getMax().y]);

    this._squishMaterials = [];

    for (var i = 0; i < mis.length; i++) {
        var src = mis[i].material;
        if (!src) continue;

        // clone: the source material is shared by many other mesh instances
        var mat = src.clone();

        var chunks = mat.getShaderChunks(pc.SHADERLANGUAGE_GLSL);
        chunks.set('transformVS', this._getChunk(SHADER_ASSETS.squishTransform));
        chunks.set('normalMapPS', this._getChunk(SHADER_ASSETS.squishNormal));
        // silences "chunk changed" console notices; drop this line if it complains
        mat.shaderChunksVersion = pc.version.split('.').slice(0, 2).join('.');

        mat.setParameter('uRadius', this._localRadius);
        mat.setParameter('uDepth', this._localDepth);
        mat.setParameter('uHeightRange', heightRange);
        mat.setParameter('uBendFactor', this.bendFactor);
        mat.setParameter('uPress[0]', this._pressData);
        mat.update();

        mis[i].material = mat;
        this._squishMaterials.push(mat);
        this._materials.push(mat);
    }
};

// copy diffuse color/map, emissive, opacity and blend mode from a source material
SquishSurface.prototype._applySourceLook = function (target, src, fallbackColor) {
    var device = this.app.graphicsDevice;
    var color = fallbackColor;
    var tex = null;
    var emissive = [0, 0, 0];
    var opacity = 1.0;

    if (src) {
        if (src.diffuse) color = src.diffuse;
        if (src.diffuseMap) tex = src.diffuseMap;

        // emissive-driven materials (common for slimes/glow) would read black otherwise
        if (src.emissive) {
            var ei = (src.emissiveIntensity !== undefined) ? src.emissiveIntensity : 1;
            emissive = [src.emissive.r * ei, src.emissive.g * ei, src.emissive.b * ei];
        }
        if (src.emissiveMap && !tex) tex = src.emissiveMap;

        if (src.opacity !== undefined) opacity = src.opacity;

        // preserve transparency
        if (src.blendType !== undefined && src.blendType !== pc.BLEND_NONE) {
            target.blendType = src.blendType;
            target.depthWrite = false;
        }
        if (src.cull !== undefined) target.cull = src.cull;
    }

    if (opacity < 1.0 && target.blendType === pc.BLEND_NONE) {
        target.blendType = pc.BLEND_NORMAL;
        target.depthWrite = false;
    }

    if (!tex) tex = this._getWhiteTexture();

    target.setParameter('uColor', [color.r, color.g, color.b]);
    target.setParameter('uDiffuseMap', tex);
    target.setParameter('uEmissive', emissive);
    target.setParameter('uOpacity', opacity);
    target.update();
};

SquishSurface._whiteTex = null;

SquishSurface.prototype._getWhiteTexture = function () {
    if (!SquishSurface._whiteTex) {
        var device = this.app.graphicsDevice;
        var fmt = (pc.PIXELFORMAT_RGBA8 !== undefined) ? pc.PIXELFORMAT_RGBA8 : pc.PIXELFORMAT_R8_G8_B8_A8;
        SquishSurface._whiteTex = new pc.Texture(device, { width: 1, height: 1, format: fmt });
        var px = SquishSurface._whiteTex.lock();
        px.set([255, 255, 255, 255]);
        SquishSurface._whiteTex.unlock();
    }
    return SquishSurface._whiteTex;
};

SquishSurface.prototype._initCrust = function () {
    var crustRender = this._getRender(this._crustTarget);
    var mis = crustRender.meshInstances;

    var localAabb = mis[0].mesh.aabb;
    var bMin = localAabb.getMin();
    var bMax = localAabb.getMax();

    var hostRender = this._getRender(this.entity);
    var hostAabb = (hostRender && hostRender.meshInstances.length)
        ? hostRender.meshInstances[0].mesh.aabb
        : localAabb;
    var heightRange = new Float32Array([hostAabb.getMin().y, hostAabb.getMax().y]);

    for (var i = 0; i < mis.length; i++) {
        var src = mis[i].material;
        if (!src) continue;

        // clone so other users of this shared material are unaffected
        var mat = src.clone();

        var chunks = mat.getShaderChunks(pc.SHADERLANGUAGE_GLSL);
        chunks.set('transformVS', this._getChunk(SHADER_ASSETS.crustTransform));
        chunks.set('normalVS', this._getChunk(SHADER_ASSETS.crustNormal));

        if (this.crustOverrideColor) {
            mat.diffuse.set(this.crustColor.r, this.crustColor.g, this.crustColor.b);
            mat.diffuseMap = null;
            mat.opacity = this.crustOpacity;
            if (this.crustOpacity < 1.0) mat.blendType = pc.BLEND_NORMAL;
        }

        mat.setParameter('uRadius', this._localRadius);
        mat.setParameter('uDepth', this._localDepth);
        mat.setParameter('uHeightRange', heightRange);
        mat.setParameter('uBendFactor', this.bendFactor);
        mat.setParameter('uBoundsMin', [bMin.x, bMin.y, bMin.z]);
        mat.setParameter('uBoundsMax', [bMax.x, bMax.y, bMax.z]);
        mat.setParameter('uTiltAmount', this.tiltAmount);
        mat.setParameter('uSpreadAmount', this.spreadAmount);
        mat.setParameter('uRadialSpread', this.radialSpread);
        mat.setParameter('uSinkAmount',
            this._selfCrust ? (this.squishEnabled ? 1.0 : 0.0)
                : (this.squishEnabled ? this.crustSinkAmount : 0));
        mat.setParameter('uPress[0]', this._pressData);
        mat.update();

        mis[i].material = mat;
        this._materials.push(mat);
    }
};

// call every frame while pressing. worldPos is converted to local space;
// dents NEVER move once spawned.
SquishSurface.prototype.pressAt = function (worldPos) {
    this._pressedNow = true;

    this._invModel.copy(this.entity.getWorldTransform()).invert();
    var lp = this._invModel.transformPoint(worldPos, this._tmpVec);

    var i, s, dx, dz, d;
    var keepRadius = this._localRadius * 0.5;
    var localSpacing = this.dentSpacing * this._invScale;
    var nearestDist = Infinity;

    for (i = 0; i < MAX_PRESS; i++) {
        s = this._slots[i];
        if (s.t > 0.001 || s.active) {
            dx = s.pos.x - lp.x;
            dz = s.pos.z - lp.z;
            d = Math.sqrt(dx * dx + dz * dz);
            if (d < keepRadius) s.active = true;
            if (d < nearestDist) nearestDist = d;
        }
    }

    if (nearestDist <= localSpacing) return;

    var slot = null;
    for (i = 0; i < MAX_PRESS; i++) {
        s = this._slots[i];
        if (s.t <= 0.001 && !s.active) { slot = s; break; }
    }
    if (!slot) {
        var lowest = Infinity;
        for (i = 0; i < MAX_PRESS; i++) {
            s = this._slots[i];
            if (!s.active && s.t < lowest) { lowest = s.t; slot = s; }
        }
        if (slot) slot.t = 0;
    }
    if (!slot) return;

    slot.pos.copy(lp);
    slot.t = 0;
    slot.eased = 0;
    slot.active = true;
};

// current dent depth in WORLD units at a world position (for character sink).
// returns 0 if squish is disabled (crack-only surfaces don't sink the player).
SquishSurface.prototype.getDisplacementAt = function (x, z) {
    if (!this.squishEnabled) return 0;

    this._invModel.copy(this.entity.getWorldTransform()).invert();
    this._tmpVec.set(x, 0, z);
    var lp = this._invModel.transformPoint(this._tmpVec, this._tmpVec);

    var total = 0;
    for (var i = 0; i < MAX_PRESS; i++) {
        var s = this._slots[i];
        if (s.eased <= 0.001) continue;
        var dx = s.pos.x - lp.x;
        var dz = s.pos.z - lp.z;
        var f = smoothFalloff(Math.sqrt(dx * dx + dz * dz), this._localRadius);
        total = Math.max(total, f * s.eased);
    }
    return (total * this._localDepth) / this._invScale; // back to world units
};

SquishSurface.prototype.update = function (dt) {
    if (this._soundTimer > 0) this._soundTimer -= dt;

    // play once when contact starts, not on every new dent while walking
    if (this._pressedNow) {
        this._contactGrace = this.soundContactGrace;
        if (!this._inContact) {
            this._inContact = true;
            this._playPressSound();
            this._playCrustSound();
        }
        this._pressedNow = false;
    } else if (this._inContact) {
        this._contactGrace -= dt;
        if (this._contactGrace <= 0) {
            this._inContact = false;
            this._crustSoundPlayed = false;
            this._playJumpSound();
        }
    }

    if (!this._squishReady || !this._crustReady) this._trySetup();

    var i;
    for (i = 0; i < MAX_PRESS; i++) {
        var s = this._slots[i];

        if (s.active) {
            s.t = Math.min(1, s.t + dt / Math.max(this.pressDuration, 0.001));
        } else {
            s.t = Math.max(0, s.t - dt / Math.max(this.releaseDuration, 0.001));
        }
        s.eased = easeInOutSine(s.t);
        s.active = false;

        this._pressData[i * 4 + 0] = s.pos.x;
        this._pressData[i * 4 + 1] = s.pos.y;
        this._pressData[i * 4 + 2] = s.pos.z;
        this._pressData[i * 4 + 3] = s.eased;
    }

    var lightDir = null;
    if (this.lightEntity) {
        var f = this.lightEntity.forward;
        lightDir = [f.x, f.y, f.z];
    }

    for (i = 0; i < this._materials.length; i++) {
        this._materials[i].setParameter('uPress[0]', this._pressData);
        if (lightDir) this._materials[i].setParameter('uLightDir', lightDir);
    }
};

SquishSurface.prototype._setupSound = function () {
    var hasPress = this.pressSounds && this.pressSounds.length;
    if (!hasPress && !this._crustSoundsAvailable && !this._jumpSoundEligible) return;

    if (!this.entity.sound) {
        this.entity.addComponent('sound', { positional: true, refDistance: 5 });
    }

    var i, asset, name;

    // self-crust plays crustSounds INSTEAD of pressSounds, so pressSounds slots
    // would just be dead weight there
    if (hasPress && !this._selfCrust) {
        for (i = 0; i < this.pressSounds.length; i++) {
            asset = this.pressSounds[i];
            if (!asset) continue;
            name = 'squish_' + i;
            if (!this.entity.sound.slot(name)) {
                this.entity.sound.addSlot(name, {
                    asset: asset.id,
                    volume: this.soundVolume,
                    autoPlay: false,
                    overlap: true
                });
            }
        }
    }

    if (this._crustSoundsAvailable) {
        for (i = 0; i < this.crustSounds.length; i++) {
            asset = this.crustSounds[i];
            if (!asset) continue;
            name = 'crust_' + i;
            if (!this.entity.sound.slot(name)) {
                this.entity.sound.addSlot(name, {
                    asset: asset.id,
                    volume: this.soundVolume,
                    autoPlay: false,
                    overlap: true
                });
            }
        }
    }

    if (this._jumpSoundEligible) {
        for (i = 0; i < this.jumpSounds.length; i++) {
            asset = this.jumpSounds[i];
            if (!asset) continue;
            name = 'jump_' + i;
            if (!this.entity.sound.slot(name)) {
                this.entity.sound.addSlot(name, {
                    asset: asset.id,
                    volume: this.soundVolume,
                    autoPlay: false,
                    overlap: true
                });
            }
        }
    }
};

SquishSurface.prototype._playPressSound = function () {
    if (!this.entity.sound) return;
    if (this._soundTimer > 0) return;

    // self-crust: crustSounds replaces pressSounds entirely on press
    var useCrust = this._selfCrust && this._crustSoundsAvailable;
    var list = useCrust ? this.crustSounds : this.pressSounds;
    var prefix = useCrust ? 'crust_' : 'squish_';
    if (!list || !list.length) return;

    var idx = Math.floor(Math.random() * list.length);
    var slot = this.entity.sound.slot(prefix + idx);
    if (slot) {
        slot.pitch = (this.soundPitch - .2) + Math.random() * 0.4;
        slot.play();
        this._soundTimer = this.soundCooldown;
    }
};

// crust break sound: plays once per contact (reset when contact ends),
// independent of pressSounds' cooldown/repeat behavior
SquishSurface.prototype._playCrustSound = function () {
    if (!this._crustSoundEligible || this._crustSoundPlayed) return;
    if (!this.entity.sound) return;

    this._crustSoundPlayed = true;

    var idx = Math.floor(Math.random() * this.crustSounds.length);
    var slot = this.entity.sound.slot('crust_' + idx);
    if (slot) {
        slot.pitch = (this.soundPitch - .2) + Math.random() * 0.4;
        slot.play();
    }
};

// plays once when the player leaves the surface (contact grace expires)
SquishSurface.prototype._playJumpSound = function () {
    if (!this._jumpSoundEligible) return;
    if (!this.entity.sound) return;

    var idx = Math.floor(Math.random() * this.jumpSounds.length);
    var slot = this.entity.sound.slot('jump_' + idx);
    if (slot) {
        slot.pitch = (this.soundPitch - .2) + Math.random() * 0.4;
        slot.play();
    }
};

// world-space sink offset at a world position (accounts for entity rotation)
SquishSurface.prototype.getSinkOffset = function (worldPos, out) {
    out = out || new pc.Vec3();
    out.set(0, 0, 0);
    if (!this.squishEnabled) return out;

    this._invModel.copy(this.entity.getWorldTransform()).invert();
    var lp = this._invModel.transformPoint(worldPos, this._tmpVec);

    var total = 0;
    for (var i = 0; i < MAX_PRESS; i++) {
        var s = this._slots[i];
        if (s.eased <= 0.001) continue;
        var dx = s.pos.x - lp.x;
        var dz = s.pos.z - lp.z;
        var f = smoothFalloff(Math.sqrt(dx * dx + dz * dz), this._localRadius);
        total = Math.max(total, f * s.eased);
    }

    var localSink = total * this._localDepth;
    if (localSink <= 0.0001) return out;

    // local -Y transformed into world space (rotation + scale aware)
    var m = this.entity.getWorldTransform();
    var d = m.data;
    out.set(-d[4], -d[5], -d[6]); // second basis vector (local +Y), negated
    out.normalize();

    // convert local depth back to world length along that axis
    var sc = m.getScale();
    out.mulScalar(localSink * sc.y);
    return out;
};