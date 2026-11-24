/* =====================================================================
   3. Bedienung: Pointer Events (Ziehen, Skalieren, Drehen, Auswahlrahmen),
      Textbearbeitung, Folienleiste (Umsortieren), Tastatur
   ===================================================================== */
let G = null; // laufende Geste
const slidePt = e => { const r = $('#scaler').getBoundingClientRect(), z = S.z; return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z }; };
function topEl(t) { let e = t.closest && t.closest('.pp-o'); while (e && e.parentElement && !e.parentElement.classList.contains('pp-objs')) e = e.parentElement.closest('.pp-o'); return e; }
const liveEl = id => S.layer && S.layer.querySelector(':scope > .pp-objs > [data-oid="' + id + '"]');
function refreshEl(o, full) {
  const old = liveEl(o.id); if (!old) return;
  if (!full) { PP.setGeom(old, o); return; }
  const n = renderObj(o, { master: S.proj.master, mode: 'edit', assets: S.proj.assets, slide: curSlide() }); old.replaceWith(n);
}
function selectionChanged() { drawOverlay(); renderRight(); refreshRibbon(); renderStatus(); }

/* ---------- Textbearbeitung ---------- */
function syncEditText() {
  if (!S.editing) return false; const o = objById(S.editing), t = S.layer && S.layer.querySelector('[data-oid="' + S.editing + '"] .pp-txt'); if (!o || !t) return false;
  fixFontTags(t); const h = sanitizeHTML(t.innerHTML); if (h !== (o.html || '')) { o.html = h; return true; } return false;
}
function endEdit() { if (!S.editing) return; const changed = syncEditText(); S.editing = null; S.savedRange = undefined; if (changed) commit('Text bearbeiten'); else { renderStage(true); selectionChanged(); } }
function beginEdit(id, pt) {
  const o = objById(id); if (!o || o.locked || !['text', 'shape'].includes(o.type)) return;
  if (S.editing && S.editing !== id) endEdit(); S.editing = id; S.sel = [id]; S.editStartHtml = o.html || ''; S.savedRange = null;
  renderStage(true); selectionChanged();
  const t = S.layer.querySelector('[data-oid="' + id + '"] .pp-txt'); if (!t) return; t.contentEditable = 'true'; t.spellcheck = false; t.focus();
  let r = null;
  if (pt) { if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(pt.x, pt.y); else if (document.caretPositionFromPoint) { const cp = document.caretPositionFromPoint(pt.x, pt.y); if (cp) { r = document.createRange(); r.setStart(cp.offsetNode, cp.offset); } } if (r && !t.contains(r.startContainer)) r = null; }
  if (!r) { r = document.createRange(); r.selectNodeContents(t); r.collapse(false); }
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
}
/** Doppelklick-Aktion (eigene Erkennung, da preventDefault bei pointerdown das native dblclick unterdrücken kann) */
function activateObject(e, o) {
  if (o.locked) return; const td = e.target.closest && e.target.closest('td');
  if (td && o.type === 'table') { S.sel = [o.id]; selectionChanged(); editCell(td, o); return; }
  if (o.type === 'chart') { editChartData(o); return; }
  beginEdit(o.id, { x: e.clientX, y: e.clientY });
}
function fixFontTags(root) { // execCommand("fontSize", 7) → echte Pixelgröße
  root.querySelectorAll('font').forEach(f => { const sp = document.createElement('span'); if (f.size === '7' && f.dataset.px) sp.style.fontSize = f.dataset.px; if (f.color) sp.style.color = f.color; sp.append(...f.childNodes); f.replaceWith(sp); });
}
function editCell(td, o) {
  td.contentEditable = 'true'; td.focus(); const r = document.createRange(); r.selectNodeContents(td); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  const done = () => { td.removeEventListener('blur', done); td.contentEditable = 'false'; const v = td.textContent; if (o.rows[+td.dataset.r][+td.dataset.c] !== v) { o.rows[+td.dataset.r][+td.dataset.c] = v; commit('Tabellenzelle'); } };
  td.addEventListener('blur', done); td.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (e.key === 'Escape') td.textContent = o.rows[+td.dataset.r][+td.dataset.c]; td.blur(); } });
}

/* ---------- Auswahl & Gesten auf der Bühne ---------- */
function onStageDown(e) {
  if (e.button !== 0 || S.view === 'sorter') return;
  S.focusArea = 'stage'; { const sc0 = $('#scaler'); sc0.tabIndex = -1; if (!S.editing) sc0.focus({ preventScroll: true }); }
  if (S.previewing) { stopPreview(); return; }
  if (S.editing && e.target.closest('.pp-txt[contenteditable="true"]')) return;
  if (e.target.closest('td[contenteditable="true"]')) return;
  const sc = $('#scaler'); const p = slidePt(e), z = S.z;
  const hd = e.target.closest('[data-h]');
  if (hd) {
    const h = hd.dataset.h; e.preventDefault(); sc.setPointerCapture(e.pointerId);
    if (h === 'rot') { const o = selObjs()[0]; G = { t: 'rot', o, snap: snapshot() }; }
    else if (h === 'pathend' || h === 'pathctl') { G = { t: h, fx: curSlide().effects.find(x => x.id === S.fx) }; }
    else {
      const sel = selObjs(), [hx, hy] = HANDLES[h];
      if (sel.length === 1) { const o = sel[0], th = (o.rot || 0) * Math.PI / 180, lx = hx * o.w / 2, ly = hy * o.h / 2, cx = o.x + o.w / 2 + lx * Math.cos(th) - ly * Math.sin(th), cy = o.y + o.h / 2 + lx * Math.sin(th) + ly * Math.cos(th);
        G = { t: 'resize', h, o, s0: { x: o.x, y: o.y, w: o.w, h: o.h }, off: { x: p.x - cx, y: p.y - cy } }; }
      else { const U = unionBox(sel), cx = hx > 0 ? U.x + U.w : hx < 0 ? U.x : U.x + U.w / 2, cy = hy > 0 ? U.y + U.h : hy < 0 ? U.y : U.y + U.h / 2;
        G = { t: 'mresize', h, items: sel.map(o => ({ o, x: o.x, y: o.y, w: o.w, h: o.h })), U, off: { x: p.x - cx, y: p.y - cy } }; }
    }
    return;
  }
  const bd = e.target.closest('[data-fxbadge]'); if (bd) { S.fx = bd.dataset.fxbadge; const fx = curSlide().effects.find(x => x.id === S.fx); if (fx) S.sel = [fx.objId]; selectionChanged(); return; }
  const oe = topEl(e.target), shift = e.shiftKey || e.ctrlKey || e.metaKey;
  if (oe && !e.target.closest('#ovl')) {
    const id = oe.dataset.oid, o = objById(id); if (!o) return;
    const ld = S._lastDown, nowT = Date.now();
    if (ld && ld.id === id && nowT - ld.t < 450 && Math.hypot(e.clientX - ld.x, e.clientY - ld.y) < 8 && !shift) { S._lastDown = null; e.preventDefault(); S.sel = [id]; activateObject(e, o); return; }
    S._lastDown = { id, t: nowT, x: e.clientX, y: e.clientY };
    if (S.editing && S.editing !== id) endEdit();
    if (shift) S.sel = S.sel.includes(id) ? S.sel.filter(x => x !== id) : S.sel.concat(id); else if (!S.sel.includes(id)) S.sel = [id];
    S.fx = null; selectionChanged();
    const items = selObjs().filter(x => !x.locked); if (!items.length) return;
    e.preventDefault(); sc.setPointerCapture(e.pointerId);
    G = { t: 'move', p0: p, items: items.map(x => ({ o: x, x: x.x, y: x.y })), moved: false, id, shift }; return;
  }
  if (S.editing) endEdit();
  if (!shift) S.sel = [];
  S.fx = null; e.preventDefault(); sc.setPointerCapture(e.pointerId);
  G = { t: 'marq', base: S.sel.slice(), shift }; S.marquee = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }; selectionChanged();
}
function snapMove(G, dx, dy) {
  S.guides = []; if (!S.snap) return [dx, dy];
  const W = S.proj.size.w, H = S.proj.size.h, thr = 7 / S.z, ids = new Set(G.items.map(i => i.o.id));
  const sb = unionBox(G.items.map(i => ({ x: i.x, y: i.y, w: i.o.w, h: i.o.h, rot: i.o.rot || 0 }))), xs = [0, W / 2, W], ys = [0, H / 2, H];
  curSlide().objects.forEach(o => { if (ids.has(o.id) || o.hidden) return; const b = bboxOf(o); xs.push(b.x, b.x + b.w / 2, b.x + b.w); ys.push(b.y, b.y + b.h / 2, b.y + b.h); });
  const best = (cands, lines) => { let bd = thr, bo = 0, bl = null; for (const c of cands) for (const t of lines) { const d = Math.abs(t - c); if (d < bd) { bd = d; bo = t - c; bl = t; } } return [bo, bl]; };
  const [ox, lx] = best([sb.x + dx, sb.x + dx + sb.w / 2, sb.x + dx + sb.w], xs), [oy, ly] = best([sb.y + dy, sb.y + dy + sb.h / 2, sb.y + dy + sb.h], ys);
  if (lx != null) S.guides.push({ v: true, p: lx }); if (ly != null) S.guides.push({ v: false, p: ly });
  return [dx + ox, dy + oy];
}
function onStageMove(e) {
  if (!G) return; const p = slidePt(e), z = S.z;
  switch (G.t) {
    case 'move': {
      let dx = p.x - G.p0.x, dy = p.y - G.p0.y;
      if (!G.moved) { if (Math.hypot(dx, dy) * z < 3) return; G.moved = true; }
      if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      [dx, dy] = e.altKey ? (S.guides = [], [dx, dy]) : snapMove(G, dx, dy);
      G.items.forEach(i => { i.o.x = i.x + dx; i.o.y = i.y + dy; refreshEl(i.o); }); drawOverlay(); break;
    }
    case 'resize': {
      const o = G.o, s0 = G.s0, th = (o.rot || 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), [hx, hy] = HANDLES[G.h];
      const cx = s0.x + s0.w / 2, cy = s0.y + s0.h / 2, al = { x: -hx * s0.w / 2, y: -hy * s0.h / 2 };
      const A = { x: cx + al.x * c - al.y * s, y: cy + al.x * s + al.y * c }, d = { x: p.x - G.off.x - A.x, y: p.y - G.off.y - A.y }, v = { x: d.x * c + d.y * s, y: -d.x * s + d.y * c };
      let nw = hx ? Math.max(8, hx * v.x) : s0.w, nh = hy ? Math.max(8, hy * v.y) : s0.h;
      if (!!o.lockRatio !== e.shiftKey) { if (hx && hy) { const k = Math.max(nw / s0.w, nh / s0.h); nw = s0.w * k; nh = s0.h * k; } else if (hx) nh = s0.h * nw / s0.w; else nw = s0.w * nh / s0.h; }
      const lc = { x: hx * nw / 2, y: hy * nh / 2 }, ncx = A.x + lc.x * c - lc.y * s, ncy = A.y + lc.x * s + lc.y * c;
      o.w = nw; o.h = nh; o.x = ncx - nw / 2; o.y = ncy - nh / 2; refreshEl(o, true); drawOverlay(); break;
    }
    case 'mresize': {
      const U = G.U, [hx, hy] = HANDLES[G.h], ax = hx > 0 ? U.x : U.x + U.w, ay = hy > 0 ? U.y : U.y + U.h;
      let sx = hx ? Math.max(8, hx * (p.x - G.off.x - ax)) / U.w : 1, sy = hy ? Math.max(8, hy * (p.y - G.off.y - ay)) / U.h : 1;
      if (hx && hy) { const k = e.shiftKey ? Math.max(sx, sy) : Math.max(sx, sy); sx = sy = k; } else if (hx) sy = e.shiftKey ? sx : 1; else if (hy) sx = e.shiftKey ? sy : 1;
      if (hx && !hy) sy = 1; if (hy && !hx) sx = 1;
      G.items.forEach(i => { i.o.x = ax + (i.x - ax) * sx; i.o.y = ay + (i.y - ay) * sy; i.o.w = Math.max(4, i.w * sx); i.o.h = Math.max(4, i.h * sy); refreshEl(i.o, true); }); drawOverlay(); break;
    }
    case 'rot': {
      const o = G.o, cx = o.x + o.w / 2, cy = o.y + o.h / 2; let a = Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 90; if (e.shiftKey) a = Math.round(a / 15) * 15;
      o.rot = Math.round((((a % 360) + 360) % 360) * 10) / 10; refreshEl(o); drawOverlay(); break;
    }
    case 'pathend': case 'pathctl': {
      const fx = G.fx, o = objById(fx.objId), cx = o.x + o.w / 2, cy = o.y + o.h / 2;
      if (G.t === 'pathend') { fx.path.dx = Math.round(p.x - cx); fx.path.dy = Math.round(p.y - cy); } else { fx.path.cx = Math.round(p.x - cx); fx.path.cy = Math.round(p.y - cy); }
      drawOverlay(); break;
    }
    case 'marq': {
      const m = S.marquee; m.x1 = p.x; m.y1 = p.y; const x0 = Math.min(m.x0, m.x1), x1 = Math.max(m.x0, m.x1), y0 = Math.min(m.y0, m.y1), y1 = Math.max(m.y0, m.y1);
      const hit = curSlide().objects.filter(o => { const b = bboxOf(o); return b.x < x1 && b.x + b.w > x0 && b.y < y1 && b.y + b.h > y0; }).map(o => o.id);
      S.sel = G.shift ? Array.from(new Set(G.base.concat(hit))) : hit; drawOverlay(); break;
    }
  }
}
function onStageUp(e) {
  if (!G) return; const g = G; G = null; S.guides = [];
  if (g.t === 'move') { if (g.moved) commit('Objekte verschieben'); else { if (!g.shift && S.sel.length > 1) S.sel = [g.id]; selectionChanged(); } }
  else if (g.t === 'resize' || g.t === 'mresize') commit('Größe ändern');
  else if (g.t === 'rot') commit('Drehen');
  else if (g.t === 'pathend' || g.t === 'pathctl') commit('Bewegungspfad');
  else if (g.t === 'marq') { S.marquee = null; selectionChanged(); }
}
function cancelGesture() { if (!G) return false; G = null; S.marquee = null; S.guides = []; restoreSnap(HIST.stack[HIST.i]); render(); return true; }

/* ---------- Folienleiste: Auswahl & Umsortieren per Maus ---------- */
function thumbDown(e) {
  const th = e.target.closest('.th'); if (!th || e.button !== 0) return;
  S.focusArea = 'thumbs'; const idx = slideIdx(th.dataset.sid); if (idx < 0) return;
  if (idx !== S.cur) { if (S.editing) endEdit(); stopPreview(true); S.cur = idx; S.sel = []; S.fx = null; render(); }
  const cont = th.parentElement, rects = () => $$('.th', cont); const sid = th.dataset.sid;
  G = { t: 'tdrag', sid, x0: e.clientX, y0: e.clientY, moved: false, mark: null, to: idx, cont };
  const mv = ev => {
    if (!G || G.t !== 'tdrag') return; if (!G.moved && Math.hypot(ev.clientX - G.x0, ev.clientY - G.y0) < 6) return;
    G.moved = true; const list = S.view !== 'sorter', ths = rects(); ths.forEach(t => t.classList.toggle('drag', t.dataset.sid === sid));
    let best = 0, bd = 1e9, before = true;
    ths.forEach((t, i) => { const r = t.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, d = list ? Math.abs(ev.clientY - cy) : Math.hypot(ev.clientX - cx, ev.clientY - cy); if (d < bd) { bd = d; best = i; before = list ? ev.clientY < cy : ev.clientX < cx; } });
    G.to = best + (before ? 0 : 1);
    if (!G.mark) { G.mark = el('div', { id: 'insmark2', style: 'position:absolute;background:#1b6ef3;z-index:9;pointer-events:none;border-radius:2px' }); cont.style.position = 'relative'; (S.view === 'sorter' ? cont : $('#thumbs')).append(G.mark); }
    const r = ths[best].getBoundingClientRect(), cr = (S.view === 'sorter' ? cont : $('#thumbs')).getBoundingClientRect(), host = S.view === 'sorter' ? cont : $('#thumbs');
    if (list) { G.mark.style.cssText += `;left:${r.left - cr.left + 4}px;width:${r.width}px;height:3px;top:${(before ? r.top - 5 : r.bottom + 3) - cr.top + host.scrollTop}px`; }
    else { G.mark.style.cssText += `;top:${r.top - cr.top + host.scrollTop}px;height:${r.height}px;width:3px;left:${(before ? r.left - 9 : r.right + 5) - cr.left + host.scrollLeft}px`; }
  };
  const up = () => {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); const g = G; G = null;
    if (g && g.mark) g.mark.remove(); $$('.th.drag').forEach(t => t.classList.remove('drag'));
    if (g && g.moved) { const from = slideIdx(sid); let to = g.to; if (to > from) to--; if (to !== from) moveSlide(from, to); }
  };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}

/* ---------- Zwischenablage für Objekte ---------- */
function copySel(cut) { const os = selObjs(); if (!os.length) return; S.clip = { objs: deepCopy(os), assets: S.proj.assets }; toast(os.length + ' Objekt(e) kopiert'); if (cut) deleteSelected(); }
function pasteObjs() {
  if (!S.clip) return; const s = curSlide(), ids = [];
  S.clip.objs.forEach(o => { const n = deepCopy(o); reId(n); n.x += 24; n.y += 24; s.objects.push(n); ids.push(n.id); }); S.clip.objs.forEach(o => { o.x += 24; o.y += 24; });
  S.sel = ids; commit('Einfügen');
}
function reId(o) { o.id = uid('o'); delete o.mid; if (o.children) o.children.forEach(reId); }

/* ---------- Tastatur ---------- */
document.addEventListener('keydown', e => {
  if (S.player) return;
  const k = e.key, mod = e.ctrlKey || e.metaKey;
  if (dlgStack.length) { if (k === 'Escape') { e.preventDefault(); dlgStack[dlgStack.length - 1].close(); } return; }
  if (openMenu) { if (k === 'Escape') { e.preventDefault(); closeMenu(); } return; }
  if (mod && (k === 's' || k === 'S')) { e.preventDefault(); saveProject(); return; }
  if (k === 'Escape') { if (S.previewing) { stopPreview(); return; } if (G && cancelGesture()) return; if (S.editing) { const o = objById(S.editing); const t = S.layer.querySelector('[data-oid="' + S.editing + '"] .pp-txt'); if (t) t.blur(); endEdit(); S.focusArea = 'stage'; return; } if (S.sel.length) { S.sel = []; selectionChanged(); } return; }
  const ae = document.activeElement, typing = ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable);
  if (k === 'F5') { e.preventDefault(); startShow(e.shiftKey ? S.cur : 0); return; }
  if (typing) return;
  if (mod && !e.shiftKey && (k === 'z' || k === 'Z')) { e.preventDefault(); undo(); return; }
  if (mod && (k === 'y' || k === 'Y' || (e.shiftKey && (k === 'z' || k === 'Z')))) { e.preventDefault(); redo(); return; }
  if (S.view === 'sorter' || S.focusArea === 'thumbs') {
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); deleteSlide(S.cur); return; }
    if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); gotoSlide(S.cur + 1); return; }
    if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); gotoSlide(S.cur - 1); return; }
    if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); duplicateSlide(S.cur); return; }
    if (k === 'Enter') { e.preventDefault(); if (S.view === 'sorter') setView('normal'); S.focusArea = 'stage'; return; }
    if (S.view === 'sorter') return;
  }
  if (mod && (k === 'a' || k === 'A')) { e.preventDefault(); S.sel = curSlide().objects.filter(o => !o.hidden).map(o => o.id); selectionChanged(); return; }
  if (mod && (k === 'c' || k === 'C')) { e.preventDefault(); copySel(false); return; }
  if (mod && (k === 'x' || k === 'X')) { e.preventDefault(); copySel(true); return; }
  if (mod && (k === 'v' || k === 'V')) return; // paste-Ereignis übernimmt
  if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); duplicateSelected(); return; }
  if (mod && (k === 'g' || k === 'G')) { e.preventDefault(); e.shiftKey ? ungroupSel() : groupSel(); return; }
  if (k === 'Delete' || k === 'Backspace') { if (S.sel.length) { e.preventDefault(); deleteSelected(); } return; }
  if ((k === 'Enter' || k === 'F2') && S.sel.length === 1) { e.preventDefault(); beginEdit(S.sel[0]); return; }
  if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); gotoSlide(S.cur + (k === 'PageDown' ? 1 : -1)); return; }
  if (k.startsWith('Arrow') && S.sel.length) {
    e.preventDefault(); const d = e.shiftKey ? 10 : 1, dx = k === 'ArrowLeft' ? -d : k === 'ArrowRight' ? d : 0, dy = k === 'ArrowUp' ? -d : k === 'ArrowDown' ? d : 0;
    selObjs().forEach(o => { if (!o.locked) { o.x += dx; o.y += dy; } }); commit('Objekte verschieben (Tastatur)', { merge: true });
  }
});
document.addEventListener('paste', e => {
  if (S.player || dlgStack.length) return; const cd = e.clipboardData; if (!cd) return;
  const ae = document.activeElement;
  if (ae && ae.isContentEditable) { e.preventDefault(); const h = cd.getData('text/html'), t = cd.getData('text/plain'); document.execCommand('insertHTML', false, h ? sanitizeHTML(h) : PP.escHtml(t).replace(/\n/g, '<br>')); return; }
  if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;
  const f = Array.from(cd.files || []).find(x => /^image\//.test(x.type)); if (f) { e.preventDefault(); addImageFile(f); return; }
  if (S.clip) { e.preventDefault(); pasteObjs(); }
});
function gotoSlide(i) { i = clamp(i, 0, S.proj.slides.length - 1); if (i === S.cur) return; if (S.editing) endEdit(); stopPreview(true); S.cur = i; S.sel = []; S.fx = null; render(); const t = $('.th.on'); if (t) t.scrollIntoView({ block: 'nearest' }); }

/* ---------- Verdrahtung ---------- */
function bindStage() {
  const sc = $('#scaler');
  sc.addEventListener('pointerdown', onStageDown); sc.addEventListener('pointermove', onStageMove); sc.addEventListener('pointerup', onStageUp); sc.addEventListener('pointercancel', onStageUp);
  $('#stageArea').addEventListener('pointerdown', e => { if (e.target.id === 'stageArea') { if (S.editing) endEdit(); S.sel = []; selectionChanged(); } S.focusArea = 'stage'; });
  $('#stageArea').addEventListener('wheel', e => { if (e.ctrlKey) { e.preventDefault(); const z = S.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1); S.zoom = clamp(Math.round(z * 100) / 100, .25, 3); renderStage(true); renderStatus(); } }, { passive: false });
  $('#thumbs').addEventListener('pointerdown', thumbDown); $('#sorter').addEventListener('pointerdown', thumbDown);
  $('#sorter').addEventListener('dblclick', e => { if (e.target.closest('.th')) setView('normal'); });
  $('#thumbs').addEventListener('keydown', e => { if (e.key === 'Tab') return; S.focusArea = 'thumbs'; });
  $('#notesText').addEventListener('input', e => { curSlide().notes = e.target.value; S.dirty = true; scheduleAutosave(); });
  $('#notesText').addEventListener('change', () => { commit('Notizen'); });
  $('#notesText').addEventListener('focus', () => { S.focusArea = 'notes'; });
  new ResizeObserver(() => { if (S.zoom === 'fit' && !S.previewing && !S.editing && S.view === 'normal') { renderStage(true); } }).observe($('#stageArea'));
  $$('#rtabs button').forEach(b => b.addEventListener('click', () => { S.rtab = b.dataset.t; renderRight(); drawOverlay(); }));
  window.addEventListener('beforeunload', e => { if (S.dirty && S.unsavedFile) { e.preventDefault(); e.returnValue = ''; } });
}
