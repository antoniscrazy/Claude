var MeowModeDestroyedObject = pc.createScript('meowModeDestroyedObject');

// initialize code called once per entity
MeowModeDestroyedObject.prototype.initialize = function() {
    setTimeout(()=>{ if (this.entity && !this.entity.script) return; return this.entity.destroy(); }, 2.5 * 1000);

    let _f = 10;
    let force = new pc.Vec3(pc.math.random(-_f, _f),_f,pc.math.random(-_f, _f));
    this.entity.rigidbody.applyImpulse(force);

    let _tf = 7;
    let torque = new pc.Vec3(pc.math.random(-_tf, _tf),pc.math.random(-_tf, _tf),pc.math.random(-_tf, _tf));
    this.entity.rigidbody.applyTorqueImpulse(torque);
};
