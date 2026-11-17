var PlaneObbyMeteorArea = pc.createScript('planeObbyMeteorArea');

PlaneObbyMeteorArea.attributes.add('meteorAsset', { type: 'asset' });
PlaneObbyMeteorArea.attributes.add("fireInterval", { type: "number", default: 3 });

// initialize
PlaneObbyMeteorArea.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.planeObbyNetworkManager;
    
    this.points = this.entity.findByName("Points");
    this.timer = 0;
};

// update
PlaneObbyMeteorArea.prototype.update = function(dt) {
    this.timer += dt;
    if (this.timer >= this.fireInterval) {
        this.timer = 0;
        this.spawnMeteor();
    }
};

PlaneObbyMeteorArea.prototype.spawnMeteor = function() {
    if (!this.meteorAsset || !this.meteorAsset.resource) return;

    let children = this.points.children;
    if (children.length === 0) return;

    let randomPoint = children[Math.floor(Math.random() * children.length)];
    let pos = randomPoint.getPosition().clone();

    let meteor = this.meteorAsset.resource.instantiate();
    meteor.setPosition(pos);
    this.app.root.addChild(meteor);
};
