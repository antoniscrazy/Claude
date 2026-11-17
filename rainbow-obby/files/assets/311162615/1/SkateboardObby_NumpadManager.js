var SkateboardObbyNumpadManager = pc.createScript('skateboardObbyNumpadManager');

SkateboardObbyNumpadManager.attributes.add("numbersParent", {type:"entity"});
SkateboardObbyNumpadManager.attributes.add("displayText", {type:"entity"});
SkateboardObbyNumpadManager.attributes.add("body", {type:"entity"});

// initialize code called once per entity
SkateboardObbyNumpadManager.prototype.initialize = function() {
    this.networkManager = this.app.root.findByName("NetworkManager").script.skateboardObbyNetworkManager;
    this.app.numpadManager = this;

    let children = this.numbersParent.children;

    for (let i = 0; i < children.length; i++) {
        let textEntity = children[i].children[0];
        if (!textEntity || !textEntity.element) continue;
        let number = (i === 9) ? 0 : i + 1;
        textEntity.element.text = number;

        children[i].button.on("click", function(event){
            let number = (i === 9) ? "0" : `${i+1}`;
            this.app.numpadManager.addDigit(number);
        }, this);
    }

    this.menuCloseButton = this.entity.findByName("NumpadCloseButton");
    this.menuCloseButton.button.on('click', function (event) {
        this.close();
    }, this);

    this.goButton = this.entity.findByName("GoButton");
    this.goButton.button.on('click', function (event) {
        this.check();
    }, this);

    this.resetButton = this.entity.findByName("ResetButton");
    this.resetButton.button.on('click', function (event) {
        this.reset();
    }, this);

    this.app.numpad = {
        enabled: false,
        password: "",
        method: null,
        methodWrong: null,
        maxChars: 6,
        showWarning: true,
    };
};

SkateboardObbyNumpadManager.prototype.open = function(password, method = null, methodWrong = null, maxChars = 6, showWarning = true){
    this.app.numpad.enabled = true;
    this.app.numpad.password = password;
    this.app.numpad.method = method;
    this.app.numpad.methodWrong = methodWrong;
    this.app.numpad.maxChars = maxChars;
    this.app.numpad.showWarning = showWarning;
    this.app.fire("lockCamera", true);
    this.networkManager.setBlackBG(true);
    this.body.enabled = true;

    this.entity.findByName("DisplayText").element.text = "";
}

SkateboardObbyNumpadManager.prototype.close = function(){
    this.app.numpad.enabled = false;
    this.app.fire("lockCamera", false);
    this.networkManager.setBlackBG(false);
    this.body.enabled = false;
}

SkateboardObbyNumpadManager.prototype.check = function(){
    let displayText = this.entity.findByName("DisplayText").element;

    if (displayText.text == this.app.numpad.password){
        console.log("password correct");
        //this.networkManager.fire(this.app.numpad.fireName, this.app.numpad.shouldReplicate)
        if (this.app.numpad.method != null){this.app.numpad.method();}
        this.close();
        if (this.app.numpad.showWarning){
            this.app.fire("WarningTextController:setWarning", "Correct answer!", null, new pc.Color(0, 1, 0, 1));
        }
    } else {
        if (this.app.numpad.showWarning){
            this.app.fire("WarningTextController:setWarning", "Wrong answer", null, new pc.Color(1, 0, 0, 1));
        }
        this.close();
        if (this.app.numpad.methodWrong != null){this.app.numpad.methodWrong(displayText.text);}
    };
}

SkateboardObbyNumpadManager.prototype.reset = function(){
    this.entity.findByName("DisplayText").element.text = '';
}

SkateboardObbyNumpadManager.prototype.addDigit = function(digitAsString){
    let displayText = this.entity.findByName("DisplayText").element;
    if (displayText.text.length < this.app.numpad.maxChars){
        displayText.text = displayText.text + digitAsString;
    };
}
