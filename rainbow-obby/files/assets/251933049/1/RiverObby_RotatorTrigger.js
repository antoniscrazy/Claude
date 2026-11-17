var RiverObbyRotatorTrigger = pc.createScript('riverObbyRotatorTrigger');

RiverObbyRotatorTrigger.attributes.add('rotateTime', {
    type: 'number',
    default: 1,
});
RiverObbyRotatorTrigger.attributes.add('speed', { type: 'vec3', default: [30, 0, 0] });
RiverObbyRotatorTrigger.attributes.add('rotateGlobally', { type: 'boolean', default: false });


RiverObbyRotatorTrigger.prototype.initialize = function(){
    this.rotate = 0;

    this.entity.on("trigger", this.trigger, this)
}

RiverObbyRotatorTrigger.prototype.trigger = function(){
    let o = {t:0}
    let ent = this
    this.entity.tween(o)
        .to({t:1}, .5, pc.Linear)
        .onUpdate(function(){
            ent.rotate = o.t
        })
        .start()

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        let o = {t:1}
        let ent = this
        this.entity.tween(o)
            .to({t:0}, .5, pc.CubicInOut)
            .onUpdate(function(){
                ent.rotate = o.t
            })
            .start()
    }, this.rotateTime * 1000)
}

RiverObbyRotatorTrigger.prototype.update = function(dt){
    if (this.rotateGlobally) {
        this.entity.rotate(this.speed.x * dt * this.rotate, this.speed.y * dt * this.rotate, this.speed.z * dt * this.rotate);
    } else {
        this.entity.rotateLocal(this.speed.x * dt * this.rotate, this.speed.y * dt * this.rotate, this.speed.z * dt * this.rotate);
    }
}


