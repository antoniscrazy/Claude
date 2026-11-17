var CartObbyTeleportToChapter = pc.createScript('cartObbyTeleportToChapter');

CartObbyTeleportToChapter.attributes.add("targetChapter", {type: "number", default: 1});

// initialize code called once per entity
CartObbyTeleportToChapter.prototype.initialize = function () {
    this._textAdCount = this.entity.findByName("AdCount").element;
    this._textAdCount.text = "1";

    this.entity.script.cartObyyWatchAd.adCount = 1;
    this.entity.script.cartObyyWatchAd.callback = "portalTeleport";
    this.entity.script.cartObyyWatchAd.callback_args = this.targetChapter;
    this.entity.script.cartObyyWatchAd.rewardedEntity = this.entity;
};
