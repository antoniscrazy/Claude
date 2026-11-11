/* CrazyGames SDK v3 — mock offline (thay crazygames-sdk-v3.js thật của sdk.crazygames).
   Viết theo đúng các hàm jslib CrazySDK Unity gọi (Kick the Buddy, Fury Foot):
   - quảng cáo: rewarded coi như xem xong (adStarted → adFinished), midroll bỏ qua
   - data.*: lưu localStorage, khoá có tiền tố riêng
   - user: không có tài khoản; mọi lời hứa đăng nhập đều reject như chưa đăng nhập */
(function () {
    var PREFIX = "cgsdk:";
    var store = {
        get: function (k) { try { return localStorage.getItem(PREFIX + k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(PREFIX + k, String(v)); } catch (e) { } },
        del: function (k) { try { localStorage.removeItem(PREFIX + k); } catch (e) { } },
        clear: function () {
            try {
                for (var i = localStorage.length - 1; i >= 0; i--) {
                    var k = localStorage.key(i);
                    if (k && k.indexOf(PREFIX) === 0) localStorage.removeItem(k);
                }
            } catch (e) { }
        },
    };
    function noop() { }
    function later(fn) { setTimeout(fn, 0); }
    var notAuth = function () { return Promise.reject({ code: "userNotAuthenticated", message: "User is not authenticated" }); };
    var ua = navigator.userAgent;
    var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

    var SDK = {
        environment: "crazygames",
        isQaTool: false,
        init: function () { return Promise.resolve(); },
        ad: {
            requestAd: function (type, cb) {
                cb = cb || {};
                // midroll: không chiếu gì, coi như lỗi "unfilled" để game chạy tiếp ngay
                if (type !== "rewarded") {
                    later(function () { cb.adError && cb.adError({ code: "unfilled", message: "No ad available" }); });
                    return Promise.resolve();
                }
                later(function () {
                    cb.adStarted && cb.adStarted();
                    setTimeout(function () { cb.adFinished && cb.adFinished(); }, 100);
                });
                return Promise.resolve();
            },
            prefetchAd: noop,
            hasAdblock: function () { return Promise.resolve(false); },
            addAdblockPopupListener: noop,
            removeAdblockPopupListener: noop,
        },
        banner: {
            requestBanner: function () { return Promise.resolve(); },
            requestResponsiveBanner: function () { return Promise.resolve(); },
            requestOverlayBanners: noop,
            clearBanner: noop,
            clearAllBanners: noop,
        },
        game: {
            settings: { disableChat: false, muteAudio: false },
            isInstantMultiplayer: false,
            link: location.href,
            gameplayStart: noop,
            gameplayStop: noop,
            loadingStart: noop,
            loadingStop: noop,
            happytime: noop,
            inviteLink: function () { return location.href; },
            showInviteButton: function () { return location.href; },
            hideInviteButton: noop,
            getInviteParam: function (k) { return new URLSearchParams(location.search).get(k); },
            addSettingsChangeListener: noop,
            removeSettingsChangeListener: noop,
            addJoinRoomListener: noop,
            removeJoinRoomListener: noop,
        },
        user: {
            isUserAccountAvailable: false,
            systemInfo: {
                countryCode: "US",
                locale: navigator.language || "en-US",
                device: { type: mobile ? "mobile" : "desktop" },
                os: { name: /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac OS" : /Android/.test(ua) ? "Android" : "Linux", version: "" },
                browser: { name: /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) && !/Chrome/.test(ua) ? "Safari" : "Chrome", version: "" },
                applicationType: "web",
            },
            getUser: function () { return Promise.resolve(null); },
            getUserToken: notAuth,
            getXsollaUserToken: notAuth,
            showAuthPrompt: function () { return Promise.reject({ code: "userCancelled", message: "Login is not available" }); },
            showAccountLinkPrompt: function () { return Promise.resolve({ response: "no" }); },
            addAuthListener: noop,
            removeAuthListener: noop,
            addScore: noop,
            submitScore: noop,
        },
        data: {
            getItem: function (k) { return store.get(k); },
            setItem: function (k, v) { store.set(k, v); },
            removeItem: function (k) { store.del(k); },
            clear: function () { store.clear(); },
            syncUnityGameData: noop,
        },
        analytics: { trackOrder: noop },
    };
    window.CrazyGames = window.CrazyGames || {};
    window.CrazyGames.SDK = SDK;
})();
