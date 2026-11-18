var AnimatedCoin = pc.createScript('animatedCoin');


AnimatedCoin.attributes.add("up_curve", {type: "curve"});
AnimatedCoin.attributes.add("rot_curve", {type: "curve"});
AnimatedCoin.attributes.add("sca_curve", {type: "curve"});

// initialize code called once per entity
AnimatedCoin.prototype.initialize = function() {
    
    AnimatedCoin.instance = this;
    this.end_pos = this.entity.getPosition().clone();
    this.start_pos = this.end_pos.clone().add(new pc.Vec3(1,0,5));
    this.animation = false;

};


// update code called every frame
AnimatedCoin.prototype.doAnimation = function(callback) {

    this.animation = true;

    this.cont = { value: 0 };

    var tween = this.entity.tween(this.cont).to({ value: 1 }, 1, pc.Linear);

    tween.on("update", function (dt) {
        
        let p = new pc.Vec3().lerp(this.start_pos,this.end_pos,this.cont.value);
        p.y = this.end_pos.y +  this.up_curve.value(this.cont.value);

        
        this.entity.setPosition(p);

        this.entity.setEulerAngles(90 + this.rot_curve.value(this.cont.value)*2,90,0);

        let s = this.sca_curve.value(this.cont.value);

        this.entity.setLocalScale((1 - s * 0.5) * 0.38 , (1 - s * 0.5) * 0.38 , 0.38);

    }.bind(this));

    
    tween.on("complete", function () {

        SoundManager.instance.playSound("coin");

        this.animation = false;

        setTimeout(function(){
            if(callback)
            {
                callback();
            }
        }.bind(this),1000)
        
    }.bind(this));


    tween.start();
};

// update code called every frame
AnimatedCoin.prototype.update = function(dt) {

    if(!this.animation && this.app.keyboard.isPressed(pc.KEY_L))
    {
        this.doAnimation();
    }
};