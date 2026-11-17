var CartObbyMarketItem = pc.createScript('cartObbyMarketItem');

CartObbyMarketItem.attributes.add("type", {
    type: "number",
    enum: [
        { "CART_DEFAULT": 0 },
        { "CART_FLINTSTONE": 1 },
        { "CART_TOAST": 2 },
        { "CART_CAT": 3 },
        { "CART_GIGACHAD": 4 },
        { "CART_CUPCAKE": 5 },
    ],
    default: 0
})

// ad texture 218530348
// coin texture 218530382

CartObbyMarketItem.prototype.updateSlot = function () {
    if (!CartObbyCartManager.isOwnsCart(this.type)) {
        if (CartObbyItemDataBase[this.type].price > 0) {
            this._priceLabel.enabled = true;
            this._priceImage.element.textureAsset = this.app.assets.get(218530382);
            this._priceText.element.text = CartObbyItemDataBase[this.type].price
        };
    } else {
        this._priceLabel.enabled = false;
    }

    if (CartObby_Utils.getItem("CARTOBBY_CartID") * 1 == this.type) {
        this._checkMark.enabled = true;
    } else { this._checkMark.enabled = false; }
}

CartObbyMarketItem.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;

    this._imageBoat = this.entity.findByName("ImageBoat")
    this._priceLabel = this.entity.findByName("PriceLabel")
    this._priceImage = this.entity.findByName("PriceImage")
    this._priceText = this.entity.findByName("PriceText")
    this._checkMark = this.entity.findByName("CheckMark")

    this._imageBoat.element.textureAsset = this.app.assets.get(CartObbyItemDataBase[this.type].image);

    this.updateSlot();

    this.entity.button.on('click', function (event) {
        if (CartObbyCartManager.isOwnsCart(this.type)) {
            console.log("1")
            CartObby_Utils.setItem("CARTOBBY_CartID", this.type);
            this.app.fire("cartIdChanged");
        } else {
            if (CartObby_Utils.getItem("CARTOBBY_Coin") * 1 >= CartObbyItemDataBase[this.type].price) {
                CartObby_Utils.setItem("CARTOBBY_CartID", this.type);
                this.app.fire("giveItem", this.type);
                //this.entity.sound.play("Buy");

                console.log("net", this.networkManager)
                this.networkManager.decreaseCoin(CartObbyItemDataBase[this.type].price);
                CartObby_Utils.setItem("CARTOBBY_Coin", CartObby_Utils.getItem("CARTOBBY_Coin") * 1 - CartObbyItemDataBase[this.type].price);
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
