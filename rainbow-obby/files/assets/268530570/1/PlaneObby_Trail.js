var PlaneObbyTrail = pc.createScript('planeObbyTrail');

PlaneObbyTrail.attributes.add("color", {
    type: "rgb",
    title: "color"
});

PlaneObbyTrail.attributes.add("radius", {
    type: "number",
    title: "radius",
    default: 0.5
});

PlaneObbyTrail.attributes.add("lifetime", {
    type: "number",
    title: "lifetime",
    default: 1.2
});

PlaneObbyTrail.attributes.add("trailfadeness", {
    type: "number",
    title: "trailfadeness",
    default: 2,
    min: 1,
    max: 4
});

PlaneObbyTrail.attributes.add("opacityFactor", {
    type: "number",
    title: "opacityFactor",
    default: 0.8,
    min: 0.1,
    max: 1
});


PlaneObbyTrail.v1 = new pc.Vec3();
PlaneObbyTrail.q1 = new pc.Quat();
PlaneObbyTrail.m1 = new pc.Mat4();

PlaneObbyTrail.prototype.init = function () {
    this.on('destroy', function () {
    }, this);
};

PlaneObbyTrail.prototype.postUpdate = function (deltaTime) {

};

PlaneObbyTrail.prototype.SetOn = function () {

};

PlaneObbyTrail.prototype.SetOff = function () {

};

PlaneObbyTrail.prototype.visible = function () {

};

PlaneObbyTrail.prototype.invisible = function () {

};

PlaneObbyTrail.prototype.reset = function () {

};

PlaneObbyTrail.prototype.spawn = function (radius) {

};

PlaneObbyTrail.prototype.clearOld = function () {

};

PlaneObbyTrail.prototype.copyToArrayBuffer = function () {

};

PlaneObbyTrail.prototype.updateNumActive = function () {

};

PlaneObbyTrail.prototype.setNode = function (prev) {

};

PlaneObbyTrail.prototype.Finit = function () {

};

PlaneObbyTrail.prototype.clear = function () {

};

// helper function
var setMat4Forward = (function () {
    var x, y, z;

    x = new pc.Vec3();
    y = new pc.Vec3();
    z = new pc.Vec3();

    return function (mat4, forward, up) {
        // Inverse the forward direction as +z is pointing backwards due to the coordinate system
        z.copy(forward).scale(-1);
        y.copy(up).normalize();
        x.cross(y, z).normalize();
        y.cross(z, x);

        var r = mat4.data;

        r[0] = x.x;
        r[1] = x.y;
        r[2] = x.z;
        r[3] = 0;
        r[4] = y.x;
        r[5] = y.y;
        r[6] = y.z;
        r[7] = 0;
        r[8] = z.x;
        r[9] = z.y;
        r[10] = z.z;
        r[11] = 0;
        r[15] = 1;

        return mat4;
    };
}());