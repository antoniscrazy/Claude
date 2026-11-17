var CartObbyPowerDoor = pc.createScript("cartObbyPowerDoor");
CartObbyPowerDoor.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager, this.tweenTime = 3, this.doorLeft = this.entity.findByName("DoorLeft"), this.doorRight = this.entity.findByName("DoorRight"), this.trigger = this.entity.findByName("Slot"), this.powerBlockSlot = this.entity.findByName("PowerBlockSlot"), this.powerBlockTrigger = this.entity.findByName("PowerBlockTrigger"), this.id = "PowerDoor" + this.getRandomId(), this.serverId = "server" + this.id, console.log(this.serverId), this.trigger.script.cartObbyTrigger.fireName = this.id, this.trigger.script.cartObbyTrigger.shouldReplicate = !0, this.app.on(this.id, this.onTrigger, this), this.app.on(this.serverId, this.open, this), this.isOpen = !1, this.app.on("givePowerBlock", (() => {
        this.powerBlockTrigger.enabled = !1
    }), this), this.on("destroy", (function() {
        this.app.off(this.id), this.app.off(this.serverId), this.app.off("givePowerBlock")
    }), this), this.localyTriggered = !1, setTimeout((() => { if (this.entity && !this.entity.script) return;
        this.app.checkpoint
    }))
}, CartObbyPowerDoor.prototype.open = function() {
    this.app.fire("Motion", "DoorLeft"), this.app.fire("Motion", "DoorRight"), this.isOpen = !0, this.powerBlockSlot.enabled = !0, setTimeout((() => { if (this.entity && !this.entity.script) return;
        this.close(), this.isOpen = !1, this.powerBlockSlot.enabled = !1, this.localyTriggered && (this.powerBlockTrigger.enabled = !0)
    }), 15e3), this.doorLeft.tween(this.doorLeft.getLocalPosition()).to({
        x: -8
    }, this.tweenTime, pc.SineIn).onComplete((() => {
        this.app.fire("Motion:Stop", "DoorLeft")
    })).start(), this.doorRight.tween(this.doorRight.getLocalPosition()).to({
        x: 8
    }, this.tweenTime, pc.SineIn).onComplete((() => {
        this.app.fire("Motion:Stop", "DoorRight")
    })).start()
}, CartObbyPowerDoor.prototype.close = function() {
    this.app.fire("Motion", "DoorLeft"), this.app.fire("Motion", "DoorRight"), this.doorLeft.tween(this.doorLeft.getLocalPosition()).to({
        x: 0
    }, this.tweenTime, pc.SineIn).onComplete((() => {
        this.app.fire("Motion:Stop", "DoorLeft")
    })).start(), this.doorRight.tween(this.doorRight.getLocalPosition()).to({
        x: 0
    }, this.tweenTime, pc.SineIn).onComplete((() => {
        this.app.fire("Motion:Stop", "DoorRight")
    })).start()
}, CartObbyPowerDoor.prototype.onTrigger = function() {
    !this.isOpen && this.app.playerPowerUp.powerBlock.has && (this.networkManager.room ? this.networkManager.room.send("Client:FireSignal", {
        signal: this.serverId
    }) : this.open(), this.app.fire("removePowerBlock"), this.localyTriggered = !0, this.powerBlockTrigger.enabled = !1)
}, CartObbyPowerDoor.prototype.getRandomId = function() {
    let t = this.entity.getPosition();
    return `${Math.round(t.x)}_${Math.round(t.y)}_${Math.round(t.z)}`
};