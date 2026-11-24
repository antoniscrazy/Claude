/* =====================================================================
   2. Rendering des Editors: Bühne, Auswahl-Overlay, Miniaturen, Seitenleisten
   ===================================================================== */
function zoomValue() {
  if (S.zoom !== 'fit') return S.zoom;
  const a = $('#stageArea'); const w = a.clientWidth - 44, h = a.clientHeight - 44;
  return Math.max(.1, Math.min(w / S.proj.size.w, h / S.proj.size.h));
}
const ovl = el('div', { id: 'ovl' });
function render() { renderStage(); renderThumbs(); renderRight(); refreshRibbon(); renderStatus(); const n = $('#notesText'); if (document.activeElement !== n) n.value = curSlide().notes || ''; refreshTitle(); }
function afterChange() { render(); }
function refreshTitle() {
  $('#qUndo').disabled = HIST.i <= 0; $('#qRedo').disabled = HIST.i >= HIST.stack.length - 1;
}
function renderStage(force) {
  const st = $('#stageArea'), so = $('#sorter'), sc = $('#scaler');
  $('#notes').classList.toggle('collapsed', !S.notesOn || S.view === 'sorter');
  $('#thumbs').classList.toggle('collapsed', !S.thumbsOn || S.view === 'sorter'); $('#right').classList.toggle('collapsed', !S.rightOn || S.view === 'sorter');
  if (S.view === 'sorter') { st.style.display = 'none'; so.style.display = 'flex'; return; }
  st.style.display = 'flex'; so.style.display = 'none';
  if (S.editing && !force) { drawOverlay(); return; }
  const z = zoomValue(); S.z = z; const W = S.proj.size.w, H = S.proj.size.h, slide = curSlide();
  sc.style.width = W * z + 'px'; sc.style.height = H * z + 'px'; sc.classList.toggle('edit-mode', !S.previewing);
  const layer = renderSlide(slide, S.proj, S.previewing ? 'show' : 'edit'); layer.style.transform = 'scale(' + z + ')';
  ovl.style.width = W + 'px'; ovl.style.height = H + 'px'; ovl.style.transform = 'scale(' + z + ')';
  sc.replaceChildren(layer, ovl); S.layer = layer; drawOverlay();
}
const bboxOf = o => { // achsenparalleles Rechteck eines (gedrehten) Objekts
  const c = Math.cos(o.rot * Math.PI / 180), s = Math.sin(o.rot * Math.PI / 180), cx = o.x + o.w / 2, cy = o.y + o.h / 2, hw = o.w / 2, hh = o.h / 2;
  const ex = Math.abs(hw * c) + Math.abs(hh * s), ey = Math.abs(hw * s) + Math.abs(hh * c); return { x: cx - ex, y: cy - ey, w: 2 * ex, h: 2 * ey };
};
const unionBox = os => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; os.forEach(o => { const b = bboxOf(o); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); }); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
const HANDLES = { nw: [-1, -1, 'nwse'], n: [0, -1, 'ns'], ne: [1, -1, 'nesw'], e: [1, 0, 'ew'], se: [1, 1, 'nwse'], s: [0, 1, 'ns'], sw: [-1, 1, 'nesw'], w: [-1, 0, 'ew'] };
function drawOverlay() {
  ovl.replaceChildren(); if (S.previewing || S.view === 'sorter') return;
  const z = S.z || 1, hs = 10 / z, bw = 1.6 / z, slide = curSlide(), add = (n) => { ovl.append(n); return n; };
  if (S.rtab === 'anim' && S.rightOn) { // Nummern der Klickgruppen – nur im Editor
    const sch = buildSchedule(slide.effects); let click = 0; const nums = sch.groups.map(g => g.auto ? 0 : ++click), per = {};
    sch.items.forEach(it => { const o = objById(it.e.objId); if (!o) return; const k = per[o.id] = (per[o.id] || 0) + 1;
      add(el('div', { class: 'badge', style: `left:${o.x - 6 / z + (k - 1) * 26 / z}px;top:${o.y - 10 / z}px;font-size:${14 / z}px;line-height:${18 / z}px;min-width:${20 / z}px;padding:0 ${3 / z}px;border-radius:${3 / z}px`, 'data-fxbadge': it.e.id }, String(nums[it.g]))); });
  }
  const fx = S.fx && slide.effects.find(e => e.id === S.fx); // Bewegungspfad
  if (fx && fx.cat === 'path') {
    const o = objById(fx.objId); if (o) {
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2, P = fx.path, pts = []; for (let i = 0; i <= 40; i++) { const q = PP.pathPoint(fx, i / 40); pts.push((cx + q.x) + ',' + (cy + q.y)); }
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', S.proj.size.w); svg.setAttribute('height', S.proj.size.h); svg.style.cssText = 'left:0;top:0;overflow:visible;pointer-events:none';
      svg.innerHTML = `<polyline points="${pts.join(' ')}" fill="none" stroke="#3a86ff" stroke-width="${2.5 / z}" stroke-dasharray="${8 / z} ${6 / z}"/>`; add(svg);
      add(el('div', { class: 'hdl', 'data-h': 'pathend', style: `left:${cx + P.dx - hs / 2}px;top:${cy + P.dy - hs / 2}px;width:${hs * 1.2}px;height:${hs * 1.2}px;border-radius:50%;background:#3a86ff;cursor:move` }));
      if (fx.kind === 'arc') { const ax = P.cx != null ? P.cx : P.dx / 2 - P.dy * .5, ay = P.cy != null ? P.cy : P.dy / 2 + P.dx * .5;
        add(el('div', { class: 'hdl', 'data-h': 'pathctl', style: `left:${cx + ax - hs / 2}px;top:${cy + ay - hs / 2}px;width:${hs}px;height:${hs}px;background:#ffd166;cursor:move` })); }
    }
  }
  S.guides.forEach(g => add(el('div', { class: 'guide', style: g.v ? `left:${g.p}px;top:0;width:${1.5 / z}px;height:${S.proj.size.h}px` : `top:${g.p}px;left:0;height:${1.5 / z}px;width:${S.proj.size.w}px` })));
  const sel = selObjs();
  if (sel.length === 1) {
    const o = sel[0], box = add(el('div', { class: 'sel-box', style: `left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;transform:rotate(${o.rot || 0}deg);border-width:${bw}px;${S.editing ? 'border-style:dashed' : ''}` }));
    if (!o.locked && !S.editing) {
      for (const k in HANDLES) { const [hx, hy, cur] = HANDLES[k]; box.append(el('div', { class: 'hdl', 'data-h': k, style: `left:calc(${50 + hx * 50}% - ${hs / 2}px);top:calc(${50 + hy * 50}% - ${hs / 2}px);width:${hs}px;height:${hs}px;cursor:${cur}-resize;border-width:${bw}px` })); }
      box.append(el('div', { class: 'hdl rot', 'data-h': 'rot', style: `left:calc(50% - ${hs / 2}px);top:${-28 / z - hs / 2}px;width:${hs}px;height:${hs}px;border-width:${bw}px` }));
      box.append(el('div', { style: `left:50%;top:${-28 / z}px;width:${bw}px;height:${28 / z}px;background:#1b6ef3` }));
    }
  } else if (sel.length > 1) {
    sel.forEach(o => add(el('div', { class: 'sel-box', style: `left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;transform:rotate(${o.rot || 0}deg);border-width:${bw}px;border-style:dashed` })));
    const u = unionBox(sel), box = add(el('div', { class: 'sel-box', style: `left:${u.x}px;top:${u.y}px;width:${u.w}px;height:${u.h}px;border-width:${bw}px` }));
    if (!sel.some(o => o.locked)) for (const k in HANDLES) { const [hx, hy, cur] = HANDLES[k]; box.append(el('div', { class: 'hdl', 'data-h': k, style: `left:calc(${50 + hx * 50}% - ${hs / 2}px);top:calc(${50 + hy * 50}% - ${hs / 2}px);width:${hs}px;height:${hs}px;cursor:${cur}-resize;border-width:${bw}px` })); }
  }
  if (S.marquee) { const m = S.marquee; add(el('div', { class: 'marq', style: `left:${Math.min(m.x0, m.x1)}px;top:${Math.min(m.y0, m.y1)}px;width:${Math.abs(m.x1 - m.x0)}px;height:${Math.abs(m.y1 - m.y0)}px;border-width:${bw}px` })); }
}

/* ---------- Miniaturen ---------- */
const thumbCache = new Map();
function thumbWidth() { return S.view === 'sorter' ? 232 : 148; }
function buildThumb(s, i) {
  const key = JSON.stringify(s) + JSON.stringify(S.proj.master) + S.proj.size.w + (S.proj.assets ? Object.keys(S.proj.assets).length : 0);
  let c = thumbCache.get(s.id);
  if (!c) { c = { key: '', el: el('div', { class: 'th', tabindex: '0', 'data-sid': s.id, role: 'option' }, el('div', { class: 'n' }), el('div', { class: 'pv' })) }; thumbCache.set(s.id, c); }
  const pv = c.el.querySelector('.pv'), tw = thumbWidth();
  if (c.key !== key || c.tw !== tw) {
    c.key = key; c.tw = tw; const k = tw / S.proj.size.w, layer = renderSlide(s, S.proj, 'show'); layer.style.transform = 'scale(' + k + ')';
    pv.style.width = tw + 'px'; pv.style.height = Math.round(S.proj.size.h * k) + 'px'; pv.replaceChildren(layer);
  }
  c.el.querySelector('.n').textContent = i + 1; c.el.classList.toggle('on', i === S.cur); c.el.classList.toggle('hid', !!s.hidden); c.el.setAttribute('aria-selected', i === S.cur);
  c.el.title = 'Folie ' + (i + 1) + (s.hidden ? ' (ausgeblendet)' : '');
  return c.el;
}
function renderThumbs() {
  const host = S.view === 'sorter' ? $('#sorter') : $('#thumbList'), ids = new Set(S.proj.slides.map(s => s.id));
  for (const k of thumbCache.keys()) if (!ids.has(k)) thumbCache.delete(k);
  const els = S.proj.slides.map((s, i) => buildThumb(s, i));
  if (S.view === 'sorter') { $('#thumbList').replaceChildren(); host.replaceChildren(...els); } else { host.replaceChildren(...els); }
}

/* ---------- Statusleiste ---------- */
function renderStatus() {
  const st = $('#status'); st.replaceChildren();
  const b = (ic, t, on, fn) => { const x = el('button', { class: on ? 'on' : '', title: t, 'aria-label': t, html: icon(ic, 16), onclick: fn }); return x; };
  const zs = el('select', { 'aria-label': 'Zoom', onchange: e => { S.zoom = e.target.value === 'fit' ? 'fit' : +e.target.value; renderStage(true); renderStatus(); } },
    el('option', { value: 'fit' }, 'Anpassen'), ...[.25, .5, .75, 1, 1.5, 2].map(v => el('option', { value: v }, Math.round(v * 100) + ' %')));
  zs.value = S.zoom === 'fit' ? 'fit' : String(S.zoom);
  const o = S.sel.length; const txt = S.view === 'sorter' ? 'Folienübersicht' : `Folie ${S.cur + 1} von ${S.proj.slides.length}`;
  st.append(el('span', null, txt), el('span', null, S.proj.size.w === 1280 ? '16:9' : S.proj.size.w === 960 ? '4:3' : S.proj.size.w + '×' + S.proj.size.h), o ? el('span', null, o + ' Objekt' + (o > 1 ? 'e' : '') + ' ausgewählt') : '', el('span', { class: 'sp' }),
    b('thumbs', 'Folienleiste ein-/ausblenden', S.thumbsOn, () => { S.thumbsOn = !S.thumbsOn; renderStage(true); renderStatus(); }),
    b('notes', 'Notizen ein-/ausblenden', S.notesOn, () => { S.notesOn = !S.notesOn; renderStage(true); renderStatus(); }),
    b('paneright', 'Seitenleiste rechts ein-/ausblenden', S.rightOn, () => { S.rightOn = !S.rightOn; renderStage(true); renderStatus(); }),
    b('slideadd', 'Normalansicht', S.view === 'normal', () => setView('normal')), b('grid', 'Folienübersicht', S.view === 'sorter', () => setView('sorter')),
    el('button', { class: 'fitbtn', title: 'Folie an Fenster anpassen', onclick: () => { S.zoom = 'fit'; renderStage(true); renderStatus(); } }, 'Anpassen'),
    zoomWidget({ min: 25, max: 300, get: () => S.z || 1, set: v => { S.zoom = v; renderStage(true); renderStatus(); } }));
}
function setView(v) { if (S.editing) endEdit(); S.view = v; render(); }

/* ---------- Farbfeld mit Themenfarben ---------- */
function toHex(c) { const v = rc(S.proj.master, c); if (/^#[0-9a-f]{6}$/i.test(v)) return v; if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v.slice(1).split('').map(x => x + x).join(''); const m = /rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(v); return m ? '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join('') : '#888888'; }
function colorField(label, val, set, allowNone) {
  const inp = el('input', { type: 'color', value: toHex(val || '#000000'), 'aria-label': label, onchange: e => set(e.target.value) });
  const sw = el('div', { style: 'display:flex;gap:3px;flex-wrap:wrap;margin-top:3px' });
  ['@a1', '@a2', '@a3', '@a4', '@a5', '@a6', '@tx', '@bg'].forEach(k => sw.append(el('button', { class: 'mini', title: 'Themenfarbe ' + k.slice(1), style: `width:16px;height:16px;border:1px solid #0004;border-radius:3px;cursor:pointer;background:${rc(S.proj.master, k)};outline:${val === k ? '2px solid #1b6ef3' : 'none'}`, onclick: () => set(k) })));
  if (allowNone) sw.append(el('button', { class: 'btn', style: 'padding:0 6px;font-size:11px', onclick: () => set('none') }, 'Keine'));
  return el('label', null, label, inp, sw);
}

/* ---------- Rechte Leiste ---------- */
function renderRight() {
  $$('#rtabs button').forEach(b => b.classList.toggle('on', b.dataset.t === S.rtab));
  const body = $('#rbody'), keep = body.scrollTop; body.replaceChildren();
  if (S.rtab === 'format') renderFormat(body); else if (S.rtab === 'select') renderSelectPane(body); else renderAnimPane(body);
  body.scrollTop = keep;
}
const numInput = (v, fn, o) => el('input', Object.assign({ type: 'number', value: fmt(v), onchange: e => { const x = +e.target.value; if (isFinite(x)) fn(x); } }, o || {}));
function renderFormat(body) {
  const sel = selObjs(), slide = curSlide();
  if (!sel.length) {
    body.append(el('div', { class: 'sech' }, 'Folie'),
      el('div', { class: 'frow' }, el('label', null, 'Layout', el('select', { onchange: e => applyLayout(e.target.value) }, ...Object.entries(LAYOUTS).map(([k, v]) => el('option', Object.assign({ value: k }, slide.layout === k ? { selected: true } : {}), v))))),
      el('div', { class: 'frow' }, colorField('Hintergrund (nur diese Folie)', slide.bg || '@bg', v => { slide.bg = v; commit('Hintergrund'); })),
      el('div', { class: 'tools' }, el('button', { class: 'btn', onclick: resetSlideToMaster }, 'Auf Master zurücksetzen')),
      el('p', { class: 'hint' }, 'Klicken Sie ein Objekt an, um Position, Größe, Füllung und weitere Eigenschaften zu bearbeiten. Mit gedrückter Umschalttaste oder einem Auswahlrahmen markieren Sie mehrere Objekte.'));
    return;
  }
  if (sel.length > 1) {
    body.append(el('div', { class: 'sech' }, sel.length + ' Objekte'), el('div', { class: 'tools' }, el('button', { class: 'btn', onclick: groupSel }, 'Gruppieren'), el('button', { class: 'btn', onclick: () => alignSel('l') }, 'Links'), el('button', { class: 'btn', onclick: () => alignSel('ch') }, 'Mitte'), el('button', { class: 'btn', onclick: () => distribute('h') }, 'Horizontal verteilen'), el('button', { class: 'btn', onclick: () => distribute('v') }, 'Vertikal verteilen')),
      el('p', { class: 'hint' }, 'Größenänderung über den gemeinsamen Rahmen skaliert alle Objekte proportional.')); return;
  }
  const o = sel[0], set = (k, v, label) => { o[k] = v; commit(label || 'Eigenschaft'); };
  body.append(el('div', { class: 'sech' }, ({ shape: 'Form', text: 'Textfeld', image: 'Bild', line: 'Linie', table: 'Tabelle', chart: 'Diagramm', group: 'Gruppe' })[o.type]),
    el('div', { class: 'frow' }, el('label', null, 'Name (Auswahlbereich)', el('input', { value: o.name || '', onchange: e => set('name', e.target.value, 'Umbenennen') }))),
    el('div', { class: 'fgrid' }, el('label', null, 'X', numInput(o.x, v => set('x', v, 'Position'))), el('label', null, 'Y', numInput(o.y, v => set('y', v, 'Position'))),
      el('label', null, 'Breite', numInput(o.w, v => { const r = o.h / o.w; o.w = Math.max(4, v); if (o.lockRatio) o.h = o.w * r; commit('Größe'); })), el('label', null, 'Höhe', numInput(o.h, v => { const r = o.w / o.h; o.h = Math.max(4, v); if (o.lockRatio) o.w = o.h * r; commit('Größe'); })),
      el('label', null, 'Drehung (°)', numInput(o.rot || 0, v => set('rot', ((v % 360) + 360) % 360, 'Drehen'))),
      el('label', null, 'Seitenverhältnis', el('select', { onchange: e => set('lockRatio', e.target.value === '1', 'Seitenverhältnis') }, el('option', Object.assign({ value: '0' }, !o.lockRatio ? { selected: true } : {}), 'Frei'), el('option', Object.assign({ value: '1' }, o.lockRatio ? { selected: true } : {}), 'Beibehalten')))));
  if (o.type !== 'image' && o.type !== 'table' && o.type !== 'chart' && o.type !== 'group') {
    body.append(el('div', { class: 'frow' }, colorField('Füllung', o.fill || 'none', v => set('fill', v, 'Füllung'), true)), el('div', { class: 'frow' }, colorField('Kontur', o.stroke || 'none', v => { o.stroke = v; if (v !== 'none' && !o.sw) o.sw = 3; commit('Kontur'); }, true), el('label', null, 'Stärke', numInput(o.sw || 0, v => set('sw', clamp(v, 0, 50), 'Konturstärke')))));
    if (o.type === 'shape' && o.kind === 'round') body.append(el('div', { class: 'frow' }, el('label', null, 'Eckenradius', numInput(o.radius != null ? o.radius : Math.min(o.w, o.h) * .18, v => set('radius', Math.max(0, v), 'Eckenradius')))));
  }
  if (o.type === 'line') body.append(el('div', { class: 'frow' }, colorField('Linienfarbe', o.stroke || '@a1', v => set('stroke', v, 'Linienfarbe')), el('label', null, 'Stärke', numInput(o.sw || 4, v => set('sw', clamp(v, 1, 50), 'Konturstärke'))), el('label', null, 'Pfeilspitze', el('select', { onchange: e => set('arrow', e.target.value === '1', 'Pfeil') }, el('option', Object.assign({ value: '0' }, !o.arrow ? { selected: true } : {}), 'Keine'), el('option', Object.assign({ value: '1' }, o.arrow ? { selected: true } : {}), 'Ende')))));
  body.append(el('div', { class: 'frow' }, el('label', null, 'Deckkraft (%)', numInput((o.opacity == null ? 1 : o.opacity) * 100, v => set('opacity', clamp(v, 0, 100) / 100, 'Deckkraft'))), el('label', null, 'Schatten', el('select', { onchange: e => set('shadow', e.target.value === '1', 'Schatten') }, el('option', Object.assign({ value: '0' }, !o.shadow ? { selected: true } : {}), 'Aus'), el('option', Object.assign({ value: '1' }, o.shadow ? { selected: true } : {}), 'An')))));
  if (o.type === 'image') {
    const c = o.crop || { l: 0, t: 0, r: 0, b: 0 }, cf = (k, l) => el('label', null, l, numInput(c[k] * 100, v => { const n = Object.assign({}, c, { [k]: clamp(v, 0, 80) / 100 }); if (n.l + n.r > .9 || n.t + n.b > .9) return toast('Zuschnitt zu groß.', true); setCrop(o, n); }));
    body.append(el('div', { class: 'sech' }, 'Zuschneiden (%)'), el('div', { class: 'fgrid' }, cf('l', 'Links'), cf('r', 'Rechts'), cf('t', 'Oben'), cf('b', 'Unten')), el('div', { class: 'tools' }, el('button', { class: 'btn', onclick: () => setCrop(o, { l: 0, t: 0, r: 0, b: 0 }) }, 'Zuschnitt zurücksetzen')));
  }
  if (o.type === 'table') body.append(el('div', { class: 'sech' }, 'Tabelle'), el('div', { class: 'tools' }, el('button', { class: 'btn', onclick: () => tableOp('row+') }, '+ Zeile'), el('button', { class: 'btn', onclick: () => tableOp('row-') }, '− Zeile'), el('button', { class: 'btn', onclick: () => tableOp('col+') }, '+ Spalte'), el('button', { class: 'btn', onclick: () => tableOp('col-') }, '− Spalte')),
    el('div', { class: 'frow' }, el('label', null, 'Schriftgröße (pt)', numInput(o.fs || 16, v => set('fs', clamp(v, 6, 100), 'Tabelle'))), el('label', null, 'Kopfzeile', el('select', { onchange: e => set('header', e.target.value === '1', 'Tabelle') }, el('option', Object.assign({ value: '1' }, o.header ? { selected: true } : {}), 'Hervorheben'), el('option', Object.assign({ value: '0' }, !o.header ? { selected: true } : {}), 'Normal')))), el('p', { class: 'hint' }, 'Doppelklick auf eine Zelle bearbeitet den Text.'));
  if (o.type === 'chart') body.append(el('div', { class: 'sech' }, 'Diagramm'), el('div', { class: 'frow' }, el('label', null, 'Typ', el('select', { onchange: e => { o.chart.kind = e.target.value; commit('Diagrammtyp'); } }, ...[['bar', 'Säulen'], ['line', 'Linien'], ['pie', 'Kreis']].map(([k, v]) => el('option', Object.assign({ value: k }, o.chart.kind === k ? { selected: true } : {}), v))))), el('div', { class: 'tools' }, el('button', { class: 'btn', onclick: () => editChartData(o) }, 'Daten bearbeiten …')));
  if (o.ph) body.append(el('div', { class: 'tools' }, el('button', { class: 'btn', onclick: resetSlideToMaster }, 'Platzhalter auf Master zurücksetzen')));
  if (o.mid) body.append(el('p', { class: 'hint' }, 'Morph-Kopplung aktiv (' + o.mid + ').'));
}

/* ---------- Auswahlbereich ---------- */
function renderSelectPane(body) {
  const slide = curSlide(), list = slide.objects.slice().reverse();
  body.append(el('div', { class: 'tools' }, el('button', { class: 'btn', onclick: () => arrange('front'), disabled: !S.sel.length }, 'Ganz nach vorn'), el('button', { class: 'btn', onclick: () => arrange('forward'), disabled: !S.sel.length }, 'Eine Ebene vor'), el('button', { class: 'btn', onclick: () => arrange('backward'), disabled: !S.sel.length }, 'Eine zurück'), el('button', { class: 'btn', onclick: () => arrange('back'), disabled: !S.sel.length }, 'Ganz nach hinten')));
  if (!list.length) body.append(el('p', { class: 'hint' }, 'Diese Folie enthält keine Objekte.'));
  list.forEach(o => {
    const li = el('div', { class: 'li' + (S.sel.includes(o.id) ? ' on' : ''), 'data-oid': o.id, onclick: e => {
        const now = Date.now(), lc = S._selClick;
        if (!e.shiftKey && lc && lc.id === o.id && now - lc.t < 500 && S.sel.length === 1 && S.sel[0] === o.id) { S._selClick = null; const nm = $('#rbody .li[data-oid="' + o.id + '"] .nm'); if (nm) renameInline(nm, o); return; } // Doppelklick = Umbenennen
        S._selClick = { id: o.id, t: now }; S.sel = e.shiftKey ? (S.sel.includes(o.id) ? S.sel.filter(x => x !== o.id) : S.sel.concat(o.id)) : [o.id]; endEdit(); render(); } },
      el('span', { class: 'nm', title: 'Doppelklick zum Umbenennen' }, (o.hidden ? '(verborgen) ' : '') + (o.name || o.type)),
      el('button', { class: 'mini', title: o.hidden ? 'Einblenden' : 'Ausblenden', 'aria-label': 'Sichtbarkeit', html: icon(o.hidden ? 'eyeoff' : 'eye', 16), onclick: e => { e.stopPropagation(); o.hidden = !o.hidden; if (!o.hidden) delete o.hidden; commit('Ausblenden'); } }),
      el('button', { class: 'mini', title: o.locked ? 'Entsperren' : 'Sperren', 'aria-label': 'Sperren', style: o.locked ? 'color:#d9461f' : '', html: icon('lock', 16), onclick: e => { e.stopPropagation(); if (o.locked) delete o.locked; else o.locked = true; commit('Sperren'); } }));
    body.append(li);
  });
}
function renameInline(span, o) {
  const inp = el('input', { value: o.name || '', style: 'flex:1;height:22px', onblur: () => { o.name = inp.value || o.name; commit('Umbenennen'); }, onkeydown: e => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { inp.value = o.name; inp.blur(); } e.stopPropagation(); } });
  span.replaceWith(inp); inp.focus(); inp.select();
}

/* ---------- Animationsbereich ---------- */
function effectLabel(e) { return FX[e.cat][e.kind].n; }
function renderAnimPane(body) {
  const slide = curSlide(), sch = buildSchedule(slide.effects); let click = 0; const nums = sch.groups.map(g => g.auto ? 0 : ++click);
  body.append(el('div', { class: 'tools' }, el('button', { class: 'btn pri', onclick: previewSlide, disabled: !slide.effects.length, html: icon('play', 14) + ' Alle abspielen' }), el('button', { class: 'btn', onclick: () => previewEffect(S.fx), disabled: !S.fx }, 'Effekt abspielen')),
    el('div', { class: 'tools' }, el('button', { class: 'btn', onclick: () => moveEffect(-1), disabled: !S.fx }, '▲ Früher'), el('button', { class: 'btn', onclick: () => moveEffect(1), disabled: !S.fx }, '▼ Später'), el('button', { class: 'btn', onclick: dupEffect, disabled: !S.fx }, 'Duplizieren'), el('button', { class: 'btn', onclick: delEffect, disabled: !S.fx }, 'Löschen')));
  if (!slide.effects.length) body.append(el('p', { class: 'hint' }, 'Noch keine Animationen. Objekt auswählen, dann im Reiter „Animationen“ einen Effekt wählen oder „Animation hinzufügen“ verwenden.'));
  sch.items.forEach((it, idx) => {
    const e = it.e, o = objById(e.objId);
    body.append(el('div', { class: 'li' + (S.fx === e.id ? ' on' : ''), 'data-fx': e.id, onclick: () => { S.fx = e.id; S.sel = [e.objId]; render(); }, ondblclick: () => previewEffect(e.id) },
      el('span', { class: 'num', title: 'Klickgruppe' }, String(nums[it.g])), el('span', { class: 'cat c-' + e.cat }),
      el('span', { class: 'nm' }, el('div', null, effectLabel(e) + ' – ' + (o ? o.name : '?')), el('div', { class: 'sub' }, CAT_NAMES[e.cat] + ' · ' + START_NAMES[e.start] + ' · ' + (+it.begin.toFixed(2)) + '–' + (+it.end.toFixed(2)) + ' s'))));
  });
  if (slide.effects.length) body.append(el('p', { class: 'hint' }, 'Zeitangaben: Beginn–Ende in Sekunden relativ zum Start der Klickgruppe. Mit vorheriger = Basis des Vorgängers, Nach vorheriger = Ende des Vorgängers; die Verzögerung wird addiert.'));
}
