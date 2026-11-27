'use strict';
/* =====================================================================
   CORE — helpers, icons, sound, state, save, notifications
===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cr = n => Math.round(n).toLocaleString('de-DE') + ' Cr';
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const randIP = () => `${rnd(11, 223)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`;
const isSmall = () => innerWidth < 720 || innerHeight < 520;
const isTouch = () => matchMedia('(pointer: coarse)').matches;

/* ---------- ICONS (hand-drawn SVG, 32x32) ---------- */
const ICONS = {
  computer: `<svg viewBox="0 0 32 32"><defs><linearGradient id="gc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfbf3"/><stop offset="1" stop-color="#c9c5ae"/></linearGradient><linearGradient id="gc2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fa3ff"/><stop offset="1" stop-color="#0a3fb5"/></linearGradient></defs><rect x="3" y="3" width="26" height="19" rx="2" fill="url(#gc1)" stroke="#6b6650"/><rect x="6" y="6" width="20" height="13" fill="url(#gc2)"/><path d="M8 16l5-6 4 4 3-3 4 5z" fill="#7bd36b" opacity=".85"/><rect x="11" y="22" width="10" height="3" fill="#a9a48b"/><rect x="6" y="25" width="20" height="4" rx="1" fill="url(#gc1)" stroke="#6b6650"/></svg>`,
  terminal: `<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="24" rx="2" fill="#1a1a1a" stroke="#555"/><rect x="2" y="4" width="28" height="5" rx="2" fill="#2d5fd6"/><path d="M7 14l5 3-5 3" stroke="#33ff77" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="14" y="19" width="8" height="2.2" fill="#33ff77"/></svg>`,
  mail: `<svg viewBox="0 0 32 32"><defs><linearGradient id="gm1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e5ddb7"/></linearGradient></defs><rect x="3" y="8" width="26" height="18" rx="1.5" fill="url(#gm1)" stroke="#8a7d4c"/><path d="M3.5 9l12.5 9 12.5-9" fill="none" stroke="#8a7d4c" stroke-width="1.4"/><path d="M3.5 25.5l9-8M28.5 25.5l-9-8" stroke="#b5a873"/><circle cx="25" cy="8" r="4.5" fill="#2f74e0" stroke="#fff"/><path d="M23 8h4M25 6v4" stroke="#fff" stroke-width="1.2"/></svg>`,
  globe: `<svg viewBox="0 0 32 32"><defs><radialGradient id="gg1" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#bfe3ff"/><stop offset=".5" stop-color="#3b8ff0"/><stop offset="1" stop-color="#0b3c9f"/></radialGradient></defs><circle cx="16" cy="16" r="13" fill="url(#gg1)" stroke="#0b3c9f"/><path d="M9 8c3 1 4 3 3 5s-4 2-3 5 3 2 3 5c-3-1-6-5-6-9 0-2 1-4 3-6zM18 5c4 1 7 4 8 8-2 0-3-2-5-1s0 4-2 5-4-1-4-3 2-2 2-4-1-3 1-5z" fill="#4fc04a" opacity=".95"/><ellipse cx="16" cy="16" rx="15" ry="5" fill="none" stroke="#ffd84a" stroke-width="1.6" transform="rotate(-25 16 16)"/></svg>`,
  folder: `<svg viewBox="0 0 32 32"><defs><linearGradient id="gf1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#e9b73c"/></linearGradient></defs><path d="M3 8h9l3 3h14v15H3z" fill="#d9a22a"/><path d="M3 12h26v14H3z" fill="url(#gf1)" stroke="#b5841c"/></svg>`,
  docs: `<svg viewBox="0 0 32 32"><defs><linearGradient id="gd1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#e9b73c"/></linearGradient></defs><path d="M3 8h9l3 3h14v15H3z" fill="#d9a22a"/><rect x="8" y="5" width="14" height="14" fill="#fff" stroke="#999" transform="rotate(-6 15 12)"/><path d="M3 14h26v12H3z" fill="url(#gd1)" stroke="#b5841c"/></svg>`,
  notepad: `<svg viewBox="0 0 32 32"><rect x="6" y="3" width="20" height="26" fill="#fff" stroke="#7a8ca8"/><rect x="6" y="3" width="20" height="5" fill="#3f7fd6"/><path d="M9 12h14M9 15h14M9 18h14M9 21h10M9 24h12" stroke="#9fb3d6"/><circle cx="10" cy="5.5" r="1" fill="#fff"/><circle cx="16" cy="5.5" r="1" fill="#fff"/><circle cx="22" cy="5.5" r="1" fill="#fff"/></svg>`,
  network: `<svg viewBox="0 0 32 32"><path d="M8 9L22 7M8 9l7 14M22 7l-7 16M22 7l6 13" stroke="#59b6ff" stroke-width="1.6"/><circle cx="8" cy="9" r="4" fill="#2f74e0" stroke="#fff"/><circle cx="22" cy="7" r="3.5" fill="#3cc05a" stroke="#fff"/><circle cx="15" cy="23" r="4.5" fill="#e0453a" stroke="#fff"/><circle cx="28" cy="20" r="3" fill="#f0b030" stroke="#fff"/></svg>`,
  taskmgr: `<svg viewBox="0 0 32 32"><rect x="3" y="4" width="26" height="24" rx="2" fill="#fff" stroke="#5c6b86"/><rect x="3" y="4" width="26" height="5" rx="2" fill="#2d5fd6"/><rect x="6" y="12" width="20" height="13" fill="#000"/><path d="M6 22l4-3 3 2 4-6 3 3 3-5 3 2" stroke="#2bff2b" fill="none" stroke-width="1.4"/></svg>`,
  media: `<svg viewBox="0 0 32 32"><defs><radialGradient id="gp1" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#e2620c"/></radialGradient></defs><circle cx="16" cy="16" r="13" fill="url(#gp1)" stroke="#a6430a"/><circle cx="16" cy="16" r="8.5" fill="#1d4fc4" stroke="#fff"/><path d="M13.5 11.5v9l7-4.5z" fill="#fff"/></svg>`,
  trash: `<svg viewBox="0 0 32 32"><defs><linearGradient id="gt1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd8dc"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#9aa8ae"/></linearGradient></defs><path d="M8 9h16l-2 19H10z" fill="url(#gt1)" stroke="#5f6e75"/><ellipse cx="16" cy="9" rx="9" ry="2.5" fill="#dfe6e9" stroke="#5f6e75"/><path d="M12 13l1 12M16 13v12M20 13l-1 12" stroke="#8a9aa1"/></svg>`,
  trashfull: `<svg viewBox="0 0 32 32"><defs><linearGradient id="gt2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd8dc"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#9aa8ae"/></linearGradient></defs><path d="M10 4l6 3 5-2 1 4-12 1z" fill="#fff" stroke="#999"/><path d="M8 9h16l-2 19H10z" fill="url(#gt2)" stroke="#5f6e75"/><ellipse cx="16" cy="9" rx="9" ry="2.5" fill="#dfe6e9" stroke="#5f6e75"/><path d="M12 13l1 12M16 13v12M20 13l-1 12" stroke="#8a9aa1"/></svg>`,
  settings: `<svg viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="22" rx="2" fill="#eaf1fb" stroke="#4d6fa8"/><circle cx="12" cy="15" r="5" fill="#8d9fbf" stroke="#3e557f"/><circle cx="12" cy="15" r="2" fill="#eaf1fb"/><path d="M12 8v2M12 20v2M5 15h2M17 15h2M7 10l1.5 1.5M15.5 18.5L17 20M7 20l1.5-1.5M15.5 11.5L17 10" stroke="#3e557f" stroke-width="1.6"/><rect x="21" y="9" width="5" height="3" fill="#3cc05a"/><rect x="21" y="14" width="5" height="3" fill="#f0b030"/><rect x="21" y="19" width="5" height="3" fill="#e0453a"/></svg>`,
  help: `<svg viewBox="0 0 32 32"><defs><radialGradient id="gh1" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9fd0ff"/><stop offset="1" stop-color="#1450c8"/></radialGradient></defs><circle cx="16" cy="16" r="13" fill="url(#gh1)" stroke="#0b3c9f"/><path d="M12 12.5a4 4 0 118 .5c0 3-4 3-4 6" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="16" cy="23.5" r="1.7" fill="#fff"/></svg>`,
  skull: `<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="5" fill="#120a0d" stroke="#ff2e63"/><path d="M16 6c-5.5 0-9 3.6-9 8.5 0 3 1.5 5 3.5 6V24h11v-3.5c2-1 3.5-3 3.5-6C25 9.6 21.5 6 16 6z" fill="#f2f2f2"/><circle cx="12.5" cy="15" r="2.6" fill="#120a0d"/><circle cx="19.5" cy="15" r="2.6" fill="#120a0d"/><path d="M16 18l-1.5 2.5h3z" fill="#120a0d"/><path d="M13 24v2M16 24v2M19 24v2" stroke="#120a0d" stroke-width="1.2"/></svg>`,
  jobs: `<svg viewBox="0 0 32 32"><rect x="3" y="9" width="26" height="18" rx="2" fill="#1f6f56" stroke="#0d3b2c"/><path d="M12 9V6h8v3" fill="none" stroke="#0d3b2c" stroke-width="2"/><rect x="3" y="15" width="26" height="3" fill="#174f3f"/><rect x="14" y="13.5" width="4" height="6" rx="1" fill="#3dffc0"/></svg>`,
  lock: `<svg viewBox="0 0 32 32"><path d="M10 14v-4a6 6 0 0112 0v4" fill="none" stroke="#8a8f98" stroke-width="3"/><rect x="6" y="14" width="20" height="15" rx="2" fill="#f0b030" stroke="#9a6a0c"/><circle cx="16" cy="20" r="2.2" fill="#5a3d05"/><rect x="15" y="21" width="2" height="4" fill="#5a3d05"/></svg>`,
  unlock: `<svg viewBox="0 0 32 32"><path d="M10 14v-4a6 6 0 0111.5-2.3" fill="none" stroke="#8a8f98" stroke-width="3"/><rect x="6" y="14" width="20" height="15" rx="2" fill="#3cc05a" stroke="#1d6b2c"/><circle cx="16" cy="20" r="2.2" fill="#0d3b18"/><rect x="15" y="21" width="2" height="4" fill="#0d3b18"/></svg>`,
  txt: `<svg viewBox="0 0 32 32"><path d="M7 3h13l5 5v21H7z" fill="#fff" stroke="#7a8ca8"/><path d="M20 3v5h5" fill="#dde5f2" stroke="#7a8ca8"/><path d="M10 12h12M10 15h12M10 18h12M10 21h8" stroke="#9fb3d6"/></svg>`,
  exe: `<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" rx="1" fill="#fff" stroke="#5c6b86"/><rect x="4" y="6" width="24" height="4" fill="#2d5fd6"/><rect x="8" y="14" width="7" height="7" fill="#e0453a"/><rect x="17" y="14" width="7" height="7" fill="#3cc05a"/></svg>`,
  db: `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="8" rx="10" ry="4" fill="#8fb3e8" stroke="#2d5fa8"/><path d="M6 8v16c0 2.2 4.5 4 10 4s10-1.8 10-4V8" fill="#5f8fd8" stroke="#2d5fa8"/><path d="M6 14c0 2.2 4.5 4 10 4s10-1.8 10-4M6 20c0 2.2 4.5 4 10 4s10-1.8 10-4" fill="none" stroke="#bcd3f5"/></svg>`,
  img: `<svg viewBox="0 0 32 32"><rect x="4" y="5" width="24" height="22" fill="#fff" stroke="#7a8ca8"/><rect x="6" y="7" width="20" height="15" fill="#8ec6ff"/><path d="M6 22l6-7 4 4 3-3 7 6z" fill="#3c9b30"/><circle cx="21" cy="11" r="2" fill="#ffd84a"/></svg>`,
  zip: `<svg viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="22" rx="1" fill="#f6d36a" stroke="#9a7412"/><rect x="14" y="5" width="4" height="22" fill="#b0b5bd"/><path d="M14 8h4M14 11h4M14 14h4M14 17h4" stroke="#6b717a"/><rect x="13" y="19" width="6" height="5" fill="#6b717a"/></svg>`,
  vid: `<svg viewBox="0 0 32 32"><rect x="4" y="7" width="24" height="18" rx="2" fill="#2b2f3a" stroke="#111"/><path d="M4 11h24M4 21h24" stroke="#555" stroke-dasharray="2 2"/><path d="M13 12v8l7-4z" fill="#ff8c2e"/></svg>`,
  key: `<svg viewBox="0 0 32 32"><circle cx="10" cy="16" r="6" fill="#f0b030" stroke="#9a6a0c"/><circle cx="10" cy="16" r="2" fill="#fff"/><path d="M15 16h13v4M24 16v3" stroke="#9a6a0c" stroke-width="3"/></svg>`,
  run: `<svg viewBox="0 0 32 32"><rect x="3" y="7" width="26" height="18" rx="2" fill="#fff" stroke="#5c6b86"/><path d="M8 16h12M16 11l5 5-5 5" stroke="#2d5fd6" stroke-width="2.5" fill="none"/></svg>`,
  shield: `<svg viewBox="0 0 32 32"><path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#e0453a" stroke="#7d1810"/><path d="M16 6v20M7 15h18" stroke="#fff" stroke-width="2"/></svg>`,
  shieldok: `<svg viewBox="0 0 32 32"><path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#3cc05a" stroke="#1d6b2c"/><path d="M10 16l4 4 8-9" stroke="#fff" stroke-width="2.6" fill="none"/></svg>`,
  warn: `<svg viewBox="0 0 32 32"><path d="M16 3l14 25H2z" fill="#ffd23a" stroke="#9a6a0c"/><rect x="14.6" y="11" width="2.8" height="9" fill="#222"/><circle cx="16" cy="23.5" r="1.7" fill="#222"/></svg>`,
  error: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#e0453a" stroke="#7d1810"/><path d="M11 11l10 10M21 11L11 21" stroke="#fff" stroke-width="3"/></svg>`,
  info: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#fff" stroke="#2d5fd6" stroke-width="2"/><circle cx="16" cy="10" r="2" fill="#2d5fd6"/><rect x="14.3" y="14" width="3.4" height="10" fill="#2d5fd6"/></svg>`,
  speaker: `<svg viewBox="0 0 32 32"><path d="M5 12h6l7-6v20l-7-6H5z" fill="#fff" stroke="#333"/><path d="M22 11c2 3 2 7 0 10M25 8c4 5 4 11 0 16" stroke="#fff" stroke-width="2" fill="none"/></svg>`,
  mute: `<svg viewBox="0 0 32 32"><path d="M5 12h6l7-6v20l-7-6H5z" fill="#fff" stroke="#333"/><path d="M22 12l7 8M29 12l-7 8" stroke="#ff5a5a" stroke-width="2.4"/></svg>`,
  net: `<svg viewBox="0 0 32 32"><rect x="2" y="6" width="16" height="12" fill="#cfe3ff" stroke="#fff" stroke-width="2"/><rect x="14" y="14" width="16" height="12" fill="#cfe3ff" stroke="#fff" stroke-width="2"/></svg>`,
  netoff: `<svg viewBox="0 0 32 32"><rect x="2" y="6" width="16" height="12" fill="#cfe3ff" stroke="#fff" stroke-width="2"/><rect x="14" y="14" width="16" height="12" fill="#ff6a6a" stroke="#fff" stroke-width="2"/></svg>`,
  ghost: `<svg viewBox="0 0 32 32"><path d="M16 3C9.5 3 6 8 6 14v14l3.4-2.6L12.8 28l3.2-2.6 3.2 2.6 3.4-2.6L26 28V14c0-6-3.5-11-10-11z" fill="#fff"/><circle cx="12.5" cy="14" r="2.3" fill="#1b5e20"/><circle cx="19.5" cy="14" r="2.3" fill="#1b5e20"/></svg>`,
  cpu: `<svg viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="16" fill="#3a3f4a" stroke="#111"/><rect x="12" y="12" width="8" height="8" fill="#9aa3b5"/><path d="M11 4v4M16 4v4M21 4v4M11 24v4M16 24v4M21 24v4M4 11h4M4 16h4M4 21h4M24 11h4M24 16h4M24 21h4" stroke="#c9a227" stroke-width="1.6"/></svg>`,
  bank: `<svg viewBox="0 0 32 32"><path d="M3 12L16 4l13 8z" fill="#c9a227" stroke="#6b5410"/><path d="M6 13h3v11H6zM12 13h3v11h-3zM18 13h3v11h-3zM24 13h3v11h-3z" fill="#eee" stroke="#777"/><rect x="3" y="24" width="26" height="4" fill="#c9a227" stroke="#6b5410"/></svg>`,
};
let _icn = 0;
const icon = (n) => { const k = ++_icn; return (ICONS[n] || ICONS.exe).replace(/id="(\w+)"/g, `id="$1_${k}"`).replace(/url\(#(\w+)\)/g, `url(#$1_${k})`); };
const fileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  return icon({ txt: 'txt', log: 'txt', md: 'txt', cfg: 'txt', eml: 'mail', exe: 'exe', db: 'db', sql: 'db', xls: 'db', csv: 'db', pdf: 'txt', jpg: 'img', png: 'img', zip: 'zip', rar: 'zip', mp4: 'vid', avi: 'vid', key: 'key', pem: 'key', dat: 'db', bak: 'zip' }[ext] || 'exe');
};
ICONS.avatar = `<svg viewBox="0 0 56 56" width="100%" height="100%"><defs><linearGradient id="av1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#d4571a"/></linearGradient></defs><rect width="56" height="56" fill="url(#av1)"/><path d="M28 9c-9 0-15 7-15 16 0 5 1 8 3 11-3 2-6 5-7 11h38c-1-6-4-9-7-11 2-3 3-6 3-11 0-9-6-16-15-16z" fill="#14161c"/><path d="M19 28c0-6 4-10 9-10s9 4 9 10c0 4-4 8-9 8s-9-4-9-8z" fill="#050608"/><circle cx="24" cy="28" r="1.8" fill="#33ff77"/><circle cx="32" cy="28" r="1.8" fill="#33ff77"/></svg>`;

/* ---------- SOUND (WebAudio synth, no files) ---------- */
const Sound = {
  ctx: null, master: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  on() { return this.ctx && S && S.sound; },
  tone(f, d = 0.1, type = 'square', v = 0.05, t0 = 0, slide = 0) {
    if (!this.on()) return;
    const c = this.ctx, t = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.05);
  },
  noise(d = 0.2, v = 0.05, t0 = 0, hp = 800) {
    if (!this.on()) return;
    const c = this.ctx, len = Math.floor(c.sampleRate * d), b = c.createBuffer(1, len, c.sampleRate), data = b.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp; s.buffer = b; g.gain.value = v;
    s.connect(f); f.connect(g); g.connect(this.master); s.start(c.currentTime + t0);
  },
  sfx(n) {
    if (!this.on()) return;
    const T = (...a) => this.tone(...a);
    switch (n) {
      case 'click': T(1800, .02, 'square', .015); break;
      case 'key': T(rnd(900, 1300), .015, 'square', .008); break;
      case 'open': T(520, .06, 'sine', .05); T(780, .08, 'sine', .04, .05); break;
      case 'close': T(600, .05, 'sine', .04); T(400, .07, 'sine', .03, .04); break;
      case 'min': T(700, .05, 'sine', .03, 0, -300); break;
      case 'ding': T(880, .5, 'sine', .07); T(1320, .45, 'sine', .03, .01); break;
      case 'error': T(440, .22, 'triangle', .08); T(330, .35, 'triangle', .07, .12); break;
      case 'balloon': T(1250, .07, 'sine', .05); T(1650, .1, 'sine', .04, .06); break;
      case 'mail': [784, 988, 1175].forEach((f, i) => T(f, .18, 'sine', .05, i * .09)); break;
      case 'ok': [523, 659, 784, 1046].forEach((f, i) => T(f, .14, 'square', .03, i * .07)); break;
      case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => T(f, .2, 'square', .035, i * .1)); break;
      case 'fail': [392, 330, 262, 196].forEach((f, i) => T(f, .2, 'sawtooth', .035, i * .11)); break;
      case 'beep': T(1400, .06, 'square', .03); break;
      case 'trace': T(980, .05, 'sine', .06); break;
      case 'alarm': for (let i = 0; i < 4; i++) { T(880, .18, 'sawtooth', .04, i * .4, 300); T(1180, .18, 'sawtooth', .04, i * .4 + .2, -300); } break;
      case 'hit': this.noise(.08, .08, 0, 1500); T(200, .08, 'square', .04, 0, -120); break;
      case 'zap': T(1500, .1, 'sawtooth', .03, 0, -1200); break;
      case 'coin': T(988, .07, 'square', .04); T(1318, .2, 'square', .04, .07); break;
      case 'type': T(rnd(2200, 2600), .01, 'square', .006); break;
      case 'boot':
        // original startup swell: soft pad chord + bell motif
        [[262, 0], [330, 0], [392, 0], [523, .35], [494, .7], [659, 1.0], [784, 1.35]].forEach(([f, t]) => {
          this.tone(f, 1.9 - t * .6, 'sine', .045, t); this.tone(f * 2, 1.2 - t * .4, 'triangle', .012, t + .02);
        }); break;
      case 'logout': [784, 659, 523, 392].forEach((f, i) => T(f, .35, 'sine', .045, i * .18)); break;
      case 'siren': for (let i = 0; i < 6; i++) T(600, .5, 'sawtooth', .04, i * .5, 500); break;
    }
  }
};

/* ---------- MUSIC (procedural chiptune for Media Player) ---------- */
const Music = {
  timer: null, track: -1, step: 0, analyser: null,
  tracks: [
    { name: 'Neon Uplink', artist: 'gh0st.wav', bpm: 112, root: 45, scale: [0, 3, 5, 7, 10], bass: [0, 0, 7, 5, 0, 0, 10, 7], arp: [0, 2, 4, 2, 3, 4, 2, 1] },
    { name: 'Midnight Packet', artist: 'NullByte', bpm: 96, root: 40, scale: [0, 2, 3, 7, 8], bass: [0, 0, 0, 3, 5, 5, 3, 2], arp: [0, 1, 2, 4, 2, 1, 3, 0] },
    { name: 'Firewall Runner', artist: 'xXcr4ckXx', bpm: 140, root: 43, scale: [0, 3, 5, 6, 7, 10], bass: [0, 7, 0, 7, 5, 5, 3, 3], arp: [0, 3, 5, 3, 4, 2, 5, 1] },
  ],
  mtof: m => 440 * Math.pow(2, (m - 69) / 12),
  play(i) {
    Sound.init(); this.stop(); if (!Sound.ctx) return;
    this.track = i; this.step = 0;
    if (!this.analyser) { this.analyser = Sound.ctx.createAnalyser(); this.analyser.fftSize = 128; this.out = Sound.ctx.createGain(); this.out.gain.value = .6; this.out.connect(this.analyser); this.analyser.connect(Sound.master); }
    const tr = this.tracks[i], dur = 60 / tr.bpm / 2;
    this.timer = setInterval(() => {
      if (!S.sound) return;
      const s = this.step++, c = Sound.ctx, t = c.currentTime;
      const note = (m, d, type, v) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = this.mtof(m); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(this.out); o.start(t); o.stop(t + d + .02); };
      const bar = Math.floor(s / 8) % 4, chordShift = [0, 0, -4, -2][bar];
      note(tr.root + chordShift + tr.bass[s % 8], dur * .9, 'sawtooth', .05);
      const deg = tr.arp[s % 8], sc = tr.scale;
      note(tr.root + 24 + chordShift + sc[deg % sc.length] + (deg >= sc.length ? 12 : 0), dur * .7, 'square', .025);
      if (s % 4 === 0) { const b = c.createBufferSource(), len = c.sampleRate * .08, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len); b.buffer = buf; const g = c.createGain(); g.gain.value = s % 8 === 0 ? .09 : .04; b.connect(g); g.connect(this.out); b.start(t); }
    }, dur * 1000);
  },
  stop() { clearInterval(this.timer); this.timer = null; },
};

/* ---------- STATE & SAVE ---------- */
const SAVE_KEY = 'zeroday_xp_save_v1';
const RANKS = [[0, 'Script-Kiddie'], [60, 'Newbie'], [160, 'Hacker'], [340, 'Elite'], [600, 'Phantom'], [1000, 'Legende']];
function defaultState() {
  return {
    alias: 'Ghost', money: 150, rep: 0, heat: 0,
    hw: { cpu: 1, ram: 1, net: 1 }, proxies: 0,
    tools: { web: true },
    story: 0, storyDone: false, ending: null, mission: null,
    mails: [], files: [], notes: 'Notizen\n=======\n\n- Nyx sagt: immer Logs löschen, bevor ich trenne!\n- help in der Konsole zeigt alle Befehle.\n',
    hosts: {}, contracts: [], activeContract: null, news: [], soldFiles: 0,
    stats: { hacks: 0, earned: 0, traced: 0, played: 0, minis: 0, minisWon: 0, defended: 0 },
    wallpaper: 'bliss', sound: true, flags: {}, seq: 1, mailSeq: 1, clock: 22 * 60 + 13,
  };
}
let S = defaultState();
const Save = {
  has() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } },
  load() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d && d.stats) { S = Object.assign(defaultState(), d); return true; } } catch (e) { } return false; },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } },
  wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } },
};
setInterval(() => { if (Game.running) Save.write(); }, 8000);

/* ---------- BUS ---------- */
const Bus = {
  m: {}, on(e, f) { (this.m[e] = this.m[e] || []).push(f); }, emit(e, d) { (this.m[e] || []).forEach(f => { try { f(d); } catch (err) { console.error(err); } }); }
};

/* ---------- BALLOONS (tray notifications) ---------- */
function balloon(title, text, opts = {}) {
  const b = h(`<div class="balloon ${opts.kind || ''}"><b>${icon(opts.icon || 'info')}${esc(title)}</b><div>${text}</div><span class="bx" aria-label="Schließen">✕</span></div>`);
  $('#balloons').prepend(b);
  Sound.sfx(opts.sound || 'balloon');
  const kill = () => { b.style.transition = 'opacity .25s'; b.style.opacity = 0; setTimeout(() => b.remove(), 260); };
  b.querySelector('.bx').onclick = e => { e.stopPropagation(); kill(); };
  b.onclick = () => { kill(); opts.onClick && opts.onClick(); };
  setTimeout(kill, opts.ms || 6500);
  while ($('#balloons').children.length > (isSmall() ? 1 : 3)) $('#balloons').lastElementChild.remove();
}

/* ---------- ECONOMY HELPERS ---------- */
const Eco = {
  rank() { let r = RANKS[0][1]; for (const [v, n] of RANKS) if (S.rep >= v) r = n; return r; },
  nextRank() { for (const [v] of RANKS) if (S.rep < v) return v; return null; },
  addMoney(n, why) { S.money += n; if (n > 0) S.stats.earned += n; UI.update(); if (n > 0) { Sound.sfx('coin'); UI.flashMoney(); } },
  addRep(n) { const before = this.rank(); S.rep += n; UI.update(); const after = this.rank(); if (after !== before) { balloon('Neuer Rang: ' + after, 'Dein Ruf in der Szene wächst. Neue Aufträge auf <b>jobs.onion</b>.', { icon: 'ghost', sound: 'win', ms: 8000 }); News.add(`Hacker-Szene: Alias „${esc(S.alias)}" steigt zum ${after} auf`, 'Szene'); } },
  addHeat(n, why) {
    S.heat = clamp(S.heat + n, 0, 100); UI.update();
    if (n > 0 && why) balloon('Fahndungslevel +' + Math.round(n) + '%', why, { kind: S.heat > 70 ? 'danger' : 'warn', icon: 'shield', sound: 'error' });
    if (S.heat >= 100) Game.busted();
  },
};

/* ---------- NEWS ---------- */
const News = {
  add(title, cat = 'Netz', breaking = false) {
    S.news.unshift({ t: title, c: cat, b: breaking, time: Game.clockStr() });
    S.news = S.news.slice(0, 18);
    Bus.emit('news');
  }
};
