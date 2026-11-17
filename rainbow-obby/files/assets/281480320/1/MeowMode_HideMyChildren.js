var MeowModeHideMyChildren = pc.createScript('meowModeHideMyChildren');

// initialize code called once per entity
MeowModeHideMyChildren.prototype.initialize = function(){
    this.disableRenderRecursive(this.entity);
}

MeowModeHideMyChildren.prototype.disableRenderRecursive = function(entity) {
    entity.children.forEach(child => {
        if (child.render) {
            child.render.enabled = false;
        }

        // çocukların çocuklarını da gez
        if (child.children && child.children.length > 0) {
            this.disableRenderRecursive(child);
        }
    });
}
