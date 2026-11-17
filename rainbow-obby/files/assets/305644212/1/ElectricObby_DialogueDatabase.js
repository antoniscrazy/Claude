var ElectricObbyDialogueDatabase = pc.createScript('electricObbyDialogueDatabase');

ElectricObbySpeakers = {
    plug: "Plug",
    socket: "Socket"
};

ElectricObbyTexts = {
    invitation: "Come play and win a prize",
    next: "Next",
    close: "Close",
    correctAnswer: "Correct answer!",
    wrongAnswer: "Wrong answer - try again",
    collectProgress: "{remaining} of {total} Plug and Socket characters are still left to collect in the park.",
    collectCounter: "{collected} / {total}",
    rewardReceived: "You received a prize: {item}"
};

ElectricObbyText = function (key, values) {
    let text = ElectricObbyTexts[key];
    if (text == null) { return ""; }

    if (values) {
        for (const name in values) {
            text = text.split("{" + name + "}").join(values[name]);
        }
    }

    return text;
};

ElectricObbyDialogues = {
    ControlCenterWelcome: {
        name: "",
        nodes: [
            { text: "Welcome to Israel Electric Corporation's control room! Here, you'll become safety heroes together with Plug and Socket. Learn the three rules of electrical safety, answer a short quiz - and move on to the game's challenge stage!" },
            {
                question: "What must you NOT do with electrical appliances?",
                options: [
                    "A. Touch them with wet hands",
                    "B. Put them in a cabinet",
                    "C. Put stickers on them"
                ],
                correct: 0
            },
            {
                question: "What should you do if you see an open electrical cabinet?",
                options: [
                    "A. Play near it",
                    "B. Move away and call 103",
                    "C. Film it for TikTok"
                ],
                correct: 1
            },
            {
                question: "What must you NOT do near electricity poles?",
                options: [
                    "A. Talk on the phone",
                    "B. Take photos next to them",
                    "C. Climb them"
                ],
                correct: 2
            }
        ],
        endEvent: "Dialogue:WelcomeFinished"
    },

    CourseIntro: {
        nodes: [
            { name: ElectricObbySpeakers.socket, text: "Wow! This course is seriously challenging... Look at all those electrical sockets! We need to be careful." },
            { name: ElectricObbySpeakers.plug, text: "Touching an exposed socket can be life-threatening! This isn't a game - it's really dangerous." },
            { name: ElectricObbySpeakers.socket, text: "Exactly! In real life there's no respawn - so if you see an exposed socket, move away immediately!" },
            { name: ElectricObbySpeakers.plug, text: "Come on, be safety heroes! Make it through the course without getting an electric shock." }
        ]
    },

    SocketReminder: {
        repeatable: true,
        nodes: [
            { name: ElectricObbySpeakers.plug, text: "An exposed electrical socket is a real-life danger! In real life, there's no respawn." }
        ]
    },

    WaterSafety: {
        nodes: [
            { name: ElectricObbySpeakers.plug, text: "It's so hot - look what's happened to me! I need a shower and a blow-dry to keep my iconic look." },
            { name: ElectricObbySpeakers.socket, text: "Hold on, supermodel! With wet hands and bare feet, you'll get an electrifying look - and not in a good way. Water and electricity are like pineapple on pizza... just don't mix them." },
            { name: ElectricObbySpeakers.plug, text: "You're right. First dry off and put on flip-flops, then use the hair dryer. Wait - what's wrong with pineapple on pizza?" }
        ]
    },

    WaterReminder: {
        repeatable: true,
        nodes: [
            { name: ElectricObbySpeakers.socket, text: "Never touch electrical appliances with wet hands. Dry your hands with a towel before continuing." }
        ]
    },

    OpenCabinet: {
        nodes: [
            { name: ElectricObbySpeakers.socket, text: "Plug! An open electrical cabinet - life-threatening danger! Move away immediately!" },
            { name: ElectricObbySpeakers.plug, text: "I see it! I'm out of here like lightning." }
        ]
    },

    CabinetReminder: {
        repeatable: true,
        nodes: [
            { name: ElectricObbySpeakers.plug, text: "An open electrical cabinet is not a game - it's life-threatening. Move away and tell your parents." }
        ]
    },

    FallenCable: {
        nodes: [
            { name: ElectricObbySpeakers.socket, text: "Careful - an electrical wire has snapped and fallen from the pole!" },
            { name: ElectricObbySpeakers.plug, text: "I'm telling my parents! Don't touch it - don't go near it!" },
            { name: ElectricObbySpeakers.socket, text: "Nice! That's what safety heroes look like!" },
            { name: ElectricObbySpeakers.socket, text: "Great job telling your parents - exposed cables are a life-threatening hazard." }
        ]
    },

    CableReminder: {
        repeatable: true,
        nodes: [
            { name: ElectricObbySpeakers.socket, text: "An exposed cable is not a game - keep your distance!" }
        ]
    },

    FigureMission: {
        nodes: [
            { name: ElectricObbySpeakers.socket, text: "Great job telling your parents - exposed cables are a life-threatening hazard." },
            { name: ElectricObbySpeakers.socket, text: "Hey Plug, we need to collect 3 Plug and Socket characters here - wow, what a mission! I can see one on the electricity pole... should I climb up?" },
            { name: ElectricObbySpeakers.plug, text: "Socket, electricity poles are not for parkour! Feet on the ground - that's the hero rule." },
            { name: ElectricObbySpeakers.socket, text: "Of course! I'm a superhero... I'm sure we can complete the mission if we just look carefully!" }
        ]
    },

    PoleReminder: {
        repeatable: true,
        nodes: [
            { name: ElectricObbySpeakers.socket, text: "Keep your feet on the ground! Never climb electricity poles!" }
        ]
    },

    FiguresCollected: {
        nodes: [
            { name: ElectricObbySpeakers.plug, text: "You dodged the danger! You completed the mission safely!" }
        ]
    },

    GameFinished: {
        nodes: [
            { name: ElectricObbySpeakers.socket, text: "Well done, electrical safety heroes! You completed all the missions and proved that you know how to keep yourselves and others safe. Thanks to your knowledge, you've earned a prize! Keep playing, earning in-game rewards - and being safety champions." }
        ]
    }
};

ElectricObbyDialogueDatabase.prototype.initialize = function () {
    this.app.electricObbyDialogueDatabase = this;
    this.dialogues = ElectricObbyDialogues;
};

ElectricObbyDialogueDatabase.prototype.getDialogue = function (id) {
    if (id == null || this.dialogues[id] == null) { return null; }
    return this.dialogues[id];
};
