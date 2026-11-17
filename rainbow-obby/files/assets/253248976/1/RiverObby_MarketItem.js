var RiverObbyMarketItem = pc.createScript('riverObbyMarketItem');

RiverObbyMarketItem.attributes.add("type", {
    type: "number",
    enum: [
        { "DEFAULT": 0 },
        { "CHICKEN": 1 },
        { "DUCK": 2 },
        { "TURTLE": 3 },
        { "SPIDER": 4 },
        { "SHIP": 5 },
        { "PLANE": 6 },
        { "JETSKI": 7 }
    ],
    default: 0
})

// ad texture 218530348
// coin texture 218530382

RiverObbyMarketItem.prototype.updateSlot = function () {
    if (!RiverObbyBoatManager.isOwnsBoat(this.type)) {
        if (RiverObbyBoatDatabase[this.type].price > 0) {
            this._priceLabel.enabled = true;
            this._priceImage.element.textureAsset = this.app.assets.get(218530382);
            this._priceText.element.text = RiverObbyBoatDatabase[this.type].price
        };
    } else {
        this._priceLabel.enabled = false;
    }

    if (window.localStorage.getItem("RIVEROBBY_BoatID") * 1 == this.type) {
        this._checkMark.enabled = true;
    } else { this._checkMark.enabled = false; }
}

RiverObbyMarketItem.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.riverObbyNetworkManager;

    this._imageBoat = this.entity.findByName("ImageBoat")
    this._priceLabel = this.entity.findByName("PriceLabel")
    this._priceImage = this.entity.findByName("PriceImage")
    this._priceText = this.entity.findByName("PriceText")
    this._checkMark = this.entity.findByName("CheckMark")

    this._imageBoat.element.textureAsset = this.app.assets.get(RiverObbyBoatDatabase[this.type].image);

    this.updateSlot();

    this.entity.button.on('click', function (event) {
        if (RiverObbyBoatManager.isOwnsBoat(this.type)) {
            this.app.fire("loadSkin", this.type);
            window.localStorage.setItem("RIVEROBBY_BoatID", this.type);
        } else {
            if (window.localStorage.getItem("RIVEROBBY_coin") * 1 >= RiverObbyBoatDatabase[this.type].price) {
                window.localStorage.setItem("RIVEROBBY_BoatID", this.type);
                this.app.fire("buyBoat", this.type);
                this.entity.sound.play("Buy");
                this.networkManager.decreaseCoin(RiverObbyBoatDatabase[this.type].price);
                window.localStorage.setItem("RIVEROBBY_coin", window.localStorage.getItem("RIVEROBBY_coin") * 1 - RiverObbyBoatDatabase[this.type].price);
            }
        }
        this.app.fire("updateMarketSlots")
    }, this);

    { const handle = this.app.on("updateMarketSlots", () => {
        this.updateSlot();
    }); this.on('destroy', () => handle.off()); }
}
