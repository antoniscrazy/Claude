var PlaneObbyPowerupGiveItem = pc.createScript('planeObbyPowerupGiveItem');

PlaneObbyPowerupGiveItem.attributes.add("type", {
    type: "number",
    enum: [
        { "PLANE_DEFAULT": 0 },
        { "PLANE_RIGHTBROTHERS": 1 },
        { "PLANE_WHICHESBROOM": 2 },
        { "PLANE_BOMBARDINO": 3 },
        { "PLANE_UFO": 4 },
        { "PLANE_TOILET": 5 },
        { "JETPACK": 6 },
        { "FLYING_CARPET": 7 },
        { "TNT": 8 },
    ],
    default: 0
});

// initialize code called once per entity
PlaneObbyPowerupGiveItem.prototype.initialize = function () {
    this._textAdCount = this.entity.findByName("AdCount").element;
    this._textAdCount.text = PlaneObbyItemDataBase[this.type].ads;

    this.entity.script.planeObyyWatchAd.adCount = PlaneObbyItemDataBase[this.type].ads;
    this.entity.script.planeObyyWatchAd.callback = "giveItem";
    this.entity.script.planeObyyWatchAd.callback_args = this.type;
    this.entity.script.planeObyyWatchAd.rewardedEntity = this.entity;

    this.disableIfOwned();

    this.app.on("updateMarketSlots", this.disableIfOwned, this);

    this.on('destroy', function () {
        this.app.off("updateMarketSlots");
    }, this);
};

PlaneObbyPowerupGiveItem.prototype.disableIfOwned = function(){
    if (PlaneObbyItemDataBase[this.type].type == "plane" && PlaneObbyPlaneManager.isOwnsPlane(this.type)) {
        this.entity.enabled = false;
    }

    console.log("disable if")
}





