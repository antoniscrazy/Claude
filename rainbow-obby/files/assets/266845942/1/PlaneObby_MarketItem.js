var PlaneObbyMarketItem = pc.createScript('planeObbyMarketItem');

PlaneObbyMarketItem.attributes.add("type", {
    type: "number",
    enum: [
        { "PLANE_DEFAULT": 0 },
        { "PLANE_RIGHTBROTHERS": 1 },
        { "PLANE_WHICHESBROOM": 2 },
        { "PLANE_BOMBARDINO": 3 },
        { "PLANE_UFO": 4 },
        { "PLANE_TOILET": 5 },
    ],
    default: 0
})

// ad texture 218530348
// coin texture 218530382

PlaneObbyMarketItem.prototype.updateSlot = function () {
    if (!PlaneObbyPlaneManager.isOwnsPlane(this.type)) {
        if (PlaneObbyItemDataBase[this.type].price > 0) {
            this._priceLabel.enabled = true;
            this._priceImage.element.textureAsset = this.app.assets.get(218530382);
            this._priceText.element.text = PlaneObbyItemDataBase[this.type].price
        };
    } else {
        this._priceLabel.enabled = false;
    }

    if (PlaneObby_Utils.getItem("PLANEOBBY_PlaneID") * 1 == this.type) {
        this._checkMark.enabled = true;
    } else { this._checkMark.enabled = false; }
}

PlaneObbyMarketItem.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;

    this._imageBoat = this.entity.findByName("ImageBoat")
    this._priceLabel = this.entity.findByName("PriceLabel")
    this._priceImage = this.entity.findByName("PriceImage")
    this._priceText = this.entity.findByName("PriceText")
    this._checkMark = this.entity.findByName("CheckMark")

    this._imageBoat.element.textureAsset = this.app.assets.get(PlaneObbyItemDataBase[this.type].image);

    this.updateSlot();

    this.entity.button.on('click', function (event) {
        if (PlaneObbyPlaneManager.isOwnsPlane(this.type)) {
            console.log("1")
            PlaneObby_Utils.setItem("PLANEOBBY_PlaneID", this.type);
            this.app.fire("planeIdChanged");
        } else {
            if (PlaneObby_Utils.getItem("PLANEOBBY_Coin") * 1 >= PlaneObbyItemDataBase[this.type].price) {
                PlaneObby_Utils.setItem("PLANEOBBY_PlaneID", this.type);
                this.app.fire("giveItem", this.type);
                //this.entity.sound.play("Buy");

                console.log("net", this.networkManager)
                this.networkManager.decreaseCoin(PlaneObbyItemDataBase[this.type].price);
                PlaneObby_Utils.setItem("PLANEOBBY_Coin", PlaneObby_Utils.getItem("PLANEOBBY_Coin") * 1 - PlaneObbyItemDataBase[this.type].price);
                this._priceLabel.enabled = false;
            }
        }
        this.app.fire("updateMarketSlots")
    }, this);

    this.app.on("updateMarketSlots", () => {
        this.updateSlot();
    })

    this.on('destroy', function () {
        this.app.off("updateMarketSlots");
    }, this);
}
