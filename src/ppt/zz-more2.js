/* =====================================================================
   PowerPoint, zweite Erweiterung: Entwurfsvarianten, SmartArt-Diagramme, Gliederung, Kommentare, Alternativtext,
   Zeitsteuerung, Notizen-Export, Foliengrößen, Graustufen-Ansicht u. a. – füllt die Menübänder aller Reiter.
   ===================================================================== */
Object.assign(IC, {
  palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.200"/><circle cx="12" cy="7.500" r="1.200"/><circle cx="16" cy="10" r="1.200"/><path d="M12 21c-2 0-2-2 0-3s2-2 0-3"/>', fontv: '<path d="M4 19l5-14 5 14M6 14h6M16 19v-8h4v8M16 15h4"/>', bgs: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-4 4 3 4-4 5 4"/>',
  smart: '<rect x="3" y="3" width="7" height="6" rx="1"/><rect x="14" y="3" width="7" height="6" rx="1"/><rect x="8.500" y="15" width="7" height="6" rx="1"/><path d="M6.500 9v3h11V9M12 12v3"/>', outline: '<path d="M4 5h16M8 10h12M8 14h12M4 19h16"/>', tblq: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16"/>',
  textv: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/><path d="M3 12h3M18 12h3" opacity=".5"/>', timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 3h6"/>', cmt: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>', alt: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 15l3-6 3 6M8 13h4M15 9h3M15 12h3"/>',
  gray: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 000 18z" fill="currentColor"/>', rnd: '<path d="M4 8h10l-3-3M20 16H10l3 3M4 16l2-2 2 2M16 8l2 2 2-2"/>', gotos: '<path d="M5 4l14 8-14 8zM21 4v16"/>', unhide: '<path d="M3 12s3.500-6 9-6 9 6 9 6-3.500 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.500"/>', notesx: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>', zoomhun: '<path d="M5 8l2-1v10M11 8h3v9h-3zM17 8h3v9h-3z"/>', loopi: '<path d="M4 12a6 6 0 016-6h8M18 6l-3-3M18 6l-3 3M20 12a6 6 0 01-6 6H6M6 18l3 3M6 18l3-3"/>'
});
const H_ = t => '<div>' + PP.escHtml(t) + '</div>';
function addMany(objs, label) { const s = curSlide(); objs.forEach(o => { o.id = uid('o'); s.objects.push(o); }); S.sel = objs.map(o => o.id); S.fx = null; commit(label); }
function linesDialog(title, hint, initial, ok, okLabel) {
  const ta = el('textarea', { rows: 9, style: 'width:100%;font:inherit;box-sizing:border-box' }); ta.value = initial;
  dialog({ title, wide: true, body: el('div', null, el('p', { class: 'hint' }, hint), ta), buttons: [{ label: 'Abbrechen' }, { label: okLabel || 'OK', pri: true, fn: () => ok(ta.value) }] }); ta.focus();
}

/* ---- SmartArt-Diagramme (aus Formen erzeugt) ---- */
function smartArt(kind) {
  const defs = { process: 'Idee\nPlan\nUmsetzung\nErgebnis', list: 'Erster Punkt\nZweiter Punkt\nDritter Punkt\nVierter Punkt', matrix: 'Stärken\nSchwächen\nChancen\nRisiken', timeline: '2023\n2024\n2025\n2026', cycle: 'Planen\nUmsetzen\nPrüfen\nAnpassen', pyramid: 'Vision\nStrategie\nZiele\nMaßnahmen', compare: 'Vorteile\nNachteile' };
  linesDialog('Diagramm aus Text: ' + ({ process: 'Prozess', list: 'Liste', matrix: 'Matrix', timeline: 'Zeitleiste', cycle: 'Zyklus', pyramid: 'Pyramide', compare: 'Vergleich' })[kind], 'Eine Zeile pro Element (2–8 Zeilen).', defs[kind], txt => {
    const items = txt.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 8); if (items.length < 1) { toast('Bitte mindestens eine Zeile eingeben.', true); return false; }
    const W = S.proj.size.w, H = S.proj.size.h, n = items.length, ac = i => '@a' + (i % 6 + 1), objs = [], sz = n > 5 ? 16 : 20;
    const box = (k, x, y, w, h, i, t, extra) => mkShapeObj(k, x, y, w, h, ac(i), Object.assign({ html: H_(t), name: t, st: { color: '#ffffff', align: 'center', valign: 'middle', size: sz, bold: true } }, extra || {}));
    if (kind === 'process') { const w = (W - 160) / n + 28, st = (W - 160 - w) / Math.max(1, n - 1); items.forEach((t, i) => objs.push(box('chevron', 80 + i * (n > 1 ? st : 0), H / 2 - 70, w, 140, i, t))); }
    else if (kind === 'list') { const h = Math.min(90, (H - 260) / n - 12); items.forEach((t, i) => { objs.push(mkShapeObj('rect', 120, 180 + i * (h + 12), 14, h, ac(i), { name: 'Balken' })); objs.push(box('round', 134, 180 + i * (h + 12), W - 254, h, i, t, { fill: '#eef1f6', st: { color: '@tx', align: 'left', valign: 'middle', size: sz + 2, bold: true } })); }); }
    else if (kind === 'matrix') { const w = (W - 280) / 2, h = (H - 280) / 2; items.slice(0, 4).forEach((t, i) => objs.push(box('round', 120 + (i % 2) * (w + 20), 170 + Math.floor(i / 2) * (h + 20), w, h, i, t, { st: { color: '#ffffff', align: 'center', valign: 'middle', size: 28, bold: true } }))); }
    else if (kind === 'timeline') { objs.push(mkShapeObj('rect', 100, H / 2 - 3, W - 200, 6, '@a6', { name: 'Zeitachse' })); items.forEach((t, i) => { const x = 140 + i * ((W - 280) / Math.max(1, n - 1 || 1)), up = i % 2 === 0; objs.push(mkShapeObj('ellipse', x - 16, H / 2 - 16, 32, 32, ac(i), { name: 'Punkt' })); objs.push(mkText(x - 90, up ? H / 2 - 110 : H / 2 + 36, 180, 70, H_(t), { size: 22, align: 'center', bold: true, color: '@tx', valign: up ? 'bottom' : 'top' }, { name: t })); }); }
    else if (kind === 'cycle') { const r = Math.min(W, H) * .3, cx = W / 2, cy = H / 2 + 20, bw = 190, bh = 80; objs.push(mkShapeObj('donut', cx - r * .55, cy - r * .55, r * 1.1, r * 1.1, '@a6', { name: 'Ring', opacity: .35 })); items.forEach((t, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; objs.push(box('round', cx + Math.cos(a) * r * 1.25 - bw / 2, cy + Math.sin(a) * r - bh / 2, bw, bh, i, t)); }); }
    else if (kind === 'pyramid') { const bh = Math.min(90, (H - 260) / n), maxW = W * .6; items.forEach((t, i) => { const w = maxW * (i + 1) / n; objs.push(box(i === 0 ? 'triangle' : 'trapezoid', W / 2 - w / 2, 170 + i * bh, w, bh - 4, i, t, i === 0 ? { st: { color: '#ffffff', align: 'center', valign: 'bottom', size: sz, bold: true } } : {})); }); }
    else if (kind === 'compare') { items.slice(0, 2).forEach((t, i) => { const w = (W - 280) / 2, x = 120 + i * (w + 40); objs.push(box('round', x, 160, w, 80, i, t, { st: { color: '#ffffff', align: 'center', valign: 'middle', size: 28, bold: true } })); objs.push(mkText(x, 260, w, 260, H_('Punkt 1') + H_('Punkt 2') + H_('Punkt 3'), { size: 22, bullets: true, color: '@tx' }, { name: 'Text ' + (i + 1) })); }); }
    addMany(objs, 'Diagramm einfügen');
  }, 'Einfügen');
}
const textPresets = () => [['Große Zahl', '42', { size: 96, bold: true, color: '@a1', align: 'center' }, 300, 130], ['Zitat', '„Hier steht ein Zitat.“', { size: 32, italic: true, color: '@tx', align: 'center' }, 700, 120], ['Beschriftung', 'Beschriftung', { size: 16, color: '@tx', align: 'left' }, 300, 40], ['Hervorhebung', 'Wichtig!', { size: 36, bold: true, color: '#ffffff', align: 'center', valign: 'middle' }, 300, 80, '@a1'], ['Fußnote', 'Quelle: …', { size: 13, color: '@tx', align: 'left' }, 400, 30]].map(([n, t, st, w, h, fill]) => ({ label: n, fn: () => { const W = S.proj.size.w, H = S.proj.size.h, o = mkText((W - w) / 2, (H - h) / 2, w, h, H_(t), st, { name: n }); if (fill) { o.fill = fill; o.type = 'text'; } addObject(o); } }));
const tableMenu = () => [[2, 2], [3, 3], [4, 3], [5, 4], [6, 5]].map(([r, c]) => ({ label: r + ' × ' + c + ' Tabelle', fn: () => { insertTable(); const o = curSlide().objects[curSlide().objects.length - 1]; if (o && o.type === 'table') { const rows = []; for (let i = 0; i < r; i++) { const row = []; for (let j = 0; j < c; j++) row.push(i === 0 ? 'Spalte ' + (j + 1) : ''); rows.push(row); } o.rows = rows; o.h = Math.max(60, r * 52); commit('Tabelle'); } } }));

/* ---- Gliederung ---- */
const phTitle = s => s.objects.find(o => o.ph === 'title'), phBody = s => s.objects.find(o => o.ph === 'body' || o.ph === 'subtitle');
function outlineText() { return S.proj.slides.map(s => { const t = phTitle(s), b = phBody(s), tt = t ? PP.plainText(t.html).trim() : ''; const body = b ? b.html.replace(/<\/(div|p|li)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').split('\n').map(x => x.trim()).filter(Boolean) : []; return [tt || '(ohne Titel)'].concat(body.map(x => '    - ' + x)).join('\n'); }).join('\n'); }
function outlineDialog() {
  linesDialog('Gliederung bearbeiten', 'Zeile ohne Einzug = Folientitel, eingerückte Zeilen („- Punkt“) = Text der Folie. Zusätzliche Titel erzeugen neue Folien; Folien werden hier nicht gelöscht.', outlineText(), txt => {
    const blocks = []; txt.split('\n').forEach(l => { if (!l.trim()) return; if (/^\s+/.test(l) || /^\s*[-•*]\s/.test(l)) { if (blocks.length) blocks[blocks.length - 1].b.push(l.replace(/^\s*[-•*]?\s*/, '')); } else blocks.push({ t: l.trim(), b: [] }); });
    if (S.editing) endEdit(); blocks.forEach((bl, i) => { let s = S.proj.slides[i]; if (!s) { s = newSlideData('content'); S.proj.slides.push(s); } const t = phTitle(s), b = phBody(s); if (t && PP.plainText(t.html).trim() !== bl.t && bl.t !== '(ohne Titel)') t.html = H_(bl.t); if (b) { const cur = outlineLines(b.html).join('|'); if (cur !== bl.b.join('|')) b.html = bl.b.map(H_).join(''); } });
    commit('Gliederung übernommen'); toast('Gliederung übernommen: ' + S.proj.slides.length + ' Folien.');
  }, 'Übernehmen');
}
const outlineLines = html => html.replace(/<\/(div|p|li)>/gi, '\n').replace(/<[^>]+>/g, '').split('\n').map(x => x.trim()).filter(Boolean);

/* ---- Kommentare, Alternativtext, Notizen ---- */
function commentsDialog() {
  const s = curSlide(); s.comments = s.comments || []; const list = el('div'), ta = el('textarea', { rows: 3, style: 'width:100%;font:inherit;box-sizing:border-box', placeholder: 'Neuer Kommentar …' });
  const draw = () => { list.replaceChildren(...(s.comments.length ? s.comments.map((c, i) => el('div', { style: 'border-bottom:1px solid #ddd;padding:6px 0;display:flex;gap:8px' }, el('div', { style: 'flex:1' }, el('div', { style: 'font-size:11px;color:#777' }, new Date(c.d).toLocaleString('de-DE')), c.t), el('button', { class: 'btn', onclick: () => { s.comments.splice(i, 1); commit('Kommentar gelöscht'); draw(); } }, 'Löschen'))) : [el('p', { class: 'hint' }, 'Noch keine Kommentare zu dieser Folie.')])); };
  draw(); dialog({ title: 'Kommentare – Folie ' + (S.cur + 1), body: el('div', null, list, ta), buttons: [{ label: 'Schließen' }, { label: 'Kommentar hinzufügen', pri: true, fn: () => { if (!ta.value.trim()) return false; s.comments.push({ t: ta.value.trim(), d: Date.now() }); commit('Kommentar'); ta.value = ''; draw(); return false; } }] });
}
function altDialog() {
  const os = selObjs(); if (!os.length) { toast('Bitte zuerst ein Objekt markieren.'); return; } const inp = el('textarea', { rows: 3, style: 'width:100%;font:inherit;box-sizing:border-box' }); inp.value = os[0].alt || '';
  dialog({ title: 'Alternativtext für „' + (os[0].name || os[0].type) + '“', body: el('div', null, el('p', { class: 'hint' }, 'Beschreibt das Objekt für Bildschirmleseprogramme. Wird auch in den PPTX-Export übernommen.'), inp), buttons: [{ label: 'Abbrechen' }, { label: 'OK', pri: true, fn: () => { os.forEach(o => { if (inp.value.trim()) o.alt = inp.value.trim(); else delete o.alt; }); commit('Alternativtext'); } }] }); inp.focus();
}
function exportNotes() { const t = S.proj.slides.map((s, i) => { const ti = phTitle(s); return 'Folie ' + (i + 1) + (ti ? ': ' + PP.plainText(ti.html).trim() : '') + '\n' + (s.notes || '(keine Notizen)') + '\n'; }).join('\n'); download(new Blob([t], { type: 'text/plain;charset=utf-8' }), safeName() + '-notizen.txt'); }

/* ---- Entwurfsvarianten ---- */
const COLORSETS = [['Office', ['#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47']], ['Ozean', ['#0077b6', '#00b4d8', '#48cae4', '#023e8a', '#90e0ef', '#03045e']], ['Sonnenuntergang', ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#577590']], ['Wald', ['#2d6a4f', '#40916c', '#74c69d', '#95d5b2', '#1b4332', '#b7e4c7']], ['Violett', ['#7209b7', '#b5179e', '#f72585', '#560bad', '#3a0ca3', '#4361ee']], ['Graustufen', ['#212529', '#495057', '#6c757d', '#adb5bd', '#ced4da', '#343a40']], ['Aurora', ['#e8553d', '#ff9f1c', '#2ec4b6', '#3a86ff', '#8338ec', '#6c757d']]];
const FONTSETS = [['Standard', '"Segoe UI Semibold","Segoe UI",Arial,sans-serif', '"Segoe UI",Arial,sans-serif'], ['Klassisch', 'Georgia,"Times New Roman",serif', 'Georgia,"Times New Roman",serif'], ['Modern', '"Trebuchet MS",sans-serif', '"Segoe UI",Arial,sans-serif'], ['Technik', '"Courier New",monospace', 'Verdana,sans-serif'], ['Elegant', 'Georgia,"Times New Roman",serif', 'Arial,Helvetica,sans-serif']];
const BGSTYLES = [['Weiß', '#ffffff', '#1b2a41', '#3a4660'], ['Hellgrau', '#f1f3f6', '#1b2a41', '#3a4660'], ['Creme', '#fbf6ea', '#3b2a14', '#5a4630'], ['Hellblau', '#e8f1fb', '#0b2a4a', '#2c4a6b'], ['Dunkelgrau', '#14161a', '#ffffff', '#d6dae3'], ['Nachtblau', '#0b1d3a', '#ffffff', '#cfd9ee'], ['Schwarz', '#000000', '#ffffff', '#dddddd']];
const setSizeFull = (w, h) => { const o = S.proj.size; if (o.w === w && o.h === h) return; const kx = w / o.w, ky = h / o.h; S.proj.slides.forEach(s => s.objects.forEach(ob => { ob.x *= kx; ob.w *= kx; ob.y *= ky; ob.h *= ky; })); S.proj.size = { w, h }; commit('Foliengröße'); };
const SIZEOPTS = [['Breitbild 16:9', 1280, 720], ['Breitbild 16:10', 1280, 800], ['Standard 4:3', 960, 720], ['A4 quer', 1123, 794], ['Quadrat 1:1', 900, 900], ['Hochformat 9:16', 720, 1280]];

/* ---- Zeitsteuerung ---- */
function autoAdvance() { ask2('Automatisch weiterschalten', [{ label: 'Alle Folien nach … Sekunden (leer = aus)', type: 'number', value: '' }], [['Anwenden', ([v]) => { const n = parseFloat(v); S.proj.slides.forEach(s => { s.advTime = isFinite(n) && n > 0 ? n : null; }); commit('Zeitsteuerung'); toast(isFinite(n) && n > 0 ? 'Alle Folien wechseln nach ' + n + ' s.' : 'Zeitsteuerung entfernt.'); }, true]]); }
function showDuration() { const v = S.proj.slides.filter(s => !s.hidden); const t = v.reduce((a, s) => a + (s.advTime || 0), 0), untimed = v.filter(s => s.advTime == null).length; toast(t ? 'Geplante Dauer: ' + Math.floor(t / 60) + ' min ' + Math.round(t % 60) + ' s' + (untimed ? ' (+ ' + untimed + ' Folie(n) ohne Zeit)' : '') : 'Keine Zeitsteuerung gesetzt (' + v.length + ' sichtbare Folien).'); }
function startFrom() { ask2('Präsentation ab Folie', [{ label: 'Foliennummer', type: 'number', value: S.cur + 1 }], [['Starten', ([v]) => { const n = clamp(Math.round(+v) || 1, 1, S.proj.slides.length); startShow(n - 1); }, true]]); }
function transAll(fn, label) { S.proj.slides.forEach((s, i) => { s.transition = Object.assign({ type: 'none', dur: .7, dir: 'left' }, s.transition); fn(s, i); }); commit(label); }

/* ---- Menüband ---- */
(() => {
  const wrap = (name, add) => { const base = RIBBON[name]; RIBBON[name] = () => add(base()); };
  const grp = (g, n) => g.find(x => (x.querySelector('.gn') || {}).textContent === n);
  wrap('design', g => { g.splice(1, 0, G_('Farbvarianten', B({ icon: 'palette', label: 'Farben', tip: 'Akzentfarben der Präsentation', menu: () => COLORSETS.map(([n, c]) => ({ label: n, fn: () => { S.proj.master.accents = c.slice(); commit('Farbvariante: ' + n); } })) })), G_('Schriftvarianten', B({ icon: 'fontv', label: 'Schriften', menu: () => FONTSETS.map(([n, t, b]) => ({ label: n, fn: () => { S.proj.master.titleFont = t; S.proj.master.bodyFont = b; commit('Schriftvariante: ' + n); } })) })), G_('Hintergrundstile', B({ icon: 'bgs', label: 'Stile', menu: () => BGSTYLES.map(([n, bg, tc, tx]) => ({ label: n, fn: () => { const m = S.proj.master; m.bg = bg; m.titleColor = tc; m.textColor = tx; commit('Hintergrundstil: ' + n); } })) })));
    const sz = grp(g, 'Folienformat'); if (sz) sz.querySelector('.items').append(B({ icon: 'size', label: 'Weitere …', menu: () => SIZEOPTS.map(([n, w, h]) => ({ label: n, fn: () => setSizeFull(w, h) })) }));
    g.push(G_('Schrift', col(F({ label: 'Titelgröße', type: 'number', min: 12, max: 120, get: () => S.proj.master.titleSize, set: v => { S.proj.master.titleSize = clamp(v, 12, 120); commit('Titelgröße', { merge: true }); } }), F({ label: 'Textgröße', type: 'number', min: 10, max: 80, get: () => S.proj.master.bodySize, set: v => { S.proj.master.bodySize = clamp(v, 10, 80); commit('Textgröße', { merge: true }); } })))); return g; });
  wrap('insert', g => { g.splice(1, 0, G_('Diagramm aus Text', B({ icon: 'smart', label: 'SmartArt', tip: 'Prozess, Liste, Matrix, Zeitleiste, Zyklus, Pyramide, Vergleich', menu: () => [['process', 'Prozess'], ['list', 'Liste'], ['matrix', 'Matrix'], ['timeline', 'Zeitleiste'], ['cycle', 'Zyklus'], ['pyramid', 'Pyramide'], ['compare', 'Vergleich']].map(([k, l]) => ({ label: l, fn: () => smartArt(k) })) }), B({ icon: 'outline', label: 'Gliederung', tip: 'Folien als Text bearbeiten', fn: outlineDialog })));
    const tb = grp(g, 'Tabellen'); if (tb) tb.querySelector('.items').append(B({ icon: 'tblq', label: 'Schnelltabelle', menu: tableMenu }));
    const tx = grp(g, 'Text'); if (tx) tx.querySelector('.items').append(B({ icon: 'textv', label: 'Textvorlagen', menu: textPresets }));
    g.push(G_('Kommentar', B({ icon: 'cmt', label: 'Kommentar', fn: commentsDialog }))); return g; });
  wrap('trans', g => { g.push(G_('Für alle Folien', B({ icon: 'timer', label: 'Dauer', tip: 'Übergangsdauer für alle Folien', fn: () => ask2('Übergangsdauer', [{ label: 'Sekunden (0,1 – 10)', type: 'number', value: (curSlide().transition || {}).dur || .7 }], [['Auf alle anwenden', ([v]) => { const d = clamp(parseFloat(v) || .7, .1, 10); transAll(s => { s.transition.dur = d; }, 'Dauer für alle'); }, true]]) }), B({ icon: 'rnd', label: 'Zufällig', tip: 'Jeder Folie einen zufälligen Übergang geben', fn: () => { const ks = Object.keys(TRANS).filter(k => k !== 'none' && k !== 'morph'); transAll(s => { s.transition.type = ks[Math.floor(Math.random() * ks.length)]; }, 'Zufällige Übergänge'); } }), B({ icon: 'reset', label: 'Alle entfernen', fn: () => transAll(s => { s.transition.type = 'none'; }, 'Übergänge entfernt') }))); return g; });
  wrap('show', g => { g.splice(1, 0, G_('Starten ab …', B({ icon: 'gotos', label: 'Ab Folie Nr. …', fn: startFrom }), B({ icon: 'unhide', label: 'Alle einblenden', en: () => S.proj.slides.some(s => s.hidden), fn: () => { S.proj.slides.forEach(s => { s.hidden = false; }); commit('Folien einblenden'); } })));
    g.push(G_('Zeitsteuerung', B({ icon: 'timer', label: 'Automatisch weiter', tip: 'Alle Folien nach n Sekunden weiterschalten', fn: autoAdvance }), B({ icon: 'clock', label: 'Dauer berechnen', fn: showDuration }), B({ icon: 'reset', label: 'Zeiten löschen', fn: () => { S.proj.slides.forEach(s => { s.advTime = null; }); commit('Zeitsteuerung entfernt'); } })), G_('Notizen', B({ icon: 'notesx', label: 'Notizen exportieren', tip: 'Alle Notizen als Textdatei', fn: exportNotes }), B({ icon: 'notes', label: 'Notizen anzeigen', on: () => S.notesOn, fn: () => { S.notesOn = !S.notesOn; render(); } }))); return g; });
  wrap('review', g => { g.push(G_('Kommentare', B({ icon: 'cmt', label: 'Kommentare', tip: 'Kommentare zur aktuellen Folie', fn: commentsDialog })), G_('Barrierefreiheit', B({ icon: 'alt', label: 'Alternativtext', en: hasSel, fn: altDialog })), G_('Gliederung', B({ icon: 'outline', label: 'Gliederung bearbeiten', fn: outlineDialog }), B({ icon: 'notesx', label: 'Notizen exportieren', fn: exportNotes }))); return g; });
  wrap('view', g => { g.push(G_('Farbe', B({ icon: 'gray', label: 'Graustufen', on: () => S.gray, fn: () => { S.gray = !S.gray; renderStage(true); refreshRibbon(); } }), B({ icon: 'master', label: 'Folienmaster', fn: masterDialog })), G_('Fenster', B({ icon: 'fullscreen', label: 'Vollbild', fn: () => { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); } }), B({ icon: 'zoomhun', label: '100 %', fn: () => { S.zoom = 1; renderStage(true); renderStatus(); } }), B({ icon: 'fit', label: 'An Fenster anpassen', fn: () => { S.zoom = 'fit'; renderStage(true); renderStatus(); } }))); return g; });
  if (!IC.fit) IC.fit = '<path d="M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3"/>';
  const st = document.createElement('style'); st.textContent = '#scaler.gray{filter:grayscale(1)}'; document.head.append(st);
  const _rs2 = renderStage; renderStage = function (f) { _rs2(f); const sc = $('#scaler'); if (sc) sc.classList.toggle('gray', !!S.gray); };
})();

/* PowerPoint: Office-Farbpaletten für Schrift-, Füll- und Konturfarbe (Start) */
(() => {
  const base = RIBBON.start;
  RIBBON.start = () => {
    const g = base();
    g.forEach(grp => grp.querySelectorAll('input[type=color]').forEach(inp => {
      const lab = inp.closest('label'), t = (inp.title || '') + ' ' + (lab ? lab.textContent : ''); let sp = null;
      if (/Schriftfarbe/.test(t)) sp = colorSplit({ id: 'pfont', icon: 'fontcolor', tip: 'Schriftfarbe', none: 'Automatisch', en: textSel, reg: ribbonControls, apply: c => applyTextStyle('color', c || '@tx') });
      else if (/Füllung|Füllfarbe/.test(t)) sp = colorSplit({ id: 'pfill', icon: 'fill', tip: 'Fülleffekt – Füllfarbe', none: 'Keine Füllung', en: () => selObjs().some(o => ['shape', 'text'].includes(o.type)), reg: ribbonControls, apply: c => setFill(c || 'none') });
      else if (/Kontur/.test(t)) sp = colorSplit({ id: 'pline', icon: 'outline', tip: 'Formkontur – Konturfarbe', none: 'Keine Kontur', en: () => selObjs().some(o => ['shape', 'text', 'line', 'image'].includes(o.type)), reg: ribbonControls, apply: c => setStroke(c || 'none') });
      if (sp) { const host = lab || inp; host.replaceWith(sp); sp._upd(); }
    }));
    return g;
  };
})();

/* PowerPoint: Einfügen-Schaltfläche (Objekte der internen Zwischenablage, Bild oder Text aus dem System) */
async function pasteButton() {
  if (S.editing) { toast('Im Textfeld bitte Strg+V verwenden.'); return; }
  if (S.clip) { pasteObjs(); return; }
  try {
    if (navigator.clipboard.read) { for (const it of await navigator.clipboard.read()) { const ty = it.types.find(x => /^image\//.test(x)); if (ty) { addImageFile(new File([await it.getType(ty)], 'Bild.' + ty.split('/')[1], { type: ty })); return; } } }
    const t = await navigator.clipboard.readText(); if (!t.trim()) { toast('Die Zwischenablage ist leer.'); return; }
    const W = S.proj.size.w, H = S.proj.size.h; addObject(mkText(W * .2, H * .4, W * .6, 100, t.split('\n').map(H_).join(''), { size: 24 }, { name: 'Textfeld' }));
  } catch (e) { toast('Der Browser erlaubt den Zugriff auf die Zwischenablage nicht – bitte Strg+V verwenden.', true); }
}
(() => { const base = RIBBON.start; RIBBON.start = () => { const g = base(), cb = g.find(x => (x.querySelector('.gn') || {}).textContent === 'Zwischenablage'); if (cb) cb.querySelector('.items').prepend(B({ icon: 'paste', label: 'Einfügen', tip: 'Einfügen (Strg+V)', fn: pasteButton })); return g; }; })();
if (!IC.paste) IC.paste = '<rect x="6" y="5" width="12" height="16" rx="1"/><path d="M9 5V3h6v2M9 11h6M9 15h6"/>';

(() => { const base = RIBBON.file; RIBBON.file = () => { const g = base(); g.push(G_('Einstellungen', B({ icon: 'gear', label: 'Einstellungen', tip: 'Design, Dunkelmodus, Touch und mehr', fn: openSettings }))); return g; }; IC.gear = '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>'; })();
