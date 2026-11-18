var SaveManager = pc.createScript('saveManager');

SaveManager.loadBoolean = function (key, default_value) {
    if (SaveManager.supports_local_storage()) {
        if (localStorage.hasOwnProperty(key)) {
            return localStorage.getItem(key) == 'true';
        }
        else {
            return default_value;
        }
    }
    else {
        return default_value;
    }
};

SaveManager.saveBoolean = function (key, value) {
    if (SaveManager.supports_local_storage()) {
        window.localStorage.setItem(key, value ? 'true' : 'false');
    }
};

SaveManager.loadString = function (key, default_value) {
    if (SaveManager.supports_local_storage()) {
        if (localStorage.hasOwnProperty(key)) {
            return localStorage.getItem(key);
        }
        else {
            return default_value;
        }
    }
    else {
        return default_value;
    }
};

SaveManager.saveString = function (key, value) {
    if (SaveManager.supports_local_storage()) {
        window.localStorage.setItem(key, value);
        return true;
    }
    return false;
};

SaveManager.supports_local_storage = function () {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
};