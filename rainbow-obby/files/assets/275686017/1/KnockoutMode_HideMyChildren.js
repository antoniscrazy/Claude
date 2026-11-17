var KnockoutModeHideMyChildren = pc.createScript('knockoutModeHideMyChildren');

KnockoutModeHideMyChildren.prototype.initialize = function() {
    this.entity.children.forEach(child => {
        if (child.render) {
            child.render.enabled = false;
        }
    });
};

