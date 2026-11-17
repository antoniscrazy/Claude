var MeowModeFracture = pc.createScript('meowModeFracture');

// initialize code called once per entity
MeowModeFracture.prototype.initialize = function() {
    this.entity.forEach(node => {
        if (node.rigidbody) {
            // random yön + güç
            let force = new pc.Vec3(
                (Math.random() - 0.5) * 10,
                Math.random() * 10,
                (Math.random() - 0.5) * 10
            );

            node.rigidbody.applyImpulse(force);
        }
    });

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.entity.destroy();}, 7000);
};
