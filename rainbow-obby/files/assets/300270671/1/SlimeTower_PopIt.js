var SlimeTowerPopIt = pc.createScript('slimeTowerPopIt');

SlimeTowerPopIt.attributes.add('targetScale', { type: 'vec3', default: [1, 1, 0.1], title: 'Target Scale' });
SlimeTowerPopIt.attributes.add('triggerSounds', { type: 'asset', assetType: 'audio', array: true, title: 'Trigger Sounds' });
SlimeTowerPopIt.attributes.add('bubbleSounds', { type: 'asset', assetType: 'audio', array: true, title: 'Bubble Sounds' });
SlimeTowerPopIt.attributes.add('soundVolume', { type: 'number', default: 1, min: 0, max: 1, title: 'Sound Volume' });
SlimeTowerPopIt.attributes.add('soundPitch', { type: 'number', default: 1, min: 0, max: 1, title: 'Sound Pitch' });
SlimeTowerPopIt.attributes.add('returnDelay', { type: 'number', default: 2.5, title: 'Return Delay (s)' });
SlimeTowerPopIt.attributes.add('returnDuration', { type: 'number', default: 0.4, title: 'Return Duration (s)' });
SlimeTowerPopIt.attributes.add('isBubble', { type: 'boolean', default: false });

SlimeTowerPopIt.prototype.initialize = function () {
    this.originalScale = this.entity.getLocalScale().clone();
    this.returnTween = null;
    this.isPressed = false; // Flag to track pressed state

    this.setupSound();

    this.entity.collision.on('triggerenter', this.onTriggerEnter, this);
    this.entity.collision.on('triggerleave', this.onTriggerLeave, this);

    this.on('destroy', function () {
        this.stopReturnTween();
    }, this);
};

SlimeTowerPopIt.prototype.setupSound = function () {
    var hasTriggerSounds = this.triggerSounds && this.triggerSounds.length;
    var hasBubbleSounds = this.bubbleSounds && this.bubbleSounds.length;
    if (!hasTriggerSounds && !hasBubbleSounds) return;

    if (!this.entity.sound) {
        this.entity.addComponent('sound', { positional: true, refDistance: 5 });
    }

    this.addSoundSlots(this.triggerSounds, 'popIt_');
    this.addSoundSlots(this.bubbleSounds, 'popItBubble_');
};

SlimeTowerPopIt.prototype.addSoundSlots = function (sounds, prefix) {
    if (!sounds || !sounds.length) return;

    for (var i = 0; i < sounds.length; i++) {
        var asset = sounds[i];
        if (!asset) continue;
        var name = prefix + i;
        if (!this.entity.sound.slot(name)) {
            this.entity.sound.addSlot(name, {
                asset: asset.id,
                volume: this.soundVolume,
                autoPlay: false,
                overlap: true,
                loop: false
            });
        }
    }
};

SlimeTowerPopIt.prototype.onTriggerEnter = function (otherEntity) {
    if (!otherEntity.tags.has('Player')) return;

    this.stopReturnTween();
    this.entity.setLocalScale(this.entity.getLocalScale().clone().mul(this.targetScale));

    // Play sound only if not currently pressed
    if (!this.isPressed) {
        this.playSound();
        this.isPressed = true;
    }
};

SlimeTowerPopIt.prototype.onTriggerLeave = function (otherEntity) {
    if (!otherEntity.tags.has('Player')) return;

    this.stopReturnTween();
    this.returnTween = this.entity
        .tween(this.entity.getLocalScale())
        .to(this.originalScale, this.returnDuration, pc.BackOut)
        .delay(this.returnDelay)
        .onComplete(() => {
            this.isPressed = false;
        })
        .start();
};

SlimeTowerPopIt.prototype.playSound = function () {
    if (!this.entity.sound) return;

    var sounds = this.isBubble ? this.bubbleSounds : this.triggerSounds;
    var prefix = this.isBubble ? 'popItBubble_' : 'popIt_';
    if (!sounds || !sounds.length) return;

    var idx = Math.floor(Math.random() * sounds.length);
    var slot = this.entity.sound.slot(prefix + idx);
    if (slot) {
        slot.pitch = (this.soundPitch - .2) + Math.random() * 0.4;
        slot.play();
    }
};

SlimeTowerPopIt.prototype.stopReturnTween = function () {
    if (this.returnTween) {
        this.returnTween.stop();
        this.returnTween = null;
    }
};