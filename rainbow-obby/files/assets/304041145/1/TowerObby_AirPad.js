var TowerObbyAirPad = pc.createScript('towerObbyAirPad');

TowerObbyAirPad.attributes.add("tags", { type: "string", array: true, title: "Tags", default: ["Player"] });

TowerObbyAirPad.attributes.add("riseSpeed", {
    type: "number", default: 12, title: "Rise Speed",
    description: "Fanin tasidigi yukari hiz (m/s). Sabit hizdir, patlama gibi firlatmaz."
});

TowerObbyAirPad.attributes.add("rampUpTime", {
    type: "number", default: 0.25, title: "Ramp Up Time",
    description: "Tam hiza kac saniyede ulassin. 0 = aninda."
});

TowerObbyAirPad.attributes.add("liftHeight", {
    type: "number", default: 10, title: "Lift Height",
    description: "Pad'in ust yuzeyinden kac metre yukari kadar ufurmeye devam etsin. 0 = sadece collider hacminin icinde."
});

TowerObbyAirPad.attributes.add("radiusPadding", {
    type: "number", default: 0.5, title: "Radius Padding",
    description: "Yatayda collider disina ne kadar tasma payi birakilsin."
});

TowerObbyAirPad.attributes.add("print", { type: "boolean", default: false, title: "Debug Log" });

// initialize code called once per entity
TowerObbyAirPad.prototype.initialize = function () {
    this._target = null;
    this._power = 0;
    this._scale = new pc.Vec3();
    this._bounds = { center: new pc.Vec3(), halfX: 0.5, halfZ: 0.5, top: 0, bottom: 0 };

    if (this.entity.collision) {
        // trigger (rigidbody yok)
        this.entity.collision.on("triggerenter", this.handleEnter, this);
        this.entity.collision.on("triggerleave", this.handleLeave, this);

        // solid (rigidbody var) objeler trigger degil collision eventi atar
        this.entity.collision.on("collisionstart", (result) => {
            if (result && result.other) { this.handleEnter(result.other); }
        }, this);
        this.entity.collision.on("collisionend", this.handleLeave, this);
    } else {
        console.warn("towerObbyAirPad: " + this.entity.name + " uzerinde collision component yok.");
    }

    this.app.on("PlayerDied", this.release, this);
    this.app.on("Respawned", this.release, this);

    this.on("disable", this.release, this);
    this.on("destroy", () => {
        this.release();
        this.app.off("PlayerDied", this.release, this);
        this.app.off("Respawned", this.release, this);
    }, this);
};

TowerObbyAirPad.prototype.hasAnyTag = function (other) {
    if (!other || !other.tags) { return false; }
    for (let i = 0; i < this.tags.length; i++) {
        if (other.tags.has(this.tags[i])) { return true; }
    }
    return false;
};

TowerObbyAirPad.prototype.handleEnter = function (other) {
    if (!this.hasAnyTag(other) || !other.rigidbody) { return; }
    if (this._target === other) { return; }

    this._target = other;
    this._power = 0;

    if (this.print) { console.log("airPad enter", this.entity.name, other.name); }
};

TowerObbyAirPad.prototype.handleLeave = function (other) {
    // liftHeight varsa kolon collider'dan yukari uzuyor, cikisa update karar verir
    if (this.liftHeight > 0) { return; }
    if (other !== this._target) { return; }
    this.release();
};

// update code called every frame
TowerObbyAirPad.prototype.update = function (dt) {
    if (!this._target) { return; }

    if (!this._target.enabled || !this._target.rigidbody || !this.isInsideColumn(this._target)) {
        this.release();
        return;
    }

    if (this.rampUpTime > 0) {
        this._power = Math.min(this.riseSpeed, this._power + (this.riseSpeed / this.rampUpTime) * dt);
    } else {
        this._power = this.riseSpeed;
    }

    // PlayerController her frame linearVelocity'yi kendi set ediyor, o yuzden
    // force degil onun kendi push kanalini besliyoruz (jump da bu sirada kilitli kalir)
    const push = this.getPush();
    this.app._towerObbyAirPadOwner = this;
    push.direction.set(0, 1, 0);
    push.power = this._power;
    push.active = true;
};

TowerObbyAirPad.prototype.getPush = function () {
    if (!this.app.playerPush) {
        this.app.playerPush = { active: false, direction: new pc.Vec3(0, 0, 0), power: 5 };
    }
    if (!this.app.playerPush.direction) {
        this.app.playerPush.direction = new pc.Vec3(0, 0, 0);
    }
    return this.app.playerPush;
};

TowerObbyAirPad.prototype.release = function () {
    if (this._target && this.print) { console.log("airPad release", this.entity.name); }

    this._target = null;
    this._power = 0;

    // baska bir pad devraldiysa onun itisini kapatma
    if (this.app.playerPush && this.app._towerObbyAirPadOwner === this) {
        this.app.playerPush.active = false;
        this.app._towerObbyAirPadOwner = null;
    }
};

// pad'in ustundeki hava kolonu: yatayda collider genisligi, dikeyde collider ustu + liftHeight
TowerObbyAirPad.prototype.isInsideColumn = function (other) {
    const b = this.getBounds();
    const p = other.getPosition();

    if (Math.abs(p.x - b.center.x) > b.halfX + this.radiusPadding) { return false; }
    if (Math.abs(p.z - b.center.z) > b.halfZ + this.radiusPadding) { return false; }
    if (p.y > b.top + Math.max(this.liftHeight, 0)) { return false; }
    if (p.y < b.bottom - 2) { return false; }

    return true;
};

// not: yatay sinir eksen hizalidir, pad'i Y'de dondurursen kolon donmez
TowerObbyAirPad.prototype.getBounds = function () {
    const b = this._bounds;
    const pos = this.entity.getPosition();
    const c = this.entity.collision;

    this.entity.getWorldTransform().getScale(this._scale);

    let hx = 0.5, hy = 0.5, hz = 0.5;

    if (c) {
        if (c.type === "sphere") {
            hx = hy = hz = c.radius;
        } else if (c.type === "capsule" || c.type === "cylinder" || c.type === "cone") {
            hx = hz = c.radius;
            hy = c.height * 0.5;
        } else if (c.type === "box") {
            hx = c.halfExtents.x;
            hy = c.halfExtents.y;
            hz = c.halfExtents.z;
        } else if (this.entity.render && this.entity.render.meshInstances.length > 0) {
            // mesh collider: render aabb'si zaten world space
            const aabb = this.entity.render.meshInstances[0].aabb;
            b.center.copy(aabb.center);
            b.halfX = aabb.halfExtents.x;
            b.halfZ = aabb.halfExtents.z;
            b.top = aabb.center.y + aabb.halfExtents.y;
            b.bottom = aabb.center.y - aabb.halfExtents.y;
            return b;
        }
    }

    b.center.set(pos.x, pos.y, pos.z);

    if (c && c.linearOffset) {
        b.center.x += c.linearOffset.x * this._scale.x;
        b.center.y += c.linearOffset.y * this._scale.y;
        b.center.z += c.linearOffset.z * this._scale.z;
    }

    b.halfX = hx * Math.abs(this._scale.x);
    b.halfZ = hz * Math.abs(this._scale.z);
    b.top = b.center.y + hy * Math.abs(this._scale.y);
    b.bottom = b.center.y - hy * Math.abs(this._scale.y);

    return b;
};
