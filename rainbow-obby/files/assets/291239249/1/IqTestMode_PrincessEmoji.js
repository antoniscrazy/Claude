var IqTestModePrincessEmoji = pc.createScript('iqTestModePrincessEmoji');

// initialize code called once per entity
IqTestModePrincessEmoji.prototype.initialize = function() {
    this.time = Math.random() * 10;
    this.speed = 8; // hız
};

// update code called every frame
IqTestModePrincessEmoji.prototype.update = function(dt) {
    this.time += dt * this.speed;

    let s = Math.sin(this.time)*.05 + 1;
    let r = Math.sin(this.time/2) * 3;
    let p = Math.sin(this.time/4) * .5;

    this.entity.setLocalPosition(0,p,0);

    let _scale = 1;
    this.entity.setLocalScale(1*_scale, s*_scale, s*2*_scale);
    this.entity.setLocalEulerAngles(0,r,0);
};
