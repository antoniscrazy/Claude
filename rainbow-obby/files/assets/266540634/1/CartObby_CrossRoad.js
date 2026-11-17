var CartObbyCrossRoad = pc.createScript('cartObbyCrossRoad');

CartObbyCrossRoad.attributes.add("robotTemplate", {type:"asset"})

// initialize code called once per entity
CartObbyCrossRoad.prototype.initialize = function() {
    this.fromPos = this.entity.findByName("From").getPosition();
    this.toPos = this.entity.findByName("To").getPosition();

    this.time = 0;
};

// update code called every frame
CartObbyCrossRoad.prototype.update = function(dt) {
    if (this.time >= 0) {
        this.time -= dt;

        if (this.time <= 0) {
            let count = this.randomRangeInt(2,5);
            for (let i = 0; i < count; i++) {
                setTimeout(()=>{ if (this.entity && !this.entity.script) return;this.createRobot();}, i*100);
            }

            this.time = this.randomRangeFloat(.7,1.45);
        }
    }
};


CartObbyCrossRoad.prototype.createRobot = function(){
    let robot = this.robotTemplate.resource.instantiate();
    this.app.root.addChild(robot);

    // Pozisyonu From noktasına koy
    robot.setPosition(this.fromPos);

    // AI scriptine değişkenleri aktar
    if (robot.script && robot.script.cartObbyTrafficRobot) {
        robot.script.cartObbyTrafficRobot.fromPos = this.fromPos.clone();
        robot.script.cartObbyTrafficRobot.toPos = this.toPos.clone();
        robot.setLocalEulerAngles(0,90,0);
    }
}

CartObbyCrossRoad.prototype.randomRangeInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

CartObbyCrossRoad.prototype.randomRangeFloat = function (min, max) {
    return Math.random() * (max - min) + min;
}
