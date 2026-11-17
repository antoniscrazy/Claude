var MeowModeHideMe = pc.createScript('meowModeHideMe');

// initialize code called once per entity
MeowModeHideMe.prototype.initialize = function() {
    this.entity.element.text = "";
};
