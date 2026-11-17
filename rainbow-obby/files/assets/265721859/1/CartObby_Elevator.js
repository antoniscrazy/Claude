var CartObbyElevator = pc.createScript('cartObbyElevator');

CartObbyElevator.attributes.add("processTime", {type:"number", default:2.5});

// initialize code called once per entity
CartObbyElevator.prototype.initialize = function() {
    this.rail = this.entity.findByName("Rail");
    this.point1 = this.rail.getLocalPosition().clone();
    this.point2 = this.entity.findByName("TargetPoint").getLocalPosition().clone();

    this.state = 0;

    this.entity.collision.on("triggerenter", (other) => {
        if (other.tags.has("LocalCollider") && this.state == 0) {
            this.state = 1;
            
            // P1 → P2 tween

            this.rail.tween(this.rail.getLocalPosition())
                .to(this.point2, 4, pc.SineInOut)  // süresini istersen değiştir
                .start();
            console.log("tween1")

            setTimeout(() => { if (this.entity && !this.entity.script) return;
                // P2 → P1 tween
                this.rail.tween(this.rail.getLocalPosition())
                    .to(this.point1, 4, pc.SineInOut) 
                    .start();
            console.log("tween2")

                this.state = 0;
            }, this.processTime * 1000);
        }
    }, this);
};
