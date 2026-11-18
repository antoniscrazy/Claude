var CoinBox = pc.createScript('coinBox');

CoinBox.attributes.add("timer_text", {type: "entity"});
CoinBox.attributes.add("video_button", {type: "entity"});
CoinBox.attributes.add("delay", {type: "number"});

// initialize code called once per entity
CoinBox.prototype.initialize = function() {

    CoinBox.instance = this;

    this.show_button = true;

    this.on_screen = true;
    this.on_screen_position = this.entity.getLocalPosition().clone();
    this.entity.translateLocal(-300,0,0);
    this.off_screen_position = this.entity.getLocalPosition().clone();
   
    this.video_button.button.on('click', this.onButton, this);

    if (this.app.touch) {
        this.entity.setLocalScale(0.75,0.75,0.75);
    }
    else
    {
        this.entity.setLocalScale(1,1,1);
    }
};

// update code called every frame
CoinBox.prototype.update = function(dt) {

    if(this.show_button)
    {
        this.entity.setLocalPosition(pc.math.lerp(this.entity.getLocalPosition().x,this.on_screen_position.x ,dt * 6),this.on_screen_position.y,0);
    }
    else
    {
        this.entity.setLocalPosition(pc.math.lerp(this.entity.getLocalPosition().x,this.off_screen_position.x ,dt * 6),this.on_screen_position.y,0);
    }
};

CoinBox.prototype.onButton = function(e) {
    if(this.show_button)
    {
        AdsManager.instance.showRewardedBreak(function(succes){
            console.log(succes);
            if(succes)
            {
                Claw.instance.enableMagnet();
                this.show_button = false;
            }
        }.bind(this));
    }
};
