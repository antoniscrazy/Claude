var NewPrizePopUp = pc.createScript('newPrizePopUp');


NewPrizePopUp.attributes.add("offsetCurve", {type: "curve", title: "Offset Curve", curves: ['y']});
NewPrizePopUp.attributes.add("offsetCurve2", {type: "curve", title: "Offset Curve", curves: ['y']});
NewPrizePopUp.attributes.add("offsetCurve3", {type: "curve", title: "Offset Curve", curves: ['y']});

NewPrizePopUp.attributes.add("speed", {type: "number"});

NewPrizePopUp.attributes.add("text1", {type: "entity"});

NewPrizePopUp.attributes.add("back", {type: "entity"});

NewPrizePopUp.attributes.add("model", {type: "entity"});

NewPrizePopUp.attributes.add("exclamation", {type: "entity"});


// initialize code called once per entity
NewPrizePopUp.prototype.initialize = function() {

    NewPrizePopUp.instance = this;
    this.time = 0;

    this.text1.enabled = false;
    this.model.enabled = false;
    this.back.enabled = false;

    //this.showNewPrize();
};

NewPrizePopUp.prototype.showNewPrize = function(prize_toy) {

    SoundManager.instance.playSound("win");
    prize_toy.entity.collision.enabled = false;
    prize_toy.entity.rigidbody.enabled = false;    
    this.model.addChild(prize_toy.entity);
    prize_toy.entity.setLocalPosition(0,0,0);
    prize_toy.entity.setLocalEulerAngles(0,0,0);

    if(!CameraRotation.instance.show_collection)
    {
        AdsManager.instance.gameplayStop();
    } 
    
    this.cont = { value: 0 };

    var tween = this.entity.tween(this.cont).to({ value: 1 }, 5, pc.Linear);

    tween.on("update", function (dt) {
        
        this.model.setLocalPosition(0,this.offsetCurve.value(this.cont.value),0);
        this.model.setLocalEulerAngles(0,this.offsetCurve.value(this.cont.value) * 45,0);

        this.text1.setLocalPosition(this.offsetCurve2.value(this.cont.value) * 500,120,0);

        let scale = (1 - Math.abs(this.offsetCurve3.value(this.cont.value) / 5)) * 6;
        this.back.enabled = scale > 0.1;
        this.back.setLocalScale(scale,scale,scale);

        this.text1.enabled = true;
        this.model.enabled = true;
        this.back.enabled = true;
    }.bind(this));

    tween.on("complete", function () {
        this.text1.enabled = false;
        this.model.enabled = false;
        this.back.enabled = false;
        Toy.all_toys.splice(Toy.all_toys.indexOf(prize_toy), 1);
        prize_toy.entity.destroy();
        Claw.instance.startMachine();
        this.exclamation.enabled = true;
    }.bind(this));

    tween.start();
}