var PlaneObbyCloud = pc.createScript('planeObbyCloud');

PlaneObbyCloud.attributes.add('normalMat', { type: 'asset', assetType: 'material' });
PlaneObbyCloud.attributes.add('whiteMat', { type: 'asset', assetType: 'material' });

// initialize
PlaneObbyCloud.prototype.initialize = function() {
    this.timeOff = 1;
    this.timeOn = 2;

    this.timer = this.timeOff + (Math.random()*2);
    this.simsek = this.entity.findByName("SimsekBase");
    this.hitbox = this.entity.findByName("HitBox");

    this.setEnabled(false);
};

// update
PlaneObbyCloud.prototype.update = function(dt) {

    if (this.timer > 0){
        this.timer -= dt;
        if (this.timer <= 0){
            this.setEnabled(true);

            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                this.setEnabled(false);
                this.timer = this.timeOff * Math.random();
            }, this.timeOn * 1000);
        }
    }
};

PlaneObbyCloud.prototype.setEnabled = function(enabled){
    this.simsek.enabled = enabled;
    this.hitbox.enabled = enabled;
}
