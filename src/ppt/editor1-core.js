/* =====================================================================
   1. Zustand, Hilfsfunktionen, Dialoge, Verlauf (Undo/Redo)
   ===================================================================== */
const { uid, clamp, sanitizeHTML, plainText, rc, TEMPLATES, newMaster, LAYOUTS, SHAPES, SHAPE_GROUPS, layoutPh, newPlaceholders, renderSlide, renderObj,
  FX, CAT_NAMES, START_NAMES, DIR_NAMES, TRANS, TDIR_NAMES, buildSchedule, AnimEngine, validateProject, Player } = PP;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) { const v = attrs[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v === true ? '' : v); }
  kids.flat().forEach(c => { if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
}
const S = {
  proj: null, cur: 0, sel: [], tab: 'start', zoom: 'fit', thumbsOn: true, rightOn: true, notesOn: true, view: 'normal', rtab: 'format',
  fx: null, editing: null, clip: null, snap: true, previewing: null, guides: [], marquee: null, name: 'Präsentation', focusArea: 'stage', player: null, cropMode: false
};
let dirtyThumbs = true;
const curSlide = () => S.proj.slides[S.cur];
const slideIdx = id => S.proj.slides.findIndex(s => s.id === id);
const objById = (id, s) => (s || curSlide()).objects.find(o => o.id === id);
const selObjs = () => S.sel.map(id => objById(id)).filter(Boolean);
const deepCopy = o => JSON.parse(JSON.stringify(o));
const fmt = n => Math.round(n * 10) / 10;

/* ---------- Toast / Menü / Dialog ---------- */
let toastT = 0;
function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.className = err ? 'err' : ''; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => { t.style.display = 'none'; }, err ? 6000 : 2600); }
let openMenu = null;
function closeMenu() { if (openMenu) { openMenu.el.remove(); document.removeEventListener('pointerdown', openMenu.off, true); const a = openMenu.anchor; openMenu = null; if (a && a.isConnected) a.focus(); } }
function showMenu(anchor, items) {
  closeMenu();
  const m = el('div', { class: 'menu', role: 'menu' });
  items.forEach(it => {
    if (it === '-') { m.append(el('hr')); return; } if (it.node) { m.append(it.node); return; }
    const b = el('button', { role: 'menuitem', disabled: it.disabled, html: (it.icon ? icon(it.icon, 18) : '') + '<span></span>' });
    b.lastChild.textContent = it.label; b.addEventListener('click', () => { closeMenu(); it.fn && it.fn(); }); m.append(b);
  });
  document.body.append(m);
  const r = anchor.getBoundingClientRect(); m.style.left = Math.min(r.left, innerWidth - m.offsetWidth - 8) + 'px'; m.style.top = Math.min(r.bottom + 2, innerHeight - m.offsetHeight - 8) + 'px';
  const off = e => { if (!m.contains(e.target)) closeMenu(); };
  document.addEventListener('pointerdown', off, true); openMenu = { el: m, off, anchor };
  const f = m.querySelector('button:not(:disabled)'); if (f) f.focus();
  m.addEventListener('keydown', e => { const bs = $$('button:not(:disabled)', m), i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown') { bs[(i + 1) % bs.length].focus(); e.preventDefault(); } else if (e.key === 'ArrowUp') { bs[(i - 1 + bs.length) % bs.length].focus(); e.preventDefault(); } });
}
const dlgStack = [];
function dialog(o) {
  const back = el('div', { class: 'dlg-back' }), box = el('div', { class: 'dlg' + (o.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title });
  const body = el('div', { class: 'bd' }); if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.append(o.body);
  const ft = el('div', { class: 'ft' });
  const api = { el: box, body, close() { const i = dlgStack.indexOf(api); if (i >= 0) dlgStack.splice(i, 1); back.remove(); o.onClose && o.onClose(); const f = api.returnFocus; if (f && f.isConnected) f.focus(); } };
  (o.buttons || [{ label: 'Schließen' }]).forEach(b => ft.append(el('button', { class: 'btn' + (b.pri ? ' pri' : ''), onclick: () => { if (b.fn && b.fn(api) === false) return; api.close(); } }, b.label)));
  box.append(el('h3', null, o.title), body, ft); back.append(box); document.body.append(back);
  back.addEventListener('pointerdown', e => { if (e.target === back && !o.modal) api.close(); });
  api.returnFocus = document.activeElement; dlgStack.push(api);
  const f = box.querySelector('input,textarea,select') || ft.querySelector('.pri,button'); if (f) f.focus();
  return api;
}

/* ---------- Projekt: neu / Beispiel ---------- */
const SIZES = { '16:9': { w: 1280, h: 720 }, '4:3': { w: 960, h: 720 } };
function mkText(x, y, w, h, html, st, extra) { return Object.assign({ id: uid('o'), type: 'text', name: 'Textfeld', x, y, w, h, rot: 0, html: html || '', st: st || {} }, extra || {}); }
function mkShapeObj(kind, x, y, w, h, fill, extra) { return Object.assign({ id: uid('o'), type: 'shape', kind, name: SHAPES[kind] || 'Form', x, y, w, h, rot: 0, fill: fill || '@a1', stroke: 'none', sw: 0, st: { color: '#ffffff', align: 'center', valign: 'middle', size: 20, bold: true }, html: '' }, extra || {}); }
const lines = (...a) => a.map(t => '<div>' + PP.escHtml(t) + '</div>').join('');
function mkEffect(objId, cat, kind, start, o) {
  const d = FX[cat][kind];
  return Object.assign({ id: uid('e'), objId, cat, kind, start: start || 'click', dur: d.dur, delay: 0 }, d.dir ? { dir: d.dir } : {}, d.amount ? { amount: d.amount } : {}, cat === 'path' ? { path: { dx: 260, dy: 0 } } : {}, o || {});
}
function newSlideData(layout, proj) {
  const p = proj || S.proj; return { id: uid('s'), layout, hidden: false, bg: null, notes: '', objects: newPlaceholders(layout, p.size.w, p.size.h), effects: [], transition: { type: 'none', dur: .7, dir: 'left' }, advClick: true, advTime: null };
}
function blankProject(tpl, sizeKey) {
  const size = Object.assign({}, SIZES[sizeKey || '16:9']), p = { format: 'WebOffice-Praesentation', version: 1, title: 'Präsentation', size, master: newMaster(tpl || 'aurora'), slides: [], assets: {} };
  p.slides.push(newSlideData('title', p)); return p;
}
function makeSampleImage() {
  const c = document.createElement('canvas'); c.width = 640; c.height = 420; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 640, 420); gr.addColorStop(0, '#ff9f1c'); gr.addColorStop(.55, '#e8553d'); gr.addColorStop(1, '#8338ec'); g.fillStyle = gr; g.fillRect(0, 0, 640, 420);
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.arc(470, 130, 90, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(0, 420); g.lineTo(200, 220); g.lineTo(340, 360); g.lineTo(470, 250); g.lineTo(640, 420); g.fill();
  return c.toDataURL('image/png');
}
function sampleProject() {
  const p = blankProject('aurora'); const W = p.size.w, H = p.size.h; p.title = 'Beispielpräsentation'; p.assets.sample1 = makeSampleImage(); p.slides = [];
  // Folie 1: Titel
  let s = newSlideData('title', p); s.objects[0].html = lines('WebOffice Präsentation'); s.objects[1].html = lines('Animationen, Übergänge und Referentenmodus – komplett im Browser');
  s.transition = { type: 'fade', dur: .8, dir: 'left' }; s.effects.push(mkEffect(s.objects[0].id, 'entrance', 'fade', 'after', { dur: .8 }), mkEffect(s.objects[1].id, 'entrance', 'fly', 'after', { dir: 'bottom' }));
  s.notes = 'Begrüßung. Titel und Untertitel erscheinen automatisch (Nach vorheriger).'; p.slides.push(s);
  // Folie 2: Inhalt + Klickgruppen
  s = newSlideData('content', p); s.objects[0].html = lines('Vier Schritte, ein Zeitplan'); s.objects[1].html = lines('Effekt A startet per Klick (500 ms)', 'Effekt B startet mit A, 200 ms verzögert', 'Effekt C startet nach B', 'Effekt D wartet auf den nächsten Klick');
  s.objects[1].w = W * .46; s.objects[1].st = { size: 20, bullets: true };
  const mk = (i, label, fill, kind) => mkShapeObj(kind, W * .55 + (i % 2) * 300, H * .3 + Math.floor(i / 2) * 220, 250, 170, fill, { name: 'Effekt ' + label, html: lines(label) });
  const A = mk(0, 'A', '@a1', 'round'), B = mk(1, 'B', '@a2', 'ellipse'), C = mk(2, 'C', '@a3', 'diamond'), D = mk(3, 'D', '@a4', 'hexagon');
  s.objects.push(A, B, C, D);
  s.effects.push(mkEffect(A.id, 'entrance', 'zoom', 'click', { dur: .5 }), mkEffect(B.id, 'entrance', 'fly', 'with', { dur: .6, delay: .2, dir: 'right' }), mkEffect(C.id, 'entrance', 'fade', 'after', { dur: .5 }), mkEffect(D.id, 'emphasis', 'grow', 'click', { dur: .6 }), mkEffect(D.id, 'exit', 'fade', 'after', { dur: .4 }));
  s.effects[3] = mkEffect(D.id, 'entrance', 'fly', 'click', { dur: .6, dir: 'bottom' }); s.effects[4] = mkEffect(D.id, 'emphasis', 'spin', 'after', { dur: .8 });
  s.transition = { type: 'push', dur: .7, dir: 'right' }; s.notes = 'Hier die Klickgruppen erklären: A+B+C laufen nach einem Klick, D braucht den zweiten.'; p.slides.push(s);
  // Folie 3: Diagramm + Bild + Morph-Basis
  s = newSlideData('blank', p);
  const t3 = mkText(W * .07, H * .06, W * .86, H * .14, lines('Daten und Bilder'), { size: 36, color: '@tt', font: p.master.titleFont, valign: 'middle' }, { name: 'Überschrift' });
  const ch = { id: uid('o'), type: 'chart', name: 'Umsatz', x: W * .07, y: H * .24, w: W * .5, h: H * .62, rot: 0, chart: { kind: 'bar', labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [{ name: '2025', values: [12, 18, 15, 24] }, { name: '2026', values: [16, 22, 21, 30] }] } };
  const im = { id: uid('o'), type: 'image', name: 'Bild', src: 'sample1', x: W * .62, y: H * .26, w: 380, h: 249, rot: 0, lockRatio: true, crop: { l: 0, t: 0, r: 0, b: 0 }, mid: 'm_img' };
  const ball = mkShapeObj('ellipse', W * .62, H * .74, 90, 90, '@a3', { name: '!!Ball', mid: 'm_ball', html: '' });
  s.objects.push(t3, ch, im, ball);
  s.effects.push(mkEffect(ch.id, 'entrance', 'fade', 'click', { dur: .7 }), mkEffect(im.id, 'entrance', 'zoom', 'with', { dur: .6, delay: .3 }), mkEffect(ball.id, 'path', 'arc', 'after', { dur: 1.2, path: { dx: 220, dy: -40 } }));
  s.transition = { type: 'wipe', dur: .8, dir: 'left' }; p.slides.push(s);
  // Folie 4: Kopie von 3 mit verschobenen/vergrößerten Objekten (Morph)
  const s4 = JSON.parse(JSON.stringify(s)); s4.id = uid('s'); const idMap = {};
  s4.objects.forEach(o => { const nid = uid('o'); idMap[o.id] = nid; o.id = nid; }); s4.effects = [];
  const o4 = n => s4.objects.find(o => o.name === n);
  Object.assign(o4('Bild'), { x: W * .08, y: H * .3, w: 640, h: 415 }); Object.assign(o4('!!Ball'), { x: W * .76, y: H * .3, w: 190, h: 190, rot: 90 }); Object.assign(o4('Umsatz'), { x: W * .62, y: H * .62, w: W * .3, h: H * .3 });
  o4('Überschrift').html = lines('Morph: Objekte wandern');
  s4.transition = { type: 'morph', dur: 1.2, dir: 'left' }; s4.notes = 'Gekoppelte Objekte (Bild, Ball, Diagramm) interpolieren Position, Größe und Drehung.'; p.slides.push(s4);
  // Folie 5: Abschnitt/Ende
  s = newSlideData('section', p); s.objects[0].html = lines('Vielen Dank'); s.objects[1].html = lines('Esc beendet die Präsentation – P öffnet die Referentenansicht');
  s.transition = { type: 'dim', dur: 1, dir: 'left' }; s.effects.push(mkEffect(s.objects[0].id, 'entrance', 'fly', 'after', { dir: 'left' })); p.slides.push(s);
  return p;
}

/* ---------- Verlauf ---------- */
const HIST = { stack: [], i: -1, lastLabel: '', lastT: 0 };
const snapshot = () => JSON.stringify({ title: S.proj.title, size: S.proj.size, master: S.proj.master, slides: S.proj.slides, cur: S.proj.slides[S.cur] && S.proj.slides[S.cur].id });
function histReset() { HIST.stack = [snapshot()]; HIST.i = 0; HIST.lastLabel = ''; }
/** Ein zusammenhängender Eingriff = ein Verlaufsschritt. merge: wiederholte gleiche Aktionen (z. B. Pfeiltasten) verschmelzen. */
function commit(label, opt) {
  if (S.editing) { syncEditText(); S.editing = null; S.savedRange = undefined; } // laufende Textbearbeitung wird Teil dieses Schritts
  const snap = snapshot(), now = Date.now();
  if (snap === HIST.stack[HIST.i]) { afterChange(); return; }
  HIST.stack.length = HIST.i + 1;
  if (opt && opt.merge && HIST.lastLabel === label && now - HIST.lastT < 900 && HIST.i > 0) HIST.stack[HIST.i] = snap; else { HIST.stack.push(snap); HIST.i++; if (HIST.stack.length > 120) { HIST.stack.shift(); HIST.i--; } }
  HIST.lastLabel = label; HIST.lastT = now; S.dirty = true; stopPreview(true); afterChange(); scheduleAutosave();
}
function restoreSnap(str) {
  const d = JSON.parse(str); S.proj.title = d.title; S.proj.size = d.size; S.proj.master = d.master; S.proj.slides = d.slides;
  const i = S.proj.slides.findIndex(s => s.id === d.cur); S.cur = i >= 0 ? i : clamp(S.cur, 0, S.proj.slides.length - 1);
  const ids = new Set(curSlide().objects.map(o => o.id)); S.sel = S.sel.filter(id => ids.has(id)); if (S.fx && !curSlide().effects.some(e => e.id === S.fx)) S.fx = null; S.editing = null;
}
function undo() { if (HIST.i > 0) { stopPreview(true); HIST.i--; restoreSnap(HIST.stack[HIST.i]); HIST.lastLabel = ''; S.dirty = true; afterChange(); scheduleAutosave(); } }
function redo() { if (HIST.i < HIST.stack.length - 1) { stopPreview(true); HIST.i++; restoreSnap(HIST.stack[HIST.i]); HIST.lastLabel = ''; S.dirty = true; afterChange(); scheduleAutosave(); } }
