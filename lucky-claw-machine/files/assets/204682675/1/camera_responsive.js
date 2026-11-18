var CameraResponsive = pc.createScript('cameraResponsive');

CameraResponsive.attributes.add("fov_landscape",{type:"number"});
CameraResponsive.attributes.add("fov_portrait",{type:"number"});

// initialize code called once per entity
CameraResponsive.prototype.initialize = function() {
    this._device = this.app.graphicsDevice;
};

// update code called every frame
CameraResponsive.prototype.update = function(dt) {
    const aspect = pc.math.clamp(this._device.width / this._device.height,0,1);   
    this.entity.camera.fov = pc.math.lerp(this.fov_portrait,this.fov_landscape,aspect);
};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// CameraResponsive.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/