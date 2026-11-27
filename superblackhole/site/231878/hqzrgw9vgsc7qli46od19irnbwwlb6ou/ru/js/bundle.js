
 //xz 多语言配置表
 window.flip_language_map = {
    Received_successfully:{
        en:"Received successfully",
        ru:"Получено успешно",
        tr:"Başarıyla alındı",
        ar:"تم الاستلام بنجاح",
        de:"Erfolgreich empfangen",
        es:"Recibido exitosamente",
        ja: "正常に受信しました",
    },
}
//xz 
/**
 * des: 根据key获取对应语言，也可以传入参数动态替换;
 * 例子：window.getLanguageByKey("test",[10,5]);
 * 输出：'I am a 10 year old 5 child.'
*/
window.getLanguageByKey = function(key,params = []){
    let item = window.flip_language_map[key];
    if(!item){
        return "";
    }
    let text = item[VkApp.GAME_LANGUAGE] || "";
    if(params.length){
        text = window.getStringReplace(text,params);
    }
    return text;
}
//支持(0)(1)括号格式的字符替换
window.getStringReplace = function(s, params) {
    if (params.length == 0) return s;
    for (var i = 0; i < params.length; i++)
        s = s.replace(new RegExp("\\(" + i + "\\)", "g"), params[i]);
    return s;
}
! 
function () {
    "use strict";
    class i extends Laya.Script {
        constructor() {
            super(), this.scale = 0, this.moveTime = 100, this.state = "", this.finalPosition = new Laya.Vector3(0, 0, 0), this.RandomX = 0, this.RandomY = 0
        }
        Init(i, t, e, a) {
            this.data = i, this.owner.scaleX = this.scale, this.owner.scaleY = this.scale, 1 == e && (this.RandomX = C.RandomFloat(-50, 50), this.RandomY = C.RandomFloat(-100, 100)), Laya.Tween.to(this.owner, {
                x: this.owner.x + this.RandomX,
                y: this.owner.y + this.RandomY,
                scaleX: a,
                scaleY: a
            }, 300, null, null, this.data.delay), Laya.timer.frameOnce(30, this, function () {
                Laya.Tween.to(this.owner, {
                    x: this.data.target.x,
                    y: this.data.target.y,
                    scaleX: 1,
                    scaleY: 1
                }, 300, null, null, this.data.delay)
            }), Laya.timer.frameOnce(50, this, function () {
                Laya.Tween.to(this.owner, {
                    x: this.data.target.x,
                    y: this.data.target.y,
                    scaleX: .5,
                    scaleY: .5
                }, 30, null, Laya.Handler.create(this, function () {
                    null != t && t(), this.owner.destroy()
                }), this.data.delay)
            })
        }
        onDisable() {
            Laya.timer.clearAll(this)
        }
    }
    var t = Laya.View,
        e = (Laya.Dialog, Laya.Scene),
        a = Laya.ClassUtils.regClass;
    class n extends t {
        constructor() {
            super()
        }
        createChildren() {
            super.createChildren(), this.createView(n.uiView)
        }
    }
    n.uiView = {
        type: "View",
        props: {
            zOrder: 12,
            width: 720,
            height: 1280
        },
        compId: 2,
        child: [{
            type: "Image",
            props: {
                y: 0,
                x: 0,
                width: 684,
                skin: "UIRes/repeat/Image_repeat_03.png",
                pivotY: 49,
                pivotX: 342,
                height: 97
            },
            compId: 5,
            child: [{
                type: "Label",
                props: {
                    width: 400,
                    var: "value",
                    valign: "middle",
                    text: "金币不足",
                    height: 67,
                    fontSize: 30,
                    font: "Microsoft YaHei",
                    color: "#ffffff",
                    centerY: 6,
                    centerX: 0,
                    bold: !0,
                    align: "center"
                },
                compId: 4
            }]
        }],
        animations: [{
            nodes: [{
                target: 5,
                keyframes: {
                    y: [{
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 5,
                        key: "y",
                        index: 0
                    }, {
                        value: -50,
                        tweenMethod: "linearOut",
                        tween: !0,
                        target: 5,
                        key: "y",
                        index: 90
                    }],
                    alpha: [{
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 5,
                        key: "alpha",
                        index: 0
                    }, {
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 5,
                        key: "alpha",
                        index: 90
                    }]
                }
            }],
            name: "ani1",
            id: 1,
            frameRate: 24,
            action: 1
        }],
        loadList: ["UIRes/repeat/Image_repeat_03.png"],
        loadList3D: []
    }, a("ui.UIPanel.GameTipUI", n);
    class s extends e {
        constructor() {
            super()
        }
        createChildren() {
            super.createChildren(), this.createView(s.uiView)
        }
    }
    s.uiView = {
        type: "Scene",
        props: {
            width: 720,
            height: 1280
        },
        compId: 2,
        child: [{
            type: "Label",
            props: {
                width: 90,
                var: "addNum",
                valign: "middle",
                text: "+5",
                height: 65,
                font: "font02",
                anchorY: .5,
                anchorX: .5,
                align: "center"
            },
            compId: 3
        }],
        animations: [{
            nodes: [{
                target: 3,
                keyframes: {
                    y: [{
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "y",
                        index: 0
                    }, {
                        value: -150,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "y",
                        index: 15
                    }],
                    alpha: [{
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "alpha",
                        index: 0
                    }, {
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "alpha",
                        index: 10
                    }, {
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "alpha",
                        index: 15
                    }]
                }
            }],
            name: "ani1",
            id: 1,
            frameRate: 24,
            action: 1
        }],
        loadList: [],
        loadList3D: []
    }, a("ui.UIPanel.PreAddNumUI", s);
    class o extends e {
        constructor() {
            super()
        }
        createChildren() {
            super.createChildren(), this.createView(o.uiView)
        }
    }
    o.uiView = {
        type: "Scene",
        props: {
            zOrder: -1,
            width: 720,
            height: 1280
        },
        compId: 2,
        child: [{
            type: "Image",
            props: {
                var: "jianTou",
                skin: "UIRes/game/jiantou1.png",
                anchorY: .5,
                anchorX: .5
            },
            compId: 3,
            child: [{
                type: "Image",
                props: {
                    y: -59,
                    x: 41.5,
                    var: "Icon",
                    skin: "UIRes/game/name1.png",
                    anchorY: .5,
                    anchorX: .5
                },
                compId: 4
            }]
        }],
        loadList: ["UIRes/game/jiantou1.png", "UIRes/game/name1.png"],
        loadList3D: []
    }, a("ui.UIPanel.PreEnemyUI", o);
    class r extends e {
        constructor() {
            super()
        }
        createChildren() {
            super.createChildren(), this.createView(r.uiView)
        }
    }
    r.uiView = {
        type: "Scene",
        props: {
            width: 720,
            height: 1280
        },
        compId: 2,
        child: [{
            type: "Image",
            props: {
                skin: "UIRes/game/Image_game_01.png",
                anchorY: .5,
                anchorX: .5
            },
            compId: 3
        }],
        animations: [{
            nodes: [{
                target: 3,
                keyframes: {
                    y: [{
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "y",
                        index: 0
                    }, {
                        value: -139,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "y",
                        index: 15
                    }],
                    alpha: [{
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "alpha",
                        index: 0
                    }, {
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "alpha",
                        index: 10
                    }, {
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "alpha",
                        index: 15
                    }]
                }
            }],
            name: "ani1",
            id: 1,
            frameRate: 24,
            action: 1
        }],
        loadList: ["UIRes/game/Image_game_01.png"],
        loadList3D: []
    }, a("ui.UIPanel.PreShengJiUI", r);
    class h extends e {
        constructor() {
            super()
        }
        createChildren() {
            super.createChildren(), this.createView(h.uiView)
        }
    }
    h.uiView = {
        type: "Scene",
        props: {
            width: 720,
            height: 1280
        },
        compId: 2,
        child: [{
            type: "Image",
            props: {
                skin: "UIRes/game/Image_game_05.png",
                anchorY: .5,
                anchorX: .5
            },
            compId: 3
        }],
        animations: [{
            nodes: [{
                target: 3,
                keyframes: {
                    scaleY: [{
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "scaleY",
                        index: 0
                    }, {
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "scaleY",
                        index: 10
                    }],
                    scaleX: [{
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "scaleX",
                        index: 0
                    }, {
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 3,
                        key: "scaleX",
                        index: 10
                    }]
                }
            }],
            name: "ani1",
            id: 1,
            frameRate: 24,
            action: 1
        }],
        loadList: ["UIRes/game/Image_game_05.png"],
        loadList3D: []
    }, a("ui.UIPanel.PreTime30UI", h);
    class l extends e {
        constructor() {
            super()
        }
        createChildren() {
            super.createChildren(), this.createView(l.uiView)
        }
    }
    l.uiView = {
        type: "Scene",
        props: {
            width: 720,
            height: 1280
        },
        compId: 2,
        child: [{
            type: "Image",
            props: {
                x: -31,
                skin: "UIRes/game/Image_game_02.png",
                anchorY: .5,
                anchorX: .5
            },
            compId: 4,
            child: [{
                type: "Label",
                props: {
                    y: -3,
                    x: 345,
                    width: 90,
                    var: "addNum",
                    valign: "middle",
                    text: "+5",
                    height: 65,
                    font: "font05",
                    align: "center"
                },
                compId: 5
            }]
        }],
        animations: [{
            nodes: [{
                target: 4,
                keyframes: {
                    scaleY: [{
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 4,
                        key: "scaleY",
                        index: 0
                    }, {
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 4,
                        key: "scaleY",
                        index: 5
                    }, {
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 4,
                        label: null,
                        key: "scaleY",
                        index: 15
                    }, {
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 4,
                        label: null,
                        key: "scaleY",
                        index: 20
                    }],
                    scaleX: [{
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 4,
                        key: "scaleX",
                        index: 0
                    }, {
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 4,
                        key: "scaleX",
                        index: 5
                    }, {
                        value: 1,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 4,
                        label: null,
                        key: "scaleX",
                        index: 15
                    }, {
                        value: 0,
                        tweenMethod: "linearNone",
                        tween: !0,
                        target: 4,
                        label: null,
                        key: "scaleX",
                        index: 20
                    }]
                }
            }],
            name: "ani1",
            id: 1,
            frameRate: 24,
            action: 1
        }],
        loadList: ["UIRes/game/Image_game_02.png"],
        loadList3D: []
    }, a("ui.UIPanel.PreTunUI", l);
    class d extends Laya.Script3D {
        constructor() {
            super(), this.scale = 0, this.moveTime = 10, this.state = "", this.finalPosition = new Laya.Vector3(0, 0, 0)
        }
        Init(i) {
            this.data = i, this.thisTrans = this.owner.transform, this.moveY = 0, this.thisTrans.setWorldLossyScale(new Laya.Vector3(this.scale, this.scale, this.scale)), this.finalPosition = this.thisTrans.position.clone(), this.moveX = this.thisTrans.position.x + C.RandomFloat(-4, 4), this.moveZ = this.thisTrans.position.z + C.RandomFloat(-4, 4), this.thisTrans.localRotationEuler = new Laya.Vector3(C.RandomFloat(0, 360), C.RandomFloat(0, 360), 0), this.state = "create"
        }
        onUpdate() {
            switch (this.state) {
                case "create":
                    if (this.data.delay -= 1, this.data.delay <= 0) {
                        this.scale = .6, this.thisTrans.setWorldLossyScale(new Laya.Vector3(this.scale, this.scale, this.scale));
                        var i = .1;
                        null == this.fanzhuan ? (this.moveY += this.GetDir(7 - this.moveY) * i, this.moveY >= 6 && (this.fanzhuan = !0), this.finalPosition.x += this.GetDir(this.moveX - this.finalPosition.x) * i * .3, this.finalPosition.z += this.GetDir(this.moveZ - this.finalPosition.z) * i * .3) : (this.moveY += this.GetDir(0 - this.moveY) * i, this.moveY <= 0 && (this.moveY = 0), this.finalPosition.x += this.GetDir(this.moveX - this.finalPosition.x) * i * 2, this.finalPosition.z += this.GetDir(this.moveZ - this.finalPosition.z) * i * 2), this.thisTrans.position = new Laya.Vector3(this.finalPosition.x, this.moveY, this.finalPosition.z), this.thisTrans.localRotationEulerX += this.GetDir(0 - this.thisTrans.localRotationEulerX) * i * .5, this.thisTrans.localRotationEulerY += this.GetDir(0 - this.thisTrans.localRotationEulerY) * i * .5, this.thisTrans.localRotationEulerZ += this.GetDir(0 - this.thisTrans.localRotationEulerZ) * i * .5, this.moveTime -= i, this.moveTime <= 0 && (this.finalPosition = this.thisTrans.position.clone(), this.state = "move")
                    }
                    break;
                case "move":
                    i = .1;
                    var t = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0));
                    t = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0)), C.mainCamera.viewportPointToRay(new Laya.Vector2(607, 230), t);
                    var e = new Laya.Vector3(0, 0, 0);
                    if (Laya.Vector3.scale(t.direction, 30, e), Laya.Vector3.add(C.mainCamera.transform.position, e, e), this.finalPosition.x += this.GetDir(e.x - this.finalPosition.x) * i * 2, this.finalPosition.y += this.GetDir(e.y - this.finalPosition.y) * i * 2, this.finalPosition.z += this.GetDir(e.z - this.finalPosition.z) * i * 2, this.thisTrans.position = new Laya.Vector3(this.finalPosition.x, this.finalPosition.y, this.finalPosition.z), this.scale += .03 * (.1 - this.scale), this.thisTrans.setWorldLossyScale(new Laya.Vector3(this.scale, this.scale, this.scale)), this.scale <= .4) return this.owner.destroy(), void(this.state = "over")
            }
        }
        GetDir(i) {
            return i
        }
    }
    class c {
        static ShowUIPanel(i, t = !0, e = null) {
            Laya.Scene.open("UIPanel/" + i + ".scene", t, e)
        }
        static createGoldEffect(i) {
            var t = Laya.stage.width,
                e = Laya.stage.height;
            if (window.qg) {
                var a = qg.getSystemInfoSync();
                t = a.screenWidth, e = a.screenHeight
            }
            var n = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0));
            C.mainCamera.viewportPointToRay(new Laya.Vector2(.5 * t, .5 * e), n);
            var s = new Laya.Vector3(0, 0, 0);
            Laya.Vector3.scale(n.direction, 30, s), Laya.Vector3.add(C.mainCamera.transform.position, s, s), Laya.Vector3.subtract(s, C.cameraTrans.transform.position, s), n = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0)), C.mainCamera.viewportPointToRay(new Laya.Vector2(48, 97), n);
            var o = new Laya.Vector3(0, 0, 0);
            Laya.Vector3.scale(n.direction, 30, o), Laya.Vector3.add(C.mainCamera.transform.position, o, o), Laya.Vector3.subtract(o, C.cameraTrans.transform.position, o);
            for (var r = 0; r < i; r++) {
                var h = Laya.Sprite3D.instantiate(C.models.getChildByName("money"), C.curScene);
                h.transform.position = C.cameraTrans.transform.position.clone(), h.addComponent(d).Init({
                    delay: r * (50 / i),
                    target: {
                        x: o.x,
                        y: o.y,
                        z: o.z
                    }
                }), h.layer = 1
            }
        }
        static ShowGameTipUI(i) {
            var t = new Laya.Point(360, 700);
            let e = Laya.stage.addChild(new n);
            e.value.text = i, e.x = t.x, e.y = t.y, Laya.timer.frameOnce(120, this, function () {
                e.destroy()
            })
        }
        static ShowShengJiUI() {
            var i = new Laya.Point(360, 700);
            let t = Laya.stage.addChild(new r);
            t.x = i.x, t.y = i.y, Laya.timer.frameOnce(120, this, function () {
                t.destroy()
            })
        }
        static ShowAddNumUI(i, t) {
            let e = Laya.stage.addChild(new s);
            e.addNum.text = "+" + i;
            var a = new Laya.Vector4;
            C.mainCamera.worldToViewportPoint(t, a), e.x = a.x, e.y = a.y - 50, Laya.timer.frameOnce(120, this, function () {
                e.destroy()
            })
        }
        static ShowTunUI(i) {
            var t = new Laya.Point(360, 700);
            let e = Laya.stage.addChild(new l);
            e.addNum.text = "+" + i, e.x = t.x, e.y = t.y, Laya.timer.frameOnce(120, this, function () {
                e.destroy()
            })
        }
        static ShowTime30UI() {
            var i = new Laya.Point(360, 700);
            let t = Laya.stage.addChild(new h);
            t.x = i.x, t.y = i.y, Laya.timer.frameOnce(120, this, function () {
                t.destroy()
            })
        }
        static CreateGoldEffectUI(t, e, a, n, s) {
            for (var o = 0; o < t; o++) {
                var r = new Laya.Image("UIRes/game/Image_game_" + e + ".png");
                r.anchorX = .5, r.anchorX = .5, Laya.stage.addChild(r), r.zOrder = -1;
                var h = new Laya.Vector4;
                C.mainCamera.worldToViewportPoint(s, h), r.x = h.x, r.y = h.y - 50, r.addComponent(i).Init({
                    delay: o * (50 / t),
                    target: {
                        x: a,
                        y: n
                    }
                }, null, !1, 2)
            }
        }
        static CreateGoldEffectCoinUI(t, e, a, n) {
            for (var s = 0; s < t; s++) {
                var o = new Laya.Image("UIRes/repeat/Image_repeat_04.png");
                o.anchorX = .5, o.anchorX = .5, Laya.stage.addChild(o);
                var r = new Laya.Vector4;
                C.mainCamera.worldToViewportPoint(n, r), o.x = r.x, o.y = r.y - 150, o.addComponent(i).Init({
                    delay: s * (50 / t),
                    target: {
                        x: e,
                        y: a
                    }
                }, null, !0, 1)
            }
        }
    }
    c.gameUI = null, c.joy = null, c.pushUI = 0;
    class g {
        static GetData() {
            var i = VkApp.getItem("mlzxData");
            i && (g.user = JSON.parse(i))
        }
        static SaveData() {
            var i = JSON.stringify(g.user);
            VkApp.setItem("mlzxData", i)
        }
        static GetUserData(i) {
            return null != g.user[i] ? g.user[i] : g.userDV[i]
        }
        static SetUserData(i, t) {
            g.user[i] = t, g.SaveData()
        }
        static AddProp(i, t) {
            1 == i ? g.SetUserData("Gold", g.GetUserData("Gold") + t) : 2 == i && g.SetUserData("Money", g.GetUserData("Money") + t)
        }
        static IsCanLessProp(i, t) { return !0; /* lokal: alles kostenlos */
            if (1 == i) {
                if (g.GetUserData("Gold") >= t) return !0
            } else if (2 == i && g.GetUserData("Money") >= t) return !0;
            return !1
        }
        static LessProp(i, t) { return; /* lokal: nichts abziehen */
            var e = 0;
            1 == i ? (e = g.GetUserData("Gold")) >= t && g.SetUserData("Gold", e - t) : 2 == i && (e = g.GetUserData("Money")) >= t && g.SetUserData("Money", e - t)
        }
        static SavePiFuTypeList(i) {
            var t = g.GetUserData("piFuType");
            t[i] = 1, g.SetUserData("piFuType", t)
        }
        static savePiFuTypeNum(i) {
            g.SetUserData("piFuTypeNum", i)
        }
        static SaveChongWuTypeList(i) {
            var t = g.GetUserData("chongWuType");
            t[i] = 1, g.SetUserData("chongWuType", t)
        }
        static saveChongWuNum(i) {
            g.SetUserData("chongWuNum", i)
        }
        static AddExp(i) {
            var t = g.GetUserData("curExp"),
                e = g.GetUserData("playerLv");
            (t += i) >= g.GetUserData("allExp") && (t = 0, e += 1, g.SetUserData("playerLv", e)), g.SetUserData("curExp", t)
        }
        static GetGuangKalv() {
            var i = g.GetUserData("showLv");
            return i > 1 && (i = 1), i
        }
    }
    g.user = {}, g.userDV = {}, g.maxGuanQia = 100, g.maxPlayerLevel = 30, g.userDV.beijing = 1, g.userDV.yinxiao = 1, g.userDV.Gold = 0, g.userDV.Money = 0, g.userDV.showLv = 1, g.userDV.playerLv = 1, g.userDV.curExp = 0, g.userDV.allExp = 60, g.userDV.piFuType = {
        1: 1,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0
    }, g.userDV.piFuTypeNum = 1, g.userDV.chongWuType = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0
    }, g.userDV.chongWuNum = -1, g.userDV.isSign = 0, g.userDV.signNum = 0, g.userDV.canSignNum = 0;
    class u extends Laya.Script3D {
        constructor() {
            super()
        }
        onAwake() {}
        onTriggerEnter(i) {
            Laya.stage.event("playerTriggerEnter", [i, this.owner])
        }
        onTriggerExit(i) {
            Laya.stage.event("playerTriggerExit", [i, this.owner])
        }
        onTriggerStay(i) {
            Laya.stage.event("playerTriggerStay", [i, this.owner])
        }
    }
    class y extends Laya.Script3D {
        constructor() {
            super(), this.playerState = "waite", this.speed = 5, this.normalSpeed = this.speed, this.speedMax = 5, this.maxX = 2.6, this.velocity = 6.7, this.t = .07, this.anim, this.initPos, this.initGravity, this.initFallSpeed, this.character, this.rigi, this.body, this.animName = "Idle", this.shangcheng, this.Dong, this.Luo, this.Jiantou, this.Pz, this.scale = 0, this.HuiShou, this.jinDuTiao, this.rayPos1, this.rayPos2, this.rayPos3, this.fanWei, this.lv = 1, this.lvConfig, this.score = 0, this.targetPos, this.wuPin, this.pengZhuangZu = 4, this.canPengZhuang = 4, this.isInScreen = !1, this.arrow = null, this.npcType = 1, this.chaoYueScore = 50
        }
        onAwake() {
            this.npcType = 1 * this.owner.name.substring(this.owner.name.indexOf("c") + 1), this.pengZhuangZu = Math.pow(2, this.npcType + 2), this.canPengZhuang = Math.pow(2, this.npcType + 20), this.Dong = this.owner.getChildByName("Dong"), this.Pz = this.owner.getChildByName("Pz"), this.Luo = this.Dong.getChildByName("Luo"), this.Jiantou = this.Dong.getChildByName("Jiantou"), this.jinDuTiao = this.Dong.getChildByName("loding").getChildAt(0), this.fanWei = this.owner.getChildByName("fanWei"), this.rayPos1 = this.Jiantou.getChildByName("rayPos1"), this.rayPos2 = this.Jiantou.getChildByName("rayPos2"), this.rayPos3 = this.Jiantou.getChildByName("rayPos3"), this.wuPin = C.curScene.getChildByName("ChangJing").getChildByName("wuPin"), this.getTargetPos(), this.updateConfig(), this.refreshScale(this.lvConfig.HeiDong), C.scoreList.push({
                name: this.npcType,
                score: this.score
            }), this.addScore(0), Laya.stage.on("toMove", this, this.toMove), Laya.stage.on("toWaite", this, this.toWaite)
        }
        updateConfig() {
            this.lvConfig = C.Config.ShengJi[this.lv], this.speed = this.lvConfig.Speed
        }
        toMove() {
            this.playerState = "move"
        }
        toWaite() {
            this.playerState = "waite"
        }
        getTargetPos() {
            if (this.wuPin.numChildren > 0) {
                var i = C.RandomInt(0, this.wuPin.numChildren),
                    t = this.wuPin.getChildAt(i);
                1 == t.active ? this.targetPos = new Laya.Vector3(t.transform.position.x, this.owner.transform.position.y, t.transform.position.z) : this.getTargetPos()
            }
        }
        onEnable() {}
        getLv() {
            for (let t in C.Config.ShengJi) {
                var i = C.Config.ShengJi[t];
                this.score >= i.ShengJi && (this.lv = i.id + 1)
            }
            this.lv > 12 && (this.lv = 12), this.updateConfig(), this.refreshScale(this.lvConfig.HeiDong)
        }
        guiLing() {
            this.score = Math.floor(.6 * C.curPlayerControl.score), this.getLv(), this.addScore(0), this.Dong.active = !1, this.Pz.active = !1, this.fanWei.active = !1, this.toWaite(), Laya.timer.once(5e3, this, function () {
                var i = C.curScene.getChildByName("NpcPos"),
                    t = C.RandomInt(0, i.numChildren);
                this.owner.transform.position = new Laya.Vector3(i.getChildAt(t).transform.position.x, 185.7, i.getChildAt(t).transform.position.z), this.owner.transform.rotation = i.getChildAt(t).transform.rotation, this.Dong.active = !0, this.Pz.active = !0, this.fanWei.active = !0, this.toMove()
            })
        }
        zhuiWanJia(i) {
            this.chaoYueScore = i, Laya.timer.clear(this, this.ziDongAddScore), Laya.timer.loop(1e3, this, this.ziDongAddScore)
        }
        ziDongAddScore() {
            this.addScore(10), this.score > C.curPlayerControl.score + this.chaoYueScore && Laya.timer.clear(this, this.ziDongAddScore)
        }
        addScore(i) {
            this.score += i;
            for (let i = 0; i < C.scoreList.length; i++)
                if (C.scoreList[i].name == this.npcType) {
                    C.scoreList[i].score = this.score;
                    break
                } this.score >= this.lvConfig.ShengJi && (this.lv += 1, this.lv > 12 && (this.lv = 12), this.updateConfig(), this.refreshScale(this.lvConfig.HeiDong)), null != this.jinDuTiao && (this.jinDuTiao.meshRenderer.material.tilingOffsetX = 1 - this.score / this.lvConfig.ShengJi * .5)
        }
        refreshScale(i) {
            this.scale = i;
            for (let i = 0; i < this.Pz.numChildren; i++) {
                var t = this.Pz.getChildAt(i);
                for (let i = 0; i < t.numChildren; i++) {
                    var e = new Laya.Vector3;
                    Laya.Vector3.normalize(t.getChildAt(i).transform.localPosition, e), t.getChildAt(i).transform.localPosition = new Laya.Vector3(15 * e.x + this.scale * e.x, 0, 15 * e.z + this.scale * e.z), t.getChildAt(i).getComponent(Laya.PhysicsCollider).collisionGroup = this.pengZhuangZu, t.getChildAt(i).getComponent(Laya.PhysicsCollider).canCollideWith = this.canPengZhuang
                }
            }
            this.fanWei.transform.setWorldLossyScale(new Laya.Vector3(2 + this.scale, 2 + this.scale, 2 + this.scale)), this.Luo.transform.localPosition = new Laya.Vector3(0, -7 - this.scale, 0)
        }
        updateShopYifu(i) {
            for (let t = 0; t < this.Ball.numChildren; t++) this.Ball.getChildAt(t).active = t == i
        }
        onUpdate() {
            if (!(Laya.timer.delta > 300) && 0 != Laya.timer.scale) switch (this.inScreen(), this.arrowOutScreen(), this.playerState) {
                case "waite":
                    break;
                case "move":
                    if (null != this.targetPos) {
                        var i = new Laya.Vector3;
                        Laya.Vector3.subtract(this.owner.transform.position, this.targetPos, i);
                        var t = new Laya.Vector3(-i.x, 0, i.z),
                            e = new Laya.Quaternion;
                        Laya.Quaternion.rotationLookAt(t, new Laya.Vector3(0, 1, 0), e), Laya.Quaternion.slerp(this.Jiantou.transform.rotation, e, .5, e), this.Jiantou.transform.rotation = e;
                        var a = this.speed,
                            n = this.speed,
                            s = new Laya.Vector3;
                        this.Jiantou.transform.getForward(s), Laya.Vector3.normalize(s, s), s = new Laya.Vector3(-s.x, 0, -s.z);
                        var o = new Laya.Ray(new Laya.Vector3(this.rayPos1.transform.position.x, this.rayPos1.transform.position.y + 1, this.rayPos1.transform.position.z), s),
                            r = new Laya.HitResult;
                        C.curScene.physicsSimulation.rayCast(o, r, this.scale + 1), r && r.collider && (-1 == r.collider.owner.name.indexOf("QianQiang") && -1 == r.collider.owner.name.indexOf("HouQiang") || (n = 0), -1 == r.collider.owner.name.indexOf("ZuoQiang") && -1 == r.collider.owner.name.indexOf("YouQiang") || (a = 0));
                        var h = new Laya.Ray(new Laya.Vector3(this.rayPos2.transform.position.x, this.rayPos2.transform.position.y + 1, this.rayPos2.transform.position.z), s),
                            l = new Laya.HitResult;
                        C.curScene.physicsSimulation.rayCast(h, l, this.scale + 1), l && l.collider && (-1 == l.collider.owner.name.indexOf("QianQiang") && -1 == l.collider.owner.name.indexOf("HouQiang") || (n = 0), -1 == l.collider.owner.name.indexOf("ZuoQiang") && -1 == l.collider.owner.name.indexOf("YouQiang") || (a = 0));
                        var d = new Laya.Ray(new Laya.Vector3(this.rayPos3.transform.position.x, this.rayPos3.transform.position.y + 1, this.rayPos3.transform.position.z), s),
                            c = new Laya.HitResult;
                        C.curScene.physicsSimulation.rayCast(d, c, this.scale + 1), c && c.collider && (-1 == c.collider.owner.name.indexOf("QianQiang") && -1 == c.collider.owner.name.indexOf("HouQiang") || (n = 0), -1 == c.collider.owner.name.indexOf("ZuoQiang") && -1 == c.collider.owner.name.indexOf("YouQiang") || (a = 0)), 0 == a && 0 == n && this.getTargetPos();
                        var g = new Laya.Vector3(.02 * a * Laya.timer.delta * .08 * s.x, 0, .02 * n * Laya.timer.delta * .08 * s.z);
                        this.owner.transform.translate(g, !1), Laya.Vector3.distance(this.owner.transform.position, this.targetPos) <= .5 && (this.playerState = "waiteTun", this.getTargetPos(), Laya.timer.once(2e3, this, function () {
                            this.playerState = "move"
                        }))
                    }
                    var u = new Laya.Vector3(0, 0, 0);
                    if (Laya.Vector3.lerp(this.Dong.transform.getWorldLossyScale(), new Laya.Vector3(this.scale, 1, this.scale), .05, u), this.Dong.transform.setWorldLossyScale(u), null != C.curPlayerControl && "lose" != C.curPlayerControl.playerState)
                        if (this.score > C.curPlayerControl.score) Laya.Vector3.distance(this.owner.transform.position, C.curPlayerControl.owner.transform.position) + C.curPlayerControl.scale <= 2 * this.scale && (this.score += C.curPlayerControl.score, C.curPlayerControl.lose())
            }
        }
        onLateUpdate() {}
        arrowOutScreen() {
            if (null != this.arrow) {
                var i = new Laya.Vector4;
                C.mainCamera.worldToViewportPoint(this.owner.transform.position, i);
                var t = C.mainCamera.viewport;
                if (i.z < 1) i.x <= 20 ? i = new Laya.Vector4(20, i.y, i.z, i.w) : i.x >= t.width - 20 && (i = new Laya.Vector4(t.width - 20, i.y, i.z, i.w)), i.y <= 20 ? i = new Laya.Vector4(i.x, 20, i.z, i.w) : i.y >= t.height - 20 && (i = new Laya.Vector4(i.x, t.height - 20, i.z, i.w));
                else {
                    if (i.x <= 20) i = new Laya.Vector4(t.width - 20, i.y, i.z, i.w);
                    else if (i.x >= t.width - 20) i = new Laya.Vector4(20, i.y, i.z, i.w);
                    else {
                        var e = t.width - i.x;
                        i = new Laya.Vector4(e, i.y, i.z, i.w)
                    }
                    i = new Laya.Vector4(i.x, t.height - 20, i.z, i.w)
                }
                if (this.arrow.x = i.x, this.arrow.y = i.y, null != C.curPlayerControl) {
                    var a = new Laya.Vector3(C.curPlayerControl.owner.transform.position.x, this.fanWei.transform.position.y, C.curPlayerControl.owner.transform.position.z),
                        n = new Laya.Vector3(0, 1, 0),
                        s = new Laya.Quaternion;
                    Laya.Quaternion.lookAt(a, this.fanWei.transform.position, n, s), s.w = -s.w, this.fanWei.transform.rotation = s, this.arrow.jianTou.rotation = -this.fanWei.transform.rotationEuler.y, this.arrow.Icon.rotation = this.fanWei.transform.rotationEuler.y
                }
            }
            0 == this.isInScreen ? null == this.arrow && (this.arrow = Laya.stage.addChild(new o), this.arrow.jianTou.skin = "UIRes/game/jiantou" + this.npcType + ".png", this.arrow.Icon.skin = "UIRes/game/name" + this.npcType + ".png") : null != this.arrow && this.arrow.destroy && (this.arrow.destroy(), this.arrow = null)
        }
        inScreen() {
            var i = new Laya.Vector4;
            C.mainCamera.worldToViewportPoint(this.owner.transform.position, i);
            var t = C.mainCamera.viewport;
            i.x < t.width && i.x > 0 && i.y < t.height && i.y > 0 ? this.isInScreen = !0 : this.isInScreen = !1
        }
        lose() {
            this.playerState = "lose"
        }
        win() {
            this.playerState = "win"
        }
        onTriggerStay(i) {
            1 != i.owner.destroyed && i.owner.name.indexOf("jieSuoTrigger")
        }
        onTriggerEnter(i) {
            i.owner.destroyed
        }
        onTriggerExit(i) {
            i.owner.destroyed
        }
        onDisable() {
            null != this.arrow && this.arrow.destroy && (this.arrow.destroy(), this.arrow = null), Laya.stage.off("toMove", this, this.toMove), Laya.stage.off("toWaite", this, this.toWaite), Laya.timer.clearAll(this)
        }
    }
    class m extends Laya.Script3D {
        constructor() {
            super(), this.rigi, this.isLuo = !1, this.score = 1, this.HeiDongJs = null, this.targetPos, this.target, this.index = 0, this.speed = 2, this.isMove = !0, this.isFaShe = !1, this.initY = 0
        }
        onAwake() {
            this.score = 3, this.rigi = this.owner.getComponent(Laya.Rigidbody3D), this.rigi.gravity = new Laya.Vector3(0, -20, 0), this.rigi.overrideGravity = !0, this.rigi.isKinematic = !0, this.initY = this.owner.transform.position.y, this.rigi.isTrigger = !0
        }
        init(i, t) {
            this.target = i, this.index = t, this.getTargetPos()
        }
        getTargetPos() {
            this.index++, this.index >= this.target.numChildren && (this.index = 0), this.targetPos = this.target.getChildAt(this.index).transform.position
        }
        onUpdate() {
            if (!(Laya.timer.delta > 300) && 0 != Laya.timer.scale) {
                if (null != this.targetPos && 1 == this.isMove) {
                    var i = new Laya.Vector3;
                    Laya.Vector3.subtract(this.owner.transform.position, new Laya.Vector3(this.targetPos.x, this.owner.transform.position.y, this.targetPos.z), i);
                    var t = new Laya.Vector3(-i.x, 0, i.z),
                        e = new Laya.Quaternion;
                    Laya.Quaternion.rotationLookAt(t, new Laya.Vector3(0, 1, 0), e), Laya.Quaternion.slerp(this.owner.transform.rotation, e, .1, e), this.owner.transform.rotation = e;
                    var a = new Laya.Vector3;
                    this.owner.transform.getForward(a), Laya.Vector3.normalize(a, a), a = new Laya.Vector3(-a.x, 0, -a.z);
                    var n = new Laya.Vector3(.02 * this.speed * Laya.timer.delta * .08 * a.x, 0, .02 * this.speed * Laya.timer.delta * .08 * a.z);
                    this.owner.transform.translate(n, !1), Laya.Vector3.distance(this.owner.transform.position, new Laya.Vector3(this.targetPos.x, this.owner.transform.position.y, this.targetPos.z)) <= .5 && this.getTargetPos()
                }
                if (1 == this.isFaShe) {
                    var s = new Laya.Vector3(this.owner.transform.position.x, this.owner.transform.position.y, this.owner.transform.position.z),
                        o = new Laya.Ray(s, new Laya.Vector3(0, -1, 0)),
                        r = [];
                    if (C.curScene.physicsSimulation.rayCastAll(o, r), r.length > 0)
                        for (let i = 0; i < r.length; i++) r[i] && r[i].collider && r[i].collider.owner != this.owner && -1 != r[i].collider.owner.name.indexOf("Luo") && (this.isMove = !1, 1 == this.rigi.isKinematic && (this.rigi.isKinematic = !1, this.rigi.isTrigger = !1), "Heidong" == r[i].collider.owner.parent.parent.name ? this.HeiDongJs != C.curPlayerControl && (this.HeiDongJs = C.curPlayerControl, this.rigi.collisionGroup = this.HeiDongJs.canPengZhuang) : "Npc" == r[i].collider.owner.parent.parent.name && (null != this.HeiDongJs && (this.HeiDongJs, C.curPlayerControl), this.HeiDongJs = r[i].collider.owner.parent.parent.getComponent(y), this.rigi.collisionGroup = this.HeiDongJs.canPengZhuang), this.rigi.applyForce(new Laya.Vector3(0, -50, 0)));
                    else if (0 == this.rigi.isKinematic && this.owner.transform.position.y > 183) {
                        var h = this.owner.transform.rotation.clone();
                        this.HeiDongJs = null, this.rigi.isKinematic = !0, this.rigi.isTrigger = !0, this.owner.transform.position = new Laya.Vector3(this.owner.transform.position.x, this.initY, this.owner.transform.position.z), this.owner.transform.rotation = h, this.isMove = !0
                    }
                }
                this.owner.transform.position.y < 160 && (null != this.HeiDongJs && this.HeiDongJs.addScore(this.score), this.owner.active = !1)
            }
        }
        onTriggerExit(i) {
            if (1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.rigi.isKinematic && this.owner.transform.position.y > 183) {
                var t = this.owner.transform.rotation.clone();
                this.isFaShe = !1, this.HeiDongJs = null, this.rigi.isKinematic = !0, this.rigi.isTrigger = !0, this.owner.transform.position = new Laya.Vector3(this.owner.transform.position.x, this.initY, this.owner.transform.position.z), this.owner.transform.rotation = t, this.isMove = !0
            }
        }
        onTriggerEnter(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.isFaShe && (this.isFaShe = !0)
        }
        onTriggerStay(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.isFaShe && (this.isFaShe = !0)
        }
        onDisable() {}
    }
    class w extends Laya.Script3D {
        constructor() {
            super(), this.rigi, this.isLuo = !1, this.score = 1, this.HeiDongJs = null, this.anim, this.isFaShe = !1, this.initY = 0, this.rota
        }
        onAwake() {
            this.score = 1, this.rota = this.owner.transform.rotation.clone(), this.anim = this.owner.getComponent(Laya.Animator), this.rigi = this.owner.getComponent(Laya.Rigidbody3D), this.rigi.gravity = new Laya.Vector3(0, -20, 0), this.rigi.overrideGravity = !0, this.rigi.isKinematic = !0, this.rigi.isTrigger = !0, this.initY = this.owner.transform.position.y, this.anim.play("Idle"), this.updatePiFu()
        }
        updatePiFu() {
            var i = C.RandomInt(0, this.owner.numChildren - 1);
            for (let t = 0; t < this.owner.numChildren - 1; t++) this.owner.getChildAt(t).active = t == i
        }
        onUpdate() {
            if (!(Laya.timer.delta > 300) && 0 != Laya.timer.scale) {
                if (1 == this.isFaShe) {
                    var i = new Laya.Vector3(this.owner.transform.position.x, this.owner.transform.position.y, this.owner.transform.position.z),
                        t = new Laya.Ray(i, new Laya.Vector3(0, -1, 0)),
                        e = [];
                    if (C.curScene.physicsSimulation.rayCastAll(t, e), e.length > 0)
                        for (let i = 0; i < e.length; i++) e[i] && e[i].collider && e[i].collider.owner != this.owner && -1 != e[i].collider.owner.name.indexOf("Luo") && (1 == this.rigi.isKinematic && (this.rigi.isKinematic = !1, this.rigi.isTrigger = !1), "Heidong" == e[i].collider.owner.parent.parent.name ? this.HeiDongJs != C.curPlayerControl && (this.HeiDongJs = C.curPlayerControl, this.rigi.collisionGroup = this.HeiDongJs.canPengZhuang) : "Npc" == e[i].collider.owner.parent.parent.name && (null != this.HeiDongJs && (this.HeiDongJs, C.curPlayerControl), this.HeiDongJs = e[i].collider.owner.parent.parent.getComponent(y), this.rigi.collisionGroup = this.HeiDongJs.canPengZhuang), 1 == this.rigi.isKinematic && (this.rigi.isKinematic = !1, this.rigi.isTrigger = !1), this.anim.play("Fall"), this.rigi.applyForce(new Laya.Vector3(0, -50, 0)))
                }
                this.owner.transform.position.y < 160 && (null != this.HeiDongJs && this.HeiDongJs.addScore(this.score), this.owner.active = !1)
            }
        }
        onTriggerExit(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.rigi.isKinematic && this.owner.transform.position.y > 183 && (this.isFaShe = !1, this.HeiDongJs = null, this.rigi.isKinematic = !0, this.owner.transform.position = new Laya.Vector3(this.owner.transform.position.x, this.initY, this.owner.transform.position.z), this.owner.transform.rotation = this.rota, this.anim.play("Idle"), this.rigi.isTrigger = !0)
        }
        onTriggerEnter(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.isFaShe && (this.isFaShe = !0)
        }
        onTriggerStay(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.isFaShe && (this.isFaShe = !0)
        }
        onDisable() {}
    }
    class p extends Laya.Script3D {
        constructor() {
            super(), this.rigi, this.isLuo = !1, this.score = 1, this.HeiDongJs = null, this.targetPos, this.target, this.index = 0, this.speed = 1, this.isMove = !0, this.anim, this.isFaShe = !1, this.initY = 0, this.rota
        }
        onAwake() {
            this.score = 1, this.rota = this.owner.transform.rotation.clone(), this.rigi = this.owner.getComponent(Laya.Rigidbody3D), this.rigi.gravity = new Laya.Vector3(0, -20, 0), this.rigi.overrideGravity = !0, this.rigi.isKinematic = !0, this.rigi.isTrigger = !0, this.anim = this.owner.getComponent(Laya.Animator), this.initY = this.owner.transform.position.y, this.updatePiFu()
        }
        updatePiFu() {
            var i = C.RandomInt(0, this.owner.numChildren - 1);
            for (let t = 0; t < this.owner.numChildren - 1; t++) this.owner.getChildAt(t).active = t == i
        }
        init(i, t) {
            this.target = i, this.index = t, this.getTargetPos()
        }
        getTargetPos() {
            this.index++, this.index >= this.target.numChildren && (this.index = 0), this.targetPos = this.target.getChildAt(this.index).transform.position
        }
        onUpdate() {
            if (!(Laya.timer.delta > 300) && 0 != Laya.timer.scale) {
                if (null != this.targetPos && 1 == this.isMove) {
                    var i = new Laya.Vector3;
                    Laya.Vector3.subtract(this.owner.transform.position, new Laya.Vector3(this.targetPos.x, this.owner.transform.position.y, this.targetPos.z), i);
                    var t = new Laya.Vector3(-i.x, 0, i.z),
                        e = new Laya.Quaternion;
                    Laya.Quaternion.rotationLookAt(t, new Laya.Vector3(0, 1, 0), e), Laya.Quaternion.slerp(this.owner.transform.rotation, e, .1, e), this.owner.transform.rotation = e;
                    var a = new Laya.Vector3;
                    this.owner.transform.getForward(a), Laya.Vector3.normalize(a, a), a = new Laya.Vector3(-a.x, 0, -a.z);
                    var n = new Laya.Vector3(.02 * this.speed * Laya.timer.delta * .08 * a.x, 0, .02 * this.speed * Laya.timer.delta * .08 * a.z);
                    this.owner.transform.translate(n, !1), this.anim.play("Walk"), Laya.Vector3.distance(this.owner.transform.position, new Laya.Vector3(this.targetPos.x, this.owner.transform.position.y, this.targetPos.z)) <= .5 && this.getTargetPos()
                }
                if (1 == this.isFaShe) {
                    var s = new Laya.Vector3(this.owner.transform.position.x, this.owner.transform.position.y, this.owner.transform.position.z),
                        o = new Laya.Ray(s, new Laya.Vector3(0, -1, 0)),
                        r = [];
                    if (C.curScene.physicsSimulation.rayCastAll(o, r), r.length > 0)
                        for (let i = 0; i < r.length; i++) r[i] && r[i].collider && r[i].collider.owner != this.owner && -1 != r[i].collider.owner.name.indexOf("Luo") && (this.isMove = !1, 1 == this.rigi.isKinematic && (this.rigi.isKinematic = !1, this.rigi.isTrigger = !1), "Heidong" == r[i].collider.owner.parent.parent.name ? this.HeiDongJs != C.curPlayerControl && (this.HeiDongJs = C.curPlayerControl, this.rigi.collisionGroup = this.HeiDongJs.canPengZhuang) : "Npc" == r[i].collider.owner.parent.parent.name && (null != this.HeiDongJs && (this.HeiDongJs, C.curPlayerControl), this.HeiDongJs = r[i].collider.owner.parent.parent.getComponent(y), this.rigi.collisionGroup = this.HeiDongJs.canPengZhuang), this.anim.play("Fall"), this.rigi.applyForce(new Laya.Vector3(0, -50, 0)))
                }
                this.owner.transform.position.y < 160 && (null != this.HeiDongJs && this.HeiDongJs.addScore(this.score), this.owner.active = !1)
            }
        }
        onTriggerExit(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.rigi.isKinematic && this.owner.transform.position.y > 183 && (this.isFaShe = !1, this.HeiDongJs = null, this.rigi.isKinematic = !0, this.rigi.isTrigger = !0, this.owner.transform.position = new Laya.Vector3(this.owner.transform.position.x, this.initY, this.owner.transform.position.z), this.owner.transform.rotation = this.rota, this.isMove = !0)
        }
        onTriggerEnter(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.isFaShe && (this.isFaShe = !0)
        }
        onTriggerStay(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.isFaShe && (this.isFaShe = !0)
        }
        onDisable() {}
    }
    class f extends Laya.Script3D {
        constructor() {
            super(), this.curTouchId = 0, this.curTouchIdMove = 0, this.firstTouchMove = -1, this.lastMouseX = 0, this.lastMouseY = 0, this.rotaionSpeed = .05, this.isMouseDown = !1, this.playerState = "waite", this.speed = 6, this.normalSpeed = this.speed, this.speedMax = 6, this.dianTiSpeed = 2, this.maxX = 2.6, this.velocity = 6.7, this.t = .07, this.curPosX = 0, this.curPosY = 0, this.anim, this.initPos, this.initGravity, this.initFallSpeed, this.character, this.left = -.9, this.right = .9, this.rota, this.lastAngle = 180, this.rigi, this.body, this.rotaY = 0, this.animName = "Idle", this.shangcheng, this.Dong, this.Luo, this.Jiantou, this.Pz, this.scale = 0, this.HuiShou, this.jinDuTiao, this.rayPos1, this.rayPos2, this.rayPos3, this.fanWei, this.lv = 1, this.lvConfig, this.score = 0, this.cameraAlphaObjectArray = [], this.pengZhuangZu = Math.pow(2, 1), this.canPengZhuang = Math.pow(2, 2), this.npcJs = [], this.jiantouPiFu, this.loding, this.loding1, this.banTouPos
        }
        onAwake() {
            this.Dong = this.owner.getChildByName("Dong"), this.banTouPos = this.Dong.getChildByName("banTouPos"), this.Pz = this.owner.getChildByName("Pz"), this.Luo = this.Dong.getChildByName("Luo"), this.Jiantou = this.Dong.getChildByName("Jiantou"), this.jiantouPiFu = this.Jiantou.getChildByName("jiantou"), this.loding = this.Dong.getChildByName("loding"), this.loding1 = this.Dong.getChildByName("loding1"), this.fanWei = this.owner.getChildByName("fanWei"), this.rayPos1 = this.Jiantou.getChildByName("rayPos1"), this.rayPos2 = this.Jiantou.getChildByName("rayPos2"), this.rayPos3 = this.Jiantou.getChildByName("rayPos3"), this.updateConfig(), C.piFuType = g.GetUserData("piFuTypeNum"), this.refreshScale(this.lvConfig.HeiDong), C.scoreList.push({
                name: 0,
                score: this.score
            }), this.Dong.addComponent(u), this.updateShopYifu(C.piFuType - 1), this.addScore(0)
        }
        updateConfig() {
            this.lvConfig = C.Config.ShengJi[this.lv], this.speed = this.lvConfig.Speed
        }
        onEnable() {
            c.gameUI.bg.on(Laya.Event.MOUSE_DOWN, this, this.mouseDown), Laya.stage.on(Laya.Event.MOUSE_UP, this, this.mouseUp), Laya.stage.on(Laya.Event.MOUSE_OUT, this, this.mouseOut), Laya.stage.on("playerTriggerEnter", this, this.playerTriggerEnter), Laya.stage.on("playerTriggerExit", this, this.playerTriggerExit), Laya.stage.on("playerTriggerStay", this, this.playerTriggerStay)
        }
        moveWaite() {
            this.playerState = "moveWaite"
        }
        toMove() {
            this.playerState = "move"
        }
        updateShopYifu(i) {
            for (let t = 0; t < this.jiantouPiFu.numChildren; t++) this.jiantouPiFu.getChildAt(t).active = t == i, this.loding.getChildAt(t).active = t == i, this.loding1.getChildAt(t).active = t == i;
            this.jinDuTiao = this.loding.getChildAt(i), this.jinDuTiao.meshRenderer.material.tilingOffsetX = 1 - this.score / this.lvConfig.ShengJi * .5
        }
        addScore(i) {
            this.score += i, i > 0 && c.ShowAddNumUI(i, this.owner.transform.position), C.PlaySound("TunShi");
            for (let i = 0; i < C.scoreList.length; i++)
                if (0 == C.scoreList[i].name) {
                    C.scoreList[i].score = this.score;
                    break
                } this.score >= this.lvConfig.ShengJi && (this.lv += 1, this.lv > 12 ? this.lv = 12 : (C.PlaySound("ChiCunUp"), c.ShowShengJiUI()), this.updateConfig(), this.refreshScale(this.lvConfig.HeiDong)), null != this.jinDuTiao && (this.jinDuTiao.meshRenderer.material.tilingOffsetX = 1 - this.score / this.lvConfig.ShengJi * .5)
        }
        refreshScale(i) {
            this.scale = i;
            for (let i = 0; i < this.Pz.numChildren; i++) {
                var t = this.Pz.getChildAt(i);
                for (let i = 0; i < t.numChildren; i++) {
                    var e = new Laya.Vector3;
                    Laya.Vector3.normalize(t.getChildAt(i).transform.localPosition, e), t.getChildAt(i).transform.localPosition = new Laya.Vector3(15 * e.x + this.scale * e.x, 0, 15 * e.z + this.scale * e.z), t.getChildAt(i).getComponent(Laya.PhysicsCollider).collisionGroup = this.pengZhuangZu, t.getChildAt(i).getComponent(Laya.PhysicsCollider).canCollideWith = this.canPengZhuang
                }
            }
            this.fanWei.transform.setWorldLossyScale(new Laya.Vector3(2 + this.scale / 1, 2 + this.scale / 1, 2 + this.scale / 1)), this.Luo.transform.localPosition = new Laya.Vector3(0, -7 - this.scale, 0), C.cameraControl.addCZ(this.lvConfig.SheXiangJi)
        }
        refreshCamera() {
            var i = C.cameraFocus.transform.position.clone(),
                t = new Laya.Vector3;
            Laya.Vector3.subtract(this.banTouPos.transform.position, i, t);
            var e = Laya.Vector3.scalarLength(t),
                a = new Laya.Ray(i, t),
                n = [];
            C.curScene.physicsSimulation.rayCastAll(a, n, e);
            var s = [];
            for (let i = 0; i < n.length; i++) n[i] && n[i].collider && -1 != n[i].collider.owner.name.indexOf("Build") && s.push(n[i].collider.owner);
            this.setCameraAlphaHinder(s)
        }
        setCameraAlphaHinder(i) {
            if (this.cameraAlphaObjectArray.length > 0) {
                for (let i = 0; i < this.cameraAlphaObjectArray.length; i++) this.cameraAlphaObjectArray[i].meshRenderer.material.renderMode = 0, this.cameraAlphaObjectArray[i].meshRenderer.material.albedoColorA = 1;
                this.cameraAlphaObjectArray.length = 0
            }
            if (i.length > 0)
                for (let e = 0; e < i.length; e++)
                    if (i[e]) {
                        var t = i[e];
                        t.meshRenderer ? (t.meshRenderer.material.renderMode = 2, t.meshRenderer.material.albedoColorA = .2, this.cameraAlphaObjectArray.push(t), t.numChildren > 0 && this.diGui(t)) : t.numChildren > 0 && this.diGui(t)
                    }
        }
        diGui(i) {
            for (let e = 0; e < i.numChildren; e++) {
                var t = i.getChildAt(e);
                t.meshRenderer ? (t.meshRenderer.material.renderMode = 2, t.meshRenderer.material.albedoColorA = .2, this.cameraAlphaObjectArray.push(t), t.numChildren > 0 && this.diGui(t)) : t.numChildren > 0 && this.diGui(t)
            }
        }
        onUpdate() {
            if (!(Laya.timer.delta > 300) && 0 != Laya.timer.scale) switch (this.refreshCamera(), this.playerState) {
                case "waite":
                    break;
                case "move":
                    if (null != c.joy && -1 != c.joy.angle) {
                        this.Jiantou.transform.rotate(new Laya.Vector3(0, c.joy.angle - this.lastAngle, 0), !1, !1), this.lastAngle = c.joy.angle;
                        var i = -Math.sin(c.joy.radians) * this.speed,
                            t = -Math.cos(c.joy.radians) * this.speed,
                            e = new Laya.Vector3;
                        this.Jiantou.transform.getForward(e), e = new Laya.Vector3(-e.x, 0, -e.z);
                        var a = new Laya.Ray(new Laya.Vector3(this.rayPos1.transform.position.x, this.rayPos1.transform.position.y + 1, this.rayPos1.transform.position.z), e),
                            n = new Laya.HitResult;
                        C.curScene.physicsSimulation.rayCast(a, n, this.scale + 1), n && n.collider && (-1 == n.collider.owner.name.indexOf("QianQiang") && -1 == n.collider.owner.name.indexOf("HouQiang") || (t = 0), -1 == n.collider.owner.name.indexOf("ZuoQiang") && -1 == n.collider.owner.name.indexOf("YouQiang") || (i = 0));
                        var s = new Laya.Ray(new Laya.Vector3(this.rayPos2.transform.position.x, this.rayPos2.transform.position.y + 1, this.rayPos2.transform.position.z), e),
                            o = new Laya.HitResult;
                        C.curScene.physicsSimulation.rayCast(s, o, this.scale + 1), o && o.collider && (-1 == o.collider.owner.name.indexOf("QianQiang") && -1 == o.collider.owner.name.indexOf("HouQiang") || (t = 0), -1 == o.collider.owner.name.indexOf("ZuoQiang") && -1 == o.collider.owner.name.indexOf("YouQiang") || (i = 0));
                        var r = new Laya.Ray(new Laya.Vector3(this.rayPos3.transform.position.x, this.rayPos3.transform.position.y + 1, this.rayPos3.transform.position.z), e),
                            h = new Laya.HitResult;
                        C.curScene.physicsSimulation.rayCast(r, h, this.scale + 1), h && h.collider && (-1 == h.collider.owner.name.indexOf("QianQiang") && -1 == h.collider.owner.name.indexOf("HouQiang") || (t = 0), -1 == h.collider.owner.name.indexOf("ZuoQiang") && -1 == h.collider.owner.name.indexOf("YouQiang") || (i = 0));
                        var l = new Laya.Vector3(.02 * i * Laya.timer.delta * .08, 0, .02 * t * Laya.timer.delta * .08);
                        this.owner.transform.translate(l, !1)
                    }
                    var d = new Laya.Vector3(0, 0, 0);
                    if (Laya.Vector3.lerp(this.Dong.transform.getWorldLossyScale(), new Laya.Vector3(this.scale, 1, this.scale), .05, d), this.Dong.transform.setWorldLossyScale(d), this.npcJs.length > 0)
                        for (let i = this.npcJs.length - 1; i >= 0; i--) {
                            if (this.score > this.npcJs[i].score) Laya.Vector3.distance(this.owner.transform.position, this.npcJs[i].owner.transform.position) + this.npcJs[i].scale <= 2 * this.scale && (this.score += Math.floor(this.npcJs[i].score / 2), c.ShowTunUI(Math.floor(this.npcJs[i].score / 2)), this.npcJs[i].guiLing(), C.chiNpcNum += 1)
                        }
            }
        }
        onLateUpdate() {}
        taiShou() {}
        mouseDown(i) {
            if (this.curTouchIdMove = i.touchId, this.curTouchId = i.touchId, 0 == this.isMouseDown) {
                if ("waite" == this.playerState && (this.playerState = "showCameraInitWaite", null != c.gameUI && c.gameUI.unlockpiFuIndexList.length > 0)) {
                    c.pushUI = 1;
                    var t = C.RandomInt(0, c.gameUI.unlockpiFuIndexList.length);
                    return void VkApp.addLoadingCircle(), c.ShowUIPanel("Push", !1, c.gameUI.unlockpiFuIndexList[t])
                }
                if ("showCameraInitWaite" == this.playerState && 0 == c.pushUI && (this.playerState = "showCameraInit"), "showCameraInit" == this.playerState && (this.playerState = "waitemove"), "waitemove" == this.playerState) return this.playerState = "move", null != c.gameUI && c.gameUI.beginHide(), C.cameraControl.begin(), void C.curLevelManager.begin();
                "move" == this.playerState && (Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.Move), this.lastMouseX = Laya.stage.mouseX, this.lastMouseY = Laya.stage.mouseY, this.curPosX = 0, this.curPosY = 0, this.isMouseDown = !0, this.firstTouchMove = i.touchId)
            }
        }
        Move(i) {
            if ("move" == this.playerState) {
                if (i.touchId != this.curTouchId) return void(this.curTouchIdMove = i.touchId);
                this.curTouchIdMove = i.touchId, this.lastMouseX = Laya.stage.mouseX, this.lastMouseY = Laya.stage.mouseY
            }
        }
        mouseUp(i) {
            i.touchId == this.curTouchId ? -1 != this.firstTouchMove ? (this.curTouchIdMove = this.firstTouchMove, this.curTouchId = this.firstTouchMove, i.touchId == this.firstTouchMove && (Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.Move), this.taiShou(), this.isMouseDown = !1, this.curTouchIdMove = 0, this.curPosY = 0, this.curPosX = 0)) : (Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.Move), this.taiShou(), this.isMouseDown = !1, this.curTouchIdMove = 0, this.curPosY = 0, this.curPosX = 0) : this.firstTouchMove = -1
        }
        mouseOut(i) {
            i.touchId == this.curTouchId ? -1 != this.firstTouchMove ? (this.curTouchIdMove = this.firstTouchMove, this.curTouchId = this.firstTouchMove, i.touchId == this.firstTouchMove && (Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.Move), this.taiShou(), this.isMouseDown = !1, this.curTouchIdMove = 0, this.curPosY = 0, this.curPosX = 0)) : (Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.Move), this.taiShou(), this.isMouseDown = !1, this.curTouchIdMove = 0, this.curPosY = 0, this.curPosX = 0) : this.firstTouchMove = -1
        }
        fuHuo() {
            if ("lose" == this.playerState) {
                var i = C.curScene.getChildByName("PlayerPos"),
                    t = C.RandomInt(0, i.numChildren);
                this.owner.transform.position = new Laya.Vector3(i.getChildAt(t).transform.position.x, 185.7, i.getChildAt(t).transform.position.z), this.owner.transform.rotation = i.getChildAt(t).transform.rotation, this.Dong.active = !0, this.Pz.active = !0, this.fanWei.active = !0, C.curLevelManager.begin(), this.toMove()
            }
        }
        lose() {
            "lose" != this.playerState && (this.playerState = "lose", this.Dong.active = !1, this.Pz.active = !1, this.fanWei.active = !1, C.curLevelManager.end(), Laya.timer.once(2e3, this, function () {
                c.ShowUIPanel("Fail", !1)
            }))
        }
        win() {
            "win" != this.playerState && (this.playerState = "win", Laya.timer.once(2e3, this, function () {
                c.ShowUIPanel("Box")
            }))
        }
        onTriggerStay(i) {
            1 != i.owner.destroyed && i.owner.name.indexOf("jieSuoTrigger")
        }
        onTriggerEnter(i) {
            i.owner.destroyed
        }
        onTriggerExit(i) {
            i.owner.destroyed
        }
        playerTriggerEnter(i, t) {
            if (-1 != i.owner.name.indexOf("Dong")) {
                var e = i.owner.parent.getComponent(y);
                null != e && this.npcJs.push(e)
            }
        }
        playerTriggerStay(i, t) {}
        playerTriggerExit(i, t) {
            if (-1 != i.owner.name.indexOf("Dong")) {
                var e = i.owner.parent.getComponent(y);
                if (null != e) {
                    var a = this.npcJs.indexOf(e); - 1 != a && this.npcJs.splice(a, 1)
                }
            }
        }
        Clamp(i, t, e) {
            return i < t && (i = t), i > e && (i = e), i
        }
        onDisable() {
            null != c.gameUI && c.gameUI.bg.off(Laya.Event.MOUSE_DOWN, this, this.mouseDown), Laya.stage.off(Laya.Event.MOUSE_UP, this, this.mouseUp), Laya.stage.off(Laya.Event.MOUSE_OUT, this, this.mouseOut), Laya.stage.off("playerTriggerEnter", this, this.playerTriggerEnter), Laya.stage.off("playerTriggerExit", this, this.playerTriggerExit), Laya.stage.off("playerTriggerStay", this, this.playerTriggerStay), Laya.timer.clearAll(this)
        }
    }
    class L extends Laya.Script3D {
        constructor() {
            super(), this.rigi, this.isLuo = !1, this.score = 1, this.HeiDongJs = null, this.isFaShe = !1, this.initY = 0
        }
        onAwake() {
            this.score = 1 * this.owner.name.substring(this.owner.name.indexOf("_") + 1), this.rigi = this.owner.getComponent(Laya.Rigidbody3D), this.rigi.gravity = new Laya.Vector3(0, -20, 0), this.rigi.overrideGravity = !0, this.rigi.isKinematic = !0, this.initY = this.owner.transform.position.y, this.rigi.isTrigger = !0
        }
        onUpdate() {
            if (!(Laya.timer.delta > 300) && 0 != Laya.timer.scale) {
                if (1 == this.isFaShe) {
                    var i = new Laya.Vector3(this.owner.transform.position.x, this.owner.transform.position.y, this.owner.transform.position.z),
                        t = new Laya.Ray(i, new Laya.Vector3(0, -1, 0)),
                        e = [];
                    if (C.curScene.physicsSimulation.rayCastAll(t, e), e.length > 0)
                        for (let i = 0; i < e.length; i++) e[i] && e[i].collider && e[i].collider.owner != this.owner && -1 != e[i].collider.owner.name.indexOf("Luo") && (1 == this.rigi.isKinematic && (this.rigi.isKinematic = !1, this.rigi.isTrigger = !1), "Heidong" == e[i].collider.owner.parent.parent.name ? this.HeiDongJs != C.curPlayerControl && (this.HeiDongJs = C.curPlayerControl, this.rigi.collisionGroup = this.HeiDongJs.canPengZhuang) : -1 != e[i].collider.owner.parent.parent.name.indexOf("Npc") && (this.HeiDongJs, C.curPlayerControl, this.HeiDongJs = e[i].collider.owner.parent.parent.getComponent(y), this.rigi.collisionGroup = this.HeiDongJs.canPengZhuang), this.rigi.applyForce(new Laya.Vector3(0, -50, 0)))
                }
                this.owner.transform.position.y < 160 && (null != this.HeiDongJs && this.HeiDongJs.addScore(this.score), this.owner.active = !1)
            }
        }
        onTriggerExit(i) {
            if (1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.rigi.isKinematic && this.owner.transform.position.y > 183) {
                var t = this.owner.transform.rotation.clone();
                this.isFaShe = !1, this.HeiDongJs = null, this.rigi.isKinematic = !0, this.owner.transform.position = new Laya.Vector3(this.owner.transform.position.x, this.initY, this.owner.transform.position.z), this.owner.transform.rotation = t, this.rigi.isTrigger = !0
            }
        }
        onTriggerEnter(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.isFaShe && (this.isFaShe = !0)
        }
        onTriggerStay(i) {
            1 != i.owner.destroyed && -1 != i.owner.name.indexOf("fanWei") && 0 == this.isFaShe && (this.isFaShe = !0)
        }
        onDisable() {}
    }
    class S extends Laya.Script3D {
        constructor() {
            super(), this.npcList = []
        }
        onEnable() {}
        onDisable() {
            Laya.timer.clearAll(this)
        }
        onUpdate() {}
        CreatePlayer() {
            C.beiShu = 0, C.currentPiFuType = -1, C.allTime = 120, C.chiNpcNum = 0, C.scoreList = [], C.showAddTimeUI = !0, this.npcList.length = 0;
            var i = C.models.getChildByName("Heidong"),
                t = Laya.Sprite3D.instantiate(i, C.curScene),
                e = C.curScene.getChildByName("PlayerPos"),
                a = C.RandomInt(0, e.numChildren);
            t.transform.position = new Laya.Vector3(e.getChildAt(a).transform.position.x, 185.7, e.getChildAt(a).transform.position.z), t.transform.rotation = e.getChildAt(a).transform.rotation, C.curPlayerControl = t.addComponent(f), null != C.curPlayerControl && (C.cameraTrans.transform.position = C.curPlayerControl.owner.transform.position);
            var n = [1, 2, 3, 4, 5, 6, 7, 8, 9],
                s = C.curScene.getChildByName("NpcPos");
            for (let i = 0; i < 7; i++) {
                var o = C.RandomInt(0, n.length),
                    r = C.RandomInt(0, s.numChildren),
                    h = C.models.getChildByName("Npc" + n[o]);
                (P = Laya.Sprite3D.instantiate(h, C.curScene)).transform.position = new Laya.Vector3(s.getChildAt(r).transform.position.x, 185.7, s.getChildAt(r).transform.position.z), P.transform.rotation = s.getChildAt(r).transform.rotation;
                var l = P.addComponent(y);
                this.npcList.push(l), n.splice(o, 1)
            }
            var d = C.curScene.getChildByName("ChangJing").getChildByName("wuPin");
            for (let i = 0; i < d.numChildren; i++) d.getChildAt(i).addComponent(L);
            var c = C.curScene.getChildByName("NpcIdlePos");
            for (let i = 0; i < c.numChildren; i++) c.getChildAt(i).addComponent(w);
            var g = C.curScene.getChildByName("CarRunPos").getChildByName("LuXian1");
            for (let i = 0; i < g.numChildren; i++) {
                var u = C.models.getChildByName("Car" + C.RandomInt(1, 7)),
                    S = Laya.Sprite3D.instantiate(u, C.curScene);
                S.transform.position = g.getChildAt(i).transform.position, S.transform.rotation = g.getChildAt(i).transform.rotation, S.addComponent(m).init(g, i)
            }
            var v = C.curScene.getChildByName("NpcRunPos");
            for (let i = 0; i < v.numChildren; i++) {
                var x = v.getChildAt(i);
                for (let i = 0; i < x.numChildren; i++) {
                    var P;
                    h = C.models.getChildByName("Character_BusinessMan_Shirt_01");
                    (P = Laya.Sprite3D.instantiate(h, C.curScene)).transform.position = x.getChildAt(i).transform.position, P.transform.rotation = x.getChildAt(i).transform.rotation, P.addComponent(p).init(x, i)
                }
            }
        }
        initLv() {}
        begin() {
            null != c.gameUI && c.gameUI.hideDaoJiShi(), Laya.timer.loop(1e3, this, this.lessTime), Laya.stage.event("toMove")
        }
        lessTime() {
            if(window.isVideo){
                return
            }
            if (C.allTime -= 1, C.allTime > 5 ? null != c.gameUI && c.gameUI.hideDaoJiShi() : null != c.gameUI && c.gameUI.showDaoJiShi(), 90 == C.allTime) {
                var i = C.RandomInt(0, this.npcList.length);
                this.npcList[i].zhuiWanJia(50)
            }
            if (30 == C.allTime) {
                null != c.gameUI && c.ShowTime30UI();
                i = C.RandomInt(0, this.npcList.length);
                this.npcList[i].zhuiWanJia(20)
            }
            C.allTime <= 0 && (C.allTime = 0, Laya.timer.clear(this, this.lessTime), 1 == C.showAddTimeUI ? (Laya.stage.event("toWaite"),
             C.showAddTimeUI = !1, C.curPlayerControl.moveWaite(), 
            c.ShowUIPanel("AddTime", !1)) : C.curPlayerControl.win())
        }
        end() {
            Laya.timer.clear(this, this.lessTime)
        }
        paiHangPaiXu() {
            for (let t = 0; t < C.scoreList.length; t++)
                for (let e = 0; e < C.scoreList.length - 1 - t; e++)
                    if (C.scoreList[e].score < C.scoreList[e + 1].score) {
                        var i = C.scoreList[e];
                        C.scoreList[e] = C.scoreList[e + 1], C.scoreList[e + 1] = i
                    }
        }
    }
    class v extends Laya.Script3D {
        constructor() {
            super(), this.cameraState = "waiteInit", this.offect = new Laya.Vector3, this.anim, this.speed = .05, this.initPos, this.MainCamera, this.MainCameraZ = 0, this.MainCameraY = 0, this.Camera, this.nextTarget = null, this.CameraZ = 0
        }
        onAwake() {
            this.Camera = this.owner.getChildByName("Camera"), this.MainCamera = this.Camera.getChildByName("Main Camera")
        }
        begin() {
            this.cameraState = "move"
        }
        toMove() {
            this.cameraState = "move"
        }
        addCZ(i) {
            this.CameraZ = i
        }
        onDisable() {
            Laya.timer.clearAll(this)
        }
        onLateUpdate() {
            switch (this.cameraState) {
                case "waiteInit":
                    break;
                case "move":
                    null != C.curPlayerControl && (this.owner.transform.position = new Laya.Vector3(C.curPlayerControl.owner.transform.position.x, this.owner.transform.position.y, C.curPlayerControl.owner.transform.position.z));
                    var i = new Laya.Vector3(0, 0, 0);
                    Laya.Vector3.lerp(this.MainCamera.transform.localPosition, new Laya.Vector3(0, 0, this.CameraZ), .05, i), this.MainCamera.transform.localPosition = i
            }
        }
    }
    class C {
        static PlaySound(i, t = 1) {
            if (0 != g.GetUserData("yinxiao")) {
                var e = window.xz_lang_file_url + "/res/audio/" + i;
                CoinAppAudio.playSound(e + ".mp3")
                // return Laya.SoundManager.playSound(e + ".mp3", t, null)
            }
        }
        static PlaySoundUpdate(i) {
            if (0 != g.GetUserData("yinxiao") && 0 == C.isSound) {
                C.isSound = !0;
                var t = "res/audio/" + i+".mp3";
                // Laya.SoundManager.playSound(t + ".mp3", 1, Laya.Handler.create(this, function () {
                //     C.isSound = !1
                // }))
                CoinAppAudio.playSound(i)
            }
        }
        static StopSound(i) {
            var t = "res/audio/" + i;
            Laya.SoundManager.stopSound(t + ".mp3")
        }
        static PlayMusic(i, t = 0) {
            // if (C.preMusicName != i && 0 != g.GetUserData("beijing")) {
            //     C.preMusicName = i, C.bjMusic && (C.bjMusic.stop(), C.bjMusic = null);
            //     var e, a = "res/audio/" + i;
            //     return e = Laya.SoundManager.playMusic(a + ".mp3", t), C.bjMusic = e, e
            // }
            // if (VkApp.isSoundMute) {
            //     CoinAppAudio.stopAll();
            // } else {
            //     CoinAppAudio.playMusic(CoinAppAudio.bgm);
            // }
        }
        static StopMusic() {
            C.bjMusic && (C.bjMusic.stop(), C.bjMusic = null), C.preMusicName = ""
        }
        static SetMusicVolume(i) {
            C.bjMusic && (C.bjMusic.volume = i)
        }
        static PlayVibrate() {
            window.wx ? wx.vibrateShort() : window.swan ? swan.vibrateShort() : window.navigator && window.navigator.vibrate && window.navigator.vibrate(20)
        }
        static RandomInt(i, t) {
            return Math.floor(Math.random() * (t - i) + i)
        }
        static RandomFloat(i, t) {
            return Math.random() * (t - i) + i
        }
        static toTwoTimeFormat(i) {
            var t = Math.floor(i % 3600 / 60),
                e = Math.floor(i % 3600 % 60);
            return t < 10 && (t = "0" + t), e < 10 && (e = "0" + e), t + ":" + e
        }
        static TotimeFormat(i) {
            var t = Math.floor(i / 3600),
                e = Math.floor(i % 3600 / 60),
                a = Math.floor(i % 3600 % 60);
            return t < 10 && (t = "0" + t), e < 10 && (e = "0" + e), a < 10 && (a = "0" + a), t + ":" + e + ":" + a
        }
        static getWeekOfYear() {
            var i = new Date,
                t = new Date(i.getFullYear(), 0, 1),
                e = t.getDay(),
                a = 1;
            0 != e && (a = 7 - e + 1), t = new Date(i.getFullYear(), 0, 1 + a);
            var n = Math.ceil((i.valueOf() - t.valueOf()) / 864e5);
            return Math.ceil(n / 7) + 1
        }
        static FindChild(i, t) {
            for (var e = [], a = 0; a < i.length; a++) {
                var n = i[a];
                if (n.name == t) return n;
                n.numChildren && (e = e.concat(n._children))
            }
            return e.length ? C.FindChild(e, t) : null
        }
        static FindChildByNameHelper(i, t) {
            if (i.name == t) return i;
            var e = i.numChildren,
                a = null;
            for (let n = 0; n < e && !(a = C.FindChildByNameHelper(i.getChildAt(n), t)); ++n);
            return a
        }
        static GetCirclePoint(i) {
            var t = C.RandomFloat(0, 2 * Math.PI),
                e = 2 * Math.cos(t),
                a = 2 * Math.sin(t),
                n = new Laya.Vector3(e, 0, a);
            return Laya.Vector3.add(new Laya.Vector3(i.x, i.y, i.z), n, n), n
        }
        static AngleBetweenVector(i, t) {
            var e = Laya.Vector3.dot(i, t) / (Laya.Vector3.scalarLength(i) * Laya.Vector3.scalarLength(t));
            return 180 * Math.acos(e) / Math.PI
        }
        static NFormatter(i) {
            const t = [{
                value: 1,
                symbol: ""
            }, {
                value: 1e3,
                symbol: "k"
            }, {
                value: 1e6,
                symbol: "m"
            }, {
                value: 1e9,
                symbol: "g"
            }, {
                value: 1e12,
                symbol: "t"
            }, {
                value: 1e15,
                symbol: "p"
            }, {
                value: 1e18,
                symbol: "e"
            }];
            let e;
            for (e = t.length - 1; e > 0 && !(i >= t[e].value); e--);
            return (i / t[e].value).toFixed(0).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + t[e].symbol
        }
        static ShowMoney3D(i, t) {
            for (var e = C.NFormatter(i).split(""), a = .16 * (e.length - 1) * .5, n = 1; n <= 5; n++)
                if (n <= e.length) {
                    t.getChildAt(n - 1).active = !0, t.getChildAt(n - 1).transform.localPositionX = .16 * -(n - 1) + a, t.getChildAt(n - 1).transform.localPositionZ = -.3;
                    for (var s = 0; s < t.getChildAt(n - 1).numChildren; s++) e[n - 1] == t.getChildAt(n - 1).getChildAt(s).name ? t.getChildAt(n - 1).getChildAt(s).active = !0 : t.getChildAt(n - 1).getChildAt(s).active = !1
                } else t.getChildAt(n - 1).active = !1
        }
        static updateShuZi3D(i, t, e) {
            for (var a = i.toString().split(""), n = -(a.length - 1) * e * .5, s = 0; s < t.numChildren; s++)
                if (s <= a.length) {
                    t.getChildAt(s).active = !0, t.getChildAt(s).transform.localPositionX = s * e + n;
                    for (var o = 0; o < t.getChildAt(s).numChildren; o++) a[s] == t.getChildAt(s).getChildAt(o).name ? t.getChildAt(s).getChildAt(o).active = !0 : t.getChildAt(s).getChildAt(o).active = !1
                } else t.getChildAt(s).active = !1
        }
        static GetDirForce(i, t, e) {
            var a = i,
                n = t,
                s = new Laya.Vector3((n.x - a.x) / 3, (n.y - a.y) / 3 + 2.1, (n.z - a.z) / 3),
                o = new Laya.Vector3;
            return Laya.Vector3.scale(s, e, o), o
        }
        static loadScene(i, t) {
            null != C.curScene && (C.curScene.destroy(), C.curScene = null), Laya.loader.create(i, Laya.Handler.create(this, function () {
                if (C.curScene = Laya.loader.getRes(i), C.curScene) {
                    if (Laya.stage.addChild(C.curScene), C.curScene.zOrder = -1, C.mainCamera = C.curScene.getChildByName("Camera").getChildByName("Camera").getChildByName("Main Camera"), C.curLevelManager = C.curScene.addComponent(S), C.cameraTrans = C.curScene.getChildByName("Camera"), C.cameraFocus = C.curScene.getChildByName("Camera").getChildByName("Camera").getChildByName("CameraRayPos"), C.cameraControl = C.curScene.getChildByName("Camera").addComponent(v), SdkUtil.GetConfig && 0 == SdkUtil.GetConfig("openlight")) {
                        var e = C.curScene.getChildByName("Directional Light");
                        e.shadowMode = Laya.ShadowMode.Hard, e.shadowStrength = .5, e.shadowDistance = 60, e.shadowResolution = 2048
                    }
                    t && t()
                } else C.loadScene(i, t)
            }))
        }
    }
    C.curScene = null, C.curLevelManager = null, C.curPlayerControl = null, C.models = null, C.mainCamera = null, C.cameraFocus = null, C.cameraTrans = null, C.cameraControl = null, C.Config = {}, C.guanKaLv = 1, C.piFuType = 1, C.currentPiFuType = -1, C.beiShu = 0, C.curBoss = null, C.isSound = !1, C.allTime = 20, C.chiNpcNum = 0, C.scoreList = [], C.showAddTimeUI = !0;
    class x extends Laya.Scene {
        constructor() {
            super()
        }
        onEnable() {
            console.log("添加时间")
            VkApp.showMoreGameBtn(); //新增全屏按钮
            VkApp.showShareBtn(); //分享按钮

            if (!window.end) {
                VkApp.showBanner(); //显示底部banner矩阵
            }
            VkApp.showClubBtn(null, null, 10, 190); //显示社区按钮 
            //VkApp.showRankBtn(null, 10, null, 130); //显示排行榜按钮
            VkApp.showSingleArr(10, 80); //显示四个互推矩阵

            this.lingQu.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("加时间页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    if(1 == i ){
                        Laya.timer.loop(100,this,this.addTime)
                    }
                }.bind(this)))
            }), this.fangQi.on(Laya.Event.CLICK, this, function () {
                this.destroy(), C.curPlayerControl.win(), C.PlaySound("Btn")
            })
        }
        addTime(){
            if(!window.isVideo){
                (this.destroy(), C.allTime += 30, C.curLevelManager.begin(), C.curPlayerControl.toMove(), SdkUtil.TDEvent("加时间页面视频完成"))
             Laya.timer.clear(this,this.addTime)
            }
         }
        onDisable() {
            VkApp.hideMoreGameBtn();
            VkApp.hideShareBtn(); 
            VkApp.hideClubBtn();
            VkApp.hideBanner(); 
            VkApp.hideRankBtn();
            VkApp.hideSingleArr();
            Laya.timer.clearAll(this)
        }
    }
    class P extends Laya.Scene {
        constructor() {
            super(), this.xiangZiNum = 0, this.jinBiList = new Array, this.xiangZiRandom = 3, this.xiangZiAllNum = 0
        }
        onEnable() {
            console.log("宝箱")
           
            VkApp.showBanner(); //显示底部banner矩阵
                        100 == SdkUtil.GetConfig("box") && (this.xiangZiRandom = C.RandomInt(1, 4)), window.SdkUtil.ShowBanner && window.SdkUtil.ShowBanner(), null != this.ADPanel && SdkUtil.ShowNeiZhiAD && SdkUtil.ShowNeiZhiAD(this.ADPanel, 3), Laya.SoundManager.stopAllSound();
            for (let t = 1; t <= 9; t++) {
                var i = 30 * t;
                this.jinBiList.push(i)
            }
            for (let i = 1; i <= 9; i++) {
                var t = C.RandomInt(0, this.jinBiList.length);
                this["num" + i].text = this.jinBiList[t], this.jinBiList.splice(t, 1), this["qian" + i].visible = !1
            }
            this.fangQi.visible = !1, this.zaiLai.visible = !1, this.updateUI(), this.xiangZi1.on(Laya.Event.CLICK, this, function () {
                this.xiangZiNum += 1, this.xiangZiNum > this.xiangZiRandom ? window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZi1.visible = !1, this.qian1.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num1.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this))) : (this.xiangZiAllNum += 1, this.xiangZi1.visible = !1, this.qian1.visible = !0, g.AddProp(1, 1 * this.num1.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300)), this.updateUI()
            }), this.xiangZi2.on(Laya.Event.CLICK, this, function () {
                this.xiangZiNum += 1, C.PlaySound("Btn"), this.xiangZiNum > this.xiangZiRandom ? window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZi2.visible = !1, this.qian2.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num2.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this))) : (this.xiangZi2.visible = !1, this.qian2.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num2.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300)), this.updateUI()
            }), this.xiangZi3.on(Laya.Event.CLICK, this, function () {
                this.xiangZiNum += 1, C.PlaySound("Btn"), this.xiangZiNum > this.xiangZiRandom ? window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZi3.visible = !1, this.qian3.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num3.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this))) : (this.xiangZi3.visible = !1, this.qian3.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num3.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300)), this.updateUI()
            }), this.xiangZi4.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), this.xiangZiNum += 1, this.xiangZiNum > this.xiangZiRandom ? window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZi4.visible = !1, this.qian4.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num4.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this))) : (this.xiangZi4.visible = !1, this.qian4.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num4.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300)), this.updateUI()
            }), this.xiangZi5.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), this.xiangZiNum += 1, this.xiangZiNum > this.xiangZiRandom ? window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZi5.visible = !1, this.qian5.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num5.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this))) : (this.xiangZi5.visible = !1, this.qian5.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num5.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300)), this.updateUI()
            }), this.xiangZi6.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), this.xiangZiNum += 1, this.xiangZiNum > this.xiangZiRandom ? window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZi6.visible = !1, this.qian6.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num6.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this))) : (this.xiangZi6.visible = !1, this.qian6.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num6.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300)), this.updateUI()
            }), this.xiangZi7.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), this.xiangZiNum += 1, this.xiangZiNum > this.xiangZiRandom ? window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZi7.visible = !1, this.qian7.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num7.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this))) : (this.xiangZi7.visible = !1, this.qian7.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num7.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300)), this.updateUI()
            }), this.xiangZi8.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), this.xiangZiNum += 1, this.xiangZiNum > this.xiangZiRandom ? window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZi8.visible = !1, this.qian8.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num8.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this))) : (this.xiangZi8.visible = !1, this.qian8.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num8.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300)), this.updateUI()
            }), this.xiangZi9.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), this.xiangZiNum += 1, this.xiangZiNum > this.xiangZiRandom ? window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZi9.visible = !1, this.qian9.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num9.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this))) : (this.xiangZi9.visible = !1, this.qian9.visible = !0, this.xiangZiAllNum += 1, g.AddProp(1, 1 * this.num9.text), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300)), this.updateUI()
            }), this.zaiLai.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("宝箱页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (this.xiangZiNum = 0, this.xiangZiRandom = 3, this.fangQi.visible = !1, this.zaiLai.visible = !1, this.updateUI(), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"), 300), SdkUtil.TDEvent("宝箱页面视频完成"))
                }.bind(this)))
            }), this.fangQi.on(Laya.Event.CLICK, this, function () {
                this.destroy(), c.ShowUIPanel("Win")
            })
            this.fangQi.centerX=0
        }
        updateUI() {
            if (this.xiangZiNum >= this.xiangZiRandom) {
                for (let i = 1; i <= this.allBtn.numChildren; i++) this["ad" + i].alpha = 1;
                this.fangQi.visible = !0, this.zaiLai.visible = !1
            } else
                for (let i = 1; i <= this.allBtn.numChildren; i++) this["ad" + i].alpha = 0;
            this.xiangZiAllNum >= 9 && (this.fangQi.visible = !0, this.zaiLai.visible = !1)
        }
        onDisable() {
            VkApp.showRecommendGames("full_screen");// 结算关闭 显示全屏界面
            Laya.timer.clearAll(this), window.SdkUtil.CloseBanner && window.SdkUtil.CloseBanner()
        }
    }
    class U extends Laya.Scene {
        constructor() {
            super()
        }
        onEnable() {
            VkApp.removeLoadingCircle();//删除loading
            this.fangQi.on(Laya.Event.CLICK, this, function (i) {
                C.PlaySound("Btn"), this.destroy()
            }), this.lingQu.on(Laya.Event.CLICK, this, function (i) {
                C.PlaySound("Btn"), SdkUtil.TDEvent("视频点击推送加钱"), window.SdkUtil.ShowVideo(function (i) {
                    if (1 == i) {
                        var t = 1 * this.addQian.text;
                        g.AddProp(1, t), this.destroy(), SdkUtil.TDEvent("视频完成推送加钱")
                    }
                }.bind(this))
            })
        }
        onDisable() {
            VkApp.hideMoreGameBtn();
            VkApp.hideShareBtn(); 
            VkApp.hideClubBtn();
            VkApp.hideBanner(); 
            VkApp.hideRankBtn();
            VkApp.hideSingleArr();
            VkApp.showRandomInterAd();// 主界面 按钮关闭 随机插屏广告
            VkApp.showBanner(); //显示底部banner矩阵
        }
    }
    class D extends Laya.Scene {
        constructor() {
            super()
        }
        onEnable() {
            console.log("失败")
            VkApp.showMoreGameBtn(); //新增全屏按钮
            VkApp.showShareBtn(); //分享按钮

            if (!window.end) {
                VkApp.showBanner(); //显示底部banner矩阵
            }
            VkApp.showClubBtn(null, null, 10, 190); //显示社区按钮 
            //VkApp.showRankBtn(null, 10, null, 130); //显示排行榜按钮
            VkApp.showSingleArr(10, 80); //显示四个互推矩阵
            //结算
            Laya.timer.once(3000,this,()=>{
                VkApp.showInterstitial();//显示插屏
                })
            VkApp.showNineBoxView(10, "золота", (num) => {//宝箱
                if(num>0){
                    g.AddProp(1, num)
                }
            },()=>{
                VkApp.showRecommendGames("full_screen");// 结算关闭 显示全屏界面
            });
            this.tiaoGuan.visiable = !1, this.fangQi.visiable = !1, this.skeleton = new Laya.Skeleton, 
            this.addChild(this.skeleton), this.skeleton.pos(this.width / 2, this.height / 2),
             this.skeleton.load("res/longgu/win_fail.sk", Laya.Handler.create(this, function () {
                this.skeleton.play("fail_01", !1), this.skeleton.on(Laya.Event.STOPPED, this, function () {
                    this.skeleton.play("fail_02", !0)
                })
            })), Laya.timer.once(1e3, this, function () {
                this.tiaoGuan.visiable = !1, this.fangQi.visiable = !0
            }), window.SdkUtil.TDGuanQia && window.SdkUtil.TDGuanQia(3, g.GetUserData("showLv")), window.SdkUtil.ShowBanner && window.SdkUtil.ShowBanner(), 
            window.SdkUtil.ShowAddIcon && window.SdkUtil.ShowAddIcon(), window.SdkUtil.ShowChaPing && window.SdkUtil.ShowChaPing(), 
            SdkUtil.TDEvent(g.GetUserData("showLv") + "游戏失败页面"), C.PlayMusic("Fail", 1), this.tiaoGuan.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("失败页面复活视频点击"), window.SdkUtil.ShowVideo(function (i) {
                   if( 1 == i ){
                       Laya.timer.loop(100,this,this.startFuhuo)
                   }
                }.bind(this)))
            }), this.fangQi.on(Laya.Event.CLICK, this, function () {
                this.destroy(), C.PlaySound("Btn"), c.ShowUIPanel("Second")
            })
            // this.fangQi.centerX=0
        }
        startFuhuo(){
           if(!window.isVideo){
            (C.curPlayerControl.fuHuo(), this.destroy(), SdkUtil.TDEvent("失败页面复活视频完成"))
            Laya.timer.clear(this,this.startFuhuo)
           }
        }
        onDisable() {
            Laya.timer.clearAll(this), window.SdkUtil.CloseBanner && window.SdkUtil.CloseBanner()
        }
    }
    class T extends Laya.Scene {
        constructor() {
            super()
        }
        onEnable() {
            window.SdkUtil.ADInit(!1),
             this.loadValue = 0, this.curValue = 0, this.onUpdate(), Laya.timer.frameLoop(1, this, this.onUpdate), window.SdkUtil.LoadSubpackage ? (this.loadValue = 1, window.SdkUtil.LoadSubpackage(function () {
                this.LoadConfig()
            }.bind(this))) : this.LoadConfig();
            var i = ["font01", "font02", "font03", "font04", "font05", "font06"];
            for (let t = 0; t < i.length; t++) {
                let e = new Laya.BitmapFont;
                e.loadFont("First/Font/" + i[t] + ".fnt", new Laya.Handler(this, function () {
                    Laya.Text.registerBitmapFont(i[t], e)
                }))
            }
        }
        onDisable() {}
        onUpdate() {
            this.curValue += .01, this.curValue > this.loadValue && (this.curValue = this.loadValue),
             this.curValue >= 1 && (this.curValue = 0), this.jiaZaiTiao.width = 450 * this.curValue
        }
        LoadConfig() {
            var i = ["First/JsonDatas/ShengJi.json"];
            i.length > 0 ? Laya.loader.load(i, Laya.Handler.create(this, function () {
                C.Config.ShengJi = Laya.loader.getRes(i[0]), g.GetData(), this.LoadModels()
            })) : (g.GetData(), this.LoadModels())
        }
        LoadModels() {
            this.loadValue = 1, Laya.Sprite3D.load("res/Scene/Conventional/models.lh", Laya.Handler.create(this, function (i) {
                if (C.models = i, C.models) {
                    C.guanKaLv = g.GetGuangKalv();
                    var t = "res/Scene/Conventional/Level" + C.guanKaLv + ".ls";
                    C.loadScene(t, function () {
                        this.StartGame()
                    }.bind(this))
                } else this.LoadModels()
            }))
        }
        StartGame() {
            Laya.timer.clearAll(this), c.ShowUIPanel("GameRun", !0, !1), window.SdkUtil.ReportMonitor && window.SdkUtil.ReportMonitor(1)
        }
    }
    class b extends Laya.Scene {
        constructor() {
            super(), this.unlockpiFuIndexList = new Array
        }
        onOpened(i) {
            console.log("主界面")
            VkApp.removeLoadingCircle(); //删除loading
            window.freshMusic = function () {
                if (VkApp.isSoundMute) {
                    CoinAppAudio.stopAll();
                } else {
                    CoinAppAudio.playMusic(CoinAppAudio.bgm);
                }
            }
            VkApp.initSoundBtn(() => {
                window.freshMusic()
            }, 150, 10, null);
            VkApp.openSoundBtn()
            if (!window.first) {
                VkApp.initShareBtn(() => {
                    window.shareGame();
                }, null, null, 10, 130); //新增分享按钮 
                VkApp.initMoreGameBtn(null, 10, null, 190); //新增全屏按钮
                window.first = true
                Laya.timer.once(1500,this,()=>{
                    VkApp.yandexReady();
                   })
            }
             VkApp.showMoreGameBtn(); //新增全屏按钮
            VkApp.showShareBtn(); //分享按钮

            if (!window.end) {
                VkApp.showBanner(); //显示底部banner矩阵
            }
            VkApp.showClubBtn(null, null, 10, 190); //显示社区按钮 
            //VkApp.showRankBtn(null, 10, null, 130); //显示排行榜按钮
            VkApp.showSingleArr(10, 80); //显示四个互推矩阵
            if (c.gameUI = this, 1 == i) {
                var t = new Date,
                    e = t.getMonth() + 1,
                    a = t.getFullYear() + "年" + e + "月" + t.getDate() + "日";
                g.GetUserData("curDay") != a && g.GetUserData("signNum") < 7 && c.ShowUIPanel("Sign", !1)
            }
            this.Init(), this.shop.on(Laya.Event.CLICK, this, function () {
                VkApp.addLoadingCircle();  //添加loading
                C.PlaySound("Btn"), c.ShowUIPanel("Shop", !1)
            }), this.addQianBtn.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), SdkUtil.TDEvent("视频点击主页加钱"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (g.AddProp(1, 2e3), SdkUtil.TDEvent("视频完成主页加钱"))
                }.bind(this))
            }), C.PlayMusic("BGM")
            this.qian.parent.centerY=-120
        }
        onDisable() {
            Laya.timer.clearAll(this), c.gameUI = null, window.SdkUtil.CloseBanner && window.SdkUtil.CloseBanner()
        }
        Init() {
            this.StartGame(), this.youXiZhong.visible = !1, this.daoJiShi.visible = !1,
             this.qian.text = g.GetUserData("Gold"),
              this.timeAll.text = C.toTwoTimeFormat(C.allTime), this.daoJiShi.text = C.toTwoTimeFormat(C.allTime),
               this.chiNpc.text = C.chiNpcNum, Laya.timer.loop(10, this, function () {
                this.qian.text = g.GetUserData("Gold"), this.timeAll.text = C.toTwoTimeFormat(C.allTime), 
                this.daoJiShi.text = C.toTwoTimeFormat(C.allTime), this.chiNpc.text = C.chiNpcNum
            }), Laya.timer.loop(100, this, this.paiHang)
        }
        paiHang() {
            null != C.curLevelManager && (C.curLevelManager.paiHangPaiXu(), C.scoreList.length >= 3 && (this.paiMing1.skin = "UIRes/game/name" + C.scoreList[0].name + ".png", this.paiMing2.skin = "UIRes/game/name" + C.scoreList[1].name + ".png", this.paiMing3.skin = "UIRes/game/name" + C.scoreList[2].name + ".png", this.paiNum1.text = Math.floor(C.scoreList[0].score), this.paiNum2.text = Math.floor(C.scoreList[1].score), this.paiNum3.text = Math.floor(C.scoreList[2].score)))
        }
        showDaoJiShi() {
            0 == this.daoJiShi.visible && (this.daoJiShi.visible = !0)
        }
        hideDaoJiShi() {
            1 == this.daoJiShi.visible && (this.daoJiShi.visible = !1)
        }
        showZhiYin1() {
            this.zhiYin1.visible = !0
        }
        hideZhiYin1() {
            this.zhiYin1.visible = !1
        }
        showAnNiu() {
            this.anNiu.visible = !0
        }
        hideAnNiu() {
            this.anNiu.visible = !1
        }
        beginHide() {
            console.log("开始游戏")
            VkApp.hideMoreGameBtn();
            VkApp.hideShareBtn(); 
            VkApp.hideClubBtn();
            VkApp.hideBanner(); 
            VkApp.hideRankBtn();
            VkApp.hideSingleArr();
            window.SdkUtil.luzhiKaishi && window.SdkUtil.luzhiKaishi(), this.anNiu.visible = !1, this.youXiZhong.visible = !0, this.end.visible = !1, this.zhiYin1.visible = !1, this.qianBg.visible = !1
        }
        hideAll() {
            this.youXiZhong.visible = !1, this.anNiu.visible = !1, this.end.visible = !1
        }
        StartGame() {
            
            var i = g.GetUserData("piFuType");
            this.unlockpiFuIndexList.length = 0;
            for (let t = 1; t <= 6; t++) 0 == i[t] && this.unlockpiFuIndexList.push(t);
            C.curLevelManager.CreatePlayer(), window.SdkUtil.TDGuanQia(1, g.GetUserData("showLv"))
        }
    }
    class I extends Laya.Script {
        constructor() {
            super(), this.curTouchId = 0, this.joyBg = null, this.joyBtn = null, this.isDown = !1, this.angle = -1, this.radians = -1, this.isleftControl = !0, this.originPiont = null, this.bg, this.deltaX = 0, this.deltaY = 0
        }
        onAwake() {
            this.joyBg = this.owner.getChildByName("joy"), this.joyBg.visible = !1, c.joy = this, this.begin(), this.zeigeKnueppel()
        }
        // Lokal ergänzt: sichtbarer Touch-Steuerknüppel
        zeigeKnueppel() {
            var x = this.joyBg.width / 2, y = this.joyBg.height / 2;
            this.joyBg.graphics.clear(), this.joyBg.graphics.drawCircle(x, y, 120, "rgba(0,0,0,0.25)", "rgba(255,255,255,0.8)", 6);
            this.joyBtn.graphics.clear(), this.joyBtn.graphics.drawCircle(this.joyBtn.width / 2, this.joyBtn.height / 2, 52, "rgba(255,255,255,0.85)");
            this.ruheKnueppel()
        }
        ruheKnueppel() {
            this.joyBg.pos(this.owner.width / 2, this.owner.height - 220), this.joyBtn.pos(this.joyBg.width / 2, this.joyBg.height / 2), this.joyBg.visible = !0
        }
        begin() {
            this.bg = this.owner.getChildByName("bg"), this.joyBtn = this.joyBg.getChildByName("small"), this.originPiont = new Laya.Point(this.joyBg.width / 2, this.joyBg.height / 2), this.bg.on(Laya.Event.MOUSE_DOWN, this, this.Down), Laya.stage.on(Laya.Event.MOUSE_UP, this, this.Up)
        }
        Down(i) {
            this.isDown || (this.curTouchId = i.touchId, this.isDown = !0, this.joyBg.pos(Laya.stage.mouseX, Laya.stage.mouseY), this.joyBtn.pos(this.joyBg.width / 2, this.joyBg.height / 2), this.joyBg.visible = !0, this.deltaX = 0, this.deltaY = 0, Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.Move))
        }
        Up(i) {
            i.touchId == this.curTouchId && (this.isDown = !1, this.ruheKnueppel(), Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.Move), this.radians = this.angle = -1, this.lastJoyX = 0, this.deltaX = 0, this.deltaY = 0)
        }
        Move(i) {
            if (i.touchId == this.curTouchId) {
                var t = this.joyBg.globalToLocal(new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY), !1);
                this.joyBtn.pos(t.x, t.y), this.deltaX = t.x - this.originPiont.x, this.deltaY = t.y - this.originPiont.y;
                var e = this.deltaX * this.deltaX,
                    a = this.deltaY * this.deltaY;
                if ((Math.abs(this.deltaX) > 10 || Math.abs(this.deltaY) > 10) && (this.angle = 180 * Math.atan2(this.deltaX, this.deltaY) / Math.PI, this.angle < 0 && (this.angle += 360), this.angle = Math.round(this.angle), this.radians = Math.PI / 180 * this.angle), e + a >= 6400) {
                    var n = Math.floor(80 * Math.sin(this.radians) + this.originPiont.x),
                        s = Math.floor(80 * Math.cos(this.radians) + this.originPiont.y);
                    this.joyBtn.pos(n, s)
                } else this.joyBtn.pos(t.x, t.y)
            }
        }
        hide() {
            this.isDown = !1, this.joyBg.visible = !1, this.joyBtn.pos(this.joyBg.width / 2, this.joyBg.height / 2), Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.Move), this.radians = this.angle = -1
        }
        onDestroy() {
            Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.Up)
        }
    }
    class N extends Laya.Scene {
        constructor() {
            super(), this.show
        }
        onOpened(i) {
            console.log("试用")
            VkApp.hideSoundBtn()
            VkApp.removeLoadingCircle();//删除loading
            VkApp.showMoreGameBtn(); //新增全屏按钮
            VkApp.showShareBtn(); //分享按钮

            if (!window.end) {
                VkApp.showBanner(); //显示底部banner矩阵
            }
            VkApp.showClubBtn(null, null, 10, 190); //显示社区按钮 
            //VkApp.showRankBtn(null, 10, null, 130); //显示排行榜按钮
            VkApp.showSingleArr(10, 80); //显示四个互推矩阵
            this.closeBtn.visiable = !1, this.getBtn.visiable = !1, this.skeleton = new Laya.Skeleton, this.addChild(this.skeleton), this.skeleton.pos(this.width / 2, this.height / 2), this.skeleton.load("res/longgu/tuisong.sk", Laya.Handler.create(this, function () {
                this.skeleton.play(0, !0)
            })), Laya.timer.once(1e3, this, function () {
                this.closeBtn.visiable = !0, this.getBtn.visiable = !0
            }), this.show = Laya.Sprite3D.instantiate(C.models.getChildByName("showCamera"), C.curScene), this.updateShow(i - 1), this.show.transform.position = new Laya.Vector3(1e4, 1e4, 1e4);
            var t = this.show.getChildByName("camera").getChildByName("Camera");
            window.i=i;
            t.renderTarget = new Laya.RenderTexture(720, 600, Laya.RenderTextureFormat.R8G8B8A8), t.clearFlag = 0, t.clearColor = new Laya.Vector4(0, 0, 0, 0);
            var e = new Laya.Texture(t.renderTarget, Laya.Texture.DEF_UV);
            this.showBg.graphics.drawTexture(e), this.closeBtn.on(Laya.Event.CLICK, this, function (i) {
                C.PlaySound("Btn"), null != C.curPlayerControl && (c.pushUI = 0, C.curPlayerControl.mouseDown(i)), this.destroy()
            }), this.getBtn.on(Laya.Event.CLICK, this, function (t) {
                C.PlaySound("Btn"), SdkUtil.TDEvent("视频点击推送换皮肤"), window.SdkUtil.ShowVideo(function (e) {
                        if( 1 == e ){
                            Laya.timer.loop(100,this,this.startTry)
                            null != C.curPlayerControl && (c.pushUI = 0)
                        }
                }.bind(this))
            }), null != this.ADPanel && SdkUtil.ShowNeiZhiAD && SdkUtil.ShowNeiZhiAD(this.ADPanel, 1)
            this._children[2].alpha=0
        }
        startTry(){
           if(!window.isVideo){
               if(window.i){
                C.currentPiFuType = window.i,
                C.curPlayerControl.updateShopYifu(window.i - 1),
                C.curPlayerControl.updateShopYifu(window.i - 1),
                window.i=null
               }
            this.destroy(), SdkUtil.TDEvent("视频完成推送换皮肤")
            Laya.timer.clear(this,this.startTry)
           }
        }
        updateShow(i) {
            var t = this.show.getChildByName("piFu");
            for (let e = 0; e < 6; e++) t.getChildAt(e).active = i == e
        }
        onDisable() {
            VkApp.hideMoreGameBtn();
            VkApp.hideShareBtn(); 
            VkApp.hideClubBtn();
            VkApp.hideBanner(); 
            VkApp.hideRankBtn();
            VkApp.hideSingleArr();
            null != this.show && this.show.destroy()
        }
    }
    class V extends Laya.Scene {
        constructor() {
            super(), this.tiaoAllWidth
        }
        onEnable() {
            this.loadScene()
        }
        loadScene() {
            C.guanKaLv = g.GetGuangKalv();
            var i = "res/Scene/Conventional/Level" + C.guanKaLv + ".ls";
            C.loadScene(i, function () {
                Laya.timer.once(1, this, function () {
                    this.destroy(), c.ShowUIPanel("GameRun", !0, !0)
                })
            }.bind(this))
        }
    }
    class B extends Laya.Scene {
        constructor() {
            super(), this.pageYe = 0, this.show
        }
        onEnable() {
            console.log("商店")
            VkApp.removeLoadingCircle();//删除loading
            VkApp.hideMoreGameBtn();
            VkApp.hideShareBtn(); 
            VkApp.hideSoundBtn(),
            VkApp.hideClubBtn();
            VkApp.hideBanner(); 
            VkApp.hideRankBtn();
            VkApp.hideSingleArr();
            // VkApp.showBanner(); //显示底部banner矩阵

            window.SdkUtil.ShowBanner && window.SdkUtil.ShowBanner(), window.SdkUtil.ShowChaPing && window.SdkUtil.ShowChaPing(), this.show = Laya.Sprite3D.instantiate(C.models.getChildByName("showCamera"), C.curScene), this.updateShow(C.piFuType - 1), this.show.transform.position = new Laya.Vector3(1e4, 1e4, 1e4);
            var i = this.show.getChildByName("camera").getChildByName("Camera");
            i.renderTarget = new Laya.RenderTexture(720, 600, Laya.RenderTextureFormat.R8G8B8A8), i.clearFlag = 0, i.clearColor = new Laya.Vector4(0, 0, 0, 0);
            var t = new Laya.Texture(i.renderTarget, Laya.Texture.DEF_UV);
            this.showBg.graphics.drawTexture(t), this.updateUI();
            for (let i = 1; i <= this.bg.numChildren; i++) this["shiYong" + i].on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), C.piFuType = i, null != C.curPlayerControl && C.curPlayerControl.updateShopYifu(C.piFuType - 1),
                 C.currentPiFuType = -1, this.updateUI(), this.updateShow(C.piFuType - 1), g.savePiFuTypeNum(C.piFuType)
            }), this["xiaoHao" + i].on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn");
                var t = 1 * this["xiaoHaoNum" + i].text;
                g.IsCanLessProp(1, t) ? (g.LessProp(1, t), C.piFuType = i, null != C.curPlayerControl && 
                C.curPlayerControl.updateShopYifu(C.piFuType - 1), C.currentPiFuType = -1, g.SavePiFuTypeList(C.piFuType),
                 g.savePiFuTypeNum(C.piFuType), this.updateUI(), this.updateShow(C.piFuType - 1)) :
                 VkApp.addLoadingCircle(),
                 VkApp.showMoreGameBtn(), //新增全屏按钮
                 VkApp.showShareBtn(), //分享按钮
     
                     VkApp.showBanner(), //显示底部banner矩阵
                 VkApp.showClubBtn(null, null, 10, 190), //显示社区按钮 
                 //VkApp.showRankBtn(null, 10, null, 130), //显示排行榜按钮
                 VkApp.showSingleArr(10, 80), //显示四个互推矩阵
                 void 0 /* lokal: kein Münzen-Fenster */
            });
            this.fangQi.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), this.destroy()
            }), this.qian.text = g.GetUserData("Gold"), Laya.timer.loop(10, this, function () {
                this.qian.text = g.GetUserData("Gold")
            })
        }
        updateUI() {
            this.xiaoHaoNum1.text = 0, this.xiaoHaoNum2.text = 2e3, this.xiaoHaoNum3.text = 5e3, this.xiaoHaoNum4.text = 5e3, this.xiaoHaoNum5.text = 5e3, this.xiaoHaoNum6.text = 5e3;
            var i = g.GetUserData("piFuType");
            for (let e = 1; e <= 6; e++)
                if (null != i[e])
                    if (1 == i[e]) {
                        var t = "btn" + e;
                        this.bg.getChildByName(t).getChildByName("gouMai").visible = !1, 
                        this.bg.getChildByName(t).getChildByName("yongYou").visible = !0, -1 == C.currentPiFuType ? 
                        C.piFuType == e ? (this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("yiYong").visible = !0, 
                        this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("shiYong").visible = !1) : 
                        (this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("yiYong").visible = !1, 
                        this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("shiYong").visible = !0) :
                         C.currentPiFuType == e ? (this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("yiYong").visible = !0,
                          this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("shiYong").visible = !1) : 
                          (this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("yiYong").visible = !1, 
                          this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("shiYong").visible = !0)
                    } else {
                        t = "btn" + e;
                        C.currentPiFuType != e ? (this.bg.getChildByName(t).getChildByName("gouMai").visible = !0,
                         this.bg.getChildByName(t).getChildByName("yongYou").visible = !1,
                          this.bg.getChildByName(t).getChildByName("gouMai").getChildByName("shiPin").visible = !1, 
                          this.bg.getChildByName(t).getChildByName("gouMai").getChildByName("xiaoHao").visible = !0) :
                           (this.bg.getChildByName(t).getChildByName("gouMai").visible = !1, 
                           this.bg.getChildByName(t).getChildByName("yongYou").visible = !0, 
                           this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("yiYong").visible = !0, 
                           this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("shiYong").visible = !1)
                    }
            else {
                t = "btn" + e;
                C.currentPiFuType != e ? (this.bg.getChildByName(t).getChildByName("gouMai").visible = !0, 
                this.bg.getChildByName(t).getChildByName("yongYou").visible = !1, 
                this.bg.getChildByName(t).getChildByName("gouMai").getChildByName("shiPin").visible = !1, 
                this.bg.getChildByName(t).getChildByName("gouMai").getChildByName("xiaoHao").visible = !0) :
                 (this.bg.getChildByName(t).getChildByName("gouMai").visible = !1,
                  this.bg.getChildByName(t).getChildByName("yongYou").visible = !0,
                  this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("yiYong").visible = !0, 
                  this.bg.getChildByName(t).getChildByName("yongYou").getChildByName("shiYong").visible = !1)
            }
        }
        updateShow(i) {
            var t = this.show.getChildByName("piFu");
            for (let e = 0; e < 6; e++) t.getChildAt(e).active = i == e
        }
        onDisable() {
            VkApp.openSoundBtn()
            VkApp.showRandomInterAd();// 主界面 按钮关闭 随机插屏广告
            VkApp.showMoreGameBtn(); //新增全屏按钮
            VkApp.showShareBtn(); //分享按钮

            if (!window.end) {
                VkApp.showBanner(); //显示底部banner矩阵
            }
            VkApp.showClubBtn(null, null, 10, 190); //显示社区按钮 
            //VkApp.showRankBtn(null, 10, null, 130); //显示排行榜按钮
            VkApp.showSingleArr(10, 80); //显示四个互推矩阵
            window.SdkUtil.CloseBanner && window.SdkUtil.CloseBanner(), null != this.show && this.show.destroy()
        }
    }
    class M extends Laya.Scene {
        constructor() {
            super(), this.qianDaoQian = 100
        }
        onEnable() {
            console.log("签到")
            VkApp.hideMoreGameBtn();
            VkApp.hideShareBtn(); 
            VkApp.hideClubBtn();
            VkApp.hideBanner(); 
            VkApp.hideSoundBtn()
            VkApp.hideRankBtn();
            VkApp.hideSingleArr();
            VkApp.showBanner(); //显示底部banner矩阵
            window.SdkUtil.ShowBanner && window.SdkUtil.ShowBanner();
            var i = new Date,
                t = i.getMonth() + 1,
                e = i.getFullYear() + "年" + t + "月" + i.getDate() + "日";
            this.initQianDaoFun(), this.shuangBei.on(Laya.Event.CLICK, this, function () {
                if (C.PlaySound("Btn"), g.GetUserData("curDay") == e) return c.ShowGameTipUI(window.getLanguageByKey("Received_successfully")), void this.destroy();
                window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("签到页面视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (g.GetUserData("curDay") != e ? (g.AddProp(1, 2 * this.qianDaoQian), g.SetUserData("curDay", e), g.SetUserData("signNum", g.GetUserData("signNum") + 1), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"))) : c.ShowGameTipUI(window.getLanguageByKey("Received_successfully")), this.destroy(), SdkUtil.TDEvent("签到页面视频完成"))
                }.bind(this)))
            }), this.qianDao.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), g.GetUserData("curDay") != e ? (g.AddProp(1, this.qianDaoQian), g.SetUserData("curDay", e), g.SetUserData("signNum", g.GetUserData("signNum") + 1), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully")), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully"))) : c.ShowGameTipUI(window.getLanguageByKey("Received_successfully")), this.destroy()
            })
        }
        initQianDaoFun() {
            var i = g.GetUserData("signNum") + 1;
            for (let e = 1; e <= this.allDay.numChildren; e++) {
                var t = "day" + e;
                this["dayQian" + e].text = 50 * e + 50, g.GetUserData("signNum") >= e ? this.allDay.getChildByName(t).getChildByName("yiQian").visible = !0 : (this.allDay.getChildByName(t).getChildByName("yiQian").visible = !1, i <= 7 && i == e && (this.qianDaoQian = 1 * this["dayQian" + e].text))
            }
        }
        onDisable() {
            VkApp.openSoundBtn()
            VkApp.showRandomInterAd();// 主界面 按钮关闭 随机插屏广告
            VkApp.showMoreGameBtn(); //新增全屏按钮
            VkApp.showShareBtn(); //分享按钮

            if (!window.end) {
                VkApp.showBanner(); //显示底部banner矩阵
            }
            VkApp.showClubBtn(null, null, 10, 190); //显示社区按钮 
            //VkApp.showRankBtn(null, 10, null, 130); //显示排行榜按钮
            VkApp.showSingleArr(10, 80); //显示四个互推矩阵
            window.SdkUtil.CloseBanner && window.SdkUtil.CloseBanner()
        }
    }
    class k extends Laya.Scene {
        constructor() {
            super(), this.show
        }
        onEnable() {
            this.init()
        }
        init() {
            console.log("胜利")
             //结算
             Laya.timer.once(3000,this,()=>{
                VkApp.showInterstitial();//显示插屏
                })
            VkApp.showMoreGameBtn(); //新增全屏按钮
            VkApp.showShareBtn(); //分享按钮

            if (!window.end) {
                VkApp.showBanner(); //显示底部banner矩阵
            }
            VkApp.showClubBtn(null, null, 10, 190); //显示社区按钮 
            //VkApp.showRankBtn(null, 10, null, 130); //显示排行榜按钮
            VkApp.showSingleArr(10, 80); //显示四个互推矩阵
            VkApp.rankSync(g.GetUserData("showLv")?g.GetUserData("showLv"):1); //排行版数据上报 关卡数
            this.shuangBei.visiable = !1, this.fangQi.visiable = !1, this.skeleton = new Laya.Skeleton, this.addChild(this.skeleton), this.skeleton.pos(this.width / 2, this.height / 2), this.skeleton.load("res/longgu/win_fail.sk", Laya.Handler.create(this, function () {
                this.skeleton.play("win_01", !1), this.skeleton.on(Laya.Event.STOPPED, this, function () {
                    this.skeleton.play("win_02", !0)
                })
            })), Laya.timer.once(1e3, this, function () {
                this.shuangBei.visiable = !0, this.fangQi.visiable = !0
            }), SdkUtil.IsShowShareBtn && SdkUtil.IsShowShareBtn(), window.SdkUtil.TDGuanQia && window.SdkUtil.TDGuanQia(2, g.GetUserData("showLv")), window.SdkUtil.ShowBanner && window.SdkUtil.ShowBanner(), window.SdkUtil.ShowAddIcon && window.SdkUtil.ShowAddIcon(), window.SdkUtil.ShowChaPing && window.SdkUtil.ShowChaPing(), null != this.ADPanel && SdkUtil.ShowNeiZhiAD && SdkUtil.ShowNeiZhiAD(this.ADPanel, 2), C.PlayMusic("Win", 1), this.addQian.text = 50 * g.GetUserData("showLv"), g.SetUserData("showLv", g.GetUserData("showLv") + 1), this.shuangBei.on(Laya.Event.CLICK, this, function () {
                C.PlaySound("Btn"), window.SdkUtil.ShowVideo && (SdkUtil.TDEvent("胜利页面三倍视频点击"), window.SdkUtil.ShowVideo(function (i) {
                    1 == i && (g.AddProp(1, 2 * this.addQian.text), this.destroy(), c.ShowUIPanel("Second"), c.ShowGameTipUI(window.getLanguageByKey("Received_successfully")), SdkUtil.TDEvent("胜利页面双倍视频完成"))
                }.bind(this)))
            }), this.fangQi.on(Laya.Event.CLICK, this, function () {
                g.AddProp(1, 1 * this.addQian.text), C.PlaySound("Btn"), c.ShowUIPanel("Second"), this.destroy()
            })
        }
        onDisable() {
            Laya.timer.clearAll(this), window.SdkUtil.CloseBanner && window.SdkUtil.CloseBanner(), window.SdkUtil.TDGuanQia(1, g.GetUserData("showLv"))
        }
    }
    class A {
        static init() {
            let i = Laya.ClassUtils.regClass;
            i("PanelAddTime.js", x), i("PanelBox.js", P), i("PanelBuyGold.js", U), i("PanelFail.js", D), i("PanelFirst.js", T),
             i("PanelGameRun.js", b), i("joyStickControler.js", I), i("PanelPush.js", N), i("PanelSecond.js", V),
              i("PanelShop.js", B), i("PanelSign.js", M), i("PanelWin.js", k)
        }
    }
    A.width = 720, A.height = 1280, A.scaleMode = "showall", A.screenMode = "none", A.alignV = "middle", A.alignH = "center", A.startScene = "UIPanel/AddTime.scene", A.sceneRoot = "", A.debug = !1, A.stat = !1, A.physicsDebug = !1, A.exportSceneToJson = !0, A.init();
    new class {
        constructor() {
            window.Laya3D ? Laya3D.init(A.width, A.height) : Laya.init(A.width, A.height, Laya.WebGL), 
            Laya.Physics && Laya.Physics.enable(), Laya.DebugPanel && Laya.DebugPanel.enable(), 
            Laya.stage.scaleMode = A.scaleMode, Laya.stage.screenMode = A.screenMode,
             Laya.stage.alignV = A.alignV, Laya.stage.alignH = A.alignH,
              Laya.URL.exportSceneToJson = A.exportSceneToJson, (A.debug || "true" == Laya.Utils.getQueryString("debug"))
               && Laya.enableDebugPanel(), A.physicsDebug && Laya.PhysicsDebugDraw && 
               Laya.PhysicsDebugDraw.enable(), A.stat && Laya.Stat.show()

           Laya.Browser.onPC ? (Laya.stage.scaleMode = "showall", Laya.stage.alignV = "middle", Laya.stage.alignH = "center") : 
            (Laya.stage.scaleMode = "fixedwidth", Laya.stage.alignV = "top", Laya.stage.alignH = "left"), 
            Laya.URL.basePath = Laya.URL.rootPath = window.xz_lang_file_url,
                // window.document.addEventListener("visibilitychange", function () {
            //      window.document.hidden ? console.log("Sy --- 用户离开了当前页面") : console.log("Sy --- 用户打开或回到页面")
            //  }),
             //Yd 视频和插屏声音处理
         VkApp.VKWebAppViewHideCallBack = () => {
            console.log("Sy --- 关闭声音");
            window.isVideo = true;
            CoinAppAudio.stopAll();
        }
    VkApp.VKWebAppViewRestoreCallBack = () => {
        console.log("Sy --- 开启声音");
        if(window.startVideo)return
        window.isVideo = false;
        if (!VkApp.isSoundMute) {
            CoinAppAudio.playMusic(CoinAppAudio.bgm);
        }
    }
               Laya.alertGlobalError(!0), Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION)
        }
        onVersionLoaded() {
            Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded))
        }
        onConfigLoaded() {
            A.startScene && Laya.Scene.open("UIPanel/First.scene")
        }
    }
}();