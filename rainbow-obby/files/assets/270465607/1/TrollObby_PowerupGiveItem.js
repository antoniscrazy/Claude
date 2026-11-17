var TrollObbyPowerupGiveItem = pc.createScript('trollObbyPowerupGiveItem');

TrollObbyPowerupGiveItem.attributes.add("type", {
    type: "number",
    enum: [
        { "SlapHand":       0 },
        { "SlapBalloon":    1 },
        { "SlapBat":        2 },
        { "SlapCandy":      3 },
        { "SlapLollipop":   4 },
        { "JETPACK":        5 },
        { "FLYING_CARPET":  6 },
        { "Shield":         7 },
        { "REBIRTH":        8 },
    ],
    default: 0
});

TrollObbyPowerupGiveItem.attributes.add("priceType",{
    type:"string",
    enum: [
        {"Watch Ad": "ad"},
        {"Aura": "aura"},
        {"Free": "free"},
    ],
    default: "aura",
    title: "Price Type"
})

// initialize code called once per entity
TrollObbyPowerupGiveItem.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.trollObbyNetworkManager;
    this.database = this.app.root.findByName("ItemDatabase").script.trollObbyItemDatabase;

    this.trigger = this.entity.findByName("Trigger");
    this.id = "MarketItem" + this.getRandomId();
    this.idLeave = this.id + "Leave"
    this.idConfirmed = this.id + "Confirmed";
    this.idAdSuccess = this.id + "AdSuccess";
    
    this.trigger.script.trollObbyTrigger.fireName = this.id;
    this.trigger.script.trollObbyTrigger.fireNameLeave = this.idLeave;
    this.trigger.script.trollObbyTrigger.tags = ["Player"];
    this.trigger.script.trollObbyTrigger.print = true;

    this.app.on(this.id, this.onTriggerEnter, this);
    this.app.on(this.idLeave, this.onTriggerLeave, this);
    this.app.on(this.idAdSuccess, this.giveItem, this);
    this.app.on(this.idConfirmed, this.onConfirmed, this);

    this.loadingRadial = this.entity.findByName("LoadingRadial").script.trollObbyLoadingRadial;
    this.loadingRadial.fireName = this.idConfirmed;

    this.on('destroy', function () {
        this.app.off(this.id);
        this.app.off(this.idLeave);
        this.app.off(this.idAdSuccess);
        this.app.off(this.idConfirmed);
    }, this);

    this.itemData = {
        fee: null,
        name: null,
        repurchasable: null,
    }

    switch(this.priceType){
        case "ad":
            this.itemData.fee = this.database.items[this.type].priceAd;
            break
        
        case "aura":
            this.itemData.fee = this.database.items[this.type].priceAura;
            break

        case "free":
            this.itemData.fee = 0;
            break
    }
    this.itemData.name = this.database.items[this.type].name;
    this.itemData.repurchasable = this.database.items[this.type].repurchasable;

    this.modelRoot = this.entity.findByName("Rot");
    let children = this.modelRoot.children;
    for (let i = 0; i < children.length; i++) {
        children[i].enabled = false;
    }

    if (this.entity.findByName(this.itemData.name)){
        this.entity.findByName(this.itemData.name).enabled = true;
    }


    if (this.priceType == "ad"){
        this.entity.findByName("AdCount").enabled = true;
        this.entity.findByName("AdImage").enabled = true;
        this.entity.findByName("AdCount").element.text = this.itemData.fee;
        this.entity.findByName("Text").element.text = this.itemData.name;

    } else if (this.priceType == "aura"){
        this.entity.findByName("AuraCount").enabled = true;
        this.entity.findByName("AuraImage").enabled = true;
        this.entity.findByName("AuraCount").element.text = this.itemData.fee;
        this.entity.findByName("Text").element.text = this.itemData.name;
    } else if (this.priceType == "free"){
        this.entity.findByName("Text").element.text = this.itemData.name;
        this.entity.findByName("FreeText").enabled = true;
    }

    setTimeout(()=> { if (this.entity && !this.entity.script) return; return this.destroyIfOwned(); }, 500);
};

TrollObbyPowerupGiveItem.prototype.giveItem = function(){
    this.app.fire("giveItem", this.type);

    if (!this.itemData.repurchasable){
        this.entity.destroy();
    }

    this.app.fire("WarningTextController:setWarning", "Item purchased succesfully: " + this.itemData.name, null, new pc.Color(0, 1, 0, 1));
}

TrollObbyPowerupGiveItem.prototype.onTriggerEnter = function(){
 /*    let feeText = (this.itemData.isAd ? `watching ${this.itemData.fee} ad` + (this.itemData.fee > 1 ? "s" : "") : `${this.database.items[this.type].priceAura} Aura`);

    this.app.trollObbyPopupController.showPopup(
        "Please Confirm:", `You are buying the item "${this.itemData.name}" for ${feeText}`, 
        true, this, this.idConfirmed, null, null, this.itemData.isAd, true); */

    this.loadingRadial.start();
    this.app.trollObbyNetworkManager.room.send("Client:Attackable", { attackable: false });
}

TrollObbyPowerupGiveItem.prototype.onTriggerLeave = function(){
/*     let feeText = (this.itemData.isAd ? `watching ${this.itemData.fee} ad` + (this.itemData.fee > 1 ? "s" : "") : `${this.database.items[this.type].priceAura} Aura`);

    this.app.trollObbyPopupController.showPopup(
        "Please Confirm:", `You are buying the item "${this.itemData.name}" for ${feeText}`, 
        true, this, this.idConfirmed, null, null, this.itemData.isAd, true); */
    this.loadingRadial.stop();
    this.app.trollObbyNetworkManager.room.send("Client:Attackable", { attackable: true });
}

TrollObbyPowerupGiveItem.prototype.onConfirmed = function(){
    if (this.priceType == "ad"){
        this.app.adRewarder.watchAd(()=> this.networkManager.fire(this.idAdSuccess, false), this.itemData.fee);
    } else if (this.priceType == "aura"){
        if (this.app.aura >= this.itemData.fee){
            if (this.networkManager.room){
                this.networkManager.room.send("Client:TakeAura", {aura: this.itemData.fee});
            }

            this.giveItem();
        } else {
/*             setTimeout(()=>{
                this.app.trollObbyPopupController.showPopup(
                        "Not Enough Aura!", "You need more Aura to buy this item.", 
                        false, null, null, null, {yesButtonText:"Okay"}, false, true);
            }, 300); */

            this.app.fire("WarningTextController:setWarning", "You need more Aura to buy this item.")
        }
    } else if (this.priceType == "free"){
        this.giveItem();
    }
}

TrollObbyPowerupGiveItem.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
}

TrollObbyPowerupGiveItem.prototype.destroyIfOwned = function(){
    if (!this.itemData.repurchasable && this.app.playerItemManager.isItemOwned(this.type)){
        this.entity.destroy();
    }
}



