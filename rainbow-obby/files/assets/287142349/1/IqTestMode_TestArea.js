var IqTestModeTestArea = pc.createScript('iqTestModeTestArea');

IqTestModeTestArea.attributes.add("testIndex", { type: "number", default: 0 });

// initialize code called once per entity
IqTestModeTestArea.prototype.initialize = function () {
    this.app.on("TestArea:Hint", this.onGiveHint, this);
    this.app.on("TestArea:Skip", this.onSkip, this);
    this.app.on("TestArea:Passed", this.onPassed, this);
    this.app.on("TestArea:Started", this.onStarted, this);
    this.app.on("Respawned", this.onRestarted, this);
    this.app.on("Connected", this.onConnected, this);

    this.on('destroy', function () {
        this.app.off("TestArea:Hint", this.onGiveHint);
        this.app.off("TestArea:Skip", this.onSkip);
        this.app.off("TestArea:Passed", this.onPassed);
        this.app.off("TestArea:Started", this.onStarted);
        this.app.off("Respawned", this.onRestarted);
        this.app.off("Connected", this.onConnected);

        this.app.off("Test2:Clear", this.onConnected);
        this.app.off("Test2:ConeCheck", this.onConnected);
        this.app.off("Test2:SphereCheck", this.onConnected);
        this.app.off("Test2:BoxCheck", this.onConnected);
        this.app.off("Test2:ConeTake", this.onConnected);
        this.app.off("Test2:SphereTake", this.onConnected);
        this.app.off("Test2:BoxTake", this.onConnected);
    }, this);

    this.entity.findByName("Hint").enabled = false;
    this.entity.findByName("Skip").enabled = false;

    this.powerupSkip = this.entity.findByName("SkipPowerup");
    this.powerupHint = this.entity.findByName("HintPowerup");
    this.elevator = this.entity.findByName("Elevator");

    const ceilings = this.entity.findByTag("Ceiling");
    ceilings.forEach((entity) => { entity.enabled = true; });

    setTimeout(() => { if (this.entity && !this.entity.script) return;
        if (this.powerupSkip) { this.powerupSkip.enabled = false; }
    }, 5000);

    this.showHelpTrigger = this.entity.findByName("ShowHelpTrigger");
    if (this.showHelpTrigger) {
        this.showHelpTrigger.script.iqTestModeTrigger.onTriggerEnter = () => {
            this.app.gameManager.showHintTrigger();
            this.showHelpTrigger.destroy();

            this.app.fire("TestArea:Started", this.testIndex);
        }
    }

    const _testID = this.testIndex;

    if (this.testIndex == 1) {
        this.isFinished = false;
        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.entity.findByName("ButtonBlue").script.iqTestModeButton.setup(undefined, undefined, false, () => { this.app.fire("playerDie") });
            this.entity.findByName("ButtonYellow").script.iqTestModeButton.setup(undefined, undefined, false, () => { this.app.fire("playerDie") });
            this.entity.findByName("ButtonRed").script.iqTestModeButton.setup(undefined, undefined, false, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                    this.app.gameManager.entity.sound.play("ElevatorButton");
                }
            });
        }, 100)
    }

    if (this.testIndex == 2) {
        this.remaining = 3;
        this.holding = undefined

        { const handle = this.app.on("Test2:BoxTake", () => {
            if (this.holding == undefined) {
                this.app.iqTestModeNetworkManager.room.send("Client:SetActiveHandItem", { item: "box" });
                this.entity.findByName("ItemBox").enabled = false;
                this.holding = "box";
                this.app.gameManager.entity.sound.play("itemPickUp");
            }
        }); this.on('destroy', () => handle.off()); }

        { const handle = this.app.on("Test2:SphereTake", () => {
            if (this.holding == undefined) {
                this.app.iqTestModeNetworkManager.room.send("Client:SetActiveHandItem", { item: "sphere" });
                this.entity.findByName("ItemSphere").enabled = false;
                this.holding = "sphere";
                this.app.gameManager.entity.sound.play("itemPickUp");
            }
        }); this.on('destroy', () => handle.off()); }

        { const handle = this.app.on("Test2:ConeTake", () => {
            if (this.holding == undefined) {
                this.app.iqTestModeNetworkManager.room.send("Client:SetActiveHandItem", { item: "cone" });
                this.entity.findByName("ItemCone").enabled = false;
                this.holding = "cone";
                this.app.gameManager.entity.sound.play("itemPickUp");
            }
        }); this.on('destroy', () => handle.off()); }

        { const handle = this.app.on("Test2:BoxCheck", () => {
            if (this.holding == "box") {
                this.entity.findByName("CircleBox").sprite.color = new pc.Color(1, 1, 0, 1);
                this.remaining--;
                this.holding = undefined;
                this.app.iqTestModeNetworkManager.room.send("Client:SetActiveHandItem", { item: "none" });
                this.checkIfFinish();
                this.app.gameManager.entity.sound.play("itemDrop");
            }
        }); this.on('destroy', () => handle.off()); }

        { const handle = this.app.on("Test2:SphereCheck", () => {
            if (this.holding == "sphere") {
                this.entity.findByName("CircleSphere").sprite.color = new pc.Color(1, 1, 0, 1);
                this.remaining--;
                this.holding = undefined;
                this.app.iqTestModeNetworkManager.room.send("Client:SetActiveHandItem", { item: "none" });
                this.checkIfFinish();
                this.app.gameManager.entity.sound.play("itemDrop");
            }
        }); this.on('destroy', () => handle.off()); }

        { const handle = this.app.on("Test2:ConeCheck", () => {
            if (this.holding == "cone") {
                this.entity.findByName("CircleCone").sprite.color = new pc.Color(1, 1, 0, 1);
                this.remaining--;
                this.holding = undefined;
                this.app.iqTestModeNetworkManager.room.send("Client:SetActiveHandItem", { item: "none" });
                this.checkIfFinish();
                this.app.gameManager.entity.sound.play("itemDrop");
            }
        }); this.on('destroy', () => handle.off()); }

        this.checkIfFinish = () => {
            if (this.remaining <= 0) {
                this.holding = undefined;
                this.app.iqTestModeNetworkManager.room.send("Client:SetActiveHandItem", { item: "none" });
                this.app.fire("Game:PassTest");
            }

            console.log("remaining", this.remaining)
        }

        { const handle = this.app.on("Test2:Clear", () => { this.app.iqTestModeNetworkManager.room.send("Client:SetActiveHandItem", { item: "none" }); }); this.on('destroy', () => handle.off()); }
    }

    if (this.testIndex == 5) {
        this.checked = {
            blue: false,
            red: false,
            yellow: false
        }

        this.isFinished = false;

        this.entity.findByName("TriggerBlue").script.iqTestModeTrigger.onTriggerEnter = () => {
            this.checked.blue = true;
            this.entity.findByName("TickBlue").enabled = true;
            this.checkIfFinish();
        }
        this.entity.findByName("TriggerBlue").script.iqTestModeTrigger.onTriggerLeave = () => {
            this.checked.blue = false;
            this.entity.findByName("TickBlue").enabled = false;
            this.checkIfFinish();
        }
        this.entity.findByName("TriggerRed").script.iqTestModeTrigger.onTriggerEnter = () => {
            this.checked.red = true;
            this.entity.findByName("TickRed").enabled = true;
            this.checkIfFinish();
        }
        this.entity.findByName("TriggerRed").script.iqTestModeTrigger.onTriggerLeave = () => {
            this.checked.red = false;
            this.entity.findByName("TickRed").enabled = false;
            this.checkIfFinish();
        }
        this.entity.findByName("TriggerYellow").script.iqTestModeTrigger.onTriggerEnter = () => {
            this.checked.yellow = true;
            this.entity.findByName("TickYellow").enabled = true;
            this.checkIfFinish();
        }
        this.entity.findByName("TriggerYellow").script.iqTestModeTrigger.onTriggerLeave = () => {
            this.checked.yellow = false;
            this.entity.findByName("TickYellow").enabled = false;
            this.checkIfFinish();
        }

        this.checkIfFinish = () => {
            if (this.isFinished == false && this.checked.blue && this.checked.red && this.checked.yellow) {
                this.isFinished = true;
                this.app.fire("Game:PassTest");
            }
        }
    }

    if (this.testIndex == 6) {
        this.isFinished = false;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(11, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                    this.entity.findByName("AnswerText").element.text = 11;
                }
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.entity.findByName("AnswerText").element.text = _wrongAnswer;
                }
            }, 3);
        }
    }

    if (this.testIndex == 7) {
        this.isFinished = false;
        this.buttons = [0, 0, 0, 0, 0];

        this.entity.findByName("Buttons").children.forEach((_child, _index) => {
            _child.script.iqTestModeTrigger.onTriggerEnter = () => {
                this.entity.findByName("Buttons").children[_index].children[0].enabled = true;
                this.entity.findByName("Buttons").children[_index].children[1].enabled = false;
                this.buttons[_index] = true;
                this.checkIfFinished();
            }
        })

        this.checkIfFinished = () => {
            if (this.isFinished) { return; }
            let _finished = true;
            this.buttons.forEach((_value) => { if (!_value) { _finished = false; } })
            if (_finished) {
                this.isFinished = true;
                this.app.fire("Game:PassTest");
            }
        }
    }

    if (this.testIndex == 8) {
        this.isFinished = false;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(4, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                    this.entity.findByName("AnswerText").element.text = 4;
                }
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.entity.findByName("AnswerText").element.text = _wrongAnswer;
                }
            }, 3);
        }
    }

    if (this.testIndex == 9) {

        this.isFinished = false;
        this.objects = this.entity.findByName("Objects");

        this.correctOrder = [1, 1, 1, 2, 2, 3, 1, 1];
        this.userOrder = [-1, -1, -1, -1, -1, -1, -1, -1];

        this.objects.children.forEach((_child, _index) => {
            let activeIndex = 0;
            _child.script.iqTestModeTrigger.onTriggerEnter = () => {
                const childs = this.objects.children[_index].findByName("Root").children;
                if (!childs || childs.length === 0) return;
                childs[activeIndex].enabled = false;
                activeIndex = (activeIndex + 1) % childs.length;
                childs[activeIndex].enabled = true;
                this.userOrder[_index] = activeIndex;
            }
        });

        this.giveHint = (_all = false) => {
            this.objects.children.forEach((_child, _index) => {

                if (!_all) {
                    if (_index == 1 || _index == 7) { return; }
                }

                _child.findByName("Root").children.forEach((_child) => { _child.enabled = false; })
                _child.findByName("Root").children[this.correctOrder[_index]].enabled = true;
                _child.collision.enabled = false;
                _child.script.enabled = false;
                _child.findByName("Circle").enabled = false;
                this.userOrder[_index] = this.correctOrder[_index];
            })
        }

        this.check = () => {
            console.log(this.correctOrder);
            console.log(this.userOrder);
            if (this.correctOrder.length !== this.userOrder.length) { return false; }
            for (let i = 0; i < this.correctOrder.length; i++) { if (this.correctOrder[i] !== this.userOrder[i]) { return false; } }
            return true;
        }

        this.entity.findByName("GroundButton_Base").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished == false) {
                if (this.check()) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                    this.entity.findByName("GroundButton_Base").children[0].enabled = true;
                    this.entity.findByName("GroundButton_Base").children[1].enabled = false;
                } else {
                    this.app.fire("WarningTextController:setWarning", "Answer is wrong", null, new pc.Color(1, 0, 0, 1));
                }
            }
        }
    }

    if (this.testIndex == 10) {
        this.numpadBlue = this.entity.findByName("NumpadBlue");
        this.numpadYellow = this.entity.findByName("NumpadYellow");
        this.numpadGreen = this.entity.findByName("NumpadGreen");
        this.numpadRed = this.entity.findByName("NumpadRed");

        this.answers = [false, false, false, false];

        this.numpadBlue.script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(29, () => {
                this.numpadBlue.findByName("Text").element.text = 29;
                this.numpadBlue.findByName("Tick").enabled = true;
                this.answers[0] = true;
                this.check();
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.numpadBlue.findByName("Text").element.text = _wrongAnswer;
                    this.answers[0] = false;
                    this.numpadBlue.findByName("Tick").enabled = false;
                }
            }, 2, false);
        }

        this.numpadYellow.script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(38, () => {
                this.numpadYellow.findByName("Text").element.text = 38;
                this.answers[1] = true;
                this.numpadYellow.findByName("Tick").enabled = true;
                this.check();
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.numpadYellow.findByName("Text").element.text = _wrongAnswer;
                    this.answers[1] = false;
                    this.numpadYellow.findByName("Tick").enabled = false;
                }
            }, 2, false);
        }

        this.numpadGreen.script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(77, () => {
                this.numpadGreen.findByName("Text").element.text = 77;
                this.answers[2] = true;
                this.numpadGreen.findByName("Tick").enabled = true;
                this.check();
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.numpadGreen.findByName("Text").element.text = _wrongAnswer;
                    this.answers[2] = false;
                    this.numpadGreen.findByName("Tick").enabled = false;
                }
            }, 2, false);
        }

        this.numpadRed.script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(14, () => {
                this.numpadRed.findByName("Text").element.text = 14;
                this.answers[3] = true;
                this.numpadRed.findByName("Tick").enabled = true;
                this.check();
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.numpadRed.findByName("Text").element.text = _wrongAnswer;
                    this.answers[3] = false;
                    this.numpadRed.findByName("Tick").enabled = false;
                }
            }, 2, false);
        }

        this.isFinished = false;
        this.check = () => {
            if (this.isFinished == true) { return }

            if (this.answers[0] && this.answers[1] && this.answers[2] && this.answers[3]) {
                this.isFinished = true;
                this.app.fire("Game:PassTest");
            }
        }
    }

    if (this.testIndex == 11) {
        this.isFinished = false;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(4020, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                }
            }, () => { }, 4, true);
        }
    }

    if (this.testIndex == 12) {
        this.isFinished = false;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished == true) { return }
            this.app.numpadManager.open(342, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                }
            }, () => { }, 3, true);
        }
    }

    if (this.testIndex == 13) {
        this.isFinished = false;
        this.entity.findByName("Block_3x3_Yellow").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished == true) { return }
            this.isFinished = true;
            this.app.fire("Game:PassTest");
            this.entity.findByName("Tick").enabled = true;
        }
    }

    if (this.testIndex == 14) {

        this.hinted = false;
        this.buttons = this.entity.findByName("Buttons").children;
        this.isFinished = false;
        this.order = [3, 7, 1, 6, 8, 2, 0, 4, 9, 5];
        this.pressed = [false, false, false, false, false, false, false, false, false, false];
        this.index = 0;

        this.updateButtons = (_newIndex) => {
            this.index = _newIndex;
            if (this.index > 9) { this.index = 9; }

            let _button = this.buttons[this.order[this.index]]
            if (_button) { _button.enabled = true; }

            //console.log("checking", "index", this.index);
        }

        this.buttons.forEach((_child, _index) => {
            _child.script.iqTestModeTrigger.onTriggerEnter = () => {
                _child.children[0].enabled = true;
                _child.children[1].enabled = false;
                _child.collision.enabled = false;

                if (this.hinted == false) {
                    this.updateButtons(this.index + 1);
                }

                this.pressed[_index] = true;
                this.check();
            }
        })

        this.check = () => {
            let _finished = true;
            this.pressed.forEach((_prsesed) => { if (!_prsesed) { _finished = false } });
            if (_finished && this.isFinished == false) {
                this.isFinished = true;
                this.app.fire("Game:PassTest");
            }
        }

        this.buttons.forEach((_child) => { _child.enabled = false; });
        this.updateButtons(this.index);

        //setTimeout(()=>{
        //    this.buttons.forEach((_child) => { _child.enabled = true; });
        //}, 2000)
    }

    if (this.testIndex == 15) {
        this.isFinished = false;

        this.answer = 20;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(this.answer, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                    this.entity.findByName("AnswerText").element.text = this.answer;
                }
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.entity.findByName("AnswerText").element.text = _wrongAnswer;
                }
            }, 3);
        }
    }

    if (this.testIndex == 16) {

        this.isFinished = false;
        this.triggerYellow = this.entity.findByName("TriggerYellow");
        this.triggerBlue = this.entity.findByName("TriggerBlue");
        this.triggerPink = this.entity.findByName("TriggerPink");

        this.counts = [0, 0, 0];

        this.triggerYellow.script.iqTestModeTrigger.onTriggerEnter = () => {
            this.counts[0] += 1;
            this.triggerYellow.findByName("Counter").element.text = this.counts[0];
            this.check();
        }
        this.triggerYellow.script.iqTestModeTrigger.onTriggerLeave = () => {
            this.counts[0] -= 1;
            this.triggerYellow.findByName("Counter").element.text = this.counts[0];
            this.check();
        }

        this.triggerBlue.script.iqTestModeTrigger.onTriggerEnter = () => {
            this.counts[1] += 1;
            this.triggerBlue.findByName("Counter").element.text = this.counts[1];
            this.check();
        }
        this.triggerBlue.script.iqTestModeTrigger.onTriggerLeave = () => {
            this.counts[1] -= 1;
            this.triggerBlue.findByName("Counter").element.text = this.counts[1];
            this.check();
        }

        this.triggerPink.script.iqTestModeTrigger.onTriggerEnter = () => {
            this.counts[2] += 1;
            this.triggerPink.findByName("Counter").element.text = this.counts[2];
            this.check();
        }
        this.triggerPink.script.iqTestModeTrigger.onTriggerLeave = () => {
            this.counts[2] -= 1;
            this.triggerPink.findByName("Counter").element.text = this.counts[2];
            this.check();
        }

        this.check = () => {
            if (this.counts[0] == 5) { this.triggerYellow.findByName("Tick").enabled = true; }
            else { this.triggerYellow.findByName("Tick").enabled = false; }

            if (this.counts[1] == 5) { this.triggerBlue.findByName("Tick").enabled = true; }
            else { this.triggerBlue.findByName("Tick").enabled = false; }

            if (this.counts[2] == 5) { this.triggerPink.findByName("Tick").enabled = true; }
            else { this.triggerPink.findByName("Tick").enabled = false; }

            if (this.counts[0] == 5 && this.counts[1] == 5 && this.counts[2] == 5) {
                if (this.isFinished) { return; }

                this.isFinished = true;
                this.app.fire("Game:PassTest");
            }
        }
    }

    if (this.testIndex == 17) {
        this.isFinished = false;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(802, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                }
            }, () => { }, 3, true);
        }
    }

    if (this.testIndex == 18) {
        this.isFinished = false;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(751, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                }
            }, () => { }, 3, true);
        }
    }

    if (this.testIndex == 19) {

        this.cubes = [
            this.entity.findByName("56"),
            this.entity.findByName("73"),
            this.entity.findByName("42"),
            this.entity.findByName("18"),
        ];

        this.setColors = (_colored) => {
            this.cubes.forEach((_cubeRoot, _index) => {
                _cubeRoot.children[0].enabled = !_colored;
                _cubeRoot.children[1].enabled = _colored;
            })
        }

        this.setColors(false);

        this.canPress = true;


        this.entity.findByName("Buttons").children.forEach((_button, _index) => {
            _button.script.iqTestModeTrigger.onTriggerEnter = () => {
                if (!this.canPress) { return; }
                this.canPress = false;

                this.setColors(true);

                _button.enabled = false;
                let _nextIndex = _index + 1;
                if (_nextIndex >= this.entity.findByName("Buttons").children.length) { _nextIndex = 0; }
                this.entity.findByName("Buttons").children[_nextIndex].enabled = true;

                setTimeout(() => { if (this.entity && !this.entity.script) return;
                    this.canPress = true;
                    this.setColors(false);
                }, 3000);
            }
        })

        /*         this.entity.findByName("GroundButton_Base").script.iqTestModeTrigger.onTriggerEnter = ()=>{
                    if (!this.canPress){return;}
                    this.canPress = false;
        
                    //this.entity.findByName("GroundButton_Base").children[0].enabled = true;
                    //this.entity.findByName("GroundButton_Base").children[1].enabled = false;
                    this.setColors(true);
        
                    setTimeout(()=>{
                        this.canPress = true;
                        this.entity.findByName("GroundButton_Base").children[0].enabled = false;
                        this.entity.findByName("GroundButton_Base").children[1].enabled = true;
                        this.setColors(false);
                    }, 3000);
                } */

        this.numpadBlue = this.entity.findByName("NumpadBlue");
        this.numpadYellow = this.entity.findByName("NumpadYellow");
        this.numpadGreen = this.entity.findByName("NumpadGreen");
        this.numpadRed = this.entity.findByName("NumpadRed");

        this.answers = [false, false, false, false];

        this.numpadBlue.script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(73, () => {
                this.numpadBlue.findByName("Text").element.text = 73;
                this.numpadBlue.findByName("Tick").enabled = true;
                this.answers[0] = true;
                this.check();
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.numpadBlue.findByName("Text").element.text = _wrongAnswer;
                    this.answers[0] = false;
                    this.numpadBlue.findByName("Tick").enabled = false;
                }
            }, 2, false);
        }

        this.numpadYellow.script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(56, () => {
                this.numpadYellow.findByName("Text").element.text = 56;
                this.answers[1] = true;
                this.numpadYellow.findByName("Tick").enabled = true;
                this.check();
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.numpadYellow.findByName("Text").element.text = _wrongAnswer;
                    this.answers[1] = false;
                    this.numpadYellow.findByName("Tick").enabled = false;
                }
            }, 2, false);
        }

        this.numpadGreen.script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(18, () => {
                this.numpadGreen.findByName("Text").element.text = 18;
                this.answers[2] = true;
                this.numpadGreen.findByName("Tick").enabled = true;
                this.check();
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.numpadGreen.findByName("Text").element.text = _wrongAnswer;
                    this.answers[2] = false;
                    this.numpadGreen.findByName("Tick").enabled = false;
                }
            }, 2, false);
        }

        this.numpadRed.script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(42, () => {
                this.numpadRed.findByName("Text").element.text = 42;
                this.answers[3] = true;
                this.numpadRed.findByName("Tick").enabled = true;
                this.check();
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.numpadRed.findByName("Text").element.text = _wrongAnswer;
                    this.answers[3] = false;
                    this.numpadRed.findByName("Tick").enabled = false;
                }
            }, 2, false);
        }

        this.isFinished = false;
        this.check = () => {
            if (this.isFinished == true) { return }

            if (this.answers[0] && this.answers[1] && this.answers[2] && this.answers[3]) {
                this.isFinished = true;
                this.app.fire("Game:PassTest");
            }
        }
    }

    if (this.testIndex == 20) {
        this.isFinished = false;

        this.answer = 16;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(this.answer, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                    this.entity.findByName("AnswerText").element.text = this.answer;
                }
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.entity.findByName("AnswerText").element.text = _wrongAnswer;
                }
            }, 3);
        }
    }

    if (this.testIndex == 22) {
        this.isFinished = false;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(862, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                }
            }, () => { }, 3, true);
        }
    }

    if (this.testIndex == 23) {
        this.isFinished = false;
        this.entity.findByName("GroundButton_Base").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }

            this.entity.findByName("GroundButton_Base").children[0].enabled = false;
            this.entity.findByName("GroundButton_Base").children[1].enabled = true;
            this.isFinished = true;
            this.app.fire("Game:PassTest");
        }

        this.onStart = () => {
            this.app.canJump = false;
        }

        this.onHint = () => {
            this.entity.findByName("Boxes").enabled = false;
        }
    }

    if (this.testIndex == 24) {
        this.isFinished = false;

        this.answer = 26;
        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }
            this.app.numpadManager.open(this.answer, () => {
                if (this.isFinished == false) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                    this.entity.findByName("AnswerText").element.text = this.answer;
                }
            }, (_wrongAnswer) => {
                if (_wrongAnswer != undefined && _wrongAnswer != null && _wrongAnswer != "") {
                    this.entity.findByName("AnswerText").element.text = _wrongAnswer;
                }
            }, 3);
        }
    }

    if (this.testIndex == 25) {
        this.path = this.entity.findByName("Path");
        this.hinted = false;
        this.visible = true;
        this.timer = 2.0;

        this.setVisible = (_visible) => {
            this.path.children.forEach((_block) => {
                _block.render.enabled = _visible;
            })
        }

        this.isFinished = false;
        this.entity.findByName("GroundButton_Base").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }

            this.entity.findByName("GroundButton_Base").children[0].enabled = false;
            this.entity.findByName("GroundButton_Base").children[1].enabled = true;
            this.isFinished = true;
            this.app.fire("Game:PassTest");
        }

        this.onStart = () => {
            this.app.canJump = false;
        }
    }

    if (this.testIndex == 26) {
        this.isFinished = false;
        this.entity.findByName("GroundButton_Base").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }

            this.entity.findByName("GroundButton_Base").children[0].enabled = false;
            this.entity.findByName("GroundButton_Base").children[1].enabled = true;
            this.isFinished = true;
            this.app.fire("Game:PassTest");
        }

        this.onHint = () => {
            this.entity.findByName("Lasers").children.forEach((_laser) => {
                _laser.script.enabled = false;

                let _pos = _laser.getLocalPosition().clone();
                _laser.setLocalPosition(_pos.x, 0, _pos.z);
            })
        }

        this.onSkip = () => {
            this.entity.findByName("Lasers").enabled = false;
            this.entity.findByName("GroundButton_Base").children[0].enabled = false;
            this.entity.findByName("GroundButton_Base").children[1].enabled = true;
        }
    }

    if (_testID == 27) {
        this.isFinished = false;
        this.entity.findByName("GroundButton_Base").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished) { return; }

            this.entity.findByName("GroundButton_Base").children[0].enabled = false;
            this.entity.findByName("GroundButton_Base").children[1].enabled = true;
            this.isFinished = true;
            this.app.fire("Game:PassTest");
        }

        this.ball = this.entity.findByName("Ball");
        this.ballPos = this.ball.getPosition().clone();

        this.onRestart = () => {
            if (this.ball) {
                this.ball.rigidbody.teleport(this.ballPos);
                this.ball.rigidbody.linearVelocity = new pc.Vec3(0, 0, 0);
                this.ball.rigidbody.angularVelocity = new pc.Vec3(0, 0, 0);
            }
        }

        this.onHint = () => {
            if (this.ball) { this.ball.destroy(); }
            this.ball = null;
        }

        this.onSkip = () => {
            if (this.ball) { this.ball.destroy(); }
            this.entity.findByName("rope1").destroy();
            this.entity.findByName("rope2").destroy();
            this.entity.findByName("Hint").enabled = false;
            this.entity.findByName("GroundButton_Base").children[0].enabled = false;
            this.entity.findByName("GroundButton_Base").children[1].enabled = true;
        }
    }

    if (_testID == 28) {
        this.isFinished = false;
        this.buttons = [false, false, false, false];

        this.entity.findByName("Buttons").children.forEach((_button, _index) => {
            _button.script.iqTestModeTrigger.onTriggerEnter = () => {
                if (this.buttons[_index] || this.isFinished) { return; }
                this.buttons[_index] = true;
                this.check();

                _button.children[0].enabled = true;
                _button.children[1].enabled = false;

                _button.tween(_button.getLocalScale())
                    .to(new pc.Vec3(1.15, 1.15, 1.15), 0.2, pc.ExponentialIn)
                    .onComplete(() => {
                        _button.tween(_button.getLocalScale())
                            .to(new pc.Vec3(1, 1, 1), .25, pc.SineInOut)
                            .start();

                    })
                    .start();
            }
        })

        this.onStart = () => {
            this.app.canJump = false;
        }

        this.onHint = () => {
            this.entity.findByName("Path").enabled = false;
            this.entity.findByName("PathWide").enabled = true;
        }

        this.onSkip = () => {
            this.entity.findByName("Buttons").enabled = false;
            this.entity.findByName("Path").enabled = false;
            this.entity.findByName("PathWide").enabled = false;
        }

        this.check = () => {
            let _result = true;
            this.buttons.forEach((_element) => {
                if (!_element) { _result = false; }
            })

            if (_result) {
                this.isFinished = true;
                this.app.fire("Game:PassTest");
            }
        }
    }

    if (_testID == 29){
        this.isFinished = false;

        this.yellow = false;
        this.blue = false;

        this.entity.findByName("Calculator0").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished == true) { return }
            this.app.numpadManager.open(8132, () => {
                this.yellow = true;
                this.entity.findByName("Calculator0").destroy();
                this.entity.findByName("Sign_Tail0").destroy();
                if (!this.isFinished && this.yellow && this.blue) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                }
            }, () => { }, 4, true);
        }

        this.entity.findByName("Calculator1").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished == true) { return }
            this.app.numpadManager.open(6579, () => {
                this.blue = true;
                this.entity.findByName("Sign_Tail1").destroy();
                this.entity.findByName("Calculator1").destroy();
                if (!this.isFinished && this.yellow && this.blue) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                }
            }, () => { }, 4, true);
        }
    }

    if (_testID == 30){
        this.isFinished = false;

        this.entity.findByName("Calculator").script.iqTestModeTrigger.onTriggerEnter = () => {
            if (this.isFinished == true) { return }
            this.app.numpadManager.open(5682, () => {
                this.entity.findByName("Calculator").destroy();
                this.entity.findByName("Sign_Tail").destroy();
                if (!this.isFinished) {
                    this.isFinished = true;
                    this.app.fire("Game:PassTest");
                }
            }, () => { }, 4, true);
        }

        this.onHint = ()=>{
            this.entity.findByName("HintDisable").enabled = false;
        }
    }
};

IqTestModeTestArea.prototype.update = function (dt) {
    const _testID = this.testIndex;
    if (_testID == 25 && !this.hinted) {

        this.timer = Math.max(this.timer - dt, 0);
        if (this.timer <= 0) {
            this.visible = !this.visible;
            this.setVisible(this.visible);

            const randomRange = (min, max) => Math.random() * (max - min) + min;

            this.timer = this.visible
                ? randomRange(0.5, 1.5)
                : randomRange(0.5, 1.5);
        }
    }
}

IqTestModeTestArea.prototype.onStarted = function (_testID) {
    if (_testID == this.testIndex) {
        if (this.onStart) {
            this.onStart();
        }
    }
}

IqTestModeTestArea.prototype.onRestarted = function (_testID) {
    if (_testID && _testID == this.testIndex) {
        if (this.onRestart) {
            this.onRestart();
        }
    }
}

IqTestModeTestArea.prototype.onGiveHint = function (_testID) {
    if (_testID != this.testIndex) { return; }

    this.entity.findByName("Hint").enabled = true;
    this.powerupSkip.enabled = true;

    if (_testID == this.testIndex) {
        if (this.onHint) {
            this.onHint();
        }
    }
    if (_testID == 3) {
        console.log("HintDisable")
        this.entity.findByName("HintDisable").enabled = false;
    }
    if (_testID == 6) {
        this.entity.findByName("HintDisable").enabled = false;
    }

    if (_testID == 7) {
        this.entity.findByName("HintDisable").enabled = false;
    }

    if (_testID == 9) {
        this.giveHint();
    }

    if (_testID == 10) {
        this.entity.findByName("Cubes").enabled = false;
    }

    if (_testID == 12) {
        this.entity.findByName("HintDisable").enabled = false;
    }

    if (_testID == 13) {
        this.entity.findByName("HintDisable").enabled = false;
    }

    if (_testID == 14) {
        this.hinted = true;
        this.entity.findByName("HintDisable").enabled = false;
        this.buttons.forEach((_child) => { _child.enabled = true; });
    }

    if (_testID == 16) {
        this.entity.findByName("HintDisable").enabled = false;

        setTimeout(() => { if (this.entity && !this.entity.script) return;
            this.counts = [0, 0, 0];
            this.check();
        }, 50)
    }

    if (_testID == 18) {
        this.entity.findByName("HintDisable").enabled = false;
    }

    if (_testID == 19) {
        this.entity.findByName("HintDisable").enabled = false;
    }

    if (_testID == 22) {
        this.entity.findByName("HintDisable").enabled = false;
    }

    if (_testID == 25) {
        this.hinted = true;
        this.setVisible(true);
    }
}

IqTestModeTestArea.prototype.onSkip = function (_testID) {
    if (_testID != this.testIndex) { return; }

    this.isFinished = true;
    this.entity.findByName("Skip").enabled = true;

    if (_testID == this.testIndex) {
        if (this.onSkip) {
            this.onSkip();
        }
    }

    if (_testID == 3) {
        if (this.entity.findByName("Main"))
            this.entity.findByName("Main").enabled = true;
        this.entity.findByName("Hint").enabled = false;
    }

    if (_testID == 4) {
        this.entity.findByName("Labi").enabled = false;
        this.entity.findByName("Hint").enabled = false;
    }

    if (_testID == 6) {
        this.entity.findByName("AnswerText").element.text = 11;
    }

    if (_testID == 7) {
        this.entity.findByName("HintDisable").enabled = false;
        this.entity.findByName("SkipDisable").enabled = false;

        this.entity.findByName("Buttons").children.forEach((_child, _index) => {
            _child.children[0].enabled = true;
            _child.children[1].enabled = false;
        })
    }

    if (_testID == 8) {
        this.entity.findByName("AnswerText").element.text = 4;
    }

    if (_testID == 9) {
        this.entity.findByName("GroundButton_Base").children[0].enabled = true;
        this.entity.findByName("GroundButton_Base").children[1].enabled = false;
        this.entity.findByName("GroundButton_Base").children[2].enabled = false;
        this.giveHint(true);
    }

    if (_testID == 10) {
        this.numpadRed.findByName("Text").element.text = 14;
        this.numpadGreen.findByName("Text").element.text = 77;
        this.numpadYellow.findByName("Text").element.text = 38;
        this.numpadBlue.findByName("Text").element.text = 29;
    }

    if (_testID == 11) {
        this.entity.findByName("ParkourHint").enabled = false;
        this.entity.findByName("Parkour").enabled = false;
    }

    if (_testID == 14) {
        this.entity.findByName("KillToruses").enabled = false;
        this.entity.findByName("Buttons").enabled = false;
    }

    if (_testID == 15) {
        this.entity.findByName("AnswerText").element.text = this.answer;
    }

    if (_testID == 17) {
        this.entity.findByName("Labi").enabled = false;
        this.entity.findByName("Hint").enabled = false;
    }

    if (_testID == 19) {
        this.numpadRed.findByName("Text").element.text = 42;
        this.numpadGreen.findByName("Text").element.text = 18;
        this.numpadYellow.findByName("Text").element.text = 56;
        this.numpadBlue.findByName("Text").element.text = 73;
    }

    if (_testID == 21) {
        this.entity.findByName("SkipDisable").enabled = false;
    }

    if (_testID == 25) {
        this.entity.findByName("Path").enabled = false;
        this.entity.findByName("GroundButton_Base").children[0].enabled = false;
        this.entity.findByName("GroundButton_Base").children[1].enabled = true;
    }
}

IqTestModeTestArea.prototype.onPassed = function (_testID) {
    if (_testID != this.testIndex) { return; }

    this.elevator.fire("TestArea:Passed");

    if (this.powerupHint) { this.powerupHint.enabled = false; }
    if (this.powerupSkip) { this.powerupSkip.enabled = false; }

    this.app.gameManager.hintButtonUI.enabled = false;
    this.app.gameManager.skipButtonUI.enabled = false;

    this.entity.findByName("Triggers").enabled = false;

    this.app.canJump = true;
}


IqTestModeTestArea.prototype.onConnected = function () {
    setTimeout(() => { if (this.entity && !this.entity.script) return;
        if (this.powerupSkip) { this.powerupSkip.enabled = false; }
    }, 1000);
}












