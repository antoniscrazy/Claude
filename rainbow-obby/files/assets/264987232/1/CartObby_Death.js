var CartObbyDeath = pc.createScript('cartObbyDeath');

// initialize code called once per entity
CartObbyDeath.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.cartObbyNetworkManager;

    this.entity.collision.on("triggerenter", (other)=>{
        if (other.tags.has("LocalCollider")){
            if (this.networkManager.room) {
/*                 this.networkManager.room.send("Client:DestroyCart", {
                    
                }); */



                this.app.fire("playerDie");
            } else {
                // offline death
            }
        }
    },this)
};
