var KeyAndButtonEvent = pc.createScript('keyAndButtonEvent');

KeyAndButtonEvent.attributes.add('keycode', {
    type: 'number'
});

KeyAndButtonEvent.attributes.add('event_start_name', {
    type: 'string'
});

KeyAndButtonEvent.attributes.add('event_end_name', {
    type: 'string'
});

// initialize code called once per entity
KeyAndButtonEvent.prototype.initialize = function() {

    if(this.entity.button)
    {
        if(this.app.touch)
        {
            this.entity.button.on('touchstart', this.fireStartEvent, this);
            this.entity.button.on('touchend', this.fireEndEvent, this);
        }

        this.entity.button.on('mousedown', this.fireStartEvent, this);
        this.entity.button.on('mouseup', this.fireEndEvent, this);
    }

    this.app.keyboard.on("keyup", this.onKeyUp, this);
    this.app.keyboard.on("keydown", this.onKeyDown, this);
};


KeyAndButtonEvent.prototype.onKeyUp = function(e) {
    if(e.key != this.keycode) return;
    this.fireEndEvent();
};

KeyAndButtonEvent.prototype.onKeyDown = function(e) {
    if(e.key != this.keycode) return;
    this.fireStartEvent();
};

// update code called every frame
KeyAndButtonEvent.prototype.update = function(dt) {
    /*
    if(this.app.keyboard.isPressed(pc.KEY_SPACE))
    {
        this.fireStartEvent();
    }*/    
};

KeyAndButtonEvent.prototype.fireStartEvent = function() {
    if(AdsManager.instance.first_flag) return;
    this.app.fire(this.event_start_name);
};

KeyAndButtonEvent.prototype.fireEndEvent = function() {
    if(AdsManager.instance.first_flag) return;
    this.app.fire(this.event_end_name);
};

