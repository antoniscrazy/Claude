/* =====================================================================
   Einstellungen (alle Apps): Design hell/dunkel/automatisch, Akzentfarbe, Touch-Modus, Kontrast, Bewegung,
   Oberflächen-Schriftgröße, Autosave, app-spezifische Optionen. Speicherung pro App im lokalen Speicher.
   Außerdem: Fixierung der Seite gegen Verrutschen auf Touch-Geräten.
   ===================================================================== */
const WO = { app: 'app', cfg: {}, extra: [], accent0: '' };
const WO_DEFAULTS = { theme: 'light', accent: '', canvasDark: false, touch: 'auto', contrast: false, reduceMotion: false, uiFont: 13, autosave: true, ribbonMin: false };
function woLoad() { try { const raw = localStorage.getItem('webOffice.settings.' + WO.app); if (raw) return Object.assign({}, WO_DEFAULTS, JSON.parse(raw)); } catch (e) { } return Object.assign({}, WO_DEFAULTS); }
function woSave() { try { localStorage.setItem('webOffice.settings.' + WO.app, JSON.stringify(WO.cfg)); } catch (e) { } }
function woApply() {
  const c = WO.cfg, r = document.documentElement, dark = c.theme === 'dark' || (c.theme === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  r.dataset.theme = dark ? 'dark' : 'light'; r.dataset.canvas = c.canvasDark && dark ? 'dark' : 'light'; r.dataset.contrast = c.contrast ? 'high' : 'normal'; r.dataset.motion = c.reduceMotion ? 'reduce' : 'normal';
  const touch = c.touch === 'on' || (c.touch === 'auto' && window.matchMedia && matchMedia('(pointer: coarse)').matches); r.dataset.touch = touch ? 'on' : 'off';
  r.style.setProperty('--ui-font', clamp(+c.uiFont || 13, 11, 18) + 'px');
  if (c.accent) { r.style.setProperty('--ac', c.accent); r.style.setProperty('--ac2', c.accent); } else { r.style.removeProperty('--ac'); r.style.removeProperty('--ac2'); }
  const meta = document.querySelector('meta[name=theme-color]') || Object.assign(document.createElement('meta'), { name: 'theme-color' }); meta.content = getComputedStyle(r).getPropertyValue('--ac').trim() || '#1f5fbf'; if (!meta.parentNode) document.head.append(meta);
  window.dispatchEvent(new Event('resize'));
}
(() => { const si = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (WO.cfg && WO.cfg.autosave === false && /autosave/i.test(k)) return; return si.call(this, k, v); }; })();
function woSet(k, v) { WO.cfg[k] = v; woSave(); woApply(); }
const ACCENTS = [['Standard', ''], ['Blau', '#1f5fbf'], ['Grün', '#1f7a45'], ['Orange', '#d9461f'], ['Violett', '#6d3fc0'], ['Rot', '#b4232a'], ['Petrol', '#0f766e'], ['Grau', '#4b5563']];
function woRow(label, hint, control) { return el('div', { class: 'setrow' }, el('label', null, label, hint ? el('small', null, hint) : ''), control); }
function woSwitch(get, set) { const i = el('input', { type: 'checkbox', role: 'switch' }); i.checked = !!get(); i.addEventListener('change', () => set(i.checked)); return el('span', { class: 'switch' }, i, el('span')); }
function woSelect(opts, get, set) { const s = el('select', null, ...opts.map(([v, t]) => el('option', { value: v }, t))); s.value = String(get()); s.addEventListener('change', () => set(s.value)); return s; }
function openSettings() {
  const body = el('div', { class: 'setdlg' });
  const sw = (k, label, hint, after) => woRow(label, hint, woSwitch(() => WO.cfg[k], v => { woSet(k, v); if (after) after(v); }));
  const accRow = el('div', { class: 'swatches' }); const drawAcc = () => { accRow.replaceChildren(...ACCENTS.map(([n, c]) => { const b = el('button', { title: n, 'aria-label': 'Akzentfarbe ' + n, class: (WO.cfg.accent || '') === c ? 'on' : '', style: 'background:' + (c || WO.accent0) }); b.addEventListener('click', () => { woSet('accent', c); drawAcc(); }); return b; })); }; drawAcc();
  body.append(el('h4', null, 'Darstellung'),
    woRow('Design', 'Hell, dunkel oder wie das Gerät', woSelect([['light', 'Hell'], ['dark', 'Dunkel'], ['auto', 'Automatisch (System)']], () => WO.cfg.theme, v => woSet('theme', v))),
    woRow('Akzentfarbe', 'Farbe von Titelleiste und Hervorhebungen', accRow),
    sw('canvasDark', WO.canvasLabel || 'Dokumentfläche im Dunkelmodus abdunkeln', 'Nur Anzeige – Farben im Dokument bleiben gespeichert', null),
    woRow('Schriftgröße der Oberfläche', null, woSelect([['12', 'Klein'], ['13', 'Normal'], ['15', 'Groß'], ['17', 'Sehr groß']], () => String(WO.cfg.uiFont), v => woSet('uiFont', +v))),
    woRow('Touch-Modus', 'Größere Schaltflächen und Menüs', woSelect([['auto', 'Automatisch'], ['on', 'Ein'], ['off', 'Aus']], () => WO.cfg.touch, v => woSet('touch', v))),
    sw('contrast', 'Hoher Kontrast', 'Kräftigere Rahmen und Schrift'), sw('reduceMotion', 'Animationen reduzieren', 'Keine Übergänge in der Oberfläche'),
    sw('ribbonMin', 'Menüband beim Start einklappen', 'Platz sparen (Doppelklick auf einen Reiter klappt es wieder aus)', v => { const a = document.getElementById('app'); if (a.classList.contains('rbmin') !== v) toggleRibbonMin(); }));
  if (WO.extra.length) { body.append(el('h4', null, 'Bearbeiten')); WO.extra.forEach(x => { if (x.type === 'select') body.append(woRow(x.label, x.hint, woSelect(x.opts, x.get, x.set))); else body.append(woRow(x.label, x.hint, woSwitch(x.get, x.set))); }); }
  body.append(el('h4', null, 'Daten'),
    sw('autosave', 'Automatisch sichern', 'Arbeitsstand im Browser speichern und beim nächsten Öffnen wiederherstellen'),
    woRow('Gespeicherten Arbeitsstand löschen', 'Entfernt nur die automatische Sicherung im Browser', el('button', { class: 'btn', onclick: () => { try { Object.keys(localStorage).filter(k => /autosave/i.test(k)).forEach(k => localStorage.removeItem(k)); toast('Automatische Sicherung gelöscht.'); } catch (e) { toast('Löschen nicht möglich.', true); } } }, 'Löschen')),
    woRow('Einstellungen zurücksetzen', null, el('button', { class: 'btn', onclick: () => { WO.cfg = Object.assign({}, WO_DEFAULTS); woSave(); woApply(); toast('Einstellungen zurückgesetzt.'); closeSettings(); } }, 'Zurücksetzen')),
    el('p', { class: 'hint' }, 'WebOffice läuft vollständig lokal im Browser. Einstellungen werden nur auf diesem Gerät gespeichert.'));
  WO.dlg = dialog({ title: 'Einstellungen', wide: true, body, buttons: [{ label: 'Fertig', pri: true }] });
}
function closeSettings() { if (WO.dlg && WO.dlg.close) WO.dlg.close(); }
const SET_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>';
function initSettings(app, opts) {
  opts = opts || {}; WO.app = app; WO.extra = opts.extra || []; WO.canvasLabel = opts.canvasLabel; WO.cfg = woLoad(); WO.accent0 = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim(); woApply();
  const ss = document.getElementById('savestat'); if (ss && !document.getElementById('qSet')) { const b = el('button', { class: 'qa', id: 'qSet', title: 'Einstellungen', 'aria-label': 'Einstellungen', html: SET_ICON, onclick: openSettings }); ss.after(b); }
  if (window.matchMedia) { const mq = matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(() => { if (WO.cfg.theme === 'auto') woApply(); }); }
  if (WO.cfg.ribbonMin && !document.getElementById('app').classList.contains('rbmin')) toggleRibbonMin();
  if (opts.onReady) opts.onReady();
}
/* ---- Seite fixieren: kein Verrutschen durch Wischen, Fokus oder Scrollen ---- */
(() => {
  const lock = () => { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); const a = document.getElementById('app'); if (a && (a.scrollTop || a.scrollLeft)) { a.scrollTop = 0; a.scrollLeft = 0; } if (document.scrollingElement && (document.scrollingElement.scrollTop || document.scrollingElement.scrollLeft)) { document.scrollingElement.scrollTop = 0; document.scrollingElement.scrollLeft = 0; } };
  window.addEventListener('scroll', lock, { passive: true }); document.addEventListener('scroll', lock, { passive: true, capture: false });
  document.addEventListener('focusin', () => setTimeout(lock, 0));
  const SCROLLY = 'input,#viewport,#scroller,#ribbon,#tabs,#thumbs,#right,#rbody,#nav,#navlist,#stageArea,#notes textarea,.dlg .bd,.menu,#sorter,#sheettabs,#pv,textarea,.palette,#tsres,select';
  document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) { e.preventDefault(); return; } if (!(e.target.closest && e.target.closest(SCROLLY))) e.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, e => e.preventDefault()));
  document.addEventListener('wheel', e => { if (e.ctrlKey && !(e.target.closest && e.target.closest('#stageArea'))) e.preventDefault(); }, { passive: false });
})();
