var CartObbyTrafficLight = pc.createScript('cartObbyTrafficLight');

CartObbyTrafficLight.attributes.add("timeShoot", {type:"number", default:3})
CartObbyTrafficLight.attributes.add("timeWait", {type:"number", default:2})
CartObbyTrafficLight.attributes.add("matNormal", {type:"asset"})
CartObbyTrafficLight.attributes.add("matClosed", {type:"asset"})
CartObbyTrafficLight.attributes.add("robotTemplate", {type:"asset"})

// initialize code called once per entity
CartObbyTrafficLight.prototype.initialize = function() {
    this.state = new StateSystem;

    this.barrier = this.entity.findByName("Barrier").script.cartObbyBarrier;
    this.red = this.entity.findByName("Red");
    this.green = this.entity.findByName("Green");

    this.fromPos = this.entity.findByName("From").getPosition();
    this.toPos = this.entity.findByName("To").getPosition();

    this.state.add("wait", {
        onStart: ()=>{
            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                this.state.set("shoot");
            },this.timeWait * 1000)

            this.red.render.meshInstances[0].material = this.matNormal.resource;
            this.green.render.meshInstances[0].material = this.matClosed.resource;
        },
    });

    this.state.add("shoot", {
        onUpdate: (dt)=> {
            if (this.state.hit(4)){this.createRobot()}
            if (this.state.hit(4.2)){this.createRobot()}
            if (this.state.hit(4.4)){this.createRobot()}
            if (this.state.hit(4.6)){this.createRobot()}
            if (this.state.hit(4.8)){this.createRobot()}
            if (this.state.hit(5)){this.createRobot()}
            if (this.state.hit(5.2)){this.createRobot()}
            if (this.state.hit(5.4)){this.createRobot()}
            if (this.state.hit(5.6)){this.createRobot()}
            if (this.state.hit(5.8)){this.createRobot()}
            if (this.state.hit(6)){this.createRobot()}
            if (this.state.hit(6.2)){this.createRobot()}
            if (this.state.hit(6.4)){this.createRobot()}
        },

        onStart: ()=>{
            this.barrier.trigger();

            setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                this.state.set("wait");
            },this.timeShoot * 1000)

            this.red.render.meshInstances[0].material = this.matClosed.resource;
            this.green.render.meshInstances[0].material = this.matNormal.resource;
        },

    });

    this.state.set("wait")
};

// update code called every frame
CartObbyTrafficLight.prototype.update = function(dt) {
    this.state.update(dt)
};


CartObbyTrafficLight.prototype.createRobot = function(){
    let robot = this.robotTemplate.resource.instantiate();
    this.app.root.addChild(robot);

    // Pozisyonu From noktasına koy
    robot.setPosition(this.fromPos);

    // AI scriptine değişkenleri aktar
    if (robot.script && robot.script.cartObbyTrafficRobot) {
        robot.script.cartObbyTrafficRobot.fromPos = this.fromPos.clone();
        robot.script.cartObbyTrafficRobot.toPos = this.toPos.clone();
    }
}

