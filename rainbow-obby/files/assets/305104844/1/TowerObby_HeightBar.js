var TowerObbyHeightBar = pc.createScript('towerObbyHeightBar');

TowerObbyHeightBar.prototype.initialize = function () {

    this.plateTempalte = this.app.assets.get(305104856);
    this.bottom = this.entity.findByName("Bottom").getLocalPosition().y;
    this.top = this.entity.findByName("Top").getLocalPosition().y;


    this.posX = this.entity.getPosition().x;
    this.players = [];
    this.playerPlates = new Map(); // player -> plate

    this.levelBottom = this.app.root.findByName("LevelBottom").getPosition().y;
    this.levelTop = this.app.root.findByName("Stage_End");

    this.app.on("player:add", this.onPlayerAdd, this);
    this.app.on("player:remove", this.onPlayerRemove, this);
    this.app.on("player:setUsername", this.onSetUsername, this);

    this.on('destroy', function () {
        this.app.off("player:add", this.onPlayerAdd, this);
        this.app.off("player:remove", this.onPlayerRemove, this);
        this.app.off("player:setUsername", this.onSetUsername, this);
    }, this);
};

TowerObbyHeightBar.prototype.onPlayerAdd = function (player) {

    console.log("onPlayerAdd");

    this.players.push(player);

    let _newPlate = this.plateTempalte.resource.instantiate();
    this.entity.addChild(_newPlate);
    _newPlate.setLocalPosition(new pc.Vec3(0, 0, 0));
    _newPlate.setPosition(new pc.Vec3(0, 0, 0));

    this.playerPlates.set(player, _newPlate);
};

TowerObbyHeightBar.prototype.onPlayerRemove = function (player) {

    let _plate = this.playerPlates.get(player);

    if (_plate) {
        _plate.destroy();
        this.playerPlates.delete(player);
    }

    const index = this.players.indexOf(player);
    if (index !== -1) {
        this.players.splice(index, 1);
    }
};

TowerObbyHeightBar.prototype.onSetUsername = function (player, username, local) {
    const plate = this.playerPlates.get(player);
    if (!plate) return;

    plate.findByName("Text").element.text = username;

    if (local) {
        plate.element.spriteAsset = this.app.assets.get(218529829);
    }
}

TowerObbyHeightBar.prototype.update = function (dt) {

    const bottomY = this.bottom;
    const topY = this.top;

    const minHeight = this.levelBottom;
    const maxHeight = this.levelTop.getPosition().y;
    if (!this.players) return;
    if (!this.players.length>0) return;

    for (let player of this.players) {

        const plate = this.playerPlates.get(player);
        if (!plate) continue;

        const height = player.getPosition().y;

        // normalize (0-1 arası)
        let t = (height - minHeight) / (maxHeight - minHeight);
        t = pc.math.clamp(t, 0, 1);

        // lerp
        const y = pc.math.lerp(bottomY, topY, t);

        plate.setLocalPosition(0, y, 0);
        /*         const pos = plate.getPosition();
                //pos.x = this.posX;
                pos.x = 0;
                pos.y = y;
                plate.setPosition(pos); */
    }
};