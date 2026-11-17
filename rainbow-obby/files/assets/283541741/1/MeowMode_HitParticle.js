var MeowModeHitParticle = pc.createScript('meowModeHitParticle');

MeowModeHitParticle.prototype.initialize = function () {
    let children = this.entity.children;
    let count = children.length;

    this.rotSpeeds = [];

    let randomRot = new pc.Vec3(0, Math.random() * 360, 0);

    this.entity.setLocalEulerAngles(randomRot);

    for (let i = 0; i < count; i++) {
        let child = children[i];

        // RANDOM ROT SPEED
        this.rotSpeeds[i] = new pc.Vec3(
            (Math.random() - 0.5) * 720,
            (Math.random() - 0.5) * 720,
            (Math.random() - 0.5) * 720
        );

        let angle = (i / count) * Math.PI * 2;
        let dir = new pc.Vec3(Math.cos(angle), 0, Math.sin(angle));

        let startPos = child.getLocalPosition().clone();

        let distance = 8;   // ileri ne kadar gitsin
        let height = 5;     // ne kadar zıplasın

        // CUSTOM TWEEN DATA
        let data = { t: 0 };

        child.tween(data)
            .to({ t: 1 }, 1.2, pc.Linear)
            .onUpdate(() => {

                let t = data.t;

                // forward linear
                let forward = dir.clone().scale(distance * t);

                // PARABOL (0 → 1 → 0)
                //let y = 8 * height * t * (1 - t);
                let y = 6 * height * t * (1 - t) - 10 * t;

                let pos = startPos.clone()
                    .add(forward)
                    .add(new pc.Vec3(0, y, 0));

                child.setLocalPosition(pos);

            })
            .start();
    }

    setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.entity.destroy();
    }, 5000);
};

MeowModeHitParticle.prototype.update = function (dt) {
    let children = this.entity.children;

    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        let rot = this.rotSpeeds[i];

        child.rotate(
            rot.x * dt,
            rot.y * dt,
            rot.z * dt
        );
    }
};