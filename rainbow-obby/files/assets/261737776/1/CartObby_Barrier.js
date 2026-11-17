var CartObbyBarrier = pc.createScript('cartObbyBarrier');

// initialize code called once per entity
CartObbyBarrier.prototype.initialize = function() {
    this.pivot = this.entity.findByName("BarrierPivot");
    this.isPlayingAnim = false;
};


CartObbyBarrier.prototype.getRandomId = function(){
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

CartObbyBarrier.prototype.trigger = function(){
    if (this.isPlayingAnim) return;
    this.isPlayingAnim = true

    let progress = {t:0};
    let pivot = this.pivot;
    this.app
        .tween(progress)
        .to({t:1}, 1.0, pc.Linear)
        .yoyo(true)
        .onUpdate(function () {
            pivot.setLocalEulerAngles(0,0,progress.t*90);
        })
        .start();
    
    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        let progress = {t:1};
        let pivot = this.pivot;
        let ent = this;
        this.app
            .tween(progress)
            .to({t:0}, 1.0, pc.Linear)
            .yoyo(true)
            .onUpdate(function () {
                pivot.setLocalEulerAngles(0,0,progress.t*90);
            })
            .onComplete(function(){
                ent.isPlayingAnim = false;
            })
            .start();
    }, 4000)

    this.entity.sound.play("Open");
}


