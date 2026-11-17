var ElectricObbyAirPusher = pc.createScript('electricObbyAirPusher');

ElectricObbyAirPusher.attributes.add("direction", { type: "vec3", default: [0, 1, 0] });
ElectricObbyAirPusher.attributes.add("power", { type: "number", default: 10 });
ElectricObbyAirPusher.attributes.add("acceleration", { type: "number", default: 60 });
ElectricObbyAirPusher.attributes.add("rampUpTime", { type: "number", default: 0.6 });
ElectricObbyAirPusher.attributes.add("rampDownTime", { type: "number", default: 0.35 });
ElectricObbyAirPusher.attributes.add("localSpace", { type: "boolean", default: false });
ElectricObbyAirPusher.attributes.add("tags", { type: "string", array: true, default: ["Player"] });

ElectricObbyAirPusher.prototype.initialize = function () {
    this._target = null;
    this._direction = new pc.Vec3();

    if (this.entity.collision) {
        this.entity.collision.on("triggerenter", this.handleEnter, this);
        this.entity.collision.on("triggerleave", this.handleLeave, this);
    } else {
        console.warn("electricObbyAirPusher: " + this.entity.name + " uzerinde collision component yok.");
    }

    this.app.on("playerDie", this.reset, this);
    this.app.on("Respawned", this.reset, this);

    this.on("disable", this.reset, this);
    this.on("destroy", () => {
        this.reset();
        this.app.off("playerDie", this.reset, this);
        this.app.off("Respawned", this.reset, this);
    }, this);
};

ElectricObbyAirPusher.prototype.hasAnyTag = function (other) {
    if (!other || !other.tags) { return false; }

    for (let i = 0; i < this.tags.length; i++) {
        if (other.tags.has(this.tags[i])) { return true; }
    }

    return false;
};

ElectricObbyAirPusher.prototype.handleEnter = function (other) {
    if (!this.hasAnyTag(other) || !other.rigidbody) { return; }

    this._target = other;
};

ElectricObbyAirPusher.prototype.handleLeave = function (other) {
    if (other !== this._target) { return; }

    this.release();
};

ElectricObbyAirPusher.prototype.update = function (dt) {
    if (!this._target) { return; }

    if (!this._target.enabled || !this._target.rigidbody) {
        this.release();
        return;
    }

    const push = this.getPush();
    this.app._electricObbyAirPusherOwner = this;
    push.direction.copy(this.getDirection());
    push.power = this.power;
    push.acceleration = this.acceleration;
    push.rampUpTime = this.rampUpTime;
    push.rampDownTime = this.rampDownTime;
    push.active = true;
};

ElectricObbyAirPusher.prototype.getDirection = function () {
    this._direction.copy(this.direction);

    if (this.localSpace) {
        this.entity.getRotation().transformVector(this._direction, this._direction);
    }

    if (this._direction.length() > 0) { this._direction.normalize(); }

    return this._direction;
};

ElectricObbyAirPusher.prototype.getPush = function () {
    if (!this.app.playerPush) {
        this.app.playerPush = { active: false, direction: new pc.Vec3(0, 0, 0), velocity: new pc.Vec3(0, 0, 0), power: 5, acceleration: 60, rampUpTime: 0.6, rampDownTime: 0.35, strength: 0 };
    }
    if (!this.app.playerPush.direction) {
        this.app.playerPush.direction = new pc.Vec3(0, 0, 0);
    }
    if (!this.app.playerPush.velocity) {
        this.app.playerPush.velocity = new pc.Vec3(0, 0, 0);
    }
    if (typeof this.app.playerPush.strength !== "number") {
        this.app.playerPush.strength = 0;
    }

    return this.app.playerPush;
};

ElectricObbyAirPusher.prototype.release = function () {
    this._target = null;

    if (this.app.playerPush && this.app._electricObbyAirPusherOwner === this) {
        this.app.playerPush.active = false;
        this.app._electricObbyAirPusherOwner = null;
    }
};

ElectricObbyAirPusher.prototype.reset = function () {
    const wasOwner = this.app._electricObbyAirPusherOwner === this;

    this.release();

    if (!wasOwner) { return; }

    const push = this.getPush();
    push.strength = 0;
    push.velocity.set(0, 0, 0);
};
