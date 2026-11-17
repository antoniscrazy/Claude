/*
 * Skate interactables (GameModes/Skateboard/Templates):
 *   slippery - PK_Engel_Kaygan_Birikinti: no grip, almost no steering, the board keeps sliding
 *   sticky   - PK_Engel_Yapiskan_Balcik: the board gets stuck, speed drops, weak ollie
 *   grind    - PK_Grind_Ray: ollie onto the rail to grind along it (Space jumps off)
 *   loop     - PK_Rampa_Loop: ride in fast enough to go around the loop
 *
 * This script only describes the object; the local player controller does the riding.
 * Geometry values are in the entity's local units (the models are in cm, entity scale 0.01).
 */
var SkateboardObbyInteractable = pc.createScript('skateboardObbyInteractable');

SkateboardObbyInteractable.attributes.add('kind', {
    type: 'string', default: 'slippery', title: 'Kind',
    enum: [{ 'Slippery puddle': 'slippery' }, { 'Sticky goo': 'sticky' }, { 'Grind rail': 'grind' }, { 'Loop': 'loop' }]
});

// grind rail: the rail runs along local Z at this height (top of the bar)
SkateboardObbyInteractable.attributes.add('railHeight', { type: 'number', default: 79.5, title: 'Rail Top Height (local)' });

// loop: ring in the local Y-Z plane, entered at the bottom riding towards -Z, track drifts along +X
SkateboardObbyInteractable.attributes.add('loopRadius', { type: 'number', default: 500, title: 'Loop Radius (local)' });
SkateboardObbyInteractable.attributes.add('loopCenterY', { type: 'number', default: 500, title: 'Loop Centre Height (local)' });
SkateboardObbyInteractable.attributes.add('loopEntryX', { type: 'number', default: 0, title: 'Loop Entry Lane X (local)' });
SkateboardObbyInteractable.attributes.add('loopDrift', { type: 'number', default: 500, title: 'Loop Side Drift (local)', description: 'How far the track moves sideways (local X) over one turn' });
SkateboardObbyInteractable.attributes.add('loopLaneHalfWidth', { type: 'number', default: 180, title: 'Loop Lane Half Width (local)' });

SkateboardObbyInteractable.prototype.initialize = function () {
    this.localAabb = new pc.BoundingBox();
    const renders = this.entity.findComponents('render');
    let first = true;
    for (const r of renders) {
        for (const mi of r.meshInstances) {
            if (!mi.mesh) continue;
            if (first) { this.localAabb.copy(mi.mesh.aabb); first = false; }
            else this.localAabb.add(mi.mesh.aabb);
        }
    }
    this._inv = new pc.Mat4();

    const list = this.app.skateInteractables || (this.app.skateInteractables = []);
    list.push(this);
    this.on('destroy', () => {
        const i = list.indexOf(this);
        if (i >= 0) list.splice(i, 1);
    });
};

// world point -> local point (entity space, model units)
SkateboardObbyInteractable.prototype.toLocal = function (worldPoint, out) {
    this._inv.copy(this.entity.getWorldTransform()).invert();
    return this._inv.transformPoint(worldPoint, out || new pc.Vec3());
};

SkateboardObbyInteractable.prototype.toWorld = function (localPoint, out) {
    return this.entity.getWorldTransform().transformPoint(localPoint, out || new pc.Vec3());
};

SkateboardObbyInteractable.prototype.dirToWorld = function (localDir, out) {
    out = this.entity.getWorldTransform().transformVector(localDir, out || new pc.Vec3());
    return out.normalize();
};

SkateboardObbyInteractable.prototype.dirToLocal = function (worldDir, out) {
    this._inv.copy(this.entity.getWorldTransform()).invert();
    out = this._inv.transformVector(worldDir, out || new pc.Vec3());
    return out;
};

// world units -> local units
SkateboardObbyInteractable.prototype.localScale = function () {
    return this.entity.getScale().x || 1;
};
