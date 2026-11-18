// Animierte 404-Seite, eingebaut in die Seite selbst. Erscheint bei unbekannten Adressen (z. B. /67).
(function () {
  var STUDIO = !!window.MOKI_NF_STUDIO;
  var file = /\.html?$/i.test(location.pathname);
  function bad() {
    var p = location.pathname, h = location.hash;
    var okPath = file || /^\/?(index)?$/.test(p) || (!STUDIO && /^\/spiel\/[a-z0-9-]{1,80}\/?$/i.test(p));
    var okHash = STUDIO || /^(#\/?)?$/.test(h) || /^#\/spiel\/[a-z0-9-]{1,80}\/?$/i.test(h) || /^#\/g\/[a-z0-9-]{1,60}\/?$/i.test(h) || /^#\/play\/[a-z0-9-]{1,60}\/?$/i.test(h);
    return !(okPath && okHash);
  }
  var css = '#nf{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;overflow:hidden;color:#fff;font-family:"Segoe UI",system-ui,sans-serif;background:radial-gradient(900px 500px at 80% -10%,#23307a66,transparent 60%),radial-gradient(800px 500px at -10% 90%,#0a7a7a44,transparent 60%),#0a0d2b}' +
    '#nf *{box-sizing:border-box;margin:0}#nf canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}' +
    '#nf .wrap{position:relative;text-align:center;max-width:560px;transition:transform .15s ease-out}' +
    '#nf .num{display:flex;justify-content:center;align-items:center;gap:clamp(4px,1.5vw,14px);font-weight:900;font-size:clamp(96px,24vw,190px);line-height:1;letter-spacing:-.04em;animation:nfgl 5s 2s infinite}' +
    '#nf .d{display:inline-block;background:linear-gradient(135deg,#00e5a8,#ffd23f);-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0;transform:translateY(-60px) scale(.7);animation:nfdrop .7s cubic-bezier(.3,1.6,.5,1) forwards}' +
    '#nf .d.l{animation-delay:.1s}#nf .d.r{animation-delay:.35s}@keyframes nfdrop{to{opacity:1;transform:none}}' +
    '#nf .ring{width:.82em;height:.82em;cursor:pointer;animation:nfroll .9s .25s cubic-bezier(.3,1.4,.5,1) both;filter:drop-shadow(0 8px 24px #00e5a855);-webkit-tap-highlight-color:transparent}' +
    '#nf .ring svg{width:100%;height:100%;display:block;overflow:visible}#nf .spin{transform-origin:64px 64px;animation:nfspin 9s linear infinite}' +
    '#nf .ring.hop{animation:nfhop .6s ease-out}@keyframes nfroll{from{opacity:0;transform:scale(.2) rotate(-360deg)}}@keyframes nfspin{to{transform:rotate(360deg)}}' +
    '@keyframes nfhop{30%{transform:translateY(-50px) scale(1.1,.9)}60%{transform:translateY(0) scale(.92,1.08)}100%{transform:none}}' +
    '#nf h1{font-size:clamp(22px,4.4vw,30px);margin-top:6px;opacity:0;animation:nfup .6s .8s forwards}' +
    '#nf p{color:#a3abe0;margin-top:10px;font-size:clamp(15px,2.6vw,17px);line-height:1.5;opacity:0;animation:nfup .6s 1s forwards}' +
    '#nf .btn{display:inline-flex;align-items:center;gap:8px;margin-top:26px;padding:14px 26px;border:0;border-radius:999px;font:inherit;font-weight:800;font-size:16px;color:#04201a;cursor:pointer;background:linear-gradient(135deg,#00e5a8,#2fe0c0);box-shadow:0 10px 30px #00e5a844;opacity:0;animation:nfup .6s 1.2s forwards;transition:transform .15s}' +
    '#nf .btn:hover{transform:translateY(-3px) scale(1.03)}#nf .hint{font-size:13px;margin-top:22px;animation-delay:1.6s}' +
    '#nf .path{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom;color:#ffd23f;font-family:ui-monospace,monospace;font-size:.92em}' +
    '@keyframes nfup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}' +
    '@keyframes nfgl{0%,92%,100%{transform:none;filter:none}93%{transform:translateX(-6px) skewX(-6deg);filter:hue-rotate(60deg)}95%{transform:translateX(7px) skewX(5deg)}97%{transform:none}}' +
    '@media (prefers-reduced-motion:reduce){#nf *{animation-duration:.01s!important;animation-delay:0s!important;animation-iteration-count:1!important}}';
  var html = '<canvas aria-hidden="true"></canvas><main class="wrap"><div class="num" aria-label="404"><span class="d l">4</span>' +
    '<span class="ring" role="img" aria-label="Moki-Logo" title="Tipp mich an"><svg viewBox="0 0 128 128"><defs><linearGradient id="nfg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00e5a8"/><stop offset="1" stop-color="#ffd23f"/></linearGradient></defs><circle class="spin" cx="64" cy="64" r="44" fill="none" stroke="url(#nfg)" stroke-width="22" stroke-dasharray="190 86" stroke-linecap="round"/><path d="M55 47L84 64L55 81Z" fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></svg></span>' +
    '<span class="d r">4</span></div><h1>Hier ist leider kein Spiel</h1><p>Die Seite <span class="path"></span> gibt es nicht. Vielleicht ein Tippfehler oder sie wurde verschoben.</p>' +
    '<button class="btn" type="button"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg><span></span></button>' +
    '<p class="hint">Tipp: Tippe auf die Null in der Mitte.</p></main>';
  var el = null, raf = 0;
  function hide() { if (!el) return; cancelAnimationFrame(raf); el.remove(); el = null; document.documentElement.style.overflow = ''; }
  function show() {
    if (el) return;
    if (!document.getElementById('nf-css')) { var s = document.createElement('style'); s.id = 'nf-css'; s.textContent = css; document.head.appendChild(s); }
    el = document.createElement('div'); el.id = 'nf'; el.setAttribute('role', 'alert'); el.innerHTML = html; document.body.appendChild(el);
    document.documentElement.style.overflow = 'hidden';
    var shown = decodeURIComponent(location.pathname + location.search + location.hash).slice(0, 60);
    el.querySelector('.path').textContent = shown || '/';
    el.querySelector('.btn span').textContent = STUDIO ? 'Zurück zum Studio' : 'Zurück zu Moki';
    el.querySelector('.btn').onclick = function () {
      if (/^https?:$/.test(location.protocol)) location.assign('/'); else { history.replaceState(null, '', location.pathname); hide(); }
    };
    var c = el.querySelector('canvas'), x = c.getContext('2d'), W, H, dpr = Math.min(devicePixelRatio || 1, 2), st = [], ps = [], mx = 0, my = 0;
    function fit() { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    addEventListener('resize', fit); fit();
    for (var i = 0; i < 90; i++) st.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + .3, s: Math.random() * .0004 + .0001, p: Math.random() * 6 });
    var cols = ['#00e5a8', '#ffd23f', '#ff4d6d', '#4cc9f0', '#ffffff'];
    function burst(px, py) { for (var i = 0; i < 46; i++) { var a = Math.random() * 6.283, v = Math.random() * 7 + 2; ps.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, l: 1, c: cols[i % 5], s: Math.random() * 5 + 3 }); } }
    var ring = el.querySelector('.ring'), w = el.querySelector('.wrap');
    ring.addEventListener('click', function () { var r = ring.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); ring.classList.remove('hop'); void ring.offsetWidth; ring.classList.add('hop'); });
    el.addEventListener('pointermove', function (e) { mx = e.clientX / W - .5; my = e.clientY / H - .5; w.style.transform = 'translate(' + (-mx * 14) + 'px,' + (-my * 14) + 'px)'; });
    setTimeout(function () { if (!el) return; var r = ring.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); }, 1100);
    (function f(t) {
      if (!el) return;
      x.clearRect(0, 0, W, H);
      for (var i = 0; i < st.length; i++) { var s = st[i]; x.globalAlpha = .35 + .35 * Math.sin(t * .002 + s.p); x.fillStyle = '#fff'; x.beginPath(); x.arc(((s.x + t * s.s) % 1) * W - mx * s.r * 14, s.y * H - my * s.r * 14, s.r, 0, 7); x.fill(); }
      for (var j = ps.length - 1; j >= 0; j--) { var p = ps[j]; p.x += p.vx; p.y += p.vy; p.vy += .22; p.l -= .014; if (p.l <= 0) { ps.splice(j, 1); continue; } x.globalAlpha = p.l; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.s, p.s); }
      x.globalAlpha = 1; raf = requestAnimationFrame(f);
    })(0);
  }
  function check() { if (bad()) show(); else hide(); }
  addEventListener('hashchange', check);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check); else check();
  window.mokiNotFound = show;
})();
