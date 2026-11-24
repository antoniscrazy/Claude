/* =====================================================================
   2. Zustand, Tabellenraster (virtualisiert), Auswahl, Bearbeitung, Diagramme
   ===================================================================== */
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) { const v = attrs[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v === true ? '' : v); }
  kids.flat().forEach(c => { if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); }); return e;
}
let _uc = 0; const uid = p => p + (Math.random() * 1e9 | 0).toString(36) + (++_uc).toString(36);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const DEF_W = 96, DEF_H = 24;
const S = { wb: null, si: 0, active: { r: 0, c: 0 }, anchor: { r: 0, c: 0 }, sel: { r1: 0, c1: 0, r2: 0, c2: 0 }, editing: null, clip: null, name: 'Mappe1', extend: false, selChart: null, focus: 'grid', dirty: false };
const cur = () => S.wb.sheets[S.si];
function newSheet(name) { return { id: uid('sh'), name, cells: {}, colW: {}, rowH: {}, rowM: {}, hidden: {}, filter: null, charts: [] }; }
const getCell = (r, c, sh) => (sh || cur()).cells[key(r, c)];
let colX = [], rowY = [];
function layout() {
  const sh = cur(); let x = 0, y = 0;
  for (let c = 0; c < COLS; c++) { colX[c] = x; x += sh.colW[c] || DEF_W; } colX[COLS] = x;
  for (let r = 0; r < ROWS; r++) { rowY[r] = y; y += sh.hidden[r] ? 0 : (sh.rowH[r] || DEF_H); } rowY[ROWS] = y;
  const ct = $('#content'); ct.style.width = x + 'px'; ct.style.height = y + 'px';
}
const bs = (arr, v, n) => { let lo = 0, hi = n - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= v) lo = m; else hi = m - 1; } return lo; };
const colAt = x => bs(colX, x, COLS), rowAt = y => bs(rowY, y, ROWS);
const norm = g => ({ r1: Math.min(g.r1, g.r2), c1: Math.min(g.c1, g.c2), r2: Math.max(g.r1, g.r2), c2: Math.max(g.c1, g.c2) });
function selRect() { return norm(S.sel); }

/* ---------- Rendering ---------- */
let rafId = 0; const refreshSoon = () => { if (!rafId) rafId = requestAnimationFrame(() => { rafId = 0; render(); }); };
function cellText(cell) { return cell ? formatValue(cell.v, cell.st) : ''; }
function render() {
  const vp = $('#viewport'), sl = vp.scrollLeft, st = vp.scrollTop, vw = vp.clientWidth, vh = vp.clientHeight, sh = cur();
  const c0 = Math.max(0, colAt(sl) - 1), c1 = Math.min(COLS - 1, colAt(sl + vw) + 1), r0 = Math.max(0, rowAt(st) - 1), r1 = Math.min(ROWS - 1, rowAt(st + vh) + 1);
  const frag = document.createDocumentFragment(), sr = selRect();
  for (let r = r0; r <= r1; r++) {
    if (sh.hidden[r]) continue; const h = rowY[r + 1] - rowY[r];
    for (let c = c0; c <= c1; c++) {
      const cell = sh.cells[key(r, c)], d = document.createElement('div'), s = cell && cell.st, w = colX[c + 1] - colX[c];
      d.className = 'cell'; d.style.left = colX[c] + 'px'; d.style.top = rowY[r] + 'px'; d.style.width = w + 'px'; d.style.height = h + 'px';
      if (cell) {
        const v = cell.v, isErr = v instanceof XlErr; d.textContent = formatValue(v, s);
        let al = s && s.al; if (!al) al = typeof v === 'number' ? 'r' : (typeof v === 'boolean' || isErr) ? 'c' : 'l'; d.style.textAlign = { l: 'left', c: 'center', r: 'right' }[al];
        if (isErr) { d.classList.add('err'); d.title = v.code + ' – ' + v.msg; }
        if (s) {
          if (s.b) d.style.fontWeight = '700'; if (s.i) d.style.fontStyle = 'italic'; if (s.u) d.style.textDecoration = 'underline'; if (s.co) d.style.color = s.co; if (s.bg) d.style.background = s.bg; if (s.sz) d.style.fontSize = s.sz + 'pt';
          if (s.wr) d.classList.add('wrap'); if (s.bd) { if (s.bd.t) d.style.borderTop = '1.5px solid #222'; if (s.bd.b) d.style.borderBottom = '1.5px solid #222'; if (s.bd.l) d.style.borderLeft = '1.5px solid #222'; if (s.bd.r) d.style.borderRight = '1.5px solid #222'; }
        }
      }
      if (sh.cf && sh.cf.length) { const x = cfStyle(sh, r, c, cell); if (x) { if (x.bg) d.style.background = x.bg; if (x.co) d.style.color = x.co; if (x.b) d.style.fontWeight = '700'; } }
      const f = sh.filter; if (f && r === f.r1 && c >= f.c1 && c <= f.c2) { const act = f.cols[c] && f.cols[c].length; d.append(el('span', { class: 'fbtn' + (act ? ' on' : ''), 'data-fc': c, title: 'Filter' }, '▾')); d.classList.add('fhead'); }
      frag.append(d);
    }
  }
  $('#cells').replaceChildren(frag);
  const ch = document.createDocumentFragment(), rh = document.createDocumentFragment();
  for (let c = c0; c <= c1; c++) ch.append(el('div', { class: 'ch' + (c >= sr.c1 && c <= sr.c2 ? ' sel' : ''), style: `left:${colX[c]}px;width:${colX[c + 1] - colX[c]}px`, 'data-c': c }, colName(c)));
  for (let r = r0; r <= r1; r++) { if (sh.hidden[r]) continue; rh.append(el('div', { class: 'rh' + (r >= sr.r1 && r <= sr.r2 ? ' sel' : ''), style: `top:${rowY[r]}px;height:${rowY[r + 1] - rowY[r]}px`, 'data-r': r }, String(r + 1))); }
  $('#colhin').replaceChildren(ch); $('#rowhin').replaceChildren(rh); $('#colhin').style.transform = 'translateX(' + (-sl) + 'px)'; $('#rowhin').style.transform = 'translateY(' + (-st) + 'px)';
  drawSelection(); positionEditor(); renderCharts(); renderStatus();
}
function drawSelection() {
  const L = $('#sellayer'); L.replaceChildren(); const g = selRect(), x = colX[g.c1], y = rowY[g.r1], w = colX[g.c2 + 1] - x, h = rowY[g.r2 + 1] - y;
  if (h <= 0) return;
  const multi = g.r1 !== g.r2 || g.c1 !== g.c2;
  L.append(el('div', { class: 'selrect' + (multi ? ' multi' : ''), style: `left:${x - 1}px;top:${y - 1}px;width:${w + 1}px;height:${h + 1}px` }));
  const a = S.active, ax = colX[a.c], ay = rowY[a.r]; if (rowY[a.r + 1] > ay) L.append(el('div', { class: 'actcell', style: `left:${ax - 1}px;top:${ay - 1}px;width:${colX[a.c + 1] - ax + 1}px;height:${rowY[a.r + 1] - ay + 1}px` }));
  L.append(el('div', { class: 'fillh', style: `left:${x + w - 5}px;top:${y + h - 5}px`, title: 'Ausfüllgriff' }));
  if (S.fillPreview) { const p = S.fillPreview, px = colX[p.c1], py = rowY[p.r1]; L.append(el('div', { class: 'fillprev', style: `left:${px - 1}px;top:${py - 1}px;width:${colX[p.c2 + 1] - px + 1}px;height:${rowY[p.r2 + 1] - py + 1}px` })); }
  $('#namebox').value = multi ? rangeStr(g) : addr(S.active.r, S.active.c);
  if (!S.editing) $('#fx').value = cellEditText(getCell(a.r, a.c));
}
function cellEditText(cell) {
  if (!cell) return ''; if (cell.f !== undefined) return '=' + displayFormula(cell.f); const v = cell.v; if (v === null || v === undefined) return '';
  if (typeof v === 'number') { const s = cell.st || {}; if (s.nf === 'd') return fmtDate(v); if (s.nf === 'p') return fmtGeneral(v * 100) + '%'; return fmtGeneral(v); }
  if (typeof v === 'boolean') return v ? 'WAHR' : 'FALSCH'; const t = String(v); return (parseInput(t) && parseInput(t).v !== t) || t[0] === '=' || t[0] === "'" ? "'" + t : t;
}
function reveal(r, c) {
  const vp = $('#viewport'), x = colX[c], y = rowY[r], w = colX[c + 1] - x, h = rowY[r + 1] - y;
  if (x < vp.scrollLeft) vp.scrollLeft = x; else if (x + w > vp.scrollLeft + vp.clientWidth) vp.scrollLeft = x + w - vp.clientWidth + 2;
  if (y < vp.scrollTop) vp.scrollTop = y; else if (y + h > vp.scrollTop + vp.clientHeight) vp.scrollTop = y + h - vp.clientHeight + 2;
}
function renderStatus() {
  const g = selRect(), sh = cur(); let n = 0, sum = 0, cnt = 0; const big = (g.r2 - g.r1 + 1) * (g.c2 - g.c1 + 1) > 200000;
  if (!big) for (const k in sh.cells) { const [r, c] = k.split(',').map(Number); if (r < g.r1 || r > g.r2 || c < g.c1 || c > g.c2) continue; const v = sh.cells[k].v; if (v !== null && v !== undefined && v !== '') cnt++; if (typeof v === 'number') { n++; sum += v; } }
  $('#stq').textContent = n ? `Summe: ${fmtGeneral(+sum.toPrecision(12))}   Mittelwert: ${fmtGeneral(+(sum / n).toPrecision(10))}   Anzahl: ${cnt}` : (cnt ? `Anzahl: ${cnt}` : 'Bereit');
  $('#stsel').textContent = (g.r1 === g.r2 && g.c1 === g.c2) ? addr(g.r1, g.c1) : `${rangeStr(g)} (${g.r2 - g.r1 + 1}×${g.c2 - g.c1 + 1})`;
}

/* ---------- Auswahl ---------- */
function selectCell(r, c, extend) {
  r = clamp(r, 0, ROWS - 1); c = clamp(c, 0, COLS - 1);
  if (extend) { S.sel = { r1: S.anchor.r, c1: S.anchor.c, r2: r, c2: c }; S.active = S.active; } else { S.anchor = { r, c }; S.active = { r, c }; S.sel = { r1: r, c1: c, r2: r, c2: c }; }
  S.selChart = null; S.chainCol = null; reveal(r, c); render();
}
function skipHidden(r, dir) { const sh = cur(); while (r >= 0 && r < ROWS && sh.hidden[r]) r += dir; return clamp(r, 0, ROWS - 1); }
function moveActive(dr, dc, extend) {
  const base = extend ? { r: S.sel.r2, c: S.sel.c2 } : S.active; let r = base.r + dr, c = base.c + dc; if (dr) r = skipHidden(r, dr);
  selectCell(r, c, extend);
}
function jumpEdge(dr, dc, extend) { // Strg+Pfeil
  const base = extend ? { r: S.sel.r2, c: S.sel.c2 } : S.active; let { r, c } = base; const has = (rr, cc) => { const x = getCell(rr, cc); return x && x.v !== null && x.v !== undefined && x.v !== ''; };
  const inb = (rr, cc) => rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS; let nr = r + dr, nc = c + dc;
  if (!inb(nr, nc)) return; if (has(r, c) && has(nr, nc)) { while (inb(nr + dr, nc + dc) && has(nr + dr, nc + dc)) { nr += dr; nc += dc; } } else { while (inb(nr, nc) && !has(nr, nc)) { nr += dr; nc += dc; } if (!inb(nr, nc)) { nr -= dr; nc -= dc; } }
  selectCell(nr, nc, extend);
}
function selectAll() { S.anchor = { r: 0, c: 0 }; S.sel = { r1: 0, c1: 0, r2: ROWS - 1, c2: COLS - 1 }; render(); }

/* ---------- Bearbeitung ---------- */
function startEdit(text, fromBar) {
  if (S.editing) return; const a = S.active; if (cur().hidden[a.r]) return;
  const ed = $('#ed'), cell = getCell(a.r, a.c), t = text != null ? text : cellEditText(cell);
  S.editing = { r: a.r, c: a.c, orig: cellEditText(cell), fromBar: !!fromBar }; ed.style.display = 'block'; ed.value = t; $('#fx').value = t; positionEditor(); sizeEditor();
  if (fromBar) { $('#fx').focus(); } else { ed.focus(); ed.setSelectionRange(t.length, t.length); }
}
function positionEditor() {
  if (!S.editing) return; const ed = $('#ed'), { r, c } = S.editing; ed.style.left = (colX[c] - 1) + 'px'; ed.style.top = (rowY[r] - 1) + 'px'; ed.style.minWidth = (colX[c + 1] - colX[c] + 1) + 'px'; ed.style.height = (rowY[r + 1] - rowY[r] + 1) + 'px'; sizeEditor();
}
function sizeEditor() { const ed = $('#ed'); ed.style.height = 'auto'; ed.style.height = Math.max(rowY[S.editing.r + 1] - rowY[S.editing.r] + 1, ed.scrollHeight + 2) + 'px'; ed.style.width = Math.max(colX[S.editing.c + 1] - colX[S.editing.c] + 1, Math.min(420, (ed.value.length + 2) * 8)) + 'px'; }
function cancelEdit() { if (!S.editing) return; S.editing = null; $('#ed').style.display = 'none'; $('#fx').value = cellEditText(getCell(S.active.r, S.active.c)); focusGrid(); }
function commitEdit(dr, dc) {
  if (!S.editing) return true; const { r, c } = S.editing, text = $('#ed').style.display !== 'none' ? $('#ed').value : $('#fx').value;
  try { setCellInput(r, c, text); } catch (e) { toast('Ungültige Formel: ' + e.message, true); return false; }
  S.editing = null; $('#ed').style.display = 'none'; commit('Eingabe');
  if (dr || dc) { // wie Excel: nach Tab-Folge springt Enter in die Ausgangsspalte der Zeile zurück
    let nr = skipHidden(r + dr, dr || 1), nc = c + dc, chain = S.chainCol;
    if (dc && !dr) { if (chain == null) chain = c; } else if (dr && chain != null) { nc = chain; chain = null; } else chain = null;
    selectCell(nr, nc); S.chainCol = dc && !dr ? chain : null;
  }
  focusGrid(); return true;
}
const focusGrid = () => { const v = $('#viewport'); v.focus({ preventScroll: true }); };

/* ---------- Pointer: Auswahl, Ausfüllgriff, Spaltenbreite ---------- */
let G = null, lastDown = null;
function vpPoint(e) { const vp = $('#viewport'), r = vp.getBoundingClientRect(); return { x: e.clientX - r.left + vp.scrollLeft, y: e.clientY - r.top + vp.scrollTop }; }
function onGridDown(e) {
  if (e.button !== 0) return; const vp = $('#viewport'); S.focus = 'grid';
  if (e.target.closest('.xchart')) return;
  const p = vpPoint(e); if (p.x > colX[COLS] || p.y > rowY[ROWS]) return;
  if (e.target.classList.contains('fbtn')) { e.preventDefault(); openFilterMenu(+e.target.dataset.fc, e.target); return; }
  if (e.target.classList.contains('fillh')) { e.preventDefault(); vp.setPointerCapture(e.pointerId); G = { t: 'fill', src: selRect() }; return; }
  const r = rowAt(p.y), c = colAt(p.x), shift = e.shiftKey || (S.extend && e.pointerType === 'touch');
  if (S.editing) {
    const ed = $('#ed'), fx = S.editing.fromBar ? $('#fx') : ed, t = fx.value, pos = fx.selectionStart == null ? t.length : fx.selectionStart;
    if (t[0] === '=' && /[=(;,+\-*/^&<>:]$/.test(t.slice(0, pos))) { e.preventDefault(); const ref = addr(r, c); fx.value = t.slice(0, pos) + ref + t.slice(pos); ed.value = fx.value; $('#fx').value = fx.value; const np = pos + ref.length; fx.setSelectionRange(np, np); fx.focus(); sizeEditor(); return; }
    if (!commitEdit(0, 0)) { e.preventDefault(); return; }
  }
  e.preventDefault(); focusGrid(); vp.setPointerCapture(e.pointerId);
  const now = Date.now();
  if (!shift && lastDown && lastDown.r === r && lastDown.c === c && now - lastDown.t < 450) { lastDown = null; selectCell(r, c); startEdit(); return; }
  lastDown = { r, c, t: now }; selectCell(r, c, shift); G = { t: 'sel' };
}
function onGridMove(e) {
  if (!G) return; const p = vpPoint(e), vp = $('#viewport'), vr = vp.getBoundingClientRect();
  if (e.clientY > vr.bottom - 14) vp.scrollTop += 24; else if (e.clientY < vr.top + 14) vp.scrollTop -= 24; if (e.clientX > vr.right - 14) vp.scrollLeft += 24; else if (e.clientX < vr.left + 14) vp.scrollLeft -= 24;
  const r = clamp(rowAt(clamp(p.y, 0, rowY[ROWS] - 1)), 0, ROWS - 1), c = clamp(colAt(clamp(p.x, 0, colX[COLS] - 1)), 0, COLS - 1);
  if (G.t === 'sel') { S.sel = { r1: S.anchor.r, c1: S.anchor.c, r2: r, c2: c }; render(); }
  else if (G.t === 'fill') {
    const s = G.src; let tr = r, tc = c; const dv = tr > s.r2 ? tr - s.r2 : tr < s.r1 ? s.r1 - tr : 0, dh = tc > s.c2 ? tc - s.c2 : tc < s.c1 ? s.c1 - tc : 0;
    if (!dv && !dh) { S.fillPreview = null; G.target = null; } else if (dv >= dh) { G.dir = 'v'; G.target = tr > s.r2 ? { r1: s.r1, c1: s.c1, r2: tr, c2: s.c2 } : { r1: tr, c1: s.c1, r2: s.r2, c2: s.c2 }; } else { G.dir = 'h'; G.target = tc > s.c2 ? { r1: s.r1, c1: s.c1, r2: s.r2, c2: tc } : { r1: s.r1, c1: tc, r2: s.r2, c2: s.c2 }; }
    S.fillPreview = G.target; drawSelection();
  }
}
function onGridUp() { if (!G) return; const g = G; G = null; if (g.t === 'fill') { const t = g.target; S.fillPreview = null; if (t) fillRange(g.src, t, g.dir); else drawSelection(); } }
/* Kopfzeilen: Auswahl ganzer Spalten/Zeilen, Größenänderung am Rand */
function headDown(e, kind) {
  if (e.button !== 0) return; if (S.editing && !commitEdit(0, 0)) return; const hd = e.currentTarget, sh = cur(), vp = $('#viewport');
  const rect = hd.getBoundingClientRect(), p = kind === 'c' ? e.clientX - rect.left + vp.scrollLeft : e.clientY - rect.top + vp.scrollTop;
  const idx = kind === 'c' ? colAt(p) : rowAt(p), edge = kind === 'c' ? colX[idx + 1] - p : rowY[idx + 1] - p;
  e.preventDefault(); hd.setPointerCapture(e.pointerId); focusGrid();
  if (edge < 5 || (kind === 'c' ? p - colX[idx] : p - rowY[idx]) < 4 && idx > 0) { const i = edge < 5 ? idx : idx - 1; G = { t: 'size', kind, i, start: kind === 'c' ? e.clientX : e.clientY, orig: kind === 'c' ? (sh.colW[i] || DEF_W) : (sh.rowH[i] || DEF_H), hd }; return; }
  if (kind === 'c') { const a = e.shiftKey ? S.anchor.c : idx; if (!e.shiftKey) { S.anchor = { r: 0, c: idx }; S.active = { r: 0, c: idx }; } S.sel = { r1: 0, c1: a, r2: ROWS - 1, c2: idx }; G = { t: 'hsel', kind }; }
  else { const a = e.shiftKey ? S.anchor.r : idx; if (!e.shiftKey) { S.anchor = { r: idx, c: 0 }; S.active = { r: idx, c: 0 }; } S.sel = { r1: a, c1: 0, r2: idx, c2: COLS - 1 }; G = { t: 'hsel', kind }; }
  render();
}
function headMove(e, kind) {
  const hd = e.currentTarget, vp = $('#viewport'), rect = hd.getBoundingClientRect();
  if (!G) { const p = kind === 'c' ? e.clientX - rect.left + vp.scrollLeft : e.clientY - rect.top + vp.scrollTop, idx = kind === 'c' ? colAt(p) : rowAt(p), edge = kind === 'c' ? colX[idx + 1] - p : rowY[idx + 1] - p; hd.style.cursor = edge < 5 ? (kind === 'c' ? 'col-resize' : 'row-resize') : 'default'; return; }
  if (G.t === 'size' && G.kind === kind) { const d = (kind === 'c' ? e.clientX : e.clientY) - G.start, sh = cur(), v = Math.max(kind === 'c' ? 24 : 12, Math.round(G.orig + d)); if (kind === 'c') sh.colW[G.i] = v; else { sh.rowH[G.i] = v; sh.rowM[G.i] = 1; } layout(); render(); }
  else if (G.t === 'hsel' && G.kind === kind) { const p = kind === 'c' ? e.clientX - rect.left + vp.scrollLeft : e.clientY - rect.top + vp.scrollTop, idx = kind === 'c' ? colAt(clamp(p, 0, colX[COLS] - 1)) : rowAt(clamp(p, 0, rowY[ROWS] - 1)); if (kind === 'c') S.sel.c2 = idx; else S.sel.r2 = idx; render(); }
}
function headUp(e, kind) { if (!G) return; const g = G; G = null; if (g.t === 'size') commit(g.kind === 'c' ? 'Spaltenbreite' : 'Zeilenhöhe'); }

/* ---------- Diagramme ---------- */
function chartData(ch) {
  const sh = S.wb.sheets.find(s => s.id === ch.sh); if (!sh) return null; const g = ch.rng, vals = []; for (let r = g.r1; r <= g.r2; r++) { const row = []; for (let c = g.c1; c <= g.c2; c++) { const cell = sh.cells[key(r, c)]; row.push(cell && !(cell.v instanceof XlErr) ? cell.v : null); } vals.push(row); }
  if (!vals.length) return null; const isNum = v => typeof v === 'number', rows = vals.length, cols = vals[0].length;
  const firstColText = rows > 1 && vals.slice(1).every(r => typeof r[0] === 'string' || r[0] === null) && cols > 1, firstRowText = cols > 1 && vals[0].slice(firstColText ? 1 : 0).every(v => typeof v === 'string');
  const c0 = firstColText ? 1 : 0, r0 = firstRowText ? 1 : 0, labels = [], series = [];
  for (let r = r0; r < rows; r++) labels.push(firstColText ? String(vals[r][0] == null ? '' : vals[r][0]) : String(r - r0 + 1));
  for (let c = c0; c < cols; c++) series.push({ name: firstRowText ? String(vals[0][c]) : 'Reihe ' + (c - c0 + 1), values: vals.slice(r0).map(r => isNum(r[c]) ? r[c] : 0) });
  return { labels, series };
}
const SV = (t, a) => { const e = document.createElementNS('http://www.w3.org/2000/svg', t); for (const k in a) e.setAttribute(k, a[k]); return e; };
const PAL = ['#2e9b57', '#f2a33a', '#3a86ff', '#d9461f', '#8338ec', '#2ec4b6'];
function niceStep(raw) { const e = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; }
function chartSVG(ch, w, h) {
  const d = chartData(ch), svg = SV('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h }), T = (x, y, s, a, size, col) => { const t = SV('text', { x, y, 'text-anchor': a || 'middle', 'font-size': size || 12, fill: col || '#444' }); t.textContent = s; svg.append(t); };
  if (!d || !d.series.length) { T(w / 2, h / 2, 'Keine Daten', 'middle', 14); return svg; }
  const top = 30, legendH = d.series.length > 1 || ch.kind === 'pie' ? 22 : 0; if (ch.title) T(w / 2, 20, ch.title, 'middle', 14, '#111');
  if (ch.kind === 'pie') { const vals = d.series[0].values.map(v => Math.max(0, v)), tot = vals.reduce((a, b) => a + b, 0) || 1, r = Math.min(w * .35, (h - top - 10) / 2), cx = w * .36, cy = top + (h - top) / 2; let a0 = -Math.PI / 2;
    vals.forEach((v, i) => { const a1 = a0 + v / tot * Math.PI * 2, lg = a1 - a0 > Math.PI ? 1 : 0; if (v / tot > .9999) svg.append(SV('circle', { cx, cy, r, fill: PAL[i % 6] })); else svg.append(SV('path', { d: `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${lg} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`, fill: PAL[i % 6], stroke: '#fff', 'stroke-width': 1.5 })); a0 = a1; });
    d.labels.forEach((l, i) => { svg.append(SV('rect', { x: w * .7, y: top + 6 + i * 20, width: 12, height: 12, fill: PAL[i % 6] })); T(w * .7 + 18, top + 16 + i * 20, l + ' (' + Math.round(vals[i] / tot * 100) + '%)', 'start', 12); }); return svg; }
  const L = 46, R = 12, B = 26 + legendH, pw = w - L - R, ph = h - top - B; let max = 0, min = 0; d.series.forEach(s => s.values.forEach(v => { max = Math.max(max, v); min = Math.min(min, v); })); const step = niceStep((max - min) / 4 || 1); max = Math.ceil(max / step) * step || 1; min = Math.floor(min / step) * step;
  for (let v = min; v <= max + 1e-9; v += step) { const y = top + ph - (v - min) / (max - min) * ph; svg.append(SV('line', { x1: L, x2: w - R, y1: y, y2: y, stroke: '#0002' })); T(L - 5, y + 4, String(+v.toFixed(2)), 'end', 11); }
  const n = d.labels.length, gw = pw / Math.max(1, n); d.labels.forEach((l, i) => T(L + gw * (i + .5), top + ph + 16, l.slice(0, 12), 'middle', 11));
  if (ch.kind === 'line') d.series.forEach((s, si) => { const pts = s.values.map((v, i) => [L + gw * (i + .5), top + ph - (v - min) / (max - min) * ph]); svg.append(SV('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: PAL[si % 6], 'stroke-width': 2.5 })); pts.forEach(p => svg.append(SV('circle', { cx: p[0], cy: p[1], r: 3.5, fill: PAL[si % 6] }))); });
  else { const bw = gw * .72 / d.series.length; d.series.forEach((s, si) => s.values.forEach((v, i) => { const y0 = top + ph - (0 - min) / (max - min) * ph, y1 = top + ph - (v - min) / (max - min) * ph; svg.append(SV('rect', { x: L + gw * i + gw * .14 + si * bw, y: Math.min(y0, y1), width: Math.max(1, bw - 2), height: Math.abs(y1 - y0), fill: PAL[si % 6] })); })); }
  if (legendH) d.series.forEach((s, si) => { const x = L + si * 120; svg.append(SV('rect', { x, y: h - 16, width: 11, height: 11, fill: PAL[si % 6] })); T(x + 16, h - 6, s.name.slice(0, 14), 'start', 11); });
  return svg;
}
function renderCharts() {
  const L = $('#chartlayer'), sh = cur(); L.replaceChildren();
  sh.charts.forEach(ch => {
    const box = el('div', { class: 'xchart' + (S.selChart === ch.id ? ' sel' : ''), style: `left:${ch.x}px;top:${ch.y}px;width:${ch.w}px;height:${ch.h}px`, 'data-id': ch.id, tabindex: '-1' },
      el('div', { class: 'xch-bar', title: 'Ziehen zum Verschieben' }, ch.title || 'Diagramm', el('button', { class: 'xch-x', title: 'Diagramm löschen', 'aria-label': 'Diagramm löschen', onclick: ev => { ev.stopPropagation(); deleteChart(ch.id); } }, '×')),
      el('div', { class: 'xch-body' }), el('div', { class: 'xch-rs', title: 'Größe ändern' }));
    box.querySelector('.xch-body').append(chartSVG(ch, ch.w, ch.h - 24)); L.append(box);
    const bar = box.querySelector('.xch-bar'), rs = box.querySelector('.xch-rs');
    const drag = (el_, mode) => el_.addEventListener('pointerdown', e => { if (e.target.classList.contains('xch-x')) return; e.preventDefault(); e.stopPropagation(); S.selChart = ch.id; box.classList.add('sel'); el_.setPointerCapture(e.pointerId); const x0 = e.clientX, y0 = e.clientY, o = { x: ch.x, y: ch.y, w: ch.w, h: ch.h };
      const mv = ev => { const dx = ev.clientX - x0, dy = ev.clientY - y0; if (mode === 'move') { ch.x = Math.max(0, o.x + dx); ch.y = Math.max(0, o.y + dy); } else { ch.w = Math.max(160, o.w + dx); ch.h = Math.max(120, o.h + dy); } box.style.left = ch.x + 'px'; box.style.top = ch.y + 'px'; box.style.width = ch.w + 'px'; box.style.height = ch.h + 'px'; if (mode === 'size') { const b = box.querySelector('.xch-body'); b.replaceChildren(chartSVG(ch, ch.w, ch.h - 24)); } };
      const up = () => { el_.removeEventListener('pointermove', mv); el_.removeEventListener('pointerup', up); commit(mode === 'move' ? 'Diagramm verschieben' : 'Diagrammgröße'); }; el_.addEventListener('pointermove', mv); el_.addEventListener('pointerup', up); });
    drag(bar, 'move'); drag(rs, 'size');
  });
}
