var CartObbyCartManager = pc.createScript('cartObbyCartManager');

CartObbyCartManager.attributes.add("cartTemplate", { type: "asset" })
CartObbyCartManager.attributes.add('bombAsset', { type: 'asset', title: 'Bomb Asset' });
CartObbyCartManager.attributes.add('tntAsset', { type: 'asset', title: 'Bomb Asset' });

CartObbyCartType = {
    CART_DEFAULT: 0,
    CART_FLINTSTONE: 1,
    CART_TOAST: 2,
    CART_CAT: 3,
    CART_GIGACHAD: 4,
    CART_CUPCAKE: 5,
    JETPACK: 6,
    FLYING_CARPET: 7,
    TNT: 8,
};

CartObbyItems = {
    JETPACK: 0,
    FLYING_CARPET: 1,
    TNT: 2,
}

CartObbyCartManager.attributes.add("items", {
    type: "json", schema: [
        {
            name: "id",
            type: "number",
            enum: [
                { 'Jetpack': CartObbyItems.JETPACK },
                { 'Fyling Carpet': CartObbyItems.FLYING_CARPET },
                { 'TNT': CartObbyItems.TNT },
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

CartObbyOwnedCarts = [CartObbyCartType.CART_DEFAULT];

// initialize code called once per entity
CartObbyCartManager.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;
    //this.playerController = ;
    this.carts = {};
    this.app.cartObbyCartManager = this;

    this.app.on("Connected", this.onConnected, this);
    this.offlineCart = null;

    this.currentSkinId = null;

    this.app.localCartId = null;
    this.app.shouldAutoGetIn = false;


    if (CartObby_Utils.getItem("CARTOBBY_OwnedCarts")) {
        CartObbyOwnedCarts = Array.from(JSON.parse(CartObby_Utils.getItem("CARTOBBY_OwnedCarts")));
    } else {
        CartObby_Utils.setItem("CARTOBBY_OwnedCarts", JSON.stringify(CartObbyOwnedCarts));
    };

    if (CartObby_Utils.getItem("CARTOBBY_CartID")) {
        this.currentSkinId = CartObby_Utils.getItem("CARTOBBY_CartID") * 1
    } else {
        CartObby_Utils.setItem("CARTOBBY_CartID", CartObbyCartType.CART_DEFAULT);
        this.currentSkinId = CartObbyCartType.CART_DEFAULT;
    };

    //CartObby_Utils.getItem("CARTOBBY_CartID") * 1

    this.app.on("giveItem", (itemID) => {
        if (CartObbyItemDataBase[itemID].type == "cart") {
            CartObby_Utils.setItem("CARTOBBY_CartID", itemID)
            this.currentSkinId = itemID;
            console.log("inCart", this.app.inCart)
            this.cartIdChanged();

            if (CartObbyCartManager.isOwnsCart(itemID) == false) {
                CartObbyOwnedCarts.push(itemID)
            }
            CartObby_Utils.setItem("CARTOBBY_OwnedCarts", JSON.stringify(CartObbyOwnedCarts))

            this.app.fire("updateMarketSlots")
        } else if (CartObbyItemDataBase[itemID].type == "item") {
            switch (itemID) {
                case CartObbyCartType.JETPACK: this.app.playerPowerUp.setValue(CartObbyItems.JETPACK, this.app.playerPowerUp.jetpack.fuelMax); break
                case CartObbyCartType.FLYING_CARPET: this.app.playerPowerUp.setValue(CartObbyItems.FLYING_CARPET, this.app.playerPowerUp.flyingCarpet.remainingMax); break
                case CartObbyCartType.TNT: this.app.playerPowerUp.setValue(CartObbyItems.TNT, this.app.playerPowerUp.tnt.amountMax); break
            }
        }
    })

    this.app.on("cartIdChanged", this.cartIdChanged, this);

    this.on('destroy', function () {
        this.app.off("giveItem");
        this.app.off("cartIdChanged");
        this.app.off("Connected");
    }, this);

};

CartObbyCartManager.prototype.cartIdChanged = function () {
    this.currentSkinId = CartObby_Utils.getItem("CARTOBBY_CartID") * 1;
    if (this.app.localCartId != null && !this.app.inCart) {
        if (this.networkManager.room) {
            this.removeCart(this.app.localCartId);
        } else {
            this._removeCartOffline(this.app.localCartId);
        }
    }
}

CartObbyCartManager.prototype.destroy = function () {
    this.app.off("Connected", this.onConnected, this);
    this.app.off("cartIdChanged", this.cartIdChanged, this);
};

CartObbyCartManager.isOwnsCart = function (cartID) {
    return CartObbyOwnedCarts.includes(cartID);
}

const CartObbyItemDataBase = {
    [CartObbyCartType.CART_DEFAULT]: {
        template: 260037849,
        image: 263893613,
        price: 0,
        ads: 0,
        speedMul: 1.0,
        type: "cart"
    },

    [CartObbyCartType.CART_FLINTSTONE]: {
        template: 263861772,
        image: 263893618,
        price: 5,
        ads: 1,
        speedMul: 1.2,
        type: "cart",
    },

    [CartObbyCartType.CART_TOAST]: {
        template: 263878767,
        image: 263893615,
        price: 50,
        ads: 1,
        speedMul: 2.0,
        type: "cart",
    },

    [CartObbyCartType.CART_CAT]: {
        template: 263870312,
        image: 263893614,
        price: 15,
        ads: 1,
        speedMul: 1.5,
        type: "cart",
    },

    [CartObbyCartType.CART_GIGACHAD]: {
        template: 263881430,
        image: 263893616,
        price: 100,
        ads: 3,
        speedMul: 3.0,
        type: "cart",
    },

    [CartObbyCartType.CART_CUPCAKE]: {
        template: 263884346,
        image: 263893617,
        price: 30,
        ads: 1,
        speedMul: 1.25,
        type: "cart",
    },

    [CartObbyCartType.JETPACK]: {
        template: 263073547,
        image: 253260654,
        price: 100,
        ads: 1,
        type: "item",
    },

    [CartObbyCartType.FLYING_CARPET]: {
        template: 263073547,
        image: 253260654,
        price: 100,
        ads: 1,
        type: "item",
    },

    [CartObbyCartType.TNT]: {
        template: 263073547,
        image: 253260654,
        price: 100,
        ads: 1,
        type: "item",
    },
}

CartObbyCartManager.prototype.onConnected = function () {
    if (this.networkManager.room) {
        this.networkManager.room.state.carts.onAdd((cart, cartID) => {
            let _cart_template = this.app.assets.get(CartObbyItemDataBase[cart.skin].template);
            let _instance = _cart_template.resource.instantiate();
            _instance.setLocalPosition(new pc.Vec3(cart.x, cart.y, cart.z))
            _instance.script.cartObbyCart.cartData = cart;
            this.app.root.addChild(_instance);
            this.carts[cartID] = _instance;


            // 🔹 Cart pozisyon değiştiğinde güncelle
            cart.onChange(() => {
                let target = this.carts[cartID];
                if (!target) return;
                if (target.script.cartObbyCart) {
                    target.script.cartObbyCart.targetPosition = new pc.Vec3(cart.x, cart.y, cart.z);
                } else {
                    //target.setLocalPosition(cart.x, cart.y, cart.z);
                }
            });

            cart.listen("isNitro", (isNitro)=>{
                if (!this.carts[cart.id]) return;
                if (isNitro){this.carts[cart.id].script.cartObbyCart.nitro.particle.play();}
                else {this.carts[cart.id].script.cartObbyCart.nitro.particle.stop();}

                //console.log("isNitro:",isNitro);
            })
        }, false)

        this.networkManager.room.state.carts.onRemove((cart, cartID) => {
            if (this.carts[cartID]) {
                if (!this.carts[cartID].script.cartObbyCart.isLocal && this.networkManager.playerEntities[cart.ownerId]) {
                    this.networkManager.playerEntities[cart.ownerId].reparent(this.app.root);
                } else if (this.carts[cartID].script.cartObbyCart.isLocal){
                    this.app.localCartId = null;
                }

                this.carts[cartID].destroy();
                delete this.carts[cartID];
            }
        }, false);
    }
}

CartObbyCartManager.prototype._createCartOffline = function (_position = new pc.Vec3(), splineIndex = 0, getIn = false, spawnValue = null) {
    let cartPosition = _position;
    if (spawnValue != null) { cartPosition = this.app.splines[splineIndex].getPosition(spawnValue); }
    this.app.shouldAutoGetIn = getIn;

    if (this.offlineCart != null) return;
    let _cart_template = this.app.assets.get(CartObbyItemDataBase[this.currentSkinId].template);
    let _instance = _cart_template.resource.instantiate();
    _instance.setLocalPosition(new pc.Vec3(cartPosition.x, cartPosition.y, cartPosition.z))
    _instance.script.cartObbyCart.cartData = {
        id: this.getRandomId(),
        splineIndex: splineIndex,
        skin: this.currentSkinId,
    };
    this.offlineCart = _instance;
    this.app.root.addChild(_instance);
    this.carts[0] = _instance;
}

CartObbyCartManager.prototype._removeCartOffline = function () {
    if (this.offlineCart == null) return;
    this.carts[0].destroy();
    delete this.carts[0];
    this.offlineCart = null;
    this.app.localCartId = null;
}


CartObbyCartManager.prototype.damagePart = function (_id, _damage, _part) {
    console.log("damagePart", _id, _damage, _part);
    if (this.carts[_id]) {
        this.carts[_id].script.cartObbyCart.damagePart(_damage, _part, true);
    }
}

CartObbyCartManager.prototype.destroyPart = function (_id, _part) {
    console.log("destroyPart", _id, _part);
    if (this.carts[_id]) {
        this.carts[_id].script.cartObbyCart.destroyPart(_part, true);
    }
}

CartObbyCartManager.prototype.destroyCart = function (_id) {
    console.log("destroyCart", _id);
    if (this.carts[_id]) {
        this.carts[_id].script.cartObbyCart.destroyCart(true);
    }
}

CartObbyCartManager.prototype.expoEffect = function (_id) {
    if (this.carts[_id]) {
        this.carts[_id].script.cartObbyCart.expoEffect();
    }
}

CartObbyCartManager.prototype.createCart = function (_position = new pc.Vec3(), splineIndex = 0, getIn = false, spawnValue = null) {
    let cartPosition = _position;
    if (spawnValue != null) { cartPosition = this.app.splines[splineIndex].getPosition(spawnValue); }
    this.app.shouldAutoGetIn = getIn;
    console.log("value", _position);

    if (this.app.localCartId != null) {
        if (this.networkManager.room) { this.removeCart(this.app.localCartId); }
        else { this._removeCartOffline(); }
    }
    if (this.networkManager.room) {
        this.networkManager.room.send("Client:CartCreate", {
            id: this.getRandomId(),
            skin: this.currentSkinId,
            x: cartPosition.x,
            y: cartPosition.y,
            z: cartPosition.z,
            splineIndex: splineIndex,
        });
    } else {
        this._createCartOffline(cartPosition, splineIndex);
    }
}

CartObbyCartManager.prototype.removeCart = function (_id) {
    this.networkManager.room.send("Client:CartRemove", { id: _id });
}

CartObbyCartManager.prototype.getRandomId = function () {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}


CartObbyCartManager.prototype.spawnBomb = function (ownerId, position, rotation, force) {
    if (!this.bombAsset || !this.bombAsset.resource) return;
    let bomb = this.bombAsset.resource.instantiate();
    bomb.script.cartObbyBomb.bombData = { position: position, rotation: rotation, ownerId: ownerId, force: force };

    this.app.root.addChild(bomb);
    //bomb.setPosition(new pc.Vec3(position.x, position.y, position.z));
    //bomb.setRotation(new pc.Vec3(rotation.x, rotation.y, rotation.z));
}

CartObbyCartManager.prototype.spawnTnt = function (ownerId, position) {
    if (!this.tntAsset || !this.tntAsset.resource) return;
    let tnt = this.tntAsset.resource.instantiate();
    tnt.script.cartObbyTnt.tntData = { position: position, ownerId: ownerId };

    this.app.root.addChild(tnt);
}

