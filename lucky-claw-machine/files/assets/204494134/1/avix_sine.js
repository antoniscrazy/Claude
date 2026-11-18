var AvixSine = pc.createScript('avixSine');

AvixSine.attributes.add("unscaled_update", { type: "boolean" });

AvixSine.schemaSine = [
    {
        name: "enabled",
        type: "boolean",
        default: false
    },
    {
        name: "wave",
        type: "string",
        default: "sine",
        enum: [
            { "sine": "sine" },
            { "triangle": "triangle" },
            { "sawtooth": "sawtooth" },
            { "reverseSawtooth": "reverseSawtooth" },
            { "square": "square" },
        ]
    },
    {
        name: "vector",
        type: "vec3"
    },
    {
        name: "vectorRandom",
        type: "vec3"
    },
    {
        name: "period",
        type: "number",
        default: 4,
    },
    {
        name: "periodRandom",
        type: "number",
        default: 0
    },
    {
        name: "periodOffset",
        type: "number",
        default: 0
    },
    {
        name: "periodOffsetRandom",
        type: "number",
        default: 0
    },
    {
        name: "magnitude",
        type: "number",
        default: 1
    },
    {
        name: "magnitudeRandom",
        type: "number",
        default: 0
    },
];

AvixSine.attributes.add("sineScale", {
    type: "json", schema: AvixSine.schemaSine,
});
AvixSine.attributes.add("sinePosition", {
    type: "json", schema: AvixSine.schemaSine,
});
AvixSine.attributes.add("sineAngle", {
    type: "json", schema: AvixSine.schemaSine,
});

// initialize code called once per entity
AvixSine.prototype.initialize = function () {
    this._2pi = 2 * Math.PI;
    this._pi_2 = Math.PI / 2;
    this._3pi_2 = (3 * Math.PI) / 2;

    this.sineScale.movement = "scale";
    this.sinePosition.movement = "position";
    this.sineAngle.movement = "angle";

    this.sineScaleNew = this.initSine(this.sineScale);
    this.sinePositionNew = this.initSine(this.sinePosition);
    this.sineAngleNew = this.initSine(this.sineAngle);

    this.app.on("frameupdate", this.unscaledUpdate, this);
};

AvixSine.prototype.initSine = function (sineFromList) {
    let sine = {};
    if (sineFromList.period == 0) {
        sine.i = 0;
    }
    else {
        sine.i = (sineFromList.periodOffset / sineFromList.period) * this._2pi;
        sine.i += ((Math.random() * sineFromList.periodOffsetRandom) / sineFromList.period) * this._2pi;
    }
    sine.mag = Math.random() * sineFromList.magnitudeRandom;
    sine.vectorRandom = new pc.Vec3(
        Math.random() * sineFromList.vectorRandom.x,
        Math.random() * sineFromList.vectorRandom.y,
        Math.random() * sineFromList.vectorRandom.z
    );
    sine.periodRandom = Math.random() * sineFromList.periodRandom;

    sine.initialValue = new pc.Vec3(0, 0, 0);

    switch (sineFromList.movement) {
        case "scale":
            sine.initialValue = this.entity.getLocalScale().clone();
            break;
        case "position":
            sine.initialValue = this.entity.getLocalPosition().clone();
            break;
        case "angle":
            sine.initialValue = this.entity.getLocalEulerAngles().clone();
            break;
    }
    sine.lastKnownValue = sine.initialValue;
    sine.r = new pc.Vec3(); //vector helper para sacar cuentas sin tener que hacer "new pc.Vec3()" todas las veces
    sine.r2 = new pc.Vec3(); //vector helper para sacar cuentas sin tener que hacer "new pc.Vec3()" todas las veces
    return sine;
};

// update code called every frame
AvixSine.prototype.update = function (dt) {
    if (!this.unscaled_update) {
        this.generalUpdate(dt);
    }
};

AvixSine.prototype.unscaledUpdate = function (dt) {
    if (this.unscaled_update && this.enabled) {
        this.generalUpdate(dt / 1000);
    }
};

AvixSine.prototype.generalUpdate = function (dt) {
    this.updateSine(this.sineScaleNew, this.sineScale, dt);
    this.updateSine(this.sinePositionNew, this.sinePosition, dt);
    this.updateSine(this.sineAngleNew, this.sineAngle, dt);
};

AvixSine.prototype.updateSine = function (sine, sineFromList, dt) {
    if (!sineFromList.enabled) return;

    if ((sineFromList.period + sine.periodRandom) == 0) {
        sine.i = 0;
    }
    else {
        sine.i += (dt / (sineFromList.period + sine.periodRandom)) * this._2pi;
        sine.i = sine.i % this._2pi;
    }

    let c = this.waveFunc(sineFromList, sine.i) * (sineFromList.magnitude + sine.mag);

    if (sineFromList.movement == "scale") {
        if (!this.entity.getLocalScale().equals(sine.lastKnownValue)) {
            sine.r.sub2(this.entity.getLocalScale(), sine.lastKnownValue);
            sine.initialValue.add(sine.r);
        }

        sine.r.x = sine.initialValue.x + (sineFromList.vector.x + sine.vectorRandom.x) * c;
        sine.r.y = sine.initialValue.y + (sineFromList.vector.y + sine.vectorRandom.y) * c;
        sine.r.z = sine.initialValue.z + (sineFromList.vector.z + sine.vectorRandom.z) * c;

        let vec = sine.r.clone();
        this.entity.setLocalScale(vec);
        sine.lastKnownValue = this.entity.getLocalScale();
    }
    else if (sineFromList.movement == "position") {
        if (!this.entity.getLocalPosition().equals(sine.lastKnownValue)) {
            sine.r.sub2(this.entity.getLocalPosition().clone(), sine.lastKnownValue);
            sine.initialValue.add(sine.r);
        }

        sine.r.x = sine.initialValue.x + (sineFromList.vector.x + sine.vectorRandom.x) * c;
        sine.r.y = sine.initialValue.y + (sineFromList.vector.y + sine.vectorRandom.y) * c;
        sine.r.z = sine.initialValue.z + (sineFromList.vector.z + sine.vectorRandom.z) * c;

        let vec = sine.r.clone();
        this.entity.setLocalPosition(vec);
        sine.lastKnownValue = this.entity.getLocalPosition().clone();
    }
    else if (sineFromList.movement == "angle") {
        if (!this.entity.getLocalEulerAngles().equals(sine.lastKnownValue)) {
            sine.r.sub2(this.entity.getLocalEulerAngles().clone(), sine.lastKnownValue);
            sine.initialValue.add(sine.r);
        }

        sine.r.x = sine.initialValue.x + (sineFromList.vector.x + sine.vectorRandom.x) * c;
        sine.r.y = sine.initialValue.y + (sineFromList.vector.y + sine.vectorRandom.y) * c;
        sine.r.z = sine.initialValue.z + (sineFromList.vector.z + sine.vectorRandom.z) * c;

        let vec = sine.r.clone();
        this.entity.setLocalEulerAngles(vec);
        sine.lastKnownValue = this.entity.getLocalEulerAngles().clone();
    }
};

AvixSine.prototype.waveFunc = function (sineFromList, x) {
    x = x % this._2pi;
    switch (sineFromList.wave) {
        case "sine":		// sine
            return Math.sin(x);
        case "triangle":		// triangle
            if (x <= this._pi_2) {
                return x / this._pi_2;
            }
            else if (x <= this._3pi_2) {
                return 1 - (2 * (x - this._pi_2) / Math.PI);
            }
            else {
                return (x - this._3pi_2) / this._pi_2 - 1;
            }
        case "sawtooth":		// sawtooth
            return 2 * x / this._2pi - 1;
        case "reverseSawtooth":		// reverse sawtooth
            return -2 * x / this._2pi + 1;
        case "square":		// square
            return x < Math.PI ? -1 : 1;
    };


    // should not reach here
    return 0;
};