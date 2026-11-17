var AsmrModeTestSpawner = pc.createScript('asmrModeTestSpawner');

// initialize code called once per entity
AsmrModeTestSpawner.prototype.initialize = function() {

    this.keycapTemplate = this.app.assets.get(295227935).resource;


    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        for (let w=0; w<50; w++){
            for (let h=0; h<50; h++){
                console.log(w,h);

                let _inst = this.keycapTemplate.instantiate();
                _inst.setLocalPosition(w,0,h);
                this.entity.addChild(_inst);
            }
        }
    }, 2500)
};

