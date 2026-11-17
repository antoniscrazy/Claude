var RotateAround = pc.createScript('rotateAround');

/* // Initialize the script
RotateAround.prototype.initialize = function () {
    this.player = this.app.networkManager.localCamera;
    this.cylinder = this.entity;
};

// Update function called every frame
RotateAround.prototype.update = function (dt) {
    if (!this.player || !this.cylinder) return;

    // Get the world position of the player and the text (around the cylinder)
    var playerPos = this.player.getPosition();

    // Get the cylinder position (pivot point)
    var cylinderPos = this.cylinder.getPosition();

    // Calculate the direction from the text to the player, but lock to Y-axis
    var direction = playerPos.clone().sub(cylinderPos);
    direction.y = 0; // Ignore Y-axis movement to only rotate on Y-axis

    // Get the target rotation for the text to face the player horizontally
    var targetRotation = new pc.Quat();
    targetRotation.setFromEulerAngles(0, Math.atan2(direction.x, direction.z) * pc.math.RAD_TO_DEG, 0);

    // Apply the rotation to the text entity (on Y-axis only)
    this.entity.setRotation(targetRotation);
};
 */