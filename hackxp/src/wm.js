/* =====================================================================
   WINDOW MANAGER — windows, taskbar, start menu, desktop icons, tray
===================================================================== */
const WM = {
  wins: {}, z: 100, cascade: 0,
  create(o) {
    if (this.wins[o.id]) { this.focus(o.id); this.restore(o.id); return this.wins[o.id]; }
    const W = o.w || 560, H = o.h || 400;
    const desk = $('#desk').getBoundingClientRect();
    const w = Math.min(W, desk.width - 8), hh = Math.min(H, desk.height - 8);
    const off = (this.cascade++ % 6) * 24;
    const x = o.x ?? clamp((desk.width - w) / 2 - 60 + off, 4, desk.width - w - 4);
    const y = o.y ?? clamp((desk.height - hh) / 2 - 40 + off, 4, desk.height - hh - 4);
    const el = h(`<div class="win" role="dialog" aria-label="${esc(o.title)}">
      <div class="tb"><span class="tb-ic">${icon(o.icon)}</span><span class="tb-t">${esc(o.title)}</span>
        ${o.noMin ? '' : '<button class="tb-b b-min" type="button" aria-label="Minimieren"><svg viewBox="0 0 11 11"><rect x="2" y="7" width="6" height="2.2" fill="#fff"/></svg></button>'}
        ${o.noMax ? '' : '<button class="tb-b b-max" type="button" aria-label="Maximieren"><svg viewBox="0 0 11 11"><rect x="1.5" y="1.5" width="8" height="8" fill="none" stroke="#fff" stroke-width="1.6"/><rect x="1.5" y="1.5" width="8" height="2.2" fill="#fff"/></svg></button>'}
        ${o.noClose ? '' : '<button class="tb-b tb-x b-close" type="button" aria-label="Schließen"><svg viewBox="0 0 11 11"><path d="M2 2l7 7M9 2l-7 7" stroke="#fff" stroke-width="1.9"/></svg></button>'}
      </div>
      <div class="wc"></div>${o.noResize ? '' : '<div class="rz"></div>'}</div>`);
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' });
    $('#desk').appendChild(el);
    const win = { id: o.id, el, body: el.querySelector('.wc'), o, title: o.title };
    this.wins[o.id] = win;
    // taskbar button
    if (!o.noTask) {
      win.tbtn = h(`<button class="tbtn" type="button">${icon(o.icon)}<span>${esc(o.title)}</span></button>`);
      win.tbtn.onclick = () => {
        if (el.classList.contains('min')) { this.restore(o.id); this.focus(o.id); }
        else if (win.tbtn.classList.contains('active')) this.minimize(o.id);
        else this.focus(o.id);
      };
      $('#tasks').appendChild(win.tbtn);
    }
    el.addEventListener('pointerdown', () => this.focus(o.id), true);
    const q = s => el.querySelector(s);
    q('.b-close') && (q('.b-close').onclick = e => { e.stopPropagation(); this.close(o.id); });
    q('.b-min') && (q('.b-min').onclick = e => { e.stopPropagation(); this.minimize(o.id); });
    q('.b-max') && (q('.b-max').onclick = e => { e.stopPropagation(); this.toggleMax(o.id); });
    q('.tb').addEventListener('dblclick', () => !o.noMax && this.toggleMax(o.id));
    this.drag(win); if (!o.noResize) this.resize(win);
    if (isSmall() && !o.keepSize) el.classList.add('maxed');
    if (o.render) o.render(win.body, win);
    this.focus(o.id);
    Sound.sfx('open');
    return win;
  },
  setTitle(id, t) { const w = this.wins[id]; if (!w) return; w.el.querySelector('.tb-t').textContent = t; if (w.tbtn) w.tbtn.querySelector('span').textContent = t; },
  focus(id) {
    const w = this.wins[id]; if (!w) return;
    Object.values(this.wins).forEach(x => { x.el.classList.toggle('inactive', x !== w); x.tbtn && x.tbtn.classList.toggle('active', x === w && !x.el.classList.contains('min')); });
    if (w.el.style.zIndex != this.z) w.el.style.zIndex = ++this.z;
    w.tbtn && w.tbtn.classList.remove('flash');
    w.o.onFocus && w.o.onFocus();
  },
  close(id) {
    const w = this.wins[id]; if (!w) return;
    if (w.o.onClose && w.o.onClose() === false) return;
    delete this.wins[id];
    w.el.classList.add('closing'); w.tbtn && w.tbtn.remove();
    setTimeout(() => w.el.remove(), 150);
    Sound.sfx('close');
    const top = Object.values(this.wins).filter(x => !x.el.classList.contains('min')).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
    if (top) this.focus(top.id);
  },
  minimize(id) { const w = this.wins[id]; if (!w) return; w.el.classList.add('min'); w.tbtn && w.tbtn.classList.remove('active'); Sound.sfx('min'); },
  restore(id) { const w = this.wins[id]; if (!w) return; w.el.classList.remove('min'); },
  toggleMax(id) { const w = this.wins[id]; if (!w) return; w.el.classList.toggle('maxed'); w.o.onResize && w.o.onResize(); },
  flash(id) { const w = this.wins[id]; if (w && w.tbtn && !w.tbtn.classList.contains('active')) w.tbtn.classList.add('flash'); },
  drag(win) {
    const tb = win.el.querySelector('.tb');
    tb.addEventListener('pointerdown', e => {
      if (e.target.closest('.tb-b') || win.el.classList.contains('maxed')) return;
      const r = win.el.getBoundingClientRect(), d = $('#desk').getBoundingClientRect();
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      tb.setPointerCapture(e.pointerId);
      const mv = ev => { win.el.style.left = clamp(ev.clientX - d.left - ox, -r.width + 80, d.width - 60) + 'px'; win.el.style.top = clamp(ev.clientY - d.top - oy, 0, d.height - 30) + 'px'; };
      const up = () => { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); };
      tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
    });
  },
  resize(win) {
    const rz = win.el.querySelector('.rz');
    rz.addEventListener('pointerdown', e => {
      e.stopPropagation(); rz.setPointerCapture(e.pointerId);
      const r = win.el.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
      const mv = ev => { win.el.style.width = Math.max(260, r.width + ev.clientX - sx) + 'px'; win.el.style.height = Math.max(140, r.height + ev.clientY - sy) + 'px'; win.o.onResize && win.o.onResize(); };
      const up = () => { rz.removeEventListener('pointermove', mv); rz.removeEventListener('pointerup', up); };
      rz.addEventListener('pointermove', mv); rz.addEventListener('pointerup', up);
    });
  },
  closeAll() { Object.keys(this.wins).forEach(id => { const w = this.wins[id]; w.el.remove(); w.tbtn && w.tbtn.remove(); delete this.wins[id]; }); },
};

/* ---------- message box ---------- */
function msgbox(title, text, { icon: ic = 'info', buttons = ['OK'], id } = {}) {
  return new Promise(res => {
    const wid = id || 'msg' + (S.seq++);
    WM.create({
      id: wid, title, icon: ic, w: 380, h: 170, noMax: true, noMin: true, noResize: true, keepSize: true,
      onClose: () => res(null),
      render(b) {
        b.innerHTML = `<div class="dlg"><div class="dlg-row">${icon(ic)}<div style="padding-top:4px">${text}</div></div><div class="dlg-btns"></div></div>`;
        buttons.forEach((t, i) => { const bt = h(`<button class="xbtn ${i === 0 ? 'primary' : ''}" type="button">${esc(t)}</button>`); bt.onclick = () => { WM.wins[wid].o.onClose = null; WM.close(wid); res(t); }; b.querySelector('.dlg-btns').appendChild(bt); });
        setTimeout(() => b.querySelector('.xbtn')?.focus(), 50);
      }
    });
    Sound.sfx(ic === 'error' ? 'error' : 'ding');
  });
}

/* ---------- DESKTOP ---------- */
const Desktop = {
  icons: [
    ['terminal', 'Hack-Konsole', 'terminal'],
    ['mail', 'Posteingang', 'mail'],
    ['browser', 'NetXplorer', 'globe'],
    ['netmap', 'Netzwerk-karte', 'network'],
    ['explorer', 'Eigene Dateien', 'docs'],
    ['computer', 'Arbeitsplatz', 'computer'],
    ['notepad', 'Editor', 'notepad'],
    ['taskmgr', 'Task-Manager', 'taskmgr'],
    ['media', 'Media Player', 'media'],
    ['market', 'DarkMarket', 'skull'],
    ['help', 'So wird gespielt', 'help'],
    ['trash', 'Papierkorb', 'trashfull'],
  ],
  render() {
    const box = $('#icons'); box.innerHTML = '';
    this.icons.forEach(([app, label, ic]) => {
      const b = h(`<button class="dicon" type="button" data-app="${app}">${icon(ic)}<span>${label}</span></button>`);
      let last = 0;
      b.addEventListener('click', e => {
        $$('.dicon.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
        const now = Date.now();
        if (isTouch() || now - last < 420) { Apps.open(app); last = 0; } else last = now;
        e.stopPropagation();
      });
      b.addEventListener('keydown', e => { if (e.key === 'Enter') Apps.open(app); });
      box.appendChild(b);
    });
    this.badges();
  },
  badges() {
    const m = $('.dicon[data-app="mail"]'); if (!m) return;
    m.querySelector('.badge')?.remove();
    const n = S.mails.filter(x => !x.read).length;
    if (n) m.appendChild(h(`<span class="badge">${n}</span>`));
  },
  init() {
    this.render();
    $('#desk').addEventListener('click', e => { if (e.target.id === 'desk' || e.target.id === 'icons' || e.target.id === 'wpcanvas') $$('.dicon.sel').forEach(x => x.classList.remove('sel')); Start.close(); Ctx.close(); });
    $('#desk').addEventListener('contextmenu', e => {
      if (e.target.closest('.win')) return;
      e.preventDefault();
      Ctx.open(e.clientX, e.clientY, [
        ['Aktualisieren', () => { this.render(); Sound.sfx('click'); }],
        ['Neue Hack-Konsole', () => Apps.open('terminal')],
        '-',
        ['Hintergrund wechseln', () => Apps.open('settings')],
        ['Eigenschaften', () => Apps.open('settings')],
      ]);
    });
  },
};

const Ctx = {
  el: null,
  open(x, y, items) {
    this.close();
    const m = h('<div class="ctx"></div>');
    items.forEach(it => { if (it === '-') m.appendChild(h('<hr>')); else { const b = h(`<button type="button">${esc(it[0])}</button>`); b.onclick = () => { this.close(); it[1](); }; m.appendChild(b); } });
    $('#os').appendChild(m);
    const r = m.getBoundingClientRect();
    m.style.left = Math.min(x, innerWidth - r.width - 4) + 'px'; m.style.top = Math.min(y, innerHeight - r.height - 34) + 'px';
    this.el = m;
  },
  close() { this.el && this.el.remove(); this.el = null; },
};

/* ---------- START MENU ---------- */
const Start = {
  init() {
    $('#startbtn').innerHTML = `${icon('ghost')}<span>start</span>`;
    $('#startbtn').onclick = e => { e.stopPropagation(); this.toggle(); Sound.sfx('click'); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { this.close(); Ctx.close(); } });
  },
  build() {
    const L = [['terminal', 'Hack-Konsole', 'Befehle, Exploits, Root', 'terminal'], ['browser', 'NetXplorer', 'Internet & Darknet', 'globe'], ['mail', 'Posteingang', 'Aufträge lesen', 'mail']];
    const L2 = [['netmap', 'Netzwerkkarte', 'network'], ['taskmgr', 'Task-Manager', 'taskmgr'], ['notepad', 'Editor', 'notepad'], ['media', 'Media Player', 'media']];
    const R = [['explorer', 'Eigene Dateien', 'docs'], ['computer', 'Arbeitsplatz', 'computer'], ['market', 'DarkMarket', 'skull'], ['jobs', 'Jobbörse', 'jobs'], ['settings', 'Systemsteuerung', 'settings'], ['help', 'Hilfe und Support', 'help'], ['run', 'Ausführen…', 'run']];
    $('#startmenu').innerHTML = `
      <div class="sm-head"><span class="avatar">${icon('avatar')}</span><span>${esc(S.alias)}</span></div>
      <div class="sm-cols"><div class="sm-left">
        ${L.map(([a, t, s, i]) => `<button class="sm-item" data-app="${a}" type="button">${icon(i)}<span><b>${t}</b><small>${s}</small></span></button>`).join('')}
        <div class="sm-sep"></div>
        ${L2.map(([a, t, i]) => `<button class="sm-item" data-app="${a}" type="button">${icon(i)}<span>${t}</span></button>`).join('')}
      </div><div class="sm-right">
        ${R.map(([a, t, i]) => `<button class="sm-item" data-app="${a}" type="button">${icon(i)}<span>${t}</span></button>`).join('')}
      </div></div>
      <div class="sm-foot"><button type="button" data-act="logout"><i class="i-lo">⇦</i>Abmelden</button><button type="button" data-act="off"><i class="i-off">⏻</i>Ausschalten</button></div>`;
    $$('#startmenu [data-app]').forEach(b => b.onclick = () => { this.close(); Apps.open(b.dataset.app); });
    $('#startmenu [data-act="logout"]').onclick = () => { this.close(); Game.logout(); };
    $('#startmenu [data-act="off"]').onclick = () => { this.close(); Game.shutdown(); };
  },
  toggle() { $('#startmenu').classList.contains('on') ? this.close() : this.openM(); },
  openM() { this.build(); $('#startmenu').classList.add('on'); $('#startbtn').classList.add('on'); },
  close() { $('#startmenu').classList.remove('on'); $('#startbtn').classList.remove('on'); },
};

/* ---------- UI (gadget, tray, trace hud) ---------- */
const UI = {
  init() {
    $('#tray-vol').onclick = () => { S.sound = !S.sound; Sound.init(); this.tray(); if (!S.sound) Music.stop(); };
    $('#tray-net').onclick = () => Apps.open('netmap');
    $('#tray-sec').onclick = () => balloon('Sicherheitscenter', `Fahndungslevel: <b>${Math.round(S.heat)}%</b><br>Proxys aktiv: <b>${Hack.proxyCount()}</b><br>${S.heat > 60 ? 'Tauch unter! Heat sinkt langsam, wenn du offline bist.' : 'Alles ruhig. Noch.'}`, { icon: S.heat > 60 ? 'shield' : 'shieldok' });
    this.tray();
    setInterval(() => this.clock(), 1000); this.clock();
  },
  tray() {
    $('#tray-vol').innerHTML = icon(S.sound ? 'speaker' : 'mute');
    $('#tray-net').innerHTML = icon(Hack.conn ? 'netoff' : 'net');
    $('#tray-sec').innerHTML = icon(S.heat > 60 ? 'shield' : 'shieldok');
  },
  clock() { $('#clock').textContent = Game.clockStr(); },
  update() {
    $('#g-money').textContent = cr(S.money);
    $('#g-rank').textContent = Eco.rank();
    const nx = Eco.nextRank(), prev = [...RANKS].reverse().find(r => S.rep >= r[0])[0];
    $('#g-reptxt').textContent = S.rep + (nx ? ' / ' + nx : ' (max)');
    $('#g-rep i').style.width = (nx ? (S.rep - prev) / (nx - prev) * 100 : 100) + '%';
    $('#g-heattxt').textContent = Math.round(S.heat) + '%';
    $('#g-heat i').style.width = S.heat + '%';
    $('#g-obj span').innerHTML = Story.objectiveText();
    this.tray(); Desktop.badges();
    Bus.emit('ui');
  },
  flashMoney() { const m = $('#g-money'); m.animate([{ color: '#fff', transform: 'scale(1.25)' }, { color: '#7dff9b', transform: 'scale(1)' }], { duration: 500 }); },
  trace(p, on) {
    $('#tracehud').classList.toggle('on', on);
    $('#tray-trace').classList.toggle('on', on);
    $('#tracehud i').style.width = p + '%';
    $('#tracehud b').textContent = p.toFixed(1) + '%';
    $('#tray-trace').textContent = 'TRACE ' + Math.floor(p) + '%';
    const v = $('#tracevig');
    v.style.opacity = on ? clamp((p - 55) / 45, 0, 1) : 0;
    v.classList.toggle('on', on && p > 75);
  },
};
