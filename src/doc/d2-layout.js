/* =====================================================================
   2. Rendering, Paginierung (Seitenfluss), Seitenblätter, Navigation, Suchen/Ersetzen, Verlauf
   Paginierung: Blöcke rücken als Ganzes auf die nächste Seite; Tabellenzeilen und Listenpunkte werden einzeln verteilt.
   Ein einzelner Block, der höher als eine Seite ist, wird nicht abgeschnitten: sein Blatt wächst entsprechend.
   ===================================================================== */
let pagTimer = 0, ckTimer = 0;
const docEl = () => $('#doc');
function applyGeometry() {
  const g = pageGeom(), d = docEl();
  d.style.width = g.W + 'px'; d.style.paddingLeft = g.ml + 'px'; d.style.paddingRight = g.mr + 'px'; d.style.paddingTop = g.mt + 'px'; d.style.paddingBottom = g.mb + 'px';
}
function renderDoc() {
  const d = docEl(); d.replaceChildren(blocksToDOM(S.doc.blocks, S.doc.assets)); applyGeometry(); paginate();
}
const isSpacer = n => n.nodeType === 1 && n.classList.contains('spacer');
function mkSpacer(kind, h, cols) {
  let s; if (kind === 'row') { s = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = cols || 1; td.style.height = h + 'px'; td.contentEditable = 'false'; s.append(td); }
  else { s = document.createElement(kind === 'li' ? 'li' : 'div'); s.style.height = h + 'px'; s.contentEditable = 'false'; } s.className = 'spacer'; return s;
}
function paginate() {
  const d = docEl(), g = pageGeom(), z = S.zoom; $$('.spacer', d).forEach(x => x.remove());
  const units = []; Array.from(d.children).forEach(ch => {
    if (ch.tagName === 'TABLE') Array.from(ch.rows).forEach(r => units.push({ el: r, kind: 'row', cols: r.cells.length, block: ch }));
    else if (ch.tagName === 'UL' || ch.tagName === 'OL') Array.from(ch.children).forEach(li => units.push({ el: li, kind: 'li', block: ch }));
    else units.push({ el: ch, kind: 'block', block: ch });
  });
  const dr = d.getBoundingClientRect(), pos = units.map(u => { const r = u.el.getBoundingClientRect(); return { top: (r.top - dr.top) / z, bottom: (r.bottom - dr.top) / z }; });
  const pages = [{ y: 0, start: 0, end: -1 }]; let shift = 0, pageStart = units.length ? pos[0].top : g.mt; const inserts = [];
  for (let i = 0; i < units.length; i++) {
    const pg = pages[pages.length - 1], forced = i > 0 && units[i - 1].el.classList && units[i - 1].el.classList.contains('b-pb');
    const overflow = pos[i].bottom - pageStart > g.ch + .5, first = i === pg.start;
    if (i > 0 && !first && (overflow || forced)) {
      const prevBottomFinal = pos[i - 1].bottom + shift; pg.end = i - 1;
      const sheetH = Math.max(g.H, prevBottomFinal + g.mb - pg.y), yNext = pg.y + sheetH + GAP, h = yNext + g.mt - prevBottomFinal; pg.h = sheetH;
      inserts.push({ before: units[i], kind: units[i].kind, h, cols: units[i].cols }); shift += h; pages.push({ y: yNext, start: i, end: -1 }); pageStart = pos[i].top;
    }
  }
  const last = pages[pages.length - 1]; last.end = units.length - 1; const lastBottomFinal = units.length ? pos[units.length - 1].bottom + shift : g.mt; last.h = Math.max(g.H, lastBottomFinal + g.mb - last.y);
  inserts.forEach(s => { const sp = mkSpacer(s.kind, s.h, s.cols); s.before.el.parentNode.insertBefore(sp, s.before.el); });
  S.pages = pages; S.units = units; S.unitPage = new Map(); pages.forEach((p, k) => { for (let i = p.start; i <= p.end; i++) { S.unitPage.set(units[i].el, k); if (!S.unitPage.has(units[i].block)) S.unitPage.set(units[i].block, k); } });
  const total = last.y + last.h + GAP; d.style.minHeight = (last.y + last.h) + 'px'; d.style.paddingBottom = Math.max(g.mb, last.y + last.h - (lastBottomFinal)) + 'px';
  $('#pages').style.height = total + 'px'; $('#pages').style.width = g.W + 'px'; $('#zoomwrap').style.width = g.W * z + 'px'; $('#zoomwrap').style.height = total * z + 'px'; $('#pages').style.transform = 'scale(' + z + ')';
  renderSheets(); renderStatus(); renderNav();
}
function pnText(k, n) { return S.doc.hf.pnFmt === 'of' ? 'Seite ' + (k + 1) + ' von ' + n : String(k + 1); }
function renderSheets() {
  const L = $('#sheets'), g = pageGeom(), hf = S.doc.hf, n = S.pages.length; L.replaceChildren();
  S.pages.forEach((p, k) => {
    const s = el('div', { class: 'sheet', style: `top:${p.y}px;height:${p.h}px;width:${g.W}px`, 'data-page': k });
    const mk = (cls, txt, side, top) => el('div', { class: 'hf ' + cls, style: `${side};${top ? 'top:' + (g.mt * .45 - 8) + 'px' : 'bottom:' + (g.mb * .45 - 8) + 'px'}` }, txt);
    if (hf.header) s.append(mk('h', hf.header, 'left:' + g.ml + 'px', true)); if (hf.footer) s.append(mk('f', hf.footer, 'left:' + g.ml + 'px', false));
    if (hf.pn === 'footer-center') s.append(el('div', { class: 'hf f pn', style: `left:0;right:0;text-align:center;bottom:${g.mb * .45 - 8}px` }, pnText(k, n)));
    else if (hf.pn === 'footer-right') s.append(el('div', { class: 'hf f pn', style: `right:${g.mr}px;bottom:${g.mb * .45 - 8}px` }, pnText(k, n)));
    else if (hf.pn === 'header-right') s.append(el('div', { class: 'hf h pn', style: `right:${g.mr}px;top:${g.mt * .45 - 8}px` }, pnText(k, n)));
    L.append(s);
  });
}
function schedulePaginate() { clearTimeout(pagTimer); pagTimer = setTimeout(paginate, 120); }
function currentUnitEl() { const sel = getSelection(); if (!sel.rangeCount) return null; let n = sel.getRangeAt(0).startContainer; if (!docEl().contains(n)) return null; if (n.nodeType === 3) n = n.parentNode; const u = n.closest('tr,li,.b-pb,figure,p,h1,h2,h3,table,div'); return u; }
function currentPage() { let e = currentUnitEl(); while (e && e !== docEl()) { if (S.unitPage.has(e)) return S.unitPage.get(e); e = e.parentNode; } return 0; }
function renderStatus() {
  const txt = docEl().innerText.replace(/​/g, ''), words = (txt.trim().match(/\S+/g) || []).length, chars = txt.replace(/[\r\n]/g, '').length;
  $('#stpage').textContent = 'Seite ' + (currentPage() + 1) + ' von ' + S.pages.length; $('#stwords').textContent = words + ' Wörter'; $('#stchars').textContent = chars + ' Zeichen';
}
function renderNav() {
  const nav = $('#navlist'); if (!nav) return; nav.replaceChildren(); const hs = $$('#doc h1,#doc h2,#doc h3,#doc .s-title');
  if (!hs.length) { nav.append(el('p', { class: 'hint' }, 'Keine Überschriften. Weisen Sie Absätzen die Formatvorlagen „Überschrift 1–3“ zu.')); return; }
  hs.forEach(h => { const lvl = h.tagName === 'H1' || h.classList.contains('s-title') ? 0 : h.tagName === 'H2' ? 1 : 2, t = h.textContent.trim() || '(leer)'; const pg = (S.unitPage.get(h) ?? 0) + 1;
    nav.append(el('button', { class: 'navi l' + lvl, title: t, onclick: () => { h.scrollIntoView({ block: 'center', behavior: 'auto' }); const r = document.createRange(); r.selectNodeContents(h); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); docEl().focus({ preventScroll: true }); renderStatus(); } }, el('span', { class: 'nt' }, t), el('span', { class: 'np' }, String(pg)))); });
}

/* ---------- Verlauf ---------- */
const HIST = { stack: [], i: -1 };
function getCaret() {
  const sel = getSelection(); if (!sel.rangeCount || !docEl().contains(sel.anchorNode)) return null; const r = sel.getRangeAt(0);
  let n = r.startContainer; if (n.nodeType === 3) n = n.parentNode; const blk = n.closest('li,td,th,p,h1,h2,h3'); if (!blk || !docEl().contains(blk)) return null;
  const list = $$('#doc p,#doc h1,#doc h2,#doc h3,#doc li,#doc td,#doc th').filter(x => !x.closest('.spacer')), idx = list.indexOf(blk); if (idx < 0) return null;
  const rr = document.createRange(); rr.selectNodeContents(blk); rr.setEnd(r.startContainer, r.startOffset); return { idx, off: rr.toString().length };
}
function setCaret(c) {
  if (!c) return; const list = $$('#doc p,#doc h1,#doc h2,#doc h3,#doc li,#doc td,#doc th').filter(x => !x.closest('.spacer')), blk = list[Math.min(c.idx, list.length - 1)]; if (!blk) return;
  const w = document.createTreeWalker(blk, NodeFilter.SHOW_TEXT); let left = c.off, n, last = null; while ((n = w.nextNode())) { last = n; if (left <= n.length) { const r = document.createRange(); r.setStart(n, left); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return; } left -= n.length; }
  const r = document.createRange(); if (last) { r.setStart(last, last.length); } else r.setStart(blk, 0); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
}
const snap = () => JSON.stringify({ title: S.name, page: S.doc.page, hf: S.doc.hf, blocks: S.doc.blocks });
function syncModel() { fixNesting(); S.doc.blocks = domToBlocks(docEl()); }
function histReset() { syncModel(); HIST.stack = [{ s: snap(), caret: null }]; HIST.i = 0; updateUndoBtns(); }
/** Verlaufsschritt: Modell aus DOM ableiten und bei Änderung einen Eintrag anlegen */
function checkpoint() {
  clearTimeout(ckTimer); syncModel(); const s = snap(), top = HIST.stack[HIST.i]; if (top && top.s === s) { return false; }
  HIST.stack.length = HIST.i + 1; HIST.stack.push({ s, caret: getCaret() }); HIST.i++; if (HIST.stack.length > 150) { HIST.stack.shift(); HIST.i--; } S.dirty = true; scheduleAutosave(); updateUndoBtns(); return true;
}
function applySnap(entry) { const d = JSON.parse(entry.s); S.name = d.title; S.doc.page = d.page; S.doc.hf = d.hf; S.doc.blocks = d.blocks; renderDoc(); docEl().focus({ preventScroll: true }); setCaret(entry.caret || HIST.stack[HIST.i].caret); refreshRibbon(); renderStatus(); }
function undo() { checkpoint(); if (HIST.i > 0) { const c = getCaret(); HIST.stack[HIST.i].caret = HIST.stack[HIST.i].caret || c; HIST.i--; applySnap({ s: HIST.stack[HIST.i].s, caret: HIST.stack[HIST.i + 1].caret }); S.dirty = true; scheduleAutosave(); updateUndoBtns(); } }
function redo() { if (HIST.i < HIST.stack.length - 1) { HIST.i++; applySnap(HIST.stack[HIST.i]); S.dirty = true; scheduleAutosave(); updateUndoBtns(); } }
function updateUndoBtns() { const u = $('#qUndo'), r = $('#qRedo'); if (u) { u.disabled = HIST.i <= 0; r.disabled = HIST.i >= HIST.stack.length - 1; } }
function onInput() { S.dirty = true; clearTimeout(ckTimer); ckTimer = setTimeout(() => { checkpoint(); }, 500); schedulePaginate(); refreshRibbon(); }

/* ---------- Suchen und Ersetzen ---------- */
const FIND = { q: '', cs: false, matches: [], i: -1 };
function collectMatches() {
  FIND.matches = []; if (!FIND.q) return; const w = document.createTreeWalker(docEl(), NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentNode.closest('.spacer,.b-pb') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT }); let n;
  const q = FIND.cs ? FIND.q : FIND.q.toLowerCase();
  while ((n = w.nextNode())) { const t = FIND.cs ? n.data : n.data.toLowerCase(); let i = 0; while ((i = t.indexOf(q, i)) >= 0) { FIND.matches.push({ node: n, start: i, end: i + q.length }); i += Math.max(1, q.length); } }
}
function highlight() {
  if (!window.CSS || !CSS.highlights || typeof Highlight === 'undefined') return; CSS.highlights.delete('find'); CSS.highlights.delete('findcur');
  const mk = m => { const r = new Range(); r.setStart(m.node, m.start); r.setEnd(m.node, m.end); return r; };
  if (FIND.matches.length) CSS.highlights.set('find', new Highlight(...FIND.matches.map(mk))); if (FIND.matches[FIND.i]) CSS.highlights.set('findcur', new Highlight(mk(FIND.matches[FIND.i])));
}
function findInfo() { const t = $('#findinfo'); if (t) t.textContent = !FIND.q ? '' : FIND.matches.length ? 'Treffer ' + (FIND.i + 1) + ' von ' + FIND.matches.length : 'Keine Treffer'; }
function gotoMatch(i) {
  if (!FIND.matches.length) { FIND.i = -1; highlight(); findInfo(); return; } FIND.i = (i + FIND.matches.length) % FIND.matches.length; const m = FIND.matches[FIND.i];
  const r = document.createRange(); r.setStart(m.node, m.start); r.setEnd(m.node, m.end); const s = getSelection(); s.removeAllRanges(); s.addRange(r); m.node.parentElement.scrollIntoView({ block: 'center' }); highlight(); findInfo(); S.selRange = r.cloneRange();
}
function doFind(q, cs, dir) { const changed = q !== FIND.q || cs !== FIND.cs; FIND.q = q; FIND.cs = cs; collectMatches(); if (changed) FIND.i = -1; gotoMatch(dir < 0 ? (FIND.i < 0 ? FIND.matches.length - 1 : FIND.i - 1) : FIND.i + 1); }
function replaceCurrent(rep) {
  if (!FIND.q) return; collectMatches(); if (FIND.i < 0 || FIND.i >= FIND.matches.length) { gotoMatch(0); return; } const m = FIND.matches[FIND.i], keep = FIND.i;
  m.node.data = m.node.data.slice(0, m.start) + rep + m.node.data.slice(m.end); checkpoint(); paginate(); collectMatches(); gotoMatch(Math.min(keep, FIND.matches.length - 1));
}
function replaceAll(rep) {
  if (!FIND.q) return 0; collectMatches(); const n = FIND.matches.length; if (!n) { findInfo(); return 0; }
  for (let i = FIND.matches.length - 1; i >= 0; i--) { const m = FIND.matches[i]; m.node.data = m.node.data.slice(0, m.start) + rep + m.node.data.slice(m.end); }
  checkpoint(); paginate(); collectMatches(); FIND.i = -1; highlight(); const t = $('#findinfo'); if (t) t.textContent = n + ' Ersetzung' + (n === 1 ? '' : 'en') + ' vorgenommen'; return n;
}
