var SkateboardObby_MobileCameraController = pc.createScript('skateboardObbyMobileCameraController');

// Script attributes to control the sensitivity of the camera look with touch
SkateboardObby_MobileCameraController.attributes.add("touchLookSensitivity", { type: "number", default: 0, title: "Touch Look Sensitivity" });

// 'Snappiness' factor (how fast does the camera reach the target rotation and distance)
SkateboardObby_MobileCameraController.attributes.add("snappinessFactor", { type: "number", default: 0.1, title: "Snappiness Factor", description: "Lower is faster" });


SkateboardObby_MobileCameraController.prototype.initialize = function () {
    this.eulers = new pc.Vec3(180, 10, 0);
    this.joystickBaseEntity = this.app.root.findByName('Left Half Touch Joystick').children[0];
    // Cache some temp variables for use later
    this._tempQuat1 = new pc.Quat();
    this._tempQuat2 = new pc.Quat();
    this._tempVec3_1 = new pc.Vec3();

    // Calculate the camera euler angle rotation around x and y axes
    // This allows us to place the camera at a particular rotation to begin with in the scene
    var quat = this.entity.getLocalRotation();
    this.ey = this.getYaw(quat) * pc.math.RAD_TO_DEG;
    this.ex = this.getPitch(quat, this.ey) * pc.math.RAD_TO_DEG;

    // The target rotation for the camera to rotate to
    this.targetEx = this.ex;
    this.targetEy = this.ey;

    this.rayEnd = this.app.root.findByName('RaycastEndPoint');
    this.originEntity = this.entity.parent;

    // Store the position of the touch so we can calculate the distance moved
    this.lastTouchPosition = new pc.Vec2();

    this.addEventCallbacks();
    this.getMouseZoomFromStorage();
    this.onOrientationChange();
    // bound once so destroy can remove them (see SkateboardObby_CameraController)
    this._onOrientationChange = this.onOrientationChange.bind(this);
    window.addEventListener("resize", this._onOrientationChange, false);
    window.addEventListener("orientationchange", this._onOrientationChange, false);

    this.app.on('EnterFPS', this.onEnterFPS, this);
    this.app.on('ExitFPS', this.onExitFPS, this);

    this.on('destroy', function () {
        this.app.off('EnterFPS', this.onEnterFPS, this);
        this.app.off('ExitFPS', this.onExitFPS, this);
        this.removeEventCallbacks();
        window.removeEventListener("orientationchange", this._onOrientationChange);
        window.removeEventListener("resize", this._onOrientationChange);
    }, this);
};

SkateboardObby_MobileCameraController.prototype.onEnterFPS = function () {
    this.app.isFPS = true;
    this.app.mouseScroll = 0;
    Utils.setItem("mouseScroll", this.app.mouseScroll);
    Utils.setItem("isFPS", true);
};

SkateboardObby_MobileCameraController.prototype.onExitFPS = function () {
    this.app.isFPS = false;
    this.app.mouseScroll = 4;
    Utils.setItem("isFPS", false);
};

SkateboardObby_MobileCameraController.prototype.getMouseZoomFromStorage = function () {
    let zoom = Number.parseFloat(Utils.getItem("mouseScroll"));
    if (zoom != null && isNaN(zoom) == false) {
        this.app.mouseScroll = zoom;
    } else {
        this.app.mouseScroll = 4;
    }
};

SkateboardObby_MobileCameraController.prototype.resetCamera = function () {
    this.rayEnd = this.entity.parent.findByName('RaycastEndPoint');
    this.originEntity = this.entity.parent;
};

SkateboardObby_MobileCameraController.prototype.reset = function () {
    this.eulers.x = 180;
};

SkateboardObby_MobileCameraController.prototype.onOrientationChange = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > h) {
        this.horizontal = true;
    }
    else {
        this.vertical = true;
    }
}

SkateboardObby_MobileCameraController.prototype.setMouseZoom = function (dt) {
    if (this.horizontal) {
        // Landscape
        const tempPos = this.rayEnd.getLocalPosition();
        this.oldTempPos = pc.math.lerp(tempPos.z, this.app.mouseScroll + 4, 20 * dt);
        if (this.oldTempPos != tempPos.z) {
            tempPos.z = this.oldTempPos;
            this.rayEnd.setLocalPosition(tempPos);
        }
    }
    else {
        // Portrait
        const tempPos = this.rayEnd.getLocalPosition();
        tempPos.z = this.app.mouseScroll + 8;
        this.rayEnd.setLocalPosition(tempPos);
    }
};

SkateboardObby_MobileCameraController.prototype.addEventCallbacks = function () {
    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        this.app.touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
    }
};


SkateboardObby_MobileCameraController.prototype.removeEventCallbacks = function () {
    if (this.app.touch) {
        this.app.touch.off(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        this.app.touch.off(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
    }
};


SkateboardObby_MobileCameraController.prototype.moveCamera = function (edx, edy, sensitivity) {
    var dx = Math.min(Math.max(edx, -50), 50);
    var dy = Math.min(Math.max(edy, -50), 50);

    this.eulers.x -= ((this.touchLookSensitivity * dx) / 60) % 360;
    this.eulers.y += ((this.touchLookSensitivity * dy) / 60) % 360;

    if (this.eulers.x < 0) this.eulers.x += 360;
    if (this.eulers.y < 0) this.eulers.y += 360;

    this.eulers.y %= 360;
    if (this.eulers.y > 85 && this.eulers.y < 180)
        this.eulers.y = 85;
    else if (this.eulers.y < 350 && this.eulers.y > 300)
        this.eulers.y = 350;
};

SkateboardObby_MobileCameraController.prototype.postUpdate = function (dt) {
    this.setMouseZoom(dt);
    const targetY = this.eulers.x + 180;
    const targetX = this.eulers.y;
    const targetAng = new pc.Vec3(-targetX, targetY, 0);

    this.originEntity.setEulerAngles(targetAng);
    const pos = this.getWorldPoint();

    this.entity.setPosition(pos);

    this.entity.lookAt(this.originEntity.getPosition());
};


SkateboardObby_MobileCameraController.prototype.onTouchStart = function (event) {
    // We only care about the first touch. As the user touches the screen, 
    // we stored the current touch position

    var touch;
    if (event.touches.length === 1 || event.touches[0].x > event.touches[1].x) {
        touch = event.touches[0];
    } else {
        touch = event.touches[1];
    }
    this.lastTouchPosition.set(touch.x, touch.y);
    this.app.firstTouch = true;
};


SkateboardObby_MobileCameraController.prototype.onTouchMove = function (event) {
    // We only care about the first touch. Work out the difference moved since the last event
    // and use that to update the camera target position 
    var touch;
    if (event.touches.length === 1) {
        if (this.joystickBaseEntity.enabled) {
            return;
        } else {
            touch = event.touches[0];
        }
    } else {
        if (event.touches[0].x > event.touches[1].x) {
            touch = event.touches[0];
        } else {
            touch = event.touches[1];
        }
    }

    this.moveCamera((touch.x - this.lastTouchPosition.x), (touch.y - this.lastTouchPosition.y), this.touchLookSensitivity);
    this.lastTouchPosition.set(touch.x, touch.y);
};


SkateboardObby_MobileCameraController.prototype.getYaw = function () {
    var forward = this.entity.forward.clone();
    return Math.atan2(-forward.x, -forward.z);
};

SkateboardObby_MobileCameraController.prototype.getYaw2 = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

SkateboardObby_MobileCameraController.prototype.getPitch = function (quaternion, yaw) {
    var quatWithoutYaw = this._tempQuat1;
    var yawOffset = this._tempQuat2;

    yawOffset.setFromEulerAngles(0, -yaw, 0);
    quatWithoutYaw.mul2(yawOffset, quaternion);

    var transformedForward = this._tempVec3_1;

    quatWithoutYaw.transformVector(pc.Vec3.FORWARD, transformedForward);

    return Math.atan2(transformedForward.y, -transformedForward.z);
};

SkateboardObby_MobileCameraController.prototype.getWorldPoint = function () {
    var from = this.originEntity.getPosition();
    var to = this.rayEnd.getPosition();

    var dir = to.clone().sub(from);
    var maxDist = dir.length();

    if (maxDist <= 0.001) {
        return to;
    }

    dir.normalize();

    var right = this.originEntity.right.clone().normalize();
    var up = this.originEntity.up.clone().normalize();

    // Kameranın sanal yarıçapı
    var radius = 0.28;

    // Duvara tam yapışmasın diye güvenli boşluk
    var safeOffset = 0.35;

    var rayOffsets = [
        new pc.Vec3(0, 0, 0),

        right.clone().scale(radius),
        right.clone().scale(-radius),

        up.clone().scale(radius),
        up.clone().scale(-radius),

        right.clone().scale(radius).add(up.clone().scale(radius)),
        right.clone().scale(-radius).add(up.clone().scale(radius)),
        right.clone().scale(radius).add(up.clone().scale(-radius)),
        right.clone().scale(-radius).add(up.clone().scale(-radius))
    ];

    var nearestDist = maxDist;

    for (var i = 0; i < rayOffsets.length; i++) {
        var rayFrom = from.clone().add(rayOffsets[i]);
        var rayTo = to.clone().add(rayOffsets[i]);

        var hit = this.app.systems.rigidbody.raycastFirstByTag(
            rayFrom,
            rayTo,
            "CameraCollider"
        );

        if (hit) {
            var hitDist = rayFrom.distance(hit.point) - safeOffset;

            if (hitDist < nearestDist) {
                nearestDist = hitDist;
            }
        }
    }

    nearestDist = pc.math.clamp(nearestDist, 0.35, maxDist);

    return from.clone().add(dir.scale(nearestDist));
};
