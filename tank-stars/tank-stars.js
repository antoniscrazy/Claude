(() => {
    "use strict";

    const e = e => {
            const t = RegExp(`[?&]${e}=([^&]*)`).exec(window.location.search);
            return t && decodeURIComponent(t[1].replace(/\+/g, " "))
        },
        t = "kids" === e("tag"),
        o = !!window.adBridge,
        i = "yes" === e("hoist") || "yes" === e("gdhoist"),
        n = (parseInt(e("site_id") || "", 10) || 0) > 0,
        a = t,
        r = navigator.userAgent.includes("PokiApp");

    const s = new class {
        #e = [];

        enqueue(e, t, o, i) {
            const n = {
                fn: e,
                args: t || [],
                resolveFn: o,
                rejectFn: i
            };
            // Nếu là chế độ kids, tự resolve luôn; không xếp hàng chờ SDK ngoài
            if (a) {
                o && o(!0);
            } else {
                this.#e.push(n);
                // Tự xử lý ngay vì không có SDK ngoài nào được load
                this.#autoResolve(n);
            }
        }

        // Tự động resolve các promise mà không cần SDK bên ngoài
        #autoResolve(entry) {
            const { fn, args, resolveFn, rejectFn } = entry;
            try {
                if (fn === "init") {
                    resolveFn && resolveFn(true);
                } else if (fn === "commercialBreak") {
                    // Giả lập quảng cáo: gọi callback progress nếu có, rồi resolve
                    if (typeof args[0] === "function") args[0](1);
                    setTimeout(() => resolveFn && resolveFn(), 300);
                } else if (fn === "rewardedBreak") {
                    resolveFn && resolveFn(true);
                } else {
                    resolveFn && resolveFn(true);
                }
            } catch (err) {
                rejectFn && rejectFn(err);
            }
        }

        dequeue() {
            // Giữ lại để tương thích nhưng không cần thiết nữa
        }

        init = (e = {}) => new Promise((t, o) => {
            this.enqueue("init", [e], t, o);
        });

        // Quảng cáo thật mất vài giây; trả ngay trong cùng tick thì C# có thể chưa sẵn sàng nhận kết quả
        rewardedBreak = () => new Promise(e => {
            setTimeout(() => e(true), 800);
        });

        commercialBreak = e => new Promise((t, o) => {
            this.enqueue("commercialBreak", [e], t, o);
        });

        displayAd = (e, t, o, i) => {
            i && i(true);
            o && o();
        };

        withArguments = e => (...t) => {
            // Chỉ log nội bộ, không gửi ra ngoài
            console.debug(`%cPOKI:%c ${e}`, "font-weight: bold", "", ...t);
        };

        withPromise = e => () => new Promise((t, o) => {
            this.enqueue(e, [], t, o);
        });

        handleAutoResolvePromise = () => new Promise(e => {
            e();
        });

        throwNotLoaded = () => {
            console.debug("PokiSDK is not loaded yet. Not all methods are available.");
        };

        doNothing = () => {};
    };

    // Khởi tạo PokiSDK với toàn bộ API stub
    window.PokiSDK = {
        init: s.init,
        initWithVideoHB: s.init,
        commercialBreak: s.commercialBreak,
        rewardedBreak: s.rewardedBreak,
        displayAd: s.displayAd,
        destroyAd: s.doNothing,
        getLeaderboard: s.handleAutoResolvePromise,
        shareableURL: () => new Promise((e, t) => { t(); }),
        getURLParam: t => e(`gd${t}`) || e(t) || "",
        getLanguage: () => navigator.language.toLowerCase().split("-")[0],
        getIsoLanguage: () => e("iso_lang") || void 0,
        isAdBlocked: () => {},
        getUser: s.withPromise("getUser"),
        getToken: s.withPromise("getToken"),
        login: s.withPromise("login"),
        generateScreenshot: s.withPromise("generateScreenshot")
    };

    // Gắn các method log-only (không gửi dữ liệu ra ngoài)
    [
        "captureError", "customEvent", "gameInteractive", "gameLoadingFinished",
        "gameLoadingProgress", "gameLoadingStart", "gameplayStart", "gameplayStop",
        "happyTime", "logError", "muteAd", "roundEnd", "roundStart", "sendHighscore",
        "setDebug", "setDebugTouchOverlayController", "setLogging", "setPlayerAge",
        "setPlaytestCanvas", "enableEventTracking", "openExternalLink",
        "playtestSetCanvas", "playtestCaptureHtmlOnce", "playtestCaptureHtmlForce",
        "playtestCaptureHtmlOn", "playtestCaptureHtmlOff", "movePill", "showLeaderboard"
    ].forEach(e => {
        window.PokiSDK[e] = s.withArguments(e);
    });

    // Measure API: chỉ postMessage nội bộ, KHÔNG fetch ra ngoài
    if (!o && !t) {
        try {
            let stepCounter = 1;

            window.PokiSDK.measure = (category, action, label) => {
                category = `${category}`;
                action   = void 0 === action ? "" : `${action}`;
                label    = void 0 === label  ? "" : `${label}`;

                window.pokiMeasureBuildin = true;

                // Kiểm tra funnel step đúng thứ tự
                if ("funnel" === category) {
                    if (action !== `${stepCounter}` || void 0 === stepCounter) {
                        stepCounter && console.error(
                            `PokiSDK: expected funnel ${stepCounter} got ${action} (${label})`
                        );
                        stepCounter = void 0;
                        window.pokiMeasureBuildin = false;
                        return;
                    }
                    stepCounter++;
                }

                // Chỉ postMessage nội bộ trong cùng trang, không gửi fetch ra ngoài
                window.parent.postMessage({
                    type: "pokiMessageEvent",
                    content: {
                        event: "pokiTrackingMeasure",
                        data: { category, action, label }
                    }
                }, "*");

                window.pokiMeasureBuildin = false;
            };

            // Báo hiệu bắt đầu load game
            window.PokiSDK.measure("game", "loading", "start");
            window.pokiMeasureBuildin = false;

        } catch (err) {
            console.error(err);
            window.PokiSDK.measure = () => {};
        }
    }

    // KHÔNG load bất kỳ script nào từ bên ngoài
    // (Đã xóa hoàn toàn phần tạo <script> và gắn vào document.head)

})();
