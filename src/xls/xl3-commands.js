/* =====================================================================
   3. Befehle: Verlauf, Zellen schreiben, Formate, Zwischenablage, Ausfüllen, Sortieren, Filter, Blätter, Diagramme
   ===================================================================== */
let toastT = 0;
function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.className = err ? 'err' : ''; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => { t.style.display = 'none'; }, err ? 6000 : 2600); }
const dlgStack = [];
function dialog(o) {
  const back = el('div', { class: 'dlg-back' }), box = el('div', { class: 'dlg' + (o.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title }), body = el('div', { class: 'bd' }); if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.append(o.body);
  const ft = el('div', { class: 'ft' }), api = { el: box, close() { const i = dlgStack.indexOf(api); if (i >= 0) dlgStack.splice(i, 1); back.remove(); const f = api.ret; if (f && f.isConnected) f.focus(); } };
  (o.buttons || [{ label: 'Schließen' }]).forEach(b => ft.append(el('button', { class: 'btn' + (b.pri ? ' pri' : ''), onclick: () => { if (b.fn && b.fn(api) === false) return; api.close(); } }, b.label)));
  box.append(el('h3', null, o.title), body, ft); back.append(box); document.body.append(back); back.addEventListener('pointerdown', e => { if (e.target === back) api.close(); });
  api.ret = document.activeElement; dlgStack.push(api); const f = box.querySelector('input,select,textarea') || ft.querySelector('.pri,button'); if (f) f.focus(); return api;
}
let menuEl = null;
function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; document.removeEventListener('pointerdown', menuOff, true); } }
const menuOff = e => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); };
function showMenu(anchor, items, opt) {
  closeMenu(); const m = el('div', { class: 'menu', role: 'menu' });
  items.forEach(it => { if (it === '-') { m.append(el('hr')); return; } if (it.node) { m.append(it.node); return; } const b = el('button', { role: 'menuitem', disabled: it.disabled }, it.label); b.addEventListener('click', () => { if (!it.keep) closeMenu(); it.fn && it.fn(); }); m.append(b); });
  document.body.append(m); const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor; m.style.left = Math.max(4, Math.min(r.left, innerWidth - m.offsetWidth - 6)) + 'px'; m.style.top = (opt && opt.up ? Math.max(4, r.top - m.offsetHeight - 2) : Math.min(r.bottom + 2, innerHeight - m.offsetHeight - 6)) + 'px';
  menuEl = m; document.addEventListener('pointerdown', menuOff, true); const f = m.querySelector('button:not(:disabled)'); if (f && !(opt && opt.nofocus)) f.focus();
}

/* ---------- Verlauf ---------- */
const HIST = { stack: [], i: -1 };
const snapshot = () => JSON.stringify({ title: S.name, si: S.si, sheets: S.wb.sheets }, (k, v) => v instanceof XlErr ? null : v);
function histReset() { HIST.stack = [snapshot()]; HIST.i = 0; }
let autoT = 0, autoMsg = 'Noch nicht gesichert', fileMsg = '';
function commit(label) {
  recalcAll(S.wb); const snap = snapshot(); if (snap !== HIST.stack[HIST.i]) { HIST.stack.length = HIST.i + 1; HIST.stack.push(snap); HIST.i++; if (HIST.stack.length > 80) { HIST.stack.shift(); HIST.i--; } S.dirty = true; scheduleAutosave(); }
  layout(); render(); updateUndoBtns();
}
function restore(str) { const d = JSON.parse(str); S.wb.sheets = d.sheets; S.name = d.title; S.si = clamp(d.si, 0, d.sheets.length - 1); S.editing = null; $('#ed').style.display = 'none'; recalcAll(S.wb); layout(); render(); renderTabs(); updateUndoBtns(); }
function undo() { if (S.editing) cancelEdit(); if (HIST.i > 0) { HIST.i--; restore(HIST.stack[HIST.i]); S.dirty = true; scheduleAutosave(); } }
function redo() { if (S.editing) cancelEdit(); if (HIST.i < HIST.stack.length - 1) { HIST.i++; restore(HIST.stack[HIST.i]); S.dirty = true; scheduleAutosave(); } }
function updateUndoBtns() { const u = $('#qUndo'), r = $('#qRedo'); if (u) { u.disabled = HIST.i <= 0; r.disabled = HIST.i >= HIST.stack.length - 1; } }

/* ---------- Zellen ---------- */
function setCellInput(r, c, text, sh) {
  sh = sh || cur(); const k = key(r, c), old = sh.cells[k], p = parseInput(text);
  if (!p) { if (old && old.st) sh.cells[k] = { v: null, st: old.st }; else delete sh.cells[k]; return; }
  const cell = { v: p.v }; if (p.f !== undefined) cell.f = p.f; const st = old && old.st ? Object.assign({}, old.st) : null;
  if (p.nf && !(st && st.nf)) { const s = st || {}; s.nf = p.nf; if (p.dp != null) s.dp = p.dp; cell.st = s; } else if (st) cell.st = st;
  sh.cells[k] = cell; autoFitRow(sh, r);
}
function usedBounds(sh) { let r2 = -1, c2 = -1; for (const k in sh.cells) { const [r, c] = k.split(',').map(Number); if (r > r2) r2 = r; if (c > c2) c2 = c; } return { r2, c2 }; }
/** Auswahl, bei ganzen Zeilen/Spalten auf den genutzten Bereich begrenzt (Formatieren leerer Millionen Zellen vermeiden) */
function effSel(forStyle) { const g = selRect(), u = usedBounds(cur()); let r2 = g.r2, c2 = g.c2; if (forStyle) { if (g.r2 === ROWS - 1) r2 = Math.min(r2, Math.max(u.r2, g.r1) + 30); if (g.c2 === COLS - 1) c2 = Math.min(c2, Math.max(u.c2, g.c1) + 10); } return { r1: g.r1, c1: g.c1, r2, c2 }; }
function eachSel(fn, forStyle) { const g = effSel(forStyle), sh = cur(); for (let r = g.r1; r <= g.r2; r++) { if (sh.hidden[r]) continue; for (let c = g.c1; c <= g.c2; c++) fn(r, c, sh); } }
function styleSel(mut, label) { eachSel((r, c, sh) => { const k = key(r, c); const cell = sh.cells[k] || (sh.cells[k] = { v: null }); cell.st = cell.st || {}; mut(cell.st, cell); if (!Object.keys(cell.st).length) delete cell.st; if (cell.v === null && !cell.st && cell.f === undefined) delete sh.cells[k]; }, true); commit(label || 'Format'); }
function clearSel() { eachSel((r, c, sh) => { const k = key(r, c), cell = sh.cells[k]; if (!cell) return; if (cell.st) sh.cells[k] = { v: null, st: cell.st }; else delete sh.cells[k]; }); commit('Löschen'); }
function toggleStyle(prop) { const a = getCell(S.active.r, S.active.c), on = !(a && a.st && a.st[prop]); styleSel(st => { if (on) st[prop] = 1; else delete st[prop]; }, 'Format'); }
function setStyle(prop, val) { styleSel(st => { if (val == null || val === '') delete st[prop]; else st[prop] = val; }); }
function setNumFmt(nf) { styleSel(st => { if (nf === 'g') { delete st.nf; delete st.dp; } else { st.nf = nf; if (nf === 'd') delete st.dp; else if (st.dp == null) st.dp = nf === 'p' ? 0 : 2; } }, 'Zahlenformat'); }
function decDigits(d) { styleSel((st, cell) => { const cur_ = st.dp != null ? st.dp : (st.nf === 'p' ? 0 : 2); const base = st.nf ? cur_ : (typeof cell.v === 'number' && !Number.isInteger(cell.v) ? String(cell.v).split('.')[1].length : 0); if (!st.nf) st.nf = 'n'; st.dp = clamp((st.nf && st.dp != null ? cur_ : base) + d, 0, 10); }, 'Dezimalstellen'); }
function setBorders(mode) {
  const g = selRect();
  styleSel((st, cell) => { /* wird je Zelle unten ersetzt */ }, 'Rahmen');
  const sh = cur(); const set = (r, c, side, on) => { const k = key(r, c), cell = sh.cells[k] || (sh.cells[k] = { v: null }); cell.st = cell.st || {}; cell.st.bd = cell.st.bd || {}; if (on) cell.st.bd[side] = 1; else delete cell.st.bd[side]; if (!Object.keys(cell.st.bd).length) delete cell.st.bd; if (!Object.keys(cell.st).length) delete cell.st; if (cell.v === null && !cell.st && cell.f === undefined) delete sh.cells[k]; };
  const e = effSel(true);
  for (let r = e.r1; r <= e.r2; r++) for (let c = e.c1; c <= e.c2; c++) {
    if (mode === 'none') ['t', 'r', 'b', 'l'].forEach(s => set(r, c, s, false));
    else if (mode === 'all') ['t', 'r', 'b', 'l'].forEach(s => set(r, c, s, true));
    else if (mode === 'outer') { if (r === g.r1) set(r, c, 't', true); if (r === e.r2) set(r, c, 'b', true); if (c === g.c1) set(r, c, 'l', true); if (c === e.c2) set(r, c, 'r', true); }
    else if (mode === 'bottom' && r === e.r2) set(r, c, 'b', true); else if (mode === 'top' && r === g.r1) set(r, c, 't', true);
  }
  commit('Rahmen');
}
function textHeight(text, width, st) { const m = $('#measure'); m.style.width = (width - 8) + 'px'; m.style.fontSize = ((st && st.sz) || 11) + 'pt'; m.style.fontWeight = st && st.b ? '700' : '400'; m.textContent = text; return Math.ceil(m.scrollHeight) + 6; }
function autoFitRow(sh, r) {
  if (sh.rowM[r]) return; let h = DEF_H; for (let c = 0; c < COLS; c++) { const cell = sh.cells[key(r, c)]; if (cell && cell.st && cell.st.wr) h = Math.max(h, textHeight(formatValue(cell.v, cell.st), sh.colW[c] || DEF_W, cell.st)); else if (!cell) continue; }
  if (h !== (sh.rowH[r] || DEF_H)) { if (h === DEF_H) delete sh.rowH[r]; else sh.rowH[r] = h; }
}
function toggleWrap() { const a = getCell(S.active.r, S.active.c), on = !(a && a.st && a.st.wr); styleSel(st => { if (on) st.wr = 1; else delete st.wr; }, 'Textumbruch'); const g = effSel(true), sh = cur(); for (let r = g.r1; r <= g.r2; r++) { if (!on && !sh.rowM[r]) delete sh.rowH[r]; autoFitRow(sh, r); } layout(); render(); }

/* ---------- Zwischenablage ---------- */
function toTSV(g, sh) {
  const rows = []; for (let r = g.r1; r <= g.r2; r++) { const row = []; for (let c = g.c1; c <= g.c2; c++) { const cell = sh.cells[key(r, c)]; let t = cell ? formatValue(cell.v, cell.st) : ''; if (/[\t\n\r"]/.test(t)) t = '"' + t.replace(/"/g, '""') + '"'; row.push(t); } rows.push(row.join('\t')); } return rows.join('\n');
}
function parseDelimited(text, delim) {
  const rows = []; let row = [], f = '', q = false, i = 0, started = false; text = text.replace(/^﻿/, '');
  for (; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; continue; }
    if (ch === '"' && f === '') { q = true; started = true; continue; }
    if (ch === delim) { row.push(f); f = ''; started = true; continue; }
    if (ch === '\r') { if (text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; started = false; continue; }
    if (ch === '\n') { row.push(f); rows.push(row); row = []; f = ''; started = false; continue; }
    f += ch; started = true;
  }
  if (started || f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}
function copySel(cut) {
  const g = selRect(), sh = cur(), tsv = toTSV(g, sh), cells = []; for (let r = g.r1; r <= g.r2; r++) { const row = []; for (let c = g.c1; c <= g.c2; c++) { const cell = sh.cells[key(r, c)]; row.push(cell ? JSON.parse(JSON.stringify(cell, (k, v) => v instanceof XlErr ? null : v)) : null); } cells.push(row); }
  S.clip = { g, tsv, cells, cut: !!cut, sheet: sh.id }; const cb = $('#clipbox'); cb.value = tsv; cb.focus(); cb.select(); try { document.execCommand('copy'); } catch (e) { } setTimeout(focusGrid, 0); toast((cut ? 'Ausgeschnitten: ' : 'Kopiert: ') + rangeStr(g));
}
function pasteText(text) {
  const a = selRect(), sh = cur();
  if (S.clip && text.replace(/\r\n/g, '\n') === S.clip.tsv) { // interne Zwischenablage: Formeln/Formate mit relativer Verschiebung
    const cl = S.clip, dr = a.r1 - cl.g.r1, dc = a.c1 - cl.g.c1;
    cl.cells.forEach((row, i) => row.forEach((cell, j) => { const r = a.r1 + i, c = a.c1 + j; if (r >= ROWS || c >= COLS) return; if (!cell) { delete sh.cells[key(r, c)]; return; } const n = JSON.parse(JSON.stringify(cell)); if (n.f !== undefined) n.f = shiftFormula(n.f, dr, dc); sh.cells[key(r, c)] = n; autoFitRow(sh, r); }));
    if (cl.cut) { const same = cl.sheet === sh.id; cl.cells.forEach((row, i) => row.forEach((cell, j) => { const r = cl.g.r1 + i, c = cl.g.c1 + j, inNew = same && r >= a.r1 && r < a.r1 + cl.cells.length && c >= a.c1 && c < a.c1 + row.length; if (!inNew) { const sh0 = S.wb.sheets.find(s => s.id === cl.sheet); if (sh0) delete sh0.cells[key(r, c)]; } })); S.clip = null; }
    S.sel = { r1: a.r1, c1: a.c1, r2: Math.min(ROWS - 1, a.r1 + cl.cells.length - 1), c2: Math.min(COLS - 1, a.c1 + cl.cells[0].length - 1) }; S.active = { r: a.r1, c: a.c1 }; S.anchor = S.active; commit('Einfügen'); return;
  }
  const delim = text.includes('\t') || !text.includes(';') ? '\t' : ';', rows = parseDelimited(text.replace(/\n$/, ''), delim).filter((r, i, all) => !(r.length === 1 && r[0] === '' && i === all.length - 1));
  rows.forEach((row, i) => row.forEach((t, j) => { const r = a.r1 + i, c = a.c1 + j; if (r >= ROWS || c >= COLS) return; try { setCellInput(r, c, t.startsWith('=') ? "'" + t : t); } catch (e) { setCellInput(r, c, "'" + t); } }));
  if (rows.length) { S.sel = { r1: a.r1, c1: a.c1, r2: Math.min(ROWS - 1, a.r1 + rows.length - 1), c2: Math.min(COLS - 1, a.c1 + Math.max(...rows.map(r => r.length)) - 1) }; S.active = { r: a.r1, c: a.c1 }; S.anchor = S.active; }
  commit('Einfügen');
}

/* ---------- Ausfüllen ---------- */
const LISTS = [['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'], ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'], ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'], ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']];
function makeFill(src, count, backward) { // src: Zellen der Quellreihe, Rückgabe: count neue Zellen
  const n = src.length, out = [], clone = x => x ? JSON.parse(JSON.stringify(x, (k, v) => v instanceof XlErr ? null : v)) : null;
  const consts = src.every(x => x && x.f === undefined && x.v !== null && x.v !== undefined), nums = consts && src.every(x => typeof x.v === 'number');
  let step = 0, textNum = null, list = null;
  if (nums) step = n >= 2 ? (src[n - 1].v - src[0].v) / (n - 1) : (src[0].st && src[0].st.nf === 'd' ? 1 : 0);
  else if (consts && src.every(x => typeof x.v === 'string')) {
    const ms = src.map(x => /^(.*?)(\d+)$/.exec(x.v)); if (ms.every(Boolean) && ms.every(m => m[1] === ms[0][1])) { const ns = ms.map(m => +m[2]); textNum = { pre: ms[0][1], n0: ns[0], step: n >= 2 ? (ns[n - 1] - ns[0]) / (n - 1) : 1, w: ms[0][2].length }; }
    else if (n === 1) { const lst = LISTS.find(L => L.some(x => x.toLowerCase() === src[0].v.toLowerCase())); if (lst) list = { lst, i0: lst.findIndex(x => x.toLowerCase() === src[0].v.toLowerCase()) }; }
  }
  for (let i = 0; i < count; i++) {
    const p = backward ? -1 - i : n + i, idx = ((p % n) + n) % n, base = src[idx]; if (!base) { out.push(null); continue; } const nc = clone(base);
    if (base.f !== undefined) { nc.f = { delta: p - idx }; }
    else if (nums) nc.v = src[0].v + step * p;
    else if (textNum) nc.v = textNum.pre + String(Math.max(0, Math.round(textNum.n0 + textNum.step * p))).padStart(textNum.w > 1 && String(textNum.n0).length === textNum.w ? textNum.w : 1, '0');
    else if (list) { const v = list.lst[((list.i0 + p) % list.lst.length + list.lst.length) % list.lst.length]; nc.v = src[0].v === src[0].v.toUpperCase() ? v.toUpperCase() : v; }
    out.push(nc);
  }
  return out;
}
function fillRange(src, tgt, dir) {
  const sh = cur();
  if (dir === 'v') for (let c = src.c1; c <= src.c2; c++) {
    const col = []; for (let r = src.r1; r <= src.r2; r++) col.push(sh.cells[key(r, c)] || null);
    const fwd = Math.max(0, tgt.r2 - src.r2), bwd = Math.max(0, src.r1 - tgt.r1);
    makeFill(col, fwd, false).forEach((nc, i) => putFill(sh, src.r2 + 1 + i, c, nc, 'v')); makeFill(col, bwd, true).forEach((nc, i) => putFill(sh, src.r1 - 1 - i, c, nc, 'v'));
  } else for (let r = src.r1; r <= src.r2; r++) {
    const row = []; for (let c = src.c1; c <= src.c2; c++) row.push(sh.cells[key(r, c)] || null);
    const fwd = Math.max(0, tgt.c2 - src.c2), bwd = Math.max(0, src.c1 - tgt.c1);
    makeFill(row, fwd, false).forEach((nc, i) => putFill(sh, r, src.c2 + 1 + i, nc, 'h')); makeFill(row, bwd, true).forEach((nc, i) => putFill(sh, r, src.c1 - 1 - i, nc, 'h'));
  }
  for (let r = tgt.r1; r <= tgt.r2; r++) autoFitRow(sh, r);
  S.sel = { r1: Math.min(src.r1, tgt.r1), c1: Math.min(src.c1, tgt.c1), r2: Math.max(src.r2, tgt.r2), c2: Math.max(src.c2, tgt.c2) }; commit('Ausfüllen');
}
function putFill(sh, r, c, nc, dir) {
  if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return; if (!nc) { delete sh.cells[key(r, c)]; return; }
  if (nc.f && typeof nc.f === 'object') { const d = nc.f.delta, srcCell = null; const orig = sh.cells[key(dir === 'v' ? r - d : r, dir === 'h' ? c - d : c)]; nc.f = orig && orig.f !== undefined ? shiftFormula(orig.f, dir === 'v' ? d : 0, dir === 'h' ? d : 0) : undefined; if (nc.f === undefined) delete nc.f; }
  sh.cells[key(r, c)] = nc;
}

/* ---------- Sortieren & Filtern ---------- */
function currentRegion(r, c) {
  const sh = cur(), has = (rr, cc) => { const x = sh.cells[key(rr, cc)]; return x && x.v !== null && x.v !== undefined && x.v !== ''; };
  if (!has(r, c)) return { r1: r, c1: c, r2: r, c2: c }; let r1 = r, r2 = r, c1 = c, c2 = c, grow = true;
  while (grow) { grow = false; const rowHas = rr => { for (let cc = c1; cc <= c2; cc++) if (has(rr, cc)) return true; return false; }, colHas = cc => { for (let rr = r1; rr <= r2; rr++) if (has(rr, cc)) return true; return false; };
    if (r1 > 0 && rowHas(r1 - 1)) { r1--; grow = true; } if (r2 < ROWS - 1 && rowHas(r2 + 1)) { r2++; grow = true; } if (c1 > 0 && colHas(c1 - 1)) { c1--; grow = true; } if (c2 < COLS - 1 && colHas(c2 + 1)) { c2++; grow = true; } }
  return { r1, c1, r2, c2 };
}
function targetRange() { const g = selRect(); if (g.r1 === g.r2 && g.c1 === g.c2) return currentRegion(g.r1, g.c1); if (g.r2 === ROWS - 1 || g.c2 === COLS - 1) { const u = usedBounds(cur()); return { r1: g.r1, c1: g.c1, r2: Math.min(g.r2, u.r2), c2: Math.min(g.c2, u.c2) }; } return g; }
function guessHeader(g) { const sh = cur(); if (g.r2 <= g.r1) return false; let allText = true, anyNonText = false; for (let c = g.c1; c <= g.c2; c++) { const a = sh.cells[key(g.r1, c)], b = sh.cells[key(g.r1 + 1, c)]; if (!a || typeof a.v !== 'string') allText = false; if (b && typeof b.v !== 'string') anyNonText = true; } return allText && anyNonText; }
function sortRange(g, col, asc, header) {
  const sh = cur(), r0 = header ? g.r1 + 1 : g.r1; if (g.r2 <= r0 - (header ? 0 : 0) && r0 > g.r2) return;
  const rows = []; for (let r = r0; r <= g.r2; r++) { const cells = []; for (let c = g.c1; c <= g.c2; c++) cells.push(sh.cells[key(r, c)] || null); rows.push({ r, cells, key: (sh.cells[key(r, col)] || {}).v }); }
  const rank = v => v === null || v === undefined || v === '' ? 3 : v instanceof XlErr ? 2 : 0;
  rows.sort((a, b) => { const ra = rank(a.key), rb = rank(b.key); if (ra || rb) return ra - rb || a.r - b.r; const c = cmpVals(a.key, b.key); return (asc ? c : -c) || a.r - b.r; });
  rows.forEach((row, i) => { const nr = r0 + i; row.cells.forEach((cell, j) => { const k = key(nr, g.c1 + j); if (!cell) { delete sh.cells[k]; return; } const n = JSON.parse(JSON.stringify(cell, (kk, v) => v instanceof XlErr ? null : v)); if (n.f !== undefined) n.f = shiftFormula(n.f, nr - row.r, 0); sh.cells[k] = n; }); });
  commit('Sortieren');
}
function quickSort(asc) { const g = targetRange(), col = clamp(S.active.c, g.c1, g.c2); sortRange(g, col, asc, guessHeader(g)); }
function sortDialog() {
  const g = targetRange(), sh = cur(), hdr = el('input', { type: 'checkbox' }); hdr.checked = guessHeader(g);
  const sel = el('select'), fill = () => { sel.replaceChildren(...Array.from({ length: g.c2 - g.c1 + 1 }, (_, i) => { const c = g.c1 + i, h = hdr.checked ? (sh.cells[key(g.r1, c)] || {}).v : null; return el('option', { value: c }, h ? String(h) + ' (Spalte ' + colName(c) + ')' : 'Spalte ' + colName(c)); })); sel.value = clamp(S.active.c, g.c1, g.c2); };
  hdr.onchange = fill; fill(); const ord = el('select', null, el('option', { value: 'a' }, 'Aufsteigend (A→Z, klein→groß)'), el('option', { value: 'd' }, 'Absteigend (Z→A, groß→klein)'));
  dialog({ title: 'Sortieren: ' + rangeStr(g), body: el('div', { class: 'form' }, el('label', null, el('span', null, 'Meine Daten haben Überschriften'), hdr), el('label', null, el('span', null, 'Sortieren nach'), sel), el('label', null, el('span', null, 'Reihenfolge'), ord), el('p', { class: 'hint' }, 'Zusammengehörige Daten einer Zeile werden gemeinsam verschoben.')), buttons: [{ label: 'Abbrechen' }, { label: 'Sortieren', pri: true, fn: () => sortRange(g, +sel.value, ord.value === 'a', hdr.checked) }] });
}
function applyFilter() {
  const sh = cur(), f = sh.filter; sh.hidden = {}; if (!f) { layout(); render(); return; }
  for (let r = f.r1 + 1; r <= f.r2; r++) for (const c in f.cols) { const ex = f.cols[c]; if (ex && ex.length) { const cell = sh.cells[key(r, +c)], t = cell ? formatValue(cell.v, cell.st) : ''; if (ex.includes(t)) { sh.hidden[r] = 1; break; } } }
  layout(); render();
}
function toggleFilter() {
  const sh = cur(); if (sh.filter) { sh.filter = null; sh.hidden = {}; commit('Filter aus'); return; }
  const g = targetRange(); if (g.r2 <= g.r1) { toast('Für einen Filter mindestens zwei Zeilen (Kopfzeile + Daten) markieren.', true); return; }
  sh.filter = { r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2, cols: {} }; commit('Filter an');
}
function openFilterMenu(c, anchor) {
  const sh = cur(), f = sh.filter; if (!f) return; const vals = new Map();
  for (let r = f.r1 + 1; r <= f.r2; r++) { const cell = sh.cells[key(r, c)], t = cell ? formatValue(cell.v, cell.st) : ''; vals.set(t, (vals.get(t) || 0) + 1); }
  const list = Array.from(vals.keys()).sort((a, b) => a.localeCompare(b, 'de', { numeric: true })), ex = new Set(f.cols[c] || []), box = el('div', { class: 'fl' });
  const cbs = list.map(v => { const cb = el('input', { type: 'checkbox' }); cb.checked = !ex.has(v); box.append(el('label', null, cb, el('span', null, v === '' ? '(Leer)' : v))); return [v, cb]; });
  const all = el('input', { type: 'checkbox' }); all.checked = cbs.every(x => x[1].checked); all.onchange = () => cbs.forEach(x => { x[1].checked = all.checked; });
  const node = el('div', { class: 'fmenu' }, el('button', { class: 'btn', onclick: () => { closeMenu(); sortRange({ r1: f.r1, c1: f.c1, r2: f.r2, c2: f.c2 }, c, true, true); } }, 'Aufsteigend sortieren'), el('button', { class: 'btn', onclick: () => { closeMenu(); sortRange({ r1: f.r1, c1: f.c1, r2: f.r2, c2: f.c2 }, c, false, true); } }, 'Absteigend sortieren'), el('label', { class: 'all' }, all, el('b', null, '(Alle auswählen)')), box,
    el('div', { class: 'ft2' }, el('button', { class: 'btn', onclick: closeMenu }, 'Abbrechen'), el('button', { class: 'btn pri', onclick: () => { f.cols[c] = cbs.filter(x => !x[1].checked).map(x => x[0]); if (!f.cols[c].length) delete f.cols[c]; closeMenu(); applyFilter(); commit('Filter'); } }, 'OK')));
  showMenu(anchor, [{ node }], { nofocus: true });
}

/* ---------- Blätter ---------- */
function renderTabs() {
  const bar = $('#sheettabs'); bar.replaceChildren();
  S.wb.sheets.forEach((sh, i) => { const b = el('button', { class: 'stab' + (i === S.si ? ' on' : ''), role: 'tab', 'aria-selected': i === S.si, onclick: () => switchSheet(i), ondblclick: () => renameSheetDialog(i), oncontextmenu: e => { e.preventDefault(); switchSheet(i); sheetMenu(b); } }, sh.name); bar.append(b); });
  bar.append(el('button', { class: 'stab add', title: 'Neues Blatt', 'aria-label': 'Neues Blatt', onclick: addSheet }, '+'));
}
function switchSheet(i) { if (S.editing && !commitEdit(0, 0)) return; S.si = i; S.active = { r: 0, c: 0 }; S.anchor = { r: 0, c: 0 }; S.sel = { r1: 0, c1: 0, r2: 0, c2: 0 }; S.selChart = null; $('#viewport').scrollTo(0, 0); layout(); renderTabs(); render(); }
function sheetMenu(anchor) { const i = S.si; showMenu(anchor, [{ label: 'Umbenennen …', fn: () => renameSheetDialog(i) }, { label: 'Duplizieren', fn: () => duplicateSheet(i) }, { label: 'Nach links verschieben', disabled: i === 0, fn: () => moveSheet(i, -1) }, { label: 'Nach rechts verschieben', disabled: i === S.wb.sheets.length - 1, fn: () => moveSheet(i, 1) }, '-', { label: 'Löschen', disabled: S.wb.sheets.length < 2, fn: () => deleteSheet(i) }], { up: true }); }
function uniqueName(base) { let n = base, k = 2; while (findSheet(S.wb, n)) n = base + ' (' + k++ + ')'; return n; }
function addSheet() { if (S.editing && !commitEdit(0, 0)) return; let k = S.wb.sheets.length + 1, n; do { n = 'Tabelle' + k++; } while (findSheet(S.wb, n)); S.wb.sheets.push(newSheet(n)); S.si = S.wb.sheets.length - 1; S.active = { r: 0, c: 0 }; S.anchor = S.active; S.sel = { r1: 0, c1: 0, r2: 0, c2: 0 }; renderTabs(); commit('Blatt hinzufügen'); }
function validSheetName(n, except) { n = n.trim(); if (!n) return 'Der Blattname darf nicht leer sein.'; if (n.length > 31) return 'Maximal 31 Zeichen.'; if (/[:\\/?*\[\]]/.test(n)) return 'Nicht erlaubt: : \\ / ? * [ ]'; const o = findSheet(S.wb, n); if (o && o !== except) return 'Ein Blatt mit diesem Namen existiert bereits.'; return null; }
function renameSheet(i, name) { const sh = S.wb.sheets[i], err = validSheetName(name, sh); if (err) { toast(err, true); return false; } name = name.trim(); if (name === sh.name) return true; renameSheetRefs(S.wb, sh.name, name); sh.name = name; renderTabs(); commit('Blatt umbenennen'); return true; }
function renameSheetDialog(i) { const inp = el('input', { value: S.wb.sheets[i].name, maxlength: 31, style: 'width:100%' }); dialog({ title: 'Blatt umbenennen', body: el('div', null, inp, el('p', { class: 'hint' }, 'Formelbezüge auf dieses Blatt werden automatisch angepasst.')), buttons: [{ label: 'Abbrechen' }, { label: 'OK', pri: true, fn: () => renameSheet(i, inp.value) }] }); inp.select(); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('.dlg .btn.pri').click(); } }); }
function duplicateSheet(i) { const src = S.wb.sheets[i], n = JSON.parse(JSON.stringify(src, (k, v) => v instanceof XlErr ? null : v)); n.id = uid('sh'); n.name = uniqueName(src.name + ' (2)').replace(/ \(2\) \(2\)$/, ' (2)'); if (findSheet(S.wb, src.name + ' (2)') === undefined) n.name = src.name + ' (2)'; n.charts.forEach(ch => { ch.id = uid('ch'); ch.sh = n.id; }); S.wb.sheets.splice(i + 1, 0, n); S.si = i + 1; renderTabs(); commit('Blatt duplizieren'); }
function moveSheet(i, d) { const a = S.wb.sheets; [a[i], a[i + d]] = [a[i + d], a[i]]; S.si = i + d; renderTabs(); commit('Blatt verschieben'); }
function deleteSheet(i) { if (S.wb.sheets.length < 2) return; S.wb.sheets.splice(i, 1); S.si = Math.min(S.si, S.wb.sheets.length - 1); S.active = { r: 0, c: 0 }; S.sel = { r1: 0, c1: 0, r2: 0, c2: 0 }; renderTabs(); commit('Blatt löschen'); }

/* ---------- Diagramme ---------- */
function insertChart(kind) {
  const g0 = selRect(), g = (g0.r1 === g0.r2 && g0.c1 === g0.c2) ? currentRegion(g0.r1, g0.c1) : targetRange(); if (g.r1 === g.r2 && g.c1 === g.c2) { toast('Bitte zuerst Daten markieren.', true); return; }
  const ch = { id: uid('ch'), kind, sh: cur().id, rng: g, x: colX[g.c2 + 1] + 24, y: rowY[g.r1], w: 440, h: 300, title: '' }; cur().charts.push(ch); S.selChart = ch.id; commit('Diagramm einfügen');
}
function deleteChart(id) { const sh = cur(); sh.charts = sh.charts.filter(c => c.id !== id); S.selChart = null; commit('Diagramm löschen'); }
