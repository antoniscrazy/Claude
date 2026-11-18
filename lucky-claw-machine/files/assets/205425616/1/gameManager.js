var GameManager = pc.createScript('gameManager');

GameManager.attributes.add("classic_mode", {type: "asset"});
GameManager.attributes.add("brainrot_mode", {type: "asset"});
GameManager.attributes.add("claw", {type: "entity"});
GameManager.attributes.add("mode_button", {type: "entity"});
GameManager.attributes.add("curtains", {type: "entity"});

// initialize code called once per entity
GameManager.prototype.initialize = function() {
    this.current_mode = null;
    this.current_mode_string = "brainrot";
    this.claw_script = this.claw.script.claw;
    this.allow_change = true;

    GameManager.instance = this;
    this.loadAndOpen(this.current_mode_string);

    this.app.on("change_mode", function() {
        if(this.allow_change)
        {
            SoundManager.instance.playSound("unlock");

            if(this.current_mode_string == "classic")
            {
                this.current_mode_string = "brainrot"
            }
            else
            {
                this.current_mode_string = "classic"
            }

            this.closeChangeAndOpen();
        }
    }.bind(this));
};


GameManager.prototype.update = function(dt)
{
    this.allow_change  = this.curtains.script.curtains.allow_change && (this.claw_script.state == "aiming");
    this.mode_button.button.active = this.allow_change;
}

GameManager.prototype.loadAndOpen = function(mode_string)
{
    this.changeMode(mode_string);
    this.curtains.script.curtains.open();
}

GameManager.prototype.closeChangeAndOpen = function()
{
    this.curtains.script.curtains.close(
        function(){
            this.changeMode(this.current_mode_string);
            this.curtains.script.curtains.open();
        }.bind(this)
    );   
}


GameManager.prototype.changeMode = function(mode) {



    if(this.current_mode != null)
    {
        this.current_mode.destroy();
        Toy.all_toys = [];
    }

    if(mode == "classic")
    {
        this.current_mode = this.classic_mode.resource.instantiate();
    }
    else
    {
        this.current_mode = this.brainrot_mode.resource.instantiate();
    }

    this.app.root.addChild(this.current_mode);   
};