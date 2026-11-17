var SpiderObby_Utils = {
    dataStore: {},

    isLocalStorageSupported: function () {
        try {
            return !!window.localStorage;
        } catch (e) {
            return false;
        }
    },

    setItem: function (key, value) {
        const k = CC.e(key);
        const v = CC.e(value);

        if (this.isLocalStorageSupported()) {
            window.localStorage.setItem(k, v);
        } else {
            this.dataStore[k] = v;
        }
    },

    getItem: function (key) {
        const k = CC.e(key);

        if (this.isLocalStorageSupported()) {
            const val = window.localStorage.getItem(k);
            return val ? CC.d(val) : null;
        } else {
            const val = this.dataStore[k];
            return val ? CC.d(val) : null;
        }
    },

    clear: function () {
        if (this.isLocalStorageSupported()) {
            Object.keys(window.localStorage).forEach((key) => {
                try {
                    const decoded = CC.d(key);
                    if (decoded && decoded.startsWith("SpiderObby_")) {
                        window.localStorage.removeItem(key);
                    }
                } catch (e) { }
            });
        } else {
            this.dataStore = {};
        }
    },
};

// Console debug helpers (Monkey Helpers pattern): tp(n), tp() / tpList(), pos(), tpPos(x, y, z).
// tp(n): start of stage n = StageStart_<n-1>, which sits at the end of stage n-1 (StageStart_0 = in front of Stage 1). tp(0) = lobby.
// Other modes define globals with the same names, so these are only installed while this scene runs
// (GameManager initialize) and the previous globals come back on destroy.
var SpiderObby_Debug = {
    names: ["tp", "tpList", "tpPos", "pos", "level", "wins"],
    saved: null,
    app: null,

    install: function (app) {
        if (this.saved) this.uninstall();
        this.app = app;
        this.saved = {};
        for (let i = 0; i < this.names.length; i++) {
            const name = this.names[i];
            this.saved[name] = window[name];
            window[name] = this[name].bind(this);
        }
    },

    uninstall: function () {
        if (!this.saved) return;
        for (let i = 0; i < this.names.length; i++) {
            const name = this.names[i];
            if (this.saved[name] === undefined) delete window[name];
            else window[name] = this.saved[name];
        }
        this.saved = null;
        this.app = null;
    },

    stageStarts: function () {
        const list = [];
        for (let i = 0; ; i++) {
            const point = this.app.root.findByName("StageStart_" + i);
            if (!point) return list;
            list.push(point);
        }
    },

    controller: function () {
        return this.app.spiderObbyPlayerController;
    },

    tp: function (n) {
        if (n === undefined) return this.tpList();
        if (n === "swing") {
            const start = this.app.root.findByName("Swing_Start");
            if (!start) return null;
            this.controller().stop();
            this.controller().teleportToPosition(start.getPosition().clone());
            return start.name;
        }
        const list = this.stageStarts();
        const index = Math.floor(Number(n));
        if (!Number.isFinite(index) || index < 0 || index > list.length) {
            console.warn("tp(" + n + "): no such stage, 0.." + list.length + " (tp() lists them)");
            return null;
        }
        const controller = this.controller();
        if (controller.isDied) console.warn("tp: the player is dead, respawn first");
        controller.stop();
        if (index === 0) {
            this.app.gameManager.teleportToLobby();
            return "Lobby";
        }
        controller.teleportToPosition(list[index - 1].getPosition().clone());
        return list[index - 1].name;
    },

    tpList: function () {
        const lines = ["tp(0)  Lobby"];
        const list = this.stageStarts();
        for (let i = 0; i < list.length; i++) lines.push("tp(" + (i + 1) + ")  " + list[i].name);
        lines.push("tp('swing')  Swing branch");
        console.log(lines.join("\n"));
        return lines;
    },

    tpPos: function (x, y, z) {
        const controller = this.controller();
        controller.stop();
        controller.teleportToPosition(new pc.Vec3(x, y, z));
    },

    level: function (n) {
        const progress = this.app.spiderObbyProgress;
        if (n !== undefined) progress.setLevel(Number(n) || 0);
        return progress.level;
    },

    wins: function (n) {
        const progress = this.app.spiderObbyProgress;
        if (n !== undefined) progress.setWins(Number(n) || 0);
        return progress.wins;
    },

    pos: function () {
        const p = this.controller().entity.getPosition();
        const s = p.x.toFixed(2) + ", " + p.y.toFixed(2) + ", " + p.z.toFixed(2);
        console.log(s);
        return s;
    },
};

function eventSubscribe(subscriber, eventName, callback) {
    pc.app.on(eventName, callback, subscriber);
    subscriber.entity.on("destroy", () => {
        pc.app.off(eventName, callback, subscriber);
    });
}



async function getUserFromSDK() {
    let userData;
    if (true) {
        try {
            userData = await PokiSDK.getUser();
        } catch (error) {
        }
    }
    return userData;
}
