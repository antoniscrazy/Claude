/*
 * Object glow: a soft light halo AROUND an object (like bloom, but without post-processing).
 * Put this script on any entity that has a render component (box-like obby objects work best).
 *
 * How it stays cheap (engine v2, ShaderMaterial):
 *   - One extra mesh per object: a box slightly bigger than the object's bounding box ("shell").
 *   - Its fragment shader measures, along the view ray, how close the ray passes to the object's
 *     box (box distance field, early-out + 4-step golden-section search). Close = bright, far = transparent.
 *     So the glow hugs the object's outline from every side, with rounded corners.
 *   - Pixels whose ray hits the object itself are skipped, so the object keeps its own look.
 *   - Unlit, no fog, no light component, no shadows, no collider. Additive (premultiplied) blend,
 *     no depth write. 1 draw call per object, 0 when hidden.
 *   - All glowing objects share 1 material and 1 mesh; size / colour / fade are per mesh-instance
 *     uniforms. The pulse runs on the GPU from one time uniform set once per frame (shared with
 *     nothing else per object). An object only gets CPU work while fading / blending colour.
 *
 * Use from other scripts:
 *   const g = entity.script.skateboardObbyObjectGlow;
 *   g.setColor('gold', 0.3);  g.hide(0.5);  g.show(0.5);  g.setVisible(true);  g.isVisible();
 * Events on the entity when a fade ends: 'objectglow:shown', 'objectglow:hidden'.
 */
var SkateboardObbyObjectGlow = pc.createScript('skateboardObbyObjectGlow');

SkateboardObbyObjectGlow.attributes.add('color', {
    type: 'rgb', default: [0.72, 0.3, 1], title: 'Color'
});
SkateboardObbyObjectGlow.attributes.add('glowWidth', {
    type: 'number', default: 1, min: 0.05, title: 'Glow Width', description: 'How far the glow reaches out from the object surface (world units).'
});
SkateboardObbyObjectGlow.attributes.add('intensity', {
    type: 'number', default: 1, min: 0, max: 4, title: 'Intensity'
});
SkateboardObbyObjectGlow.attributes.add('pulseSpeed', {
    type: 'number', default: 0.5, min: 0, title: 'Pulse Speed', description: 'Slow brightness pulse (0.8 - 1.0), pulses per second. 0 = off.'
});
SkateboardObbyObjectGlow.attributes.add('glowOpacity', {
    type: 'number', default: 0.6, min: 0, max: 1, title: 'Glow Cover',
    description: '0 = pure additive glow (best on dark scenes). Higher = the glow also dims the background a little, so the colour stays visible on a bright sky.'
});

SkateboardObbyObjectGlow.COLORS = {
    red: [1, 0.12, 0.12],
    gold: [1, 0.74, 0.16],
    green: [0.2, 1, 0.32],
    blue: [0.2, 0.55, 1],
    purple: [0.72, 0.3, 1],
    white: [1, 1, 1]
};

SkateboardObbyObjectGlow.DEFAULT_FADE_TIME = 0.5;

SkateboardObbyObjectGlow.VS = `
attribute vec3 aPosition;   // unit box -1..1

uniform mat4 matrix_model;
uniform mat4 matrix_viewProjection;
uniform vec3 view_position;
uniform vec4 uGlowBox;      // xyz object half extents (local units), w glow width (world units)
uniform vec4 uGlowAnim;     // x intensity, y pulse speed, z shown (0..1)
uniform float uGlowTime;

varying vec3 vPosM;         // shell point, object space scaled to metres
varying vec3 vCamM;         // camera, same space
varying vec3 vHalfM;        // object half extents in metres
varying float vAmount;

void main(void) {
    vec3 S = vec3(length(matrix_model[0].xyz), length(matrix_model[1].xyz), length(matrix_model[2].xyz));
    vec3 halfM = uGlowBox.xyz * S;
    vec3 shellM = halfM + vec3(uGlowBox.w);
    vec3 local = aPosition * (shellM / S);
    vec4 wp = matrix_model * vec4(local, 1.0);
    gl_Position = matrix_viewProjection * wp;

    vec3 camL = (inverse(matrix_model) * vec4(view_position, 1.0)).xyz;
    vPosM = local * S;
    vCamM = camL * S;
    vHalfM = halfM;

    float phase = fract(sin(dot(matrix_model[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
    float pulse = mix(0.8, 1.0, 0.5 + 0.5 * sin(6.2831853 * (uGlowTime * uGlowAnim.y + phase)));
    vAmount = uGlowAnim.x * uGlowAnim.z * pulse;
}
`;

SkateboardObbyObjectGlow.FS = `
#include "gammaPS"

uniform vec4 uGlowBox;
uniform vec4 uGlowColor;    // rgb linear, a glow cover

varying vec3 vPosM;
varying vec3 vCamM;
varying vec3 vHalfM;
varying float vAmount;

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

void main(void) {
    float w = uGlowBox.w;
    vec3 shellM = vHalfM + vec3(w);

    // draw the side of the shell that faces the camera (back side when the camera is inside it)
    bool inside = all(lessThan(abs(vCamM), shellM));
    if (gl_FrontFacing == inside) discard;

    vec3 ro = vCamM;
    vec3 rd = normalize(vPosM - vCamM);
    vec3 inv = 1.0 / (rd + vec3(1e-6));

    // the ray hits the object itself -> leave the object as it is
    vec3 a0 = (-vHalfM - ro) * inv;
    vec3 a1 = (vHalfM - ro) * inv;
    vec3 an = min(a0, a1);
    vec3 af = max(a0, a1);
    float tin = max(max(an.x, an.y), an.z);
    float tout = min(min(af.x, af.y), af.z);
    if (tin < tout && tout > 0.0) discard;

    // part of the ray inside the shell
    vec3 b0 = (-shellM - ro) * inv;
    vec3 b1 = (shellM - ro) * inv;
    vec3 bn = min(b0, b1);
    vec3 bf = max(b0, b1);
    float t0 = max(max(max(bn.x, bn.y), bn.z), 0.0);
    float t1 = min(min(bf.x, bf.y), bf.z);
    if (t1 <= t0) discard;

    // early out: the ray passes farther than the glow width from the box's bounding sphere
    float tc = clamp(-dot(ro, rd), t0, t1);
    if (length(ro + rd * tc) - length(vHalfM) > w) discard;

    // closest approach of the ray to the object box (distance field is convex along a line)
    const float G = 0.618034;
    float a = t0;
    float b = t1;
    float c = b - G * (b - a);
    float d = a + G * (b - a);
    float fc = sdBox(ro + rd * c, vHalfM);
    float fd = sdBox(ro + rd * d, vHalfM);
    for (int i = 0; i < 4; i++) {
        if (fc < fd) {
            b = d; d = c; fd = fc;
            c = b - G * (b - a);
            fc = sdBox(ro + rd * c, vHalfM);
        } else {
            a = c; c = d; fc = fd;
            d = a + G * (b - a);
            fd = sdBox(ro + rd * d, vHalfM);
        }
    }
    float x = clamp(min(fc, fd) / w, 0.0, 1.0);
    float glow = 0.6 * pow(1.0 - x, 1.7) + 0.4 * exp(-x * x * 14.0);
    float alpha = glow * vAmount;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(gammaCorrectOutput(uGlowColor.rgb) * alpha, clamp(alpha * uGlowColor.a, 0.0, 1.0));
}
`;

SkateboardObbyObjectGlow.acquireShared = function (app) {
    let s = app._skateObjectGlowShared;
    if (s) {
        s.refs++;
        return s;
    }
    const device = app.graphicsDevice;
    s = { refs: 1, time: 0, active: new Set() };

    // unit box -1..1, outward winding
    const p = [-1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1];
    const idx = [
        0, 2, 1, 0, 3, 2,   // -z
        4, 5, 6, 4, 6, 7,   // +z
        0, 4, 7, 0, 7, 3,   // -x
        1, 2, 6, 1, 6, 5,   // +x
        0, 1, 5, 0, 5, 4,   // -y
        3, 7, 6, 3, 6, 2    // +y
    ];
    s.mesh = new pc.Mesh(device);
    s.mesh.setPositions(p);
    s.mesh.setIndices(idx);
    s.mesh.update(pc.PRIMITIVE_TRIANGLES);

    const P = SkateboardObbyObjectGlow;
    s.material = new pc.ShaderMaterial({
        uniqueName: 'SkateboardObbyObjectGlow',
        vertexGLSL: P.VS,
        fragmentGLSL: P.FS,
        attributes: { aPosition: pc.SEMANTIC_POSITION }
    });
    s.material.name = 'SkateboardObby_ObjectGlow';
    s.material.blendType = pc.BLEND_PREMULTIPLIED;   // additive while alpha (glow cover) is 0
    s.material.depthWrite = false;
    s.material.cull = pc.CULLFACE_NONE;              // the shader keeps only the camera-facing side
    s.material.setParameter('uGlowTime', 0);
    s.material.update();

    s.tick = function (dt) {
        s.time += dt;
        s.material.setParameter('uGlowTime', s.time);
        if (s.active.size) {
            for (const g of s.active) {
                if (!g._step(dt)) s.active.delete(g);
            }
        }
    };
    app.on('update', s.tick);

    app._skateObjectGlowShared = s;
    return s;
};

SkateboardObbyObjectGlow.releaseShared = function (app) {
    const s = app._skateObjectGlowShared;
    if (!s) return;
    s.refs--;
    if (s.refs > 0) return;
    app.off('update', s.tick);
    s.material.destroy();
    s.mesh.destroy();
    s.active.clear();
    app._skateObjectGlowShared = null;
};

SkateboardObbyObjectGlow.toColor = function (c) {
    if (c === null || c === undefined) return null;
    if (c instanceof pc.Color) return c;
    if (typeof c === 'string') {
        const named = SkateboardObbyObjectGlow.COLORS[c.toLowerCase()];
        if (named) return new pc.Color(named[0], named[1], named[2]);
        return new pc.Color().fromString(c);
    }
    if (Array.isArray(c) || ArrayBuffer.isView(c)) return new pc.Color(c[0], c[1], c[2]);
    if (typeof c.r === 'number') return new pc.Color(c.r, c.g, c.b);
    return null;
};

// ---------------------------------------------------------------------------------------------

SkateboardObbyObjectGlow.prototype.initialize = function () {
    this._shared = SkateboardObbyObjectGlow.acquireShared(this.app);

    this._color = new Float32Array(4);
    this._colorFrom = new Float32Array(3);
    this._colorTo = new Float32Array(3);
    this._colorT = 1;
    this._colorDur = 0;
    this._targetColor = new pc.Color();
    this._box = new Float32Array(4);
    this._anim = new Float32Array(4);
    this._aabb = new pc.BoundingBox();
    this._objAabb = null;

    this._shown = 1;
    this._showSpeed = 0;
    this._wantVisible = true;

    this._fx = new pc.Entity('ObjectGlowFX');
    this.entity.addChild(this._fx);
    this._mi = new pc.MeshInstance(this._shared.mesh, this._shared.material, this._fx);
    this._mi.setParameter('uGlowColor', this._color);
    this._mi.setParameter('uGlowBox', this._box);
    this._mi.setParameter('uGlowAnim', this._anim);
    this._fx.addComponent('render', {
        meshInstances: [this._mi],
        castShadows: false,
        castShadowsLightmap: false,
        receiveShadows: false,
        lightmapped: false
    });
    this._fx.enabled = false;            // until the object's size is known

    this._color[3] = pc.math.clamp(this.glowOpacity, 0, 1);
    this.setColor(this.color, 0);
    this._writeAnim();
    this._waitingForMesh = !this._readObjectBox();
    if (this._waitingForMesh) this._shared.active.add(this);   // e.g. render asset still loading

    this.on('attr', this._onAttr, this);
    this.on('enable', this._applyVisibility, this);
    this.on('disable', this._applyVisibility, this);
    this.on('destroy', this._onDestroy, this);
};

// size of the object in its own local space, from its render mesh instances
SkateboardObbyObjectGlow.prototype._readObjectBox = function () {
    const r = this.entity.render;
    const mis = r && r.meshInstances;
    if (!mis || !mis.length) return false;
    let box = null;
    for (const mi of mis) {
        if (!mi.mesh || mi === this._mi) continue;
        if (!box) box = mi.mesh.aabb.clone();
        else box.add(mi.mesh.aabb);
    }
    if (!box) return false;
    this._objAabb = box;
    this._fx.setLocalPosition(box.center);
    this._writeBox();
    this._applyVisibility();
    return true;
};

SkateboardObbyObjectGlow.prototype._writeBox = function () {
    if (!this._objAabb) return;
    const he = this._objAabb.halfExtents;
    const w = Math.max(0.05, this.glowWidth);
    this._box[0] = he.x;
    this._box[1] = he.y;
    this._box[2] = he.z;
    this._box[3] = w;
    // culling box in the fx node's local space (glow width converted with the entity scale)
    const s = this.entity.getScale();
    this._aabb.center.set(0, 0, 0);
    this._aabb.halfExtents.set(he.x + w / Math.max(1e-4, Math.abs(s.x)), he.y + w / Math.max(1e-4, Math.abs(s.y)), he.z + w / Math.max(1e-4, Math.abs(s.z)));
    this._mi.setCustomAabb(this._aabb);
};

SkateboardObbyObjectGlow.prototype._onAttr = function (name, value) {
    if (name === 'color') this.setColor(value, 0);
    else if (name === 'glowWidth') this._writeBox();
    else if (name === 'glowOpacity') this._color[3] = pc.math.clamp(value, 0, 1);
    else this._writeAnim();
};

SkateboardObbyObjectGlow.prototype._onDestroy = function () {
    if (this._shared) {
        this._shared.active.delete(this);
        SkateboardObbyObjectGlow.releaseShared(this.app);
        this._shared = null;
    }
    if (this._fx && !this.entity._destroying) this._fx.destroy();
    this._fx = null;
};

// ---- public API -----------------------------------------------------------------------------

SkateboardObbyObjectGlow.prototype.setColor = function (color, duration) {
    const c = SkateboardObbyObjectGlow.toColor(color);
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

SkateboardObbyObjectGlow.prototype.getColor = function () {
    return this._targetColor.clone();
};

SkateboardObbyObjectGlow.prototype.show = function (duration) {
    this.setVisible(true, duration);
};

SkateboardObbyObjectGlow.prototype.hide = function (duration) {
    this.setVisible(false, duration);
};

SkateboardObbyObjectGlow.prototype.isVisible = function () {
    return this._wantVisible;
};

SkateboardObbyObjectGlow.prototype.setVisible = function (visible, duration) {
    if (duration === undefined || duration === null) duration = SkateboardObbyObjectGlow.DEFAULT_FADE_TIME;
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
        this.entity.fire(visible ? 'objectglow:shown' : 'objectglow:hidden', this);
        return;
    }
    this._showSpeed = (visible ? 1 : -1) / duration;
    this._applyVisibility();
    this._shared.active.add(this);
};

// ---- internals ------------------------------------------------------------------------------

SkateboardObbyObjectGlow.prototype._step = function (dt) {
    if (!this._fx) return false;

    if (this._waitingForMesh) this._waitingForMesh = !this._readObjectBox();

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
            ended = 'objectglow:shown';
        } else if (this._showSpeed < 0 && this._shown <= 0) {
            this._shown = 0;
            this._showSpeed = 0;
            ended = 'objectglow:hidden';
            if (this._colorT < 1) { this._color.set(this._colorTo); this._colorT = 1; }
        }
        this._writeAnim();
        if (ended) {
            this._applyVisibility();
            this.entity.fire(ended, this);
        }
    }

    return this._waitingForMesh || this._showSpeed !== 0 || this._colorT < 1;
};

SkateboardObbyObjectGlow.prototype._applyVisibility = function () {
    if (!this._fx) return;
    const on = this.enabled && !!this._objAabb && (this._shown > 0 || this._showSpeed > 0);
    if (this._fx.enabled !== on) this._fx.enabled = on;
};

SkateboardObbyObjectGlow.prototype._writeAnim = function () {
    const s = this._shown;
    this._anim[0] = Math.max(0, this.intensity);
    this._anim[1] = Math.max(0, this.pulseSpeed);
    this._anim[2] = s * s * (3 - 2 * s);
    this._anim[3] = 0;
};
