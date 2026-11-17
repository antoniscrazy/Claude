var AsmrMode_CameraController = pc.createScript('asmrModeCameraController');

AsmrMode_CameraController.attributes.add('mouseSpeed', { type: 'number', default: 1.4, description: 'Mouse Sensitivity' });

// Called once after all resources are loaded and before the first update
AsmrMode_CameraController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.asmrModeNetworkManager;
    this.eventsAdded = false;
    this.eulers = new pc.Vec3(0, 10, 0);
    this.touchCoords = new pc.Vec2();
    this.app.firstTouch = false;
    this.rayEnd = this.entity.parent.findByName('RaycastEndPoint');
    this.originEntity = this.entity.parent;
    this.isHoldingRightMouse = false;
    this.app.mouse.disableContextMenu();
    this.getMouseZoomFromStorage();
    this.onOrientationChange();
    this._onOrientationChangeBound = this.onOrientationChange.bind(this);
    window.addEventListener("resize", this._onOrientationChangeBound, false);
    window.addEventListener("orientationchange", this._onOrientationChangeBound, false);
    this.on('destroy', () => {
        window.removeEventListener("resize", this._onOrientationChangeBound, false);
        window.removeEventListener("orientationchange", this._onOrientationChangeBound, false);
    });
    this.app.mouse.on("mousemove", this.onMouseMove, this);
    this.app.mouse.on("mousedown", this.onMouseDown, this);
    this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);

    this.app.cameraEntity = this.entity;

    this.app.on("Camera:SetEulers", (_eulers) => {
        this.eulers = _eulers;
        //console.log("eulers", _eulers);
    })

    this.on('destroy', function () {
        this.app.mouse.off("mousemove", this.onMouseMove, this);
        this.app.mouse.off("mousedown", this.onMouseDown, this);
        this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
        this.app.off("Camera:SetEulers");
    }, this);

    const onKeyPrevent = ev => {
        if (['ArrowDown', 'ArrowUp', ' '].includes(ev.key)) {
            ev.preventDefault();
        }
    };
    const onWheelPrevent = ev => ev.preventDefault();
    window.addEventListener('keydown', onKeyPrevent);
    window.addEventListener('wheel', onWheelPrevent, { passive: false });
    this.on('destroy', () => {
        window.removeEventListener('keydown', onKeyPrevent);
        window.removeEventListener('wheel', onWheelPrevent);
    });
};

AsmrMode_CameraController.prototype.resetCamera = function () {
    this.rayEnd = this.entity.parent.findByName('RaycastEndPoint');
    this.originEntity = this.entity.parent;

}

AsmrMode_CameraController.prototype.onOrientationChange = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > h) {
        this.horizontal = true;
    }
    else {
        this.vertical = true;
    }
}

AsmrMode_CameraController.prototype.reset = function () {
    this.eulers = new pc.Vec3(0, 10, 0);
    //this.eulers.x = this.getYaw(this.networkManager.savePoints.children[this.app.currentStage].children[1].getRotation()) - 90;
};

AsmrMode_CameraController.prototype.getYaw = function (quat) {
    let transformedForward = new pc.Vec3();
    quat.transformVector(pc.Vec3.FORWARD, transformedForward);
    return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
};

AsmrMode_CameraController.prototype.getMouseZoomFromStorage = function () {
    let zoom = Number.parseFloat(AsmrMode_Utils.getItem("AsmrMode_mouseScroll"));
    if (zoom != null && isNaN(zoom) == false) {
        this.app.mouseScroll = zoom;
    } else {
        this.app.mouseScroll = 4;
    }
};

AsmrMode_CameraController.prototype.setMouseZoom = function (dt) {
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

AsmrMode_CameraController.prototype.onMouseWheel = function (event) {
    this.app.mouseScroll += event.wheelDelta;
    if (this.app.mouseScroll < 0)
        this.app.mouseScroll = 0;
    if (this.app.mouseScroll > 16)
        this.app.mouseScroll = 16;

    AsmrMode_Utils.setItem("AsmrMode_mouseScroll", this.app.mouseScroll);
};

AsmrMode_CameraController.prototype.setSensitivity = function () {
    const data = parseInt(AsmrMode_Utils.getItem("mouseSensitivity"));
    if (data != null && isNaN(data) == false) {
        this.mouseSpeed = data / 3;
    } else {
        this.mouseSpeed = 10;
    }
};

AsmrMode_CameraController.prototype.removeEventCallbacks = function () {
    this.eventsAdded = false;
    this.app.mouse.off("mousemove", this.onMouseMove, this);
    this.app.mouse.off("mousedown", this.onMouseDown, this);
};

AsmrMode_CameraController.prototype.addEventCallbacks = function () {
    if (this.eventsAdded == false) {
        this.eventsAdded = true;
        this.app.mouse.on("mousemove", this.onMouseMove, this);
        this.app.mouse.on("mousedown", this.onMouseDown, this);
    }
};


AsmrMode_CameraController.prototype.postUpdate = function (dt) {
    this.setMouseZoom(dt);
    const targetY = this.eulers.x + 180;
    const targetX = this.eulers.y;
    const targetAng = new pc.Vec3(-targetX, targetY, 0);

    this.originEntity.setEulerAngles(targetAng);
    const pos = this.getWorldPoint();

    this.entity.setPosition(pos);

    this.entity.lookAt(this.originEntity.getPosition());

    //set fov
    this.entity.camera.fov = pc.math.lerp(this.entity.camera.fov, this.app.targetFov, 3 * dt);
};

AsmrMode_CameraController.prototype.onMouseMove = function (e) {
    var dx = Math.min(Math.max(e.dx, -50), 50);
    var dy = Math.min(Math.max(e.dy, -50), 50);

    if (!this.app.isEdit) {
        this.eulers.x -= (((this.mouseSpeed) * dx) / 60) % 360;
        this.eulers.y += (((this.mouseSpeed) * dy) / 60) % 360;
    }

    if (this.eulers.x < 0) this.eulers.x += 360;
    if (this.eulers.y < 0) this.eulers.y += 360;

    this.eulers.y %= 360;
    if (this.eulers.y > 85 && this.eulers.y < 180)
        this.eulers.y = 85;
    else if (this.eulers.y < 350 && this.eulers.y > 280)
        this.eulers.y = 350;
};

AsmrMode_CameraController.prototype.onMouseDown = function (e) {
    this.app.firstTouch = true;
};

AsmrMode_CameraController.prototype.getWorldPoint = function () {
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
