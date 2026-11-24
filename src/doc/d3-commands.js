/* =====================================================================
   3. Befehle: Dialoge, Formatierung, Absätze, Formatvorlagen, Tabellen, Bilder, Seite einrichten, Suchen
   ===================================================================== */
let toastT = 0;
function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.className = err ? 'err' : ''; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => { t.style.display = 'none'; }, err ? 6000 : 2600); }
const dlgStack = [];
function dialog(o) {
  const back = el('div', { class: 'dlg-back' }), box = el('div', { class: 'dlg' + (o.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title }), body = el('div', { class: 'bd' }); if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.append(o.body);
  const ft = el('div', { class: 'ft' }), api = { el: box, close() { const i = dlgStack.indexOf(api); if (i >= 0) dlgStack.splice(i, 1); back.remove(); if (o.onClose) o.onClose(); if (!o.noRestore) { docEl().focus({ preventScroll: true }); restoreSel(); } } };
  (o.buttons || [{ label: 'Schließen' }]).forEach(b => ft.append(el('button', { class: 'btn' + (b.pri ? ' pri' : ''), onclick: () => { if (b.fn && b.fn(api) === false) return; api.close(); } }, b.label)));
  box.append(el('h3', null, o.title), body, ft); back.append(box); document.body.append(back); back.addEventListener('pointerdown', e => { if (e.target === back) api.close(); }); dlgStack.push(api);
  const f = box.querySelector('input,select,textarea') || ft.querySelector('.pri,button'); if (f) f.focus(); return api;
}
let menuEl = null;
function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; document.removeEventListener('pointerdown', menuOff, true); } }
const menuOff = e => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); };
function showMenu(anchor, items) {
  closeMenu(); const m = el('div', { class: 'menu', role: 'menu' }); items.forEach(it => { if (it === '-') { m.append(el('hr')); return; } const b = el('button', { role: 'menuitem', disabled: it.disabled }, it.label); b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', () => { closeMenu(); it.fn && it.fn(); }); m.append(b); });
  document.body.append(m); const r = anchor.getBoundingClientRect(); m.style.left = Math.max(4, Math.min(r.left, innerWidth - m.offsetWidth - 6)) + 'px'; m.style.top = Math.min(r.bottom + 2, innerHeight - m.offsetHeight - 6) + 'px'; menuEl = m; document.addEventListener('pointerdown', menuOff, true);
}

/* ---------- Auswahl bewahren ---------- */
function saveSel() { const s = getSelection(); if (s.rangeCount && docEl().contains(s.anchorNode)) S.selRange = s.getRangeAt(0).cloneRange(); }
function restoreSel() { if (!S.selRange) return; try { docEl().focus({ preventScroll: true }); const s = getSelection(); s.removeAllRanges(); s.addRange(S.selRange); } catch (e) { } }
const selInDoc = () => { const s = getSelection(); return s.rangeCount && docEl().contains(s.anchorNode); };
function ensureSel() { if (!selInDoc()) restoreSel(); }

/* ---------- Zeichenformat ---------- */
function fixFonts() {
  $$('#doc font').forEach(f => { const sp = document.createElement('span'); if (f.size === '7' && f.dataset.px) sp.style.fontSize = f.dataset.px; else if (f.size === '7' && S.pendingPx) sp.style.fontSize = S.pendingPx; if (f.face) sp.style.fontFamily = f.face; if (f.color) sp.style.color = f.color; sp.append(...f.childNodes); f.replaceWith(sp); });
}
function exec(cmd, val, css) { ensureSel(); document.execCommand('styleWithCSS', false, !!css); document.execCommand(cmd, false, val); fixFonts(); saveSel(); onInput(); checkpoint(); refreshRibbon(); }
function setFontSize(pt) { ensureSel(); S.pendingPx = Math.round(pt * 96 / 72 * 10) / 10 + 'px'; document.execCommand('styleWithCSS', false, false); document.execCommand('fontSize', false, '7'); fixFonts(); S.pendingPx = null; saveSel(); onInput(); checkpoint(); refreshRibbon(); }
function queryState(c) { try { return document.queryCommandState(c); } catch (e) { return false; } }
function curFontSizePt() { const s = getSelection(); if (!s.rangeCount) return 11; let n = s.anchorNode; if (n && n.nodeType === 3) n = n.parentNode; if (!n || !docEl().contains(n)) return 11; return Math.round(parseFloat(getComputedStyle(n).fontSize) * 72 / 96 * 2) / 2; }
function curFontFamily() { const s = getSelection(); let n = s.anchorNode; if (n && n.nodeType === 3) n = n.parentNode; if (!n || !docEl().contains(n)) return ''; const f = getComputedStyle(n).fontFamily.replace(/"/g, '').split(',')[0].trim().toLowerCase(); const m = FONTS.find(x => x[1].toLowerCase() === f); return m ? m[0] : ''; }
function clearFormat() { ensureSel(); document.execCommand('removeFormat'); $$('#doc span[style]').forEach(sp => { if (getSelection().rangeCount && getSelection().getRangeAt(0).intersectsNode(sp)) { sp.removeAttribute('style'); } }); onInput(); checkpoint(); refreshRibbon(); }

/* ---------- Absätze ---------- */
function topBlocks() { // alle Absatz-Elemente (p/h/li), die von der Auswahl berührt werden
  ensureSel(); const s = getSelection(); if (!s.rangeCount) return []; const r = s.getRangeAt(0);
  return $$('#doc > p, #doc > h1, #doc > h2, #doc > h3, #doc > ul > li, #doc > ol > li, #doc > div:not(.spacer):not(.b-pb), #doc > figure').filter(e => !e.classList.contains('spacer') && r.intersectsNode(e) && (r.collapsed ? e.contains(r.startContainer) || r.startContainer === docEl() : true));
}
function paraSet(fn, label) { const bs = topBlocks(); if (!bs.length) return; bs.forEach(fn); saveSel(); onInput(); checkpoint(); paginate(); refreshRibbon(); }
const setAlign = a => paraSet(e => { e.style.textAlign = a === 'left' ? '' : a; });
const setLineH = v => paraSet(e => { e.style.lineHeight = v; });
const setSpace = (k, v) => paraSet(e => { e.style[k] = v + 'pt'; });
const setIndent = d => paraSet(e => { const cur = parseFloat(e.style.marginLeft) || 0, n = clamp(cur + d, 0, 100); e.style.marginLeft = n ? n + 'mm' : ''; });
/* Auswahl über das Ersetzen von Blockelementen hinweg bewahren: Zeichenabstand je Block merken, danach neu aufbauen */
function offsetIn(blk, node, off) { const r = document.createRange(); r.selectNodeContents(blk); r.setEnd(node, off); return r.toString().length; }
function posIn(blk, n) { const w = document.createTreeWalker(blk, NodeFilter.SHOW_TEXT); let t, last = null; while ((t = w.nextNode())) { last = t; if (n <= t.length) return [t, n]; n -= t.length; } return last ? [last, last.length] : [blk, 0]; }
function captureSel(blocks) {
  const s = getSelection(); if (!s.rangeCount) return null; const r = s.getRangeAt(0), f = (node, off) => { for (let i = 0; i < blocks.length; i++) { if (blocks[i] === node || blocks[i].contains(node)) return { i, o: blocks[i] === node ? 0 : offsetIn(blocks[i], node, off) }; } return null; };
  const a = f(r.startContainer, r.startOffset), z = f(r.endContainer, r.endOffset); return a && z ? { a, z } : null;
}
function restoreCapture(cap, blocks) { if (!cap) return; const [sn, so] = posIn(blocks[cap.a.i], cap.a.o), [en, eo] = posIn(blocks[cap.z.i], cap.z.o), r = document.createRange(); r.setStart(sn, so); r.setEnd(en, eo); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
function setBlockStyle(st) {
  const bs = topBlocks().filter(e => /^(P|H1|H2|H3|DIV)$/.test(e.tagName)); if (!bs.length) { toast('Formatvorlagen gelten für Absätze (nicht für Listenpunkte).'); return; }
  const cap = captureSel(bs), nbs = [];
  bs.forEach(e => { const n = document.createElement(STYLE_TAG[st]); if (st === 'title') n.className = 's-title'; if (st === 'subtitle') n.className = 's-subtitle'; ['textAlign', 'lineHeight', 'marginLeft'].forEach(k => { if (e.style[k]) n.style[k] = e.style[k]; });
    n.append(...e.childNodes); if (!n.childNodes.length) n.innerHTML = '<br>'; e.replaceWith(n); nbs.push(n); });
  restoreCapture(cap, nbs); if (!cap && nbs.length) caretTo(nbs[0]); saveSel(); onInput(); checkpoint(); paginate(); refreshRibbon();
}
function curStyle() { const bs = topBlocks(); if (!bs.length) return null; const e = bs[0]; if (e.tagName === 'LI') return 'normal'; return { H1: 'h1', H2: 'h2', H3: 'h3' }[e.tagName] || (e.classList.contains('s-title') ? 'title' : e.classList.contains('s-subtitle') ? 'subtitle' : 'normal'); }
/** Liste selbst umschalten (execCommand verschiebt den Cursor und verschachtelt Listen in Absätzen) */
const COPY_PROPS = ['textAlign', 'lineHeight', 'marginLeft'];
function liToP(li) {
  const list = li.parentNode, p = document.createElement('p'); p.append(...li.childNodes); if (!p.childNodes.length) p.innerHTML = '<br>'; COPY_PROPS.forEach(k => { if (li.style[k]) p.style[k] = li.style[k]; });
  const after = []; for (let n = li.nextElementSibling; n; n = n.nextElementSibling) after.push(n);
  if (after.length) { const nl = list.cloneNode(false); if (list.tagName === 'OL') nl.setAttribute('start', Array.from(list.children).indexOf(li) + 2); nl.append(...after); list.after(nl); }
  list.after(p); li.parentNode.removeChild(li); if (!list.children.length) list.parentNode.removeChild(list); return p;
}
function toggleList(kind) {
  const bs = topBlocks().filter(e => /^(P|H1|H2|H3|LI|DIV)$/.test(e.tagName) && !e.classList.contains('b-pb')); if (!bs.length) return; const cap = captureSel(bs), out = [];
  const allIn = bs.every(e => e.tagName === 'LI' && e.parentNode.tagName.toLowerCase() === kind);
  bs.forEach(e => {
    let cur = e;
    if (e.tagName === 'LI') { if (allIn || e.parentNode.tagName.toLowerCase() !== kind) cur = liToP(e); else { out.push(e); return; } }
    if (allIn) { out.push(cur); return; }
    const li = document.createElement('li'); li.append(...cur.childNodes); if (!li.childNodes.length) li.innerHTML = '<br>'; COPY_PROPS.forEach(k => { if (cur.style[k]) li.style[k] = cur.style[k]; });
    const prev = cur.previousElementSibling;
    if (prev && prev.tagName.toLowerCase() === kind) { prev.append(li); cur.parentNode.removeChild(cur); } else { const l = document.createElement(kind); l.append(li); cur.replaceWith(l); }
    out.push(li);
  });
  restoreCapture(cap, out); saveSel(); onInput(); checkpoint(); paginate(); refreshRibbon();
}
function fixNesting() { // unzulässige Verschachtelungen (z. B. Liste oder Tabelle in einem Absatz) auflösen
  $$('#doc p > ul, #doc p > ol, #doc p > table, #doc p > p, #doc p > h1, #doc p > h2, #doc p > h3, #doc p > figure, #doc p > div').forEach(c => { const p = c.parentNode; if (p.tagName !== 'P') return; p.after(c); if (!p.textContent.trim() && !p.querySelector('img')) p.parentNode.removeChild(p); });
}

/* ---------- Einfügen: Seitenumbruch, Tabelle, Bild ---------- */
function topLevelOf(node) { let n = node; if (!n) return null; if (n.nodeType === 3) n = n.parentNode; while (n && n.parentNode !== docEl()) n = n.parentNode; return n && n !== docEl() ? n : null; }
function insertAfterCaret(node) {
  ensureSel(); const s = getSelection(); let blk = s.rangeCount ? topLevelOf(s.getRangeAt(0).endContainer) : null; const d = docEl();
  if (blk && blk.classList.contains('spacer')) blk = blk.nextElementSibling; if (blk) blk.after(node); else d.append(node);
  return node;
}
function ensureTrailingPara(node) { let nx = node.nextElementSibling; while (nx && nx.classList.contains('spacer')) nx = nx.nextElementSibling; if (!nx || !/^(P|H1|H2|H3)$/.test(nx.tagName)) { const p = document.createElement('p'); p.innerHTML = '<br>'; node.after(p); return p; } return nx; }
function caretTo(node, atEnd) { const r = document.createRange(); r.selectNodeContents(node); r.collapse(!atEnd); const s = getSelection(); s.removeAllRanges(); s.addRange(r); saveSel(); }
function insertPageBreak() { const pb = insertAfterCaret(pbEl()); const p = ensureTrailingPara(pb); caretTo(p); onInput(); checkpoint(); paginate(); }
function insertTableDialog() {
  const r = el('input', { type: 'number', min: 1, max: 100, value: 3, style: 'width:80px' }), c = el('input', { type: 'number', min: 1, max: 20, value: 3, style: 'width:80px' }), h = el('input', { type: 'checkbox' }); h.checked = true;
  dialog({ title: 'Tabelle einfügen', body: el('div', { class: 'form' }, el('label', null, el('span', null, 'Zeilen'), r), el('label', null, el('span', null, 'Spalten'), c), el('label', null, el('span', null, 'Kopfzeile'), h)), buttons: [{ label: 'Abbrechen' }, { label: 'Einfügen', pri: true, fn: () => { insertTable(clamp(+r.value || 3, 1, 100), clamp(+c.value || 3, 1, 20), h.checked); } }] });
}
function insertTable(nr, nc, hdr) {
  const t = document.createElement('table'); t.className = 'b-tbl'; if (hdr) t.dataset.hdr = '1'; const tb = document.createElement('tbody'); t.append(tb);
  for (let i = 0; i < nr; i++) { const tr = document.createElement('tr'); for (let j = 0; j < nc; j++) { const td = document.createElement(hdr && i === 0 ? 'th' : 'td'); td.innerHTML = '<br>'; tr.append(td); } tb.append(tr); }
  insertAfterCaret(t); ensureTrailingPara(t); caretTo(t.querySelector('th,td')); onInput(); checkpoint(); paginate();
}
const curCell = () => { ensureSel(); const s = getSelection(); if (!s.rangeCount) return null; let n = s.anchorNode; if (n && n.nodeType === 3) n = n.parentNode; return n && docEl().contains(n) ? n.closest('td,th') : null; };
function tableOp(op) {
  const cell = curCell(); if (!cell) { toast('Cursor in eine Tabellenzelle setzen.', true); return; } const row = cell.parentElement, tbl = cell.closest('table'), ci = cell.cellIndex;
  const mkc = (tag) => { const c = document.createElement(tag); c.innerHTML = '<br>'; return c; }, hdr = tbl.dataset.hdr === '1';
  if (op === 'rowA' || op === 'rowB') { const nr = document.createElement('tr'); Array.from(row.cells).forEach(() => nr.append(mkc('td'))); op === 'rowA' ? row.before(nr) : row.after(nr); }
  else if (op === 'colL' || op === 'colR') Array.from(tbl.rows).forEach(r => { if (r.classList.contains('spacer')) return; const ref = r.cells[ci], tag = r.rowIndex === 0 && hdr ? 'th' : 'td'; op === 'colL' ? ref.before(mkc(tag)) : ref.after(mkc(tag)); });
  else if (op === 'delRow' || op === 'delCol' || op === 'delTbl') {
    const rows = Array.from(tbl.rows).filter(r => !r.classList.contains('spacer')), ri = rows.indexOf(row); let target = null;
    if (op === 'delRow' && rows.length > 1) target = (rows[ri + 1] || rows[ri - 1]).cells[Math.min(ci, (rows[ri + 1] || rows[ri - 1]).cells.length - 1)];
    else if (op === 'delCol' && row.cells.length > 1) target = row.cells[ci + 1] || row.cells[ci - 1];
    const single = (op === 'delRow' && rows.length <= 1) || (op === 'delCol' && row.cells.length <= 1) || op === 'delTbl';
    if (single) { const nx = tbl.nextElementSibling && !tbl.nextElementSibling.classList.contains('spacer') ? tbl.nextElementSibling : tbl.previousElementSibling; tbl.parentNode.removeChild(tbl); if (nx && !nx.classList.contains('spacer')) caretTo(nx); if (!docEl().children.length) renderDoc(); }
    else if (op === 'delRow') row.parentNode.removeChild(row); else rows.forEach(r => { if (r.cells[ci]) r.removeChild(r.cells[ci]); });
    if (target && target.isConnected) caretTo(target);
  }
  else if (op === 'hdr') { const on = tbl.dataset.hdr !== '1'; if (on) tbl.dataset.hdr = '1'; else delete tbl.dataset.hdr; const fr = tbl.rows[0]; Array.from(fr.cells).forEach(c => { const n = document.createElement(on ? 'th' : 'td'); n.append(...c.childNodes); c.replaceWith(n); }); }
  onInput(); checkpoint(); paginate(); refreshRibbon();
}
async function imgFromFile(file) {
  if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) { toast('Nur PNG, JPEG, GIF oder WebP werden unterstützt.', true); return null; }
  const data = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(new Error('Bild konnte nicht gelesen werden.')); fr.readAsDataURL(file); });
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Bilddatei ist beschädigt.')); i.src = data; }); let url = data, w = img.naturalWidth, h = img.naturalHeight;
  if (Math.max(w, h) > 1600) { const k = 1600 / Math.max(w, h), c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); url = c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', .9); w = c.width; h = c.height; }
  return { url, w, h };
}
async function insertImageFile(file) {
  try { const im = await imgFromFile(file); if (!im) return; const id = uid('img'); S.doc.assets[id] = im.url; const g = pageGeom(), w = Math.min(im.w, g.cw, 480); const f = insertAfterCaret(imgFigure(id, im.url, w, 'left')); ensureTrailingPara(f); onInput(); checkpoint(); paginate(); selectImage(f); }
  catch (e) { toast(e.message, true); }
}
function pickImage() { const f = $('#fileImg'); f.value = ''; f.onchange = () => { if (f.files[0]) insertImageFile(f.files[0]); }; f.click(); }
function selectImage(f) { deselectImage(); S.curImg = f; if (!f) return; f.classList.add('sel'); const h = el('span', { class: 'imgh', contenteditable: 'false', title: 'Größe ändern' }); f.append(h); h.addEventListener('pointerdown', imgResizeDown); refreshRibbon(); }
function deselectImage() { if (S.curImg) { S.curImg.classList.remove('sel'); const h = S.curImg.querySelector('.imgh'); if (h) h.remove(); } S.curImg = null; }
function imgResizeDown(e) {
  e.preventDefault(); e.stopPropagation(); const f = S.curImg, im = f.querySelector('img'), x0 = e.clientX, w0 = im.getBoundingClientRect().width / S.zoom, g = pageGeom(); e.target.setPointerCapture(e.pointerId);
  const mv = ev => { im.style.width = Math.round(clamp(w0 + (ev.clientX - x0) / S.zoom, 30, g.cw)) + 'px'; }, up = () => { e.target.removeEventListener('pointermove', mv); e.target.removeEventListener('pointerup', up); onInput(); checkpoint(); paginate(); };
  e.target.addEventListener('pointermove', mv); e.target.addEventListener('pointerup', up);
}
function deleteImage() { if (!S.curImg) return false; const f = S.curImg; deselectImage(); f.remove(); onInput(); checkpoint(); paginate(); return true; }

/* ---------- Seite, Kopf-/Fußzeile ---------- */
function pageDialog() {
  const p = S.doc.page, size = el('select', null, el('option', { value: 'A4' }, 'A4 (210 × 297 mm)'), el('option', { value: 'Letter' }, 'Letter (8,5 × 11 in)')), ori = el('select', null, el('option', { value: 'portrait' }, 'Hochformat'), el('option', { value: 'landscape' }, 'Querformat')); size.value = p.size; ori.value = p.orient;
  const m = {}; ['t', 'b', 'l', 'r'].forEach(k => { m[k] = el('input', { type: 'number', min: 5, max: 60, step: .5, value: p.m[k], style: 'width:80px' }); });
  const preset = el('select', { onchange: e => { const v = { n: 25, s: 12.7, w: 38 }[e.target.value]; if (v) ['t', 'b', 'l', 'r'].forEach(k => { m[k].value = v; }); } }, el('option', { value: '' }, 'Benutzerdefiniert'), el('option', { value: 'n' }, 'Normal (25 mm)'), el('option', { value: 's' }, 'Schmal (12,7 mm)'), el('option', { value: 'w' }, 'Breit (38 mm)'));
  dialog({ title: 'Seite einrichten', body: el('div', { class: 'form' }, el('label', null, el('span', null, 'Papierformat'), size), el('label', null, el('span', null, 'Ausrichtung'), ori), el('label', null, el('span', null, 'Ränder'), preset), el('label', null, el('span', null, 'Oben (mm)'), m.t), el('label', null, el('span', null, 'Unten (mm)'), m.b), el('label', null, el('span', null, 'Links (mm)'), m.l), el('label', null, el('span', null, 'Rechts (mm)'), m.r)),
    buttons: [{ label: 'Abbrechen' }, { label: 'OK', pri: true, fn: () => { const nm = {}; ['t', 'b', 'l', 'r'].forEach(k => { nm[k] = clamp(+m[k].value || 25, 5, 60); }); const probe = { page: { size: size.value, orient: ori.value, m: nm } }, g = pageGeom(probe); if (g.cw < 120 || g.ch < 120) { toast('Die Ränder sind zu groß für das Papierformat.', true); return false; } checkpoint(); S.doc.page = probe.page; applyGeometry(); paginate(); checkpoint(); toast('Seite eingerichtet: ' + size.value + ', ' + (ori.value === 'portrait' ? 'Hochformat' : 'Querformat') + '. ' + S.pages.length + ' Seite(n).'); } }] });
}
function hfDialog() {
  const h = S.doc.hf, hi = el('input', { value: h.header, style: 'width:100%', maxlength: 200 }), fi = el('input', { value: h.footer, style: 'width:100%', maxlength: 200 });
  const pn = el('select', null, ...[['none', 'Keine'], ['footer-center', 'Fußzeile Mitte'], ['footer-right', 'Fußzeile rechts'], ['header-right', 'Kopfzeile rechts']].map(([v, t]) => el('option', { value: v }, t))), fm = el('select', null, el('option', { value: 'plain' }, '1, 2, 3'), el('option', { value: 'of' }, 'Seite 1 von N')); pn.value = h.pn; fm.value = h.pnFmt;
  dialog({ title: 'Kopf- und Fußzeile', body: el('div', { class: 'form col' }, el('label', null, el('span', null, 'Kopfzeile'), hi), el('label', null, el('span', null, 'Fußzeile'), fi), el('label', null, el('span', null, 'Seitenzahl'), pn), el('label', null, el('span', null, 'Format'), fm), el('p', { class: 'hint' }, 'Kopf-/Fußzeile und Seitenzahlen erscheinen im Editor, in der Druckansicht, im PDF-Druck und im DOCX-Export (Seitenzahl als Feld). Im HTML-Export werden sie nicht ausgegeben.')),
    buttons: [{ label: 'Abbrechen' }, { label: 'OK', pri: true, fn: () => { checkpoint(); S.doc.hf = { header: hi.value, footer: fi.value, pn: pn.value, pnFmt: fm.value }; renderSheets(); checkpoint(); } }] });
}

/* ---------- Suchen/Ersetzen ---------- */
function openFind(focusReplace) {
  const bar = $('#findbar'); bar.style.display = 'flex'; S.findOn = true; const sel = getSelection(); if (selInDoc() && !sel.isCollapsed && sel.toString().length < 80 && !/\n/.test(sel.toString())) $('#fq').value = sel.toString();
  (focusReplace ? $('#fr') : $('#fq')).focus(); (focusReplace ? $('#fr') : $('#fq')).select(); if ($('#fq').value) doFind($('#fq').value, $('#fcs').checked, 1);
}
function closeFind() { $('#findbar').style.display = 'none'; S.findOn = false; if (window.CSS && CSS.highlights) { CSS.highlights.delete('find'); CSS.highlights.delete('findcur'); } FIND.matches = []; FIND.i = -1; docEl().focus({ preventScroll: true }); restoreSel(); }
function setZoom(z) { S.zoom = z === 'fit' ? clamp(($('#scroller').clientWidth - 48) / pageGeom().W, .3, 2) : z; paginate(); const zs = $('#zoomsel'); if (zs) zs.value = z === 'fit' ? 'fit' : String(z); }
