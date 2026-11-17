var CartObbyBezierMover = pc.createScript('cartObbyBezierMover');

CartObbyBezierMover.prototype.initialize = function () {
    this.t = 0;
    this.speed = 0.25;

    this.p0 = this.entity.findByName("P0");
    this.p1 = this.entity.findByName("P1");
    this.p2 = this.entity.findByName("P2");
    this.p3 = this.entity.findByName("P3");
    this.cube = this.entity.findByName("Cube");
};

CartObbyBezierMover.prototype.update = function (dt) {
    this.t += dt * this.speed;
    if (this.t > 1) this.t = 0;

    let p0 = this.p0.getPosition();
    let p1 = this.p1.getPosition();
    let p2 = this.p2.getPosition();
    let p3 = this.p3.getPosition();

    let pos = this.bezierCubic(p0, p1, p2, p3, this.t);
    this.cube.setPosition(pos);

    console.log(pos);
};

CartObbyBezierMover.prototype.bezierCubic = function (p0, p1, p2, p3, t) {
    let u = 1 - t;
    let tt = t * t;
    let uu = u * u;
    let uuu = uu * u;
    let ttt = tt * t;

    let result = new pc.Vec3();
    result.copy(p0).mulScalar(uuu)
        .add(new pc.Vec3().copy(p1).mulScalar(3 * uu * t))
        .add(new pc.Vec3().copy(p2).mulScalar(3 * u * tt))
        .add(new pc.Vec3().copy(p3).mulScalar(ttt));

    return result;
}