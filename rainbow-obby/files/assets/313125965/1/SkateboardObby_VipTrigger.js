var SkateboardObbyVipTrigger = pc.createScript('skateboardObbyVipTrigger');

SkateboardObbyVipTrigger.prototype.initialize = function() {
    this.entity.findByName("Trigger").script.skateboardObbyTrigger.onTriggerEnter = ()=>{
        if (!this.app.vipManager) return;
        this.app.vipManager.setPanelVisible(true);
        // the panel opened: the board brakes to a stop instead of rolling through the stand
        const _controller = this.app.skateboardObbyPlayerController;
        if (this.app.vipManager.panelOpen && _controller && _controller.brakeToStop) _controller.brakeToStop();
    }
};
