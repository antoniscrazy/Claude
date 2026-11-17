var AsmrModeToastSpeedGain = pc.createScript('asmrModeToastSpeedGain');

// initialize code called once per entity
AsmrModeToastSpeedGain.prototype.initialize = function() {

    this.entity.children[0].enabled = false;

    this.entity.appear = (_dir, _steps)=>{

        this.entity.setLocalPosition(0,60,0);
        this.setOpacity(0);
        this.entity.children[0].children[1].element.text = "+"+_steps;

        //const _dir = Math.random() < 0.5 ? -1 : 1;
        //const _dir = this.dir;
        //this.dir *= -1;

        const _pos = new pc.Vec3(
            (20 + mathRandomRange(10,100)) * _dir,
            40 + mathRandomRange(20, 130), 0
        )
        const _pos2 = _pos.clone().add(new pc.Vec3(0,-35,0));

        let data = { opacity: 0 };
        this.app.tween(data)
            .to({ opacity: 1 }, 0.15, pc.SineInOut)
            .onUpdate(() => {
                this.setOpacity(data.opacity);
            })
            .start();

        this.entity.tween(this.entity.getLocalPosition())
            .to(_pos, .2, pc.SineInOut)
            .onComplete(()=>{
                this.entity.tween(this.entity.getLocalPosition())
                    .to(_pos2, .3, pc.SineInOut)
                    .onComplete(()=>{
                        this.entity.children[0].enabled = false;
                    })
                    .start();

                let data = { opacity: 1 };
                this.app.tween(data)
                    .to({ opacity: 0 }, 0.3, pc.SineInOut)
                    .onUpdate(() => {
                        this.setOpacity(data.opacity);
                    })
                    .start();
            })
            .start();

        this.entity.children[0].enabled = true;
    }

    this.setOpacity = (_opacity)=>{
        this.entity.children[0].children[0].element.opacity = _opacity;
        this.entity.children[0].children[1].element.opacity = _opacity;
        this.entity.children[0].children[1].element.outlineColor = new pc.Color(0,0,0, _opacity);
    }
};
