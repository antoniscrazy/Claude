var SlimeTower_Utils = {
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
                    if (decoded && decoded.startsWith("SlimeTower")) {
                        window.localStorage.removeItem(key);
                    }
                } catch (e) { }
            });
        } else {
            this.dataStore = {};
        }
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


function getRandomFromArray(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomFromArrayWithIndex(arr) {
    if (!arr || arr.length === 0) return [0,0];
    const _index = Math.floor(Math.random() * arr.length);
    return [ arr[_index], _index ];
}

function mathRandomRange(min, max){return Math.random() * (max - min) + min;}

function swapArray(arr, a, b) {
    const temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
}