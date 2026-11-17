/*VehicleControls script manages the car controls and direction using inputs by Burak Ersin - emolingo games */
var VehicleControls = pc.createScript('vehicleControls');

VehicleControls.attributes.add('targetVehicle', {
    type: 'entity',
    title: 'Target Vehicle'
});

VehicleControls.attributes.add('leftButton', {
    type: 'entity',
    title: 'Left Button'
});

VehicleControls.attributes.add('rightButton', {
    type: 'entity',
    title: 'Right Button'
});

VehicleControls.attributes.add('forwardButton', {
    type: 'entity',
    title: 'Forward Button'
});

VehicleControls.attributes.add('reverseButton', {
    type: 'entity',
    title: 'Reverse Button'
});

VehicleControls.prototype.initialize = function () {
    this.app.isMobile = this.app.touch != null;
    this.networkManager = this.app.root.findByName("Network Manager");
    this.gameManager = this.app.root.findByName("Game Manager").script.coGameManager;
    if (this.networkManager != null) {
        this.networkManager = this.networkManager.script.coNetworkManager;
    }

    this.gamePlayStart = false;

    this.tempSteering = 0;

    this.leftButtonPressed = false;
    this.rightButtonPressed = false;
    this.upButtonPressed = false;
    this.downButtonPressed = false;
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
    this.upKeyPressed = false;
    this.downKeyPressed = false;

    if (this.leftButton) {
        this.leftButton.enabled = this.app.isMobile;
        this.leftButton.button.on('pressedstart', function () {
            this.leftButtonPressed = true;
        }, this);
        this.leftButton.button.on('pressedend', function () {
            this.leftButtonPressed = false;
        }, this);
    }
    if (this.rightButton) {
        this.rightButton.enabled = this.app.isMobile;
        this.rightButton.button.on('pressedstart', function () {
            this.rightButtonPressed = true;
        }, this);
        this.rightButton.button.on('pressedend', function () {
            this.rightButtonPressed = false;
        }, this);
    }
    if (this.forwardButton) {
        this.forwardButton.enabled = this.app.isMobile;
        this.forwardButton.button.on('pressedstart', function () {
            this.upButtonPressed = true;
        }, this);
        this.forwardButton.button.on('pressedend', function () {
            this.upButtonPressed = false;
        }, this);
    }
    if (this.reverseButton) {
        this.reverseButton.enabled = this.app.isMobile;
        this.reverseButton.button.on('pressedstart', function () {
            this.downButtonPressed = true;
        }, this);
        this.reverseButton.button.on('pressedend', function () {
            this.downButtonPressed = false;
        }, this);
    }

    { const handle = this.app.keyboard.on('keydown', function (e) {
        switch (e.key) {
            case pc.KEY_A:
            case pc.KEY_LEFT:
                this.leftKeyPressed = true;
                break;
            case pc.KEY_D:
            case pc.KEY_RIGHT:
                this.rightKeyPressed = true;
                break;
            case pc.KEY_W:
            case pc.KEY_UP:
                this.upKeyPressed = true;
                break;
            case pc.KEY_S:
            case pc.KEY_DOWN:
                this.downKeyPressed = true;
                break;
        }
    }, this); this.on('destroy', () => handle.off()); }
    { const handle = this.app.keyboard.on('keyup', function (e) {
        switch (e.key) {
            case pc.KEY_A:
            case pc.KEY_LEFT:
                this.leftKeyPressed = false;
                break;
            case pc.KEY_D:
            case pc.KEY_RIGHT:
                this.rightKeyPressed = false;
                break;
            case pc.KEY_W:
            case pc.KEY_UP:
                this.upKeyPressed = false;
                break;
            case pc.KEY_S:
            case pc.KEY_DOWN:
                this.downKeyPressed = false;
                break;
        }
    }, this); this.on('destroy', () => handle.off()); }
};

VehicleControls.prototype.panelOpen = function (dt) {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
    this.upKeyPressed = false;
    this.downKeyPressed = false;
};

VehicleControls.prototype.update = function (dt) {
    if (this.app.isWatchingAd || this.app.carObbyMenuEnabled || this.app.carObbyShopEnabled) return;
    var targetVehicle = this.targetVehicle ? this.targetVehicle : this.entity;

    if (this.app.isMobile && (this.app.keyboard.isPressed(pc.KEY_A) || this.app.keyboard.isPressed(pc.KEY_LEFT)
        || this.app.keyboard.isPressed(pc.KEY_D) || this.app.keyboard.isPressed(pc.KEY_RIGHT)
        || this.app.keyboard.isPressed(pc.KEY_W) || this.app.keyboard.isPressed(pc.KEY_UP)
        || this.app.keyboard.isPressed(pc.KEY_S) || this.app.keyboard.isPressed(pc.KEY_DOWN))) {
        this.app.isMobile = false;
        this.app.coUiManager.mobileControllers.enabled = false;
        this.camera = this.app.root.findByName("Camera");
        this.camera.script.coMobileCameraController.enabled = false;
        this.camera.script.coCameraController.enabled = true;
    }

    if (targetVehicle) {
        var steering = 0;
        var throttle = 0;

        if (this.leftButtonPressed || this.leftKeyPressed) steering++;
        if (this.rightButtonPressed || this.rightKeyPressed) steering--;
        if (this.upButtonPressed || this.upKeyPressed) throttle++;
        if (this.downButtonPressed || this.downKeyPressed) throttle--;

        if (window.touchJoypad.buttons.isPressed('buttonF')) {
            throttle++;
        }
        else if (window.touchJoypad.buttons.isPressed('buttonB')) {
            throttle--;
        }
        if (window.touchJoypad.buttons.isPressed('buttonR')) {
            steering--;
        } else if (window.touchJoypad.buttons.isPressed('buttonL')) {
            steering++;
        }
        if (this.gameManager.isPlayerDied == false) {
            if (steering != 0 || throttle != 0) {
                if (this.app.gameplayStarted == false) {
                    PokiSDK.gameplayStart();
                    this.app.gameplayStarted = true;
                }
            }
        }

        if (this.networkManager != null) {//amet nub
            if (this.tempSteering != steering) {
                this.networkManager.sendPacket("frontWheel", { f: steering });
                this.tempSteering = steering;
            }
        }

        targetVehicle.script.vehicle.fire('vehicle:controls', steering, throttle);
    }
};