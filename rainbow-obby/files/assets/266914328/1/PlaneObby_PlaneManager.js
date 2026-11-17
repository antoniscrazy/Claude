var PlaneObbyPlaneManager = pc.createScript('planeObbyPlaneManager');

PlaneObbyPlaneManager.attributes.add('bulletAsset', { type: 'asset', title: 'BulletAsset' });
PlaneObbyPlaneManager.attributes.add('tntAsset', { type: 'asset', title: 'TntAsset' });

PlaneObbyPlaneType = {
    PLANE_DEFAULT: 0,
    PLANE_RIGHTBROTHERS: 1,
    PLANE_WHICHESBROOM: 2,
    PLANE_BOMBARDINO: 3,
    PLANE_UFO: 4,
    PLANE_TOILET: 5,
    JETPACK: 6,
    FLYING_CARPET: 7,
    TNT: 8,
};

PlaneObbyItems = {
    JETPACK: 0,
    FLYING_CARPET: 1,
    TNT: 2,
}

PlaneObbyPlaneManager.attributes.add("items", {
    type: "json", schema: [
        {
            name: "id",
            type: "number",
            enum: [
                { 'Jetpack': PlaneObbyItems.JETPACK },
                { 'Fyling Carpet': PlaneObbyItems.FLYING_CARPET },
                { 'TNT': PlaneObbyItems.TNT },
            ],
        },
        {
            name: "name",
            type: "string",
        },
        {
            name: "texture",
            type: "string",
        },
    ], array: true
});

PlaneObbyOwnedPlanes = [PlaneObbyPlaneType.PLANE_DEFAULT];

// initialize code called once per entity
PlaneObbyPlaneManager.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;
    //this.playerController = ;
    this.planes = {};
    this.app.planeObbyPlaneManager = this;

    this.app.on("Connected", this.onConnected, this);
    this.offlinePlane = null;

    this.currentSkinId = null;

    this.app.localPlaneId = null;
    this.app.shouldAutoGetIn = false;

    this.planeTemplateId = 267752097;


    if (PlaneObby_Utils.getItem("PLANEOBBY_OwnedPlanes")) {
        PlaneObbyOwnedPlanes = Array.from(JSON.parse(PlaneObby_Utils.getItem("PLANEOBBY_OwnedPlanes")));
    } else {
        PlaneObby_Utils.setItem("PLANEOBBY_OwnedPlanes", JSON.stringify(PlaneObbyOwnedPlanes));
    };

    if (PlaneObby_Utils.getItem("PLANEOBBY_PlaneID")) {
        this.currentSkinId = PlaneObby_Utils.getItem("PLANEOBBY_PlaneID") * 1
    } else {
        PlaneObby_Utils.setItem("PLANEOBBY_PlaneID", PlaneObbyPlaneType.PLANE_DEFAULT);
        this.currentSkinId = PlaneObbyPlaneType.PLANE_DEFAULT;
    };

    //PlaneObby_Utils.getItem("PLANEOBBY_PlaneID") * 1

    this.app.on("giveItem", (itemID) => {
        if (PlaneObbyItemDataBase[itemID].type == "plane") {
            PlaneObby_Utils.setItem("PLANEOBBY_PlaneID", itemID)
            this.currentSkinId = itemID;
            console.log("inPlane", this.app.inPlane)
            this.planeIdChanged();

            if (PlaneObbyPlaneManager.isOwnsPlane(itemID) == false) {
                PlaneObbyOwnedPlanes.push(itemID)
            }
            PlaneObby_Utils.setItem("PLANEOBBY_OwnedPlanes", JSON.stringify(PlaneObbyOwnedPlanes))

            this.app.fire("updateMarketSlots")
        } else if (PlaneObbyItemDataBase[itemID].type == "item") {
            switch (itemID) {
                case PlaneObbyPlaneType.JETPACK: this.app.playerPowerUp.setValue(PlaneObbyItems.JETPACK, this.app.playerPowerUp.jetpack.fuelMax); break
                case PlaneObbyPlaneType.FLYING_CARPET: this.app.playerPowerUp.setValue(PlaneObbyItems.FLYING_CARPET, this.app.playerPowerUp.flyingCarpet.remainingMax); break
                case PlaneObbyPlaneType.TNT: this.app.playerPowerUp.setValue(PlaneObbyItems.TNT, this.app.playerPowerUp.tnt.amountMax); break
            }
        }
    })

    this.app.on("planeIdChanged", this.planeIdChanged, this);

    this.on('destroy', function () {
        this.app.off("giveItem");
        this.app.off("planeIdChanged");
        this.app.off("Connected");
    }, this);
};

PlaneObbyPlaneManager.prototype.planeIdChanged = function () {
    this.currentSkinId = PlaneObby_Utils.getItem("PLANEOBBY_PlaneID") * 1;
    if (this.app.localPlaneId != null && !this.app.inPlane) {
        if (this.networkManager.room) {
            this.removePlane(this.app.localPlaneId);
        } else {
            this._removePlaneOffline(this.app.localPlaneId);
        }
    }
}

PlaneObbyPlaneManager.prototype.destroy = function () {
    this.app.off("Connected", this.onConnected, this);
    this.app.off("planeIdChanged", this.planeIdChanged, this);
};

PlaneObbyPlaneManager.isOwnsPlane = function (planeID) {
    return PlaneObbyOwnedPlanes.includes(planeID);
}

const PlaneObbyItemDataBase = {
    [PlaneObbyPlaneType.PLANE_DEFAULT]: {
        image: 268278098,
        price: 10,
        ads: 1,
        responsiveness: 1,
        bulletSkin: 0,
        type: "plane"
    },

    [PlaneObbyPlaneType.PLANE_RIGHTBROTHERS]: {
        image: 268278097,
        price: 20,
        ads: 1,
        responsiveness: 1.25,
        bulletSkin: 1,
        type: "plane"
    },

    [PlaneObbyPlaneType.PLANE_WHICHESBROOM]: {
        image: 268278099,
        price: 30,
        ads: 1,
        responsiveness: 1.5,
        bulletSkin: 2,
        type: "plane"
    },

    [PlaneObbyPlaneType.PLANE_BOMBARDINO]: {
        image: 268278100,
        price: 40,
        ads: 1,
        responsiveness: 2,
        bulletSkin: 3,
        type: "plane"
    },

    [PlaneObbyPlaneType.PLANE_TOILET]: {
        image: 268278101,
        price: 50,
        ads: 1,
        responsiveness: 3,
        bulletSkin: 5,
        type: "plane"
    },

    [PlaneObbyPlaneType.PLANE_UFO]: {
        image: 268278096,
        price: 60,
        ads: 1,
        responsiveness: 4,
        bulletSkin: 4,
        type: "plane"
    },

    [PlaneObbyPlaneType.JETPACK]: {
        ads: 1,
        type: "item",
    },

    [PlaneObbyPlaneType.FLYING_CARPET]: {
        ads: 1,
        type: "item",
    },

    [PlaneObbyPlaneType.TNT]: {
        ads: 1,
        type: "item",
    },
}

PlaneObbyPlaneManager.prototype.onConnected = function () {
    if (this.networkManager.room) {
        this.networkManager.room.state.planes.onAdd((plane, planeID) => {
            let _plane_template = this.app.assets.get(this.planeTemplateId);
            let _instance = _plane_template.resource.instantiate();
            _instance.setLocalPosition(new pc.Vec3(plane.x, plane.y, plane.z))
            _instance.script.planeObbyPlane.planeData = plane;
            this.app.root.addChild(_instance);
            this.planes[planeID] = _instance;


            // 🔹 Plane pozisyon değiştiğinde güncelle
            plane.onChange(() => {
                let target = this.planes[planeID];
                if (!target) return;
                if (target.script.planeObbyPlane) {
                    target.script.planeObbyPlane.targetPosition = new pc.Vec3(plane.x, plane.y, plane.z);
                    target.script.planeObbyPlane.targetRotation = new pc.Vec3(plane.rotX, plane.rotY, plane.rotZ);
                } else {
                    //target.setLocalPosition(plane.x, plane.y, plane.z);
                }
            });

            plane.listen("isNitro", (isNitro) => {
                if (!this.planes[plane.id]) return;
                if (isNitro) { this.planes[plane.id].script.planeObbyPlane.nitro.particle.play(); }
                else { this.planes[plane.id].script.planeObbyPlane.nitro.particle.stop(); }

                //console.log("isNitro:",isNitro);
            })
        }, false)

        this.networkManager.room.state.planes.onRemove((plane, planeID) => {
            if (this.planes[planeID]) {
                //other player destroys his own plane
                if (!this.planes[planeID].script.planeObbyPlane.isLocal && this.networkManager.playerEntities[plane.ownerId]) {
                    this.networkManager.playerEntities[plane.ownerId].reparent(this.app.root);
                }
                //other player got destroyed as a passanger
                if (!this.planes[planeID].script.planeObbyPlane.isLocal && this.networkManager.playerEntities[plane.passengerId]) {
                    this.networkManager.playerEntities[plane.passengerId].reparent(this.app.root);
                }
                if (!this.planes[planeID].script.planeObbyPlane.isLocal && (this.networkManager.playerEntities[this.networkManager.room.sessionId].networkData.guestPlaneId == planeID || plane.passengerId == this.networkManager.room.sessionId)) {
                    if (this.networkManager.playerController.plane && this.networkManager.playerController.plane.isLocal) {
                        //oyuncu diger plane de degil kendi plane ini suruyor o yuzden elleme
                    } else {
                        this.networkManager.playerEntities[this.networkManager.room.sessionId].reparent(this.app.root);
                        //ucakta degilsek bizi oldurme
                        if (this.networkManager.playerController.plane != null)
                            this.app.fire("playerDie");
                    }
                }
                if (this.planes[planeID].script.planeObbyPlane.isLocal) {
                    this.app.localPlaneId = null;
                    this.networkManager.playerEntities[this.networkManager.room.sessionId].reparent(this.app.root);
                }
                console.log("XXX PLANE DESTROYED", plane)
                const savePlayer = this.planes[planeID].findByName("Player");
                const saveOtherPlayer = this.planes[planeID].findByName("RemotePlayer");
                if (savePlayer) {
                    savePlayer.reparent(this.app.root);
                }
                if (saveOtherPlayer) {
                    saveOtherPlayer.reparent(this.app.root);
                }
                this.planes[planeID].destroy();
                delete this.planes[planeID];
            }
        }, false);
    }
}

PlaneObbyPlaneManager.prototype._createPlaneOffline = function (_position = new pc.Vec3(), getIn = false) {
    let planePosition = _position;
    this.app.shouldAutoGetIn = getIn;

    if (this.offlinePlane != null) return;
    let _plane_template = this.app.assets.get(this.planeTemplateId);
    let _instance = _plane_template.resource.instantiate();
    _instance.setLocalPosition(new pc.Vec3(planePosition.x, planePosition.y, planePosition.z))
    _instance.script.planeObbyPlane.planeData = {
        id: this.getRandomId(),
        skin: this.currentSkinId,
    };
    this.offlinePlane = _instance;
    this.app.root.addChild(_instance);
    this.planes[0] = _instance;

    console.log("createOffline")
}

PlaneObbyPlaneManager.prototype._removePlaneOffline = function () {
    if (this.offlinePlane == null) return;
    this.planes[0].destroy();
    delete this.planes[0];
    this.offlinePlane = null;
    this.app.localPlaneId = null;
}


PlaneObbyPlaneManager.prototype.damagePart = function (_id, _damage, _part) {
    console.log("damagePart", _id, _damage, _part);
    if (this.planes[_id]) {
        this.planes[_id].script.planeObbyPlane.damagePart(_damage, _part, true);
    }
}

PlaneObbyPlaneManager.prototype.destroyPart = function (_id, _part) {
    console.log("destroyPart", _id, _part);
    if (this.planes[_id]) {
        this.planes[_id].script.planeObbyPlane.destroyPart(_part, true);
    }
}

PlaneObbyPlaneManager.prototype.destroyPlane = function (_id) {
    console.log("destroyPlane", _id);
    console.log("2")
    if (this.planes[_id]) {
        console.log("3")
        this.planes[_id].script.planeObbyPlane.destroyPlane(true);
    }
}

PlaneObbyPlaneManager.prototype.expoEffect = function (_id) {
    if (this.planes[_id]) {
        this.planes[_id].script.planeObbyPlane.expoEffect();
    }
}

PlaneObbyPlaneManager.prototype.createPlane = function (_position = new pc.Vec3(), getIn = false) {
    this.app.shouldAutoGetIn = getIn;
    if (this.app.localPlaneId != null) {
        if (this.networkManager.room) { this.removePlane(this.app.localPlaneId); }
        else { this._removePlaneOffline(); }
    }
    if (this.networkManager.room) {
        this.networkManager.room.send("Client:PlaneCreate", {
            id: this.getRandomId(),
            skin: this.currentSkinId,
            x: _position.x,
            y: _position.y,
            z: _position.z,
        });
    } else {
        this._createPlaneOffline(_position);
    }
}

PlaneObbyPlaneManager.prototype.removePlane = function (_id) {
    if (this.networkManager.room) {
        this.networkManager.room.send("Client:PlaneRemove", { id: _id });
    } else {
        this._removePlaneOffline();
    }
}

PlaneObbyPlaneManager.prototype.getRandomId = function () {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}


PlaneObbyPlaneManager.prototype.spawnBomb = function (ownerId, position, rotation, force) {
    if (!this.bombAsset || !this.bombAsset.resource) return;
    let bomb = this.bombAsset.resource.instantiate();
    bomb.script.planeObbyBomb.bombData = { position: position, rotation: rotation, ownerId: ownerId, force: force };

    this.app.root.addChild(bomb);
    //bomb.setPosition(new pc.Vec3(position.x, position.y, position.z));
    //bomb.setRotation(new pc.Vec3(rotation.x, rotation.y, rotation.z));
}

PlaneObbyPlaneManager.prototype.spawnTnt = function (ownerId, position) {
    if (!this.tntAsset || !this.tntAsset.resource) return;
    let tnt = this.tntAsset.resource.instantiate();
    //tnt.script.planeObbyTnt.tntData = { position: position, ownerId: ownerId };

    tnt.setPosition(new pc.Vec3(position.x, position.y, position.z));
    tnt.script.planeObbyTnt.ownerId = ownerId;


    this.app.root.addChild(tnt);
}

PlaneObbyPlaneManager.prototype.spawnBullet = function (ownerId, position, rotation, skin) {
    //console.log("ownerId", ownerId, "position", position, "rotation", rotation);

    if (!this.bulletAsset || !this.bulletAsset.resource) return;
    let bullet = this.bulletAsset.resource.instantiate();

    bullet.setPosition(new pc.Vec3(position.x, position.y, position.z));
    bullet.setEulerAngles(new pc.Vec3(rotation.x, rotation.y, rotation.z));
    bullet.script.planeObbyBullet.ownerId = ownerId;
    bullet.script.planeObbyBullet.skin = skin;

    this.app.root.addChild(bullet);
}

