var CartObbyLegoWall = pc.createScript('cartObbyLegoWall');

// initialize code called once per entity
CartObbyLegoWall.prototype.initialize = function() {

};


CartObbyLegoWall.prototype.activate = function () {
    let children = this.entity.children;

    for (let i = 0; i < children.length; i++) {
        let child = children[i];

        if (child.rigidbody) {
            child.rigidbody.type = "dynamic";
        }
    }

    setTimeout(()=>{ if (this.entity && !this.entity.script) return;
        this.entity.destroy();
    }, 10 * 1000);
};
