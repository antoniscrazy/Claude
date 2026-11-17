var PlaneObbyDeath = pc.createScript('planeObbyDeath');

PlaneObbyDeath.attributes.add("tags", {type:"string", array:true, title:"Tags", default:["Player"]});

// initialize code called once per entity
PlaneObbyDeath.prototype.initialize = function() {
    this.entity.collision.on("triggerenter", (other)=>{
        let hasAnyTag = false;

        for (let i = 0; i < this.tags.length; i++) {
            const tag = this.tags[i];
            if (other.tags.has(tag)) {
                hasAnyTag = true;
                break;
            }
        }

        if (hasAnyTag) {
            this.app.fire("playerDie");
        }
    },this)
};
