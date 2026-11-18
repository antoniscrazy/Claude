var DetectClick = pc.createScript('detectClick');

// initialize code called once per entity
DetectClick.prototype.initialize = function () {
    // Enable input listeners
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
    }
};

// update code called every frame
DetectClick.prototype.update = function (dt) {
    // No need for updates in this script
};

// Called when a mouse button is pressed
DetectClick.prototype.onMouseDown = function (event) {
    var camera = this.app.root.findByName('Camera'); // Replace 'Camera' if your camera has a different name
    var from = camera.camera.screenToWorld(event.x, event.y, camera.camera.nearClip);
    var to = camera.camera.screenToWorld(event.x, event.y, camera.camera.farClip);

    var result = this.app.systems.rigidbody.raycastFirst(from, to);

    if (result && result.entity === this.entity) {
        this.app.fire("grab_down");
        console.log('Object clicked:', this.entity.name);
    }
};

// Called when a touch starts
DetectClick.prototype.onTouchStart = function (event) {
    var touch = event.touches[0];
    this.onMouseDown({ x: touch.x, y: touch.y });
};

// Cleanup listeners when the script is destroyed
DetectClick.prototype.destroy = function () {
    this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    if (this.app.touch) {
        this.app.touch.off(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
    }
};