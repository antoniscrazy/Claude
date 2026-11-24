/* =====================================================================
   4. Befehle: Objekte, Folien, Animationen, Übergänge, Vorschau
   ===================================================================== */
function removeObjects(ids) {
  const s = curSlide(), set = new Set(ids); s.objects = s.objects.filter(o => !set.has(o.id)); s.effects = s.effects.filter(e => !set.has(e.objId)); // keine verwaisten Effekte
  S.sel = S.sel.filter(id => !set.has(id)); if (S.fx && !s.effects.some(e => e.id === S.fx)) S.fx = null;
}
function deleteSelected() { const ids = selObjs().filter(o => !o.locked).map(o => o.id); if (!ids.length) { if (S.sel.length) toast('Gesperrte Objekte können nicht gelöscht werden.', true); return; } removeObjects(ids); commit('Objekte löschen'); }
function duplicateSelected() { const s = curSlide(), os = selObjs(); if (!os.length) return; const ids = []; os.forEach(o => { const n = deepCopy(o); reId(n); n.x += 24; n.y += 24; n.name = (o.name || '') + ' Kopie'; s.objects.push(n); ids.push(n.id); }); S.sel = ids; commit('Objekte duplizieren'); }
function addObject(o, name) { const s = curSlide(); o.id = o.id || uid('o'); if (name) o.name = name; s.objects.push(o); S.sel = [o.id]; S.fx = null; commit('Einfügen: ' + (o.name || o.type)); }
function insertText() { const W = S.proj.size.w, H = S.proj.size.h; const o = mkText(W * .3, H * .4, W * .4, 80, '', { size: 24 }, { name: 'Textfeld' }); addObject(o); beginEdit(o.id); }
function insertShape(kind) { const W = S.proj.size.w, H = S.proj.size.h, w = 260, h = kind === 'ellipse' ? 260 : 170; addObject(mkShapeObj(kind, (W - w) / 2, (H - h) / 2, w, h, '@a1'), SHAPES[kind]); }
function insertLine(arrow) { const W = S.proj.size.w, H = S.proj.size.h; addObject({ type: 'line', x: W * .3, y: H * .5 - 12, w: 400, h: 24, rot: 0, stroke: '@a1', sw: 5, arrow: !!arrow }, arrow ? 'Pfeil' : 'Linie'); }
function insertTable() { const W = S.proj.size.w, H = S.proj.size.h; addObject({ type: 'table', x: W * .15, y: H * .32, w: W * .7, h: 240, rot: 0, header: true, fs: 16, rows: [['Spalte 1', 'Spalte 2', 'Spalte 3'], ['', '', ''], ['', '', ''], ['', '', '']] }, 'Tabelle'); }
function insertChart(kind) {
  const W = S.proj.size.w, H = S.proj.size.h; addObject({ type: 'chart', x: W * .2, y: H * .27, w: W * .6, h: H * .55, rot: 0, chart: { kind, labels: ['A', 'B', 'C', 'D'], series: [{ name: 'Reihe 1', values: [5, 9, 6, 12] }, ...(kind === 'pie' ? [] : [{ name: 'Reihe 2', values: [7, 4, 8, 10] }])] } }, 'Diagramm');
}
function editChartData(o) {
  const c = o.chart, ta = el('textarea', { 'aria-label': 'Diagrammdaten' }); ta.value = ['Kategorie;' + c.series.map(s => s.name).join(';')].concat(c.labels.map((l, i) => l + ';' + c.series.map(s => s.values[i] != null ? s.values[i] : '').join(';'))).join('\n');
  dialog({ title: 'Diagrammdaten bearbeiten', body: el('div', null, el('p', { class: 'hint' }, 'Eine Zeile je Kategorie, Werte mit Semikolon getrennt. Erste Zeile: Reihennamen.'), ta), buttons: [{ label: 'Abbrechen' }, { label: 'Übernehmen', pri: true, fn: () => {
    const rows = ta.value.split(/\r?\n/).map(r => r.trim()).filter(Boolean).map(r => r.split(';')); if (rows.length < 2 || rows[0].length < 2) { toast('Mindestens eine Reihe und eine Kategorie angeben.', true); return false; }
    const names = rows[0].slice(1); o.chart.series = names.map((n, j) => ({ name: n || 'Reihe ' + (j + 1), values: rows.slice(1).map(r => { const v = parseFloat(String(r[j + 1] || '0').replace(',', '.')); return isFinite(v) ? v : 0; }) })); o.chart.labels = rows.slice(1).map(r => r[0] || ''); if (o.chart.kind === 'pie') o.chart.series = o.chart.series.slice(0, 1); commit('Diagrammdaten'); } }] });
}
function tableOp(op) {
  const o = selObjs()[0]; if (!o || o.type !== 'table') return; const nc = o.rows[0].length;
  if (op === 'row+') o.rows.push(new Array(nc).fill('')); else if (op === 'row-' && o.rows.length > 1) o.rows.pop(); else if (op === 'col+' && nc < 12) o.rows.forEach(r => r.push('')); else if (op === 'col-' && nc > 1) o.rows.forEach(r => r.pop()); else return; commit('Tabelle');
}
function setCrop(o, c) { const x = o.crop || { l: 0, t: 0, r: 0, b: 0 }, nat = (o.w / o.h) * ((1 - x.t - x.b) / (1 - x.l - x.r)); o.crop = c; o.h = o.w / (nat * ((1 - c.l - c.r) / (1 - c.t - c.b))); commit('Zuschneiden'); }
function cropDialog() {
  const o = selObjs()[0]; if (!o || o.type !== 'image') return; const c = Object.assign({ l: 0, t: 0, r: 0, b: 0 }, o.crop), ins = {};
  const f = (k, l) => el('label', null, l + ' (%)', ins[k] = el('input', { type: 'number', min: 0, max: 80, value: Math.round(c[k] * 100) }));
  dialog({ title: 'Bild zuschneiden', body: el('div', { class: 'fgrid' }, f('l', 'Links'), f('r', 'Rechts'), f('t', 'Oben'), f('b', 'Unten')), buttons: [{ label: 'Abbrechen' }, { label: 'Anwenden', pri: true, fn: () => { const n = {}; for (const k in ins) n[k] = clamp(+ins[k].value || 0, 0, 80) / 100; if (n.l + n.r > .9 || n.t + n.b > .9) { toast('Zuschnitt zu groß.', true); return false; } setCrop(o, n); } }] });
}
function addImageFile(file) {
  if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) { toast('Nur PNG, JPEG, GIF oder WebP werden unterstützt.', true); return; }
  const fr = new FileReader(); fr.onerror = () => toast('Bild konnte nicht gelesen werden.', true);
  fr.onload = () => {
    const img = new Image(); img.onerror = () => toast('Bilddatei ist beschädigt.', true);
    img.onload = () => {
      let data = fr.result, w = img.naturalWidth, h = img.naturalHeight;
      if (Math.max(w, h) > 1920) { const k = 1920 / Math.max(w, h), c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); data = c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', .9); }
      const id = uid('img'); S.proj.assets[id] = data; const W = S.proj.size.w, H = S.proj.size.h, k = Math.min(W * .6 / w, H * .6 / h, 1), ow = w * k, oh = h * k;
      addObject({ type: 'image', src: id, x: (W - ow) / 2, y: (H - oh) / 2, w: ow, h: oh, rot: 0, lockRatio: true, crop: { l: 0, t: 0, r: 0, b: 0 } }, file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Bild');
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}
function pickImage() { const f = $('#fileImg'); f.value = ''; f.onchange = () => { if (f.files[0]) addImageFile(f.files[0]); }; f.click(); }

/* ---------- Anordnen, Ausrichten, Gruppieren ---------- */
function arrange(mode) {
  const s = curSlide(), set = new Set(S.sel), sel = s.objects.filter(o => set.has(o.id)), rest = s.objects.filter(o => !set.has(o.id)); if (!sel.length) return;
  if (mode === 'front') s.objects = rest.concat(sel); else if (mode === 'back') s.objects = sel.concat(rest);
  else { const arr = s.objects.slice(), step = mode === 'forward' ? 1 : -1, idxs = arr.map((o, i) => set.has(o.id) ? i : -1).filter(i => i >= 0); if (step > 0) idxs.reverse();
    idxs.forEach(i => { const j = i + step; if (j >= 0 && j < arr.length && !set.has(arr[j].id)) { [arr[i], arr[j]] = [arr[j], arr[i]]; } }); s.objects = arr; }
  commit('Anordnen');
}
function alignSel(mode) {
  const os = selObjs().filter(o => !o.locked); if (!os.length) return; const W = S.proj.size.w, H = S.proj.size.h, ref = os.length === 1 ? { x: 0, y: 0, w: W, h: H } : unionBox(os);
  os.forEach(o => { const b = bboxOf(o); let dx = 0, dy = 0;
    if (mode === 'l') dx = ref.x - b.x; else if (mode === 'r') dx = ref.x + ref.w - (b.x + b.w); else if (mode === 'ch') dx = ref.x + ref.w / 2 - (b.x + b.w / 2);
    else if (mode === 't') dy = ref.y - b.y; else if (mode === 'b') dy = ref.y + ref.h - (b.y + b.h); else if (mode === 'cv') dy = ref.y + ref.h / 2 - (b.y + b.h / 2);
    o.x += dx; o.y += dy; });
  commit('Ausrichten');
}
function distribute(dir) {
  const os = selObjs().filter(o => !o.locked); if (os.length < 3) { toast('Zum Verteilen mindestens drei Objekte auswählen.', true); return; }
  const h = dir === 'h', bs = os.map(o => ({ o, b: bboxOf(o) })).sort((a, b) => h ? a.b.x - b.b.x : a.b.y - b.b.y);
  const first = bs[0].b, last = bs[bs.length - 1].b, total = h ? (last.x + last.w - first.x) : (last.y + last.h - first.y), sizes = bs.reduce((a, x) => a + (h ? x.b.w : x.b.h), 0), gap = (total - sizes) / (bs.length - 1);
  let pos = h ? first.x : first.y; bs.forEach(x => { const cur = h ? x.b.x : x.b.y; if (h) x.o.x += pos - cur; else x.o.y += pos - cur; pos += (h ? x.b.w : x.b.h) + gap; });
  commit('Verteilen');
}
function groupSel() {
  const s = curSlide(), os = selObjs(); if (os.length < 2) { toast('Für eine Gruppe mindestens zwei Objekte auswählen.', true); return; }
  const set = new Set(os.map(o => o.id)), u = unionBox(os), g = { id: uid('o'), type: 'group', name: 'Gruppe', x: u.x, y: u.y, w: u.w, h: u.h, ow: u.w, oh: u.h, rot: 0, children: [] };
  let at = 0; s.objects.forEach((o, i) => { if (set.has(o.id)) at = i; });
  os.forEach(o => { const c = deepCopy(o); c.x -= u.x; c.y -= u.y; g.children.push(c); });
  s.objects = s.objects.filter(o => !set.has(o.id)); s.objects.splice(Math.min(s.objects.length, at - os.length + 1), 0, g);
  s.effects.forEach(e => { if (set.has(e.objId)) e.objId = g.id; }); S.sel = [g.id]; commit('Gruppieren');
}
function ungroupSel() {
  const s = curSlide(), gs = selObjs().filter(o => o.type === 'group'); if (!gs.length) return; const out = []; let lost = 0;
  gs.forEach(g => {
    const sx = g.w / g.ow, sy = g.h / g.oh, th = (g.rot || 0) * Math.PI / 180, c = Math.cos(th), sn = Math.sin(th), gcx = g.x + g.w / 2, gcy = g.y + g.h / 2, idx = s.objects.indexOf(g);
    const kids = g.children.map(ch => { const n = deepCopy(ch), lx = (n.x + n.w / 2) * sx - g.w / 2, ly = (n.y + n.h / 2) * sy - g.h / 2; n.w *= sx; n.h *= sy; const cx = gcx + lx * c - ly * sn, cy = gcy + lx * sn + ly * c; n.x = cx - n.w / 2; n.y = cy - n.h / 2; n.rot = ((n.rot || 0) + (g.rot || 0)) % 360; return n; });
    s.objects.splice(idx, 1, ...kids); out.push(...kids.map(k => k.id)); const before = s.effects.length; s.effects = s.effects.filter(e => e.objId !== g.id); lost += before - s.effects.length;
  });
  S.sel = out; if (lost) toast(lost + ' Animation(en) der Gruppe wurden entfernt.'); commit('Gruppierung aufheben');
}
function toggleLockHide(kind) { const os = selObjs(); if (!os.length) return; const v = !os.every(o => o[kind]); os.forEach(o => { if (v) o[kind] = true; else delete o[kind]; }); commit(kind === 'hidden' ? 'Ausblenden' : 'Sperren'); }

/* ---------- Formatierung von Text und Objekten ---------- */
/** Platzhaltergröße (xxx-large) aus fontSize=7 durch die gewählte Größe ersetzen – nur für neu getippten bzw. markierten Text */
function fixSizeSpans(t) { t.querySelectorAll('span').forEach(sp => { const fs = sp.style.fontSize; if (fs === 'xxx-large' || fs === '-webkit-xxx-large') sp.style.fontSize = S.pendPx || '20px'; }); }
document.addEventListener('input', e => { if (S.editing && S.pendPx && e.target.closest) { const t = e.target.closest('.pp-txt'); if (t) fixSizeSpans(t); } });
function applyTextStyle(prop, val) {
  const ae = document.activeElement;
  if (S.editing && S.savedRange !== undefined) { // innerhalb der Textbearbeitung: Auswahl formatieren
    const t = S.layer.querySelector('[data-oid="' + S.editing + '"] .pp-txt'); if (!t) return;
    t.focus(); if (S.savedRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(S.savedRange); }
    document.execCommand('styleWithCSS', false, false);
    if (prop === 'bold') document.execCommand('bold'); else if (prop === 'italic') document.execCommand('italic'); else if (prop === 'underline') document.execCommand('underline'); else if (prop === 'strike') document.execCommand('strikeThrough');
    else if (prop === 'color') document.execCommand('foreColor', false, toHex(val));
    else if (prop === 'size') { S.pendPx = Math.round(val * 4 / 3 * 100) / 100 + 'px'; document.execCommand('styleWithCSS', false, true); document.execCommand('fontSize', false, '7'); fixSizeSpans(t); fixFontTags(t); }
    else if (prop === 'font') document.execCommand('fontName', false, val.replace(/"/g, ''));
    else if (prop === 'align') document.execCommand({ left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight' }[val]);
    else { applyObjStyle(prop, val); return; }
    const sel = getSelection(); if (sel.rangeCount) S.savedRange = sel.getRangeAt(0).cloneRange(); return;
  }
  applyObjStyle(prop, val);
}
function applyObjStyle(prop, val) {
  const os = selObjs().filter(o => ['text', 'shape'].includes(o.type) || o.type === 'table'); if (!os.length) return;
  os.forEach(o => { if (o.type === 'table') { if (prop === 'size') o.fs = val; return; } o.st = o.st || {}; const cur = PP.textStyle(o, S.proj.master, curSlide());
    if (['bold', 'italic', 'underline', 'strike', 'bullets'].includes(prop)) o.st[prop] = val === undefined ? !cur[prop] : val; else o.st[prop] = val; });
  commit('Textformat', { merge: true });
}
function textStateOf(prop) { const o = selObjs()[0]; if (!o || !['text', 'shape'].includes(o.type)) return null; return PP.textStyle(o, S.proj.master, curSlide())[prop]; }
function setFill(v) { const os = selObjs().filter(o => ['shape', 'text'].includes(o.type)); os.forEach(o => { o.fill = v; }); if (os.length) commit('Füllung'); }
function setStroke(v) { const os = selObjs().filter(o => ['shape', 'text', 'line', 'image'].includes(o.type)); os.forEach(o => { o.stroke = v; if (v !== 'none' && !o.sw) o.sw = 3; }); if (os.length) commit('Kontur'); }

/* ---------- Folien ---------- */
function newSlide(layout) { if (S.editing) endEdit(); const s = newSlideData(layout); S.proj.slides.splice(S.cur + 1, 0, s); S.cur++; S.sel = []; S.fx = null; commit('Neue Folie'); }
function duplicateSlide(i) {
  if (S.editing) endEdit(); const src = S.proj.slides[i];
  src.objects.forEach(o => { if (!o.mid) o.mid = 'm_' + o.id.replace(/[^\w-]/g, ''); }); // gespeicherte Morph-Zuordnung
  const n = deepCopy(src), map = {}; n.id = uid('s'); const rid = o => { const old = o.id; o.id = uid('o'); map[old] = o.id; if (o.children) o.children.forEach(rid); }; n.objects.forEach(rid);
  n.effects.forEach(e => { e.id = uid('e'); e.objId = map[e.objId]; }); S.proj.slides.splice(i + 1, 0, n); S.cur = i + 1; S.sel = []; S.fx = null; commit('Folie duplizieren');
}
function deleteSlide(i) {
  if (S.editing) endEdit(); const sl = S.proj.slides;
  if (sl.length === 1) { sl[0] = newSlideData('blank'); S.cur = 0; } else { sl.splice(i, 1); S.cur = Math.min(i, sl.length - 1); }
  S.sel = []; S.fx = null; commit('Folie löschen');
}
function moveSlide(from, to) { const [s] = S.proj.slides.splice(from, 1); S.proj.slides.splice(to, 0, s); S.cur = to; commit('Folie verschieben'); }
function toggleHideSlide() { const s = curSlide(); s.hidden = !s.hidden; commit(s.hidden ? 'Folie ausblenden' : 'Folie einblenden'); }
function applyLayout(layout) {
  const s = curSlide(), W = S.proj.size.w, H = S.proj.size.h, want = layoutPh(layout, W, H), keep = [];
  s.objects.forEach(o => { if (!o.ph) { keep.push(o); return; } const w = want.find(p => p.ph === o.ph); if (w) { Object.assign(o, { x: w.x, y: w.y, w: w.w, h: w.h }); keep.push(o); } else if (PP.plainText(o.html).trim()) { o.ph = (o.ph === 'title' ? undefined : o.ph); if (o.ph === undefined) delete o.ph; keep.push(o); } });
  const have = new Set(keep.filter(o => o.ph).map(o => o.ph)); const add = newPlaceholders(layout, W, H).filter(p => !have.has(p.ph));
  s.objects = add.concat(keep); const ids = new Set(s.objects.map(o => o.id)); s.effects = s.effects.filter(e => ids.has(e.objId)); s.layout = layout; commit('Layout');
}
function resetSlideToMaster() {
  const s = curSlide(), want = layoutPh(s.layout, S.proj.size.w, S.proj.size.h); s.bg = null;
  s.objects.forEach(o => { if (o.ph) { o.st = {}; const w = want.find(p => p.ph === o.ph); if (w) Object.assign(o, { x: w.x, y: w.y, w: w.w, h: w.h }); } });
  commit('Auf Master zurücksetzen'); toast('Lokale Überschreibungen der Folie wurden zurückgesetzt.');
}
function setSlideSize(key) {
  const n = SIZES[key], o = S.proj.size; if (n.w === o.w) return; const k = n.w / o.w;
  S.proj.slides.forEach(s => s.objects.forEach(ob => { ob.x *= k; ob.w *= k; })); S.proj.size = Object.assign({}, n); commit('Foliengröße');
}
function applyTemplate(id) { const keep = S.proj.master; S.proj.master = newMaster(id); S.proj.master.titleSize = keep.titleSize; S.proj.master.bodySize = keep.bodySize; commit('Vorlage: ' + TEMPLATES[id].name); }
function masterDialog() {
  const m = S.proj.master, f = {};
  const fld = (k, l, t) => el('label', null, l, f[k] = el('input', t === 'color' ? { type: 'color', value: toHex(m[k]) } : { value: m[k] }));
  const acc = m.accents.map((a, i) => el('label', null, 'Akzent ' + (i + 1), f['a' + i] = el('input', { type: 'color', value: toHex(a) })));
  const fonts = ['"Segoe UI",Arial,sans-serif', 'Georgia,"Times New Roman",serif', 'Arial,Helvetica,sans-serif', '"Trebuchet MS",sans-serif', '"Courier New",monospace', 'Verdana,sans-serif'];
  const fontSel = (k, l) => { const s = el('select', null, ...fonts.map(x => el('option', Object.assign({ value: x }, m[k] === x ? { selected: true } : {}), x.split(',')[0].replace(/"/g, '')))); if (!fonts.includes(m[k])) s.prepend(el('option', { value: m[k], selected: true }, m[k].split(',')[0].replace(/"/g, ''))); f[k] = s; return el('label', null, l, s); };
  dialog({ title: 'Folienmaster bearbeiten', body: el('div', null, el('p', { class: 'hint' }, 'Änderungen am Master gelten für alle Folien, die keine eigene Überschreibung (Farbe, Schrift, Hintergrund) besitzen.'), el('div', { class: 'fgrid' }, fld('bg', 'Hintergrund', 'color'), fld('titleColor', 'Titelfarbe', 'color'), fld('textColor', 'Textfarbe', 'color'), fontSel('titleFont', 'Titelschrift'), fontSel('bodyFont', 'Textschrift'),
    el('label', null, 'Titelgröße (pt)', f.titleSize = el('input', { type: 'number', value: m.titleSize })), el('label', null, 'Textgröße (pt)', f.bodySize = el('input', { type: 'number', value: m.bodySize })), ...acc)),
    buttons: [{ label: 'Abbrechen' }, { label: 'Übernehmen', pri: true, fn: () => { m.bg = f.bg.value; m.titleColor = f.titleColor.value; m.textColor = f.textColor.value; m.titleFont = f.titleFont.value; m.bodyFont = f.bodyFont.value; m.titleSize = clamp(+f.titleSize.value || 40, 10, 120); m.bodySize = clamp(+f.bodySize.value || 22, 8, 80); m.accents = m.accents.map((_, i) => f['a' + i].value); commit('Master'); } }] });
}

/* ---------- Animationen ---------- */
const curFx = () => S.fx && curSlide().effects.find(e => e.id === S.fx);
function addEffect(cat, kind) {
  const os = selObjs(); if (!os.length) { toast('Zuerst ein Objekt auswählen.', true); return; } const s = curSlide(); let at = s.effects.length; const f = curFx(); if (f) at = s.effects.indexOf(f) + 1;
  let last; os.forEach((o, i) => { const e = mkEffect(o.id, cat, kind, i ? 'with' : 'click'); s.effects.splice(at++, 0, e); last = e; }); S.fx = last.id; S.rtab = 'anim'; commit('Animation hinzufügen');
}
/** Galerie: ersetzt den markierten Effekt (eigene Aktion), sonst wird ein Effekt hinzugefügt */
function replaceEffect(cat, kind) {
  const f = curFx(); if (!f || !S.sel.includes(f.objId)) { addEffect(cat, kind); return; }
  const d = FX[cat][kind]; f.cat = cat; f.kind = kind; f.dur = d.dur ? (f.dur || d.dur) : 0; delete f.dir; delete f.amount; delete f.path; if (d.dir) f.dir = d.dir; if (d.amount) f.amount = d.amount; if (cat === 'path') f.path = { dx: 260, dy: 0 };
  commit('Effekt ersetzen');
}
function setFx(k, v) { const f = curFx(); if (!f) return; if (k === 'dx' || k === 'dy') f.path[k] = v; else f[k] = v; commit('Effekt bearbeiten'); }
function moveEffect(d) { const s = curSlide(), i = s.effects.findIndex(e => e.id === S.fx), j = i + d; if (i < 0 || j < 0 || j >= s.effects.length) return; [s.effects[i], s.effects[j]] = [s.effects[j], s.effects[i]]; commit('Effekt verschieben'); }
function dupEffect() { const s = curSlide(), i = s.effects.findIndex(e => e.id === S.fx); if (i < 0) return; const n = deepCopy(s.effects[i]); n.id = uid('e'); s.effects.splice(i + 1, 0, n); S.fx = n.id; commit('Effekt duplizieren'); }
function delEffect() { const s = curSlide(); const i = s.effects.findIndex(e => e.id === S.fx); if (i < 0) return; s.effects.splice(i, 1); S.fx = null; commit('Effekt löschen'); }
function stopPreview(silent) { if (!S.previewing) return; S.previewing.eng.stop(); S.previewing = null; if (!silent) { renderStage(true); } }
function runPreview(effects) {
  if (S.editing) endEdit(); stopPreview(true); S.previewing = { eng: null }; renderStage(true);
  const tmp = Object.assign({}, curSlide(), { effects }), eng = new AnimEngine(tmp, S.layer, S.proj); S.previewing.eng = eng; eng.playAll(() => setTimeout(() => stopPreview(), 250)); renderStage.__lastEng = eng; window.__lastPreview = eng;
}
function previewSlide() { const s = curSlide(); if (!s.effects.length) { toast('Diese Folie hat keine Animationen.'); return; } runPreview(s.effects); }
function previewEffect(id) { const e = curSlide().effects.find(x => x.id === id); if (!e) return; runPreview([Object.assign({}, e, { start: 'click' })]); }

/* ---------- Übergänge ---------- */
function setTrans(k, v) { const s = curSlide(); s.transition = s.transition || { type: 'none', dur: .7, dir: 'left' }; s.transition[k] = v;
  if (k === 'type') { const d = TRANS[v].dirs; if (d && !d.includes(s.transition.dir)) s.transition.dir = d[0]; }
  commit('Übergang'); }
function setAdv(k, v) { const s = curSlide(); s[k] = v; commit('Folienwechsel'); }
function applyTransAll() { const t = curSlide(); S.proj.slides.forEach(s => { s.transition = Object.assign({}, t.transition); s.advClick = t.advClick; s.advTime = t.advTime; }); commit('Übergang auf alle anwenden'); toast('Übergang und Wechselparameter auf alle Folien übertragen.'); }
function coupleDialog() {
  const o = selObjs()[0]; if (!o) { toast('Zuerst ein Objekt der aktuellen Folie auswählen.', true); return; } const prev = S.proj.slides[S.cur - 1]; if (!prev) { toast('Es gibt keine vorherige Folie.', true); return; }
  const list = prev.objects.filter(x => x.type === o.type), sel = el('select', { size: 6, style: 'width:100%' }, ...list.map(x => el('option', { value: x.id }, x.name || x.type)));
  if (!list.length) { toast('Die vorherige Folie hat kein Objekt vom Typ „' + o.type + '“.', true); return; } sel.value = list[0].id;
  dialog({ title: 'Mit Objekt der vorherigen Folie koppeln', body: el('div', null, el('p', { class: 'hint' }, 'Gekoppelte Objekte werden beim Übergang „Morph“ ineinander überführt (Position, Größe, Drehung).'), sel), buttons: [{ label: 'Abbrechen' }, { label: 'Koppeln', pri: true, fn: () => { const a = prev.objects.find(x => x.id === sel.value); if (!a.mid) a.mid = 'm_' + a.id.replace(/[^\w-]/g, ''); o.mid = a.mid; commit('Morph-Kopplung'); } }] });
}
function uncouple() { const os = selObjs(); os.forEach(o => { delete o.mid; if (/^!!/.test(o.name || '')) o.name = o.name.replace(/^!!/, ''); }); if (os.length) commit('Kopplung lösen'); }
function transPreview() {
  const i = S.cur, B = S.proj.slides[i], A = S.proj.slides[i - 1] || { id: 'blank0', layout: 'blank', objects: [], effects: [], bg: '#000000' };
  const W = S.proj.size.w, H = S.proj.size.h, box = el('div', { style: `position:relative;width:100%;aspect-ratio:${W}/${H};background:#000;overflow:hidden` }), stage = el('div', { style: `position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0` }); box.append(stage);
  let h = null, token = 0;
  const play = () => {
    if (h) h.cancel(); stage.replaceChildren(); const t = ++token;
    const la = renderSlide(A, S.proj, 'show'); new AnimEngine(A, la, S.proj).finish(); const lb = renderSlide(B, S.proj, 'show'), eb = new AnimEngine(B, lb, S.proj); eb.reset(); stage.append(la, lb);
    h = PP.playTransition(stage, la, lb, B.transition || { type: 'none' }, S.proj, A, B, () => { if (t === token) eb.begin(); });
  };
  const d = dialog({ title: 'Übergang: ' + TRANS[(B.transition || {}).type || 'none'].n + (i ? ' (von Folie ' + i + ' zu ' + (i + 1) + ')' : ''), wide: true, body: box, onClose: () => { token++; if (h) h.cancel(); },
    buttons: [{ label: 'Wiederholen', fn: () => { play(); return false; } }, { label: 'Schließen', pri: true }] });
  const fit = () => { stage.style.transform = 'scale(' + (box.clientWidth / W) + ')'; }; fit(); play(); window.__transPreview = { play };
}
