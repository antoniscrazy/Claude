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
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', up: '<path d="m18 15-6-6-6 6"/>', down2: '<path d="m6 9 6 6 6-6"/>', sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>', ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', mouse: '<rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/>', pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'
};
const ic = (n, c) => `<svg class="i${c ? ' ' + c : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

// ---------------- Zustand ----------------
const App = { scr: '', sel: null, name: LS.get('moki-studio-name', ''), token: '', mine: null, g: null, view: 'dash', tab: 'builder', cons: [], loadErr: '' };
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

