var ElectricObbyDialogueManager = pc.createScript('electricObbyDialogueManager');

ElectricObbyDialogueManager.attributes.add("charsPerSecond", { type: "number", default: 45 });
ElectricObbyDialogueManager.attributes.add("textBodyHeight", { type: "number", default: 200 });
ElectricObbyDialogueManager.attributes.add("questionBodyHeight", { type: "number", default: 340 });
ElectricObbyDialogueManager.attributes.add("feedbackDelay", { type: "number", default: 0.6 });

ElectricObbyDialogueManager.prototype.initialize = function () {
    this.app.electricObbyDialogueManager = this;
    this.app.isDialogueEnabled = false;

    this.networkManager = this.app.root.findByName("NetworkManager").script.electricObbyNetworkManager;

    this.body = this.entity.findByName("Body");
    this.namePlate = this.entity.findByName("NamePlate");
    this.nameText = this.entity.findByName("NameText");
    this.dialogueText = this.entity.findByName("DialogueText");
    this.avatar = this.entity.findByName("Avatar");
    this.nextButton = this.entity.findByName("NextButton");
    this.nextButtonText = this.nextButton.findByName("Text");
    this.closeButton = this.entity.findByName("CloseButton");
    this.choiceGroup = this.entity.findByName("ChoiceGroup");
    this.talkButton = this.entity.findByName("TalkButton");

    this.choiceButtons = [];
    for (let i = 0; i < this.choiceGroup.children.length; i++) {
        this.choiceButtons.push(this.choiceGroup.children[i]);
    }

    this.defaultChoiceColor = new pc.Color(1, 1, 1);
    this.correctColor = new pc.Color(0.35, 0.85, 0.35);
    this.wrongColor = new pc.Color(0.9, 0.3, 0.3);

    this.isOpen = false;
    this.isTyping = false;
    this.isLocked = false;
    this.typedTime = 0;
    this.fullText = "";
    this.activeNpc = null;
    this.dialogue = null;
    this.nodeIndex = 0;
    this.pendingFeedback = null;
    this.promptNpc = null;

    this.nextButton.button.on('click', this.onNextClicked, this);
    this.closeButton.button.on('click', this.onCloseClicked, this);
    this.talkButton.button.on('click', this.onTalkClicked, this);

    for (let i = 0; i < this.choiceButtons.length; i++) {
        this.choiceButtons[i].button.on('click', function (event) {
            this.onChoiceClicked(i);
        }, this);
    }

    this.body.enabled = false;
    this.talkButton.enabled = false;

    this.app.on("dialogueManager:start", this.startDialogue, this);
    this.app.on("dialogueManager:close", this.close, this);

    this.on('destroy', function () {
        clearTimeout(this.feedbackTimeout);
        this.app.off("dialogueManager:start", this.startDialogue, this);
        this.app.off("dialogueManager:close", this.close, this);
    }, this);
};

ElectricObbyDialogueManager.prototype.update = function (dt) {
    if (!this.isTyping) { return; }

    this.typedTime += dt;
    const visible = Math.floor(this.typedTime * this.charsPerSecond);

    if (visible >= this.fullText.length) {
        this.dialogueText.element.text = this.fullText;
        this.isTyping = false;
        this.onTypingFinished();
        return;
    }

    this.dialogueText.element.text = this.fullText.substring(0, visible);
};

ElectricObbyDialogueManager.prototype.canStart = function () {
    return !this.isOpen &&
        !this.app.isPopupEnabled &&
        !this.app.menuPanelEnabled &&
        !this.app.deadMenuEnabled &&
        !this.app.isMarketEnabled &&
        !this.app.isWatchingAd &&
        !(this.app.numpad && this.app.numpad.enabled);
};

ElectricObbyDialogueManager.prototype.startDialogue = function (dialogueId, npc) {
    if (!this.canStart()) { return false; }

    const database = this.app.electricObbyDialogueDatabase;
    if (!database) { return false; }

    const dialogue = database.getDialogue(dialogueId);
    if (!dialogue || !dialogue.nodes || dialogue.nodes.length === 0) { return false; }

    this.dialogue = dialogue;
    this.dialogueId = dialogueId;
    this.activeNpc = npc || null;
    this.nodeIndex = 0;
    this.pendingFeedback = null;
    this.isOpen = true;

    this.app.isDialogueEnabled = true;
    this.app.isPopupEnabled = true;
    this.app.fire("lockCamera", true);

    this.hideTalkPrompt();
    this.setAvatar(npc);

    let speaker = dialogue.name;
    if (npc && npc.npcName) { speaker = npc.npcName; }
    this.speaker = speaker;

    ElectricObby_Track.send("npc_dialogue_started", dialogueId, "start");

    this.body.enabled = true;
    this.body.setLocalScale(0.85, 0.85, 0.85);
    this.body.tween(this.body.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.2, pc.BackOut).start();

    this.showNode(0);

    if (this.app.gameplayStarted) {
        this.app.gameplayStarted = false;
        PokiSDK.gameplayStop();
    }

    return true;
};

ElectricObbyDialogueManager.prototype.showNode = function (index) {
    const node = this.dialogue.nodes[index];
    if (!node) {
        this.close();
        return;
    }

    this.nodeIndex = index;
    this.node = node;
    this.isLocked = false;

    const nodeSpeaker = node.name || this.speaker;
    this.nameText.element.text = nodeSpeaker || "";
    this.namePlate.enabled = (nodeSpeaker != null && nodeSpeaker !== "");

    if (node.event) {
        this.app.fire(node.event);
    }

    if (node.question != null) {
        this.setBodyHeight(this.questionBodyHeight);
        this.nextButton.enabled = false;
        this.choiceGroup.enabled = true;
        this.setChoices(node.options);
        this.typeText(node.question);
    } else {
        this.setBodyHeight(this.textBodyHeight);
        this.choiceGroup.enabled = false;
        this.nextButton.enabled = true;
        this.nextButtonText.element.text = ElectricObbyText(this.isLastNode(index) ? "close" : "next");
        this.typeText(node.text);
    }
};

ElectricObbyDialogueManager.prototype.isLastNode = function (index) {
    return index >= this.dialogue.nodes.length - 1 && this.pendingFeedback == null;
};

ElectricObbyDialogueManager.prototype.setBodyHeight = function (height) {
    this.body.element.height = height;
};

ElectricObbyDialogueManager.prototype.setChoices = function (options) {
    for (let i = 0; i < this.choiceButtons.length; i++) {
        const choice = this.choiceButtons[i];
        const text = options && options[i];

        choice.enabled = (text != null);
        if (!choice.enabled) { continue; }

        choice.element.color = this.defaultChoiceColor;
        choice.button.active = false;
        choice.findByName("Text").element.text = text;
    }
};

ElectricObbyDialogueManager.prototype.typeText = function (text) {
    this.fullText = text || "";
    this.typedTime = 0;
    this.isTyping = true;
    this.dialogueText.element.text = "";
};

ElectricObbyDialogueManager.prototype.onTypingFinished = function () {
    if (this.node && this.node.question != null) {
        for (let i = 0; i < this.choiceButtons.length; i++) {
            this.choiceButtons[i].button.active = true;
        }
    }
};

ElectricObbyDialogueManager.prototype.skipTyping = function () {
    this.isTyping = false;
    this.dialogueText.element.text = this.fullText;
    this.onTypingFinished();
};

ElectricObbyDialogueManager.prototype.onNextClicked = function () {
    if (!this.isOpen) { return; }

    if (this.isTyping) {
        this.skipTyping();
        return;
    }

    if (this.pendingFeedback != null) {
        const feedback = this.pendingFeedback;
        this.pendingFeedback = null;
        this.setBodyHeight(this.textBodyHeight);
        this.choiceGroup.enabled = false;
        this.nextButton.enabled = true;
        this.nextButtonText.element.text = ElectricObbyText(this.isLastNode(this.nodeIndex) ? "close" : "next");
        this.node = { text: feedback };
        this.typeText(feedback);
        return;
    }

    ElectricObby_Track.send("npc_dialogue_page_dismissed", this.dialogueId, "page_" + (this.nodeIndex + 1));

    if (this.nodeIndex >= this.dialogue.nodes.length - 1) {
        this.close();
        return;
    }

    this.showNode(this.nodeIndex + 1);
};

ElectricObbyDialogueManager.prototype.onChoiceClicked = function (index) {
    if (!this.isOpen || this.isLocked || this.isTyping) { return; }
    if (!this.node || this.node.question == null) { return; }

    this.isLocked = true;

    const isCorrect = (index === this.node.correct);

    ElectricObby_Track.send("knowledge_check_answered", this.dialogueId + "_q" + (this.nodeIndex + 1), isCorrect ? "correct" : "incorrect");

    for (let i = 0; i < this.choiceButtons.length; i++) {
        this.choiceButtons[i].button.active = false;
    }

    this.choiceButtons[index].element.color = isCorrect ? this.correctColor : this.wrongColor;

    this.app.fire("WarningTextController:setWarning",
        ElectricObbyText(isCorrect ? "correctAnswer" : "wrongAnswer"),
        6,
        isCorrect ? new pc.Color(0, 1, 0, 1) : new pc.Color(1, 0, 0, 1));

    if (this.node.answerEvent) {
        this.app.fire(this.node.answerEvent, isCorrect, index);
    }

    if (!isCorrect) {
        this.feedbackTimeout = setTimeout(() => { if (this.entity && !this.entity.script) return;
            if (!this.isOpen) { return; }
            this.retryQuestion();
        }, this.feedbackDelay * 1000);
        return;
    }

    this.pendingFeedback = this.node.correctText;

    this.feedbackTimeout = setTimeout(() => { if (this.entity && !this.entity.script) return;
        if (!this.isOpen) { return; }
        this.onNextClicked();
    }, this.feedbackDelay * 1000);
};

ElectricObbyDialogueManager.prototype.retryQuestion = function () {
    if (!this.node || this.node.question == null) { return; }

    for (let i = 0; i < this.choiceButtons.length; i++) {
        this.choiceButtons[i].element.color = this.defaultChoiceColor;
        this.choiceButtons[i].button.active = true;
    }

    this.isLocked = false;
};

ElectricObbyDialogueManager.prototype.onCloseClicked = function () {
    this.close();
};

ElectricObbyDialogueManager.prototype.close = function () {
    if (!this.isOpen) { return; }

    clearTimeout(this.feedbackTimeout);

    const npc = this.activeNpc;
    const dialogue = this.dialogue;
    const isCompleted = this.pendingFeedback == null && this.nodeIndex >= this.dialogue.nodes.length - 1;

    ElectricObby_Track.send(isCompleted ? "npc_dialogue_completed" : "npc_dialogue_dismissed", this.dialogueId, "page_" + (this.nodeIndex + 1));

    this.isOpen = false;
    this.isTyping = false;
    this.pendingFeedback = null;
    this.activeNpc = null;
    this.node = null;

    this.app.isDialogueEnabled = false;
    this.app.isPopupEnabled = false;
    this.app.fire("lockCamera", false);

    this.body.tween(this.body.getLocalScale())
        .to(new pc.Vec3(0.85, 0.85, 0.85), 0.12, pc.SineIn)
        .onComplete(() => {
            if (!this.isOpen) { this.body.enabled = false; }
        })
        .start();

    if (npc && npc.onDialogueFinished) {
        npc.onDialogueFinished();
    }

    if (dialogue && dialogue.endEvent) {
        this.app.fire(dialogue.endEvent);
    }
};

ElectricObbyDialogueManager.prototype.setAvatar = function (npc) {
    if (!this.avatar) { return; }

    const asset = npc && npc.avatar;
    if (!asset) {
        this.avatar.enabled = false;
        return;
    }

    this.avatar.enabled = true;
    this.avatar.element.spriteAsset = asset;
};

ElectricObbyDialogueManager.prototype.showTalkPrompt = function (npc) {
    if (this.isOpen) { return; }
    this.promptNpc = npc;
    this.talkButton.enabled = true;
};

ElectricObbyDialogueManager.prototype.hideTalkPrompt = function (npc) {
    if (npc != null && this.promptNpc !== npc) { return; }
    this.promptNpc = null;
    this.talkButton.enabled = false;
};

ElectricObbyDialogueManager.prototype.onTalkClicked = function () {
    if (!this.promptNpc) { return; }
    this.promptNpc.talk();
};
