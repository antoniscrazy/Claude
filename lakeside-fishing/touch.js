// Touch-Steuerung für Lakeside Fishing (iPad). Bildet Tastatur/Maus nach, nur während man spielt.
(function () {
  if (!window.__FORCE_TOUCH) return;
  // iPad hat keine Pointer-Lock-Funktion: Aufrufe des Spiels ins Leere laufen lassen
  if (!Element.prototype.requestPointerLock) Element.prototype.requestPointerLock = function () { return Promise.resolve(); };
  if (!document.exitPointerLock) document.exitPointerLock = function () {};

  var canvas = document.getElementById("scene");
  var KEYS = { KeyW: 87, KeyA: 65, KeyS: 83, KeyD: 68, Space: 32, ShiftLeft: 16, KeyE: 69, KeyQ: 81, KeyB: 66, KeyM: 77, KeyV: 86, KeyU: 85, KeyC: 67, Escape: 27 };
  var down = {};
  function key(code, isDown) {
    if (!!down[code] === isDown) return;
    down[code] = isDown;
    var e = new KeyboardEvent(isDown ? "keydown" : "keyup", { code: code, bubbles: true, cancelable: true });
    Object.defineProperty(e, "keyCode", { get: function () { return KEYS[code]; } });
    window.dispatchEvent(e);
  }
  function tapKey(code) { key(code, true); setTimeout(function () { key(code, false); }, 70); }
  function mouse(type, button) {
    canvas.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: button, buttons: type === "mouseup" ? 0 : (button === 2 ? 2 : 1) }));
    if (type === "mouseup") window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: button }));
  }
  function look(dx, dy) {
    var e = new MouseEvent("mousemove", { bubbles: true, cancelable: true });
    Object.defineProperty(e, "movementX", { value: dx });
    Object.defineProperty(e, "movementY", { value: dy });
    window.dispatchEvent(e);
  }

  var css = document.createElement("style");
  css.textContent =
    "#tz{position:fixed;inset:0;z-index:40;pointer-events:none;display:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none}" +
    "#tz.on{display:block}" +
    "#tz .zone{position:absolute;pointer-events:auto;touch-action:none}" +
    "#tz-look{right:0;top:0;width:58%;height:100%}" +
    "#tz-joyz{left:0;bottom:0;width:40%;height:58%}" +
    "#tz-joy{position:absolute;width:130px;height:130px;margin:-65px 0 0 -65px;border-radius:50%;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.4);display:none}" +
    "#tz-knob{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(255,255,255,.45)}" +
    ".tzb{position:absolute;pointer-events:auto;touch-action:none;display:flex;align-items:center;justify-content:center;text-align:center;border-radius:50%;background:rgba(10,30,40,.55);border:2px solid rgba(255,255,255,.65);color:#fff;font:700 12px system-ui,sans-serif;line-height:1.1}" +
    ".tzb.act{background:rgba(0,200,170,.7)}" +
    "#tzb-act{right:26px;bottom:34px;width:110px;height:110px;font-size:16px;background:rgba(20,120,170,.6)}" +
    "#tzb-rig{right:154px;bottom:34px;width:64px;height:64px}" +
    "#tzb-run{left:26px;bottom:calc(58% + 10px);width:64px;height:64px}" +
    "#tz-menu{position:absolute;left:50%;top:12px;transform:translateX(-50%);display:flex;flex-direction:row;gap:10px;pointer-events:none}" +
    "#tz-menu .tzb{position:relative;width:52px;height:52px;pointer-events:auto}";
  document.head.appendChild(css);

  var root = document.createElement("div");
  root.id = "tz";
  root.innerHTML =
    '<div class="zone" id="tz-look"></div>' +
    '<div class="zone" id="tz-joyz"><div id="tz-joy"><div id="tz-knob"></div></div></div>' +
    '<div class="tzb" id="tzb-act">WURF /<br>ZIEHEN</div><div class="tzb" id="tzb-rig">TIEFE<br>(E)</div><div class="tzb" id="tzb-run">RENNEN</div>' +
    '<div id="tz-menu"><div class="tzb" id="tzb-shop">SHOP</div><div class="tzb" id="tzb-jour">BUCH</div><div class="tzb" id="tzb-map">KARTE</div><div class="tzb" id="tzb-uw">UNTER<br>WASSER</div><div class="tzb" id="tzb-view">ANSICHT</div><div class="tzb" id="tzb-pause">MENÜ</div></div>';
  document.body.appendChild(root);

  function btn(id, onDown, onUp) {
    var el = document.getElementById(id);
    el.addEventListener("touchstart", function (e) { e.preventDefault(); e.stopPropagation(); el.classList.add("act"); onDown(el); }, { passive: false });
    var up = function (e) { e.preventDefault(); el.classList.remove("act"); if (onUp) onUp(el); };
    el.addEventListener("touchend", up, { passive: false });
    el.addEventListener("touchcancel", up, { passive: false });
  }
  btn("tzb-act", function () { key("Space", true); }, function () { key("Space", false); });
  btn("tzb-rig", function () { tapKey("KeyE"); });
  btn("tzb-shop", function () { tapKey("KeyB"); });
  btn("tzb-jour", function () { tapKey("KeyQ"); });
  btn("tzb-map", function () { tapKey("KeyM"); });
  btn("tzb-uw", function () { tapKey("KeyV"); });
  btn("tzb-view", function () { tapKey("KeyC"); });
  btn("tzb-pause", function () { tapKey("Escape"); });
  var run = false;
  btn("tzb-run", function (el) { run = !run; key("ShiftLeft", run); el.style.outline = run ? "3px solid #7df" : ""; });

  // Umsehen: Wischen = rechte Maustaste halten + bewegen (das Spiel dreht dann die Kamera)
  var lk = document.getElementById("tz-look"), lid = null, lx = 0, ly = 0, SENS = 1.6;
  lk.addEventListener("touchstart", function (e) { e.preventDefault(); var t = e.changedTouches[0]; lid = t.identifier; lx = t.clientX; ly = t.clientY; mouse("mousedown", 2); }, { passive: false });
  lk.addEventListener("touchmove", function (e) { e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (t.identifier === lid) { look((t.clientX - lx) * SENS, (t.clientY - ly) * SENS); lx = t.clientX; ly = t.clientY; } } }, { passive: false });
  function lend(e) { for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === lid) { lid = null; mouse("mouseup", 2); } }
  lk.addEventListener("touchend", lend); lk.addEventListener("touchcancel", lend);

  // Joystick
  var jz = document.getElementById("tz-joyz"), joy = document.getElementById("tz-joy"), knob = document.getElementById("tz-knob"), jid = null, jx = 0, jy = 0;
  function joyMove(t) {
    var dx = t.clientX - jx, dy = t.clientY - jy, d = Math.hypot(dx, dy), m = 60;
    if (d > m) { dx *= m / d; dy *= m / d; }
    knob.style.transform = "translate(" + dx + "px," + dy + "px)";
    var th = 18;
    key("KeyW", dy < -th); key("KeyS", dy > th); key("KeyA", dx < -th); key("KeyD", dx > th);
  }
  jz.addEventListener("touchstart", function (e) { e.preventDefault(); var t = e.changedTouches[0]; jid = t.identifier; var r = jz.getBoundingClientRect(); jx = t.clientX; jy = t.clientY; joy.style.display = "block"; joy.style.left = (jx - r.left) + "px"; joy.style.top = (jy - r.top) + "px"; knob.style.transform = ""; }, { passive: false });
  jz.addEventListener("touchmove", function (e) { e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === jid) joyMove(e.changedTouches[i]); }, { passive: false });
  function jend(e) { for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === jid) { jid = null; joy.style.display = "none"; ["KeyW", "KeyA", "KeyS", "KeyD"].forEach(function (c) { key(c, false); }); } }
  jz.addEventListener("touchend", jend); jz.addEventListener("touchcancel", jend);

  // Nur beim Spielen anzeigen (nicht im Titelbild, nicht in Shop/Buch/Karte/Menü)
  setInterval(function () {
    var g = window.__game, on = !!(g && g.playing && g.ui && !g.ui.isBlocking());
    root.classList.toggle("on", on);
    if (!on) Object.keys(down).forEach(function (c) { if (down[c] && c !== "ShiftLeft") key(c, false); });
  }, 200);

  ["gesturestart", "gesturechange", "gestureend"].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener("touchmove", function (e) { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
})();
