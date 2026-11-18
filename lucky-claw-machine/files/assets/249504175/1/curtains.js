var Curtains = pc.createScript('curtains');

Curtains.attributes.add("curtain_left", {type: "entity"});
Curtains.attributes.add("curtain_right", {type: "entity"});

// initialize code called once per entity
Curtains.prototype.initialize = function() {
    this.allow_change = true;
    this.curtain_left.enabled = false;
    this.curtain_right.enabled = false;
};


Curtains.prototype.open = function(){
    this.curtain_left.enabled = true;
    this.curtain_right.enabled = true;

    this.cont = { value: 0 };
    this.allow_change = false;

    var tween = this.entity.tween(this.cont).to({ value: 1 }, 0.75, pc.SineOut).delay(0.25);

    tween.on("update", function (dt) {
        this.curtain_left.setLocalScale(pc.math.lerp(0.93,0,this.cont.value),1,0.25);
        this.curtain_right.setLocalScale(pc.math.lerp(-0.93,0,this.cont.value),1,0.25);
    }.bind(this));

    
    tween.on("complete",function(){
        this.allow_change = true;
        this.curtain_left.enabled = false;
        this.curtain_right.enabled = false;

    }.bind(this)); 

    tween.start();
}


Curtains.prototype.close = function(callback){

    this.curtain_left.enabled = true;
    this.curtain_right.enabled = true;

    this.cont = { value: 0 };
    this.allow_change = false;
    var tween = this.entity.tween(this.cont).to({ value: 1 }, 0.5, pc.BackOut);

    tween.on("update", function (dt) {
        this.curtain_left.setLocalScale(pc.math.lerp(0,0.93,this.cont.value),1,0.25);
        this.curtain_right.setLocalScale(pc.math.lerp(0,-0.93,this.cont.value),1,0.25);
    }.bind(this));


    tween.on("complete",function(){
        this.allow_change = true;
        callback();
    }.bind(this));    

    tween.start();    
}

// update code called every frame
Curtains.prototype.update = function(dt) {

};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// Curtains.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/