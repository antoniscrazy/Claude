var PvpModeMapTeamBattleGlassBridge = pc.createScript('pvpModeMapTeamBattleGlassBridge');

// initialize code called once per entity
PvpModeMapTeamBattleGlassBridge.prototype.initialize = function() {

    this.wallLeft = this.entity.findByName("Wall1");
    this.wallRight = this.entity.findByName("Wall2");
    this.wallLeftTarget = this.entity.findByName("Wall1Target");
    this.wallRightTarget = this.entity.findByName("Wall2Target");

    this.warningLeft = this.wallLeft.findByName("Warning");
    this.warningRight = this.wallRight.findByName("Warning");
    this.setWarning(false);

    this.app.on("Map:Start", ()=>{console.log("Map:Start"); this.state.set("warning")}, this);

    this.state = new StateSystem;
    this.state.autoStart = false;

    this.state.add("initial", {
        //onUpdate: ()=>{if (this.state.hit(10)){this.state.set("warning");}}
    })

    this.state.add("warning", {
        onStart: ()=>{
            this.setWarning(true);
            setTimeout(()=>{ if (this.entity && !this.entity.script) return; return this.setWarning(false); }, 1 * 500);
            setTimeout(()=>{ if (this.entity && !this.entity.script) return; return this.setWarning(true); },  2 * 500);
            setTimeout(()=>{ if (this.entity && !this.entity.script) return; return this.setWarning(false); }, 3 * 500);
            setTimeout(()=>{ if (this.entity && !this.entity.script) return; return this.setWarning(true); },  4 * 500);
            setTimeout(()=>{ if (this.entity && !this.entity.script) return; return this.setWarning(false); }, 5 * 500);
            setTimeout(()=>{ if (this.entity && !this.entity.script) return; return this.setWarning(true); },  6 * 500);
            setTimeout(()=>{ if (this.entity && !this.entity.script) return; return this.setWarning(false); }, 7 * 500);
            setTimeout(()=>{ if (this.entity && !this.entity.script) return; return this.setWarning(true); },  8 * 500);
            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                this.setWarning(true);
                this.state.set("moving");
            },  9 * 500);
        }
    })

    this.state.add("moving", {
        onStart: ()=>{
            this.wallLeft.tween(this.wallLeft.getLocalPosition())
                .to(this.wallLeftTarget.getLocalPosition(), 30, pc.SineInOut)
                .start();

            this.wallRight.tween(this.wallRight.getLocalPosition())
                .to(this.wallRightTarget.getLocalPosition(), 30, pc.SineInOut)
                .start();
        }
    })


    this.state.set("initial");

    this.on('destroy', function () {
        this.app.off("Map:Start");
    }, this);
};

// update code called every frame
PvpModeMapTeamBattleGlassBridge.prototype.update = function(dt) {
    this.state.update(dt);
};

PvpModeMapTeamBattleGlassBridge.prototype.setWarning = function(_visible){
    this.warningLeft.enabled = _visible;
    this.warningRight.enabled = _visible;
}





