// Touch-Steuerung für Open Panzer Front (iPad). Läuft im Spiel-Fenster und bildet Tastatur/Maus nach.
// Erscheint nur im Gefecht (nicht in Menüs / Karte / Nachbesprechung).
(function () {
  if (!window.__FORCE_TOUCH) return;

  // Pointer-Lock vortäuschen: Das Spiel liest die Blickrichtung nur, wenn der Zeiger "gesperrt" ist.
  var fake = false;
  Object.defineProperty(document, "pointerLockElement", { get: function () { return fake ? document.body : null; }, configurable: true });
  function lockEvt() { document.dispatchEvent(new Event("pointerlockchange")); }
  Element.prototype.requestPointerLock = function () { fake = true; lockEvt(); return Promise.resolve(); };
  document.exitPointerLock = function () { fake = false; lockEvt(); };

  var KC = { KeyW: 87, KeyA: 65, KeyS: 83, KeyD: 68, KeyR: 82, KeyV: 86, KeyM: 77, Space: 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, PageUp: 33, PageDown: 34, Equal: 187, Minus: 189 };
  var down = {};
  function key(code, isDown) {
    if (!!down[code] === isDown) return;
    down[code] = isDown;
    var e = new KeyboardEvent(isDown ? "keydown" : "keyup", { code: code, bubbles: true, cancelable: true });
    Object.defineProperty(e, "keyCode", { get: function () { return KC[code]; } });
    window.dispatchEvent(e);
  }
  function tapKey(code) { key(code, true); setTimeout(function () { key(code, false); }, 60); }
  function mouse(type, button) {
    window.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: button, buttons: type === "mouseup" ? 0 : (button === 2 ? 2 : 1), clientX: innerWidth / 2, clientY: innerHeight / 2 }));
  }
  function look(dx, dy) {
    var e = new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: innerWidth / 2, clientY: innerHeight / 2 });
    Object.defineProperty(e, "movementX", { value: dx });
    Object.defineProperty(e, "movementY", { value: dy });
    window.dispatchEvent(e);
  }

  var css = document.createElement("style");
  css.textContent =
    "#tz{position:fixed;inset:0;z-index:50;pointer-events:none;display:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none}" +
    "#tz.on{display:block}" +
    "#tz .zone{position:absolute;pointer-events:auto;touch-action:none}" +
    "#tz-look{right:0;top:0;width:58%;height:100%}" +
    "#tz-joyz{left:0;bottom:0;width:40%;height:60%}" +
    "#tz-joy{position:absolute;width:130px;height:130px;margin:-65px 0 0 -65px;border-radius:50%;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.35);display:none}" +
    "#tz-knob{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(255,255,255,.4)}" +
    ".tzb{position:absolute;pointer-events:auto;touch-action:none;display:flex;align-items:center;justify-content:center;text-align:center;border-radius:50%;background:rgba(20,28,20,.55);border:2px solid rgba(220,200,120,.7);color:#f3e7b3;font:700 12px system-ui,sans-serif;line-height:1.1}" +
    ".tzb.act{background:rgba(200,170,60,.7)}" +
    "#tzb-fire{right:22px;bottom:84px;width:104px;height:104px;font-size:17px;background:rgba(160,40,30,.6);border-color:#ff9a8a}" +
    "#tzb-ammo{right:140px;bottom:84px;width:66px;height:66px}" +
    "#tzb-sight{right:140px;bottom:158px;width:66px;height:66px}" +
    "#tzb-map{right:22px;bottom:200px;width:66px;height:66px}" +
    "#tzb-zin{left:24px;bottom:calc(60% + 66px);width:46px;height:46px}" +
    "#tzb-zout{left:76px;bottom:calc(60% + 66px);width:46px;height:46px}" +
    "#tzb-dup{left:128px;bottom:calc(60% + 66px);width:46px;height:46px}" +
    "#tzb-ddn{left:180px;bottom:calc(60% + 66px);width:46px;height:46px}" +
    "#tzb-al{left:24px;bottom:calc(60% + 12px);width:46px;height:46px}" +
    "#tzb-au{left:76px;bottom:calc(60% + 12px);width:46px;height:46px}" +
    "#tzb-ad{left:128px;bottom:calc(60% + 12px);width:46px;height:46px}" +
    "#tzb-ar{left:180px;bottom:calc(60% + 12px);width:46px;height:46px}" +
    "#tzb-back{display:none;position:fixed;right:16px;top:16px;z-index:60;width:auto;height:auto;padding:10px 16px;border-radius:999px;pointer-events:auto}" +
    "#tzb-back.on{display:flex}";
  document.head.appendChild(css);

  var root = document.createElement("div");
  root.id = "tz";
  root.innerHTML =
    '<div class="zone" id="tz-look"></div>' +
    '<div class="zone" id="tz-joyz"><div id="tz-joy"><div id="tz-knob"></div></div></div>' +
    '<div class="tzb" id="tzb-fire">FEUER</div><div class="tzb" id="tzb-ammo">MUNI</div><div class="tzb" id="tzb-sight">VISIER</div><div class="tzb" id="tzb-map">KARTE</div>' +
    '<div class="tzb" id="tzb-zin">ZOOM +</div><div class="tzb" id="tzb-zout">ZOOM &minus;</div><div class="tzb" id="tzb-dup">ENTF +</div><div class="tzb" id="tzb-ddn">ENTF &minus;</div>' +
    '<div class="tzb" id="tzb-al">TURM &#9664;</div><div class="tzb" id="tzb-au">ROHR &#9650;</div><div class="tzb" id="tzb-ad">ROHR &#9660;</div><div class="tzb" id="tzb-ar">TURM &#9654;</div>';
  document.body.appendChild(root);
  var back = document.createElement("div");
  back.className = "tzb"; back.id = "tzb-back"; back.textContent = "KARTE SCHLIESSEN";
  document.body.appendChild(back);

  function btn(id, onDown, onUp) {
    var el = document.getElementById(id);
    el.addEventListener("touchstart", function (e) { e.preventDefault(); e.stopPropagation(); el.classList.add("act"); onDown(); }, { passive: false });
    var up = function (e) { e.preventDefault(); el.classList.remove("act"); if (onUp) onUp(); };
    el.addEventListener("touchend", up, { passive: false });
    el.addEventListener("touchcancel", up, { passive: false });
  }
  function hold(id, code) { btn(id, function () { key(code, true); }, function () { key(code, false); }); }
  btn("tzb-fire", function () { key("Space", true); mouse("mousedown", 0); }, function () { key("Space", false); mouse("mouseup", 0); });
  btn("tzb-ammo", function () { tapKey("KeyR"); });
  btn("tzb-sight", function () { tapKey("KeyV"); });
  btn("tzb-map", function () { tapKey("KeyM"); });
  btn("tzb-zin", function () { tapKey("Equal"); });
  btn("tzb-zout", function () { tapKey("Minus"); });
  btn("tzb-dup", function () { tapKey("PageUp"); });
  btn("tzb-ddn", function () { tapKey("PageDown"); });
  hold("tzb-al", "ArrowLeft"); hold("tzb-ar", "ArrowRight"); hold("tzb-au", "ArrowUp"); hold("tzb-ad", "ArrowDown");
  back.addEventListener("touchstart", function (e) { e.preventDefault(); tapKey("KeyM"); }, { passive: false });
  back.addEventListener("click", function () { tapKey("KeyM"); });

  // Umsehen / Turm ausrichten: Wischen = rechte Maustaste halten + bewegen
  var look_ = document.getElementById("tz-look"), lid = null, lx = 0, ly = 0, SENS = 1.7;
  look_.addEventListener("touchstart", function (e) { e.preventDefault(); var t = e.changedTouches[0]; lid = t.identifier; lx = t.clientX; ly = t.clientY; mouse("mousedown", 2); }, { passive: false });
  look_.addEventListener("touchmove", function (e) { e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (t.identifier === lid) { look((t.clientX - lx) * SENS, (t.clientY - ly) * SENS); lx = t.clientX; ly = t.clientY; } } }, { passive: false });
  function lend(e) { for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === lid) { lid = null; mouse("mouseup", 2); } }
  look_.addEventListener("touchend", lend); look_.addEventListener("touchcancel", lend);

  // Joystick: Fahren (W/S) und Lenken (A/D)
  var jz = document.getElementById("tz-joyz"), joy = document.getElementById("tz-joy"), knob = document.getElementById("tz-knob"), jid = null, jx = 0, jy = 0;
  function joyMove(t) {
    var dx = t.clientX - jx, dy = t.clientY - jy, d = Math.hypot(dx, dy), m = 60;
    if (d > m) { dx *= m / d; dy *= m / d; }
    knob.style.transform = "translate(" + dx + "px," + dy + "px)";
    var th = 20;
    key("KeyW", dy < -th); key("KeyS", dy > th); key("KeyA", dx < -th); key("KeyD", dx > th);
  }
  jz.addEventListener("touchstart", function (e) { e.preventDefault(); var t = e.changedTouches[0]; jid = t.identifier; var r = jz.getBoundingClientRect(); jx = t.clientX; jy = t.clientY; joy.style.display = "block"; joy.style.left = (jx - r.left) + "px"; joy.style.top = (jy - r.top) + "px"; knob.style.transform = ""; }, { passive: false });
  jz.addEventListener("touchmove", function (e) { e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === jid) joyMove(e.changedTouches[i]); }, { passive: false });
  function jend(e) { for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === jid) { jid = null; joy.style.display = "none"; ["KeyW", "KeyA", "KeyS", "KeyD"].forEach(function (c) { key(c, false); }); } }
  jz.addEventListener("touchend", jend); jz.addEventListener("touchcancel", jend);

  // Nur im Gefecht anzeigen
  setInterval(function () {
    var battle = !!document.querySelector(".battle-hud");
    var map = !!document.querySelector("[data-map-hud]");
    var over = !!document.querySelector(".battle-result-banner");
    var on = battle && !map && !over;
    root.classList.toggle("on", on);
    back.classList.toggle("on", battle && map);
    if (!on) { Object.keys(down).forEach(function (c) { if (down[c]) key(c, false); }); }
    if (!battle) fake = false;
  }, 250);

  // Zoomen verhindern
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener("touchmove", function (e) { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
})();
