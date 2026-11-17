// Procedural mechanical arms. Everything is computed from the body entity's position and rotation, so the same
// script can run on a remote player later (no input, no controller access). Physics reads `attached`.
// All arms of all players are drawn by one shared instanced batch (SpiderObby_ArmBatch): 4 draw calls in total.
var SpiderObbyArms = pc.createScript('spiderObbyArms');

SpiderObbyArms.attributes.add('body', { type: 'entity', title: 'Body', description: 'Rotated body entity; the arms leave from its back.' });
SpiderObbyArms.attributes.add('armCount', { type: 'number', default: 4, min: 1, max: 12, precision: 0, title: 'Arm Count' });
SpiderObbyArms.attributes.add('armReach', { type: 'number', default: 11, title: 'Arm Reach', description: 'A planted arm lets go beyond this distance (m). The longest stretch.' });
SpiderObbyArms.attributes.add('grabReach', { type: 'number', default: 9, title: 'Grab Reach', description: 'New grabs reach this far (m).' });
SpiderObbyArms.attributes.add('armLength', { type: 'number', default: 7.5, title: 'Arm Length', description: 'Beyond this distance the arm is a straight line; shorter arms arc.' });
SpiderObbyArms.attributes.add('footSpread', { type: 'number', default: 3.4, title: 'Foot Spread', description: 'Distance of a resting hand from the body, along the surface (m).' });
SpiderObbyArms.attributes.add('leadTime', { type: 'number', default: 0.2, title: 'Lead Time', description: 'New hands land this many seconds ahead of the motion.' });
SpiderObbyArms.attributes.add('stepDistance', { type: 'number', default: 7, title: 'Step Distance', description: 'A hand farther than this steps to a new point (m).' });
SpiderObbyArms.attributes.add('stepBehind', { type: 'number', default: 3, title: 'Step Behind', description: 'A hand this far behind the motion steps (m).' });
SpiderObbyArms.attributes.add('stepTime', { type: 'number', default: 0.13, title: 'Step Time', description: 'Seconds for a 6 m step.' });
SpiderObbyArms.attributes.add('stepArc', { type: 'number', default: 1.5, title: 'Step Arc', description: 'Height of the step arc (m).' });
SpiderObbyArms.attributes.add('minStepGap', { type: 'number', default: 0.03, title: 'Min Step Gap', description: 'Seconds between two arms lifting: they never all lift together.' });
SpiderObbyArms.attributes.add('raysPerFrame', { type: 'number', default: 2, precision: 0, title: 'Rays Per Frame', description: 'Hand target rays per frame, shared by the arms in turn.' });
SpiderObbyArms.attributes.add('segments', { type: 'number', default: 16, precision: 0, title: 'Segments Per Arm' });
SpiderObbyArms.attributes.add('armRadius', { type: 'number', default: 0.17, title: 'Arm Radius' });
SpiderObbyArms.attributes.add('clawScale', { type: 'number', default: 0.85, title: 'Claw Scale' });
SpiderObbyArms.attributes.add('mountHeight', { type: 'number', default: 0.45, title: 'Mount Height', description: 'Center of the back plate above the body entity (m).' });
SpiderObbyArms.attributes.add('mountBack', { type: 'number', default: 0.5, title: 'Mount Back', description: 'Back plate behind the body entity (m).' });
SpiderObbyArms.attributes.add('rootRadius', { type: 'number', default: 0.55, title: 'Root Radius', description: 'Shoulders sit on a circle this big on the back plate; grows by itself when there are many arms (m).' });
SpiderObbyArms.attributes.add('handGap', { type: 'number', default: 2.2, title: 'Hand Gap', description: 'A new hand does not land closer than this to another hand (m); 3/4 of it if there is no room.' });
SpiderObbyArms.attributes.add('separationPasses', { type: 'number', default: 4, precision: 0, title: 'Separation Passes', description: 'Times per frame the arm curves are pushed apart. 0 = off.' });
SpiderObbyArms.attributes.add('bodyRadius', { type: 'number', default: 0.42, title: 'Body Radius', description: 'Arms go around a vertical capsule this thick (m).' });
SpiderObbyArms.attributes.add('stowRadius', { type: 'number', default: 1.7, title: 'Stow Radius', description: 'Hands wait this far from the body when there is nothing to hold (m).' });
SpiderObbyArms.attributes.add('cameraHideDistance', { type: 'number', default: 1.5, title: 'Camera Hide Distance', description: 'Arm pieces this close to the camera are not drawn (they would cover the view).' });
SpiderObbyArms.attributes.add('hookHandGap', { type: 'number', default: 0.8, title: 'Hook Hand Gap', description: 'Distance between the two hands on a hook (m).' });
SpiderObbyArms.attributes.add('hookReachTime', { type: 'number', default: 0.1, title: 'Hook Reach Time', description: 'Seconds for a hand to reach the hook.' });
SpiderObbyArms.attributes.add('heatStart', { type: 'number', default: 0.5, title: 'Heat Start', description: 'Grip ratio where the shaking and straining start.' });
SpiderObbyArms.attributes.add('heatFull', { type: 'number', default: 0.15, title: 'Heat Full', description: 'Grip ratio where the arms are fully red.' });
SpiderObbyArms.attributes.add('redAt90', { type: 'number', default: 0.2, title: 'Red At 90%', description: 'Redness (0..1) at 90% grip. It grows all the way from a full bar.' });
SpiderObbyArms.attributes.add('redAtStart', { type: 'number', default: 0.5, title: 'Red At Heat Start', description: 'Redness (0..1) when the grip reaches Heat Start.' });
SpiderObbyArms.attributes.add('tremorAmplitude', { type: 'number', default: 0.13, title: 'Tremor Amplitude', description: 'Shaking of the middle of the arm at grip 0 (m). The hands do not move.' });
SpiderObbyArms.attributes.add('strainPulse', { type: 'number', default: 0.3, title: 'Strain Pulse', description: 'Thickness wave running down the arm when fully red (share of the radius).' });
SpiderObbyArms.attributes.add('strainTaut', { type: 'number', default: 0.2, title: 'Strain Taut', description: 'The arm arcs this much less when fully red.' });
SpiderObbyArms.attributes.add('bodyShake', { type: 'number', default: 0.025, title: 'Body Shake', description: 'Shaking of the body model at grip 0 (m). The camera does not follow it.' });
SpiderObbyArms.attributes.add('fireEvents', { type: 'boolean', default: true, title: 'Fire Events', description: 'spider:step events (local player only).' });
// a real model replaces the primitives from here. Segment mesh: unit length along Y, unit radius. Claw mesh: hand on the surface at y 0, wrist at y 0.55, +Y away from the surface.
SpiderObbyArms.attributes.add('segmentRender', { type: 'asset', assetType: 'render', title: 'Segment Model' });
SpiderObbyArms.attributes.add('clawRender', { type: 'asset', assetType: 'render', title: 'Claw Model' });
SpiderObbyArms.attributes.add('materialRed', { type: 'asset', assetType: 'material', title: 'Material Red' });
SpiderObbyArms.attributes.add('materialWhite', { type: 'asset', assetType: 'material', title: 'Material White' });
SpiderObbyArms.attributes.add('materialBlack', { type: 'asset', assetType: 'material', title: 'Material Black' });
SpiderObbyArms.attributes.add('materialClaw', { type: 'asset', assetType: 'material', title: 'Material Claw' });

// ---------------------------------------------------------------- shared instanced batch
var SpiderObby_ArmBatch = (function () {
    const RED = 0, WHITE = 1, BLACK = 2, CLAW = 3;

    function latheMesh(device, sides, profile) {
        const positions = [], normals = [], uvs = [], indices = [];
        for (let r = 0; r < profile.length; r++) {
            for (let s = 0; s <= sides; s++) {
                const a = s / sides * Math.PI * 2;
                positions.push(Math.cos(a) * profile[r][1], profile[r][0], Math.sin(a) * profile[r][1]);
                normals.push(0, 1, 0);
                uvs.push(s / sides, r / (profile.length - 1));
            }
        }
        const row = sides + 1;
        for (let r = 0; r < profile.length - 1; r++) {
            for (let s = 0; s < sides; s++) {
                const a = r * row + s, b = a + 1, c = a + row, d = c + 1;
                indices.push(a, c, b, b, c, d);
            }
        }
        const n = pc.calculateNormals(positions, indices);
        return meshFrom(device, positions, n, uvs, indices);
    }

    function meshFrom(device, positions, normals, uvs, indices) {
        const geom = new pc.Geometry();
        geom.positions = positions;
        geom.normals = normals;
        geom.uvs = uvs;
        geom.indices = indices;
        return pc.Mesh.fromGeometry(device, geom);
    }

    // hand on the surface at y 0, wrist at y 0.55, three curved claws
    function clawMesh(device) {
        const path = [[0.06, 0.56, 0.13], [0.46, 0.62, 0.11], [0.76, 0.36, 0.08], [0.9, 0.0, 0.012]];
        const positions = [], uvs = [], indices = [];
        for (let k = 0; k < 3; k++) {
            const a = k / 3 * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a), base = positions.length / 3;
            for (let i = 0; i < path.length; i++) {
                const rad = path[i][0], y = path[i][1], w = path[i][2];
                // square section: tangent side (w) and vertical side (w)
                const corners = [[-w, w], [w, w], [w, -w], [-w, -w]];
                for (let c = 0; c < 4; c++) {
                    positions.push(cx * rad - cz * corners[c][0], y + corners[c][1], cz * rad + cx * corners[c][0]);
                    uvs.push(c / 4, i / 3);
                }
            }
            for (let i = 0; i < path.length - 1; i++) {
                for (let c = 0; c < 4; c++) {
                    const p = base + i * 4 + c, q = base + i * 4 + (c + 1) % 4, r = p + 4, s = q + 4;
                    indices.push(p, q, r, q, s, r);
                }
            }
        }
        return meshFrom(device, positions, pc.calculateNormals(positions, indices), uvs, indices);
    }

    // fully hot, and the colours the batch starts from (gamma)
    const HOT_COLOR = [0.86, 0.07, 0.03];
    const COLD_COLORS = [[0.68, 0.06, 0.07], [0.72, 0.72, 0.7], [0.07, 0.07, 0.09]];

    function material(r, g, b, gloss, glow) {
        const m = new pc.StandardMaterial();
        m.diffuse = new pc.Color(r, g, b);
        if (glow) m.emissive = new pc.Color(glow, glow, glow);
        m.gloss = gloss;
        m.useMetalness = false;
        m.update();
        return m;
    }

    function Batch(app, rig) {
        this.app = app;
        this.rigs = [];
        this.needs = [0, 0, 0, 0];
        this.counts = [0, 0, 0, 0];
        this.frame = -1;
        this.alive = true;
        this.tint = 0;
        this.tintData = [new Float32Array(3), new Float32Array(3), new Float32Array(3)];
        const device = app.graphicsDevice;
        const seg = rig.segmentRender && rig.segmentRender.resource && rig.segmentRender.resource.meshes && rig.segmentRender.resource.meshes[0];
        const claw = rig.clawRender && rig.clawRender.resource && rig.clawRender.resource.meshes && rig.clawRender.resource.meshes[0];
        const segMesh = seg || latheMesh(device, 8, [[-0.5, 0.001], [-0.5, 0.72], [-0.36, 1], [0.36, 1], [0.5, 0.72], [0.5, 0.001]]);
        const clMesh = claw || clawMesh(device);
        const mat = (attr, r, g, b, gloss, glow) => (attr && attr.resource) || material(r, g, b, gloss, glow);
        const mats = [mat(rig.materialRed, 0.68, 0.06, 0.07, 0.55), mat(rig.materialWhite, 0.72, 0.72, 0.7, 0.5), mat(rig.materialBlack, 0.07, 0.07, 0.09, 0.45), mat(rig.materialClaw, 0.08, 0.08, 0.1, 0.6)];
        this.channels = [];
        const instances = [];
        for (let c = 0; c < 4; c++) {
            const mi = new pc.MeshInstance(c === CLAW ? clMesh : segMesh, mats[c]);
            mi.castShadow = false;
            mi.receiveShadow = false;
            mi.cull = false;
            this.channels.push({ mi: mi, data: null, vb: null, cap: 0 });
            instances.push(mi);
        }
        this.entity = new pc.Entity('SpiderArmBatch');
        this.entity.addComponent('render', { meshInstances: instances, castShadows: false, receiveShadows: false });
        app.root.addChild(this.entity);
        this.entity.once('destroy', () => { this.alive = false; });
        app.on('prerender', this.flush, this);
    }

    // capacity follows the arms that exist; the buffer only grows
    Batch.prototype.reserve = function (delta) {
        const device = this.app.graphicsDevice;
        for (let c = 0; c < 4; c++) {
            this.needs[c] += delta[c];
            const ch = this.channels[c];
            if (this.needs[c] <= ch.cap) continue;
            ch.cap = this.needs[c] + 8;
            ch.data = new Float32Array(ch.cap * 16);
            const vb = new pc.VertexBuffer(device, pc.VertexFormat.getDefaultInstancingFormat(device), ch.cap, { usage: pc.BUFFER_DYNAMIC, data: ch.data });
            ch.mi.setInstancing(vb);
            if (ch.vb) ch.vb.destroy();
            ch.vb = vb;
            ch.mi.instancingCount = 0;
        }
    };

    // redness 0..1 without touching the material, which may be shared. The uniform is linear.
    Batch.prototype.setTint = function (redness) {
        if (redness === this.tint) return;
        this.tint = redness;
        for (let c = 0; c < 3; c++) {
            const cold = COLD_COLORS[c], data = this.tintData[c];
            for (let i = 0; i < 3; i++) data[i] = Math.pow(cold[i] + (HOT_COLOR[i] - cold[i]) * redness, 2.2);
            this.channels[c].mi.setParameter('material_diffuse', data);
        }
    };

    Batch.prototype.begin = function () {
        if (this.frame === this.app.frame) return;
        this.frame = this.app.frame;
        this.counts[0] = this.counts[1] = this.counts[2] = this.counts[3] = 0;
    };

    // axes are the columns of the matrix, scale included
    Batch.prototype.push = function (c, xx, xy, xz, yx, yy, yz, zx, zy, zz, px, py, pz) {
        const ch = this.channels[c], n = this.counts[c];
        if (n >= ch.cap) return;
        const d = ch.data, i = n * 16;
        d[i] = xx; d[i + 1] = xy; d[i + 2] = xz; d[i + 3] = 0;
        d[i + 4] = yx; d[i + 5] = yy; d[i + 6] = yz; d[i + 7] = 0;
        d[i + 8] = zx; d[i + 9] = zy; d[i + 10] = zz; d[i + 11] = 0;
        d[i + 12] = px; d[i + 13] = py; d[i + 14] = pz; d[i + 15] = 1;
        this.counts[c] = n + 1;
    };

    Batch.prototype.flush = function () {
        const fresh = this.frame === this.app.frame;
        for (let c = 0; c < 4; c++) {
            const ch = this.channels[c];
            const n = fresh ? this.counts[c] : 0;
            ch.mi.instancingCount = n;
            ch.mi.visible = n > 0;
            if (n) ch.vb.setData(ch.data);
        }
    };

    Batch.prototype.remove = function (rig, delta) {
        const i = this.rigs.indexOf(rig);
        if (i >= 0) this.rigs.splice(i, 1);
        for (let c = 0; c < 4; c++) this.needs[c] -= delta[c];
        if (this.rigs.length) return;
        this.app.off('prerender', this.flush, this);
        if (this.app.spiderArmBatch === this) this.app.spiderArmBatch = null;
        if (this.alive) this.entity.destroy();
        for (let c = 0; c < 4; c++) if (this.channels[c].vb) this.channels[c].vb.destroy();
    };

    return {
        RED: RED, WHITE: WHITE, BLACK: BLACK, CLAW: CLAW,
        get: function (app, rig) {
            if (!app.spiderArmBatch) app.spiderArmBatch = new Batch(app, rig);
            return app.spiderArmBatch;
        },
        // the player whose arms change colour has their own lists: the others stay in the shared one
        own: function (app, rig) {
            return new Batch(app, rig);
        }
    };
})();

// ---------------------------------------------------------------- rig
(function () {
    const STOWED = 0, PLANTED = 1, STEPPING = 2, HOOKED = 3;
    const PATTERN = [SpiderObby_ArmBatch.WHITE, SpiderObby_ArmBatch.BLACK, SpiderObby_ArmBatch.WHITE, SpiderObby_ArmBatch.BLACK, SpiderObby_ArmBatch.WHITE, SpiderObby_ArmBatch.RED];
    const ELEVATIONS = [-0.9, -0.25, 0.5, 1.2]; // radians, used when nothing nearby is known
    const CANDIDATES = 8;
    const _from = new pc.Vec3(), _to = new pc.Vec3(), _dir = new pc.Vec3(), _vec = new pc.Vec3();
    const _t1 = new pc.Vec3(), _t2 = new pc.Vec3(), _off = new pc.Vec3(), _lead = new pc.Vec3();
    const _mount = new pc.Vec3(), _ctrl = new pc.Vec3(), _end = new pc.Vec3(), _bulge = new pc.Vec3();

    SpiderObbyArms.prototype.initialize = function () {
        if (!this.body) this.body = this.entity.findByName('Body');
        this.rayOptions = { filterTags: ['Ground', 'CameraCollider'] };
        this.camera = this.app.root.findByName('Camera');

        this.center = new pc.Vec3();
        this.lastCenter = new pc.Vec3().copy(this.entity.getPosition());
        this.velocity = new pc.Vec3();
        this.speed = 0;
        this.right = new pc.Vec3(1, 0, 0);
        this.forward = new pc.Vec3(0, 0, 1);
        this.up = new pc.Vec3(0, 1, 0);
        this.centerStep = new pc.Vec3();

        this.hookOn = false;
        this.hookPos = new pc.Vec3();
        this.hookStepDone = false;
        this.rootBlend = 0;

        // strain: everything comes from the grip ratio
        this.gripRatio = 1;
        this.strainRunning = true;
        this.redness = 0;
        this.heat = 0;
        this.tremor = 0;
        this.strainTime = 0;
        this.shakeNode = this.body.findByName('SkinLego');
        this.shakeRest = this.shakeNode ? this.shakeNode.getLocalPosition().clone() : null;
        this.shaking = false;

        this.grabEnabled = true;
        this.hidden = false;
        this.attached = false;
        this.plantedCount = 0;
        this.steppingCount = 0;
        this.wallAnchors = 0;
        this.raysThisFrame = 0;

        this.feelN = new pc.Vec3();
        this.feelP = new pc.Vec3();
        this.feelAge = 99;
        this.feelIndex = 0;
        this.feelFrame = 0;
        this.lastN = new pc.Vec3(0, 1, 0);
        this.lastP = new pc.Vec3();
        this.lastAge = 99;

        this.stepGap = 0;
        this.turn = 0;

        this.batch = this.fireEvents ? SpiderObby_ArmBatch.own(this.app, this) : SpiderObby_ArmBatch.get(this.app, this);
        this.batch.rigs.push(this);
        this.reservation = [0, 0, 0, 0];
        this.buildArms(Math.round(this.armCount));

        this.on('attr:armCount', function (value) { this.setArmCount(value); }, this);
        this.on('destroy', function () {
            this.batch.remove(this, this.reservation);
        }, this);
    };

    SpiderObbyArms.prototype.buildArms = function (count) {
        count = pc.math.clamp(count, 1, 12);
        const old = this.reservation.slice();
        const need = [0, 0, 0, 0];
        const seg = Math.max(2, Math.round(this.segments));
        this.segCount = seg;
        // clearance of each segment: the shoulder at the first, the wrist at the last
        this.radii = new Float32Array(seg);
        for (let k = 0; k < seg; k++) this.radii[k] = k === 0 ? this.armRadius * 1.3 : k === seg - 1 ? 0.3 * this.clawScale : this.armRadius * (1 - 0.28 * (k + 1) / seg);
        for (let k = 0; k < seg; k++) need[PATTERN[k % PATTERN.length]] += count;
        need[SpiderObby_ArmBatch.RED] += count * 2; // shoulder and wrist
        need[SpiderObby_ArmBatch.CLAW] += count;
        const delta = [need[0] - old[0], need[1] - old[1], need[2] - old[2], need[3] - old[3]];
        this.batch.reserve(delta);
        this.reservation = need;

        this.arms = [];
        for (let i = 0; i < count; i++) {
            // each arm has its own sector, fixed in the world: turning never swaps arms. The 15 degrees put the hands
            // of one side on different lanes when moving along an axis.
            const az = Math.PI * 2 * (i + 0.5) / count + 0.26;
            this.arms.push({
                index: i,
                az: az,
                sinAz: Math.sin(az),
                cosAz: Math.cos(az),
                state: STOWED,
                anchor: new pc.Vec3(),
                normal: new pc.Vec3(0, 1, 0),
                shownNormal: new pc.Vec3(0, 1, 0),
                from: new pc.Vec3(),
                to: new pc.Vec3(),
                toNormal: new pc.Vec3(0, 1, 0),
                tip: new pc.Vec3().copy(this.entity.getPosition()),
                t: 0,
                duration: 0.1,
                attempt: 0,
                retry: 0,
                stow: 1,
                relaxed: false,
                onlyCloser: false,
                hookSide: 0,
                hookRoot: az,
                rootAngle: az,
                nx: 0, ny: 1, nz: 0,
                pts: new Float32Array((seg + 1) * 3),
                disp: new Float32Array((seg + 1) * 3),
            });
        }
        this.armCount = count;
    };

    SpiderObbyArms.prototype.setArmCount = function (count) {
        count = Math.round(count);
        if (this.arms && this.arms.length === count) return;
        this.buildArms(count);
    };

    // all hands let go (jump, grip gone)
    SpiderObbyArms.prototype.releaseAll = function () {
        for (let i = 0; i < this.arms.length; i++) this.arms[i].state = STOWED;
        this.plantedCount = this.steppingCount = this.wallAnchors = 0;
        this.attached = false;
        if (this.hookOn) { this.hookOn = false; this.rootBlend = 0.35; }
    };

    // Two arms hold the hook, the others fold on the back. Only the hook position and the body are needed (a remote player too).
    SpiderObbyArms.prototype.setHook = function (point) {
        this.hookPos.copy(point);
        if (this.hookOn) return;
        this.hookOn = true;
        this.hookStepDone = false;
        const arms = this.arms, count = arms.length;
        // the pair nearest to the top of the back plate, left and right
        let right = null, left = null, bestR = -9, bestL = -9;
        for (let i = 0; i < count; i++) {
            const s = Math.sin(arms[i].rootAngle), c = Math.cos(arms[i].rootAngle);
            if (s + c * 0.5 > bestR) { bestR = s + c * 0.5; right = arms[i]; }
        }
        for (let i = 0; i < count; i++) {
            if (arms[i] === right) continue;
            const s = Math.sin(arms[i].rootAngle), c = Math.cos(arms[i].rootAngle);
            if (s - c * 0.5 > bestL) { bestL = s - c * 0.5; left = arms[i]; }
        }
        // the others spread around the rest of the plate, keeping their order from left to right
        const rest = arms.filter(a => a !== right && a !== left).sort((a, b) => Math.cos(a.rootAngle) - Math.cos(b.rootAngle));
        for (let i = 0; i < rest.length; i++) {
            rest[i].state = STOWED;
            rest[i].hookSide = 0;
            const from = rest.length > 3 ? 170 : 200, to = rest.length > 3 ? 370 : 340;
            rest[i].hookRoot = (rest.length > 1 ? from + (to - from) * i / (rest.length - 1) : 270) * pc.math.DEG_TO_RAD;
        }
        const hold = (arm, side, root) => {
            arm.state = HOOKED;
            arm.hookSide = side;
            arm.hookRoot = root;
            arm.from.copy(arm.tip);
            arm.t = 0;
        };
        if (left) { hold(right, 1, 1.05); hold(left, -1, Math.PI - 1.05); }
        else hold(right, 0, Math.PI / 2);
    };

    SpiderObbyArms.prototype.clearHook = function () {
        if (!this.hookOn) return;
        this.hookOn = false;
        this.rootBlend = 0.35;
        for (let i = 0; i < this.arms.length; i++) if (this.arms[i].state === HOOKED) this.arms[i].state = STOWED;
    };

    // teleport / respawn: nothing carries over
    SpiderObbyArms.prototype.reset = function () {
        this.releaseAll();
        const pos = this.entity.getPosition();
        for (let i = 0; i < this.arms.length; i++) { const a = this.arms[i]; a.tip.copy(pos); a.stow = 1; a.retry = 0; a.attempt = 0; a.relaxed = false; }
        this.lastCenter.copy(pos);
        this.velocity.set(0, 0, 0);
        this.speed = 0;
        this.feelAge = this.lastAge = 99;
    };

    SpiderObbyArms.prototype.setHidden = function (hidden) {
        this.hidden = hidden;
    };

    // average normal of the hands (walls and ceilings first): where a jump pushes away from
    SpiderObbyArms.prototype.getHoldNormal = function (out) {
        out.set(0, 0, 0);
        let any = false;
        for (let pass = 0; pass < 2 && !any; pass++) {
            for (let i = 0; i < this.arms.length; i++) {
                const a = this.arms[i];
                if (a.state === STOWED) continue;
                const n = a.state === STEPPING ? a.toNormal : a.normal;
                if (pass === 0 && n.y > 0.7) continue;
                out.add(n);
                any = true;
            }
        }
        if (!any) { out.set(0, 1, 0); return out; }
        return out.normalize();
    };

    SpiderObbyArms.prototype.cast = function (fromX, fromY, fromZ, toX, toY, toZ) {
        this.raysThisFrame++;
        _from.set(fromX, fromY, fromZ);
        _to.set(toX, toY, toZ);
        return this.app.systems.rigidbody.raycastFirst(_from, _to, this.rayOptions);
    };

    // direction of the next try for this arm; false = nothing to try this time
    SpiderObbyArms.prototype.candidate = function (arm, attempt, out) {
        const c = this.center, v = this.velocity;
        const moving = this.speed > 1;
        let n = null, p = null;
        if (this.feelAge < 0.3 && Math.abs(v.y) > 2) { n = this.feelN; p = this.feelP; }
        else if (arm.state === PLANTED) { n = arm.normal; p = arm.anchor; }
        else if (this.lastAge < 1) { n = this.lastN; p = this.lastP; }

        if (attempt <= 1 && n) {
            // on the surface we already hold: ahead of the motion, spread around the body
            const dist = (c.x - p.x) * n.x + (c.y - p.y) * n.y + (c.z - p.z) * n.z;
            if (dist < 0.2) return false;
            let lead = attempt === 0 ? this.leadTime : this.leadTime * 0.4;
            _lead.copy(v).mulScalar(lead);
            const len = _lead.length();
            if (len > 5) _lead.mulScalar(5 / len);
            const along = _lead.dot(n);
            _lead.x -= n.x * along; _lead.y -= n.y * along; _lead.z -= n.z * along;
            // sectors do not depend on where the body faces: up on a wall, world +z on a floor or ceiling
            if (Math.abs(n.y) < 0.7) _t1.set(-n.x * n.y, 1 - n.y * n.y, -n.z * n.y);
            else _t1.set(-n.x * n.z, -n.y * n.z, 1 - n.z * n.z);
            _t1.normalize();
            _t2.cross(n, _t1);
            const spread = this.footSpread * (attempt === 0 ? 1 : 0.55);
            out.x = -n.x * dist + _lead.x + (_t1.x * arm.cosAz + _t2.x * arm.sinAz) * spread;
            out.y = -n.y * dist + _lead.y + (_t1.y * arm.cosAz + _t2.y * arm.sinAz) * spread;
            out.z = -n.z * dist + _lead.z + (_t1.z * arm.cosAz + _t2.z * arm.sinAz) * spread;
            out.normalize();
            return true;
        }
        if (attempt === 2 && moving) {
            // what we are moving at
            _off.set(arm.sinAz * 0.45, 0, arm.cosAz * 0.45);
            out.copy(v).mulScalar(1 / this.speed).add(_off);
            out.y += arm.cosAz * 0.35;
            out.normalize();
            return true;
        }
        if (attempt === 3 && n) {
            // straight at the surface, close to the body
            out.set(-n.x + arm.sinAz * 0.35, -n.y + (Math.abs(n.y) < 0.7 ? arm.cosAz * 0.35 : 0), -n.z + (Math.abs(n.y) < 0.7 ? 0 : arm.cosAz * 0.35));
            out.normalize();
            return true;
        }
        if (attempt >= 4) {
            // anything in reach
            const el = ELEVATIONS[attempt - 4];
            const a = arm.az + (attempt - 4) * 0.15; // in the arm's own sector
            const cosEl = Math.cos(el);
            out.set(Math.sin(a) * cosEl, Math.sin(el), Math.cos(a) * cosEl);
            return true;
        }
        return false;
    };

    // the hand and wrist have to fit beside the torso
    SpiderObbyArms.prototype.clearOfBody = function (p) {
        const c = this.center, yy = pc.math.clamp(p.y, c.y - 1, c.y + 0.85), r = this.bodyRadius + 0.85 * this.clawScale;
        const dx = p.x - c.x, dy = p.y - yy, dz = p.z - c.z;
        return dx * dx + dy * dy + dz * dz > r * r;
    };

    // no other hand here or about to land here
    SpiderObbyArms.prototype.handFree = function (arm, point) {
        const gap = arm.relaxed ? this.handGap * 0.75 : this.handGap, gap2 = gap * gap;
        for (let i = 0; i < this.arms.length; i++) {
            const o = this.arms[i];
            if (o === arm || o.state === STOWED) continue;
            const p = o.state === STEPPING ? o.to : o.anchor;
            const dx = p.x - point.x, dy = p.y - point.y, dz = p.z - point.z;
            if (dx * dx + dy * dy + dz * dz < gap2) return false;
        }
        return true;
    };

    SpiderObbyArms.prototype.tryStep = function (arm) {
        // true when a ray was spent
        while (arm.attempt < CANDIDATES) {
            const attempt = arm.attempt++;
            if (!this.candidate(arm, attempt, _dir)) continue;
            const c = this.center, r = this.grabReach;
            const hit = this.cast(c.x, c.y, c.z, c.x + _dir.x * r, c.y + _dir.y * r, c.z + _dir.z * r);
            // stretched too far: only a closer place is worth a step, otherwise this arm re-steps on the spot
            const worthIt = !arm.onlyCloser || (hit && hit.point.distance(c) < this.stepDistance);
            if (hit && worthIt && this.clearOfBody(hit.point) && this.handFree(arm, hit.point)) {
                arm.relaxed = false;
                arm.from.copy(arm.tip);
                arm.to.copy(hit.point);
                arm.toNormal.copy(hit.normal);
                arm.t = 0;
                const d = arm.from.distance(arm.to);
                arm.duration = this.stepTime * pc.math.clamp(d / 6, 0.55, 1.5);
                arm.state = STEPPING;
                arm.attempt = 0;
                this.stepGap = this.minStepGap;
            }
            return true;
        }
        arm.attempt = 0;
        arm.retry = 0.08;
        arm.relaxed = true; // no room: the next round accepts a closer place
        return false;
    };

    SpiderObbyArms.prototype.feel = function () {
        // while moving up or down: look for the wall beside the body, the hands move onto it
        const c = this.center, range = this.grabReach * 0.7;
        let x, z;
        if (this.feelFrame++ % 2 === 0) { x = this.forward.x; z = this.forward.z; }
        else {
            const a = this.feelIndex++ * Math.PI / 4;
            x = Math.cos(a); z = Math.sin(a);
        }
        const hit = this.cast(c.x, c.y, c.z, c.x + x * range, c.y, c.z + z * range);
        if (hit && Math.abs(hit.normal.y) < 0.5) {
            this.feelN.copy(hit.normal);
            this.feelP.copy(hit.point);
            this.feelAge = 0;
        }
    };

    SpiderObbyArms.prototype.postUpdate = function (dt) {
        this.raysThisFrame = 0;
        this.center.copy(this.entity.getPosition());
        const c = this.center;

        // a jump this big was a teleport
        if (c.distance(this.lastCenter) > 15) this.reset();
        if (dt > 0) {
            const k = 1 - Math.exp(-14 * dt);
            this.velocity.x += ((c.x - this.lastCenter.x) / dt - this.velocity.x) * k;
            this.velocity.y += ((c.y - this.lastCenter.y) / dt - this.velocity.y) * k;
            this.velocity.z += ((c.z - this.lastCenter.z) / dt - this.velocity.z) * k;
            this.speed = this.velocity.length();
        }
        this.centerStep.sub2(c, this.lastCenter);
        this.lastCenter.copy(c);

        const m = this.body.getWorldTransform().data;
        this.right.set(m[0], m[1], m[2]);
        this.up.set(m[4], m[5], m[6]);
        this.forward.set(m[8], m[9], m[10]);

        if (this.hookOn) {
            this.updateHook(dt);
            this.updateStrain(dt);
            if (!this.hidden) this.draw(dt);
            return;
        }

        this.feelAge += dt;
        this.lastAge += dt;
        this.stepGap -= dt;

        const arms = this.arms, count = arms.length;
        const maxLifted = Math.max(1, Math.floor(count / 2));
        let budget = Math.max(1, Math.round(this.raysPerFrame));
        let planted = 0, stepping = 0, wall = 0;

        for (let i = 0; i < count; i++) if (arms[i].state === STEPPING) stepping++;

        const hasVhat = this.speed > 2;
        const vx = hasVhat ? this.velocity.x / this.speed : 0, vy = hasVhat ? this.velocity.y / this.speed : 0, vz = hasVhat ? this.velocity.z / this.speed : 0;

        this.turn = (this.turn + 1) % count;
        for (let j = 0; j < count; j++) {
            const arm = arms[(this.turn + j) % count];
            arm.retry -= dt;

            if (arm.state === STEPPING) {
                arm.t += dt / arm.duration;
                if (arm.to.distance(c) > this.armReach) {
                    arm.state = STOWED;
                    stepping--;
                } else if (arm.t >= 1) {
                    arm.state = PLANTED;
                    arm.anchor.copy(arm.to);
                    arm.normal.copy(arm.toNormal);
                    arm.tip.copy(arm.to);
                    this.lastN.copy(arm.normal);
                    this.lastP.copy(arm.anchor);
                    this.lastAge = 0;
                    stepping--;
                    if (this.fireEvents) this.app.fire('spider:step', arm.anchor, arm.normal, arm.index, this.speed);
                }
            }

            if (arm.state === PLANTED) {
                const dx = arm.anchor.x - c.x, dy = arm.anchor.y - c.y, dz = arm.anchor.z - c.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist > this.armReach) {
                    arm.state = STOWED;
                } else if (this.grabEnabled && budget > 0 && arm.retry <= 0 && stepping < maxLifted && this.stepGap <= 0) {
                    // the body is behind the surface this hand holds: it would pull through a corner
                    const behindSurface = -(dx * arm.normal.x + dy * arm.normal.y + dz * arm.normal.z) < -0.3;
                    const behindMotion = hasVhat && (dx * vx + dy * vy + dz * vz) < -this.stepBehind;
                    // the body came too close to this hand: it would stick out of the torso
                    const tooClose = !this.clearOfBody(arm.anchor);
                    if (behindSurface || behindMotion || tooClose || dist > this.stepDistance) {
                        const prev = arms[(arm.index + count - 1) % count], next = arms[(arm.index + 1) % count];
                        if (behindSurface || count < 3 || (prev.state !== STEPPING && next.state !== STEPPING)) {
                            arm.onlyCloser = !behindSurface && !behindMotion && !tooClose;
                            if (this.tryStep(arm)) budget--;
                            if (arm.state === STEPPING) stepping++;
                        }
                    }
                }
            } else if (arm.state === STOWED && this.grabEnabled && budget > 0 && arm.retry <= 0 && this.stepGap <= 0) {
                arm.onlyCloser = false;
                if (this.tryStep(arm)) budget--;
                if (arm.state === STEPPING) stepping++;
            }

            if (arm.state === PLANTED) {
                planted++;
                if (arm.normal.y < 0.7) wall++;
            } else if (arm.state === STEPPING) {
                if (arm.toNormal.y < 0.7) wall++;
            }
        }

        this.plantedCount = planted;
        this.steppingCount = stepping;
        this.wallAnchors = wall;
        this.attached = planted + stepping > 0;

        if (this.grabEnabled && (Math.abs(this.velocity.y) > 2 || !this.attached)) this.feel();

        this.updateStrain(dt);
        if (!this.hidden) this.draw(dt);
    };

    // Redness at a grip ratio: it grows at every drop from a full bar to Heat Full, faster at the two ends of the bar.
    SpiderObbyArms.prototype.rednessAt = function (ratio) {
        if (ratio >= 1) return 0;
        if (ratio >= 0.9) return (1 - ratio) / 0.1 * this.redAt90;
        const start = this.heatStart, full = this.heatFull;
        if (ratio >= start) return this.redAt90 + (this.redAtStart - this.redAt90) * (0.9 - ratio) / (0.9 - start);
        return Math.min(1, this.redAtStart + (1 - this.redAtStart) * (start - ratio) / Math.max(0.01, start - full));
    };

    // Everything follows the grip with a short lag, so a jump in grip never flashes. A menu freezes it, like the grip.
    SpiderObbyArms.prototype.updateStrain = function (dt) {
        if (!this.strainRunning) return;
        const span = Math.max(0.01, this.heatStart - this.heatFull);
        const targetHeat = pc.math.clamp((this.heatStart - this.gripRatio) / span, 0, 1);
        const low = pc.math.clamp(1 - this.gripRatio / this.heatStart, 0, 1);
        const k = 1 - Math.exp(-16 * dt);
        const targetRed = this.rednessAt(this.gripRatio);
        this.redness += (targetRed - this.redness) * k;
        if (targetRed === 0 && this.redness < 0.002) this.redness = 0;
        this.batch.setTint(this.redness);
        this.heat += (targetHeat - this.heat) * k;
        this.tremor += (low * low - this.tremor) * k;
        this.strainTime += dt;
        if (this.shakeNode) {
            const a = this.tremor * this.bodyShake, st = this.strainTime;
            if (a > 0.0005) {
                const r = this.shakeRest;
                this.shakeNode.setLocalPosition(r.x + a * Math.sin(st * 71), r.y + a * Math.sin(st * 83 + 1), r.z + a * Math.sin(st * 59 + 2));
                this.shaking = true;
            } else if (this.shaking) {
                this.shakeNode.setLocalPosition(this.shakeRest);
                this.shaking = false;
            }
        }
    };

    // the middle of the arm shakes, the shoulder and the hand stay. A function of time, so it looks the same at any frame rate.
    SpiderObbyArms.prototype.applyTremor = function (seg) {
        const amp = this.tremor * this.tremorAmplitude;
        if (amp < 0.001) return;
        const st = this.strainTime * 6.283;
        for (let i = 0; i < this.arms.length; i++) {
            const pts = this.arms[i].pts;
            for (let k = 1; k < seg; k++) {
                const q = k * 3, w = amp * Math.sin(3.1416 * k / seg);
                pts[q] += w * Math.sin(st * 11 + k * 1.7 + i);
                pts[q + 1] += w * Math.sin(st * 13.3 + k * 2.3 + i * 2);
                pts[q + 2] += w * Math.sin(st * 9.1 + k * 1.1 + i * 3);
            }
        }
    };

    SpiderObbyArms.prototype.updateHook = function (dt) {
        let hands = 0;
        for (let i = 0; i < this.arms.length; i++) {
            const arm = this.arms[i];
            if (arm.state !== HOOKED) continue;
            hands++;
            if (arm.t < 1) {
                arm.t += dt / this.hookReachTime;
                if (arm.t >= 1 && !this.hookStepDone) {
                    // one step for taking the hook; the swing itself gives none
                    this.hookStepDone = true;
                    _vec.copy(this.center).sub(this.hookPos).normalize();
                    if (this.fireEvents) this.app.fire('spider:step', this.hookPos, _vec, arm.index, this.speed);
                }
            }
        }
        this.plantedCount = hands;
        this.steppingCount = 0;
        this.wallAnchors = 0;
        this.attached = true;
    };

    // Each shoulder has its place on the back plate, by the arm's sector: the front of the world sector is the top of the
    // plate seen from the body. The plate turns with the body but shoulders never swap, so they cannot run through each other.
    SpiderObbyArms.prototype.updateRoots = function (dt) {
        const arms = this.arms, rx = this.right.x, rz = this.right.z, fx = this.forward.x, fz = this.forward.z;
        const blending = this.hookOn || this.rootBlend > 0;
        const k = 1 - Math.exp(-14 * dt);
        if (this.rootBlend > 0) this.rootBlend -= dt;
        for (let i = 0; i < arms.length; i++) {
            const arm = arms[i];
            const target = this.hookOn ? arm.hookRoot : Math.atan2(arm.sinAz * fx + arm.cosAz * fz, arm.sinAz * rx + arm.cosAz * rz);
            if (blending) arm.rootAngle += Math.atan2(Math.sin(target - arm.rootAngle), Math.cos(target - arm.rootAngle)) * k;
            else arm.rootAngle = target;
        }
    };

    SpiderObbyArms.prototype.draw = function (dt) {
        const batch = this.batch, c = this.center;
        batch.begin();
        const cam = this.camera ? this.camera.getPosition() : null;
        const hide2 = this.cameraHideDistance * this.cameraHideDistance;
        const seg = this.segCount;
        const follow = 1 - Math.exp(-16 * dt);
        const clawS = this.clawScale, wristLift = 0.55 * clawS;
        const arms = this.arms, count = arms.length;

        // hands
        for (let i = 0; i < count; i++) {
            const arm = arms[i];
            let targetStow = 0;
            if (arm.state === HOOKED) {
                // the hand on the hook, wrist toward the body
                _vec.copy(c).sub(this.hookPos);
                const away = _vec.length() || 1;
                _vec.mulScalar(1 / away);
                arm.shownNormal.lerp(arm.shownNormal, _vec, follow);
                const side = arm.hookSide * this.hookHandGap * 0.5, s = Math.min(arm.t, 1), e = s * s * (3 - 2 * s);
                const hx = this.hookPos.x + this.right.x * side, hy = this.hookPos.y + this.right.y * side, hz = this.hookPos.z + this.right.z * side;
                arm.tip.set(arm.from.x + (hx - arm.from.x) * e, arm.from.y + (hy - arm.from.y) * e, arm.from.z + (hz - arm.from.z) * e);
            } else if (arm.state === PLANTED) {
                arm.tip.copy(arm.anchor);
                arm.shownNormal.lerp(arm.shownNormal, arm.normal, follow);
            } else if (arm.state === STEPPING) {
                const s = Math.min(arm.t, 1), e = s * s * (3 - 2 * s), lift = 4 * s * (1 - s) * this.stepArc;
                arm.shownNormal.lerp(arm.shownNormal, arm.toNormal, follow);
                arm.tip.set(
                    arm.from.x + (arm.to.x - arm.from.x) * e + arm.shownNormal.x * lift,
                    arm.from.y + (arm.to.y - arm.from.y) * e + arm.shownNormal.y * lift,
                    arm.from.z + (arm.to.z - arm.from.z) * e + arm.shownNormal.z * lift
                );
                this.keepOutOfBody(arm.tip);
            } else if (this.hookOn) {
                // folded on the back, spread around the lower half of the plate
                targetStow = 1;
                const ca = Math.cos(arm.hookRoot), sa = Math.sin(arm.hookRoot), r = Math.max(this.stowRadius * 0.6, this.rootRadius + 0.55, 0.56 / (2 * Math.sin(Math.PI / count)) + 0.55);
                const f = this.forward, ri = this.right, u = this.up;
                arm.tip.add(this.centerStep); // they travel with the body, or they trail behind it at this speed
                _vec.set(c.x - f.x * 0.95 + (ri.x * ca + u.x * sa) * r, c.y - f.y * 0.95 + (ri.y * ca + u.y * sa) * r, c.z - f.z * 0.95 + (ri.z * ca + u.z * sa) * r);
                arm.tip.lerp(arm.tip, _vec, follow);
                _vec.set(ri.x * ca + u.x * sa - f.x, ri.y * ca + u.y * sa - f.y, ri.z * ca + u.z * sa - f.z);
                arm.shownNormal.lerp(arm.shownNormal, _vec, follow);
            } else {
                targetStow = 1;
                _vec.set(c.x + arm.sinAz * this.stowRadius, c.y + this.mountHeight + 0.25, c.z + arm.cosAz * this.stowRadius);
                arm.tip.lerp(arm.tip, _vec, follow);
                _vec.set(arm.sinAz * 0.6, 0.8, arm.cosAz * 0.6);
                arm.shownNormal.lerp(arm.shownNormal, _vec, follow);
            }
            arm.stow += (targetStow - arm.stow) * follow;
        }

        // curves
        this.updateRoots(dt);
        const radius = Math.max(this.rootRadius, 0.56 / (2 * Math.sin(Math.PI / count)));
        const reachLen = this.armLength * (1 - this.strainTaut * this.heat);
        const rx = this.right.x, ry = this.right.y, rz = this.right.z, fx = this.forward.x, fy = this.forward.y, fz = this.forward.z;
        const ux = this.up.x, uy = this.up.y, uz = this.up.z;
        for (let i = 0; i < count; i++) {
            const arm = arms[i];
            const nl = arm.shownNormal.length() || 1;
            const nx = arm.shownNormal.x / nl, ny = arm.shownNormal.y / nl, nz = arm.shownNormal.z / nl;
            arm.nx = nx; arm.ny = ny; arm.nz = nz;

            // shoulder on the back plate, wrist above the hand
            const ca = Math.cos(arm.rootAngle), sa = Math.sin(arm.rootAngle);
            const outX = rx * ca + ux * sa, outY = ry * ca + uy * sa, outZ = rz * ca + uz * sa;
            _mount.set(
                c.x + ux * this.mountHeight - fx * this.mountBack + outX * radius,
                c.y + uy * this.mountHeight - fy * this.mountBack + outY * radius,
                c.z + uz * this.mountHeight - fz * this.mountBack + outZ * radius
            );
            _end.set(arm.tip.x + nx * wristLift, arm.tip.y + ny * wristLift, arm.tip.z + nz * wristLift);

            // one curve: leaves the plate outward, arcs away from the surface and the body, flat when stretched
            const chord = _mount.distance(_end);
            const len = reachLen + (1.9 - reachLen) * arm.stow;
            // on a hook the arm is the rope: pulled straight
            const slack = arm.state !== HOOKED && len > chord ? Math.sqrt(len * len - chord * chord) : 0;
            let hx = _end.x - c.x, hz = _end.z - c.z;
            const hl = Math.sqrt(hx * hx + hz * hz);
            if (hl > 0.01) { hx /= hl; hz /= hl; } else { hx = arm.sinAz; hz = arm.cosAz; }
            _bulge.set(nx * 0.8 + hx * 0.6, ny * 0.8 + 0.25, nz * 0.8 + hz * 0.6).normalize();
            const b = slack * 0.72, exit = 1.1 * (1 - arm.stow * 0.7);
            const qx = (_mount.x + _end.x) * 0.5 + _bulge.x * b, qy = (_mount.y + _end.y) * 0.5 + _bulge.y * b, qz = (_mount.z + _end.z) * 0.5 + _bulge.z * b;
            // cubic: the quadratic through q, with the start pulled straight out of the plate
            const c1x = _mount.x + (qx - _mount.x) * 0.667 + (outX - fx * 0.5) * exit;
            const c1y = _mount.y + (qy - _mount.y) * 0.667 + (outY - fy * 0.5) * exit;
            const c1z = _mount.z + (qz - _mount.z) * 0.667 + (outZ - fz * 0.5) * exit;
            const c2x = _end.x + (qx - _end.x) * 0.667, c2y = _end.y + (qy - _end.y) * 0.667, c2z = _end.z + (qz - _end.z) * 0.667;

            const pts = arm.pts;
            for (let k = 0; k <= seg; k++) {
                const t = k / seg, u = 1 - t, q = k * 3;
                const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
                pts[q] = w0 * _mount.x + w1 * c1x + w2 * c2x + w3 * _end.x;
                pts[q + 1] = w0 * _mount.y + w1 * c1y + w2 * c2y + w3 * _end.y;
                pts[q + 2] = w0 * _mount.z + w1 * c1z + w2 * c2z + w3 * _end.z;
            }
        }

        // arms never pass through each other or the body
        this.avoidBody(seg);
        if (count > 1) this.separate(seg);
        this.avoidBody(seg);
        this.applyTremor(seg);

        for (let i = 0; i < count; i++) {
            const arm = arms[i];
            this.drawCurve(batch, arm, seg, cam, hide2);

            // hand: +Y away from the surface
            const nx = arm.nx, ny = arm.ny, nz = arm.nz;
            if (!cam || (arm.tip.x - cam.x) * (arm.tip.x - cam.x) + (arm.tip.y - cam.y) * (arm.tip.y - cam.y) + (arm.tip.z - cam.z) * (arm.tip.z - cam.z) > hide2) {
                let ax, ay, az;
                if (Math.abs(ny) < 0.9) { ax = -nz; ay = 0; az = nx; } else { ax = 0; ay = nz; az = -ny; }
                const al = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
                ax /= al; ay /= al; az /= al;
                const bx = ay * nz - az * ny, by = az * nx - ax * nz, bz = ax * ny - ay * nx;
                batch.push(SpiderObby_ArmBatch.CLAW, ax * clawS, ay * clawS, az * clawS, nx * clawS, ny * clawS, nz * clawS, bx * clawS, by * clawS, bz * clawS, arm.tip.x, arm.tip.y, arm.tip.z);
                // red wrist
                const wr = 0.3 * clawS, wl = 0.34 * clawS;
                batch.push(SpiderObby_ArmBatch.RED, ax * wr, ay * wr, az * wr, nx * wl, ny * wl, nz * wl, bx * wr, by * wr, bz * wr, arm.tip.x + nx * wristLift, arm.tip.y + ny * wristLift, arm.tip.z + nz * wristLift);
            }
        }
    };

    // Pushes the curves of different arms apart where their tubes would touch. The hands and most of the shoulders stay;
    // the push spreads along the arm so it stays one curve.
    SpiderObbyArms.prototype.separate = function (seg) {
        const arms = this.arms, count = arms.length;
        const radii = this.radii, margin = 0.03;
        const passes = Math.round(this.separationPasses);
        for (let pass = 0; pass < passes; pass++) {
            let pushed = false;
            for (let i = 0; i < count; i++) arms[i].disp.fill(0);
            for (let i = 0; i < count; i++) {
                const A = arms[i], ptsA = A.pts;
                for (let j = i + 1; j < count; j++) {
                    const B = arms[j], ptsB = B.pts;
                    for (let m = 0; m < seg; m++) {
                        const a0 = m * 3;
                        const ax = ptsA[a0], ay = ptsA[a0 + 1], az = ptsA[a0 + 2], ux = ptsA[a0 + 3] - ax, uy = ptsA[a0 + 4] - ay, uz = ptsA[a0 + 5] - az;
                        const aa = ux * ux + uy * uy + uz * uz;
                        const mx = ax + ux * 0.5, my = ay + uy * 0.5, mz = az + uz * 0.5, ra = radii[m];
                        for (let n = 0; n < seg; n++) {
                            const b0 = n * 3;
                            const bx = ptsB[b0], by = ptsB[b0 + 1], bz = ptsB[b0 + 2], vx = ptsB[b0 + 3] - bx, vy = ptsB[b0 + 4] - by, vz = ptsB[b0 + 5] - bz;
                            const ee = vx * vx + vy * vy + vz * vz, gap = ra + radii[n] + margin;
                            const ox = mx - bx - vx * 0.5, oy = my - by - vy * 0.5, oz = mz - bz - vz * 0.5;
                            // far apart: quick out (half lengths + gap, squared with a safe bound)
                            const lim = 0.5 * Math.sqrt(aa) + 0.5 * Math.sqrt(ee) + gap;
                            if (ox * ox + oy * oy + oz * oz > lim * lim) continue;
                            // closest points of the two segments
                            const rx = ax - bx, ry = ay - by, rz = az - bz;
                            const ff = vx * rx + vy * ry + vz * rz, cc = ux * rx + uy * ry + uz * rz, bb = ux * vx + uy * vy + uz * vz;
                            const den = aa * ee - bb * bb;
                            let s = den > 1e-8 ? pc.math.clamp((bb * ff - cc * ee) / den, 0, 1) : 0.5;
                            let t = ee > 1e-8 ? (bb * s + ff) / ee : 0;
                            if (t < 0) { t = 0; s = aa > 1e-8 ? pc.math.clamp(-cc / aa, 0, 1) : 0; }
                            else if (t > 1) { t = 1; s = aa > 1e-8 ? pc.math.clamp((bb - cc) / aa, 0, 1) : 0; }
                            let dx = rx + ux * s - vx * t, dy = ry + uy * s - vy * t, dz = rz + uz * s - vz * t;
                            const d2 = dx * dx + dy * dy + dz * dz;
                            if (d2 >= gap * gap) continue;
                            let d = Math.sqrt(d2);
                            if (d < 0.001) {
                                // same point: across both tubes, always the same way for this pair
                                dx = uy * vz - uz * vy; dy = uz * vx - ux * vz; dz = ux * vy - uy * vx;
                                d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                                if (d < 0.001) { dx = 0; dy = 1; dz = 0; d = 1; }
                                dx /= d; dy /= d; dz /= d;
                                d = 0;
                            } else {
                                dx /= d; dy /= d; dz /= d;
                            }
                            // a shoulder or a hand hardly moves: the other arm takes its share
                            const push = (gap - d) * 0.5;
                            const pa = (n === 0 || n === seg - 1) ? push * 2 : push, pb2 = (m === 0 || m === seg - 1) ? push * 2 : push;
                            const da = A.disp, db = B.disp;
                            da[a0] += dx * pa * (1 - s); da[a0 + 1] += dy * pa * (1 - s); da[a0 + 2] += dz * pa * (1 - s);
                            da[a0 + 3] += dx * pa * s; da[a0 + 4] += dy * pa * s; da[a0 + 5] += dz * pa * s;
                            db[b0] -= dx * pb2 * (1 - t); db[b0 + 1] -= dy * pb2 * (1 - t); db[b0 + 2] -= dz * pb2 * (1 - t);
                            db[b0 + 3] -= dx * pb2 * t; db[b0 + 4] -= dy * pb2 * t; db[b0 + 5] -= dz * pb2 * t;
                            pushed = true;
                        }
                    }
                }
            }
            if (!pushed) return;
            const last = seg * 3;
            for (let i = 0; i < count; i++) {
                const disp = arms[i].disp, pts = arms[i].pts;
                let px = disp[0], py = disp[1], pz = disp[2];
                for (let k = 0; k <= seg; k++) {
                    const q = k * 3, nq = k < seg ? q + 3 : q;
                    const cx = disp[q], cy = disp[q + 1], cz = disp[q + 2];
                    const w = q === 0 ? 0.4 : q === last ? 0 : 1.6;
                    pts[q] += (px * 0.25 + cx * 0.5 + disp[nq] * 0.25) * w;
                    pts[q + 1] += (py * 0.25 + cy * 0.5 + disp[nq + 1] * 0.25) * w;
                    pts[q + 2] += (pz * 0.25 + cz * 0.5 + disp[nq + 2] * 0.25) * w;
                    px = cx; py = cy; pz = cz;
                }
            }
        }
    };

    // A hand in the air goes around the torso.
    SpiderObbyArms.prototype.keepOutOfBody = function (p) {
        const c = this.center, u = this.up, r = this.bodyRadius + 0.3 * this.clawScale + 0.1;
        const qx = p.x - c.x, qy = p.y - c.y, qz = p.z - c.z;
        const h = pc.math.clamp(qx * u.x + qy * u.y + qz * u.z, -1.5, 0.85);
        let dx = qx - u.x * h, dy = qy - u.y * h, dz = qz - u.z * h;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= r * r) return;
        let d = Math.sqrt(d2);
        if (d < 0.001) { dx = -this.forward.x; dy = -this.forward.y; dz = -this.forward.z; d = 1; }
        p.set(c.x + u.x * h + dx * r / d, c.y + u.y * h + dy * r / d, c.z + u.z * h + dz * r / d);
    };

    // The arm goes around the torso, not through it (a capsule along the body's up).
    SpiderObbyArms.prototype.avoidBody = function (seg) {
        const c = this.center, ux = this.up.x, uy = this.up.y, uz = this.up.z, r = this.bodyRadius + this.armRadius + 0.05, r2 = r * r;
        for (let i = 0; i < this.arms.length; i++) {
            const pts = this.arms[i].pts;
            for (let k = 1; k <= seg; k++) {
                const q = k * 3, qx = pts[q] - c.x, qy = pts[q + 1] - c.y, qz = pts[q + 2] - c.z;
                let h = qx * ux + qy * uy + qz * uz;
                h = h < -1 ? -1 : h > 0.85 ? 0.85 : h;
                let dx = qx - ux * h, dy = qy - uy * h, dz = qz - uz * h;
                const d2 = dx * dx + dy * dy + dz * dz;
                if (d2 >= r2) continue;
                let d = Math.sqrt(d2);
                if (d < 0.001) { dx = -this.forward.x; dy = -this.forward.y; dz = -this.forward.z; d = 1; }
                const m = r / d;
                pts[q] = c.x + ux * h + dx * m;
                pts[q + 1] = c.y + uy * h + dy * m;
                pts[q + 2] = c.z + uz * h + dz * m;
            }
        }
    };

    SpiderObbyArms.prototype.drawCurve = function (batch, arm, seg, cam, hide2) {
        const pts = arm.pts, r0 = this.armRadius;
        const wave = this.heat * this.strainPulse, wavePhase = this.strainTime * 6.283 * 1.5;
        for (let k = 0; k < seg; k++) {
            const q = k * 3, ax = pts[q], ay = pts[q + 1], az = pts[q + 2];
            const tx = pts[q + 3] - ax, ty = pts[q + 4] - ay, tz = pts[q + 5] - az;
            const px = ax + tx * 0.5, py = ay + ty * 0.5, pz = az + tz * 0.5;
            if (cam && (px - cam.x) * (px - cam.x) + (py - cam.y) * (py - cam.y) + (pz - cam.z) * (pz - cam.z) < hide2) continue;
            const length = Math.sqrt(tx * tx + ty * ty + tz * tz) || 0.001;
            const dx = tx / length, dy = ty / length, dz = tz / length;
            // any axis across the tube: the segment is round
            let sx, sy, sz;
            if (Math.abs(dy) < 0.9) { sx = -dz; sy = 0; sz = dx; } else { sx = 0; sy = dz; sz = -dy; }
            const sl = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
            sx /= sl; sy /= sl; sz /= sl;
            // X x Y = Z: a mirrored matrix flips the winding and the back faces are the ones drawn
            const qx = sy * dz - sz * dy, qy = sz * dx - sx * dz, qz = sx * dy - sy * dx;
            const swell = wave > 0 ? 1 + wave * (0.5 + 0.5 * Math.sin(wavePhase - k * 0.8 + arm.index)) : 1;
            const r = (k === 0 ? r0 * 1.1 : r0 * (1 - 0.28 * (k + 1) / seg)) * swell;
            batch.push(PATTERN[k % PATTERN.length], sx * r, sy * r, sz * r, tx * 1.04, ty * 1.04, tz * 1.04, qx * r, qy * r, qz * r, px, py, pz);
        }
        // red shoulder
        const sr = r0 * 1.3;
        batch.push(SpiderObby_ArmBatch.RED, sr, 0, 0, 0, sr * 0.9, 0, 0, 0, sr, pts[0], pts[1], pts[2]);
    };
})();
