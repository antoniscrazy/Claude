var ElectricObby_Utils = {
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
                    if (decoded && decoded.startsWith("ElectricObby_")) {
                        window.localStorage.removeItem(key);
                    }
                } catch (e) { }
            });
        } else {
            this.dataStore = {};
        }
    },
};

var ElectricObby_Track = {
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

var ElectricObby_Rtl = {
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
            console.log("Trying to get user");
            userData = await PokiSDK.getUser();
        } catch (error) {
            console.log("Get user failed:", error.message);
        }
    }
    return userData;
}
