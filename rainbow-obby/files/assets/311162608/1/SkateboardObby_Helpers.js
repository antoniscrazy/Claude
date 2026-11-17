var SkateboardObby_Utils = {
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
                    if (decoded && decoded.startsWith("SkateboardObby_")) {
                        window.localStorage.removeItem(key);
                    }
                } catch (e) { }
            });
        } else {
            this.dataStore = {};
        }
    },
};

var SkateboardObby_Track = {
    portalVisibleTime: 0,

    clean: function (value) {
        if (value === null || value === undefined) { return "none"; }
        return String(value).replace(/[\/\^]/g, "_");
    },

    seconds: function (value) {
        return Math.round(value) + "s";
    },

    send: function (category, what, action) {
        if (typeof PokiSDK === "undefined" || typeof PokiSDK.measure !== "function") { return; }

        try {
            PokiSDK.measure(this.clean(category), this.clean(what), this.clean(action));
        } catch (e) { }
    },
};

var SkateboardObby_Rtl = {
    mirrorChars: { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<" },

    isRtlChar: function (char) {
        const code = char.charCodeAt(0);
        return (code >= 0x0590 && code <= 0x05FF) || (code >= 0xFB1D && code <= 0xFB4F);
    },

    isLtrChar: function (char) {
        return /[A-Za-z0-9À-ɏ]/.test(char);
    },

    getStrongType: function (types, symbols, index, step) {
        for (let i = index + step; i >= 0 && i < types.length; i += step) {
            if (symbols[i] === "\n") return "R";
            if (types[i] !== "N") return types[i];
        }
        return "R";
    },

    reorder: function (symbols) {
        const count = symbols.length;
        const mapping = [];
        const types = [];
        let rtl = false;

        for (let i = 0; i < count; i++) {
            mapping.push(i);
            if (this.isRtlChar(symbols[i])) {
                types.push("R");
                rtl = true;
            } else if (this.isLtrChar(symbols[i])) {
                types.push("L");
            } else {
                types.push("N");
            }
        }

        if (!rtl) {
            return { mapping: mapping, rtl: false };
        }

        const resolved = [];
        for (let i = 0; i < count; i++) {
            if (types[i] !== "N") {
                resolved.push(types[i]);
            } else if (symbols[i] !== "\n" && this.getStrongType(types, symbols, i, -1) === "L" && this.getStrongType(types, symbols, i, 1) === "L") {
                resolved.push("L");
            } else {
                resolved.push("R");
                if (this.mirrorChars[symbols[i]]) {
                    symbols[i] = this.mirrorChars[symbols[i]];
                }
            }
        }

        let start = 0;
        while (start < count) {
            if (resolved[start] !== "L") {
                start++;
                continue;
            }

            let end = start;
            while (end + 1 < count && resolved[end + 1] === "L") {
                end++;
            }

            for (let i = start; i <= end; i++) {
                mapping[i] = end - (i - start);
            }

            start = end + 1;
        }

        return { mapping: mapping, rtl: true };
    },

    apply: function (entity) {
        const elements = entity.findComponents("element");
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].type === pc.ELEMENTTYPE_TEXT) {
                elements[i].rtlReorder = true;
            }
        }
    },

    register: function (app) {
        app.systems.element.registerRtlReorder(this.reorder.bind(this));
        this.apply(app.root);
    },
};

// Console debug helpers (Monkey Helpers pattern): tp(n), tp() / tpList(), pos(), tpPos(x, y, z).
// tp(n): n. checkpoint (Checkpoints/Checkpoint_<n-1>), 0 = lobby. The checkpoint is saved too (respawn continues there).
// Monkey's Helpers define globals with the same names, and every script is loaded in every scene, so these are only
// installed while the Skateboard scene runs (GameManager initialize) and the previous globals come back on destroy.
var SkateboardObby_Debug = {
    names: ["tp", "tpList", "tpPos", "pos", "vip", "vipEnd", "boost"],
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

    checkpoints: function () {
        const root = this.app.root.findByName("Checkpoints");
        return root ? root.children : [];
    },

    controller: function () {
        return this.app.skateboardObbyPlayerController;
    },

    tp: function (n) {
        if (n === undefined) return this.tpList();
        const list = this.checkpoints();
        const index = Math.floor(Number(n));
        if (!Number.isFinite(index) || index < 0 || index > list.length) {
            console.warn("tp(" + n + "): no such checkpoint, 0.." + list.length + " (tp() lists them)");
            return null;
        }
        const controller = this.controller();
        if (controller.isDied) console.warn("tp: the player is dead, respawn first");

        if (index === 0) {
            const lobby = this.app.root.findByName("LobbySpawnPoint");
            if (!lobby) return null;
            const myIndex = this.app.gameManager.getMyIndex();
            const spawn = lobby.children[myIndex > 0 ? myIndex : 0] || lobby;
            controller.stop();
            controller.teleportBody(spawn.getPosition(), true);
            controller.faceSpawn(spawn);
            return "Lobby";
        }

        this.app.skateboardObbyNetworkManager.setCheckpoint(index - 1);
        controller.teleport();
        return list[index - 1].name;
    },

    tpList: function () {
        const lines = ["tp(0)  Lobby"];
        const list = this.checkpoints();
        for (let i = 0; i < list.length; i++) lines.push("tp(" + (i + 1) + ")  " + list[i].name);
        console.log(lines.join("\n"));
        return lines;
    },

    tpPos: function (x, y, z) {
        const controller = this.controller();
        controller.stop();
        controller.teleportToPosition(new pc.Vec3(x, y, z));
    },

    pos: function () {
        const p = this.controller().entity.getPosition();
        const s = p.x.toFixed(2) + ", " + p.y.toFixed(2) + ", " + p.z.toFixed(2);
        console.log(s);
        return s;
    },

    // vip(tier, seconds): 1 = VIP, 2 = BOSS VIP; seconds bos = kademenin normal suresi. Reklamsiz.
    vip: function (tier, seconds) {
        const manager = this.app.vipManager;
        if (!manager) { console.warn("vip: no VipManager in this scene"); return null; }
        manager.grant(Number(tier) || 1, Number(seconds) || 0);
        return manager.getName(manager.level) + " " + manager.numberToTimer(manager.getRemaining());
    },

    // VIP'i hemen bitirir (bitis kilidi de baslar, gercek bitis gibi)
    vipEnd: function () {
        const manager = this.app.vipManager;
        if (!manager) return null;
        manager.stopVip();
        return "VIP ended";
    },

    // boost(seconds): Boost power-up'ini verir (seconds bos = normal sure, 0 = bitir)
    boost: function (seconds) {
        const items = this.app.playerItemManager;
        if (!items) return null;
        if (seconds === 0) { items.endBoostPowerup(); return "Boost power-up ended"; }
        items.grantBoostPowerup(Number(seconds) || 0);
        return "Boost power-up " + Math.round(items.boostPowerup.remaining) + " s";
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
            console.warn("Get user failed:", error.message);
        }
    }
    return userData;
}
