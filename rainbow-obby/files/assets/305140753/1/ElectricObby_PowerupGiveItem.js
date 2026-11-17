var ElectricObbyPowerupGiveItem = pc.createScript('electricObbyPowerupGiveItem');

ElectricObbyPowerupGiveItem.attributes.add("type", {
    type: "number",
    enum: [
        { "Jetpack":            0 },
        { "FlyingCarpet":       1 },
        { "ResetGame":          2 },
    ],
    default: 0
});

ElectricObbyPowerupGiveItem.attributes.add("priceType",{
    type:"string",
    enum: [
        {"Watch Ad": "ad"},
        {"Wins": "wins"},
        {"Aura": "aura"},
        {"Free": "free"},
    ],
    default: "ad",
    title: "Price Type"
});

// initialize code called once per entity
ElectricObbyPowerupGiveItem.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.electricObbyNetworkManager;
    this.database = this.app.root.findByName("ItemDatabase").script.electricObbyItemDatabase;

    this.trigger = this.entity.findByName("Trigger");
    this.id = "MarketItem" + this.getRandomId();
    this.idLeave = this.id + "Leave"
    this.idConfirmed = this.id + "Confirmed";
    this.idAdSuccess = this.id + "AdSuccess";

    this.trigger.script.electricObbyTrigger.fireName = this.id;
    this.trigger.script.electricObbyTrigger.fireNameLeave = this.idLeave;
    this.trigger.script.electricObbyTrigger.tags = ["Player"];
    this.trigger.script.electricObbyTrigger.print = false;

    this.app.on(this.id, this.onTriggerEnter, this);
    this.app.on(this.idLeave, this.onTriggerLeave, this);
    this.app.on(this.idAdSuccess, this.giveItem, this);
    this.app.on(this.idConfirmed, this.onConfirmed, this);

    this.loadingRadial = this.entity.findByName("LoadingRadial").script.electricObbyLoadingRadial;
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

    this.itemData.name = this.database.items[this.type].name;
    this.itemData.repurchasable = this.database.items[this.type].repurchasable;

    switch(this.priceType){
        case "ad":
            this.itemData.fee = this.database.items[this.type].priceAd;
            this.entity.findByName("AdCount").enabled = true;
            this.entity.findByName("AdImage").enabled = true;
            this.entity.findByName("AdCount").element.text = this.itemData.fee;
            this.entity.findByName("Text").element.text = this.itemData.name;
            break;
        
        case "wins":
            this.itemData.fee = this.database.items[this.type].priceWins;
            this.entity.findByName("WinsCount").enabled = true;
            this.entity.findByName("WinsImage").enabled = true;
            this.entity.findByName("WinsCount").element.text = this.itemData.fee;
            this.entity.findByName("Text").element.text = this.itemData.name;
            break;

        case "aura":
            this.itemData.fee = this.database.items[this.type].priceAura;
            this.entity.findByName("AuraCount").enabled = true;
            this.entity.findByName("AuraImage").enabled = true;
            this.entity.findByName("AuraCount").element.text = this.itemData.fee;
            this.entity.findByName("Text").element.text = this.itemData.name;
            break;

        case "free":
            this.itemData.fee = 0;
            this.entity.findByName("Text").element.text = this.itemData.name;
            this.entity.findByName("FreeText").enabled = true;
            break;
    }

    this.modelRoot = this.entity.findByName("Rot");
    let children = this.modelRoot.children;
    for (let i = 0; i < children.length; i++) {
        children[i].enabled = false;
    }

    if (this.entity.findByName(this.itemData.name)){
        this.entity.findByName(this.itemData.name).enabled = true;
    }

    setTimeout(()=> { if (this.entity && !this.entity.script) return; return this.destroyIfOwned(); }, 500);
};

ElectricObbyPowerupGiveItem.prototype.giveItem = function(){
    this.app.fire("giveItem", this.type);

    if (!this.itemData.repurchasable){
        this.entity.destroy();
    }
    
    this.app.fire("WarningTextController:setWarning", "Item purchased successfully: " + this.itemData.name, null, new pc.Color(0, 1, 0, 1));
}

ElectricObbyPowerupGiveItem.prototype.onTriggerEnter = function(){
 /*    let feeText = (this.itemData.isAd ? `watching ${this.itemData.fee} ad` + (this.itemData.fee > 1 ? "s" : "") : `${this.database.items[this.type].priceAura} Aura`);

    this.app.electricObbyPopupController.showPopup(
        "Please Confirm:", `You are buying the item "${this.itemData.name}" for ${feeText}`, 
        true, this, this.idConfirmed, null, null, this.itemData.isAd, true); */

    this.loadingRadial.start();
}

ElectricObbyPowerupGiveItem.prototype.onTriggerLeave = function(){
/*     let feeText = (this.itemData.isAd ? `watching ${this.itemData.fee} ad` + (this.itemData.fee > 1 ? "s" : "") : `${this.database.items[this.type].priceAura} Aura`);

    this.app.electricObbyPopupController.showPopup(
        "Please Confirm:", `You are buying the item "${this.itemData.name}" for ${feeText}`, 
        true, this, this.idConfirmed, null, null, this.itemData.isAd, true); */
    this.loadingRadial.stop();
}

ElectricObbyPowerupGiveItem.prototype.onConfirmed = function(){
    switch(this.priceType){
        case "ad":
            if (this.app.inventory.canBuyThisItem(this.type)){
                this.app.adRewarder.watchAd(()=> this.networkManager.fire(this.idAdSuccess, false), this.itemData.fee);
                console.log("watching ad")
            }
            break;
        
        case "wins":
            if (this.app.inventory.canBuyThisItem(this.type)){
                if (this.app.gameManager.win.count >= this.itemData.fee){
                    this.giveItem();
                    this.app.electricObbyNetworkManager.send("Client:DeleteWin", {amount: this.itemData.fee});
                } else {
                    this.app.fire("WarningTextController:setWarning", "You need more wins to buy this item.", null, new pc.Color(1, 0.51, 0.03, 1));
                    this.app.gameManager.sfx_warning();
                }
            }
            break;

        case "aura":
            if (this.app.inventory.canBuyThisItem(this.type)){
                if (this.app.aura >= this.itemData.fee){
                    this.giveItem();
                    this.app.electricObbyNetworkManager.send("Client:DeleteAura", {amount: this.itemData.fee});
                } else {
                    this.app.fire("WarningTextController:setWarning", "You need more aura to buy this item.", null, new pc.Color(1, 0.51, 0.03, 1));
                    this.app.gameManager.sfx_warning();
                }
            }
            break;

        case "free":
            this.giveItem();
            break;
    }
}

ElectricObbyPowerupGiveItem.prototype.getRandomId = function () {
    let pos = this.entity.getPosition();

    let x = Math.round(pos.x);
    let y = Math.round(pos.y);
    let z = Math.round(pos.z);

    return `${x}_${y}_${z}`;
}

ElectricObbyPowerupGiveItem.prototype.destroyIfOwned = function(){
    if (!this.itemData.repurchasable && this.app.playerItemManager.isItemOwned(this.type)){
        this.entity.destroy();
    }
}



