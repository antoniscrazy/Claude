var MeowModeDestroyTimer = pc.createScript('meowModeDestroyTimer');

MeowModeDestroyTimer.attributes.add("time", {type:"number", default:2});

// initialize code called once per entity
MeowModeDestroyTimer.prototype.initialize = function() {
    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.entity.destroy();}, this.time * 1000);
};
