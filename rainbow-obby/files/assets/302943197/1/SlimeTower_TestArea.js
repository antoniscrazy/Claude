var SlimeTowerTestArea = pc.createScript('slimeTowerTestArea');

// initialize code called once per entity
SlimeTowerTestArea.prototype.initialize = function() {


    this.collider = this.entity.findByName("Collider");

    this.entity.findByName("Trigger").script.slimeTowerTrigger.onTriggerEnter = ()=>{
        this.app.slimeTowerPopupController.showPopup("Ad Break?", "Would you like to watch an ad to access the Test Area?", true, this, null, null, null, true, true, this.onYes);
    }

    this.onYes = ()=>{
        this.app.adRewarder.watchAd(() => {
            this.open();
        });

        console.log("on yes");
    }

    this.open = ()=>{
        this.collider.enabled = false;
        this.entity.findByName("Trigger").enabled = false;
        this.entity.findByName("AdCount").enabled = false;
        this.entity.findByName("AdImage").enabled = false;
        SlimeTower_Utils.setItem("SlimeTower2_TestAreaAccesss", "true");
    }

    this.isOpen = (SlimeTower_Utils.getItem("SlimeTower2_TestAreaAccesss") === "true");
    if (this.isOpen){this.open();}
};
