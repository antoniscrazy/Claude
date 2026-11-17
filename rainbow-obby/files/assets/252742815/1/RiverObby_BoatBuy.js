var RiverObbyBoatBuy = pc.createScript('riverObbyBoatBuy');


RiverObbyBoatBuy.attributes.add("type", {
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
});

// initialize code called once per entity
RiverObbyBoatBuy.prototype.initialize = function () {
    this._text = this.entity.findByName("Text").element;
    this._textAdCount = this.entity.findByName("AdCount").element;
    this._modelBoat = this.entity.findByName("ModelBoat").render;
    this._modelOarL = this.entity.findByName("ModelOarL").render;
    this._modelOarR = this.entity.findByName("ModelOarR").render;

    this._text.text = RiverObbyBoatDatabase[this.type].name;
    this._textAdCount.text = RiverObbyBoatDatabase[this.type].ads;
    this._modelBoat.asset = this.app.assets.get(RiverObbyBoatDatabase[this.type].asset);
    this._modelOarL.asset = this.app.assets.get(RiverObbyBoatDatabase[this.type].oarL);
    this._modelOarR.asset = this.app.assets.get(RiverObbyBoatDatabase[this.type].oarR);

    this.entity.script.riverObbyRadialAdrewarder.adCount = RiverObbyBoatDatabase[this.type].ads;
    this.entity.script.riverObbyRadialAdrewarder.callback = "buyBoat";
    this.entity.script.riverObbyRadialAdrewarder.callback_args = this.type;
    this.entity.script.riverObbyRadialAdrewarder.rewardedEntity = this.entity;

    if (RiverObbyOwnedBoats.includes(this.type)) {
        this.entity.enabled = false;
    }
};





