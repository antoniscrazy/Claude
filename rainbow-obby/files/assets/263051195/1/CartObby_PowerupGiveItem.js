var CartObbyPowerupGiveItem = pc.createScript('cartObbyPowerupGiveItem');

CartObbyPowerupGiveItem.attributes.add("type", {
    type: "number",
    enum: [
        { "CART_DEFAULT": 0 },
        { "CART_FLINTSTONE": 1 },
        { "CART_TOAST": 2 },
        { "CART_CAT": 3 },
        { "CART_GIGACHAD": 4 },
        { "CART_CUPCAKE": 5 },
        { "JETPACK": 6 },
        { "FLYING_CARPET": 7 },
        { "TNT": 8 },
    ],
    default: 0
});

// initialize code called once per entity
CartObbyPowerupGiveItem.prototype.initialize = function () {
    this._textAdCount = this.entity.findByName("AdCount").element;
    this._textAdCount.text = CartObbyItemDataBase[this.type].ads;

    this.entity.script.cartObyyWatchAd.adCount = CartObbyItemDataBase[this.type].ads;
    this.entity.script.cartObyyWatchAd.callback = "giveItem";
    this.entity.script.cartObyyWatchAd.callback_args = this.type;
    this.entity.script.cartObyyWatchAd.rewardedEntity = this.entity;

    if (CartObbyItemDataBase[this.type].type == "cart" && CartObbyCartManager.isOwnsCart(this.type)) {
        //this.entity.enabled = false;
    }
};





