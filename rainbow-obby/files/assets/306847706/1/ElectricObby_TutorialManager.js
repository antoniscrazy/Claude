var ElectricObbyTutorialManager = pc.createScript('electricObbyTutorialManager');

ElectricObbyTutorialManager.attributes.add("charsPerSecond", { type: "number", default: 45 });
ElectricObbyTutorialManager.attributes.add("welcomeDelay", { type: "number", default: 2 });
ElectricObbyTutorialManager.attributes.add("welcomeTutorialId", { type: "string", default: "CourseIntro" });
ElectricObbyTutorialManager.attributes.add("checkpointIndex", { type: "number", default: 2 });
ElectricObbyTutorialManager.attributes.add("checkpointTutorialId", { type: "string", default: "OpenCabinet" });
ElectricObbyTutorialManager.attributes.add("waterCheckpointIndex", { type: "number", default: 1 });
ElectricObbyTutorialManager.attributes.add("waterTutorialId", { type: "string", default: "WaterSafety" });

ElectricObbyTutorialManager.prototype.initialize = function () {
    this.app.electricObbyTutorialManager = this;

    this.body = this.entity.findByName("Body");
    this.namePlate = this.entity.findByName("NamePlate");
    this.nameText = this.entity.findByName("NameText");
    this.dialogueText = this.entity.findByName("DialogueText");
    this.nextButton = this.entity.findByName("NextButton");
    this.nextButtonText = this.nextButton.findByName("Text");
    this.closeButton = this.entity.findByName("CloseButton");

    this.isOpen = false;
    this.isTyping = false;
    this.typedTime = 0;
    this.fullText = "";
    this.tutorial = null;
    this.tutorialId = null;
    this.nodeIndex = 0;
    this.queue = [];
    this.pendingReminderId = null;

    this.nextButton.button.on('click', this.next, this);
    this.closeButton.button.on('click', this.close, this);

    this.body.enabled = false;

    this.app.on("tutorialManager:start", this.start, this);
    this.app.on("tutorialManager:reminder", this.setReminder, this);
    this.app.on("Dialogue:WelcomeFinished", this.onWelcomeFinished, this);
    this.app.on("checkpointChanged", this.onCheckpointChanged, this);
    this.app.on("Respawned", this.onRespawned, this);

    this.on('destroy', function () {
        clearTimeout(this.welcomeTimeout);
        this.app.off("tutorialManager:start", this.start, this);
        this.app.off("tutorialManager:reminder", this.setReminder, this);
        this.app.off("Dialogue:WelcomeFinished", this.onWelcomeFinished, this);
        this.app.off("checkpointChanged", this.onCheckpointChanged, this);
        this.app.off("Respawned", this.onRespawned, this);
    }, this);
};

ElectricObbyTutorialManager.prototype.update = function (dt) {
    if (!this.isOpen) {
        if (this.queue.length > 0 && !this.app.isDialogueEnabled) {
            this.start(this.queue.shift());
        }
        return;
    }

    const isHidden = this.app.isDialogueEnabled === true;
    if (this.body.enabled === isHidden) {
        this.body.enabled = !isHidden;
    }
    if (isHidden) { return; }

    if (this.app.keyboard.wasPressed(pc.KEY_E) && !this.app.menuPanelEnabled) {
        this.next();
        return;
    }

    if (!this.isTyping) { return; }

    this.typedTime += dt;
    const visible = Math.floor(this.typedTime * this.charsPerSecond);

    if (visible >= this.fullText.length) {
        this.skipTyping();
        return;
    }

    this.dialogueText.element.text = this.fullText.substring(0, visible);
};

ElectricObbyTutorialManager.prototype.start = function (tutorialId) {
    if (Array.isArray(tutorialId)) { tutorialId = tutorialId[0]; }

    const database = this.app.electricObbyDialogueDatabase;
    if (!database) { return; }

    const tutorial = database.getDialogue(tutorialId);
    if (!tutorial || !tutorial.nodes || tutorial.nodes.length === 0) { return; }

    const saveKey = "ElectricObby_Tutorial_" + tutorialId;
    if (!tutorial.repeatable && ElectricObby_Utils.getItem(saveKey) === "1") { return; }

    if (this.isOpen || this.app.isDialogueEnabled) {
        if (this.tutorialId !== tutorialId && this.queue.indexOf(tutorialId) < 0) {
            this.queue.push(tutorialId);
        }
        return;
    }

    if (!tutorial.repeatable) {
        ElectricObby_Utils.setItem(saveKey, "1");
    }

    this.tutorial = tutorial;
    this.tutorialId = tutorialId;
    this.isOpen = true;

    ElectricObby_Track.send("npc_dialogue_started", tutorialId, "start");

    this.body.enabled = true;
    this.body.setLocalScale(0.85, 0.85, 0.85);
    this.body.tween(this.body.getLocalScale()).to(new pc.Vec3(1, 1, 1), 0.2, pc.BackOut).start();

    this.showNode(0);
};

ElectricObbyTutorialManager.prototype.showNode = function (index) {
    const node = this.tutorial.nodes[index];
    if (!node) {
        this.close();
        return;
    }

    this.nodeIndex = index;

    const speaker = node.name || this.tutorial.name;
    this.nameText.element.text = speaker || "";
    this.namePlate.enabled = (speaker != null && speaker !== "");

    this.nextButtonText.element.text = this.getButtonText(this.isLastNode(index));
    this.typeText(node.text);
};

ElectricObbyTutorialManager.prototype.isLastNode = function (index) {
    return index >= this.tutorial.nodes.length - 1;
};

ElectricObbyTutorialManager.prototype.getButtonText = function (isLast) {
    const text = ElectricObbyText(isLast ? "close" : "next");
    return this.app.isMobile ? text : text + " (E)";
};

ElectricObbyTutorialManager.prototype.typeText = function (text) {
    this.fullText = text || "";
    this.typedTime = 0;
    this.isTyping = true;
    this.dialogueText.element.text = "";
};

ElectricObbyTutorialManager.prototype.skipTyping = function () {
    this.isTyping = false;
    this.dialogueText.element.text = this.fullText;
};

ElectricObbyTutorialManager.prototype.next = function () {
    if (!this.isOpen) { return; }

    if (this.isTyping) {
        this.skipTyping();
        return;
    }

    ElectricObby_Track.send("npc_dialogue_page_dismissed", this.tutorialId, "page_" + (this.nodeIndex + 1));

    if (this.isLastNode(this.nodeIndex)) {
        this.close();
        return;
    }

    this.showNode(this.nodeIndex + 1);
};

ElectricObbyTutorialManager.prototype.close = function () {
    if (!this.isOpen) { return; }

    const tutorial = this.tutorial;
    const isCompleted = this.isLastNode(this.nodeIndex);

    ElectricObby_Track.send(isCompleted ? "npc_dialogue_completed" : "npc_dialogue_dismissed", this.tutorialId, "page_" + (this.nodeIndex + 1));

    this.isOpen = false;
    this.isTyping = false;
    this.tutorial = null;
    this.tutorialId = null;

    this.body.tween(this.body.getLocalScale())
        .to(new pc.Vec3(0.85, 0.85, 0.85), 0.12, pc.SineIn)
        .onComplete(() => {
            if (!this.isOpen) { this.body.enabled = false; }
        })
        .start();

    if (tutorial && tutorial.endEvent) {
        this.app.fire(tutorial.endEvent);
    }
};

ElectricObbyTutorialManager.prototype.onWelcomeFinished = function () {
    clearTimeout(this.welcomeTimeout);
    this.welcomeTimeout = setTimeout(() => { if (this.entity && !this.entity.script) return;
        this.start(this.welcomeTutorialId);
    }, this.welcomeDelay * 1000);
};

ElectricObbyTutorialManager.prototype.onCheckpointChanged = function (checkpoint) {
    if (checkpoint === this.waterCheckpointIndex) {
        this.start(this.waterTutorialId);
    }

    if (checkpoint === this.checkpointIndex) {
        this.start(this.checkpointTutorialId);
    }
};

ElectricObbyTutorialManager.prototype.setReminder = function (tutorialId) {
    if (Array.isArray(tutorialId)) { tutorialId = tutorialId[0]; }
    if (tutorialId == null || tutorialId === "") { return; }

    this.pendingReminderId = tutorialId;
};

ElectricObbyTutorialManager.prototype.onRespawned = function () {
    if (this.pendingReminderId == null) { return; }

    const tutorialId = this.pendingReminderId;
    this.pendingReminderId = null;
    this.start(tutorialId);
};
