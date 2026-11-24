/* =====================================================================
   5. Menüband (Reiter, Gruppen, Schaltflächen mit Zuständen, kontextabhängiger Format-Reiter)
   ===================================================================== */
let ribbonControls = [];
const FONTS = [['"Segoe UI",Arial,sans-serif', 'Segoe UI'], ['"Segoe UI Semibold","Segoe UI",Arial,sans-serif', 'Segoe UI Semibold'], ['Arial,Helvetica,sans-serif', 'Arial'], ['Georgia,"Times New Roman",serif', 'Georgia'], ['"Trebuchet MS",sans-serif', 'Trebuchet MS'], ['Verdana,sans-serif', 'Verdana'], ['"Courier New",monospace', 'Courier New']];
const SIZES_PT = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 60, 72, 96];
const hasSel = () => S.sel.length > 0, oneSel = () => S.sel.length === 1, textSel = () => selObjs().some(o => ['text', 'shape'].includes(o.type));
function B(o) {
  const b = el('button', { class: 'rb-btn' + (o.sm ? ' sm' : '') + (o.label ? '' : ' ic-only'), title: o.tip || o.label || '', 'aria-label': o.tip || o.label || o.icon, html: icon(o.icon, o.sm ? 18 : 26) + (o.label ? '<span></span>' : '') });
  if (o.label) b.lastChild.textContent = o.label;
  b.addEventListener('mousedown', e => e.preventDefault());
  b.addEventListener('click', () => { if (o.menu) showMenu(b, o.menu()); else o.fn(); });
  b._upd = () => { b.disabled = o.en ? !o.en() : false; b.classList.toggle('on', !!(o.on && o.on())); }; ribbonControls.push(b); return b;
}
function F(o) {
  const w = el('label', { class: 'rb-field' }, o.label || ''); let inp;
  if (o.type === 'select') inp = el('select', { 'aria-label': o.label || o.tip, title: o.tip || '', onchange: e => o.set(e.target.value) }, ...o.opts.map(([v, t]) => el('option', { value: v }, t)));
  else if (o.type === 'checkbox') inp = el('input', { type: 'checkbox', onchange: e => o.set(e.target.checked) });
  else inp = el('input', { type: o.type || 'number', title: o.tip || '', 'aria-label': o.label || o.tip, min: o.min, max: o.max, step: o.step || 1, onchange: e => o.set(o.type === 'color' ? e.target.value : +e.target.value) });
  w.append(inp); if (o.after) w.append(o.after);
  w._upd = () => { const v = o.get ? o.get() : null, dis = o.en ? !o.en() : false; inp.disabled = dis; if (o.type === 'checkbox') inp.checked = !!v; else if (v != null && document.activeElement !== inp) inp.value = o.type === 'color' ? toHex(v) : String(v); };
  ribbonControls.push(w); return w;
}
const G_ = (name, ...items) => el('div', { class: 'grp' }, el('div', { class: 'items' }, ...items), el('div', { class: 'gn' }, name));
const col = (...c) => el('div', { class: 'rb-col' }, ...c);
const FS = () => selObjs()[0];
const isOn = p => { if (S.editing && document.activeElement && document.activeElement.isContentEditable) { try { return document.queryCommandState({ bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough' }[p]); } catch (e) { return false; } } return !!textStateOf(p); };

function fontGroup() {
  const fonts = FONTS.slice(); [S.proj.master.titleFont, S.proj.master.bodyFont].forEach(f => { if (!fonts.some(x => x[0] === f)) fonts.push([f, f.split(',')[0].replace(/"/g, '')]); });
  return G_('Schriftart',
    col(el('div', { class: 'rb-field' }, F({ type: 'select', tip: 'Schriftart', opts: fonts, en: textSel, get: () => textStateOf('font'), set: v => applyTextStyle('font', v) }), F({ type: 'select', tip: 'Schriftgröße (pt)', opts: SIZES_PT.map(n => [n, n]), en: textSel, get: () => { const v = textStateOf('size'); return v ? Math.round(v) : null; }, set: v => applyTextStyle('size', +v) })),
      el('div', { class: 'rb-field' }, B({ icon: 'bold', sm: 1, tip: 'Fett (Strg+B)', en: textSel, on: () => isOn('bold'), fn: () => applyTextStyle('bold') }), B({ icon: 'italic', sm: 1, tip: 'Kursiv (Strg+I)', en: textSel, on: () => isOn('italic'), fn: () => applyTextStyle('italic') }), B({ icon: 'underline', sm: 1, tip: 'Unterstrichen (Strg+U)', en: textSel, on: () => isOn('underline'), fn: () => applyTextStyle('underline') }), B({ icon: 'strike', sm: 1, tip: 'Durchgestrichen', en: textSel, on: () => isOn('strike'), fn: () => applyTextStyle('strike') }),
        F({ type: 'color', tip: 'Schriftfarbe', en: textSel, get: () => textStateOf('color'), set: v => applyTextStyle('color', v), after: el('span', { html: icon('fontcolor', 16) }) }))));
}
function paraGroup() {
  return G_('Absatz', col(el('div', { class: 'rb-field' }, ...['left', 'center', 'right'].map(a => B({ icon: 'align' + a[0], sm: 1, tip: { left: 'Linksbündig', center: 'Zentriert', right: 'Rechtsbündig' }[a], en: textSel, on: () => textStateOf('align') === a, fn: () => applyTextStyle('align', a) })), B({ icon: 'bullets', sm: 1, tip: 'Aufzählung', en: textSel, on: () => !!textStateOf('bullets'), fn: () => applyObjStyle('bullets') })),
    el('div', { class: 'rb-field' }, F({ type: 'select', tip: 'Vertikale Ausrichtung (Anker)', opts: [['top', 'Oben'], ['middle', 'Mitte'], ['bottom', 'Unten']], en: textSel, get: () => textStateOf('valign'), set: v => applyObjStyle('valign', v) }))));
}
function arrangeGroup() {
  return G_('Anordnen', B({ icon: 'front', label: 'Nach vorne', en: hasSel, fn: () => arrange('front'), tip: 'Ganz nach vorne' }), B({ icon: 'back', label: 'Nach hinten', en: hasSel, fn: () => arrange('back'), tip: 'Ganz nach hinten' }),
    col(B({ icon: 'forward', sm: 1, label: 'Eine Ebene vor', en: hasSel, fn: () => arrange('forward') }), B({ icon: 'backward', sm: 1, label: 'Eine Ebene zurück', en: hasSel, fn: () => arrange('backward') })),
    col(B({ icon: 'group', sm: 1, label: 'Gruppieren', tip: 'Gruppieren (Strg+G)', en: () => S.sel.length > 1, fn: groupSel }), B({ icon: 'ungroup', sm: 1, label: 'Gruppierung aufheben', tip: 'Entgruppieren (Strg+Umschalt+G)', en: () => selObjs().some(o => o.type === 'group'), fn: ungroupSel })),
    B({ icon: 'align', label: 'Ausrichten', en: hasSel, menu: () => [{ label: 'Links', fn: () => alignSel('l') }, { label: 'Horizontal zentrieren', fn: () => alignSel('ch') }, { label: 'Rechts', fn: () => alignSel('r') }, '-', { label: 'Oben', fn: () => alignSel('t') }, { label: 'Vertikal zentrieren', fn: () => alignSel('cv') }, { label: 'Unten', fn: () => alignSel('b') }, '-', { label: 'Horizontal verteilen', fn: () => distribute('h'), disabled: S.sel.length < 3 }, { label: 'Vertikal verteilen', fn: () => distribute('v'), disabled: S.sel.length < 3 }] }));
}
function shapeMenu() { return SHAPE_GROUPS.flatMap(([g, ks], i) => [...(i ? ['-'] : []), { label: g, disabled: true }, ...ks.map(k => ({ label: SHAPES[k], icon: 'shape', fn: () => insertShape(k) }))]); }
function layoutMenu(fn) { return Object.entries(LAYOUTS).map(([k, v]) => ({ label: v, icon: 'layout', fn: () => fn(k) })); }
const startNew = () => newSlide('content');

const RIBBON = {
  file() {
    return [G_('Projekt', B({ icon: 'new', label: 'Neu', fn: newProjectDialog, tip: 'Neue Präsentation' }), B({ icon: 'open', label: 'Öffnen', fn: openProjectPicker, tip: 'Projektdatei öffnen' }), B({ icon: 'save', label: 'Speichern', fn: saveProject, tip: 'Projekt herunterladen (Strg+S)' }), B({ icon: 'design', label: 'Beispiel laden', fn: () => confirmLoad(sampleProject(), 'Beispielpräsentation') })),
      G_('Exportieren', B({ icon: 'pptx', label: 'PowerPoint (.pptx)', fn: exportPptx }), B({ icon: 'html', label: 'HTML-Präsentation', fn: exportHtml, tip: 'Eigenständige, offline abspielbare Datei' }), B({ icon: 'png', label: 'PNG (aktuelle Folie)', fn: exportPng }), B({ icon: 'print', label: 'Drucken / PDF', fn: printDeck, tip: 'Eine Folie pro Seite' })),
      G_('Hilfe', B({ icon: 'help', label: 'Funktionsumfang', fn: helpDialog }), B({ icon: 'notes', label: 'Tastenkürzel', fn: shortcutsDialog }))];
  },
  start() {
    return [G_('Zwischenablage', B({ icon: 'copy', label: 'Kopieren', en: hasSel, fn: () => copySel(false), tip: 'Kopieren (Strg+C)' }), col(B({ icon: 'dup', sm: 1, label: 'Duplizieren', en: hasSel, fn: duplicateSelected, tip: 'Duplizieren (Strg+D)' }), B({ icon: 'trash', sm: 1, label: 'Löschen', en: hasSel, fn: deleteSelected, tip: 'Löschen (Entf)' }))),
      G_('Folien', B({ icon: 'slideadd', label: 'Neue Folie', menu: () => layoutMenu(newSlide), tip: 'Neue Folie mit Layout' }), B({ icon: 'layout', label: 'Layout', menu: () => layoutMenu(applyLayout) }), col(B({ icon: 'dup', sm: 1, label: 'Folie duplizieren', fn: () => duplicateSlide(S.cur) }), B({ icon: 'trash', sm: 1, label: 'Folie löschen', fn: () => deleteSlide(S.cur) })), col(B({ icon: 'eyeoff', sm: 1, label: 'Folie ausblenden', on: () => !!curSlide().hidden, fn: toggleHideSlide }), B({ icon: 'reset', sm: 1, label: 'Zurücksetzen', tip: 'Lokale Überschreibungen auf Master zurücksetzen', fn: resetSlideToMaster }))),
      fontGroup(), paraGroup(),
      G_('Zeichnen', B({ icon: 'shape', label: 'Formen', menu: shapeMenu }), col(F({ type: 'color', label: 'Füllung', tip: 'Füllfarbe', en: () => selObjs().some(o => ['shape', 'text'].includes(o.type)), get: () => FS() && FS().fill && FS().fill !== 'none' ? FS().fill : '#cccccc', set: setFill, after: el('span', { html: icon('fill', 16) }) }), F({ type: 'color', label: 'Kontur', tip: 'Konturfarbe', en: () => selObjs().some(o => ['shape', 'text', 'line', 'image'].includes(o.type)), get: () => FS() && FS().stroke && FS().stroke !== 'none' ? FS().stroke : '#333333', set: setStroke, after: el('span', { html: icon('outline', 16) }) }))),
      arrangeGroup()];
  },
  insert() {
    return [G_('Folien', B({ icon: 'slideadd', label: 'Neue Folie', menu: () => layoutMenu(newSlide) })),
      G_('Bilder', B({ icon: 'image', label: 'Bild', fn: pickImage, tip: 'Lokales Bild einfügen' })),
      G_('Text', B({ icon: 'text', label: 'Textfeld', fn: insertText })),
      G_('Illustrationen', B({ icon: 'shape', label: 'Formen', menu: shapeMenu }), B({ icon: 'line', label: 'Linie', fn: () => insertLine(false) }), B({ icon: 'arrow', label: 'Pfeil', fn: () => insertLine(true) })),
      G_('Tabellen', B({ icon: 'table', label: 'Tabelle', fn: insertTable })),
      G_('Diagramme', B({ icon: 'chartbar', label: 'Säulen', fn: () => insertChart('bar') }), B({ icon: 'chartline', label: 'Linien', fn: () => insertChart('line') }), B({ icon: 'chartpie', label: 'Kreis', fn: () => insertChart('pie') }))];
  },
  design() {
    return [G_('Vorlagen', ...Object.entries(TEMPLATES).map(([id, t]) => B({ icon: 'design', label: t.name, tip: t.desc, on: () => S.proj.master.tpl === id, fn: () => applyTemplate(id) }))),
      G_('Folienformat', B({ icon: 'size', label: '16:9', on: () => S.proj.size.w === 1280, fn: () => setSlideSize('16:9') }), B({ icon: 'size', label: '4:3', on: () => S.proj.size.w === 960, fn: () => setSlideSize('4:3') })),
      G_('Master', B({ icon: 'master', label: 'Folienmaster', fn: masterDialog, tip: 'Hintergrund, Schriften und Akzentfarben für alle Folien' }), B({ icon: 'reset', label: 'Folie zurücksetzen', fn: resetSlideToMaster })),
      G_('Hintergrund', col(F({ type: 'color', label: 'Folienhintergrund', get: () => curSlide().bg || '@bg', set: v => { curSlide().bg = v; commit('Hintergrund'); } }), B({ icon: 'reset', sm: 1, label: 'Hintergrund zurücksetzen', en: () => !!curSlide().bg, fn: () => { curSlide().bg = null; commit('Hintergrund'); } })))];
  },
  trans() {
    const cur = () => curSlide().transition || { type: 'none' };
    return [G_('Vorschau', B({ icon: 'play', label: 'Vorschau', fn: transPreview, tip: 'Zeigt den Übergang von der vorherigen zur ausgewählten Folie' })),
      G_('Übergang zu dieser Folie', el('div', { class: 'gal' }, ...Object.entries(TRANS).map(([k, t]) => B({ icon: k === 'morph' ? 'morph' : 'trans', label: t.n, on: () => cur().type === k, fn: () => setTrans('type', k) })))),
      G_('Effektoptionen', col(F({ type: 'select', label: 'Richtung', opts: [['left', 'Von links'], ['right', 'Von rechts'], ['top', 'Von oben'], ['bottom', 'Von unten'], ['horizontal', 'Horizontal'], ['vertical', 'Vertikal']], en: () => !!TRANS[cur().type].dirs, get: () => cur().dir, set: v => { if (TRANS[cur().type].dirs && TRANS[cur().type].dirs.includes(v)) setTrans('dir', v); else toast('Diese Richtung gilt nicht für den gewählten Übergang.', true); } }), F({ label: 'Dauer (s)', type: 'number', min: .1, max: 10, step: .1, en: () => cur().type !== 'none', get: () => cur().dur, set: v => setTrans('dur', clamp(v || .7, .1, 10)) }))),
      G_('Folienwechsel', col(B({ icon: 'trans', sm: 1, label: 'Auf alle anwenden', fn: applyTransAll }), F({ label: 'Weiter bei Klick', type: 'checkbox', get: () => curSlide().advClick !== false, set: v => setAdv('advClick', v) }), el('div', { class: 'rb-field' }, F({ label: 'Weiter nach', type: 'checkbox', get: () => curSlide().advTime != null, set: v => setAdv('advTime', v ? 5 : null) }), F({ type: 'number', min: 0, max: 3600, step: .5, tip: 'Sekunden', en: () => curSlide().advTime != null, get: () => curSlide().advTime, set: v => setAdv('advTime', clamp(v, 0, 3600)), after: 's' })))),
      G_('Morph-Kopplung', col(B({ icon: 'link', sm: 1, label: 'Mit Objekt der vorherigen Folie koppeln', en: oneSel, fn: coupleDialog }), B({ icon: 'unlink', sm: 1, label: 'Kopplung lösen', en: () => selObjs().some(o => o.mid || /^!!/.test(o.name || '')), fn: uncouple })))];
  },
  anim() {
    const gal = cat => [el('div', { class: 'catlab' }, CAT_NAMES[cat]), ...Object.entries(FX[cat]).map(([k, d]) => B({ icon: cat === 'path' ? 'arrow' : 'anim', label: d.n, en: hasSel, on: () => { const f = curFx(); return !!f && f.cat === cat && f.kind === k; }, tip: (curFx() && S.sel.includes(curFx().objId) ? 'Ersetzt den markierten Effekt: ' : 'Fügt den Effekt hinzu: ') + d.n, fn: () => replaceEffect(cat, k) }))];
    const fxOn = () => !!curFx(), dirOk = () => fxOn() && !!FX[curFx().cat][curFx().kind].dir !== false && curFx().dir !== undefined, isPath = () => fxOn() && curFx().cat === 'path';
    return [G_('Vorschau', B({ icon: 'play', label: 'Folie abspielen', en: () => curSlide().effects.length > 0, fn: previewSlide }), B({ icon: 'playcur', label: 'Effekt abspielen', en: fxOn, fn: () => previewEffect(S.fx) })),
      G_('Animation', el('div', { class: 'gal' }, ...gal('entrance'), ...gal('emphasis')), el('div', { class: 'gal' }, ...gal('exit'), ...gal('path'))),
      G_('Erweitert', B({ icon: 'plus', label: 'Animation hinzufügen', en: hasSel, tip: 'Fügt dem Objekt einen weiteren Effekt hinzu', menu: () => Object.keys(FX).flatMap(cat => ['-', ...Object.entries(FX[cat]).map(([k, d]) => ({ label: CAT_NAMES[cat] + ': ' + d.n, icon: 'anim', fn: () => addEffect(cat, k) }))]).slice(1) }), B({ icon: 'paneright', label: 'Animationsbereich', on: () => S.rtab === 'anim' && S.rightOn, fn: () => { if (S.rtab === 'anim' && S.rightOn) S.rightOn = false; else { S.rtab = 'anim'; S.rightOn = true; } render(); } })),
      G_('Effektoptionen', col(F({ label: 'Richtung', type: 'select', opts: Object.entries(DIR_NAMES), en: dirOk, get: () => fxOn() ? curFx().dir || 'left' : null, set: v => setFx('dir', v) }), F({ label: 'Umfang', type: 'number', step: .1, tip: 'Drehen: Grad; Größe ändern: Faktor', en: () => fxOn() && curFx().amount !== undefined, get: () => fxOn() ? curFx().amount : null, set: v => setFx('amount', v) })),
        col(F({ label: 'Endpunkt X', type: 'number', en: isPath, get: () => isPath() ? curFx().path.dx : null, set: v => setFx('dx', v) }), F({ label: 'Endpunkt Y', type: 'number', en: isPath, get: () => isPath() ? curFx().path.dy : null, set: v => setFx('dy', v) }))),
      G_('Anzeigedauer', col(F({ label: 'Start', type: 'select', opts: Object.entries(START_NAMES), en: fxOn, get: () => fxOn() ? curFx().start : null, set: v => setFx('start', v) }), F({ label: 'Dauer (s)', type: 'number', min: 0, max: 60, step: .1, en: () => fxOn() && !['appear', 'disappear'].includes(curFx().kind), get: () => fxOn() ? curFx().dur : null, set: v => setFx('dur', clamp(v, 0, 60)) })), col(F({ label: 'Verzögerung (s)', type: 'number', min: 0, max: 60, step: .1, en: fxOn, get: () => fxOn() ? curFx().delay : null, set: v => setFx('delay', clamp(v, 0, 60)) }), el('div', { class: 'rb-field' }, B({ icon: 'up', sm: 1, tip: 'Effekt früher abspielen', en: fxOn, fn: () => moveEffect(-1) }), B({ icon: 'down', sm: 1, tip: 'Effekt später abspielen', en: fxOn, fn: () => moveEffect(1) }), B({ icon: 'dup', sm: 1, tip: 'Effekt duplizieren', en: fxOn, fn: dupEffect }), B({ icon: 'trash', sm: 1, tip: 'Effekt löschen', en: fxOn, fn: delEffect }))))];
  },
  show() {
    return [G_('Bildschirmpräsentation starten', B({ icon: 'play', label: 'Von Anfang an', tip: 'F5', fn: () => startShow(0) }), B({ icon: 'playcur', label: 'Ab aktueller Folie', tip: 'Umschalt+F5', fn: () => startShow(S.cur) }), B({ icon: 'presenter', label: 'Referentenansicht', tip: 'Startet mit Referentenansicht (im Vortrag: Taste P)', fn: () => startShow(S.cur, true) })),
      G_('Einrichten', B({ icon: 'eyeoff', label: 'Folie ausblenden', on: () => !!curSlide().hidden, fn: toggleHideSlide, tip: 'Ausgeblendete Folien werden übersprungen' })),
      G_('Ausgabe', B({ icon: 'print', label: 'Druckansicht', fn: printDeck }), B({ icon: 'html', label: 'Als HTML exportieren', fn: exportHtml }))];
  },
  view() {
    return [G_('Präsentationsansichten', B({ icon: 'slideadd', label: 'Normal', on: () => S.view === 'normal', fn: () => setView('normal') }), B({ icon: 'grid', label: 'Folienübersicht', on: () => S.view === 'sorter', fn: () => setView('sorter') })),
      G_('Anzeigen', B({ icon: 'notes', label: 'Notizen', on: () => S.notesOn, fn: () => { S.notesOn = !S.notesOn; render(); } }), B({ icon: 'thumbs', label: 'Folienleiste', on: () => S.thumbsOn, fn: () => { S.thumbsOn = !S.thumbsOn; render(); } }), B({ icon: 'selection', label: 'Auswahlbereich', on: () => S.rightOn && S.rtab === 'select', fn: () => { S.rtab = 'select'; S.rightOn = true; render(); } }), B({ icon: 'anim', label: 'Animationsbereich', on: () => S.rightOn && S.rtab === 'anim', fn: () => { S.rtab = 'anim'; S.rightOn = true; render(); } }), B({ icon: 'paneright', label: 'Formatbereich', on: () => S.rightOn && S.rtab === 'format', fn: () => { S.rtab = 'format'; S.rightOn = true; render(); } })),
      G_('Zoom', col(F({ label: 'Zoom', type: 'select', opts: [['fit', 'Anpassen'], ...[.25, .5, .75, 1, 1.5, 2].map(v => [v, Math.round(v * 100) + ' %'])], get: () => S.zoom, set: v => { S.zoom = v === 'fit' ? 'fit' : +v; renderStage(true); renderStatus(); } }), F({ label: 'Hilfslinien beim Ziehen (Einrasten)', type: 'checkbox', get: () => S.snap, set: v => { S.snap = v; } })))];
  },
  fmt() {
    const o = () => FS(), pos = (k, l) => F({ label: l, type: 'number', get: () => oneSel() ? fmt(o()[k]) : null, en: oneSel, set: v => { o()[k] = k === 'w' || k === 'h' ? Math.max(4, v) : v; commit('Position/Größe'); } });
    const img = () => oneSel() && o().type === 'image';
    return [G_('Größe und Position', col(pos('x', 'X'), pos('y', 'Y')), col(pos('w', 'Breite'), pos('h', 'Höhe')), col(F({ label: 'Drehung °', type: 'number', get: () => oneSel() ? o().rot || 0 : null, en: oneSel, set: v => { o().rot = ((v % 360) + 360) % 360; commit('Drehen'); } }), F({ label: 'Seitenverhältnis beibehalten', type: 'checkbox', en: oneSel, get: () => oneSel() ? !!o().lockRatio : false, set: v => { o().lockRatio = v; commit('Seitenverhältnis'); } }))),
      G_('Formenarten', col(F({ type: 'color', label: 'Füllung', en: () => selObjs().some(x => ['shape', 'text'].includes(x.type)), get: () => FS() && FS().fill && FS().fill !== 'none' ? FS().fill : '#cccccc', set: setFill }), F({ type: 'color', label: 'Kontur', en: () => selObjs().some(x => ['shape', 'text', 'line', 'image'].includes(x.type)), get: () => FS() && FS().stroke && FS().stroke !== 'none' ? FS().stroke : '#333333', set: setStroke })), col(B({ icon: 'eyeoff', sm: 1, label: 'Ausblenden', on: () => selObjs().every(x => x.hidden), fn: () => toggleLockHide('hidden') }), B({ icon: 'lock', sm: 1, label: 'Sperren', on: () => selObjs().every(x => x.locked), fn: () => toggleLockHide('locked') }))),
      G_('Bild', B({ icon: 'crop', label: 'Zuschneiden', en: img, fn: cropDialog }), B({ icon: 'reset', label: 'Zuschnitt zurücksetzen', en: img, fn: () => setCrop(o(), { l: 0, t: 0, r: 0, b: 0 }) })),
      G_('Tabelle / Diagramm', col(B({ icon: 'plus', sm: 1, label: 'Zeile', en: () => oneSel() && o().type === 'table', fn: () => tableOp('row+') }), B({ icon: 'plus', sm: 1, label: 'Spalte', en: () => oneSel() && o().type === 'table', fn: () => tableOp('col+') })), col(B({ icon: 'minus', sm: 1, label: 'Zeile', en: () => oneSel() && o().type === 'table', fn: () => tableOp('row-') }), B({ icon: 'minus', sm: 1, label: 'Spalte', en: () => oneSel() && o().type === 'table', fn: () => tableOp('col-') })), B({ icon: 'chartedit', label: 'Diagrammdaten', en: () => oneSel() && o().type === 'chart', fn: () => editChartData(o()) })),
      arrangeGroup()];
  }
};
const TAB_DEF = [['file', 'Datei'], ['start', 'Start'], ['insert', 'Einfügen'], ['design', 'Entwurf'], ['trans', 'Übergänge'], ['anim', 'Animationen'], ['show', 'Bildschirmpräsentation'], ['view', 'Ansicht']];
function buildTabs() {
  const tabs = $('#tabs'); tabs.replaceChildren();
  const defs = TAB_DEF.concat(hasSel() ? [['fmt', ({ image: 'Bildformat', table: 'Tabellenformat', chart: 'Diagrammformat', line: 'Linienformat' })[(FS() || {}).type] || 'Formformat']] : []);
  if (S.tab === 'fmt' && !hasSel()) S.tab = 'start';
  defs.forEach(([id, label]) => tabs.append(el('button', { class: 'tab' + (S.tab === id ? ' on' : '') + (id === 'fmt' ? ' ctx' : ''), role: 'tab', 'aria-selected': S.tab === id, onclick: () => { S.tab = id; buildRibbon(); buildTabs(); } }, label)));
}
function buildRibbon() {
  ribbonControls = []; const r = $('#ribbon'); r.replaceChildren(...RIBBON[S.tab]()); refreshRibbon();
}
function refreshRibbon() {
  buildTabs(); if (S.tab === 'fmt' && !hasSel()) S.tab = 'start';
  const key = S.tab + '|' + (S.tab === 'fmt' ? ((FS() || {}).type || '') : '') + '|' + S.proj.master.tpl + '|' + (S.tab === 'anim' ? (curFx() ? curFx().cat + curFx().kind : '') : '');
  if (key !== S._rkey || S.tab === 'fmt' && !$('#ribbon').children.length) { S._rkey = key; ribbonControls = []; $('#ribbon').replaceChildren(...RIBBON[S.tab]()); }
  ribbonControls.forEach(c => c._upd());
  $('#qSave').disabled = false;
}
document.addEventListener('selectionchange', () => {
  if (!S.editing || !S.layer) return; const s = getSelection(); if (!s.rangeCount) return; const r = s.getRangeAt(0), t = S.layer.querySelector('[data-oid="' + S.editing + '"] .pp-txt');
  if (t && t.contains(r.commonAncestorContainer)) { S.savedRange = r.cloneRange(); ribbonControls.forEach(c => c._upd && c._upd()); }
});
