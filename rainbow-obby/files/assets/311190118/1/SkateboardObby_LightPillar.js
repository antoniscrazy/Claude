/*
 * Light pillar: a glowing beam from the ground up into the sky (checkpoint / finish marker).
 * Template: GameModes/Skateboard/Templates/SkateboardObby_LightPillar
 *
 * Made to be cheap on mobile (engine v2, ShaderMaterial, no post-process bloom):
 *   core - thin open cylinder, unlit, opaque, writes depth. No lights, no fog, no shadows.
 *          White-hot in the middle, pure colour at the edges.
 *   halo - one quad that is turned to the camera around the pillar axis IN THE VERTEX SHADER
 *          (Y-axis billboard, no per-frame script work). Additive (premultiplied blend, see Glow Cover),
 *          no depth write.
 *          Soft gradient from a tiny texture made in code (R = across, G = streaks scrolling up).
 *   => 2 draw calls per visible pillar, 0 when hidden. No light component, no collider.
 *
 * All pillars share the same 2 materials, 2 meshes and 1 texture. Colour / size / fade are per
 * mesh-instance uniforms. Pulse and UV scroll are done on the GPU from one time uniform that is
 * set once per frame on the 2 shared materials (not per pillar). A pillar only gets per-frame
 * work while it is fading in/out or changing colour.
 *
 * Use from other scripts:
 *   const p = entity.script.skateboardObbyLightPillar;
 *   p.setColor('#ffcc33');            // pc.Color | [r,g,b] | '#rrggbb' | 'red' / 'gold' / 'green' ...
 *   p.setColor(pc.Color.GREEN, 0.4);  // optional blend time in seconds
 *   p.hide(0.6);  p.show(0.6);        // fade out / in (seconds, default 0.5, 0 = instant)
 *   p.setVisible(false, 0.6);  p.isVisible();
 * Events fired on the entity when a fade ends: 'lightpillar:shown', 'lightpillar:hidden'.
 */
var SkateboardObbyLightPillar = pc.createScript('skateboardObbyLightPillar');

SkateboardObbyLightPillar.attributes.add('color', {
    type: 'rgb', default: [1, 0.12, 0.12], title: 'Color'
});
SkateboardObbyLightPillar.attributes.add('height', {
    type: 'number', default: 100, min: 1, title: 'Height', description: 'Beam height from the entity position upwards (world units). The top fades out.'
});
SkateboardObbyLightPillar.attributes.add('coreRadius', {
    type: 'number', default: 0.22, min: 0.01, title: 'Core Radius', description: 'Radius of the solid bright core.'
});
SkateboardObbyLightPillar.attributes.add('glowWidth', {
    type: 'number', default: 1.6, min: 0, title: 'Glow Width', description: 'How far the soft glow reaches past the core edge (world units).'
});
SkateboardObbyLightPillar.attributes.add('intensity', {
    type: 'number', default: 1, min: 0, max: 4, title: 'Intensity', description: 'Brightness of the core and the glow.'
});
SkateboardObbyLightPillar.attributes.add('pulseSpeed', {
    type: 'number', default: 0.5, min: 0, title: 'Pulse Speed', description: 'Slow brightness pulse (0.85 - 1.0), pulses per second. 0 = off.'
});
SkateboardObbyLightPillar.attributes.add('scrollSpeed', {
    type: 'number', default: 2, title: 'Scroll Speed', description: 'Glow streaks moving up the beam (world units per second). 0 = off, negative = down.'
});
SkateboardObbyLightPillar.attributes.add('fadeDistance', {
    type: 'number', default: 3, min: 0, title: 'Near Fade Distance',
    description: 'When the camera gets closer than this to the beam axis, the pillar fades away (fully gone at 1/3 of it), so riding through it does not fill the screen. 0 = off.'
});
SkateboardObbyLightPillar.attributes.add('glowOpacity', {
    type: 'number', default: 0.6, min: 0, max: 1, title: 'Glow Cover',
    description: '0 = pure additive glow (best on dark scenes). Higher = the glow also covers the background a little, so the colour stays visible on a bright sky. Same cost.'
});

// colour names accepted by setColor()
SkateboardObbyLightPillar.COLORS = {
    red: [1, 0.12, 0.12],
    gold: [1, 0.74, 0.16],
    green: [0.2, 1, 0.32],
    blue: [0.2, 0.55, 1],
    purple: [0.72, 0.3, 1],
    white: [1, 1, 1]
};

SkateboardObbyLightPillar.DEFAULT_FADE_TIME = 0.5;

// ---------------------------------------------------------------------------------------------
// shared resources (one set per app, ref counted, freed when the last pillar is destroyed)
// ---------------------------------------------------------------------------------------------

SkateboardObbyLightPillar.CORE_VS = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 matrix_model;
uniform mat4 matrix_viewProjection;
uniform vec3 view_position;
uniform vec4 uPillarDims;   // x core radius, y glow radius, z height, w near fade distance
uniform vec4 uPillarAnim;   // x intensity, y pulse speed, z scroll speed, w shown (0..1)
uniform float uPillarTime;

varying vec3 vPosW;
varying vec3 vNormalW;
varying vec3 vAxisW;
varying float vPulse;

void main(void) {
    vec3 base = matrix_model[3].xyz;
    vec3 axis = matrix_model[1].xyz;
    vec3 upN = normalize(axis);
    vec3 toCam = view_position - base;
    toCam -= upN * dot(toCam, upN);
    float d = length(toCam);
    float sx = length(matrix_model[0].xyz);

    float nearFade = uPillarDims.w > 0.0 ? smoothstep(uPillarDims.w * 0.33, uPillarDims.w, d / sx) : 1.0;
    float h = aPosition.y;
    float taper = 1.0 - smoothstep(0.4, 0.95, h);
    // keep at least ~1 pixel wide far away so the core does not flicker
    float r = max(uPillarDims.x, d * 0.0016 / sx) * taper * uPillarAnim.w * nearFade;

    vec4 wp = matrix_model * vec4(aPosition.x * r, h * uPillarDims.z, aPosition.z * r, 1.0);
    vPosW = wp.xyz;
    vNormalW = normalize(mat3(matrix_model) * aNormal);
    vAxisW = upN;

    float phase = fract(sin(dot(base.xz, vec2(12.9898, 78.233))) * 43758.5453);
    vPulse = mix(0.85, 1.0, 0.5 + 0.5 * sin(6.2831853 * (uPillarTime * uPillarAnim.y + phase)));

    gl_Position = matrix_viewProjection * wp;
}
`;

SkateboardObbyLightPillar.CORE_FS = `
#include "gammaPS"

uniform vec3 view_position;
uniform vec4 uPillarColor;  // rgb linear, a glow cover
uniform vec4 uPillarAnim;

varying vec3 vPosW;
varying vec3 vNormalW;
varying vec3 vAxisW;
varying float vPulse;

void main(void) {
    vec3 v = view_position - vPosW;
    v -= vAxisW * dot(v, vAxisW);
    float ndv = abs(dot(normalize(vNormalW), normalize(v + vec3(0.0, 1e-5, 0.0))));
    // flat white-hot middle, pure colour only at the edges (reads as light, not as a shaded tube)
    float hot = 0.08 + 0.55 * smoothstep(0.35, 0.9, ndv);
    vec3 col = mix(uPillarColor.rgb, vec3(1.0), hot);
    col *= uPillarAnim.x * vPulse;
    gl_FragColor = vec4(gammaCorrectOutput(col), 1.0);
}
`;

SkateboardObbyLightPillar.HALO_VS = `
attribute vec3 aPosition;   // x -1..1 across, y 0..1 along
attribute vec2 aUv0;

uniform mat4 matrix_model;
uniform mat4 matrix_viewProjection;
uniform vec3 view_position;
uniform vec4 uPillarDims;
uniform vec4 uPillarAnim;
uniform float uPillarTime;

varying vec2 vGlowUv;
varying vec2 vAlong;        // x 0..1 along the beam, y world units from the base
varying float vAmount;

void main(void) {
    vec3 base = matrix_model[3].xyz;
    vec3 axis = matrix_model[1].xyz;
    vec3 upN = normalize(axis);
    float sx = length(matrix_model[0].xyz);

    // turn the quad to the camera around the pillar axis
    vec3 toCam = view_position - base;
    toCam -= upN * dot(toCam, upN);
    float d = length(toCam);
    vec3 side = d > 1e-4 ? cross(upN, toCam / d) : normalize(matrix_model[0].xyz);

    // keep a few pixels of glow far away, so the beam still reads as a bright line
    float halfW = max(uPillarDims.y * sx, d * 0.008);
    float lenW = uPillarDims.z * length(axis);
    vec3 wp = base + side * (aPosition.x * halfW) + upN * (aPosition.y * lenW);
    gl_Position = matrix_viewProjection * vec4(wp, 1.0);

    float tile = max(uPillarDims.y * 8.0, 2.0);
    vGlowUv = vec2(aUv0.x, (aPosition.y * uPillarDims.z) / tile - fract(uPillarTime * uPillarAnim.z / tile));
    vAlong = vec2(aPosition.y, aPosition.y * uPillarDims.z);

    float nearFade = uPillarDims.w > 0.0 ? smoothstep(uPillarDims.w * 0.33, uPillarDims.w, d / sx) : 1.0;
    float phase = fract(sin(dot(base.xz, vec2(12.9898, 78.233))) * 43758.5453);
    float pulse = mix(0.85, 1.0, 0.5 + 0.5 * sin(6.2831853 * (uPillarTime * uPillarAnim.y + phase)));
    vAmount = uPillarAnim.x * uPillarAnim.w * nearFade * pulse;
}
`;

SkateboardObbyLightPillar.HALO_FS = `
#include "gammaPS"

uniform sampler2D uGlowMap;
uniform vec4 uPillarColor;  // rgb linear, a glow cover

varying vec2 vGlowUv;
varying vec2 vAlong;
varying float vAmount;

void main(void) {
    float across = texture2D(uGlowMap, vec2(vGlowUv.x, 0.5)).r;
    float streak = texture2D(uGlowMap, vGlowUv).g;
    float along = (1.0 - smoothstep(0.45, 1.0, vAlong.x)) * (1.0 + 0.35 * (1.0 - smoothstep(0.0, 2.5, vAlong.y)));
    float a = across * (0.82 + 0.3 * streak) * along * vAmount;
    // premultiplied: rgb is added, alpha (glow cover) dims the background a bit. alpha 0 = pure additive.
    gl_FragColor = vec4(gammaCorrectOutput(uPillarColor.rgb) * a, clamp(a * uPillarColor.a, 0.0, 1.0));
}
`;

SkateboardObbyLightPillar.acquireShared = function (app) {
    let s = app._skateLightPillarShared;
    if (s) {
        s.refs++;
        return s;
    }

    const device = app.graphicsDevice;
    s = { refs: 1, time: 0, active: new Set() };

    // core: open cylinder, radius 1, y 0..1, rings packed near the top for the taper
    {
        const seg = 12;
        const rings = [0, 0.4, 0.55, 0.7, 0.82, 0.92, 1];
        const pos = [], nrm = [], idx = [];
        for (let r = 0; r < rings.length; r++) {
            for (let i = 0; i < seg; i++) {
                const a = i / seg * Math.PI * 2;
                const x = Math.cos(a), z = Math.sin(a);
                pos.push(x, rings[r], z);
                nrm.push(x, 0, z);
            }
        }
        for (let r = 0; r < rings.length - 1; r++) {
            for (let i = 0; i < seg; i++) {
                const a0 = r * seg + i, a1 = r * seg + (i + 1) % seg;
                const b0 = a0 + seg, b1 = a1 + seg;
                idx.push(a0, b0, a1, a1, b0, b1);
            }
        }
        s.coreMesh = new pc.Mesh(device);
        s.coreMesh.setPositions(pos);
        s.coreMesh.setNormals(nrm);
        s.coreMesh.setIndices(idx);
        s.coreMesh.update(pc.PRIMITIVE_TRIANGLES);
    }

    // halo: one quad, x -1..1, y 0..1 (expanded / turned in the vertex shader)
    {
        s.haloMesh = new pc.Mesh(device);
        s.haloMesh.setPositions([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0]);
        s.haloMesh.setUvs(0, [0, 0, 1, 0, 1, 1, 0, 1]);
        s.haloMesh.setIndices([0, 1, 2, 0, 2, 3]);
        s.haloMesh.update(pc.PRIMITIVE_TRIANGLES);
    }

    // glow texture 64x64: R = soft falloff across the beam, G = streaks (tile vertically)
    {
        const W = 64, H = 64;
        s.glowTexture = new pc.Texture(device, {
            name: 'SkateboardObby_LightPillarGlow',
            width: W, height: H,
            format: pc.PIXELFORMAT_RGBA8,
            mipmaps: true,
            minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
            magFilter: pc.FILTER_LINEAR,
            addressU: pc.ADDRESS_CLAMP_TO_EDGE,
            addressV: pc.ADDRESS_REPEAT
        });
        const px = s.glowTexture.lock();
        const TAU = Math.PI * 2;
        for (let y = 0; y < H; y++) {
            const v = y / H;
            for (let x = 0; x < W; x++) {
                const u = (x + 0.5) / W;
                const t = Math.min(1, Math.abs(u * 2 - 1));
                // bright centre + long soft tail, exactly 0 at the quad edge
                const across = 0.45 * Math.exp(-Math.pow(t / 0.2, 2)) + 0.55 * Math.pow(1 - t, 1.8);
                const n1 = 0.5 + 0.5 * Math.sin(TAU * (2 * v + 0.22 * Math.sin(TAU * u)));
                const n2 = 0.5 + 0.5 * Math.sin(TAU * (3 * v + 0.5 + 0.15 * Math.cos(TAU * 2 * u)));
                const streak = 0.55 * n1 + 0.45 * n2;
                const o = (y * W + x) * 4;
                px[o] = Math.round(Math.min(1, across) * 255);
                px[o + 1] = Math.round(streak * 255);
                px[o + 2] = 0;
                px[o + 3] = 255;
            }
        }
        s.glowTexture.unlock();
    }

    const P = SkateboardObbyLightPillar;

    s.coreMat = new pc.ShaderMaterial({
        uniqueName: 'SkateboardObbyLightPillarCore',
        vertexGLSL: P.CORE_VS,
        fragmentGLSL: P.CORE_FS,
        attributes: { aPosition: pc.SEMANTIC_POSITION, aNormal: pc.SEMANTIC_NORMAL }
    });
    s.coreMat.name = 'SkateboardObby_LightPillarCore';
    s.coreMat.blendType = pc.BLEND_NONE;
    s.coreMat.depthWrite = true;
    s.coreMat.cull = pc.CULLFACE_BACK;
    s.coreMat.setParameter('uPillarTime', 0);
    s.coreMat.update();

    s.haloMat = new pc.ShaderMaterial({
        uniqueName: 'SkateboardObbyLightPillarHalo',
        vertexGLSL: P.HALO_VS,
        fragmentGLSL: P.HALO_FS,
        attributes: { aPosition: pc.SEMANTIC_POSITION, aUv0: pc.SEMANTIC_TEXCOORD0 }
    });
    s.haloMat.name = 'SkateboardObby_LightPillarHalo';
    s.haloMat.blendType = pc.BLEND_PREMULTIPLIED;   // ONE, ONE_MINUS_SRC_ALPHA: additive while alpha is 0
    s.haloMat.depthWrite = false;
    s.haloMat.cull = pc.CULLFACE_NONE;
    s.haloMat.setParameter('uGlowMap', s.glowTexture);
    s.haloMat.setParameter('uPillarTime', 0);
    s.haloMat.update();

    // one tick per frame for all pillars
    s.tick = function (dt) {
        s.time += dt;
        s.coreMat.setParameter('uPillarTime', s.time);
        s.haloMat.setParameter('uPillarTime', s.time);
        if (s.active.size) {
            for (const p of s.active) {
                if (!p._step(dt)) s.active.delete(p);
            }
        }
    };
    app.on('update', s.tick);

    app._skateLightPillarShared = s;
    return s;
};

SkateboardObbyLightPillar.releaseShared = function (app) {
    const s = app._skateLightPillarShared;
    if (!s) return;
    s.refs--;
    if (s.refs > 0) return;
    app.off('update', s.tick);
    s.coreMat.destroy();
    s.haloMat.destroy();
    s.coreMesh.destroy();
    s.haloMesh.destroy();
    s.glowTexture.destroy();
    s.active.clear();
    app._skateLightPillarShared = null;
};

// ---------------------------------------------------------------------------------------------
// instance
// ---------------------------------------------------------------------------------------------

SkateboardObbyLightPillar.prototype.initialize = function () {
    const P = SkateboardObbyLightPillar;
    this._shared = P.acquireShared(this.app);

    this._color = new Float32Array(4);      // current colour (linear) + glow cover
    this._colorFrom = new Float32Array(3);
    this._colorTo = new Float32Array(3);
    this._colorT = 1;
    this._colorDur = 0;
    this._targetColor = new pc.Color();
    this._dims = new Float32Array(4);
    this._anim = new Float32Array(4);
    this._aabb = new pc.BoundingBox();

    this._shown = 1;         // 0..1
    this._showSpeed = 0;     // per second, + fading in, - fading out
    this._wantVisible = true;

    // the meshes live on a child entity made at runtime (the template itself has only this script)
    this._fx = new pc.Entity('LightPillarFX');
    this.entity.addChild(this._fx);
    this._coreMI = new pc.MeshInstance(this._shared.coreMesh, this._shared.coreMat, this._fx);
    this._haloMI = new pc.MeshInstance(this._shared.haloMesh, this._shared.haloMat, this._fx);
    for (const mi of [this._coreMI, this._haloMI]) {
        mi.setParameter('uPillarColor', this._color);
        mi.setParameter('uPillarDims', this._dims);
        mi.setParameter('uPillarAnim', this._anim);
    }
    this._fx.addComponent('render', {
        meshInstances: [this._coreMI, this._haloMI],
        castShadows: false,
        castShadowsLightmap: false,
        receiveShadows: false,
        lightmapped: false
    });

    this._color[3] = pc.math.clamp(this.glowOpacity, 0, 1);
    this.setColor(this.color, 0);
    this._writeDims();
    this._writeAnim();

    this.on('attr', this._onAttr, this);
    this.on('enable', this._applyVisibility, this);
    this.on('disable', this._applyVisibility, this);
    this.on('destroy', this._onDestroy, this);
};

SkateboardObbyLightPillar.prototype._onAttr = function (name, value) {
    if (name === 'color') this.setColor(value, 0);
    else if (name === 'height' || name === 'coreRadius' || name === 'glowWidth' || name === 'fadeDistance') this._writeDims();
    else if (name === 'glowOpacity') this._color[3] = pc.math.clamp(value, 0, 1);
    else this._writeAnim();
};

SkateboardObbyLightPillar.prototype._onDestroy = function () {
    if (this._shared) {
        this._shared.active.delete(this);
        SkateboardObbyLightPillar.releaseShared(this.app);
        this._shared = null;
    }
    // when the whole entity is destroyed the child goes with it; only the script removed -> clean up
    if (this._fx && !this.entity._destroying) this._fx.destroy();
    this._fx = null;
};

// ---- public API -----------------------------------------------------------------------------

// color: pc.Color | [r,g,b] | '#rrggbb' | name from SkateboardObbyLightPillar.COLORS
SkateboardObbyLightPillar.prototype.setColor = function (color, duration) {
    const c = SkateboardObbyLightPillar.toColor(color);
    if (!c) return;
    this._targetColor.copy(c);
    const lin = this._colorTo;
    lin[0] = Math.pow(c.r, 2.2);
    lin[1] = Math.pow(c.g, 2.2);
    lin[2] = Math.pow(c.b, 2.2);
    if (duration > 0 && this._shown > 0) {
        this._colorFrom.set(this._color.subarray(0, 3));
        this._colorT = 0;
        this._colorDur = duration;
        this._shared.active.add(this);
    } else {
        this._color.set(lin);
        this._colorT = 1;
    }
};

SkateboardObbyLightPillar.prototype.getColor = function () {
    return this._targetColor.clone();
};

SkateboardObbyLightPillar.prototype.show = function (duration) {
    this.setVisible(true, duration);
};

SkateboardObbyLightPillar.prototype.hide = function (duration) {
    this.setVisible(false, duration);
};

SkateboardObbyLightPillar.prototype.isVisible = function () {
    return this._wantVisible;
};

SkateboardObbyLightPillar.prototype.setVisible = function (visible, duration) {
    if (duration === undefined || duration === null) duration = SkateboardObbyLightPillar.DEFAULT_FADE_TIME;
    this._wantVisible = !!visible;
    const target = visible ? 1 : 0;
    if (this._shown === target) {
        this._showSpeed = 0;
        this._applyVisibility();
        return;
    }
    if (duration <= 0) {
        this._shown = target;
        this._showSpeed = 0;
        this._writeAnim();
        this._applyVisibility();
        this.entity.fire(visible ? 'lightpillar:shown' : 'lightpillar:hidden', this);
        return;
    }
    this._showSpeed = (visible ? 1 : -1) / duration;
    this._applyVisibility();
    this._shared.active.add(this);
};

// ---- internals ------------------------------------------------------------------------------

SkateboardObbyLightPillar.toColor = function (c) {
    if (c === null || c === undefined) return null;
    if (c instanceof pc.Color) return c;
    if (typeof c === 'string') {
        const named = SkateboardObbyLightPillar.COLORS[c.toLowerCase()];
        if (named) return new pc.Color(named[0], named[1], named[2]);
        return new pc.Color().fromString(c);
    }
    if (Array.isArray(c) || ArrayBuffer.isView(c)) return new pc.Color(c[0], c[1], c[2]);
    if (typeof c.r === 'number') return new pc.Color(c.r, c.g, c.b);
    return null;
};

// called by the shared tick only while fading / blending colour; returns true while still busy
SkateboardObbyLightPillar.prototype._step = function (dt) {
    if (!this._fx) return false;

    if (this._colorT < 1) {
        this._colorT = Math.min(1, this._colorT + dt / this._colorDur);
        const t = this._colorT * this._colorT * (3 - 2 * this._colorT);
        for (let i = 0; i < 3; i++) this._color[i] = this._colorFrom[i] + (this._colorTo[i] - this._colorFrom[i]) * t;
    }

    if (this._showSpeed !== 0) {
        this._shown += this._showSpeed * dt;
        let ended = null;
        if (this._showSpeed > 0 && this._shown >= 1) {
            this._shown = 1;
            this._showSpeed = 0;
            ended = 'lightpillar:shown';
        } else if (this._showSpeed < 0 && this._shown <= 0) {
            this._shown = 0;
            this._showSpeed = 0;
            ended = 'lightpillar:hidden';
            // finish a pending colour blend at once, nothing to see
            if (this._colorT < 1) { this._color.set(this._colorTo); this._colorT = 1; }
        }
        this._writeAnim();
        if (ended) {
            this._applyVisibility();
            this.entity.fire(ended, this);
        }
    }

    return this._showSpeed !== 0 || this._colorT < 1;
};

SkateboardObbyLightPillar.prototype._applyVisibility = function () {
    if (!this._fx) return;
    const on = this.enabled && (this._shown > 0 || this._showSpeed > 0);
    if (this._fx.enabled !== on) this._fx.enabled = on;
};

SkateboardObbyLightPillar.prototype._writeDims = function () {
    const core = Math.max(0.01, this.coreRadius);
    const glow = core + Math.max(0, this.glowWidth);
    const h = Math.max(0.1, this.height);
    this._dims[0] = core;
    this._dims[1] = glow;
    this._dims[2] = h;
    this._dims[3] = Math.max(0, this.fadeDistance);

    // the vertex shader moves the vertices, so the meshes get a custom bounding box
    const r = glow * 1.5 + 1;
    this._aabb.center.set(0, h * 0.5, 0);
    this._aabb.halfExtents.set(r, h * 0.5, r);
    this._coreMI.setCustomAabb(this._aabb);
    this._haloMI.setCustomAabb(this._aabb);
};

SkateboardObbyLightPillar.prototype._writeAnim = function () {
    const s = this._shown;
    this._anim[0] = Math.max(0, this.intensity);
    this._anim[1] = Math.max(0, this.pulseSpeed);
    this._anim[2] = this.scrollSpeed;
    this._anim[3] = s * s * (3 - 2 * s);
};
