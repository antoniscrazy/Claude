var DisplayToy = pc.createScript('displayToy');

DisplayToy.attributes.add("back_off", {type: "entity"});
DisplayToy.attributes.add("back_on", {type: "entity"});
DisplayToy.attributes.add("toy", {type: "entity"});

DisplayToy.prototype.initialize = function()
{
    Collection.instance.toy_displays.push(this.entity);
}

DisplayToy.prototype.unlockToy = function() {
    this.back_off.enabled = false;
    this.back_on.enabled = true;
    this.toy.enabled = true;
}

DisplayToy.prototype.lockToy = function() {
    this.back_off.enabled = true;
    this.back_on.enabled = false;
    this.toy.enabled = false;
}