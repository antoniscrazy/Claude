'use strict';
// ====================================================================
// Moki Studio: Spiele bauen (Baukasten oder Code), speichern, veröffentlichen
// ====================================================================
const CFG = window.MOKI_CFG;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const q = s => JSON.stringify(String(s));
const num = v => (isFinite(+v) ? +v : 0);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>', link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  game: '<path d="M6 12h4M8 10v4"/><path d="M15 13h.01M18 11h.01"/><rect width="20" height="12" x="2" y="6" rx="2"/>', blocks: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>', cloud: '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9M8 16l4-4 4 4"/>',
  down: '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 21v-9M8 17l4 4 4-4"/>', target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>', ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', mouse: '<rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/>', pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'
};
const ic = (n, c) => `<svg class="i${c ? ' ' + c : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

// ---------------- Zustand ----------------
const App = { name: LS.get('moki-studio-name', ''), token: '', mine: null, g: null, view: 'dash', tab: 'builder', cons: [], loadErr: '' };
function getToken() {
  let t = LS.get('moki-studio-key', '');
  if (typeof t !== 'string' || t.length < 16) {
    const a = new Uint8Array(24); crypto.getRandomValues(a);
    t = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
    LS.set('moki-studio-key', t);
  }
  return t;
}
App.token = getToken();

// ---------------- Datenbank (Supabase, nur über geprüfte Funktionen) ----------------
async function rpc(fn, args) {
  let r;
  try {
    r = await fetch(CFG.sbUrl + '/rest/v1/rpc/' + fn, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.sbKey, Authorization: 'Bearer ' + CFG.sbKey }, body: JSON.stringify(args || {})
    });
  } catch (e) { throw new Error('Keine Verbindung. Prüfe dein Internet.'); }
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
  if (!r.ok) throw new Error((j && j.message) || ('Fehler ' + r.status));
  return j;
}

// ---------------- Kleine UI-Helfer ----------------
function toast(msg, kind, action) {
  const el = document.createElement('div'); el.className = 'toast ' + (kind || '');
  el.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button type="button">${esc(action.label)}</button>` : '');
  if (action) el.querySelector('button').onclick = () => { action.fn(); el.remove(); };
  $('#toasts').appendChild(el); setTimeout(() => el.remove(), action ? 9000 : 3800);
}
function modal(html, opts) {
  opts = opts || {};
  const m = document.createElement('div'); m.className = 'mdl';
  m.innerHTML = `<div class="mbox${opts.wide ? ' wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { m.remove(); removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); };
  const onKey = e => { if (e.key === 'Escape' && !opts.sticky) close(); };
  addEventListener('keydown', onKey);
  if (!opts.sticky) m.addEventListener('mousedown', e => { if (e.target === m) close(); });
  $('#modal-root').appendChild(m);
  m.close = close;
  const f = m.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 30);
  return m;
}
function confirmBox(title, text, okLabel, danger) {
  return new Promise(res => {
    const m = modal(`<h3>${esc(title)}</h3><p class="lead">${esc(text)}</p><div class="mfoot"><button class="btn ghost" data-a="no" type="button">Abbrechen</button><button class="btn ${danger ? 'danger warn' : 'pri'}" data-a="ok" type="button">${esc(okLabel)}</button></div>`, { onClose: () => res(false) });
    m.querySelector('[data-a=no]').onclick = () => m.close();
    m.querySelector('[data-a=ok]').onclick = () => { res(true); m.remove(); };
  });
}
function copyText(t) {
  const done = () => toast('Kopiert', 'ok');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => fallbackCopy(t, done));
  else fallbackCopy(t, done);
}
function fallbackCopy(t, done) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Kopieren nicht möglich', 'bad'); } a.remove(); }
const gameUrl = slug => CFG.mokiUrl.replace(/\/?$/, '/') + '#/spiel/' + slug;

// ====================================================================
// Baukasten-Modell und Code-Erzeugung
// ====================================================================
let _uid = 0; const uid = p => p + Date.now().toString(36).slice(-4) + (++_uid).toString(36);
const SHAPES = [['circle', 'Kreis'], ['square', 'Quadrat'], ['triangle', 'Dreieck'], ['diamond', 'Raute'], ['star', 'Stern'], ['heart', 'Herz']];
const CONTROLS = [['none', 'Keine'], ['keys', 'Tasten und Finger'], ['mouse', 'Maus und Finger']];
const AXES = [['xy', 'Alle Richtungen'], ['x', 'Nur links/rechts'], ['y', 'Nur hoch/runter']];
const MOTIONS = [['none', 'Bleibt stehen'], ['fall', 'Fällt nach unten'], ['rise', 'Steigt nach oben'], ['left', 'Fliegt nach links'], ['right', 'Fliegt nach rechts'], ['bounce', 'Springt umher'], ['follow', 'Verfolgt den Spieler']];
const KEYS = [['SPACE', 'Leertaste'], ['LEFT', 'Pfeil links'], ['RIGHT', 'Pfeil rechts'], ['UP', 'Pfeil hoch'], ['DOWN', 'Pfeil runter'], ['ENTER', 'Enter']].concat('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => [c, 'Taste ' + c]));
const EVENTS = [['start', 'Das Spiel startet'], ['touch', 'Zwei Figuren berühren sich'], ['key', 'Eine Taste wird gedrückt'], ['edge', 'Eine Figur verlässt den Bildschirm'], ['click', 'Eine Figur wird angetippt'], ['every', 'Alle paar Sekunden'], ['score', 'Die Punkte erreichen eine Zahl']];
const ACTIONS = [['score', 'Punkte ändern'], ['life', 'Leben ändern'], ['respawn', 'Figur neu oben starten'], ['place', 'Figur an einen Ort setzen'], ['destroy', 'Figur entfernen'], ['spawn', 'Neue Figur erzeugen'], ['speed', 'Figur schneller oder langsamer'], ['say', 'Nachricht zeigen'], ['win', 'Spiel gewonnen'], ['lose', 'Spiel verloren']];

const newModel = () => ({ v: 1, settings: { bg: '#0d1240', lives: 0, time: 0, timeMode: 'win', showScore: true }, sprites: [], rules: [] });
const SPR = {
  player: { name: 'Spieler', shape: 'circle', color: '#00e5a8', size: 56, x: 50, y: 86, control: 'keys', axis: 'x', motion: 'none', speed: 420 },
  item: { name: 'Stern', shape: 'star', color: '#ffd23f', size: 40, x: 30, y: -5, control: 'none', axis: 'xy', motion: 'fall', speed: 220 },
  enemy: { name: 'Gegner', shape: 'triangle', color: '#ff4d6d', size: 46, x: 65, y: -5, control: 'none', axis: 'xy', motion: 'fall', speed: 260 },
  bouncer: { name: 'Springer', shape: 'diamond', color: '#4cc9f0', size: 50, x: 50, y: 40, control: 'none', axis: 'xy', motion: 'bounce', speed: 220 },
  blank: { name: 'Figur', shape: 'square', color: '#ffffff', size: 50, x: 50, y: 50, control: 'none', axis: 'xy', motion: 'none', speed: 200 }
};
function addSprite(M, kind) {
  const b = Object.assign({}, SPR[kind] || SPR.blank); b.id = uid('s');
  let n = b.name, i = 2; while (M.sprites.some(s => s.name === n)) n = b.name + ' ' + i++;
  b.name = n; M.sprites.push(b); return b;
}
const TEMPLATES = {
  empty: { icon: 'blocks', name: 'Leeres Spiel', desc: 'Starte bei null und baue alles selbst im Baukasten.', title: 'Mein Spiel', mk() { return newModel(); } },
  catch: {
    icon: 'target', name: 'Fang-Spiel', desc: 'Fange fallende Sterne mit dem Korb, aber weiche den Steinen aus.', title: 'Sternenfänger',
    mk() {
      const M = newModel(); M.settings.lives = 3;
      const k = addSprite(M, 'player'); k.name = 'Korb'; k.shape = 'square'; k.size = 70; k.y = 90; k.speed = 480;
      const s = addSprite(M, 'item'); const r = addSprite(M, 'enemy'); r.name = 'Stein'; r.shape = 'circle'; r.color = '#ff6b81';
      M.rules.push({ id: uid('r'), when: { type: 'touch', a: k.id, b: s.id }, then: [{ type: 'score', n: 1 }, { type: 'respawn', target: '@b' }] });
      M.rules.push({ id: uid('r'), when: { type: 'touch', a: k.id, b: r.id }, then: [{ type: 'life', n: -1 }, { type: 'respawn', target: '@b' }] });
      M.rules.push({ id: uid('r'), when: { type: 'every', n: 2 }, then: [{ type: 'spawn', sprite: s.id }] });
      M.rules.push({ id: uid('r'), when: { type: 'score', n: 12 }, then: [{ type: 'win', text: 'Geschafft!' }] });
      return M;
    }
  },
  dodge: {
    icon: 'bolt', name: 'Ausweichen', desc: 'Überlebe 30 Sekunden und weiche den Gegnern aus.', title: 'Ausweich-Meister',
    mk() {
      const M = newModel(); M.settings.lives = 3; M.settings.time = 30; M.settings.timeMode = 'win'; M.settings.showScore = false;
      const p = addSprite(M, 'player'); p.axis = 'xy'; p.y = 50; p.speed = 360; p.shape = 'circle';
      const e = addSprite(M, 'enemy'); e.name = 'Fels'; e.shape = 'circle'; e.color = '#ff9f1c'; e.size = 50;
      M.rules.push({ id: uid('r'), when: { type: 'touch', a: p.id, b: e.id }, then: [{ type: 'life', n: -1 }, { type: 'respawn', target: '@b' }] });
      M.rules.push({ id: uid('r'), when: { type: 'every', n: 1.2 }, then: [{ type: 'spawn', sprite: e.id }] });
      return M;
    }
  },
  click: {
    icon: 'mouse', name: 'Klick-Jagd', desc: 'Tippe das flinke Ziel an, bevor die Zeit abläuft.', title: 'Klick-Jagd',
    mk() {
      const M = newModel(); M.settings.time = 20; M.settings.timeMode = 'lose';
      const z = addSprite(M, 'bouncer'); z.name = 'Ziel'; z.shape = 'circle'; z.color = '#ff4d8d'; z.size = 64; z.speed = 260;
      M.rules.push({ id: uid('r'), when: { type: 'click', a: z.id }, then: [{ type: 'score', n: 1 }, { type: 'respawn', target: '@a' }, { type: 'speed', target: '@a', f: 1.12 }] });
      M.rules.push({ id: uid('r'), when: { type: 'score', n: 12 }, then: [{ type: 'win', text: 'Schnell genug!' }] });
      return M;
    }
  },
  ai: { icon: 'sparkles', name: 'Mit KI bauen', desc: 'Keine Lust selbst zu bauen? Sag einer KI, was du willst, und füge den Code hier ein.', title: 'Mein KI-Spiel', mode: 'code' },
  code: { icon: 'code', name: 'Nur Code', desc: 'Schreibe dein Spiel selbst in JavaScript. Ein kleines Beispiel ist dabei.', title: 'Mein Code-Spiel', mode: 'code' }
};
const STARTER_CODE = `// Willkommen im Code-Modus! Das hier ist ein kleines, fertiges Spiel.
// Ändere etwas und drücke Strg+Enter (oder "Neu starten"), um es auszuprobieren.

const game = Moki.game({ background: '#0d1240', lives: 3 });

// Figuren anlegen (x und y sind Prozent vom Spielfeld)
const spieler = game.sprite({ name: 'Spieler', shape: 'circle', color: '#00e5a8',
  size: 56, x: 50, y: 86, control: 'keys', axis: 'x', speed: 440 });

game.sprite({ name: 'Stern', shape: 'star', color: '#ffd23f', size: 40, x: 30, y: -5,
  motion: 'fall', speed: 230 });
game.sprite({ name: 'Stein', shape: 'triangle', color: '#ff4d6d', size: 46, x: 70, y: -5,
  motion: 'fall', speed: 280 });

// Was passiert, wenn sich zwei Figuren berühren?
game.onTouch('Spieler', 'Stern', (a, b) => {
  game.addScore(1);
  b.respawn();                       // Stern oben neu starten
  if (game.score % 5 === 0) game.say('Super!');
});
game.onTouch('Spieler', 'Stein', (a, b) => {
  game.addLife(-1);
  b.respawn();
});

game.onScore(15, () => game.win('Geschafft!'));
game.every(2, () => game.spawn('Stern'));   // alle 2 Sekunden ein neuer Stern

game.start();
`;
function newGame(kind) {
  const t = TEMPLATES[kind] || TEMPLATES.empty;
  const g = { id: null, slug: null, title: t.title, description: '', creator: App.name, icon: null, status: 'draft', dirty: true, mode: t.mode || 'builder', model: null, code: '' };
  if (g.mode === 'code') { g.code = STARTER_CODE; g.model = newModel(); } else g.model = t.mk();
  return g;
}

function genCode(M) {
  const S = M.settings, L = [];
  const byId = id => M.sprites.find(s => s.id === id);
  const nameOf = id => (byId(id) || {}).name;
  L.push('// Dieses Spiel wurde im Baukasten gebaut. Du kannst den Code frei ändern.');
  L.push(`const game = Moki.game({ background: ${q(S.bg)}, lives: ${num(S.lives) | 0}, time: ${num(S.time)}, timeMode: ${q(S.timeMode)}, showScore: ${!!S.showScore} });`);
  if (M.sprites.length) L.push('');
  M.sprites.forEach(s => L.push(`game.sprite({ name: ${q(s.name)}, shape: ${q(s.shape)}, color: ${q(s.color)}, size: ${num(s.size)}, x: ${num(s.x)}, y: ${num(s.y)}, control: ${q(s.control)}, axis: ${q(s.axis)}, motion: ${q(s.motion)}, speed: ${num(s.speed)} });`));
  const tg = t => (t === '@a' ? { kind: 'v', v: 'a' } : t === '@b' ? { kind: 'v', v: 'b' } : nameOf(t) ? { kind: 'f', n: nameOf(t) } : null);
  function act(a, ind) {
    const P = ind;
    const onT = (fn) => {
      const t = tg(a.target); if (!t) return [P + '// (Figur fehlt: ' + a.type + ')'];
      if (t.kind === 'v') return [P + fn(t.v)];
      return [P + `{ const t = game.find(${q(t.n)}); if (t) ${fn('t')} }`];
    };
    switch (a.type) {
      case 'score': return [P + `game.addScore(${num(a.n)});`];
      case 'life': return [P + `game.addLife(${num(a.n)});`];
      case 'respawn': return onT(v => v + '.respawn();');
      case 'destroy': return onT(v => v + '.destroy();');
      case 'place': return onT(v => `${v}.place(${num(a.x)}, ${num(a.y)});`);
      case 'speed': return onT(v => `${v}.speed *= ${num(a.f) || 1};`);
      case 'spawn': return nameOf(a.sprite) ? [P + `game.spawn(${q(nameOf(a.sprite))});`] : [P + '// (Figur fehlt: spawn)'];
      case 'say': return [P + `game.say(${q(a.text || '')}, 2);`];
      case 'win': return [P + `game.win(${q(a.text || 'Gewonnen!')});`];
      case 'lose': return [P + `game.lose(${q(a.text || 'Verloren')});`];
    }
    return [];
  }
  M.rules.forEach(r => {
    const w = r.when || {}; let head = null;
    if (w.type === 'start') head = 'game.onStart(() => {';
    else if (w.type === 'key') head = `game.onKey(${q(w.key || 'SPACE')}, () => {`;
    else if (w.type === 'touch') head = nameOf(w.a) && nameOf(w.b) ? `game.onTouch(${q(nameOf(w.a))}, ${q(nameOf(w.b))}, (a, b) => {` : null;
    else if (w.type === 'edge') head = nameOf(w.a) ? `game.onEdge(${q(nameOf(w.a))}, (a) => {` : null;
    else if (w.type === 'click') head = nameOf(w.a) ? `game.onClick(${q(nameOf(w.a))}, (a) => {` : null;
    else if (w.type === 'every') head = `game.every(${num(w.n) || 1}, () => {`;
    else if (w.type === 'score') head = `game.onScore(${num(w.n)}, () => {`;
    L.push('');
    if (!head) { L.push('// (Regel unvollständig, es fehlt eine Figur)'); return; }
    L.push(head);
    (r.then || []).forEach(a => act(a, '  ').forEach(x => L.push(x)));
    L.push('});');
  });
  L.push(''); L.push('game.start();');
  return L.join('\n') + '\n';
}
const currentCode = () => (App.g.mode === 'code' ? App.g.code : genCode(App.g.model));

// ====================================================================
// Vorschau (geschützte Box: sandbox ohne same-origin)
// ====================================================================
function buildSrcdoc(code, title) {
  const pre = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script>window.MOKI_TITLE=' + JSON.stringify(title).replace(/</g, '\\u003c') + ';<\/script><script>' + window.MOKI_ENGINE + '<\/script><script>\n';
  return { html: pre + String(code).replace(/<\/script/gi, '<\\/script') + '\n<\/script></body></html>', offset: pre.split('\n').length };
}
let prevOffset = 1, runTimer = 0;
function runPreview() {
  clearTimeout(runTimer);
  if (!App.g) return;
  const code = currentCode(), d = buildSrcdoc(code, App.g.title || 'Spiel');
  prevOffset = d.offset;
  const old = $('#prev'), f = document.createElement('iframe');   // frischer Frame bei jedem Start
  f.id = 'prev'; f.title = 'Vorschau'; f.setAttribute('sandbox', 'allow-scripts'); f.srcdoc = d.html; old.replaceWith(f);
  consAdd('m', 'Gestartet ' + new Date().toLocaleTimeString('de-DE'));
  setGutterError(0);
}
function scheduleRun(ms) { clearTimeout(runTimer); runTimer = setTimeout(runPreview, ms == null ? 450 : ms); }
function consAdd(kind, text) {
  const c = $('#cons'); if (!c) return;
  const d = document.createElement('div'); d.className = kind; d.textContent = text; c.appendChild(d);
  while (c.children.length > 200) c.firstChild.remove();
  c.scrollTop = c.scrollHeight;
}
addEventListener('message', e => {
  const m = e.data; if (!m || m.moki !== 1) return;
  const f = $('#prev'); if (!f || e.source !== f.contentWindow) return;
  if (m.type === 'log') consAdd(m.level === 'error' ? 'e' : m.level === 'warn' ? 'w' : '', String(m.text).slice(0, 2000));
  else if (m.type === 'error') {
    const line = m.line ? Math.max(1, m.line - prevOffset + 1) : 0;
    consAdd('e', (line ? 'Zeile ' + line + ': ' : '') + String(m.text).slice(0, 1000));
    if (line) setGutterError(line);
  } else if (m.type === 'restart') runPreview();
});

// ====================================================================
// Übersicht (Meine Spiele)
// ====================================================================
async function loadMine() {
  App.loadErr = '';
  try { App.mine = await rpc('moki_my', { p_token: App.token }); } catch (e) { App.mine = []; App.loadErr = e.message; }
}
function gameCard(g) {
  const pub = g.status === 'published';
  return `<article class="gc" data-id="${esc(g.id)}">
    <div class="im">${g.icon ? `<img src="${esc(g.icon)}" alt="">` : ic('game')}<span class="st${pub ? ' pub' : ''}">${pub ? 'Veröffentlicht' : 'Entwurf'}</span></div>
    <div class="bd"><h3>${esc(g.title)}</h3><div class="mt">${g.mode === 'code' ? 'Code' : 'Baukasten'} · ${new Date(g.updated_at).toLocaleDateString('de-DE')}</div>
    <div class="acts"><button class="btn sm pri" data-act="edit" type="button">${ic('edit')}Bearbeiten</button>
    <button class="btn sm ${pub ? 'ghost' : 'warn'}" data-act="${pub ? 'unpub' : 'pub'}" type="button">${pub ? 'Zurückziehen' : 'Veröffentlichen'}</button>
    ${pub ? `<button class="btn sm ghost" data-act="copy" data-slug="${esc(g.slug)}" type="button">${ic('link')}Link</button>` : ''}
    <button class="btn sm ghost danger" data-act="del" type="button" aria-label="Löschen">${ic('trash')}</button></div></div></article>`;
}
async function showDash() {
  App.view = 'dash'; App.g = null;
  $('#view-edit').hidden = true; $('#view-dash').hidden = false;
  const el = $('#view-dash');
  el.innerHTML = `<section class="hero"><div style="flex:1;min-width:260px"><h1>Hallo ${esc(App.name)}!</h1><p>Baue dein eigenes Spiel: mit dem Baukasten ganz ohne Programmieren oder mit eigenem Code. Speichere es, und wenn du willst, erscheint es bei Moki unter „Kreationen“.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn pri" id="d-new" type="button" style="padding:14px 26px;font-size:16px">${ic('plus')}Neues Spiel</button><button class="btn" id="d-ai" type="button" style="padding:14px 22px;font-size:16px">${ic('sparkles')}Mit KI bauen</button></div></section>
    <h2 class="sec">Meine Spiele</h2><p class="sub">Nur du kannst sie bearbeiten (über den Schlüssel in diesem Browser).</p><div id="d-list"><p class="sub"><span class="spin"></span> Lade …</p></div>
    <div class="keybox">${ic('link')}<span style="flex:1;min-width:200px">Deine Spiele sind an einen geheimen Schlüssel in diesem Browser gebunden. Sichere ihn, wenn du auch an einem anderen Gerät weiterbauen willst.</span><button class="btn ghost sm" id="d-key" type="button">Schlüssel anzeigen</button></div>`;
  $('#d-new').onclick = openTemplates; $('#d-ai').onclick = () => openAI('new'); $('#d-key').onclick = openKey;
  await loadMine();
  const list = $('#d-list'); if (!list || App.view !== 'dash') return;
  const draft = LS.get('moki-studio-draft', null);
  let html = '';
  if (draft && draft.g && (draft.g.dirty || !draft.g.id)) html += `<div class="note" id="d-draft"><b>Ungespeicherte Änderungen gefunden:</b> „${esc(draft.g.title)}“ <span style="display:inline-flex;gap:8px;margin-left:10px;flex-wrap:wrap"><button class="btn sm pri" data-act="draft-open" type="button">Weiterbauen</button><button class="btn sm ghost" data-act="draft-drop" type="button">Verwerfen</button></span></div>`;
  if (App.loadErr) html += `<div class="note" style="background:#4a1020;border-color:#ff6b8166;color:#ffd3da">Konnte deine Spiele nicht laden: ${esc(App.loadErr)} <button class="btn sm ghost" data-act="reload" type="button">Nochmal versuchen</button></div>`;
  html += App.mine.length ? `<div class="gg" style="margin-top:18px">${App.mine.map(gameCard).join('')}</div>` : (App.loadErr ? '' : `<div class="empty" style="margin-top:18px">Noch keine Spiele gespeichert.<br>Klick oben auf „Neues Spiel“ und leg los.</div>`);
  list.innerHTML = html;
}
$('#view-dash').addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const card = b.closest('.gc'), id = card && card.dataset.id, g = id && App.mine.find(x => x.id === id), act = b.dataset.act;
  try {
    if (act === 'edit') await openGame(id);
    else if (act === 'pub') await publish(g);
    else if (act === 'unpub') { await rpc('moki_set_published', { p_token: App.token, p_id: id, p_published: false }); toast('Zurückgezogen. Das Spiel ist bei Moki nicht mehr zu sehen.', 'ok'); showDash(); }
    else if (act === 'copy') copyText(gameUrl(b.dataset.slug));
    else if (act === 'del') { if (await confirmBox('Spiel löschen?', `„${g.title}“ wird endgültig gelöscht${g.status === 'published' ? ' und verschwindet auch bei Moki' : ''}.`, 'Löschen', true)) { await rpc('moki_delete', { p_token: App.token, p_id: id }); toast('Gelöscht', 'ok'); showDash(); } }
    else if (act === 'reload') showDash();
    else if (act === 'draft-open') { const d = LS.get('moki-studio-draft', null); if (d) { App.g = d.g; enterEditor(); } }
    else if (act === 'draft-drop') { LS.del('moki-studio-draft'); showDash(); }
  } catch (err) { toast(err.message, 'bad'); }
});
async function publish(g) {
  if (!g.icon) { await openGame(g.id); openSave(true); return; }
  const r = await rpc('moki_set_published', { p_token: App.token, p_id: g.id, p_published: true });
  toast('Veröffentlicht! Es steht jetzt bei Moki unter „Kreationen“.', 'ok', { label: 'Link kopieren', fn: () => copyText(gameUrl(r.slug)) });
  if (App.view === 'dash') showDash();
}
function openTemplates() {
  const m = modal(`<h3>Wie willst du anfangen?</h3><p class="lead">Such dir eine Vorlage aus. Du kannst später alles ändern.</p><div class="tpls">${Object.entries(TEMPLATES).map(([k, t]) => `<button class="tpl" data-k="${k}" type="button"><span class="ti">${ic(t.icon)}</span><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`).join('')}</div>`, { wide: true });
  m.addEventListener('click', e => { const t = e.target.closest('.tpl'); if (!t) return; m.close(); if (t.dataset.k === 'ai') { openAI('new'); return; } App.g = newGame(t.dataset.k); enterEditor(); });
}

// ====================================================================
// Mit KI bauen: fertiger Prompt für duck.ai, danach Code einfügen
// ====================================================================
const AI_URL = 'https://duck.ai/';
const AI_INTRO = `Du bist Spiele-Entwickler im "Moki Studio". Schreibe mir ein kleines Browser-Spiel in JavaScript für die Moki-Engine.

REGELN FÜR DEINE ANTWORT
- Gib NUR EINEN Code-Block mit reinem JavaScript zurück. Kein HTML, kein CSS, keine Bibliotheken, keine Bilder, keine Töne, kein Internet. Alles wird von der Engine gezeichnet.
- Schreibe die Kommentare im Code auf Deutsch. Nach dem Code höchstens 2 kurze Sätze zur Steuerung.
- Das Spiel muss mit Tastatur UND Finger (Touch) spielbar sein, ein klares Ziel haben (gewinnen oder verlieren) und beim Start sofort funktionieren.
- Benutze NUR die Funktionen, die unten stehen. Erfinde keine anderen. Die Variable Moki gibt es schon, nichts importieren. Am Ende muss game.start() stehen.

SO FUNKTIONIERT DIE MOKI-ENGINE
Das Spielfeld ist 800 x 500 groß. Die Figuren sind einfache Formen.
const game = Moki.game({ background:'#0d1240', lives:3, time:30, timeMode:'win', showScore:true })
  lives: Leben (0 = keine, bei 0 Leben ist das Spiel verloren). time: Sekunden (0 = keine Zeit). timeMode: 'win' oder 'lose' = was passiert, wenn die Zeit abläuft.
game.sprite({ name, shape, color, size, x, y, control, axis, motion, speed, label })  legt eine Figur an und gibt sie zurück.
  shape: circle, square, triangle, diamond, star, heart. color: z. B. '#00e5a8'. size: Pixel.
  x und y beim Anlegen sind PROZENT vom Spielfeld (0 bis 100, auch -5 für knapp außerhalb).
  control: 'keys' (Pfeiltasten/WASD und Finger), 'mouse' (Maus/Finger folgt) oder 'none'. axis: 'x', 'y' oder 'xy' (wohin sich die gesteuerte Figur bewegen darf).
  motion: none, fall (fällt), rise (steigt), left, right, bounce (springt umher), follow (verfolgt die gesteuerte Figur). speed: Pixel pro Sekunde. label: Text in der Figur.
  Figuren mit motion fall/rise/left/right starten automatisch am Rand neu, wenn sie den Bildschirm verlassen.
Figur s: s.x und s.y sind zur Laufzeit PIXEL (Mitte). Außerdem s.name, s.color, s.size, s.speed, s.label, s.visible.
  s.place(xProzent, yProzent), s.respawn() (am passenden Rand neu starten), s.destroy(), s.clone(), s.touches(andereFigur).
Ereignisse:
  game.onStart(() => {})   game.onUpdate(dt => {}) jedes Bild, dt in Sekunden
  game.onKey('SPACE', () => {})  (SPACE, LEFT, RIGHT, UP, DOWN, ENTER, A bis Z)
  game.onTouch('NameA', 'NameB', (a, b) => {})  wenn sich zwei Figuren berühren (a und b sind die beteiligten Figuren)
  game.onEdge('Name', s => {})  Figur verlässt den Bildschirm.   game.onClick('Name', s => {})  Figur angetippt.
  game.every(sekunden, () => {})   game.onScore(punkte, () => {})  wenn die Punktzahl erreicht ist
Aktionen: game.addScore(n)  game.addLife(n)  game.say('Text', sekunden)  game.win('Text')  game.lose('Text')
  game.spawn('Name') (neue Kopie einer Figur)  game.find('Name')  game.all('Name')  game.random(min, max)
  Lesen: game.score, game.lives, game.time. Figuren mit gleichem name sind eine Gruppe, auch Kopien.

BEISPIEL (ein komplettes, funktionierendes Spiel)
\`\`\`javascript
${STARTER_CODE}\`\`\`

Wenn dir etwas fehlt, baue es mit diesen Funktionen nach. Das ist mein Wunsch:`;
const aiPrompt = req => AI_INTRO + ' ' + (req || '').trim();
function extractCode(text) {
  const t = String(text || '').replace(/\r/g, '');
  const blocks = [...t.matchAll(/```[a-zA-Z]*\n([\s\S]*?)```/g)].map(m => m[1]);
  if (blocks.length) return blocks.sort((a, b) => b.length - a.length)[0].trim() + '\n';
  const open = /```[a-zA-Z]*\n([\s\S]*)$/.exec(t);   // Block ohne schließende Klammern
  return (open ? open[1] : t).trim() + '\n';
}
function openAI(mode) {
  const replace = mode === 'replace' && App.g;
  const m = modal(`<h3>Keine Lust, selbst zu bauen?</h3>
    <p class="lead">Dann lass eine KI das Spiel schreiben. Das geht in drei Schritten, ohne Anmeldung.</p>
    <div class="aistep"><span class="n">1</span><div style="flex:1"><b>Schreib, was du haben willst</b>
      <textarea class="in" id="ai-req" rows="3" maxlength="600" placeholder="z. B. Ein Spiel, in dem ich ein Raumschiff steuere und Meteoriten ausweiche. Wer 30 Sekunden überlebt, gewinnt." autofocus></textarea></div></div>
    <div class="aistep"><span class="n">2</span><div style="flex:1"><b>Kopiere den Prompt und öffne duck.ai</b>
      <p class="hint" style="margin-top:2px">Der Prompt erklärt der KI, wie Moki-Spiele funktionieren, und hängt deinen Wunsch hinten an. Füge ihn dort einfach in das Chatfenster ein.</p>
      <div class="addrow" style="margin-top:8px"><button class="btn pri" id="ai-copy" type="button" disabled>${ic('copy')}Prompt kopieren</button><a class="btn" id="ai-open" href="${AI_URL}" target="_blank" rel="noopener noreferrer">${ic('ext')}duck.ai öffnen</a></div>
      <details style="margin-top:10px"><summary class="hint" style="cursor:pointer">Prompt ansehen</summary><textarea class="in" id="ai-prompt" rows="7" readonly style="font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;margin-top:8px"></textarea></details></div></div>
    <div class="aistep"><span class="n">3</span><div style="flex:1"><b>Füge die Antwort der KI hier ein</b>
      <textarea class="in" id="ai-code" rows="4" placeholder="Hier den ganzen Code oder die ganze Antwort der KI einfügen"></textarea></div></div>
    <div class="note" style="margin-top:6px;font-size:14px">duck.ai ist ein Dienst von DuckDuckGo, nicht von Moki. Schick dort keine privaten Daten hin. Die KI macht manchmal Fehler: Wenn das Spiel nicht läuft, siehst du die Fehlermeldung in der Konsole. Kopier sie in den Chat und bitte die KI, den Fehler zu beheben.</div>
    <div class="err" id="ai-err"></div>
    <div class="mfoot"><button class="btn ghost" id="ai-x" type="button">Abbrechen</button><button class="btn pri" id="ai-go" type="button" disabled>${replace ? 'In dieses Spiel einsetzen' : 'Als neues Spiel öffnen'}</button></div>`, { wide: true });
  const R = s => $(s, m), upd = () => {
    const req = R('#ai-req').value.trim(), has = req.length >= 5;
    R('#ai-prompt').value = aiPrompt(req); R('#ai-copy').disabled = !has; R('#ai-go').disabled = R('#ai-code').value.trim().length < 20;
  };
  R('#ai-req').addEventListener('input', upd); R('#ai-code').addEventListener('input', upd); upd();
  R('#ai-copy').onclick = () => copyText(aiPrompt(R('#ai-req').value));
  R('#ai-x').onclick = () => m.close();
  R('#ai-go').onclick = async () => {
    const code = extractCode(R('#ai-code').value);
    if (!/Moki\.game\s*\(/.test(code)) { R('#ai-err').textContent = 'Das sieht nicht nach Moki-Code aus (es fehlt Moki.game). Hast du die ganze Antwort der KI eingefügt?'; return; }
    if (code.length > 100000) { R('#ai-err').textContent = 'Der Code ist zu lang.'; return; }
    if (replace) {
      const g = App.g;
      if (g.mode === 'code' && g.code.trim() && g.code.trim() !== code.trim() && !(await confirmBox('Code ersetzen?', 'Dein bisheriger Code wird durch den Code der KI ersetzt.', 'Ersetzen', true))) return;
      g.mode = 'code'; g.code = code; markDirty(); m.close(); setTab('code'); runPreview(); toast('Code eingesetzt', 'ok');
    } else {
      m.close(); App.g = newGame('code'); App.g.code = code; App.g.title = 'Mein KI-Spiel'; enterEditor(); toast('Fertig! Probier das Spiel in der Vorschau.', 'ok');
    }
  };
}
async function openGame(id) {
  const row = await rpc('moki_get_mine', { p_token: App.token, p_id: id });
  App.g = { id: row.id, slug: row.slug, title: row.title, description: row.description || '', creator: row.creator, icon: row.icon, status: row.status, dirty: false, mode: row.mode, model: row.builder || newModel(), code: row.code || '' };
  enterEditor();
}

// ====================================================================
// Name und Schlüssel
// ====================================================================
function askName(first) {
  return new Promise(res => {
    const m = modal(`<h3>${first ? 'Willkommen im Moki Studio' : 'Dein Name'}</h3><p class="lead">${first ? 'Wie heißt du? Dein Name steht bei deinen Spielen auf Moki („Made by …“).' : 'So steht dein Name bei neuen und gespeicherten Spielen.'}</p>
      <label class="fld">Name<input type="text" id="nm" maxlength="24" autocomplete="nickname" autofocus value="${esc(App.name)}" placeholder="z. B. Anton"></label><div class="err" id="nm-e"></div>
      <div class="mfoot">${first ? '' : '<button class="btn ghost" id="nm-c" type="button">Abbrechen</button>'}<button class="btn pri" id="nm-ok" type="button">${first ? 'Los geht’s' : 'Speichern'}</button></div>`, { sticky: first, onClose: () => res(false) });
    const go = () => {
      const v = $('#nm', m).value.replace(/\s+/g, ' ').trim();
      if (v.length < 2) { $('#nm-e', m).textContent = 'Bitte mindestens 2 Zeichen.'; return; }
      App.name = v; LS.set('moki-studio-name', v); $('#who-name').textContent = v; res(true); m.remove();
    };
    $('#nm-ok', m).onclick = go; $('#nm', m).addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    const c = $('#nm-c', m); if (c) c.onclick = () => m.close();
  });
}
function openKey() {
  const m = modal(`<h3>Dein Studio-Schlüssel</h3><p class="lead">Mit diesem Schlüssel bearbeitest du deine Spiele. <b>Gib ihn niemandem</b>: Wer ihn kennt, kann deine Spiele ändern oder löschen. Speichere ihn irgendwo, falls du an einem anderen Gerät weiterbauen willst.</p>
    <label class="fld">Dein Schlüssel<input type="text" class="in" id="k-v" readonly value="${esc(App.token)}"></label>
    <div class="mfoot" style="justify-content:flex-start;margin-top:0"><button class="btn sm" id="k-c" type="button">Kopieren</button></div>
    <h3 style="font-size:18px;margin-top:22px">Schlüssel von einem anderen Gerät einsetzen</h3>
    <label class="fld" style="margin-top:10px"><input type="text" class="in" id="k-n" placeholder="Schlüssel hier einfügen" autocomplete="off"></label><div class="err" id="k-e"></div>
    <div class="mfoot"><button class="btn ghost" id="k-x" type="button">Schließen</button><button class="btn pri" id="k-ok" type="button">Einsetzen</button></div>`);
  $('#k-c', m).onclick = () => copyText(App.token); $('#k-x', m).onclick = () => m.close();
  $('#k-ok', m).onclick = () => {
    const v = $('#k-n', m).value.trim();
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(v)) { $('#k-e', m).textContent = 'Das sieht nicht wie ein Schlüssel aus.'; return; }
    LS.set('moki-studio-key', v); App.token = v; m.close(); toast('Schlüssel eingesetzt', 'ok'); showDash();
  };
}

// ====================================================================
// Editor
// ====================================================================
let dirtyTimer = 0;
function markDirty() {
  const g = App.g; if (!g) return;
  g.dirty = true; updateState();
  clearTimeout(dirtyTimer); dirtyTimer = setTimeout(() => LS.set('moki-studio-draft', { g: App.g, t: Date.now() }), 700);
}
function updateState() {
  const g = App.g; if (!g) return; const s = $('#e-state');
  s.textContent = g.dirty ? 'Nicht gespeichert' : (g.id ? 'Gespeichert' : ''); s.className = 'state ' + (g.dirty ? 'dirty' : 'ok');
  $('#e-pub-t').textContent = g.status === 'published' ? 'Veröffentlicht' : 'Veröffentlichen';
}
function enterEditor() {
  App.view = 'edit'; App.tab = App.g.mode === 'code' ? 'code' : 'builder';
  $('#view-dash').hidden = true; $('#view-edit').hidden = false;
  $('#e-title').value = App.g.title; $('#cons').innerHTML = '';
  setTab(App.tab); updateState(); runPreview();
  if (App.g.dirty) LS.set('moki-studio-draft', { g: App.g, t: Date.now() });
}
$('#e-title').addEventListener('input', e => { App.g.title = e.target.value; markDirty(); });
$('#e-title').addEventListener('change', () => scheduleRun(100));
$('#e-run').onclick = runPreview;
$('#cons-clear').onclick = () => { $('#cons').innerHTML = ''; };
$('#e-back').onclick = async () => {
  if (App.g && App.g.dirty && !(await confirmBox('Ungespeicherte Änderungen', 'Du hast Änderungen noch nicht gespeichert. Sie bleiben als Entwurf in diesem Browser, bis du sie speicherst oder verwirfst.', 'Trotzdem zurück'))) return;
  showDash();
};
function setTab(t) {
  App.tab = t;
  $$('.ltabs .tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  const pb = $('#pane-builder'), pc = $('#pane-code');
  pb.hidden = t !== 'builder'; pb.style.display = t === 'builder' ? '' : 'none';
  pc.hidden = t !== 'code'; pc.style.display = t === 'code' ? 'flex' : 'none';
  if (t === 'builder') renderBuilder(); else renderCode();
}
$$('.ltabs .tab').forEach(b => b.onclick = () => setTab(b.dataset.tab));

// ---------- Baukasten-Oberfläche ----------
const opt = (list, v) => list.map(([k, l]) => `<option value="${esc(k)}"${String(k) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('');
const spOpts = (M, v, ph) => `<option value="">${esc(ph || '— Figur wählen —')}</option>` + M.sprites.map(s => `<option value="${esc(s.id)}"${s.id === v ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
function targetOpts(M, when, v) {
  let o = '<option value="">— Figur wählen —</option>';
  if (when.type === 'touch') o += `<option value="@a"${v === '@a' ? ' selected' : ''}>Die erste Figur (A)</option><option value="@b"${v === '@b' ? ' selected' : ''}>Die zweite Figur (B)</option>`;
  else if (when.type === 'edge' || when.type === 'click') o += `<option value="@a"${v === '@a' ? ' selected' : ''}>Diese Figur</option>`;
  return o + M.sprites.map(s => `<option value="${esc(s.id)}"${s.id === v ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
}
function spriteCard(M, s, i) {
  const P = 'sprites.' + i + '.';
  return `<div class="cardx">
    <div class="chead"><span class="sw" style="background:${esc(s.color)}"></span><input class="nm" data-p="${P}name" data-re="1" value="${esc(s.name)}" maxlength="24" aria-label="Name"><button class="xbtn" data-act="del-sprite" data-i="${i}" type="button" aria-label="Figur löschen">${ic('trash')}</button></div>
    <div class="g2">
      <label>Form<select data-p="${P}shape">${opt(SHAPES, s.shape)}</select></label>
      <label>Farbe<input type="color" data-p="${P}color" data-sw="1" value="${esc(s.color)}"></label>
      <label><span class="lt">Größe<b>${num(s.size)}</b></span><input type="range" min="16" max="160" data-p="${P}size" value="${num(s.size)}"></label>
      <label><span class="lt">Tempo<b>${num(s.speed)}</b></span><input type="range" min="0" max="900" step="10" data-p="${P}speed" value="${num(s.speed)}"></label>
      <label><span class="lt">Start links/rechts<b>${num(s.x)}%</b></span><input type="range" min="-10" max="110" data-p="${P}x" data-suf="%" value="${num(s.x)}"></label>
      <label><span class="lt">Start oben/unten<b>${num(s.y)}%</b></span><input type="range" min="-10" max="110" data-p="${P}y" data-suf="%" value="${num(s.y)}"></label>
      <label>Steuerung<select data-p="${P}control" data-re="1">${opt(CONTROLS, s.control)}</select></label>
      ${s.control !== 'none' ? `<label>Darf sich bewegen<select data-p="${P}axis">${opt(AXES, s.axis)}</select></label>` : `<label>Bewegung<select data-p="${P}motion">${opt(MOTIONS, s.motion)}</select></label>`}
    </div>
  </div>`;
}
function whenParams(M, w, P) {
  switch (w.type) {
    case 'touch': return `<select data-p="${P}a">${spOpts(M, w.a, '— Figur A —')}</select><span>und</span><select data-p="${P}b" data-re="1">${spOpts(M, w.b, '— Figur B —')}</select><span>sich berühren</span>`;
    case 'key': return `<select data-p="${P}key">${opt(KEYS, w.key)}</select><span>gedrückt wird</span>`;
    case 'edge': return `<select data-p="${P}a">${spOpts(M, w.a)}</select><span>den Bildschirm verlässt</span>`;
    case 'click': return `<select data-p="${P}a">${spOpts(M, w.a)}</select><span>angetippt wird</span>`;
    case 'every': return `<span>alle</span><input type="number" step="0.1" min="0.1" data-p="${P}n" value="${num(w.n)}"><span>Sekunden</span>`;
    case 'score': return `<span>die Punkte</span><input type="number" step="1" data-p="${P}n" value="${num(w.n)}"><span>erreichen</span>`;
  } return '<span>das Spiel startet</span>';
}
function actParams(M, w, a, P) {
  const T = () => `<select data-p="${P}target">${targetOpts(M, w, a.target)}</select>`;
  switch (a.type) {
    case 'score': return `<span>Punkte um</span><input type="number" step="1" data-p="${P}n" value="${num(a.n)}">`;
    case 'life': return `<span>Leben um</span><input type="number" step="1" data-p="${P}n" value="${num(a.n)}">`;
    case 'respawn': return T() + '<span>oben neu starten</span>';
    case 'destroy': return T() + '<span>entfernen</span>';
    case 'place': return T() + `<span>nach X</span><input type="number" min="0" max="100" data-p="${P}x" value="${num(a.x)}"><span>% Y</span><input type="number" min="0" max="100" data-p="${P}y" value="${num(a.y)}"><span>%</span>`;
    case 'spawn': return `<select data-p="${P}sprite">${spOpts(M, a.sprite)}</select><span>neu erzeugen</span>`;
    case 'speed': return T() + `<span>Tempo mal</span><input type="number" step="0.05" min="0" data-p="${P}f" value="${num(a.f) || 1}">`;
    case 'say': return `<input type="text" data-p="${P}text" value="${esc(a.text || '')}" maxlength="60" placeholder="Text">`;
    case 'win': case 'lose': return `<input type="text" data-p="${P}text" value="${esc(a.text || '')}" maxlength="40" placeholder="Text (optional)">`;
  } return '';
}
function ruleCard(M, r, i) {
  const P = 'rules.' + i + '.', w = r.when;
  return `<div class="cardx">
    <div class="rline"><span class="lbl">Wenn</span><select data-p="${P}when.type" data-re="1">${opt(EVENTS, w.type)}</select><button class="xbtn" data-act="del-rule" data-i="${i}" type="button" style="margin-left:auto" aria-label="Regel löschen">${ic('trash')}</button></div>
    <div class="rline" style="margin-left:46px">${whenParams(M, w, P + 'when.')}</div>
    <div class="then">${(r.then || []).map((a, ai) => `<div class="rline"><span class="lbl">dann</span><select data-p="${P}then.${ai}.type" data-re="1">${opt(ACTIONS, a.type)}</select><button class="xbtn" data-act="del-action" data-i="${i}" data-ai="${ai}" type="button" aria-label="Aktion löschen">${ic('x')}</button></div><div class="rline" style="margin-left:46px">${actParams(M, w, a, P + 'then.' + ai + '.')}</div>`).join('')}
      <button class="btn sm ghost" data-act="add-action" data-i="${i}" type="button">${ic('plus')}Aktion</button></div></div>`;
}
function renderBuilder() {
  const g = App.g; if (!g) return; const M = g.model, pane = $('#pane-builder'), top = pane.scrollTop;
  const S = M.settings;
  const sections = $$('details.bx', pane).map(d => d.open); // offen/zu merken
  const html = `
  ${g.mode === 'code' ? `<div class="tonote">Dieses Spiel besteht aus eigenem Code. Der Baukasten zeigt hier den alten Stand. Wenn du hier etwas änderst, wird der Code <b>ersetzt</b>, sobald du „Aus dem Baukasten übernehmen“ wählst.<div style="margin-top:10px"><button class="btn sm warn" data-act="from-builder" type="button">Aus dem Baukasten übernehmen</button></div></div>` : ''}
  <details class="bx" open><summary>${ic('pen')} Spiel</summary><div class="in-b"><div class="g2">
    <label>Hintergrund<input type="color" data-p="settings.bg" value="${esc(S.bg)}"></label>
    <label>Leben (0 = keine)<input type="number" min="0" max="9" data-p="settings.lives" value="${num(S.lives)}"></label>
    <label>Zeit in Sekunden (0 = keine)<input type="number" min="0" max="600" data-p="settings.time" value="${num(S.time)}"></label>
    <label>Wenn die Zeit abläuft<select data-p="settings.timeMode"><option value="win"${S.timeMode === 'win' ? ' selected' : ''}>hast du gewonnen</option><option value="lose"${S.timeMode === 'lose' ? ' selected' : ''}>hast du verloren</option></select></label>
    <label class="ck"><input type="checkbox" data-p="settings.showScore"${S.showScore ? ' checked' : ''}>Punkte anzeigen</label>
  </div></div></details>
  <details class="bx" open><summary>${ic('game')} Figuren <span class="cnt">${M.sprites.length}</span></summary><div class="in-b">
    ${M.sprites.length ? M.sprites.map((s, i) => spriteCard(M, s, i)).join('') : '<p class="hint">Noch keine Figuren. Füge unten eine hinzu: Spieler, Sammelobjekt oder Gegner.</p>'}
    <div class="addrow"><button class="btn sm" data-act="add-sprite" data-k="player" type="button">${ic('plus')}Spieler</button><button class="btn sm" data-act="add-sprite" data-k="item" type="button">${ic('plus')}Sammelobjekt</button><button class="btn sm" data-act="add-sprite" data-k="enemy" type="button">${ic('plus')}Gegner</button><button class="btn sm" data-act="add-sprite" data-k="bouncer" type="button">${ic('plus')}Springer</button><button class="btn sm ghost" data-act="add-sprite" data-k="blank" type="button">${ic('plus')}Leer</button></div>
  </div></details>
  <details class="bx" open><summary>${ic('bolt')} Regeln <span class="cnt">${M.rules.length}</span></summary><div class="in-b">
    ${M.rules.length ? M.rules.map((r, i) => ruleCard(M, r, i)).join('') : '<p class="hint">Regeln sagen, was passiert. Zum Beispiel: „Wenn Spieler und Stern sich berühren, dann Punkte um 1.“</p>'}
    <div class="addrow"><button class="btn sm pri" data-act="add-rule" type="button">${ic('plus')}Regel</button></div>
    ${M.sprites.length > 1 && new Set(M.sprites.map(s => s.name)).size !== M.sprites.length ? '<p class="hint bad">Zwei Figuren heißen gleich. Gib ihnen verschiedene Namen.</p>' : ''}
  </div></details>`;
  pane.innerHTML = html;
  $$('details.bx', pane).forEach((d, i) => { if (sections[i] === false) d.open = false; });
  pane.scrollTop = top;
}
function getPath(o, path) { return path.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, path, v) { const k = path.split('.'), last = k.pop(); const t = k.reduce((a, x) => a[x], o); t[last] = v; }
function fixWhen(M, r) {
  const w = r.when, s = M.sprites;
  if (w.type === 'touch') { w.a = w.a || (s[0] && s[0].id) || ''; w.b = w.b || (s[1] && s[1].id) || (s[0] && s[0].id) || ''; }
  else if (w.type === 'edge' || w.type === 'click') w.a = w.a || (s[0] && s[0].id) || '';
  else if (w.type === 'key') w.key = w.key || 'SPACE';
  else if (w.type === 'every') w.n = w.n || 2;
  else if (w.type === 'score') w.n = w.n || 10;
  (r.then || []).forEach(a => { if (a.target === '@b' && w.type !== 'touch') a.target = ''; if (a.target === '@a' && !['touch', 'edge', 'click'].includes(w.type)) a.target = ''; });
}
function fixAction(M, r, a) {
  const s = M.sprites, d = { score: { n: 1 }, life: { n: -1 }, place: { x: 50, y: 50 }, speed: { f: 1.2 }, say: { text: 'Hallo!' } }[a.type];
  if (d) for (const k in d) if (a[k] == null) a[k] = d[k];
  if (['respawn', 'destroy', 'place', 'speed'].includes(a.type) && !a.target) a.target = r.when.type === 'touch' ? '@b' : (['edge', 'click'].includes(r.when.type) ? '@a' : (s[0] && s[0].id) || '');
  if (a.type === 'spawn' && !a.sprite) a.sprite = (s[0] && s[0].id) || '';
}
function onBuilderInput(e) {
  const el = e.target.closest('[data-p]'); if (!el) return;
  const g = App.g, M = g.model, p = el.dataset.p;
  let v = el.type === 'checkbox' ? el.checked : (el.type === 'range' || el.type === 'number') ? (el.value === '' ? 0 : +el.value) : el.value;
  if (e.type === 'input' && (el.tagName === 'SELECT' || el.dataset.re)) { if (el.tagName === 'SELECT') return; }
  const before = getPath(M, p);
  setPath(M, p, v);
  if (e.type === 'change' && before === v && !el.dataset.re && !/\.when\.type$|\.then\.\d+\.type$/.test(p)) return;   // nur Verlassen des Feldes, nichts geändert
  if (g.mode === 'code') { /* Änderungen am Baukasten ersetzen den Code erst auf Wunsch */ }
  const lab = el.closest('label'); if (lab && el.type === 'range') { const b = $('b', lab); if (b) b.textContent = v + (el.dataset.suf || ''); }
  if (el.dataset.sw) { const sw = el.closest('.cardx') && $('.sw', el.closest('.cardx')); if (sw) sw.style.background = v; }
  if (/^sprites\.\d+\.control$/.test(p) && v !== 'none') M.sprites[+p.split('.')[1]].motion = 'none';
  const m = /^rules\.(\d+)\.when\.type$/.exec(p);
  if (m) fixWhen(M, M.rules[+m[1]]);
  const ma = /^rules\.(\d+)\.then\.(\d+)\.type$/.exec(p);
  if (ma) fixAction(M, M.rules[+ma[1]], M.rules[+ma[1]].then[+ma[2]]);
  if (p.endsWith('.name')) {   // eindeutige Namen
    const i = +p.split('.')[1]; let n = String(v).trim() || 'Figur', k = 2, base = n;
    while (M.sprites.some((s, j) => j !== i && s.name === n)) n = base + ' ' + k++;
    if (e.type === 'change') M.sprites[i].name = n; else M.sprites[i].name = String(v);
  }
  if (e.type === 'change' && (el.dataset.re || m || ma)) renderBuilder();
  markDirty(); if (g.mode === 'builder') scheduleRun();
}
$('#pane-builder').addEventListener('input', onBuilderInput);
$('#pane-builder').addEventListener('change', onBuilderInput);
$('#pane-builder').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const g = App.g, M = g.model, a = b.dataset.act, i = +b.dataset.i;
  if (a === 'add-sprite') addSprite(M, b.dataset.k);
  else if (a === 'del-sprite') { const id = M.sprites[i].id; M.sprites.splice(i, 1); M.rules.forEach(r => { ['a', 'b'].forEach(k => { if (r.when[k] === id) r.when[k] = ''; }); (r.then || []).forEach(x => { if (x.target === id) x.target = ''; if (x.sprite === id) x.sprite = ''; }); }); }
  else if (a === 'add-rule') { const r = { id: uid('r'), when: { type: M.sprites.length > 1 ? 'touch' : 'start' }, then: [{ type: 'score', n: 1 }] }; fixWhen(M, r); M.rules.push(r); }
  else if (a === 'del-rule') M.rules.splice(i, 1);
  else if (a === 'add-action') { const r = M.rules[i], x = { type: 'score' }; fixAction(M, r, x); r.then.push(x); }
  else if (a === 'del-action') M.rules[i].then.splice(+b.dataset.ai, 1);
  else if (a === 'from-builder') { g.mode = 'builder'; g.code = ''; toast('Der Code wurde durch den Baukasten ersetzt', 'ok'); }
  renderBuilder(); markDirty(); scheduleRun(100);
});

// ---------- Code-Editor ----------
const HELP = `<h4>Spiel anlegen</h4><p><code>const game = Moki.game({ background:'#0d1240', lives:3, time:30 })</code><br>Am Ende immer <code>game.start()</code>. Das Spielfeld ist 800 × 500 groß.</p>
<h4>Figuren</h4><p><code>game.sprite({ name, shape, color, size, x, y, control, axis, motion, speed })</code><br>
Form: circle, square, triangle, diamond, star, heart · Steuerung: 'keys' oder 'mouse' · Bewegung: fall, rise, left, right, bounce, follow.<br>
<code>x</code> und <code>y</code> sind beim Anlegen Prozent (0 bis 100). Zur Laufzeit sind <code>s.x</code> und <code>s.y</code> Pixel.</p>
<p><code>s.place(x%, y%)</code> · <code>s.respawn()</code> · <code>s.destroy()</code> · <code>s.clone()</code> · <code>s.touches(andere)</code> · <code>s.color</code>, <code>s.size</code>, <code>s.speed</code> ändern.</p>
<h4>Ereignisse</h4><p><code>game.onStart(() => {})</code> · <code>game.onUpdate(dt => {})</code> (jedes Bild)<br><code>game.onKey('SPACE', () => {})</code> (Tasten: SPACE, LEFT, RIGHT, UP, DOWN, ENTER, A bis Z)<br>
<code>game.onTouch('Spieler', 'Stern', (a, b) => {})</code> · <code>game.onEdge('Stein', s => {})</code> · <code>game.onClick('Ziel', s => {})</code><br><code>game.every(2, () => {})</code> (alle 2 Sekunden) · <code>game.onScore(10, () => {})</code></p>
<h4>Aktionen</h4><p><code>game.addScore(1)</code> · <code>game.addLife(-1)</code> · <code>game.say('Text', 2)</code> · <code>game.win('Geschafft!')</code> · <code>game.lose('Pech')</code><br>
<code>game.spawn('Stern')</code> neue Figur · <code>game.find('Spieler')</code> · <code>game.all('Stern')</code> · <code>game.random(a, b)</code><br><code>game.score</code>, <code>game.lives</code>, <code>game.time</code> lesen.</p>
<h4>Tipp</h4><p>Mit <code>console.log(...)</code> schreibst du in die Konsole unter der Vorschau. Fehler zeigen die Zeile an.</p>`;
function hl(src) {
  const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|if|else|for|while|true|false|null|new|of|in|break|continue|this|async|await|switch|case|default)\b|\b(\d+\.?\d*)\b|\b(game|Moki)\b/g;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += e(src.slice(last, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : 'g';
    out += `<span class="tk-${cls}">${e(m[0])}</span>`; last = m.index + m[0].length;
  }
  return out + e(src.slice(last)) + '\n ';
}
function renderGutter(code, errLine) {
  const n = code.split('\n').length; let h = '';
  for (let i = 1; i <= n; i++) h += `<div${i === errLine ? ' class="er"' : ''}>${i}</div>`;
  return h;
}
let errLine = 0;
function setGutterError(n) { errLine = n; const g = $('#gut'); const ta = $('#ta'); if (g && ta) g.innerHTML = renderGutter(ta.value, n); }
function renderCode() {
  const g = App.g, pane = $('#pane-code'), ro = g.mode === 'builder', code = currentCode();
  pane.innerHTML = `<div class="ctools">
      <button class="btn sm ghost" id="c-help" type="button">${ic('code')}Hilfe</button>
      <button class="btn sm" id="c-ai" type="button">${ic('sparkles')}Mit KI bauen</button>
      ${ro ? `<button class="btn sm warn" id="c-edit" type="button">${ic('edit')}Code bearbeiten</button>` : `<button class="btn sm ghost" id="c-run" type="button">${ic('down')}Ausführen (Strg+Enter)</button>`}
      ${!ro && g.model ? `<button class="btn sm ghost" id="c-back" type="button">Zurück zum Baukasten</button>` : ''}
    </div>
    ${ro ? '<div class="tonote">Das ist der Code, den dein Baukasten gerade erzeugt. Willst du ihn selbst ändern, klick auf „Code bearbeiten“. Danach läuft das Spiel nur noch mit deinem Code.</div>' : ''}
    <div class="ce"><div class="gut" id="gut"></div><div class="cw"><pre aria-hidden="true"><code id="hl"></code></pre><textarea id="ta" spellcheck="false" wrap="off" autocomplete="off" autocapitalize="off" aria-label="Spiel-Code"${ro ? ' readonly' : ''}></textarea></div></div>
    <div class="help" id="help" hidden>${HELP}</div>`;
  const ta = $('#ta', pane), hlc = $('#hl', pane), gut = $('#gut', pane), pre = $('pre', pane);
  const paint = () => { hlc.innerHTML = hl(ta.value); gut.innerHTML = renderGutter(ta.value, errLine); };
  ta.value = code; paint();
  ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; });
  ta.addEventListener('input', () => { if (!ro) { App.g.code = ta.value; markDirty(); } errLine = 0; paint(); });
  ta.addEventListener('keydown', e => {
    if (ro) return;
    if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
    else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      const s = ta.selectionStart, before = ta.value.slice(0, s), ind = (before.split('\n').pop().match(/^\s*/) || [''])[0] + (/[{(\[]\s*$/.test(before) ? '  ' : '');
      e.preventDefault(); ta.setRangeText('\n' + ind, s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input'));
    }
  });
  $('#c-ai', pane).onclick = () => openAI('replace');
  $('#c-help', pane).onclick = () => { const h = $('#help', pane); h.hidden = !h.hidden; };
  const ce = $('#c-edit', pane); if (ce) ce.onclick = async () => { if (await confirmBox('Code bearbeiten?', 'Ab jetzt läuft dein Spiel mit dem Code. Im Baukasten kannst du es nicht mehr weiterbauen, außer du übernimmst den Baukasten später wieder (dann geht dein Code verloren).', 'Code bearbeiten')) { g.mode = 'code'; g.code = code; markDirty(); renderCode(); } };
  const cr = $('#c-run', pane); if (cr) cr.onclick = runPreview;
  const cb = $('#c-back', pane); if (cb) cb.onclick = async () => { if (await confirmBox('Zurück zum Baukasten?', 'Dein eigener Code geht verloren, das Spiel wird wieder aus dem Baukasten gebaut.', 'Zurück zum Baukasten', true)) { g.mode = 'builder'; g.code = ''; markDirty(); setTab('builder'); scheduleRun(100); } };
}

// ====================================================================
// Speichern und Veröffentlichen
// ====================================================================
async function saveGame(newIcon) {
  const g = App.g;
  const r = await rpc('moki_save', { p_token: App.token, p_id: g.id, p_creator: App.name, p_title: (g.title || '').trim(), p_description: g.description || '', p_mode: g.mode, p_builder: g.mode === 'builder' ? g.model : null, p_code: currentCode(), p_icon: newIcon || null });
  g.id = r.id; g.slug = r.slug; g.dirty = false; g.creator = App.name; if (newIcon) g.icon = newIcon;
  LS.del('moki-studio-draft'); updateState();
  return r;
}
async function quickSave() {
  const g = App.g; if (!g || App.view !== 'edit') return;
  if (!(g.title || '').trim()) { toast('Gib deinem Spiel einen Namen', 'bad'); $('#e-title').focus(); return; }
  if (!g.icon) { openSave(false); return; }
  const b = $('#e-save'); b.disabled = true;
  try { await saveGame(null); toast('Gespeichert', 'ok'); } catch (e) { toast(e.message, 'bad'); }
  b.disabled = false;
}
$('#e-save').onclick = quickSave;
$('#e-pub').onclick = async () => {
  const g = App.g;
  if (g.status === 'published') { if (g.dirty) await quickSave(); toast('Dein Spiel ist veröffentlicht. Änderungen sind sofort bei Moki zu sehen.', 'ok', g.slug ? { label: 'Link kopieren', fn: () => copyText(gameUrl(g.slug)) } : null); return; }
  if (!g.icon || !g.id || g.dirty) { openSave(true); return; }
  try { const r = await rpc('moki_set_published', { p_token: App.token, p_id: g.id, p_published: true }); g.status = 'published'; updateState(); toast('Veröffentlicht! Es steht jetzt bei Moki unter „Kreationen“.', 'ok', { label: 'Link kopieren', fn: () => copyText(gameUrl(r.slug)) }); } catch (e) { toast(e.message, 'bad'); }
};
function openSave(publishNow) {
  const g = App.g;
  let st = g.icon ? { kind: 'keep', url: g.icon } : null, motif = 'rocket', pal = 0, tab = 'built';
  const m = modal(`<h3>Speichern</h3><p class="lead">Gib deinem Spiel einen Namen und such ein Bild aus. Das Bild ist die Kachel bei Moki.</p>
    <div class="ipick"><div class="iprev"><div class="tilep" id="tp"><div class="none">Wähle ein Bild</div><div class="nm" id="tp-n"></div></div><span class="hint" style="text-align:center">So sieht deine Kachel aus</span></div>
    <div><label class="fld">Name<input type="text" id="s-t" maxlength="60" value="${esc(g.title)}" autofocus></label>
      <label class="fld">Beschreibung (optional)<textarea id="s-d" maxlength="160" rows="2" placeholder="Worum geht es in deinem Spiel?">${esc(g.description)}</textarea></label>
      <div class="tabs"><button class="tab on" data-t="built" type="button">Bild bauen</button><button class="tab" data-t="up" type="button">Eigenes Bild</button></div>
      <div id="t-built"><div class="lab">Motiv</div><div class="mgrid">${ICON_MOTIFS.map(x => `<button class="mo" data-m="${x.id}" type="button" title="${esc(x.name)}" aria-label="${esc(x.name)}">${iconMini(x.id)}</button>`).join('')}</div>
        <div class="lab">Farben</div><div class="pgrid">${ICON_PALS.map((p, i) => `<button class="pa" data-p="${i}" type="button" style="background:linear-gradient(135deg,${p[0]},${p[1]})" aria-label="Farbe ${i + 1}"></button>`).join('')}</div></div>
      <div id="t-up" hidden><div class="lab">Bild von deinem Gerät</div><input type="file" id="s-f" accept="image/*" class="in"><p class="hint">Es wird quadratisch zugeschnitten (Mitte) und verkleinert. Nimm ein Bild, das zu den Moki-Kacheln passt: bunt, groß und ohne viel Text.</p></div></div></div>
    <div class="err" id="s-e"></div>
    <div class="mfoot"><button class="btn ghost" id="s-x" type="button">Abbrechen</button><button class="btn" id="s-d1" type="button" disabled>Als Entwurf speichern</button><button class="btn pri" id="s-p" type="button" disabled>Speichern und veröffentlichen</button></div>`, { wide: true });
  const R = s => $(s, m), setTile = () => {
    const url = st ? (st.kind === 'built' ? svgUrl(iconSvg(st.motif, st.pal)) : st.url) : null;
    R('#tp').innerHTML = (url ? `<img src="${esc(url)}" alt="">` : '<div class="none">Wähle ein Bild</div>') + `<div class="nm">${esc(R('#s-t').value || 'Dein Spiel')}</div>`;
    const ok = !!st && R('#s-t').value.trim().length > 0; R('#s-d1').disabled = !ok; R('#s-p').disabled = !ok;
    $$('.mo', m).forEach(b => b.classList.toggle('on', !!st && st.kind === 'built' && st.motif === b.dataset.m));
    $$('.pa', m).forEach(b => b.classList.toggle('on', !!st && st.kind === 'built' && st.pal === +b.dataset.p));
  };
  m.addEventListener('click', e => {
    const t = e.target.closest('.tab'); if (t) { $$('.tab', m).forEach(x => x.classList.toggle('on', x === t)); R('#t-built').hidden = t.dataset.t !== 'built'; R('#t-up').hidden = t.dataset.t !== 'up'; return; }
    const mo = e.target.closest('.mo'); if (mo) { motif = mo.dataset.m; st = { kind: 'built', motif, pal: st && st.kind === 'built' ? st.pal : pal }; setTile(); return; }
    const pa = e.target.closest('.pa'); if (pa) { pal = +pa.dataset.p; st = { kind: 'built', motif: st && st.kind === 'built' ? st.motif : motif, pal }; setTile(); }
  });
  R('#s-t').addEventListener('input', setTile); setTile();
  R('#s-f').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) { R('#s-e').textContent = 'Das Bild ist zu groß (maximal 8 MB).'; return; }
    try { const u = URL.createObjectURL(f); const j = await toJpeg(u); URL.revokeObjectURL(u); st = { kind: 'upload', url: j }; R('#s-e').textContent = ''; setTile(); } catch (err) { R('#s-e').textContent = 'Das Bild konnte nicht gelesen werden.'; }
  });
  R('#s-x').onclick = () => m.close();
  const go = async pub => {
    R('#s-e').textContent = ''; const bs = [R('#s-d1'), R('#s-p')]; bs.forEach(b => b.disabled = true);
    try {
      g.title = R('#s-t').value.trim(); g.description = R('#s-d').value.trim(); $('#e-title').value = g.title;
      const newIcon = st.kind === 'built' ? await toJpeg(svgUrl(iconSvg(st.motif, st.pal))) : st.kind === 'upload' ? st.url : null;
      const r = await saveGame(newIcon);
      if (pub) { await rpc('moki_set_published', { p_token: App.token, p_id: g.id, p_published: true }); g.status = 'published'; }
      updateState(); m.remove(); scheduleRun(100);
      toast(pub ? 'Veröffentlicht! Es steht jetzt bei Moki unter „Kreationen“.' : 'Gespeichert', 'ok', pub ? { label: 'Link kopieren', fn: () => copyText(gameUrl(r.slug)) } : null);
    } catch (e) { R('#s-e').textContent = e.message; bs.forEach(b => b.disabled = false); }
  };
  R('#s-d1').onclick = () => go(false); R('#s-p').onclick = () => go(true);
  if (publishNow) setTimeout(() => R('#s-p').scrollIntoView({ block: 'nearest' }), 50);
}

// ---------- Tastenkürzel, Schutz vor Verlust ----------
addEventListener('keydown', e => {
  if (App.view !== 'edit') return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); quickSave(); }
  else if (mod && e.key === 'Enter') { e.preventDefault(); runPreview(); }
});
addEventListener('beforeunload', e => { if (App.g && App.g.dirty && App.view === 'edit') { e.preventDefault(); e.returnValue = ''; } });

// ====================================================================
// Start
// ====================================================================
async function init() {
  $('#btn-moki').href = CFG.mokiUrl;
  $('#logo-link').onclick = e => { e.preventDefault(); if (App.name && App.view === 'edit') $('#e-back').click(); else if (App.name) showDash(); };
  $('#btn-who').onclick = () => askName(false);
  $('#btn-key').onclick = openKey;
  if (!App.name) await askName(true);
  $('#who-name').textContent = App.name; $('#btn-who').hidden = false; $('#btn-key').hidden = false;
  showDash();
}
window.__studio = { App, genCode, newGame, buildSrcdoc };
init();
