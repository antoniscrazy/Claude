var PlaneObbyAirbus = pc.createScript('planeObbyAirbus');

PlaneObbyAirbus.attributes.add("speedMul", {type:"number", default:1});

// initialize code called once per entity
PlaneObbyAirbus.prototype.initialize = function() {
    this.t = 0;

    this.fromPos = this.entity.getPosition().clone();
    this.toPos = this.entity.findByName("TargetPoint").getPosition().clone();
};

PlaneObbyAirbus.prototype.update = function(dt) {
    this.t = Math.min(this.t + (dt * 0.4 * this.speedMul), 1);

    let pos = new pc.Vec3();
    pos.lerp(this.fromPos, this.toPos, this.t);
    this.entity.setPosition(pos);

    if (this.t >= 1){this.t = 0;};
}; 
